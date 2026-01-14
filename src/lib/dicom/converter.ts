import sharp from 'sharp';

const MAX_WIDTH = 2048;

/**
 * Apply windowing to enhance pancreas visibility
 * DICOM windowing adjusts grayscale values for better visualization
 */
function applyWindowing(
  pixelData: Uint8Array,
  windowCenter: number = 50,
  windowWidth: number = 100
): Uint8Array {
  const windowedData = new Uint8Array(pixelData.length);
  const windowMin = windowCenter - windowWidth / 2;
  const windowMax = windowCenter + windowWidth / 2;

  for (let i = 0; i < pixelData.length; i++) {
    let value = pixelData[i];

    // Apply windowing
    if (value < windowMin) {
      value = 0;
    } else if (value > windowMax) {
      value = 255;
    } else {
      value = ((value - windowMin) / (windowMax - windowMin)) * 255;
    }

    windowedData[i] = Math.round(value);
  }

  return windowedData;
}

/**
 * Convert DICOM slice pixel data to PNG
 */
export async function convertSliceToPNG(
  pixelData: Uint8Array,
  width: number,
  height: number,
  windowCenter: number = 50,
  windowWidth: number = 100
): Promise<Buffer> {
  try {
    // Apply windowing to enhance contrast
    const windowedData = applyWindowing(pixelData, windowCenter, windowWidth);

    // Create raw image buffer (grayscale)
    const raw = Buffer.alloc(width * height);
    for (let i = 0; i < windowedData.length; i++) {
      raw[i] = windowedData[i];
    }

    // Convert to PNG using sharp with resizing
    const pngBuffer = await sharp(raw, {
      raw: {
        width,
        height,
        channels: 1,
      },
    })
      .resize(Math.min(width, MAX_WIDTH), Math.min(height, MAX_WIDTH), {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: 'lanczos3',
      })
      .png({
        quality: 90,
      })
      .toBuffer();

    return pngBuffer;
  } catch (error) {
    throw new Error(
      `Failed to convert slice to PNG: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Optimize and resize image (for non-DICOM files like PNG/JPEG)
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  maxWidth: number = MAX_WIDTH
): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    // Resize if needed
    if (metadata.width && metadata.width > maxWidth) {
      return await sharp(imageBuffer)
        .resize(maxWidth, undefined, {
          withoutEnlargement: true,
          kernel: 'lanczos3',
        })
        .toBuffer();
    }

    return imageBuffer;
  } catch (error) {
    throw new Error(
      `Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
