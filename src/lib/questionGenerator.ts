import { askGemini } from './gemini';
import { PIManager, DECA_EVENTS_DATABASE } from './performanceIndicators';

// Import extracted questions from processed PDFs
let extractedQuestions: any = null;

async function loadExtractedQuestions() {
  if (!extractedQuestions) {
    try {
      // Import the questions JSON file
      const response = await fetch('/src/data/extractedQuestions.json');
      extractedQuestions = await response.json();
    } catch (error) {
      console.error('Error loading extracted questions:', error);
      extractedQuestions = { questions: [] };
    }
  }
  return extractedQuestions;
}

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
  private static async getExtractedQuestions(cluster: string, event?: string): Promise<any[]> {
    try {
      const data = await loadExtractedQuestions();
      const questions = data.questions || [];
      
      // Filter by cluster and event
      return questions.filter((q: any) => {
        if (q.cluster !== cluster) return false;
        if (event && q.event && q.event !== event) return false;
        return true;
      });
    } catch (error) {
      console.error('Error fetching extracted questions:', error);
      return [];
    }
  }

  private static isQuestionSimilar(newQuestion: string, existingQuestions: DECAQuestion[]): boolean {
    const newQuestionLower = newQuestion.toLowerCase();
    
    for (const existing of existingQuestions) {
      const existingLower = existing.question_text.toLowerCase();
      
      // Check for significant word overlap
      const newWords = new Set(newQuestionLower.split(' ').filter(w => w.length > 3));
      const existingWords = new Set(existingLower.split(' ').filter(w => w.length > 3));
      
      const intersection = new Set([...newWords].filter(x => existingWords.has(x)));
      const overlap = intersection.size / Math.min(newWords.size, existingWords.size);
      
      if (overlap > 0.6) { // 60% word overlap threshold
        return true;
      }
    }
    
    return false;
  }

  private static generateQuestionPrompt(
    cluster: string, 
    event: string | undefined, 
    performanceIndicators: string[], 
    difficulty: string,
    existingQuestions: DECAQuestion[] = [],
    extractedQuestions: any[] = [],
    attempt: number = 1
  ): string {
    const existingQuestionTexts = existingQuestions.map(q => q.question_text).join('\n');
    const avoidDuplication = existingQuestions.length > 0 ? 
      `\n\nCRITICAL: Avoid creating questions similar to these existing ones. Create completely different scenarios and contexts:\n${existingQuestionTexts}` : '';

    // Add sample questions from extracted PDFs as training examples
    let trainingExamples = '';
    if (extractedQuestions.length > 0) {
      const sampleQuestions = extractedQuestions.slice(0, 3); // Use up to 3 examples
      trainingExamples = `\n\nUse these official DECA questions as style and format examples:\n\n`;
      sampleQuestions.forEach((q, index) => {
        trainingExamples += `Example ${index + 1}:\nQuestion: ${q.question_text}\n`;
        if (q.options) {
          trainingExamples += `A) ${q.options.A}\nB) ${q.options.B}\nC) ${q.options.C}\nD) ${q.options.D}\n`;
          trainingExamples += `Correct Answer: ${q.correct_answer}\n`;
        }
        trainingExamples += `\n`;
      });
      trainingExamples += `Follow this exact format and style. Create questions that match the complexity and business scenarios shown above.\n`;
    }

    const scenarioVariations = [
      'Create a scenario involving a startup company',
      'Create a scenario involving an established corporation',
      'Create a scenario involving a retail business',
      'Create a scenario involving a service business',
      'Create a scenario involving an e-commerce business',
      'Create a scenario involving a non-profit organization',
      'Create a scenario involving international business',
      'Create a scenario involving small business operations'
    ];

    const scenarioPrompt = attempt > 1 ? 
      `\n\nScenario requirement (attempt ${attempt}): ${scenarioVariations[attempt % scenarioVariations.length]}` : '';

    return `You are an expert DECA test question writer. Create a single, unique, high-quality ${difficulty} difficulty multiple choice question for:

CLUSTER: ${cluster}
EVENT: ${event || 'General'}
PERFORMANCE INDICATORS: ${performanceIndicators.join(', ')}
DIFFICULTY: ${difficulty}

REQUIREMENTS:
1. Question must test understanding of the specified performance indicators
2. Create realistic business scenarios relevant to ${cluster}
3. Provide 4 answer choices (A, B, C, D) with only ONE clearly correct answer
4. Other options should be plausible but clearly incorrect
5. Include a detailed explanation of why the correct answer is right and why others are wrong
6. Use terminology and concepts appropriate for high school DECA competitors
7. Question should reflect real-world business situations
8. Match the style and format of official DECA questions exactly
9. Use the same level of complexity and business scenario depth as the examples
10. MUST be completely unique and different from any existing questions

${trainingExamples}

${scenarioPrompt}

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
    existingQuestions: DECAQuestion[] = [],
    maxAttempts: number = 3
  ): Promise<DECAQuestion> {
    // Get extracted questions for training context
    const extractedQuestions = await this.getExtractedQuestions(cluster, event);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const prompt = this.generateQuestionPrompt(
          cluster, 
          event, 
          performanceIndicators, 
          difficulty, 
          existingQuestions,
          extractedQuestions,
          attempt
        );
        
        const response = await askGemini(prompt);
        
        // Try to parse JSON response
        const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        const questionData = JSON.parse(cleanResponse);
        
        // Validate question structure
        if (!questionData.question_text || !questionData.options || !questionData.correct_answer || !questionData.explanation) {
          throw new Error('Invalid question structure');
        }

        // Check for duplicates
        if (this.isQuestionSimilar(questionData.question_text, existingQuestions)) {
          console.log(`Question similarity detected on attempt ${attempt}, trying again...`);
          continue;
        }
        
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
        console.error(`Error generating question (attempt ${attempt}):`, error);
        if (attempt === maxAttempts) {
          throw new Error(`Failed to generate question after ${maxAttempts} attempts`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Maximum attempts exceeded');
  }

  static async generateTest(config: TestConfiguration): Promise<GeneratedTest> {
    console.log(`🎯 Generating test: ${config.question_count} questions for ${config.cluster}`);
    
    const questions: DECAQuestion[] = [];
    
    // Use real PI data from database
    const availablePIs = config.pi_focus || Object.keys(PIManager.getClusterPIs(config.cluster));
    
    // Calculate how many questions per difficulty level
    const totalQuestions = config.question_count;
    const easyCount = Math.floor(totalQuestions * config.difficulty_distribution.easy);
    const mediumCount = Math.floor(totalQuestions * config.difficulty_distribution.medium);
    const hardCount = totalQuestions - easyCount - mediumCount;

    console.log(`📊 Distribution: Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}`);

    try {
      // Try batch generation first - this uses only 1 API call
      console.log(`🚀 Attempting batch generation (1 API call for all ${totalQuestions} questions)...`);
      const batchQuestions = await this.generateQuestionsBatch(
        config.cluster,
        config.event,
        { easy: easyCount, medium: mediumCount, hard: hardCount },
        availablePIs
      );
      
      questions.push(...batchQuestions);
      console.log(`🎉 Batch generation successful: ${questions.length} questions created with 1 API call`);
      
    } catch (error: any) {
      console.error('❌ Batch generation failed:', error);
      
      // Check if it's an API limit error
      if (error.message.includes('Rate limit') || error.message.includes('quota') || error.message === 'API_LIMIT_EXCEEDED') {
        console.log('📚 API limits reached, using high-quality local question bank instead...');
        const localQuestions = await this.generateFromLocalBank(config.cluster, totalQuestions, { easy: easyCount, medium: mediumCount, hard: hardCount });
        questions.push(...localQuestions);
        
        // Set a flag to indicate we used local questions due to API limits
        (questions as any).__usedLocalDueToLimits = true;
        
      } else {
        console.log('⚠️ Batch generation failed for other reasons, creating mixed local/fallback questions...');
        
        // Try to get some questions from local bank first
        const localQuestions = await this.generateFromLocalBank(config.cluster, Math.min(totalQuestions, 15), { easy: easyCount, medium: mediumCount, hard: hardCount });
        questions.push(...localQuestions);
        
        // Fill remaining with simple fallbacks (no API calls)
        while (questions.length < totalQuestions) {
          const remainingEasy = easyCount - questions.filter(q => q.difficulty_level === 'easy').length;
          const remainingMedium = mediumCount - questions.filter(q => q.difficulty_level === 'medium').length;
          const remainingHard = hardCount - questions.filter(q => q.difficulty_level === 'hard').length;
          
          let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
          if (remainingEasy > 0) difficulty = 'easy';
          else if (remainingMedium > 0) difficulty = 'medium';
          else if (remainingHard > 0) difficulty = 'hard';
          
          const fallbackQuestion = this.createFallbackQuestion(config.cluster, difficulty, questions.length + 1);
          questions.push(fallbackQuestion);
        }
        
        // Set a flag to indicate we used mixed sources
        (questions as any).__usedMixedSources = true;
      }
    }

    // Ensure we have the minimum number of questions
    while (questions.length < Math.min(totalQuestions, 5)) {
      const fallbackQuestion = this.createFallbackQuestion(config.cluster, 'medium', questions.length + 1);
      questions.push(fallbackQuestion);
    }

    console.log(`🎉 Test generation complete: ${questions.length} questions created`);

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

  // NEW: Batch question generation method
  private static async generateQuestionsBatch(
    cluster: string,
    event: string | undefined,
    distribution: { easy: number, medium: number, hard: number },
    availablePIs: string[]
  ): Promise<DECAQuestion[]> {
    // Get extracted questions for training context
    const extractedQuestions = await this.getExtractedQuestions(cluster, event);
    
    // Build comprehensive prompt for batch generation
    const totalQuestions = distribution.easy + distribution.medium + distribution.hard;
    
    let trainingExamples = '';
    if (extractedQuestions.length > 0) {
      const sampleQuestions = extractedQuestions.slice(0, 3); // Use fewer examples to reduce token usage
      trainingExamples = `\n\nUse these DECA questions as examples:\n\n`;
      sampleQuestions.forEach((q, index) => {
        trainingExamples += `Example ${index + 1}: ${q.question_text}\n`;
        if (q.options) {
          trainingExamples += `A) ${q.options.A}\nB) ${q.options.B}\nC) ${q.options.C}\nD) ${q.options.D}\nCorrect: ${q.correct_answer}\n\n`;
        }
      });
    }

    // Simplified, more reliable prompt that's less likely to hit token limits
    const prompt = `Generate ${totalQuestions} DECA ${cluster} multiple choice questions in valid JSON format.

REQUIREMENTS:
- ${distribution.easy} easy questions (basic concepts)
- ${distribution.medium} medium questions (analysis required)  
- ${distribution.hard} hard questions (complex scenarios)
- Each question must be unique with different business scenarios
- Use Performance Indicators: ${availablePIs.slice(0, 8).join(', ')} // Limit PIs to reduce token usage

${trainingExamples}

Return ONLY this JSON array format:
[
  {
    "question_text": "Question here...",
    "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
    "correct_answer": "B",
    "difficulty": "easy",
    "performance_indicators": ["PI1", "PI2"],
    "explanation": "Brief explanation..."
  }
]

Generate all ${totalQuestions} questions with complete uniqueness. No additional text.`;

    try {
      console.log('🚀 Sending optimized batch generation request...');
      const response = await askGemini(prompt);
      
      // More robust JSON parsing
      let cleanResponse = response.trim();
      
      // Remove common markdown artifacts
      cleanResponse = cleanResponse.replace(/^```(?:json)?\s*\n?/i, '');
      cleanResponse = cleanResponse.replace(/\n?\s*```\s*$/i, '');
      
      // Find JSON array bounds more reliably
      const startIndex = cleanResponse.indexOf('[');
      const endIndex = cleanResponse.lastIndexOf(']');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('No JSON array found in response');
      }
      
      cleanResponse = cleanResponse.substring(startIndex, endIndex + 1);
      
      let questionsData: any[];
      try {
        questionsData = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Failed to parse:', cleanResponse.substring(0, 200) + '...');
        throw new Error('Invalid JSON response from API');
      }
      
      if (!Array.isArray(questionsData)) {
        throw new Error('Response is not an array');
      }
      
      console.log(`✅ Parsed ${questionsData.length} questions from batch response`);
      
      // Convert to DECAQuestion format with validation
      const questions: DECAQuestion[] = [];
      
      for (let i = 0; i < questionsData.length && i < totalQuestions; i++) {
        const q = questionsData[i];
        
        // Validate required fields
        if (!q.question_text || !q.options || !q.correct_answer || !q.explanation) {
          console.warn(`⚠️ Skipping invalid question ${i + 1}: missing required fields`);
          continue;
        }
        
        // Validate options structure
        if (typeof q.options !== 'object' || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
          console.warn(`⚠️ Skipping invalid question ${i + 1}: invalid options structure`);
          continue;
        }
        
        // Determine target difficulty for balanced distribution
        const targetDifficulty = this.getTargetDifficulty(i, distribution);
        
        const question: DECAQuestion = {
          id: `batch_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          cluster,
          event,
          question_text: q.question_text,
          options: {
            A: q.options.A,
            B: q.options.B,
            C: q.options.C,
            D: q.options.D
          },
          correct_answer: q.correct_answer,
          performance_indicators: Array.isArray(q.performance_indicators) ? q.performance_indicators : ['Business Management'],
          difficulty_level: (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') ? q.difficulty : targetDifficulty,
          explanation: q.explanation
        };
        
        questions.push(question);
      }
      
      console.log(`🎯 Successfully converted ${questions.length} valid questions`);
      
      // Check if we have enough questions (at least 60% of requested)
      if (questions.length < Math.floor(totalQuestions * 0.6)) {
        throw new Error(`Insufficient questions generated: ${questions.length}/${totalQuestions}. Expected at least ${Math.floor(totalQuestions * 0.6)}`);
      }
      
      // If we have fewer questions than requested, we'll fill with local bank in the calling method
      return questions;
      
    } catch (error: any) {
      console.error('❌ Batch generation failed:', error);
      
      // Provide specific error context
      if (error.message.includes('Rate limit') || error.message.includes('quota')) {
        throw new Error('API_LIMIT_EXCEEDED');
      } else if (error.message.includes('JSON')) {
        throw new Error('JSON_PARSE_ERROR');
      } else {
        throw error;
      }
    }
  }

  // NEW: Comprehensive local question bank
  private static async generateFromLocalBank(
    cluster: string, 
    count: number, 
    distribution: { easy: number, medium: number, hard: number }
  ): Promise<DECAQuestion[]> {
    const localBank = this.getLocalQuestionBank();
    const clusterQuestions = localBank[cluster] || localBank['Marketing']; // Fallback to Marketing
    
    const questions: DECAQuestion[] = [];
    
    // Get questions by difficulty
    const easyQuestions = clusterQuestions.filter(q => q.difficulty_level === 'easy');
    const mediumQuestions = clusterQuestions.filter(q => q.difficulty_level === 'medium');
    const hardQuestions = clusterQuestions.filter(q => q.difficulty_level === 'hard');
    
    // Add easy questions
    for (let i = 0; i < Math.min(distribution.easy, easyQuestions.length); i++) {
      const question = { ...easyQuestions[i % easyQuestions.length] };
      question.id = `local_${Date.now()}_${questions.length}_${Math.random().toString(36).substr(2, 5)}`;
      questions.push(question);
    }
    
    // Add medium questions
    for (let i = 0; i < Math.min(distribution.medium, mediumQuestions.length); i++) {
      const question = { ...mediumQuestions[i % mediumQuestions.length] };
      question.id = `local_${Date.now()}_${questions.length}_${Math.random().toString(36).substr(2, 5)}`;
      questions.push(question);
    }
    
    // Add hard questions
    for (let i = 0; i < Math.min(distribution.hard, hardQuestions.length); i++) {
      const question = { ...hardQuestions[i % hardQuestions.length] };
      question.id = `local_${Date.now()}_${questions.length}_${Math.random().toString(36).substr(2, 5)}`;
      questions.push(question);
    }
    
    console.log(`📚 Generated ${questions.length} questions from local bank`);
    return this.shuffleArray(questions);
  }

  // NEW: Local high-quality question bank
  private static getLocalQuestionBank(): Record<string, DECAQuestion[]> {
    return {
      Marketing: [
        {
          id: 'local_marketing_1',
          cluster: 'Marketing',
          question_text: 'A startup company selling eco-friendly water bottles wants to target environmentally conscious millennials. Which market segmentation approach would be most effective?',
          options: {
            A: 'Geographic segmentation focusing on urban areas',
            B: 'Psychographic segmentation based on environmental values and lifestyle',
            C: 'Demographic segmentation based on income level',
            D: 'Behavioral segmentation based on purchase frequency'
          },
          correct_answer: 'B',
          difficulty_level: 'easy',
          performance_indicators: ['Market Segmentation', 'Target Marketing'],
          explanation: 'Psychographic segmentation is most effective here because it focuses on values, attitudes, and lifestyle - exactly what defines environmentally conscious consumers regardless of their demographics or location.'
        },
        {
          id: 'local_marketing_2',
          cluster: 'Marketing',
          question_text: 'A luxury smartphone brand wants to maintain its premium positioning while entering a price-sensitive emerging market. What pricing strategy should they adopt?',
          options: {
            A: 'Penetration pricing to gain market share quickly',
            B: 'Economy pricing to compete with local brands',
            C: 'Premium pricing with value-added services',
            D: 'Loss leader pricing on selected models'
          },
          correct_answer: 'C',
          difficulty_level: 'medium',
          performance_indicators: ['Pricing Strategy', 'Brand Positioning'],
          explanation: 'Premium pricing with value-added services maintains brand positioning while providing additional value that justifies the higher price point, protecting the luxury brand image.'
        },
        {
          id: 'local_marketing_3',
          cluster: 'Marketing',
          question_text: 'A B2B software company is deciding between digital marketing channels for reaching enterprise customers. Their sales cycle is 6-12 months and involves multiple decision makers. Which channel mix would be most effective?',
          options: {
            A: 'Social media advertising and influencer partnerships',
            B: 'Content marketing, LinkedIn ads, and webinar series',
            C: 'Radio advertising and print media placements',
            D: 'Television commercials and billboard advertising'
          },
          correct_answer: 'B',
          difficulty_level: 'hard',
          performance_indicators: ['Digital Marketing', 'B2B Marketing', 'Channel Strategy'],
          explanation: 'B2B enterprise sales require educational content and professional networking. Content marketing builds trust over the long sales cycle, LinkedIn targets business professionals, and webinars allow direct engagement with multiple stakeholders.'
        },
        {
          id: 'local_marketing_4',
          cluster: 'Marketing',
          question_text: 'What is the primary purpose of a marketing mix strategy?',
          options: {
            A: 'To increase production capacity',
            B: 'To coordinate product, price, place, and promotion decisions',
            C: 'To reduce operational costs',
            D: 'To eliminate competition'
          },
          correct_answer: 'B',
          difficulty_level: 'easy',
          performance_indicators: ['Marketing Mix', 'Strategic Planning'],
          explanation: 'The marketing mix (4 Ps) coordinates all marketing elements - product, price, place, and promotion - to create a cohesive strategy that effectively reaches target customers.'
        },
        {
          id: 'local_marketing_5',
          cluster: 'Marketing',
          question_text: 'A fashion retailer notices that social media influencer partnerships generate higher engagement but lower conversion rates compared to traditional advertising. How should they optimize their approach?',
          options: {
            A: 'Abandon influencer marketing entirely',
            B: 'Focus only on macro-influencers with large followings',
            C: 'Use micro-influencers with strong engagement rates and clear call-to-actions',
            D: 'Increase spending on traditional advertising only'
          },
          correct_answer: 'C',
          difficulty_level: 'medium',
          performance_indicators: ['Digital Marketing', 'Influencer Marketing', 'Performance Analysis'],
          explanation: 'Micro-influencers typically have higher engagement rates and more trusted relationships with followers. Adding clear call-to-actions helps convert high engagement into actual sales.'
        }
      ],
      Finance: [
        {
          id: 'local_finance_1',
          cluster: 'Finance',
          question_text: 'What does a current ratio of 2.5 indicate about a company\'s liquidity?',
          options: {
            A: 'The company cannot meet short-term obligations',
            B: 'The company has $2.50 in current assets for every $1.00 in current liabilities',
            C: 'The company has excessive debt',
            D: 'The company\'s inventory is turning over slowly'
          },
          correct_answer: 'B',
          difficulty_level: 'easy',
          performance_indicators: ['Financial Analysis', 'Liquidity Ratios'],
          explanation: 'Current ratio = Current Assets ÷ Current Liabilities. A ratio of 2.5 means the company has $2.50 in current assets for every $1.00 in current liabilities, indicating good liquidity.'
        },
        {
          id: 'local_finance_2',
          cluster: 'Finance',
          question_text: 'A startup needs $500,000 for expansion. They can either take a bank loan at 8% interest or give up 20% equity to venture capitalists. The company expects 25% annual growth. Which option is better?',
          options: {
            A: 'Bank loan, because debt is always cheaper than equity',
            B: 'Venture capital, because no interest payments are required',
            C: 'Bank loan, because the cost of equity (25% growth) exceeds the 8% loan cost',
            D: 'Venture capital, because it provides strategic value beyond money'
          },
          correct_answer: 'D',
          difficulty_level: 'hard',
          performance_indicators: ['Capital Structure', 'Investment Analysis', 'Cost of Capital'],
          explanation: 'While the loan appears cheaper (8% vs 20% equity), venture capitalists provide strategic value, industry connections, and expertise that can accelerate the 25% growth rate, making the total value proposition more attractive.'
        },
        {
          id: 'local_finance_3',
          cluster: 'Finance',
          question_text: 'A company\'s gross profit margin is 40% and net profit margin is 8%. What does this suggest?',
          options: {
            A: 'The company has low production costs',
            B: 'The company has high operating expenses',
            C: 'The company has no debt',
            D: 'The company has excellent inventory management'
          },
          correct_answer: 'B',
          difficulty_level: 'medium',
          performance_indicators: ['Profitability Analysis', 'Financial Ratios'],
          explanation: 'The large gap between gross profit (40%) and net profit (8%) indicates that operating expenses, taxes, and interest are consuming 32% of revenue, suggesting high operating costs.'
        }
      ],
      'Business Management': [
        {
          id: 'local_bm_1',
          cluster: 'Business Management',
          question_text: 'What is the most important characteristic of effective leadership?',
          options: {
            A: 'Making all decisions independently',
            B: 'Communicating vision and inspiring others',
            C: 'Focusing only on short-term results',
            D: 'Avoiding conflict at all costs'
          },
          correct_answer: 'B',
          difficulty_level: 'easy',
          performance_indicators: ['Leadership', 'Communication'],
          explanation: 'Effective leaders communicate a clear vision and inspire others to work toward common goals, empowering teams rather than making all decisions alone.'
        },
        {
          id: 'local_bm_2',
          cluster: 'Business Management',
          question_text: 'A manufacturing company wants to improve quality while reducing costs. Which approach would be most effective?',
          options: {
            A: 'Hire more quality inspectors',
            B: 'Implement Six Sigma methodology',
            C: 'Reduce supplier standards to cut costs',
            D: 'Increase production speed'
          },
          correct_answer: 'B',
          difficulty_level: 'medium',
          performance_indicators: ['Quality Management', 'Process Improvement'],
          explanation: 'Six Sigma is a data-driven methodology that reduces defects and improves processes, simultaneously improving quality and reducing waste-related costs.'
        }
      ]
    };
  }

  // Helper method to determine target difficulty based on distribution
  private static getTargetDifficulty(index: number, distribution: { easy: number, medium: number, hard: number }): 'easy' | 'medium' | 'hard' {
    if (index < distribution.easy) return 'easy';
    if (index < distribution.easy + distribution.medium) return 'medium';
    return 'hard';
  }

  private static createFallbackQuestion(cluster: string, difficulty: 'easy' | 'medium' | 'hard', index: number): DECAQuestion {
    const fallbackQuestions = {
      Marketing: {
        easy: {
          question: "What is the primary goal of market segmentation?",
          options: {
            A: "To increase production costs",
            B: "To divide the market into smaller, more manageable groups",
            C: "To eliminate competition",
            D: "To reduce product quality"
          },
          correct: "B",
          explanation: "Market segmentation involves dividing the market into smaller groups with similar characteristics to better target marketing efforts."
        },
        medium: {
          question: "A company wants to position its product as premium quality. Which pricing strategy would be most appropriate?",
          options: {
            A: "Penetration pricing",
            B: "Economy pricing",
            C: "Premium pricing",
            D: "Loss leader pricing"
          },
          correct: "C",
          explanation: "Premium pricing aligns with a premium quality positioning strategy by setting higher prices to reflect superior value."
        },
        hard: {
          question: "Which factor would most likely influence a company to use a push promotional strategy rather than a pull strategy?",
          options: {
            A: "High consumer brand loyalty",
            B: "Complex product requiring explanation",
            C: "Large advertising budget",
            D: "Strong retail channel relationships"
          },
          correct: "B",
          explanation: "Push strategies work well for complex products that require personal selling and explanation to intermediaries who then educate consumers."
        }
      }
    };

    const questionData = fallbackQuestions[cluster as keyof typeof fallbackQuestions]?.[difficulty] || fallbackQuestions.Marketing.medium;

    return {
      id: `fallback_${Date.now()}_${index}`,
      cluster,
      question_text: questionData.question,
      options: questionData.options,
      correct_answer: questionData.correct as 'A' | 'B' | 'C' | 'D',
      performance_indicators: ['Business Management'],
      difficulty_level: difficulty,
      explanation: questionData.explanation
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