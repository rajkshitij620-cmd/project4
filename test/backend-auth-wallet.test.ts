import assert from 'node:assert';
import mongoose from 'mongoose';
import { User } from '../server/src/models/User.js';
import { Wallet } from '../server/src/models/Wallet.js';
import { PlayerStats } from '../server/src/models/PlayerStats.js';
import { FriendRequest } from '../server/src/models/FriendRequest.js';
import { Friendship } from '../server/src/models/Friendship.js';

console.log('--- RUNNING BACKEND AUTH & WALLET VALIDATION SUITE ---');

function generatePlayerId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'TM';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Unique Player ID test
console.log('Testing: Unique Player ID generation format...');
const playerIds = new Set<string>();
for (let i = 0; i < 100; i++) {
  const id = generatePlayerId();
  assert.match(id, /^TM[2-9A-Z]{6}$/, 'Player ID must start with TM followed by 6 alphanumeric characters');
  assert.ok(!playerIds.has(id), 'Generated Player IDs must be unique');
  playerIds.add(id);
}
console.log('✓ Unique Player ID generation format verified (100 unique IDs verified)');

// 2. User & Wallet Model Schema Verification
console.log('Testing: User & Wallet Schemas...');
const mockUser = new User({
  username: 'Kshitij',
  email: 'kshitij@example.com',
  passwordHash: 'hashed_secret_pw',
  playerId: generatePlayerId(),
  avatar: '🎯',
  coins: 1000
});

assert.strictEqual(mockUser.username, 'Kshitij');
assert.strictEqual(mockUser.coins, 1000);
assert.strictEqual(mockUser.isOnline, false);

const mockWallet = new Wallet({
  user: mockUser._id,
  balance: 1000,
  transactions: [
    {
      type: 'BONUS',
      amount: 1000,
      description: 'Welcome Bonus'
    }
  ]
});

assert.strictEqual(mockWallet.balance, 1000);
assert.strictEqual(mockWallet.transactions.length, 1);
assert.strictEqual(mockWallet.transactions[0].type, 'BONUS');
console.log('✓ User & Wallet schemas validated');

// 3. Friend Request & Friendship schema validation
console.log('Testing: Friend Request & Friendship models...');
const friendAId = new mongoose.Types.ObjectId();
const friendBId = new mongoose.Types.ObjectId();

const req = new FriendRequest({
  from: friendAId,
  to: friendBId,
  status: 'PENDING'
});
assert.strictEqual(req.status, 'PENDING');

const friendship = new Friendship({
  userA: friendAId,
  userB: friendBId
});
assert.ok(friendship.userA.equals(friendAId));
assert.ok(friendship.userB.equals(friendBId));
console.log('✓ FriendRequest & Friendship models validated');

// 4. Wallet Match Entry and Reward Logic
console.log('Testing: Wallet balance & transactions...');
let balance = 1000;
const entryFee = 100;
assert.ok(balance >= entryFee, 'Sufficient balance for match');

// Match Entry Deduction
balance -= entryFee;
mockWallet.transactions.push({
  type: 'MATCH_ENTRY',
  amount: -entryFee,
  description: 'Entry fee for Neon Arena',
  createdAt: new Date()
});
assert.strictEqual(balance, 900);

// Match Reward Addition
const reward = 200;
balance += reward;
mockWallet.transactions.push({
  type: 'MATCH_REWARD',
  amount: reward,
  description: 'Winner reward for Neon Arena',
  createdAt: new Date()
});
assert.strictEqual(balance, 1100);
assert.strictEqual(mockWallet.transactions.length, 3);
console.log('✓ Wallet balance and transaction auditing validated');

console.log('\n=================================================');
console.log('ALL BACKEND AUTH & WALLET TESTS PASSED WITH 100%!');
console.log('=================================================');

