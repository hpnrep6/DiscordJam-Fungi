
import { Sprite2D } from '../../z0/graphics/sprite2d.js';
import { SpriteSheet } from '../../z0/graphics/spritesheet.js';
import { TextureManager } from '../../z0/graphics/texturemanager.js';
import * as MOUSE from '../../z0/input/mouse.js';
import { getActiveScene, getElapsedTime, getTree, setActiveScene } from '../../z0/z0.js';
import { Main, MouseCol } from '../../index.js';
import { AARectangle } from '../../z0/physics/primitives/aarectcollider.js';
import { Global } from './global.js';
import { Level } from '../../index.js';

export class MenuButton extends Sprite2D {
    static selected = [];

    pressed = false;
    
    delay = -1;

    yAnchor;

    isHover;

    oW;

    oH;

    constructor(xLoc, yLoc, width, height, parent, spritesheet) {
        super(parent, TextureManager.sprites, xLoc, yLoc, width, height, 0, 15, spritesheet);

        new button(this, 0, 0, 0, width, height, [], [0]);

        this.oW = width;
        this.oH = height;

        this.yAnchor = yLoc;

        this.getParent().state = Level.WALL;
    }

    _update(delta) {
        this.delay -= delta;

        this.getParent().state = Level.WALL;
        if(MOUSE.isDown()) {
            if(this.isHover && !this.pressed) {
                this.action();
                this.pressed = true;
            }
        } else {
            this.setSprite(0);
            this.pressed = false;
        }

        if(this.isHover) {
            this.setWidth(this.oW + 10);
            this.setHeight(this.oH + 10);
        } else {
            this.setWidth(this.oW);
            this.setHeight(this.oH);
        }

        this.isHover = false;
    }

    action() {
        //this.getParent().nextStep();
    }

    _destroy() {
        MenuButton.selected.splice(MenuButton.selected.indexOf(this));
        super._destroy();
    }
}

class button extends AARectangle {
    _onCollision(body) {
        if(body instanceof MouseCol)
            this.getParent().isHover = true;
    }
}

export class nextButton extends MenuButton {
    constructor(x, y, w, h, p) {
        let ss = new SpriteSheet(TextureManager.sprites);

        ss.createFrame(0 + 32 + 16 + 16 + 32, 160, 32, 32);
        super(x, y, w, h, p, ss);
    }

    action() {
        this.getParent().nextStep();
    }
}

export class homeButton extends MenuButton {
    constructor(x, y, w, h, p) {
        let ss = new SpriteSheet(TextureManager.sprites);

        ss.createFrame(0, 160, 32, 32);
        super(x, y, w, h, p, ss);
    }

    action() {
        setActiveScene(new Main());
    }
}

export class resetButton extends MenuButton {
    constructor(x, y, w, h, p) {
        let ss = new SpriteSheet(TextureManager.sprites);

        ss.createFrame(0 + 32 + 16, 160, 32, 32);
        super(x, y, w, h, p, ss);
    }

    timeout;
    action() {
        this.getParent().poisoned = true;
        this.getParent().stopped = true;

        clearTimeout(this.timeout);

        this.timeout = setTimeout( () => {
            this.getParent().reset();   
        }, 200);
    }
}

export class autoNextButton extends MenuButton {
    constructor(x, y, w, h, p) {
        let ss = new SpriteSheet(TextureManager.sprites);

        ss.createFrame(0 + 32 + 16 + 16 + 32 + 16 + 32, 160, 32, 32);
        super(x, y, w, h, p, ss);
    }

    action() {
        this.getParent().autoPlay = true;
    }
}

export class startButton extends MenuButton {
    constructor(x, y, w, h, p) {
        let ss = new SpriteSheet(TextureManager.sprites);

        ss.createFrame(0, 256, 160, 96);
        super(x, y, w, h, p, ss);
    }

    action() {
        this.getParent().start();
    }
}