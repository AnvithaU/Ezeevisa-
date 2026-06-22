import cv from "@techstark/opencv-js";

let cvReady: Promise<void> | null = null;
let glassesClassifier: any = null;

async function ensureOpenCVLoaded(): Promise<void> {
  if (cvReady) return cvReady;
  cvReady = (async () => {
    await new Promise<void>((resolve) => {
      if ((cv as any).Mat) return resolve();
      (cv as any).onRuntimeInitialized = () => resolve();
    });
    const res = await fetch(
      "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_eye_tree_eyeglasses.xml",
    );
    const xml = await res.text();
    const xmlBytes = new TextEncoder().encode(xml);
    cv.FS_createDataFile("/", "glasses.xml", xmlBytes, true, false, false);
    glassesClassifier = new cv.CascadeClassifier();
    glassesClassifier.load("/glasses.xml");
  })();
  return cvReady;
}

export interface EyeRegionBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Attempts to detect glasses within the given eye-region box of a canvas.
 * Returns:
 *   true  -> glasses likely detected
 *   false -> no glasses detected
 *   null  -> detection unavailable (load/runtime error) - caller should
 *            treat this as "skip check", never as a failure.
 *
 * This function intentionally never throws.
 */
export async function detectGlassesSafe(
  canvas: HTMLCanvasElement,
  eyeBox: EyeRegionBox,
): Promise<boolean | null> {
  try {
    await ensureOpenCVLoaded();

    const safeX = Math.max(0, Math.round(eyeBox.x));
    const safeY = Math.max(0, Math.round(eyeBox.y));
    const safeW = Math.max(1, Math.round(eyeBox.w));
    const safeH = Math.max(1, Math.round(eyeBox.h));

    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const clampedW = Math.min(safeW, gray.cols - safeX);
    const clampedH = Math.min(safeH, gray.rows - safeY);

    if (clampedW <= 0 || clampedH <= 0) {
      src.delete();
      gray.delete();
      return null;
    }

    const roi = gray.roi(new cv.Rect(safeX, safeY, clampedW, clampedH));
    const matches = new cv.RectVector();
    glassesClassifier.detectMultiScale(
      roi,
      matches,
      1.1,
      3,
      0,
      new cv.Size(20, 20),
    );
    const found = matches.size() > 0;

    src.delete();
    gray.delete();
    roi.delete();
    matches.delete();

    return found;
  } catch (err) {
    console.warn("Glasses detection skipped:", err);
    return null;
  }
}
