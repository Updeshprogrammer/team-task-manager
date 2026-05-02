import { NextResponse } from "next/server";

/**
 * @param {unknown} data
 */
export function jsonOk(data, init) {
  return NextResponse.json({ ok: true, data }, init ?? { status: 200 });
}

/**
 * @param {string} message
 * @param {number} status
 */
export function jsonErr(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
