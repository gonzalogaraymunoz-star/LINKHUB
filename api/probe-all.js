import { APPS } from "../data/apps.js";
import { json, persistMetric, probeApp, requireHubAccess } from "./_shared.js";

export default async function handler(req, res) {
  const access = requireHubAccess(req);
  if (!access.ok) return json(res, access.status, { ok: false, error: access.error });
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  const metrics = await Promise.all(APPS.map(probeApp));
  await Promise.all(metrics.map(persistMetric));
  return json(res, 200, { ok: true, metrics, checkedAt: new Date().toISOString() });
}
