const Phaser = require('phaser');

class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add
      .text(width / 2, height / 2 - 100, 'RPG Game', {
        font: '48px monospace',
        fill: '#ffffff',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(width / 2, height / 2 - 40, 'An Open-Source MMORPG', {
        font: '18px monospace',
        fill: '#888888',
      })
      .setOrigin(0.5);

    // Instructions
    this.statusText = this.add
      .text(width / 2, height / 2 + 40, 'Press ENTER to continue', {
        font: '20px monospace',
        fill: '#00ff00',
      })
      .setOrigin(0.5);

    // Flashing animation for the continue text
    this.tweens.add({
      targets: this.statusText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Handle Enter key to proceed to world selection
    this.input.keyboard.on('keydown-ENTER', () => {
      this.goToWorldSelect();
    });

    // Version info (bottom right)
    // Note: Version would be loaded from electron API in production
    this.add
      .text(width - 10, height - 10, 'v0.1.0', {
        font: '12px monospace',
        fill: '#666666',
      })
      .setOrigin(1, 1);
  }

  goToWorldSelect() {
    this.scene.start('WorldSelectScene');
  }
}

module.exports = LoginScene;
