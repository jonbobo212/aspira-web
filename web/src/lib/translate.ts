import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { aiCached } from "./ai-cache";
import type { L10n } from "./tenant";

/**
 * Translate-on-save for CMS content (model tiering: Haiku for routine CMS
 * translations — owner-locked in SITE_FACTORY.md). Every call goes through
 * the shared AI cache (L3) keyed by content hash, so unchanged text is never
 * re-translated. The system prompt is BYTE-STABLE with cache_control (L4) —
 * do not interpolate anything dynamic into it.
 *
 * Degrades gracefully: without ANTHROPIC_API_KEY the source text is saved
 * untranslated and the missing locales stay pending (machine_locales records
 * which keys are machine-filled; a later backfill can complete them).
 */
const MODEL = process.env.VITRINA_TRANSLATE_MODEL ?? "claude-haiku-4-5";

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "Uzbek (Latin script)",
  ru: "Russian",
  en: "English",
  tg: "Tajik (Cyrillic script)",
  ky: "Kyrgyz (Cyrillic script)",
  kk: "Kazakh (Cyrillic script)",
  mn: "Mongolian (Cyrillic script)",
  az: "Azerbaijani (Latin script)",
  uk: "Ukrainian",
};

// Byte-stable (L4): dynamic content goes in the user turn, never here.
const SYSTEM_PROMPT = `You translate website content for schools, education agencies, language centers, and teachers in Central Asia. Translate the given text faithfully and naturally into each requested target language.

Rules:
- Translate meaning-for-meaning in a clear, warm, professional register appropriate for a school or education-center website.
- NEVER add, remove, or embellish facts, numbers, names, or claims. If the source states something, the translation states exactly that — nothing more.
- Keep proper nouns, brand names, phone numbers, and URLs unchanged.
- Preserve line breaks and simple formatting.
- Uzbek uses Latin script; Tajik and Kyrgyz use Cyrillic script.`;

let client: Anthropic | null = null;
function anthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

export function translationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Fill the missing locales of a trilingual value from its source locale.
 * Returns the completed L10n plus which keys were machine-translated.
 */
export async function translateL10n(
  value: L10n,
  sourceLocale: string,
  targetLocales: string[]
): Promise<{ value: L10n; machineLocales: string[] }> {
  const sourceText = value[sourceLocale];
  const targets = targetLocales.filter((l) => l !== sourceLocale && !value[l]);
  if (!sourceText || targets.length === 0) {
    return { value, machineLocales: [] };
  }

  const api = anthropic();
  if (!api) return { value, machineLocales: [] };

  const translations = await aiCached<Record<string, string>>(
    "translation",
    { model: MODEL, system: SYSTEM_PROMPT, sourceLocale, targets, text: sourceText },
    MODEL,
    async () => {
      const schema = {
        type: "object",
        properties: Object.fromEntries(
          targets.map((t) => [
            t,
            { type: "string", description: `Translation into ${LANGUAGE_NAMES[t] ?? t}` },
          ])
        ),
        required: targets,
        additionalProperties: false,
      };

      const response = await api.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        output_config: { format: { type: "json_schema", schema } },
        messages: [
          {
            role: "user",
            content: `Source language: ${LANGUAGE_NAMES[sourceLocale] ?? sourceLocale}\nTarget languages: ${targets
              .map((t) => `${t} (${LANGUAGE_NAMES[t] ?? t})`)
              .join(", ")}\n\nText:\n${sourceText}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("translation returned no text block");
      }
      return JSON.parse(textBlock.text) as Record<string, string>;
    }
  );

  const completed: L10n = { ...value };
  const machineLocales: string[] = [];
  for (const t of targets) {
    if (translations[t]) {
      completed[t] = translations[t];
      machineLocales.push(t);
    }
  }
  return { value: completed, machineLocales };
}
