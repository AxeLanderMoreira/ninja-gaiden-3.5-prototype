// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import BaseScene from "./BaseScene";
import SpriteFont from "../menus/SpriteFont";
import ControlMethod from "../input/ControlMethod";
import KeyboardControlMethod from "../input/KeyboardControlMethod";
import GamepadControlMethod from "../input/GamepadControlMethod";
import VirtualPadControlMethod from "../input/VirtualPadControlMethod";

function arrayRotate(arr: any[], reverse: boolean) {
    if (reverse) arr.unshift(arr.pop());
    else arr.push(arr.shift());
    return arr;
}

/**
 * Screen that displays the menu for selecting number of players (page 0) and 
 * assigning controls (page 1).
 */
export default class MenuScreen extends BaseScene {
    private static readonly BG_COLOR = '#000000';
    private static readonly PAGE_SELECT_NUM_PLAYERS = 0;
    private static readonly PAGE_ASSIGN_CONTROLS = 1;
    private static readonly PAGE_0_LEFT = 156;
    private static readonly PAGE_0_TOP = 88;
    private static readonly PAGE_1_LEFT = 156;
    private static readonly PAGE_1_TOP = 88;
    // Shared across both menu pages
    containers: Phaser.GameObjects.Container[]; // containers for the contents shown in each "page"
    font: SpriteFont;    
    maxPlayers: integer;
    optionIndex: integer; // for vertical navigation
    page: integer;
    transitionInProgress: boolean;
    // Used in page 0
    leftArrowPage1:  Phaser.GameObjects.Sprite;
    rightArrowPage0 : Phaser.GameObjects.Sprite;
    rightArrowPage1:  Phaser.GameObjects.Sprite;
    menuOptionGlyphs: Phaser.GameObjects.Sprite[][];
    // Used in page 1
    assignedIndices: integer[]; /** maps which n-th ControlMethod is assigned to which n-th Player */
    ctrlIcons: Phaser.GameObjects.Sprite[];
    numPlayersSelected: integer;
    playerFaces: Phaser.GameObjects.Sprite[];    

    /**
     * 
     */
    constructor() {
        super('MenuScreen');
        this.page = MenuScreen.PAGE_SELECT_NUM_PLAYERS;
        this.optionIndex = 0;
        this.optionIndex = 0;
        this.menuOptionGlyphs = [];
        this.containers = [];
        this.assignedIndices = [];
    }
    
    /**
     * 
     * @param data 
     */
    create(data?: any) {
        super.create(data);
        this.font = new SpriteFont(this);
        this.maxPlayers = this.ctrlMethods.length;
        console.log('[MenuScreen.create] this.maxPlayers = ' + this.maxPlayers);
        let box: Phaser.GameObjects.Container;
        if (this.containers.length == 0) {
            box = this.add.container(0, 0);
            this._buildPageSelectNumPlayers(box);
            this.containers.push(box);
            box = this.add.container(0, 0);
            this._buildPageAssignControls(box);
            this.containers.push(box);
            box.setVisible(false);
        } 
    }

    /**
     * 
     */
    preload() {
        this.load.spritesheet('ninja_faces', 'assets/NinjaFaces.png', {
            frameWidth: 16,
            frameHeight: 16
          });
        this.load.spritesheet('control_methods', 'assets/ControlMethods.png', {
            frameWidth: 32,
            frameHeight: 16
        });
    }

    /**
     * 
     * @param time 
     * @param delta 
     */
    update(time: number, delta: number): void {
        super.update(time, delta);
        switch(this.page) {
            case MenuScreen.PAGE_SELECT_NUM_PLAYERS:
                this._updateSelectNumPlayers();
                break;
            case MenuScreen.PAGE_ASSIGN_CONTROLS:
                this._updateAssignControls();
                break;
        }        
    }
    
    /**
     * Builds initial layout of second page (assign controls)
     * @param box Container for this menu page
     */
    private _buildPageAssignControls(box: Phaser.GameObjects.Container) {
        this.playerFaces = [];
        this.ctrlIcons = [];
        this.assignedIndices = [];
        this._refreshAssignedIndices();
        let spr: Phaser.GameObjects.Sprite;
        let _x , _y;
        _y = MenuScreen.PAGE_1_TOP;
        for (let i = 0; i < 4; i++) {
            // New row
            _x = MenuScreen.PAGE_1_LEFT;            
            // Ninja face
            spr = this.add.sprite(_x, _y, 'ninja_faces');
            spr.setFrame(i);
            spr.setOrigin(0, 0);
            spr.setVisible(false);
            box.add(spr);            
            this.playerFaces.push(spr);
            // Left arrow
            _x += 18;
            if (i == 0) {
                this.leftArrowPage1 = this.font.putGlyph(SpriteFont.CODE_ARROW_LEFT, _x, _y+4);
                box.add(this.leftArrowPage1);
            }
            _x += 10;
            // Control method            
            spr = this.add.sprite(_x, _y, 'control_methods');
            if (i < this.ctrlMethods.length) {
                spr.setFrame(this._getControlMethodIcon(this.ctrlMethods[this.assignedIndices[i]]));
            } else {
                spr.setFrame(0);
            }
            spr.setOrigin(0, 0);
            spr.setVisible(false);
            this.ctrlIcons.push(spr);
            _x += 34;
            box.add(spr);
            // Right arrow
            if (i == 0) {
                this.rightArrowPage1 = this.font.putGlyph(SpriteFont.CODE_ARROW_RIGHT, _x, _y+4);
                box.add(this.rightArrowPage1);
            }
            _y += 20;
        }
    }

    /**
     * Builds initial layout of first page (select number of players)
     * @param box Container for this menu page
     */
    private _buildPageSelectNumPlayers(box: Phaser.GameObjects.Container) {
        let _x = MenuScreen.PAGE_0_LEFT;
        let _y = MenuScreen.PAGE_0_TOP;
        let opt: Phaser.GameObjects.Sprite[];
        for (let i = 0; i < 4; i++) {
            let msg: string = (i+1).toString();
            msg += " PLAYER";
            if (i > 0) msg += "S";
            let opt = this.font.putGlyphs(msg, _x, _y);
            this.menuOptionGlyphs.push(opt); _y += SpriteFont.CHAR_HEIGHT + 2; 
            this.font.setAlpha(opt, (i < this.maxPlayers) ? 1 : .5);
            box.add(opt);
        }
        console.log('_y = ' + (50 + (this.optionIndex * (SpriteFont.CHAR_HEIGHT + 2))));
        this.rightArrowPage0 = this.font.putGlyph(SpriteFont.CODE_ARROW_RIGHT, 
            _x - SpriteFont.CHAR_WIDTH - 2, 
            MenuScreen.PAGE_0_TOP + (this.optionIndex * (SpriteFont.CHAR_HEIGHT + 2)));
        box.add(this.rightArrowPage0);
    }

    /**
     * Gets the icon associated to a specific type of ControlMethod
     * @param ctrl 
     * @returns The frame index, in a spritesheet containing all control method icons.
     */
    private _getControlMethodIcon(ctrl: ControlMethod) {
        if (ctrl instanceof KeyboardControlMethod) {
            return 0;
        }
        if (ctrl instanceof GamepadControlMethod) {
            return 1;
        }
        if (ctrl instanceof VirtualPadControlMethod) {
            return 2;
        }
        
        throw new Error('Unhandled Class ' + ctrl.constructor.name);
    }

    /**
     * 
     */
    private _nextPage() {
        switch(this.page) {
            case MenuScreen.PAGE_SELECT_NUM_PLAYERS:
                if (this.ctrlMethods.length == 1 && this.numPlayersSelected == 1) {
                    // 1 player and 1 input device? just skip next menu and go straight to the game
                    this._startGame();
                } else {
                    this.containers[this.page].setVisible(false);
                    this.page = MenuScreen.PAGE_ASSIGN_CONTROLS;
                    this.containers[this.page].setVisible(true);
                }
                break;
            case MenuScreen.PAGE_ASSIGN_CONTROLS:
                this._startGame();
                break;
        }
    }

    /**
     * Check if the number of detected control methods has changed, and resets
     * the assignedIndices array accordingly.
     */
    private _refreshAssignedIndices() {
        if (this.assignedIndices.length == this.ctrlMethods.length) {
            return; // nothing changed
        }
        this.assignedIndices = []; // something changed - reset
        this.ctrlMethods.forEach((ctrl, i) => {
            this.assignedIndices.push(i);
        });        
    }

    /**
     * 
     */
    private _startGame() {
        if (this.transitionInProgress) return;
        this.transitionInProgress = true;
        this.cameras.main.fadeOut(1000, 0, 0, 0, (_camera, _progress) => {
            if (_progress >= 1) {                
                this.scene.start('Scene21Desert', {
                    numPlayers: this.numPlayersSelected,
                    ctrlMethods: this.ctrlMethods,
                    assignedIndices: this.assignedIndices
                });
            }
        });
    }

    /**
     * Updtes layout of second page (assign controls)
     */
    private _updateAssignControls() {
        this._refreshAssignedIndices();
        let total = this.numPlayersSelected;
        for (let i = 0; i < 4; i++) {
            this.playerFaces[i].setVisible(i < total);
            this.ctrlIcons[i].setVisible(i < total);
        }
        if (this.anyInputHit('down')) {
            this.optionIndex++;
            if (this.optionIndex >= total) {
                this.optionIndex = 0;
            }
        } else if (this.anyInputHit('up')) {
            this.optionIndex--;
            if (this.optionIndex < 0) {
                this.optionIndex = total - 1;
            }
        } else if (this.anyInputHit('left')) {
            arrayRotate(this.assignedIndices, true);
        } else if (this.anyInputHit('right')) {
            arrayRotate(this.assignedIndices, false);
        } else if (this.anyInputHit('a')/* || this.anyInputHit('b')*/) {
            //this._startGame();
            this._nextPage();
        }        
        let _y = MenuScreen.PAGE_1_TOP + 4 + (this.optionIndex * 20);
        this.leftArrowPage1.y = _y;
        this.rightArrowPage1.y = _y;
        for (let i = 0; i < total; i ++) {
            this.ctrlIcons[i].setFrame(this._getControlMethodIcon(this.ctrlMethods[this.assignedIndices[i]]));
        }
    }

    /**
     * Updtes layout of first page (select number of players)
     */
    private _updateSelectNumPlayers() {
        let maxPlayers = this.ctrlMethods.length;
        if (maxPlayers != this.maxPlayers) {
            // # of control inputs has changed since previous frame
            this.maxPlayers = maxPlayers;
            for (let i = 0; i < 4; i++) {
                this.font.setAlpha(this.menuOptionGlyphs[i], (i < this.maxPlayers) ? 1 : .5);
            }
        }
        if (this.anyInputHit('down')) {
            this.optionIndex++;
            if (this.optionIndex >= maxPlayers) {
                this.optionIndex = 0;
            }
        } else if (this.anyInputHit('up')) {
            this.optionIndex--;
            if (this.optionIndex < 0) {
                this.optionIndex = maxPlayers - 1;
            }
        } else if (this.anyInputHit('a')/* || this.anyInputHit('b')*/) {
            //this._startGame();
            this.numPlayersSelected = this.optionIndex + 1;
            this.optionIndex = 0;
            this._nextPage();
        }
        this.rightArrowPage0.y = MenuScreen.PAGE_0_TOP + this.optionIndex* (SpriteFont.CHAR_HEIGHT + 2);        
    }
    
}
