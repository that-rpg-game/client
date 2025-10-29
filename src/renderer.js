// Renderer process - Game client main script
// Node integration is enabled for this game client

const path = require('path');

// Load Phaser from the pre-built dist (not the source which has require issues)
const Phaser = require('phaser/dist/phaser.js');

// __dirname resolves to the HTML file location, so go up one level to src/
const srcDir = path.join(__dirname, '..');
const connection = require(path.join(srcDir, 'network', 'connection.js'));
const worldDiscovery = require(path.join(srcDir, 'network', 'worldDiscovery.js'));

// Boot Scene - Loading
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        fill: '#ffffff',
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create() {
    this.scene.start('LoginScene');
  }
}

// Login Scene - Title screen
class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add
      .text(width / 2, height / 2 - 100, 'RPG Game', {
        font: '48px monospace',
        fill: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 40, 'An Open-Source MMORPG', {
        font: '18px monospace',
        fill: '#888888',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, height / 2 + 40, 'Press ENTER to continue', {
        font: '20px monospace',
        fill: '#00ff00',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.statusText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.start('WorldSelectScene');
    });

    this.add
      .text(width - 10, height - 10, 'v0.1.0', {
        font: '12px monospace',
        fill: '#666666',
      })
      .setOrigin(1, 1);
  }
}

// World Select Scene - Choose which world to connect to
class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldSelectScene' });
    this.worlds = [];
    this.selectedIndex = 0;
  }

  async create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add
      .text(width / 2, 80, 'Select World', {
        font: '36px monospace',
        fill: '#ffffff',
      })
      .setOrigin(0.5);

    this.loadingText = this.add
      .text(width / 2, height / 2, 'Loading worlds...', {
        font: '20px monospace',
        fill: '#00ff00',
      })
      .setOrigin(0.5);

    try {
      this.worlds = await worldDiscovery.fetchWorlds();
      this.loadingText.destroy();

      if (this.worlds.length === 0) {
        this.displayNoWorlds();
      } else {
        this.displayWorldList();
      }
    } catch (error) {
      this.loadingText.setText('Failed to connect to server. Press ENTER to retry.');
      this.loadingText.setColor('#ff0000');

      this.input.keyboard.on('keydown-ENTER', () => {
        this.scene.restart();
      });
    }
  }

  displayNoWorlds() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add
      .text(width / 2, height / 2 - 50, 'No Worlds Available', {
        font: '28px monospace',
        fill: '#ff9900',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 + 20,
        'Make sure the game server is running\nand connected to Redis.',
        {
          font: '16px monospace',
          fill: '#888888',
          align: 'center',
        }
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 80, 'Press ENTER to retry', {
        font: '14px monospace',
        fill: '#00ff00',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.restart();
    });
  }

  displayWorldList() {
    const width = this.cameras.main.width;
    const startY = 200;
    const spacing = 80;

    this.add
      .text(width / 2, 140, 'Use UP/DOWN arrows to select, ENTER to connect', {
        font: '14px monospace',
        fill: '#888888',
      })
      .setOrigin(0.5);

    this.worldItems = this.worlds.map((world, index) => {
      const y = startY + index * spacing;
      const container = this.add.container(width / 2, y);

      const nameText = this.add
        .text(0, -20, world.name, {
          font: '24px monospace',
          fill: '#ffffff',
        })
        .setOrigin(0.5);

      const infoText = this.add
        .text(0, 10, `Players: ${world.currentPlayers}/${world.maxPlayers}`, {
          font: '16px monospace',
          fill: '#aaaaaa',
        })
        .setOrigin(0.5);

      const statusColor = this.getStatusColor(world);
      const statusText = this.add
        .text(0, 35, `● ${world.status || 'online'}`, {
          font: '14px monospace',
          fill: statusColor,
        })
        .setOrigin(0.5);

      container.add([nameText, infoText, statusText]);

      return { container, world, nameText, infoText, statusText };
    });

    this.updateSelection();

    this.input.keyboard.on('keydown-UP', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      this.selectedIndex = Math.min(this.worlds.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      this.connectToWorld();
    });
  }

  updateSelection() {
    this.worldItems.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      item.nameText.setScale(isSelected ? 1.1 : 1);
      item.nameText.setColor(isSelected ? '#00ff00' : '#ffffff');
      item.container.setAlpha(isSelected ? 1 : 0.6);
    });
  }

  async connectToWorld() {
    const selectedWorld = this.worlds[this.selectedIndex];

    if (!selectedWorld) {
      console.error('No world selected');
      return;
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const connectingText = this.add
      .text(width / 2, height - 50, `Connecting to ${selectedWorld.name}...`, {
        font: '18px monospace',
        fill: '#00ff00',
      })
      .setOrigin(0.5);

    try {
      const worldUrl = worldDiscovery.getWorldUrl(selectedWorld.worldId);

      if (!worldUrl) {
        throw new Error('World URL not found');
      }

      const token = 'demo-token';
      const playerData = await connection.connect(worldUrl, token);

      connectingText.setText('Connected! Starting game...');

      this.time.delayedCall(1000, () => {
        this.scene.start('WorldScene', {
          worldInfo: selectedWorld,
          playerData: playerData
        });
      });
    } catch (error) {
      console.error('Connection failed:', error);
      connectingText.setText('Connection failed. Press ESC to go back.');
      connectingText.setColor('#ff0000');

      this.input.keyboard.once('keydown-ESC', () => {
        connectingText.destroy();
        this.updateSelection();
      });
    }
  }

  getStatusColor(world) {
    const status = (world.status || 'online').toLowerCase();
    switch (status) {
      case 'online':
        return '#00ff00';
      case 'full':
        return '#ff9900';
      case 'offline':
        return '#ff0000';
      default:
        return '#888888';
    }
  }
}

// World Scene - Main gameplay
class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
    this.players = new Map();
    this.npcs = new Map();
    this.localPlayer = null;
    this.tileSize = 32; // Pixels per tile
    this.lastDirection = null; // Track last movement direction to prevent spam
  }

  create(data) {
    this.worldInfo = data.worldInfo;
    this.playerData = data.playerData;

    this.cursors = this.input.keyboard.createCursorKeys();

    // Create world with visible grid
    this.createWorld();

    this.add.text(10, 10, 'Use arrow keys to move', {
      font: '16px monospace',
      fill: '#ffffff',
    }).setScrollFactor(0); // Fixed to camera

    // Set up network event listeners
    this.setupNetworkHandlers();

    // Spawn local player with data from authentication
    if (this.playerData) {
      this.spawnLocalPlayer(this.playerData);
    }
  }

  createWorld() {
    // World size needs to accommodate server spawn point at tile (3200, 3200)
    // which is pixel (102400, 102400), so make world 200000x200000
    const worldSize = 200000;
    const graphics = this.add.graphics();

    // Draw grass background
    graphics.fillStyle(0x228b22, 1);
    graphics.fillRect(0, 0, worldSize, worldSize);

    // Draw grid lines every 10 tiles (320 pixels) for performance
    graphics.lineStyle(1, 0x1a5c1a, 0.3);
    const gridSpacing = this.tileSize * 10; // Draw every 10 tiles

    // Draw vertical lines
    for (let x = 0; x <= worldSize; x += gridSpacing) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, worldSize);
      graphics.strokePath();
    }

    // Draw horizontal lines
    for (let y = 0; y <= worldSize; y += gridSpacing) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(worldSize, y);
      graphics.strokePath();
    }

    // Set world bounds
    this.physics.world.setBounds(0, 0, worldSize, worldSize);
    this.cameras.main.setBounds(0, 0, worldSize, worldSize);
  }

  setupNetworkHandlers() {
    // Listen for player position updates
    connection.on('playerMoved', (data) => {
      this.updatePlayerPosition(data);
    });

    // Listen for other players spawning
    connection.on('playerSpawned', (data) => {
      this.spawnOtherPlayer(data);
    });

    // Listen for other players despawning
    connection.on('playerDespawned', (data) => {
      this.despawnPlayer(data.playerId);
    });
  }

  spawnLocalPlayer(data) {
    // Convert server tile coordinates to pixel coordinates
    const tileX = data.position?.x ?? 10;
    const tileY = data.position?.y ?? 10;
    const x = tileX * this.tileSize;
    const y = tileY * this.tileSize;

    // Create player sprite (simple circle for now)
    this.localPlayer = this.add.circle(x, y, 16, 0x3498db);
    this.localPlayer.playerId = data.playerId;
    this.localPlayer.displayName = data.displayName;
    this.localPlayer.tileX = tileX;
    this.localPlayer.tileY = tileY;

    // Add player name text above sprite
    this.localPlayer.nameText = this.add.text(x, y - 30, data.displayName, {
      font: '12px monospace',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    this.localPlayer.nameText.setOrigin(0.5);

    // Camera follows player
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
  }

  spawnOtherPlayer(data) {
    const tileX = data.position?.x ?? 0;
    const tileY = data.position?.y ?? 0;
    const x = tileX * this.tileSize;
    const y = tileY * this.tileSize;

    // Create other player sprite
    const player = this.add.circle(x, y, 16, 0xe74c3c);
    player.playerId = data.playerId || data.userId;
    player.displayName = data.displayName || data.username;
    player.tileX = tileX;
    player.tileY = tileY;

    // Add name text
    player.nameText = this.add.text(x, y - 30, player.displayName, {
      font: '12px monospace',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    player.nameText.setOrigin(0.5);

    this.players.set(player.playerId, player);
  }

  updatePlayerPosition(data) {
    // Convert server tile coordinates to pixel coordinates
    const pixelX = data.x * this.tileSize;
    const pixelY = data.y * this.tileSize;

    const player = this.players.get(data.playerId);

    if (player) {
      // Update other player position
      player.x = pixelX;
      player.y = pixelY;
      player.tileX = data.x;
      player.tileY = data.y;
      player.nameText.x = pixelX;
      player.nameText.y = pixelY - 30;
    } else if (this.localPlayer && this.localPlayer.playerId === data.playerId) {
      // Update local player position
      this.localPlayer.x = pixelX;
      this.localPlayer.y = pixelY;
      this.localPlayer.tileX = data.x;
      this.localPlayer.tileY = data.y;
      this.localPlayer.nameText.x = pixelX;
      this.localPlayer.nameText.y = pixelY - 30;
    }
  }

  despawnPlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.destroy();
      if (player.nameText) {
        player.nameText.destroy();
      }
      this.players.delete(playerId);
    }
  }

  update() {
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

    // Only send move command when key is first pressed (not held)
    if (direction && direction !== this.lastDirection) {
      connection.emit('move', { direction });
      this.lastDirection = direction;
    } else if (!direction) {
      // Reset when no keys are pressed
      this.lastDirection = null;
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#2d2d2d',
  pixelArt: true,
  scene: [BootScene, LoginScene, WorldSelectScene, WorldScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

// Start the game
const game = new Phaser.Game(config);
