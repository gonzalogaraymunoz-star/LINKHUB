import { json, persistMetric, probeApp, requireHubAccess, safeApp } from "./_shared.js";

export default async function handler(req, res) {
  const access = requireHubAccess(req);
  if (!access.ok) return json(res, access.status, { ok: false, error: access.error });
  if (req.method !== "GET" && req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  const id = req.method === "POST" ? req.body?.appId : req.query?.appId;
  const app = safeApp(id);
  if (!app) return json(res, 404, { ok: false, error: "Unknown app" });

  const metric = await probeApp(app);
  const storage = await persistMetric(metric);
  return json(res, 200, { ok: true, metric, storage });
}
