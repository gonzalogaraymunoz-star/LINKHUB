import { publicApps } from "../data/apps.js";
import { json, requireHubAccess } from "./_shared.js";

export default async function handler(req, res) {
  const access = requireHubAccess(req);
  if (!access.ok) return json(res, access.status, { ok: false, error: access.error });
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "Method not allowed" });
  return json(res, 200, { ok: true, apps: publicApps(), generatedAt: new Date().toISOString() });
}
