// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Phaser from 'phaser';
import config from './config';
import GameOver from './scenes/GameOver';
import MenuScreen from './scenes/MenuScreen';
import PauseScreen from './scenes/PauseScreen';
import Scene21Desert from './scenes/Scene21Desert';
import Scene22A from './scenes/Scene22A';
import Scene22B from './scenes/Scene22B';
import TitleScreen from './scenes/TitleScreen';


new Phaser.Game(
  Object.assign(config, {
    scene: [TitleScreen, MenuScreen, Scene21Desert, Scene22A, Scene22B, PauseScreen, GameOver]
  })
);
