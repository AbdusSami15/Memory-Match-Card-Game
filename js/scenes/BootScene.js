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
    this.load.audio("flip", "assets/audio/flip.wav");
    this.load.audio("match", "assets/audio/match.wav");
    this.load.audio("mismatch", "assets/audio/mismatch.wav");
    this.load.audio("win", "assets/audio/win.wav");

    // Initialize Mute State from localStorage
    const isMuted = localStorage.getItem("memory_muted") === "true";
    this.sound.mute = isMuted;

    // Dummy load if no real assets are being added yet to see the bar
    if (this.load.totalToLoad === 0) {
       // Just a small delay or a dummy asset to ensure complete event triggers nicely
       this.load.image("pixel", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
    }
  }
}
