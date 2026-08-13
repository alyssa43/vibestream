const TIER_SUFFIX = /\s*(?:\([^)]*\bads?\b[^)]*\)|(?:basic|standard|premium|essential)(?:\s+plus)?(?:\s+with\s+ads)?|with\s+ads|ad[-\s]supported)$/i;

// TMDB returns each distribution variant as its own provider (e.g. "Paramount+
// Premium" and "Paramount+ Essential", or "Netflix" and "Netflix Standard
// with Ads", are the same service at different tiers, and anything with
// "Channel" in the name is a reseller wrapper like Prime Video Channels).
// Collapse those down to one entry per underlying service, keyed by the
// tier-stripped canonical name. Displayed name depends on how many original
// variants survived into the group: 2+ variants is evidence the stripped
// suffix was a real tier qualifier, so show the canonical name; a lone
// survivor is shown unchanged, since the canonical name is lossy for
// services whose real name ends in a tier word, e.g. "Disney Plus".
function canonicalizeName(name) {
  let result = name.trim();
  let previous;
  do {
    previous = result;
    result = previous.replace(TIER_SUFFIX, '').trim();
  } while (result !== previous);
  return result;
}

export function dedupeProviders(providers = []) {
  const groups = new Map();

  providers.forEach((provider, index) => {
    const name = provider.provider_name;
    if (!name || /channel/i.test(name)) return;

    const canonicalName = canonicalizeName(name);
    const existing = groups.get(canonicalName);

    if (!existing) {
      groups.set(canonicalName, { order: index, members: [provider] });
    } else {
      existing.members.push(provider);
    }
  });

  return [...groups.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([canonicalName, { members }]) => {
      // Two or more surviving variants confirms the stripped suffix was a
      // real tier qualifier, so it's safe to show the canonical name. A
      // lone survivor gives no such evidence, so show it unchanged, e.g. a
      // solo "Disney Plus" or a solo "Hulu (With Ads)" stays as-is.
      if (members.length === 1) return members[0];

      const shortest = members.reduce((a, b) =>
        b.provider_name.length < a.provider_name.length ? b : a
      );
      return { ...shortest, provider_name: canonicalName };
    });
}
