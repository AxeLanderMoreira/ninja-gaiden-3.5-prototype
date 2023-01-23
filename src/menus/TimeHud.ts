// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import GameSegment from "../scenes/GameSegment";
import Hud from "./Hud";
import SpriteFont from "./SpriteFont";

export default class TimeHud extends Hud {
    private static readonly MARGIN_WIDTH = 4;
    timerGlyphs:  Phaser.GameObjects.Sprite[];
    lastTime: number; /**< Last displayed time */

    constructor(scene: GameSegment) {        
        let w = (SpriteFont.CHAR_WIDTH * 8) + TimeHud.MARGIN_WIDTH * 2; // 8 characters ("TIME:XXX")
        let x = (Globals.SCREEN_WIDTH / 2) - w/2;
        let y = TimeHud.MARGIN_WIDTH;
        let h = TimeHud.MARGIN_WIDTH * 2 + SpriteFont.CHAR_HEIGHT;
        super(scene, new Phaser.Geom.Rectangle(x, y, w, h));
        //super(scene, new Phaser.Geom.Rectangle(120, 4, 56, 16)); // TODO Adjust height
        this.timerGlyphs = [];
        this._buildTimer();
    }

    update(): void {
        this._updateTimer();
    }

    /**
     * 
     * @returns 
     */
    private _buildTimer() {
        let time = Math.round(this.scene.getRemainingTime()/1000);
        this.lastTime = time;
        this.container.add(this.font.putGlyphs('TIME:', 4, 4));
        this.timerGlyphs =  this.font.putGlyphs(time.toString().padStart(3, '0'), 44, 4);
        this.container.add(this.timerGlyphs);
    }
    
    private _updateTimer() {
        // TODO Implement
        let time = Math.round(this.scene.getRemainingTime()/1000);
        if (time == this.lastTime) return; // Nothing changed from previous frame
        this.font.changeGlyphs(this.timerGlyphs, time.toString().padStart(3, '0'));
    }
}