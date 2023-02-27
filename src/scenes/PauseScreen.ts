// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import BaseScene from "./BaseScene";

export default class PauseScreen extends BaseScene {
    pausedScene?: Phaser.Scene;
    
    constructor() {
        super('PauseScreen');
    }

    create(ctx?: any): void {
        super.create(ctx);
        this.pausedScene = ctx.pausedScene;
    }

    preload(): void {
        
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        if (this.anyInputHit('start')) {
            this.pausedScene.scene.resume();
            this.scene.stop();
        }
    }

}