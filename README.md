# Agente-MarcoGuzman
Agente de WhatsApp para contenido y venta de cursos y servicios (VCLG GROUP / GZM Asesoría).

## Estructura
- `content/` – contexto del agente (identidad, negocio, flujos, FAQ, guardrails, `system-prompt.md`). Se carga como system prompt.
- `src/` – backend Node.js + TypeScript: webhook de WhatsApp Cloud API, cliente Claude con tool use (`guardar_lead`, `agendar_reunion`, `enviar_catalogo`, `escalar_a_humano`).

## Puesta en marcha
```bash
cp .env.example .env   # completar credenciales
npm install
npm run dev            # http://localhost:3000
```
Webhook en Meta: `https://<tu-dominio>/webhook` con el mismo `WHATSAPP_VERIFY_TOKEN`; suscribir el campo `messages`.

## Scripts
`npm run typecheck` · `npm test` · `npm run build` · `npm start`

## Notas
- Valida la firma `X-Hub-Signature-256` y descarta webhooks repetidos.
- Historial, leads y bajas (STOP/ALTA) se guardan en `data/db.json` (MVP; migrar a Postgres/SQLite para producción).
- Mensajes que no son texto reciben un acuse y se invita a escribirlo.
- Pendiente: plantillas aprobadas en Meta para escribir fuera de la ventana de 24 h (`content/06-plantillas-whatsapp.md`).
