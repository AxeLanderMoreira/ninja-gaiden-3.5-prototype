// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import ControlMethod from "../input/ControlMethod";
import GameSegment from "../scenes/GameSegment";
import Entity from "./Entity";
import PowerUp from "./PowerUp";

export default class Ninja extends Entity {  
    static rect1: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
    static rect2: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();

    sword: Phaser.Physics.Arcade.Sprite;    
    static readonly WALKING_SPEED = 96;
    static readonly LEDGE_MOVING_SPEED = 48;
    static readonly QUICKSAND_WALKING_SPEED = 32;
    static readonly QUICKSAND_FALLING_SPEED = 8;
    static readonly QUICKSAND_LIMIT_Y = 140; // TODO Hardcoded for test purposes only... we have to deal more generically
    static readonly MAX_HP = 16;
    static readonly INITIAL_RESERVE_LIVES = 2;
    static readonly MAX_RESERVE_LIVES = 9;
    static readonly INVINCIBILITY_TIME = 1000; // milliseconds
    static readonly SLASH_SPEED = 250;
    static readonly INITIAL_MANA = 10;
    static readonly INITIAL_MAX_MANA = 40;   // Upon getting the max mana increase power up
    static readonly MANA_INCREMENT = 10;     
    static readonly MAX_MANA_INCREMENT = 10; // Upon getting the max mana increase power up
    static readonly HP_INCREMENT = 6;
    static readonly JUMP_SPEED = -250; // Initial jump velocity Y
    static readonly MAX_NUM_PLAYERS = 4;
    readonly slash_offset = {
        crouch_slash : {x:2,y:15},
        jump_slash: {x:1,y:6},
        stand_slash: {x:4,y:10}
    }
    ctrlMethod: ControlMethod;
    currentPower: integer;
    invincible: boolean;
    jumping: boolean = false;
    /** ledge that player is currently standing on top of */
    ledgeTop?: Phaser.GameObjects.GameObject;      
    /* ledge that player just jumped down from while standing on top of (but still can grab) */
    ledgeTopOut?: Phaser.GameObjects.GameObject;
    /** ledge that player is currently grabbing */
    ledgeBottom?: Phaser.GameObjects.GameObject;
    /* ledge that player just jumped down from while grabbing */
    ledgeBottomOut?: Phaser.GameObjects.GameObject;
    lives: integer;
    mana: integer;
    maxMana: integer;
    powerUp: boolean; // sword is powered up   
    quicksand: boolean;
    timedEvent?: Phaser.Time.TimerEvent;     
    wall?: Phaser.GameObjects.GameObject; /**< the wall the ninja is currently sticked to/climbing */    

    /**
     * 
     * @param scene 
     */
    static initAnims (scene: GameSegment) {
        for (let i = 0; i < Ninja.MAX_NUM_PLAYERS; i++) {
            let key = 'ninja' + i.toString();
            scene.createAnim(key, 0, 'climb_idle', {frames: [30]}, 200, -1);
            scene.createAnim(key, 0, 'climb_move', {start: 30, end: 31}, 200, -1);
            scene.createAnim(key, 0, 'crouch_idle', {start: 20, end: 21}, 200, -1);
            scene.createAnim(key, 0, 'crouch_slash', {start: 22, end: 24}, Ninja.SLASH_SPEED, 0);
            scene.createAnim(key, 0, 'get_hit', {frames: [9]}, 200, -1);
            scene.createAnim(key, 0, 'grab_idle', {frames: [25]}, 200, -1);
            scene.createAnim(key, 0, 'grab_move', {frames: [25, 28, 29, 28]}, 400, -1);
            scene.createAnim(key, 0, 'jump_descend', {start: 14, end: 15}, 200, -1);
            scene.createAnim(key, 0, 'jump_reach', {frames: [25]}, 200, -1);
            scene.createAnim(key, 0, 'jump_slash', {start: 16, end: 18}, Ninja.SLASH_SPEED, 0);
            scene.createAnim(key, 0, 'jump_sommersault', {start: 10, end: 13}, 400, -1);
            scene.createAnim(key, 0, 'run', {frames: [6, 7, 8, 7]}, 300, -1);
            scene.createAnim(key, 0, 'stand_idle', {start: 0, end: 1}, 200, -1);
            scene.createAnim(key, 0, 'stand_slash', {start: 2, end: 4}, Ninja.SLASH_SPEED, 0);
        }        
        scene.createAnim('sword', 0, 'slash', {frames: [0, 1, 2]}, Ninja.SLASH_SPEED, 0);
        scene.createAnim('sword', 0, 'pslash', {frames: [0, 3, 4]}, Ninja.SLASH_SPEED, 0);
    }

    /**
     * Preload textures (and later sound samples?)
     */
    static preloadResources (scene: GameSegment) {
        scene.load.spritesheet('ninja0', 'assets/Ninja.png', {
            frameWidth: 36,
            frameHeight: 37
        });
        scene.load.spritesheet('ninja1', 'assets/Player2.png', {
            frameWidth: 36,
            frameHeight: 37
        });
        scene.load.spritesheet('ninja2', 'assets/Player3.png', {
            frameWidth: 36,
            frameHeight: 37
        });
        scene.load.spritesheet('ninja3', 'assets/Player4.png', {
            frameWidth: 36,
            frameHeight: 37
        });
        scene.load.spritesheet('sword', 'assets/Sword.png', {
            frameWidth: 35,
            frameHeight: 18
        });
    }

    constructor(scene: GameSegment, ctrlMethod: ControlMethod, sprite: Phaser.Physics.Arcade.Sprite, sword: Phaser.Physics.Arcade.Sprite) {
        super(scene, sprite);        
        this.lives = Ninja.INITIAL_RESERVE_LIVES;
        this.ctrlMethod = ctrlMethod;
        this.respawn(/*ctrlMethod,*/ sprite, sword);
    }

    /**
     * Respawn after losing a life and having the Scene recreated
     * @param ctrlMethod 
     * @param sprite 
     * @param sword 
     */
    respawn(sprite: Phaser.Physics.Arcade.Sprite, sword: Phaser.Physics.Arcade.Sprite) {    
        this.sprite = sprite;
        this.sword = sword;
        sprite.setData('parent', this);
        sword.setData('parent', this);                
        sprite.setSize(20, 36);
        this.state = "stand_idle";        
        this.powerUp = false; //true; 
        this.hp = this.maxHp = Ninja.MAX_HP;
        this.mana = Ninja.INITIAL_MANA;
        this.maxMana = Ninja.INITIAL_MAX_MANA;        
        this.turn(1); // turn, right      
        this.invincible = false;
        this.currentPower = PowerUp.STAR;
    }

    drawSword() {
        this.sword.setVisible(true);
        this.sword.anims.play(this.powerUp ? 'sword.pslash' : 'sword.slash'); 
    }

    getMana(): integer {
        return this.mana;
    }

    getMaxMana(): integer {
        return this.maxMana;
    }

    /**
     * Checks if player is allowed to jump in the specified direction. Tested
     * when player is climbing against a wall.
     * @param direction -1 facing left, +1 facing right
     */
    isAllowedToJump(direction: integer): boolean {
        if (direction == this.facing) {
            return this.reachedWallTop();
        } else {
            return true;
        }
    }
    
    onBeginState(prevState: string, newState: string) {
        console.log("beginning state " + newState );     
        const ninjaBody : Phaser.Physics.Arcade.Body = this.sprite.body;   
        switch(newState) {
            case "climb_idle":
                this.jumping = false;
                ninjaBody.allowGravity = false;
                this.sprite.setVelocity(0, 0);
                // move outside of colliding body
                break;
            case "crouch_idle":
                this.jumping = false;
                this.sprite.setVelocity(0, 0);
                this.sprite.setAcceleration(0);
                break;
            case "crouch_slash":
                this.jumping = false;
                this.drawSword();
                this.sprite.setVelocity(0, 0);
                this.sprite.setAcceleration(0);                
                this.sprite.on("animationcomplete", () => 
                {
                    this.setState("crouch_idle");
                });
                break;
            case "get_hit":                
                this.invincible = true;                
                this.jumping = true;                
                ninjaBody.allowGravity = true;
                this.ledgeTop = undefined; // no longer bound to a ledge
                // Code below has no effect at all
                /*if (this.onFloor()) { // remove from floor
                    console.log("Remove from floor ")
                    this.sprite.setPosition(this.sprite.body.x - 1, this.sprite.body.y - 1);
                }*/
                console.log('[Ninja.onBeginState(get_hit)]  After sprite.setPosition = ' + this.sprite.body.velocity.y);
                break;
            case "grab_idle":
                ninjaBody.allowGravity = false;
                this.sprite.setVelocity(0, 0);
                this.sprite.setAcceleration(0);
                this.jumping = false;
                break;
            case "jump_descend":
                this.jumping = true;
                ninjaBody.allowGravity = true;
                this.ledgeTopOut = this.ledgeTop; // mark the ledge where I jumped from
                this.ledgeTop = undefined; // no longer bound to a ledge                
                break;
            case "jump_reach":
                this.jumping = true;
                ninjaBody.allowGravity = true;
                this.sprite.setVelocityY(Ninja.JUMP_SPEED);                
                this.ledgeTop = undefined; // no longer bound to a ledge                
                break;
            case "jump_slash":
                this.jumping = true;
                this.drawSword();
                ninjaBody.allowGravity = true;
                this.sprite.on("animationcomplete", () => 
                {
                    this.setState("jump_descend");
                });
                this.ledgeTop = undefined; // no longer bound to a ledge                
                break;
            case "jump_sommersault":
                this.jumping = true;
                ninjaBody.allowGravity = true;
                if (prevState == 'climb_idle' || prevState == 'climb_move') {
                    this.sprite.setVelocityY(Ninja.JUMP_SPEED/2);
                } else { // TODO Handle grab_idle or grab_move with a different jump speed?
                    this.sprite.setVelocityY(Ninja.JUMP_SPEED);
                }
                this.ledgeTop = undefined; // no longer bound to a ledge                
                break;
            case "stand_idle":
                this.jumping = false;
                this.sprite.setVelocity(0);
                this.sprite.setAcceleration(0);
                break;
            case "stand_slash":                
                this.jumping = false;
                this.drawSword();
                this.sprite.setVelocity(0);
                this.sprite.setAcceleration(0);
                
                this.sprite.on("animationcomplete", () => 
                {
                    this.setState("stand_idle");
                });
                break;
            default:
                // TODO
                break;
        }
        super.onBeginState(prevState, newState);
    }

    /**
     * 
     * @param state 
     */
    onEndState(state: string, newState: string) {
        switch(state) {
            case "climb_move":
                if (newState != "climb_idle") {
                    this.wall = undefined;
                }
                break;
            case "crouch_slash":
                this.sprite.off("animationcomplete");
                this.undrawSword();
                break;
            case "jump_descend":
                this.ledgeBottomOut = undefined; // reset flag after dropping off a ledge
                break;
            case "jump_slash":
                this.sprite.off("animationcomplete");
                this.undrawSword();
                break;
            case "stand_slash":
                this.sprite.off("animationcomplete");
                this.undrawSword();
                break;            
            default:
                // TODO
                break;
        }
    }

    getAttackStrength(): integer {
        return 1;
    }

    getLives(): integer {
        return this.lives;
    }

    /**
     * 
     * @param powerup 
     */
    pickUpPowerUp(powerup: PowerUp) {
        powerup.sprite.disableBody(true, true);
        // TODO remove from this.powerUps and from sprite from powerUpGroup
        // Create destroy() method
        let variant = powerup.variant || 0;
        console.log("Picked up PowerUp of type " + variant);
        switch (variant) {
            case PowerUp.MANA:
                this.mana += Ninja.MAX_MANA_INCREMENT;
                if (this.mana > this.maxMana) {
                    this.mana = this.maxMana;
                }
                break;
            case PowerUp.SWORD:
                this.powerUp = true;
                break;
            case PowerUp.STAR:
            case PowerUp.BLAST_UP:
            case PowerUp.WHEEL:
            case PowerUp.BLAST_DOWN:
            case PowerUp.SLICE_UP_DOWN:
                this.currentPower = variant;
                break;
            case PowerUp.MAX_MANA:
                this.maxMana += Ninja.MAX_MANA_INCREMENT;
                break;
            case PowerUp.ONE_UP:
                this.lives++;
                break;
            case PowerUp.HP_UP:
                this.hp += Ninja.HP_INCREMENT;
                if (this.hp > Ninja.MAX_HP) {
                    this.hp = Ninja.MAX_HP;
                }
        }
    }

    /**
     * 
     */
    gotHit(other: Entity) : boolean {
        super.gotHit(other);
        if (this.hp > 0) {
            if (this.sprite.body.touching.left && other.sprite.body.touching.right) {
                // Situation 1: you were rammed by an enemy moving from left to right  
                console.log('[Ninja.gotHit] Situation 1: you were rammed by an enemy moving from left to right');
                this.turn(-1);                
                this.sprite.setVelocity(Ninja.WALKING_SPEED,-50);
                console.log('[Ninja.gotHit] sprite.body.velocity.y now = ' + this.sprite.body.velocity.y);
            } else if (this.sprite.body.touching.right && other.sprite.body.touching.left) {
                // Situation 2: you were rammed by an enemy moving from right to left
                console.log('[Ninja.gotHit] Situation 2: you were rammed by an enemy moving from right to left');
                this.turn(1);
                this.sprite.setVelocity(-Ninja.WALKING_SPEED,-50);                
                console.log('[Ninja.gotHit] sprite.body.velocity.y now = ' + this.sprite.body.velocity.y);
            } else if (this.sprite.body.touching.down && other.sprite.body.touching.up) {
                // Situation 3: you jumped on top of an enemy
                console.log('[Ninja.gotHit] Situation 3: you jumped on top of an enemy');
                this.sprite.setVelocity(0, -50);
                console.log('[Ninja.gotHit] sprite.body.velocity.y now = ' + this.sprite.body.velocity.y);
            } else if (this.sprite.body.touching.down && other.sprite.body.touching.up) {
                // Situation 4: you had an enemy jump on top of you
                console.log('[Ninja.gotHit] Situation 4: you had an enemy jump on top of you');
                this.sprite.setVelocity(0, 0);
                console.log('[Ninja.gotHit] sprite.body.velocity.y now = ' + this.sprite.body.velocity.y);
            }
            this.setState('get_hit');            
        } else {
            this.loseLife();
        }
        return true;
    }

    loseLife() {
        this.lives--;
        this.hp = 0;
        this.invincible = true;
        if (this.timedEvent) {
            this.timedEvent.remove();
            delete this.timedEvent;
        }
        this.scene.onPlayerKOed(this);
    }

    /**
     * Checked while in 'grab_move' state
     * @param ledge 
     */
    stillGrabbingLedge(ledge: Phaser.GameObjects.GameObject) {
        return this.scene.physics.overlap(this.sprite, ledge);
    }

    onTouchedLedge(ledge: Phaser.GameObjects.GameObject) {
        //console.log('[Ninja.onTouchedLedge] IN');
        if (this.jumping && this.sprite.body.velocity.y >= 0) { // include get_hit
            Phaser.Display.Bounds.GetBounds(this.sprite, Ninja.rect1);
            Phaser.Display.Bounds.GetBounds(ledge, Ninja.rect2);
            let ny1 = Ninja.rect1.y;
            let ny2 = Ninja.rect1.y + Ninja.rect1.height;
            let ly1 = Ninja.rect2.y;
            let ly2 = Ninja.rect2.y + Ninja.rect2.height;
            console.log("[Ninja.onTouchedLedge]  ledge == this.ledgeBottomOut");
            if (ledge != this.ledgeBottomOut && ny1 >= ly1 && ny1 <= ly2) {
                //console.log('[Ninja.onTouchedLedge] GRAB BOTTOM OF LEDGE');
                this.setState('grab_idle');
                this.ledgeBottom = ledge;
                this.ledgeBottomOut = undefined;
                //this.sprite.body.y = 
                // TODO Force position of the hands to ly1 + (Ninja.rect2.height / 2);
            } else if (ledge != this.ledgeTopOut && ny2 >= ly1 && ny2 <= ly2) { // not the ledge I jumped from
                console.log('[Ninja.onTouchedLedge] WALK ON TOP OF LEDGE');
                // TODO Have ledgeTop, ledgeBottom, ledgeOut?
                this.ledgeTop = ledge;
                this.ledgeTopOut = undefined;
            }
        }
    }

    onTouchedWall(wall: Phaser.GameObjects.GameObject, direction: integer) {
        if (this.jumping) { // include get_hit
            this.turn(direction);
            if (this.state == 'get_hit') {
                this.setTimedInvincibility();
            }                    
            this.setState('climb_idle');
            this.wall = wall; // wall being climbed
        }
    }

    /**
     * Checks if, while climbing down a wall, ninja has reached the bottom of it
     */
    reachedWallBottom() {
        console.log('reachedWallBottom? this.sprite.body.top = ' + this.sprite.body.top);
        console.log('reachedWallBottom? this.wall?.body.bottom = ' + this.wall?.body.bottom);
        return this.sprite.body.top > this.wall?.body.bottom - 18; // TODO Get rid of magic number
    }

    /**
     * Checks if, while climbing up a wall, ninja has reached the top of it
     */
    private reachedWallTop() {
        return this.sprite.body.bottom < this.wall?.body.top + 6; // TODO Get rid of magic number
    }

/*
Características de quando cai na areia movediça:
    (V) Velocidade da corrida cai drasticamente (+ de 3x?)
    (V) Vai afundando
    ( ) Quando chega na metade do corpo, muda pro frame de 'get_hit' e afunda de vez, e perde 6 pontos de vida.
    ( ) Em menos de 1 segundo, perde mais 6.
    ( ) A qualquer momento é possível sair da areia movediça pulando
    ( ) Se a areia movediça ainda não passou do joelho, é possível sair dela simplesmente correndo na direção da areia comum sem pular.
    ( ) Quando isso acima é feito, o ninja corre com a areia comum na altua do corpo em que estava quando saiu da areia movediça.
    - mas ainda tem um tempo de reação que te permite pular    
*/
    /**
     * 
     * @param on 
     */
    public setQuicksand(on: boolean) {
        //console.log('[Ninja.setQuicksand(' + on + '); this.state = ' + this.state);
        if (this.state == 'climb_idle' || this.state == 'climb_move') {
            return; // can't be on quicksand if climbing wall; also prevents Ninja sliding dow the wall due to gravity
        }
        this.quicksand = on;
        if (this.state == 'run') {
            this.sprite.setVelocityX(this.facing * (on ? Ninja.QUICKSAND_WALKING_SPEED : Ninja.WALKING_SPEED));
        }
        let ninjaBody = this.sprite.body;
        ninjaBody.allowGravity = !on; // disable gravity 
    }

    private setTimedInvincibility() {
        this.sprite.alpha = .5; // TODO Make a more sophisticate glowing effect? No need for now...
        this.timedEvent = this.scene.time.delayedCall(Ninja.INVINCIBILITY_TIME, () => {
            this.sprite.alpha = 1;
            this.invincible = false;
        });
    }

    private undrawSword() {
        this.sword.setVisible(false);
        this.sword.anims.stop();
    }

/*
setCustomHitbox(rect: Phaser.Geom.Rectangle) {
        this.customHitbox = rect;
        this.sprite.body.setSize(rect.width, rect.height);
        this._recalculateOffset();
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
*/

    updateSwordSprite(ninjaBody : Phaser.Physics.Arcade.Body, swordBody : Phaser.Physics.Arcade.Body) {
        const offset_x = this.slash_offset[this.state].x;
        const offset_y = this.slash_offset[this.state].y;
        console.log("sword anim frame = " + this.sword.anims.currentFrame.index);
        if (this.facing > 0) {  // facing right
            this.sword.setFlipX(false);
            swordBody.offset.x = 0;
            swordBody.x = ninjaBody.x + ninjaBody.width + offset_x;
            if (!this.powerUp) {
                swordBody.width = this.sword.width / 2;
            } else {
                swordBody.width = this.sword.width;
            }
        } else {                // facing left
            this.sword.setFlipX(true);
            swordBody.x = ninjaBody.x - this.sword.width - offset_x;
            if (!this.powerUp) {
                swordBody.offset.x = this.sword.width/2;
                swordBody.x += swordBody.offset.x;
            } else {
                swordBody.offset.x = 0;
            }
        }
        swordBody.y = ninjaBody.y + offset_y;        
    }

    onFloor() {
        const ninjaBody : Phaser.Physics.Arcade.Body = this.sprite.body;        
        return this.quicksand || ninjaBody.onFloor();
    }

    update() {
        super.update();
        const ctrl: ControlMethod = this.ctrlMethod;
        let idle: boolean = true;
        const ninjaBody : Phaser.Physics.Arcade.Body = this.sprite.body;
        if (this.quicksand) {
            this.sprite.setVelocityY(ninjaBody.y < Ninja.QUICKSAND_LIMIT_Y ? Ninja.QUICKSAND_FALLING_SPEED: 0);
        }
        if (this.sword.visible) {
            const swordBody : Phaser.Physics.Arcade.Body = this.sword.body;
            this.updateSwordSprite(ninjaBody, swordBody);
        }
        switch (this.state) {
            case 'climb_idle':     
                console.log('ninjaBody.allowGravity before = ' + ninjaBody.allowGravity);
                ninjaBody.allowGravity = false; // prevent bugs of having the player slide down the wall
                if (ctrl.held('a')) {
                    if (ctrl.held('right')) {
                        if (this.isAllowedToJump(1)) {
                            this.setState('jump_sommersault');
                            this.turn (1);
                            this.sprite.setVelocityX(Ninja.WALKING_SPEED);
                        }                        
                    } else if (ctrl.held('left')) {
                        if (this.isAllowedToJump(-1)) {
                            this.setState('jump_sommersault');
                            this.turn (-1);
                            this.sprite.setVelocityX(-Ninja.WALKING_SPEED);
                        }
                    }
                } else if(ctrl.held('up')) {
                    if (this.reachedWallTop()) {
                        break;
                    }
                    this.sprite.setVelocityY(-Ninja.WALKING_SPEED);
                    this.setState('climb_move');
                } else if (ctrl.held('down')) {
                    this.sprite.setVelocityY(Ninja.WALKING_SPEED);
                    this.setState('climb_move');
                }
                break;
            case 'climb_move':
                ninjaBody.allowGravity = false; // prevent bugs of having the player slide down the wall
                if (ninjaBody.velocity.y < 0) { // going up                    
                    if (this.reachedWallTop()) {
                        this.sprite.setVelocityY(0);
                        this.setState('climb_idle');                        
                        break;
                    }
                } else if (ninjaBody.velocity.y > 0) { // going down
                    if (this.reachedWallBottom()) {
                        this.setState('jump_descend');
                        break;
                    } else if (this.onFloor()) {
                        this.setState('stand_idle');
                    }
                }
                if (ctrl.held('a')) {                    
                    if (ctrl.held('right')) {
                        if (this.isAllowedToJump(1)) {
                            idle = false;
                            this.setState('jump_sommersault');
                            this.turn (1);
                            this.sprite.setVelocityX(Ninja.WALKING_SPEED);
                        }                        
                    } else if (ctrl.held('left')) {
                        if (this.isAllowedToJump(-1)) {
                            idle = false;
                            this.setState('jump_sommersault');
                            this.turn (-1);
                            this.sprite.setVelocityX(-Ninja.WALKING_SPEED);
                        }
                    }
                } else if (ctrl.held('up')) {
                    idle = false;
                    this.sprite.setVelocityY(-Ninja.WALKING_SPEED);
                } else if (ctrl.held('down')) {
                    idle = false;
                    this.sprite.setVelocityY(Ninja.WALKING_SPEED);
                }
                if (idle) {
                    this.setState('climb_idle');
                }
                break;
            case 'crouch_idle':
                if (ctrl.held('left')) {
                    this.setState('run');
                    this.turn(-1);
                    this.sprite.setVelocityX(-Ninja.WALKING_SPEED);
                } else if (ctrl.held('right')) {
                    this.setState('run');
                    this.turn(1);
                    this.sprite.setVelocityX(Ninja.WALKING_SPEED);
                } else if (ctrl.held('b')) { // sword
                    this.setState('crouch_slash');
                } else if (ctrl.held('a')) { // jump
                    if (!!this.ledgeTop) { // bound to a ledge?
                        this.setState('jump_descend'); // will set ledge to undefined
                    }
                } else if (!ctrl.held('down')) {
                    this.setState('stand_idle');
                } 
                break;
            case 'crouch_slash':
                this._testSwordHit();
                break;
            case 'get_hit':
                console.log('[Ninja.update(get_hit)] this.getStateTime() = ' + this.getStateTime());
                console.log('[Ninja.update(get_hit)] sprite.body.velocity.y now = ' + this.sprite.body.velocity.y);
                if (this.getStateTime() > 0 && ninjaBody.velocity.y >= 0 && this.onFloor()) { // descent
                    this.setState('stand_idle'); 
                    this.setTimedInvincibility();                    
                }
                break;
            case 'grab_idle':
                if (ctrl.held('right')) {
                    this.setState('grab_move');
                    this.turn(1);
                    this.sprite.setVelocityX(this.facing * Ninja.LEDGE_MOVING_SPEED);
                } else if (ctrl.held('left')) {
                    this.setState('grab_move');
                    this.turn(-1);
                    this.sprite.setVelocityX(this.facing * Ninja.LEDGE_MOVING_SPEED);
                } else if (ctrl.held('a')) {
                    if (ctrl.held('down')) {
                        // jump down
                        this.setState('jump_descend');
                        this.ledgeBottomOut = this.ledgeBottom;
                        this.ledgeBottom = undefined;
                    } else {
                        // jump up (side or neutral
                        this.setState('jump_sommersault');
                        this.ledgeBottom = this.ledgeBottomOut = undefined;
                    }                    
                }
                break;
            case 'grab_move':
                if (ctrl.held('left')) { // keep hanging on ledge
                    idle = false;
                    if (this.facing > 0) {
                        this.turn(-1);
                        this.sprite.setVelocityX(this.facing * Ninja.LEDGE_MOVING_SPEED);
                    }
                } else if (ctrl.held('right')) { // keep hanging on ledge
                    idle = false;
                    if (this.facing > 0) {
                        this.turn(1);
                        this.sprite.setVelocityX(this.facing * Ninja.LEDGE_MOVING_SPEED);
                    }
                }
                if (!idle && !this.stillGrabbingLedge(this.ledgeBottom)) {                    
                    this.setState('jump_descend');
                    this.ledgeBottomOut = this.ledgeBottom;
                    this.ledgeBottom = undefined;
                }
                if (ctrl.held('a')) {
                    if (ctrl.held('down')) {
                        // jump down
                        idle = false;
                        this.setState('jump_descend');
                        this.ledgeBottomOut = this.ledgeBottom;
                        this.ledgeBottom = undefined;
                    } else {
                        // jump up (side or neutral
                        idle = false;
                        this.setState('jump_sommersault');
                        this.ledgeBottom = this.ledgeBottomOut = undefined;
                    }
                }                
                if (idle) {
                    this.setState('grab_idle');
                }
                break;
            case 'jump_descend':
                if (this.fellOutOfBounds()) {
                    this.loseLife();
                } else if (this.onFloor()) {
                    this.setState('stand_idle');
                } else if (ctrl.held('b')) { // sword
                    idle = false;
                    this.setState('jump_slash');
                } else if (ctrl.held('left')) { // full control of jump direction, just like in NES
                    this.sprite.setVelocityX(this.facing < 0 ? -Ninja.WALKING_SPEED : -Ninja.WALKING_SPEED / 2);
                } else if (ctrl.held('right')) {
                    this.sprite.setVelocityX(this.facing > 0 ? Ninja.WALKING_SPEED : Ninja.WALKING_SPEED / 2);
                }
                break;
            case 'jump_reach':
                if (this.fellOutOfBounds()) {
                    this.loseLife();
                } else if (this.onFloor()) {
                    this.setState('stand_idle');
                } else if (ctrl.held('b')) { // sword
                    this.setState('jump_slash');
                } else if (ctrl.held('left')) { // full control of jump direction, just like in NES
                    this.sprite.setVelocityX(this.facing < 0 ? -Ninja.WALKING_SPEED : -Ninja.WALKING_SPEED / 2);
                } else if (ctrl.held('right')) {
                    this.sprite.setVelocityX(this.facing > 0 ? Ninja.WALKING_SPEED : Ninja.WALKING_SPEED / 2);
                }
                break;
            case 'jump_slash':
                if (this.onFloor()) {
                    this.setState('stand_idle');
                } else {
                    this._testSwordHit();
                }
                break;
            case 'jump_sommersault':                
                if (this.onFloor()) {
                    this.setState('stand_idle');
                } else if (ctrl.held('b')) { // sword
                    idle = false;
                    this.setState('jump_slash');
                } else if (ctrl.held('left')) { // full control of jump direction, just like in NES
                    this.sprite.setVelocityX(this.facing < 0 ? -Ninja.WALKING_SPEED : -Ninja.WALKING_SPEED / 2);
                } else if (ctrl.held('right')) {
                    this.sprite.setVelocityX(this.facing > 0 ? Ninja.WALKING_SPEED : Ninja.WALKING_SPEED / 2);
                } 
                if (idle && ninjaBody.velocity.y > 0) { // descent
                    this.setState('jump_descend');
                }
                break;
            case 'run':
                if (ctrl.held('left')) { // keep running
                    idle = false;
                    if (this.facing > 0) {
                        this.turn (-1);
                        this.sprite.setVelocityX(this.facing * Ninja.WALKING_SPEED);
                    }
                } else if (ctrl.held('right')) {  // keep running
                    idle = false;
                    if (this.facing < 0) {                        
                        this.turn (1);
                        this.sprite.setVelocityX(this.facing * Ninja.WALKING_SPEED);                        
                    }
                }
                if (!idle && !this.onFloor()) { // fallen from platform;
                    this.setState('jump_descend');
                    break;
                }
                if (ctrl.held('a')) { // jump
                    idle = false;
                    this.setState('jump_sommersault');                    
                }  else if (ctrl.held('b')) { // sword
                    idle = false;
                    this.setState('stand_slash');                    
                } // NES doesn't let us crouch while running (that is, if pressing DB). Ninja keeps running.
                if (idle) {
                    this.setState('stand_idle');                    
                }
                break;
            case 'stand_idle':
                if (!this.onFloor()) {
                    this.setState('jump_descend'); // fall
                }
                if (ctrl.held('left')) {
                    this.setState('run');
                    this.turn(-1);
                    this.sprite.setVelocityX(-Ninja.WALKING_SPEED);
                } else if (ctrl.held('right')) {
                    this.setState('run');
                    this.turn(1);
                    this.sprite.setVelocityX(Ninja.WALKING_SPEED);
                } else if (ctrl.held('down')) {
                    this.setState('crouch_idle');                    
                }
                if (ctrl.held('a')) { // jump
                    if (ctrl.held('up')) { // straight jump
                        this.setState('jump_reach'); // atenção para a animação de hang (braços para cima)...
                    } else if (ctrl.held('down')) {
                        if (!!this.ledgeTop) { // bound to a ledge?                            
                            this.setState('jump_descend'); // will set ledge to undefined                            
                        }
                    } else { // sommersault jump
                        this.setState('jump_sommersault');
                    }
                } else if (ctrl.held('b')) { // sword
                    this.setState('stand_slash');                    
                }
                break;
            case 'stand_slash':
                this._testSwordHit();
                break;
            default:
                // TODO
                break;
        }

        let _x = this.sprite.x;
        let max_x = this.scene.getLevelWidth();
        if (_x <  0) {
            this.sprite.setX(0);
        } else if (_x > max_x) {
            this.sprite.setX(max_x);
        }

    } 


    fellOutOfBounds(): boolean {
        let lb = this.scene.getLowerBounds();
        if (lb && this.sprite.body.y > lb) {
            return true;
        }
        return false;
    }

    private _testSwordHit() {
        if (!this.sword.visible || this.sword.anims.currentFrame.index != 2) {
            return;
        }
        // test hit with enemies
        this.scene.physics.overlap(this.sword, this.scene.enemyGroup, 
            (_1, _2) =>
            {
                let enemy = _2.getData("parent");
                enemy.gotHit(this);
            });
        // test hit with power ups
        this.scene.physics.overlap(this.sword, this.scene.powerUpGroup,
            (_1, _2) =>
            {
                let powerup = _2.getData("parent");
                if (powerup.state == "glow") {
                    powerup.setState("fall");
                }                
            });
    }
}
