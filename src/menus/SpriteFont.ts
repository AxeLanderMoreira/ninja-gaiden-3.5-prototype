// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Scene } from "phaser";

export default class SpriteFont {
    
    /* FONT "METRICS" */
    public static readonly CHAR_WIDTH = 8;
    public static readonly CHAR_HEIGHT = 8;

    /* ALIGNMENT CONSTANTS */
    public static readonly H_ALIGN_LEFT = 0;
    public static readonly H_ALIGN_CENTER = 1;
    public static readonly H_ALIGN_RIGHT = 2;

    /* SPECIAL CHARACTER CODES */
    public static readonly CODE_BOX_TOP_LEFT = 0x80;
    public static readonly CODE_BOX_TOP_RIGHT = 0x81;
    public static readonly CODE_BOX_BOTTOM_LEFT = 0x82;
    public static readonly CODE_BOX_BOTTOM_RIGHT = 0x83;
    public static readonly CODE_MAGIC = 0x84; 
    public static readonly CODE_ARROW_RIGHT = 0x85;
    public static readonly CODE_ARROW_LEFT = 0x86;
    public static readonly CODE_NINJA_PLAYER_1 = 0x87;
    public static readonly CODE_NINJA_PLAYER_2 = 0x88;
    public static readonly CODE_NINJA_PLAYER_3 = 0x89;
    public static readonly CODE_NINJA_PLAYER_4 = 0x8A;
    public static readonly CODE_X_MULTIPLY = 0x8B;
    public static readonly CODE_COPYRIGHT = 0x9A;

    scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Create and position a glyph using this SpriteFont
     * @param charcode String with char or numeric char code
     * @param x horizontal position
     * @param y vertical position
     * @param halign horizontal-alignment:
     *               0 or undefined: left
     *               1: center
     *               2: right
     * @returns The Sprite, already positioned
     */
    putGlyph(charcode: integer | string, x: integer, y: integer): Phaser.GameObjects.Sprite {
        let code : integer = 0;
        let glyph : Phaser.GameObjects.Sprite
        if (typeof charcode === 'string') {
            code = charcode.charCodeAt(0);
        } else {
            code = charcode;
        }        
        glyph = this.scene.add.sprite(x, y, 'hudfont');
        glyph.setFrame(code);  
        glyph.setOrigin(0, 0);
        return glyph;
    }

    /**
     * Create and position a string of glyphs using this SpriteFont     
     * 
     * TODO Support vertical orientation
     * @param label String to write
     * @param x 
     * @param y 
     * @param halign horizontal-alignment:
     *               0 or undefined: left
     *               1: center
     *               2: right
     * @returns 
     */
    putGlyphs(label: string, x: integer, y: integer, halign?: integer, vertical?: boolean): Phaser.GameObjects.Sprite [] {
        let glyphs: Phaser.GameObjects.Sprite[] = [];
        let _x:integer = x;
        let _y:integer = y;        
        if (halign == SpriteFont.H_ALIGN_CENTER) {
            _x -= (label.length * SpriteFont.CHAR_WIDTH) / 2;
        } else if (halign == SpriteFont.H_ALIGN_RIGHT) {
            _x -= label.length * SpriteFont.CHAR_WIDTH;
        }
        for (let i = 0; i < label.length; i++) {
            glyphs.push(this.putGlyph(label[i], _x, _y));
            if (!vertical) {
                _x += SpriteFont.CHAR_WIDTH;
            } else {
                _y += SpriteFont.CHAR_HEIGHT;
            }
        }
        return glyphs;
    }    

    /**
     * Changes the contents of a glyph "in-place".
     * 
     * @param glyph 
     * @param charcode 
     */
    changeGlyph(glyph: Phaser.GameObjects.Sprite, charcode: integer | string) {
        let code : integer = 0;
        if (typeof charcode === 'string') {
            code = charcode.charCodeAt(0);
        } else {
            code = charcode;
        }
        glyph.setFrame(code);
    }

    /**
     * Changes the content of a string (sequence of glyphs) "in-place"
     * Attention: length of original string must be at least equal to 
     * the new string
     */
    changeGlyphs(glyphs: Phaser.GameObjects.Sprite[], label: string) {
        let len = Math.min(glyphs.length, label.length);
        glyphs.forEach((g, i) => {
            this.changeGlyph(g, label[i]);
        });
    }

    setVisible(glyphs: Phaser.GameObjects.Sprite[], on: boolean) {
        glyphs.forEach((g) => {
            g.setVisible(on);
        });
    }

}