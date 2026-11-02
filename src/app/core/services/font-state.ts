import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CustomGuide,
  DrawingTool,
  FontGlyph,
  FontMetrics,
  FontProject,
  FontVariant,
  GlyphHistoryEntry,
  GridSettings,
  MobileViewTab,
  PathContour,
  PathSmoothing,
  SimplificationStrength,
  SnapGuideInfo,
} from '../models/font.model';
import { FontGenerator } from './font-generator';
import {
  buildCasualMarkerPreset,
  createDefaultGlyph,
  DEFAULT_FONT_VARIANTS,
  EXTENDED_ACCENT_CHARACTERS,
  EXTENDED_SYMBOLS,
  PRESET_LIST,
  STANDARD_KERNING_PAIRS,
} from './font-presets';
import {
  parseSvgToGlyphPath,
  simplifyGlyphContours,
  simplifySvgPathString,
  snapPointWithGuides,
} from '../vector/path-math';
import { deriveVariantGlyphs } from '../vector/font-transforms';

@Injectable({
  providedIn: 'root',
})
export class FontState {
  private readonly generator = inject(FontGenerator);

  // Active Project Signal
  readonly project = signal<FontProject>(buildCasualMarkerPreset());

  // Active Selected Glyph Character (e.g. 'A')
  readonly selectedCharacter = signal<string>('A');

  // Active Variant & Font Weight (100 to 900)
  readonly activeVariantId = signal<string>('regular');
  readonly fontWeight = signal<number>(400);

  // Modals & Panels
  readonly isKerningModalOpen = signal<boolean>(false);
  readonly isCharacterSetModalOpen = signal<boolean>(false);
  readonly isAutoTraceModalOpen = signal<boolean>(false);
  readonly isHistoryDrawerOpen = signal<boolean>(false);

  // Active Tool
  readonly activeTool = signal<DrawingTool>('brush');

  // Brush settings
  readonly brushSize = signal<number>(40);
  readonly pathSmoothing = signal<PathSmoothing>('medium');


  readonly smoothingTolerance = computed<number>(() => {
    switch (this.pathSmoothing()) {
      case 'off':
        return 0;
      case 'low':
        return 1.2;
      case 'medium':
        return 2.8;
      case 'high':
        return 5.5;
    }
  });

  // Path Simplification strength ('gentle' | 'balanced' | 'aggressive')
  readonly simplificationStrength = signal<SimplificationStrength>('balanced');

  readonly simplificationTolerance = computed<number>(() => {
    switch (this.simplificationStrength()) {
      case 'gentle':
        return 1.8;
      case 'balanced':
        return 3.5;
      case 'aggressive':
        return 7.0;
    }
  });

  // Simplification user feedback message (auto-clears)
  readonly lastSimplificationMessage = signal<string | null>(null);

  // Active Magnetic Snap Visual Guides
  readonly activeSnapGuides = signal<SnapGuideInfo[]>([]);

  // Mobile View Tabs ('canvas' | 'glyphs' | 'tester')
  readonly mobileTab = signal<MobileViewTab>('canvas');

  // Canvas visual aids: Tracing Guide
  readonly showTracingGuide = signal<boolean>(true);
  readonly tracingGuideFont = signal<string>('sans-serif');
  readonly tracingGuideOpacity = signal<number>(0.25);

  // Advanced Grid Settings
  readonly gridSettings = signal<GridSettings>({
    enabled: true,
    size: 50,
    style: 'lines',
    snapToGrid: false,
    snapToGuides: true,
    slantAngle: 0,
  });

  // Custom User Draggable / Placed Guides
  readonly customGuides = signal<CustomGuide[]>([]);

  // Metric guidelines
  readonly showMetrics = signal<boolean>(true);
  readonly showCenterGuides = signal<boolean>(true);

  // Zoom and Pan
  readonly zoom = signal<number>(1);
  readonly pan = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter for glyphs catalog
  readonly activeFilter = signal<'all' | 'uppercase' | 'lowercase' | 'numbers' | 'punctuation'>('uppercase');

  // SVG Direct Inspector Modal/Drawer
  readonly isSvgModalOpen = signal<boolean>(false);

  // Live Type Tester settings
  readonly livePreviewFamily = signal<string>('sans-serif');
  readonly livePreviewText = signal<string>('HELLO WORLD! 123');
  readonly livePreviewSize = signal<number>(42);
  readonly liveLetterSpacing = signal<number>(2);

  // Undo / Redo history for current glyph
  private readonly undoStack = signal<string[]>([]);
  private readonly redoStack = signal<string[]>([]);

  // Per-glyph revision history map
  readonly glyphHistoryMap = signal<Record<string, GlyphHistoryEntry[]>>({});
  readonly historyIndexMap = signal<Record<string, number>>({});

  // Computed signals
  readonly variants = computed<FontVariant[]>(() => {
    return this.project().variants || DEFAULT_FONT_VARIANTS;
  });

  readonly activeVariant = computed<FontVariant>(() => {
    const list = this.variants();
    const id = this.activeVariantId();
    return list.find((v) => v.id === id) || list[0] || DEFAULT_FONT_VARIANTS[0];
  });

  readonly currentGlyphHistory = computed<GlyphHistoryEntry[]>(() => {
    const char = this.selectedCharacter();
    const map = this.glyphHistoryMap();
    if (map[char] && map[char].length > 0) {
      return map[char];
    }
    // Default initial entry
    const glyph = this.currentGlyph();
    return [
      {
        id: `init_${char}`,
        timestamp: this.project().createdAt,
        actionName: glyph.isEmpty ? 'Empty canvas' : 'Initial letterform',
        svgPath: glyph.svgPath,
        contours: glyph.contours || [],
        pointCount: glyph.svgPath.length > 0 ? glyph.svgPath.split(/[MLCZ]/i).length : 0,
      },
    ];
  });

  readonly currentHistoryIndex = computed<number>(() => {
    const char = this.selectedCharacter();
    const map = this.historyIndexMap();
    const hist = this.currentGlyphHistory();
    if (map[char] !== undefined) return map[char];
    return Math.max(0, hist.length - 1);
  });

  readonly kerningPairs = computed<Record<string, number>>(() => {
    return this.project().kerning || {};
  });

  readonly kerningPairCount = computed<number>(() => {
    return Object.keys(this.kerningPairs()).length;
  });


  readonly currentGlyph = computed<FontGlyph>(() => {
    const proj = this.project();
    const char = this.selectedCharacter();
    return (
      proj.glyphs[char] || {
        id: `g_${char.charCodeAt(0)}`,
        unicode: char,
        character: char,
        name: char,
        category: 'uppercase',
        metrics: { advanceWidth: 600, leftSideBearing: 60 },
        contours: [],
        svgPath: '',
        isEmpty: true,
      }
    );
  });

  readonly allGlyphsList = computed<FontGlyph[]>(() => {
    return Object.values(this.project().glyphs);
  });

  readonly completedGlyphCount = computed<number>(() => {
    return this.allGlyphsList().filter((g) => !g.isEmpty && g.svgPath.trim().length > 0).length;
  });

  readonly totalGlyphCount = computed<number>(() => {
    return this.allGlyphsList().length;
  });

  readonly filteredGlyphs = computed<FontGlyph[]>(() => {
    const list = this.allGlyphsList();
    const filter = this.activeFilter();
    if (filter === 'all') return list;
    return list.filter((g) => g.category === filter);
  });

  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  constructor() {
    this.refreshLiveFont();
  }

  selectCharacter(char: string): void {
    if (this.selectedCharacter() === char) return;
    this.selectedCharacter.set(char);
    this.undoStack.set([]);
    this.redoStack.set([]);
  }

  setTool(tool: DrawingTool): void {
    this.activeTool.set(tool);
  }

  setBrushSize(size: number): void {
    this.brushSize.set(Math.max(4, Math.min(120, size)));
  }

  setPathSmoothing(smoothing: PathSmoothing): void {
    this.pathSmoothing.set(smoothing);
  }

  setMobileTab(tab: MobileViewTab): void {
    this.mobileTab.set(tab);
  }

  updateGlyphName(newName: string): void {
    const clean = newName.trim();
    if (!clean) return;

    this.project.update((proj) => {
      const char = this.selectedCharacter();
      const existing = proj.glyphs[char];
      if (!existing) return proj;

      return {
        ...proj,
        updatedAt: Date.now(),
        glyphs: {
          ...proj.glyphs,
          [char]: {
            ...existing,
            name: clean,
          },
        },
      };
    });

    this.refreshLiveFont();
  }

  toggleTracingGuide(): void {
    this.showTracingGuide.update((v) => !v);
  }

  setTracingGuideOpacity(opacity: number): void {
    this.tracingGuideOpacity.set(opacity);
  }

  setTracingGuideFont(fontName: string): void {
    this.tracingGuideFont.set(fontName);
  }

  // Grid Controls
  toggleGrid(): void {
    this.gridSettings.update((g) => ({ ...g, enabled: !g.enabled }));
  }

  setGridSize(size: 25 | 50 | 100): void {
    this.gridSettings.update((g) => ({ ...g, size }));
  }

  setGridStyle(style: 'lines' | 'dots'): void {
    this.gridSettings.update((g) => ({ ...g, style }));
  }

  toggleSnapToGrid(): void {
    this.gridSettings.update((g) => ({ ...g, snapToGrid: !g.snapToGrid }));
  }

  toggleSnapToGuides(): void {
    this.gridSettings.update((g) => ({ ...g, snapToGuides: !g.snapToGuides }));
  }

  setSlantAngle(slantAngle: number): void {
    this.gridSettings.update((g) => ({ ...g, slantAngle }));
  }

  // Guide Controls
  toggleMetrics(): void {
    this.showMetrics.update((v) => !v);
  }

  toggleCenterGuides(): void {
    this.showCenterGuides.update((v) => !v);
  }

  addCustomGuide(orientation: 'horizontal' | 'vertical', position: number): void {
    const newGuide: CustomGuide = {
      id: 'guide_' + Math.random().toString(36).substring(2, 9),
      orientation,
      position: Math.round(position),
      color: '#38bdf8',
    };
    this.customGuides.update((list) => [...list, newGuide]);
  }

  updateCustomGuidePosition(id: string, position: number): void {
    this.customGuides.update((list) =>
      list.map((g) => (g.id === id ? { ...g, position: Math.round(position) } : g))
    );
  }

  removeCustomGuide(id: string): void {
    this.customGuides.update((list) => list.filter((g) => g.id !== id));
  }

  clearCustomGuides(): void {
    this.customGuides.set([]);
  }

  // SVG Direct Import & Edit
  importSvgContent(rawSvg: string): boolean {
    const parsedPath = parseSvgToGlyphPath(rawSvg);
    if (!parsedPath) return false;

    this.updateGlyphPath(parsedPath);
    return true;
  }

  openSvgModal(): void {
    this.isSvgModalOpen.set(true);
  }

  closeSvgModal(): void {
    this.isSvgModalOpen.set(false);
  }

  // Kerning Modal & Pair Management
  openKerningModal(): void {
    this.isKerningModalOpen.set(true);
  }

  closeKerningModal(): void {
    this.isKerningModalOpen.set(false);
  }

  setKerningPair(pair: string, offset: number): void {
    const cleanPair = pair.trim();
    if (cleanPair.length !== 2) return;
    const clamped = Math.max(-300, Math.min(200, Math.round(offset)));

    this.project.update((p) => ({
      ...p,
      updatedAt: Date.now(),
      kerning: {
        ...(p.kerning || {}),
        [cleanPair]: clamped,
      },
    }));

    this.refreshLiveFont();
  }

  removeKerningPair(pair: string): void {
    this.project.update((p) => {
      const copy = { ...(p.kerning || {}) };
      delete copy[pair];
      return {
        ...p,
        updatedAt: Date.now(),
        kerning: copy,
      };
    });

    this.refreshLiveFont();
  }

  loadStandardKerning(): void {
    this.project.update((p) => ({
      ...p,
      updatedAt: Date.now(),
      kerning: {
        ...(p.kerning || {}),
        ...STANDARD_KERNING_PAIRS,
      },
    }));

    this.refreshLiveFont();
  }

  // Path Simplification Controls & Logic
  setSimplificationStrength(strength: SimplificationStrength): void {
    this.simplificationStrength.set(strength);
  }

  simplifyCurrentGlyph(): { success: boolean; message: string; pointsSaved: number } {
    const glyph = this.currentGlyph();
    if (glyph.isEmpty || !glyph.svgPath) {
      const emptyMsg = `Glyph '${glyph.character}' is empty. Draw strokes first!`;
      this.lastSimplificationMessage.set(emptyMsg);
      setTimeout(() => {
        if (this.lastSimplificationMessage() === emptyMsg) {
          this.lastSimplificationMessage.set(null);
        }
      }, 3000);
      return { success: false, message: emptyMsg, pointsSaved: 0 };
    }

    const tol = this.simplificationTolerance();

    // If vector contours exist, simplify each contour
    if (glyph.contours && glyph.contours.length > 0) {
      const contourRes = simplifyGlyphContours(glyph.contours, tol);
      const pathRes = simplifySvgPathString(glyph.svgPath, tol);
      const ptsSaved = Math.max(0, contourRes.oldPointCount - contourRes.newPointCount);
      const percent =
        contourRes.oldPointCount > 0 ? Math.round((ptsSaved / contourRes.oldPointCount) * 100) : 0;

      this.updateGlyphPath(pathRes.simplifiedPath, contourRes.contours);
      const msg =
        ptsSaved > 0
          ? `Simplified: ${contourRes.oldPointCount} → ${contourRes.newPointCount} nodes (-${percent}%)`
          : 'Path outline is already fully optimized!';

      this.lastSimplificationMessage.set(msg);
      setTimeout(() => {
        if (this.lastSimplificationMessage() === msg) {
          this.lastSimplificationMessage.set(null);
        }
      }, 3500);

      return { success: true, message: msg, pointsSaved: ptsSaved };
    } else {
      // Simplify SVG path string directly
      const pathRes = simplifySvgPathString(glyph.svgPath, tol);
      const ptsSaved = Math.max(0, pathRes.oldPointCount - pathRes.newPointCount);
      this.updateGlyphPath(pathRes.simplifiedPath);

      const msg =
        ptsSaved > 0
          ? `Simplified: ${pathRes.oldPointCount} → ${pathRes.newPointCount} nodes (-${pathRes.percentReduced}%)`
          : 'Path outline is already fully optimized!';

      this.lastSimplificationMessage.set(msg);
      setTimeout(() => {
        if (this.lastSimplificationMessage() === msg) {
          this.lastSimplificationMessage.set(null);
        }
      }, 3500);

      return { success: true, message: msg, pointsSaved: ptsSaved };
    }
  }

  setFilter(filter: 'all' | 'uppercase' | 'lowercase' | 'numbers' | 'punctuation'): void {
    this.activeFilter.set(filter);
  }

  setLivePreviewText(text: string): void {
    this.livePreviewText.set(text);
  }

  setLivePreviewSize(size: number): void {
    this.livePreviewSize.set(size);
  }

  setLiveLetterSpacing(spacing: number): void {
    this.liveLetterSpacing.set(spacing);
  }

  resetZoomPan(): void {
    this.zoom.set(1);
    this.pan.set({ x: 0, y: 0 });
  }

  zoomIn(): void {
    this.zoom.update((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
  }

  updateGlyphPath(newSvgPath: string, contours?: PathContour[], actionName = 'Drawing edit'): void {
    const current = this.currentGlyph();

    // Push previous to undo stack
    this.undoStack.update((stack) => [...stack, current.svgPath]);
    this.redoStack.set([]);

    const actualContours = contours !== undefined ? contours : current.contours;

    // Record per-glyph revision history entry
    this.recordHistoryEntry(actionName, newSvgPath, actualContours);

    this.updateGlyphPathDirect(newSvgPath, actualContours);
  }

  private updateGlyphPathDirect(newSvgPath: string, contours?: PathContour[]): void {
    const current = this.currentGlyph();
    this.project.update((proj) => {
      const char = this.selectedCharacter();
      const existing = proj.glyphs[char] || current;
      const updated: FontGlyph = {
        ...existing,
        svgPath: newSvgPath,
        contours: contours !== undefined ? contours : existing.contours,
        isEmpty: newSvgPath.trim().length === 0,
      };

      return {
        ...proj,
        updatedAt: Date.now(),
        glyphs: {
          ...proj.glyphs,
          [char]: updated,
        },
      };
    });

    this.refreshLiveFont();
  }

  recordHistoryEntry(actionName: string, svgPath: string, contours: PathContour[]): void {
    const char = this.selectedCharacter();
    const entry: GlyphHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      actionName,
      svgPath,
      contours: [...contours],
      pointCount: svgPath.length > 0 ? svgPath.split(/[MLCZ]/i).length : 0,
    };

    let updatedLength = 1;
    this.glyphHistoryMap.update((map) => {
      const existing = map[char] || [];
      const updated = [...existing, entry].slice(-25);
      updatedLength = updated.length;
      return { ...map, [char]: updated };
    });

    this.historyIndexMap.update((map) => ({ ...map, [char]: Math.max(0, updatedLength - 1) }));
  }

  revertToHistoryEntry(entry: GlyphHistoryEntry, index: number): void {
    const char = this.selectedCharacter();
    this.historyIndexMap.update((map) => ({ ...map, [char]: index }));
    this.updateGlyphPathDirect(entry.svgPath, entry.contours);
  }

  // Magnetic Snapping helper
  snapCoordinate(x: number, y: number): { x: number; y: number } {
    const currentG = this.currentGlyph();
    const snapRes = snapPointWithGuides(
      x,
      y,
      this.gridSettings(),
      this.customGuides(),
      currentG.metrics.advanceWidth,
      14
    );

    this.activeSnapGuides.set(snapRes.activeGuides);
    return { x: snapRes.x, y: snapRes.y };
  }

  clearSnapGuides(): void {
    if (this.activeSnapGuides().length > 0) {
      this.activeSnapGuides.set([]);
    }
  }

  // Font Weight & Variant Management
  setFontWeight(weight: number): void {
    const clamped = Math.max(100, Math.min(900, Math.round(weight / 100) * 100));
    this.fontWeight.set(clamped);

    // If an existing variant matches this weight, select it
    const matching = this.variants().find((v) => v.weight === clamped && !v.isItalic);
    if (matching) {
      this.activeVariantId.set(matching.id);
    }
    this.refreshLiveFont();
  }

  setActiveVariant(variantId: string): void {
    const found = this.variants().find((v) => v.id === variantId);
    if (!found) return;
    this.activeVariantId.set(variantId);
    this.fontWeight.set(found.weight);
    this.refreshLiveFont();
  }

  generateVariant(variantType: 'bold' | 'light' | 'italic' | 'condensed'): void {
    const baseGlyphs = this.project().glyphs;
    let targetVariant: FontVariant;

    switch (variantType) {
      case 'bold':
        targetVariant = {
          id: 'bold',
          name: 'Bold',
          weight: 700,
          isItalic: false,
          slantAngle: 0,
          widthStretch: 1.0,
          weightMultiplier: 1.6,
        };
        break;
      case 'light':
        targetVariant = {
          id: 'light',
          name: 'Light',
          weight: 300,
          isItalic: false,
          slantAngle: 0,
          widthStretch: 1.0,
          weightMultiplier: 0.7,
        };
        break;
      case 'italic':
        targetVariant = {
          id: 'italic',
          name: 'Italic',
          weight: 400,
          isItalic: true,
          slantAngle: 12,
          widthStretch: 1.0,
          weightMultiplier: 1.0,
        };
        break;
      case 'condensed':
        targetVariant = {
          id: 'condensed',
          name: 'Condensed',
          weight: 400,
          isItalic: false,
          slantAngle: 0,
          widthStretch: 0.82,
          weightMultiplier: 1.0,
        };
        break;
    }

    const transformedGlyphs = deriveVariantGlyphs(baseGlyphs, targetVariant, 800);

    this.project.update((proj) => {
      const existingVariants = proj.variants || DEFAULT_FONT_VARIANTS;
      const filtered = existingVariants.filter((v) => v.id !== targetVariant.id);
      return {
        ...proj,
        variants: [...filtered, targetVariant],
        activeVariantId: targetVariant.id,
        glyphs: transformedGlyphs,
        updatedAt: Date.now(),
      };
    });

    this.activeVariantId.set(targetVariant.id);
    this.fontWeight.set(targetVariant.weight);
    this.refreshLiveFont();
  }

  // Modals Toggles
  openCharacterSetModal(): void {
    this.isCharacterSetModalOpen.set(true);
  }

  closeCharacterSetModal(): void {
    this.isCharacterSetModalOpen.set(false);
  }

  openAutoTraceModal(): void {
    this.isAutoTraceModalOpen.set(true);
  }

  closeAutoTraceModal(): void {
    this.isAutoTraceModalOpen.set(false);
  }

  openHistoryDrawer(): void {
    this.isHistoryDrawerOpen.set(true);
  }

  closeHistoryDrawer(): void {
    this.isHistoryDrawerOpen.set(false);
  }

  toggleHistoryDrawer(): void {
    this.isHistoryDrawerOpen.update((v) => !v);
  }

  addMissingCategoryGlyphs(category: 'accents' | 'symbols'): void {
    const charsToAdd = category === 'accents' ? EXTENDED_ACCENT_CHARACTERS : EXTENDED_SYMBOLS;

    this.project.update((proj) => {
      const newGlyphs = { ...proj.glyphs };
      for (const char of charsToAdd) {
        if (!newGlyphs[char]) {
          newGlyphs[char] = createDefaultGlyph(
            char,
            category === 'accents' ? 'lowercase' : 'symbols',
            '',
            600
          );
        }
      }
      return {
        ...proj,
        glyphs: newGlyphs,
        updatedAt: Date.now(),
      };
    });

    this.refreshLiveFont();
  }

  updateGlyphAdvanceWidth(width: number): void {
    const clamped = Math.max(100, Math.min(1200, Math.round(width)));
    this.project.update((proj) => {
      const char = this.selectedCharacter();
      const existing = proj.glyphs[char];
      if (!existing) return proj;

      return {
        ...proj,
        updatedAt: Date.now(),
        glyphs: {
          ...proj.glyphs,
          [char]: {
            ...existing,
            metrics: {
              ...existing.metrics,
              advanceWidth: clamped,
            },
          },
        },
      };
    });

    this.refreshLiveFont();
  }

  clearCurrentGlyph(): void {
    const current = this.currentGlyph();
    if (current.isEmpty && !current.svgPath) return;

    this.undoStack.update((stack) => [...stack, current.svgPath]);
    this.redoStack.set([]);

    this.recordHistoryEntry('Cleared glyph', '', []);
    this.updateGlyphPathDirect('', []);
  }

  undo(): void {
    const stack = this.undoStack();
    if (stack.length === 0) return;

    const previousSvg = stack[stack.length - 1];
    const newUndo = stack.slice(0, -1);
    const currentSvg = this.currentGlyph().svgPath;

    this.redoStack.update((r) => [...r, currentSvg]);
    this.undoStack.set(newUndo);

    this.project.update((proj) => {
      const char = this.selectedCharacter();
      const existing = proj.glyphs[char];
      if (!existing) return proj;

      return {
        ...proj,
        updatedAt: Date.now(),
        glyphs: {
          ...proj.glyphs,
          [char]: {
            ...existing,
            svgPath: previousSvg,
            isEmpty: previousSvg.trim().length === 0,
          },
        },
      };
    });

    this.refreshLiveFont();
  }

  redo(): void {
    const stack = this.redoStack();
    if (stack.length === 0) return;

    const nextSvg = stack[stack.length - 1];
    const newRedo = stack.slice(0, -1);
    const currentSvg = this.currentGlyph().svgPath;

    this.undoStack.update((u) => [...u, currentSvg]);
    this.redoStack.set(newRedo);

    this.project.update((proj) => {
      const char = this.selectedCharacter();
      const existing = proj.glyphs[char];
      if (!existing) return proj;

      return {
        ...proj,
        updatedAt: Date.now(),
        glyphs: {
          ...proj.glyphs,
          [char]: {
            ...existing,
            svgPath: nextSvg,
            isEmpty: nextSvg.trim().length === 0,
          },
        },
      };
    });

    this.refreshLiveFont();
  }

  loadPreset(presetId: string): void {
    const found = PRESET_LIST.find((p) => p.id === presetId);
    if (!found) return;

    const newProject = found.buildProject();
    this.project.set(newProject);
    this.undoStack.set([]);
    this.redoStack.set([]);
    this.refreshLiveFont();
  }

  updateProjectMetadata(metadata: Partial<FontProject['metadata']>): void {
    this.project.update((p) => ({
      ...p,
      updatedAt: Date.now(),
      metadata: {
        ...p.metadata,
        ...metadata,
      },
    }));
  }

  updateProjectMetrics(metrics: Partial<FontMetrics>): void {
    this.project.update((p) => ({
      ...p,
      updatedAt: Date.now(),
      metrics: {
        ...p.metrics,
        ...metrics,
      },
    }));
    this.refreshLiveFont();
  }

  addCustomCharacter(char: string): void {
    if (!char) return;
    const clean = char.trim().charAt(0);
    if (!clean) return;

    this.project.update((p) => {
      if (p.glyphs[clean]) return p;
      return {
        ...p,
        glyphs: {
          ...p.glyphs,
          [clean]: {
            id: `g_${clean.charCodeAt(0)}`,
            unicode: clean,
            character: clean,
            name: `custom_${clean.charCodeAt(0)}`,
            category: 'symbols',
            metrics: { advanceWidth: 600, leftSideBearing: 60 },
            contours: [],
            svgPath: '',
            isEmpty: true,
          },
        },
      };
    });

    this.selectCharacter(clean);
  }

  async refreshLiveFont(): Promise<void> {
    try {
      const family = await this.generator.registerPreviewFontFace(this.project());
      this.livePreviewFamily.set(family);
    } catch (e) {
      console.warn('Could not refresh live font preview:', e);
    }
  }
}
