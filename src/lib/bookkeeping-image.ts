/** Convert any raster receipt to JPEG/PNG that pdf-lib can embed. */
export async function toPdfEmbeddableImage(
  bytes: Uint8Array,
  mime: string | null,
): Promise<{ bytes: Uint8Array; mime: "image/jpeg" | "image/png" } | null> {
  const type = (mime || "").toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") {
    return { bytes, mime: "image/jpeg" };
  }
  if (type === "image/png") {
    return { bytes, mime: "image/png" };
  }
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(bytes).rotate().jpeg({ quality: 85 }).toBuffer();
    return { bytes: new Uint8Array(jpeg), mime: "image/jpeg" };
  } catch {
    return type.startsWith("image/") ? { bytes, mime: "image/jpeg" } : null;
  }
}
