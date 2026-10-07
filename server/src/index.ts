import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDB } from './db.js';
import { authRoutes } from './routes/authRoutes.js';
import { friendRoutes } from './routes/friendRoutes.js';
import { walletRoutes } from './routes/walletRoutes.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);

app.use(express.json());

// Socket.IO Server initialization
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

// Setup Socket handlers
setupSocketHandlers(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'disk-slam-backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/wallet', walletRoutes);

const PORT = process.env.PORT || 5001;

async function bootstrap() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[Server] Disk Slam Backend running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

bootstrap();

