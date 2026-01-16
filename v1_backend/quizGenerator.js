import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

class QuizGenerator {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is undefined. Check your .env file.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Update the model string here
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Use 2.5-flash or gemini-3-flash-preview
      generationConfig: { responseMimeType: "application/json" }
    });
  }

  async generateQuestions(count = 10, settings = {}) {
    const {
      language = "English",
      category = "History",
      difficulty = "Medium"
    } = settings;

    // ❌ response_mime_type REMOVED (not supported in v1)
    const generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 4096,
    };

    const prompt = `
Generate exactly ${count} multiple choice quiz questions.

Topic: ${category}
Difficulty: ${difficulty}
Language: ${language}

STRICT RULES:
- Return ONLY valid JSON
- No explanations
- No markdown
- No extra text

JSON format:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": 0
  }
]
`;

    try {
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig,
      });

      const text = result.response.text().trim();

      const questions = JSON.parse(text);

      if (!Array.isArray(questions)) {
        throw new Error("Gemini response is not an array");
      }

      return questions.slice(0, count).map(q => ({
        question: typeof q.question === "string"
            ? q.question
            : "Missing Question",

        options: Array.isArray(q.options) && q.options.length === 4
            ? q.options.map(String)
            : ["Option A", "Option B", "Option C", "Option D"],

        correctAnswer:
            Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer <= 3
                ? q.correctAnswer
                : 0
      }));

    } catch (error) {
      console.error("❌ Gemini API Error:", error.message);
      return this.getFallbackQuestions(count);
    }
  }

  getFallbackQuestions(count = 10) {
    const fallback = [
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1
      },
      {
        question: "Who painted the Mona Lisa?",
        options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
        correctAnswer: 2
      },
      {
        question: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
        correctAnswer: 1
      },
      {
        question: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: 2
      }
    ];

    return Array.from({ length: count }, (_, i) =>
        fallback[i % fallback.length]
    );
  }
}

export default QuizGenerator;
