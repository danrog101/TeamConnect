const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config/config');
require('dotenv').config();

// Import Supabase controllers
const authController = require('./controllers/authController');
const teamController = require('./controllers/teamController');
const tournamentController = require('./controllers/tournamentController');

// Import routes
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5000"]
    }
  }
}));

app.use(hpp()); // Prevent HTTP Parameter Pollution

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Serviraj uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Rate limiting - primijeni na sve API rute
app.use('/api/', apiLimiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: config.env,
    database: 'Supabase Connected'
  };
  
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send(healthcheck);
  }
});

// API Info Endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'TeamConnect API',
    version: '1.0.0',
    description: 'API za organizaciju sportskih timova',
    endpoints: {
      auth: '/api/auth',
      teams: '/api/teams',
      tournaments: '/api/tournaments',
      fields: '/api/fields',
      matches: '/api/matches',
      videos: '/api/videos',
      profile: '/api/profile',
      friends: '/api/friends',
      stats: '/api/stats',
      ratings: '/api/ratings',
      activities: '/api/activities',
      notifications: '/api/notifications',
      chat: '/api/chat',
      admin: '/api/admin'
    },
    health: '/health'
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes - Auth
app.post('/api/auth/register', authController.register);
app.post('/api/auth/verifyCode', authController.verifyCode);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh', authController.refreshToken);
app.post('/api/auth/logout', authenticateToken, authController.logout);
app.get('/api/auth/me', authenticateToken, authController.getCurrentUser);
app.put('/api/auth/profile', authenticateToken, authController.updateProfile);
app.put('/api/auth/change-password', authenticateToken, authController.changePassword);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);

// Routes - Teams
app.get('/api/teams', teamController.getAllTeams);
app.get('/api/teams/:id', teamController.getTeamById);
app.get('/api/teams/my', authenticateToken, teamController.getMyTeams);
app.post('/api/teams', authenticateToken, teamController.createTeam);
app.post('/api/teams/:id/join', authenticateToken, teamController.joinTeam);
app.post('/api/teams/:id/leave', authenticateToken, teamController.leaveTeam);

// Routes - Tournaments
app.get('/api/tournaments', tournamentController.getTournaments);
app.get('/api/tournaments/:id', tournamentController.getTournament);

// Routes - Notifications
app.use('/api/notifications', notificationRoutes);

// Supabase Connection
// const { supabase } = require('./config/supabase');

// Test Supabase connection
// supabase.from('users').select('id').then(data => {
//   console.log('✅ Supabase connected successfully!');
//   console.log('Sample data:', data);
// }).catch(error => {
//   console.error('❌ Supabase connection error:', error);
// });

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('🔌 Novi korisnik spojen:', socket.id);

  // Join team chat room
  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} joined team ${teamId}`);
  });

  // Leave team chat room
  socket.on('leave_team', (teamId) => {
    socket.leave(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} left team ${teamId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { teamId, userId, text, type, location, imageUrl } = data;
      
      const message = {
        user: userId,
        text,
        type: type || 'text',
        location,
        imageUrl,
        createdAt: new Date()
      };

      // Broadcast message to team room
      io.to(`team_${teamId}`).emit('new_message', message);
      
      console.log(`💬 New message in team ${teamId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(`team_${data.teamId}`).emit('user_typing', {
      userId: data.userId,
      username: data.username
    });
  });

  socket.on('stop_typing', (data) => {
    socket.to(`team_${data.teamId}`).emit('user_stop_typing', {
      userId: data.userId
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Korisnik odspojen:', socket.id);
  });
});

// Error Handling Middleware (MORA biti zadnje!)
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 Server radi na portu ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('📭 Graceful shutdown initiated...');
  
  server.close(() => {
    console.log('🔌 HTTP server closed');
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});