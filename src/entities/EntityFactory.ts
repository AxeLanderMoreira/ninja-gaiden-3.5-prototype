// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import ChopperClaw from "./ChopperClaw";
import GameSegment from "../scenes/GameSegment";
import DroidBall from "./DroidBall";
import EnemyAlien from "./EnemyAlien";
import EnemySoldier from "./EnemySoldier";
import Entity from "./Entity";
import PowerUp from "./PowerUp";
import WaspRobot from "./WaspRobot";

/**
 * Creates Entities (enemies, traps) from an object (or array of objects) taken
 * from an Object Layer made in Tiled App.
 */
export default class EntityFactory {

    private static scene: GameSegment;

    /*************************************************************************\
     * SPECIFIC FACTORY METHODS FOR EACH ENTITY
    \*************************************************************************/
    private static createChopperClaw(obj: any): Entity {
        let sprite = EntityFactory.scene.enemyGroup.create(0, 0, 'chopper_claw');
        sprite.setDepth(Globals.ENEMY_DEPTH);
        let ret: ChopperClaw = new ChopperClaw(EntityFactory.scene, sprite);
        if (obj.properties) {
            obj.properties.forEach((prop) => {
              if (prop.name == "stopY") {
                ret.stopY = prop.value;
              }
            })
          }
        sprite.setData('type', 'ChopperClaw');
        sprite.setData('parent', ret);
        return ret;
    }

    private static createDroidBall(obj: any): Entity {
        let sprite = EntityFactory.scene.enemyGroup.create(0, 0, 'droid_ball');
        sprite.setDepth(Globals.ENEMY_DEPTH);
        let ret: DroidBall = new DroidBall(EntityFactory.scene, sprite);
        sprite.setData('type', 'DroidBall');
        sprite.setData('parent', ret);
        return ret;
    }

    private static createEnemyAlien(obj: any): EnemyAlien {
        let sprite = EntityFactory.scene.enemyGroup.create(0, 0, 'enemy_alien');
        sprite.setDepth(Globals.ENEMY_DEPTH);
        let ret: EnemyAlien = new EnemyAlien(EntityFactory.scene, sprite, 1);
        sprite.setData('type', 'EnemyAlien');
        sprite.setData('parent', ret);
        return ret;
    }

    private static createEnemySoldier(obj: any): EnemySoldier {
        let sprite = EntityFactory.scene.enemyGroup.create(0, 0, 'enemy_soldier');
        sprite.setDepth(Globals.ENEMY_DEPTH);
        let ret: EnemySoldier = new EnemySoldier(EntityFactory.scene, sprite);
        sprite.setData('type', 'EnemySoldier');
        sprite.setData('parent', ret);
        return ret;
    }

    private static createPowerUp(obj: any): Entity {
        let sprite = EntityFactory.scene.powerUpGroup.create(0, 0, 'power_up');
        sprite.setDepth(Globals.POWER_UP_DEPTH);
        
        let variant = obj.gid - this.scene.firstPowerUpGid;
        console.log('[EntityFactory.createPowerUp] variant = ' + variant);
        let ret: PowerUp = new PowerUp(EntityFactory.scene, sprite, variant);
        sprite.setData('type', 'PowerUp');
        sprite.setData('parent', ret);
        return ret;
    }

    private static createWaspRobot(obj: any): Entity {
        let sprite = EntityFactory.scene.enemyGroup.create(0, 0, 'wasp_robot');
        sprite.setDepth(Globals.ENEMY_DEPTH);
        let ret: WaspRobot = new WaspRobot(EntityFactory.scene, sprite);
        sprite.setData('type', 'WaspRobot');
        sprite.setData('parent', ret);
        return ret;
    }

    public static makeOne(obj: any): Entity {
        let ret: Entity;
        console.log('[makeOne@EntityFactory] obj.name = ' + obj.name);
        switch(obj.name) {
            case 'ChopperClaw': ret = EntityFactory.createChopperClaw(obj); break;
            case 'DroidBall': ret = EntityFactory.createDroidBall(obj); break;
            case 'EnemyAlien': ret = EntityFactory.createEnemyAlien(obj); break;
            case 'EnemySoldier': ret = EntityFactory.createEnemySoldier(obj); break;
            case 'PowerUp': ret = EntityFactory.createPowerUp(obj); break;          
            case 'WaspRobot': ret = EntityFactory.createWaspRobot(obj); break;  
            default: break;                
        }
        if (ret) {
            EntityFactory.scene.placeEntity(ret, obj.x, obj.y);
        }
        return ret;
    }    

    public static makeMany(objs: any[]): Entity[] {
        let ret: Entity[] = [];
        let entity: Entity;
        objs.forEach((obj) => {
            entity = EntityFactory.makeOne(obj);
            if (entity) {
                ret.push(entity);
            }            
        });
        return ret;
    }

    /**
     * Updates the EntityFactory with the current GameSegment being played.
     * @param GameSegment 
     */
    public static setScene(scene: GameSegment) {
        console.log('[EntityFactory.setScene] IN')
        EntityFactory.scene = scene;
    }
}
