// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import EntityFactory from "../entities/EntityFactory";
import { Globals } from "../Globals";
import GameSegment from "./GameSegment";

export default class Scene22Base extends GameSegment {

    readonly BG_COLOR = '#000000';
    readonly BG_ANIM_PERIOD = 2000; // milliseconds
    tileset: Phaser.Tilemaps.Tileset;
    mapPlatformLayer: Phaser.Tilemaps.TilemapLayer;
    //levelWidth: integer;
    //levelHeight: integer;
    mapJson: string;
    mapKey: string;
    levelWidth: number;
    levelHeight: number;
    
    /**
     * 
     * @param key 
     */
    constructor(key: string, mapJson: string, mapKey: string) {
        super(key);
        this.mapJson = mapJson;
        this.mapKey = mapKey;
    }

    create(ctx: any): void {
        super.create(ctx);
        this.map = this.make.tilemap({key: this.mapKey});

        this.tileset = this.map.addTilesetImage('Tileset2-2', 'tiles2-2');
        this.mapPlatformLayer = this.map.createLayer('Platforms', 'Tileset2-2');
        this.levelWidth = this.mapPlatformLayer.width;
        this.levelHeight = this.mapPlatformLayer.height;
        if (this.levelHeight == 224) {
            // In Tiled, there is no such thing as a "half-tile", so levels
            // that are one-screen tall (no vertical scroll), will be 224 
            // pixels tall (14 * 16), and will have to be crammed to the
            // screen height limit (216)
            this.levelHeight = 216;
        }
        this.mapBackgroundLayer = this.map.createLayer('Background', 'Tileset2-2');
        this.mapPlatformLayer.setCollisionBetween(17, 44);
        this.mapPlatformLayer.setDepth(Globals.BG_DEPTH+1);
        this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
        this.cameras.main.setBackgroundColor(this.BG_COLOR);
        this.mapEnemiesLayer = this.map.getObjectLayer('Enemies'); // TODO Move to base class GameSegment
        this.mapPowerUpsLayer = this.map.getObjectLayer('PowerUps');
        this.mapWallsLayer = this.map.getObjectLayer('Walls'); // TODO Move to base class GameSegment
        this.setupPowerUps();
        this.buildWalls(this.mapWallsLayer);
        EntityFactory.setScene(this);
    }

    getLevelWidth(): number {
        //return this.levelWidth;
        return this.mapPlatformLayer.width;
    }

    getLowerBounds(): number {
        return this.mapPlatformLayer.height;
    }

    getMapPlatformLayer(): Phaser.Tilemaps.TilemapLayer {
        return this.mapPlatformLayer;
    }

    preload() {
        super.preload();
        this.load.image('tiles2-2', 'assets/tiles/ng3/2-2/Tileset2-2.png');
        this.load.tilemapTiledJSON(this.mapKey, this.mapJson);
    }

    stop() {
        super.stop();
    }

    update(time: number, delta: number): void {
        this._animateBackground(this.getElapsedTime());
        super.update(time, delta);
        if (this.stopping) {
            return;
        }
    }

    /**
     * Easing function (for background effects)
     */
    _circOut(t: number) {
        return Math.sqrt(1-(--t)*t);
    }

    _animateBackground(time: number) {
        let x = (time % this.BG_ANIM_PERIOD) / this.BG_ANIM_PERIOD;
        if (x >= 0.5) {
            x = 1 - x;
        }
        x *= 2;
        x = this._circOut(x);
        this.mapBackgroundLayer.setAlpha(x);
    }

}