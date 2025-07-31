import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageCircle, TrendingUp, Users, CheckCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-600" />,
      title: "AI Question Generation",
      description: "Unlimited practice questions tailored to DECA Performance Indicators and current market trends."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-purple-600" />,
      title: "Personal AI Tutor",
      description: "Get instant help with multiple learning perspectives and detailed explanations for every concept."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Adaptive Learning",
      description: "AI tracks your progress and adapts difficulty based on your strengths and weaknesses."
    },
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: "Community Forum",
      description: "Connect with other DECA competitors, share strategies, and learn from top performers."
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/favicon.ico" alt="DECA AI Logo" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DECA AI Platform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {!isLoggedIn ? (
                <>
                  <Link to="/auth">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Button onClick={() => setIsLoggedIn(true)}>Get Started</Button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link to="/test">
                    <Button variant="ghost">Practice Test</Button>
                  </Link>
                  <Link to="/tutor">
                    <Button variant="ghost">AI Tutor</Button>
                  </Link>
                  <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Master DECA
              </span>
              <br />
              <span className="text-gray-900 dark:text-gray-100">with AI Power</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Transform your DECA competition preparation with unlimited AI-generated practice questions, 
              personalized tutoring, and adaptive learning that evolves with you.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => setIsLoggedIn(true)}>
              Start Practicing Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-gray-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Unlimited Practice</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-900/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive tools for DECA test preparation and skill development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Elevate Your DECA Game?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students who are already using AI to master DECA competitions.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6" onClick={() => setIsLoggedIn(true)}>
            Start Your Free Journey Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-semibold">DECA AI Platform</span>
              </div>
              <p className="text-gray-400">
                Empowering DECA students with AI-driven learning and unlimited practice opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Practice Tests</a></li>
                <li><a href="#" className="hover:text-white">AI Tutor</a></li>
                <li><a href="#" className="hover:text-white">Progress Tracking</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Study Guides</a></li>
                <li><a href="#" className="hover:text-white">Best Practices</a></li>
                <li><a href="#" className="hover:text-white">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DECA AI Platform. All rights reserved. Built to enhance learning, not replace it.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
