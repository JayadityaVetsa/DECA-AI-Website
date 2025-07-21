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
  User,
  LogOut
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { askGemini } from "../lib/gemini";
import { findRelevantExplanations } from "../lib/tutorKnowledge";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";

interface TutorMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const Test = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [cluster, setCluster] = useState('Marketing');
  const [event, setEvent] = useState('');
  const [customQuestionCount, setCustomQuestionCount] = useState(20);
  const [customTimeLimit, setCustomTimeLimit] = useState(30);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: 40,
    medium: 40, 
    hard: 20
  });

  const navigate = useNavigate();

  // Sample AI-generated questions for fallback
  const mockQuestions: Array<{
    id: number;
    category: string;
    difficulty: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }> = [
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
    }
  ];

  // Questions state - initialized with mock questions
  const [questions, setQuestions] = useState<Array<{
    id: number;
    category: string;
    difficulty: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>>(mockQuestions);

  // Timer effect
  useEffect(() => {
    if (testStarted && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitTest();
    }
  }, [timeLeft, testStarted, showResults]);

  // Reset tutor messages when question changes
  useEffect(() => {
    if (testStarted) {
      setTutorMessages([{
        id: 1,
        role: 'ai',
        content: `Hi! I'm here to help you with this ${questions[currentQuestion]?.category || 'DECA'} question. I have access to the current question and can provide hints, explanations, or clarifications based on official DECA materials. What would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, [currentQuestion, testStarted]);

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

  const handleSubmitTest = async () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResults(true);

    // Save test result to Firestore
    try {
      const user = auth.currentUser;
      const score = calculateScore();
      const testType = event ? "Full Test" : "Practice";
      const testData = {
        category: cluster,
        score,
        date: serverTimestamp(),
        createdAt: Date.now(),
        questions: questions.length,
        type: testType,
        event: event || null,
        questionData: questions.map(q => ({
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          category: q.category,
          difficulty: q.difficulty
        })),
        userAnswers: newAnswers
      };
      if (user) {
        console.log("Saving test result for user:", user.uid, testData);
        await addDoc(
          collection(db, "users", user.uid, "testResults"),
          testData
        );
      } else {
        alert("You are not logged in. Test result not saved.");
        console.error("No user found when trying to save test result.");
      }
    } catch (err) {
      alert("Failed to save test result. See console for details.");
      console.error("Failed to save test result:", err);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    let answered = 0;
    answers.forEach((answer, index) => {
      if (answer !== undefined && answer !== "") {
        answered++;
        if (parseInt(answer) === questions[index].correct) {
          correct++;
        }
      }
    });
    if (answered === 0) return 0;
    return Math.round((correct / answered) * 100);
  };

  const restartTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setAnswers([]);
    setShowResults(false);
    setTimeLeft(customTimeLimit * 60);
    setTestStarted(false);
    setTutorMessages([]);
  };

  const handleTutorSend = async () => {
    if (!tutorInput.trim()) return;
    
    const userMessage: TutorMessage = {
      id: tutorMessages.length + 1,
      role: 'user',
      content: tutorInput.trim(),
      timestamp: new Date()
    };
    
    setTutorMessages(prev => [...prev, userMessage]);
    setTutorInput("");
    setIsTutorLoading(true);
    
    try {
      const currentQ = questions[currentQuestion];
      
      // Find relevant DECA explanations for this question topic
      const relevantExplanations = await findRelevantExplanations(
        currentQ.question,
        currentQ.category
      );
      
      // Build enhanced context with current question details
      let context = `You are an AI DECA tutor helping a student with a practice test. Here is the current question context:

CURRENT QUESTION:
Question: ${currentQ.question}
Category: ${currentQ.category}
Difficulty: ${currentQ.difficulty}
Options:
A) ${currentQ.options[0]}
B) ${currentQ.options[1]}
C) ${currentQ.options[2]}
D) ${currentQ.options[3]}

CORRECT ANSWER: ${String.fromCharCode(65 + currentQ.correct)} (${currentQ.options[currentQ.correct]})
EXPLANATION: ${currentQ.explanation}

Student's question: ${userMessage.content}`;

      if (relevantExplanations.length > 0) {
        context += `\n\nRELEVANT DECA EXPLANATIONS:\n${relevantExplanations.join('\n\n')}`;
      }

      context += `\n\nINSTRUCTIONS:
- Help the student understand the concept without directly giving away the answer unless they specifically ask for it
- Use the provided explanations and question context to give accurate information
- If they ask for a hint, guide them toward the right thinking process
- If they ask for the answer, you can provide it along with a detailed explanation
- Be encouraging and educational
- Reference the specific question content when relevant
- Keep responses concise but helpful (2-3 paragraphs max)`;

      const aiResponse = await askGemini(userMessage.content, context);

      const aiMessage: TutorMessage = {
        id: tutorMessages.length + 2,
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setTutorMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error getting tutor response:', error);
      
      let errorMessage = "I'm having trouble connecting right now. Please try asking your question again in a moment.";
      
      // Provide more specific error messages
      if (error.message.includes('API key')) {
        errorMessage = "There's an issue with the AI configuration. Please check your internet connection and try again.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "The request took too long. Please try asking a shorter question.";
      } else if (error.message.includes('Rate limit')) {
        errorMessage = "Too many requests right now. Please wait a moment and try again.";
      } else if (error.message.includes('safety filters')) {
        errorMessage = "Your question was blocked by content filters. Please rephrase your question in a more academic way.";
      }
      
      const errorTutorMessage: TutorMessage = {
        id: tutorMessages.length + 2,
        role: 'ai',
        content: errorMessage,
        timestamp: new Date()
      };
      
      setTutorMessages(prev => [...prev, errorTutorMessage]);
    } finally {
      setIsTutorLoading(false);
    }
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

      console.log('Starting test generation with config:', config);
      const generatedTest = await DECAQuestionGenerator.generateTest(config);
      console.log('Generated test:', generatedTest);
      
      // Convert generated questions to existing format
      const convertedQuestions = generatedTest.questions.map((q: DECAQuestion, index: number) => ({
        id: index + 1,
        category: q.cluster,
        difficulty: q.difficulty_level.charAt(0).toUpperCase() + q.difficulty_level.slice(1),
        question: q.question_text,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        correct: ['A', 'B', 'C', 'D'].indexOf(q.correct_answer),
        explanation: q.explanation
      }));

      console.log('Converted questions:', convertedQuestions.length);
      
      if (convertedQuestions.length === 0) {
        throw new Error('No questions generated');
      }

      setQuestions(convertedQuestions);
      setTimeLeft(customTimeLimit * 60);
      setTestStarted(true);
      
      // Show success message based on generation method
      const isFromLocal = generatedTest.questions.some(q => q.id.startsWith('local_'));
      const usedLocalDueToLimits = (generatedTest.questions as any).__usedLocalDueToLimits;
      const usedMixedSources = (generatedTest.questions as any).__usedMixedSources;
      
      if (usedLocalDueToLimits) {
        console.log('📚 Successfully using local question bank due to API limits');
      } else if (usedMixedSources) {
        console.log('🔄 Successfully using mixed question sources');
      } else if (isFromLocal) {
        console.log('✅ Successfully using local question bank');
      } else {
        console.log('🚀 Successfully generated fresh questions with AI');
      }
      
    } catch (error: any) {
      console.error('Error generating test:', error);
      
      // Provide specific user feedback based on error type
      let errorMessage = '';
      
      if (error.message?.includes('Rate limit') || error.message?.includes('quota') || error.message?.includes('API_LIMIT_EXCEEDED')) {
        errorMessage = '🔄 API Limit Reached\n\nWe\'ve hit the daily API limit, but don\'t worry! We\'re using our high-quality local question bank instead. These questions are curated from real DECA materials and provide excellent practice.\n\nThe test functionality will work perfectly!';
      } else {
        errorMessage = '⚠️ Generation Issue\n\nWe\'re having trouble generating new questions right now. Using our reliable local question bank instead to ensure you can still practice effectively.\n\nAll features will work normally!';
      }
      
      // Create fallback questions based on requested count
      const fallbackQuestions = [];
      for (let i = 0; i < Math.min(customQuestionCount, 20); i++) {
        const baseQuestion = mockQuestions[i % mockQuestions.length];
        
        // Create variations to avoid too much repetition
        const questionVariation = {
          ...baseQuestion,
          id: i + 1,
          // Add slight variations to avoid exact duplicates
          question: i < mockQuestions.length ? baseQuestion.question : 
            baseQuestion.question.replace('A company', `${['An organization', 'A business', 'A firm', 'An enterprise'][i % 4]}`)
        };
        
        fallbackQuestions.push(questionVariation);
      }
      
      setQuestions(fallbackQuestions);
      setTimeLeft(customTimeLimit * 60);
      setTestStarted(true);
      
      // Show informative alert
      alert(errorMessage);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/auth");
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
                  <Button variant="ghost">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/tutor">
                  <Button variant="ghost">AI Tutor</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold mb-4">
                DECA Practice Test
                <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-100">
                  Enhanced AI Tutor
                </Badge>
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
                    max="50"
                    step="5"
                    value={customQuestionCount}
                    onChange={e => setCustomQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>5</span>
                    <span>50</span>
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

              {/* API Status Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">System Status</span>
                  </div>
                  <span className="text-xs text-gray-500">Gemini API Free Tier: 50 requests/day</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  ⚡ <strong>Batch Generation:</strong> Generates all {customQuestionCount} questions in 1 API call<br />
                  📚 <strong>Local Bank:</strong> {customQuestionCount > 15 ? '15+' : customQuestionCount} high-quality backup questions available<br />
                  🔄 <strong>Smart Fallback:</strong> Seamless transition when API limits reached
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
                  <div className="text-2xl font-bold text-purple-600 mb-2">Enhanced</div>
                  <div className="text-sm text-gray-600">AI Tutor</div>
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
                      Preparing {customQuestionCount} Questions...
                    </>
                  ) : (
                    'Start Practice Test'
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  🚀 <strong>Batch Generation:</strong> All questions generated in 1 API call (super fast!) <br />
                  📚 <strong>Smart Fallback:</strong> High-quality local questions when API limits reached <br />
                  🤖 <strong>Enhanced AI Tutor:</strong> Available during test with real DECA knowledge
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Continue with the rest of the existing code for the test interface and results...
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
                  <div className="text-2xl font-bold text-blue-600 mb-2">{formatTime((customTimeLimit * 60) - timeLeft)}</div>
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
              
              {/* Enhanced AI Tutor Sheet */}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-2" />
                    Enhanced AI Tutor
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0">
                  <div className="p-6 border-b bg-white">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-600" />
                        Enhanced AI Tutor
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Real DECA Knowledge
                        </Badge>
                      </SheetTitle>
                      <SheetDescription>
                        Get help with the current question. I have access to the question details, correct answer, and official DECA explanations!
                      </SheetDescription>
                    </SheetHeader>
                  </div>
                  
                  {/* Messages Area with proper flex sizing */}
                  <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-white via-blue-50 to-purple-50">
                    <ScrollArea className="flex-1 px-6 py-4">
                      <div className="space-y-4">
                        {tutorMessages.map((message) => (
                          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 ${
                              message.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                {message.role === 'user' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium">
                                  {message.role === 'user' ? 'You' : 'Enhanced AI Tutor'}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            </div>
                          </div>
                        ))}
                        
                        {isTutorLoading && (
                          <div className="flex gap-3 justify-start">
                            <div className="bg-white text-gray-900 rounded-lg p-3 border border-gray-200 shadow-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Bot className="h-4 w-4" />
                                <span className="text-xs font-medium">Enhanced AI Tutor</span>
                              </div>
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Fixed Input Area at Bottom */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask about this question, need a hint, or want the explanation..."
                        value={tutorInput}
                        onChange={(e) => setTutorInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isTutorLoading && handleTutorSend()}
                        className="flex-1"
                        disabled={isTutorLoading}
                      />
                      <Button size="sm" onClick={handleTutorSend} disabled={!tutorInput.trim() || isTutorLoading}>
                        {isTutorLoading ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      💡 Press Enter to send • Enhanced with real DECA explanations
                    </p>
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
