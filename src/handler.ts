import { reply } from "./agent.js";
import { store } from "./store.js";
import { sendText, type Incoming } from "./whatsapp.js";

const STOP = /^\s*(stop|baja|no m[aá]s mensajes|cancelar suscripci[oó]n)\s*$/i;
const START = /^\s*(start|alta|reanudar)\s*$/i;

export async function handleIncoming(m: Incoming): Promise<void> {
  if (store.markSeen(m.id)) return; // webhook repetido

  if (m.type !== "text" || !m.text) {
    await sendText(
      m.from,
      "Recibí tu mensaje. Por ahora solo puedo leer texto: ¿me lo resumes por escrito? Si prefieres, una persona del equipo te contactará.",
    );
    return;
  }
  if (STOP.test(m.text)) {
    store.setOptOut(m.from, true);
    await sendText(m.from, "Listo, no te enviaremos más mensajes. Si cambias de opinión, escribe ALTA.");
    return;
  }
  if (START.test(m.text)) {
    store.setOptOut(m.from, false);
    await sendText(m.from, "¡Bienvenido de nuevo! ¿En qué te puedo ayudar?");
    return;
  }
  if (store.isOptedOut(m.from)) return;

  await sendText(m.from, await reply(m.from, m.text));
}
