import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Send, 
  Bot, 
  User, 
  BookOpen, 
  MessageCircle,
  Home,
  Lightbulb,
  Target,
  TrendingUp,
  LogOut
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { askGemini } from "../lib/gemini";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { findRelevantExplanations, getExplanationStats } from "../lib/tutorKnowledge";
import Avatar from "react-avatar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import ReactMarkdown from "react-markdown";

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  category?: string;
}

const EVENTS = [
  {
    name: "Marketing",
    pis: [
      "Market Segmentation",
      "Marketing Mix",
      "Brand Positioning",
      "Consumer Behavior",
      "Digital Marketing"
    ]
  },
  {
    name: "Finance",
    pis: [
      "Budgeting",
      "Financial Ratios",
      "Investment Analysis",
      "Risk Management",
      "Financial Planning"
    ]
  },
  {
    name: "Entrepreneurship",
    pis: [
      "Business Plan",
      "Opportunity Recognition",
      "Risk Management",
      "Market Research",
      "Business Model Canvas"
    ]
  },
  {
    name: "Business Management",
    pis: [
      "Leadership",
      "Strategic Planning",
      "Operations Management",
      "Human Resources",
      "Quality Control"
    ]
  }
];

const DECA_CONTEXT = `You are an AI DECA Tutor, enhanced with real DECA explanations and knowledge. You help high school students prepare for DECA competitions with accurate, detailed explanations.

Core Responsibilities:
1. Use provided DECA explanations when available to give accurate, official answers
2. Explain business concepts clearly with real-world examples
3. Help students understand Performance Indicators and their applications
4. Provide practice scenarios relevant to DECA competitions
5. Encourage critical thinking and problem-solving

Style Guidelines:
- Be encouraging and supportive
- Use clear, age-appropriate language
- Provide specific examples when possible
- Reference DECA Performance Indicators when relevant
- Ask follow-up questions to ensure understanding`;

const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hi! I'm your AI DECA tutor, now enhanced with real DECA explanations from official materials. I can help you understand business concepts, practice for competitions, and explain complex topics. What would you like to learn about today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(EVENTS[0].name);
  const [selectedPI, setSelectedPI] = useState(EVENTS[0].pis[0]);
  const [explanationStats, setExplanationStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserPic, setCurrentUserPic] = useState<string>("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load explanation statistics
    getExplanationStats().then(setExplanationStats);
  }, []);

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

  // Update PI when event changes
  useEffect(() => {
    const eventObj = EVENTS.find(e => e.name === selectedEvent);
    if (eventObj) setSelectedPI(eventObj.pis[0]);
  }, [selectedEvent]);

  const quickTopics = [
    { title: "Marketing Mix (4 Ps)", category: "Marketing", emoji: "📈" },
    { title: "Financial Ratios", category: "Finance", emoji: "💰" },
    { title: "Business Model Canvas", category: "Entrepreneurship", emoji: "🚀" },
    { title: "SWOT Analysis", category: "Strategy", emoji: "🎯" },
    { title: "Supply & Demand", category: "Economics", emoji: "📊" },
    { title: "Leadership Styles", category: "Management", emoji: "👥" }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Find relevant DECA explanations for the user's question
      const relevantExplanations = await findRelevantExplanations(inputMessage);
      
      // Build enhanced context with DECA explanations
      let enhancedContext = `${DECA_CONTEXT}\n\nEvent: ${selectedEvent}\nPerformance Indicator: ${selectedPI}`;
      
      if (relevantExplanations.length > 0) {
        enhancedContext += `\n\nRelevant DECA Explanations:\n${relevantExplanations.join('\n\n')}`;
        enhancedContext += `\n\nUse the above official DECA explanations to provide accurate, detailed responses. Reference these explanations when appropriate.`;
      }

      const aiResponse = await askGemini(inputMessage, enhancedContext);

      const aiMessage: Message = {
        id: messages.length + 2,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickTopic = (topic: string) => {
    setInputMessage(topic);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
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
              <Link to="/test">
                <Button variant="ghost">Practice Test</Button>
              </Link>
              <Link to="/full-test">
                <Button variant="ghost">Full Test</Button>
              </Link>
              <Link to="/tutor">
                <Button variant="ghost">AI Tutor</Button>
              </Link>
              <Link to="/forum">
                <Button variant="ghost">Forum</Button>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar with Quick Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6 lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" /> Quick Topics</h2>
          <div className="space-y-4">
            {quickTopics.map((topic, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-2xl">{topic.emoji}</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{topic.title}</div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{topic.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col h-[75vh] min-h-[600px]">
            <div className="flex items-center gap-3 mb-6">
              <Bot className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enhanced AI DECA Tutor</h1>
              <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200">Real DECA Knowledge</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Focus</label>
                <input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={selectedEvent} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Performance Indicator</label>
                <input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={selectedPI} readOnly />
              </div>
            </div>
            {/* Chat Messages Area */}
            <ScrollArea className="flex-1 px-2 py-2 max-h-[40vh] overflow-y-auto bg-gradient-to-b from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-lg mb-4" style={{ scrollbarWidth: 'thin' }}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200'}`}>
                      {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[85%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-3 rounded-lg shadow-sm ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700'}`}>
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 bg-white dark:bg-gray-800 sticky bottom-0 z-10">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about DECA topics, Performance Indicators, or request practice explanations..."
                  className="flex-1 text-sm bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                💡 Enhanced with {explanationStats?.totalExplanations || 0} real DECA explanations for accurate answers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
