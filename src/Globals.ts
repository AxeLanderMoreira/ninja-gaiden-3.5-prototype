// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export class Globals {
    /**
     * Screen dimensions
     */
    static readonly SCREEN_WIDTH = 384;
    static readonly SCREEN_HEIGHT = 216;

    /**
     * Z-ordering for every layer
     */
    static readonly BG_DEPTH = 0;
    static readonly NINJA_DEPTH = 200;
    static readonly POWER_UP_DEPTH = 250;
    static readonly PLATFORM_DEPTH = 300;
    static readonly ENEMY_DEPTH = 400; // previous value was 100, but hovering enemies must be on top of platforms
    static readonly HUD_DEPTH = 1000;
    static readonly VIRTUAL_CONTROLS_DEPTH = 2000;

    /**
     * Physics
     */
    static readonly GRAVITY = 600;
    static readonly TARGET_FPS = 60;

    /**
     * Debug options
     */
    static readonly DEBUG_FPS = true;
    
}
