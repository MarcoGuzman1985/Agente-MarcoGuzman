const need = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Falta variable de entorno ${k}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dataDir: process.env.DATA_DIR ?? "./data",
  model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5",
  bookingUrl: process.env.BOOKING_URL ?? "https://calendar.app.google/sxj3W1Su7gQ3zVao9",
  catalogPdfUrl: process.env.CATALOG_PDF_URL ?? "",
  ownerWhatsapp: process.env.OWNER_WHATSAPP ?? "",
  wa: {
    token: () => need("WHATSAPP_TOKEN"),
    phoneNumberId: () => need("WHATSAPP_PHONE_NUMBER_ID"),
    verifyToken: () => need("WHATSAPP_VERIFY_TOKEN"),
    appSecret: () => need("WHATSAPP_APP_SECRET"),
  },
  anthropicKey: () => need("ANTHROPIC_API_KEY"),
};
