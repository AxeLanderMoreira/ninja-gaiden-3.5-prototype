// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Globals } from "../Globals";
import ControlMethod from "./ControlMethod";

export default class VirtualPadControlMethod extends ControlMethod {

    prevStatus: any;
    currStatus: any;
    dPadImg: Phaser.GameObjects.Image;
    btnImg: Phaser.GameObjects.Image;
    a: boolean;
    b: boolean;
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    hitAreaA: Phaser.Geom.Triangle;
    hitAreaB: Phaser.Geom.Triangle;
    hitAreaDown: Phaser.Geom.Triangle;
    hitAreaUp: Phaser.Geom.Triangle;
    hitAreaLeft: Phaser.Geom.Triangle;
    hitAreaRight: Phaser.Geom.Triangle;

    constructor(scene: Phaser.Scene) {
        console.log('[VirtualPadControlMethod] constructor - IN');
        super();
        //this.scene = scene;
        this.currStatus = {
            a: false,
            b: false,
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.prevStatus = {
            a: false,
            b: false,
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.dPadImg = scene.add.image(4, 132, 'virtual_dpad');
        this.dPadImg.alpha = .5;
        this.dPadImg.setOrigin(0, 0);
        this.dPadImg.setDepth(Globals.VIRTUAL_CONTROLS_DEPTH);
        this.dPadImg.setInteractive();
        this.dPadImg.setScrollFactor(0);
        this.btnImg = scene.add.image(300, 132, 'virtual_buttons');
        this.btnImg.alpha = .5;        
        this.btnImg.setOrigin(0, 0);
        this.btnImg.setDepth(Globals.VIRTUAL_CONTROLS_DEPTH);
        this.btnImg.setInteractive();
        this.btnImg.setScrollFactor(0);
        this.hitAreaA = new Phaser.Geom.Triangle(0, 0, 80, 80, 0, 80);
        this.hitAreaB = new Phaser.Geom.Triangle(0, 0, 80, 0, 80, 80);
        this.hitAreaUp = new Phaser.Geom.Triangle(0, 0, 80, 0, 40, 40);
        this.hitAreaDown = new Phaser.Geom.Triangle(0, 80, 40, 40, 80, 80);
        this.hitAreaLeft = new Phaser.Geom.Triangle(0, 0, 40, 40, 0, 80);
        this.hitAreaRight = new Phaser.Geom.Triangle(80, 0, 40, 40, 80, 80);

        this.dPadImg.on('pointerdown', pointer => {
            let _x = pointer.x - this.dPadImg.x;
            let _y = pointer.y - this.dPadImg.y;
            console.log('x=' + _x + 'y=' + _y);            
            this.up = this.hitAreaUp.contains(_x, _y);
            this.down = this.hitAreaDown.contains(_x, _y);
            this.left = this.hitAreaLeft.contains(_x, _y);
            this.right = this.hitAreaRight.contains(_x, _y);
        });

        this.dPadImg.on('pointermove', pointer => {
            if (pointer.isDown) {
                // TODO Improve reuse with handler above; use a common callback
                let _x = pointer.x - this.dPadImg.x;
                let _y = pointer.y - this.dPadImg.y;
                console.log('x=' + _x + 'y=' + _y);            
                this.up = this.hitAreaUp.contains(_x, _y);
                this.down = this.hitAreaDown.contains(_x, _y);
                this.left = this.hitAreaLeft.contains(_x, _y);
                this.right = this.hitAreaRight.contains(_x, _y);
            }
        });

        this.dPadImg.on('pointerover', pointer => {
            if (pointer.isDown) {
                // TODO Improve reuse with handler above; use a common callback
                let _x = pointer.x - this.dPadImg.x;
                let _y = pointer.y - this.dPadImg.y;
                console.log('x=' + _x + 'y=' + _y);            
                this.up = this.hitAreaUp.contains(_x, _y);
                this.down = this.hitAreaDown.contains(_x, _y);
                this.left = this.hitAreaLeft.contains(_x, _y);
                this.right = this.hitAreaRight.contains(_x, _y);
            }
        });

        this.dPadImg.on('pointerup', pointer => {
            this.up = this.down = this.left = this.right = false;
        });

        this.dPadImg.on('pointerout', pointer => {
            this.up = this.down = this.left = this.right = false;
        });


        this.btnImg.on('pointerdown', pointer => {
            let _x = pointer.x - this.btnImg.x;
            let _y = pointer.y - this.btnImg.y;
            if (this.hitAreaA.contains(_x, _y)) {
                this.a = true;
            }
            if (this.hitAreaB.contains(_x, _y)) {
                this.b = true;
            }
            console.log('x=' + _x + 'y=' + _y);
        });

        this.btnImg.on('pointermove', pointer => {
            if (pointer.isDown) {
                // TODO Improve reuse with handler above; use a common callback
                let _x = pointer.x - this.btnImg.x;
                let _y = pointer.y - this.btnImg.y;
                if (this.hitAreaA.contains(_x, _y)) {
                    this.a = true;
                }
                if (this.hitAreaB.contains(_x, _y)) {
                    this.b = true;
                }
                console.log('x=' + _x + 'y=' + _y);
            }
        });

        this.btnImg.on('pointerover', pointer => {
            if (pointer.isDown) {
                // TODO Improve reuse with handler above; use a common callback
                let _x = pointer.x - this.btnImg.x;
                let _y = pointer.y - this.btnImg.y;
                if (this.hitAreaA.contains(_x, _y)) {
                    this.a = true;
                }
                if (this.hitAreaB.contains(_x, _y)) {
                    this.b = true;
                }
                console.log('x=' + _x + 'y=' + _y);
            }
        });

        this.btnImg.on('pointerup', pointer => {
            this.a = this.b = false;            
        });

        this.btnImg.on('pointerout', pointer => {
            this.a = this.b = false;            
        });
        
        console.log('[VirtualPadControlMethod] constructor - OUT');
    }

    /**
     * 
     * @param btn 
     */
    hit(btn: string): boolean {
        return (this.currStatus[btn] && !this.prevStatus[btn]);
    }

    /**
     * 
     * @param btn 
     */
    held(btn: string): boolean {
        return this.currStatus[btn];
    }

    /**
     * 
     */
    update(): void {
        // TODO Optimizations:
        // 1. Use bitmask instead of boolean fields
        // 2. Change values in-place rather than creating new objects every time
        this.prevStatus = this.currStatus;
        this.currStatus = {
            a: this.a,
            b: this.b,
            up: this.up,
            down: this.down,
            left: this.left,
            right: this.right
        }
    }
   
}