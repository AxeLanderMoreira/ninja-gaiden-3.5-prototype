// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import ProximitySensor from "../utils/ProximitySensor";
import Bullet from "./Bullet";
import Enemy from "./Enemy";
import Ninja from "./Ninja";

export default class BlobSpikeBall extends Enemy {
    static readonly BULLET_SPEED = 96;  // Same as Ninja's WALKING SPEED
    static readonly ROLLING_MOTION_SPEED = 96; // Same as Ninja speed
    static readonly ROLLING_ROTATE_SPEED = 4; // In degrees per frame
    static readonly TIME_TO_PULSE = 2500; // Time until beginning pulse animation, before shooting
    static readonly TIME_TO_SHOOT = 500; // Time to finish the pulse animation and shoot

    noBlobForm: boolean;
    noSpikeForm: boolean;
    orientation: integer;
    rotation: number; // rotation while rolling
    rolling: boolean;
    sensor?: ProximitySensor;
    posAdjusted: boolean;
    // TODO have a 'rolling' flag, which will be set to true even when in 
    // 'fall' state, and keep the ball rolling once started.

    static initAnims (scene: GameSegment) {
        scene.createAnim('blob_spike_ball', 0, 'wait', {frames: [1]}, 100, -1);
        scene.createAnim('blob_spike_ball', 0, 'pulse', {start: 1, end: 0}, 100, -1);
        scene.createAnim('blob_spike_ball', 0, 'roll', {frames: [2]}, 100, -1);
        scene.createAnim('blob_spike_ball', 0, 'fall', {frames: [2]}, 100, -1);
        scene.createAnim('blob_spike_bullet', 0, 'bullet', {frames: [0]}, 100, -1);
    }

    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('blob_spike_ball', 'assets/BlobSpikeBall.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        scene.load.spritesheet('blob_spike_bullet', 'assets/BlobSpikeBullet.png', {
            frameWidth: 6,
            frameHeight: 6
        });
    }

    /**
     * 
     * @param scene 
     * @param sprite 
     * @param noBlobForm 
     * @param noSpikeForm 
     * @param orientation 
     */
    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, noBlobForm?: boolean, noSpikeForm?: boolean, orientation?: integer) {
        console.log('[BlobSpikeBall constructor] IN - orientation = ' + orientation);
        super(scene, sprite, 0);
        this.noBlobForm = !!noBlobForm;
        this.noSpikeForm = !!noSpikeForm;
        console.log('[BlobSpikeBall constructor] IN - noBlobForm = ' + this.noBlobForm);
        console.log('[BlobSpikeBall constructor] IN - noSpikeForm = ' + this.noSpikeForm);
        this.orientation = orientation || 0;
        this.posAdjusted = false;
        if (orientation) {            
            this.sprite.setRotation(orientation * (Math.PI/180));
        }
        this.rotation = 0;
        this.rolling = false;
        if (!this.noBlobForm && !this.noSpikeForm) {
            this.sensor = new ProximitySensor(this, 64, 64, 0, 1);
            this.sensor.onPlayerIn((player, numIn) => {
                console.log('[BlobSpikeBall.onPlayerIn] IN');
                if (this.state == 'wait') {
                    this.setState('roll');
                }
            });
            this.sensor.onPlayerOut((player, numIn) => {
                if (numIn == 0 && this.state == 'roll') {
                    this.setState('wait');
                }
            });
        }
        this.setState(noBlobForm ? 'fall' : 'wait');
    }

    private _fire() {
        //let bullet = new Bullet(this, sprite, false, false);
        let offsetX = 0;
        let offsetY = 0;
        let velX = 0;
        let velY = 0;
        let bullets = new Array<Bullet>(3);
        // offset from where the bullets will be shot out
        offsetX = this.sprite.body.halfWidth;
        offsetY = this.sprite.body.halfHeight;
        // 3 bullets in total
        for (let i = 0; i < 3; i++) {
            let sprite = this.scene.enemyGroup.create(0, 0, 'blob_spike_bullet');
            bullets[i] = new Bullet(this, sprite, false, false);
            sprite.setData('type', 'BlobSpikeBullet');
            sprite.setData('parent', bullets[i]);
            let orientation: integer; // bullet orientation
            switch (i) {
                case 0: // upwards of current orientation
                    orientation = this.orientation;
                    break;
                case 1: // to the right of current orientation
                    orientation = (this.orientation + 90)  % 360;
                    break;
                case 2: // to the left of current orientation
                    orientation = (this.orientation + 270) % 360;
                    break;                    
            }
            velX = velY = 0;
            switch (orientation) {
                case 0:
                    velY = -BlobSpikeBall.BULLET_SPEED;
                    break;
                case 90:
                    velX = -BlobSpikeBall.BULLET_SPEED;
                    break;
                case 180:
                    velY = BlobSpikeBall.BULLET_SPEED;
                    break;
                case 270:
                    velX = BlobSpikeBall.BULLET_SPEED;
                    break;
            }
            bullets[i].fire(offsetX, offsetY, velX, velY);
        }        
    }

    onBeginState(oldState: string, newState: string) {        
        switch(newState) {
            case 'fall':
                break;
            case 'roll':
                this.rolling = true;
                let ninja: Ninja = this.getNearestPlayer();
                if (ninja.sprite.body.x < this.sprite.body.x) {
                    this.turn(-1);
                } else {
                    this.turn(1);
                }
                this.sprite.setVelocityX(this.facing * BlobSpikeBall.ROLLING_MOTION_SPEED);
                this.sprite.body.allowGravity = true;
                break;
            case 'wait':
                this.sprite.setVelocity(0);
                this.sprite.setRotation(this.orientation * (Math.PI/180));
                this.sprite.body.allowGravity = false;
                break;
            default:
                break;
        }
        super.onBeginState(oldState, newState);
    }

    onEndState(state: string, newState: string) {
        // TODO Implement
    }

    // overridden
    setMapPosition(x: number, y: number): void {
        let _x = x;
        let _y = y;
        switch(this.orientation) {
            case 0:
                _x += this.sprite.body.halfWidth;
                break;
            case 90:                
                _y += this.sprite.body.height + this.sprite.body.halfHeight;
                break;
            case 180:
                _x -= this.sprite.body.width + this.sprite.body.halfWidth;;
                _y += this.sprite.body.height;
                break;
            case 270:
                _x -= this.sprite.body.width;
                _y -= this.sprite.body.halfHeight;
                break;
        }
        super.setMapPosition(_x, _y)
        
    }

    update() {
        super.update();
        if (this.sensor) {
            this.sensor.update(); // may change the state
        }
        if (this.rolling) {
            this.rotation += this.facing * BlobSpikeBall.ROLLING_ROTATE_SPEED;
        }
        switch (this.state) {
            case 'fall':
                if (this.sprite.body.onFloor()) {
                    this.setState("roll");
                }
                break;
            case 'pulse':
                if (this.getStateTime() >= BlobSpikeBall.TIME_TO_SHOOT) {
                    this._fire();
                    this.setState('wait');
                }
                break;
            case 'roll':
                if (!this.sprite.body.onFloor()) {
                    this.setState("fall");
                } else if (this.sprite.body.onWall()) {
                    this.turn(-this.facing);
                    this.sprite.setVelocityX(this.facing * BlobSpikeBall.ROLLING_MOTION_SPEED);
                } else {
                    this.sprite.setRotation(this.rotation * (Math.PI/180));
                }
                break;
            case 'wait':
                if (this.getStateTime() >= BlobSpikeBall.TIME_TO_PULSE) {
                    this.setState('pulse');
                }
                break;
            default:
                break;
        }
    }
    
}