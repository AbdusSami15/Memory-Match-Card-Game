const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#111111",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280
  },
  // Load scenes in order. BootScene will start first.
  scene: [BootScene, MenuScene, GameScene, UIScene, WinScene]
};

// Global game instance
const game = new Phaser.Game(config);


