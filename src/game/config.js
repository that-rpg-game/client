// Game configuration for Phaser
// Scenes are loaded in renderer.js

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#2d2d2d',
  pixelArt: true,
  scene: [], // Scenes will be added in renderer.js
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};
