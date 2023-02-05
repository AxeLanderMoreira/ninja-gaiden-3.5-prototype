// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import EntityFactory from "../entities/EntityFactory";
import Quicksand from "../entities/Quicksand";
import { Globals } from "../Globals";
import GameSegment from "./GameSegment";

/**
 * TILESET:
 * 001: platform block #1
 * 002: platform block #2
 * 003: visual shadow for platform block on left side (floor level only)
 * 004: hole between platform blocks
 * 005: large/small pyramid (bottom left side)
 * 006: large pyramid (bottom middle)
 * 007: large/small pyramid (bottom right side)
 * 008: large pyramid (top left side)
 * 009: large pyramid (top middle)
 * 010: large pyramid (top right side)
 * 011: small pyramid (top left side)
 * 012: small pyramid (top right side)
 * 013: exit hole (left side)
 * 014: exit hole (middle)
 * 015: exit hole (right side)
 * 016: sand pattern top #1
 * 017: sand pattern bottom #1
 * 018: sand pattern bottom #2
 * 019: sand pattern bottom #3
 * 020: sand pattern top #2
 * 021: above ground top
 * 022: above ground bottom
 */

export default class Scene21Desert extends GameSegment {
    readonly LEVEL_WIDTH = Globals.SCREEN_WIDTH * 10; // 10 consecutive screens
    readonly BG_COLOR = '#7c0800';
    readonly TIME_TO_BEAT = 250000; // Time to beat this level, in seconds
    cloudLayer: Phaser.GameObjects.TileSprite;
    mountainLayer: Phaser.GameObjects.TileSprite;
    bgRuins: Phaser.GameObjects.TileSprite;
    fgRuins: Phaser.GameObjects.TileSprite;
    tileset: Phaser.Tilemaps.Tileset;
    mapPlatformLayer: Phaser.Tilemaps.TilemapLayer;
    mapQuicksandLayer: Phaser.Tilemaps.ObjectLayer;
    quicksandBoxes: Phaser.Physics.Arcade.StaticGroup; /** static group for collision purposes */
    quicksandPuddles: Quicksand []; 
    // TODO For co-op, this must be an array of flags, one per each player
    playerOnQuicksand: boolean; /**< This flag registers if the Ninja is on any
                                    quicksand  pool, in the current frame */

    constructor() {
        console.log('[constructor@Scene21Desert] BEGIN');
        super('Scene21Desert');        
        // TODO Have a reset() method for variables that reset at every level 
        // restart (like the ones above); and do it there
        console.log('[constructor@Scene21Desert] END');
    }

    create(ctx?: any) {
        console.log('[Scene21Desert.create] BEGIN');
        super.create(ctx);
        this.initialTimerValue = this.TIME_TO_BEAT;
        this.quicksandPuddles = [];
        this.cloudLayer = this.add.tileSprite(0, 0, this.LEVEL_WIDTH, 90, 'clouds');
        this.mountainLayer = this.add.tileSprite(0, 18, this.LEVEL_WIDTH, 90, 'mountains');
        this.bgRuins = this.add.tileSprite(0, 72, this.LEVEL_WIDTH, 36, 'bgruins');
        this.fgRuins = this.add.tileSprite(0, 180, this.LEVEL_WIDTH * 1.5, 36, 'fgruins'); // Due to higher scrollFactor
        this.cloudLayer.setOrigin(0, 0);
        this.mountainLayer.setOrigin(0,0);
        this.bgRuins.setOrigin(0,0);
        this.fgRuins.setOrigin(0, 0);
        this.cloudLayer.setScrollFactor(0);
        this.mountainLayer.setScrollFactor(.01);
        this.bgRuins.setScrollFactor(.25);
        this.fgRuins.setScrollFactor(1.5);
        this.fgRuins.setDepth(Globals.PLATFORM_DEPTH + 2);

        this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, 216); // TODO get from a single configuration
        this.cameras.main.setBackgroundColor(this.BG_COLOR);

        this.map = this.make.tilemap({key: 'map2-1'});
        this.tileset = this.map.addTilesetImage('Tileset2-1', 'tiles2-1');
        this.mapPlatformLayer = this.map.createLayer('Platforms', 'Tileset2-1');
        this.mapBackgroundLayer = this.map.createLayer('Background', 'Tileset2-1');
        this.mapPlatformLayer.setCollision([1, 2, 17, 21]);
        // TODO Se eu fizer a chamada abaixo, o ninja fica sob alguns elementos de decoração
        // tenho que implementá-los como tiledSprite pra conseguir exibi-lo com um depth atrás 
        // do Ninja
        this.mapPlatformLayer.setDepth(Globals.PLATFORM_DEPTH);
        this.mapEnemiesLayer = this.map.getObjectLayer('Enemies'); // TODO Move to base class GameSegment
        this.mapPowerUpsLayer = this.map.getObjectLayer('PowerUps');
        this.mapWallsLayer = this.map.getObjectLayer('Walls'); // TODO Move to base class GameSegment
        this.mapQuicksandLayer = this.map.getObjectLayer('Quicksand'); // specific to 2-1
        this.quicksandBoxes = this.physics.add.staticGroup();
        this.setupPowerUps();
        this.buildWalls(this.mapWallsLayer);
        this._placeQuicksandPuddles();
        EntityFactory.setScene(this);
        console.log('[Scene21Desert.create] END');
    }

    /**
     * 
     */
    private _placeQuicksandPuddles() {
        let objs = this.mapQuicksandLayer.objects;
        objs.forEach((o, i) => {
            // The coordinates passed to Quicksand constructor are the position
            // onto which it will be *displayed*. The bounding box has to be slightly
            // different, for proper collision detection. Since TileSprites have 
            // StaticBodies which cannot be changed, we use separate Rectangle
            // objects to test the collisions.
            let puddle = new Quicksand(this, 'quicksand', o.x, o.y, o.width, o.height);
            puddle.tileSprite.setDepth(Globals.PLATFORM_DEPTH + 1);
            this.quicksandPuddles.push(puddle);
            let box = this.add.rectangle(o.x + 3, o.y - 1, o.width - 6, o.height + 1, 0x000000, 0);
            box.setOrigin(0, 0);
            this.quicksandBoxes.add(box);            
        });
    }
    
    getLevelWidth(): number {
        return this.LEVEL_WIDTH;
    }

    getMapPlatformLayer(): Phaser.Tilemaps.TilemapLayer {
        return this.mapPlatformLayer;
    }

    preload() {
        super.preload();
        this.load.image('clouds', 'assets/tiles/ng3/2-1/clouds.png');
        this.load.image('mountains', 'assets/tiles/ng3/2-1/mountains.png');
        this.load.image('bgruins', 'assets/tiles/ng3/2-1/bgruins.png');
        this.load.image('fgruins', 'assets/tiles/ng3/2-1/fgruins.png');
        this.load.image('quicksand', 'assets/tiles/ng3/2-1/Quicksand.png')
        this.load.image('tiles2-1', 'assets/tiles/ng3/2-1/Tileset2-1.png');
        this.load.tilemapTiledJSON('map2-1', 'assets/tiles/ng3/2-1/Tilemap2-1.json');        
    }

    stop() {
        super.stop();
    }

    update(time: number, delta: number): void {  
        super.update(time, delta);
        if (this.stopping) {
            return;
        }
        let onQuicksand: boolean;
        this.players.forEach(player => {
            onQuicksand = this.physics.overlap(player.sprite, this.quicksandBoxes);
            player.setQuicksand(onQuicksand);
        });
        this.cloudLayer.setTilePosition(time/100);
        // TODO Check for only the ones visible in the vicinity
        this.quicksandPuddles.forEach(obj => {
            obj.tileSprite.setTilePosition(0, -time/100);
        });
    }
}
