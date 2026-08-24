# LINK HUB · Domain Control

Centro de control independiente para el ecosistema LINK CONTROL DIGITAL.

## Qué hace

- registra las apps y dominios actuales de Vercel;
- abre cualquier app en un clic;
- mide disponibilidad, HTTP y latencia;
- opcionalmente muestra el último deployment de cada proyecto desde Vercel;
- guarda el último estado en el navegador;
- opcionalmente persiste el histórico en Supabase;
- integra un chat interno con OpenAI Responses API;
- transforma menciones a apps en anclajes rápidos;
- define el primer `LINK App Protocol` para que cada app pueda autodocumentarse más adelante.

## Arquitectura

```text
Browser
  ├─ /api/apps
  ├─ /api/probe + /api/probe-all
  ├─ /api/metrics ───────────────> Supabase (opcional)
  └─ /api/chat ──────────────────> OpenAI Responses API

Registry
  └─ data/apps.js
```

## Deploy en Vercel

1. Crea un repo nuevo, recomendado: `LINK-HUB`.
2. Sube el contenido de esta carpeta a la raíz del repo.
3. Importa ese repo desde Vercel.
4. Configura variables de entorno.
5. Si quieres histórico, ejecuta `supabase.sql` y configura Supabase.

No hay build step: `index.html` se sirve como estático y `/api/*.js` corre como Vercel Functions.

## Variables

Copia `.env.example`.

### Mínimas

- `OPENAI_API_KEY`: habilita LINK Hub Advisor.
- `HUB_ACCESS_TOKEN`: recomendado para que el registro y APIs no queden expuestos públicamente.

### Histórico opcional

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Estado de deployments opcional

- `VERCEL_TOKEN`
- `VERCEL_TEAM_ID`

El token de Vercel permanece exclusivamente en Functions server-side.

La service role solo se usa en Functions; no debe ir al frontend.

## Agregar o cambiar una app

Edita `data/apps.js`. Cada app tiene:

- `id`
- `name`
- `project`
- `domain`
- `group`
- `kind`
- `description`
- `healthPath`
- `github`
- `capabilities`

El endpoint `/api/probe` solo puede visitar URLs del registro: el usuario no puede enviar una URL arbitraria, evitando convertir la función en un proxy SSRF.

## LINK App Protocol

Ver `docs/LINK_PROTOCOL.md` y `protocol/link-app-manifest.example.json`.

La idea es migrar gradualmente desde un registro central a descubrimiento automático por `/.well-known/link-app.json`.
