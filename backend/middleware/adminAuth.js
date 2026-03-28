const { supabase } = require('../config/supabase');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const adminAuth = async (req, res, next) => {
  try {
    // User should already be authenticated via auth middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Niste prijavljeni' });
    }

    // Get user email
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Korisnik nije pronađen' });
    }

    // Check if admin
    if (user.email !== ADMIN_EMAIL) {
      console.log('Admin access denied for:', user.email);
      return res.status(403).json({ message: 'Pristup odbijen. Samo administrator može pristupiti ovoj stranici.' });
    }

    console.log('Admin access granted for:', user.email);
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Greška autorizacije' });
  }
};

module.exports = adminAuth;
