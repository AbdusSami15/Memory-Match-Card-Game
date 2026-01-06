class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    
    this.difficulties = [
      { id: "easy", label: "EASY", cols: 4, rows: 3 },
      { id: "medium", label: "MEDIUM", cols: 4, rows: 4 },
      { id: "hard", label: "HARD", cols: 5, rows: 4 }
    ];
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#1b1b1b");

    // Title
    this.add.text(width * 0.5, height * 0.15, "MEMORY MATCH", {
      fontFamily: "Arial",
      fontSize: "64px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Load persisted difficulty
    const savedDiff = localStorage.getItem("memory_difficulty") || "medium";
    let selectedIdx = this.difficulties.findIndex(d => d.id === savedDiff);
    if (selectedIdx === -1) selectedIdx = 1;

    // Difficulty Selection
    this.add.text(width * 0.5, height * 0.3, "SELECT DIFFICULTY", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    const diffButtons = [];
    this.difficulties.forEach((diff, i) => {
      const y = height * 0.4 + i * 90;
      const btn = this.createButton(width * 0.5, y, diff.label, () => {
        this.selectDifficulty(i, diffButtons);
      }, 240, 70);
      btn.diffData = diff;
      diffButtons.push(btn);
    });

    this.selectDifficulty(selectedIdx, diffButtons, false);

    // Play Button
    this.createButton(width * 0.5, height * 0.8, "PLAY GAME", () => {
      const selected = diffButtons.find(b => b.isSelected);
      this.scene.start("GameScene", selected.diffData);
    }, 320, 90, 0x1982c4);

    // Sound Toggle
    const isMuted = this.sound.mute;
    this.soundText = this.add.text(width * 0.5, height * 0.92, `Sound: ${isMuted ? "OFF" : "ON"}`, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#aaaaaa"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.soundText.on("pointerup", () => {
      this.toggleSound();
    });

    // Cleanup
    this.events.once("shutdown", this.cleanup, this);
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

  selectDifficulty(index, buttons, animate = true) {
    buttons.forEach((btn, i) => {
      const isSelected = i === index;
      btn.isSelected = isSelected;
      btn.setStrokeStyle(4, isSelected ? 0xffffff : 0x000000, isSelected ? 1 : 0.25);
      btn.setFillStyle(isSelected ? 0x444444 : 0xffffff, 1);
      btn.txt.setColor(isSelected ? "#ffffff" : "#111111");
    });
    localStorage.setItem("memory_difficulty", buttons[index].diffData.id);
  }

  createButton(x, y, text, callback, w = 280, h = 80, bgColor = 0xffffff) {
    const btnBg = this.add.rectangle(x, y, w, h, bgColor, 1);
    btnBg.setStrokeStyle(4, 0x000000, 0.25);
    
    const btnText = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: bgColor === 0xffffff ? "#111111" : "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    btnBg.txt = btnText;

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

    return btnBg;
  }
}


