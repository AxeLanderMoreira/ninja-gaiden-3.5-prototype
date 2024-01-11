// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import Hud from "../menus/Hud";
import PlayerHud from "../menus/PlayerHud";
import SpriteFont from "../menus/SpriteFont";
import BaseScene from "./BaseScene";

export default class PauseScreen extends BaseScene {
    font: SpriteFont;
    pausedScene?: Phaser.Scene;
    bg: Phaser.GameObjects.Rectangle;
    
    constructor() {
        super('PauseScreen');
        this.msgGlyphs = [];
    }

    create(ctx?: any): void {
        super.create(ctx);
        this.bg = this.add.rectangle(0, 0, Globals.SCREEN_WIDTH, Globals.SCREEN_HEIGHT, 0x000000);
        this.bg.setAlpha(0.5);
        this.font = new SpriteFont(this);
        let _x = Globals.SCREEN_WIDTH / 2;
        let _y = (Globals.SCREEN_HEIGHT / 2) - (SpriteFont.CHAR_HEIGHT / 2);
        this.font.putGlyphs('PAUSE', _x, _y, SpriteFont.H_ALIGN_CENTER);
        this.bg.setPosition(_x, _y);
        this.pausedScene = ctx.pausedScene;
    }

    preload(): void {
        
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        if (this.anyInputHit('start')) {
            this.pausedScene.scene.resume();
            this.scene.stop();
        }
    }

}
