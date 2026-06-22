/**
 * Heuristic "possible hat / head covering" detector.
 *
 * This is NOT a trained model — it's a rough color/uniformity check on the
 * strip of pixels just above the forehead. It is intentionally conservative
 * and meant only to produce a soft warning, never a hard failure, since
 * false positives (dark hair, shadows, low lighting) are common.
 *
 * Returns:
 *   true  -> region looks suspicious (possible hat/head covering)
 *   false -> region looks like normal hair/skin/background
 *   null  -> couldn't analyze (e.g. region out of bounds) - skip silently
 *
 * This function never throws.
 */
export function detectPossibleHat(
  canvas: HTMLCanvasElement,
  foreheadTopY: number,
  faceLeftX: number,
  faceWidth: number,
): boolean | null {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const stripHeight = Math.max(10, Math.round(faceWidth * 0.12));
    const sampleY = Math.max(0, Math.round(foreheadTopY - stripHeight - 6));
    const sampleX = Math.max(0, Math.round(faceLeftX));
    const sampleW = Math.min(Math.round(faceWidth), canvas.width - sampleX);

    if (sampleW <= 0 || sampleY < 0 || sampleY + stripHeight > canvas.height) {
      return null;
    }

    const imageData = ctx.getImageData(sampleX, sampleY, sampleW, stripHeight);
    const data = imageData.data;
    const pixelCount = data.length / 4;

    if (pixelCount === 0) return null;

    // Compute average color and saturation-ish spread across the strip.
    let rSum = 0,
      gSum = 0,
      bSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }
    const rAvg = rSum / pixelCount;
    const gAvg = gSum / pixelCount;
    const bAvg = bSum / pixelCount;

    // Variance from the average - hats/fabric tend to be more uniform
    // than hair texture, skin, or a plain background blending into hair.
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - rAvg;
      const dg = data[i + 1] - gAvg;
      const db = data[i + 2] - bAvg;
      variance += dr * dr + dg * dg + db * db;
    }
    variance /= pixelCount;

    const max = Math.max(rAvg, gAvg, bAvg);
    const min = Math.min(rAvg, gAvg, bAvg);
    const saturationProxy = max === 0 ? 0 : (max - min) / max;

    // Heuristic thresholds: low variance (uniform fabric-like texture)
    // combined with a noticeably saturated/non-skin-non-black average color.
    const isUniform = variance < 250;
    const isColorful = saturationProxy > 0.25 && max > 60;
    const isSuspicious = isUniform && isColorful;

    return isSuspicious;
  } catch (err) {
    console.warn("Hat detection skipped:", err);
    return null;
  }
}
