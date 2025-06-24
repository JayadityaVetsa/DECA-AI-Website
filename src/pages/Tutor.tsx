
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  category?: string;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickTopics = [
    { title: "Marketing Mix (4 Ps)", category: "Marketing", emoji: "📈" },
    { title: "Financial Ratios", category: "Finance", emoji: "💰" },
    { title: "Business Model Canvas", category: "Entrepreneurship", emoji: "🚀" },
    { title: "SWOT Analysis", category: "Strategy", emoji: "🎯" },
    { title: "Supply & Demand", category: "Economics", emoji: "📊" },
    { title: "Leadership Styles", category: "Management", emoji: "👥" }
  ];

  const sampleResponses: { [key: string]: string } = {
    "marketing mix": "Great question about the Marketing Mix! The 4 Ps are:\n\n🎯 **Product**: What you're selling (goods/services, features, quality, branding)\n💰 **Price**: How much you charge (pricing strategy, discounts, payment terms)\n📍 **Place**: Where and how you sell (distribution channels, locations, logistics)\n📢 **Promotion**: How you communicate value (advertising, PR, sales promotion, digital marketing)\n\nThese work together to create your marketing strategy. Which P would you like to explore deeper?",
    "financial ratios": "Financial ratios are key tools for analyzing business performance! Here are the main categories:\n\n📊 **Liquidity Ratios** (Can you pay short-term debts?)\n• Current Ratio = Current Assets ÷ Current Liabilities\n• Quick Ratio = (Current Assets - Inventory) ÷ Current Liabilities\n\n💪 **Profitability Ratios** (How profitable are you?)\n• Gross Profit Margin = (Revenue - COGS) ÷ Revenue\n• Net Profit Margin = Net Income ÷ Revenue\n\n⚡ **Efficiency Ratios** (How well do you use assets?)\n• Inventory Turnover = COGS ÷ Average Inventory\n• Asset Turnover = Revenue ÷ Total Assets\n\nWant me to walk through an example calculation?",
    "business model canvas": "The Business Model Canvas is a powerful one-page tool for designing and analyzing business models! It has 9 key building blocks:\n\n👥 **Customer Segments**: Who are your target customers?\n💝 **Value Propositions**: What unique value do you offer?\n📢 **Channels**: How do you reach customers?\n🤝 **Customer Relationships**: How do you interact with customers?\n💰 **Revenue Streams**: How do you make money?\n🔑 **Key Resources**: What assets do you need?\n⚡ **Key Activities**: What key things must you do?\n🤝 **Key Partnerships**: Who are your strategic partners?\n💸 **Cost Structure**: What are your main costs?\n\nWould you like me to help you fill out a canvas for a specific business idea?",
    "swot analysis": "SWOT Analysis is a strategic planning tool that evaluates four key areas:\n\n💪 **Strengths** (Internal, Positive)\n• What advantages do you have?\n• What do you do well?\n• What unique resources do you have?\n\n⚠️ **Weaknesses** (Internal, Negative)\n• What could you improve?\n• Where do you have fewer resources?\n• What are others doing better?\n\n🌟 **Opportunities** (External, Positive)\n• What trends could benefit you?\n• What market gaps exist?\n• What technology changes help you?\n\n⚡ **Threats** (External, Negative)\n• What trends could hurt you?\n• What is your competition doing?\n• What obstacles do you face?\n\nSWOT helps you develop strategies that leverage strengths and opportunities while addressing weaknesses and threats. Want to practice with a real example?",
    "supply and demand": "Supply and Demand are fundamental economic forces that determine market prices!\n\n📈 **Demand**: Consumer willingness and ability to buy\n• Higher price → Lower quantity demanded\n• Lower price → Higher quantity demanded\n• Factors affecting demand: income, preferences, substitutes, population\n\n📊 **Supply**: Producer willingness and ability to sell\n• Higher price → Higher quantity supplied\n• Lower price → Lower quantity supplied\n• Factors affecting supply: production costs, technology, number of sellers\n\n⚖️ **Market Equilibrium**: Where supply and demand curves intersect\n• Shortage occurs when demand > supply (prices rise)\n• Surplus occurs when supply > demand (prices fall)\n\nThis explains why concert tickets are expensive (high demand, limited supply) but water is cheap (abundant supply). What real-world example would you like to analyze?"
  };

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

    // Simulate AI thinking time
    setTimeout(() => {
      const lowerInput = inputMessage.toLowerCase();
      let aiResponse = "That's a great question! Let me help you understand that concept better. ";

      // Simple response matching
      Object.keys(sampleResponses).forEach(key => {
        if (lowerInput.includes(key)) {
          aiResponse = sampleResponses[key];
        }
      });

      // Default responses for common question types
      if (lowerInput.includes("how") || lowerInput.includes("what") || lowerInput.includes("why")) {
        if (!Object.keys(sampleResponses).some(key => lowerInput.includes(key))) {
          aiResponse += "Could you be more specific about which DECA topic you'd like to explore? I can help with Marketing, Finance, Entrepreneurship, Business Law, Economics, and Management concepts. Try asking about specific topics like 'marketing mix', 'financial ratios', or 'business model canvas'.";
        }
      } else if (lowerInput.includes("practice") || lowerInput.includes("test") || lowerInput.includes("question")) {
        aiResponse = "I'd be happy to help you practice! Here's a sample question:\n\n**Marketing Scenario**: A startup coffee shop wants to differentiate itself from Starbucks. What positioning strategy would you recommend?\n\nA) Cost leadership - compete on lower prices\nB) Focus strategy - target specific customer segment\nC) Differentiation - unique value proposition\nD) Market penetration - aggressive expansion\n\nTake your time to think about it, then tell me your answer and reasoning!";
      } else if (lowerInput.includes("help") || lowerInput.includes("stuck") || lowerInput.includes("confused")) {
        aiResponse = "I'm here to help! Here are some ways I can assist you:\n\n📚 **Concept Explanation**: Ask me about any DECA topic\n🧠 **Practice Problems**: I can create custom scenarios\n💡 **Study Tips**: Learn effective preparation strategies\n🎯 **Test Strategies**: Master multiple choice and case study approaches\n\nWhat specific area would you like to focus on?";
      }

      const aiMessage: Message = {
        id: messages.length + 2,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
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
              <Link to="/test">
                <Button variant="ghost">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Practice Test
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Quick Topics */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Quick Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-left hover:bg-blue-50"
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Practice with real business scenarios daily</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                  <span>Ask specific questions to get detailed explanations</span>
                </div>
                <div className="flex items-start space-x-2">
                  <BookOpen className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>Connect concepts to current business events</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-blue-600" />
                  AI DECA Tutor
                  <Badge className="ml-auto">Always Available</Badge>
                </CardTitle>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {message.sender === 'user' ? 
                            <User className="h-4 w-4" /> : 
                            <Bot className="h-4 w-4" />
                          }
                        </div>
                        <div className={`max-w-[80%] ${
                          message.sender === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block p-3 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
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
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
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

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about DECA topics, request practice questions, or get study help..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    size="icon"
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
