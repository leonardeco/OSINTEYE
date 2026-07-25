import { describe, it, expect } from 'vitest';
import { filterInvestigations } from './ReportsView';

const invs = [
  { id: '1', target: 'example.com', status: 'completed', created_at: '2026-01-01T00:00:00Z' },
  { id: '2', target: 'test.org', status: 'completed', created_at: '2026-02-01T00:00:00Z' },
] as any;

describe('filterInvestigations', () => {
  it('filters by target substring', () => {
    expect(filterInvestigations(invs, { target: 'example' }).length).toBe(1);
  });
  it('returns all when no filters given', () => {
    expect(filterInvestigations(invs, {}).length).toBe(2);
  });
});
