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
