// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import Enemy from "./Enemy";

export default class DroidBall extends Enemy {
    static rect1: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
    static rect2: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();

    static readonly MAX_BOUNCE_Y_SPEED = -300; /**< Max vertical speed per bounce */
    static readonly MIN_BOUNCE_Y_SPEED = -150; /**< Min vertical speed per bounce */
    static readonly MAX_BOUNCE_X_SPEED = 64;   /**< Max horizontal speed per bounce */
    static readonly MIN_BOUNCE_X_SPEED = 32;   /**< Min horizontal speed per bounce */    
    
    /**
     * Horizontal direction of bouncing:
     * 0: waiting, -1: left, 1: right
     */
    direction: integer; 
    player?: Phaser.Physics.Arcade.Sprite;
    xspeed: number;


    static initAnims (scene: GameSegment) {        
        scene.createAnim('droid_ball', 0, 'wait', {frames: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]}, 2000, -1);
        scene.createAnim('droid_ball', 0, 'bounce', {start: 2, end: 5}, 400, -1);        
    }

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('droid_ball', 'assets/DroidBall.png', {
            frameWidth: 16,
            frameHeight: 16
        })
    }
  
    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.direction = 0;        
        // TODO Change the 'scene' parameter in Entity and all subclasses
        // to GameSegment
        this.setState('wait');
        
    }

    onBeginState(newState: string) {        
        switch(newState) {
            case 'bounce':
                this._bounce(); // First bounce is always away
                break;
            default:
                break;
        }
        super.onBeginState(newState);
    }

    onEndState(state: string, newState: string) {
        // TODO Implement
    }
    
    update() {        
        super.update();
        switch(this.state) {
            case 'wait':
                // First rectangle is a proximity sensor that extrapolates the DroidBall area like this:
                //____
                //|   |
                //|   |
                //| o |
                // ---        
                Phaser.Display.Bounds.GetBounds(this.sprite, DroidBall.rect1);
                DroidBall.rect1.x -= 16;
                DroidBall.rect1.width += 32;
                DroidBall.rect1.y -= 32;
                DroidBall.rect1.height += 32;                
                // Second rectangle is the Ninja body
                this.scene.players.forEach(player => {
                    Phaser.Display.Bounds.GetBounds(player.sprite, DroidBall.rect2);               
                    if (Phaser.Geom.Intersects.RectangleToRectangle(DroidBall.rect1, DroidBall.rect2)) {
                        this.player = player.sprite; // This DroidBall will follow this Player forever
                        this.setState("bounce");
                    }
                });                
                // Credits to samme for detailing a way to check collision between two rectangles 
                // outside of Phaser.Physics
                // Link for reference:
                // https://phaser.discourse.group/t/test-intersection-of-two-game-objects-phaser-3/8021
                break;
            case 'bounce':
                if (this.sprite.body.onFloor()) {
                    this._bounce(true); // bounce towards
                } else if (this.sprite.body.onWall()) {
                    this.direction = -this.direction;
                    this.sprite.setVelocityX(this.direction * this.xspeed);
                }
                break;                
        }        
    }

    /**
     * Initiate a new bounce, from the floor
     * @param towards true if DroidBall should bounce towards the player;
     * false if DroidBall should bounce away from the player
     */
    private _bounce(towards: boolean) {
        if (this.sprite.body.x < this.player.body.x) {
            // DroidBall is located left of the Player
            this.direction = towards ? 1 : -1;
        } else {
            // DroidBall is located right of the Player
            this.direction = towards ? -1 : 1;
        }
        this.xspeed = Phaser.Math.Between(DroidBall.MIN_BOUNCE_X_SPEED, DroidBall.MAX_BOUNCE_X_SPEED);
        let yspeed = Phaser.Math.Between(DroidBall.MIN_BOUNCE_Y_SPEED, DroidBall.MAX_BOUNCE_Y_SPEED);        
        this.sprite.setVelocity(this.direction * this.xspeed, yspeed);
    }
}