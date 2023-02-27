// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import Enemy from "./Enemy";

export default class WaveFloater extends Enemy {    
    static readonly HOVER_X_SPEED = 48; // constant    
    static readonly MAX_HOVER_Y_SPEED = 128;
    /**< Offset in pixels added to the y coordinate of the 'locked-on' player, 
     *   which the enemy will use as "tolerance", before deciding it needs to 
     *   change direction. */
    static readonly V_TOLERANCE = 32;
    static readonly Y_ACCELERATION=4096;
    
    /** "Locked-on" player */
    player: Ninja;
    /** Intended direction of vertical movement: 1 for down, -1 for up */
    vmove: integer;
    lockedY: number;

    // TODO Test the results, and see if we need a locked-on position rather
    // than a locked-on player

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('wave_floater', 'assets/WaveFloater.png', {
            frameWidth: 24,
            frameHeight: 32
        });
    }

    static initAnims (scene: GameSegment) { // TODO Why not animating?
        scene.createAnim('wave_floater', 0, 'fly', {start: 0, end: 1}, 200, -1);
    }

    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        super(scene, sprite, variant);
        this.hovering = true;
        this.sprite.body.allowGravity = false;
        this.sprite.setMaxVelocity(WaveFloater.HOVER_X_SPEED, WaveFloater.MAX_HOVER_Y_SPEED);
        this.setState('fly');
    }

    setMapPosition(x: number, y: number) {
        super.setMapPosition(x, y);
        this._lockOnNearestPlayer();
    }

    /**
     * Will 'lock-on' to the y position of the nearest player, and keep moving 
     * on the same constant x speed and direction until reach the edge of the 
     * screen.
     */
    private _lockOnNearestPlayer() {
        let player: Ninja = this.getNearestPlayer();
        this.player = player;
        let _x = this.sprite.x;
        //let _y = player.sprite.body.y;
        let _y = this.sprite.y; // Uncomment above to lock-on to player position upon spawning
                                     // TODO Must implement better tracking
        this.lockedY = _y;
        this.sprite.setPosition(_x, _y);     
        console.log('[WaveFloater._lockOnNearestPlayer] this.lockedY = ' + this.lockedY)    
        console.log('[WaveFloater._lockOnNearestPlayer] this.facing = ' + this.facing)
        this.sprite.setVelocityX(this.facing * WaveFloater.HOVER_X_SPEED);
        this.vmove = -1;
    }

    onBeginState(oldState: string, newState: string): void {
        super.onBeginState(oldState, newState);
    }        

    onEndState(state: string, newState: string) {
        // TODO IMPLEMENT
    }

    private _flip(t: number) {
        return 1-t;
    }

    private _spike(t: number) {
        if (t<=.5) {
            return t/.5;
        }
        return this._flip(t)/.5;
    }

    private _sineInOut(t: number) {
		///return -0.5*(Math.cos(Math.PI*t) - 1);
       // return Math.sin(Math.PI*t);
       return Math.sin(t*(Math.PI/2));
	};

    /**
     * 
     * @param direction 
     */
    public turn(direction: integer) {
        super.turn(direction);
        this.sprite.setVelocityX(this.facing * WaveFloater.HOVER_X_SPEED);        
    }
    
    update() {
        super.update();
        switch(this.state) {
            case 'fly':
                let t = this.getStateTime()/200;
                let _amplitude = 40;
                let _y = this.lockedY;
                this.sprite.setY(_y + (_amplitude * Math.sin(t)));
                break;
            default:
                break;
        }
    }
}
