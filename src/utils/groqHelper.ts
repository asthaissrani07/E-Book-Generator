export interface GroqConfig {
  apiKey: string;
  model: string;
}

export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Recommended)" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Super Fast)" },
  { id: "llama3-8b-8192", name: "Llama 3 8B" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7b" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B" },
];

async function callGroqAPI(
  config: GroqConfig,
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7
): Promise<string> {
  if (!config.apiKey) {
    throw new Error("Groq API Key is missing. Please set it in the settings panel.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "Failed to communicate with Groq API.";
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * Rewrites chapter text into a desired style using Groq.
 */
export async function rewriteChapterText(
  config: GroqConfig,
  text: string,
  style: string
): Promise<string> {
  const systemPrompt = `You are a professional literary stylist and master copywriter. Your task is to rewrite the input text from a chapter of a book into a gorgeous, highly artistic "${style}" style.
Rules:
1. Maintain the core message, key facts, and flow of the original content. Do not omit important data.
2. Enhance the language to be incredibly evocative, readable, polished, and beautifully written.
3. Make it fit the layout of an aesthetic, premium e-book.
4. Keep the output length comparable to the input (do not shorten it into a brief summary, but do not bloat it excessively).
5. Output ONLY the rewritten text. Do not add conversational intros or explanations like "Here is your rewritten text:" or markdown headings that are not part of the text itself.
6. Retain paragraph breaks for legibility.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Original Text to Rewrite:\n\n${text}` },
  ];

  const result = await callGroqAPI(config, messages, 0.75);
  return result.trim();
}

/**
 * Generates an image prompt for a chapter based on its text and the active theme.
 */
export async function generateChapterImagePrompt(
  config: GroqConfig,
  chapterTitle: string,
  chapterText: string,
  theme: string
): Promise<string> {
  const systemPrompt = `You are an art director and visual stylist. Analyze the given chapter text and generate a SINGLE highly detailed, vivid image prompt that captures the core scene, mood, or metaphor of this text.
The prompt should be written to generate a premium, aesthetic, artistic image.
Rules:
1. The prompt must describe the main subject, setting, colors, art style (e.g. oil painting, cinematic photo, watercolor, line art, minimal layout), lighting, and mood.
2. The prompt style should match the e-book theme: "${theme}".
   - For 'editorial': Warm neutral tones, editorial magazine photo, beige, brown, cream palettes, sunflowers.
   - For 'wanderlust': Travel magazine photography, iconic landmarks, pale teal sky, wanderlust aesthetic.
   - For 'softpink': Soft pink lifestyle, feminine elegant, blush rose, dusty rose palette.
   - For 'comic': Pop art comic book illustration, bold black outlines, vibrant flat magenta orange cyan yellow, halftone dots, high saturation.
   - For 'sporty': Dynamic sports action photo, athlete in motion, maroon red accents, high contrast.
   - For 'wellness': Herbal botanical ingredients, clean white background, professional supplement brochure.
   - For 'newspaper': Editorial nature photograph, birds wildlife, pastel circle backgrounds, NYT magazine style.
   - For 'botanical': Watercolor, organic illustration, sage green, hand-drawn botanical details.
   - For 'modern': Minimal corporate rendering, clean geometric forms, corporate blue and gray.
   - For 'noir': Dark cinematic, heavy contrast, gold glowing elements, moody night atmosphere.
3. Keep the prompt concise, between 25 to 55 words.
4. Output ONLY the raw image prompt text. Do not include any prefix like "Prompt:" or explanation. Do not use quotes around the prompt.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Chapter Title: ${chapterTitle}\n\nChapter Content:\n\n${chapterText}` },
  ];

  const result = await callGroqAPI(config, messages, 0.6);
  return result.trim().replace(/^"|"$/g, ""); // Strip quotes if any
}
