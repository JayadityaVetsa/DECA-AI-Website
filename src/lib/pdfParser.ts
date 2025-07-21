// Browser-compatible PDF parser using PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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
  private static questionPattern = /(\d+)\.\s*(.+?)(?=\n[A-D]\.|\n\d+\.|\n*$)/gs;
  private static optionPattern = /([A-D])\.\s*(.+?)(?=\n[A-D]\.|$)/gs;
  private static answerKeyPattern = /(?:Answer Key|Answers?|ANSWER\s*KEY):?\s*((?:\d+\s*[A-D]\s*)+)/gi;

  static async parsePDF(pdfBuffer: Buffer | Uint8Array, cluster: string, event?: string): Promise<ParsedQuestion[]> {
    try {
      console.log('Starting PDF parsing with PDF.js...');
      
      // Convert Buffer to Uint8Array if needed
      const uint8Array = pdfBuffer instanceof Buffer ? new Uint8Array(pdfBuffer) : pdfBuffer;
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      console.log('PDF loaded, pages:', pdf.numPages);
      
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with spaces
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      console.log('PDF text extracted, length:', fullText.length);
      console.log('First 500 characters:', fullText.substring(0, 500));
      
      const questions = this.extractQuestions(fullText, cluster, event);
      console.log('Extracted questions:', questions.length);
      
      return questions;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static extractQuestions(text: string, cluster: string, event?: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    
    // Clean and normalize the text
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Cleaned text length:', cleanText.length);
    
    // Split into lines and process
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let questionNumber = 0;
    let expectingOptions = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a new question (starts with number followed by period)
      const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
      if (questionMatch) {
        // Save previous question if exists and complete
        if (currentQuestion && this.isCompleteQuestion(currentQuestion)) {
          questions.push(currentQuestion as ParsedQuestion);
        }
        
        questionNumber = parseInt(questionMatch[1]);
        currentQuestion = {
          id: `${cluster}_${event || 'general'}_${questionNumber}`,
          cluster,
          event,
          question_text: questionMatch[2].trim(),
          options: { A: '', B: '', C: '', D: '' },
          correct_answer: 'A', // Default, will be updated if answer key found
          performance_indicators: this.inferPerformanceIndicators(questionMatch[2], cluster),
          difficulty_level: 'medium' // Default
        };
        expectingOptions = true;
        continue;
      }
      
      // Check if this is an option (A., B., C., D.)
      const optionMatch = line.match(/^([A-D])\.\s*(.+)/);
      if (optionMatch && currentQuestion && expectingOptions) {
        const optionLetter = optionMatch[1] as 'A' | 'B' | 'C' | 'D';
        currentQuestion.options![optionLetter] = optionMatch[2].trim();
        
        // If this is option D, we're done with options for this question
        if (optionLetter === 'D') {
          expectingOptions = false;
        }
        continue;
      }
      
      // If it's not a new question or option, and we're not expecting options,
      // it might be continuation of question text
      if (currentQuestion && !expectingOptions && !optionMatch && !questionMatch) {
        // Check if it looks like a continuation (not starting with number)
        if (!line.match(/^\d+/) && line.length > 10) {
          currentQuestion.question_text += ' ' + line;
        }
      }
    }
    
    // Add the last question if it exists and is complete
    if (currentQuestion && this.isCompleteQuestion(currentQuestion)) {
      questions.push(currentQuestion as ParsedQuestion);
    }
    
    console.log('Final questions parsed:', questions.length);
    
    // Try to extract and assign answer keys
    const answerKey = this.extractAnswerKey(text);
    console.log('Answer key found:', answerKey);
    
    if (Object.keys(answerKey).length > 0) {
      return this.assignCorrectAnswers(questions, answerKey);
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

  private static inferPerformanceIndicators(questionText: string, cluster: string): string[] {
    // Simple keyword matching to infer PIs
    const lowerText = questionText.toLowerCase();
    const indicators: string[] = [];
    
    // Marketing keywords
    if (cluster === 'Marketing') {
      if (lowerText.includes('market') || lowerText.includes('segment')) {
        indicators.push('Market Planning');
      }
      if (lowerText.includes('promot') || lowerText.includes('advertis')) {
        indicators.push('Promotion');
      }
      if (lowerText.includes('product') || lowerText.includes('service')) {
        indicators.push('Product/Service Management');
      }
      if (lowerText.includes('price') || lowerText.includes('pricing')) {
        indicators.push('Pricing');
      }
    }
    
    // Finance keywords
    if (cluster === 'Finance') {
      if (lowerText.includes('ratio') || lowerText.includes('financial')) {
        indicators.push('Financial Analysis');
      }
      if (lowerText.includes('budget') || lowerText.includes('cash')) {
        indicators.push('Financial Analysis');
      }
    }
    
    // Default to general business concepts
    if (indicators.length === 0) {
      if (lowerText.includes('communicat') || lowerText.includes('message')) {
        indicators.push('Communications');
      } else if (lowerText.includes('customer') || lowerText.includes('client')) {
        indicators.push('Customer Relations');
      } else {
        indicators.push('Business Management');
      }
    }
    
    return indicators;
  }

  static extractAnswerKey(text: string): Record<number, string> {
    const answerKey: Record<number, string> = {};
    
    // Try multiple patterns for answer keys
    const patterns = [
      /(?:Answer Key|Answers?|ANSWER\s*KEY):?\s*((?:\d+\s*[A-D]\s*)+)/gi,
      /(?:Answer|Answers):\s*((?:\d+\s*[A-D]\s*)+)/gi,
      /(\d+)\s*[.:\-]?\s*([A-D])/g
    ];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        if (match[1]) {
          // Extract individual answer pairs
          const answerPairs = match[1].match(/\d+\s*[A-D]/g);
          
          if (answerPairs) {
            answerPairs.forEach(pair => {
              const pairMatch = pair.match(/(\d+)\s*([A-D])/);
              if (pairMatch) {
                const questionNum = parseInt(pairMatch[1]);
                const answer = pairMatch[2];
                answerKey[questionNum] = answer;
              }
            });
          }
        }
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

  // Test method for debugging
  static async testParsing(pdfBuffer: Buffer | Uint8Array): Promise<{ success: boolean; message: string; questions?: ParsedQuestion[] }> {
    try {
      const questions = await this.parsePDF(pdfBuffer, 'Marketing', 'Test Event');
      return {
        success: true,
        message: `Successfully parsed ${questions.length} questions`,
        questions
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default DECAPDFParser; 