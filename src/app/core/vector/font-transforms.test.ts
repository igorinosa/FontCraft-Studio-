import test from 'node:test';
import assert from 'node:assert/strict';
import { applySlantToSvgPath, applyStretchToSvgPath, deriveVariantGlyphs } from './font-transforms';
import { FontGlyph, FontVariant } from '../models/font.model';

test('applySlantToSvgPath shears points based on distance from baseline', () => {
  // Baseline is 800. At y=800, shear offset should be 0.
  // At y=0 (top), shear offset should be positive (slanted to the right).
  const path = 'M 100 800 L 100 0 Z';
  const slanted = applySlantToSvgPath(path, 15, 800);

  // y=800 point should remain at x=100
  assert.ok(slanted.includes('M 100 800'));
  // y=0 point should have x = 100 + 800 * tan(15 deg) ≈ 100 + 214 = 314
  assert.ok(slanted.includes('L 314 0') || slanted.includes('L 315 0'));
});

test('applyStretchToSvgPath horizontally condenses points towards originX', () => {
  // OriginX = 100, stretchFactor = 0.5
  // Point at x=300 becomes 100 + (300-100)*0.5 = 200
  const path = 'M 100 100 L 300 100 Z';
  const stretched = applyStretchToSvgPath(path, 0.5, 100);

  assert.ok(stretched.includes('M 100 100'));
  assert.ok(stretched.includes('L 200 100'));
});

test('deriveVariantGlyphs generates complete variant glyph set with adjusted metrics', () => {
  const baseGlyph: FontGlyph = {
    id: 'g_A',
    unicode: 'A',
    character: 'A',
    name: 'A',
    category: 'uppercase',
    metrics: { advanceWidth: 600, leftSideBearing: 60 },
    contours: [],
    svgPath: 'M 60 800 L 300 200 L 540 800 Z',
    isEmpty: false,
  };

  const italicVariant: FontVariant = {
    id: 'italic',
    name: 'Italic',
    weight: 400,
    isItalic: true,
    slantAngle: 12,
    widthStretch: 1.0,
    weightMultiplier: 1.0,
  };

  const variantDict = deriveVariantGlyphs({ A: baseGlyph }, italicVariant, 800);
  assert.ok(variantDict['A'], 'Glyph A should be present in variant');
  assert.equal(variantDict['A'].id, 'g_A_italic');
  assert.notEqual(variantDict['A'].svgPath, baseGlyph.svgPath, 'Path should be sheared');
  assert.equal(variantDict['A'].metrics.advanceWidth, 600);

  const condensedVariant: FontVariant = {
    id: 'condensed',
    name: 'Condensed',
    weight: 400,
    isItalic: false,
    slantAngle: 0,
    widthStretch: 0.8,
    weightMultiplier: 1.0,
  };

  const condensedDict = deriveVariantGlyphs({ A: baseGlyph }, condensedVariant, 800);
  assert.equal(condensedDict['A'].metrics.advanceWidth, 480, 'Advance width should be 600*0.8 = 480');
});
