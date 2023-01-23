// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/**
 * Class that represents an instance of a Quicksand, rendered as a TileSprite with a
 * repeating Texture.
 * 
 * Each instance is an object placed at some coordinate in the World's floor, and will
 * drag the player down as he 
 * 
 * (Se pensarmos na Scene 6.2, podemos ter algo como uma propriedade de 'quicksand' ativa,
 * que faz o jogador ser puxado para baixo enquanto está standing ou running)...
 */
export default class Quicksand {
    tileSprite: Phaser.GameObjects.TileSprite;

    constructor(scene: Phaser.Scene, textureKey: string, x: number, y: number, w: number, h: number) {
        this.tileSprite = scene.add.tileSprite(x, y, w, h, textureKey);
        this.tileSprite.setOrigin(0, 0);
    }

    // update... check collision against Ninja and put him in/out of the state
    // a Ninja will be dragged onto quicksand stage and attached to a Quicksand
    // instance that he is in contact with.
    // What if we use the same logic as in Walls?
    // Tenho que fazer um tratamento de overlap
    // this.physics.add.overlap...
    // Se é nesta classe que vai ficar o controle de colisão, eu vou ter que 
    // acrescentar uma função GameSegment.getPlayers() que retorna o array de
    // Ninjas.
}