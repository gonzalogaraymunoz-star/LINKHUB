const state = {
  apps: [],
  metrics: {},
  deployments: {},
  filter: "Todos",
  search: "",
  messages: [{ role: "assistant", content: "Soy LINK Hub Advisor. Puedo ayudarte a encontrar una app, detectar qué dominio está caído y priorizar qué revisar." }],
  anchors: [],
  token: sessionStorage.getItem("linkHubToken") || "",
  lastUpdated: null
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function headers(extra = {}) {
  return { ...(state.token ? { "x-link-hub-token": state.token } : {}), ...extra };
}

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: headers(options.headers || {}) });
  if (response.status === 401) {
    $("#lock").classList.add("show");
    throw new Error("locked");
  }
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function boot() {
  bind();
  try {
    const data = await api("/api/apps");
    state.apps = data.apps;
    renderFilters();
    render();
    await Promise.all([loadStoredMetrics(), loadVercelStatus()]);
    checkAll();
  } catch (error) {
    if (error.message !== "locked") console.error(error);
  }
}

function bind() {
  $("#search").addEventListener("input", (e) => { state.search = e.target.value.toLowerCase(); renderCards(); });
  $("#checkAll").addEventListener("click", checkAll);
  $("#chatForm").addEventListener("submit", sendChat);
  $("#unlockForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.token = $("#token").value.trim();
    sessionStorage.setItem("linkHubToken", state.token);
    $("#lock").classList.remove("show");
    boot();
  });
  $$(".quick button").forEach((button) => button.addEventListener("click", () => {
    $("#chatInput").value = button.dataset.prompt;
    $("#chatForm").requestSubmit();
  }));
}

function renderFilters() {
  const groups = ["Todos", ...new Set(state.apps.map((a) => a.group))];
  $("#filters").innerHTML = groups.map((g) => `<button class="filter ${state.filter === g ? "active" : ""}" data-filter="${g}">${g}</button>`).join("");
  $$(".filter").forEach((button) => button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    renderFilters();
    renderCards();
  }));
}

function visibleApps() {
  return state.apps.filter((app) => {
    const matchesGroup = state.filter === "Todos" || app.group === state.filter;
    const hay = `${app.name} ${app.project} ${app.kind} ${app.domain}`.toLowerCase();
    return matchesGroup && hay.includes(state.search);
  });
}

function render() {
  renderSummary();
  renderCards();
  renderThread();
}

function renderSummary() {
  const measured = Object.values(state.metrics);
  const up = measured.filter((m) => m.ok).length;
  const down = measured.filter((m) => !m.ok).length;
  const avg = measured.length ? Math.round(measured.reduce((s, m) => s + (m.latencyMs || 0), 0) / measured.length) : 0;
  $("#summary").innerHTML = `
    <div class="metric"><span>Aplicaciones</span><b>${state.apps.length}</b><small>registro central</small></div>
    <div class="metric"><span>Operativas</span><b>${up}</b><small>${measured.length ? `${measured.length} medidas` : "sin medición aún"}</small></div>
    <div class="metric"><span>Incidentes</span><b>${down}</b><small>respuesta no exitosa</small></div>
    <div class="metric"><span>Latencia media</span><b>${avg ? `${avg} ms` : "—"}</b><small>último chequeo</small></div>`;
  $("#updated").textContent = state.lastUpdated ? `Actualizado ${new Date(state.lastUpdated).toLocaleTimeString("es-CL", {hour:"2-digit",minute:"2-digit"})}` : "Sin revisión";
}

function deploymentMarkup(deployment) {
  if (!deployment) return "Vercel: no configurado";
  if (deployment.error) return "Vercel: error";
  if (!deployment.found) return "Vercel: sin deploy";
  const state = deployment.state || "—";
  const when = deployment.createdAt ? new Date(deployment.createdAt).toLocaleDateString("es-CL", {day:"2-digit",month:"short"}) : "";
  return `Deploy: ${state}${when ? ` · ${when}` : ""}`;
}

function statusMarkup(metric) {
  if (!metric) return `<div class="status"><i class="dot"></i>Sin medir</div>`;
  if (metric.checking) return `<div class="status checking"><i class="dot"></i>Midiendo</div>`;
  return `<div class="status ${metric.ok ? "up" : "down"}"><i class="dot"></i>${metric.ok ? "Online" : "Incidente"}</div>`;
}

function renderCards() {
  const apps = visibleApps();
  $("#appsGrid").innerHTML = apps.length ? apps.map((app) => {
    const m = state.metrics[app.id];
    const d = state.deployments[app.id];
    return `<article class="card">
      <div class="card-top"><div class="app-icon">${app.accent}</div><div class="card-title"><b>${app.name}</b><span>${app.domain.replace("https://", "")}</span></div>${statusMarkup(m)}</div>
      <p>${app.description}</p>
      <div class="chips"><span class="chip">${app.group}</span><span class="chip">${app.kind}</span>${(app.capabilities || []).slice(0,2).map(c=>`<span class="chip">${c}</span>`).join("")}</div>
      <div class="card-foot"><span class="latency">${m && !m.checking ? `${m.latencyMs} ms · HTTP ${m.status || "—"}` : "—"}<br>${deploymentMarkup(d)}</span><div class="card-actions"><button class="mini" data-check="${app.id}">Revisar</button><button class="mini open" data-open="${app.id}">Abrir ↗</button></div></div>
    </article>`;
  }).join("") : `<div class="empty">No hay aplicaciones que coincidan con el filtro.</div>`;
  $$('[data-open]').forEach((b) => b.addEventListener("click", () => openApp(b.dataset.open)));
  $$('[data-check]').forEach((b) => b.addEventListener("click", () => checkOne(b.dataset.check)));
}

function openApp(id) {
  const app = state.apps.find((a) => a.id === id);
  if (app) window.open(app.domain, "_blank", "noopener,noreferrer");
}

async function checkOne(id) {
  state.metrics[id] = { ...(state.metrics[id] || {}), checking: true };
  render();
  try {
    const data = await api(`/api/probe?appId=${encodeURIComponent(id)}`);
    state.metrics[id] = data.metric;
    state.lastUpdated = data.metric.checkedAt;
    saveLocalMetrics();
  } catch (error) {
    state.metrics[id] = { appId:id, ok:false, status:0, latencyMs:0, checkedAt:new Date().toISOString(), error:error.message };
  }
  render();
}

async function checkAll() {
  if (!state.apps.length) return;
  $("#checkAll").disabled = true;
  state.apps.forEach((a) => { state.metrics[a.id] = { ...(state.metrics[a.id] || {}), checking:true }; });
  render();
  try {
    const data = await api("/api/probe-all", { method:"POST" });
    data.metrics.forEach((m) => state.metrics[m.appId] = m);
    state.lastUpdated = data.checkedAt;
    saveLocalMetrics();
  } catch (error) {
    console.error(error);
  } finally {
    $("#checkAll").disabled = false;
    render();
  }
}

async function loadVercelStatus() {
  try {
    const data = await api("/api/vercel-status");
    if (!data.configured) return;
    for (const d of data.deployments || []) state.deployments[d.appId] = d;
    renderCards();
  } catch {}
}

function saveLocalMetrics() {
  localStorage.setItem("linkHubMetrics", JSON.stringify({ metrics: state.metrics, lastUpdated: state.lastUpdated }));
}

async function loadStoredMetrics() {
  try {
    const local = JSON.parse(localStorage.getItem("linkHubMetrics") || "null");
    if (local?.metrics) { state.metrics = local.metrics; state.lastUpdated = local.lastUpdated; render(); }
    const remote = await api("/api/metrics?limit=100");
    if (remote.configured && Array.isArray(remote.metrics)) {
      for (const row of remote.metrics) {
        if (!state.metrics[row.app_id] || new Date(row.checked_at) > new Date(state.metrics[row.app_id].checkedAt || 0)) {
          state.metrics[row.app_id] = { appId:row.app_id, ok:row.is_up, status:row.status_code, latencyMs:row.latency_ms, checkedAt:row.checked_at };
        }
      }
      render();
    }
  } catch {}
}

function renderThread() {
  $("#thread").innerHTML = state.messages.map((m, index) => `<div class="msg ${m.role}">${escapeHtml(m.content)}</div>${index === state.messages.length-1 && m.role === "assistant" && state.anchors.length ? `<div class="anchor-row">${state.anchors.map(a=>`<button class="anchor" data-anchor="${a.id}">${a.name} ↗</button>`).join("")}</div>` : ""}`).join("");
  $$('[data-anchor]').forEach((b) => b.addEventListener("click", () => openApp(b.dataset.anchor)));
  $("#thread").scrollTop = $("#thread").scrollHeight;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

async function sendChat(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  state.messages.push({ role:"user", content:text });
  input.value = "";
  state.anchors = [];
  renderThread();
  $("#chatSend").disabled = true;
  try {
    const cleanMetrics = Object.fromEntries(Object.entries(state.metrics).filter(([,m]) => !m.checking));
    const data = await api("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messages:state.messages, metrics:cleanMetrics }) });
    state.messages.push({ role:"assistant", content:data.answer });
    state.anchors = data.anchors || [];
  } catch (error) {
    state.messages.push({ role:"assistant", content:error.message.includes("OPENAI_API_KEY") ? "La IA todavía no está configurada. Agrega OPENAI_API_KEY en Vercel y volveré a estar disponible." : `No pude responder: ${error.message}` });
  } finally {
    $("#chatSend").disabled = false;
    renderThread();
  }
}

boot();
