import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FontState } from '../../core/services/font-state';
import { FontGenerator } from '../../core/services/font-generator';
import { generateStandaloneGlyphSvg, generateSvgSpriteSheet } from '../../core/vector/path-math';

@Component({
  selector: 'app-export-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop button -->
      <button
        type="button"
        aria-label="Close export dialog backdrop"
        class="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm cursor-default border-none outline-none"
        (click)="closeModal.emit()"
      ></button>

      <div
        class="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10"
      >
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <mat-icon class="text-lg">file_download</mat-icon>
            </div>
            <div>
              <h2 id="export-dialog-title" class="text-base font-bold text-white">Export Font &amp; SVG Files</h2>
              <p class="text-xs text-slate-400">100% Client-Side generation &middot; Ready to download and use anywhere</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <mat-icon class="text-base">close</mat-icon>
          </button>
        </div>

        <!-- Tabs Navigation -->
        <div class="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            (click)="activeTab.set('svg-font')"
            [class]="activeTab() === 'svg-font' ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900/50' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-3 transition-colors flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">code</mat-icon>
            <span>SVG Font (.svg)</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('svg-glyphs')"
            [class]="activeTab() === 'svg-glyphs' ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900/50' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-3 transition-colors flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">image</mat-icon>
            <span>Individual SVGs (ZIP)</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('ttf')"
            [class]="activeTab() === 'ttf' ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900/50' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-3 transition-colors flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">font_download</mat-icon>
            <span>Installable Font (.ttf)</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('webfont')"
            [class]="activeTab() === 'webfont' ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900/50' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-3 transition-colors flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">language</mat-icon>
            <span>Web Font &amp; CSS</span>
          </button>
        </div>

        <!-- Tab Body Content -->
        <div class="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          <!-- TAB 1: SVG Font (.svg) -->
          @if (activeTab() === 'svg-font') {
            <div class="flex flex-col gap-3">
              <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-slate-300 leading-relaxed">
                <span class="font-bold text-amber-300">SVG Font Specification:</span>
                Creates an SVG 1.1 vector font file containing all glyph vector curves embedded with their unicode mappings, metrics, and font headers.
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  (click)="downloadSvgFont()"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all"
                >
                  <mat-icon class="text-base">file_download</mat-icon>
                  <span>Download SVG Font (.svg)</span>
                </button>

                <button
                  type="button"
                  (click)="downloadSvgSprite()"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  <mat-icon class="text-sm">grid_view</mat-icon>
                  <span>Download SVG Sprite Sheet</span>
                </button>

                <button
                  type="button"
                  (click)="copyToClipboard(svgFontXml(), 'SVG Font XML')"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  <mat-icon class="text-sm">{{ copySuccess() === 'SVG Font XML' ? 'check' : 'content_copy' }}</mat-icon>
                  <span>{{ copySuccess() === 'SVG Font XML' ? 'Copied!' : 'Copy XML Code' }}</span>
                </button>
              </div>

              <!-- Code preview -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56">
                <pre>{{ svgFontXmlSnippet() }}</pre>
              </div>
            </div>
          }

          <!-- TAB 2: Individual SVGs & ZIP -->
          @if (activeTab() === 'svg-glyphs') {
            <div class="flex flex-col gap-3">
              <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-slate-300 leading-relaxed">
                <span class="font-bold text-blue-300">Vector SVG Glyphs:</span>
                Export individual standalone SVG files for every letter you created. Ideal for Figma, Inkscape, Adobe Illustrator, or vinyl cutting machines (like Cricut)!
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Download All ZIP -->
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div class="font-bold text-slate-100 text-sm mb-1">Download All Glyphs (ZIP)</div>
                    <p class="text-slate-400 text-[11px]">
                      A ZIP folder with separate .svg vector files for all {{ state.completedGlyphCount() }} drawn characters.
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="downloadAllGlyphsZip()"
                    [disabled]="isZipping()"
                    class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold transition-all disabled:opacity-50"
                  >
                    <mat-icon class="text-base">{{ isZipping() ? 'hourglass_top' : 'folder_zip' }}</mat-icon>
                    <span>{{ isZipping() ? 'Creating ZIP...' : 'Download Glyphs (.zip)' }}</span>
                  </button>
                </div>

                <!-- Download Current Glyph SVG -->
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div class="font-bold text-slate-100 text-sm mb-1">Current Letter '{{ state.selectedCharacter() }}' SVG</div>
                    <p class="text-slate-400 text-[11px]">
                      Download only the active letter '{{ state.selectedCharacter() }}' as a standalone SVG vector.
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="downloadSingleGlyphSvg()"
                      class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
                    >
                      <mat-icon class="text-base">download</mat-icon>
                      <span>Download .svg</span>
                    </button>
                    <button
                      type="button"
                      (click)="copyToClipboard(state.currentGlyph().svgPath, 'SVG Path')"
                      class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Copy path d attribute"
                    >
                      <mat-icon class="text-base">{{ copySuccess() === 'SVG Path' ? 'check' : 'content_copy' }}</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- TAB 3: TrueType Font (.ttf) -->
          @if (activeTab() === 'ttf') {
            <div class="flex flex-col gap-3">
              <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-slate-300 leading-relaxed">
                <span class="font-bold text-emerald-300">TrueType Font (.ttf):</span>
                Real, installable font file compatible with Windows, macOS, iOS, Linux, Android, Microsoft Word, Google Docs, Adobe Illustrator, and Figma.
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-bold text-slate-100 text-sm">{{ state.project().metadata.familyName }}.ttf</div>
                    <div class="text-[11px] text-slate-400">{{ state.completedGlyphCount() }} characters &middot; Ready to install</div>
                  </div>
                  <button
                    type="button"
                    (click)="downloadTtf()"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    <mat-icon class="text-base">download</mat-icon>
                    <span>Download .TTF Font</span>
                  </button>
                </div>

                <div class="border-t border-slate-800 pt-3 text-[11px] text-slate-400 flex flex-col gap-1">
                  <div class="font-semibold text-slate-300">Font Installation Guide:</div>
                  <div>1. Click <strong>Download .TTF Font</strong> above.</div>
                  <div>2. Double-click the downloaded file in your Downloads folder.</div>
                  <div>3. Click the <strong>"Install Font"</strong> button in the window that pops up.</div>
                  <div>4. Open Word, Photoshop, or Pages and select <em>{{ state.project().metadata.familyName }}</em> from the font menu!</div>
                </div>
              </div>
            </div>
          }

          <!-- TAB 4: Web Font & CSS -->
          @if (activeTab() === 'webfont') {
            <div class="flex flex-col gap-3">
              <div class="text-slate-300">
                Use your custom font on any website by adding this CSS to your stylesheet:
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto relative">
                <button
                  type="button"
                  (click)="copyToClipboard(cssSnippet(), 'CSS')"
                  class="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  {{ copySuccess() === 'CSS' ? 'Copied!' : 'Copy CSS' }}
                </button>
                <pre>{{ cssSnippet() }}</pre>
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span class="text-xs text-slate-500">FontCraft Studio &middot; Client-Side SVG &amp; Vector Typography Engine</span>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ExportModalComponent {
  readonly state = inject(FontState);
  private readonly generator = inject(FontGenerator);

  readonly closeModal = output<void>();

  readonly activeTab = signal<'svg-font' | 'svg-glyphs' | 'ttf' | 'webfont'>('svg-font');
  readonly isZipping = signal<boolean>(false);
  readonly copySuccess = signal<string | null>(null);

  svgFontXml(): string {
    return this.generator.exportSvgFontString(this.state.project());
  }

  svgFontXmlSnippet(): string {
    const full = this.svgFontXml();
    if (full.length > 2500) {
      return full.substring(0, 2500) + '\n\n<!-- ... remaining glyphs ... -->\n  </font>\n</defs>\n</svg>';
    }
    return full;
  }

  downloadSvgFont(): void {
    const xml = this.svgFontXml();
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `${this.state.project().metadata.familyName.replace(/\s+/g, '_')}_font.svg`;
    this.generator.downloadBlob(blob, filename);
  }

  downloadSvgSprite(): void {
    const spriteXml = generateSvgSpriteSheet(this.state.project());
    const blob = new Blob([spriteXml], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `${this.state.project().metadata.familyName.replace(/\s+/g, '_')}_sprites.svg`;
    this.generator.downloadBlob(blob, filename);
  }

  async downloadAllGlyphsZip(): Promise<void> {
    this.isZipping.set(true);
    try {
      const zipBlob = await this.generator.exportAllGlyphsZip(this.state.project());
      const filename = `${this.state.project().metadata.familyName.replace(/\s+/g, '_')}_svg_glyphs.zip`;
      this.generator.downloadBlob(zipBlob, filename);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      this.isZipping.set(false);
    }
  }

  downloadSingleGlyphSvg(): void {
    const current = this.state.currentGlyph();
    const svgStr = generateStandaloneGlyphSvg(current, this.state.project().metrics);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `${this.state.project().metadata.familyName.replace(/\s+/g, '_')}_glyph_${current.character}.svg`;
    this.generator.downloadBlob(blob, filename);
  }

  downloadTtf(): void {
    const blob = this.generator.exportTtfBlob(this.state.project());
    const filename = `${this.state.project().metadata.familyName.replace(/\s+/g, '_')}.ttf`;
    this.generator.downloadBlob(blob, filename);
  }

  cssSnippet(): string {
    const family = this.state.project().metadata.familyName;
    const filename = `${family.replace(/\s+/g, '_')}.ttf`;
    return `@font-face {
  font-family: '${family}';
  src: url('${filename}') format('truetype');
  font-weight: normal;
  font-style: normal;
}

/* Use it on your elements */
.my-custom-heading {
  font-family: '${family}', sans-serif;
}`;
  }

  copyToClipboard(text: string, label: string): void {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          this.copySuccess.set(label);
          setTimeout(() => this.copySuccess.set(null), 2000);
        },
        () => this.fallbackCopy(text, label)
      );
    } else {
      this.fallbackCopy(text, label);
    }
  }

  private fallbackCopy(text: string, label: string): void {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copySuccess.set(label);
      setTimeout(() => this.copySuccess.set(null), 2000);
    } catch {
      // Ignore if copy fails
    }
  }
}
