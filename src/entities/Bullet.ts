// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Enemy from "./Enemy";
import Entity from "./Entity";

export default class Bullet extends Enemy {
    parent: Enemy;
    indestructible: boolean;
    //vel: Phaser.Math.Vector2;
    //acc: Phaser.Math.Vector2;
    //maxVel: Phaser.Math.Vector2;
    velX: number;
    velY: number;
    accX: number;
    accY: number;
    maxVelX: number;
     maxVelY: number;

    // Define 'off-screen time': time that a Bullet can stay off camera before
    // being removed effectively from game

    // Every bullet must have a 'spark' and a 'bullet' animations
    // Every indestructible bullet must override gotHit() with return false;

    /**
     * 
     * @param parent 
     * @param sprite 
     * @param offset 
     */
    constructor(parent: Enemy, indestructible: boolean, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(parent.scene, sprite, variant);
        this.indestructible = indestructible;
        this.parent = parent;
        this.sprite.body.allowGravity = false;
        this.sprite.setDepth(parent.sprite.depth + 1);
        this.sprite.setVisible(false);
    }

    // Criar um método fire, com speed, e tal
    fire(offsetX: number, offsetY: number, velX: number, velY: number, accX?: number, accY?: number, maxVelX?: number, maxVelY?: number) {        
        this.turn(this.parent.facing);
        this.velX = velX;
        this.velY = velY;
        if (accX) this.accX = accX;
        if (accY) this.accY = accY;
        if (maxVelX) this.maxVelX = maxVelX;
        if (maxVelY) this.maxVelY = maxVelY;
        let pbody = this.parent.sprite.body;
        if (this.facing > 0) {
            offsetX+=pbody.width;
        }
        this.sprite.setPosition(pbody.x + offsetX,
                                pbody.y + offsetY);
        this.sprite.setVisible(true);
        this.setState('spark');
    }

    gotHit(other:Entity): boolean {
        if (this.indestructible || this.state != 'bullet') {
            return false;
        }
        return super.gotHit(other);
    }

    onBeginState(oldState: string, newState: string) {
        // TODO Implement logic
        switch(newState) {
            case 'spark':
                this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    this.setState('bullet');
                });
                break;
            case 'bullet':
                this.sprite.setVelocity(this.facing * this.velX, this.velY);
                if (this.accX) this.sprite.setAcceleration(this.facing * this.accX, this.accY);
                if (this.maxVelX) this.sprite.setMaxVelocity(this.maxVelX, this.maxVelY);
                break;
            default:
                break;
        }
        super.onBeginState(oldState, newState);
    }

    onEndState(state: string, newState: string) {
        // TODO Implement
    }

    update(): void {
        super.update();
    }
}