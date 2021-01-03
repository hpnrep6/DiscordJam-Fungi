import { Module } from '../../z0/tree/module.js';
import { Global } from './global.js';
import { Sprite2D } from '../../z0/graphics/sprite2d.js';
import { TextureManager } from '../../z0/graphics/texturemanager.js';
import { Grid } from './slot.js';
import { Main } from '../../index.js';
import { Explosion } from './explosion.js';
import { AudioManager } from '../../z0/audio/audiomanager.js';

export class Fungi extends Sprite2D {
    level = 0;
    x;
    y;
    toDestroy = false;

    constructor(x, y, level) {
        let toDestroy = false;

        try {
            let i = Global.grid.grid[x][y];
            
            if(i === undefined || i.fungi instanceof Fungi) {
                if(i.fungi.isPoison !== true && i.fungi.isGold !== true) {
                    x = -1; 
                    y = -1;
                    toDestroy = true; 
                } else if (Global.grid.grid[x][y].fungi.isGold === true && level > 0) {
                    new Explosion(Global.grid.grid[x][y].getX(), Global.grid.grid[x][y].getY(), Grid.GRID_WIDTH);
                    Global.grid.grid[x][y].fungi.removeSelf();
                    Global.world.stopped = true;
                    Global.world.lost = true;
                } else if (Global.grid.grid[x][y].fungi.isPoison === true && level !== -3 && level !== -2) {
                    Global.world.stopped = true; 
                    Global.grid.grid[x][y].fungi.trigger(level);
                } else if (Global.grid.grid[x][y].fungi.isGold === true && level < 0) {
                    x = -1; 
                    y = -1;
                    toDestroy = true;
                }
            }
        } catch (e) {
            x = -1; 
            y = -1;
            toDestroy = true;
        }

        if(level === -2) toDestroy = true;

        let parent = x < 0 ? null : Global.grid.grid[x][y];

        super(parent, TextureManager.sprites, 0, 0, Grid.GRID_WIDTH, Grid.GRID_WIDTH, 0, 8, Main.fungi);
    
        this.toDestroy = toDestroy;
        
        if(toDestroy) {
            this.removeSelf();
            return;
        }

        level = Math.min(level, 25);

        if(level > 0)
            this.setSprite(level);
        
        this.level = level;

        this.x = x;
        this.y = y;

        this.getParent().fungi = this;

        Global.world.fungus.push(this);
    }

    next() {
        let x = this.x;
        let y = this.y;
    
        let level = this.level + 1;
        switch(true) {
            case this.level < 5: {
                new Fungi(x - 1, y, level);
                new Fungi(x + 1, y, level);
                new Fungi(x, y - 1, level);
                new Fungi(x, y + 1, level);
                break;
            }

            case this.level < 10: {
                new Fungi(x - 1, y + 2, level);
                new Fungi(x + 2, y + 2, level);
                new Fungi(x - 2, y - 2, level);
                new Fungi(x + 2, y - 1, level);
                break;
            }

            case this.level < 15: {
                new Fungi(x - 1, y, level);
                new Fungi(x + 1, y, level);
                new Fungi(x, y - 1, level);
                new Fungi(x, y + 1, level);
                new Fungi(x, y + 2, level);
                new Fungi(x, y - 2, level);
                new Fungi(x - 2, y, level);
                new Fungi(x + 2, y, level);
                break;
            }

            case this.level < 20: {
                new Fungi(x - 1, y, level);
                new Fungi(x + 1, y, level);
                new Fungi(x, y - 1, level);
                new Fungi(x, y + 1, level);
                new Fungi(x - 1, y - 1, level);
                new Fungi(x + 1, y + 1, level);
                new Fungi(x + 1, y - 1, level);
                new Fungi(x - 1, y + 1, level);
                break;
            }

            case this.level < 25: {
                new Fungi(x + 2, y - 1, level);
                new Fungi(x + 2, y + 1, level);
                new Fungi(x - 2, y - 1, level);
                new Fungi(x - 2, y + 1, level);
                new Fungi(x - 1, y + 2, level);
                new Fungi(x + 1, y + 2, level);
                new Fungi(x - 1, y - 2, level);
                new Fungi(x + 1, y - 2, level);
                break;
            }
        }
    }

    _destroy() {
        if(!this.toDestroy) {
            Global.world.fungus.splice(Global.world.fungus.indexOf(this), 1);
            this.getParent().fungi = undefined;
        }
        super._destroy();
    }
}

export class Gold extends Fungi {
    isGold = true;
    static reset = 8;
    turns = Gold.reset;

    constructor(x, y) {
        super(x, y, -1);
        this.setSprite(26);
        this.setOff(this.getXOff(), this.getYOff() + .5);
        this.getParent().fungi = this;
    }

    next() {
        if(--this.turns < 0) {
            this.turns = Gold.reset;
            new Gold(this.x - 1, this.y, this.level);
            new Gold(this.x + 1, this.y, this.level);
            new Gold(this.x, this.y - 1, this.level);
            new Gold(this.x, this.y + 1, this.level);
        }
    }
}

export class Wall extends Fungi {
    constructor(x, y) {
        let toDestroy = false;

        if(Global.grid.grid[x][y].fungi !== undefined) {
            toDestroy = true;
        }

        super(x, y, toDestroy ? -2 : -3);
        
        if(toDestroy) {
            this.removeSelf();
            return;
        }
        
        if(!Global.world.requestWall() ) {
            this.removeSelf();
            return;
        }

        this.getParent().fungi = this;
        this.setSprite(27);

        AudioManager.playBurst(AudioManager.wallPlace);
    }

    next() {}
}

export class Poison extends Fungi {
    isPoison = true;
    constructor(x, y) {
        super(x, y, -1);

        this.getParent().fungi = this;
        this.setSprite(28);
    }

    trigger(level) {
        Global.world.poisoned = true;

        if(level < 0) {
            Global.world.lost = true;
        }
    }

    next() {}
}