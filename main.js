class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");

    this.cards = [];
    this.firstSelected = null;
    this.secondSelected = null;
    this.isBusy = false;

    this.totalPairs = 8; // 16 cards
    this.matches = 0;
    this.turns = 0;

    this.uiText = null;
    this.winContainer = null;
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#1b1b1b");

    this.matches = 0;
    this.turns = 0;
    this.firstSelected = null;
    this.secondSelected = null;
    this.isBusy = false;
    this.cards = [];

    this.uiText = this.add.text(width * 0.5, 40, "", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.updateUI();

    this.createDeck();
    this.createGrid();

    this.createWinUI();
    this.winContainer.setVisible(false);

    // Simple resize support (keeps the scene centered)
    this.scale.on("resize", () => {
      const w = this.scale.width;
      this.uiText.setPosition(w * 0.5, 40);
      if (this.winContainer) this.winContainer.setPosition(w * 0.5, height * 0.5);
    });
  }

  // --- Deck + Grid ---
  createDeck() {
    // Build pair IDs twice: [0,0,1,1,...]
    const ids = [];
    for (let i = 0; i < this.totalPairs; i++) {
      ids.push(i);
      ids.push(i);
    }
    this.shuffleArray(ids);
    this.deckIds = ids;
  }

  createGrid() {
    const { width, height } = this.scale;

    const cols = 4;
    const rows = (this.totalPairs * 2) / cols;

    const cardW = 140;
    const cardH = 180;
    const gap = 20;

    const gridW = cols * cardW + (cols - 1) * gap;
    const gridH = rows * cardH + (rows - 1) * gap;

    const startX = (width - gridW) * 0.5 + cardW * 0.5;
    const startY = (height - gridH) * 0.5 + cardH * 0.5 + 40;

    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (cardW + gap);
        const y = startY + r * (cardH + gap);

        const id = this.deckIds[index++];
        const card = this.createCard(x, y, cardW, cardH, id);
        this.cards.push(card);
      }
    }
  }

  createCard(x, y, w, h, cardId) {
    const container = this.add.container(x, y);
    container.setSize(w, h);

    // Back face
    const back = this.add.rectangle(0, 0, w, h, 0x2d2d2d, 1);
    back.setStrokeStyle(4, 0xffffff, 0.25);

    const backLabel = this.add.text(0, 0, "?", {
      fontFamily: "Arial",
      fontSize: "64px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Front face
    const frontColor = this.colorForId(cardId);
    const front = this.add.rectangle(0, 0, w, h, frontColor, 1);
    front.setStrokeStyle(4, 0x000000, 0.2);

    const frontLabel = this.add.text(0, 0, String(cardId + 1), {
      fontFamily: "Arial",
      fontSize: "54px",
      color: "#111111",
    }).setOrigin(0.5);

    front.setVisible(false);
    frontLabel.setVisible(false);

    container.add([back, backLabel, front, frontLabel]);

    // State
    container.cardId = cardId;
    container.isFaceUp = false;
    container.isMatched = false;
    container.back = back;
    container.backLabel = backLabel;
    container.front = front;
    container.frontLabel = frontLabel;

    // Input (mouse + touch via pointer)
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    container.on("pointerdown", () => this.onCardPressed(container));

    return container;
  }

  // --- Input / Logic ---
  onCardPressed(card) {
    if (this.isBusy) return;
    if (card.isMatched) return;
    if (card.isFaceUp) return;

    this.flipUp(card, () => {
      if (!this.firstSelected) {
        this.firstSelected = card;
        return;
      }

      this.secondSelected = card;
      this.turns += 1;
      this.updateUI();

      this.checkMatch();
    });
  }

  checkMatch() {
    if (!this.firstSelected || !this.secondSelected) return;

    const a = this.firstSelected;
    const b = this.secondSelected;

    if (a.cardId === b.cardId) {
      a.isMatched = true;
      b.isMatched = true;
      this.firstSelected = null;
      this.secondSelected = null;

      this.matches += 1;
      this.updateUI();

      if (this.matches === this.totalPairs) {
        this.showWin();
      }
      return;
    }

    // Not match
    this.isBusy = true;
    this.time.delayedCall(1000, () => {
      this.flipDown(a);
      this.flipDown(b);

      this.firstSelected = null;
      this.secondSelected = null;
      this.isBusy = false;
    });
  }

  // --- Flip Animations ---
  flipUp(card, onDone) {
    this.isBusy = true;

    this.tweens.add({
      targets: card,
      scaleX: 0,
      duration: 120,
      onComplete: () => {
        card.back.setVisible(false);
        card.backLabel.setVisible(false);
        card.front.setVisible(true);
        card.frontLabel.setVisible(true);
        card.isFaceUp = true;

        this.tweens.add({
          targets: card,
          scaleX: 1,
          duration: 120,
          onComplete: () => {
            this.isBusy = false;
            if (onDone) onDone();
          }
        });
      }
    });
  }

  flipDown(card) {
    this.tweens.add({
      targets: card,
      scaleX: 0,
      duration: 120,
      onComplete: () => {
        card.front.setVisible(false);
        card.frontLabel.setVisible(false);
        card.back.setVisible(true);
        card.backLabel.setVisible(true);
        card.isFaceUp = false;

        this.tweens.add({
          targets: card,
          scaleX: 1,
          duration: 120
        });
      }
    });
  }

  // --- UI ---
  updateUI() {
    this.uiText.setText(`Turns: ${this.turns}   Matches: ${this.matches}/${this.totalPairs}`);
  }

  createWinUI() {
    const { width, height } = this.scale;

    const container = this.add.container(width * 0.5, height * 0.5);

    const panel = this.add.rectangle(0, 0, 520, 320, 0x000000, 0.75);
    panel.setStrokeStyle(4, 0xffffff, 0.25);

    const title = this.add.text(0, -70, "YOU WIN!", {
      fontFamily: "Arial",
      fontSize: "56px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const sub = this.add.text(0, 0, "", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const btnBg = this.add.rectangle(0, 90, 220, 70, 0xffffff, 1);
    btnBg.setStrokeStyle(3, 0x000000, 0.25);
    const btnText = this.add.text(0, 90, "Restart", {
      fontFamily: "Arial",
      fontSize: "30px",
      color: "#111111",
      fontStyle: "bold",
    }).setOrigin(0.5);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerdown", () => {
      this.scene.restart();
    });

    container.add([panel, title, sub, btnBg, btnText]);

    container.subText = sub;
    this.winContainer = container;
  }

  showWin() {
    this.isBusy = true;
    this.winContainer.subText.setText(`Completed in ${this.turns} turns`);
    this.winContainer.setVisible(true);

    // Optional: disable card input
    for (const c of this.cards) c.disableInteractive();
  }

  // --- Helpers ---
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  colorForId(id) {
    // Deterministic colors per ID (no assets needed)
    const palette = [
      0xff595e, 0xffca3a, 0x8ac926, 0x1982c4,
      0x6a4c93, 0x00bbf9, 0xf72585, 0xff9f1c,
      0x2ec4b6, 0xe71d36, 0x9b5de5, 0x00f5d4
    ];
    return palette[id % palette.length];
  }
}

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
  scene: [MainScene]
};

new Phaser.Game(config);
