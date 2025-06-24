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

const DECA_CONTEXT = `You are a DECA competition tutor. Answer questions using official DECA performance indicators and event knowledge. Be concise, clear, and helpful for high school students. If the question is about a specific event, use relevant terminology.`;

const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hi there! I'm your AI DECA tutor. I'm here to help you master business concepts, practice problem-solving, and prepare for competitions. What would you like to learn about today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(EVENTS[0].name);
  const [selectedPI, setSelectedPI] = useState(EVENTS[0].pis[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Add event/PI context to the question
      const context = `${DECA_CONTEXT}\n\nEvent: ${selectedEvent}\nPerformance Indicator: ${selectedPI}`;
      const aiResponse = await askGemini(inputMessage, context);

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
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/test">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Practice Test
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar with Quick Topics */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Quick Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-left hover:bg-blue-50 transition-colors"
                    onClick={() => handleQuickTopic(topic.title)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{topic.emoji}</span>
                      <div>
                        <div className="font-medium text-sm">{topic.title}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {topic.category}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Practice with real business scenarios daily</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Ask specific questions to get detailed explanations</span>
                </div>
                <div className="flex items-start space-x-2">
                  <BookOpen className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Connect concepts to current business events</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col h-[75vh] lg:h-[80vh] min-h-[600px]">
            <Card className="border-0 shadow-xl flex flex-col h-full">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Bot className="h-6 w-6 text-blue-600" />
                    AI DECA Tutor
                    <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">Always Available</Badge>
                  </CardTitle>
                </div>
                
                {/* Focus Area integrated into header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Focus</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={selectedEvent}
                      onChange={e => setSelectedEvent(e.target.value)}
                      disabled={isTyping}
                    >
                      {EVENTS.map(ev => (
                        <option key={ev.name} value={ev.name}>{ev.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Performance Indicator</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={selectedPI}
                      onChange={e => setSelectedPI(e.target.value)}
                      disabled={isTyping}
                    >
                      {EVENTS.find(ev => ev.name === selectedEvent)?.pis.map(pi => (
                        <option key={pi} value={pi}>{pi}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0 bg-gradient-to-b from-white via-blue-50 to-purple-50">
                <ScrollArea className="h-full p-4" style={{ scrollbarWidth: 'thin' }}>
                  <div className="space-y-4 pr-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {message.sender === 'user' ? 
                            <User className="h-4 w-4" /> : 
                            <Bot className="h-4 w-4" />
                          }
                        </div>
                        <div className={`max-w-[85%] ${
                          message.sender === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block p-3 rounded-lg shadow-sm ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}>
                            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1 text-right">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
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
              </CardContent>

              {/* Input Area (always visible) */}
              <div className="border-t p-4 bg-white sticky bottom-0 z-10">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about DECA topics, request practice questions, or get study help..."
                    className="flex-1 text-sm"
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
                <div className="text-xs text-gray-500 mt-2 text-center">
                  💡 Try asking: "Explain the marketing mix" or "Give me a practice question about finance"
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
