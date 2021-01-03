import { ShaderSprite2DRenderer } from '../../z0/graphics/shadersprite2d.js';
import { getGL, getCanvas } from '../../z0/var.js';

const shader = `
    precision highp float;
    varying vec2 vTexCoord;
    varying float vAlpha;
    varying vec3 vTransform0;

    uniform sampler2D uSampler;
    uniform mediump vec2 uRes;
    uniform mediump float uTime;
    uniform mediump float uTimeDelta;

    float rand(vec2 uv) {
        return cos(uv.x * uv.y ) * .5 + .5;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / 3.5 + (cos(uTime / 1000.) * .007); // max(uRes.x, uRes.y)) * 500. + vTransform0.xy * 500.;

        float col = rand(uv) * .03;

        gl_FragColor = vec4(0.4196 + col, 0.2666 + col, 0.1019 + col, 1.0);
    }
`;

export class Dirt extends ShaderSprite2DRenderer {
    constructor() {
        super(getGL(), getCanvas(), null, shader);
    }
}