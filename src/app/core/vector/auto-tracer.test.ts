import test from 'node:test';
import assert from 'node:assert/strict';
import { AutoTracer } from './auto-tracer';

test('AutoTracer traces a rectangular binary mask accurately', () => {
  const width = 20;
  const height = 20;
  // Create an RGBA buffer with a 10x10 black square in the center
  const buffer = new Uint8ClampedArray(width * height * 4);
  // Default to white background (255, 255, 255, 255)
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 255;
    buffer[i + 1] = 255;
    buffer[i + 2] = 255;
    buffer[i + 3] = 255;
  }

  // Draw black rectangle from (5,5) to (15,15)
  for (let y = 5; y < 15; y++) {
    for (let x = 5; x < 15; x++) {
      const idx = (y * width + x) * 4;
      buffer[idx] = 0;
      buffer[idx + 1] = 0;
      buffer[idx + 2] = 0;
      buffer[idx + 3] = 255;
    }
  }

  const mockImageData = {
    width,
    height,
    data: buffer,
    colorSpace: 'srgb' as PredefinedColorSpace,
  };

  const result = AutoTracer.traceImageData(mockImageData, {
    threshold: 128,
    invert: false,
    smoothing: 1,
    minArea: 10,
    scaleToFit: false,
  });

  assert.ok(result.contours.length >= 1, 'Should find at least 1 contour');
  assert.ok(result.svgPath.startsWith('M'), 'SVG path should start with M');
  assert.ok(result.svgPath.endsWith('Z'), 'SVG path should end with Z');
  assert.ok(result.pointCount >= 4, 'Should trace at least 4 corner points');
});

test('AutoTracer returns empty result for solid blank white image', () => {
  const width = 10;
  const height = 10;
  const buffer = new Uint8ClampedArray(width * height * 4);
  buffer.fill(255); // all white

  const mockImageData = {
    width,
    height,
    data: buffer,
    colorSpace: 'srgb' as PredefinedColorSpace,
  };

  const result = AutoTracer.traceImageData(mockImageData, {
    threshold: 128,
    invert: false,
    smoothing: 2,
    minArea: 10,
    scaleToFit: true,
  });

  assert.equal(result.contours.length, 0);
  assert.equal(result.pointCount, 0);
  assert.equal(result.svgPath, '');
});

test('AutoTracer scaleToFit maps contour into target font em-box', () => {
  const width = 20;
  const height = 20;
  const buffer = new Uint8ClampedArray(width * height * 4);
  buffer.fill(255);

  // Black block (4,4) to (16,16)
  for (let y = 4; y < 16; y++) {
    for (let x = 4; x < 16; x++) {
      const idx = (y * width + x) * 4;
      buffer[idx] = 0;
      buffer[idx + 1] = 0;
      buffer[idx + 2] = 0;
      buffer[idx + 3] = 255;
    }
  }

  const mockImageData = {
    width,
    height,
    data: buffer,
    colorSpace: 'srgb' as PredefinedColorSpace,
  };

  const result = AutoTracer.traceImageData(mockImageData, {
    threshold: 128,
    invert: false,
    smoothing: 1,
    minArea: 10,
    scaleToFit: true,
  });

  assert.ok(result.contours.length >= 1);
  const firstPt = result.contours[0].points[0];
  // Scaled coordinates should be within font em space (>= 80)
  assert.ok(firstPt.x >= 80 && firstPt.x <= 800, `X coordinate ${firstPt.x} scaled into font space`);
  assert.ok(firstPt.y >= 180 && firstPt.y <= 900, `Y coordinate ${firstPt.y} scaled into font space`);
});
