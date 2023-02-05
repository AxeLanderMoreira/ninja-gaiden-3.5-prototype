// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import EntityFactory from "../entities/EntityFactory";
import { Globals } from "../Globals";
import GameSegment from "./GameSegment";

export default class Scene22A extends GameSegment {
    readonly LEVEL_WIDTH = Globals.SCREEN_WIDTH * 2; // 2 consecutive screens
    readonly BG_COLOR = '#000000';
    readonly BG_ANIM_PERIOD = 2000; // milliseconds
    map: Phaser.Tilemaps.Tilemap;
    tileset: Phaser.Tilemaps.Tileset;
    mapPlatformLayer: Phaser.Tilemaps.TilemapLayer;

    constructor(/* TODO params from previous scene */) {
        super('Scene22A');
    }

    create(ctx?: any): void {
        console.log('[Scene22A.create] BEGIN');
        super.create(ctx);
        this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, 216); // TODO get from a single configuration
        this.cameras.main.setBackgroundColor(this.BG_COLOR);
        this.map = this.make.tilemap({key: 'map2-2A'});
        this.tileset = this.map.addTilesetImage('Tileset2-2', 'tiles2-2');
        this.mapPlatformLayer = this.map.createLayer('Platforms', 'Tileset2-2');
        this.mapBackgroundLayer = this.map.createLayer('Background', 'Tileset2-2');
        this.mapPlatformLayer.setCollisionBetween(17, 44);
        this.mapPlatformLayer.setDepth(Globals.BG_DEPTH+1);
        this.mapEnemiesLayer = this.map.getObjectLayer('Enemies'); // TODO Move to base class GameSegment
        this.mapPowerUpsLayer = this.map.getObjectLayer('PowerUps');
        this.mapWallsLayer = this.map.getObjectLayer('Walls'); // TODO Move to base class GameSegment
        this.buildWalls(this.mapWallsLayer);
        EntityFactory.setScene(this);
        console.log('[Scene22A.create] END');
    }

    getLevelWidth(): number {
        return this.LEVEL_WIDTH;
    }

    getLowerBounds(): integer {
        return Globals.SCREEN_HEIGHT;
    }
    
    getMapPlatformLayer(): Phaser.Tilemaps.TilemapLayer {
        return this.mapPlatformLayer;
    }
    
    preload() {
        super.preload();
        this.load.image('tiles2-2', 'assets/tiles/ng3/2-2/Tileset2-2.png');
        this.load.tilemapTiledJSON('map2-2A', 'assets/tiles/ng3/2-2/Tilemap2-2.json');
    }

    stop() {
        super.stop();
    }

    update(time: number, delta: number): void {
        this._animateBackground(time);
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
