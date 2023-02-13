// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import Entity from "./Entity";
import Explod from "./Explod";
import Ninja from "./Ninja";

export default abstract class Enemy extends Entity {
    hovering: boolean = false; // a floating Entity has collision with platforms disabled

    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.turn(-1); // TODO Get reverse of current Level's forward direction
    }

    destroy() {
        this.sprite.disableBody(true, true);
        let idx = this.scene.enemies.indexOf(this);
        if (idx >= 0) {
            this.scene.enemies.splice(idx, 1);
        }
        this.scene.enemyGroup.remove(this.sprite);
        super.destroy();
    }

    getAttackStrength(): integer {
        return 3; // higher damage for testing game over easily
    }

    getNearestPlayer(): Ninja {
        let ret: Ninja;
        let distance: number;
        let lowestDistance: number = Infinity;
        this.scene.players.forEach(player => {
            let a = player.sprite.body.position;
            let b = this.sprite.body.position;
            distance = Phaser.Math.Distance.BetweenPoints(a, b);
            if (distance < lowestDistance) {
                lowestDistance = distance;
                ret = player;
            }
        });
        return ret;
    }

    /**
     * 
     */
    gotHit(other: Entity): boolean {
        super.gotHit(other);
        if (this.hp <= 0) {
            new Explod(this).spawn(); // Explod.spawn() is not related to Entity.spawn() (different signatures)            
            this.destroy();
            return true;
        }
        return false;
    }

    spawn(group: Phaser.Physics.Arcade.Group) {
        group.add(this.sprite);        
    }

}
