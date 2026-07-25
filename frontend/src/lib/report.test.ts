import { describe, it, expect } from 'vitest';
import { buildReportHtml } from './report';

describe('buildReportHtml', () => {
  it('includes the investigation target and case name', () => {
    const inv = { id: '1', name: 'Caso #1', target: 'example.com', status: 'completed', created_at: new Date().toISOString(), results: [] } as any;
    const html = buildReportHtml(inv);
    expect(html).toContain('example.com');
    expect(html).toContain('Caso #1');
  });
});
