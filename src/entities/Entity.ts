// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "../scenes/GameSegment";

export default abstract class Entity {
    
    scene: GameSegment;
    sprite: Phaser.Physics.Arcade.Sprite;
    facing: integer = 1;
    state: string;
    stateT0: number; // timestamp 
    customHitbox?: Phaser.Geom.Rectangle;
    hp: integer = 1;    // 1 for an enemy that dies with a single hit, a higher value for a boss or enemy that takes multiple hits, -1 for an invincible enemy
    maxHp: integer = 1; // same as above
    variant: number;
    
    /**
     * 
     * @param scene 
     * @param sprite 
     * @param variant undefined for Act I variant, >=1 for other variants.
     */
    constructor(scene: GameSegment, sprite: Phaser.Physics.Arcade.Sprite, variant?: integer) {
        this.scene = scene;
        this.sprite = sprite;
        if (variant) {
            this.variant = variant;
        }
        this.sprite.setBounce(0);
    }

    /**
     * 
     */
    destroy() {
        console.log('[Entity.destroy] IN - placeHolder')
    }

    /**
     * Returns the attack strength for this entity. Has to be overridden in 
     * case of specific behaviors / stronger enemies.
     * @return By default, 1
     */
    getAttackStrength(): integer {
        return 1;
    }    

    /**
     * Gets current value of hitpoints
     * @returns 
     */
    getHp(): integer {
        return this.hp;
    }

    /**
     * Gets maximum (initial) value of hitpoints
     * @returns 
     */
    getMaxHp(): integer {
        return this.maxHp;
    }

    /**
     * 
     * @param dmg 
     */

    /**
     * Suffered hit from another entity, e.g.:
     *  - Enemy attacked by Ninja sword or Magic;
     *  - Ninja rammed by Enemy or hit by projectile.
     * 
     * @param other The other entity colliding with this.
     * @param dmg Number of hit points to take from this entity.
     * @return true if the collision was in effect, false otherwise (e.g. if
     * the entity absorbing the attack is under a state of temporary 
     * invincibility).
     */
    gotHit(other: Entity) : boolean {
        if (this.hp > 0) {
            this.hp -= other.getAttackStrength();
        }
        return true;
        // Derived classes should call super.gotHit(...) first of all
    }

    // Is there need for a hit/causeHit/provokeHit function?

    /**
     * 
     * @param newState 
     */
    onBeginState(newState: string) {
        console.log('now playing anim ' +  this.sprite.texture.key + "." + newState);
        let anim_key = this.sprite.texture.key;
        if (this.variant) {
            anim_key += this.variant;
        }
        anim_key += "." + newState;
        this.sprite.anims.play(anim_key);
    };

    /**
     * 
     * @param state 
     * @param newState 
     */
    abstract onEndState(state: string, newState: string);

    /*abstract onHit();*/

    /**
     * Sets a custom hitbox for this Entity's sprite, considering as if 
     * it was facing right, and taking (0, 0) as top-left coordinate.
     * 
     * The logic in Entity class will take care to automatically adjust the box
     * if facing left.
     */
    setCustomHitbox(rect: Phaser.Geom.Rectangle) {
        this.customHitbox = rect;
        this.sprite.body.setSize(rect.width, rect.height);
        this._recalculateOffset();
    }    

    /**
     * 
     * @param state 
     * @returns 
     */
    setState(state: string) {
        if (state == this.state) {
            console.log("already in state " + state + " - no change");
            return;
        }
        this.stateT0 = this.scene.time.now;
        //console.log('T0 on setState = ' + this.stateT0);
        this.onEndState(this.state, state);
        this.state = state;
        this.onBeginState(this.state);        
    }

    /** 
     * Used for map placement of enemies ; sets the Entity position based as if
     * specified from its top-leftmost pixel.
     * Tiled uses the anchor at X=left; Y=base
     */
    /*public placeInWorld(x: number, y: number) {
        let _x = x + this.sprite.width / 2;
        let _y = y - this.sprite.height / 2;// + this.sprite.height;
        this.sprite.setPosition(_x, _y);
    }*/

    public spawn(group: Phaser.Physics.Arcade.Group) {
        group.add(this.sprite);        
    }

    /**
     * 
     * @param direction -1 for facing left; +1 for facing right
     */
    public turn(direction: integer) {
        this.sprite.setFlipX(direction < 0);
        this.facing = direction;
        this._recalculateOffset();
        
    }

    update() {
        // TODO Handle state timing?
    }

    public getStateTime() {
        return this.scene.time.now - this.stateT0;
    }

    private _recalculateOffset() {
        if (this.customHitbox != undefined) {
            if (this.facing > 0) { // facing right
                this.sprite.body.offset.x = this.customHitbox.x;                
            } else if (this.facing < 0) { // facing left
                this.sprite.body.offset.x = this.sprite.width - (this.customHitbox.x + this.customHitbox.width);
            }
            this.sprite.body.offset.y = this.customHitbox.y;
            // TODO In order to make it more generic, we'd have to take into
            // account flipY as well. Anyway, it seems fine for the platformer
            // we're doing at the moment.         
        }
    }

    

    
}