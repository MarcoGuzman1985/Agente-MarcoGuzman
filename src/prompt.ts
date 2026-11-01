import { readFileSync } from "node:fs";
import { join } from "node:path";

// Se ejecuta siempre desde la raíz del proyecto (npm run dev / start).
const dir = join(process.cwd(), "content");
const read = (f: string) => readFileSync(join(dir, f), "utf8");

/** System prompt + base de conocimiento (cacheable: es estable entre mensajes). */
export function buildSystemPrompt(): string {
  return [
    read("system-prompt.md"),
    "# BASE DE CONOCIMIENTO",
    read("02-negocio.md"),
    read("03-segmentos.md"),
    read("04-flujos.md"),
    read("05-calificacion.md"),
    read("07-faq.md"),
    read("08-guardrails.md"),
  ].join("\n\n");
}
