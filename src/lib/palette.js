/**
 * Colorblind-safe palette — single source of truth.
 *
 * Source: Bang Wong, "Points of view: Color blindness",
 * Nature Methods 8, 441 (2011). Optimized for deuteranopia and protanopia.
 * Pair the colors with shape/position cues (not color alone) wherever possible.
 *
 * Order is intentional: distinguishable even in grayscale.
 */
export const CB_PALETTE = [
  "#E69F00", // orange
  "#56B4E9", // sky blue
  "#009E73", // bluish green
  "#F0E442", // yellow
  "#0072B2", // blue
  "#D55E00", // vermilion
  "#CC79A7", // reddish purple
  "#999999"  // neutral grey
];

/**
 * Family colors — same Wong palette, indexed per family so the timeline
 * lane, legend, and family explainer cards stay consistent.
 */
export const FAMILY_COLORS = {
  dense: CB_PALETTE[4],               // blue
  moe: CB_PALETTE[5],                 // vermilion
  hybrid_attention_ssm: CB_PALETTE[2],// bluish green
  looped: CB_PALETTE[6],              // reddish purple
  multimodal: CB_PALETTE[0]           // orange
};

export const FAMILY_COLORS_FALLBACK = CB_PALETTE[7];

/**
 * Pick N distinguishable colors for compare-charts (radar, bar, etc).
 * Cycles through the palette if more series than colors.
 */
export function seriesColors(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(CB_PALETTE[i % CB_PALETTE.length]);
  return out;
}
