const NEUTRAL_COLORS = new Set(["black", "white", "ivory", "beige", "gray", "brown", "navy"]);
const COLOR_FAMILIES = {
  red: new Set(["red", "pink"]),
  orange: new Set(["orange", "yellow"]),
  yellow: new Set(["yellow", "orange"]),
  green: new Set(["green"]),
  blue: new Set(["blue", "navy"]),
  purple: new Set(["purple", "lavender"]),
  lavender: new Set(["purple", "lavender", "pink"]),
  pink: new Set(["pink", "red", "lavender"]),
  brown: new Set(["brown", "beige"]),
};
const MOOD_TAGS = {
  comfortable: ["comfortable", "soft", "casual", "relaxed"],
  confident: ["bold", "structured", "tailored", "statement"],
  elegant: ["elegant", "classic", "formal", "polished"],
  playful: ["playful", "bright", "print", "colorful"],
  relaxed: ["relaxed", "casual", "easy", "soft"],
  experimental: ["experimental", "statement", "layered", "edgy"],
};
function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function overlap(left, right) {
  const values = new Set(left.map(normalized));
  return right.some((value) => values.has(normalized(value)));
}

function itemHasColor(item, colors) {
  return colors.some((color) => [
    normalized(item.color),
    normalized(item.secondaryColor),
  ].includes(normalized(color)));
}

function colorPairScore(left, right) {
  const first = normalized(left);
  const second = normalized(right);
  if (!first || !second) return 0;
  if (first === second) return 2;
  if (NEUTRAL_COLORS.has(first) || NEUTRAL_COLORS.has(second)) return 2;
  if (COLOR_FAMILIES[first]?.has(second) || COLOR_FAMILIES[second]?.has(first)) return 1;
  return 0;
}

function makeExplanation(items, request, profile) {
  const reasons = [];
  if (items.some((item) => overlap(item.occasions || [], [request.occasion]))) {
    reasons.push(`some pieces suit ${request.occasion}`);
  }
  if (request.style && items.some((item) => overlap(item.styleTags || [], [request.style]))) {
    reasons.push(`it reflects your ${request.style} style choice`);
  }
  if (request.color && items.some((item) => itemHasColor(item, [request.color]))) {
    reasons.push(`it includes your chosen ${request.color} colour`);
  } else if (items.some((item) => itemHasColor(item, profile.favoriteColors || []))) {
    reasons.push("it includes one of your favourite colours");
  }
  if (request.mood && items.some((item) => overlap(item.styleTags || [], MOOD_TAGS[request.mood] || []))) {
    reasons.push(`a piece supports a ${request.mood} mood`);
  }
  if (request.weather && items.some((item) =>
    overlap(item.weather || [], [request.weather]) || overlap(item.seasons || [], [request.weather]))) {
    reasons.push(`some pieces suit ${request.weather} weather`);
  }
  if (!reasons.length) reasons.push("these pieces are the closest starting point from your saved wardrobe");
  return `${reasons[0].charAt(0).toUpperCase()}${reasons[0].slice(1)}.`;
}

function scoreOutfit(items, request, profile) {
  let score = 0;
  const normalizedOccasion = normalized(request.occasion);
  const normalizedStyle = normalized(request.style);
  const normalizedColor = normalized(request.color);

  for (const item of items) {
    const tags = item.styleTags || [];
    if (normalizedOccasion && overlap(item.occasions || [], [normalizedOccasion])) score += 5;
    if (normalizedStyle && overlap(tags, [normalizedStyle])) score += 4;
    if (normalizedColor && itemHasColor(item, [normalizedColor])) score += 4;
    if (itemHasColor(item, profile.favoriteColors || [])) score += 3;
    if (overlap(profile.preferredStyles || [], tags)) score += 2;
    if (request.mood && overlap(tags, MOOD_TAGS[request.mood] || [])) score += 3;
    if (request.comfort && (
      overlap(tags, [request.comfort])
      || normalized(item.comfortNotes).includes(normalized(request.comfort))
    )) score += 2;
    if (request.weather
      && (overlap(item.weather || [], [request.weather]) || overlap(item.seasons || [], [request.weather]))) {
      score += 2;
    }
    if ((profile.comfortPreferences || []).some((preference) =>
      normalized(item.comfortNotes).includes(normalized(preference)))) score += 2;
    if (profile.fitPreference && overlap(tags, [profile.fitPreference])) score += 1;
  }

  for (let first = 0; first < items.length; first += 1) {
    for (let second = first + 1; second < items.length; second += 1) {
      score += colorPairScore(items[first].color, items[second].color);
    }
  }
  return score;
}

function hasAvoidedColor(items, avoidedColors) {
  return items.some((item) => itemHasColor(item, avoidedColors));
}

function itemId(item) {
  return String(item._id || item.id);
}

function makeCandidate(items, request, profile, missingCategories = []) {
  return {
    items,
    itemIds: items.map(itemId),
    missingCategories,
    score: scoreOutfit(items, request, profile),
    explanation: makeExplanation(items, request, profile),
  };
}

function createCompleteCandidates(items, request, profile) {
  const byCategory = (category) => items.filter((item) => item.category === category);
  const withAnchorFirst = (category, limit) => {
    const categoryItems = byCategory(category);
    const anchor = categoryItems.find((item) => itemId(item) === request.anchorItemId);
    return [...new Set([anchor, ...categoryItems].filter(Boolean))].slice(0, limit);
  };
  const shoes = withAnchorFirst("shoes", 20);
  const tops = withAnchorFirst("tops", 20);
  const bottoms = withAnchorFirst("bottoms", 20);
  const dresses = withAnchorFirst("dresses", 20);
  const optionalItems = (category) => {
    const categoryItems = byCategory(category);
    const anchor = categoryItems.find((item) => itemId(item) === request.anchorItemId);
    return [null, ...[...new Set([anchor, ...categoryItems].filter(Boolean))].slice(0, 2)];
  };
  const layers = optionalItems("outerwear");
  const accessories = optionalItems("accessories");
  const candidates = [];

  const addCore = (core) => {
    for (const layer of layers) {
      for (const accessory of accessories) {
        const outfit = [...core, layer, accessory].filter(Boolean);
        if (request.anchorItemId && !outfit.some((item) => itemId(item) === request.anchorItemId)) continue;
        if (hasAvoidedColor(outfit, profile.avoidedColors || [])) continue;
        candidates.push(makeCandidate(outfit, request, profile));
      }
    }
  };

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) addCore([top, bottom, shoe]);
    }
  }
  for (const dress of dresses) {
    for (const shoe of shoes) addCore([dress, shoe]);
  }
  return candidates;
}

function createClosestOptions(items, request, profile) {
  const allowed = items.filter((item) => !hasAvoidedColor([item], profile.avoidedColors || []));
  const shoes = allowed.filter((item) => item.category === "shoes");
  const tops = allowed.filter((item) => item.category === "tops");
  const bottoms = allowed.filter((item) => item.category === "bottoms");
  const dresses = allowed.filter((item) => item.category === "dresses");
  const candidates = [];
  const addPartial = (parts, missing) => {
    const outfit = parts.filter(Boolean);
    if (outfit.length === 0) return;
    if (request.anchorItemId && !outfit.some((item) => itemId(item) === request.anchorItemId)) return;
    candidates.push(makeCandidate(outfit, request, profile, missing));
  };

  if (tops.length && bottoms.length && !shoes.length) {
    for (const top of tops.slice(0, 5)) {
      for (const bottom of bottoms.slice(0, 5)) addPartial([top, bottom], ["shoes"]);
    }
  }
  if (dresses.length && !shoes.length) {
    for (const dress of dresses.slice(0, 10)) addPartial([dress], ["shoes"]);
  }
  if (shoes.length && tops.length && !bottoms.length && !dresses.length) {
    for (const top of tops.slice(0, 10)) {
      for (const shoe of shoes.slice(0, 5)) addPartial([top, shoe], ["bottoms or a one-piece outfit"]);
    }
  }
  if (shoes.length && bottoms.length && !tops.length && !dresses.length) {
    for (const bottom of bottoms.slice(0, 10)) {
      for (const shoe of shoes.slice(0, 5)) addPartial([bottom, shoe], ["tops or a one-piece outfit"]);
    }
  }
  if (!candidates.length && allowed.length) {
    const hasShoes = shoes.length > 0;
    const hasTopAndBottom = tops.length > 0 && bottoms.length > 0;
    const hasOnePiece = dresses.length > 0;
    let missing = [];
    if (!hasTopAndBottom && !hasOnePiece) missing.push("a top and bottoms or a one-piece outfit");
    if (!hasShoes) missing.push("shoes");
    const anchor = allowed.find((item) => itemId(item) === request.anchorItemId);
    const closest = anchor || allowed[0];
    addPartial([closest], missing);
  }
  return candidates;
}

function selectVaried(candidates, limit) {
  const sorted = candidates.sort((left, right) => right.score - left.score);
  const selected = [];
  for (const candidate of sorted) {
    const tooSimilar = selected.some((existing) => {
      const overlapCount = candidate.itemIds.filter((id) => existing.itemIds.includes(id)).length;
      return overlapCount >= Math.min(candidate.itemIds.length, existing.itemIds.length) - 1;
    });
    if (!tooSimilar) selected.push(candidate);
    if (selected.length >= limit) break;
  }
  return selected;
}

function outfitSignature(itemIds) {
  return [...itemIds].sort().join("|");
}

function recommendOutfits({
  items,
  request,
  profile = {},
  recentlyWornItemSets = [],
  avoidRecentlyWorn = false,
}) {
  const candidates = createCompleteCandidates(items, request, profile);
  const metadataIncomplete = items.some((item) => !item.category);
  const recentSignatures = new Set(recentlyWornItemSets.map(outfitSignature));
  const freshCandidates = avoidRecentlyWorn
    ? candidates.filter((candidate) => !recentSignatures.has(outfitSignature(candidate.itemIds)))
    : candidates;
  const recommendations = selectVaried(freshCandidates, 4);
  const allRecentlyWorn = avoidRecentlyWorn && candidates.length > 0 && recommendations.length === 0;
  const recentlyWornRecommendations = allRecentlyWorn
    ? selectVaried(candidates, 4)
    : [];
  const closestOptions = candidates.length
    ? []
    : selectVaried(createClosestOptions(items, request, profile), 3);

  let message = "";
  if (allRecentlyWorn) {
    message = "Every complete option matching these choices was worn within your selected period. You can show those looks anyway.";
  } else if (!recommendations.length && closestOptions.length) {
    message = "Your wardrobe is missing a piece for a complete outfit. Here are the closest combinations from items you own.";
  } else if (!recommendations.length) {
    message = items.length
      ? "No complete combination fits these choices and your avoided colours. Try another preference or add more pieces."
      : "Your wardrobe is empty. Add a few items before asking for outfit ideas.";
  } else if (recommendations.length < 4) {
    message = "Here are the distinct complete combinations currently available from your wardrobe.";
  }
  if (metadataIncomplete) {
    const metadataNote = " Some wardrobe items need a category before they can be included in outfit combinations; complete their details in My Wardrobe.";
    message = message ? `${message}${metadataNote}` : metadataNote.trim();
  }

  return {
    recommendations,
    closestOptions,
    recentlyWornRecommendations,
    allRecentlyWorn,
    metadataIncomplete,
    message,
  };
}

module.exports = { outfitSignature, recommendOutfits, scoreOutfit };
