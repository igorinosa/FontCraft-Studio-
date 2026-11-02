import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';
import { AutoTracer, TraceResult } from '../../core/vector/auto-tracer';
import { AutoTraceSettings } from '../../core/models/font.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auto-trace-modal',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop Button -->
      <button
        type="button"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-default"
        (click)="close()"
        aria-label="Close modal backdrop"
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trace-modal-title"
        class="relative z-10 bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md">
              <mat-icon>auto_fix_high</mat-icon>
            </div>
            <div>
              <h2 id="trace-modal-title" class="text-lg font-bold text-white flex items-center gap-2">
                Auto-Trace Vectorizer
                <span class="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                  Target: '{{ state.selectedCharacter() }}'
                </span>
              </h2>
              <p class="text-xs text-slate-400">Convert bitmap sketches, logos, or photos into smooth vector outlines</p>
            </div>
          </div>
          <button
            type="button"
            (click)="close()"
            matTooltip="Close dialog"
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- 1. Image Upload or Sample Selection -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Choose or Drop an Image
            </span>

            <!-- Drop Zone Button -->
            <button
              type="button"
              (dragover)="onDragOver($event)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
              class="w-full border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-800/40 group block"
            >
              <input
                #fileInput
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                class="hidden"
              />
              <mat-icon class="text-3xl text-slate-400 group-hover:text-amber-400 transition-colors mb-1">
                cloud_upload
              </mat-icon>
              <p class="text-sm font-medium text-slate-200">
                Click to browse or drop an image here
              </p>
              <p class="text-xs text-slate-500 mt-0.5">Supports PNG, JPG, GIF, WebP, SVG sketches</p>
            </button>

            <!-- Instant Sample Sketches -->
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <span class="text-xs text-slate-400">Or try a sample sketch:</span>
              <button
                type="button"
                (click)="loadSample('heart')"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
              >
                <span>❤️ Heart</span>
              </button>
              <button
                type="button"
                (click)="loadSample('cursive_s')"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
              >
                <span>✒️ Calligraphy S</span>
              </button>
              <button
                type="button"
                (click)="loadSample('star')"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
              >
                <span>⭐ Star</span>
              </button>
              <button
                type="button"
                (click)="loadSample('bold_a')"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
              >
                <span>🅰️ Bold Letter A</span>
              </button>
            </div>
          </div>

          <!-- Hidden canvas for pixel extraction -->
          <canvas #hiddenCanvas class="hidden"></canvas>

          <!-- 2. Dual Preview & Sliders -->
          @if (hasImage()) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Left: Original Image -->
              <div class="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col items-center">
                <span class="text-xs font-semibold text-slate-400 mb-2">Original Source</span>
                <div class="w-full h-48 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800">
                  <img
                    [src]="imagePreviewUrl()"
                    alt="Source"
                    class="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              <!-- Right: Traced Vector Result -->
              <div class="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col items-center">
                <div class="w-full flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-amber-400">Vector Traced Contour</span>
                  @if (traceResult()) {
                    <span class="text-[11px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                      {{ traceResult()?.pointCount }} points • {{ traceResult()?.contours?.length }} contours
                    </span>
                  }
                </div>
                <div class="w-full h-48 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-700 relative">
                  @if (traceResult() && traceResult()?.svgPath) {
                    <svg viewBox="0 0 1000 1000" class="w-full h-full p-2">
                      <path
                        [attr.d]="traceResult()?.svgPath"
                        fill="#0f172a"
                        fill-rule="nonzero"
                      />
                    </svg>
                  } @else {
                    <p class="text-xs text-slate-500">Adjust threshold to reveal vector lines</p>
                  }
                </div>
              </div>
            </div>

            <!-- 3. Real-Time Trace Settings Sliders -->
            <div class="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Threshold Slider -->
                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="font-medium text-slate-300">Black/White Cutoff (Threshold)</span>
                    <span class="font-mono text-amber-400 font-bold">{{ traceSettings().threshold }}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="245"
                    step="5"
                    [value]="traceSettings().threshold"
                    (input)="onThresholdChange($event)"
                    class="w-full accent-amber-400 cursor-pointer"
                  />
                  <p class="text-[10px] text-slate-500 mt-1">Lower catches lighter strokes; higher for dark bold marks</p>
                </div>

                <!-- Smoothing / Detail Slider -->
                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="font-medium text-slate-300">Curve Smoothing &amp; Detail</span>
                    <span class="font-mono text-amber-400 font-bold">{{ traceSettings().smoothing }}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    [value]="traceSettings().smoothing"
                    (input)="onSmoothingChange($event)"
                    class="w-full accent-amber-400 cursor-pointer"
                  />
                  <p class="text-[10px] text-slate-500 mt-1">Removes jitter and creates clean bezier curves</p>
                </div>
              </div>

              <!-- Toggles: Invert & ScaleToFit -->
              <div class="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800/80">
                <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    [checked]="traceSettings().invert"
                    (change)="toggleInvert()"
                    class="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Invert Colors (Trace white lines on dark background)</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    [checked]="traceSettings().scaleToFit"
                    (change)="toggleScaleToFit()"
                    class="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Fit &amp; Align to Typographic Em-Square (Baseline 800)</span>
                </label>
              </div>
            </div>
          }
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            (click)="close()"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            (click)="applyTraceToGlyph()"
            [disabled]="!traceResult() || !traceResult()?.svgPath"
            class="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <mat-icon class="text-base">check_circle</mat-icon>
            <span>Insert Traced Vector into '{{ state.selectedCharacter() }}'</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AutoTraceModalComponent {
  readonly state = inject(FontState);
  readonly hiddenCanvas = viewChild<ElementRef<HTMLCanvasElement>>('hiddenCanvas');

  readonly hasImage = signal<boolean>(false);
  readonly imagePreviewUrl = signal<string>('');
  readonly loadedImageData = signal<ImageData | null>(null);

  readonly traceSettings = signal<AutoTraceSettings>({
    threshold: 128,
    invert: false,
    smoothing: 2.5,
    minArea: 8,
    scaleToFit: true,
  });

  readonly traceResult = signal<TraceResult | null>(null);

  close(): void {
    this.state.closeAutoTraceModal();
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.processFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      this.loadImageFromDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  loadImageFromDataUrl(dataUrl: string): void {
    this.imagePreviewUrl.set(dataUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = this.hiddenCanvas()?.nativeElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Limit max resolution for snappy instant responsiveness
      const maxDim = 300;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      this.loadedImageData.set(imgData);
      this.hasImage.set(true);
      this.runTrace();
    };
    img.src = dataUrl;
  }

  loadSample(sampleType: 'heart' | 'cursive_s' | 'star' | 'bold_a'): void {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';

    if (sampleType === 'heart') {
      ctx.beginPath();
      ctx.moveTo(80, 130);
      ctx.bezierCurveTo(40, 90, 20, 60, 20, 40);
      ctx.bezierCurveTo(20, 15, 50, 15, 80, 45);
      ctx.bezierCurveTo(110, 15, 140, 15, 140, 40);
      ctx.bezierCurveTo(140, 60, 120, 90, 80, 130);
      ctx.fill();
    } else if (sampleType === 'cursive_s') {
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(110, 35);
      ctx.bezierCurveTo(50, 20, 40, 70, 80, 85);
      ctx.bezierCurveTo(120, 100, 110, 145, 45, 135);
      ctx.stroke();
    } else if (sampleType === 'star') {
      ctx.beginPath();
      const points = 5;
      const step = Math.PI / points;
      let angle = -Math.PI / 2;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? 60 : 25;
        const x = 80 + r * Math.cos(angle);
        const y = 80 + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        angle += step;
      }
      ctx.closePath();
      ctx.fill();
    } else if (sampleType === 'bold_a') {
      ctx.font = 'bold 110px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', 80, 85);
    }

    const dataUrl = canvas.toDataURL();
    this.loadImageFromDataUrl(dataUrl);
  }

  runTrace(): void {
    const imgData = this.loadedImageData();
    if (!imgData) return;

    const res = AutoTracer.traceImageData(imgData, this.traceSettings());
    this.traceResult.set(res);
  }

  onThresholdChange(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    this.traceSettings.update((s) => ({ ...s, threshold: val }));
    this.runTrace();
  }

  onSmoothingChange(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    this.traceSettings.update((s) => ({ ...s, smoothing: val }));
    this.runTrace();
  }

  toggleInvert(): void {
    this.traceSettings.update((s) => ({ ...s, invert: !s.invert }));
    this.runTrace();
  }

  toggleScaleToFit(): void {
    this.traceSettings.update((s) => ({ ...s, scaleToFit: !s.scaleToFit }));
    this.runTrace();
  }

  applyTraceToGlyph(): void {
    const res = this.traceResult();
    if (!res || !res.svgPath) return;

    this.state.updateGlyphPath(
      res.svgPath,
      res.contours,
      `Auto-trace bitmap (${res.pointCount} pts)`
    );
    this.close();
  }
}
