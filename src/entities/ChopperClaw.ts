// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Enemy from "../entities/Enemy";
import { Globals } from "../Globals";
import GameSegment from "./GameSegment";

export default class ChopperClaw extends Enemy {
    static rect1: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
    static rect2: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();

    /** Player sprite whom this Enemy is chasing */
    player?: Phaser.Physics.Arcade.Sprite;
    /** y-coordinat where to stop descent */
    stopY?: integer; 
    /** Horizontal hovering speed */
    static readonly HOVER_X_SPEED = 32;
    /** Vertical hovering speed */
    static readonly HOVER_Y_SPEED = 32;
    /** Minimum delta (difference between Player and Enemy vertical positions,
     * where the Enemy may still decide to change direction). If difference is
     * inside the delta, Enemy will just move horizontally towards the player */
    static readonly DELTA_CHANGE_Y_SPEED = 1; //4;
    /** Same concept as above, but for horizontal speed */
    static readonly DELTA_CHANGE_X_SPEED = 1; //4;
    /** Amount of pixels to add on Ninja's body y-position, for chasing purposes.
     *  Otherwise, it will chase the head instead of the center of body mass. */
    static readonly NINJA_BODY_OFFSET_Y = 16;

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('chopper_claw', 'assets/ChopperClaw.png', {
            frameWidth: 24,
            frameHeight: 27
        })
    }

    static initAnims (scene: GameSegment) {
        scene.createAnim('chopper_claw', 0, 'chase', {start: 1, end: 2}, 100, -1);
        scene.createAnim('chopper_claw', 0, 'descend', {frames: [0]}, 200, -1);
        scene.createAnim('chopper_claw', 0, 'hover', {start: 1, end: 2}, 100, -1);        
        scene.createAnim('chopper_claw', 0, 'wait', {frames: [0]}, 200, -1);
    }

    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.hovering = true;
        this.setState('wait');
    }

    onBeginState(oldState: string, newState: string): void {
        switch(newState) {
            case 'wait':
                this.sprite.setVelocity(0);
                this.sprite.body.allowGravity = false;
                this.setCustomHitbox(new Phaser.Geom.Rectangle(5, 0, 14, 26));
                break;
            case 'descend': 
                this.sprite.body.allowGravity = true;                
                break;
            case 'hover':
                this.setCustomHitbox(new Phaser.Geom.Rectangle(0, 11, 24, 16));
                this.sprite.setVelocity(0);
                this.sprite.body.allowGravity = false;
                break;
            case 'chase':
                if (this.player) {
                    this.turn(this.player.body.x < this.sprite.body.x ? -1 : 1);
                    this.sprite.setVelocityX(this.facing * ChopperClaw.HOVER_X_SPEED);
                }
                break;
            default:
                // TODO
                break;
        }
        super.onBeginState(oldState, newState);
    }

    onEndState(state: string, newState: string) {
        // TODO Implement
    }

    update() {
        super.update();
        switch(this.state) {
            case 'wait':
                // Proximity sensor similar to the one used in DroidBall.ts
                Phaser.Display.Bounds.GetBounds(this.sprite, ChopperClaw.rect1);
                ChopperClaw.rect1.x -= 16;
                ChopperClaw.rect1.width += 32;
                ChopperClaw.rect1.height = Globals.SCREEN_HEIGHT;
                this.scene.players.forEach(player => {
                    Phaser.Display.Bounds.GetBounds(player.sprite, ChopperClaw.rect2);               
                    if (Phaser.Geom.Intersects.RectangleToRectangle(ChopperClaw.rect1, ChopperClaw.rect2)) {
                        this.player = player.sprite; // This ChopperClaw will follow this Player forever
                        this.setState("descend");
                    }
                });
                break;
            case 'descend':
                // TODO I've just thrown an arbitrary value here, but actually
                // it should check the y position of the closest player.
                let stopY = this.stopY || 100;
                //console.log('[ChopperClaw.update] stopY = ' + stopY);
                //console.log('[ChopperClaw.update] this.sprite.body.y = ' + this.sprite.body.y);
                if (this.sprite.body.y >= stopY) {
                    this.setState('hover');
                }
                break;
            case 'hover':
                if (this.getStateTime() >= 1000) {
                    this.setState('chase');
                }
                break;
            case 'chase':
                // Horizontal chase movement
                let delta = this.sprite.body.x - this.player.body.x;
                if (delta < -ChopperClaw.DELTA_CHANGE_X_SPEED) {
                    this.sprite.setVelocityX(ChopperClaw.HOVER_X_SPEED);
                } else if (delta > ChopperClaw.DELTA_CHANGE_X_SPEED) {
                    this.sprite.setVelocityX(-ChopperClaw.HOVER_X_SPEED);
                }
                // Vertical chase movement
                delta = this.sprite.body.y - (this.player.body.y + ChopperClaw.NINJA_BODY_OFFSET_Y);
                if (delta < -ChopperClaw.DELTA_CHANGE_Y_SPEED) {
                    this.sprite.setVelocityY(ChopperClaw.HOVER_Y_SPEED);
                } else if (delta > ChopperClaw.DELTA_CHANGE_Y_SPEED) {
                    this.sprite.setVelocityY(-ChopperClaw.HOVER_Y_SPEED);
                } else {
                    this.sprite.setVelocityY(0);
                }
                break;
        }
    }
    
}
