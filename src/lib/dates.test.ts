import { describe, expect, it } from 'vitest';
import { dateKey, lastNDays } from './dates';

describe('date helpers', () => {
  it('formats dates as ISO calendar keys', () => {
    expect(dateKey(new Date('2026-10-16T12:00:00'))).toBe('2026-10-16');
  });
  it('returns a requested number of ascending date keys', () => {
    expect(lastNDays(3, new Date('2026-10-16T12:00:00'))).toEqual(['2026-10-14','2026-10-15','2026-10-16']);
  });
});
