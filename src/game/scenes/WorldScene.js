const Phaser = require('phaser');
const connection = require('../../network/connection');
const MessageHandlers = require('../../network/handlers');

class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
    this.players = new Map();
    this.npcs = new Map();
    this.localPlayer = null;
    this.TILE_SIZE = 32; // Size of each tile in pixels
    this.MOVE_COOLDOWN = 200; // Minimum time between moves in milliseconds
    this.lastMoveTime = 0; // Track last move time
  }

  // Helper methods to convert between world coordinates and pixel coordinates
  worldToPixel(worldCoord) {
    return worldCoord * this.TILE_SIZE;
  }

  pixelToWorld(pixelCoord) {
    return Math.floor(pixelCoord / this.TILE_SIZE);
  }

  create() {
    // Set up message handlers
    this.handlers = new MessageHandlers(this);

    // Register network event handlers
    connection.on('player:joined', this.handlers.handlePlayerJoined.bind(this.handlers));
    connection.on('player:left', this.handlers.handlePlayerLeft.bind(this.handlers));
    connection.on('player:moved', this.handlers.handlePlayerMoved.bind(this.handlers));
    connection.on('npc:spawned', this.handlers.handleNpcSpawned.bind(this.handlers));
    connection.on('npc:despawned', this.handlers.handleNpcDespawned.bind(this.handlers));
    connection.on('combat:update', this.handlers.handleCombatUpdate.bind(this.handlers));
    connection.on('inventory:update', this.handlers.handleInventoryUpdate.bind(this.handlers));
    connection.on('chat:message', this.handlers.handleChatMessage.bind(this.handlers));
    connection.on('error', this.handlers.handleError.bind(this.handlers));

    // Handle authSuccess to add local player
    connection.on('authSuccess', (data) => {
      console.warn('Auth success, spawning local player:', data);
      this.addPlayer({
        playerId: data.playerId,
        displayName: data.displayName,
        x: data.position.x,
        y: data.position.y,
        isLocal: true,
      });
    });

    // Set up input handling
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create a simple world
    this.createWorld();

    // Info text
    this.add.text(10, 10, 'Use arrow keys to move', {
      font: '16px monospace',
      fill: '#ffffff',
    });
  }

  createWorld() {
    // TODO: Create tile map and world objects
    // For now, just create a simple background
    const graphics = this.add.graphics();
    graphics.fillStyle(0x228b22, 1);
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
  }

  update() {
    // Handle player input
    if (this.localPlayer) {
      this.handleMovement();
    }
  }

  handleMovement() {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastMoveTime < this.MOVE_COOLDOWN) {
      return; // Still on cooldown
    }

    let direction = null;

    if (this.cursors.left.isDown) {
      direction = 'west';
    } else if (this.cursors.right.isDown) {
      direction = 'east';
    } else if (this.cursors.up.isDown) {
      direction = 'north';
    } else if (this.cursors.down.isDown) {
      direction = 'south';
    }

    if (direction) {
      // Send movement to server
      connection.emit('move', { direction });
      this.lastMoveTime = now;

      // Optimistically update local player position
      this.updateLocalPlayerPosition(direction);
    }
  }

  updateLocalPlayerPosition(direction) {
    if (!this.localPlayer || !this.localPlayer.data) {
      console.warn('Cannot update local player position - no local player');
      return;
    }

    // Calculate new world coordinates based on direction
    let newX = this.localPlayer.data.x;
    let newY = this.localPlayer.data.y;
    console.warn('Current local player position:', { x: newX, y: newY });

    switch (direction) {
      case 'north':
        newY += 1;
        break;
      case 'south':
        newY -= 1;
        break;
      case 'east':
        newX += 1;
        break;
      case 'west':
        newX -= 1;
        break;
    }

    // Update stored data
    this.localPlayer.data.x = newX;
    this.localPlayer.data.y = newY;

    // Convert to pixel coordinates and update sprite
    const pixelX = this.worldToPixel(newX);
    const pixelY = this.worldToPixel(newY);

    console.warn('Moving local player to pixel position:', { pixelX, pixelY });

    // Smooth movement
    this.tweens.add({
      targets: [this.localPlayer.sprite, this.localPlayer.nameText],
      x: pixelX,
      y: pixelY,
      duration: 100,
      ease: 'Linear',
    });
  }

  addPlayer(data) {
    // Convert world coordinates to pixel coordinates
    const pixelX = this.worldToPixel(data.x !== undefined ? data.x : 0);
    const pixelY = this.worldToPixel(data.y !== undefined ? data.y : 0);

    // Create player sprite
    const player = this.add.circle(pixelX, pixelY, 16, 0x00ff00);
    player.playerId = data.playerId;

    // Add name label
    const nameText = this.add.text(player.x, player.y - 30, data.displayName || 'Player', {
      font: '12px monospace',
      fill: '#ffffff',
    });
    nameText.setOrigin(0.5);

    this.players.set(data.playerId, {
      sprite: player,
      nameText: nameText,
      data: data,
    });

    // If this is the local player, store reference and center camera
    if (data.isLocal) {
      this.localPlayer = this.players.get(data.playerId);
      this.cameras.main.startFollow(player);
    }
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.sprite.destroy();
      player.nameText.destroy();
      this.players.delete(playerId);
    }
  }

  updatePlayerPosition(data) {
    const player = this.players.get(data.playerId);
    if (player) {
      // Convert world coordinates to pixel coordinates
      const pixelX = this.worldToPixel(data.x);
      const pixelY = this.worldToPixel(data.y);

      // Smooth movement
      this.tweens.add({
        targets: [player.sprite, player.nameText],
        x: pixelX,
        y: pixelY,
        duration: 100,
        ease: 'Linear',
      });
    }
  }

  addNpc(data) {
    // Create NPC sprite
    const npc = this.add.circle(data.x || 200, data.y || 200, 16, 0xff0000);
    npc.npcId = data.npcId;

    // Add name label
    const nameText = this.add.text(npc.x, npc.y - 30, data.name || 'NPC', {
      font: '12px monospace',
      fill: '#ffff00',
    });
    nameText.setOrigin(0.5);

    this.npcs.set(data.npcId, {
      sprite: npc,
      nameText: nameText,
      data: data,
    });
  }

  removeNpc(npcId) {
    const npc = this.npcs.get(npcId);
    if (npc) {
      npc.sprite.destroy();
      npc.nameText.destroy();
      this.npcs.delete(npcId);
    }
  }

  updateCombat(data) {
    // TODO: Show combat animations, damage numbers, etc.
    console.warn('Combat update:', data);
  }
}

module.exports = WorldScene;
