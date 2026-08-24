import { APPS, appById } from "../data/apps.js";

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.json(body);
}

export function requireHubAccess(req) {
  const configured = process.env.HUB_ACCESS_TOKEN || "";
  if (!configured) return { ok: true };
  const token = String(req.headers["x-link-hub-token"] || "");
  if (token !== configured) return { ok: false, status: 401, error: "Hub access required" };
  return { ok: true };
}

export function safeApp(id) {
  const app = appById(String(id || ""));
  if (!app) return null;
  return app;
}

export async function probeApp(app) {
  const target = new URL(app.healthPath || "/", app.domain).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.PROBE_TIMEOUT_MS || 8000));
  const started = Date.now();
  try {
    let response;
    try {
      response = await fetch(target, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "LINK-HUB/1.0" }
      });
      if (response.status === 405 || response.status === 501) throw new Error("HEAD_NOT_SUPPORTED");
    } catch (error) {
      if (error?.message !== "HEAD_NOT_SUPPORTED") throw error;
      response = await fetch(target, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "LINK-HUB/1.0", Range: "bytes=0-128" }
      });
    }
    const latencyMs = Date.now() - started;
    return {
      appId: app.id,
      ok: response.ok,
      status: response.status,
      latencyMs,
      checkedAt: new Date().toISOString(),
      url: app.domain
    };
  } catch (error) {
    return {
      appId: app.id,
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      url: app.domain,
      error: error?.name === "AbortError" ? "timeout" : "network_error"
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function persistMetric(metric) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { configured: false };
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/link_app_metrics`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        app_id: metric.appId,
        is_up: metric.ok,
        status_code: metric.status,
        latency_ms: metric.latencyMs,
        checked_at: metric.checkedAt,
        source: "link-hub"
      })
    });
    return { configured: true, ok: response.ok };
  } catch {
    return { configured: true, ok: false };
  }
}

export function registryContext(metrics = {}) {
  return APPS.map((app) => {
    const metric = metrics?.[app.id];
    return {
      id: app.id,
      name: app.name,
      group: app.group,
      project: app.project,
      domain: app.domain,
      kind: app.kind,
      description: app.description,
      capabilities: app.capabilities,
      latestMetric: metric || null
    };
  });
}
