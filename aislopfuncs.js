import {GoogleGenerativeAI} from '@google/generative-ai';

export async function translateKeysWithAi(data, targetLanguages) {
  const modelName = process.env.AI_MODEL_NAME || 'gemini-1.5-flash';
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
 
  if (!googleApiKey) {
    console.error('No Google API key found');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(googleApiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  // Build the prompt dynamically based on the input data and desired languages
  const prompt = `You are a translation assistant for software localization. Your task is to translate the keys in the provided JSON object.
The top-level key of the input object represents a language code.
There are no more nesting of objects under the top-level language key.
If a key exists in a language, it must be present in all the other languages in the output.
Translate the input into the following languages: ${targetLanguages.map(lang => `"${lang}"`).join(', ')}.

Input JSON:
${JSON.stringify(data, null, 2)}

Return the output as a single JSON object. Do not include any additional text or formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // The model might add extra formatting like backticks for a code block, so we need to clean it up
    const jsonString = responseText.replace(/```json\n|```/g, '').trim();

    // Parse the JSON string
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error generating translation:', error);
    return null;
  }
}