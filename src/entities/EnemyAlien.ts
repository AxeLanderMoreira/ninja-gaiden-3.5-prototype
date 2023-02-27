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

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('enemy_alien', 'assets/EnemyAlien.png', {
            frameWidth: 22,
            frameHeight: 32
        });
    }

    readonly WALKING_SPEED = 80;
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
        this.sprite.setGravityY(0, Globals.GRAVITY / 2); // have a more "floaty" jump
    }

    onBeginState(oldState: string, newState: string): void {
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
        super.onBeginState(oldState, newState);
    }

    onEndState(state: string, newState: string): void {

    }

    // TODO Not working fine yet
    /**
     * Checks if this EnemyAlien progress is blocked by a tile ahead, in which 
     * case it will jump.
     * @returns true if blocked
     */
    private _checkBlockedByTile():  boolean {
        let _x = this.sprite.x + (this.facing * this.sprite.body.halfWidth); // 1/2 body ahead if facing forward, 1/2 body backwards otherwise
        let _y = this.sprite.y + 8;//this.sprite.body.halfHeight;
        let tilemapLayer = this.scene.getMapPlatformLayer();
        let tile = tilemapLayer.getTileAtWorldXY(_x, _y);
        //console.log('[EnemyAlien.checkBlockedByTile] _x = ' + _x + ', _y = ' + _y);
        //console.log('[EnemyAlien.checkBlockedByTile] tile == null ? '+ (tile == null) );
        // TODO May need a more sophisticate check, actually if the tile has
        // collision enabled (via TileMapLayer.setCollision/setCollisionBetween etc)
        return (tile != null);
    }

    setMapPosition(x: number, y: number): void {
        // At this point, we know the correct facing has been determined
        super.setMapPosition(x, y);
        this.setState('jump');
    }

    update(): void {
        super.update();
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
                if (this._checkBlockedByTile() || !body.onFloor()) { // falling
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
