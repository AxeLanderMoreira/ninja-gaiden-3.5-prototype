// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import GameSegment from "../scenes/GameSegment";
import SpriteFont from "./SpriteFont";

export default abstract class Hud {    
    scene: GameSegment;
    bounds: Phaser.Geom.Rectangle;
    container: any;
    font: SpriteFont;

    /**
     * 
     * @param scene 
     * @param bounds 
     */
    constructor(scene: GameSegment, bounds: Phaser.Geom.Rectangle) {
        this.scene = scene;
        this.bounds = bounds;
        this.font = new SpriteFont(this.scene);
        this.container = this.scene.add.container(bounds.x, bounds.y);
        this.container.setDepth(Globals.HUD_DEPTH);
        let rect: Phaser.GameObjects.Rectangle = this.scene.add.rectangle(
            0, 0, bounds.width, bounds.height, 0x000000, .5);
        rect.setOrigin(0, 0);
        this.container.add(rect);
        this.container.setScrollFactor(0); // fix on screen
    }

    /**
     * 
     */
    abstract update(): void;
}