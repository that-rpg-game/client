const io = require('socket.io-client');

class ConnectionManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.handlers = new Map();
  }

  connect(serverUrl, token) {
    console.warn('Attempting to connect to:', serverUrl);
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
      });

      this.socket.on('connect', () => {
        console.warn('Connected to game server');
        this.connected = true;

        // Send authentication after connection
        this.socket.emit('auth', { token: token });
      });

      this.socket.on('authSuccess', (data) => {
        console.warn('Authentication successful', data);
        resolve(data);
      });

      this.socket.on('disconnect', () => {
        console.warn('Disconnected from game server');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('Server error:', error.message || error);
        reject(new Error(error.message || 'Server error'));
      });

      // Set up message handlers
      this.setupHandlers();
    });
  }

  setupHandlers() {
    // Forward all server messages to registered handlers
    this.socket.onAny((eventName, ...args) => {
      const handler = this.handlers.get(eventName);
      if (handler) {
        handler(...args);
      }
    });
  }

  on(eventName, handler) {
    this.handlers.set(eventName, handler);
  }

  off(eventName) {
    this.handlers.delete(eventName);
  }

  emit(eventName, data) {
    if (!this.connected) {
      console.error('Cannot emit - not connected to server');
      return;
    }
    this.socket.emit(eventName, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = new ConnectionManager();
