import { useEffect, useState } from "react";
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
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setError("User data not found.");
          }
        } catch (err: any) {
          setError("Failed to fetch user data.");
        }
        setLoading(false);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  const recentTests = [
    { id: 1, category: "Marketing", score: 85, date: "2024-06-20", questions: 25, type: "Practice" },
    { id: 2, category: "Finance", score: 72, date: "2024-06-19", questions: 30, type: "Full Test" },
    { id: 3, category: "Entrepreneurship", score: 91, date: "2024-06-18", questions: 20, type: "Practice" }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-xl text-gray-700">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-xl text-red-500">{error}</div>
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
              <Link to="/test">
                <Button variant="ghost">Practice Test</Button>
              </Link>
              <Link to="/full-test">
                <Button variant="ghost">Full Test</Button>
              </Link>
              <Link to="/tutor">
                <Button variant="ghost">AI Tutor</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userData?.name || user?.displayName || "DECA Member"}! 👋
          </h1>
          <p className="text-gray-600">
            {userData && (
              <>
                <span className="font-semibold">Grade:</span> {userData.grade} &nbsp;|&nbsp;
                <span className="font-semibold">Event:</span> {userData.event}
              </>
            )}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{userData?.totalQuestions || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{userData?.accuracy || 0}%</p>
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
                  <p className="text-2xl font-bold text-gray-900">{userData?.streak || 0} days</p>
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
                  <p className="text-2xl font-bold text-gray-900">{userData?.level || "Intermediate"}</p>
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
                  Choose your learning mode and jump in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/test">
                    <Button className="w-full h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700" variant="default">
                      <BookOpen className="h-6 w-6" />
                      <span className="font-semibold">Practice Test</span>
                      <span className="text-xs opacity-90">With AI Tutor Help</span>
                    </Button>
                  </Link>
                  <Link to="/full-test">
                    <Button className="w-full h-24 flex flex-col gap-2 bg-red-600 hover:bg-red-700" variant="default">
                      <AlertTriangle className="h-6 w-6" />
                      <span className="font-semibold">Full Test</span>
                      <span className="text-xs opacity-90">No AI Assistance</span>
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
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          test.type === 'Practice' ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                          {test.type === 'Practice' ? (
                            <BookOpen className={`h-6 w-6 ${test.type === 'Practice' ? 'text-blue-600' : 'text-red-600'}`} />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{test.category}</p>
                          <p className="text-sm text-gray-600">
                            {test.questions} questions • {test.date} • {test.type}
                          </p>
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
