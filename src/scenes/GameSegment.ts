// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import ArmoredTurret from "../entities/ArmoredTurret";
import BaseScene from "./BaseScene";
import ChopperClaw from "../entities/ChopperClaw";
import ControlMethod from "../input/ControlMethod";
import DroidBall from "../entities/DroidBall";
import Enemy from "../entities/Enemy";
import EnemyAlien from "../entities/EnemyAlien";
import EnemySoldier from "../entities/EnemySoldier";
import Entity from "../entities/Entity";
import EntityFactory from "../entities/EntityFactory";
import Explod from "../entities/Explod";
import FpsHud from "../menus/FpsHud";
import { Globals } from "../Globals";
import Ninja from "../entities/Ninja";
import PlayerHud from "../menus/PlayerHud";
import PowerUp from "../entities/PowerUp";
import TimeHud from "../menus/TimeHud";
import WaspRobot from "../entities/WaspRobot";
import WaveFloater from "../entities/WaveFloater";
import BlobSpikeBall from "../entities/BlobSpikeBall";
import { Acts } from "./Acts";

/**
 * Contains all logic common to every Scene in this Game.
 */
export default abstract class GameSegment extends BaseScene {
    
    readonly ENEMY_SPAWN_MARGIN = 0; /**< amount of pixels extrapolating the 
    camera's visible area, on each of the four sides. When that extrapolated
    rectangle overlaps with the rectangle of an enemy placed in the map, the
    corresponding enemy will then be spawned into the game. */
    // TODO These spawn positions should actually vary depending on each level
    static readonly PLAYER_SPAWN_H_SPACING = Ninja.BODY_WIDTH; /** Horizontal spacing between each Player's spawn area */
    static readonly PLAYER1_SPAWN_X = 64; /**< X-Position where to spawn Ninja Player 1 */
    static readonly PLAYER1_SPAWN_Y = -32;
    // Camera maximum movement in all directions, in pixels, between frames
    //static readonly CAM_MAX_MOVEMENT = Ninja.WALKING_SPEED / Globals.TARGET_FPS;
    static readonly CAM_MAX_MOVEMENT = 2;

    assignedIndices: integer[];
    camFocusPoint: Phaser.GameObjects.GameObject;
    ctrlMethods: ControlMethod[];
    currTimerValue: number;     // countdown, also in milliseconds
    enemies: Enemy[];  // for general logic and state machine
    enemyGroup: Phaser.Physics.Arcade.Group;   // for physics and collision handling
    enemyNinjaCollider: Phaser.Physics.Arcade.Collider;
    firstPowerUpGid: integer;
    fpsHud: FpsHud;
    initialTimerValue: number;  // time to beat this level, in milliseconds
    map: Phaser.Tilemaps.Tilemap;
    mapBackgroundLayer: Phaser.Tilemaps.TilemapLayer;
    mapEnemiesLayer: Phaser.Tilemaps.ObjectLayer;
    mapPowerUpsLayer: Phaser.Tilemaps.ObjectLayer;
    mapWallsLayer: Phaser.Tilemaps.ObjectLayer;
    numPlayers: integer;
    platformGroup: Phaser.Physics.Arcade.StaticGroup;
    platformNinjaCollider: Phaser.Physics.Arcade.Collider;
    playerGroup: Phaser.Physics.Arcade.Group;  // for physics and collision handling
    playerHuds: PlayerHud[];
    players: Ninja[];   // for general logic and state machine
    powerUpGroup: Phaser.Physics.Arcade.Group; // for physics and collision handling
    powerUps: Entity[]; // for general logic and state machine
    prevScrollX: number;  // camera's horizontal scroll position in previous frame (for optimizing respawning of new enemies)
    prevScrollY: number;  // camera's vertical scroll position in previous frame (same as above)      
    stopping: boolean;
    t0: number;
    timeHud: TimeHud;
    gameClock: Phaser.Time.TimerEvent;
    
    constructor(config:string) {
        super(config);        
    }

    create(ctx?: any) {
        super.create(ctx);
        this.enemies = [];
        this.powerUps = [];
        this.prevScrollX = this.prevScrollY = -1; // uninitialized
        this.stopping = false;
        this.numPlayers = ctx ? ctx.numPlayers : 1;
        this.assignedIndices = ctx.assignedIndices;
        const sprites = this._createNinjaSprites();
        const swords = this._createSwordSprites();        

        /*************************************************************************\
         * ENEMY ANIMS
        \*************************************************************************/
        ArmoredTurret.initAnims(this);
        BlobSpikeBall.initAnims(this);
        ChopperClaw.initAnims(this);
        DroidBall.initAnims(this);
        EnemyAlien.initAnims(this);
        EnemySoldier.initAnims(this);
        WaspRobot.initAnims(this);
        WaveFloater.initAnims(this);

        /*************************************************************************\
         * EXPLOSION ANIMS
        \*************************************************************************/
        Explod.initAnims(this);
        PowerUp.initAnims(this);
        
        /*************************************************************************\
         * NINJA+SWORD ANIMS
        \*************************************************************************/
        Ninja.initAnims(this);

        let ctrl: ControlMethod;
        if (ctx.players) { // Ninja instances transferred from previous level
          this.players = ctx.players;
        }
        if (!this.players || this.players.length == 0) {
          this.players = [];
          for (let i = 0; i < this.numPlayers; i++) {
            let ctrl = this.ctrlMethods[this.assignedIndices[i]];
            this.players.push(new Ninja(this, ctrl, sprites[i], swords[i]));
          }
        } else {
          this.players.forEach((player, i) => {
            player.scene = this;
            player.respawn(sprites[i], swords[i], ctx.keepStats);            
          })
        }

        //this.paused = false;
        this.playerGroup = this.physics.add.group();
        this.players.forEach((player, i) => {
          this.playerGroup.add(player.sprite);
        });
        this.enemyGroup = this.physics.add.group();
        this.platformGroup = this.physics.add.staticGroup();
        this.powerUpGroup = this.physics.add.group();

        this.camFocusPoint = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
        this.cameras.main.startFollow(this.camFocusPoint, true);  

        this.playerHuds = [];
        this.players.forEach((p, i) => {
          this.playerHuds.push(new PlayerHud(this, p, i));
        });

        this.timeHud = new TimeHud(this);
        if (Globals.DEBUG_FPS) {
          this.fpsHud = new FpsHud(this);
        }

        this.platformNinjaCollider = this.physics.add.collider(
            this.playerGroup,
            this.platformGroup,
            (_sprite, _platform) => { /* collideCalback */
               let ninja: Ninja = _sprite.getData('parent');
               switch (_platform.name) {
                case 'Exit':
                  break;
                case 'Ledge':
                  break;
                case 'Spike':
                  //  no effect here
                  break;
                case 'Wall': 
                  if (_sprite.body.touching.right && _platform.body.touching.left)
                  {
                      ninja.onTouchedWall(_platform, 1);
                  } else if (_sprite.body.touching.left && _platform.body.touching.right)
                  {
                      ninja.onTouchedWall(_platform, -1);
                  }
                  break;
               }
            },
            (_sprite, _platform) => { /* processCallback */
            let ninja = _sprite.getData('parent');
              switch (_platform.name) {
                case 'Exit':
                  ninja.onTouchedExit(_platform);
                  return false; // ??
                case 'Ledge':
                  ninja.onTouchedLedge(_platform);
                  return (!!ninja.ledgeTop);
                case 'Spike':
                  if (!ninja.invincible) {
                    ninja.gotHitBySpike(_platform, 6);  // attention to invincibility?
                  }                  
                  return false;
                case 'Wall': 
                  return true;
              }
        });

        this.enemyNinjaCollider = this.physics.add.overlap(
            this.enemyGroup,
            this.playerGroup,
            (_1, _2) =>
            {
              //console.log('enemy and ninja collided');
              let ninja, enemy;
              if (_1.getData("type") == 'Ninja') {
                ninja = _1.getData("parent");
                enemy = _2.getData("parent");
              } else {
                enemy = _1.getData("parent");
                ninja = _2.getData("parent");            
              }
              if (!ninja.invincible) {
                ninja.gotHit(enemy);                
              }
            }
          );
        
        this.physics.add.overlap(
          this.powerUpGroup,
          this.playerGroup,
          (_1, _2) =>
          {
            let ninja, powerup;
            if (_1.getData("type") == 'Ninja') {
              ninja = _1.getData("parent");
              powerup = _2.getData("parent");
            } else {
              powerup = _1.getData("parent");
              ninja = _2.getData("parent");            
            }
            if (powerup.state == "fall") {
              ninja.pickUpPowerUp(powerup);
            }
          }
        );

        this.stopping = false;
        if (ctx.currTimerValue) {
          // If in transition from one segment to the other, get initial timer
          // value from previous segment
          this.initialTimerValue = ctx.currTimerValue;
        } else {
          // Otherwise (if respawned or in the Act's first level, get from the Acts config)
          this.initialTimerValue = Acts.getTimeLimit();
        }

        this.events.on(Phaser.Scenes.Events.RESUME, ctx => {
          this.gameClock.paused = false;
          this.ctrlMethods.forEach(ctrl => {
            console.log('[BaseScene.create] ctrl.resetScene() for ' + this.constructor.name)
            ctrl.resetScene(this);
          });
        })

        this.start();        
    }

   /**
   * Wrapper for Scene.anims.create()
   * @param objName 
   * @param variant
   * @param animName 
   * @param framesObj 
   * @param duration 
   * @param repeat 
   */
    createAnim(objName: string, variant: integer, animName: string, framesObj: any, duration: integer, repeat: integer) {
        let animKey = objName;
        if (variant) {
          animKey += variant;
        }
        animKey += '.' + animName;
        //console.log('[GameSegment.createAnim] objName = ' + objName + ', animKey ' + animKey);
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(objName, framesObj),
          duration: duration,
          repeat: repeat
        })
    }

    /**
     * Adds Walls to this level, taken from an ObjectLayer parsed from json
     * file generated in Teiled tool.
     * 
     * It actually builds not only Walls, but:
     * - Ledges 
     * - Exits 
     * and any other kind of platform that has non-trivial properties (such as:
     * being semi-solid, reacting to overlap in a unique way etc)
     * 
     * @param layer The source layer
     */
    buildWalls(layer: Phaser.Tilemaps.ObjectLayer) {
      let objs = layer.objects;
      objs.forEach((o, i) => {
          let wall = this.add.rectangle(o.x, o.y, o.width, o.height, 0x000000, 0);
          wall.name = o.name; // may be 'Wall', 'Ledge', etc.
          wall.setOrigin(0, 0);
          if (o.properties) {
            o.properties.forEach((prop) => {
              wall.setData(prop.name, prop.value);
            })
          }
          this.platformGroup.add(wall);
      });
    }


    getElapsedTime(): number {
      if (!this.gameClock) return 0;
      return this.gameClock.elapsed;
    }

    /**
     * 
     */
    abstract getLevelWidth(): number;

    /**
     * If the level has lower bounds where the player or an enemy can fall 
     * through, this function has to be overwritten.
     * @returns 0 if the level doesn't have lower bounds, or a positive integer
     * with the lower bounds y-coordinate.
     */
    getLowerBounds(): integer {
      return 0;      
    }

    /**
     * 
     */
    abstract getMapPlatformLayer(): Phaser.Tilemaps.TilemapLayer;

    /**
     * Gets remaining time in TIME countdown for this game segment, in milisseconds
     */
    getRemainingTime(): number {
      if (!this.gameClock) return this.initialTimerValue;
      let delta = this.gameClock.elapsed;
      this.currTimerValue = Math.floor(this.initialTimerValue - delta);
      return this.currTimerValue;
    }

    /**
     * 
     * @param Ninja 
     */
    onPlayerKOed(player: Ninja) {
      // TODO Check if more than one player exist, and all are dead
      // before proceeding
      let numKOed = 0;
      let numDead = 0;
      this.players.forEach(p=> {
        if (p.getHp() == 0) {
          numKOed++;
          if (p.getLives() < 0) { // lives == 0 means last life yet
            numDead++;
          }
        }        
      });
      console.log('[Ninja.onPlayerKOed] numKOed = ' + numKOed);
      console.log('[Ninja.onPlayerKOed] numDead = ' + numDead);
      if (numDead == this.numPlayers) {
        this._gameOver(); // All players dead
      } else if (numKOed == this.numPlayers) {
        this._restartLevel(); // All players KOed
      } else {
        new Explod(player).spawn(); // Explod.spawn() is not related to Entity.spawn() (different signatures)
        player.sprite.disableBody(true, true);
      }      
    }

    private _gameOver() {
      this.stop();
      this.cameras.main.fadeOut(500, 0, 0, 0, (_camera, _progress) => {
        if (_progress >= 1) {
          this.scene.start('GameOver');
          this.players = [];
        }
      });
    }

  
    private _restartLevel() {
        this.stop();
        this.initialTimerValue = Acts.getTimeLimit(); // reset
        this.cameras.main.fadeOut(500, 0, 0, 0, (_camera, _progress) => {
        if (_progress >= 1) {
          this.scene.restart({numPlayers: this.numPlayers});
        }
      });
    }

    preload() {
        super.preload();   
        // Move these calls and .initAnim() calls to EntityFactory?
        ArmoredTurret.preloadResources(this);
        BlobSpikeBall.preloadResources(this);
        ChopperClaw.preloadResources(this);
        DroidBall.preloadResources(this);
        EnemyAlien.preloadResources(this);
        EnemySoldier.preloadResources(this);
        Explod.preloadResources(this);
        Ninja.preloadResources(this);
        PowerUp.preloadResources(this);
        WaveFloater.preloadResources(this);
        WaspRobot.preloadResources(this);
      }

    /**
     * Toggles the invincibility for this particular Ninja instance; i.e.
     * temporarily disables the collider between this Ninja and Enemies or
     * Traps.
     * 
     * @param on 
     */
    setInvincibility(player: Ninja, on: boolean) {
        // TODO Actually must be linked to a specific Ninja instance (one collider per instance)
        //if (this.enemyNinjaCollider) this.enemyNinjaCollider.active = !on;
        player.invincible = on;
    }

    /**
     * 
     */
    stop() {
      this.stopping = true;
      this.enemies.forEach((enemy) => {
        enemy.destroy();
      });
      this.enemies = [];
    }

    /**
     * 
     */
    start() {
      this.gameClock = this.time.addEvent({delay: 999999});
      // Scene.time and Clock objects seemingly ignore the 'paused' property,
      // so we have to resort to a TimerEvent.
      // Reference: https://phaser.discourse.group/t/scene-time-paused-does-not-work/6734
      this.currTimerValue = this.initialTimerValue;
    }

    update(time: number, delta: number): void {  
        super.update(time, delta);
        if (this.stopping) {
          return;
        }

        // Time limit
        if (this.getRemainingTime() <= 0) {
          console.log('[GameSegment.update] TIME LIMIT REACHED');
          this.players.forEach((player) => {
            if (player.hp > 0) {
              player.loseLife();
            }
          });
        }

        // Pass control method on player creation
        this.ctrlMethods.forEach(method => {
          method.update();
        });
        if (this.anyInputHit('start')) {
          this.togglePause();
        }
        let cam = this.cameras.main;
        this.enemies.forEach(enemy => {
          if (!enemy.hovering) {
            this.physics.collide(enemy.sprite, this.getMapPlatformLayer());
            this.physics.collide(enemy.sprite, this.platformGroup);
          }
        });
        this.physics.collide(this.powerUpGroup, this.getMapPlatformLayer());
        this.physics.collide(this.powerUpGroup, this.platformGroup);

        /* Update the status of each player, and calculate the median point where to
           move the camera focus */
        let avg_x = 0;
        let avg_y = 0;
        let numAlive = 0;
        this.players.forEach((player) => {
          if (!player.quicksand) {
            this.physics.collide(player.sprite, this.getMapPlatformLayer());
          }
          player.update();
          if (player.getHp() > 0) {
            numAlive++;
            /*avg_x += player.sprite.body.x;
            avg_y += player.sprite.body.y;*/
            avg_x += player.sprite.x;
            avg_y += player.sprite.y;
          }          
        });
        // Move camera focal point, and try do it smoothly - fixes abrupt
        // camera movement when a player suddenly dies and the camera has
        // to move away from its previous position
        if (this.numPlayers > 0) {          
          let prev_cam_x = this.camFocusPoint.x;
          let prev_cam_y = this.camFocusPoint.y;
          let new_cam_x = avg_x / numAlive;
          let new_cam_y = avg_y / numAlive;
          let offset_cam_x = new_cam_x - prev_cam_x;
          let offset_cam_y = new_cam_y - prev_cam_y;
          // Basically, if the cam moves away faster than it normally would,
          // we just move a bit towards what would be the destination point (by 
          // a fixed movement rate)
          let cam_max_move = GameSegment.CAM_MAX_MOVEMENT;
          if (offset_cam_x < -cam_max_move) {
            new_cam_x = prev_cam_x - cam_max_move;
          } else if (offset_cam_x > cam_max_move) {
            new_cam_x = prev_cam_x + cam_max_move;
          }
          if (offset_cam_y < -cam_max_move) {
            new_cam_y = prev_cam_y - cam_max_move;
          } else if (offset_cam_y > cam_max_move) {
            new_cam_y = prev_cam_y + cam_max_move;
          }
          this.camFocusPoint.x = new_cam_x;
          this.camFocusPoint.y = new_cam_y;
        }
        if (!Globals.DEBUG_NO_ENEMIES) {
          this._spawnEnemies();
          this.enemies.forEach((enemy) => {
            enemy.update();
          });
        }
        if (!Globals.DEBUG_NO_POWERUPS) {
          this._placePowerUps();
          this.powerUps.forEach(p => {
            p.update();
          })
        }
        this.playerHuds.forEach((hud) => {
          hud.update();
        });
        this.timeHud.update();
        if (Globals.DEBUG_FPS) {
          this.fpsHud.update();
        }
        
    }
  togglePause() {
      this.gameClock.paused = true;
      this.scene.pause();
      this.scene.launch('PauseScreen', {
        ctrlMethods: this.ctrlMethods,
        pausedScene: this
      });
  }


    /**
     * Overwrite this in GameSegment subclass to redefine the spawn position 
     * accordingly.
     * @param i index of the i-th player, beginning with 0.
     */
    getPlayerSpawnPosition(i: integer): Phaser.Math.Vector2 {
      let _x = GameSegment.PLAYER1_SPAWN_X + (i * GameSegment.PLAYER_SPAWN_H_SPACING);
      let _y = GameSegment.PLAYER1_SPAWN_Y;      
      return new Phaser.Math.Vector2(_x, _y);
    }

    /**
     * 
     * @param index 0 for Player 1, 1-2-3
     */
    private _createNinjaSprites(): Phaser.Physics.Arcade.Sprite[] {
      let spr: Phaser.Physics.Arcade.Sprite;
      let arr: Phaser.Physics.Arcade.Sprite[] = [];
      //let spawn_x: number;
      let _v: Phaser.Math.Vector2;
      for (let i = 0; i < this.numPlayers; i++) {
        _v = this.getPlayerSpawnPosition(i);
        console.log('[GameSegment._createNinjaSprites] adding sprite with key ninja' + i.toString());
        spr = this.physics.add.sprite(_v.x, _v.y, 'ninja' + i.toString());
        spr.setDepth(Globals.NINJA_DEPTH);
        spr.setData('type', 'Ninja');       // type (tag with Class-Name) of parent object
        arr.push(spr);
      }
      return arr;
    }

    private _createSwordSprites(): Phaser.Physics.Arcade.Sprite[] {
      let spr: Phaser.Physics.Arcade.Sprite;
      let arr: Phaser.Physics.Arcade.Sprite[] = [];
      for (let i = 0; i < this.numPlayers; i++) {
        spr = this.physics.add.sprite(0, 0, 'sword'); 
        spr.setDepth(Globals.ENEMY_DEPTH+1);
        spr.setData('type', 'NinjaSword');  // type (tag with Class-Name) of parent object
        spr.body.allowGravity = false; // will always move along with player
        spr.setVisible(false);
        arr.push(spr);
      }
      return arr;
    }

    /**
     * This method has to be invoked from the suclass' create() method, and
     * requires this.map to be initialized.
     * TODO Refactor all TileMap/Tileset processing to centralize everything
     * here in the base class, parameterizing from the subclass as required.
     */
    protected setupPowerUps() {
      // This function is required because we use Tiled's `gid` field to 
      // identify which PowerUp has to be instantiated, and the `gid` base 
      // value may vary between each Scene's Tilemaps.
      //this.map.
      //let objs = this.mapPowerUpsLayer.objects;
      //for (obj)
      this.map.tilesets.forEach(tileset => {
        if (tileset.name == 'PowerUp') {
          this.firstPowerUpGid = tileset.firstgid;
        }
      });
    }

    private _placePowerUps() {
      // TODO Improve reuse between this function and the one below it
      if (!this.mapPowerUpsLayer) {
        return; // Object placement not initialized (yet)
      }
      if (this.prevScrollX == this.cameras.main.scrollX && 
        this.prevScrollY == this.cameras.main.scrollY) { // camera has not moved since previous frame
        return;
      }
      let objs = this.mapPowerUpsLayer.objects;
      let camRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(
        this.cameras.main.scrollX - this.ENEMY_SPAWN_MARGIN, 
        this.cameras.main.scrollY - this.ENEMY_SPAWN_MARGIN, 
        Globals.SCREEN_WIDTH, 
        Globals.SCREEN_HEIGHT);
      let objRect: Phaser.Geom.Rectangle;
      let entity: Entity;

      objs.forEach((o, i) => {
        objRect = new Phaser.Geom.Rectangle(
          o.x,
          o.y - o.height,
          o.width,
          o.height
        );

        if (Phaser.Geom.Rectangle.Overlaps(camRect, objRect)) {
          o.name = 'PowerUp'; // required for function below
          entity = EntityFactory.makeOne(o);
          if (entity) {
            objs.splice(i, 1);
            //console.log("objs' length now = " + objs.length);
            this.powerUps.push(entity);  
          }
        }
      });
      
    }
  
    private _spawnEnemies() {
      if (!this.mapEnemiesLayer) {
        return; // Object placement not initialized (yet)
      }
      if (this.prevScrollX == this.cameras.main.scrollX && 
        this.prevScrollY == this.cameras.main.scrollY) { // camera has not moved since previous frame
        return;
      }
      let objs = this.mapEnemiesLayer.objects;
      let camRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(
        this.cameras.main.scrollX - this.ENEMY_SPAWN_MARGIN, 
        this.cameras.main.scrollY - this.ENEMY_SPAWN_MARGIN, 
        Globals.SCREEN_WIDTH + (this.ENEMY_SPAWN_MARGIN * 2), 
        Globals.SCREEN_HEIGHT+ (this.ENEMY_SPAWN_MARGIN * 2));
      let playerRects: Phaser.Geom.Rectangle[] = [];
      this.players.forEach(p => {
        let rect : Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
        Phaser.Display.Bounds.GetBounds(p.sprite, rect);
        playerRects.push(rect);
      })
      let objRect: Phaser.Geom.Rectangle;
      let entity: Entity;
      // TODO Handle spawnBox
      objs.forEach((o, io) => {
        if (o.properties) {
          o.properties.forEach((prop, /*iprop*/) => {
            if (prop.name == "spawnBox" && !o.spawnBox) { // if spawnBox was not already processed
              this._setEnemySpawnBox(objs, io, prop.value);
              //o.properties.splice(iprop, 1);
            }
          });          
        }

        objRect = new Phaser.Geom.Rectangle(
          o.x,
          o.y - o.height,
          o.width,
          o.height
        );

        if (!o.spawnBox) {
          if (Phaser.Geom.Rectangle.Overlaps(camRect, objRect)) { 
            console.log('[GameSegment._spawnEnemies] ' + o.name + ' to be spawned via cam bounds');         
            entity = EntityFactory.makeOne(o); // will call place Entity
            if (o.flippedHorizontal) {
              entity.turn(1);
              console.log("entity turned horizontally here");
            }
            if (entity) {
              objs.splice(io, 1);
              console.log("objs' length now = " + objs.length);
              this.enemies.push(entity);
            }
          }
        } else {
          playerRects.forEach(pRect => {
            if (Phaser.Geom.Rectangle.Overlaps(o.spawnBox, pRect)) {
              console.log('[GameSegment._spawnEnemies] ' + o.name + ' to be spawned via spawnBox');         
              entity = EntityFactory.makeOne(o); // will call place Entity
              if (entity) {
                objs.splice(io, 1);
                console.log("objs' length now = " + objs.length);
                this.enemies.push(entity);
              }
            }
          })
        }
        
      });
    }    

  /**
   * Reads the 'spawnBox' custom property of a TiledObject in the EnemyLayer, 
   * and processes it. 'Spawn Boxes' are used for enemies that must not behave
   * in the regular way (that is, be spawned as soon as they enter the camera
   * bounds). Instead, they are spawned when one of the players enter that
   * specified box.
   * 
   * @param objs Array of TiledObjects
   * @param enemyIndex Index of the Enemy containing the spawnBox field declaration
   * @param boxId ID of the Rectangle pointed by the spawnBox field.
   */
  private _setEnemySpawnBox(objs: Phaser.Types.Tilemaps.TiledObject[], enemyIndex: integer, boxId: integer) {
    let enemy = objs[enemyIndex];
    objs.forEach((o, i) => {
      if (o.id == boxId) {
        let rect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(
          o.x,
          o.y,
          o.width,
          o.height
        );
        objs.splice(i, 1); // Eliminate Rectangle from the array
        enemy.spawnBox = rect;
      }
    });
  }
  
}
