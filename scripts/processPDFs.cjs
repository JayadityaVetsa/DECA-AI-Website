const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');

class DECAPDFProcessor {
  constructor() {
    this.questionsDir = path.join(__dirname, '../question-pdfs');
    this.outputDir = path.join(__dirname, '../src/data');
    this.questionsFile = path.join(this.outputDir, 'extractedQuestions.json');
    this.explanationsFile = path.join(this.outputDir, 'extractedExplanations.json');
  }

  async processAllPDFs() {
    console.log('🚀 Starting PDF processing...');
    
    // Ensure directories exist
    await fs.ensureDir(this.questionsDir);
    await fs.ensureDir(this.outputDir);

    // Get all PDF files
    const files = await fs.readdir(this.questionsDir);
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

    if (pdfFiles.length === 0) {
      console.log('📁 No PDF files found in question-pdfs folder');
      console.log('💡 Add some DECA question PDFs to question-pdfs/ and run this script again');
      return;
    }

    console.log(`📚 Found ${pdfFiles.length} PDF files to process`);

    let allQuestions = [];
    let allExplanations = [];
    let processedFiles = [];

    for (const pdfFile of pdfFiles) {
      try {
        console.log(`\n📖 Processing: ${pdfFile}`);
        const filePath = path.join(this.questionsDir, pdfFile);
        const result = await this.processPDF(filePath, pdfFile);
        
        if (result.questions.length > 0 || result.explanations.length > 0) {
          allQuestions = [...allQuestions, ...result.questions];
          allExplanations = [...allExplanations, ...result.explanations];
          processedFiles.push({
            fileName: pdfFile,
            questionCount: result.questions.length,
            explanationCount: result.explanations.length,
            processedAt: new Date().toISOString()
          });
          console.log(`✅ Extracted ${result.questions.length} questions and ${result.explanations.length} explanations from ${pdfFile}`);
        } else {
          console.log(`⚠️  No questions or explanations found in ${pdfFile}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${pdfFile}:`, error.message);
      }
    }

    // Save questions
    const questionsOutput = {
      metadata: {
        totalQuestions: allQuestions.length,
        totalFiles: processedFiles.length,
        processedAt: new Date().toISOString(),
        files: processedFiles
      },
      questions: allQuestions
    };

    await fs.writeJSON(this.questionsFile, questionsOutput, { spaces: 2 });

    // Save explanations
    const explanationsOutput = {
      metadata: {
        totalExplanations: allExplanations.length,
        totalFiles: processedFiles.length,
        processedAt: new Date().toISOString(),
        files: processedFiles
      },
      explanations: allExplanations
    };

    await fs.writeJSON(this.explanationsFile, explanationsOutput, { spaces: 2 });
    
    console.log(`\n🎉 Processing complete!`);
    console.log(`📊 Total questions extracted: ${allQuestions.length}`);
    console.log(`📝 Total explanations extracted: ${allExplanations.length}`);
    console.log(`💾 Questions saved to: ${this.questionsFile}`);
    console.log(`💾 Explanations saved to: ${this.explanationsFile}`);
    console.log(`🤖 AI training data ready!`);
  }

  async processPDF(filePath, fileName) {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    const text = data.text;
    
    console.log(`📄 Extracted ${text.length} characters from ${fileName}`);
    console.log(`🔍 First 300 characters: "${text.substring(0, 300)}"`);
    console.log(`🔍 Last 300 characters: "${text.substring(text.length - 300)}"`);
    
    // Infer cluster from filename
    const cluster = this.inferClusterFromFilename(fileName);
    console.log(`🏷️  Classified as: ${cluster} cluster`);
    
    // Extract questions and explanations
    const questions = this.extractQuestions(text, cluster, fileName);
    const explanations = this.extractExplanations(text, fileName);
    
    return { questions, explanations };
  }

  inferClusterFromFilename(fileName) {
    const lower = fileName.toLowerCase();
    
    if (lower.includes('marketing')) return 'Marketing';
    if (lower.includes('finance')) return 'Finance';
    if (lower.includes('entrepreneur')) return 'Entrepreneurship';
    if (lower.includes('hospitality')) return 'Hospitality';
    if (lower.includes('business') && lower.includes('admin')) return 'Business Administration';
    if (lower.includes('business') && lower.includes('mgmt')) return 'Business Management';
    if (lower.includes('management')) return 'Business Management';
    
    // Default to Marketing if can't determine
    return 'Marketing';
  }

  extractQuestions(text, cluster, fileName) {
    const questions = [];
    
    // Clean and normalize the text
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`🧹 Cleaned text length: ${cleanText.length}`);
    
    // Try multiple question patterns
    const patterns = [
      // Standard format: "1. Question text"
      /(\d+)\.\s*(.+?)(?=\n\s*[A-D][\.\)]\s*|\n\s*\d+\.\s*|$)/gs,
      // Alternative format: "Question 1:"
      /Question\s+(\d+):?\s*(.+?)(?=\n\s*[A-D][\.\)]\s*|\n\s*Question\s+\d+|$)/gs,
      // Number in parentheses: "(1)"
      /\((\d+)\)\s*(.+?)(?=\n\s*[A-D][\.\)]\s*|\n\s*\(\d+\)|$)/gs
    ];

    let foundQuestions = [];
    
    for (const pattern of patterns) {
      const matches = [...cleanText.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`🎯 Found ${matches.length} question matches with pattern ${pattern.source.substring(0, 50)}...`);
        foundQuestions = matches;
        break;
      }
    }

    if (foundQuestions.length === 0) {
      console.log('🔍 No questions found with standard patterns, trying alternative extraction...');
      // Try to find any numbered items
      const numberedItems = cleanText.match(/\d+[\.\)]\s*.{20,}/g);
      if (numberedItems) {
        console.log(`📝 Found ${numberedItems.length} numbered items:`, numberedItems.slice(0, 3));
      }
      return [];
    }

    // Process found questions
    for (const match of foundQuestions) {
      const questionNumber = parseInt(match[1]);
      const questionContent = match[2].trim();
      
      console.log(`\n🔍 Processing question ${questionNumber}: "${questionContent.substring(0, 100)}..."`);
      
      // Extract options for this question
      const options = this.extractOptionsForQuestion(cleanText, questionNumber, questionContent);
      
      if (this.isCompleteQuestion({ question_text: questionContent, options })) {
        const question = {
          id: `${cluster}_${fileName}_${questionNumber}`,
          cluster,
          source: fileName,
          question_text: questionContent,
          options: options,
          correct_answer: 'A', // Will be updated if answer key found
          performance_indicators: this.inferPerformanceIndicators(questionContent, cluster),
          difficulty_level: 'medium'
        };
        
        questions.push(question);
        console.log(`✅ Successfully extracted question ${questionNumber}`);
      } else {
        console.log(`⚠️  Question ${questionNumber} incomplete - missing options`);
      }
    }
    
    // Try to extract and assign answer keys
    const answerKey = this.extractAnswerKey(text);
    console.log(`🔑 Answer key found:`, answerKey);
    
    if (Object.keys(answerKey).length > 0) {
      return this.assignCorrectAnswers(questions, answerKey);
    }
    
    return questions;
  }

  extractOptionsForQuestion(text, questionNumber, questionText) {
    const options = { A: '', B: '', C: '', D: '' };
    
    // Find the section of text after this question
    const questionIndex = text.indexOf(questionText);
    if (questionIndex === -1) return options;
    
    const afterQuestion = text.substring(questionIndex + questionText.length);
    
    // Look for options in various formats
    const optionPatterns = [
      /([A-D])[\.\)]\s*(.+?)(?=\n\s*[A-D][\.\)]|\n\s*\d+[\.\)]|\n\s*Question|$)/gs,
      /\(([A-D])\)\s*(.+?)(?=\n\s*\([A-D]\)|\n\s*\d+[\.\)]|\n\s*Question|$)/gs
    ];

    for (const pattern of optionPatterns) {
      const matches = [...afterQuestion.matchAll(pattern)];
      if (matches.length >= 4) { // Need at least 4 options
        matches.slice(0, 4).forEach(match => {
          const letter = match[1];
          const text = match[2].trim();
          if (['A', 'B', 'C', 'D'].includes(letter)) {
            options[letter] = text;
          }
        });
        break;
      }
    }
    
    return options;
  }

  extractExplanations(text, fileName) {
    const explanations = [];
    
    // Look for explanation sections at the end of the document
    const explanationPatterns = [
      /(?:Answer Key|Answers?|Explanations?|Solutions?):?\s*([\s\S]*?)(?:\n\s*$|$)/i,
      /(?:Rationales?|Justifications?):?\s*([\s\S]*?)(?:\n\s*$|$)/i
    ];

    for (const pattern of explanationPatterns) {
      const match = text.match(pattern);
      if (match) {
        const explanationText = match[1];
        console.log(`📝 Found explanation section (${explanationText.length} chars)`);
        
        // Parse individual explanations
        const parsedExplanations = this.parseExplanationSection(explanationText, fileName);
        explanations.push(...parsedExplanations);
        break;
      }
    }

    // Also look for inline explanations after answers
    const inlinePattern = /(\d+)\s*[A-D]\s*[-–—]\s*(.+?)(?=\n\s*\d+\s*[A-D]|$)/gs;
    const inlineMatches = [...text.matchAll(inlinePattern)];
    
    inlineMatches.forEach(match => {
      explanations.push({
        questionNumber: parseInt(match[1]),
        explanation: match[2].trim(),
        source: fileName,
        type: 'inline'
      });
    });

    return explanations;
  }

  parseExplanationSection(explanationText, fileName) {
    const explanations = [];
    
    // Try to parse explanations in format: "1. explanation text"
    const explanationPattern = /(\d+)[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]|$)/gs;
    const matches = [...explanationText.matchAll(explanationPattern)];
    
    matches.forEach(match => {
      explanations.push({
        questionNumber: parseInt(match[1]),
        explanation: match[2].trim(),
        source: fileName,
        type: 'detailed'
      });
    });

    return explanations;
  }

  isCompleteQuestion(question) {
    return !!(
      question.question_text &&
      question.options.A &&
      question.options.B &&
      question.options.C &&
      question.options.D
    );
  }

  inferPerformanceIndicators(questionText, cluster) {
    const lowerText = questionText.toLowerCase();
    const indicators = [];
    
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

  extractAnswerKey(text) {
    const answerKey = {};
    
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

  assignCorrectAnswers(questions, answerKey) {
    return questions.map((question, index) => {
      const questionNum = index + 1;
      const correctAnswer = answerKey[questionNum];
      
      if (correctAnswer && ['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        question.correct_answer = correctAnswer;
      }
      
      return question;
    });
  }
}

// Run the processor
async function main() {
  const processor = new DECAPDFProcessor();
  await processor.processAllPDFs();
}

main().catch(console.error); 