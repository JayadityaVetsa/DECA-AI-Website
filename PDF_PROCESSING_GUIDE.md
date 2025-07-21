# 📚 DECA PDF Question Processing System

## 🎯 Overview

This system allows you to process DECA question PDFs to train the AI question generator. Instead of uploading PDFs through the website, you add them directly to the codebase and run a processing script.

## 🚀 How to Use

### 1. Add PDF Files
- Place your DECA question PDFs in the `question-pdfs/` folder
- Name them descriptively (e.g., `marketing-2023.pdf`, `finance-state-questions.pdf`)

### 2. Run Processing Script
```bash
npm run process-pdfs
```

### 3. Questions Automatically Train AI
- Questions are extracted and saved to `src/data/extractedQuestions.json`
- AI question generator automatically uses these for training examples
- Better question quality and DECA formatting

## 📁 Folder Structure

```
deca-ai-prep-doc/
├── question-pdfs/          # 📎 Put your PDF files here
│   ├── README.md
│   ├── marketing-2023.pdf  # Example
│   └── finance-state.pdf   # Example
├── scripts/
│   └── processPDFs.cjs     # 🔧 Processing script
└── src/
    └── data/
        └── extractedQuestions.json  # 💾 Generated questions
```

## 🏷️ File Naming Convention

Include keywords in PDF filenames to help with automatic categorization:

- `marketing-*.pdf` → Marketing cluster
- `finance-*.pdf` → Finance cluster  
- `entrepreneurship-*.pdf` → Entrepreneurship cluster
- `hospitality-*.pdf` → Hospitality cluster
- `business-admin-*.pdf` → Business Administration cluster
- `business-mgmt-*.pdf` → Business Management cluster

## 📝 Supported PDF Format

The processor works best with PDFs containing:

```
1. What is the primary purpose of market research?
A. To increase sales immediately
B. To understand customer needs and preferences
C. To reduce production costs
D. To eliminate competition

2. Which marketing strategy focuses on...
A. Option A text
B. Option B text
C. Option C text
D. Option D text

Answer Key: 1B 2A 3C 4D
```

## 🔧 Processing Features

- **Automatic Question Extraction**: Finds numbered questions with A-D options
- **Answer Key Detection**: Extracts correct answers when available
- **Performance Indicator Inference**: Smart keyword matching to categorize questions
- **Cluster Classification**: Determines DECA cluster from filename
- **Error Handling**: Continues processing even if some PDFs have issues

## 🤖 AI Training Integration

Once processed, the extracted questions are used to:

1. **Improve Question Generation**: AI learns from real DECA question patterns
2. **Maintain Formatting Standards**: Ensures generated questions match official style
3. **Enhance Business Scenarios**: Uses realistic contexts from actual questions
4. **Better Answer Explanations**: Learns from official question complexity

## 📊 Example Output

After processing, you'll see:

```bash
🚀 Starting PDF processing...
📚 Found 3 PDF files to process

📖 Processing: marketing-2023.pdf
✅ Extracted 25 questions from marketing-2023.pdf

📖 Processing: finance-state.pdf  
✅ Extracted 30 questions from finance-state.pdf

🎉 Processing complete!
📊 Total questions extracted: 55
💾 Questions saved to: src/data/extractedQuestions.json
🤖 AI training data ready!
```

## 🔄 Workflow

1. **Add PDFs** → Place files in `question-pdfs/`
2. **Process** → Run `npm run process-pdfs`
3. **Train AI** → Questions automatically improve AI generation
4. **Generate Tests** → AI creates better quality practice questions
5. **Repeat** → Add more PDFs anytime to improve further

## 🌐 Website Integration

The processed questions are automatically loaded by:
- **Practice Tests** → AI generates questions using extracted examples
- **AI Tutor** → Better context and explanations
- **All Features** → Improved DECA formatting and scenarios

No need to manually upload through the website - everything happens behind the scenes!

## 🔍 Troubleshooting

### No Questions Found
- Check PDF text is readable (not scanned images)
- Ensure questions follow numbered format (1., 2., 3.)
- Verify options use A., B., C., D. format

### Processing Errors
- Check console output for specific error messages
- Ensure PDF files are not corrupted
- Try processing one file at a time to isolate issues

### AI Not Using New Questions
- Restart the development server after processing
- Check `src/data/extractedQuestions.json` has content
- Clear browser cache if questions seem unchanged

## 🎓 Best Practices

1. **Quality PDFs**: Use clear, text-based PDFs (not low-quality scans)
2. **Descriptive Names**: Include cluster and year in filenames
3. **Regular Processing**: Add new PDFs and reprocess periodically
4. **Test Generation**: Try generating questions after adding new PDFs to see improvements

The more quality DECA questions you process, the better the AI becomes at generating realistic practice questions! 