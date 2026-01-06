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

    // HUD Container for easy positioning
    this.hudText = this.add.text(width * 0.5, 45, "", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

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
    this.scale.on("resize", () => {
      const { width } = this.scale;
      this.hudText.setX(width * 0.5);
      this.pauseBtn.setX(width - 40);
      this.soundBtn.setX(width - 90);
    });

    // Pause Button
    this.pauseBtn = this.add.text(width - 40, 45, "II", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.pauseBtn.on("pointerup", () => {
      this.togglePause();
    });

    // Sound Button
    const isMuted = this.sound.mute;
    this.soundBtn = this.add.text(width - 90, 45, isMuted ? "🔇" : "🔊", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.soundBtn.on("pointerup", () => {
      this.toggleSound();
    });

    // Create Pause Overlay (hidden by default)
    this.createPauseOverlay();

    // Cleanup
    this.events.once("shutdown", this.cleanup, this);
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
    const bg = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 0.7);
    bg.setInteractive(); // Block input to scenes below

    const panel = this.add.container(width * 0.5, height * 0.5);
    
    const rect = this.add.rectangle(0, 0, 400, 450, 0x1b1b1b, 1);
    rect.setStrokeStyle(4, 0xffffff, 0.2);

    const title = this.add.text(0, -140, "PAUSED", {
      fontFamily: "Arial",
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Buttons
    const resumeBtn = this.createOverlayButton(0, -40, "RESUME", () => this.togglePause());
    const restartBtn = this.createOverlayButton(0, 50, "RESTART", () => {
      this.togglePause();
      const gameScene = this.scene.get("GameScene");
      gameScene.scene.restart();
    });
    const homeBtn = this.createOverlayButton(0, 140, "HOME", () => {
      this.togglePause();
      this.scene.stop("GameScene");
      this.scene.start("MenuScene");
    });

    panel.add([rect, title, ...resumeBtn, ...restartBtn, ...homeBtn]);
    this.pauseOverlay.add([bg, panel]);

    // Handle Resize for Overlay
    this.scale.on("resize", () => {
      const { width, height } = this.scale;
      bg.setSize(width, height).setPosition(width * 0.5, height * 0.5);
      panel.setPosition(width * 0.5, height * 0.5);
    });
  }

  createOverlayButton(x, y, text, callback) {
    const btnBg = this.add.rectangle(x, y, 280, 70, 0xffffff, 1);
    btnBg.setStrokeStyle(2, 0x000000, 0.2);
    const btnText = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#111111",
      fontStyle: "bold"
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


