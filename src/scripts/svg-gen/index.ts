import type { Color, PaletteInput, CombosInput, StitchChartInput, GarmentLayoutInput } from './types.js';
import { renderPalette, renderCombos } from './renderers/palette.js';
import { renderStitchChart } from './renderers/stitch-chart.js';
import { renderGarmentLayout } from './renderers/garment-layout.js';

const PLACEHOLDER_RE = /<!--svg:(\w[\w-]*)\s+([\s\S]*?)-->/g;

/**
 * Scan markdown for `<!--svg:type {...} -->` placeholders and replace
 * them with generated SVG. Palette is always processed first so other
 * diagrams can reference its colors by index.
 */
export function processSvgPlaceholders(markdown: string): string {
  // First pass: extract palette
  let palette: Color[] = [];
  const paletteMatch = markdown.match(/<!--svg:palette\s+([\s\S]*?)-->/);
  if (paletteMatch) {
    try {
      const input = JSON.parse(paletteMatch[1]) as PaletteInput;
      palette = input.colors;
    } catch (err) {
      console.warn('[svg-gen] Failed to parse palette JSON:', err);
    }
  }

  // Second pass: replace all placeholders
  return markdown.replace(PLACEHOLDER_RE, (_match, type: string, json: string) => {
    try {
      const input = JSON.parse(json);
      switch (type) {
        case 'palette':
          return renderPalette(input as PaletteInput);
        case 'combos':
          return renderCombos(input as CombosInput, palette);
        case 'stitch-chart':
          return renderStitchChart(input as StitchChartInput, palette);
        case 'garment-layout':
          return renderGarmentLayout(input as GarmentLayoutInput, palette);
        default:
          console.warn(`[svg-gen] Unknown diagram type: "${type}"`);
          return _match; // leave as-is
      }
    } catch (err) {
      console.warn(`[svg-gen] Failed to process <!--svg:${type} ...-->:`, err);
      return _match; // leave placeholder in place
    }
  });
}
