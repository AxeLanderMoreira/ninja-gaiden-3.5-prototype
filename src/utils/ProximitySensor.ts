// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Enemy from "../entities/Enemy";
import Ninja from "../entities/Ninja";

enum AnchorX {
    Back = -1,  /**< Proximity sensor initiates from the body's back, and extends 2*radiusX to the front*/
    Center = 0, /**< Proximity sensor initiates from the body's center and extends radiusX on both sides */    
    Front = 1,  /**< Proximity sensor initiates from the body's front, and extends 2*radiusX to the back*/
}

enum AnchorY {
    Top = -1,   /**<Proximity sensor initiates from the body's top, and extends 2*radiusY  downwards */
    Middle = 0, /**< Proximity sensor initiates from the body's middle and extends radiusY on both directions */
    Bottom = 1  /**<Proximity sensor initiates from the body's bottom, and extends 2*radiusY  upwards */
}

/**
 * Some enemies require to react whenever a player comes close to its vicinity,
 * so a "proximity sensor" abstraction is needed. 
 */
export default class ProximitySensor {
    static rect1: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
    static rect2: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
    parent: Enemy;
    radiusX: number;
    radiusY: number;
    anchorX: AnchorX;
    anchorY: AnchorY;
    cbPlayerIn?: (player: Ninja, numIn: integer) => void;
    cbPlayerOut?: (player: Ninja, numIn: integer) => void;
    playersIn: Array<boolean>;
    playersOut: Array<boolean>;
    numIn: integer;

    /**
     * 
     * @param parent  Enemy instance to which this ProximitySensor will be attached to
     * @param radiusX Radius in the horizontal axis, from the Enemy body's x position.
     * @param radiusY Radius in the vertical axis, from the Enemy body's y position.
     * @param anchorX Configure anchor in the Enemy body's x position: center (default), left or right
     * @param anchorY Configure anchor in the Enemy body's y position: middle (default), top or bottom
     */
    constructor(parent: Enemy, radiusX: number, radiusY: number = radiusX, anchorX: AnchorX = AnchorX.Center, anchorY: AnchorY = AnchorY.Middle) {
        this.parent = parent;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
        let numPlayers = this.parent.scene.numPlayers;
        this.playersIn = [];
        this.playersOut = [];
        for (let i = 0; i < numPlayers; i++) {
            this.playersIn.push(false);
            this.playersOut.push(true);
        }
        this.numIn = 0;
    }

    /**
     * Registers callback to be invoked whenever a player enters the proximity 
     * sensor.
     * @param cb Callback with two parameters: Ninja instance, and the current
     * number of players inside the proximity sensor.
     */
    onPlayerIn(cb: (player: Ninja, numIn: integer) => void) {
        this.cbPlayerIn = cb;
    }

    /**
     * Registers callback to be invoked whenever a player exits the proximity 
     * sensor.
     * @param cb Callback with two parameters: Ninja instance, and the current
     * number of players inside the proximity sensor.
     */
    onPlayerOut(cb: (player: Ninja, numIn: integer) => void) {
        this.cbPlayerOut = cb;
    }

    /**
     * Called from the Enemy's own update() cycle; required at every frame for
     * checking the collisions again
     */
    update() {
        Phaser.Display.Bounds.GetBounds(this.parent.sprite, ProximitySensor.rect1);
        let x = this.parent.sprite.body.x;
        let y = this.parent.sprite.body.y;
        let w = this.parent.sprite.body.width;
        let h = this.parent.sprite.body.height;
        switch (this.anchorX) {
            case AnchorX.Center:
                ProximitySensor.rect1.x -= (this.radiusX - (w/2));
                break;
            case AnchorX.Back:
                // TODO Adjust
                break;
            case AnchorX.Front:
                // TODO Adjust
                break;            
        }
        ProximitySensor.rect1.width = this.radiusX * 2;
        switch (this.anchorY) {
            case AnchorY.Middle:
                ProximitySensor.rect1.y -= (this.radiusY - (h/2));
                break;
            case AnchorY.Top:
                break;
            case AnchorY.Bottom:
                ProximitySensor.rect1.y = y - this.radiusY + (h/2);
                break;
        }
        ProximitySensor.rect1.height = this.radiusY * 2;
        let players: Array<Ninja> = this.parent.scene.players;

        for (let i = 0; i < players.length; i++) {
            // Check if alive
            Phaser.Display.Bounds.GetBounds(players[i].sprite, ProximitySensor.rect2);
            if (Phaser.Geom.Intersects.RectangleToRectangle(ProximitySensor.rect1, ProximitySensor.rect2)) {
                // TODO Handle logic based on this.playersIn[i]
                if (!this.playersIn[i]) {
                    this.numIn++;
                    this.playersIn[i] = true;
                    if (this.cbPlayerIn) {
                        this.cbPlayerIn(players[i], this.numIn);
                    }
                }
            } else {
                if (this.playersIn[i]) {
                    this.numIn--;
                    this.playersIn[i] = false;
                    if (this.cbPlayerOut) {
                        this.cbPlayerOut(players[i], this.numIn);
                    }
                }
            }
        }        
        // debug? draw?
    }
}