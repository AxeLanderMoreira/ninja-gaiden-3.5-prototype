// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export default abstract class ControlMethod {    
    /**
     * Checks if a D-PAD or action button is being helddown.
     * @param btn May be 'a', 'b', 'up', 'down', 'left', 'right'
     * @returns true if the button in question is being pressed (that is,
     * regardless of its state in the immediately previous frame).
     */
    abstract held(btn: string): boolean;

    /**
     * Checks if a D-PAD or action button has just been pressed.
     * @param btn May be 'a', 'b', 'up', 'down', 'left', 'right'
     * @returns true if the button in question has just been pressed (that is,
     * it was not pressed in the immediately previous frame).
     */
    abstract hit(btn: string): boolean;

    /**
     * Whenever a Scene restarts or changes to another, the ControlMethod needs 
     * to be notified, as it may rely on the Scene, and re-bind its event 
     * handlers. In such case, this method has to be redefined in the subclass.
     * @param scene 
     */
    resetScene(scene: Phaser.Scene) {
        // Empty base implementation
    }

    /**
     * Some control methods may need to actively poll for some of its status
     * at each frame; that is done via this update() function.
     */
    abstract update(): void;
}