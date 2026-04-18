import type { StitchChartInput, StitchChartCircularInput, StitchChartGridInput, Color } from '../types.js';
import { svgWrap, text, rect } from '../svg-utils.js';
import { expandPattern, parsePattern, parseToUnits } from '../parse-pattern.js';
import {
  CROCHET_SYMBOLS,
  getSymbols,
  renderCluster,
  renderChainArc,
} from '../symbols.js';

export function renderStitchChart(input: StitchChartInput, palette: Color[]): string {
  if (input.layout === 'circular') {
    return renderCircular(input, palette);
  }
  return renderGrid(input, palette);
}

// ────────────────────────────────────────────────────
// Radial motif (granny square, sunburst, hexagon-style)
// ────────────────────────────────────────────────────
// Geometry model:
//   • Square perimeter at each round's radius (4-way symmetry).
//   • Pattern is ONE repeat; multiplied ×4 around the motif.
//   • Each pattern unit (cluster OR ch-arc) gets one angular slot.
//   • Clusters: shared base on inner radius, fanned top on outer radius.
//     Stems converge at the base — this is what makes it look like yarn,
//     not a blueprint.
//   • ch-arcs: quadratic Bezier bowed outward from motif center.
//   • First ch≥2 arc is aligned to the NE corner (−π/4) so corners
//     land on the square's diagonals as in real charts.

/** Point on a square perimeter at the given angle (math convention, y-down). */
function squarePointAtAngle(cx: number, cy: number, h: number, angle: number): { x: number; y: number } {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const d = h / Math.max(Math.abs(c), Math.abs(s));
  return { x: cx + c * d, y: cy + s * d };
}

/** Point on a circle at the given angle — used for round 1's magic-ring anchor. */
function circlePointAtAngle(cx: number, cy: number, r: number, angle: number): { x: number; y: number } {
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

/**
 * Outward-normal direction for a square-perimeter point at the given angle.
 * Perpendicular to the side the point sits on (N/S/E/W). Used to
 * orient clusters so they point away from the motif center.
 */
function outwardNormalAt(angle: number): { nx: number; ny: number } {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  if (Math.abs(c) > Math.abs(s)) {
    return { nx: c > 0 ? 1 : -1, ny: 0 };
  }
  return { nx: 0, ny: s > 0 ? 1 : -1 };
}

function renderCircular(input: StitchChartCircularInput, palette: Color[]): string {
  const { title, rounds, legend = true } = input;

  const magicRingR = 12;
  const baseHalf = 28;    // half-side of square at end of round 1
  const roundStep = 26;   // each round grows the square by this
  const margin = 20;

  const numRounds = rounds.length;
  const outerHalf = baseHalf + (numRounds - 1) * roundStep;
  const chartRadius = outerHalf + 6;

  const titleH = 24;
  const minHalfW = 190;
  const cx = Math.max(chartRadius + margin, minHalfW);
  const cy = titleH + chartRadius;
  const totalW = cx * 2;

  const parts: string[] = [];

  parts.push(text(cx, 14, title, { anchor: 'middle', size: 12, fill: '#333', weight: 'bold' }));

  // Magic ring (the conventional center symbol)
  parts.push(`  <circle cx="${cx}" cy="${cy}" r="${magicRingR}" stroke="#333" fill="#fafafa" stroke-width="2"/>`);

  // ── Render each round ──
  for (let ri = 0; ri < numRounds; ri++) {
    const round = rounds[ri];
    const color = resolveColor(round.color, palette);

    // innerH/outerH: where this round's stems start (anchor) and end (cap).
    // Round 1 anchors on the magic ring (a circle).
    const innerH = ri === 0 ? magicRingR + 2 : baseHalf + (ri - 1) * roundStep;
    const outerH = baseHalf + ri * roundStep;

    const units = parseToUnits(round.pattern);
    if (units.length === 0) continue;

    const totalSlots = units.length * 4;
    const slotAngle = (2 * Math.PI) / totalSlots;

    // Align first ch≥2 arc to the NE corner (-π/4). If there's none,
    // anchor the first unit at north (-π/2) for visual balance.
    let cornerUnitIdx = -1;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.kind === 'arc' && u.count >= 2) {
        cornerUnitIdx = i;
        break;
      }
    }
    const startAngle = cornerUnitIdx >= 0
      ? -Math.PI / 4 - cornerUnitIdx * slotAngle
      : -Math.PI / 2;

    const stitchWidth = 5.5; // px per stitch at the top cap

    for (let rep = 0; rep < 4; rep++) {
      for (let ui = 0; ui < units.length; ui++) {
        const globalIdx = rep * units.length + ui;
        const angle = startAngle + globalIdx * slotAngle;
        const unit = units[ui];

        if (unit.kind === 'cluster') {
          const basePt = ri === 0
            ? circlePointAtAngle(cx, cy, magicRingR + 2, angle)
            : squarePointAtAngle(cx, cy, innerH, angle);
          const topPt = squarePointAtAngle(cx, cy, outerH, angle);

          const out = outwardNormalAt(angle);
          // Side direction = rotate outward 90° (along the side of the square)
          const sideNx = -out.ny;
          const sideNy = out.nx;
          const spread = stitchWidth * Math.max(0, unit.stitches.length - 1);

          parts.push(renderCluster(
            unit.stitches,
            basePt.x, basePt.y,
            topPt.x, topPt.y,
            sideNx, sideNy,
            spread,
            color,
          ));
        } else {
          // Arc: span a fraction of the slot. Corner arcs (ch≥2) span more.
          const isCorner = unit.count >= 2;
          const fracSpan = isCorner ? 0.8 : 0.55;
          const fromAngle = angle - slotAngle * fracSpan * 0.5;
          const toAngle = angle + slotAngle * fracSpan * 0.5;
          const arcRadius = outerH - 2;
          const fromPt = squarePointAtAngle(cx, cy, arcRadius, fromAngle);
          const toPt = squarePointAtAngle(cx, cy, arcRadius, toAngle);

          // Outward direction for the bulge.
          //   Corner arc: diagonal out toward the corner (cos, sin) at `angle`.
          //   Side arc:   perpendicular to the nearest side.
          let outX: number, outY: number;
          if (isCorner) {
            outX = Math.cos(angle);
            outY = Math.sin(angle);
            const m = Math.hypot(outX, outY) || 1;
            outX /= m;
            outY /= m;
          } else {
            const n = outwardNormalAt(angle);
            outX = n.nx;
            outY = n.ny;
          }
          const bulge = isCorner ? 11 : 5;
          parts.push(renderChainArc(unit.count, fromPt.x, fromPt.y, toPt.x, toPt.y, outX, outY, bulge, color));
        }
      }
    }
  }

  // ── Legend ──
  if (legend) {
    const legendY = cy + chartRadius + 14;

    // Unique stitches across all rounds (preserving insertion order)
    const usedStitches: string[] = [];
    const seen = new Set<string>();
    for (const round of rounds) {
      for (const g of parsePattern(round.pattern)) {
        if (!seen.has(g.stitch) && CROCHET_SYMBOLS[g.stitch]) {
          seen.add(g.stitch);
          usedStitches.push(g.stitch);
        }
      }
    }

    let ly = legendY;
    for (const stitch of usedStitches) {
      const sym = CROCHET_SYMBOLS[stitch];
      if (!sym) continue;
      parts.push(sym.render(30, ly, Math.PI / 2, '#333'));
      parts.push(text(42, ly + 4, `— ${sym.labelRu}`, { size: 10, fill: '#333' }));
      ly += 20;
    }
    // Magic ring marker
    parts.push(`  <circle cx="30" cy="${ly}" r="5" stroke="#333" fill="#fafafa" stroke-width="1.5"/>`);
    parts.push(text(42, ly + 4, '— магическое кольцо', { size: 10, fill: '#333' }));
    ly += 8;

    // Round descriptions (right column)
    const rightColX = totalW / 2 + 10;
    let rly = legendY;
    for (const round of rounds) {
      const color = resolveColor(round.color, palette);
      parts.push(rect(rightColX, rly - 6, 12, 12, { fill: color, rx: 2 }));
      const noteText = round.note ? ` — ${round.note}` : '';
      parts.push(text(rightColX + 18, rly + 4, `${round.label}${noteText}`, { size: 10, fill: '#555' }));
      rly += 22;
    }

    const totalH = Math.max(ly, rly) + 10;
    return svgWrap(`0 0 ${totalW} ${totalH}`, Math.min(totalW, 420), parts.join('\n'));
  }

  const chartH = cy + chartRadius + 10;
  return svgWrap(`0 0 ${totalW} ${chartH}`, Math.min(totalW, 420), parts.join('\n'));
}

// ────────────────────────────────────────────────────
// Grid chart (rows, stitch patterns)
// ────────────────────────────────────────────────────

function renderGrid(input: StitchChartGridInput, palette: Color[]): string {
  const { title, craft, cols, rows, legend = true } = input;
  const symbols = getSymbols(craft);

  const cellSize = 24;
  const padLeft = 30;
  const padTop = 30;
  const padBottom = legend ? 60 : 10;

  const totalRows = rows.reduce((sum, r) => {
    const range = r.label.match(/^(\d+)-(\d+)$/);
    if (range) return sum + (parseInt(range[2]) - parseInt(range[1]) + 1);
    return sum + 1;
  }, 0);

  const gridW = cols * cellSize;
  const gridH = totalRows * cellSize;
  const totalW = padLeft + gridW + 20;
  const totalH = padTop + gridH + padBottom;

  const parts: string[] = [];

  parts.push(text(totalW / 2, 16, title, { anchor: 'middle', size: 12, fill: '#333', weight: 'bold' }));

  for (let r = 0; r <= totalRows; r++) {
    const y = padTop + r * cellSize;
    parts.push(`  <line x1="${padLeft}" y1="${y}" x2="${padLeft + gridW}" y2="${y}" stroke="#ccc" stroke-width="0.5"/>`);
  }
  for (let c = 0; c <= cols; c++) {
    const x = padLeft + c * cellSize;
    parts.push(`  <line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + gridH}" stroke="#ccc" stroke-width="0.5"/>`);
  }

  let rowIdx = 0;
  for (const row of rows) {
    const stitches = expandPattern(row.pattern, row.repeat);
    const range = row.label.match(/^(\d+)-(\d+)$/);
    const rowCount = range ? (parseInt(range[2]) - parseInt(range[1]) + 1) : 1;

    for (let ri = 0; ri < rowCount; ri++) {
      const y = padTop + rowIdx * cellSize + cellSize / 2;
      const labelNum = range ? parseInt(range[1]) + ri : parseInt(row.label) || rowIdx + 1;
      parts.push(text(padLeft - 6, y + 4, String(labelNum), { anchor: 'end', size: 9, fill: '#999' }));

      for (let ci = 0; ci < cols && ci < stitches.length; ci++) {
        const stitch = stitches[ci % stitches.length];
        const sym = symbols[stitch];
        if (!sym) continue;
        const x = padLeft + ci * cellSize + cellSize / 2;
        parts.push(sym.render(x, y, Math.PI / 2, '#333'));
      }

      rowIdx++;
    }
  }

  for (let c = 0; c < cols; c++) {
    const x = padLeft + c * cellSize + cellSize / 2;
    parts.push(text(x, padTop + gridH + 14, String(c + 1), { anchor: 'middle', size: 9, fill: '#999' }));
  }

  if (legend) {
    const usedStitches = new Set<string>();
    for (const row of rows) {
      for (const g of parsePattern(row.pattern)) {
        usedStitches.add(g.stitch);
      }
    }

    let lx = padLeft;
    const ly = padTop + gridH + 30;
    for (const stitch of usedStitches) {
      const sym = symbols[stitch];
      if (!sym) continue;
      parts.push(sym.render(lx + 8, ly, Math.PI / 2, '#333'));
      parts.push(text(lx + 20, ly + 4, sym.labelRu, { size: 9, fill: '#555' }));
      lx += 20 + sym.labelRu.length * 5.5 + 10;
    }
  }

  return svgWrap(`0 0 ${totalW} ${totalH}`, Math.min(totalW, 400), parts.join('\n'));
}

function resolveColor(color: number | string, palette: Color[]): string {
  if (typeof color === 'string') return color;
  return palette[color]?.hex ?? '#333';
}
