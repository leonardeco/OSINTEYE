import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

function Probe() {
  const { state } = useApp();
  return <div>{state.currentView}</div>;
}

describe('AppContext', () => {
  it('provides dashboard as the default view', () => {
    render(<AppProvider><Probe /></AppProvider>);
    expect(screen.getByText('dashboard')).toBeTruthy();
  });
});
