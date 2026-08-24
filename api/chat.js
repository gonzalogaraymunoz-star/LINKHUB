import { APPS } from "../data/apps.js";
import { json, registryContext, requireHubAccess } from "./_shared.js";

const MAX_MESSAGES = 20;
const MAX_CHARS = 24000;

function cleanMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) throw new Error("messages required");
  const sliced = messages.slice(-MAX_MESSAGES).map((m) => ({
    role: m?.role === "assistant" ? "assistant" : "user",
    content: String(m?.content || "").slice(0, 4000)
  }));
  const total = sliced.reduce((sum, m) => sum + m.content.length, 0);
  if (total > MAX_CHARS) throw new Error("conversation too large");
  return sliced;
}

function extractText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function anchorMatches(text) {
  const haystack = String(text || "").toLowerCase();
  return APPS.filter((app) =>
    haystack.includes(app.id.toLowerCase()) ||
    haystack.includes(app.name.toLowerCase()) ||
    haystack.includes(app.project.toLowerCase())
  ).slice(0, 4).map((app) => ({ id: app.id, name: app.name, domain: app.domain }));
}

export default async function handler(req, res) {
  const access = requireHubAccess(req);
  if (!access.ok) return json(res, access.status, { ok: false, error: access.error });
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return json(res, 503, { ok: false, error: "OPENAI_API_KEY is not configured" });

  try {
    const messages = cleanMessages(req.body?.messages);
    const metrics = req.body?.metrics && typeof req.body.metrics === "object" ? req.body.metrics : {};
    const registry = registryContext(metrics);
    const instructions = `Eres LINK Hub Advisor, el copiloto operativo del ecosistema LINK CONTROL DIGITAL.
Tu trabajo es ayudar a navegar, revisar y priorizar las aplicaciones registradas. Usa exclusivamente el registro entregado para dominios y nombres; no inventes URLs.
Cuando haya datos de estado, interpreta latencia, disponibilidad y última revisión. Si no hay medición, dilo.
Responde en español, breve, ejecutivo y accionable. Cuando recomiendes entrar a una app, menciona su nombre exacto para que la interfaz pueda convertirlo en un anclaje.
Registro actual:\n${JSON.stringify(registry)}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        instructions,
        input: messages
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
    const answer = extractText(data) || "No pude generar una respuesta.";
    return json(res, 200, {
      ok: true,
      answer,
      anchors: anchorMatches(`${messages.at(-1)?.content || ""}\n${answer}`),
      meta: { model: data.model || process.env.OPENAI_MODEL || "gpt-5.6-luna", responseId: data.id || null }
    });
  } catch (error) {
    return json(res, 502, { ok: false, error: error?.message || "Chat request failed" });
  }
}
