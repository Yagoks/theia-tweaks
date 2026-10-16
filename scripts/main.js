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
  game.settings.register(MODULE_ID, "beamSpells", {
    name: "Multi-beam spells",
    hint: "Chris's Premades identifiers of the spells whose \"use\" card is hidden, comma-separated.",
    scope: "world",
    config: true,
    type: String,
    default: "eldritchBlast, scorchingRay",
    onChange: () => ui.chat?.render?.()
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
