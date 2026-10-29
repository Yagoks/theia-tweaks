// Theia Tweaks — small interface tweaks.

const MODULE_ID = "theia-tweaks";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "hideBeamUseCard", {
    name: "Hide the \"use\" card of multi-beam spells",
    hint: "Chris's Premades casts Eldritch Blast, Scorching Ray and similar spells with a \"use\" card and then one attack card per beam. Hide the \"use\" card so the chat shows only the beams. The card still exists (Chris's Premades needs it); it is just not shown.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => ui.chat?.render?.()
  });
  game.settings.register(MODULE_ID, "noDoubleDice", {
    name: "Don't animate Midi's dice twice",
    hint: "Midi-QOL shows the 3D dice of attacks and damage itself; Dice So Nice then animated the same dice again when the card received the rolls. Skip that second animation on Midi's item cards. The rolls don't change.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(MODULE_ID, "beamSpells", {
    name: "Multi-beam spells",
    hint: "Chris's Premades identifiers of the spells whose \"use\" card is hidden, comma-separated.",
    scope: "world",
    config: true,
    type: String,
    default: "eldritchBlast, scorchingRay",
    onChange: () => ui.chat?.render?.()
  });
  game.settings.register(MODULE_ID, "clearEffectsOnDeath", {
    name: "Clear others' effects from dead creatures",
    hint: "When an NPC drops to 0 hit points or gets the Dead condition, remove the temporary effects other creatures put on it (Ray of Frost's Reduced Movement, for example), along with their animations. Conditions such as Dead, Unconscious and Prone stay.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(MODULE_ID, "reactionOnce", {
    name: "Offer each reaction once per attack",
    hint: "Midi-QOL offered reactions without a reaction condition (Shield, Feather Fall…) at every step of an attack: before the roll, when attacked, when hit and before the damage. Offer them only when the attack hits, and never twice for the same attack.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(MODULE_ID, "dedupeConcentration", {
    name: "Remove duplicate concentration",
    hint: "Midi-QOL and the system sometimes create two \"Concentrating\" effects for one casting. Keep the first, move the effects tied to the second onto it, and remove the second.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(MODULE_ID, "anchorSelfTemplates", {
    name: "Anchor Chris's Premades self templates to the caster",
    hint: "Chris's Premades places some cones and lines itself (Breath of the Dragon, for example), so Midi-QOL's \"Constrain Template Placement\" doesn't anchor them. While placing a cone or line with range Self, keep it on the edge of the caster's token, the same way Midi-QOL does; the mouse only turns it. Needs Midi-QOL.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

/**
 * The usage card of a listed Chris's Premades multi-beam spell (Eldritch Blast, Scorching Ray…): the casting
 * ("use") activity, which has no roll; the beams are separate activities listed in flags.chris-premades.spellActivities.
 */
function isBeamUseCard(message) {
  const ref = message.flags?.dnd5e?.activity;
  if (!ref?.uuid && !ref?.id) return false;
  const activity = ref.uuid ? fromUuidSync(ref.uuid, { strict: false }) : null;
  const item = activity?.item ?? (message.flags?.dnd5e?.item?.uuid ? fromUuidSync(message.flags.dnd5e.item.uuid, { strict: false }) : null);
  const cpr = item?.flags?.["chris-premades"];
  const listed = String(game.settings.get(MODULE_ID, "beamSpells")).split(",").map(x => x.trim()).filter(Boolean);
  if (!listed.includes(cpr?.info?.identifier)) return false;
  if (activity && activity.type !== "utility") return false;
  const beams = cpr?.spellActivities;
  if (!Array.isArray(beams) || !beams.length) return false;
  const beamIds = new Set(beams.map(key => cpr.activityIdentifiers?.[key] ?? key));
  const id = activity?.id ?? ref.id;
  return !beamIds.has(id) && !(message.rolls?.length);
}

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!game.settings.get(MODULE_ID, "hideBeamUseCard")) return;
  if (isBeamUseCard(message)) html.style.display = "none";
});

// Dice So Nice re-animates the rolls of Midi's item card, after Midi already showed them: skip that second throw.
Hooks.on("diceSoNiceMessageProcessed", (messageId, interception) => {
  if (!game.settings.get(MODULE_ID, "noDoubleDice")) return;
  if (!game.settings.get("midi-qol", "ConfigSettings")?.showDSN) return;
  const message = game.messages.get(messageId);
  const usage = message?.type === "usage" || message?.flags?.dnd5e?.messageType === "usage";
  if (!message?.flags?.["midi-qol"] || !usage) return;
  interception.willTrigger3DRoll = false;
});

/* -------------------------------------------- */
/*  "Can't benefit from Invisible"              */
/* -------------------------------------------- */

// An effect flagged flags.theia-tweaks.noInvisible (e.g. Starry Wisp) keeps its creature from being invisible:
// the condition is removed when the effect lands, and can't be applied while the effect lasts.
const isInvisibleEffect = data => [...(data?.statuses ?? [])].includes("invisible");
const blocksInvisible = actor => actor?.effects?.some(e => e.flags?.[MODULE_ID]?.noInvisible && !e.disabled);

Hooks.on("preCreateActiveEffect", (effect, data) => {
  const actor = effect.parent;
  if (!(actor instanceof Actor) || !isInvisibleEffect(data) || !blocksInvisible(actor)) return;
  ui.notifications.info(`${actor.name} não pode ficar invisível (${actor.effects.find(e => e.flags?.[MODULE_ID]?.noInvisible)?.name}).`);
  return false;
});

Hooks.on("createActiveEffect", async effect => {
  if (!effect.flags?.[MODULE_ID]?.noInvisible || !game.users.activeGM?.isSelf) return;
  const actor = effect.parent;
  if (!(actor instanceof Actor)) return;
  const invisible = actor.effects.filter(e => e.statuses.has("invisible")).map(e => e.id);
  if (invisible.length) await actor.deleteEmbeddedDocuments("ActiveEffect", invisible);
});

/**
 * Chris's Premades places some self cones and lines with its own dnd5e template preview (Breath of the Dragon…), which
 * Midi-QOL's "Constrain Template Placement" doesn't anchor. Give those previews Midi's anchor flags, so the template stays
 * on the caster's token border and the mouse only turns it.
 */
function anchorData(document) {
  if (!["cone", "ray"].includes(document.t)) return null;
  if (document.flags?.["midi-qol"]?.anchorToToken) return null;
  const origin = document.flags?.dnd5e?.origin ?? document.flags?.["midi-qol"]?.originUuid;
  const item = origin ? fromUuidSync(origin, { strict: false }) : null;
  if (!item?.flags?.["chris-premades"] || !item.actor) return null;
  const self = (item.system.range?.units === "self") || item.system.activities?.some(a => a.range?.units === "self");
  if (!self) return null;
  const tokens = item.actor.getActiveTokens(true).filter(t => t.document.parent === canvas.scene);
  const token = tokens.find(t => t.controlled) ?? tokens[0];
  return token ? { anchorToToken: true, sourceTokenUuid: token.document.uuid } : null;
}

/** When the player cancels one of those previews (right click), the use stops before Midi rolls the damage. */
const cancelledPreviews = new Map();
const itemKey = item => (item ? `${item.actor?.uuid}.${item.id}` : null);

Hooks.once("ready", () => {
  const AbilityTemplate = game.dnd5e?.canvas?.AbilityTemplate;
  if (!AbilityTemplate || !game.modules.get("midi-qol")?.active) return;
  const drawPreview = AbilityTemplate.prototype.drawPreview;
  AbilityTemplate.prototype.drawPreview = function(...args) {
    if (!game.settings.get(MODULE_ID, "anchorSelfTemplates")) return drawPreview.apply(this, args);
    const data = anchorData(this.document);
    if (data) this.document.updateSource({ flags: { "midi-qol": data } });
    const result = drawPreview.apply(this, args);
    if (data) {
      const key = itemKey(fromUuidSync(this.document.flags.dnd5e?.origin ?? this.document.flags["midi-qol"].originUuid, { strict: false }));
      const cancel = () => cancelledPreviews.set(key, Date.now());
      Promise.resolve(result).then(r => { if (!r || (Array.isArray(r) && !r.length)) cancel(); }, cancel);
    }
    return result;
  };
});

Hooks.on("midi-qol.preDamageRoll", workflow => {
  const key = itemKey(workflow?.item);
  const at = cancelledPreviews.get(key);
  if (!at) return true;
  cancelledPreviews.delete(key);
  if ((Date.now() - at > 60000) || workflow.templateUuid) return true;
  ui.notifications.info(`${workflow.item.name}: cancelado.`);
  const cardId = workflow.itemCardId;
  setTimeout(async () => {
    try { await workflow.performState?.(workflow.WorkflowState_Abort); } catch (err) { console.warn(`${MODULE_ID} |`, err); }
    if (cardId) game.messages.get(cardId)?.delete();
  }, 0);
  return false;
});

/* Dead creatures lose the temporary effects others put on them (and the animations that come with those). */
const KEEP_ON_DEATH = ["dead", "unconscious", "prone", "incapacitated", "bleeding"];

function isDead(actor) {
  if (actor.statuses?.has("dead")) return true;
  const hp = actor.system?.attributes?.hp;
  return (actor.type === "npc") && !!hp?.max && (hp.value <= 0);
}

async function clearEffectsOnDeath(actor) {
  if (!game.users.activeGM?.isSelf || !game.settings.get(MODULE_ID, "clearEffectsOnDeath")) return;
  if (!(actor instanceof Actor) || !isDead(actor)) return;
  const ids = actor.effects.filter(effect => {
    if (!effect.isTemporary || KEEP_ON_DEATH.some(s => effect.statuses.has(s))) return false;
    const origin = effect.origin ? fromUuidSync(effect.origin, { strict: false }) : null;
    const source = (origin instanceof Actor) ? origin : (origin?.actor ?? origin?.parent?.actor ?? origin?.parent);
    return (source instanceof Actor) && (source.uuid !== actor.uuid);
  }).map(effect => effect.id);
  if (ids.length) await actor.deleteEmbeddedDocuments("ActiveEffect", ids);
}

Hooks.on("updateActor", (actor, changes) => {
  if (foundry.utils.hasProperty(changes, "system.attributes.hp")) clearEffectsOnDeath(actor);
});
Hooks.on("createActiveEffect", effect => {
  if (effect.statuses.has("dead")) clearEffectsOnDeath(effect.parent);
});

/*
 * Gambit's Premades reactions (Counterspell, Silvery Barbs…) carry the reaction condition "false" because GPS asks for
 * them itself, but Midi still offered them before every attack.
 */
Hooks.on("midi-qol.ReactionFilter", (reactions, options, triggerType, list) => {
  const activityOf = r => {
    if (r instanceof foundry.abstract.DataModel) return r;
    if (r?.activity) return r.activity;
    const uuid = (typeof r === "string") ? r : (r?.uuid ?? r?.itemUuid);
    return uuid ? fromUuidSync(uuid, { strict: false }) : null;
  };
  const gpsOnly = r => String(activityOf(r)?.reactionCondition ?? "").trim() === "false";
  for (let n = reactions.length - 1; n >= 0; n--) if (gpsOnly(reactions[n])) reactions.splice(n, 1);
  if (Array.isArray(list)) for (let n = list.length - 1; n >= 0; n--) if (gpsOnly(list[n])) list.splice(n, 1);
  return reactions.length > 0;
});

/* Reactions without a condition are offered once, when the attack hits (Midi's own default, "isHit"). */
const HIT_TRIGGERS = ["reaction", "reactionhit"];
const offeredReactions = new Map();

Hooks.on("midi-qol.ReactionFilter", (reactions, options, triggerType, list) => {
  if (!game.settings.get(MODULE_ID, "reactionOnce")) return true;
  const workflowId = options?.workflow?.id ?? options?.workflowId;
  // Midi calls the filter twice when the attack hits: first to check (with the workflow), then to prompt (without it).
  const prompting = !options?.workflow;
  const uuidOf = r => r?.uuid ?? r?.activity?.uuid ?? r?.itemUuid ?? r?.item?.uuid;
  const offered = offeredReactions.get(workflowId) ?? new Set();
  const drop = r => {
    const activity = (r instanceof foundry.abstract.DataModel) ? r : (r?.activity ?? null);
    if (activity && !activity.reactionCondition && !HIT_TRIGGERS.includes(triggerType)) return true;
    return offered.has(uuidOf(r));
  };
  const dropped = new Set();
  for (let n = reactions.length - 1; n >= 0; n--) {
    if (!drop(reactions[n])) continue;
    dropped.add(uuidOf(reactions[n]));
    reactions.splice(n, 1);
  }
  // Midi also keeps the activity uuids in a second list.
  if (Array.isArray(list)) {
    for (let n = list.length - 1; n >= 0; n--) if (dropped.has((typeof list[n] === "string") ? list[n] : uuidOf(list[n]))) list.splice(n, 1);
  }
  if (prompting) reactions.forEach(r => offered.add(uuidOf(r)));
  if (workflowId) {
    offeredReactions.set(workflowId, offered);
    // Forget old attacks.
    if (offeredReactions.size > 50) offeredReactions.delete(offeredReactions.keys().next().value);
  }
  return reactions.length > 0;
});

/**
 * Animations that modules ask for from packs this world doesn't have, swapped for one that exists. A beam stretched
 * from one token to another becomes an effect on the token it pointed at.
 */
const REPLACED_ANIMATIONS = {
  // Gambit's Premades Counterspell: dark energy strands on the creature whose spell is countered.
  "animated-spell-effects-cartoon.energy.beam.01": { file: "jb2a.energy_strands.complete.dark_purple02.01", scale: 1.5 }
};

Hooks.once("sequencerReady", () => {
  const play = Sequence.prototype.play;
  Sequence.prototype.play = function(...args) {
    for (const section of this.sections ?? []) {
      const swap = REPLACED_ANIMATIONS[section?._file];
      if (!swap || Sequencer.Database.entryExists(section._file)) continue;
      const target = section._stretchTo?.target ?? section._source;
      section._file = swap.file;
      section._stretchTo = null;
      section._filters = [];
      section._playbackRate = 1;
      if (target) section.atLocation(target);
      section.scaleToObject(swap.scale);
    }
    return play.apply(this, args);
  };
});

/* Gambit's Premades Counterspell's success message expects {itemProperName} but receives itemName ("…you cast undefined…"). */
Hooks.once("ready", () => {
  const messages = game.i18n.translations.GAMBITSPREMADES?.ChatMessages?.Automations?.Spells?.Counterspell;
  if (typeof messages?.CounterspellAutoSuccess === "string") {
    messages.CounterspellAutoSuccess = messages.CounterspellAutoSuccess.replace("{itemProperName}", "{itemName}");
  }
});

/**
 * Somatic spell failure (Slow): a creature with an effect setting `flags.theia-tweaks.somaticFailure` to a percentage
 * rolls a d100 after it casts a spell with a Somatic component (the slot and the action are already spent), before any
 * attack or saving throw. At or under that number the gestures are too slow and the spell fails.
 */
Hooks.on("midi-qol.targetingComplete", async workflow => {
  const item = workflow?.item;
  const actor = workflow?.actor ?? item?.actor;
  if ((item?.type !== "spell") || !item.system.properties?.has("somatic") || !actor) return true;
  const chance = Number(foundry.utils.getProperty(actor, `flags.${MODULE_ID}.somaticFailure`)) || 0;
  if (chance <= 0) return true;
  const roll = await new Roll("1d100").evaluate();
  const failed = roll.total <= chance;
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: failed
      ? `<b>${item.name}</b> falha: os gestos estão lentos demais (d100 ≤ ${chance}).`
      : `<b>${item.name}</b>: os gestos saem a tempo (d100 > ${chance}).`
  });
  return !failed;
});

/* Gambit's Premades' Identify window (DialogV2 "Identify Items Ritually"): the item rows wrapped, with narrow buttons. */
Hooks.once("init", () => {
  const style = document.createElement("style");
  style.id = `${MODULE_ID}-gps-identify`;
  const row = ".application.dialog li.item-list:has(> button.identify-btn)";
  style.textContent = `
    ${row} { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
    ${row} > div { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    ${row} > div img { width: 36px; height: 36px; flex: none; border: 0; }
    ${row} > div span { overflow: hidden; text-overflow: ellipsis; }
    ${row} > button.identify-btn { width: auto !important; flex: none; white-space: nowrap; margin-left: auto !important; padding: 0 10px; }`;
  document.head.appendChild(style);
});
Hooks.on("renderDialogV2", app => {
  if (app.element?.querySelector("li.item-list > button.identify-btn")) app.setPosition({ width: Math.max(app.position.width ?? 0, 420), height: "auto" });
});

/* One casting, one concentration: a second "Concentrating" effect from the same spell is merged into the first. */
Hooks.on("createActiveEffect", effect => {
  if (!effect.statuses?.has("concentrating") || !(effect.parent instanceof Actor)) return;
  if (!game.users.activeGM?.isSelf || !game.settings.get(MODULE_ID, "dedupeConcentration")) return;
  // Wait a moment: the dependents of both effects are linked right after they are created.
  setTimeout(async () => {
    const actor = effect.parent;
    const itemOf = e => e.flags?.dnd5e?.item?.id ?? e.origin;
    const same = actor.effects.filter(e => e.statuses.has("concentrating") && (itemOf(e) === itemOf(effect)))
      .sort((a, b) => (a._stats.createdTime ?? 0) - (b._stats.createdTime ?? 0));
    if (same.length < 2) return;
    const [keep, ...extra] = same;
    for (const dup of extra) {
      if (Math.abs((dup._stats.createdTime ?? 0) - (keep._stats.createdTime ?? 0)) > 10000) continue;
      const dependents = dup.getDependents?.() ?? [];
      if (dependents.length) await keep.addDependent(...dependents);
      await dup.update({ "flags.dnd5e.-=dependents": null });
      await dup.delete();
    }
  }, 1500);
});

/**
 * HP alerts for the GM: an actor with `flags.theia-tweaks.hpAlert` (a number, or {value, message}) warns the GM when its
 * hit points drop to that value or below (once per crossing). E.g. Perpetual Mechanical Array at 105: Defensive Array.
 */
Hooks.on("updateActor", (actor, changes, options) => {
  if (!game.users.activeGM?.isSelf || !foundry.utils.hasProperty(changes, "system.attributes.hp")) return;
  const raw = actor.getFlag?.(MODULE_ID, "hpAlert") ?? foundry.utils.getProperty(actor, `flags.${MODULE_ID}.hpAlert`);
  if (raw === undefined || raw === null || raw === "") return;
  const threshold = Number(typeof raw === "object" ? raw.value : raw);
  if (!Number.isFinite(threshold)) return;
  const now = actor.system.attributes.hp.value;
  const before = options?.dnd5e?.hp?.value;
  if (before === undefined || !(before > threshold && now <= threshold)) return;
  const name = actor.token?.name ?? actor.name;
  const message = (typeof raw === "object" && raw.message) ? raw.message : `${name} is at ${threshold} HP or less.`;
  ui.notifications.warn(`${name}: ${now} HP — ${message}`, { permanent: true });
  ChatMessage.create({
    whisper: ChatMessage.getWhisperRecipients("GM"),
    speaker: { alias: "HP Alert" },
    content: `<p><b>${name}</b> dropped to <b>${now} HP</b> (alert at ${threshold}).</p><p>${message}</p>`
  });
  foundry.audio.AudioHelper.play({ src: "sounds/notify.wav", volume: 0.8 }, false);
});

/*
 * Runs a world macro for the damage and initiative hooks. Players may not run script macros, so a macro written by a
 * GM runs directly when the current user cannot execute it (as Midi-QOL does with item macros).
 */
async function runWorldMacro(macro, args) {
  if (macro.canExecute) return macro.execute({ args });
  if (!macro.author?.isGM || macro.type !== "script") return;
  const AsyncFunction = (async function() {}).constructor;
  return new AsyncFunction("args", "scope", macro.command).call(macro, args, { args });
}

/*
 * Damage macros: an effect with the change "flags.theia-tweaks.onDamageMacro" (a world macro name) runs that macro
 * on the client running the attack, after the damage against the creature is worked out and before it is applied.
 * The macro receives { theiaPass: "onDamage", token, actor, ditem, workflow, effect } as args[0] and may change ditem.
 */
Hooks.on("midi-qol.preTargetDamageApplication", async (token, { workflow, ditem } = {}) => {
  const actor = token?.actor;
  if (!actor || !ditem) return;
  for (const effect of actor.appliedEffects) {
    const change = effect.changes.find(c => c.key === `flags.${MODULE_ID}.onDamageMacro`);
    const macro = change?.value ? game.macros.getName(change.value) : null;
    if (!macro) continue;
    try {
      await runWorldMacro(macro, [{ theiaPass: "onDamage", token, actor, ditem, workflow, effect }]);
    } catch (error) {
      console.error(`${MODULE_ID} | ${macro.name}`, error);
    }
  }
});

/*
 * Initiative macros: an item with the flag "flags.theia-tweaks.onInitiativeMacro" (a world macro name) runs that macro
 * when its owner's initiative is rolled (sheet, combat tracker, Epic Rolls), on the active GM's client. The macro
 * receives { theiaPass: "onInitiative", actor, item, combatants } as args[0].
 */
Hooks.on("updateCombatant", async (combatant, changes) => {
  // Runs once, for the active GM, whoever rolled (the macro asks the player through a dialog).
  if (!game.users.activeGM?.isSelf || !("initiative" in changes) || changes.initiative === null) return;
  const actor = combatant.actor;
  for (const item of actor?.items ?? []) {
    const name = item.getFlag(MODULE_ID, "onInitiativeMacro");
    const macro = name ? game.macros.getName(name) : null;
    if (!macro) continue;
    try {
      await runWorldMacro(macro, [{ theiaPass: "onInitiative", actor, item, combatants: [combatant] }]);
    } catch (error) {
      console.error(`${MODULE_ID} | ${macro.name}`, error);
    }
  }
});

/*
 * Summon macros: an item with the flag "flags.theia-tweaks.onSummonMacro" (a world macro name) runs that macro right
 * after one of its activities summons creatures, on the client that summoned them. The macro receives
 * { theiaPass: "onSummon", actor, item, activity, profile, tokens, options } as args[0].
 */
Hooks.on("dnd5e.postSummon", async (activity, profile, tokens, options) => {
  const item = activity?.item;
  const name = item?.getFlag(MODULE_ID, "onSummonMacro");
  const macro = name ? game.macros.getName(name) : null;
  if (!macro) return;
  try {
    await runWorldMacro(macro, [{ theiaPass: "onSummon", actor: item.actor, item, activity, profile, tokens, options }]);
  } catch (error) {
    console.error(`${MODULE_ID} | ${macro.name}`, error);
  }
});

/*
 * Dismiss at 0 HP: when a token whose actor has the flag "flags.theia-tweaks.dismissAtZero" drops to 0 Hit Points,
 * the active GM is asked whether to remove it (as Chris's Premades does for its summons).
 */
const dismissAsked = new Set();

async function askDismiss(tokenDoc) {
  if (!game.users.activeGM?.isSelf || !tokenDoc?.actor?.getFlag(MODULE_ID, "dismissAtZero")) return;
  if ((tokenDoc.actor.system.attributes?.hp?.value ?? 1) > 0 || dismissAsked.has(tokenDoc.uuid)) return;
  dismissAsked.add(tokenDoc.uuid);
  try {
    const remove = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Dismiss Summon" },
      content: `<p><b>${tokenDoc.name}</b> dropped to 0 Hit Points. Remove its token?</p>`,
      rejectClose: false
    });
    if (remove && tokenDoc.parent?.tokens.has(tokenDoc.id)) await tokenDoc.delete();
  } finally {
    dismissAsked.delete(tokenDoc.uuid);
  }
}

Hooks.on("updateActor", (actor, changes) => {
  if (foundry.utils.getProperty(changes, "system.attributes.hp.value") === undefined) return;
  for (const token of actor.isToken ? [actor.token] : actor.getActiveTokens(false, true)) askDismiss(token);
});

Hooks.on("updateToken", (tokenDoc, changes) => {
  if (foundry.utils.getProperty(changes, "delta.system.attributes.hp.value") !== undefined) askDismiss(tokenDoc);
});

/*
 * Initiative reroll (Hypervigilance): an effect that sets "flags.theia-tweaks.initiativeReroll" to a number makes the
 * initiative d20 reroll once when it shows that number or lower; the new roll stays.
 */
Hooks.on("dnd5e.preConfigureInitiative", (actor, config) => {
  const below = Number(actor.flags?.[MODULE_ID]?.initiativeReroll);
  if (below > 0) config.options.theiaInitiativeReroll = below;
});

Hooks.once("setup", () => {
  const D20Roll = CONFIG.Dice.D20Roll;
  const configureModifiers = D20Roll?.prototype.configureModifiers;
  if (typeof configureModifiers !== "function") return;
  D20Roll.prototype.configureModifiers = function() {
    configureModifiers.call(this);
    const below = this.options.theiaInitiativeReroll;
    if (!below || !this.validD20Roll) return;
    const modifier = `r<=${below}`;
    if (this.d20.modifiers.includes(modifier)) return;
    this.d20.modifiers.push(modifier);
    this.resetFormula();
  };
});

/*
 * Scheduled lights: an ambient light with the flag "flags.theia-tweaks.schedule" = { on: 19, off: 23 } (hours of the
 * world clock, as SmallTime shows it) is lit only between those hours and hidden the rest of the day. The active GM
 * updates the lights of the viewed and the active scene whenever the world time changes.
 */
function scheduledLightsHour() {
  const c = game.time.components ?? {};
  return (Number(c.hour) || 0) + (Number(c.minute) || 0) / 60;
}

function isInSchedule(hour, { on = 19, off = 23 } = {}) {
  return on <= off ? hour >= on && hour < off : hour >= on || hour < off;
}

async function updateScheduledLights() {
  if (!game.users.activeGM?.isSelf) return;
  const hour = scheduledLightsHour();
  const scenes = new Set([canvas?.scene, game.scenes.active].filter(Boolean));
  for (const scene of scenes) {
    const updates = [];
    for (const light of scene.lights) {
      const schedule = light.getFlag(MODULE_ID, "schedule");
      if (!schedule) continue;
      const hidden = !isInSchedule(hour, schedule);
      if (light.hidden !== hidden) updates.push({ _id: light.id, hidden });
    }
    if (updates.length) await scene.updateEmbeddedDocuments("AmbientLight", updates);
  }
}

Hooks.on("updateWorldTime", () => updateScheduledLights());
Hooks.on("canvasReady", () => updateScheduledLights());

/*
 * Gift scenes (Stylish Relationship Tracker): an NPC can hold flags.theia-tweaks.giftScenes =
 * { "<item name, lower case>": { title, recollection, quote, image } }. When one of those items is given as a Gift,
 * the tracker logs a gift event; the active GM then fills that event with the scene, so the Event Log shows it as a
 * scene recall. With no image, the scene uses the relationship portrait.
 */
const SRT_ID = "stylish-relationship-tracker";
const giftSceneKey = name => String(name ?? "").trim().toLowerCase();
let srtOperations = null;

async function fillGiftScenes(actor) {
  const data = actor.getFlag(SRT_ID, "relationshipData");
  for (const rel of data?.relationships ?? []) {
    for (const ev of rel.events ?? []) {
      if (ev.eventType !== "gift" || ev.recollection || !ev.gift?.itemName || !ev.gift.targetActorUuid) continue;
      const target = await fromUuid(ev.gift.targetActorUuid);
      const scene = target?.getFlag(MODULE_ID, "giftScenes")?.[giftSceneKey(ev.gift.itemName)];
      if (!scene) continue;
      srtOperations ??= await import(`/modules/${SRT_ID}/scripts/core/relationship-operations.js`);
      await srtOperations.updateEvent(actor, rel.id, ev.id, {
        text: scene.title,
        recollection: scene.recollection,
        quote: scene.quote,
        image: scene.image || rel.portrait
      });
    }
  }
}

Hooks.on("updateActor", (actor, changes) => {
  if (!game.users.activeGM?.isSelf || !game.modules.get(SRT_ID)?.active) return;
  if (!foundry.utils.hasProperty(changes, `flags.${SRT_ID}.relationshipData`)) return;
  fillGiftScenes(actor).catch(error => console.error(`${MODULE_ID} | gift scenes`, error));
});

/*
 * Hit points on level up (Theia rule): take the average, or roll; one reroll is allowed and the second result stays.
 * The level-up window counts the rolls of each class level in this session: after the first roll the average can no
 * longer be taken, and after the second roll the roll button is locked. Players can't type a value by hand.
 */
const hpRolls = new Map(); // "actor.item.level" -> rolls made
const hpRollKey = flow => `${flow.advancement?.actor?.id}.${flow.advancement?.item?.id}.${flow.level}`;

Hooks.once("setup", () => {
  const actions = dnd5e?.applications?.advancement?.HitPointsFlow?.DEFAULT_OPTIONS?.actions;
  const rollHitPoints = actions?.rollHitPoints;
  if (typeof rollHitPoints !== "function") return;
  actions.rollHitPoints = async function(event, target) {
    const key = hpRollKey(this);
    const rolls = hpRolls.get(key) ?? 0;
    if (rolls >= 2) return;
    hpRolls.set(key, rolls + 1);
    return rollHitPoints.call(this, event, target);
  };
});

Hooks.on("renderHitPointsFlow", (app, element) => {
  const root = element instanceof HTMLElement ? element : element?.[0];
  if (!root) return;
  const rolls = hpRolls.get(hpRollKey(app)) ?? 0;
  if (!game.user.isGM) root.querySelectorAll('input[name="value"]').forEach(i => { i.readOnly = true; });
  if (rolls >= 1) root.querySelectorAll('[name="useAverage"]').forEach(i => { i.disabled = true; });
  const button = root.querySelector('[data-action="rollHitPoints"]');
  if (!button) return;
  if (rolls >= 2) {
    button.disabled = true;
    button.dataset.tooltip = "Reroll already used: the second result stays.";
  } else if (rolls === 1) {
    button.dataset.tooltip = "One reroll left. If you reroll, you must keep the new result.";
  }
});
