import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FontState } from '../../core/services/font-state';
import { generateStandaloneGlyphSvg } from '../../core/vector/path-math';
import { FontGenerator } from '../../core/services/font-generator';

@Component({
  selector: 'app-svg-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="svg-dialog-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <button
        type="button"
        aria-label="Close SVG dialog backdrop"
        class="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm cursor-default border-none outline-none"
        (click)="closeModal.emit()"
      ></button>

      <!-- Modal Panel -->
      <div
        class="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <mat-icon class="text-lg">code</mat-icon>
            </div>
            <div>
              <h2 id="svg-dialog-title" class="text-base font-bold text-white">SVG Vector Editor &amp; Importer</h2>
              <p class="text-xs text-slate-400">Edit or import raw SVG vectors for character '{{ state.selectedCharacter() }}'</p>
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

        <!-- Mode Tabs -->
        <div class="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-2 text-xs font-semibold">
          <button
            type="button"
            (click)="tab.set('editor')"
            [class]="tab() === 'editor' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900/50' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-3 transition-colors flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">edit_note</mat-icon>
            <span>Live SVG Code</span>
          </button>
          <button
            type="button"
            (click)="tab.set('import')"
            [class]="tab() === 'import' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900/50' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-3 transition-colors flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">file_upload</mat-icon>
            <span>Import / Paste SVG</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          <!-- Live Editor Tab -->
          @if (tab() === 'editor') {
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-slate-300 font-semibold">SVG Path Data (d attribute):</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="copyCode(pathText(), 'path')"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <mat-icon class="text-xs">{{ copyFeedback() === 'path' ? 'check' : 'content_copy' }}</mat-icon>
                    <span>{{ copyFeedback() === 'path' ? 'Copied' : 'Copy d="..."' }}</span>
                  </button>
                  <button
                    type="button"
                    (click)="copyCode(fullSvgMarkup(), 'full')"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <mat-icon class="text-xs">{{ copyFeedback() === 'full' ? 'check' : 'content_copy' }}</mat-icon>
                    <span>{{ copyFeedback() === 'full' ? 'Copied' : 'Copy &lt;svg&gt;' }}</span>
                  </button>
                </div>
              </div>

              <!-- Editable Textarea -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-cyan-300">
                <textarea
                  #editorInput
                  [value]="pathText()"
                  (input)="pathText.set(editorInput.value)"
                  rows="6"
                  class="w-full bg-transparent border-none outline-none resize-y text-slate-200 font-mono text-xs leading-relaxed"
                  placeholder="M 100 200 L 300 400 ... Z"
                ></textarea>
              </div>

              <!-- Preview thumbnail -->
              <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center gap-4">
                <div class="w-16 h-16 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                  <svg viewBox="0 0 1000 1000" class="w-full h-full text-white">
                    <path [attr.d]="pathText()" fill="currentColor" />
                  </svg>
                </div>
                <div class="text-[11px] text-slate-400 leading-snug">
                  Edit the path commands directly above and click <strong class="text-cyan-300">Apply Changes</strong> to update the letter in real time!
                </div>
              </div>
            </div>
          }

          <!-- Import / Paste Tab -->
          @if (tab() === 'import') {
            <div class="flex flex-col gap-3">
              <div class="text-slate-300 leading-relaxed">
                Import an SVG vector from Figma, Illustrator, or an icon library. Upload a <code class="text-cyan-400">.svg</code> file or paste the SVG markup below:
              </div>

              <!-- File Upload Drop Box -->
              <label class="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-colors">
                <mat-icon class="text-2xl text-cyan-400">cloud_upload</mat-icon>
                <div class="text-xs font-semibold text-slate-200">Click to upload SVG file</div>
                <div class="text-[10px] text-slate-500">Supports standalone .svg vector graphics</div>
                <input type="file" accept=".svg" (change)="onFileSelected($event)" class="hidden" />
              </label>

              <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Or Paste SVG Markup / Path</div>
              <textarea
                [value]="pasteText()"
                (input)="onPasteChange($event)"
                rows="4"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 outline-none focus:border-cyan-400"
                placeholder="<svg ...><path d='M...' /></svg>"
              ></textarea>

              @if (importError()) {
                <div class="text-rose-400 text-xs flex items-center gap-1">
                  <mat-icon class="text-sm">error_outline</mat-icon>
                  <span>Could not extract path from provided SVG. Please verify valid SVG markup.</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            (click)="downloadSingleSvg()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <mat-icon class="text-sm">download</mat-icon>
            <span>Download .svg</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="closeModal.emit()"
              class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            @if (tab() === 'editor') {
              <button
                type="button"
                (click)="applyEditorChanges()"
                class="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
              >
                Apply Changes
              </button>
            } @else {
              <button
                type="button"
                (click)="applyImport(pasteText())"
                class="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
              >
                Import to '{{ state.selectedCharacter() }}'
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SvgModalComponent {
  readonly state = inject(FontState);
  private readonly generator = inject(FontGenerator);

  readonly closeModal = output<void>();

  readonly tab = signal<'editor' | 'import'>('editor');
  readonly pathText = signal<string>(this.state.currentGlyph().svgPath || '');
  readonly pasteText = signal<string>('');
  readonly copyFeedback = signal<string | null>(null);
  readonly importError = signal<boolean>(false);

  onPasteChange(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.pasteText.set(val);
  }

  fullSvgMarkup(): string {
    return generateStandaloneGlyphSvg(this.state.currentGlyph(), this.state.project().metrics);
  }

  copyCode(text: string, type: string): void {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          this.copyFeedback.set(type);
          setTimeout(() => this.copyFeedback.set(null), 2000);
        },
        () => this.fallbackCopy(text, type)
      );
    } else {
      this.fallbackCopy(text, type);
    }
  }

  private fallbackCopy(text: string, type: string): void {
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
      this.copyFeedback.set(type);
      setTimeout(() => this.copyFeedback.set(null), 2000);
    } catch {
      // Ignore
    }
  }

  applyEditorChanges(): void {
    const val = this.pathText();
    this.state.updateGlyphPath(val);
    this.closeModal.emit();
  }

  applyImport(rawText: string): void {
    this.importError.set(false);
    if (!rawText.trim()) return;

    const success = this.state.importSvgContent(rawText);
    if (success) {
      this.closeModal.emit();
    } else {
      this.importError.set(true);
    }
  }

  onFileSelected(event: Event): void {
    this.importError.set(false);
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const success = this.state.importSvgContent(content);
        if (success) {
          this.closeModal.emit();
        } else {
          this.importError.set(true);
        }
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  downloadSingleSvg(): void {
    const current = this.state.currentGlyph();
    const svgStr = generateStandaloneGlyphSvg(current, this.state.project().metrics);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `${this.state.project().metadata.familyName.replace(/\s+/g, '_')}_glyph_${current.character}.svg`;
    this.generator.downloadBlob(blob, filename);
  }
}
