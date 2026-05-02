import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";

const MIME_TABLE = /** @type {const} */ ([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

/** @param {string} type */
export function extForMime(type) {
  const m = MIME_TABLE.find(([t]) => t === type.toLowerCase());
  return m ? m[1] : null;
}

/** @returns {string[]} */
export function allowedMimeTypes() {
  return MIME_TABLE.map(([t]) => t);
}

const AVATARS_REL = ["uploads", "avatars"];

/**
 * Public URL `/uploads/avatars/<mongooseId>.<ext>`
 * @param {string} userId 24-char hex id
 * @param {string} extWithoutDot
 */
export function avatarPublicPath(userId, extWithoutDot) {
  if (!/^[a-f\d]{24}$/i.test(userId)) return null;
  if (!/^jpe?g|png|webp|gif$/i.test(extWithoutDot)) return null;
  return `/uploads/avatars/${userId}.${extWithoutDot}`;
}

/** Filesystem absolute path inside `public/` for our stored URLs */
export function absolutePublicPathForAvatarUrl(urlPath) {
  if (typeof urlPath !== "string" || !urlPath.startsWith("/uploads/avatars/")) {
    return null;
  }
  const fname = urlPath.slice("/uploads/avatars/".length);
  if (!/^[a-f\d]{24}\.[a-z0-9]{2,8}$/i.test(fname)) return null;
  return join(process.cwd(), "public", ...AVATARS_REL, fname);
}

/** @param {string | null | undefined} urlPath */
export async function deleteStoredAvatar(urlPath) {
  if (urlPath == null || urlPath === "") return;
  const abs = absolutePublicPathForAvatarUrl(urlPath);
  if (!abs) return;
  try {
    await unlink(abs);
  } catch {
    /* file missing OK */
  }
}

/**
 * Persist buffer to `public/uploads/avatars/${userId}.${ext}`
 * @param {Buffer} buffer
 */
export async function writeAvatar(userId, ext, buffer) {
  const publicPath = avatarPublicPath(userId, ext);
  if (!publicPath) throw new Error("Invalid avatar destination");
  const fname = `${userId}.${ext}`;
  const dir = join(process.cwd(), "public", ...AVATARS_REL);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, fname), buffer);
  return publicPath;
}
