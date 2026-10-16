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

## Install
Manifest URL: `https://github.com/Yagoks/theia-tweaks/releases/latest/download/module.json`
