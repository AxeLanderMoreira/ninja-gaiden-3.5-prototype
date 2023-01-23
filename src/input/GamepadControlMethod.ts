// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";
import ControlMethod from "./ControlMethod";

export default class GamepadControlMethod extends ControlMethod {
    //scene: Phaser.Scene;
    pad: Phaser.Input.Gamepad.Gamepad;
    prevStatus: any;
    currStatus: any;
    
    constructor(scene: Phaser.Scene, index: integer) {
        console.log('[GamepadControlMethod] constructor - IN');
        super();
        this.pad = scene.input.gamepad.gamepads[index];
        this.currStatus = {
            a: false,
            b: false,
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.prevStatus = {
            a: false,
            b: false,
            up: false,
            down: false,
            left: false,
            right: false
        };
        console.log('[GamepadControlMethod] constructor - OUT');
    };

    hit(btn: string): boolean {
        return (this.currStatus[btn] && !this.prevStatus[btn]);
    };
    
    held(btn: string): boolean {
        return this.currStatus[btn];
    };

    update():void {
        //console.log('[GamepadControlMethod.update] IN');
        this.prevStatus = this.currStatus;
        this.currStatus = {
            a: this.pad.A,
            b: this.pad.B,
            up: (this.pad.up) || (this.pad.leftStick.y < -.1),
            down: (this.pad.down) || (this.pad.leftStick.y > .1),
            left: (this.pad.left) || (this.pad.leftStick.x < -.1),
            right: (this.pad.right) || (this.pad.leftStick.x > .1)
        }
    };
}