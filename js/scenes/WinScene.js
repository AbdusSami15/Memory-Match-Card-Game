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

    // Semi-transparent overlay with fade-in
    this.winOverlay = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 0);
    
    this.tweens.add({
      targets: this.winOverlay,
      fillAlpha: 0.75,
      duration: 600
    });

    this.winContainer = this.add.container(width * 0.5, height * 0.5);
    this.winContainer.setAlpha(0);
    this.winContainer.setScale(0.9);

    const panel = this.add.rectangle(0, 40, 520, 580, 0x1b1b1b, 1);
    panel.setStrokeStyle(4, 0xffffff, 0.25);

    // New Best Banner
    if (this.isNewBest) {
      const banner = this.add.text(0, -210, "NEW BEST RECORD!", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#ffca3a",
        fontStyle: "bold"
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

    const title = this.add.text(0, -140, "YOU WIN!", {
      fontFamily: "Arial",
      fontSize: "64px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Stars Rating
    const starsContainer = this.add.container(0, -75);
    for (let i = 0; i < 3; i++) {
      const isFull = i < this.stars;
      const star = this.add.text((i - 1) * 60, 0, isFull ? "★" : "☆", {
        fontFamily: "Arial",
        fontSize: "54px",
        color: isFull ? "#ffca3a" : "#444444"
      }).setOrigin(0.5);
      starsContainer.add(star);
      
      if (isFull) {
        this.tweens.add({
          targets: star,
          scale: 1.2,
          duration: 400,
          delay: i * 150,
          yoyo: true,
          ease: "Back.easeOut"
        });
      }
    }
    this.winContainer.add(starsContainer);

    const sub = this.add.text(0, 20, `Moves: ${this.stats.moves}\nTime: ${this.formatTime(this.stats.time)}\nDifficulty: ${this.stats.difficultyId.toUpperCase()}`, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);

    // Restart Button
    const restartBtn = this.createButton(0, 130, "Restart", () => {
      // Find the difficulty data to restart with
      const menu = this.scene.get("MenuScene");
      const diffData = menu.difficulties.find(d => d.id === this.stats.difficultyId);
      this.scene.start("GameScene", diffData);
    });

    // Home Button
    const homeBtn = this.createButton(0, 220, "Menu", () => {
      this.scene.start("MenuScene");
    });

    this.winContainer.add([panel, title, sub, ...restartBtn, ...homeBtn]);

    // Resize Handler
    this.scale.on("resize", this.handleResize, this);

    // Cleanup
    this.events.once("shutdown", this.cleanup, this);

    // Animate container in
    this.tweens.add({
      targets: this.winContainer,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut"
    });
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

