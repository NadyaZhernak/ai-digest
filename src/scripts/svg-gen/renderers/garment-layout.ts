import type { GarmentLayoutInput, Color } from '../types.js';
import { svgWrap, rect, text } from '../svg-utils.js';

const CELL = 28;
const CELL_GAP = 2;
const VARIANT_GAP = 40;

/** Pick fill colors for grid cells cycling through palette shades. */
function pickFills(palette: Color[], count: number): string[] {
  if (palette.length === 0) return Array(count).fill('#ddd');
  const fills: string[] = [];
  for (let i = 0; i < count; i++) {
    fills.push(palette[i % palette.length].hex);
  }
  return fills;
}

export function renderGarmentLayout(input: GarmentLayoutInput, palette: Color[]): string {
  const { title, variants } = input;

  // Calculate total width
  let totalW = 0;
  const variantWidths: number[] = [];
  for (const v of variants) {
    const maxCols = Math.max(...v.pieces.map(p => p.cols));
    const w = maxCols * (CELL + CELL_GAP) + 80; // extra space for labels
    variantWidths.push(w);
    totalW += w;
  }
  totalW += (variants.length - 1) * VARIANT_GAP + 20;

  // Calculate max height across variants
  let maxPieceH = 0;
  for (const v of variants) {
    let h = 0;
    for (const p of v.pieces) {
      h += p.rows * (CELL + CELL_GAP) + 8;
    }
    h += 40; // total badge
    maxPieceH = Math.max(maxPieceH, h);
  }
  const totalH = 50 + maxPieceH + 10;

  const parts: string[] = [];
  parts.push(text(totalW / 2, 16, title, { anchor: 'middle', size: 12, fill: '#333', weight: 'bold' }));

  let offsetX = 10;

  for (let vi = 0; vi < variants.length; vi++) {
    const v = variants[vi];
    const accentColor = resolveColor(v.color, palette);
    const vw = variantWidths[vi];

    // Variant name
    parts.push(text(offsetX + vw / 2 - 40, 40, v.name, {
      anchor: 'middle', size: 11, fill: accentColor, weight: 'bold',
    }));

    let pieceY = 50;
    const fills = pickFills(palette, 20);

    for (const piece of v.pieces) {
      // Draw grid
      for (let row = 0; row < piece.rows; row++) {
        for (let col = 0; col < piece.cols; col++) {
          const x = offsetX + col * (CELL + CELL_GAP);
          const y = pieceY + row * (CELL + CELL_GAP);
          const fillIdx = (row * piece.cols + col) % fills.length;
          parts.push(rect(x, y, CELL, CELL, {
            fill: fills[fillIdx],
            stroke: accentColor,
            strokeWidth: 1,
            rx: 2,
          }));
        }
      }

      // Label to the right
      const labelX = offsetX + piece.cols * (CELL + CELL_GAP) + 6;
      const labelY = pieceY + (piece.rows * (CELL + CELL_GAP)) / 2;
      const label = piece.qty && piece.qty > 1
        ? `${piece.name} ${piece.cols}x${piece.rows}`
        : `${piece.name} ${piece.cols}x${piece.rows}`;
      parts.push(text(labelX, labelY, label, { size: 9, fill: '#555' }));

      if (piece.qty && piece.qty > 1) {
        parts.push(text(labelX, labelY + 12, `x${piece.qty}`, { size: 8, fill: '#555' }));
      }

      pieceY += piece.rows * (CELL + CELL_GAP) + 8;
    }

    // Total badge
    const badgeW = vw - 80;
    const badgeY = pieceY + 8;
    const bgColor = hexToLightBg(accentColor);
    parts.push(rect(offsetX, badgeY, badgeW, 24, { fill: bgColor, stroke: accentColor, strokeWidth: 1, rx: 4 }));
    parts.push(text(offsetX + badgeW / 2, badgeY + 16, `${v.total.count} квадратов`, {
      anchor: 'middle', size: 10, fill: accentColor, weight: 'bold',
    }));

    offsetX += vw + VARIANT_GAP;
  }

  return svgWrap(`0 0 ${totalW} ${totalH}`, Math.min(totalW, 560), parts.join('\n'));
}

function resolveColor(color: number | string, palette: Color[]): string {
  if (typeof color === 'string') return color;
  return palette[color]?.hex ?? '#333';
}

function hexToLightBg(hex: string): string {
  // Simple lightening: blend with white at 85%
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * 0.85);
  const lg = Math.round(g + (255 - g) * 0.85);
  const lb = Math.round(b + (255 - b) * 0.85);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}
