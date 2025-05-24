
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LessonPlan, UploadedFile } from '../types';
import { GEMINI_MODEL_NAME, MISSING_API_KEY_MSG } from '../constants';

// The API_KEY is sourced directly from the environment variable 'process.env.API_KEY'.
// In valid JavaScript, 'const API_KEY = process.env.API_KEY;' correctly initializes API_KEY.
// If 'process.env.API_KEY' is undefined, API_KEY will be undefined. This is a valid initialization.
// A "SyntaxError: Missing initializer in const declaration" on this line implies that 'process.env.API_KEY'
// is being improperly substituted by a build tool or pre-processor, resulting in syntactically invalid code
// (e.g., 'const API_KEY = ;'). This would be an environmental issue.
const API_KEY = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;

if (API_KEY && API_KEY !== MISSING_API_KEY_MSG) { // Check if API_KEY is provided and not the placeholder
  try {
    ai = new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI. Ensure API_KEY is valid.", error);
    // ai remains null, subsequent calls will fail gracefully.
  }
} else {
  console.warn(`API_KEY environment variable is not set or is set to the placeholder value. Gemini API calls will not be made. Current value: ${API_KEY === MISSING_API_KEY_MSG ? "Placeholder (Not configured)" : API_KEY === undefined ? "Not set (undefined)" : "Not set (empty or other falsy value)"}`);
}


const generateLessonPlanPrompt = (topics: string, file?: UploadedFile): string => {
  let fileContextInstruction = "";
  if (file) {
    fileContextInstruction = `
The user has also uploaded a file named "${file.name}" (MIME type: ${file.mimeType}). 
This file contains material relevant to the lesson. 
Please analyze the content of this file to identify and extract key topics, vocabulary, and phrases suitable for an 11-year-old beginner learning Arabic.
Prioritize content from the uploaded file if it seems comprehensive for the lesson's scope.
`;
  }

  return `
You are an expert Arabic language tutor creating engaging educational content for an 11-year-old beginner.
The goal is to teach spoken Arabic relevant to their school test.

${fileContextInstruction}

Based on the information from the uploaded file (if any) and the following user-specified topics: "${topics || "None specified, rely on file content or general beginner topics"}", generate a lesson plan.

The lesson plan MUST be in a valid JSON format. Do NOT include any markdown formatting like \`\`\`json or \`\`\` around the JSON output.
The JSON structure MUST be as follows:
{
  "title": "Lesson: [A catchy and relevant title derived from the topics/file content, e.g., 'Mastering Greetings & Introductions']",
  "vocabulary": [
    {
      "arabic": "[ARABIC_WORD_OR_PHRASE_WITH_DIACRITICS_IF_POSSIBLE]",
      "english": "[ACCURATE_ENGLISH_TRANSLATION]",
      "transliteration": "[SIMPLE_CLEAR_PHONETIC_TRANSLITERATION_FOR_AN_ENGLISH_SPEAKER]",
      "audioSrc": "[EXACT_ARABIC_WORD_OR_PHRASE_FOR_TTS_MATCHING_ARABIC_FIELD]"
    } 
    // Aim for 5-8 diverse and useful vocabulary items related to the topics/file.
  ],
  "phrases": [
    {
      "arabic": "[COMMON_ARABIC_PHRASE_WITH_DIACRITICS_IF_POSSIBLE]",
      "english": "[ACCURATE_ENGLISH_TRANSLATION_OF_THE_PHRASE]",
      "transliteration": "[SIMPLE_CLEAR_PHONETIC_TRANSLITERATION_OF_THE_PHRASE]",
      "audioSrc": "[EXACT_ARABIC_PHRASE_FOR_TTS_MATCHING_ARABIC_FIELD]"
    }
    // Aim for 3-5 practical phrases using the vocabulary or related to the topics/file.
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
- Double-check that \`correctAnswer\` values in quiz questions perfectly match one of the provided options (textually).
`;
}

export const geminiService = {
  generateLessonPlan: async (topics: string, file?: UploadedFile): Promise<LessonPlan> => {
    if (!ai) {
      throw new Error("Gemini API client is not initialized. Is the API_KEY configured correctly?");
    }
    try {
      const promptText = generateLessonPlanPrompt(topics, file);
      console.log("Generating lesson plan with topics:", topics, "and file:", file?.name);

      const contentParts: Part[] = [{ text: promptText }];
      if (file) {
        contentParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.base64Data,
          },
        });
      }
      
      const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
const response = await model.generateContent(prompt);
        model: GEMINI_MODEL_NAME,
        contents: { parts: contentParts }, // Use parts for multimodal input
        config: {
          responseMimeType: "application/json",
          temperature: 0.6, 
        },
      });
      
      let jsonStr = response.text.trim();
      
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }

      const lessonPlan = JSON.parse(jsonStr) as LessonPlan;

      if (!lessonPlan || typeof lessonPlan !== 'object') {
        throw new Error("API response is not a valid object.");
      }
      if (!lessonPlan.title || !Array.isArray(lessonPlan.vocabulary) || !Array.isArray(lessonPlan.phrases) || !Array.isArray(lessonPlan.quiz)) {
        console.error("Invalid lesson plan structure received:", lessonPlan);
        throw new Error("Invalid lesson plan structure: missing required fields (title, vocabulary, phrases, or quiz).");
      }
      lessonPlan.quiz.forEach((q, i) => {
        if (!q.type || !q.questionText || !q.options || !q.correctAnswer) {
            throw new Error(`Quiz question at index ${i} is malformed.`);
        }
        let optionsTexts: string[] = [];
        if (q.type === 'english_to_arabic_mc') {
            optionsTexts = q.options.map(opt => opt.arabic);
        } else {
            optionsTexts = q.options as string[];
        }
        if (!optionsTexts.includes(q.correctAnswer)) {
            console.warn(`Correct answer "${q.correctAnswer}" for quiz question ${i+1} ('${q.questionText}') not found in options: [${optionsTexts.join(', ')}]. This might indicate an issue with the generated lesson plan.`);
        }
      });

      return lessonPlan;
    } catch (error) {
      console.error("Error generating lesson plan with Gemini:", error);
      if (error instanceof SyntaxError) { 
        throw new Error(`Failed to parse lesson plan from API response. Content might not be valid JSON. ${error.message}`);
      }
      if (error instanceof Error) { 
        throw new Error(`Failed to generate lesson plan: ${error.message}`);
      }
      throw new Error("Failed to generate lesson plan due to an unknown error.");
    }
  },
  isApiKeyConfigured: (): boolean => {
    return !!API_KEY && API_KEY !== MISSING_API_KEY_MSG && !!ai;
  }
};
