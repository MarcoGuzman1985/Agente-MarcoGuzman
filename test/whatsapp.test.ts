import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { parseWebhook, verifySignature } from "../src/whatsapp.js";
import { buildSystemPrompt } from "../src/prompt.js";

test("verifySignature acepta firma válida y rechaza inválida", () => {
  const body = Buffer.from('{"a":1}');
  const sig = "sha256=" + createHmac("sha256", "secreto").update(body).digest("hex");
  assert.equal(verifySignature(body, sig, "secreto"), true);
  assert.equal(verifySignature(body, sig, "otro"), false);
  assert.equal(verifySignature(body, undefined, "secreto"), false);
  assert.equal(verifySignature(body, "sha256=zz", "secreto"), false);
});

test("parseWebhook extrae mensajes de texto", () => {
  const payload = {
    entry: [{ changes: [{ value: { messages: [{ id: "m1", from: "591700", type: "text", text: { body: "hola" } }] } }] }],
  };
  assert.deepEqual(parseWebhook(payload), [{ id: "m1", from: "591700", type: "text", text: "hola" }]);
  assert.deepEqual(parseWebhook({}), []);
});

test("el system prompt incluye precios y reglas", () => {
  const p = buildSystemPrompt();
  assert.match(p, /55 USD/);
  assert.match(p, /INFOCAL/);
});
