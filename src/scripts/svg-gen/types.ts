// ── Color ──
export interface Color {
  name: string;
  hex: string;
}

// ── Palette ──
export interface PaletteInput {
  title: string;
  colors: Color[];
}

// ── Combos ──
export interface ComboItem {
  name: string;
  colors: number[]; // indices into palette
}

export interface CombosInput {
  title: string;
  combos: ComboItem[];
}

// ── Stitch Chart ──
export interface StitchRound {
  label: string;
  color: number | string; // palette index or hex
  pattern: string;        // e.g. "3dc, ch2"
  repeat: number;
  note?: string;
}

export interface StitchRow {
  label: string;
  pattern: string; // e.g. "hdc"
  repeat: number;
}

export interface StitchChartCircularInput {
  title: string;
  layout: 'circular';
  center: 'magic-ring' | 'chain-ring';
  rounds: StitchRound[];
  legend?: boolean;
}

export interface StitchChartGridInput {
  title: string;
  layout: 'grid';
  craft: 'crochet' | 'knitting';
  cols: number;
  rows: StitchRow[];
  legend?: boolean;
}

export type StitchChartInput = StitchChartCircularInput | StitchChartGridInput;

// ── Garment Layout ──
export interface GarmentPiece {
  name: string;
  cols: number;
  rows: number;
  qty?: number;
}

export interface GarmentVariant {
  name: string;
  color: number | string; // palette index or hex
  pieces: GarmentPiece[];
  total: { count: number; formula: string; unit?: string }; // unit defaults to "квадратов"
}

export interface GarmentLayoutInput {
  title: string;
  variants: GarmentVariant[];
}

// ── Union ──
export type DiagramInput =
  | (PaletteInput & { type: 'palette' })
  | (CombosInput & { type: 'combos' })
  | (StitchChartInput & { type: 'stitch-chart' })
  | (GarmentLayoutInput & { type: 'garment-layout' });
