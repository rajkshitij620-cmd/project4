import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { PlayerStats } from '../models/PlayerStats.js';
import { generateUniquePlayerId } from '../utils/playerIdGenerator.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Sign Up / Registration
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    // Check existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    // Generate unique short human-friendly Player ID (e.g. TM8K29XP)
    const playerId = await generateUniquePlayerId();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      playerId,
      avatar: '🎯',
      coins: 1000
    });

    await newUser.save();

    // Initialize Wallet with starter bonus
    const newWallet = new Wallet({
      user: newUser._id,
      balance: 1000,
      transactions: [
        {
          type: 'BONUS',
          amount: 1000,
          description: 'Welcome Bonus coins'
        }
      ]
    });
    await newWallet.save();

    // Initialize Stats
    const newStats = new PlayerStats({
      user: newUser._id,
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      bestScore: 0
    });
    await newStats.save();

    // Sign JWT
    const secret = process.env.JWT_SECRET || 'diskslam_secret_key';
    const token = jwt.sign({ userId: newUser._id }, secret, { expiresIn: '30d' });

    res.status(201).json({
      user: {
        id: newUser._id.toString(),
        playerId: newUser.playerId,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        coins: newUser.coins,
        stats: {
          matches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          bestScore: 0
        }
      },
      token
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login (by Email OR unique Player ID)
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      res.status(400).json({ message: 'Player ID or Email and password are required' });
      return;
    }

    const query = loginId.includes('@')
      ? { email: loginId.toLowerCase().trim() }
      : { playerId: loginId.toUpperCase().trim() };

    const user = await User.findOne(query);
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const stats = (await PlayerStats.findOne({ user: user._id })) || {
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      bestScore: 0
    };

    const secret = process.env.JWT_SECRET || 'diskslam_secret_key';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

    res.json({
      user: {
        id: user._id.toString(),
        playerId: user.playerId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        stats: {
          matches: stats.matches,
          wins: stats.wins,
          losses: stats.losses,
          winRate: stats.winRate,
          bestScore: stats.bestScore
        }
      },
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Google Sign-In / One-Tap Auth (No password, auto-registers or logs in)
router.post('/google', async (req, res: Response): Promise<void> => {
  try {
    const { email, name, avatar } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Google email is required' });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // New user with Google
      const playerId = await generateUniquePlayerId();
      const salt = await bcrypt.genSalt(10);
      const randomSecret = Math.random().toString(36).slice(-10) + Date.now().toString(36);
      const passwordHash = await bcrypt.hash(randomSecret, salt);

      const username = (name || cleanEmail.split('@')[0] || 'Player').slice(0, 15).trim();

      user = new User({
        username,
        email: cleanEmail,
        passwordHash,
        playerId,
        avatar: avatar || '🎮',
        coins: 1000
      });
      await user.save();

      // Initialize Wallet
      const newWallet = new Wallet({
        user: user._id,
        balance: 1000,
        transactions: [
          {
            type: 'BONUS',
            amount: 1000,
            description: 'Welcome Google login bonus'
          }
        ]
      });
      await newWallet.save();

      // Initialize Stats
      const newStats = new PlayerStats({
        user: user._id,
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        bestScore: 0
      });
      await newStats.save();
    }

    const stats = (await PlayerStats.findOne({ user: user._id })) || {
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      bestScore: 0
    };

    const secret = process.env.JWT_SECRET || 'diskslam_secret_key';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

    res.json({
      user: {
        id: user._id.toString(),
        playerId: user.playerId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        stats: {
          matches: stats.matches,
          wins: stats.wins,
          losses: stats.losses,
          winRate: stats.winRate,
          bestScore: stats.bestScore
        }
      },
      token
    });
  } catch (err: any) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Server error during Google login' });
  }
});

// Current User Profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const stats = (await PlayerStats.findOne({ user: user._id })) || {
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      bestScore: 0
    };

    res.json({
      user: {
        id: user._id.toString(),
        playerId: user.playerId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        stats: {
          matches: stats.matches,
          wins: stats.wins,
          losses: stats.losses,
          winRate: stats.winRate,
          bestScore: stats.bestScore
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

export const authRoutes = router;

