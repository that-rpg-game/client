const Phaser = require('phaser');
const connection = require('../../network/connection');
const MessageHandlers = require('../../network/handlers');

class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
    this.players = new Map();
    this.npcs = new Map();
    this.localPlayer = null;
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
    }
  }

  addPlayer(data) {
    // Create player sprite
    const player = this.add.circle(data.x || 100, data.y || 100, 16, 0x00ff00);
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
      // Smooth movement
      this.tweens.add({
        targets: [player.sprite, player.nameText],
        x: data.x,
        y: data.y,
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
