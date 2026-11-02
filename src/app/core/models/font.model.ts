export type PointType = 'corner' | 'smooth';

export interface VectorPoint {
  x: number;
  y: number;
  type?: PointType;
  // Relative or absolute handle offsets
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface PathContour {
  id: string;
  points: VectorPoint[];
  closed: boolean;
  isFilled: boolean;
  strokeWidth?: number; // If drawn as stroke
  type: 'bezier' | 'stroke' | 'shape';
  shapeKind?: 'rect' | 'circle' | 'polygon';
  cachedSvgPath?: string;
}

export interface GlyphMetrics {
  advanceWidth: number;
  leftSideBearing: number;
}

export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  capHeight: number;
  xHeight: number;
  baseline: number;
  descender: number;
}

export interface CustomGuide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number; // in SVG space (0..1000)
  label?: string;
  color?: string;
}

export interface GridSettings {
  enabled: boolean;
  size: 25 | 50 | 100;
  style: 'lines' | 'dots';
  snapToGrid: boolean;
  snapToGuides: boolean;
  slantAngle: number; // 0 to 20 degrees for italic guides
}

export interface FontGlyph {
  id: string;
  unicode: string;
  character: string;
  name: string;
  category: 'uppercase' | 'lowercase' | 'numbers' | 'punctuation' | 'symbols';
  metrics: GlyphMetrics;
  contours: PathContour[];
  svgPath: string; // Combined SVG path string in SVG space (0..1000)
  isEmpty: boolean;
}

export interface FontMetadata {
  familyName: string;
  styleName: string;
  author: string;
  version: string;
  description: string;
  copyright: string;
}

export interface FontVariant {
  id: string; // 'regular' | 'bold' | 'light' | 'italic' | 'condensed' | etc.
  name: string; // 'Regular', 'Bold', 'Light', 'Italic', 'Condensed'
  weight: number; // 100 to 900 (default: 400)
  isItalic: boolean;
  slantAngle: number; // e.g. 12 for italic
  widthStretch: number; // e.g. 0.85 for condensed, 1.0 for regular, 1.15 for expanded
  weightMultiplier: number; // e.g. 1.0 for regular, 1.5 for bold, 0.7 for light
}

export interface GlyphHistoryEntry {
  id: string;
  timestamp: number;
  actionName: string; // e.g. 'Brush stroke', 'Auto-trace image', 'Simplify path', 'Eraser'
  svgPath: string;
  contours: PathContour[];
  pointCount: number;
}

export interface AutoTraceSettings {
  threshold: number; // 0 to 255 (default 128)
  invert: boolean; // default false
  smoothing: number; // 1 to 10 (default 3)
  minArea: number; // filter speckles (default 8)
  scaleToFit: boolean; // fit within font metrics em-box
}

export interface SnapGuideInfo {
  type: 'grid' | 'metric' | 'custom';
  orientation: 'horizontal' | 'vertical';
  position: number;
  label: string;
}

export interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  activeGuides: SnapGuideInfo[];
}

export interface FontProject {
  id: string;
  metadata: FontMetadata;
  metrics: FontMetrics;
  glyphs: Record<string, FontGlyph>;
  kerning: Record<string, number>; // Pair kerning table, e.g. { 'AV': -80, 'WA': -60 }
  variants: FontVariant[];
  activeVariantId: string;
  createdAt: number;
  updatedAt: number;
}

export type DrawingTool = 'select' | 'brush' | 'pen' | 'rect' | 'circle' | 'eraser';

export type PathSmoothing = 'off' | 'low' | 'medium' | 'high';

export type SimplificationStrength = 'gentle' | 'balanced' | 'aggressive';

export type MobileViewTab = 'canvas' | 'glyphs' | 'tester';

