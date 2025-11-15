import { seq, runWave, runRounds } from "./choreoDSL";
import type { PersonControls } from "./animationHelper";

/// Wave left->right then right->left.
export const programWave = (stagger = 160) => ({
    /// Run program over actors.
    run: (actors: PersonControls[]) => runWave(actors, seq().waveHand(600), stagger),
});

/// Jump burst followed by celebrate.
export const programJumpCheer = () => ({
    /// Run program over actors.
    run: (actors: PersonControls[]) =>
        runRounds(
            actors,
            [seq().jump(300).celebrate(500), seq().danceA(400), seq().rock(400)],
            80
        ),
});

/// Subtle idle rocking sequence.
export const programIdle = () => seq().rock(500).wait(300).rock(500).wait(300);
