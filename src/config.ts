// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Phaser from 'phaser';
import { Globals } from './Globals';

export default {
  type: Phaser.AUTO,
  //type: Phaser.CANVAS,
  parent: 'game',
  backgroundColor: '#000000',
  scale: {
    width: Globals.SCREEN_WIDTH,
    height: Globals.SCREEN_HEIGHT,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    gamepad: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y : Globals.GRAVITY},
      debug: false
    }
  },
  render: {
    pixelArt: true
},
};
