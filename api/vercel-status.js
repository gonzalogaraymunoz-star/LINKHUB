import { APPS } from "../data/apps.js";
import { json, requireHubAccess } from "./_shared.js";

export default async function handler(req, res) {
  const access = requireHubAccess(req);
  if (!access.ok) return json(res, access.status, { ok: false, error: access.error });
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "Method not allowed" });

  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return json(res, 200, { ok: true, configured: false, deployments: [] });

  const deployments = await Promise.all(APPS.map(async (app) => {
    if (!app.vercelProjectId) return { appId: app.id, configured: true, found: false };
    try {
      const params = new URLSearchParams({
        projectId: app.vercelProjectId,
        target: "production",
        limit: "1",
        teamId
      });
      const response = await fetch(`https://api.vercel.com/v7/deployments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `Vercel HTTP ${response.status}`);
      const d = data?.deployments?.[0];
      return {
        appId: app.id,
        configured: true,
        found: Boolean(d),
        id: d?.uid || d?.id || null,
        state: d?.readyState || d?.state || null,
        target: d?.target || null,
        url: d?.url ? `https://${d.url}` : null,
        createdAt: d?.createdAt || null
      };
    } catch (error) {
      return { appId: app.id, configured: true, found: false, error: error?.message || "Vercel status failed" };
    }
  }));

  return json(res, 200, { ok: true, configured: true, deployments });
}
