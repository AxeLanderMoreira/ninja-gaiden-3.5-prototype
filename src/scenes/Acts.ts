// Copyright (c) 2023 Alexandre Moreira
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export class Acts {
    // TODO Move to a json file
    /**
     * Pre-defined sequence of Acts, and sub-levels on each Act
     * TODO: This will also be used to define cutscenes
     * 
     * Bi-dimensional array where the first level is the sequence of Acts,
     * and the second level is the sequence of segments (or cutscenes) in the Act.
     * 
     * Properties for each part:
     * type: string; values: 'GameSegment' (or 'Cutscene').
     * key: string; unique Scene key.
     * checkpoint: boolean; when all players are KO'ed, game will continue from
     * the last segment where checkpoint==true;.
     */
    private static readonly Config = [
        {   /* Act I */
            timeLimit: 250, /* Time limit in seconds */
            parts: [
                {type: 'GameSegment', key: 'Scene21Desert', checkpoint: true},
                {type: 'GameSegment', key: 'Scene22A', checkpoint: true},
                {type: 'GameSegment', key: 'Scene22B', checkpoint: true},
            ]
        }            
        /* Act II, Act III, ending cutscene... */
    ]

    private static currAct: integer = 0;
    private static currSegment: integer = 0;

    /**
     * Gets time limit for the current Act, in milliseconds
     */
    public static getTimeLimit(): number {
        return this.Config[this.currAct].timeLimit * 1000;
    }

    /**
     * 
     */
    public static nextScene(): any {
        this.currSegment++;
        let segmentList = this.Config[this.currAct].parts;
        if (this.currSegment > segmentList.length) {
            return undefined;
        }
        return segmentList[this.currSegment];
    }

    /**
     * 
     */
    public static resetGame() {
        this.currAct = 0;
        this.currSegment = -1;
    }

}