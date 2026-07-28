const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY
  }
});
// Generate access and refresh tokens
const generateTokens = (userId, isAdmin = false) => {
  const accessToken = jwt.sign(
    { id: userId, is_admin: isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId, is_admin: isAdmin },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TeamConnects <noreply@teamconnects.team>',
        to: email,
        subject: '⚽ TeamConnects - Verifikacijski kod',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 60%, #0ea5e9 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚽ TeamConnects</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Dobrodošli u vašu sportsku zajednicu!</p>
            </div>
            <p style="color: #333; font-size: 16px;">Vaš verifikacijski kod je:</p>
            <h2 style="color: #1a73e8; font-size: 40px; background: #f0f7ff; padding: 24px; text-align: center; border-radius: 12px; letter-spacing: 12px; font-weight: 800;">${code}</h2>
            <p style="color: #666; font-size: 14px;">Kod vrijedi <strong>15 minuta</strong>.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Ako niste zatražili ovaj kod, ignorirajte ovaj email.</p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Resend error:', data);
      return false;
    }
    console.log('✅ Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false; 
  }
};


// Send password reset email

const sendPasswordResetEmail = async (email, code) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TeamConnects <noreply@teamconnects.team>',
        to: email,
        subject: '🔐 TeamConnects - Resetiranje lozinke',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 60%, #0ea5e9 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚽ TeamConnects</h1>
            </div>
            <p style="color: #333;">Vaš kod za resetiranje lozinke:</p>
            <h2 style="color: #ef4444; font-size: 40px; background: #fef2f2; padding: 24px; text-align: center; border-radius: 12px; letter-spacing: 12px; font-weight: 800;">${code}</h2>
            <p style="color: #666; font-size: 14px;">Kod vrijedi <strong>1 sat</strong>.</p>
          </div>
        `
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Resend reset error:', data);
      return false;
    }
    console.log('✅ Reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Reset email failed:', error);
    return false;
  }
}

// ----------------- CONTROLLER FUNCTIONS -----------------

// Registration
exports.register = async (req, res) => {
  try {
    const { username, email, password, sport, location, gender } = req.body;

    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email);

    if (checkError) {
      console.error('❌ Error checking existing users:', checkError);
      return res.status(500).json({ message: 'Database error: ' + checkError.message });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email već postoji!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        gender: gender || null,
        sport: sport || null,
        location: location || null,
        verification_code: verificationCode,
        is_verified: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      return res.status(500).json({ message: 'Failed to create user: ' + insertError.message });
    }

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ 
      message: 'Registracija uspješna! Provjeri email.',
      userId: newUser.id
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
 
};

// Verify email code
exports.verifyCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Korisnički ID je obavezan' });
    }

    if (!code) {
      return res.status(400).json({ message: 'Verifikacijski kod je obavezan' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);

    if (error) {
      console.error('❌ Error fetching user:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    const userData = users[0];

    if (userData.is_verified) {
      return res.status(400).json({ message: 'Email je već verificiran' });
    }

    if (userData.verification_code !== code.toString()) {
      return res.status(400).json({ message: 'Neispravan verifikacijski kod!' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_verified: true,
        verification_code: null
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return res.status(500).json({ message: 'Failed to verify user' });
    }

    const { accessToken, refreshToken } = generateTokens(userData.id);

    await supabase
      .from('users')
      .update({ 
        refresh_token: refreshToken,
        refresh_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      .eq('id', userId);

    res.json({
      message: 'Email successfully verified!',
      accessToken,
      refreshToken,
      user: {
 id: userData.id,
    email: userData.email,
    username: userData.username,
    avatar: userData.avatar,
    sport: userData.sport,
    location: userData.location,
    is_admin: isAdmin
}
    });
  } catch (error) {
    console.error('❌ Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend verification code
exports.resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    const userData = users[0];

    if (userData.is_verified) {
      return res.status(400).json({ message: 'Email je već verificiran' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await supabase
      .from('users')
      .update({ verification_code: verificationCode })
      .eq('id', userData.id);

    await sendVerificationEmail(userData.email, verificationCode);

    res.json({ message: 'Novi kod je poslan!' });
  } catch (error) {
    console.error('❌ Resend code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Dohvati korisnika iz users tablice
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Neispravna email adresa ili lozinka' });
    }

    // Provjeri lozinku
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Neispravna email adresa ili lozinka' });
    }

    // Provjeri je li email verificiran
    if (!user.is_verified) {
      return res.status(401).json({ message: 'Molimo verificiraj email prije prijave!' });
    }

    // Generiraj tokene
const isAdmin = user.email === process.env.ADMIN_EMAIL;
const { accessToken, refreshToken } = generateTokens(user.id, isAdmin);

    // Spremi refresh token u bazu
    await supabase
      .from('users')
      .update({ 
        refresh_token: refreshToken,
        refresh_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        last_active: new Date()
      })
      .eq('id', user.id);

    res.json({
      message: 'Login successful!',
      accessToken,
      refreshToken,
     user: {
  id: user.id,
  email: user.email,
  username: user.username,
  avatar: user.avatar,
  sport: user.sport,
  location: user.location,
  is_admin: isAdmin
}
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token je obavezan' });
    }

    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ message: 'Neispravan refresh token' });
    }

    const userData = users[0];

    if (userData.refresh_token !== refreshToken) {
      return res.status(401).json({ message: 'Neispravan refresh token' });
    }

    if (new Date() > new Date(userData.refresh_token_expiry)) {
      return res.status(401).json({ message: 'Refresh token je istekao' });
    }

    const tokens = generateTokens(userData.id);

    await supabase
      .from('users')
      .update({ 
        refresh_token: tokens.refreshToken,
        refresh_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      .eq('id', userData.id);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await supabase
      .from('users')
      .update({ 
        refresh_token: null,
        refresh_token_expiry: null
      })
      .eq('id', userId);

    res.json({ message: 'Odjava uspješna' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email je obavezan' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('email', email.toLowerCase().trim());

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ message: 'Greška baze podataka' });
    }

    // Always return success to prevent email enumeration
    if (!users || users.length === 0) {
      return res.json({
        message: 'Ako email postoji u sustavu, poslat ćemo vam kod za resetiranje.',
        success: true
      });
    }

    const userData = users[0];
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: updateError } = await supabase
      .from('users')
      .update({ verification_code: resetCode })
      .eq('id', userData.id);

    if (updateError) {
      console.error('❌ Failed to store reset code:', updateError);
      return res.status(500).json({ message: 'Greška pri spremanju koda' });
    }

    await sendPasswordResetEmail(email, resetCode);

    res.json({
      message: 'Ako email postoji u sustavu, poslat ćemo vam kod za resetiranje.',
      success: true,
      email: email
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Verify reset code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email i kod su obavezni' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, verification_code')
      .eq('email', email.toLowerCase().trim());

    if (error || !users || users.length === 0) {
      return res.status(400).json({ message: 'Neispravan email ili kod' });
    }

    const userData = users[0];

    if (userData.verification_code !== code.toString()) {
      return res.status(400).json({ message: 'Neispravan kod za resetiranje' });
    }

    const resetToken = jwt.sign(
      { email: userData.email, id: userData.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      message: 'Kod je ispravan',
      success: true,
      resetToken
    });
  } catch (error) {
    console.error('❌ Verify reset code error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token i nova lozinka su obavezni' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Lozinka mora imati najmanje 6 znakova' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(400).json({ message: 'Token je istekao ili je neispravan' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ message: 'Neispravan token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        verification_code: null
      })
      .eq('email', decoded.email);

    if (error) {
      console.error('❌ Password update error:', error);
      return res.status(500).json({ message: 'Greška pri ažuriranju lozinke' });
    }

    res.json({
      message: 'Lozinka je uspješno promijenjena! Možete se prijaviti.',
      success: true
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, username, sport, location, is_verified, created_at, avatar')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    res.json(userData);
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport, location } = req.body;

    const { data: userData, error } = await supabase
      .from('users')
      .update({ sport, location })
      .eq('id', userId)
      .select()
      .single();

    if (error || !userData) {
      return res.status(404).json({ message: 'Ažuriranje profila nije uspjelo' });
    }

    res.json(userData);
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const { data: userData, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    const isValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Trenutna lozinka nije ispravna' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)
      .select('id, email')
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Promjena lozinke nije uspjela' });
    }

    res.json({ message: 'Lozinka je uspješno promijenjena', user: updatedUser });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Delete account (GDPR)
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('❌ Delete account error:', error);
      return res.status(500).json({ message: 'Greška pri brisanju računa' });
    }

    res.json({ message: 'Račun je uspješno obrisan' });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};
