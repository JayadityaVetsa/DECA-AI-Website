import { askGemini } from './gemini';
import { PIManager, DECA_EVENTS_DATABASE } from './performanceIndicators';

export interface DECAQuestion {
  id: string;
  cluster: string;
  event?: string;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  performance_indicators: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface TestConfiguration {
  test_type: 'practice' | 'full_simulation';
  cluster: string;
  event?: string;
  question_count: number;
  time_limit_minutes: number;
  pi_focus?: string[];
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface GeneratedTest {
  test_id: string;
  config: TestConfiguration;
  questions: DECAQuestion[];
  estimated_time: number;
  pi_coverage: Record<string, number>;
}

export class DECAQuestionGenerator {
  private static generateQuestionPrompt(
    cluster: string, 
    event: string | undefined, 
    performanceIndicators: string[], 
    difficulty: string,
    existingQuestions: DECAQuestion[] = []
  ): string {
    const existingQuestionTexts = existingQuestions.map(q => q.question_text).join('\n');
    const avoidDuplication = existingQuestions.length > 0 ? 
      `\n\nAvoid creating questions similar to these existing ones:\n${existingQuestionTexts}` : '';

    return `You are an expert DECA test question writer. Create a single, high-quality ${difficulty} difficulty multiple choice question for:

CLUSTER: ${cluster}
EVENT: ${event || 'General'}
PERFORMANCE INDICATORS: ${performanceIndicators.join(', ')}
DIFFICULTY: ${difficulty}

REQUIREMENTS:
1. Question must test understanding of the specified performance indicators
2. Create realistic business scenarios relevant to ${cluster}
3. Provide 4 answer choices (A, B, C, D) with only ONE clearly correct answer
4. Other options should be plausible but clearly incorrect
5. Include a detailed explanation of why the correct answer is right
6. Use terminology and concepts appropriate for high school DECA competitors
7. Question should reflect real-world business situations

FORMAT YOUR RESPONSE EXACTLY AS JSON:
{
  "question_text": "Your question here...",
  "options": {
    "A": "Option A text",
    "B": "Option B text", 
    "C": "Option C text",
    "D": "Option D text"
  },
  "correct_answer": "A",
  "explanation": "Detailed explanation of why this is correct and why other options are wrong..."
}${avoidDuplication}`;
  }

  static async generateSingleQuestion(
    cluster: string,
    event: string | undefined,
    performanceIndicators: string[],
    difficulty: 'easy' | 'medium' | 'hard',
    existingQuestions: DECAQuestion[] = []
  ): Promise<DECAQuestion> {
    const prompt = this.generateQuestionPrompt(cluster, event, performanceIndicators, difficulty, existingQuestions);
    
    try {
      const response = await askGemini(prompt);
      
      // Try to parse JSON response
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const questionData = JSON.parse(cleanResponse);
      
      return {
        id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cluster,
        event,
        question_text: questionData.question_text,
        options: questionData.options,
        correct_answer: questionData.correct_answer,
        performance_indicators: performanceIndicators,
        difficulty_level: difficulty,
        explanation: questionData.explanation
      };
    } catch (error) {
      console.error('Error generating question:', error);
      throw new Error('Failed to generate question');
    }
  }

  static async generateTest(config: TestConfiguration): Promise<GeneratedTest> {
    const questions: DECAQuestion[] = [];
    
    // Use real PI data from database
    const availablePIs = config.pi_focus || Object.keys(PIManager.getClusterPIs(config.cluster));
    
    // Calculate how many questions per difficulty level
    const totalQuestions = config.question_count;
    const easyCount = Math.floor(totalQuestions * config.difficulty_distribution.easy);
    const mediumCount = Math.floor(totalQuestions * config.difficulty_distribution.medium);
    const hardCount = totalQuestions - easyCount - mediumCount;

    // Generate questions for each difficulty level
    const difficulties: Array<{ level: 'easy' | 'medium' | 'hard', count: number }> = [
      { level: 'easy', count: easyCount },
      { level: 'medium', count: mediumCount },
      { level: 'hard', count: hardCount }
    ];

    for (const { level, count } of difficulties) {
      for (let i = 0; i < count; i++) {
        // Use weighted PI selection based on DECA official distribution
        const competitionLevel = config.test_type === 'full_simulation' ? 'icdc' : 'district';
        const selectedPIs = PIManager.selectRandomPIs(config.cluster, 2, competitionLevel);
        
        try {
          const question = await this.generateSingleQuestion(
            config.cluster,
            config.event,
            selectedPIs,
            level,
            questions // Pass existing questions to avoid duplication
          );
          
          questions.push(question);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to generate question ${i + 1} for ${level}:`, error);
          // Continue with next question
        }
      }
    }

    // Calculate PI coverage
    const piCoverage: Record<string, number> = {};
    questions.forEach(question => {
      question.performance_indicators.forEach(pi => {
        piCoverage[pi] = (piCoverage[pi] || 0) + 1;
      });
    });

    return {
      test_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      config,
      questions: this.shuffleArray(questions), // Shuffle final question order
      estimated_time: config.time_limit_minutes,
      pi_coverage: piCoverage
    };
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static getRecommendedSettings(cluster: string, testType: 'practice' | 'full_simulation') {
    if (testType === 'full_simulation') {
      return {
        question_count: 100,
        time_limit_minutes: 90,
        difficulty_distribution: { easy: 0.3, medium: 0.5, hard: 0.2 }
      };
    } else {
      return {
        question_count: 20,
        time_limit_minutes: 30,
        difficulty_distribution: { easy: 0.4, medium: 0.4, hard: 0.2 }
      };
    }
  }
}

export default DECAQuestionGenerator; 