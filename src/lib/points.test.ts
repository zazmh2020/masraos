import { describe, it, expect } from 'vitest';
import { pointsDelta } from './points';

describe('points ledger — delta sign', () => {
  it('EARN adds, DEDUCT subtracts', () => {
    expect(pointsDelta('EARN', 10)).toBe(10);
    expect(pointsDelta('DEDUCT', 10)).toBe(-10);
  });
  it('ADJUST is signed by the increase flag', () => {
    expect(pointsDelta('ADJUST', 5, true)).toBe(5);
    expect(pointsDelta('ADJUST', 5, false)).toBe(-5);
  });
});
