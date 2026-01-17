const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');

/**
 * SUPABASE AUTHENTICATION MIDDLEWARE
 * Replaces the old MongoDB-based auth middleware
 * Verifies JWT tokens and fetches user from Supabase
 */

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from Supabase using the decoded user ID
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, avatar, sport, location, is_verified, created_at')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      console.error('Auth middleware - User fetch error:', error);
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(401).json({ 
        message: 'Email not verified. Please verify your email first.',
        userId: user.id
      });
    }

    // Attach user to request object
    req.user = user;
    
    // Update last active timestamp (optional - don't await to avoid slowing down requests)
    supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {})
      .catch(err => console.error('Failed to update last_active:', err));

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth;