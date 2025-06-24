
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  BookOpen,
  Users,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [user] = useState({
    name: "Alex Thompson",
    level: "Intermediate",
    streak: 12,
    totalQuestions: 247,
    accuracy: 78
  });

  const recentTests = [
    { id: 1, category: "Marketing", score: 85, date: "2024-06-20", questions: 25 },
    { id: 2, category: "Finance", score: 72, date: "2024-06-19", questions: 30 },
    { id: 3, category: "Entrepreneurship", score: 91, date: "2024-06-18", questions: 20 }
  ];

  const weakAreas = [
    { topic: "Financial Analysis", accuracy: 45, improvement: "+12%" },
    { topic: "Market Research", accuracy: 62, improvement: "+8%" },
    { topic: "Business Ethics", accuracy: 67, improvement: "+15%" }
  ];

  const achievements = [
    { title: "First Week Streak", icon: "🔥", completed: true },
    { title: "Marketing Master", icon: "📈", completed: true },
    { title: "Finance Focused", icon: "💰", completed: false },
    { title: "Community Helper", icon: "🤝", completed: true }
  ];

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
              <Link to="/test">
                <Button variant="ghost">Practice Test</Button>
              </Link>
              <Link to="/tutor">
                <Button variant="ghost">AI Tutor</Button>
              </Link>
              <Button variant="outline">Profile</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600">
            You're on a {user.streak}-day streak! Keep up the great momentum.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{user.totalQuestions}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{user.accuracy}%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{user.streak} days</p>
                </div>
                <Award className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Skill Level</p>
                  <p className="text-2xl font-bold text-gray-900">{user.level}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Jump into your next learning activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/test">
                    <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                      <BookOpen className="h-6 w-6" />
                      Start Practice Test
                    </Button>
                  </Link>
                  <Link to="/tutor">
                    <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                      <MessageCircle className="h-6 w-6" />
                      Chat with AI Tutor
                    </Button>
                  </Link>
                  <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                    <BarChart3 className="h-6 w-6" />
                    View Analytics
                  </Button>
                  <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                    <Users className="h-6 w-6" />
                    Join Community
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Test Results */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Test Results</CardTitle>
                <CardDescription>
                  Your latest practice test performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{test.category}</p>
                          <p className="text-sm text-gray-600">{test.questions} questions • {test.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={test.score >= 80 ? "default" : "secondary"}>
                          {test.score}%
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Areas for Improvement */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                <CardDescription>
                  Focus on these topics to boost your scores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {weakAreas.map((area, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">{area.topic}</span>
                      <Badge variant="outline" className="text-green-600">
                        {area.improvement}
                      </Badge>
                    </div>
                    <Progress value={area.accuracy} className="h-2" />
                    <p className="text-xs text-gray-600">{area.accuracy}% accuracy</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Achievements</CardTitle>
                <CardDescription>
                  Your learning milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                    achievement.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}>
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        achievement.completed ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {achievement.title}
                      </p>
                    </div>
                    {achievement.completed && (
                      <Award className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
