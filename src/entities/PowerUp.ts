// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import Entity from "./Entity";

export default class PowerUp extends Entity {
    static readonly MANA = 0;
    static readonly SWORD = 1;
    static readonly STAR = 2;
    static readonly BLAST_UP = 3;
    static readonly WHEEL = 4;
    static readonly BLAST_DOWN = 5;
    static readonly SLICE_UP_DOWN = 6;
    static readonly MAX_MANA = 7;
    static readonly ONE_UP = 8;
    static readonly HP_UP = 9;
    static initAnims(scene: GameSegment) {
        for (let i = PowerUp.MANA; i <= PowerUp.HP_UP; i++) {
            console.log('[PowerUp.initAnim] Creating animation for power up #' + i);
            scene.createAnim('power_up', i, 'glow', {frames: [i, i, i, i, 10, 11]}, 500, -1);
            scene.createAnim('power_up', i, 'fall', {frames: [i]}, 200, -1);
        }      
    }

    static preloadResources(scene: GameSegment) {
        scene.load.spritesheet('power_up', 'assets/PowerUp.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }
    
    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        sprite.body.allowGravity = false;
        this.setState('glow');
    }

    onBeginState(newState: string) {
        if (newState == 'fall') {
            this.sprite.body.allowGravity = true;
        }
        super.onBeginState(newState);
    }
    
    onEndState(state: string, newState: string) {
        // TODO Implement
    }
    
}
