import { json, requireHubAccess } from "./_shared.js";

export default async function handler(req, res) {
  const access = requireHubAccess(req);
  if (!access.ok) return json(res, access.status, { ok: false, error: access.error });
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "Method not allowed" });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json(res, 200, { ok: true, configured: false, metrics: [] });

  const limit = Math.max(1, Math.min(Number(req.query?.limit || 100), 500));
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/link_app_metrics?select=*&order=checked_at.desc&limit=${limit}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`);
    return json(res, 200, { ok: true, configured: true, metrics: await response.json() });
  } catch (error) {
    return json(res, 502, { ok: false, configured: true, error: error?.message || "Metrics unavailable" });
  }
}
