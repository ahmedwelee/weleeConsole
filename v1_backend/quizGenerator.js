import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class QuizGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateQuestions(count = 20) {
    try {
      const prompt = `Generate exactly ${count} multiple choice quiz questions. Each question should have:
- A clear question
- Exactly 4 options (A, B, C, D)
- One correct answer
- Mix of difficulty levels
- Various topics (general knowledge, science, history, geography, entertainment)

Format as JSON array:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

The correctAnswer is the index (0-3) of the correct option.
Return only valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a quiz generator. Generate engaging, accurate quiz questions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      });

      const content = response.choices[0].message.content.trim();
      
      let questions;
      try {
        questions = JSON.parse(content);
      } catch (parseError) {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse questions from response');
        }
      }

      if (!Array.isArray(questions) || questions.length !== count) {
        console.warn(`Expected ${count} questions, got ${questions.length}`);
      }

      return questions.slice(0, count);

    } catch (error) {
      console.error('Error generating questions:', error);
      return this.getFallbackQuestions(count);
    }
  }

  getFallbackQuestions(count = 20) {
    const fallbackQuestions = [
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
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1
      },
      {
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        correctAnswer: 2
      },
      {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: 3
      },
      {
        question: "How many continents are there?",
        options: ["5", "6", "7", "8"],
        correctAnswer: 2
      },
      {
        question: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correctAnswer: 2
      },
      {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctAnswer: 1
      },
      {
        question: "What is the speed of light?",
        options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
        correctAnswer: 0
      },
      {
        question: "Which country is home to the kangaroo?",
        options: ["New Zealand", "South Africa", "Australia", "Brazil"],
        correctAnswer: 2
      },
      {
        question: "What is the smallest prime number?",
        options: ["0", "1", "2", "3"],
        correctAnswer: 2
      },
      {
        question: "Who invented the telephone?",
        options: ["Thomas Edison", "Nikola Tesla", "Alexander Graham Bell", "Benjamin Franklin"],
        correctAnswer: 2
      },
      {
        question: "What is the currency of Japan?",
        options: ["Yuan", "Won", "Yen", "Ringgit"],
        correctAnswer: 2
      },
      {
        question: "How many sides does a hexagon have?",
        options: ["5", "6", "7", "8"],
        correctAnswer: 1
      },
      {
        question: "What is the largest mammal in the world?",
        options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
        correctAnswer: 1
      },
      {
        question: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: 2
      },
      {
        question: "What is the hardest natural substance on Earth?",
        options: ["Gold", "Iron", "Diamond", "Platinum"],
        correctAnswer: 2
      },
      {
        question: "Who was the first person to walk on the moon?",
        options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
        correctAnswer: 1
      },
      {
        question: "What is the capital of Italy?",
        options: ["Venice", "Milan", "Rome", "Florence"],
        correctAnswer: 2
      },
      {
        question: "How many keys are on a standard piano?",
        options: ["76", "88", "92", "100"],
        correctAnswer: 1
      }
    ];

    return fallbackQuestions.slice(0, count);
  }
}

export default QuizGenerator;
