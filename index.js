import * as z0 from './z0/z0.js';
import { TextureManager } from './z0/graphics/texturemanager.js';
import { Scene } from './z0/tree/scene.js';
import { SpriteSheet } from './z0/graphics/spritesheet.js'; 
import * as Key from './z0/input/key.js';
import { getMouseX, getMouseY } from './z0/input/mouse.js';
import { Sprite2D } from './z0/graphics/sprite2d.js';
import { distanceSquared } from './z0/math/math2d.js';
import { ShaderSprite2D } from './z0/graphics/shadersprite2d.js';
import { CircleCollider } from './z0/physics/primitives/circlecollider.js';
import { AudioManager } from './z0/audio/audiomanager.js';
import { Slot, Grid } from './fungi/scripts/slot.js';
import { Fungi, Gold, Wall, Poison } from './fungi/scripts/fungi.js';
import { Global } from './fungi/scripts/global.js';
import { Explosion } from './fungi/scripts/explosion.js';
import { MenuButton, homeButton, resetButton, nextButton, autoNextButton, startButton } from './fungi/scripts/button.js';
import { BitmapText } from './fungi/fonts/bitmaptext.js';
import { Dirt } from './fungi/scripts/shader.js';

let canvas = document.querySelector('canvas');

z0._init(canvas);

export class Main extends Scene {
    static loaded = false;

    fungus = [];

    constructor() {
        super(450);
    }

    _start() {
        if(!Main.loaded) {
            let sprites = loadImage('./fungi/sprites/shrooms.png');
            let font = loadImage('./fungi/fonts/font3.png');
            let txt = loadImage('./fungi/sprites/text.png');
            let win = loadImage('./fungi/sprites/win.png');

            Promise.all([sprites, font, txt, win]).then( (loaded) => {
                TextureManager.sprites = TextureManager.addTexture(loaded[0]);

                TextureManager.font = TextureManager.addTexture(loaded[1]);

                TextureManager.text = TextureManager.addTexture(loaded[2]);

                TextureManager.win = TextureManager.addTexture(loaded[3]);

                Main.slot = new SpriteSheet(TextureManager.sprites);

                Main.slot.createFrame(192, 208, 32, 32);

                Main.slot.createFrame(192 + 32 + 16, 208, 32, 32);

                Main.loaded = true;

                Main.fungi = new SpriteSheet(TextureManager.sprites);

                for(let x = 0; x < 129 + 15; x += 32) {
                    for(let y = 0; y < 129 + 15; y += 32) {
                        Main.fungi.createFrame(x, y, 16, 16);
                    }
                }

                Main.fungi.createFrame(160, 0, 16, 16);

                Main.fungi.createFrame(144, 208, 32, 32); // golden mushroom

                Main.fungi.createFrame(0, 208, 32, 32); // wall

                Main.fungi.createFrame(32 + 16 + 32 + 16, 208, 32, 32); // poison

                Main.explosion = new SpriteSheet(TextureManager.sprites);

                for(let i = 0; i < 5; i++) {
                    Main.explosion.createFrame(i * 16, 368, 16, 16);
                }

                AudioManager.background = AudioManager.createAudio('./fungi/audio/red.ogg', 0.15);

                AudioManager.wallPlace = AudioManager.createAudio('./fungi/audio/thump.wav', 0.4);

                AudioManager.next = AudioManager.createAudio('./fungi/audio/pop.flac', 0.4);

                z0._startUpdates();

                this.init();
            });
        } else {
            this.init();
        }
    }
    
    init() {
        new MouseCol(this, 0, 0, 0, 1, [0], []);

        new startButton(150, 550, 300, 180, this);

        this.mushroom = new Sprite2D(this, TextureManager.sprites, canvas.width - 120, 120, 200, 200, 0, 1, Main.fungi);
        this.mushroom.setSprite(26);

        let ss = new SpriteSheet(TextureManager.sprites);

        ss.createFrame(128, 384, 352, 64);

        this.title = new Sprite2D(null, TextureManager.sprites, 370, 120, 700, 200, 0, 1, ss);

        new Sprite2D(null, TextureManager.text, 645, 460, 590, 440, 0);
    }

    _update(delta) {
        this.mushroom.setHeight(200 + Math.cos(z0.getElapsedTime() / 500) * 10);
        this.title.setHeight(200 + Math.cos(z0.getElapsedTime() / 500) * 10);

        let off = Math.cos(z0.getElapsedTime() / 1000) * 0.1;

        this.setBackgroundColour(125 / 255 + off, 73 / 255 + off, 21 / 255 + off, 1);
    }

    start() {
        z0.getTree().setActiveScene(new L1(4, 0, 1)); 
    }
}

class Win extends Scene {
    constructor() {
        super(400);
    }

    _start() {
        new Sprite2D(null, TextureManager.win, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height, 0, 1);
    }

    timer = 10;

    _update(delta) {
        this.timer -= delta;

        if(this.timer < 0) {
            z0.setActiveScene(new Main());
        }

        let off = Math.cos(z0.getElapsedTime() / 1000) * 0.1;

        this.setBackgroundColour(125 / 255 + off, 73 / 255 + off, 21 / 255 + off, 1);
    }
}

export class MouseCol extends CircleCollider {
    _update() {
        this.setLoc(getMouseX(), getMouseY());
    }
}


let main = z0.getTree().addScene(new Main())
z0.getTree().setActiveScene(main);

function loadImage(url) {
    return new Promise((res, rej) => {
        let image = new Image();
        image.addEventListener('load', () => {
            res(image);
        });
        image.addEventListener('error', () => {
            rej();
        })
        image.src = url;
    })
}

export class Level extends Scene {
    static DRAG = 0;
    static IDLE = 1;
    static WALL = 2;
    static DEL = 3;
    static DIE = 4;

    fungus = [];
    walls = 10;
    deletes;
    grid;
    state = 2;
    level;
    stopped = false;
    poisoned = false;
    lost = false;
    autoPlay = false;

    constructor(walls = 0, deletes = 0, level = 0) {
        super(450);

        this.level = level;
        
        Global.world = this;

        this.walls = walls;
        this.deletes = deletes;

        this.mouse = new MouseCol(this, 0, 0, 0, 1, [0], [0]);

        new homeButton(50, canvas.height - 50, 75, 75, this);
        new resetButton(140, canvas.height - 50, 75, 75, this);
        new nextButton(140 + 90 + 90, canvas.height - 50, 75, 75, this);
        new autoNextButton(140 + 90, canvas.height - 50, 75, 75, this);

        let levelSS = new SpriteSheet(TextureManager.sprites);

        levelSS.createFrame(0, 400, 64, 32);

        levelSS.createFrame(0, 400 + 16 + 32, 64, 32);

        new Sprite2D(this, TextureManager.sprites, canvas.width - 120, canvas.height - 50, 200, 100, 0, 13, levelSS);

        let wallBkg = new Sprite2D(this, TextureManager.sprites, canvas.width - 340, canvas.height - 50, 200, 100, 0, 13, levelSS);
        wallBkg.setSprite(1);

        this.text = new BitmapText(this, canvas.width - 185, canvas.height - 30, TextureManager.font, 5, 7, 40, 50, 14);
        this.text.setString(this.level.toString());

        this.wallText = new BitmapText(this, canvas.width - 405, canvas.height - 30, TextureManager.font, 5, 7, 40, 50, 14);
        this.wallText.setString(this.walls.toString());
    }

    _start() {
        this.init(0);

        let renderer = new Dirt();

        this.dirt = new ShaderSprite2D(this, renderer, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height, 0, 0);
    }

    init() {

    }

    countdown = 2.5;
    autoDelay = 0.5;

    _update(delta) {
        if(this.autoPlay && !this.stopped) {
            this.autoDelay -= delta;
            if(this.autoDelay < 0) {
                this.autoDelay = 0.5;
                this.nextStep(); 
            }
        }

        if(this.stopped) {
            this.countdown -= delta;

            if(this.poisoned && this.countdown < 2) {
                if(!this.lost)
                for(let i = Global.grid.grid.length - 1; i >= 0; i--) {
                    for(let j = Global.grid.grid[0].length - 1; j >= 0; j--) {
                        if(Global.grid.grid[i][j].fungi !== undefined && !Global.grid.grid[i][j].fungi.isGold) {
                            new Explosion(Global.grid.grid[i][j].getX(), Global.grid.grid[i][j].getY(), Grid.GRID_WIDTH);   
                            Global.grid.grid[i][j].fungi.removeSelf(); 
                        }
                    }
                }
                else
                for(let i = this.fungus.length - 1; i >= 0; i--) {
                    if(this.fungus[i] !== undefined && this.fungus[i].isGold) {
                        new Explosion(this.fungus[i].getX(), this.fungus[i].getY(), Grid.GRID_WIDTH); 
                        this.fungus[i].removeSelf();
                    }
                }
            }

            if(this.countdown < 0) {
                if(!this.lost)
                    this.nextLevel();
                else {
                    this.reset();
                }
            }
        }
    } 

    nextStep() {
        if(this.stopped) {
            return;
        }

        let copy = [];
        let length = this.fungus.length;

        for(let i = 0; i < this.fungus.length; i++) {
            copy.push(this.fungus[i]);
        }

        // Creating new fungi adds to the array, resulting in infinite recursion loop
        for(let i = 0; i < copy.length; i++) {
            copy[i].next();
        }

        if(this.fungus.length === length) {
            this.stopped = true;
            this.poisoned = true;
        }

        AudioManager.playBurst(AudioManager.next);
    }

    nextLevel() {

    }

    reset() {

    }

    requestWall() {
        if(--this.walls < 0) {
            this.walls++;
            return false;
        }

        this.wallText.setString(this.walls.toString());
        return true;
    }

    requestDelete() {
        if(--this.deletes < 0) {
            this.deletes++;
            return false;
        }

        return true;
    }
}

class L1 extends Level {
    init() {
        this.grid = new Grid(7, 3, 75);

        new Gold(1, 1);

        new Fungi(5, 1, 0);

        AudioManager.playLoop(AudioManager.background);
    }

    nextLevel() {
        z0.setActiveScene(new L2(6, 0, 2));
    }

    reset() {
        z0.setActiveScene(new L1(4, 0, 1));
    }
}

class L2 extends Level {
    init() {
        this.grid = new Grid(8, 8, 75);

        new Gold(1, 6);
        new Gold(1, 1);
        new Gold(6, 6);

        new Fungi(6, 1, 0);
        new Fungi(7, 2, 0);
        new Fungi(5, 0, 0)
    }

    nextLevel() {
        z0.setActiveScene(new L3(14, 0, 3));
    }

    reset() {
        z0.setActiveScene(new L2(6, 0, 2));
    }
}

class L3 extends Level {
    init() {
        this.grid = new Grid(15, 15, 75);

        new Gold(7, 7);

        for(let i = 0; i < 15; i++)
            new Fungi(0, i, 0);

        for(let i = 0; i < 15; i++)
            new Fungi(14, i, 0);

        for(let i = 0; i < 15; i++)
            new Fungi(i, 14, 0);

        for(let i = 0; i < 15; i++)
            new Fungi(i, 0, 0);
    }

    nextLevel() {
        z0.setActiveScene(new L4(1, 0, 4));
    }

    reset() {
        z0.setActiveScene(new L3(14, 0, 3));
    }
}

class L4 extends Level {
    init() {
        this.grid = new Grid(5, 5);

        new Gold(0, 0);

        new Fungi(4, 4, 5);
    }

    nextLevel() {
        z0.setActiveScene(new L5(2, 0, 5));
    }

    reset() {
        z0.setActiveScene(new L4(1, 0, 4));
    }
}


class L5 extends Level {
    init() {
        this.grid = new Grid(5, 7);

        new Gold(2, 3);

        new Fungi(4, 3, 0);
        new Fungi(4, 4, 0);

        new Poison(4, 0);
    }

    nextLevel() {
        z0.setActiveScene(new L6(4, 0, 6));
    }

    reset() {
        z0.setActiveScene(new L5(2, 0, 5));
    }
}


class L6 extends Level {
    timer = 4.5;

    _start() {
        super._start();
        this.grid.setX(-1100);
    }
    _update(delta) {
        super._update(delta);
        this.timer -= delta;
        if(this.timer > 0 && this.timer < 4)
            this.grid.setX(this.grid.getX() + delta * 370);
    }

    init() {
        this.grid = new Grid(44, 5, 40);

        new Gold(2, 2);

        new Fungi(43, 1, 0);
        new Fungi(43, 3, 0);

        new Poison(0, 0);
        new Poison(1, 0);
        new Poison(2, 0);
        new Poison(3, 0);
        new Poison(4, 0);
        new Poison(0, 1);
        new Poison(0, 2);
        new Poison(0, 3);
        new Poison(0, 4);
        new Poison(4, 1);
        new Poison(4, 2);
        new Poison(4, 3);
        new Poison(4, 4);
        new Poison(1, 4);
        new Poison(2, 4);
        new Poison(3, 4);
    }

    nextLevel() {
        z0.setActiveScene(new L7(2, 0, 7));
    }

    reset() {
        z0.setActiveScene(new L6(4, 0, 6));
    }
}

class L7 extends Level {
    init() {
        this.grid = new Grid(4, 4, 75);

        new Gold(1, 3);

        new Fungi(2, 0, 0);

        new Poison(0, 3);
    }

    nextLevel() {
        z0.setActiveScene(new L8(2, 0, 8));
    }

    reset() {
        z0.setActiveScene(new L7(2, 0, 7));
    }
}

class L8 extends Level {
    init() {
        this.grid = new Grid(5, 5);

        new Gold(1, 3);

        new Fungi(2, 0, 20);

        new Poison(0, 4);
    }

    nextLevel() {
        z0.setActiveScene(new L9(2, 0, 9));
    }

    reset() {
        z0.setActiveScene(new L8(2, 0, 8));
    }
}

class L9 extends Level {
    init() {
        this.grid = new Grid(7, 7);

        new Gold(0, 0);

        new Gold(6, 0);

        new Gold(6, 6);

        new Gold(0, 6);

        new Fungi(3, 3, 5);
    }

    nextLevel() {
        z0.setActiveScene(new L10(13, 0, 10));
    }

    reset() {
        z0.setActiveScene(new L9(2, 0, 9));
    }
}

class L10 extends Level {
    init() {
        this.grid = new Grid(10, 10);

        new Gold(4, 4);
        new Gold(5, 4);
        new Gold(4, 5);
        new Gold(5, 5);

        new Fungi(4, 2, 0);
        new Fungi(5, 7, 0);

        new Fungi(0, 0, 0);
        new Fungi(9, 9, 0);
        new Fungi(0, 9, 0);
    }

    nextLevel() {
        z0.setActiveScene(new L11(2, 0, 11));
    }

    reset() {
        z0.setActiveScene(new L10(13, 0, 10));
    }
}

class L11 extends Level {
    init() {
        this.grid = new Grid(6, 6);

        new Gold(4, 4);

        new Fungi(2, 2, 10);

        new Poison(3,3);
    }

    nextLevel() {
        z0.setActiveScene(new L12(2, 0, 12));
    }

    reset() {
        z0.setActiveScene(new L11(2, 0, 11));
    }
}

class L12 extends Level {
    init() {
        this.grid = new Grid(4, 4);

        new Gold(0, 0);

        new Fungi(2, 2, 20);

        new Poison(3,3);
    }

    nextLevel() {
        z0.setActiveScene(new L13(8, 0, 13));
    }

    reset() {
        z0.setActiveScene(new L12(2, 0, 12));
    }
}

class L13 extends Level {
    init() {
        this.grid = new Grid(8, 8);

        new Gold(7, 3);
        new Gold(0, 4);

        new Fungi(4, 4, 15);
        new Fungi(3, 0, 15);

        new Poison(0, 7);
    }

    nextLevel() {
        z0.setActiveScene(new L14(1, 0, 14));
    }

    reset() {
        z0.setActiveScene(new L13(8, 0, 13));
    }
}

class L14 extends Level {
    init() {
        this.grid = new Grid(3, 7);

        new Gold(1, 6);

        new Fungi(1, 0, 3);
        new Fungi(0, 0, 3);

        new Poison(0, 3);
    }

    nextLevel() {
        z0.setActiveScene(new L15(2, 0, 15));
    }

    reset() {
        z0.setActiveScene(new L14(1, 0, 14));
    }
}

class L15 extends Level {
    init() {
        this.grid = new Grid(10, 9);

        new Gold(9, 4);

        new Fungi(0, 8, 17);
        new Fungi(0, 0, 17);

        new Poison(8, 4);
    }

    nextLevel() {
        z0.setActiveScene(new Win());
    }

    reset() {
        z0.setActiveScene(new L15(2, 0, 15));
    }
}