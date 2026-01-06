class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    // States
    this.STATES = {
      PREVIEW: "PREVIEW",
      IDLE: "IDLE",
      ONE_SELECTED: "ONE_SELECTED",
      RESOLVING: "RESOLVING",
      WIN: "WIN"
    };

    this.cards = [];
    this.firstSelected = null;
    this.secondSelected = null;
    this.state = this.STATES.IDLE;

    // Default configuration (overridden in init)
    this.config = {
      cols: 4,
      rows: 4
    };
    
    this.totalPairs = 8;
    this.matches = 0;
    this.turns = 0;
    this.startTime = 0;
  }

  init(data) {
    if (data && data.cols && data.rows) {
      this.config = data;
    }
    this.difficultyId = this.config.id || "medium";
    this.totalPairs = (this.config.cols * this.config.rows) / 2;

    // Difficulty-based mismatch delays
    const delays = { easy: 800, medium: 1000, hard: 1200 };
    this.mismatchDelay = delays[this.difficultyId] || 1000;
  }

  create() {
    const { width, height } = this.scale;

    // Background Fallback
    if (this.textures.exists("bg")) {
      this.bg = this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);
    } else {
      this.cameras.main.setBackgroundColor("#1b1b1b");
    }

    this.matches = 0;
    this.turns = 0;
    this.firstSelected = null;
    this.secondSelected = null;
    this.state = this.STATES.PREVIEW;
    this.cards = [];
    this.startTime = this.time.now;

    this.input.setTopOnly(true);
    this.lastInputTime = 0;

    // Start UI Scene
    this.scene.launch("UIScene", { totalPairs: this.totalPairs });

    this.createDeck();
    this.createGrid();

    // Trigger Preview Phase
    this.startPreview();

    // Resize support
    this.scale.on("resize", this.handleResize, this);

    // Cleanup
    this.events.once("shutdown", this.cleanup, this);
  }

  cleanup() {
    // 1. Remove resize listener
    this.scale.off("resize", this.handleResize, this);

    // 2. Stop all timers and tweens
    this.time.removeAllEvents();
    this.tweens.killAll();

    // 3. Clean up cards
    this.cards.forEach(card => {
      card.removeAllListeners();
      card.destroy();
    });

    // 4. Clear references
    this.cards = [];
    this.firstSelected = null;
    this.secondSelected = null;
  }

  startPreview() {
    this.time.delayedCall(500, () => {
      // 1. Flip all up
      let completed = 0;
      this.cards.forEach(card => {
        this.flipUp(card, () => {
          completed++;
          if (completed === this.cards.length) {
            // 2. Wait 1s
            this.time.delayedCall(1000, () => {
              // 3. Flip all down
              let downCompleted = 0;
              this.cards.forEach(c => {
                this.flipDown(c, () => {
                  downCompleted++;
                  if (downCompleted === this.cards.length) {
                    // 4. Enable input
                    this.state = this.STATES.IDLE;
                    this.startTime = this.time.now; // Reset start time after preview
                  }
                });
              });
            });
          }
        });
      });
    });
  }

  handleResize() {
    const { width, height } = this.scale;
    if (this.bg) {
      this.bg.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    }
    this.createGrid(true); // Re-layout cards
  }

  createDeck() {
    const ids = [];
    for (let i = 0; i < this.totalPairs; i++) {
      ids.push(i);
      ids.push(i);
    }
    this.shuffleArray(ids);
    this.deckIds = ids;
  }

  createGrid(isResize = false) {
    const { width, height } = this.scale;

    const cols = this.config.cols;
    const rows = this.config.rows;

    const topMargin = 100; // HUD space
    const padding = 40;
    const gap = 15;

    const availableW = width - padding * 2;
    const availableH = height - topMargin - padding;

    // Calculate max card size that fits
    let cardW = (availableW - (cols - 1) * gap) / cols;
    let cardH = (availableH - (rows - 1) * gap) / rows;

    // Keep aspect ratio roughly 3:4 if possible or just use squarest fit
    const ratio = 0.75; // w/h
    if (cardW / cardH > ratio) {
      cardW = cardH * ratio;
    } else {
      cardH = cardW / ratio;
    }

    const gridW = cols * cardW + (cols - 1) * gap;
    const gridH = rows * cardH + (rows - 1) * gap;

    const startX = (width - gridW) * 0.5 + cardW * 0.5;
    const startY = topMargin + (availableH - gridH) * 0.5 + cardH * 0.5;

    if (!isResize) {
      this.cards = [];
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
    } else {
      // Reposition existing cards
      let index = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (cardW + gap);
          const y = startY + r * (cardH + gap);
          const card = this.cards[index++];
          if (card) {
            card.setPosition(x, y);
            card.setSize(cardW, cardH);
            // Re-scale internal sprites/rects
            card.back.setDisplaySize(cardW, cardH);
            card.front.setDisplaySize(cardW, cardH);
            if (card.backLabel) card.backLabel.setFontSize(cardW * 0.4);
            if (card.frontLabel) card.frontLabel.setFontSize(cardW * 0.35);
          }
        }
      }
    }
  }

  createCard(x, y, w, h, cardId) {
    const container = this.add.container(x, y);
    container.setSize(w, h);

    // State
    container.cardId = cardId;
    container.isFaceUp = false;
    container.isMatched = false;

    // --- Back Face ---
    let back;
    let backLabel;
    if (this.textures.exists("card_back")) {
      back = this.add.sprite(0, 0, "card_back").setDisplaySize(w, h);
    } else {
      back = this.add.rectangle(0, 0, w, h, 0x2d2d2d, 1);
      back.setStrokeStyle(4, 0xffffff, 0.25);
      backLabel = this.add.text(0, 0, "?", {
        fontFamily: "Arial",
        fontSize: "64px",
        color: "#ffffff",
      }).setOrigin(0.5);
    }

    // --- Front Face ---
    let front;
    let frontLabel;
    
    // assetId is 1-indexed for the file name (01, 02...)
    const assetId = (cardId + 1).toString().padStart(2, "0");
    const assetKey = `card_front_${assetId}`;

    if (this.textures.exists(assetKey)) {
      front = this.add.sprite(0, 0, assetKey).setDisplaySize(w, h);
    } else {
      const frontColor = this.colorForId(cardId);
      front = this.add.rectangle(0, 0, w, h, frontColor, 1);
      front.setStrokeStyle(4, 0x000000, 0.2);
      frontLabel = this.add.text(0, 0, String(cardId + 1), {
        fontFamily: "Arial",
        fontSize: "54px",
        color: "#111111",
      }).setOrigin(0.5);
    }

    front.setVisible(false);
    if (frontLabel) frontLabel.setVisible(false);

    container.add(back);
    if (backLabel) container.add(backLabel);
    container.add(front);
    if (frontLabel) container.add(frontLabel);

    // Store references for animations
    container.back = back;
    container.backLabel = backLabel;
    container.front = front;
    container.frontLabel = frontLabel;

    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    container.on("pointerup", () => this.onCardPressed(container));

    return container;
  }

  onCardPressed(card) {
    const now = this.time.now;
    if (now - this.lastInputTime < 150) return; // Debounce fast clicks
    this.lastInputTime = now;

    // 1. Ignore input in PREVIEW, RESOLVING or WIN states
    if (this.state === this.STATES.PREVIEW || this.state === this.STATES.RESOLVING || this.state === this.STATES.WIN) return;

    // 2. Ignore taps on matched or already face-up cards
    if (card.isMatched || card.isFaceUp) return;

    // 3. Handle selection based on state
    if (this.state === this.STATES.IDLE) {
      this.state = this.STATES.RESOLVING; // Lock briefly during flip
      this.firstSelected = card;
      this.playSound("flip");
      
      this.flipUp(card, () => {
        this.state = this.STATES.ONE_SELECTED;
      });
    } 
    else if (this.state === this.STATES.ONE_SELECTED) {
      // 4. Ignore double-tapping the same card (safety check)
      if (this.firstSelected === card) return;

      this.state = this.STATES.RESOLVING;
      this.secondSelected = card;
      this.turns += 1;
      this.playSound("flip");

      this.events.emit("update-ui", { turns: this.turns, matches: this.matches, totalPairs: this.totalPairs });

      this.flipUp(card, () => {
        this.checkMatch();
      });
    }
  }

  checkMatch() {
    if (!this.firstSelected || !this.secondSelected) {
      this.state = this.STATES.IDLE;
      return;
    }

    const a = this.firstSelected;
    const b = this.secondSelected;

    if (a.cardId === b.cardId) {
      this.playSound("match");
      a.isMatched = true;
      b.isMatched = true;
      
      this.pop(a);
      this.pop(b);

      this.firstSelected = null;
      this.secondSelected = null;

      this.matches += 1;
      this.events.emit("update-ui", { turns: this.turns, matches: this.matches, totalPairs: this.totalPairs });

      if (this.matches === this.totalPairs) {
        this.showWin();
      } else {
        this.state = this.STATES.IDLE;
      }
      return;
    }

    // Not a match: Shake and then flip down
    this.playSound("mismatch");
    this.shake(a);
    this.shake(b);

    this.time.delayedCall(this.mismatchDelay, () => {
      // Flip down both and return to IDLE
      let completedFlips = 0;
      const onFlipDownComplete = () => {
        completedFlips++;
        if (completedFlips === 2) {
          this.firstSelected = null;
          this.secondSelected = null;
          this.state = this.STATES.IDLE;
        }
      };

      this.flipDown(a, onFlipDownComplete);
      this.flipDown(b, onFlipDownComplete);
    });
  }

  flipUp(card, onDone) {
    this.tweens.add({
      targets: card,
      scaleX: 0,
      duration: 120,
      onComplete: () => {
        card.back.setVisible(false);
        if (card.backLabel) card.backLabel.setVisible(false);
        
        card.front.setVisible(true);
        if (card.frontLabel) card.frontLabel.setVisible(true);
        
        card.isFaceUp = true;

        this.tweens.chain({
          targets: card,
          tweens: [
            { scaleX: 1.05, duration: 120 },
            { scaleX: 1.0, duration: 80 }
          ],
          onComplete: () => {
            if (onDone) onDone();
          }
        });
      }
    });
  }

  flipDown(card, onDone) {
    this.tweens.add({
      targets: card,
      scaleX: 0,
      duration: 120,
      onComplete: () => {
        card.front.setVisible(false);
        if (card.frontLabel) card.frontLabel.setVisible(false);
        
        card.back.setVisible(true);
        if (card.backLabel) card.backLabel.setVisible(true);
        
        card.isFaceUp = false;

        this.tweens.chain({
          targets: card,
          tweens: [
            { scaleX: 1.05, duration: 120 },
            { scaleX: 1.0, duration: 80 }
          ],
          onComplete: () => {
            if (onDone) onDone();
          }
        });
      }
    });
  }

  // --- Feedback Animations ---
  pop(card) {
    this.tweens.add({
      targets: card,
      scale: 1.08,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut"
    });
  }

  shake(card) {
    const originalX = card.x;
    this.tweens.add({
      targets: card,
      x: originalX + 6,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        card.x = originalX;
      }
    });
  }

  showWin() {
    this.state = this.STATES.WIN;
    this.playSound("win");
    
    // Get time from UIScene if it's running, or calculate here
    const uiScene = this.scene.get("UIScene");
    const finalTime = uiScene ? uiScene.elapsedTime : Math.floor((this.time.now - this.startTime) / 1000);
    
    this.time.delayedCall(500, () => {
      this.scene.stop("UIScene");
      this.scene.start("WinScene", { 
        moves: this.turns, 
        time: finalTime, 
        difficultyId: this.difficultyId 
      });
    });

    for (const c of this.cards) c.disableInteractive();
  }

  playSound(key) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key);
    }
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  colorForId(id) {
    const palette = [
      0xff595e, 0xffca3a, 0x8ac926, 0x1982c4,
      0x6a4c93, 0x00bbf9, 0xf72585, 0xff9f1c,
      0x2ec4b6, 0xe71d36, 0x9b5de5, 0x00f5d4
    ];
    return palette[id % palette.length];
  }
}
