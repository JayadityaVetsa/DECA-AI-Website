
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
  MessageCircle,
  AlertTriangle,
  Bot
} from "lucide-react";
import { Link } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import Avatar from "react-avatar";

const FullTest = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserPic, setCurrentUserPic] = useState<string>("");
  const [showTutor, setShowTutor] = useState(false);

  // Sample AI-generated questions (same as practice test)
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUserPic(userDoc.data().profilePicUrl || "");
        }
      } else {
        setCurrentUser(null);
        setCurrentUserPic("");
      }
    });
    return () => unsubscribe();
  }, []);

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
      if (user) {
        const score = calculateScore();
        await addDoc(
          collection(db, "users", user.uid, "testResults"),
          {
            category: "Full Test",
            score,
            date: serverTimestamp(),
            createdAt: Date.now(),
            questions: questions.length,
            type: "Full Test",
            questionData: questions.map(q => ({
              question: q.question,
              options: q.options,
              correct: q.correct,
              explanation: q.explanation
            })),
            userAnswers: newAnswers
          }
        );
      }
    } catch (err) {
      // Optionally handle error (e.g., show toast)
      console.error("Failed to save full test result:", err);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors">
        {/* Navigation */}
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
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
                {/* Profile Avatar */}
                <Link to="/profile">
                  {currentUserPic ? (
                    <img
                      src={currentUserPic}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-300 shadow"
                    />
                  ) : currentUser ? (
                    <Avatar name={currentUser.displayName || currentUser.email || "User"} size="36" round={true} />
                  ) : null}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold mb-4 text-red-600">
                DECA Full Test (No AI Assistance)
              </CardTitle>
              <CardDescription className="text-lg">
                Experience a real test environment without any AI help or hints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-2">5</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-2">30</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 mb-2">No AI</div>
                  <div className="text-sm text-gray-600">Full Focus</div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Full Test Mode:</h3>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• No AI tutor assistance available during the test</li>
                  <li>• Simulates real DECA testing conditions</li>
                  <li>• Once submitted, you cannot retake with the same questions</li>
                  <li>• Focus on demonstrating your true knowledge</li>
                  <li>• Results show explanations only after completion</li>
                </ul>
              </div>

              <div className="text-center pt-4 space-y-4">
                <Button 
                  size="lg" 
                  className="px-12 py-6 text-lg bg-red-600 hover:bg-red-700"
                  onClick={() => setTestStarted(true)}
                >
                  Start Full Test
                </Button>
                <div className="text-sm text-gray-600">
                  Need practice first? Try the{" "}
                  <Link to="/test" className="text-blue-600 hover:underline">
                    Practice Test (with AI Tutor)
                  </Link>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    );
  }

  // Results section (same as practice test but with different styling)
  if (showResults) {
    const score = calculateScore();
    const correctAnswers = answers.filter((answer, index) => 
      parseInt(answer) === questions[index].correct
    ).length;
    const incorrectAnswers = questions.length - correctAnswers;
    const timeTaken = 1800 - timeLeft;

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Score Summary */}
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-10">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <div className="text-5xl font-bold text-green-600 dark:text-green-300 mb-2">{correctAnswers}</div>
              <div className="text-lg text-gray-700 dark:text-gray-200">Correct</div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <div className="text-5xl font-bold text-red-600 dark:text-red-300 mb-2">{incorrectAnswers}</div>
              <div className="text-lg text-gray-700 dark:text-gray-200">Incorrect</div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-300 mb-2">{formatTime(timeTaken)}</div>
              <div className="text-lg text-gray-700 dark:text-gray-200">Time Taken</div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <div className={`text-5xl font-bold mb-2 ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{score}%</div>
              <div className="text-lg text-gray-700 dark:text-gray-200">Final Score</div>
            </div>
          </div>

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
            <Link to="/test">
              <Button size="lg" className="px-8">
                <MessageCircle className="h-4 w-4 mr-2" />
                Try Practice Mode
              </Button>
            </Link>
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

  if (testStarted && !showResults) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors flex flex-col">
        {/* Top Bar */}
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-7 w-7 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">DECA AI Platform</span>
          </div>
          <div className="text-lg font-mono text-gray-700 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5" /> {formatTime(timeLeft)}
          </div>
        </nav>
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full py-8 px-4 gap-8">
          {/* Main Test Card */}
          <div className="flex-1 flex flex-col items-center relative">
            {/* Floating AI Tutor Button */}
            <button
              className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-lg font-semibold"
              onClick={() => setShowTutor(true)}
              style={{ display: showTutor ? 'none' : 'flex' }}
            >
              <Bot className="h-5 w-5" /> Ask AI Tutor
            </button>
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Marketing</Badge>
                <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Intermediate</Badge>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">A company wants to launch a new eco-friendly product line. Which market segmentation strategy would be most effective for targeting environmentally conscious consumers?</h2>
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedAnswer("0")}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-colors font-medium text-lg
                    ${selectedAnswer === "0" ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-900 dark:hover:text-white'}
                  `}
                >
                  <span className="font-bold mr-2">A.</span> Geographic segmentation based on urban vs. rural areas
                </button>
                <button
                  onClick={() => setSelectedAnswer("1")}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-colors font-medium text-lg
                    ${selectedAnswer === "1" ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-900 dark:hover:text-white'}
                  `}
                >
                  <span className="font-bold mr-2">B.</span> Psychographic segmentation based on lifestyle and values
                </button>
                <button
                  onClick={() => setSelectedAnswer("2")}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-colors font-medium text-lg
                    ${selectedAnswer === "2" ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-900 dark:hover:text-white'}
                  `}
                >
                  <span className="font-bold mr-2">C.</span> Demographic segmentation based on age groups
                </button>
                <button
                  onClick={() => setSelectedAnswer("3")}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-colors font-medium text-lg
                    ${selectedAnswer === "3" ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-900 dark:hover:text-white'}
                  `}
                >
                  <span className="font-bold mr-2">D.</span> Behavioral segmentation based on purchase frequency
                </button>
              </div>
            </div>
            {/* Pagination & Navigation */}
            <div className="flex items-center justify-between w-full max-w-2xl mt-2">
              <Button onClick={handlePreviousQuestion} disabled={currentQuestion === 0} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-2 mr-2 disabled:opacity-50">Previous</Button>
              <div className="flex gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold border transition-colors
                      ${currentQuestion === idx ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-900 dark:hover:text-white'}
                    `}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <Button onClick={handleNextQuestion} disabled={currentQuestion === questions.length - 1} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-2 ml-2 disabled:opacity-50">Next</Button>
            </div>
            <div className="w-full max-w-2xl flex justify-end mt-8">
              <Button onClick={handleSubmitTest} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-md text-lg">Submit Test</Button>
            </div>
          </div>
          {/* AI Tutor Sidebar (slide-in/modal style) */}
          {showTutor && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40 dark:bg-black/60">
              <div className="w-full max-w-md h-full bg-gray-100 dark:bg-gray-900 rounded-l-2xl shadow-2xl flex flex-col p-6 relative animate-slide-in-right">
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl"
                  onClick={() => setShowTutor(false)}
                  aria-label="Close AI Tutor"
                >
                  ×
                </button>
                {/* Chat messages and input area (reuse Tutor chat logic/styles) */}
                {/* ...chat logic here... */}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DECA AI Platform
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-red-600">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
              <Button variant="outline" onClick={handleSubmitTest} className="border-red-200 text-red-600 hover:bg-red-50">
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
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                  No AI Help
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
                    ? 'bg-red-600 text-white'
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
            className="px-8 bg-red-600 hover:bg-red-700"
          >
            {currentQuestion === questions.length - 1 ? 'Submit Test' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FullTest;
