import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Home,
  MessageCircle,
  Send,
  Bot,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DECAQuestionGenerator, TestConfiguration, DECAQuestion } from "../lib/questionGenerator";
import { DECA_EVENTS_DATABASE, PIManager } from "../lib/performanceIndicators";

const Test = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [cluster, setCluster] = useState('Marketing');
  const [event, setEvent] = useState('');
  const [customQuestionCount, setCustomQuestionCount] = useState(20);
  const [customTimeLimit, setCustomTimeLimit] = useState(30);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: 40,
    medium: 40, 
    hard: 20
  });

  // Sample AI-generated questions for fallback
  const mockQuestions = [
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

  // Questions state - initialized with mock questions
  const [questions, setQuestions] = useState(mockQuestions);

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
    setTutorMessages([]);
  };

  const handleTutorSend = () => {
    if (!tutorInput.trim()) return;
    
    const userMessage = tutorInput.trim();
    setTutorMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setTutorInput("");
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const currentQ = questions[currentQuestion];
      let aiResponse = "";
      
      if (userMessage.toLowerCase().includes('hint')) {
        aiResponse = `Here's a hint for this ${currentQ.category} question: Think about what type of segmentation focuses on personal values and lifestyle choices. The key is understanding what motivates environmentally conscious consumers.`;
      } else if (userMessage.toLowerCase().includes('explain')) {
        aiResponse = `This question is testing your knowledge of market segmentation in ${currentQ.category}. The different types of segmentation are: Geographic (location), Demographic (age, income), Psychographic (lifestyle, values), and Behavioral (purchase patterns). Which one would best reach people who care about the environment?`;
      } else {
        aiResponse = `I can help you with this ${currentQ.category} question! Try thinking about what drives environmentally conscious consumers - is it where they live, how old they are, what they value, or how often they buy? Feel free to ask for a hint or explanation of the concepts!`;
      }
      
      setTutorMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    }, 1000);
  };

  const handleStartTest = async () => {
    setIsGeneratingQuestions(true);
    
    try {
      const config: TestConfiguration = {
        test_type: 'practice',
        cluster,
        event: event || undefined,
        question_count: customQuestionCount,
        time_limit_minutes: customTimeLimit,
        difficulty_distribution: {
          easy: difficultyDistribution.easy / 100,
          medium: difficultyDistribution.medium / 100,
          hard: difficultyDistribution.hard / 100
        }
      };

      const generatedTest = await DECAQuestionGenerator.generateTest(config);
      
      // Convert generated questions to existing format
      const convertedQuestions = generatedTest.questions.map((q: DECAQuestion) => ({
        id: parseInt(q.id.split('_')[1]) || Math.floor(Math.random() * 10000), // Convert string id to number
        category: q.cluster,
        difficulty: q.difficulty_level.charAt(0).toUpperCase() + q.difficulty_level.slice(1),
        question: q.question_text,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        correct: ['A', 'B', 'C', 'D'].indexOf(q.correct_answer),
        explanation: q.explanation
      }));

      setQuestions(convertedQuestions);
      setTimeLeft(customTimeLimit * 60);
      setTestStarted(true);
    } catch (error) {
      console.error('Error generating test:', error);
      // Fallback to mock questions if generation fails
      setQuestions(mockQuestions);
      setTimeLeft(customTimeLimit * 60);
      setTestStarted(true);
    } finally {
      setIsGeneratingQuestions(false);
    }
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold mb-4">
                DECA Practice Test (with AI Tutor)
              </CardTitle>
              <CardDescription className="text-lg">
                Customize your test with AI-generated questions based on DECA Performance Indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Cluster & Event Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DECA Cluster
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={cluster}
                    onChange={e => {
                      setCluster(e.target.value);
                      setEvent(''); // Reset event when cluster changes
                    }}
                  >
                    {PIManager.getAllClusters().map(clusterName => (
                      <option key={clusterName} value={clusterName}>{clusterName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Event (Optional)
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={event}
                    onChange={e => setEvent(e.target.value)}
                  >
                    <option value="">All Events in Cluster</option>
                    {PIManager.getClusterEvents(cluster).map(eventName => (
                      <option key={eventName} value={eventName}>{eventName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Test Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions: {customQuestionCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={customQuestionCount}
                    onChange={e => setCustomQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>5</span>
                    <span>100</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit: {customTimeLimit} minutes
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={customTimeLimit}
                    onChange={e => setCustomTimeLimit(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>10 min</span>
                    <span>120 min</span>
                  </div>
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Difficulty Distribution
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <label className="block text-sm text-gray-600 mb-2">Easy: {difficultyDistribution.easy}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={difficultyDistribution.easy}
                      onChange={e => {
                        const easy = parseInt(e.target.value);
                        const remaining = 100 - easy;
                        const medium = Math.min(difficultyDistribution.medium, remaining);
                        const hard = remaining - medium;
                        setDifficultyDistribution({ easy, medium, hard });
                      }}
                      className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-sm text-gray-600 mb-2">Medium: {difficultyDistribution.medium}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={difficultyDistribution.medium}
                      onChange={e => {
                        const medium = parseInt(e.target.value);
                        const remaining = 100 - medium;
                        const easy = Math.min(difficultyDistribution.easy, remaining);
                        const hard = remaining - easy;
                        setDifficultyDistribution({ easy, medium, hard });
                      }}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-sm text-gray-600 mb-2">Hard: {difficultyDistribution.hard}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={difficultyDistribution.hard}
                      onChange={e => {
                        const hard = parseInt(e.target.value);
                        const remaining = 100 - hard;
                        const easy = Math.min(difficultyDistribution.easy, remaining);
                        const medium = remaining - easy;
                        setDifficultyDistribution({ easy, medium, hard });
                      }}
                      className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Test Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{customQuestionCount}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">{customTimeLimit}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">AI Tutor</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center">
                <Button 
                  onClick={handleStartTest} 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  disabled={isGeneratingQuestions}
                >
                  {isGeneratingQuestions ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Questions...
                    </>
                  ) : (
                    'Start Practice Test'
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Questions will be generated using AI based on DECA Performance Indicators
                </p>
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
              
              {/* AI Tutor Sheet */}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-2" />
                    AI Tutor
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      AI Tutor Assistant
                    </SheetTitle>
                    <SheetDescription>
                      Get help with the current question. Ask for hints, explanations, or clarifications!
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex flex-col h-[calc(100vh-120px)] mt-6">
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-4">
                        {tutorMessages.length === 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800 text-sm">
                              👋 Hi! I'm here to help you with this {questions[currentQuestion]?.category} question. 
                              You can ask me for:
                            </p>
                            <ul className="text-blue-700 text-sm mt-2 space-y-1">
                              <li>• Hints about the question</li>
                              <li>• Explanations of concepts</li>
                              <li>• Clarification of terms</li>
                            </ul>
                          </div>
                        )}
                        
                        {tutorMessages.map((message, index) => (
                          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                {message.role === 'user' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium">
                                  {message.role === 'user' ? 'You' : 'AI Tutor'}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Ask for help with this question..."
                        value={tutorInput}
                        onChange={(e) => setTutorInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTutorSend()}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleTutorSend} disabled={!tutorInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
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
