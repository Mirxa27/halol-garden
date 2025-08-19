import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WebSocketProvider, useWebSocket } from '../../contexts/WebSocketContext';
import React from 'react';

function Consumer() {
  const { connected, notifications, onlineUsers } = useWebSocket();
  return (
    <div data-testid="status">
      {connected ? 'connected' : 'disconnected'} | {notifications.length} | {onlineUsers.length}
    </div>
  );
}

describe('WebSocketContext', () => {
  it('provides default state without crashing', () => {
    const { getByTestId } = render(
      <WebSocketProvider>
        <Consumer />
      </WebSocketProvider>
    );

    const status = getByTestId('status');
    expect(status.textContent).toContain('disconnected');
  });
});