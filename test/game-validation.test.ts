import assert from 'node:assert';
import { GameRulesEngine, DEFAULT_BOARD_DIMENSIONS, GOAL_LOCATIONS, PieceData } from '../client/src/game/core/GameRules.js';
import { DiskSlamAI } from '../client/src/game/ai/DiskSlamAI.js';
import { COLOR_PALETTE, GAME_TABLES, PlayerColor } from '../client/src/types/shared.js';

console.log('--- RUNNING DISK SLAM 3D VALIDATION SUITE ---');

// 1. TEST: Random Color Assignment
{
  console.log('Testing: Random Color Assignment...');
  const samples = 50;
  for (let i = 0; i < samples; i++) {
    const { playerAColor, playerBColor } = GameRulesEngine.pickRandomColors();
    assert.notStrictEqual(playerAColor, playerBColor, 'Player A and Player B must NEVER have the same color');
    assert.ok(COLOR_PALETTE[playerAColor], 'Player A color must be in palette');
    assert.ok(COLOR_PALETTE[playerBColor], 'Player B color must be in palette');
  }
  console.log('✓ Random Color Assignment passed: Colors are randomized and never identical');
}

// 2. TEST: Initial Pieces Generation
{
  console.log('Testing: Initial Pieces Setup...');
  const { playerAColor, playerBColor } = GameRulesEngine.pickRandomColors();
  const pieces = GameRulesEngine.createInitialPieces(playerAColor, playerBColor);

  const piecesA = pieces.filter(p => p.owner === 'playerA');
  const piecesB = pieces.filter(p => p.owner === 'playerB');

  assert.strictEqual(piecesA.length, 5, 'Player A must have 5 starting pucks');
  assert.strictEqual(piecesB.length, 5, 'Player B must have 5 starting pucks');
  assert.strictEqual(piecesA.length, piecesB.length, 'Both players must receive an equal number of pucks (5 vs 5)');

  piecesA.forEach(p => assert.strictEqual(p.color, playerAColor));
  piecesB.forEach(p => assert.strictEqual(p.color, playerBColor));
  console.log('✓ Initial Pieces Setup passed: 5 pucks per side with correct color assignment');
}

// 3. TEST: Win Condition Rules
{
  console.log('Testing: Core Win Condition Engine...');
  const { playerAColor, playerBColor } = GameRulesEngine.pickRandomColors();
  const pieces = GameRulesEngine.createInitialPieces(playerAColor, playerBColor);

  // Initial state - neither has won
  let winState = GameRulesEngine.evaluateWinCondition(pieces);
  assert.strictEqual(winState.isGameOver, false);
  assert.strictEqual(winState.winner, null);
  assert.strictEqual(winState.remainingA, 5);
  assert.strictEqual(winState.remainingB, 5);

  // Case: Player A slings 2 of their own pieces through gate
  pieces[0].isPocketed = true;
  pieces[1].isPocketed = true;
  winState = GameRulesEngine.evaluateWinCondition(pieces);
  assert.strictEqual(winState.isGameOver, false);
  assert.strictEqual(winState.remainingA, 3);

  // Case: Opponent pieces get pocketed (should NOT make opponent win)
  pieces.filter(p => p.owner === 'playerB')[0].isPocketed = true;
  winState = GameRulesEngine.evaluateWinCondition(pieces);
  assert.strictEqual(winState.isGameOver, false);
  assert.strictEqual(winState.remainingB, 4);

  // Case: Player A clears all 5 pieces -> Player A WINS
  pieces[2].isPocketed = true;
  pieces[3].isPocketed = true;
  pieces[4].isPocketed = true;
  winState = GameRulesEngine.evaluateWinCondition(pieces);
  assert.strictEqual(winState.isGameOver, true);
  assert.strictEqual(winState.winner, 'playerA');
  assert.strictEqual(winState.remainingA, 0);
  console.log('✓ Win Condition Engine passed: Player wins when all 5 own pucks are slung to opponent side');
}

// 4. TEST: Gate Entry Geometry
{
  console.log('Testing: Gate Entry Crossing Detection...');
  const mockPieceA: PieceData = {
    id: 'test_a',
    owner: 'playerA',
    color: 'blue',
    x: 0,
    z: 2.0,
    radius: 0.38,
    isPocketed: false
  };

  // Center of Player A's own side (z = 2.0) - not scored
  let res = GameRulesEngine.checkPocketEntry(mockPieceA, 0, 2.0);
  assert.strictEqual(res.pocketed, false);

  // Passing through the center gate slot (x = 0, z = -0.5) into Player B side -> Scored!
  res = GameRulesEngine.checkPocketEntry(mockPieceA, 0, -0.5);
  assert.strictEqual(res.pocketed, true);
  assert.strictEqual(res.intoOpponentGoal, true);

  // Hitting the divider wall away from the gate (x = 2.5, z = -0.5) -> NOT through gate!
  res = GameRulesEngine.checkPocketEntry(mockPieceA, 2.5, -0.5);
  assert.strictEqual(res.pocketed, false);

  // Out of bounds off the back edge
  res = GameRulesEngine.checkPocketEntry(mockPieceA, 0, 7.5);
  assert.strictEqual(res.pocketed, true);
  assert.strictEqual(res.intoOpponentGoal, false);
  console.log('✓ Gate Entry Detection passed: Accurately detects crossing through center gate slot');
}

// 5. TEST: Physics-aware AI
{
  console.log('Testing: Physics-aware AI Shot Calculations...');
  const { playerAColor, playerBColor } = GameRulesEngine.pickRandomColors();
  const pieces = GameRulesEngine.createInitialPieces(playerAColor, playerBColor);
  const strikerPos = { x: 0, z: -4.2 };

  // Easy
  const shotEasy = DiskSlamAI.calculateShot(strikerPos, pieces, 'playerB', 'EASY');
  assert.ok(shotEasy.power >= 0.25 && shotEasy.power <= 1.0, 'AI power must be within [0.25, 1.0]');
  assert.ok(Number.isFinite(shotEasy.dirX) && Number.isFinite(shotEasy.dirZ), 'AI dir must be finite');

  // Hard
  const shotHard = DiskSlamAI.calculateShot(strikerPos, pieces, 'playerB', 'HARD');
  assert.ok(shotHard.power >= 0.25 && shotHard.power <= 1.0);
  assert.ok(Number.isFinite(shotHard.dirX) && Number.isFinite(shotHard.dirZ));
  assert.ok(shotHard.targetPieceId, 'Hard AI should target a specific candidate piece');
  console.log(`✓ Physics-aware AI passed: Strategy '${shotHard.strategy}', power ${shotHard.power.toFixed(2)}`);
}

// 6. TEST: Arena Tables Configuration
{
  console.log('Testing: Arena Tables Configuration...');
  assert.strictEqual(GAME_TABLES.length, 4, 'Must have 4 game tables');
  const classic = GAME_TABLES.find(t => t.id === 'table_classic')!;
  const neon = GAME_TABLES.find(t => t.id === 'table_neon')!;
  const royal = GAME_TABLES.find(t => t.id === 'table_royal')!;
  const cyber = GAME_TABLES.find(t => t.id === 'table_cyber')!;

  assert.strictEqual(classic.entryFee, 0, 'Classic table is free');
  assert.strictEqual(classic.unlockedByDefault, true);
  assert.strictEqual(neon.entryFee, 100);
  assert.strictEqual(royal.entryFee, 500);
  assert.strictEqual(cyber.entryFee, 1000);
  console.log('✓ Arena Tables Configuration passed');
}

console.log('\n========================================');
console.log('ALL GAME ENGINE VALIDATION TESTS PASSED!');
console.log('========================================');

