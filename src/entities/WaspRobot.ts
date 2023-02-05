// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Enemy from "./Enemy";
import Ninja from "./Ninja";

export default class WaspRobot extends Enemy {  
    static readonly MAX_HOVER_X_SPEED = 160;
    static readonly MAX_HOVER_Y_SPEED = 64;
    static readonly X_ACCELERATION=128;
    static readonly Y_ACCELERATION=128;
    prevVelX: number;

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('wasp_robot', 'assets/WaspRobot.png', {
            frameWidth: 31,
            frameHeight: 55
        })
    }

    static initAnims (scene: GameSegment) {
        scene.createAnim('wasp_robot', 0, 'fly', {start: 0, end: 1}, 100, -1);
    }

    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.hovering = true;
        this.prevVelX = 0;
        this.sprite.body.allowGravity = false;
        this.sprite.setMaxVelocity(WaspRobot.MAX_HOVER_X_SPEED, WaspRobot.MAX_HOVER_Y_SPEED);
        this.setCustomHitbox(new Phaser.Geom.Rectangle(7, 18, 24, 37));
        this.setState('fly');
    }

    onBeginState(oldState: string, newState: string): void {
        switch(newState) {
            case 'fly':
                this._chaseNearestPlayer();
                break;
            default:
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
            case 'fly':
                this._chaseNearestPlayer();
                break;
            default:
                break;
        }
    }

    private _chaseNearestPlayer() {
        let player: Ninja = this.getNearestPlayer();
        let vel: Phaser.Math.Vector2 = this.sprite.body.velocity;
        if (vel.x > 0  && this.prevVelX <= 0) {
            this.turn(1);
        } else if (vel.x < 0 && this.prevVelX >= 0) {
            this.turn(-1);
        }
        console.log('[WaspRobot._chaseNearestPlayer] velocity = ' + vel.x + ',' + vel.y);
        // TODO Create logic to turn sprite when changing direction;
        // Store vel.x from previous frame, and turn the sprite when
        // signal is changed
        if (player && player.sprite) {
            // Horizontal movement
            if (player.sprite.body.x < this.sprite.body.x) { // player is to the left of robot
                if (vel.x >= 0) { // Currently static or moving right
                    this.sprite.setAccelerationX(-WaspRobot.X_ACCELERATION);
                }
            } else { // player is to the right of robot
                if (vel.x <= 0) { // Currently static or moving left
                    this.sprite.setAccelerationX(WaspRobot.X_ACCELERATION);
                }
            }
            // Vertical movement
            if (player.sprite.body.y < this.sprite.body.y) { // player is above robot
                if (vel.y >= 0) { // Currently static or moving down
                    this.sprite.setAccelerationY(-WaspRobot.Y_ACCELERATION);
                }
            } else { // player is underneath robot
                if (vel.y <= 0) { // Currently static or moving up
                    this.sprite.setAccelerationY(WaspRobot.Y_ACCELERATION); 
                }
            }
        }
        this.prevVelX = vel.x;
    }
}