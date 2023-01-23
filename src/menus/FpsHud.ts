// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import Hud from "./Hud";
import SpriteFont from "./SpriteFont";

export default class FpsHud extends Hud {
    private static readonly MARGIN_WIDTH = 4;
    fpsGlyphs: Phaser.GameObjects.Sprite[];
    lastFps: number;

    constructor(scene: GameSegment) {  
              
        let w = (SpriteFont.CHAR_WIDTH * 8) + FpsHud.MARGIN_WIDTH * 2; // 8 characters ("FPS:60.0")
        let x = (Globals.SCREEN_WIDTH / 2) - w/2;
        let h = FpsHud.MARGIN_WIDTH * 2 + SpriteFont.CHAR_HEIGHT;
        let y = Globals.SCREEN_HEIGHT - h - FpsHud.MARGIN_WIDTH;
        super(scene, new Phaser.Geom.Rectangle(x, y, w, h));
        //super(scene, new Phaser.Geom.Rectangle(120, 4, 56, 16)); // TODO Adjust height
        this.fpsGlyphs = [];
        this._buildFps();
    }

    /**
     * Builds layout for FPS panel
     * @param offset_y Vertical offset where to display it, relative to the Container.
     * @returns Incremented offset_y value, where a next panel can be placed.
     */
    private _buildFps() {
        //let y = Globals.SCREEN_HEIGHT - FpsHud.MARGIN_WIDTH * 2 - SpriteFont.CHAR_HEIGHT;
        this.container.add(this.font.putGlyphs('FPS:', FpsHud.MARGIN_WIDTH, FpsHud.MARGIN_WIDTH));
        this.fpsGlyphs = this.font.putGlyphs('00.0', (FpsHud.MARGIN_WIDTH + 4 * SpriteFont.CHAR_WIDTH), FpsHud.MARGIN_WIDTH);
        this.container.add(this.fpsGlyphs);
    }

    update(): void {
        this._updateFps();
    }

    /**
     * 
     * @returns 
     */
    private _updateFps() {
        let fps = this.scene.game.loop.actualFps;
        if (fps == this.lastFps) return; // Nothing changed from previous frame
        this.lastFps = fps;
        let fpt = Math.round(this.scene.game.loop.actualFps * 10); // frames per tenth of a second
        let label = fpt.toString(10);
        let label2 = label.slice(0, 2) + "." + label.slice(2);
        this.font.changeGlyphs(this.fpsGlyphs, label2);
    }
    
}
