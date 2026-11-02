import { FontGlyph, FontProject } from '../models/font.model';
import { DEFAULT_FONT_METRICS } from '../vector/path-math';

export interface FontPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  buildProject: () => FontProject;
}

// Helper to create basic glyphs
export function createDefaultGlyph(char: string, category: FontGlyph['category'], svgPath = '', advanceWidth = 600): FontGlyph {
  let name = char;
  if (char === ' ') name = 'space';
  else if (char === '.') name = 'period';
  else if (char === ',') name = 'comma';
  else if (char === '!') name = 'exclam';
  else if (char === '?') name = 'question';
  else if (char === '-') name = 'hyphen';
  else if (char === ':') name = 'colon';

  return {
    id: `g_${char.charCodeAt(0)}`,
    unicode: char,
    character: char,
    name,
    category,
    metrics: {
      advanceWidth,
      leftSideBearing: 60,
    },
    contours: [],
    svgPath,
    isEmpty: !svgPath,
  };
}

export const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  lowercase: 'abcdefghijklmnopqrstuvwxyz'.split(''),
  numbers: '0123456789'.split(''),
  punctuation: ['.', ',', '!', '?', ':', ';', '-', '"', "'", '(', ')', '/', '@', '#', '$', '%', '&', '*', '+', '='],
};

export const STANDARD_KERNING_PAIRS: Record<string, number> = {
  'AV': -70,
  'AW': -60,
  'AY': -65,
  'FA': -45,
  'LT': -55,
  'PA': -40,
  'Ta': -40,
  'Te': -40,
  'To': -45,
  'Tr': -35,
  'Tu': -30,
  'VA': -70,
  'Vo': -40,
  'WA': -60,
  'We': -35,
  'Wo': -40,
  'YA': -65,
  'Ye': -40,
  'Yo': -45,
};

export const DEFAULT_FONT_VARIANTS = [
  { id: 'regular', name: 'Regular', weight: 400, isItalic: false, slantAngle: 0, widthStretch: 1.0, weightMultiplier: 1.0 },
  { id: 'bold', name: 'Bold', weight: 700, isItalic: false, slantAngle: 0, widthStretch: 1.0, weightMultiplier: 1.5 },
  { id: 'light', name: 'Light', weight: 300, isItalic: false, slantAngle: 0, widthStretch: 1.0, weightMultiplier: 0.7 },
  { id: 'italic', name: 'Italic', weight: 400, isItalic: true, slantAngle: 12, widthStretch: 1.0, weightMultiplier: 1.0 },
  { id: 'condensed', name: 'Condensed', weight: 400, isItalic: false, slantAngle: 0, widthStretch: 0.82, weightMultiplier: 1.0 },
];

export const EXTENDED_ACCENT_CHARACTERS = [
  'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï',
  'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'ß',
  'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï',
  'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'ÿ'
];

export const EXTENDED_SYMBOLS = ['€', '£', '¥', '©', '®', '™', '•', '–', '—', '«', '»', '¿', '¡', '°', '±', '×', '÷', '√', '∞'];


/**
 * Builds standard starter glyph set for any font project
 */
export function buildBaseGlyphDictionary(): Record<string, FontGlyph> {
  const dict: Record<string, FontGlyph> = {};

  CHARACTER_SETS.uppercase.forEach((c) => {
    dict[c] = createDefaultGlyph(c, 'uppercase');
  });
  CHARACTER_SETS.lowercase.forEach((c) => {
    dict[c] = createDefaultGlyph(c, 'lowercase');
  });
  CHARACTER_SETS.numbers.forEach((c) => {
    dict[c] = createDefaultGlyph(c, 'numbers');
  });
  CHARACTER_SETS.punctuation.forEach((c) => {
    dict[c] = createDefaultGlyph(c, 'punctuation');
  });

  // Space glyph
  dict[' '] = createDefaultGlyph(' ', 'punctuation', '', 350);

  return dict;
}

/**
 * Preset 1: Casual Brush Sans
 * A warm, expressive font with organic rounded strokes
 */
export function buildCasualMarkerPreset(): FontProject {
  const glyphs = buildBaseGlyphDictionary();

  // Curated handcrafted SVG paths (in SVG space: 0 is top, 800 is baseline, 1000 is descender)
  // A: Left diagonal stroke, right diagonal stroke, crossbar
  glyphs['A'] = {
    ...glyphs['A'],
    svgPath: 'M 100 780 C 120 780 140 760 160 720 L 320 220 C 330 190 350 180 370 180 C 390 180 410 190 420 220 L 580 720 C 600 760 620 780 640 780 C 660 780 670 760 660 740 L 430 180 C 400 120 340 120 310 180 L 80 740 C 70 760 80 780 100 780 Z M 220 540 L 520 540 C 540 540 550 520 540 500 C 530 480 520 480 500 480 L 240 480 C 220 480 210 500 220 520 C 220 530 230 540 240 540 Z',
    isEmpty: false,
    metrics: { advanceWidth: 720, leftSideBearing: 70 },
  };

  // B: Vertical stem and two rounded bowls
  glyphs['B'] = {
    ...glyphs['B'],
    svgPath: 'M 120 780 L 120 160 C 120 140 140 130 160 130 L 360 130 C 460 130 520 180 520 270 C 520 340 470 390 400 410 C 490 430 560 490 560 590 C 560 710 470 780 340 780 L 160 780 C 140 780 120 770 120 780 Z M 180 430 L 340 430 C 420 430 460 380 460 300 C 460 220 420 190 340 190 L 180 190 Z M 180 720 L 340 720 C 430 720 490 670 490 580 C 490 490 430 450 340 450 L 180 450 Z',
    isEmpty: false,
    metrics: { advanceWidth: 640, leftSideBearing: 80 },
  };

  // C: Wide circular bowl open to the right
  glyphs['C'] = {
    ...glyphs['C'],
    svgPath: 'M 540 280 C 520 220 460 150 350 150 C 200 150 110 270 110 460 C 110 650 210 770 360 770 C 470 770 540 700 560 640 C 570 610 550 590 530 590 C 510 590 490 600 480 620 C 460 660 420 710 350 710 C 240 710 180 610 180 460 C 180 310 240 210 350 210 C 420 210 470 250 490 300 C 500 320 520 330 540 330 C 560 330 570 310 560 290 Z',
    isEmpty: false,
    metrics: { advanceWidth: 640, leftSideBearing: 70 },
  };

  // D: Left stem and large smooth bowl
  glyphs['D'] = {
    ...glyphs['D'],
    svgPath: 'M 130 780 L 130 160 C 130 135 150 130 170 130 L 340 130 C 500 130 600 240 600 450 C 600 660 490 780 330 780 L 170 780 C 150 780 130 770 130 780 Z M 190 720 L 330 720 C 450 720 530 630 530 450 C 530 280 450 190 330 190 L 190 190 Z',
    isEmpty: false,
    metrics: { advanceWidth: 680, leftSideBearing: 80 },
  };

  // E: Stem and 3 horizontal arms
  glyphs['E'] = {
    ...glyphs['E'],
    svgPath: 'M 140 780 L 140 160 C 140 135 160 130 180 130 L 520 130 C 545 130 560 145 560 165 C 560 185 545 200 520 200 L 210 200 L 210 410 L 460 410 C 480 410 495 425 495 445 C 495 465 480 480 460 480 L 210 480 L 210 710 L 530 710 C 555 710 570 725 570 745 C 570 765 555 780 530 780 L 180 780 C 160 780 140 770 140 780 Z',
    isEmpty: false,
    metrics: { advanceWidth: 620, leftSideBearing: 80 },
  };

  // F: Stem and top 2 arms
  glyphs['F'] = {
    ...glyphs['F'],
    svgPath: 'M 140 780 L 140 160 C 140 135 160 130 180 130 L 520 130 C 545 130 560 145 560 165 C 560 185 545 200 520 200 L 210 200 L 210 410 L 450 410 C 470 410 485 425 485 445 C 485 465 470 480 450 480 L 210 480 L 210 745 C 210 765 195 780 175 780 C 155 780 140 765 140 745 Z',
    isEmpty: false,
    metrics: { advanceWidth: 580, leftSideBearing: 80 },
  };

  // G: Circular with an inner shelf
  glyphs['G'] = {
    ...glyphs['G'],
    svgPath: 'M 540 280 C 520 220 460 150 350 150 C 200 150 110 270 110 460 C 110 650 210 770 360 770 C 480 770 560 690 570 570 L 570 480 C 570 460 550 450 530 450 L 360 450 C 340 450 330 465 330 485 C 330 505 340 520 360 520 L 500 520 L 500 560 C 490 650 440 705 355 705 C 240 705 180 610 180 460 C 180 310 245 215 350 215 C 420 215 470 255 490 300 C 500 320 520 330 540 330 C 560 330 570 310 560 290 Z',
    isEmpty: false,
    metrics: { advanceWidth: 660, leftSideBearing: 70 },
  };

  // H: Two vertical stems and crossbar
  glyphs['H'] = {
    ...glyphs['H'],
    svgPath: 'M 140 780 L 140 160 C 140 135 155 125 175 125 C 195 125 210 135 210 160 L 210 410 L 490 410 L 490 160 C 490 135 505 125 525 125 C 545 125 560 135 560 160 L 560 750 C 560 770 545 780 525 780 C 505 780 490 770 490 750 L 490 480 L 210 480 L 210 750 C 210 770 195 780 175 780 C 155 780 140 770 140 750 Z',
    isEmpty: false,
    metrics: { advanceWidth: 680, leftSideBearing: 80 },
  };

  // I: Central stem
  glyphs['I'] = {
    ...glyphs['I'],
    svgPath: 'M 140 160 L 360 160 C 375 160 390 145 390 130 C 390 115 375 100 360 100 L 140 100 C 125 100 110 115 110 130 C 110 145 125 160 140 160 Z M 215 720 L 215 160 L 285 160 L 285 720 Z M 140 780 L 360 780 C 375 780 390 765 390 750 C 390 735 375 720 360 720 L 140 720 C 125 720 110 735 110 750 C 110 765 125 780 140 780 Z',
    isEmpty: false,
    metrics: { advanceWidth: 420, leftSideBearing: 70 },
  };

  // L: Vertical stem and bottom foot
  glyphs['L'] = {
    ...glyphs['L'],
    svgPath: 'M 140 780 L 140 160 C 140 135 155 125 175 125 C 195 125 210 135 210 160 L 210 710 L 480 710 C 505 710 520 725 520 745 C 520 765 505 780 480 780 L 175 780 C 155 780 140 770 140 780 Z',
    isEmpty: false,
    metrics: { advanceWidth: 560, leftSideBearing: 80 },
  };

  // O: Smooth oval
  glyphs['O'] = {
    ...glyphs['O'],
    svgPath: 'M 350 140 C 490 140 590 260 590 460 C 590 660 490 780 350 780 C 210 780 110 660 110 460 C 110 260 210 140 350 140 Z M 350 215 C 255 215 185 315 185 460 C 185 605 255 705 350 705 C 445 705 515 605 515 460 C 515 315 445 215 350 215 Z',
    isEmpty: false,
    metrics: { advanceWidth: 700, leftSideBearing: 70 },
  };

  // T: Top horizontal bar and central stem
  glyphs['T'] = {
    ...glyphs['T'],
    svgPath: 'M 80 170 L 540 170 C 560 170 575 155 575 135 C 575 115 560 100 540 100 L 80 100 C 60 100 45 115 45 135 C 45 155 60 170 80 170 Z M 275 750 L 275 170 L 345 170 L 345 750 C 345 770 330 780 310 780 C 290 780 275 770 275 750 Z',
    isEmpty: false,
    metrics: { advanceWidth: 620, leftSideBearing: 45 },
  };

  // U: Wide cup shape
  glyphs['U'] = {
    ...glyphs['U'],
    svgPath: 'M 140 160 L 140 550 C 140 680 230 780 360 780 C 490 780 580 680 580 550 L 580 160 C 580 135 565 125 545 125 C 525 125 510 135 510 160 L 510 540 C 510 640 445 710 360 710 C 275 710 210 640 210 540 L 210 160 C 210 135 195 125 175 125 C 155 125 140 135 140 160 Z',
    isEmpty: false,
    metrics: { advanceWidth: 700, leftSideBearing: 80 },
  };

  // Numbers 0, 1, 7, 8
  glyphs['0'] = {
    ...glyphs['0'],
    svgPath: 'M 300 150 C 430 150 510 260 510 460 C 510 660 430 770 300 770 C 170 770 90 660 90 460 C 90 260 170 150 300 150 Z M 300 220 C 215 220 160 315 160 460 C 160 605 215 700 300 700 C 385 700 440 605 440 460 C 440 315 385 220 300 220 Z',
    isEmpty: false,
    metrics: { advanceWidth: 600, leftSideBearing: 60 },
  };

  glyphs['1'] = {
    ...glyphs['1'],
    svgPath: 'M 150 250 L 260 160 L 260 750 C 260 770 275 780 295 780 C 315 780 330 770 330 750 L 330 140 C 330 120 310 110 290 110 C 275 110 260 120 245 130 L 125 220 C 110 230 105 250 115 265 C 125 280 140 280 150 250 Z M 160 780 L 440 780 C 460 780 475 765 475 750 C 475 735 460 720 440 720 L 160 720 C 140 720 125 735 125 750 C 125 765 140 780 160 780 Z',
    isEmpty: false,
    metrics: { advanceWidth: 540, leftSideBearing: 60 },
  };

  // Lowercase a, c, e, o
  glyphs['o'] = {
    ...glyphs['o'],
    svgPath: 'M 280 350 C 380 350 460 430 460 560 C 460 690 380 770 280 770 C 180 770 100 690 100 560 C 100 430 180 350 280 350 Z M 280 415 C 220 415 170 475 170 560 C 170 645 220 705 280 705 C 340 705 390 645 390 560 C 390 475 340 415 280 415 Z',
    isEmpty: false,
    metrics: { advanceWidth: 560, leftSideBearing: 60 },
  };

  // Exclamation !
  glyphs['!'] = {
    ...glyphs['!'],
    svgPath: 'M 170 140 L 170 520 C 170 540 185 550 205 550 C 225 550 240 540 240 520 L 240 140 C 240 120 225 110 205 110 C 185 110 170 120 170 140 Z M 170 730 C 170 710 185 690 205 690 C 225 690 240 710 240 730 C 240 750 225 770 205 770 C 185 770 170 750 170 730 Z',
    isEmpty: false,
    metrics: { advanceWidth: 410, leftSideBearing: 60 },
  };

  // Heart symbol / Punctuation
  glyphs['?'] = {
    ...glyphs['?'],
    svgPath: 'M 140 230 C 150 150 220 110 310 110 C 400 110 470 160 470 240 C 470 310 420 360 360 410 C 310 450 280 490 280 550 C 280 570 295 580 315 580 C 335 580 350 570 350 550 C 350 510 380 480 420 440 C 480 390 540 330 540 240 C 540 120 440 40 310 40 C 180 40 80 120 70 230 C 65 250 85 270 105 270 C 125 270 135 250 140 230 Z M 280 730 C 280 710 295 690 315 690 C 335 690 350 710 350 730 C 350 750 335 770 315 770 C 295 770 280 750 280 730 Z',
    isEmpty: false,
    metrics: { advanceWidth: 580, leftSideBearing: 60 },
  };

  return {
    id: 'proj_casual_brush',
    metadata: {
      familyName: 'Casual Brush Sans',
      styleName: 'Medium',
      author: 'Studio Craft',
      version: '1.0',
      description: 'A contemporary, fluid brush font with organic curves and modern rhythm.',
      copyright: 'Open Typography License 2026',
    },
    metrics: DEFAULT_FONT_METRICS,
    glyphs,
    kerning: { ...STANDARD_KERNING_PAIRS },
    variants: [...DEFAULT_FONT_VARIANTS],
    activeVariantId: 'regular',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Preset 2: Geometric Minimal Sans
 */
export function buildGeometricPreset(): FontProject {
  const glyphs = buildBaseGlyphDictionary();

  // I: Clean bar
  glyphs['I'] = {
    ...glyphs['I'],
    svgPath: 'M 200 140 L 280 140 L 280 760 L 200 760 Z',
    isEmpty: false,
    metrics: { advanceWidth: 480, leftSideBearing: 60 },
  };

  // L: Clean 90-degree angle
  glyphs['L'] = {
    ...glyphs['L'],
    svgPath: 'M 140 140 L 220 140 L 220 680 L 500 680 L 500 760 L 140 760 Z',
    isEmpty: false,
    metrics: { advanceWidth: 580, leftSideBearing: 60 },
  };

  // O: Pure geometric circle
  glyphs['O'] = {
    ...glyphs['O'],
    svgPath: 'M 350 140 A 310 310 0 1 0 350 760 A 310 310 0 1 0 350 140 Z M 350 220 A 230 230 0 1 1 350 680 A 230 230 0 1 1 350 220 Z',
    isEmpty: false,
    metrics: { advanceWidth: 700, leftSideBearing: 60 },
  };

  // C: Clean geometric open arc
  glyphs['C'] = {
    ...glyphs['C'],
    svgPath: 'M 540 260 A 310 310 0 1 0 540 640 L 480 580 A 230 230 0 1 1 480 320 Z',
    isEmpty: false,
    metrics: { advanceWidth: 640, leftSideBearing: 60 },
  };

  // T: Clean geometric T
  glyphs['T'] = {
    ...glyphs['T'],
    svgPath: 'M 80 140 L 540 140 L 540 220 L 350 220 L 350 760 L 270 760 L 270 220 L 80 220 Z',
    isEmpty: false,
    metrics: { advanceWidth: 620, leftSideBearing: 60 },
  };

  return {
    id: 'proj_geometric_sans',
    metadata: {
      familyName: 'Modern Geometric Sans',
      styleName: 'Bold',
      author: 'Studio Craft',
      version: '1.0',
      description: 'Crisp, contemporary geometric typography crafted with pure vectors.',
      copyright: 'Open Studio License 2026',
    },
    metrics: DEFAULT_FONT_METRICS,
    glyphs,
    kerning: { ...STANDARD_KERNING_PAIRS },
    variants: [...DEFAULT_FONT_VARIANTS],
    activeVariantId: 'regular',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Preset 3: Blank Canvas (Starting fresh with guides)
 */
export function buildBlankProject(name = 'My Custom Font'): FontProject {
  const glyphs = buildBaseGlyphDictionary();
  return {
    id: 'proj_' + Math.random().toString(36).substring(2, 9),
    metadata: {
      familyName: name,
      styleName: 'Regular',
      author: 'Designer',
      version: '1.0',
      description: 'Handcrafted custom vector font',
      copyright: 'Creative Commons 2026',
    },
    metrics: DEFAULT_FONT_METRICS,
    glyphs,
    kerning: {},
    variants: [...DEFAULT_FONT_VARIANTS],
    activeVariantId: 'regular',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const PRESET_LIST: FontPreset[] = [
  {
    id: 'casual_marker',
    name: 'Casual Brush Sans',
    tagline: 'Warm & organic hand-crafted letterforms',
    description: 'Pre-populated with fluid, expressive glyphs ideal for logos, branding, and packaging.',
    icon: 'brush',
    buildProject: buildCasualMarkerPreset,
  },
  {
    id: 'geometric_sans',
    name: 'Modern Geometric Sans',
    tagline: 'Clean, bold, and architectural',
    description: 'Perfect circles and clean angles for minimalist logos, posters, and headlines.',
    icon: 'architecture',
    buildProject: buildGeometricPreset,
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    tagline: 'Start completely fresh',
    description: 'A clean slate with tracing guides and letter metrics ready for your imagination.',
    icon: 'draw',
    buildProject: () => buildBlankProject(),
  },
];
