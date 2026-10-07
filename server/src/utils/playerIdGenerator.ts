import { User } from '../models/User.js';

/**
 * Generates a short, human-friendly, uppercase alphanumeric Player ID.
 * Example: TM8K29XP
 * Globally unique, never exposes MongoDB ObjectId.
 */
export async function generateUniquePlayerId(): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 0, O, 1, I
  let isUnique = false;
  let candidate = '';

  while (!isUnique) {
    let code = 'TM';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await User.findOne({ playerId: code });
    if (!existing) {
      candidate = code;
      isUnique = true;
    }
  }

  return candidate;
}

