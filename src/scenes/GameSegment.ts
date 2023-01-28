// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import BaseScene from "./BaseScene";
import ControlMethod from "../input/ControlMethod";
import DroidBall from "../entities/DroidBall";
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

/**
 * Contains all logic common to every Scene in this Game.
 */
export default abstract class GameSegment extends BaseScene {
    
    readonly ENEMY_SPAWN_MARGIN = 32; /**< amount of pixels extrapolating the 
    camera's visible area, on each of the four sides. When that extrapolated
    rectangle overlaps with the rectangle of an enemy placed in the map, the
    corresponding enemy will then be spawned into the game. */
    // TODO These spawn positions should actually vary depending on each level
    static readonly PLAYER_SPAWN_H_SPACING = 32; /** Horizontal spacing between each Player's spawn area */
    static readonly PLAYER1_SPAWN_X = 64; /**< X-Position where to spawn Ninja Player 1 */
    static readonly PLAYER1_SPAWN_Y = -32;
    // Camera maximum movement in all directions, in pixels, between frames
    //static readonly CAM_MAX_MOVEMENT = Ninja.WALKING_SPEED / Globals.TARGET_FPS;
    static readonly CAM_MAX_MOVEMENT = 2;

    assignedIndices: integer[];
    camFocusPoint: Phaser.GameObjects.GameObject;
    ctrlMethods: ControlMethod[];
    currTimerValue: number;     // countdown, also in milliseconds
    enemies: Entity[];  // for general logic and state machine
    enemyGroup: Phaser.Physics.Arcade.Group;   // for physics and collision handling
    enemyNinjaCollider: Phaser.Physics.Arcade.Collider;
    fpsHud: FpsHud;
    initialTimerValue: number;  // time to beat this level, in milliseconds
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
    touch: boolean;
    
    constructor(config:string) {
        super(config);
        this.enemies = [];
        this.powerUps = [];
        this.prevScrollX = this.prevScrollY = -1; // uninitialized
        this.stopping = false;
        this.touch = false;
    }

    /**
     * 
     * @param index 0 for Player 1, 1-2-3
     */
    private _createNinjaSprites(): Phaser.Physics.Arcade.Sprite[] {
      let spr: Phaser.Physics.Arcade.Sprite;
      let arr: Phaser.Physics.Arcade.Sprite[] = [];
      let spawn_x: number;
      for (let i = 0; i < this.numPlayers; i++) {
        spawn_x = GameSegment.PLAYER1_SPAWN_X + (i * GameSegment.PLAYER_SPAWN_H_SPACING);
        console.log('[GameSegment._createNinjaSprites] adding sprite with key ninja' + i.toString());
        spr = this.physics.add.sprite(spawn_x, GameSegment.PLAYER1_SPAWN_Y, 'ninja' + i.toString());
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
        spr.setDepth(Globals.NINJA_DEPTH);
        spr.setData('type', 'NinjaSword');  // type (tag with Class-Name) of parent object
        spr.body.allowGravity = false; // will always move along with player
        spr.setVisible(false);
        arr.push(spr);
      }
      return arr;
    }

    create(ctx?: any) {
        super.create(ctx);
        this.numPlayers = ctx ? ctx.numPlayers : 1;
        this.assignedIndices = ctx.assignedIndices;
        this.touch = ctx.touch; // touch screen, means we need to provide virtual d-pad and buttons
        const sprites = this._createNinjaSprites();
        const swords = this._createSwordSprites();        

        /*************************************************************************\
         * ENEMY ANIMS
        \*************************************************************************/
        EnemyAlien.initAnims(this);
        EnemySoldier.initAnims(this);
        DroidBall.initAnims(this);

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
        if (!this.players) {
          this.players = [];
          for (let i = 0; i < this.numPlayers; i++) {
            let ctrl = this.ctrlMethods[this.assignedIndices[i]];
            this.players.push(new Ninja(this, ctrl, sprites[i], swords[i]));
          }
        } else {
          this.players.forEach((player, i) => {
            player.respawn(sprites[i], swords[i]);
          })
        }

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
        })
        this.timeHud = new TimeHud(this);
        if (Globals.DEBUG_FPS) {
          this.fpsHud = new FpsHud(this);
        }

        this.platformNinjaCollider = this.physics.add.collider(
            this.playerGroup,
            this.platformGroup,
            (_sprite, _platform) => {
                let ninja = _sprite.getData('parent');
                if (_sprite.body.touching.right && _platform.body.touching.left)
                {
                    ninja.onTouchedWall(_platform, 1);
                } else if (_sprite.body.touching.left && _platform.body.touching.right)
                {
                    ninja.onTouchedWall(_platform, -1);
                }
            });

        this.enemyNinjaCollider = this.physics.add.overlap(
            this.enemyGroup,
            this.playerGroup,
            (_1, _2) =>
            {
              console.log('enemy and ninja collided');
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

        this.start();
        this.stopping = false;
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
        console.log('[GameSegment.createAnim] objName = ' + objName + ', animKey ' + animKey);
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(objName, framesObj),
          duration: duration,
          repeat: repeat
        })
    }

    /**
     * 
     */
    abstract getLevelWidth(): number;

    /**
     * 
     */
    abstract getMapPlatformLayer(): Phaser.Tilemaps.TilemapLayer;

    /**
     * Gets remaining time in TIME countdown for this game segment, in milisseconds
     */
    getRemainingTime(): number {
      let delta = this.time.now - this.t0;
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
        this.cameras.main.fadeOut(500, 0, 0, 0, (_camera, _progress) => {
        if (_progress >= 1) {
          this.scene.restart({numPlayers: this.numPlayers, touch: this.touch});
        }
      });
    }

    

    placeEntity(entity: Entity, x: any, y: any) {
      let _x = x + entity.sprite.width / 2;
      let _y = y - entity.sprite.height / 2;// + this.sprite.height;
      entity.sprite.setPosition(_x, _y);        
    }

    preload() {
        super.preload();        
        this.load.spritesheet('droid_ball', 'assets/DroidBall.png', {
          frameWidth: 16,
          frameHeight: 16
        })
        this.load.spritesheet('enemy_alien', 'assets/EnemyAlien.png', {
          frameWidth: 22,
          frameHeight: 32
        });
        this.load.spritesheet('enemy_soldier', 'assets/EnemySoldier.png', {
          frameWidth: 24,
          frameHeight: 31
        });
        this.load.spritesheet('explod', 'assets/Explod.png', {
          frameWidth: 15,
          frameHeight: 16
        });        
        this.load.spritesheet('ninja0', 'assets/Ninja.png', {
          frameWidth: 36,
          frameHeight: 37
        });
        this.load.spritesheet('ninja1', 'assets/Player2.png', {
          frameWidth: 36,
          frameHeight: 37
        });
        this.load.spritesheet('ninja2', 'assets/Player3.png', {
          frameWidth: 36,
          frameHeight: 37
        });
        this.load.spritesheet('ninja3', 'assets/Player4.png', {
          frameWidth: 36,
          frameHeight: 37
        });
        this.load.spritesheet('power_up', 'assets/PowerUp.png', {
          frameWidth: 16,
          frameHeight: 16
        });    
        this.load.spritesheet('sword', 'assets/Sword.png', {
          frameWidth: 35,
          frameHeight: 18
        });    
        
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
      this.t0 = this.time.now;
      this.currTimerValue = this.initialTimerValue;
    }

    // TODO Implement pause

    update(time: number, delta: number): void {  
        super.update(time, delta);
        if (this.stopping) {
          return;
        }
        // Pass control method on player creation
        this.ctrlMethods.forEach(method => {
          method.update();
        });        
        let cam = this.cameras.main;
        this.physics.collide(this.enemyGroup, this.getMapPlatformLayer());
        this.physics.collide(this.powerUpGroup, this.getMapPlatformLayer());

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
            avg_x += player.sprite.body.x;
            avg_y += player.sprite.body.y;
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
        this._spawnEnemies();
        this.enemies.forEach((enemy) => {
          enemy.update();
        });
        this._placePowerUps();
        this.powerUps.forEach(p => {
          p.update();
        })
        this.playerHuds.forEach((hud) => {
          hud.update();
        });
        this.timeHud.update();
        if (Globals.DEBUG_FPS) {
          this.fpsHud.update();
        }
        
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
            console.log("objs' length now = " + objs.length);
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
        Globals.SCREEN_WIDTH, 
        Globals.SCREEN_HEIGHT);
      let objRect: Phaser.Geom.Rectangle;
      let entity: Entity;
      objs.forEach((o, i) => {
        let spawnOffsetX = 0;
        let spawnOffsetY = 0;
        if (o.properties) {
          o.properties.forEach((prop) => {
            if (prop.name == "spawnOffsetX") {
              spawnOffsetX = prop.value;
            }
            if (prop.name == "spawnOffsetY") {
              spawnOffsetY = prop.value;
            }
          })
        }

        objRect = new Phaser.Geom.Rectangle(
          o.x + spawnOffsetX,
          o.y - o.height,
          o.width,
          o.height
        );

        if (Phaser.Geom.Rectangle.Overlaps(camRect, objRect)) {          
          entity = EntityFactory.makeOne(o); // will call place Entity
          if (o.flippedHorizontal) {
            entity.turn(1);
            console.log("entity turned horizontally here");
          }
          if (entity) {
            objs.splice(i, 1);
            console.log("objs' length now = " + objs.length);
            this.enemies.push(entity);
          }
        }
        
      });
    }    
}
