// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import ControlMethod from "./ControlMethod";

export default class KeyboardControlMethod extends ControlMethod {
    static readonly DEFAULT_MAPPED_A_BUTTON = 'Z';
    static readonly DEFAULT_MAPPED_B_BUTTON = 'X';
    static readonly DEFAULT_MAPPED_START_BUTTON = Phaser.Input.Keyboard.KeyCodes.ENTER;
    aKey: Phaser.Input.Keyboard.Key;
    bKey: Phaser.Input.Keyboard.Key;
    startKey: Phaser.Input.Keyboard.Key;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private static s_instance: KeyboardControlMethod; // works as a singleton
    
    private constructor(scene: Phaser.Scene) {
        super();
        this.resetScene(scene);
    };

    static get(scene: Phaser.Scene) {
        if (!this.s_instance) {
            this.s_instance = new KeyboardControlMethod(scene);
        } else {
            this.s_instance.resetScene(scene);
        }
        return this.s_instance;
    }

    hit(btn: string): boolean {
        //console.log('[KeyboardControlMethod.hit] btn=' + btn + "; IN");        
        switch(btn) {
            case 'a': return Phaser.Input.Keyboard.JustDown(this.aKey);
            case 'b': return Phaser.Input.Keyboard.JustDown(this.bKey);
            case 'up': return Phaser.Input.Keyboard.JustDown(this.cursors.up);
            case 'down': return Phaser.Input.Keyboard.JustDown(this.cursors.down);
            case 'left': return Phaser.Input.Keyboard.JustDown(this.cursors.left);
            case 'right': return Phaser.Input.Keyboard.JustDown(this.cursors.right);
            case 'start': return Phaser.Input.Keyboard.JustDown(this.startKey);
            default: return false;
        }
    };
    
    held(btn: string): boolean {
        switch(btn) {
            case 'a': return this.aKey.isDown; 
            case 'b': return this.bKey.isDown;
            case 'up': return this.cursors.up.isDown;
            case 'down': return this.cursors.down.isDown;
            case 'left': return this.cursors.left.isDown;
            case 'right': return this.cursors.right.isDown;
            case 'start': return this.startKey.isDown;
            default: return false;
        }
    };

    // redefined from base class
    resetScene(scene: Phaser.Scene) {
        this.aKey = scene.input.keyboard.addKey(KeyboardControlMethod.DEFAULT_MAPPED_A_BUTTON);
        this.bKey = scene.input.keyboard.addKey(KeyboardControlMethod.DEFAULT_MAPPED_B_BUTTON);
        this.startKey = scene.input.keyboard.addKey(KeyboardControlMethod.DEFAULT_MAPPED_START_BUTTON);
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    update():void {
        
    };
}
