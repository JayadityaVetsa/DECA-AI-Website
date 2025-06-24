
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Home,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const Test = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [testStarted, setTestStarted] = useState(false);

  // Sample AI-generated questions
  const questions = [
    {
      id: 1,
      category: "Marketing",
      difficulty: "Intermediate",
      question: "A company wants to launch a new eco-friendly product line. Which market segmentation strategy would be most effective for targeting environmentally conscious consumers?",
      options: [
        "Geographic segmentation based on urban vs. rural areas",
        "Psychographic segmentation based on lifestyle and values",
        "Demographic segmentation based on age groups",
        "Behavioral segmentation based on purchase frequency"
      ],
      correct: 1,
      explanation: "Psychographic segmentation focuses on lifestyle, values, and attitudes, making it ideal for targeting environmentally conscious consumers who share similar values about sustainability."
    },
    {
      id: 2,
      category: "Finance",
      difficulty: "Advanced",
      question: "If a company has a current ratio of 2.5, a quick ratio of 1.8, and an inventory turnover of 6 times per year, what can you conclude about the company's liquidity?",
      options: [
        "The company has poor liquidity due to low inventory turnover",
        "The company has excellent liquidity with efficient inventory management",
        "The company has adequate liquidity but may have excess inventory",
        "The company has insufficient data to determine liquidity status"
      ],
      correct: 2,
      explanation: "A current ratio of 2.5 and quick ratio of 1.8 indicate good liquidity. The difference suggests some inventory, but with 6 inventory turnovers per year (above average), there may still be room for improvement in inventory management."
    },
    {
      id: 3,
      category: "Entrepreneurship",
      difficulty: "Beginner",
      question: "What is the primary purpose of a business model canvas?",
      options: [
        "To create detailed financial projections",
        "To visualize and develop business models on a single page",
        "To conduct competitive analysis",
        "To plan marketing campaigns"
      ],
      correct: 1,
      explanation: "The business model canvas is a strategic management tool that allows entrepreneurs to visualize, design, and pivot their business model on a single page, making it easier to understand and communicate."
    },
    {
      id: 4,
      category: "Marketing",
      difficulty: "Advanced",
      question: "A luxury brand notices declining sales among Gen Z consumers despite strong performance with millennials. Which strategy would be most effective?",
      options: [
        "Reduce prices to match competitor offerings",
        "Increase traditional advertising spend",
        "Partner with Gen Z influencers and focus on social impact",
        "Maintain current strategy as Gen Z will eventually appreciate luxury"
      ],
      correct: 2,
      explanation: "Gen Z values authenticity, social impact, and peer recommendations. Partnering with relevant influencers and highlighting social responsibility aligns with their values and purchasing behaviors."
    },
    {
      id: 5,
      category: "Business Law",
      difficulty: "Intermediate",
      question: "Which type of business entity provides limited liability protection while allowing profits and losses to pass through to owners' personal tax returns?",
      options: [
        "C Corporation",
        "Sole Proprietorship", 
        "Limited Liability Company (LLC)",
        "General Partnership"
      ],
      correct: 2,
      explanation: "An LLC provides limited liability protection (protecting personal assets) while maintaining pass-through taxation, where profits and losses are reported on owners' personal tax returns, avoiding double taxation."
    }
  ];

  // Timer effect
  useEffect(() => {
    if (testStarted && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitTest();
    }
  }, [timeLeft, testStarted, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNextQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1] || "");
    } else {
      handleSubmitTest();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer;
      setAnswers(newAnswers);
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || "");
    }
  };

  const handleSubmitTest = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (parseInt(answer) === questions[index].correct) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const restartTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setAnswers([]);
    setShowResults(false);
    setTimeLeft(1800);
    setTestStarted(false);
  };

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DECA AI Platform
                </span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link to="/tutor">
                  <Button variant="ghost">AI Tutor</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold mb-4">
                DECA Practice Test
              </CardTitle>
              <CardDescription className="text-lg">
                Test your knowledge with AI-generated questions across all DECA categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">5</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">30</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">Mixed</div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• You have 30 minutes to complete 5 questions</li>
                  <li>• Questions cover Marketing, Finance, Entrepreneurship, and Business Law</li>
                  <li>• You can navigate between questions and change answers</li>
                  <li>• Your progress is automatically saved</li>
                  <li>• Detailed explanations will be provided after submission</li>
                </ul>
              </div>

              <div className="text-center pt-4">
                <Button 
                  size="lg" 
                  className="px-12 py-6 text-lg"
                  onClick={() => setTestStarted(true)}
                >
                  Start Practice Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const correctAnswers = answers.filter((answer, index) => 
      parseInt(answer) === questions[index].correct
    ).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DECA AI Platform
                </span>
              </Link>
              <div className="flex items-center space-x-4">
                <Button onClick={restartTest} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Test
                </Button>
                <Link to="/dashboard">
                  <Button variant="ghost">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Score Summary */}
          <Card className="border-0 shadow-xl mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold mb-2">
                Test Complete! 🎉
              </CardTitle>
              <div className="text-6xl font-bold mb-4">
                <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                  {score}%
                </span>
              </div>
              <CardDescription className="text-lg">
                You got {correctAnswers} out of {questions.length} questions correct
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">{correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-2">{questions.length - correctAnswers}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{formatTime(1800 - timeLeft)}</div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Review</h2>
            {questions.map((question, index) => {
              const userAnswer = parseInt(answers[index]);
              const isCorrect = userAnswer === question.correct;
              
              return (
                <Card key={question.id} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{question.category}</Badge>
                        <Badge variant={question.difficulty === 'Beginner' ? 'secondary' : 
                                      question.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                          {question.difficulty}
                        </Badge>
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-500">Question {index + 1}</span>
                    </div>
                    <CardTitle className="text-lg font-semibold leading-relaxed">
                      {question.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex;
                        const isCorrectAnswer = question.correct === optionIndex;
                        
                        return (
                          <div 
                            key={optionIndex}
                            className={`p-3 rounded-lg border ${
                              isCorrectAnswer 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : isUserAnswer 
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option}</span>
                              {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />}
                              {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600 ml-auto" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
                      <p className="text-blue-700">{question.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button onClick={restartTest} size="lg" className="px-8">
              <RotateCcw className="h-4 w-4 mr-2" />
              Take Another Test
            </Button>
            <Link to="/tutor">
              <Button variant="outline" size="lg" className="px-8">
                <MessageCircle className="h-4 w-4 mr-2" />
                Get AI Tutoring
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="px-8">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DECA AI Platform
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
              <Button variant="outline" onClick={handleSubmitTest}>
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{questions[currentQuestion].category}</Badge>
                <Badge variant={
                  questions[currentQuestion].difficulty === 'Beginner' ? 'secondary' : 
                  questions[currentQuestion].difficulty === 'Intermediate' ? 'default' : 'destructive'
                }>
                  {questions[currentQuestion].difficulty}
                </Badge>
              </div>
              <span className="text-sm text-gray-500">Question {currentQuestion + 1}</span>
            </div>
            <CardTitle className="text-xl font-semibold leading-relaxed">
              {questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer text-base leading-relaxed"
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index]
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <Button 
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className="px-8"
          >
            {currentQuestion === questions.length - 1 ? 'Submit Test' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Test;
