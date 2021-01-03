import { Sprite2D } from '../../z0/graphics/sprite2d.js';
import { TextureManager } from '../../z0/graphics/texturemanager.js';
import { Main } from '../../index.js';

export class Explosion extends Sprite2D {
    constructor(x, y, size) {
        super(null, TextureManager.sprites, x, y, size * 1.5, size * 1.5, Math.random() * 4, 10, Main.explosion);
    }

    time = 0.1;
    timeReset = 0.1;

    _update(delta) {
        this.time -= delta;

        if(this.time < 0) {
            if(this.getSpriteIndex() > 3) {
                this.removeSelf();
                return;
            }

            this.setSprite(this.getSpriteIndex() + 1);
            this.time = this.timeReset;
        }
    }
}