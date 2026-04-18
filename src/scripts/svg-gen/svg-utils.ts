/** Wrap content in an <svg> tag with standard blog styles. */
export function svgWrap(viewBox: string, maxWidth: number, content: string): string {
  return `<svg viewBox="${viewBox}" width="100%" style="max-width:${maxWidth}px;display:block;margin:1.5rem 0" xmlns="http://www.w3.org/2000/svg">\n${content}\n</svg>`;
}

export interface TextOpts {
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  fill?: string;
  weight?: string;
  family?: string;
}

export function text(x: number, y: number, content: string, opts: TextOpts = {}): string {
  const {
    anchor = 'start',
    size = 10,
    fill = '#333',
    weight,
    family = 'sans-serif',
  } = opts;
  const w = weight ? ` font-weight="${weight}"` : '';
  return `  <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}"${w} fill="${fill}">${content}</text>`;
}

export interface RectOpts {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
}

export function rect(x: number, y: number, w: number, h: number, opts: RectOpts = {}): string {
  const { fill = 'none', stroke, strokeWidth = 1, rx = 0 } = opts;
  const s = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : '';
  const r = rx ? ` rx="${rx}"` : '';
  return `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${s}${r}/>`;
}

export function circle(cx: number, cy: number, r: number, opts: { fill?: string; stroke?: string; strokeWidth?: number } = {}): string {
  const { fill = 'none', stroke = '#333', strokeWidth = 1.5 } = opts;
  return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, opts: { stroke?: string; strokeWidth?: number; transform?: string } = {}): string {
  const { stroke = '#333', strokeWidth = 1, transform } = opts;
  const t = transform ? ` transform="${transform}"` : '';
  return `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke="${stroke}" fill="none" stroke-width="${strokeWidth}"${t}/>`;
}

export function line(x1: number, y1: number, x2: number, y2: number, opts: { stroke?: string; strokeWidth?: number } = {}): string {
  const { stroke = '#333', strokeWidth = 1.4 } = opts;
  return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

export function group(attrs: Record<string, string>, children: string[]): string {
  const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `  <g ${a}>\n${children.map(c => '  ' + c).join('\n')}\n  </g>`;
}
