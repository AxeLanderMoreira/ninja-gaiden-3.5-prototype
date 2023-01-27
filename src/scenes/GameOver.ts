// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import BaseScene from "./BaseScene";
import { Globals } from "../Globals";
import SpriteFont from "../menus/SpriteFont";

export default class GameOver extends BaseScene {
    font: SpriteFont;
    kbPlugin: Phaser.Input.Keyboard.KeyboardPlugin;
    msgGlyphs: Phaser.GameObjects.Sprite[];
    padPlugin: Phaser.Input.Gamepad.GamepadPlugin;    
    
    constructor() {
        super('GameOver');
        this.msgGlyphs = [];
    }
    
    create(data?: any) {
        super.create(data);
        this.font = new SpriteFont(this);
        let _x = Globals.SCREEN_WIDTH / 2;
        let _y = (Globals.SCREEN_HEIGHT / 2) - (SpriteFont.CHAR_HEIGHT / 2);
        this.font.putGlyphs('GAME OVER', _x, _y, SpriteFont.H_ALIGN_CENTER);
        this.cameras.main.fadeIn(1000);
        // TODO Change to ControlMethod.anyHit...
        this.kbPlugin = this.input.keyboard.on('keydown', event => {
            console.log("Pressed " + event.key);            
            this._backToTitle();
        });        
        this.padPlugin = this.input.gamepad.on('down', event => {
            console.log("Pressed " + event.button + " on " + event.pad);            
            this._backToTitle();
        });
    }

    private _backToTitle() {
        this.scene.start('TitleScreen');
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
    }
}