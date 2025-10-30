const io = require('socket.io-client');

class ConnectionManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.handlers = new Map();
    this.eventBuffer = []; // Buffer events until handlers are registered
  }

  connect(serverUrl, token) {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
      });

      this.socket.on('connect', () => {
        this.connected = true;

        // Send authentication after connection
        this.socket.emit('auth', { token: token });
      });

      this.socket.on('authSuccess', (data) => {
        resolve(data);
      });

      this.socket.on('disconnect', () => {
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
      } else if (eventName.startsWith('player:')) {
        // Buffer player events that arrive before handlers are registered
        this.eventBuffer.push({ eventName, args });
      }
    });
  }

  on(eventName, handler) {
    this.handlers.set(eventName, handler);

    // Process any buffered events for this handler
    const bufferedEvents = this.eventBuffer.filter((e) => e.eventName === eventName);
    if (bufferedEvents.length > 0) {
      bufferedEvents.forEach((event) => {
        handler(...event.args);
      });
      // Remove processed events from buffer
      this.eventBuffer = this.eventBuffer.filter((e) => e.eventName !== eventName);
    }
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
