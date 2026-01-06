class WinScene extends Phaser.Scene {
  constructor() {
    super("WinScene");
  }

  init(data) {
    this.stats = data; // { moves, time, difficultyId }
    this.isNewBest = false;
    this.checkBestRecords();
    this.stars = this.calculateStars();
  }

  calculateStars() {
    const { moves, difficultyId } = this.stats;
    if (difficultyId === "easy") {
      if (moves <= 8) return 3;
      if (moves <= 12) return 2;
      return 1;
    } else if (difficultyId === "medium") {
      if (moves <= 12) return 3;
      if (moves <= 18) return 2;
      return 1;
    } else { // hard
      if (moves <= 16) return 3;
      if (moves <= 24) return 2;
      return 1;
    }
  }

  checkBestRecords() {
    const diffId = this.stats.difficultyId;
    const movesKey = `bestMoves_${diffId}`;
    const timeKey = `bestTime_${diffId}`;

    const bestMoves = localStorage.getItem(movesKey);
    const bestTime = localStorage.getItem(timeKey);

    // If no record exists, or current is better
    const isBetterMoves = bestMoves === null || this.stats.moves < parseInt(bestMoves);
    const isBetterTime = bestTime === null || this.stats.time < parseInt(bestTime);

    if (isBetterMoves || isBetterTime) {
      this.isNewBest = true;
    }

    if (isBetterMoves) localStorage.setItem(movesKey, this.stats.moves);
    if (isBetterTime) localStorage.setItem(timeKey, this.stats.time);
  }

  create() {
    const { width, height } = this.scale;

    // Background
    if (this.textures.exists("game_bg")) {
      this.winBg = this.add.tileSprite(width / 2, height / 2, width, height, "game_bg");
    }

    // Semi-transparent overlay with fade-in - Professional Deep Blue/Black
    this.winOverlay = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 0);
    
    this.tweens.add({
      targets: this.winOverlay,
      fillAlpha: 0.85,
      duration: 600
    });

    this.winContainer = this.add.container(width * 0.5, height * 0.5);
    this.winContainer.setAlpha(0);
    this.winContainer.setScale(0.8);

    const panel = this.add.rectangle(0, 40, 520, 620, 0x1b1b1b, 1);
    panel.setStrokeStyle(6, 0x4cc9f0, 1);

    // New Best Banner
    if (this.isNewBest) {
      const banner = this.add.text(0, -240, "NEW BEST RECORD!", {
        fontFamily: "Arial Black",
        fontSize: "32px",
        color: "#ffca3a",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);
      this.winContainer.add(banner);

      this.tweens.add({
        targets: banner,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    const title = this.add.text(0, -160, "VICTORY!", {
      fontFamily: "Arial Black",
      fontSize: "72px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    // Stars Rating
    const starsContainer = this.add.container(0, -75);
    for (let i = 0; i < 3; i++) {
      const isFull = i < this.stars;
      const star = this.add.text((i - 1) * 80, 0, isFull ? "★" : "☆", {
        fontFamily: "Arial Black",
        fontSize: "72px",
        color: isFull ? "#ffca3a" : "#333333"
      }).setOrigin(0.5);
      starsContainer.add(star);
      
      if (isFull) {
        this.tweens.add({
          targets: star,
          scale: 1.2,
          duration: 400,
          delay: 200 + i * 200,
          yoyo: true,
          ease: "Back.easeOut"
        });
      }
    }
    this.winContainer.add(starsContainer);

    const sub = this.add.text(0, 40, `MOVES: ${this.stats.moves}\nTIME: ${this.formatTime(this.stats.time)}\nDIFFICULTY: ${this.stats.difficultyId.toUpperCase()}`, {
      fontFamily: "Arial Black",
      fontSize: "26px",
      color: "#4cc9f0",
      align: "center",
      lineSpacing: 12
    }).setOrigin(0.5);

    // Buttons
    const restartBtn = this.createModernButton(0, 160, "PLAY AGAIN", () => {
      const menu = this.scene.get("MenuScene");
      const diffData = menu.difficulties.find(d => d.id === this.stats.difficultyId);
      this.scene.start("GameScene", diffData);
    }, 340, 80, 0x4361ee);

    const homeBtn = this.createModernButton(0, 260, "MAIN MENU", () => {
      this.scene.start("MenuScene");
    }, 340, 80, 0xf72585);

    this.winContainer.add([panel, title, sub, ...restartBtn, ...homeBtn]);

    // Celebratory Particles
    this.createVictoryParticles();

    // Resize Handler
    this.scale.on("resize", this.handleResize, this);

    // Cleanup
    this.events.once("shutdown", this.cleanup, this);

    // Animate container in
    this.tweens.add({
      targets: this.winContainer,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: "Back.easeOut"
    });
  }

  createVictoryParticles() {
    const { width, height } = this.scale;
    
    // Create an emitter for colorful confetti
    const particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: -20,
      lifespan: 3000,
      speedY: { min: 200, max: 400 },
      speedX: { min: -50, max: 50 },
      scale: { start: 0.4, end: 0 },
      rotate: { min: 0, max: 360 },
      tint: [ 0x4cc9f0, 0x4361ee, 0xf72585, 0xffca3a, 0x4895ef ],
      gravityY: 200,
      frequency: 50,
      maxParticles: 150
    });

    // Bring container to front so particles are behind the panel
    this.children.bringToTop(this.winContainer);
  }

  createModernButton(x, y, text, callback, w, h, bgColor) {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, w, h, bgColor, 1);
    bg.setStrokeStyle(2, 0xffffff, 0.2);
    
    const txt = this.add.text(0, 0, text, {
      fontFamily: "Arial Black",
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    container.add([bg, txt]);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => this.tweens.add({ targets: container, scale: 1.05, duration: 100 }));
    bg.on("pointerout", () => this.tweens.add({ targets: container, scale: 1.0, duration: 100 }));
    bg.on("pointerdown", () => this.tweens.add({ targets: container, scale: 0.95, duration: 50 }));
    bg.on("pointerup", () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 50, onComplete: callback });
    });

    return [container];
  }

  handleResize() {
    const { width, height } = this.scale;
    if (this.winBg) {
      this.winBg.setPosition(width / 2, height / 2).setSize(width, height);
    }
    if (this.winOverlay) {
      this.winOverlay.setPosition(width * 0.5, height * 0.5).setDisplaySize(width, height);
    }
    if (this.winContainer) {
      this.winContainer.setPosition(width * 0.5, height * 0.5);
    }
  }

  cleanup() {
    this.scale.off("resize", this.handleResize, this);
    this.tweens.killAll();
    
    // Stop all particle emitters
    this.children.list.forEach(child => {
      if (child.stop) child.stop();
    });
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  createButton(x, y, text, callback) {
    const btnBg = this.add.rectangle(x, y, 220, 70, 0xffffff, 1);
    btnBg.setStrokeStyle(3, 0x000000, 0.25);
    const btnText = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "30px",
      color: "#111111",
      fontStyle: "bold",
    }).setOrigin(0.5);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerup", () => {
      this.tweens.add({
        targets: [btnBg, btnText],
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback
      });
    });

    return [btnBg, btnText];
  }
}

