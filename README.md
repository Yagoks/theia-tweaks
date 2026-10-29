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

Reactions that Gambit's Premades asks for itself, such as Counterspell (reaction condition `false`), are never offered by Midi-QOL. Counterspell is offered only when a spell is cast.

- **Offer each reaction once per attack:** on by default.

## Missing animations

Some modules ask Sequencer for animations from packs this world doesn't have. Theia Tweaks swaps them for an animation that exists, so they play instead of failing:

- Gambit's Premades Counterspell: the beam `animated-spell-effects-cartoon.energy.beam.01` becomes `jb2a.energy_strands.complete.dark_purple02.01` on the creature whose spell is countered.
- Its success message said "you cast undefined"; it now names the spell.
- Gambit's Premades' Identify window lays out each item on one row (image, name and button), a little wider.

## Somatic spell failure (Slow)

An effect can set `flags.theia-tweaks.somaticFailure` to a percentage (Slow's "Slowed" effect sets 25). When that creature casts a spell with a Somatic component, a d100 is rolled after the casting (the slot and the action are already spent) and before any attack or saving throw: at or under the number the spell fails. Above it, the spell goes on normally. Needs Midi-QOL.

## Remove duplicate concentration

Midi-QOL and the system sometimes create two "Concentrating" effects for a single casting. The active GM keeps the first one, moves the effects tied to the second (on the targets) onto it, and removes the second.

- **Remove duplicate concentration:** on by default.

## HP alerts

Give an actor the flag `flags.theia-tweaks.hpAlert` (a number, or `{ value, message }`) and the GM is warned — a notification, a GM-only chat message and a sound — when its hit points drop to that value or below. It fires once each time the HP crosses the line.

Used on the Perpetual Mechanical Array at 105 HP (Defensive Array).

## Damage macros

An effect with the change `flags.theia-tweaks.onDamageMacro` (the name of a world macro) runs that macro right before the damage against the creature is applied, on the client running the attack. The macro gets `{ theiaPass: "onDamage", token, actor, ditem, workflow, effect }` as `args[0]` and may change `ditem`. Used by `Theia_Deflect_Attacks` (the monk's Deflect Attacks, which also counts temporary hit points correctly).

## Initiative macros

An item with the flag `flags.theia-tweaks.onInitiativeMacro` (the name of a world macro) runs that macro, on the active GM's client, when its owner's initiative is rolled (sheet, combat tracker or Epic Rolls). The macro gets `{ theiaPass: "onInitiative", actor, item, combatants }` as `args[0]`. Used by `Theia_Uncanny_Metabolism` (the monk is asked whether to use Uncanny Metabolism: heal and regain all Focus Points).

Damage and initiative macros written by a GM also run for players who may not execute script macros.

## Summon macros

An item with the flag `flags.theia-tweaks.onSummonMacro` (the name of a world macro) runs that macro right after one of its activities summons creatures, on the client that summoned them. The macro gets `{ theiaPass: "onSummon", actor, item, activity, profile, tokens, options }` as `args[0]`. Used by `Theia_Greater_Familiar` (the Familiarist's Greater Familiar: Growing Form and Arcane Amalgamation).

## Move-away macros

An item with the flag `flags.theia-tweaks.onMoveAwayMacro` (the name of a world macro) runs that macro, on the active GM's client, when another token ends a move farther from its owner's token than it started, while a combat is running and within the item's range. The macro gets `{ theiaPass: "onMoveAway", actor, item, token, mover, before, after }` as `args[0]` (`before` and `after` are the distances). Used by `Theia_Vyke`: when a creature marked by his Brand moves away, the GM is asked whether Vyke uses the reaction "Not Again.".

## Dismiss summons at 0 HP

When a token whose actor has the flag `flags.theia-tweaks.dismissAtZero` drops to 0 Hit Points, the active GM is asked whether to remove it, as Chris's Premades does for its summons. Used by the Familiarist's Greater Familiar.

## Initiative reroll

An effect that sets `flags.theia-tweaks.initiativeReroll` to a number (Hypervigilance sets 9) rerolls the initiative d20 once when it shows that number or lower; the new roll stays.

## Scheduled lights

An ambient light with the flag `flags.theia-tweaks.schedule` = `{ on: 19, off: 23 }` is lit only between those hours of the world clock (as SmallTime shows it) and hidden the rest of the day. The active GM updates the lights of the viewed and the active scene whenever the time changes.

## Gift scenes (Stylish Relationship Tracker)

An NPC can hold the flag `flags.theia-tweaks.giftScenes` = `{ "<item name, lower case>": { title, recollection, quote, image } }`. When one of those items is given as a Gift, the active GM fills the gift event the tracker logs with that scene, so the Event Log shows it as a scene recall. With no image, it uses the relationship portrait.

## Hit points on level up

Theia's rule: take the average, or roll; one reroll is allowed and the second result stays. In the level-up window, after the first roll the average can no longer be taken, and after the second roll the roll button is locked. Players can't type a hit point value by hand; the GM still can.

## Install
Manifest URL: `https://github.com/Yagoks/theia-tweaks/releases/latest/download/module.json`
