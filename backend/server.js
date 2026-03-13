const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');

const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ✅ DODAJ OVO - Cron job setup
const cron = require('node-cron');

// Import config and middleware


// Import config and middleware
const config = require('./config/config');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
// Sigurnost

const server = http.createServer(app);

// Socket.io setup - FIXED CORS
const io = socketIo(server, {
  cors: {
    origin: [
      'https://teamconnect-frontendte.onrender.com',
      'http://localhost:3000'
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Basic Middleware - FIXED CORS
app.use(cors({
  origin: [
    'https://teamconnect-frontendte.onrender.com',
    'http://localhost:3000'
  ],
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

const teamRoutes = require('./routes/teamRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');

const waitlistRoutes = require('./routes/waitlistRoutes');
const dmRoutes = require('./routes/dmRoutes');
const groupRoutes = require('./routes/groupRoutes');
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

app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);

app.use('/api/waitlist', waitlistRoutes);
const studioRoutes = require('./routes/studioRoutes');
app.use('/api/studios', studioRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/groups', groupRoutes);
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
  // DM - join osobna soba
socket.on('join_dm', (userId) => {
  socket.join(`dm_${userId}`);
  console.log(`💬 Korisnik joined DM room: ${userId}`);
});

// DM - pošalji poruku real-time
socket.on('send_dm', async (data) => {
  try {
    const { supabase } = require('./config/supabase');
    const { senderId, recipientId, text } = data;

    const { data: savedMessage, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: senderId, recipient_id: recipientId, text })
      .select(`
        id, sender_id, recipient_id, text, read, created_at,
        sender:users!direct_messages_sender_id_fkey(id, username, avatar)
      `)
      .single();

    if (error) throw error;

    // Pošalji objema stranama
    io.to(`dm_${recipientId}`).emit('new_dm', savedMessage);
    io.to(`dm_${senderId}`).emit('new_dm', savedMessage);

  } catch (error) {
    console.error('❌ send_dm error:', error);
    socket.emit('error', { message: 'Failed to send DM' });
  }
});

// DM - typing
socket.on('dm_typing', (data) => {
  socket.to(`dm_${data.recipientId}`).emit('dm_user_typing', { userId: data.senderId });
});

socket.on('dm_stop_typing', (data) => {
  socket.to(`dm_${data.recipientId}`).emit('dm_user_stop_typing', { userId: data.senderId });
});

 socket.on('send_message', async (data) => {
  try {
    const { supabase } = require('./config/supabase');
    const { teamId, userId, text, type, location, imageUrl } = data;

    // Spremi poruku u Supabase
    const { data: savedMessage, error } = await supabase
      .from('team_messages')
      .insert({
        team_id: teamId,
        user_id: userId,
        text,
        type: type || 'text',
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null,
        image_url: imageUrl || null
      })
      .select(`
        id,
        team_id,
        user_id,
        text,
        type,
        location_lat,
        location_lng,
        image_url,
        created_at,
        user:users!team_messages_user_id_fkey(id, username, avatar)
      `)
      .single();

    if (error) {
      console.error('❌ Save message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
      return;
    }

    // Formatiraj i pošalji svim članovima
    const message = {
      _id: savedMessage.id,
      id: savedMessage.id,
      text: savedMessage.text,
      type: savedMessage.type,
      location: savedMessage.location_lat ? {
        latitude: savedMessage.location_lat,
        longitude: savedMessage.location_lng
      } : null,
      createdAt: savedMessage.created_at,
      user: {
        _id: savedMessage.user?.id,
        id: savedMessage.user?.id,
        username: savedMessage.user?.username,
        avatar: savedMessage.user?.avatar
      }
    };

    io.to(`team_${teamId}`).emit('new_message', message);
  } catch (error) {
    console.error('❌ Send message error:', error);
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

// ✅ DODAJ OVO - Auto-cleanup cron job (runs daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Running auto-cleanup...');
  
  try {
    const { supabase } = require('./config/supabase');
    const today = new Date().toISOString().split('T')[0];

    const { data: deletedTournaments } = await supabase
      .from('tournaments').delete().lt('end_date', today).select('id, name');

    const { data: deletedTeams } = await supabase
      .from('teams').delete().lt('date', today).select('id, name');

    const { data: deletedSessions } = await supabase
      .from('studio_sessions').delete().lt('date', today).select('id');

    const { data: deletedGroupSessions } = await supabase
      .from('group_sessions').delete().lt('date', today).select('id');

    console.log('✅ Cleanup completed:', {
      tournaments: deletedTournaments?.length || 0,
      teams: deletedTeams?.length || 0,
      sessions: deletedSessions?.length || 0,
      groupSessions: deletedGroupSessions?.length || 0
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
});


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