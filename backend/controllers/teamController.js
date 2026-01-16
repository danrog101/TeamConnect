const pool = require('../config/database');

// Get all teams
exports.getAllTeams = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teams ORDER BY created_at DESC'
    );

    res.json(result.rows || []);
  } catch (error) {
    console.error('❌ Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Get team by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get my teams
exports.getMyTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get teams where user is creator
    const createdTeams = await pool.query(
      'SELECT * FROM teams WHERE creator_id = $1',
      [userId]
    );

    // Get teams where user is member
    const memberTeams = await pool.query(
      `SELECT t.* FROM teams t
       INNER JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1`,
      [userId]
    );

    // Combine and remove duplicates
    const allTeams = [...createdTeams.rows, ...memberTeams.rows];
    const uniqueTeams = allTeams.filter((team, index, self) =>
      index === self.findIndex((t) => t.id === team.id)
    );

    res.json(uniqueTeams);
  } catch (error) {
    console.error('❌ Get my teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, sport, location, city, country, date, time, max_players, description } = req.body;

    console.log('📝 Creating team for user:', userId);

    // Insert team
    const result = await pool.query(
      `INSERT INTO teams (name, sport, location, city, country, date, time, max_players, description, creator_id, current_players)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
       RETURNING *`,
      [
        name, 
        sport, 
        location, 
        city || 'Zagreb', 
        country || 'Hrvatska', 
        date, 
        time, 
        max_players || 10, 
        description || '', 
        userId
      ]
    );

    const team = result.rows[0];

    // Add creator as team member
    await pool.query(
      'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
      [team.id, userId]
    );

    console.log('✅ Team created:', team.id);
    res.status(201).json(team);
  } catch (error) {
    console.error('❌ Create team error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join team
exports.joinTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if team exists
    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = teamResult.rows[0];

    // Check if user is already in team
    const memberCheck = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Already in team' });
    }

    // Check if team is full
    if (team.current_players >= team.max_players) {
      return res.status(400).json({ message: 'Team is full' });
    }

    // Add user to team
    await pool.query(
      'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
      [id, userId]
    );

    // Update current_players count
    await pool.query(
      'UPDATE teams SET current_players = current_players + 1 WHERE id = $1',
      [id]
    );

    // Get updated team
    const updatedTeam = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    res.json(updatedTeam.rows[0]);
  } catch (error) {
    console.error('❌ Join team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave team
exports.leaveTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if team exists
    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove user from team
    await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    // Update current_players count
    await pool.query(
      'UPDATE teams SET current_players = GREATEST(0, current_players - 1) WHERE id = $1',
      [id]
    );

    // Get updated team
    const updatedTeam = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    res.json(updatedTeam.rows[0]);
  } catch (error) {
    console.error('❌ Leave team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, sport, location, city, country, date, time, max_players, description } = req.body;

    // Check if user is the creator
    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (teamResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update team
    const result = await pool.query(
      `UPDATE teams 
       SET name = COALESCE($1, name),
           sport = COALESCE($2, sport),
           location = COALESCE($3, location),
           city = COALESCE($4, city),
           country = COALESCE($5, country),
           date = COALESCE($6, date),
           time = COALESCE($7, time),
           max_players = COALESCE($8, max_players),
           description = COALESCE($9, description)
       WHERE id = $10
       RETURNING *`,
      [name, sport, location, city, country, date, time, max_players, description, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Update team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if user is the creator
    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (teamResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete team (CASCADE will delete team_members)
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('❌ Delete team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Placeholder functions for other routes
exports.getTeamMessages = async (req, res) => {
  res.json([]);
};

exports.sendTeamMessage = async (req, res) => {
  res.json({ message: 'Message sent' });
};

exports.getTeamStats = async (req, res) => {
  res.json({ stats: 'Team stats' });
};