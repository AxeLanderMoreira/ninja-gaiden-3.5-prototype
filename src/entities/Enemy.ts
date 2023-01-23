// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import Entity from "./Entity";
import Explod from "./Explod";

export default abstract class Enemy extends Entity {
    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.turn(-1); // TODO Get reverse of current Level's forward direction
    }

    getAttackStrength(): integer {
        return 3; // higher damage for testing game over easily
    }

    /**
     * 
     */
    gotHit(other: Entity): boolean {
        super.gotHit(other);
        if (this.hp <= 0) {
            new Explod(this).spawn(); // Explod.spawn() is not related to Entity.spawn() (different signatures)
            this.sprite.disableBody(true, true);
            return true;
        }
    }

    spawn(group: Phaser.Physics.Arcade.Group) {
        group.add(this.sprite);        
    }

}