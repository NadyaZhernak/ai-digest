import type { PaletteInput, CombosInput, Color } from '../types.js';
import { svgWrap, rect, text } from '../svg-utils.js';

const SWATCH_W = 80;
const SWATCH_H = 40;
const GAP = 10;
const TOP_OFFSET = 24;

export function renderPalette(input: PaletteInput): string {
  const { title, colors } = input;
  const totalW = colors.length * (SWATCH_W + GAP) - GAP + 20;
  const totalH = TOP_OFFSET + SWATCH_H + 24;

  const parts: string[] = [];

  // Title
  parts.push(text(totalW / 2, 14, title, { anchor: 'middle', size: 11, fill: '#999' }));

  // Swatches
  colors.forEach((c, i) => {
    const x = 10 + i * (SWATCH_W + GAP);
    parts.push(rect(x, TOP_OFFSET, SWATCH_W, SWATCH_H, { fill: c.hex, rx: 6 }));
    parts.push(text(x + SWATCH_W / 2, TOP_OFFSET + SWATCH_H + 14, c.name, {
      anchor: 'middle', size: 9, fill: '#555',
    }));
  });

  return svgWrap(`0 0 ${totalW} ${totalH}`, Math.min(totalW, 560), parts.join('\n'));
}

export function renderCombos(input: CombosInput, palette: Color[]): string {
  const { title, combos } = input;
  const blockW = 120;
  const blockH = 50;
  const comboGap = 16;
  const labelH = 20;
  const topOffset = 28;

  const maxColors = Math.max(...combos.map(c => c.colors.length));
  const totalW = maxColors * (blockW + 4) + 40;
  const totalH = topOffset + combos.length * (blockH + labelH + comboGap);

  const parts: string[] = [];
  parts.push(text(totalW / 2, 16, title, { anchor: 'middle', size: 12, fill: '#333', weight: 'bold' }));

  combos.forEach((combo, ci) => {
    const y = topOffset + ci * (blockH + labelH + comboGap);

    combo.colors.forEach((colorIdx, bi) => {
      const color = palette[colorIdx];
      if (!color) return;
      const x = 10 + bi * (blockW + 4);
      parts.push(rect(x, y, blockW, blockH, { fill: color.hex, rx: 4 }));
    });

    const labelX = 10 + (combo.colors.length * (blockW + 4)) / 2 - 2;
    parts.push(text(labelX, y + blockH + 14, combo.name, {
      anchor: 'middle', size: 12, fill: '#333',
    }));
  });

  return svgWrap(`0 0 ${totalW} ${totalH}`, Math.min(totalW, 400), parts.join('\n'));
}
