import { jsonOk } from "@/lib/api-response";

export async function POST() {
  const res = jsonOk(true);
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
