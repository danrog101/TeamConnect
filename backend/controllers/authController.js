const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

// Function for sending verification email
const sendVerificationEmail = async (email, code) => {
  console.log('🔍 DEBUG - sendVerificationEmail called');
  console.log('🔍 DEBUG - Email parameter:', email);
  console.log('🔍 DEBUG - Verification code:', code);
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🏀 TeamConnect - Verification Code',
      html: `
        <h1>Welcome to TeamConnect!</h1>
        <p>Your verification code is:</p>
        <h2 style="color: #667eea; font-size: 32px;">${code}</h2>
        <p>Code is valid for 15 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to: ${email}`);
  } catch (error) {
    console.log(`❌ Email sending FAILED for ${email}`);
    console.log(`📧 Verification code for ${email}: ${code}`);
    console.error('Email error details:', error.message);
  }
};

// ----------------- CONTROLLER FUNCTIONS -----------------

// Registration
exports.register = async (req, res) => {
  try {
    console.log('📥 Register request:', req.body);

    const { username, email, password, sport, location } = req.body;

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
      return res.status(400).json({ message: 'Email already exists!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        sport: sport || 'Football',
        location: location || 'Zagreb',
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

    // Send email (or log code to terminal if email doesn't work)
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
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
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
      return res.status(404).json({ message: 'User does not exist' });
    }

    const userData = users[0];

    if (userData.is_verified) {
      console.log('⚠️ User already verified:', userData.email);
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (userData.verification_code !== code.toString()) {
      console.log('❌ Wrong code. Expected:', userData.verification_code, 'Got:', code);
      return res.status(400).json({ message: 'Incorrect verification code!' });
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
      return res.status(404).json({ message: 'User does not exist' });
    }

    const userData = users[0];

    if (userData.is_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await supabase
      .from('users')
      .update({ verification_code: verificationCode })
      .eq('id', userData.id);

    // Send email
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
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userData = users[0];

    if (!userData.is_verified) {
      console.log('⚠️ User not verified:', email);
      return res.status(401).json({ 
        message: 'Email is not verified. Please check your inbox for verification code.',
        userId: userData.id
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      console.log('❌ Wrong password for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
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
      return res.status(401).json({ message: 'Refresh token is required' });
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
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const userData = users[0];

    if (userData.refresh_token !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (new Date() > new Date(userData.refresh_token_expiry)) {
      return res.status(401).json({ message: 'Refresh token has expired' });
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

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error || !users || users.length === 0) {
      return res.status(404).json({ message: 'User does not exist' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { email, timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Password reset instructions would be sent to your email.',
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', decoded.email);

    if (error) {
      return res.status(500).json({ message: 'Failed to reset password' });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userData);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Failed to update profile' });
    }

    res.json(userData);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)
      .select('id, email')
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Failed to change password' });
    }

    res.json({ message: 'Password changed successfully', user: updatedUser });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
