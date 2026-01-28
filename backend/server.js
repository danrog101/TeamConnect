const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
require('dotenv').config();

// Import config and middleware
const config = require('./config/config');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Basic Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(hpp());

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.backendUrl, `ws://${config.backendUrl.replace('http://', '')}`]
    }
  }
}));

// HTTP request logger
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Rate limiting - apply to all API routes
app.use('/api/', apiLimiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: config.env,
    database: 'Supabase Connected',
    supabaseConfigured: !!config.supabase.url
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
    environment: config.env,
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
      admin: '/api/admin',
      waitlist: '/api/waitlist'
    },
    health: '/health'
  });
});

// ✅ IMPORT ALL 15 ROUTE FILES
const activityRoutes = require('./routes/activityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const matchRoutes = require('./routes/matchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const teamRoutes = require('./routes/teamRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const videoRoutes = require('./routes/videoRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');

// ✅ USE ALL 15 ROUTES
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/waitlist', waitlistRoutes);

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('🔌 Novi korisnik spojen:', socket.id);

  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} joined team ${teamId}`);
  });

  socket.on('leave_team', (teamId) => {
    socket.leave(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} left team ${teamId}`);
  });

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

      io.to(`team_${teamId}`).emit('new_message', message);
      console.log(`💬 New message in team ${teamId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

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

  socket.on('disconnect', () => {
    console.log('🔌 Korisnik odspojen:', socket.id);
  });
});

// Error Handling Middleware (must be last!)
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 TeamConnect Server Started`);
  console.log('═══════════════════════════════════════════');
  console.log(`📍 Environment: ${config.env}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 Backend URL: ${config.backendUrl}`);
  console.log(`🌍 Frontend URL: ${config.frontendUrl}`);
  console.log(`🗄️  Database: Supabase (${config.supabase.url ? '✅' : '❌'})`);
  console.log('');
  console.log('📋 Available Routes (15):');
  console.log('   ✅ /api/activities');
  console.log('   ✅ /api/admin');
  console.log('   ✅ /api/auth');
  console.log('   ✅ /api/chat');
  console.log('   ✅ /api/fields');
  console.log('   ✅ /api/friends');
  console.log('   ✅ /api/matches');
  console.log('   ✅ /api/notifications');
  console.log('   ✅ /api/profile');
  console.log('   ✅ /api/ratings');
  console.log('   ✅ /api/stats');
  console.log('   ✅ /api/teams');
  console.log('   ✅ /api/tournaments');
  console.log('   ✅ /api/videos');
  console.log('   ✅ /api/waitlist');
  console.log('═══════════════════════════════════════════');
});

// Graceful Shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('\n📭 Graceful shutdown initiated...');
  
  server.close(() => {
    console.log('🔌 HTTP server closed');
    logger.info('Server shut down gracefully');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    logger.error('Server forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection:', { reason, promise });
  gracefulShutdown();
});