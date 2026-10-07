import { Router, Response } from 'express';
import { Wallet } from '../models/Wallet.js';
import { User } from '../models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get wallet balance and transactions
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = req.user!;
    let wallet = await Wallet.findOne({ user: currentUser._id });

    if (!wallet) {
      wallet = new Wallet({
        user: currentUser._id,
        balance: currentUser.coins || 1000,
        transactions: []
      });
      await wallet.save();
    }

    res.json({
      coins: wallet.balance,
      transactions: wallet.transactions.slice(-20).reverse()
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving wallet' });
  }
});

// Claim Daily Free Reward
router.post('/claim-daily', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = req.user!;
    let wallet = await Wallet.findOne({ user: currentUser._id });

    if (!wallet) {
      wallet = new Wallet({
        user: currentUser._id,
        balance: 1000,
        transactions: []
      });
    }

    const now = new Date();
    if (wallet.lastDailyReward) {
      const diffHours = (now.getTime() - wallet.lastDailyReward.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        res.status(400).json({ message: 'Daily reward already claimed today. Try again later!' });
        return;
      }
    }

    const dailyBonus = 250;
    wallet.balance += dailyBonus;
    wallet.lastDailyReward = now;
    wallet.transactions.push({
      type: 'DAILY_REWARD',
      amount: dailyBonus,
      description: 'Daily login bonus',
      createdAt: now
    });

    await wallet.save();

    // Sync with User document
    currentUser.coins = wallet.balance;
    await currentUser.save();

    res.json({
      coins: wallet.balance,
      message: `Claimed ${dailyBonus} free coins!`
    });
  } catch (err) {
    res.status(500).json({ message: 'Error claiming daily reward' });
  }
});

export const walletRoutes = router;

