// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import BaseScene from "./BaseScene";
import GamepadDeviceManager from "../input/GamepadDeviceManager";
import { Globals } from "../Globals";
import SpriteFont from "../menus/SpriteFont";
import KeyboardControlMethod from "../input/KeyboardControlMethod";

export default class TitleScreen extends BaseScene {
    private static readonly BG_COLOR = '#000000';
    private static readonly PROMPT_HAS_GAMEPADS = '# OF GAMEPADS FOUND: ';
    private static readonly PROMPT_NO_GAMEPADS = 'CONNECT GAMEPADS FOR CO-OP PLAY';    
    private static readonly PROMPT_TOUCH_SCREEN = "TOUCH A OR B TO PLAY";    
    private static readonly TEXT_MARGIN_LEFT = 64;
    private static readonly TEXT_MARGIN_TOP = 152;    
    bg: Phaser.GameObjects.Image;
    font: SpriteFont;
    fullscreen: boolean;
    hasPadGlyphs: Phaser.GameObjects.Sprite[];  
    kbPlugin: Phaser.Input.Keyboard.KeyboardPlugin;
    noPadGlyphs: Phaser.GameObjects.Sprite[];      
    numPads: integer;    
    padPlugin: Phaser.Input.Gamepad.GamepadPlugin;    
    transitionInProgress: boolean;

    constructor() {
        console.log('[constructor@TitleScreen] IN');
        super('TitleScreen'); 
        this.noPadGlyphs = [];
        this.hasPadGlyphs = [];
        this.numPads = 0;
        this.fullscreen = false;
        this.transitionInProgress = false;
        console.log('[constructor@TitleScreen] OUT');
    }

    _createFullScreenIcon() {
        let icon = this.add.image(Globals.SCREEN_WIDTH - 40, 8, 'full_screen_icon').setInteractive();
        icon.setOrigin(0, 0);
        icon.on('pointerup', () => {
            this._toggleFullScreen();
        });        
    }

    create(ctx?: any) {
        console.log('[TitleScreen.create] IN');
        super.create(ctx);
        this.cameras.main.setBackgroundColor(TitleScreen.BG_COLOR);
        this.bg = this.add.image(0, 0, 'title_screen');
        this.bg.setOrigin(0, 0);
        this.font = new SpriteFont(this);
        let y = this._buildCopyrightNotice(TitleScreen.TEXT_MARGIN_TOP);        
        this._buildPlayerPrompt(y + 8);
        if (this.hasTouchScreen()) {
            this._createFullScreenIcon();
        }
        this.cameras.main.fadeIn(1000);
        console.log('[TitleScreen.create] OUT');
    }

    private _toggleFullScreen() {
        if (this.scale.isFullscreen)
        {
            this.scale.stopFullscreen();
        }
        else
        {
            this.scale.startFullscreen();
        }
    }

    private _openMenu() {
        if (this.transitionInProgress) return;
        this.transitionInProgress = true;
        this.cameras.main.fadeOut(1000, 0, 0, 0, (_camera, _progress) => {
            if (_progress >= 1) {                
                this.scene.start('MenuScreen', {numPads: this.numPads});
            }
        });
    }
    
    private _buildCopyrightNotice(offset_y: integer) {
        let _x = TitleScreen.TEXT_MARGIN_LEFT;
        let _y = offset_y;
        this.font.putGlyph(SpriteFont.CODE_COPYRIGHT, _x - 12, _y);
        this.font.putGlyphs('ORIGINAL GAME TECMO 1991', _x, _y); _y += SpriteFont.CHAR_HEIGHT + 2;
        this.font.putGlyphs('FAN PROJECT A. MOREIRA 2023', _x, _y); _y += SpriteFont.CHAR_HEIGHT + 2;
        this.font.putGlyphs('POWERED BY PHASER 3 GAME ENGINE', _x, _y); _y += SpriteFont.CHAR_HEIGHT + 2;
        return _y;
    }

    private _buildPlayerPrompt(offset_y: integer) {
        let _x = Globals.SCREEN_WIDTH / 2 ;//TitleScreen.TEXT_MARGIN_LEFT;
        let _y = offset_y;
        if (this.hasTouchScreen()) {
            this.font.putGlyphs('TOUCH A OR B TO START', _x, _y, SpriteFont.H_ALIGN_CENTER);
        } else {
            this.font.putGlyphs('PRESS ' + KeyboardControlMethod.DEFAULT_MAPPED_A_BUTTON + 
                                ' OR ' + KeyboardControlMethod.DEFAULT_MAPPED_B_BUTTON + 
                                ' TO START', 
                                _x, _y, 
                                SpriteFont.H_ALIGN_CENTER); 
        }        
        _y += SpriteFont.CHAR_HEIGHT + 2;
        this.numPads = GamepadDeviceManager.getNumberOfDevices(this);

        this.noPadGlyphs = this.font.putGlyphs(TitleScreen.PROMPT_NO_GAMEPADS, _x, _y, SpriteFont.H_ALIGN_CENTER);
        this.hasPadGlyphs = this.font.putGlyphs(TitleScreen.PROMPT_HAS_GAMEPADS + this.numPads.toString(), _x, _y, SpriteFont.H_ALIGN_CENTER);

        if (this.numPads > 0) {
            this.font.setVisible(this.noPadGlyphs, false);
        } else {
            this.font.setVisible(this.hasPadGlyphs, false);            
        }

        _y += SpriteFont.CHAR_HEIGHT + 2;

        return _y;
    }

    preload() {
        super.preload();
        this.load.spritesheet('hudfont', 'assets/HudFont.png', {
            frameWidth: 8,
            frameHeight: 8
          });
        this.load.image('title_screen', 'assets/TitleScreen.png');
        this.load.image('full_screen_icon', 'assets/FullScreenIcon.png');
    }

    update(time: number, delta: number): void {
        super.update(time, delta);        
        let numPads = this.ctrlMethods.length - 1;
        if (numPads != this.numPads) {
            this.numPads = numPads;
            if (numPads > 0) {
                this.font.changeGlyph(this.hasPadGlyphs[this.hasPadGlyphs.length - 1], this.numPads.toString());
                this.font.setVisible(this.hasPadGlyphs, true);
                this.font.setVisible(this.noPadGlyphs, false);
            } else {
                this.font.setVisible(this.hasPadGlyphs, false);
                this.font.setVisible(this.noPadGlyphs, true);
            }
        }
        if (this.anyInputHit('a') || this.anyInputHit('b')) {
            this._openMenu();
        }
    }
}
