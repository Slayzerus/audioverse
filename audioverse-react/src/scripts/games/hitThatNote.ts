import Phaser from "phaser";

interface Note {
    startTime: number;
    duration: number;
    key: string;
    sprite: Phaser.GameObjects.Rectangle;
    isHeld: boolean;
    holdStartTime: number | null;
}

export class HitThatNoteGame extends Phaser.Scene {
    private song!: Phaser.Sound.HTML5AudioSound;
    private notes: Note[] = [];
    private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Rectangle;
    private timeText!: Phaser.GameObjects.Text;
    private gameWidth!: number;
    private gameHeight!: number;
    private keyLanes: { [key: string]: number } = {};
    private totalSongDuration = 15000;
    private difficulty = 3;
    private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
    private reflectors!: Phaser.GameObjects.Image[];

    constructor() {
        super({ key: "HitThatNoteGame" });
    }

    preload() {
        this.load.audio("song", "/assets/song.mp3");
        this.load.image("star", "/assets/star.png");
        this.load.image("reflector", "/assets/reflector.png");
    }

    create() {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;

        this.song = this.sound.add("song") as Phaser.Sound.HTML5AudioSound;
        this.song.play();

        const keyMap = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "W", "A", "S", "D"];
        keyMap.forEach((key, index) => {
            this.keys[key] = this.input.keyboard!.addKey(
                (Phaser.Input.Keyboard.KeyCodes as any)[key.toUpperCase()]
            );
            this.keyLanes[key] = (index + 1) * (this.gameHeight / (keyMap.length + 1));
            this.add.rectangle(this.gameWidth / 2, this.keyLanes[key], this.gameWidth - 40, 5, 0xffffff).setAlpha(0.3);
        });

        this.scoreText = this.add.text(20, 20, "Wynik: 0", { fontSize: "24px", color: "#fff" });

        this.progressBar = this.add.rectangle(20, this.gameHeight - 30, 10, 10, 0x00ff00).setOrigin(0, 0.5);
        this.timeText = this.add.text(this.gameWidth - 100, this.gameHeight - 40, "0:00", { fontSize: "18px", color: "#fff" });

        // ✅ Poprawione cząsteczki
/*        const particleManager = this.add.particles(0, 0, "star");
        this.particles = particleManager.createEmitter({
            speed: { min: -100, max: 100 } as Phaser.Types.GameObjects.Particles.EmitterOpOnEmitType,
            scale: { start: 0.2, end: 0 },
            lifespan: 500,
            blendMode: "ADD"
        })!;*/



        this.generateNotes();

        this.reflectors = [
            this.add.image(this.gameWidth / 4, -100, "reflector").setOrigin(0.5, 1).setScale(0.5).setAlpha(0),
            this.add.image((this.gameWidth / 4) * 3, -100, "reflector").setOrigin(0.5, 1).setScale(0.5).setAlpha(0),
        ];
    }

    generateNotes() {
        const keyMap = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "W", "A", "S", "D"];
        for (let i = 0; i < this.difficulty * 2; i++) {
            const key = keyMap[Math.floor(Math.random() * keyMap.length)];
            const startTime = Phaser.Math.Between(500, this.totalSongDuration - 1000);
            const duration = Phaser.Math.Between(300, 1500);
            const sprite = this.add.rectangle(20, this.keyLanes[key], 20, 10, 0xff0000);
            this.notes.push({ startTime, duration, key, sprite, isHeld: false, holdStartTime: null });
        }
    }

    update(time: number) {
        const elapsedTime = this.song.seek ? this.song.seek * 1000 : 0;

        this.progressBar.width = (elapsedTime / this.totalSongDuration) * (this.gameWidth - 40);
        this.timeText.setText(`${Math.floor(elapsedTime / 1000)}:${String(Math.floor(elapsedTime % 1000)).padStart(2, "0")}`);

        for (const note of this.notes) {
            if (elapsedTime >= note.startTime) {
                note.sprite.x = 20 + (elapsedTime - note.startTime) / this.totalSongDuration * (this.gameWidth - 40);

                if (note.sprite.x > this.gameWidth - 20) {
                    note.sprite.destroy();
                }

                if (this.keys[note.key].isDown) {
                    if (!note.isHeld) {
                        note.isHeld = true;
                        note.holdStartTime = elapsedTime;
                    }

                    if (note.holdStartTime !== null) {
                        const holdTime = elapsedTime - note.holdStartTime;
                        if (holdTime >= note.duration) {
                            this.score += 10;
                            this.particles.setPosition(note.sprite.x, note.sprite.y);
                            this.particles.explode(10);
                            note.sprite.destroy();
                            this.notes = this.notes.filter(n => n !== note);
                        }
                    }
                }
            }
        }

        this.scoreText.setText(`Wynik: ${this.score}`);

        if (elapsedTime >= this.totalSongDuration) {
            this.endGame();
        }
    }

    endGame() {
        this.reflectors.forEach((light, index) => {
            this.tweens.add({
                targets: light,
                alpha: 1,
                y: this.gameHeight / 2,
                angle: index === 0 ? -30 : 30,
                duration: 1500,
                yoyo: true
            });
        });

        this.add.text(this.gameWidth / 2, this.gameHeight / 2, `Twój wynik: ${this.score}`, {
            fontSize: "32px",
            color: "#fff",
        }).setOrigin(0.5);
    }
}
