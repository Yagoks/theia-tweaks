# Theia Tweaks

Small interface tweaks for the Theia worlds (Foundry VTT v13, dnd5e 5.x).

## Hide the "use" card of multi-beam spells
Chris's Premades casts Eldritch Blast, Scorching Ray and similar spells in parts:
- a **"use" card**, which casts the spell, spends the action and picks the beams;
- an **attack card for each beam**.

The "use" card looks like a repeated attack, so this module hides it from the chat. The card still exists, because Chris's
Premades needs it; it is just not shown.

Settings:
- **Hide the "use" card of multi-beam spells:** on by default.
- **Multi-beam spells:** the Chris's Premades identifiers of the spells to treat this way. Default:
  `eldritchBlast, scorchingRay`.

Other Chris's Premades spells (Hex, Spirit Guardians…) keep their main card.

## Don't animate Midi's dice twice
Midi-QOL shows the 3D dice of attacks and damage itself. Dice So Nice then animated the same dice again when the item card
received the rolls, so a Starry Wisp showed its d20 and its damage twice. This skips that second throw on Midi's item
cards; the rolls don't change. Setting: **Don't animate Midi's dice twice** (on by default).

## "Can't benefit from Invisible"
An active effect flagged `flags.theia-tweaks.noInvisible` (Starry Wisp) keeps its creature from being invisible:
- **When it lands:** the Invisible condition is removed.
- **While it lasts:** Invisible can't be applied, and a notice says why.

## Anchor Chris's Premades self templates

Chris's Premades places some cones and lines with range Self itself (Breath of the Dragon, for example), so Midi-QOL's **Constrain Template Placement** doesn't anchor them. This tweak gives those previews Midi's anchor, so the template stays on the caster's token border and the mouse only turns it.

If the player cancels the template (right click), the use stops before the damage is rolled: no dice and no card in the chat.

- **Anchor Chris's Premades self templates to the caster:** on by default. Needs Midi-QOL.

## Clear others' effects from dead creatures

When an NPC drops to 0 hit points or gets the Dead condition, the temporary effects other creatures put on it are removed, along with their animations (for example Ray of Frost's Reduced Movement). Its own effects and conditions such as Dead, Unconscious and Prone stay. Player characters at 0 hit points keep everything, since they aren't dead.

- **Clear others' effects from dead creatures:** on by default.

## Offer each reaction once per attack

Without a reaction condition, Midi-QOL offered reactions such as Shield and Feather Fall at every step of an attack: before the roll, when attacked, when hit and before the damage. They are now offered only when the attack hits, with the roll already on screen, and never twice for the same attack. Reactions with their own condition still follow it.

- **Offer each reaction once per attack:** on by default.

## Missing animations

Some modules ask Sequencer for animations from packs this world doesn't have. Theia Tweaks swaps them for an animation that exists, so they play instead of failing:

- Gambit's Premades Counterspell: the beam `animated-spell-effects-cartoon.energy.beam.01` becomes `jb2a.energy_strands.complete.dark_purple02.01` on the creature whose spell is countered.
- Its success message said "you cast undefined"; it now names the spell.
- Gambit's Premades' Identify window lays out each item on one row (image, name and button), a little wider.

## Somatic spell failure (Slow)

An effect can set `flags.theia-tweaks.somaticFailure` to a percentage (Slow's "Slowed" effect sets 25). When that creature casts a spell with a Somatic component, a d100 is rolled after the casting (the slot and the action are already spent) and before any attack or saving throw: at or under the number the spell fails. Above it, the spell goes on normally. Needs Midi-QOL.

## Install
Manifest URL: `https://github.com/Yagoks/theia-tweaks/releases/latest/download/module.json`
