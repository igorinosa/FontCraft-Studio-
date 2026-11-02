import test from 'node:test';
import assert from 'node:assert/strict';
import {
  svgToFontCoord,
  fontToSvgCoord,
  flipPathYCoordinates,
  expandStrokeToOutline,
  simplifyPoints,
  simplifyGlyphContours,
  simplifySvgPathString,
  createRectContour,
  contourToSvgPath,
  generateSvgFontXml,
  generateStandaloneGlyphSvg,
  snapPointToGrid,
  parseSvgToGlyphPath,
  DEFAULT_FONT_METRICS,
} from './path-math';
import { FontProject, FontGlyph } from '../models/font.model';

test('svgToFontCoord and fontToSvgCoord invert accurately', () => {
  const ascender = 800;

  // Baseline at Y=800 in SVG space should be Y=0 in Font space
  const fontBaseline = svgToFontCoord(100, 800, ascender);
  assert.equal(fontBaseline.x, 100);
  assert.equal(fontBaseline.y, 0);

  // Ascender at Y=0 in SVG space should be Y=800 in Font space
  const fontAscender = svgToFontCoord(250, 0, ascender);
  assert.equal(fontAscender.x, 250);
  assert.equal(fontAscender.y, 800);

  // Inverting back
  const svgReverted = fontToSvgCoord(fontAscender.x, fontAscender.y, ascender);
  assert.equal(svgReverted.x, 250);
  assert.equal(svgReverted.y, 0);
});

test('flipPathYCoordinates correctly inverts vertical SVG path coordinates', () => {
  const ascender = 800;
  // Box in SVG: (100, 100) to (500, 700)
  const svgPath = 'M 100 100 L 500 100 L 500 700 L 100 700 Z';
  const flipped = flipPathYCoordinates(svgPath, ascender);

  // In font coords, Y=100 becomes 800-100=700; Y=700 becomes 800-700=100
  assert.ok(flipped.includes('M 100 700'));
  assert.ok(flipped.includes('L 500 700'));
  assert.ok(flipped.includes('L 500 100'));
  assert.ok(flipped.includes('L 100 100'));
});

test('expandStrokeToOutline generates valid closed SVG contour from stroke points', () => {
  const points = [
    { x: 100, y: 100 },
    { x: 100, y: 300 },
    { x: 300, y: 300 },
  ];
  const outline = expandStrokeToOutline(points, 20);
  assert.ok(outline.startsWith('M'));
  assert.ok(outline.endsWith('Z'));
  assert.ok(outline.includes('A 10 10')); // Semicircular end caps with radius 10
});

test('createRectContour produces valid rectangular path', () => {
  const rect = createRectContour(50, 100, 200, 400);
  assert.equal(rect.points.length, 4);
  const pathD = contourToSvgPath(rect);
  assert.ok(pathD.startsWith('M 50 100'));
  assert.ok(pathD.includes('L 250 100'));
  assert.ok(pathD.includes('L 250 500'));
  assert.ok(pathD.endsWith('Z'));
});

test('simplifyPoints reduces point count along straight lines', () => {
  const straightPoints = [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 100, y: 0 },
    { x: 150, y: 0 },
    { x: 200, y: 0 },
  ];
  const simplified = simplifyPoints(straightPoints, 1);
  assert.equal(simplified.length, 2);
  assert.equal(simplified[0].x, 0);
  assert.equal(simplified[1].x, 200);
});

test('generateSvgFontXml outputs valid SVG font XML structure', () => {
  const testGlyph: FontGlyph = {
    id: 'g_A',
    unicode: 'A',
    character: 'A',
    name: 'A',
    category: 'uppercase',
    metrics: { advanceWidth: 650, leftSideBearing: 50 },
    contours: [],
    svgPath: 'M 100 700 L 325 150 L 550 700 Z',
    isEmpty: false,
  };

  const project: FontProject = {
    id: 'proj_1',
    metadata: {
      familyName: 'Artisan Font',
      styleName: 'Regular',
      author: 'Designer',
      version: '1.0',
      description: 'Handcrafted font',
      copyright: 'Copyright 2026',
    },
    metrics: DEFAULT_FONT_METRICS,
    glyphs: { A: testGlyph },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const xml = generateSvgFontXml(project);
  assert.ok(xml.includes('<font id="artisan-font"'));
  assert.ok(xml.includes('font-family="Artisan Font"'));
  assert.ok(xml.includes('<glyph unicode="A" glyph-name="A" horiz-adv-x="650"'));
  assert.ok(xml.includes('</font>'));
  assert.ok(xml.includes('</svg>'));
});

test('generateStandaloneGlyphSvg outputs clean individual SVG file', () => {
  const glyph: FontGlyph = {
    id: 'g_B',
    unicode: 'B',
    character: 'B',
    name: 'B',
    category: 'uppercase',
    metrics: { advanceWidth: 600, leftSideBearing: 40 },
    contours: [],
    svgPath: 'M 50 100 L 250 100 Z',
    isEmpty: false,
  };
  const svg = generateStandaloneGlyphSvg(glyph, DEFAULT_FONT_METRICS);
  assert.ok(svg.includes('viewBox="0 0 600 1000"'));
  assert.ok(svg.includes('<path d="M 50 100 L 250 100 Z"'));
});

test('snapPointToGrid accurately aligns points to grid intervals', () => {
  // Grid size 50, near (102, 198) -> should snap to (100, 200)
  const result = snapPointToGrid(102, 198, 50, 10);
  assert.equal(result.x, 100);
  assert.equal(result.y, 200);
  assert.equal(result.snappedX, true);
  assert.equal(result.snappedY, true);

  // Far from grid (115, 185) -> should NOT snap with threshold 10
  const noSnap = snapPointToGrid(115, 185, 50, 10);
  assert.equal(noSnap.x, 115);
  assert.equal(noSnap.y, 185);
  assert.equal(noSnap.snappedX, false);
});

test('parseSvgToGlyphPath extracts valid path from raw SVG markup', () => {
  const rawSvg = '<svg viewBox="0 0 100 100"><path d="M 10 20 L 30 40 Z" fill="red"/></svg>';
  const parsed = parseSvgToGlyphPath(rawSvg);
  assert.equal(parsed, 'M 10 20 L 30 40 Z');

  const directPath = 'M 0 0 L 100 100 Z';
  assert.equal(parseSvgToGlyphPath(directPath), directPath);
});

test('simplifySvgPathString reduces redundant points and preserves path validity', () => {
  // A path with redundant points along a line: (0,0) -> (25,0) -> (50,0) -> (75,0) -> (100,0)
  const jaggedPath = 'M 0 0 L 25 0 L 50 0 L 75 0 L 100 0 L 100 100 Z';
  const result = simplifySvgPathString(jaggedPath, 2);

  assert.ok(result.simplifiedPath.startsWith('M 0 0'));
  assert.ok(result.simplifiedPath.includes('L 100 0'));
  assert.ok(result.simplifiedPath.endsWith('Z'));
  assert.ok(result.newPointCount < result.oldPointCount);
  assert.ok(result.percentReduced > 0);
});

test('simplifyGlyphContours reduces redundant contour nodes', () => {
  const contour = {
    id: 'c_test',
    points: [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 30, y: 10 },
      { x: 40, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 50 },
    ],
    closed: true,
    isFilled: true,
    type: 'bezier' as const,
  };

  const res = simplifyGlyphContours([contour], 2);
  assert.equal(res.contours.length, 1);
  assert.ok(res.newPointCount < res.oldPointCount);
  assert.equal(res.contours[0].points[0].x, 10);
  assert.equal(res.contours[0].points[res.contours[0].points.length - 1].y, 50);
});

test('generateSvgFontXml includes hkern kerning tags when kerning pairs are configured', () => {
  const project: FontProject = {
    id: 'proj_kern_test',
    metadata: {
      familyName: 'Kerning Font',
      styleName: 'Regular',
      author: 'Tester',
      version: '1.0',
      description: 'Font with kerning',
      copyright: '2026',
    },
    metrics: DEFAULT_FONT_METRICS,
    glyphs: {
      A: {
        id: 'g_A',
        unicode: 'A',
        character: 'A',
        name: 'A',
        category: 'uppercase',
        metrics: { advanceWidth: 700, leftSideBearing: 60 },
        contours: [],
        svgPath: 'M 100 700 L 350 150 L 600 700 Z',
        isEmpty: false,
      },
      V: {
        id: 'g_V',
        unicode: 'V',
        character: 'V',
        name: 'V',
        category: 'uppercase',
        metrics: { advanceWidth: 700, leftSideBearing: 60 },
        contours: [],
        svgPath: 'M 100 150 L 350 700 L 600 150 Z',
        isEmpty: false,
      },
    },
    kerning: {
      'AV': -80,
      'WA': -60,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const svgXml = generateSvgFontXml(project);
  assert.ok(svgXml.includes('<hkern u1="A" u2="V" k="80" />'));
  assert.ok(svgXml.includes('<hkern u1="W" u2="A" k="60" />'));
});
