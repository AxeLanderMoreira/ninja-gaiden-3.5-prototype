// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import Enemy from "./Enemy";

export default class EnemySoldier extends Enemy {

    readonly WALKING_SPEED = 24;
    edgeBox?: Phaser.GameObjects.Rectangle;

    static initAnims (scene: GameSegment) {
        scene.createAnim('enemy_soldier', 0, 'walk', {start: 0, end: 1}, 600, -1);
    }

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('enemy_soldier', 'assets/EnemySoldier.png', {
            frameWidth: 24,
            frameHeight: 31
        });
    }

    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.setCustomHitbox(new Phaser.Geom.Rectangle(0, 0, 16,30));
        this.setState('walk');
    }

    onBeginState(oldState: string, newState: string): void {
        switch(newState) {
            case 'walk':
                this.sprite.setVelocity(this.WALKING_SPEED *this.facing, 0);
                break;
            default:
                break;
        }
        super.onBeginState(oldState, newState);
    }

    onEndState(state: string, newState: string) {
        
    }


    // TODO Must add a checkFallFromPlatform() mthod too, and check it on update()

    /**
     * Checks if this EnemySoldier is about to fall from a PlatformLayer's tile
     * it is currently standing on. 
     * @returns true if about to fall
     */
    checkFallFromTile():  boolean {
        let _x = this.sprite.x + this.facing; // 1 pixel ahead if facing forward, 1 pixel backwards otherwise
        let _y = this.sprite.y + this.sprite.body.halfHeight + 1; // sprite position is on middle
        let tilemapLayer = this.scene.getMapPlatformLayer();
        let tile = tilemapLayer.getTileAtWorldXY(_x, _y);
        // TODO May need a more sophisticate check, actually if the tile has
        // collision enabled (via TileMapLayer.setCollision/setCollisionBetween etc)
        return (tile == null);
    }

    update(): void {
        let oops: boolean = this.checkFallFromTile();
        const body : Phaser.Physics.Arcade.Body =  this.sprite.body;
        super.update();
        switch(this.state) {
            case 'walk':
                if (oops || body.onWall()) { // turn around
                    this.turn(-this.facing);
                    this.sprite.setVelocityX(this.WALKING_SPEED * this.facing);
                }
                break;
            default:
                throw new Error('Unknown or unhandled state "' + this.state + '" for "' + EnemySoldier.name + '"');
        }
    }

}