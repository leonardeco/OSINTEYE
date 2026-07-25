import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolCard } from './ToolCard';

const source = { id: '1', category_id: 'c1', name: 'Shodan', description: 'Search engine for internet-connected devices', url: 'https://shodan.io', access_type: 'web', status: 'active' };

describe('ToolCard', () => {
  it('renders the source name and status badge', () => {
    render(<ToolCard source={source} searchTerm="" onOpenChat={vi.fn()} />);
    expect(screen.getByText('Shodan')).toBeTruthy();
    expect(screen.getByText('active')).toBeTruthy();
  });
});
