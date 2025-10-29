const Phaser = require('phaser');
const worldDiscovery = require('../../network/worldDiscovery');
const connection = require('../../network/connection');

class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldSelectScene' });
    this.worlds = [];
    this.selectedIndex = 0;
  }

  async create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add
      .text(width / 2, 80, 'Select World', {
        font: '36px monospace',
        fill: '#ffffff',
      })
      .setOrigin(0.5);

    // Loading text
    this.loadingText = this.add
      .text(width / 2, height / 2, 'Loading worlds...', {
        font: '20px monospace',
        fill: '#00ff00',
      })
      .setOrigin(0.5);

    // Fetch available worlds
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

    // No worlds available message
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

    // Allow retry
    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.restart();
    });
  }

  displayWorldList() {
    const width = this.cameras.main.width;
    const startY = 200;
    const spacing = 80;

    // Instructions
    this.add
      .text(width / 2, 140, 'Use UP/DOWN arrows to select, ENTER to connect', {
        font: '14px monospace',
        fill: '#888888',
      })
      .setOrigin(0.5);

    // Display each world
    this.worldItems = this.worlds.map((world, index) => {
      const y = startY + index * spacing;

      // World container
      const container = this.add.container(width / 2, y);

      // World name
      const nameText = this.add
        .text(0, -20, world.name, {
          font: '24px monospace',
          fill: '#ffffff',
        })
        .setOrigin(0.5);

      // World info
      const infoText = this.add
        .text(0, 10, `Players: ${world.currentPlayers}/${world.maxPlayers}`, {
          font: '16px monospace',
          fill: '#aaaaaa',
        })
        .setOrigin(0.5);

      // Status indicator
      const statusColor = this.getStatusColor(world);
      const statusText = this.add
        .text(0, 35, `● ${world.status || 'online'}`, {
          font: '14px monospace',
          fill: statusColor,
        })
        .setOrigin(0.5);

      container.add([nameText, infoText, statusText]);

      return {
        container,
        world,
        nameText,
        infoText,
        statusText,
      };
    });

    // Set initial selection
    this.updateSelection();

    // Set up input
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
    // Update visual selection
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

    // Show connecting message
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const connectingText = this.add
      .text(width / 2, height - 50, `Connecting to ${selectedWorld.name}...`, {
        font: '18px monospace',
        fill: '#00ff00',
      })
      .setOrigin(0.5);

    try {
      // Get world URL
      const worldUrl = worldDiscovery.getWorldUrl(selectedWorld.worldId);

      if (!worldUrl) {
        throw new Error('World URL not found');
      }

      // TODO: Get token from authentication
      // For now, use a demo token
      const token = 'demo-token';

      // Connect to selected world
      await connection.connect(worldUrl, token);

      connectingText.setText('Connected! Starting game...');

      // Transition to game world
      this.time.delayedCall(1000, () => {
        this.scene.start('WorldScene', { worldInfo: selectedWorld });
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

module.exports = WorldSelectScene;
