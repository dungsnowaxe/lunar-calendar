/** Rec. 601 luma. */
export function rgbaToGray(rgba: Uint8Array | Uint8ClampedArray, pixelCount: number): Float64Array {
  const gray = new Float64Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const o = i * 4;
    gray[i] = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2];
  }
  return gray;
}

/**
 * Variance of a 3×3 Laplacian response. Sharp high-contrast edges score high;
 * a 26px backdrop blur collapses that energy.
 */
export function laplacianVariance(gray: Float64Array, width: number, height: number): number {
  if (width < 3 || height < 3) {
    throw new Error(`image too small for Laplacian: ${width}×${height}`);
  }
  let count = 0;
  let sum = 0;
  let sumSq = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const response = gray[i - width] + gray[i - 1] + gray[i + 1] + gray[i + width] - 4 * gray[i];
      sum += response;
      sumSq += response * response;
      count += 1;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

export function sharpnessRatio(outside: number, inside: number): number {
  if (!Number.isFinite(outside) || !Number.isFinite(inside)) {
    throw new Error(`non-finite sharpness: outside=${outside} inside=${inside}`);
  }
  if (inside <= 0) return Number.POSITIVE_INFINITY;
  return outside / inside;
}

function percentile(values: Float64Array, p: number): number {
  const arr = Array.from(values).sort((a, b) => a - b);
  const i = Math.min(arr.length - 1, Math.max(0, Math.floor(p * (arr.length - 1))));
  return arr[i];
}

/** Stretch p5–p95 so a dim-but-sharp glyph is not scored as "blurred". */
export function contrastNormalize(gray: Float64Array): Float64Array {
  const lo = percentile(gray, 0.05);
  const hi = percentile(gray, 0.95);
  const span = Math.max(hi - lo, 1);
  const out = new Float64Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.min(255, Math.max(0, ((gray[i] - lo) / span) * 255));
  }
  return out;
}

export function sobelMean(gray: Float64Array, width: number, height: number): number {
  if (width < 3 || height < 3) {
    throw new Error(`image too small for Sobel: ${width}×${height}`);
  }
  let sum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx =
        -gray[i - width - 1] +
        gray[i - width + 1] -
        2 * gray[i - 1] +
        2 * gray[i + 1] -
        gray[i + width - 1] +
        gray[i + width + 1];
      const gy =
        -gray[i - width - 1] -
        2 * gray[i - width] -
        gray[i - width + 1] +
        gray[i + width - 1] +
        2 * gray[i + width] +
        gray[i + width + 1];
      sum += Math.hypot(gx, gy);
      count += 1;
    }
  }
  return sum / count;
}

/** Contrast-normalized Sobel. Catches dim-but-crisp glyphs a Laplacian miss. */
export function contrastNormalizedEdgeScore(
  gray: Float64Array,
  width: number,
  height: number,
): number {
  return sobelMean(contrastNormalize(gray), width, height);
}
