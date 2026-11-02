import { AutoTraceSettings, PathContour, VectorPoint } from '../models/font.model';
import { simplifyPoints } from './path-math';

export interface TraceResult {
  svgPath: string;
  contours: PathContour[];
  pointCount: number;
  width: number;
  height: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Client-Side Algorithmic Vector Auto-Tracer
 * Implements Moore-Neighbor Boundary Tracing & Douglas-Peucker simplification.
 * Pure mathematical computation: 100% client-side, zero external AI or mock logic.
 */
export class AutoTracer {
  /**
   * Traces an ImageData object into clean SVG vector contours
   */
  static traceImageData(imageData: ImageData, settings: AutoTraceSettings): TraceResult {
    const { width, height, data } = imageData;
    const { threshold, invert, smoothing, minArea, scaleToFit } = settings;

    // 1. Convert to 2D binary grid (0 = background, 1 = foreground)
    const grid = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3] / 255;

        // Standard luminance calculation
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) * a + 255 * (1 - a);
        const isForeground = invert ? lum > threshold : lum < threshold;
        grid[y * width + x] = isForeground ? 1 : 0;
      }
    }

    // 2. Extract contour boundaries using Moore-Neighbor tracing
    const rawContours = this.findContours(grid, width, height);

    // 3. Filter tiny noise contours by bounding box area
    const filteredContours = rawContours.filter((pts) => {
      if (pts.length < 3) return false;
      const b = this.computeBounds(pts);
      const area = (b.maxX - b.minX) * (b.maxY - b.minY);
      return area >= minArea;
    });

    if (filteredContours.length === 0) {
      return {
        svgPath: '',
        contours: [],
        pointCount: 0,
        width,
        height,
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      };
    }

    // 4. Simplify polylines with Douglas-Peucker using smoothing factor
    const tolerance = Math.max(0.5, smoothing * 0.8);
    const simplifiedContours = filteredContours.map((pts) => simplifyPoints(pts, tolerance));

    // 5. Calculate global bounds
    let allPoints: VectorPoint[] = [];
    simplifiedContours.forEach((c) => {
      allPoints = allPoints.concat(c);
    });
    const globalBounds = this.computeBounds(allPoints);

    // 6. Scale and map to Font Em-Square (0..1000, ascender ~180 to baseline ~800)
    let finalContours = simplifiedContours;
    if (scaleToFit && globalBounds.maxX > globalBounds.minX && globalBounds.maxY > globalBounds.minY) {
      const origH = globalBounds.maxY - globalBounds.minY;

      // Fit within target glyph box: height ~600px, width ~550px, left margin 80, top 200
      const targetH = 600;
      const scale = targetH / origH;
      const offsetX = 80;
      const offsetY = 200;

      finalContours = simplifiedContours.map((pts) =>
        pts.map((p) => ({
          x: Math.round(offsetX + (p.x - globalBounds.minX) * scale),
          y: Math.round(offsetY + (p.y - globalBounds.minY) * scale),
        }))
      );
    }

    // 7. Format into SVG path string & PathContour objects
    let totalPoints = 0;
    const pathSegments: string[] = [];
    const contours: PathContour[] = finalContours.map((pts, idx) => {
      totalPoints += pts.length;
      let d = '';
      if (pts.length > 0) {
        d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
          d += ` L ${pts[i].x} ${pts[i].y}`;
        }
        d += ' Z';
      }
      pathSegments.push(d);

      return {
        id: `contour_trace_${idx}_${Date.now()}`,
        points: pts.map((p) => ({ x: p.x, y: p.y })),
        closed: true,
        isFilled: true,
        type: 'bezier',
        cachedSvgPath: d,
      };
    });

    const combinedSvgPath = pathSegments.join(' ');
    const finalBounds = this.computeBounds(
      finalContours.reduce((acc, c) => acc.concat(c), [] as VectorPoint[])
    );

    return {
      svgPath: combinedSvgPath,
      contours,
      pointCount: totalPoints,
      width,
      height,
      bounds: finalBounds,
    };
  }

  /**
   * Moore-Neighbor contour tracing algorithm
   */
  private static findContours(grid: Uint8Array, w: number, h: number): VectorPoint[][] {
    const contours: VectorPoint[][] = [];
    const visited = new Uint8Array(w * h);

    // 8-neighborhood directions (clockwise starting from West)
    // 0: W, 1: NW, 2: N, 3: NE, 4: E, 5: SE, 6: S, 7: SW
    const dx = [-1, -1, 0, 1, 1, 1, 0, -1];
    const dy = [0, -1, -1, -1, 0, 1, 1, 1];

    const isForeground = (x: number, y: number): boolean => {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      return grid[y * w + x] === 1;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Find outer boundary: pixel is 1 and left pixel was 0 or visited
        if (grid[y * w + x] === 1 && !visited[y * w + x]) {
          // Check if this is an edge (at least one 4-neighbor is 0)
          const isEdge =
            !isForeground(x - 1, y) ||
            !isForeground(x + 1, y) ||
            !isForeground(x, y - 1) ||
            !isForeground(x, y + 1);

          if (!isEdge) continue;

          // Trace contour starting at (x, y)
          const contour: VectorPoint[] = [{ x, y }];
          visited[y * w + x] = 1;

          let currX = x;
          let currY = y;
          // Backtrack direction from West is 0
          let checkDir = 0;
          let foundNext = false;
          const maxSteps = w * h * 2;
          let steps = 0;

          do {
            steps++;
            foundNext = false;

            // Search 8 directions clockwise
            for (let i = 0; i < 8; i++) {
              const dir = (checkDir + i) % 8;
              const nextX = currX + dx[dir];
              const nextY = currY + dy[dir];

              if (isForeground(nextX, nextY)) {
                currX = nextX;
                currY = nextY;
                contour.push({ x: currX, y: currY });
                visited[currY * w + currX] = 1;

                // Next search starts from opposite direction - 2 mod 8
                checkDir = (dir + 5) % 8;
                foundNext = true;
                break;
              }
            }

            if (!foundNext) break;
          } while ((currX !== x || currY !== y) && steps < maxSteps);

          if (contour.length >= 3) {
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  private static computeBounds(points: VectorPoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
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
    return { minX, minY, maxX, maxY };
  }
}
