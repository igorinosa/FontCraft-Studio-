import { FontGlyph, FontMetrics, FontProject, PathContour, VectorPoint } from '../models/font.model';

export const DEFAULT_FONT_METRICS: FontMetrics = {
  unitsPerEm: 1000,
  ascender: 800,
  capHeight: 700,
  xHeight: 500,
  baseline: 0,
  descender: -200,
};

/**
 * Converts screen/canvas SVG coordinates (Y down, 0 at top) to Font coordinates (Y up, 0 at baseline).
 */
export function svgToFontCoord(x: number, y: number, ascender = 800): { x: number; y: number } {
  return {
    x: Math.round(x),
    y: Math.round(ascender - y),
  };
}

/**
 * Converts Font coordinates (Y up, 0 at baseline) to screen/canvas SVG coordinates (Y down, 0 at top).
 */
export function fontToSvgCoord(x: number, y: number, ascender = 800): { x: number; y: number } {
  return {
    x: Math.round(x),
    y: Math.round(ascender - y),
  };
}

/**
 * Distance between two 2D points
 */
export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

/**
 * Ramer-Douglas-Peucker simplification algorithm for smoothing strokes
 */
export function simplifyPoints(points: { x: number; y: number }[], tolerance = 2): { x: number; y: number }[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, index + 1), tolerance);
    const right = simplifyPoints(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }

  return [start, end];
}

function perpendicularDistance(
  p: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const mag = Math.hypot(dx, dy);
  if (mag === 0) return distance(p, p1);
  return Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / mag;
}

/**
 * Expands a 2D stroke polyline into a solid closed outline contour (with rounded caps).
 * This allows freehand brush strokes to become true filled font vector contours!
 * smoothingTolerance: 0 (raw points), 1.5 (default medium), 4 (high smooth), 8 (ultra smooth)
 */
export function expandStrokeToOutline(
  rawPoints: { x: number; y: number }[],
  strokeWidth: number,
  smoothingTolerance = 1.5
): string {
  if (rawPoints.length < 2) {
    if (rawPoints.length === 1) {
      // Single dot -> circular contour
      const p = rawPoints[0];
      const r = strokeWidth / 2;
      return `M ${p.x - r} ${p.y} A ${r} ${r} 0 1 0 ${p.x + r} ${p.y} A ${r} ${r} 0 1 0 ${p.x - r} ${p.y} Z`;
    }
    return '';
  }

  const points = smoothingTolerance > 0 ? simplifyPoints(rawPoints, smoothingTolerance) : rawPoints;
  const radius = Math.max(2, strokeWidth / 2);
  const leftSide: { x: number; y: number }[] = [];
  const rightSide: { x: number; y: number }[] = [];

  for (let i = 0; i < points.length; i++) {
    let nx = 0;
    let ny = 0;

    if (i === 0) {
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else if (i === points.length - 1) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else {
      const dx1 = points[i].x - points[i - 1].x;
      const dy1 = points[i].y - points[i - 1].y;
      const len1 = Math.hypot(dx1, dy1) || 1;

      const dx2 = points[i + 1].x - points[i].x;
      const dy2 = points[i + 1].y - points[i].y;
      const len2 = Math.hypot(dx2, dy2) || 1;

      const mx = -(dy1 / len1 + dy2 / len2) / 2;
      const my = (dx1 / len1 + dx2 / len2) / 2;
      const mlen = Math.hypot(mx, my) || 1;
      nx = mx / mlen;
      ny = my / mlen;
    }

    leftSide.push({
      x: Number((points[i].x + nx * radius).toFixed(2)),
      y: Number((points[i].y + ny * radius).toFixed(2)),
    });
    rightSide.push({
      x: Number((points[i].x - nx * radius).toFixed(2)),
      y: Number((points[i].y - ny * radius).toFixed(2)),
    });
  }

  // Build closed path:
  // Start at leftSide[0], trace leftSide to end, round cap at end, trace rightSide back, round cap at start
  const parts: string[] = [];
  parts.push(`M ${leftSide[0].x} ${leftSide[0].y}`);

  for (let i = 1; i < leftSide.length; i++) {
    parts.push(`L ${leftSide[i].x} ${leftSide[i].y}`);
  }

  // End cap (semicircle to rightSide[last])
  const lastRight = rightSide[rightSide.length - 1];
  parts.push(`A ${radius} ${radius} 0 0 1 ${lastRight.x} ${lastRight.y}`);

  for (let i = rightSide.length - 2; i >= 0; i--) {
    parts.push(`L ${rightSide[i].x} ${rightSide[i].y}`);
  }

  // Start cap (semicircle back to leftSide[0])
  parts.push(`A ${radius} ${radius} 0 0 1 ${leftSide[0].x} ${leftSide[0].y}`);
  parts.push('Z');

  return parts.join(' ');
}

/**
 * Converts a PathContour (points & bezier handles) into an SVG path string in SVG space.
 */
export function contourToSvgPath(contour: PathContour): string {
  if (contour.cachedSvgPath && contour.points.length === 0) {
    return contour.cachedSvgPath;
  }
  if (!contour.points || contour.points.length === 0) return '';

  if (contour.type === 'stroke' && contour.strokeWidth) {
    return expandStrokeToOutline(contour.points, contour.strokeWidth);
  }

  const pts = contour.points;
  const parts: string[] = [];
  parts.push(`M ${pts[0].x} ${pts[0].y}`);

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];

    if (prev.handleOut || curr.handleIn) {
      const cp1x = prev.handleOut ? prev.handleOut.x : prev.x;
      const cp1y = prev.handleOut ? prev.handleOut.y : prev.y;
      const cp2x = curr.handleIn ? curr.handleIn.x : curr.x;
      const cp2y = curr.handleIn ? curr.handleIn.y : curr.y;
      parts.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`);
    } else {
      parts.push(`L ${curr.x} ${curr.y}`);
    }
  }

  if (contour.closed && pts.length > 2) {
    const last = pts[pts.length - 1];
    const first = pts[0];
    if (last.handleOut || first.handleIn) {
      const cp1x = last.handleOut ? last.handleOut.x : last.x;
      const cp1y = last.handleOut ? last.handleOut.y : last.y;
      const cp2x = first.handleIn ? first.handleIn.x : first.x;
      const cp2y = first.handleIn ? first.handleIn.y : first.y;
      parts.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${first.x} ${first.y}`);
    }
    parts.push('Z');
  }

  return parts.join(' ');
}

/**
 * Creates a rectangle contour
 */
export function createRectContour(x: number, y: number, width: number, height: number): PathContour {
  const points: VectorPoint[] = [
    { x, y, type: 'corner' },
    { x: x + width, y, type: 'corner' },
    { x: x + width, y: y + height, type: 'corner' },
    { x, y: y + height, type: 'corner' },
  ];
  return {
    id: 'c_' + Math.random().toString(36).substring(2, 9),
    points,
    closed: true,
    isFilled: true,
    type: 'shape',
    shapeKind: 'rect',
  };
}

/**
 * Creates an ellipse/circle contour with 4 cubic bezier segments (kappa = 0.5522847498)
 */
export function createCircleContour(cx: number, cy: number, rx: number, ry: number): PathContour {
  const kappa = 0.5522847498;
  const ox = rx * kappa;
  const oy = ry * kappa;

  const points: VectorPoint[] = [
    // Top
    {
      x: cx,
      y: cy - ry,
      type: 'smooth',
      handleIn: { x: cx - ox, y: cy - ry },
      handleOut: { x: cx + ox, y: cy - ry },
    },
    // Right
    {
      x: cx + rx,
      y: cy,
      type: 'smooth',
      handleIn: { x: cx + rx, y: cy - oy },
      handleOut: { x: cx + rx, y: cy + oy },
    },
    // Bottom
    {
      x: cx,
      y: cy + ry,
      type: 'smooth',
      handleIn: { x: cx + ox, y: cy + ry },
      handleOut: { x: cx - ox, y: cy + ry },
    },
    // Left
    {
      x: cx - rx,
      y: cy,
      type: 'smooth',
      handleIn: { x: cx - rx, y: cy + oy },
      handleOut: { x: cx - rx, y: cy - oy },
    },
  ];

  return {
    id: 'c_' + Math.random().toString(36).substring(2, 9),
    points,
    closed: true,
    isFilled: true,
    type: 'shape',
    shapeKind: 'circle',
  };
}

/**
 * Parses SVG path `d` string and converts Y coordinates between SVG space (0 at top)
 * and Font space (0 at baseline, Y up).
 * `svgY = ascender - fontY` <=> `fontY = ascender - svgY`.
 */
export function flipPathYCoordinates(pathD: string, ascender = 800): string {
  if (!pathD) return '';

  // Tokenize SVG path commands and numbers
  // Matches command letters M, m, L, l, C, c, S, s, Q, q, T, t, A, a, Z, z and floating point numbers
  const tokens = pathD.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi);
  if (!tokens) return pathD;

  const result: string[] = [];
  let currentCmd = '';

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[a-z]$/i.test(token)) {
      currentCmd = token;
      result.push(token);
      i++;
    } else {
      // Coordinate numbers
      switch (currentCmd) {
        case 'M':
        case 'L':
        case 'T': {
          const x = Number(token);
          const y = Number(tokens[i + 1]);
          result.push(x.toString(), (ascender - y).toString());
          i += 2;
          break;
        }
        case 'm':
        case 'l':
        case 't': {
          const dx = Number(token);
          const dy = Number(tokens[i + 1]);
          // Relative coordinates: delta Y is inverted
          result.push(dx.toString(), (-dy).toString());
          i += 2;
          break;
        }
        case 'C': {
          const x1 = Number(token);
          const y1 = Number(tokens[i + 1]);
          const x2 = Number(tokens[i + 2]);
          const y2 = Number(tokens[i + 3]);
          const x = Number(tokens[i + 4]);
          const y = Number(tokens[i + 5]);
          result.push(
            x1.toString(),
            (ascender - y1).toString(),
            x2.toString(),
            (ascender - y2).toString(),
            x.toString(),
            (ascender - y).toString()
          );
          i += 6;
          break;
        }
        case 'c': {
          const dx1 = Number(token);
          const dy1 = Number(tokens[i + 1]);
          const dx2 = Number(tokens[i + 2]);
          const dy2 = Number(tokens[i + 3]);
          const dx = Number(tokens[i + 4]);
          const dy = Number(tokens[i + 5]);
          result.push(
            dx1.toString(),
            (-dy1).toString(),
            dx2.toString(),
            (-dy2).toString(),
            dx.toString(),
            (-dy).toString()
          );
          i += 6;
          break;
        }
        case 'S':
        case 'Q': {
          const x1 = Number(token);
          const y1 = Number(tokens[i + 1]);
          const x = Number(tokens[i + 2]);
          const y = Number(tokens[i + 3]);
          result.push(x1.toString(), (ascender - y1).toString(), x.toString(), (ascender - y).toString());
          i += 4;
          break;
        }
        case 's':
        case 'q': {
          const dx1 = Number(token);
          const dy1 = Number(tokens[i + 1]);
          const dx = Number(tokens[i + 2]);
          const dy = Number(tokens[i + 3]);
          result.push(dx1.toString(), (-dy1).toString(), dx.toString(), (-dy).toString());
          i += 4;
          break;
        }
        case 'A': {
          const rx = Number(token);
          const ry = Number(tokens[i + 1]);
          const rot = Number(tokens[i + 2]);
          const largeArc = Number(tokens[i + 3]);
          // Sweep flag inverts because Y is flipped
          const sweep = Number(tokens[i + 4]) === 0 ? 1 : 0;
          const x = Number(tokens[i + 5]);
          const y = Number(tokens[i + 6]);
          result.push(
            rx.toString(),
            ry.toString(),
            rot.toString(),
            largeArc.toString(),
            sweep.toString(),
            x.toString(),
            (ascender - y).toString()
          );
          i += 7;
          break;
        }
        case 'Z':
        case 'z': {
          i++;
          break;
        }
        default: {
          result.push(token);
          i++;
          break;
        }
      }
    }
  }

  return result.join(' ');
}

/**
 * Combines all contours in a glyph into a single SVG path string
 */
export function combineContoursSvgPath(contours: PathContour[]): string {
  return contours
    .map((c) => contourToSvgPath(c))
    .filter((p) => Boolean(p && p.trim().length > 0))
    .join(' ');
}

/**
 * Computes bounding box of a list of points
 */
export function computePointsBBox(points: { x: number; y: number }[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Generates an SVG Font file format (.svg font) compliant with W3C SVG 1.1 Specification
 */
export function generateSvgFontXml(project: FontProject): string {
  const { metadata, metrics, glyphs } = project;
  const familyId = metadata.familyName.replace(/\s+/g, '-').toLowerCase();

  let glyphTags = '';
  // Sort glyphs by character code
  const glyphList = Object.values(glyphs);

  for (const g of glyphList) {
    if (g.isEmpty || !g.svgPath) continue;

    // In SVG Font format, paths are in Font Coordinate space (Y points UP, 0 is baseline)
    const fontSpacePath = flipPathYCoordinates(g.svgPath, metrics.ascender);
    const unicodeAttr = escapeXml(g.character);
    const nameAttr = escapeXml(g.name);
    const advX = g.metrics.advanceWidth;

    glyphTags += `    <glyph unicode="${unicodeAttr}" glyph-name="${nameAttr}" horiz-adv-x="${advX}" d="${fontSpacePath}" />\n`;
  }

  let hkernTags = '';
  if (project.kerning) {
    for (const [pair, offset] of Object.entries(project.kerning)) {
      if (pair.length === 2 && offset !== 0) {
        // In SVG Font specification, k is reduction in advance width
        const k = -offset;
        hkernTags += `    <hkern u1="${escapeXml(pair[0])}" u2="${escapeXml(pair[1])}" k="${k}" />\n`;
      }
    }
  }

  return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
<svg xmlns="http://www.w3.org/2000/svg">
<metadata>
  <![CDATA[
    Family: ${metadata.familyName}
    Style: ${metadata.styleName}
    Author: ${metadata.author}
    Version: ${metadata.version}
    Description: ${metadata.description}
  ]]>
</metadata>
<defs>
  <font id="${familyId}" horiz-adv-x="${metrics.unitsPerEm}">
    <font-face
      font-family="${escapeXml(metadata.familyName)}"
      font-weight="400"
      font-style="normal"
      units-per-em="${metrics.unitsPerEm}"
      cap-height="${metrics.capHeight}"
      x-height="${metrics.xHeight}"
      ascent="${metrics.ascender}"
      descent="${metrics.descender}"
      alphabetic="0" />
    <missing-glyph horiz-adv-x="500" d="M 50 0 L 450 0 L 450 700 L 50 700 Z M 100 50 L 100 650 L 400 650 L 400 50 Z" />
${glyphTags}${hkernTags}  </font>
</defs>
</svg>`;
}

export interface SimplificationResult {
  simplifiedPath: string;
  simplifiedContours?: PathContour[];
  oldPointCount: number;
  newPointCount: number;
  percentReduced: number;
}

/**
 * Simplifies a glyph's vector contours and SVG path using Douglas-Peucker algorithm,
 * removing redundant/jittery nodes and optimizing font file size.
 */
export function simplifyGlyphContours(
  contours: PathContour[],
  tolerance = 3
): { contours: PathContour[]; oldPointCount: number; newPointCount: number } {
  let oldPointCount = 0;
  let newPointCount = 0;

  const newContours: PathContour[] = contours.map((contour) => {
    oldPointCount += contour.points.length;
    if (contour.points.length <= 3) {
      newPointCount += contour.points.length;
      return contour;
    }

    const simplifiedPoints = simplifyPoints(contour.points, tolerance);
    newPointCount += simplifiedPoints.length;

    return {
      ...contour,
      points: simplifiedPoints.map((pt) => ({
        x: Number(pt.x.toFixed(2)),
        y: Number(pt.y.toFixed(2)),
        type: 'corner',
      })),
      cachedSvgPath: undefined,
    };
  });

  return {
    contours: newContours,
    oldPointCount,
    newPointCount,
  };
}

/**
 * Simplifies an arbitrary SVG path string by parsing subpaths and reducing redundant vertices.
 */
export function simplifySvgPathString(
  pathD: string,
  tolerance = 3
): SimplificationResult {
  if (!pathD || !pathD.trim()) {
    return {
      simplifiedPath: '',
      oldPointCount: 0,
      newPointCount: 0,
      percentReduced: 0,
    };
  }

  // Tokenize commands and coordinates
  const tokens = pathD.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi);
  if (!tokens || tokens.length === 0) {
    return {
      simplifiedPath: pathD,
      oldPointCount: 0,
      newPointCount: 0,
      percentReduced: 0,
    };
  }

  let totalOldPoints = 0;
  let totalNewPoints = 0;
  const simplifiedSubpaths: string[] = [];

  let currentPts: { x: number; y: number }[] = [];
  let isClosed = false;
  let i = 0;

  const flushCurrentSubpath = () => {
    if (currentPts.length === 0) return;
    totalOldPoints += currentPts.length;

    const simplified = simplifyPoints(currentPts, tolerance);
    totalNewPoints += simplified.length;

    if (simplified.length > 0) {
      const parts: string[] = [`M ${simplified[0].x} ${simplified[0].y}`];
      for (let j = 1; j < simplified.length; j++) {
        parts.push(`L ${simplified[j].x} ${simplified[j].y}`);
      }
      if (isClosed) {
        parts.push('Z');
      }
      simplifiedSubpaths.push(parts.join(' '));
    }

    currentPts = [];
    isClosed = false;
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[Mm]$/i.test(token)) {
      flushCurrentSubpath();
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      currentPts.push({ x, y });
      i += 3;
    } else if (/^[Ll]$/i.test(token)) {
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      currentPts.push({ x, y });
      i += 3;
    } else if (/^[Zz]$/i.test(token)) {
      isClosed = true;
      i++;
      flushCurrentSubpath();
    } else if (/^[a-z]$/i.test(token)) {
      // For bezier curves or other commands that we do not alter directly:
      // If we already have lines collected, flush them
      flushCurrentSubpath();
      // Keep other commands verbatim
      simplifiedSubpaths.push(token);
      i++;
    } else {
      // Coordinate number for non-L commands
      simplifiedSubpaths.push(token);
      i++;
    }
  }

  flushCurrentSubpath();

  const finalPath = simplifiedSubpaths.join(' ');
  const percentReduced =
    totalOldPoints > 0
      ? Math.max(0, Math.round(((totalOldPoints - totalNewPoints) / totalOldPoints) * 100))
      : 0;

  return {
    simplifiedPath: finalPath || pathD,
    oldPointCount: totalOldPoints,
    newPointCount: totalNewPoints,
    percentReduced,
  };
}

/**
 * Snaps a 2D point to the nearest grid coordinate if within threshold
 */
export function snapPointToGrid(
  x: number,
  y: number,
  gridSize: number,
  threshold = 12
): { x: number; y: number; snappedX: boolean; snappedY: boolean } {
  const nearestX = Math.round(x / gridSize) * gridSize;
  const nearestY = Math.round(y / gridSize) * gridSize;

  const dx = Math.abs(x - nearestX);
  const dy = Math.abs(y - nearestY);

  return {
    x: dx <= threshold ? nearestX : x,
    y: dy <= threshold ? nearestY : y,
    snappedX: dx <= threshold,
    snappedY: dy <= threshold,
  };
}

/**
 * Enhanced magnetic snapping that checks both typographic guides, custom guides, and grid lines
 */
export function snapPointWithGuides(
  x: number,
  y: number,
  gridSettings: { enabled: boolean; size: number; snapToGrid: boolean; snapToGuides: boolean },
  customGuides: { id: string; orientation: 'horizontal' | 'vertical'; position: number; label?: string }[] = [],
  advanceWidth = 600,
  threshold = 14
): {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  activeGuides: { type: 'grid' | 'metric' | 'custom'; orientation: 'horizontal' | 'vertical'; position: number; label: string }[];
} {
  let resX = x;
  let resY = y;
  let snappedX = false;
  let snappedY = false;
  const activeGuides: { type: 'grid' | 'metric' | 'custom'; orientation: 'horizontal' | 'vertical'; position: number; label: string }[] = [];

  // 1. Snap to Typographic & Custom Guides
  if (gridSettings.snapToGuides) {
    const typographicHorizontal: { pos: number; label: string; type: 'metric' | 'custom' }[] = [
      { pos: 800, label: 'Baseline (800)', type: 'metric' },
      { pos: 200, label: 'Cap Height (200)', type: 'metric' },
      { pos: 450, label: 'x-Height (450)', type: 'metric' },
      { pos: 100, label: 'Ascender (100)', type: 'metric' },
      { pos: 950, label: 'Descender (950)', type: 'metric' },
    ];

    const typographicVertical: { pos: number; label: string; type: 'metric' | 'custom' }[] = [
      { pos: 60, label: 'Left Bearing (60)', type: 'metric' },
      { pos: advanceWidth, label: `Advance Width (${advanceWidth})`, type: 'metric' },
      { pos: Math.round(advanceWidth / 2), label: 'Center (50%)', type: 'metric' },
    ];

    // Add custom guides
    customGuides.forEach((g) => {
      if (g.orientation === 'horizontal') {
        typographicHorizontal.push({
          pos: g.position,
          label: g.label || `Custom Guide Y:${g.position}`,
          type: 'custom',
        });
      } else {
        typographicVertical.push({
          pos: g.position,
          label: g.label || `Custom Guide X:${g.position}`,
          type: 'custom',
        });
      }
    });

    // Check vertical guide snap (affects x)
    for (const g of typographicVertical) {
      if (Math.abs(x - g.pos) <= threshold) {
        resX = g.pos;
        snappedX = true;
        activeGuides.push({
          type: g.type,
          orientation: 'vertical',
          position: g.pos,
          label: g.label,
        });
        break;
      }
    }

    // Check horizontal guide snap (affects y)
    for (const g of typographicHorizontal) {
      if (Math.abs(y - g.pos) <= threshold) {
        resY = g.pos;
        snappedY = true;
        activeGuides.push({
          type: g.type,
          orientation: 'horizontal',
          position: g.pos,
          label: g.label,
        });
        break;
      }
    }
  }

  // 2. Snap to Grid if enabled and not already snapped by a guide
  if (gridSettings.snapToGrid && gridSettings.enabled && gridSettings.size > 0) {
    if (!snappedX) {
      const nearX = Math.round(x / gridSettings.size) * gridSettings.size;
      if (Math.abs(x - nearX) <= threshold) {
        resX = nearX;
        snappedX = true;
        activeGuides.push({
          type: 'grid',
          orientation: 'vertical',
          position: nearX,
          label: `Grid X:${nearX}`,
        });
      }
    }
    if (!snappedY) {
      const nearY = Math.round(y / gridSettings.size) * gridSettings.size;
      if (Math.abs(y - nearY) <= threshold) {
        resY = nearY;
        snappedY = true;
        activeGuides.push({
          type: 'grid',
          orientation: 'horizontal',
          position: nearY,
          label: `Grid Y:${nearY}`,
        });
      }
    }
  }

  return {
    x: resX,
    y: resY,
    snappedX,
    snappedY,
    activeGuides,
  };
}


/**
 * Extracts and cleans an SVG path from raw SVG markup or direct path d attribute.
 * Supports pasting full `<svg><path d="..."/></svg>` or just `d="..."` or raw `M...Z`.
 */
export function parseSvgToGlyphPath(rawInput: string): string {
  if (!rawInput || !rawInput.trim()) return '';

  const trimmed = rawInput.trim();

  // 1. Direct path string (starts with M or m)
  if (/^[Mm]\s*[-+]?\d+/i.test(trimmed)) {
    return trimmed;
  }

  // 2. Contains <path ... d="..." ...>
  const pathMatch = trimmed.match(/<path[^>]*\sd=["']([^"']+)["']/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1].trim();
  }

  // 3. d="..." without tag
  const dAttrMatch = trimmed.match(/d=["']([^"']+)["']/i);
  if (dAttrMatch && dAttrMatch[1]) {
    return dAttrMatch[1].trim();
  }

  return trimmed;
}

/**
 * Generates an SVG sprite sheet containing all glyphs as reusable <g id="glyph-..."> symbols
 */
export function generateSvgSpriteSheet(project: FontProject): string {
  const { metadata, glyphs } = project;
  const symbols = Object.values(glyphs)
    .filter((g) => !g.isEmpty && g.svgPath)
    .map((g) => {
      const charName = g.character === ' ' ? 'space' : g.name || g.character;
      return `  <symbol id="glyph-${charName}" viewBox="0 0 1000 1000">\n    <path d="${g.svgPath}" fill="currentColor" />\n  </symbol>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <!-- ${metadata.familyName} SVG Sprite Sheet -->
  <defs>
${symbols}
  </defs>
</svg>`;
}

/**
 * Generates a standalone, exportable SVG graphic for a single glyph
 */
export function generateStandaloneGlyphSvg(glyph: FontGlyph, metrics?: FontMetrics): string {
  const width = Math.max(100, glyph.metrics.advanceWidth);
  const height = metrics?.unitsPerEm || 1000;
  const pathD = glyph.svgPath || '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <title>Glyph ${escapeXml(glyph.character)} (${escapeXml(glyph.name)})</title>
  <path d="${pathD}" fill="#000000" fill-rule="nonzero" />
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
