import { describe, it, expect } from 'vitest';
import { computeWeeklyActivity } from './DashboardView';

describe('computeWeeklyActivity', () => {
  it('returns 7 buckets', () => {
    const result = computeWeeklyActivity([]);
    expect(result.length).toBe(7);
  });
  it('counts an investigation on its creation day', () => {
    const today = new Date().toISOString();
    const result = computeWeeklyActivity([{ created_at: today } as any]);
    const total = result.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(1);
  });
});
