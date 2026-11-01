import type Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { store, type Lead } from "./store.js";
import { sendDocument, sendText } from "./whatsapp.js";

export const tools: Anthropic.Tool[] = [
  {
    name: "guardar_lead",
    description:
      "Guarda o actualiza los datos de un cliente potencial. Úsala solo con interés real y con consentimiento del cliente.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        correo: { type: "string" },
        segmento: { type: "string", enum: ["S1", "S2", "S3", "S4"] },
        unidad: {
          type: "string",
          enum: ["vclg_saas", "vclg_insumos", "vclg_belleza", "vclg_elearning", "gzm"],
        },
        necesidad: { type: "string" },
        urgencia: { type: "string", enum: ["inmediata", "1-3 meses", "explorando"] },
        puntaje: { type: "string", enum: ["HOT", "WARM", "COLD"] },
        consentimiento: { type: "boolean", description: "El cliente aceptó que lo contacten" },
        notas: { type: "string" },
      },
      required: ["consentimiento"],
    },
  },
  {
    name: "agendar_reunion",
    description: "Devuelve el enlace de reservas de Google Calendar de Marco para compartir con el cliente.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "enviar_catalogo",
    description: "Envía al cliente el PDF de información de cursos o insumos.",
    input_schema: {
      type: "object",
      properties: { mensaje: { type: "string", description: "Texto breve que acompaña al documento" } },
      required: ["mensaje"],
    },
  },
  {
    name: "escalar_a_humano",
    description: "Avisa al equipo para que una persona retome la conversación (queja, urgencia, petición explícita).",
    input_schema: {
      type: "object",
      properties: { motivo: { type: "string" } },
      required: ["motivo"],
    },
  },
];

export async function runTool(name: string, input: any, phone: string): Promise<string> {
  switch (name) {
    case "guardar_lead": {
      const lead = store.upsertLead(phone, input as Partial<Lead>);
      if (lead.puntaje === "HOT" && config.ownerWhatsapp) {
        await sendText(
          config.ownerWhatsapp,
          `Lead HOT: ${lead.nombre ?? "sin nombre"} (+${phone}). ${lead.necesidad ?? ""}`,
        ).catch(() => undefined);
      }
      return "Lead guardado.";
    }
    case "agendar_reunion":
      return `Enlace de reservas: ${config.bookingUrl} (lunes a viernes, 10:00-18:00, hora de Bolivia).`;
    case "enviar_catalogo": {
      if (!config.catalogPdfUrl) return "Aún no hay catálogo cargado; dile al cliente que el equipo se lo enviará.";
      await sendDocument(phone, config.catalogPdfUrl, String(input.mensaje ?? ""));
      return "Documento enviado.";
    }
    case "escalar_a_humano": {
      if (config.ownerWhatsapp) {
        await sendText(config.ownerWhatsapp, `Atención humana requerida (+${phone}): ${input.motivo}`).catch(
          () => undefined,
        );
      }
      return "Equipo notificado. Dile al cliente que una persona lo contactará en horario de atención.";
    }
    default:
      return `Herramienta desconocida: ${name}`;
  }
}
