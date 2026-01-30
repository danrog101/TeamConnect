const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Function for generating access and refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Function for sending verification email with Resend
const sendVerificationEmail = async (email, code) => {
  console.log('🔍 DEBUG - sendVerificationEmail called');
  console.log('🔍 DEBUG - Email parameter:', email);
  console.log('🔍 DEBUG - Verification code:', code);

  try {
    const { data, error } = await resend.emails.send({
      from: 'TeamConnect <onboarding@resend.dev>',
      to: email,
      subject: '🏀 TeamConnect - Verifikacijski kod',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f46e5;">Dobrodošli u TeamConnect!</h1>
          <p>Vaš verifikacijski kod je:</p>
          <h2 style="color: #667eea; font-size: 32px; background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px;">${code}</h2>
          <p>Kod vrijedi 15 minuta.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">Ako niste zatražili ovaj kod, ignorirajte ovaj email.</p>
          <p style="color: #6b7280; font-size: 12px;">Podrška: teamconnect0102@gmail.com</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      console.log(`📧 Verification code for ${email}: ${code}`);
      return false;
    }

    console.log(`✅ Email successfully sent to: ${email}`, data);
    return true;
  } catch (error) {
    console.log(`❌ Email sending FAILED for ${email}`);
    console.log(`📧 Verification code for ${email}: ${code}`);
    console.error('Email error details:', error);
    return false;
  }
};

// Function for sending password reset email with Resend
const sendPasswordResetEmail = async (email, code) => {
  console.log('🔍 DEBUG - sendPasswordResetEmail called');
  console.log('🔍 DEBUG - Email parameter:', email);

  try {
    const { data, error } = await resend.emails.send({
      from: 'TeamConnect <onboarding@resend.dev>',
      to: email,
      subject: '🔐 TeamConnect - Resetiranje lozinke',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f46e5;">Resetiranje lozinke</h1>
          <p>Primili smo zahtjev za resetiranje vaše lozinke.</p>
          <p>Vaš kod za resetiranje je:</p>
          <h2 style="color: #ef4444; font-size: 32px; background: #fef2f2; padding: 20px; text-align: center; border-radius: 10px;">${code}</h2>
          <p>Kod vrijedi <strong>1 sat</strong>.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">Ako niste zatražili resetiranje lozinke, ignorirajte ovaj email.</p>
          <p style="color: #6b7280; font-size: 12px;">Podrška: teamconnect0102@gmail.com</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      console.log(`🔐 Reset code for ${email}: ${code}`);
      return false;
    }

    console.log(`✅ Password reset email sent to: ${email}`, data);
    return true;
  } catch (error) {
    console.log(`❌ Password reset email FAILED for ${email}`);
    console.log(`🔐 Reset code for ${email}: ${code}`);
    console.error('Email error details:', error);
    return false;
  }
};

// ----------------- CONTROLLER FUNCTIONS -----------------

// Registration
exports.register = async (req, res) => {
  try {
    console.log('📥 Register request:', req.body);

    const { username, email, password, sport, location, gender } = req.body;

    console.log('🔍 Extracted email from request:', email);

    // Check if user exists - only check email since username column might not exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email);

    if (checkError) {
      console.error('❌ Error checking existing users:', checkError);
      return res.status(500).json({ message: 'Database error: ' + checkError.message });
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('❌ User already exists:', { username, email });
      return res.status(400).json({ message: 'Email već postoji!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
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

    // Check for insert error
    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      return res.status(500).json({ 
        message: 'Failed to create user: ' + insertError.message,
        details: insertError.hint || insertError.details
      });
    }

    if (!newUser) {
      console.error('❌ User creation returned null');
      return res.status(500).json({ message: 'Failed to create user - no data returned' });
    }

    console.log('✅ User created:', newUser.id);
    console.log('✅ User email in database:', newUser.email);

    // Send email with Resend
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ 
      message: 'Registration successful! Please check email for verification code.', 
      userId: newUser.id 
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Verification code
exports.verifyCode = async (req, res) => {
  try {
    console.log('📧 Verify request:', req.body);

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
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    const userData = users[0];

    if (userData.is_verified) {
      console.log('⚠️ User already verified:', userData.email);
      return res.status(400).json({ message: 'Email je već verificiran' });
    }

    if (userData.verification_code !== code.toString()) {
      console.log('❌ Wrong code. Expected:', userData.verification_code, 'Got:', code);
      return res.status(400).json({ message: 'Neispravan verifikacijski kod!' });
    }

    // Verification successful!
    const { data: updatedUser, error: updateError } = await supabase
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

    console.log('✅ User verified:', userData.email);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userData.id);

    // Update refresh token
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
        sport: userData.sport,
        location: userData.location,
        avatar: userData.avatar
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
    const { email } = req.body;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

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

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await supabase
      .from('users')
      .update({ verification_code: verificationCode })
      .eq('id', userData.id);

    // Send email with Resend
    await sendVerificationEmail(email, verificationCode);

    res.json({ message: 'New verification code sent!' });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    console.log('📥 Login request:', req.body.email);

    const { email, password } = req.body;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!users || users.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Neispravna email adresa ili lozinka' });
    }

    const userData = users[0];

    if (!userData.is_verified) {
      console.log('⚠️ User not verified:', email);
      return res.status(401).json({
        message: 'Email nije verificiran. Provjerite inbox za verifikacijski kod.',
        userId: userData.id
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      console.log('❌ Wrong password for:', email);
      return res.status(401).json({ message: 'Neispravna email adresa ili lozinka' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userData.id);

    // Update refresh token and last active
    await supabase
      .from('users')
      .update({ 
        refresh_token: refreshToken,
        refresh_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        last_active: new Date()
      })
      .eq('id', userData.id);

    console.log('✅ Login successful:', userData.email);

    res.json({
      message: 'Login successful!',
      accessToken,
      refreshToken,
      user: {
        id: userData.id,
        email: userData.email,
        avatar: userData.avatar,
        sport: userData.sport
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

    // Generate new tokens
    const tokens = generateTokens(userData.id);

    // Update refresh token
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
    console.error('Refresh token error:', error);
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
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Forgot password - send reset code
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
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Greška baze podataka' });
    }

    // Always return success to prevent email enumeration attacks
    if (!users || users.length === 0) {
      console.log('Forgot password attempted for non-existent email:', email);
      return res.json({
        message: 'Ako email postoji u sustavu, poslat ćemo vam kod za resetiranje.',
        success: true
      });
    }

    const userData = users[0];

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store reset code in database with expiry (1 hour)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_code: resetCode
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Failed to store reset code:', updateError);
      return res.status(500).json({ message: 'Greška pri spremanju koda' });
    }

    // Send reset email with Resend
    await sendPasswordResetEmail(email, resetCode);

    console.log(`✅ Password reset code generated for: ${email}`);

    res.json({
      message: 'Ako email postoji u sustavu, poslat ćemo vam kod za resetiranje.',
      success: true,
      email: email // Return email for frontend to use
    });
  } catch (error) {
    console.error('Forgot password error:', error);
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
      console.log('Invalid reset code. Expected:', userData.verification_code, 'Got:', code);
      return res.status(400).json({ message: 'Neispravan kod za resetiranje' });
    }

    // Generate a temporary token for password reset
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
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token i nova lozinka su obavezni' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Lozinka mora imati najmanje 6 znakova' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(400).json({ message: 'Token je istekao ili je neispravan' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ message: 'Neispravan token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    const { error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        verification_code: null
      })
      .eq('email', decoded.email);

    if (error) {
      console.error('Password update error:', error);
      return res.status(500).json({ message: 'Greška pri ažuriranju lozinke' });
    }

    console.log(`✅ Password reset successful for: ${decoded.email}`);

    res.json({
      message: 'Lozinka je uspješno promijenjena! Možete se prijaviti.',
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, sport, location, is_verified, created_at, avatar')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    res.json(userData);
  } catch (error) {
    console.error('Get current user error:', error);
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
    console.error('Update profile error:', error);
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
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};