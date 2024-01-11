// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Ninja from "../entities/Ninja";
import { Globals } from "../Globals";
import Hud from "./Hud";
import SpriteFont from "./SpriteFont";

export default class PlayerHud extends Hud {
    private static readonly MARGIN_WIDTH = 4;
    private static readonly BOX_WIDTH = (2 * PlayerHud.MARGIN_WIDTH) + (SpriteFont.CHAR_WIDTH * 5);
    private static readonly BOX_HEIGHT = 72;
    private static readonly HUD_RECTS = [
        /* P1 */
        new Phaser.Geom.Rectangle(PlayerHud.MARGIN_WIDTH, /* LEFT */
                                  PlayerHud.MARGIN_WIDTH, /* TOP */
                                  PlayerHud.BOX_WIDTH, PlayerHud.BOX_HEIGHT),
        /* P2 */
        new Phaser.Geom.Rectangle(Globals.SCREEN_WIDTH - PlayerHud.MARGIN_WIDTH - PlayerHud.BOX_WIDTH, /* LEFT */
                                  PlayerHud.MARGIN_WIDTH, /* TOP */
                                  PlayerHud.BOX_WIDTH, PlayerHud.BOX_HEIGHT),
        /* P3 */
        new Phaser.Geom.Rectangle(PlayerHud.MARGIN_WIDTH, /* LEFT */
                                  Globals.SCREEN_HEIGHT - PlayerHud.BOX_HEIGHT - PlayerHud.MARGIN_WIDTH, /* TOP */
                                  PlayerHud.BOX_WIDTH, PlayerHud.BOX_HEIGHT),
        /* P4 */
        new Phaser.Geom.Rectangle(Globals.SCREEN_WIDTH - PlayerHud.MARGIN_WIDTH - PlayerHud.BOX_WIDTH, /* LEFT */
                                  Globals.SCREEN_HEIGHT - PlayerHud.BOX_HEIGHT - PlayerHud.MARGIN_WIDTH, /* TOP */
                                  PlayerHud.BOX_WIDTH, PlayerHud.BOX_HEIGHT)
    ];

    player: Ninja;
    playerIndex: integer; /**< 0 for P1, 1 for P2 etc */    
    lifeBarGlyphs: Phaser.GameObjects.Sprite[];    
    livesGlyph: Phaser.GameObjects.Sprite;    
    cache: any; // Holds the latest displayed values
    manaGlyphs: Phaser.GameObjects.Sprite[];
    maxManaGlyphs: Phaser.GameObjects.Sprite[];
    hudRects: Phaser.Geom.Rectangle[];
    currentPowerUp: Phaser.GameObjects.Sprite;
    // TODO For BOSS/ENEMY, use a different Hud subclass

    
    /**
     * 
     * @param scene 
     * @param player 
     */
    constructor(scene: GameSegment, player: Ninja, playerIndex: integer) {
        // TODO Handle different players (1-2/4?) with different colors
        super(scene, PlayerHud.HUD_RECTS[playerIndex]); // TODO Adjust height
        this.player = player;
        this.playerIndex = playerIndex; 
        this.cache = {};
        this.lifeBarGlyphs = [];
        this.manaGlyphs = [];
        this.maxManaGlyphs = [];
        let offset_y = SpriteFont.CHAR_HEIGHT/2; // margin
        offset_y = this.buildLifeBar(offset_y);        
        offset_y = this.buildManaDisplay(offset_y);        
    }
    
    /**
     * Builds layout for lifebar meter (+lives and player identification)
     * @param offset_y Vertical offset where to display it, relative to the Container.
     * @returns Incremented offset_y value, where a next panel can be placed.
     */
    private buildLifeBar(offset_y: integer) {
        let y = offset_y;
        let hp = this.cache.hp = this.player.getHp();
        let maxHp = this.cache.maxHp = this.player.getMaxHp();
        let lives = this.cache.lives = this.player.getLives();
        let dash: Phaser.GameObjects.Sprite;
        this.container.add(this.font.putGlyph((SpriteFont.CODE_NINJA_PLAYER_1 + this.playerIndex), 12, y));
        this.container.add(this.font.putGlyph(SpriteFont.CODE_X_MULTIPLY, 20, y));
        this.livesGlyph = this.font.putGlyph(lives.toString(), 28, y);
        this.container.add(this.livesGlyph);

        y += SpriteFont.CHAR_HEIGHT;
        y += SpriteFont.CHAR_HEIGHT/2; // additional separator margin
        let lbox = SpriteFont.CHAR_WIDTH / 2; //SpriteFont.CHAR_WIDTH * 5; // lifebar offset x
        let lboy = SpriteFont.CHAR_HEIGHT / 2; // lifebar offset y
        for (let i = 1; i <= maxHp; i++) {
            dash = this.font.putGlyph(i > hp ? 0 : 1, lbox, lboy);
            this.lifeBarGlyphs.push(dash);
            this.container.add(dash);
            lboy += 4;
        }
        return y;
    }

    /**
     * 
     * @param offset_y 
     */
    private buildManaDisplay(offset_y: integer): integer {
        let y = offset_y;
        let mana = this.cache.mana = this.player.getMana();
        let maxMana = this.cache.maxMana = this.player.getMaxMana();
        let currentPower = this.cache.currentPower = this.player.currentPower;
        this.container.add(this.font.putGlyph(SpriteFont.CODE_BOX_TOP_LEFT, 16, y));
        this.container.add(this.font.putGlyph(SpriteFont.CODE_BOX_TOP_RIGHT, 32, y));
        y += SpriteFont.CHAR_HEIGHT;
        this.container.add(this.font.putGlyph(SpriteFont.CODE_BOX_BOTTOM_LEFT, 16, y));
        this.container.add(this.font.putGlyph(SpriteFont.CODE_BOX_BOTTOM_RIGHT, 32, y));
        y += SpriteFont.CHAR_HEIGHT / 2; // some spacing
        y += SpriteFont.CHAR_HEIGHT;

        this.currentPowerUp = this.scene.add.sprite(20, 16, 'power_up');
        this.currentPowerUp.setFrame(currentPower);
        this.currentPowerUp.setOrigin(0, 0);
        this.container.add(this.currentPowerUp);

        this.container.add(this.font.putGlyph(SpriteFont.CODE_MAGIC, 12, y));
        this.manaGlyphs = this.font.putGlyphs(mana.toString().padStart(3, '0'), 20, y); // force 3 digits
        this.container.add(this.manaGlyphs);
        y += SpriteFont.CHAR_HEIGHT;
        this.container.add(this.font.putGlyph('/', 12, y));
        this.maxManaGlyphs = this.font.putGlyphs(maxMana.toString().padStart(3, '0'), 20, y);
        this.container.add(this.maxManaGlyphs);
        y += SpriteFont.CHAR_HEIGHT;
        y += SpriteFont.CHAR_HEIGHT / 2; // last spacing
        return y;
    }

    /**
     * 
     */
    update() {
        this.updateLifeBar();
        this.updateManaDisplay();
    }

    /**
     * 
     * @returns 
     */
    private updateLifeBar() {
        let hp = this.player.getHp();
        let maxHp = this.player.getMaxHp();
        let lives = this.player.getLives();
        if (hp == this.cache.hp && maxHp == this.cache.maxHp && lives == this.cache.lives) return; // Nothing changed from previous frame
        this.cache.hp = hp;
        this.cache.maxHp = maxHp;
        this.cache.lives = lives;
        // TODO IMPLEMENT
        for (let i = 0; i < maxHp; i++) {
            this.font.changeGlyph(this.lifeBarGlyphs[i], i >= hp ? 0 : 1);
        }
        this.font.changeGlyph(this.livesGlyph, lives.toString());
    }

    private updateManaDisplay() {
        let mana = this.player.getMana();
        let maxMana = this.player.getMaxMana();
        let currentPower = this.player.currentPower;
        if (mana != this.cache.mana) {
            this.font.changeGlyphs(this.manaGlyphs, mana.toString().padStart(3, '0'));
            this.cache.mana = mana;
        }
        if (maxMana != this.cache.maxMana) {
            this.font.changeGlyphs(this.maxManaGlyphs, maxMana.toString().padStart(3, '0'));
            this.cache.maxMana = maxMana;
        }
        if (currentPower != this.cache.currentPower) {
            this.currentPowerUp.setFrame(currentPower);
            this.cache.currentPower = currentPower;
        }
    }
    

}