// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import ControlMethod from "../input/ControlMethod";
import GamepadControlMethod from "../input/GamepadControlMethod";
import GamepadDeviceManager from "../input/GamepadDeviceManager";
import KeyboardControlMethod from "../input/KeyboardControlMethod";
import VirtualPadControlMethod from "../input/VirtualPadControlMethod";

/**
 * This is the actual base class for any class deriving from Scene, in the
 * context of this project.
 * 
 * Known subclasses:
 * - TitleScreen
 * - MenuScreen
 * - GameSegment, which is the Base class for every actual game level:
 *    - Scene21Desert, Scene22Volcano etc
 */
export default abstract class BaseScene extends Phaser.Scene {

    // ControlMethods have to be carried over scene after scene
    ctrlMethods: ControlMethod[];

    /**
     * Returns true if any of the input devices currently active has registered
     * as holding down the specified button. Useful in Menus, where Players and
     * respective ControlMethods are not totally configured.
     * @param btn 
     * @returns 
     */
    anyInputHeld(btn: string): boolean {
        let ctrls = this.ctrlMethods;
        for (let i = 0; i < ctrls.length; i++) {
            if (ctrls[i].held(btn)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true if any of the input devices currently active has registered
     * as hitting the specified button in the current frame. Useful in Menus, 
     * where Players and respective ControlMethods are not totally configured.
     * @param btn 
     * @returns 
     */
    anyInputHit(btn: string): boolean {    
        //console.log('[BaseScene.anyInputHit] btn=' + btn);
        let ctrls = this.ctrlMethods;
        for (let i = 0; i < ctrls.length; i++) {
            //console.log('[BaseScene.anyInputHit] check hit for ' + ctrls[i].constructor.name);
            if (ctrls[i].hit(btn)) {
                return true;
            }
        }
        return false;
    }

    protected hasTouchScreen(): boolean  { return ('ontouchstart' in document.documentElement); }


    /**
     * Called upon the Scene creation, should recheck and reconfigure
     * the inputs.
     * @param data Context userdata that gets passed from Scene to Scene
     */
    create(ctx?: any) {
        if (ctx && ctx.ctrlMethods) {
            this.ctrlMethods = ctx.ctrlMethods; // carry over from previous screen
        } else {
            this.ctrlMethods = [];
            if (!this.hasTouchScreen()) {
                this.ctrlMethods.push(KeyboardControlMethod.get(this));
            } else {
                this.ctrlMethods.push(VirtualPadControlMethod.get(this));
            }            
        }
        this.refreshControlMethods();
        this.ctrlMethods.forEach(ctrl => {
            console.log('[BaseScene.create] ctrl.resetScene() for ' + this.constructor.name)
            ctrl.resetScene(this);
        });
    }

    preload() {
        if (this.hasTouchScreen()) {
            this.load.image('virtual_buttons', 'assets/VirtualButtons.png');
            this.load.image('virtual_dpad', 'assets/VirtualDPad.png');
        }        
    }

    /**
     * Updates and repopulates the ctrlMethods array according to the current 
     * state of input devices. 
     */
    public refreshControlMethods(): void {
        let ctrls: ControlMethod [] = this.ctrlMethods;
        let numPads: integer = GamepadDeviceManager.getNumberOfDevices(this);      
        if (numPads != (ctrls.length + 1)) {
            // keep keyboard/virtualpad at the end of array; gamepads have priority
            let lastOptionCtrl: ControlMethod = ctrls[ctrls.length - 1];
            console.log("lastOptionCtrl = " + lastOptionCtrl.constructor.name);
            ctrls.splice(0); //clear array
            for (let i = 0; i < numPads; i++) {
                ctrls.push(GamepadControlMethod.get(this, i));
            }
            ctrls.push(lastOptionCtrl);
        }
    }

    update(time: number, delta: number): void {
        // TODO Handle touch and Virtualpad here?
        this.refreshControlMethods();
        this.ctrlMethods.forEach(ctrl => {
            ctrl.update();
        });
    }
}
