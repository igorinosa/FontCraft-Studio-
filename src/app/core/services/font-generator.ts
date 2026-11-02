import { Injectable } from '@angular/core';
import * as opentype from 'opentype.js';
import JSZip from 'jszip';
import { FontProject } from '../models/font.model';
import { flipPathYCoordinates, generateStandaloneGlyphSvg, generateSvgFontXml } from '../vector/path-math';

@Injectable({
  providedIn: 'root',
})
export class FontGenerator {
  private activeFontFace: FontFace | null = null;
  private currentBlobUrl: string | null = null;

  /**
   * Converts an SVG path string in Font space (Y up, baseline=0) into an opentype.Path
   */
  svgPathToOpenTypePath(fontSpaceD: string): opentype.Path {
    const path = new opentype.Path();
    if (!fontSpaceD || fontSpaceD.trim().length === 0) return path;

    const tokens = fontSpaceD.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi);
    if (!tokens) return path;

    let currentCmd = '';
    let i = 0;
    let currX = 0;
    let currY = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      if (/^[a-z]$/i.test(token)) {
        currentCmd = token;
        i++;
      } else {
        switch (currentCmd) {
          case 'M': {
            const x = Number(token);
            const y = Number(tokens[i + 1]);
            path.moveTo(x, y);
            currX = x;
            currY = y;
            i += 2;
            break;
          }
          case 'm': {
            const dx = Number(token);
            const dy = Number(tokens[i + 1]);
            currX += dx;
            currY += dy;
            path.moveTo(currX, currY);
            i += 2;
            break;
          }
          case 'L': {
            const x = Number(token);
            const y = Number(tokens[i + 1]);
            path.lineTo(x, y);
            currX = x;
            currY = y;
            i += 2;
            break;
          }
          case 'l': {
            const dx = Number(token);
            const dy = Number(tokens[i + 1]);
            currX += dx;
            currY += dy;
            path.lineTo(currX, currY);
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
            path.bezierCurveTo(x1, y1, x2, y2, x, y);
            currX = x;
            currY = y;
            i += 6;
            break;
          }
          case 'c': {
            const x1 = currX + Number(token);
            const y1 = currY + Number(tokens[i + 1]);
            const x2 = currX + Number(tokens[i + 2]);
            const y2 = currY + Number(tokens[i + 3]);
            const x = currX + Number(tokens[i + 4]);
            const y = currY + Number(tokens[i + 5]);
            path.bezierCurveTo(x1, y1, x2, y2, x, y);
            currX = x;
            currY = y;
            i += 6;
            break;
          }
          case 'Q': {
            const x1 = Number(token);
            const y1 = Number(tokens[i + 1]);
            const x = Number(tokens[i + 2]);
            const y = Number(tokens[i + 3]);
            path.quadTo(x1, y1, x, y);
            currX = x;
            currY = y;
            i += 4;
            break;
          }
          case 'q': {
            const x1 = currX + Number(token);
            const y1 = currY + Number(tokens[i + 1]);
            const x = currX + Number(tokens[i + 2]);
            const y = currY + Number(tokens[i + 3]);
            path.quadTo(x1, y1, x, y);
            currX = x;
            currY = y;
            i += 4;
            break;
          }
          case 'Z':
          case 'z': {
            path.close();
            i++;
            break;
          }
          default: {
            i++;
            break;
          }
        }
      }
    }

    return path;
  }

  /**
   * Constructs an opentype.Font from the project state
   */
  buildOpenTypeFont(project: FontProject): opentype.Font {
    const { metadata, metrics, glyphs } = project;

    // 1. Mandatory .notdef glyph
    const notdefPath = new opentype.Path();
    notdefPath.moveTo(50, 0);
    notdefPath.lineTo(450, 0);
    notdefPath.lineTo(450, 700);
    notdefPath.lineTo(50, 700);
    notdefPath.close();
    notdefPath.moveTo(100, 50);
    notdefPath.lineTo(100, 650);
    notdefPath.lineTo(400, 650);
    notdefPath.lineTo(400, 50);
    notdefPath.close();

    const notdefGlyph = new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 500,
      path: notdefPath,
    });

    const openTypeGlyphs: opentype.Glyph[] = [notdefGlyph];

    // 2. Iterate glyphs
    for (const g of Object.values(glyphs)) {
      const charCode = g.character.charCodeAt(0);
      let glyphPath = new opentype.Path();

      if (g.character === ' ') {
        // Space glyph has no paths, just advance width
        openTypeGlyphs.push(
          new opentype.Glyph({
            name: 'space',
            unicode: charCode,
            advanceWidth: g.metrics.advanceWidth || 350,
            path: glyphPath,
          })
        );
        continue;
      }

      if (!g.isEmpty && g.svgPath) {
        // Convert SVG display space (Y down) to Font space (Y up)
        const fontSpacePath = flipPathYCoordinates(g.svgPath, metrics.ascender);
        glyphPath = this.svgPathToOpenTypePath(fontSpacePath);
      }

      openTypeGlyphs.push(
        new opentype.Glyph({
          name: g.name || g.character,
          unicode: charCode,
          advanceWidth: Math.max(100, g.metrics.advanceWidth),
          path: glyphPath,
        })
      );
    }

    const font = new opentype.Font({
      familyName: metadata.familyName || 'CustomFont',
      styleName: metadata.styleName || 'Regular',
      unitsPerEm: metrics.unitsPerEm || 1000,
      ascender: metrics.ascender || 800,
      descender: metrics.descender || -200,
      glyphs: openTypeGlyphs,
    });

    // Populate font.kerningPairs for opentype.js and layout engines
    if (project.kerning) {
      const glyphIndexMap = new Map<string, number>();
      openTypeGlyphs.forEach((g, index) => {
        if (g.name) glyphIndexMap.set(g.name, index);
        if (g.unicode) glyphIndexMap.set(String.fromCharCode(g.unicode), index);
      });

      const kerningMap: Record<string, number> = {};
      for (const [pair, val] of Object.entries(project.kerning)) {
        if (pair.length === 2 && val !== 0) {
          const leftIdx = glyphIndexMap.get(pair[0]);
          const rightIdx = glyphIndexMap.get(pair[1]);
          if (leftIdx !== undefined && rightIdx !== undefined) {
            kerningMap[`${leftIdx},${rightIdx}`] = val;
          }
        }
      }
      (font as unknown as { kerningPairs: Record<string, number> }).kerningPairs = kerningMap;
    }

    return font;
  }

  /**
   * Compiles the font into a TrueType binary buffer (.ttf)
   */
  exportTtfBlob(project: FontProject): Blob {
    const font = this.buildOpenTypeFont(project);
    const arrayBuffer = font.toArrayBuffer();
    return new Blob([arrayBuffer], { type: 'font/ttf' });
  }

  /**
   * Generates SVG Font file
   */
  exportSvgFontString(project: FontProject): string {
    return generateSvgFontXml(project);
  }

  /**
   * Bundles all non-empty glyphs as standalone SVG vector graphics in a ZIP file
   */
  async exportAllGlyphsZip(project: FontProject): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder(`${project.metadata.familyName.replace(/\s+/g, '_')}_SVG_Glyphs`);

    const glyphList = Object.values(project.glyphs);
    for (const g of glyphList) {
      if (g.isEmpty || !g.svgPath) continue;

      let safeName = g.character;
      if (safeName === ' ') safeName = 'space';
      else if (safeName === '.') safeName = 'dot';
      else if (safeName === '/') safeName = 'slash';
      else if (safeName === '\\') safeName = 'backslash';
      else if (safeName === ':') safeName = 'colon';
      else if (safeName === '*') safeName = 'asterisk';
      else if (safeName === '?') safeName = 'question';
      else if (safeName === '"') safeName = 'quote';
      else if (safeName === '<') safeName = 'less';
      else if (safeName === '>') safeName = 'greater';
      else if (safeName === '|') safeName = 'pipe';

      const svgContent = generateStandaloneGlyphSvg(g, project.metrics);
      folder?.file(`${safeName}_${g.name || 'char'}.svg`, svgContent);
    }

    // Also include the combined SVG Font
    const svgFontXml = generateSvgFontXml(project);
    folder?.file(`${project.metadata.familyName.replace(/\s+/g, '_')}_font.svg`, svgFontXml);

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Registers a dynamic `@font-face` so the live typography preview immediately renders
   * using the user's hand-drawn vector font!
   */
  async registerPreviewFontFace(project: FontProject): Promise<string> {
    if (typeof window === 'undefined' || !('FontFace' in window)) {
      return 'system-ui';
    }

    try {
      const blob = this.exportTtfBlob(project);
      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
      }
      this.currentBlobUrl = URL.createObjectURL(blob);

      const fontName = `UserFont_${project.id}_${Date.now()}`;
      const fontFace = new FontFace(fontName, `url(${this.currentBlobUrl}) format('truetype')`);
      const loadedFace = await fontFace.load();

      if (this.activeFontFace) {
        document.fonts.delete(this.activeFontFace);
      }
      document.fonts.add(loadedFace);
      this.activeFontFace = loadedFace;

      return fontName;
    } catch (err) {
      console.warn('FontFace registration notice:', err);
      return 'inherit';
    }
  }

  /**
   * Triggers client-side browser download for a Blob
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}
