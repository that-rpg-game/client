/**
 * Tests for message handlers
 */

const MessageHandlers = require('../src/network/handlers');

describe('MessageHandlers', () => {
  test('should create instance with game scene', () => {
    const mockScene = {};
    const handlers = new MessageHandlers(mockScene);
    expect(handlers).toBeDefined();
    expect(handlers.gameScene).toBe(mockScene);
  });

  test('should have handler methods', () => {
    const handlers = new MessageHandlers(null);
    expect(typeof handlers.handlePlayerJoined).toBe('function');
    expect(typeof handlers.handlePlayerLeft).toBe('function');
    expect(typeof handlers.handlePlayerMoved).toBe('function');
  });
});
