import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contrastNormalizedEdgeScore,
  laplacianVariance,
  rgbaToGray,
  sharpnessRatio,
} from "./image-sharpness.ts";

function checkerboard(width: number, height: number, cell: number): Float64Array {
  const gray = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      gray[y * width + x] = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1) === 0 ? 0 : 255;
    }
  }
  return gray;
}

function boxBlur(src: Float64Array, width: number, height: number, radius: number): Float64Array {
  const out = new Float64Array(src.length);
  const area = (2 * radius + 1) ** 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = Math.min(width - 1, Math.max(0, x + dx));
          acc += src[yy * width + xx];
        }
      }
      out[y * width + x] = acc / area;
    }
  }
  return out;
}

test("rgbaToGray uses Rec. 601 weights", () => {
  const rgba = Uint8Array.of(255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255);
  const gray = rgbaToGray(rgba, 3);
  assert.equal(Math.round(gray[0]), 76);
  assert.equal(Math.round(gray[1]), 150);
  assert.equal(Math.round(gray[2]), 29);
});

test("Laplacian variance is much lower after a wide blur", () => {
  const width = 64;
  const height = 64;
  const sharp = checkerboard(width, height, 4);
  const blurred = boxBlur(sharp, width, height, 8);
  const sharpScore = laplacianVariance(sharp, width, height);
  const blurScore = laplacianVariance(blurred, width, height);
  assert.ok(sharpScore > 1000, `sharp Laplacian too low: ${sharpScore}`);
  assert.ok(
    sharpnessRatio(sharpScore, blurScore) >= 5,
    `expected ≥5× drop, got ${sharpScore} / ${blurScore}`,
  );
});

test("sharpnessRatio is outside / inside", () => {
  assert.equal(sharpnessRatio(100, 10), 10);
  assert.equal(sharpnessRatio(5, 0), Number.POSITIVE_INFINITY);
});

test("contrast-normalized Sobel still sees dim sharp edges that Laplacian under-scores", () => {
  const width = 64;
  const height = 64;
  const loud = checkerboard(width, height, 4);
  const dim = new Float64Array(loud.length);
  for (let i = 0; i < dim.length; i++) dim[i] = loud[i] === 0 ? 40 : 50;
  const dimBlur = boxBlur(dim, width, height, 8);
  const dimLap = laplacianVariance(dim, width, height);
  const loudLap = laplacianVariance(loud, width, height);
  assert.ok(
    loudLap / dimLap > 10,
    `Laplacian should collapse on low contrast: ${loudLap}/${dimLap}`,
  );
  const dimEdges = contrastNormalizedEdgeScore(dim, width, height);
  const blurEdges = contrastNormalizedEdgeScore(dimBlur, width, height);
  assert.ok(
    sharpnessRatio(dimEdges, blurEdges) >= 5,
    `normalized Sobel should still drop ≥5× after blur: ${dimEdges} / ${blurEdges}`,
  );
});
