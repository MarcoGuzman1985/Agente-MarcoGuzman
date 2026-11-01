import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

const GRAPH = "https://graph.facebook.com/v21.0";

export function verifySignature(rawBody: Buffer, header: string | undefined, secret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const given = Buffer.from(header.slice(7), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export type Incoming = { id: string; from: string; type: string; text?: string };

/** Extrae los mensajes de un payload de webhook de WhatsApp Cloud API. */
export function parseWebhook(body: any): Incoming[] {
  const out: Incoming[] = [];
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const m of change?.value?.messages ?? []) {
        out.push({ id: m.id, from: m.from, type: m.type, text: m.text?.body });
      }
    }
  }
  return out;
}

async function post(payload: object): Promise<void> {
  const res = await fetch(`${GRAPH}/${config.wa.phoneNumberId()}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.wa.token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
}

export const sendText = (to: string, body: string) =>
  post({ to, type: "text", text: { body, preview_url: true } });

export const sendDocument = (to: string, link: string, caption: string) =>
  post({ to, type: "document", document: { link, caption } });
