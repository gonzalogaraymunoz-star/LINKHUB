# LINK App Protocol v0.1

LINK HUB parte con un registro central en `data/apps.js`. El paso siguiente es que cada aplicación LINK publique un manifiesto propio en:

`/.well-known/link-app.json`

El manifiesto permite al HUB descubrir, sin hardcodear lógica de negocio:

- identidad de la app;
- URL principal;
- endpoint de salud;
- endpoint de contexto para IA;
- capacidades;
- anclajes de navegación.

## Context endpoint recomendado

Cada app puede exponer `GET /api/link-context` con un payload pequeño y sin secretos:

```json
{
  "app": "linkvoice",
  "version": "1.0.0",
  "summary": "...",
  "status": "operational",
  "metrics": {},
  "actions": []
}
```

El HUB podrá sumar ese contexto a la conversación del modelo sin entregar credenciales ni información privada.

## ChatGPT / OpenAI

La integración de la v1 está dentro de LINK HUB mediante `/api/chat`, usando OpenAI Responses API del lado servidor. La UI nunca recibe `OPENAI_API_KEY`.

Esta capa puede evolucionar luego a MCP para que ChatGPT, además de vivir dentro del HUB, pueda consultar y accionar el ecosistema LINK desde un cliente externo compatible.
