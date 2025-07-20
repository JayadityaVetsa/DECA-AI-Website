import pdf from 'pdf-parse';

interface ParsedQuestion {
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
  explanation?: string;
}

interface PerformanceIndicator {
  id: string;
  name: string;
  cluster: 'Business Administration' | 'Business Management' | 'Entrepreneurship' | 'Finance' | 'Hospitality' | 'Marketing';
  event: string;
  district_weight: number;
  association_weight: number;
  icdc_weight: number;
  description?: string;
}

export class DECAPDFParser {
  private static questionPattern = /(\d+)\.\s*(.+?)(?=\n[A-D]\)|$)/gs;
  private static optionPattern = /([A-D])\)\s*(.+?)(?=\n[A-D]\)|$)/gs;
  private static answerKeyPattern = /(?:Answer Key|Answers?):?\s*((?:\d+[A-D]\s*)+)/gi;

  static async parsePDF(pdfBuffer: Buffer, cluster: string, event?: string): Promise<ParsedQuestion[]> {
    try {
      const data = await pdf(pdfBuffer);
      const text = data.text;
      
      return this.extractQuestions(text, cluster, event);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF');
    }
  }

  private static extractQuestions(text: string, cluster: string, event?: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let questionNumber = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a new question (starts with number followed by period)
      const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion && this.isCompleteQuestion(currentQuestion)) {
          questions.push(currentQuestion as ParsedQuestion);
        }
        
        questionNumber = parseInt(questionMatch[1]);
        currentQuestion = {
          id: `${cluster}_${event || 'general'}_${questionNumber}`,
          cluster,
          event,
          question_text: questionMatch[2],
          options: { A: '', B: '', C: '', D: '' },
          correct_answer: 'A',
          performance_indicators: [],
          difficulty_level: 'medium'
        };
        continue;
      }
      
      // Check if this is an option (A), B), C), D))
      const optionMatch = line.match(/^([A-D])\)\s*(.+)/);
      if (optionMatch && currentQuestion) {
        const optionLetter = optionMatch[1] as 'A' | 'B' | 'C' | 'D';
        currentQuestion.options![optionLetter] = optionMatch[2];
        continue;
      }
      
      // If it's not a new question or option, append to current question text
      if (currentQuestion && !optionMatch) {
        currentQuestion.question_text += ' ' + line;
      }
    }
    
    // Add the last question
    if (currentQuestion && this.isCompleteQuestion(currentQuestion)) {
      questions.push(currentQuestion as ParsedQuestion);
    }
    
    return questions;
  }

  private static isCompleteQuestion(question: Partial<ParsedQuestion>): boolean {
    return !!(
      question.question_text &&
      question.options?.A &&
      question.options?.B &&
      question.options?.C &&
      question.options?.D
    );
  }

  static extractAnswerKey(text: string): Record<number, string> {
    const answerKey: Record<number, string> = {};
    const answerKeyMatch = text.match(this.answerKeyPattern);
    
    if (answerKeyMatch) {
      const answers = answerKeyMatch[1];
      const answerPairs = answers.match(/\d+[A-D]/g);
      
      if (answerPairs) {
        answerPairs.forEach(pair => {
          const questionNum = parseInt(pair.slice(0, -1));
          const answer = pair.slice(-1);
          answerKey[questionNum] = answer;
        });
      }
    }
    
    return answerKey;
  }

  static assignCorrectAnswers(questions: ParsedQuestion[], answerKey: Record<number, string>): ParsedQuestion[] {
    return questions.map((question, index) => {
      const questionNum = index + 1;
      const correctAnswer = answerKey[questionNum];
      
      if (correctAnswer && ['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        question.correct_answer = correctAnswer as 'A' | 'B' | 'C' | 'D';
      }
      
      return question;
    });
  }
}

export default DECAPDFParser; 