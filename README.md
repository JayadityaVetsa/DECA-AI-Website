# DECA AI Prep

A comprehensive AI-powered preparation platform for DECA competitions, featuring practice tests, intelligent tutoring, and performance analytics.

## Features

- **Practice Tests**: Take full-length practice exams with real DECA questions
- **AI Tutor**: Get personalized explanations and help with specific topics
- **Performance Analytics**: Track your progress and identify areas for improvement
- **Study Materials**: Access curated study resources and performance indicators
- **Community Forum**: Connect with other DECA students and share knowledge

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd deca-ai-prep-doc

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run process-pdfs` - Process PDF question files

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **AI Integration**: Google Gemini API
- **PDF Processing**: PDF.js

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── lib/                # Utility functions and services
├── hooks/              # Custom React hooks
└── data/               # Static data and extracted content
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.