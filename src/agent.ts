import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { buildSystemPrompt } from "./prompt.js";
import { store } from "./store.js";
import { runTool, tools } from "./tools.js";

let client: Anthropic | undefined;
let system: string | undefined;

const MAX_TOOL_ROUNDS = 5;
const FALLBACK =
  "Gracias por escribirnos. En este momento no puedo responder, pero el equipo te contactará en horario de atención (lunes a viernes, 10:00 a 18:00).";

export async function reply(phone: string, userText: string): Promise<string> {
  client ??= new Anthropic({ apiKey: config.anthropicKey() });
  system ??= buildSystemPrompt();

  const messages: Anthropic.MessageParam[] = [
    ...store.getHistory(phone),
    { role: "user", content: userText },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await client.messages.create({
      model: config.model,
      max_tokens: 700,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools,
      messages,
    });

    if (res.stop_reason !== "tool_use") {
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      const answer = text || FALLBACK;
      store.addTurns(phone, [
        { role: "user", content: userText },
        { role: "assistant", content: answer },
      ]);
      return answer;
    }

    messages.push({ role: "assistant", content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      let out: string;
      try {
        out = await runTool(block.name, block.input, phone);
      } catch (e) {
        out = `Error: ${(e as Error).message}`;
      }
      results.push({ type: "tool_result", tool_use_id: block.id, content: out });
    }
    messages.push({ role: "user", content: results });
  }
  return FALLBACK;
}
