export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    service: "LINK GUIA",
    version: "1.0.0",
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    metricsConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    protected: Boolean(process.env.HUB_ACCESS_TOKEN),
    now: new Date().toISOString()
  });
}
