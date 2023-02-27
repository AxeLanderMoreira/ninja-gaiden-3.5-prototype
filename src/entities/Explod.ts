// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import GameSegment from "../scenes/GameSegment";
import Entity from "./Entity";

/**
 * 
 */
export default class Explod {
    readonly SHOCKWAVE_RADIUS = 16;
    readonly EXPLOD_DURATION = 100;
    scene: Phaser.Scene;
    sprites: Phaser.Physics.Arcade.Sprite[];
    x: number;
    y: number;
    
    static initAnims (scene: GameSegment) {
        scene.createAnim('explod', 0, 'explod', {frames: [0]}, 200, 0);
        scene.createAnim('explod', 0, 'shockwave', {frames: [1]}, 200, 0);
    }

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('explod', 'assets/Explod.png', {
            frameWidth: 15,
            frameHeight: 16
        });        
    }

    /**
     * Construct an Explod effect from an Entity that has just been defeated. 
     * 
     * @param parent 
     */
    constructor(parent: Entity) {
        // Get the position from parent entity
        this.scene = parent.scene;
        this.x = parent.sprite.x;
        this.y = parent.sprite.y;
        //this.sprites = new Phaser.Physics.Arcade.Sprite[];
        this.sprites = [];
    }    

    spawn() {
        // 0. Central explosion
        let spr:Phaser.Physics.Arcade.Sprite = this.scene.physics.add.sprite(this.x, this.y, 'explod');
        spr.anims.play('explod.explod');
        spr.body.allowGravity = false;
        spr.setDepth(Globals.EXPLOD_DEPTH);
        this.sprites.push(spr);
        // 1-4. Diagonal shockwaves
        for (let i = 0; i < 4; i++) {
            spr = this.scene.physics.add.sprite(this.x, this.y, 'explod');
            spr.anims.play('explod.shockwave');
            spr.body.allowGravity = false;
            spr.setDepth(Globals.EXPLOD_DEPTH);
            let flipX: boolean = (i >= 2);
            let flipY: boolean = (i % 2) == 0;
            spr.setFlip(flipX, flipY); // up-right     
            this.sprites.push(spr);
            this.scene.tweens.add({
                targets: spr,
                x: this.x + (flipX ? -this.SHOCKWAVE_RADIUS : this.SHOCKWAVE_RADIUS),
                y: this.y + (flipY ? this.SHOCKWAVE_RADIUS : -this.SHOCKWAVE_RADIUS),
                alpha: 0,
                duration: this.EXPLOD_DURATION,
                repeat: 0
            }).on('complete', () =>  {
                if (i == 3) {
                    this.sprites.forEach(element => {
                        element.destroy();
                    });
                }                
            });
        }      
    }
}