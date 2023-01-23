// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import GameSegment from "../scenes/GameSegment";
import Enemy from "./Enemy";

export default class EnemyAlien extends Enemy {
    
    static initAnims (scene: GameSegment) {
      scene.createAnim('enemy_alien', 0, 'jump', {frames: [0]}, 200, -1);
      scene.createAnim('enemy_alien', 0, 'run', {start: 0, end: 1}, 200, -1);
      scene.createAnim('enemy_alien', 1, 'jump', {frames: [2]}, 200, -1);
      scene.createAnim('enemy_alien', 1, 'run', {start: 2, end: 3}, 200, -1);
    }

    readonly WALKING_SPEED = 80;
    readonly DEBUG_PLACEMENT = false;
    static readonly JUMP_SPEED = -300; // Initial jump velocity Y

    /**
     * Constructor for EnemyAlien, which can have multiple appearances and a 
     * unified behavior (running, jumping and ramming through the player).
     * 
     * @param scene 
     * @param sprite 
     * @param variant undefined for Act I variant, >=1 for other variants.
     * @returns 
     */
    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.setCustomHitbox(new Phaser.Geom.Rectangle(6, 0, 15, 32));
        if (this.DEBUG_PLACEMENT) {
            this.sprite.body.allowGravity = false;
            return;
        }
        this.sprite.setGravityY(0, Globals.GRAVITY / 2); // have a more "floaty" jump
        this.setState('jump');
        console.log("[EnemyAlien constructor] this.facing = " + this.facing);
    }

    onBeginState(newState: string): void {
        console.log("[EnemyAlien.obBeginState] (" + newState + ")");
        switch(newState) {
            case 'jump':
                console.log('just started jump state on EnemyAlien');                
                this.sprite.setVelocity(this.WALKING_SPEED * this.facing, EnemyAlien.JUMP_SPEED);
                break;
            case 'run':
                this.sprite.setVelocity(this.WALKING_SPEED * this.facing, 0);
                break;
        }
        super.onBeginState(newState);
    }

    onEndState(state: string, newState: string): void {

    }

    update(): void {
        super.update();
        if (this.DEBUG_PLACEMENT) {
            return;
        }
        const body : Phaser.Physics.Arcade.Body = this.sprite.body;
        switch(this.state) {
            case 'jump':
                // TOOO tá falhando essa verificação agora...
                if (body.onFloor()) { // landing
                    this.setState('run');                    
                } else if (body.onWall()) { // rebounding
                    this.turn(-this.facing);
                    this.sprite.setVelocityX(this.WALKING_SPEED * this.facing);
                }
                break;
            case 'run':
                if (!body.onFloor()) { // falling
                    this.setState('jump');
                } else if (body.onWall()) { // turning
                    this.turn(-this.facing);
                    this.sprite.setVelocityX(this.WALKING_SPEED * this.facing);
                }                
                break;
            default:
                throw new Error('Unknown or unhandled state "' + this.state + '" for "' + EnemyAlien.name + '"');
        }
    }
    
}
