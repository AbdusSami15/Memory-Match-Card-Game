class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const { width, height } = this.scale;

    // Loading Bar background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

    // Loading Bar progress
    const progressBar = this.add.graphics();

    // Texts
    const loadingText = this.add.text(width / 2, height / 2 - 60, "Loading...", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, "0%", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const assetText = this.add.text(width / 2, height / 2 + 60, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    // Update Progress
    this.load.on("progress", (value) => {
      percentText.setText(parseInt(value * 100) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 5);
    });

    this.load.on("fileprogress", (file) => {
      assetText.setText("Loading: " + file.key);
    });

    this.load.on("complete", () => {
      loadingText.setText("Ready!");
      this.createProceduralBackground();
      this.time.delayedCall(500, () => {
        this.scene.start("MenuScene");
      });
    });

    // Fallback: If an asset fails to load, it won't crash the scene start
    this.load.on("loaderror", (file) => {
      console.warn("Asset load failed: " + file.key);
    });

    // --- Asset Preloading ---
    // In a CDN-friendly structure, these would usually be in an /assets folder
    
    // Images
    this.load.image("card_back", "assets/images/cards/back.png");
    this.load.image("bg", "assets/background.png");
    
    // Load card faces (Kenney pack: front_01.png to front_08.png)
    for (let i = 1; i <= 8; i++) {
      const id = i.toString().padStart(2, "0");
      this.load.image(`card_front_${id}`, `assets/images/cards/front_${id}.png`);
    }

    // Audio
    this.load.audio("sfx_flip", "assets/audio/flip.wav");
    this.load.audio("match", "assets/audio/match.wav");
    this.load.audio("mismatch", "assets/audio/mismatch.wav");
    this.load.audio("win", "assets/audio/win.wav");
    this.load.audio("sfx_bg", "assets/audio/bg.wav");

    // Initialize Mute State from localStorage
    const isMuted = localStorage.getItem("memory_muted") === "true";
    this.sound.mute = isMuted;

    // Dummy load if no real assets are being added yet to see the bar
    if (this.load.totalToLoad === 0) {
       // Just a small delay or a dummy asset to ensure complete event triggers nicely
       this.load.image("pixel", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
    }
  }

  createProceduralBackground() {
    const size = 512;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Deep Charcoal/Grey Gradient-like base
    // We'll fill with a dark grey and add some subtle variations
    graphics.fillStyle(0x1a1a1a); 
    graphics.fillRect(0, 0, size, size);

    // 2. Add professional "Carbon Fiber" or "Tech" pattern
    // Fine dots for a clean look
    graphics.fillStyle(0xffffff, 0.03);
    for (let x = 0; x < size; x += 4) {
      for (let y = 0; y < size; y += 4) {
        if ((x + y) % 8 === 0) {
          graphics.fillPoint(x, y);
        }
      }
    }

    // 3. Very subtle cross-hatch/grid for structure
    graphics.lineStyle(1, 0xffffff, 0.02);
    graphics.strokeRect(0, 0, size, size);
    
    // Add a center highlight feel (even though it's tiled, we can simulate texture)
    graphics.fillStyle(0x222222, 0.5);
    graphics.fillCircle(size / 2, size / 2, size / 2);

    // Generate texture
    graphics.generateTexture('game_bg', size, size);
    
    // Create a small white circle for particles
    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('particle', 16, 16);

    graphics.destroy();
  }
}
