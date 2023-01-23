// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export default class GamepadDeviceManager {
  
    static getNumberOfDevices(scene: Phaser.Scene): integer {
        if (scene.input.gamepad) {
            if (scene.input.gamepad.enabled && scene.input.gamepad.total) {
                console.log('[GamepadDeviceManager.getNumberOfDevices] # of devices = ' + scene.input.gamepad.total);
                return scene.input.gamepad.total;
            } else {
                /*if (!GamepadDeviceManager.emitter) {
                    GamepadDeviceManager.emitter = new Phaser.Events.EventEmitter();
                }*/
            }
        } else {
            console.log('[GamepadDeviceManager.getNumberOfDevices] scene.input.gamepad is not defined. Give up');
        }
        return 0;
    }
}