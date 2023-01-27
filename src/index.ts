// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Phaser from 'phaser';
import config from './config';
import GameOver from './scenes/GameOver';
import MenuScreen from './scenes/MenuScreen';
import Scene21Desert from './scenes/Scene21Desert';
import TitleScreen from './scenes/TitleScreen';


new Phaser.Game(
  Object.assign(config, {
    scene: [TitleScreen, MenuScreen, Scene21Desert, GameOver]
  })
);
