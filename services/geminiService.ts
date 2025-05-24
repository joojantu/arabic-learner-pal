
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LessonPlan } from '../types';
import { GEMINI_MODEL_NAME, MISSING_API_KEY_MSG } from '../constants';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY && API_KEY !== MISSING_API_KEY_MSG) { // Check if API_KEY is provided and not the placeholder
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI. Ensure API_KEY is valid.", error);
    // ai remains null, subsequent calls will fail gracefully.
  }
} else {
  console.warn(`API_KEY environment variable is not set or is set to the placeholder value. Gemini API calls will not be made. Current value: ${API_KEY === MISSING_API_KEY_MSG ? "Placeholder (Not configured)" : "Not set"}`);
}


const generateLessonPlanPrompt = (topics: string): string => `
You are an expert Arabic language tutor creating engaging educational content for an 11-year-old beginner.
The goal is to teach spoken Arabic relevant to their school test, based on the topics they provide.

Generate a lesson plan focused on these topics: "${topics}".

The lesson plan MUST be in a valid JSON format. Do NOT include any markdown formatting like \`\`\`json or \`\`\` around the JSON output.
The JSON structure MUST be as follows:
{
  "title": "Lesson: [A catchy and relevant title derived from the topics, e.g., 'Mastering Greetings & Introductions']",
  "vocabulary": [
    {
      "arabic": "[ARABIC_WORD_OR_PHRASE_WITH_DIACRITICS_IF_POSSIBLE]",
      "english": "[ACCURATE_ENGLISH_TRANSLATION]",
      "transliteration": "[SIMPLE_CLEAR_PHONETIC_TRANSLITERATION_FOR_AN_ENGLISH_SPEAKER]",
      "audioSrc": "[EXACT_ARABIC_WORD_OR_PHRASE_FOR_TTS_MATCHING_ARABIC_FIELD]"
    } 
    // Aim for 5-8 diverse and useful vocabulary items related to the topics.
  ],
  "phrases": [
    {
      "arabic": "[COMMON_ARABIC_PHRASE_WITH_DIACRITICS_IF_POSSIBLE]",
      "english": "[ACCURATE_ENGLISH_TRANSLATION_OF_THE_PHRASE]",
      "transliteration": "[SIMPLE_CLEAR_PHONETIC_TRANSLITERATION_OF_THE_PHRASE]",
      "audioSrc": "[EXACT_ARABIC_PHRASE_FOR_TTS_MATCHING_ARABIC_FIELD]"
    }
    // Aim for 3-5 practical phrases using the vocabulary or related to the topics.
  ],
  "quiz": [
    // Include a mix of the 3 question types below. Aim for 5-7 total quiz questions.
    // Ensure questions test vocabulary and phrases from this lesson.
    // Ensure correctAnswers are exactly one of the provided options.
    // Vary the position of the correct answer. Distractors should be plausible.

    // Example Question Type 1: Translate Arabic to English (Multiple Choice)
    {
      "type": "arabic_to_english_mc",
      "questionText": "What does this Arabic word/phrase mean in English?",
      "arabicStimulus": "[ARABIC_WORD_FROM_VOCABULARY_OR_PHRASES]",
      "audioSrc": "[SAME_ARABIC_WORD_AS_arabicStimulus_FOR_TTS]",
      "options": ["[ENGLISH_OPTION_1]", "[CORRECT_ENGLISH_TRANSLATION]", "[ENGLISH_OPTION_3]", "[ENGLISH_OPTION_4]"],
      "correctAnswer": "[CORRECT_ENGLISH_TRANSLATION_MATCHING_ONE_OF_THE_OPTIONS]"
    },
    // Example Question Type 2: Translate English to Arabic (Multiple Choice)
    {
      "type": "english_to_arabic_mc",
      "questionText": "How do you say this in Arabic?",
      "englishStimulus": "[ENGLISH_WORD_FROM_VOCABULARY_OR_PHRASES]",
      "options": [
        {"arabic": "[ARABIC_OPTION_1]", "audioSrc": "[ARABIC_OPTION_1_FOR_TTS]"},
        {"arabic": "[CORRECT_ARABIC_TRANSLATION]", "audioSrc": "[CORRECT_ARABIC_TRANSLATION_FOR_TTS]"},
        {"arabic": "[ARABIC_OPTION_3]", "audioSrc": "[ARABIC_OPTION_3_FOR_TTS]"},
        {"arabic": "[ARABIC_OPTION_4]", "audioSrc": "[ARABIC_OPTION_4_FOR_TTS]"}
      ],
      "correctAnswer": "[CORRECT_ARABIC_TRANSLATION_TEXT_MATCHING_ONE_OF_THE_OPTIONS_ARABIC_PROPERTY]"
    },
    // Example Question Type 3: Listen and Choose Meaning (Multiple Choice)
    {
      "type": "listen_and_choose_meaning_mc",
      "questionText": "Listen to the Arabic and choose the correct English meaning:",
      "audioSrc": "[ARABIC_WORD_OR_PHRASE_FROM_VOCAB_OR_PHRASES_FOR_TTS]",
      "options": ["[ENGLISH_OPTION_1]", "[CORRECT_ENGLISH_TRANSLATION]", "[ENGLISH_OPTION_3]", "[ENGLISH_OPTION_4]"],
      "correctAnswer": "[CORRECT_ENGLISH_TRANSLATION_MATCHING_ONE_OF_THE_OPTIONS]"
    }
  ]
}

Important Guidelines:
- All Arabic text should be clear, use appropriate script (with Tashkeel/diacritics if possible, for better pronunciation aid).
- Transliterations should be simple, intuitive for an English speaker, and consistent.
- AudioSrc fields must contain the exact Arabic text to be spoken by a Text-To-Speech engine. This should match the corresponding "arabic" or "arabicStimulus" field.
- Content must be age-appropriate for an 11-year-old.
- Focus on Modern Standard Arabic (MSA) unless the topics specifically imply a dialect (prefer MSA for general learning).
- Ensure the quiz questions are diverse and cover different aspects of the vocabulary and phrases.
- Double-check that `correctAnswer` values in quiz questions perfectly match one of the provided options (textually).
`;

export const geminiService = {
  generateLessonPlan: async (topics: string): Promise<LessonPlan> => {
    if (!ai) {
      throw new Error("Gemini API client is not initialized. Is the API_KEY configured correctly?");
    }
    try {
      const prompt = generateLessonPlanPrompt(topics);
      console.log("Generating lesson plan with prompt:", prompt); // For debugging

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.6, // Slightly lower for more predictable structure
          // thinkingConfig: { thinkingBudget: 0 } // Consider for lower latency if needed, but might reduce quality. Default is usually fine.
        },
      });
      
      let jsonStr = response.text.trim();
      
      // Remove potential markdown fences (```json ... ``` or ``` ... ```)
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }

      // Attempt to parse the JSON
      const lessonPlan = JSON.parse(jsonStr) as LessonPlan;

      // Basic validation of the parsed structure
      if (!lessonPlan || typeof lessonPlan !== 'object') {
        throw new Error("API response is not a valid object.");
      }
      if (!lessonPlan.title || !Array.isArray(lessonPlan.vocabulary) || !Array.isArray(lessonPlan.phrases) || !Array.isArray(lessonPlan.quiz)) {
        console.error("Invalid lesson plan structure received:", lessonPlan);
        throw new Error("Invalid lesson plan structure: missing required fields (title, vocabulary, phrases, or quiz).");
      }
      // Add more specific validations as needed
      lessonPlan.quiz.forEach((q, i) => {
        if (!q.type || !q.questionText || !q.options || !q.correctAnswer) {
            throw new Error(`Quiz question at index ${i} is malformed.`);
        }
        // Ensure correctAnswer is one of the options
        let optionsTexts: string[] = [];
        if (q.type === 'english_to_arabic_mc') {
            optionsTexts = q.options.map(opt => opt.arabic);
        } else {
            optionsTexts = q.options as string[];
        }
        if (!optionsTexts.includes(q.correctAnswer)) {
            console.warn(`Correct answer "${q.correctAnswer}" for question ${i+1} not found in options: ${optionsTexts.join(', ')}`);
            // Potentially attempt to fix or throw error
            // For now, we'll allow it but log a warning. Ideally, the prompt should prevent this.
        }
      });


      return lessonPlan;
    } catch (error) {
      console.error("Error generating lesson plan with Gemini:", error);
      if (error instanceof SyntaxError) { // JSON parsing error
        throw new Error(`Failed to parse lesson plan from API response. Content might not be valid JSON. ${error.message}`);
      }
      if (error instanceof Error) { // Other errors
        throw new Error(`Failed to generate lesson plan: ${error.message}`);
      }
      throw new Error("Failed to generate lesson plan due to an unknown error.");
    }
  },
  isApiKeyConfigured: (): boolean => {
    return !!API_KEY && API_KEY !== MISSING_API_KEY_MSG && !!ai;
  }
};
