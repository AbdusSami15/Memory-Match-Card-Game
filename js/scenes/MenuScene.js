class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    
    this.difficulties = [
      { id: "easy", label: "EASY", cols: 4, rows: 3, color: 0x4cc9f0 },
      { id: "medium", label: "MEDIUM", cols: 4, rows: 4, color: 0x4895ef },
      { id: "hard", label: "HARD", cols: 5, rows: 4, color: 0x4361ee }
    ];
  }

  create() {
    const { width, height } = this.scale;
    
    // Background
    if (this.textures.exists("game_bg")) {
      this.add.tileSprite(width / 2, height / 2, width, height, "game_bg");
    }

    // Play Background Music if not already playing
    const music = this.sound.get("sfx_bg");
    if (!music) {
      this.sound.play("sfx_bg", { loop: true, volume: 0.4 });
    } else if (!music.isPlaying) {
      music.play();
    }

    // Gradient Overlay for professional look
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.5, 0.5);
    gradient.fillRect(0, 0, width, height);

    // Title with HD Shadow
    const title = this.add.text(width * 0.5, height * 0.18, "MEMORY\nMATCH", {
      fontFamily: "Arial Black",
      fontSize: "82px",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 8
    }).setOrigin(0.5);
    title.setShadow(4, 4, "#3a0ca3", 2, true, true);

    // Load persisted difficulty
    const savedDiff = localStorage.getItem("memory_difficulty") || "medium";
    let selectedIdx = this.difficulties.findIndex(d => d.id === savedDiff);
    if (selectedIdx === -1) selectedIdx = 1;

    // Difficulty Section
    this.add.text(width * 0.5, height * 0.35, "SELECT DIFFICULTY", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#4cc9f0",
      letterSpacing: 4,
      fontStyle: "bold"
    }).setOrigin(0.5);

    const diffButtons = [];
    this.difficulties.forEach((diff, i) => {
      const y = height * 0.42 + i * 90;
      const btn = this.createModernButton(width * 0.5, y, diff.label, () => {
        this.selectDifficulty(i, diffButtons);
      }, 300, 70, 0x1b1b1b);
      btn.diffData = diff;
      diffButtons.push(btn);
    });

    this.selectDifficulty(selectedIdx, diffButtons, false);

    // Play Button - Vibrant & Large
    const playBtn = this.createModernButton(width * 0.5, height * 0.8, "START GAME", () => {
      const selected = diffButtons.find(b => b.isSelected);
      this.scene.start("GameScene", selected.diffData);
    }, 380, 100, 0xf72585);

    // Popup Animation for Play Button
    playBtn.setScale(0);
    playBtn.setAlpha(0);
    this.tweens.add({
      targets: playBtn,
      scale: 1,
      alpha: 1,
      duration: 800,
      delay: 600,
      ease: "Back.easeOut"
    });

    // Sound Toggle
    const isMuted = this.sound.mute;
    this.soundText = this.add.text(width * 0.5, height * 0.92, `Sound: ${isMuted ? "OFF" : "ON"}`, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#aaaaaa",
      fontStyle: "bold"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.soundText.on("pointerup", () => {
      this.toggleSound();
    });

    // Cleanup
    this.events.once("shutdown", this.cleanup, this);
  }

  selectDifficulty(index, buttons, animate = true) {
    buttons.forEach((btn, i) => {
      const isSelected = i === index;
      btn.isSelected = isSelected;
      const diffColor = this.difficulties[i].color;
      
      if (isSelected) {
        btn.bg.setStrokeStyle(4, 0xffffff, 1);
        btn.bg.setFillStyle(diffColor, 1);
        btn.txt.setColor("#ffffff");
      } else {
        btn.bg.setStrokeStyle(2, 0x444444, 1);
        btn.bg.setFillStyle(0x1b1b1b, 1);
        btn.txt.setColor("#888888");
      }
    });
    localStorage.setItem("memory_difficulty", buttons[index].diffData.id);
  }

  createModernButton(x, y, text, callback, w, h, bgColor) {
    const container = this.add.container(x, y);
    
    // Shadow
    const shadow = this.add.rectangle(4, 4, w, h, 0x000000, 0.3);
    
    // Background
    const bg = this.add.rectangle(0, 0, w, h, bgColor, 1);
    bg.setStrokeStyle(2, 0xffffff, 0.1);
    
    const txt = this.add.text(0, 0, text, {
      fontFamily: "Arial Black",
      fontSize: h * 0.35 + "px",
      color: "#ffffff"
    }).setOrigin(0.5);

    container.add([shadow, bg, txt]);
    container.bg = bg;
    container.txt = txt;

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    bg.on("pointerout", () => {
      this.tweens.add({ targets: container, scale: 1.0, duration: 100 });
    });
    bg.on("pointerdown", () => {
      this.tweens.add({ targets: container, scale: 0.95, duration: 50 });
    });
    bg.on("pointerup", () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 50, onComplete: callback });
    });

    return container;
  }

  cleanup() {
    this.tweens.killAll();
  }

  toggleSound() {
    const newMuteState = !this.sound.mute;
    this.sound.mute = newMuteState;
    localStorage.setItem("memory_muted", newMuteState);
    this.soundText.setText(`Sound: ${newMuteState ? "OFF" : "ON"}`);
  }
}


