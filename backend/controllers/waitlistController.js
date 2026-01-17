const { supabase } = require('../config/supabase');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Join waitlist
exports.joinWaitlist = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if team exists
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, sport, city, location, date, time, max_players, current_players')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if already on waitlist
    const { data: existingWaitlist } = await supabase
      .from('team_waitlist')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (existingWaitlist) {
      return res.status(400).json({ message: 'Already on waitlist!' });
    }

    // Check if already a member
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (membership) {
      return res.status(400).json({ message: 'Already a team member!' });
    }

    // Add to waitlist
    const { error: insertError } = await supabase
      .from('team_waitlist')
      .insert({
        team_id: teamId,
        user_id: userId,
        email: userEmail,
        added_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Join waitlist error:', insertError);
      return res.status(500).json({ message: 'Failed to join waitlist' });
    }

    res.json({ 
      message: 'Added to waitlist! We will notify you by email when a spot opens.' 
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave waitlist
exports.leaveWaitlist = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Check if team exists
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .single();

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove from waitlist
    const { error } = await supabase
      .from('team_waitlist')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      console.error('Leave waitlist error:', error);
      return res.status(500).json({ message: 'Failed to leave waitlist' });
    }

    res.json({ message: 'Removed from waitlist' });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Notify waitlist when spot opens (called internally)
exports.notifyWaitlist = async (teamId) => {
  try {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, sport, city, location, date, time, max_players, current_players')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      console.error('Team not found for waitlist notification');
      return;
    }

    // Check if team has available spots
    if (team.current_players >= team.max_players) {
      return; // Team is still full
    }

    // Get waitlist users
    const { data: waitlist, error: waitlistError } = await supabase
      .from('team_waitlist')
      .select('user_id, email, users (username)')
      .eq('team_id', teamId)
      .order('added_at', { ascending: true });

    if (waitlistError || !waitlist || waitlist.length === 0) {
      return;
    }

    // Send email notifications to all waitlist users
    const emailPromises = waitlist.map(item => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: item.email,
        subject: `🎉 Spot available in team: ${team.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
            <h1 style="color: white; text-align: center;">🎉 Good news!</h1>
            
            <div style="background: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #667eea;">A spot has opened up!</h2>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                A spot is now available in the team you were interested in:
              </p>
              
              <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Team:</strong> ${team.name}</p>
                <p style="margin: 10px 0;"><strong>Sport:</strong> ${team.sport}</p>
                <p style="margin: 10px 0;"><strong>Location:</strong> ${team.city}, ${team.location}</p>
                <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(team.date).toLocaleDateString('en-US')}</p>
                <p style="margin: 10px 0;"><strong>Time:</strong> ${team.time}</p>
                <p style="margin: 10px 0;"><strong>Available spots:</strong> ${team.max_players - team.current_players}/${team.max_players}</p>
              </div>
              
              <p style="font-size: 16px; color: #333;">
                Hurry! Join quickly because spots fill up fast.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/teams/${teamId}" 
                   style="background: linear-gradient(135deg, #667eea, #764ba2); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold;
                          display: inline-block;">
                  Join Team
                </a>
              </div>
            </div>
            
            <p style="color: white; text-align: center; font-size: 14px;">
              TeamConnect - Connect with players 🏆
            </p>
          </div>
        `
      };

      return transporter.sendMail(mailOptions).catch(err => {
        console.error('Email send error:', err);
      });
    });

    await Promise.all(emailPromises);
    
    console.log(`Waitlist notifications sent for team: ${team.name}`);
  } catch (error) {
    console.error('Notify waitlist error:', error);
  }
};

module.exports = exports;