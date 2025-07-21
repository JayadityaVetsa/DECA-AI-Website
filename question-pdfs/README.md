# DECA Question PDFs

## 📁 How to Use This Folder

1. **Add your DECA question PDFs here**
   - Copy any PDF files containing DECA practice questions into this folder
   - Name them descriptively (e.g., `marketing-2023.pdf`, `finance-questions.pdf`)

2. **Run the processing script**
   ```bash
   npm run process-pdfs
   ```

3. **Questions are automatically extracted**
   - The script will read all PDFs in this folder
   - Extract questions and answers
   - Save them to `src/data/extractedQuestions.json`
   - Use them to train the AI question generator

## 📝 Supported PDF Formats

The processor works best with PDFs that have:
- Numbered questions (1., 2., 3., etc.)
- Multiple choice options (A., B., C., D.)
- Answer keys (when available)

Example format:
```
1. What is the primary purpose of market research?
A. To increase sales immediately
B. To understand customer needs and preferences  
C. To reduce production costs
D. To eliminate competition

2. Which of the following best describes...
A. Option A
B. Option B
C. Option C
D. Option D
```

## 🏷️ File Naming

Include keywords in filenames to help categorize questions:
- `marketing-*.pdf` → Marketing cluster
- `finance-*.pdf` → Finance cluster
- `entrepreneurship-*.pdf` → Entrepreneurship cluster
- `hospitality-*.pdf` → Hospitality cluster
- `business-admin-*.pdf` → Business Administration cluster
- `business-mgmt-*.pdf` → Business Management cluster

## 🚀 After Processing

Once processed, the questions will be automatically used by the AI to:
- Generate better practice questions
- Maintain DECA formatting standards
- Provide more realistic question scenarios
- Improve answer explanations

The extracted questions are stored in `src/data/extractedQuestions.json` and loaded automatically by the application. 