import { describe, it, expect } from 'vitest';
import { countActiveInvestigations } from './Sidebar';

describe('countActiveInvestigations', () => {
  it('counts running and pending, ignores completed/error', () => {
    const invs = [
      { status: 'running' }, { status: 'pending' }, { status: 'completed' }, { status: 'error' }
    ] as any;
    expect(countActiveInvestigations(invs)).toBe(2);
  });
});
