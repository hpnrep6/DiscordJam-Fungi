import { Sprite2D } from '../../z0/graphics/sprite2d.js';
import { AARectangle } from '../../z0/physics/primitives/aarectcollider.js';
import { TextureManager } from '../../z0/graphics/texturemanager.js';
import { Main, MouseCol, Level } from '../../index.js';
import { Module } from '../../z0/tree/module.js';
import { getCanvas, canvas } from '../../z0/var.js';
import { Global } from './global.js';
import { isDown, getMouseX, getMouseY } from '../../z0/input/mouse.js';
import { Wall } from './fungi.js';
import { isKeyDown } from '../../z0/input/key.js';

export class Slot extends Sprite2D {
    col;

    mouseOver = false;

    fungi = undefined;

    constructor(grid, x, y, size, index) {
        super(grid, TextureManager.sprites, x, y, size, size, 0, 5, Main.slot);

        this.col = new SlotCol(this, 0, 0, 0, size, size, [], [0]);

        this.index = index;
    }

    _update() {

        if(this.mouseOver) {
            this.setSprite(1);
            if(isDown()) {
                if(Global.world.state === Level.WALL) {
                    if(!Global.world.stopped === true) {
                        if(this.getY() < getCanvas().height - 50 - 75/2)
                            new Wall(this.index.x, this.index.y);
                    }
                }
            }
            this.getParent().collisions++;
        } else {
            this.setSprite(0);
        }

        this.mouseOver = false;
    }
}

export class SlotCol extends AARectangle{
    _onCollision(body) {
        if(body instanceof MouseCol) {
            this.getParent().mouseOver = true;
        }
    }
}

export class Grid extends Module {
    static GRID_WIDTH = 75;
    static GRID_GAP = 5;
    static SPEED = 300;

    grid = [];
    collisions = 0;
    lastMX = 0;
    lastMY = 0;

    constructor(x, y, size = Grid.GRID_WIDTH) {
        let GRID_WIDTH = size;
        Grid.GRID_WIDTH = size;
        let GRID_GAP = Grid.GRID_GAP;

        let width = (GRID_WIDTH * x + GRID_GAP * x);
        let height = (GRID_WIDTH * y + GRID_GAP * y);

        let xLoc = getCanvas().width / 2 - width / 2;
        let yLoc = getCanvas().height / 2 - height / 2;

        super(null, xLoc, yLoc, 0);

        Global.grid = this;

        for(let xx = 0, i = 0; xx < width; xx += GRID_WIDTH + GRID_GAP, i++) {
            this.grid[i] = [];
            for(let yy = 0, j = 0; yy < height; yy += GRID_WIDTH + GRID_GAP, j++) {
                this.grid[i].push(new Slot(this, xx + GRID_WIDTH / 2, yy + GRID_WIDTH / 2, GRID_WIDTH, new i2(i, j)));
            }
        }
    }

    _update(delta) {
        let thisMX = getMouseX();
        let thisMY = getMouseY();

        if(this.collisions === 0 && Global.world.state === Main.DRAG) {
            let dX = thisMX - this.lastMX;
            let dY = thisMY - this.lastMY;

            this.setLoc(this.getX() + dX, this.getY() + dY);
        }

        if(isKeyDown('w')) {
            this.setY(this.getY() + delta * Grid.SPEED);
        }
        if(isKeyDown('a')) {
            this.setX(this.getX() + delta * Grid.SPEED);
        }
        if(isKeyDown('s')) {
            this.setY(this.getY() - delta * Grid.SPEED);
        }
        if(isKeyDown('d')) {
            this.setX(this.getX() - delta * Grid.SPEED);
        }

        this.lastMX = thisMX;
        this.lastMY = thisMY;
        this.collisions = 0;
    }
}

class i2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}