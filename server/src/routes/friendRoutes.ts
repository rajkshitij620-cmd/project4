import { Router, Response } from 'express';
import { User } from '../models/User.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Friendship } from '../models/Friendship.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Search user by unique Player ID
router.get('/search/:playerId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params;
    const currentUser = req.user!;

    if (playerId.toUpperCase() === currentUser.playerId) {
      res.status(400).json({ message: 'You cannot add yourself' });
      return;
    }

    const user = await User.findOne({ playerId: playerId.toUpperCase() }).select(
      '_id username playerId avatar isOnline lastSeen'
    );

    if (!user) {
      res.status(404).json({ message: 'No player found with this Player ID' });
      return;
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error searching for player' });
  }
});

// Get user's friends and incoming friend requests
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = req.user!;

    // Find all accepted friendships
    const friendships = await Friendship.find({
      $or: [{ userA: currentUser._id }, { userB: currentUser._id }]
    });

    const friendUserIds = friendships.map((f) =>
      f.userA.toString() === currentUser._id.toString() ? f.userB : f.userA
    );

    const friends = await User.find({ _id: { $in: friendUserIds } }).select(
      '_id username playerId avatar isOnline lastSeen'
    );

    // Find pending incoming requests
    const requests = await FriendRequest.find({
      to: currentUser._id,
      status: 'PENDING'
    }).populate('from', '_id username playerId avatar');

    res.json({ friends, requests });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching friends' });
  }
});

// Send a friend request
router.post('/request', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetPlayerId } = req.body;
    const currentUser = req.user!;

    if (!targetPlayerId) {
      res.status(400).json({ message: 'Target Player ID required' });
      return;
    }

    if (targetPlayerId.toUpperCase() === currentUser.playerId) {
      res.status(400).json({ message: 'You cannot add yourself as a friend' });
      return;
    }

    const targetUser = await User.findOne({ playerId: targetPlayerId.toUpperCase() });
    if (!targetUser) {
      res.status(404).json({ message: 'Player not found' });
      return;
    }

    // Check if already friends
    const existingFriendship = await Friendship.findOne({
      $or: [
        { userA: currentUser._id, userB: targetUser._id },
        { userA: targetUser._id, userB: currentUser._id }
      ]
    });

    if (existingFriendship) {
      res.status(400).json({ message: 'You are already friends with this player' });
      return;
    }

    // Check if request already pending
    const existingReq = await FriendRequest.findOne({
      from: currentUser._id,
      to: targetUser._id,
      status: 'PENDING'
    });

    if (existingReq) {
      res.status(400).json({ message: 'Friend request already sent' });
      return;
    }

    const request = new FriendRequest({
      from: currentUser._id,
      to: targetUser._id,
      status: 'PENDING'
    });

    await request.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending friend request' });
  }
});

// Accept or reject friend request
router.post('/respond', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId, action } = req.body;
    const currentUser = req.user!;

    if (!requestId || !action) {
      res.status(400).json({ message: 'Request ID and action (ACCEPT/REJECT) required' });
      return;
    }

    const request = await FriendRequest.findOne({
      _id: requestId,
      to: currentUser._id,
      status: 'PENDING'
    });

    if (!request) {
      res.status(404).json({ message: 'Friend request not found or already processed' });
      return;
    }

    if (action === 'ACCEPT') {
      request.status = 'ACCEPTED';
      await request.save();

      // Create mutual friendship
      const friendship = new Friendship({
        userA: request.from,
        userB: currentUser._id
      });
      await friendship.save();

      res.json({ message: 'Friend request accepted' });
    } else {
      request.status = 'REJECTED';
      await request.save();
      res.json({ message: 'Friend request declined' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error responding to friend request' });
  }
});

export const friendRoutes = router;

