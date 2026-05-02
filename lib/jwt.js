import { SignJWT, jwtVerify } from "jose";

function secretKey() {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    secret = "__dev_jwt_secret_min_32_chars__";
    console.warn(
      "JWT_SECRET is not set; using a dev-only default. Set JWT_SECRET in .env.local"
    );
  }
  if (secret.length < 16) {
    throw new Error("JWT_SECRET must be at least 16 characters");
  }
  return new TextEncoder().encode(secret);
}

/** @param {Record<string, unknown>} payload Must include sub (user id) */
export async function signToken(payload) {
  const key = secretKey();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(key);
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const key = secretKey();
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}
