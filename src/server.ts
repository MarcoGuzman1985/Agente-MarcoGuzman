import express from "express";
import { config } from "./config.js";
import { handleIncoming } from "./handler.js";
import { parseWebhook, verifySignature } from "./whatsapp.js";

const app = express();

app.get("/health", (_req, res) => res.send("ok"));

// Verificación inicial del webhook (Meta)
app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === config.wa.verifyToken()) {
    return res.status(200).send(String(req.query["hub.challenge"]));
  }
  res.sendStatus(403);
});

// Mensajes entrantes. Necesitamos el cuerpo crudo para validar la firma.
app.post("/webhook", express.raw({ type: "application/json", limit: "1mb" }), (req, res) => {
  const raw = req.body as Buffer;
  if (!verifySignature(raw, req.header("x-hub-signature-256"), config.wa.appSecret())) {
    return res.sendStatus(401);
  }
  res.sendStatus(200); // responder rápido; procesar después
  let body: unknown;
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    return;
  }
  for (const m of parseWebhook(body)) {
    handleIncoming(m).catch((e) => console.error("Error procesando mensaje", m.id, e));
  }
});

app.listen(config.port, () => console.log(`Agente escuchando en :${config.port}`));
