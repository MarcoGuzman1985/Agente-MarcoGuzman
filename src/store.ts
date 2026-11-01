import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";

export type Turn = { role: "user" | "assistant"; content: string };
export type Lead = {
  whatsapp: string;
  nombre?: string;
  correo?: string;
  segmento?: string;
  unidad?: string;
  necesidad?: string;
  urgencia?: string;
  puntaje?: "HOT" | "WARM" | "COLD";
  consentimiento: boolean;
  notas?: string;
  actualizado: string;
};
type Db = {
  history: Record<string, Turn[]>;
  leads: Record<string, Lead>;
  optOut: string[];
  seen: string[];
};

const MAX_TURNS = 20;
const MAX_SEEN = 500;
const file = () => join(config.dataDir, "db.json");

function load(): Db {
  if (!existsSync(file())) return { history: {}, leads: {}, optOut: [], seen: [] };
  return JSON.parse(readFileSync(file(), "utf8")) as Db;
}
function save(db: Db): void {
  mkdirSync(config.dataDir, { recursive: true });
  writeFileSync(file(), JSON.stringify(db, null, 2));
}

export const store = {
  getHistory(phone: string): Turn[] {
    return load().history[phone] ?? [];
  },
  addTurns(phone: string, turns: Turn[]): void {
    const db = load();
    db.history[phone] = [...(db.history[phone] ?? []), ...turns].slice(-MAX_TURNS);
    // el historial debe empezar con un turno de usuario
    while (db.history[phone][0]?.role === "assistant") db.history[phone].shift();
    save(db);
  },
  upsertLead(phone: string, patch: Partial<Lead>): Lead {
    const db = load();
    const prev = db.leads[phone];
    const lead: Lead = {
      ...prev,
      ...patch,
      consentimiento: patch.consentimiento ?? prev?.consentimiento ?? false,
      whatsapp: phone,
      actualizado: new Date().toISOString(),
    };
    db.leads[phone] = lead;
    save(db);
    return lead;
  },
  /** true si el mensaje ya se procesó (los webhooks de Meta pueden repetirse). */
  markSeen(messageId: string): boolean {
    const db = load();
    if (db.seen.includes(messageId)) return true;
    db.seen = [...db.seen, messageId].slice(-MAX_SEEN);
    save(db);
    return false;
  },
  isOptedOut(phone: string): boolean {
    return load().optOut.includes(phone);
  },
  setOptOut(phone: string, value: boolean): void {
    const db = load();
    db.optOut = value ? [...new Set([...db.optOut, phone])] : db.optOut.filter((p) => p !== phone);
    save(db);
  },
};
