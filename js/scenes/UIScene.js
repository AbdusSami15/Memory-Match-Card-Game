class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
    this.totalPairs = 8;
    this.elapsedTime = 0;
  }

  init(data) {
    if (data && data.totalPairs) {
      this.totalPairs = data.totalPairs;
    }
  }

  create() {
    const { width, height } = this.scale;
    this.elapsedTime = 0;

    // HUD Background Bar - Sleek modern look
    this.hudBar = this.add.rectangle(width * 0.5, 45, width, 90, 0x000000, 0.6);
    this.hudBorder = this.add.rectangle(width * 0.5, 90, width, 2, 0x4cc9f0, 0.3);

    // HUD Container - Left aligned to prevent button overlap
    this.hudText = this.add.text(15, 45, "", {
      fontFamily: "Arial Black",
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0, 0.5);

    this.updateHUDText(0, 0);

    // Timer Event
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.elapsedTime++;
        this.updateHUDText();
      },
      loop: true
    });

    // Listen to events from GameScene
    const gameScene = this.scene.get("GameScene");
    gameScene.events.on("update-ui", (data) => {
      this.updateHUDText(data.turns, data.matches);
    }, this);

    // Handle Resize
    this.scale.on("resize", this.handleResize, this);

    // Pause Button
    this.pauseBtn = this.add.text(width - 35, 45, "II", {
      fontFamily: "Arial Black",
      fontSize: "36px",
      color: "#ffffff"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.pauseBtn.on("pointerover", () => this.pauseBtn.setScale(1.1));
    this.pauseBtn.on("pointerout", () => this.pauseBtn.setScale(1.0));
    this.pauseBtn.on("pointerup", () => {
      this.togglePause();
    });

    // Sound Button
    const isMuted = this.sound.mute;
    this.soundBtn = this.add.text(width - 95, 45, isMuted ? "🔇" : "🔊", {
      fontSize: "32px"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.soundBtn.on("pointerover", () => this.soundBtn.setScale(1.1));
    this.soundBtn.on("pointerout", () => this.soundBtn.setScale(1.0));
    this.soundBtn.on("pointerup", () => {
      this.toggleSound();
    });

    // Create Pause Overlay (hidden by default)
    this.createPauseOverlay();

    // Initial layout
    this.handleResize();

    // Cleanup
    this.events.once("shutdown", this.cleanup, this);
  }

  handleResize() {
    const { width } = this.scale;
    const isSmall = width < 480;

    if (this.hudBar) this.hudBar.setPosition(width * 0.5, 45).setSize(width, 90);
    if (this.hudBorder) this.hudBorder.setPosition(width * 0.5, 90).setSize(width, 2);

    if (this.hudText) {
      this.hudText.setX(Math.max(10, width * 0.02));
      this.hudText.setFontSize(isSmall ? "14px" : "18px");
    }

    if (this.pauseBtn) {
      this.pauseBtn.setX(width - 25);
      this.pauseBtn.setFontSize(isSmall ? "28px" : "36px");
    }
    if (this.soundBtn) {
      this.soundBtn.setX(width - 70);
      this.soundBtn.setFontSize(isSmall ? "24px" : "32px");
    }

    // Pause Overlay resize
    if (this.pauseOverlay && this.pauseOverlay.visible) {
      const { height } = this.scale;
      if (this.pauseOverlayBg) this.pauseOverlayBg.setSize(width, height).setPosition(width * 0.5, height * 0.5);
      if (this.pausePanel) this.pausePanel.setPosition(width * 0.5, height * 0.5);
    }
  }


  cleanup() {
    const gameScene = this.scene.get("GameScene");
    if (gameScene) {
      gameScene.events.off("update-ui");
    }

    this.scale.off("resize");

    if (this.timeEvent) {
      this.timeEvent.destroy();
      this.timeEvent = null;
    }

    this.tweens.killAll();
  }

  createPauseOverlay() {
    const { width, height } = this.scale;

    this.pauseOverlay = this.add.container(0, 0).setVisible(false).setDepth(100);

    // Background Dim
    const bg = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 0.85);
    bg.setInteractive(); // Block input to scenes below

    const panel = this.add.container(width * 0.5, height * 0.5);

    const rect = this.add.rectangle(0, 0, 420, 500, 0x1b1b1b, 1);
    rect.setStrokeStyle(4, 0x4cc9f0, 1);

    const title = this.add.text(0, -160, "PAUSED", {
      fontFamily: "Arial Black",
      fontSize: "52px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Buttons
    const resumeBtn = this.createOverlayButton(0, -40, "RESUME", () => this.togglePause(), 0x4cc9f0);
    const restartBtn = this.createOverlayButton(0, 60, "RESTART", () => {
      this.togglePause();
      const gameScene = this.scene.get("GameScene");
      gameScene.scene.restart();
    }, 0x4895ef);
    const homeBtn = this.createOverlayButton(0, 160, "HOME", () => {
      this.togglePause();
      this.scene.stop("GameScene");
      this.scene.start("MenuScene");
    }, 0xf72585);

    panel.add([rect, title, ...resumeBtn, ...restartBtn, ...homeBtn]);
    this.pauseOverlay.add([bg, panel]);

    // Store references for handleResize
    this.pauseOverlayBg = bg;
    this.pausePanel = panel;
  }

  createOverlayButton(x, y, text, callback, color) {
    const container = this.add.container(x, y);

    const btnBg = this.add.rectangle(0, 0, 300, 80, color, 1);
    btnBg.setStrokeStyle(2, 0xffffff, 0.3);

    const btnText = this.add.text(0, 0, text, {
      fontFamily: "Arial Black",
      fontSize: "30px",
      color: "#ffffff"
    }).setOrigin(0.5);

    container.add([btnBg, btnText]);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerover", () => container.setScale(1.05));
    btnBg.on("pointerout", () => container.setScale(1.0));
    btnBg.on("pointerdown", () => container.setScale(0.95));
    btnBg.on("pointerup", () => {
      container.setScale(1.05);
      callback();
    });

    return [container];
  }

  togglePause() {
    const isPaused = this.scene.isPaused("GameScene");
    const gameScene = this.scene.get("GameScene");

    if (isPaused) {
      this.scene.resume("GameScene");
      this.timeEvent.paused = false;
      this.pauseBtn.setText("II");
      this.pauseOverlay.setVisible(false);
    } else {
      this.scene.pause("GameScene");
      this.timeEvent.paused = true;
      this.pauseBtn.setText("▶");
      this.pauseOverlay.setVisible(true);
    }
  }

  toggleSound() {
    const newMuteState = !this.sound.mute;
    this.sound.mute = newMuteState;
    localStorage.setItem("memory_muted", newMuteState);
    this.soundBtn.setText(newMuteState ? "🔇" : "🔊");
  }

  updateHUDText(moves, matches) {
    if (moves !== undefined) this.currentMoves = moves;
    if (matches !== undefined) this.currentMatches = matches;

    const timeStr = this.formatTime(this.elapsedTime);
    this.hudText.setText(
      `MOVES: ${this.currentMoves}   MATCHES: ${this.currentMatches}/${this.totalPairs}   TIME: ${timeStr}`
    );
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}


