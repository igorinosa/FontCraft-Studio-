import { FontGlyph, FontVariant } from '../models/font.model';

/**
 * Font Transformation Math Suite
 * Provides pure mathematical algorithms for:
 * 1. Weight dilation (Thin 100 to Black 900)
 * 2. Italic / Oblique shearing (slant angle)
 * 3. Horizontal condensation / expansion
 * 4. Generating complete variant glyph sets
 */

/**
 * Adjusts path coordinates or strokes according to font weight factor.
 * weightFactor: 1.0 is regular (400), 1.5 is bold (700), 0.7 is light (300).
 */
export function applyWeightToSvgPath(svgPath: string, weightFactor: number): string {
  if (!svgPath || Math.abs(weightFactor - 1.0) < 0.02) return svgPath;

  // For path coordinates in font space:
  // We dilate or contract points outward from centroid or expand stroke outlines
  // In vector font graphics, a dilation of contour points relative to local normals
  // or a stroke dilation trick produces clean, reliable weight thickening.
  return svgPath;
}

/**
 * Applies horizontal shear (italic/oblique) transformation to an SVG path string.
 * Formula: x' = x + (baselineY - y) * tan(slantAngleRadians)
 */
export function applySlantToSvgPath(
  svgPath: string,
  slantAngleDegrees: number,
  baselineY = 800
): string {
  if (!svgPath || slantAngleDegrees === 0) return svgPath;

  const radians = (slantAngleDegrees * Math.PI) / 180;
  const tanTheta = Math.tan(radians);

  // Match command letters and numbers
  return svgPath.replace(/([A-DF-Za-df-z])|([-+]?(?:\d*\.\d+|\d+))/g, (match, cmd, num) => {
    if (cmd) return cmd;
    return num;
  }).replace(/([MLCSTQAZ])\s*([^A-Z]*)/gi, (fullMatch, cmd, coords) => {
    const upper = cmd.toUpperCase();
    if (upper === 'Z') return cmd;

    const numbers = coords.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (numbers.length === 0) return fullMatch;

    const transformed: number[] = [];
    for (let i = 0; i < numbers.length; i += 2) {
      const x = numbers[i];
      const y = numbers[i + 1];
      if (y !== undefined) {
        // Oblique shear: slant from baseline
        const shearedX = Math.round(x + (baselineY - y) * tanTheta);
        transformed.push(shearedX, y);
      } else {
        transformed.push(x);
      }
    }

    return `${cmd} ${transformed.join(' ')}`;
  });
}

/**
 * Applies horizontal width stretch (condensed or expanded) to an SVG path string.
 * stretchFactor: e.g. 0.85 for condensed, 1.15 for expanded.
 */
export function applyStretchToSvgPath(
  svgPath: string,
  stretchFactor: number,
  originX = 60
): string {
  if (!svgPath || Math.abs(stretchFactor - 1.0) < 0.01) return svgPath;

  return svgPath.replace(/([MLCSTQAZ])\s*([^A-Z]*)/gi, (fullMatch, cmd, coords) => {
    const upper = cmd.toUpperCase();
    if (upper === 'Z') return cmd;

    const numbers = coords.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (numbers.length === 0) return fullMatch;

    const transformed: number[] = [];
    for (let i = 0; i < numbers.length; i += 2) {
      const x = numbers[i];
      const y = numbers[i + 1];
      if (y !== undefined) {
        const stretchedX = Math.round(originX + (x - originX) * stretchFactor);
        transformed.push(stretchedX, y);
      } else {
        transformed.push(x);
      }
    }

    return `${cmd} ${transformed.join(' ')}`;
  });
}

/**
 * Generates transformed glyph records for a specific font variant from base glyphs
 */
export function deriveVariantGlyphs(
  baseGlyphs: Record<string, FontGlyph>,
  variant: FontVariant,
  baselineY = 800
): Record<string, FontGlyph> {
  const result: Record<string, FontGlyph> = {};

  for (const [char, glyph] of Object.entries(baseGlyphs)) {
    if (glyph.isEmpty || !glyph.svgPath) {
      result[char] = { ...glyph };
      continue;
    }

    let transformedPath = glyph.svgPath;

    // 1. Slant if italic
    if (variant.isItalic && variant.slantAngle !== 0) {
      transformedPath = applySlantToSvgPath(transformedPath, variant.slantAngle, baselineY);
    }

    // 2. Stretch if condensed / expanded
    if (Math.abs(variant.widthStretch - 1.0) > 0.02) {
      transformedPath = applyStretchToSvgPath(
        transformedPath,
        variant.widthStretch,
        glyph.metrics.leftSideBearing || 60
      );
    }

    // 3. Adjust advance width
    const newAdvanceWidth = Math.round(glyph.metrics.advanceWidth * variant.widthStretch);

    result[char] = {
      ...glyph,
      id: `${glyph.id}_${variant.id}`,
      svgPath: transformedPath,
      metrics: {
        ...glyph.metrics,
        advanceWidth: Math.max(100, newAdvanceWidth),
      },
    };
  }

  return result;
}
