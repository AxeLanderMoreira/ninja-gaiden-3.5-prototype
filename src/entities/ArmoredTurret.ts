// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import Bullet from "./Bullet";
import Enemy from "./Enemy";
import Entity from "./Entity";
import Ninja from "./Ninja";

/**
 * 
 */
export default class ArmoredTurret extends Enemy {
    static readonly TIME_TO_OPEN = 2000; // Time to remain closed, in milliseconds
    // 3000 just for test purposes? Actually 1000?
    //static readonly TIME_OPEN = 1000;   // Same for open
    static readonly BULLET_SPEED = 96;  // Same as Ninja's WALKING SPEED
    static readonly OPEN_FIRE_DELAY = 500; // Time in milliseconds between opening the mouth and shooting first bullet
    static readonly FIRE_RATE = 500; // Interval between each nth bullet
    static readonly MAX_BULLETS = 2; // # of bullets to shoot each time the mouth opens
    static readonly TIME_TO_CLOSE = 500; // Time to close after shooting last bullet

    player: Ninja;
    bulletsShot: integer; // Reset every time mouth closes
    timedEvent?: Phaser.Time.TimerEvent;

    static initAnims (scene:GameSegment) {
        scene.createAnim('armored_turret', 0, 'closed', {frames: [0]}, 100, -1);
        scene.createAnim('armored_turret', 0, 'open', {frames: [1]}, 100, -1);
        scene.createAnim('turret_bullet', 0, 'spark', {start: 0, end: 1}, 200, 0);
        scene.createAnim('turret_bullet', 0, 'bullet', {start: 2, end: 3}, 100, -1);
    }
    
    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('armored_turret', 'assets/ArmoredTurret.png', {
            frameWidth: 24,
            frameHeight: 32
        });
        scene.load.spritesheet('turret_bullet', 'assets/TurretBullet.png', {
            frameWidth: 9,
            frameHeight: 12
        });
    }

    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.setState('closed');        
    }

    destroy() {
        super.destroy();
        if (this.timedEvent) {
            this.timedEvent.remove();
            delete this.timedEvent;
        }        
    }

    gotHit(other: Entity): boolean {
        if (this.state == 'closed') {
            // invincible while closed
            return false;
        }
        return super.gotHit(other);
    }

    private _fire() {
        this.bulletsShot++;
        let sprite = this.scene.enemyGroup.create(0, 0, 'turret_bullet');        
        let bullet = new Bullet(this, sprite, false, true);
        sprite.setData('type', 'TurretBullet');
        sprite.setData('parent', bullet);
        bullet.fire(0, 14, ArmoredTurret.BULLET_SPEED, 0);
        console.log('[ArmoredTurret._fire] this.bulletsShot = ' + this.bulletsShot);
        if (this.bulletsShot < ArmoredTurret.MAX_BULLETS) {
            console.log('[ArmoredTurret._fire] fire again in ' + ArmoredTurret.FIRE_RATE + ' milliseconds');
            this.timedEvent = this.scene.time.delayedCall(ArmoredTurret.FIRE_RATE, () => {
                this._fire();
            })
        } else {
            console.log('[ArmoredTurret._fire] close turret in' + ArmoredTurret.TIME_TO_CLOSE + ' milliseconds');
            this.timedEvent = this.scene.time.delayedCall(ArmoredTurret.TIME_TO_CLOSE, () => {
                this.setState('closed');
            })
        }
    }

    onBeginState(oldState: string, newState: string) {        
        switch(newState) {
            case 'closed':
                this._lockOnNearestPlayer();
                this.bulletsShot = 0;
                break;
            case 'open':
                // TODO Implement
                //this._fire();
                this.timedEvent = this.scene.time.delayedCall(ArmoredTurret.OPEN_FIRE_DELAY, () => {
                    this._fire();                    
                });
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
        
        switch (this.state) {
            case 'closed':
                // TODO Implement invincibility and sound effects
                // Automatically turn in the direction of player (locked onto)
                if (this.player) {
                    if (this.facing > 0 && this.player.sprite.body.x < this.sprite.body.x) {
                        this.turn(-1);
                    } else if (this.facing < 0 && this.player.sprite.body.x > this.sprite.body.x) {
                        this.turn(1);
                    }
                }
                if (this.getStateTime() > ArmoredTurret.TIME_TO_OPEN) {
                    this.setState('open');
                }
                break;
            case 'open':                
                break;
            default:
                break;
        }
    }


    /**
     * Will 'lock-on' to the y position of the nearest player, and keep moving 
     * on the same constant x speed and direction until reach the edge of the 
     * screen.
     */
    private _lockOnNearestPlayer() {
        this.player = this.getNearestPlayer();
    }
    
}