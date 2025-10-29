/**
 * Tests for network connection manager
 */

describe('ConnectionManager', () => {
  test('should be defined', () => {
    const connection = require('../src/network/connection');
    expect(connection).toBeDefined();
  });

  test('should start disconnected', () => {
    const connection = require('../src/network/connection');
    expect(connection.isConnected()).toBe(false);
  });
});
