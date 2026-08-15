import translate from "google-translate-api-x";

// Free/unofficial wrapper — fine for a personal project. For production,
// swap this out for Google Cloud Translation API or DeepL with an API key,
// since the free endpoint has no uptime/rate-limit guarantees.
export async function translateText(text, targetLang) {
  const result = await translate(text, { to: targetLang });
  return {
    translatedText: result.text,
    detectedLang: result.from?.language?.iso || "auto",
  };
}
