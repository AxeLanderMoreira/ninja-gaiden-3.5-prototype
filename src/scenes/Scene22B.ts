// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import GameSegment from "./GameSegment";
import Scene22Base from "./Scene22Base";


export default class Scene22B extends Scene22Base {
    constructor() {
        super('Scene22B', 'assets/tiles/ng3/2-2/Tilemap2-2B.json', 'map2-2B');
    }


  /**
   * 
   */
  getPlayerSpawnPosition(i: integer): Phaser.Math.Vector2 {
    let _x = 48 + (i * GameSegment.PLAYER_SPAWN_H_SPACING);
    let _y = 100;      
    return new Phaser.Math.Vector2(_x, _y);
  }
}