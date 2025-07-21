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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchDashboardData = async (firebaseUser: any) => {
      setLoading(true);
      setError("");
      try {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null);
        }
        // Fetch recent test results
        const testResultsRef = collection(db, "users", firebaseUser.uid, "testResults");
        const q = query(testResultsRef);
        let tests = [];
        try {
          const querySnapshot = await getDocs(q);
          tests = querySnapshot.docs.map(doc => {
            const data = doc.data();
            let formattedDate = "";
            let sortDate = 0;
            if (data.date && data.date.toDate) {
              const d = data.date.toDate();
              formattedDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              sortDate = d.getTime();
            } else if (data.createdAt) {
              const d = new Date(data.createdAt);
              formattedDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              sortDate = d.getTime();
            }
            return {
              id: doc.id,
              category: data.category,
              score: data.score,
              date: formattedDate,
              questions: data.questions,
              type: data.type || "Practice",
              sortDate,
              questionData: data.questionData, // Added for dynamic score calculation
              userAnswers: data.userAnswers // Added for dynamic score calculation
            };
          });
          // Sort by sortDate descending
          tests.sort((a, b) => b.sortDate - a.sortDate);
        } catch (testErr) {
          setError("Failed to fetch test results.");
        }
        setRecentTests(tests);
      } catch (err: any) {
        setUserData(null);
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchDashboardData(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
        setRecentTests([]);
        setLoading(false);
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/auth");
  };

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

  // Compute quick stats from recentTests
  const totalQuestions = recentTests.reduce((sum, t) => sum + (t.questions || 0), 0);
  const totalCorrect = recentTests.reduce((sum, t) => sum + Math.round((t.score / 100) * (t.questions || 0)), 0);
  const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  // Compute streak (number of consecutive days with at least one test, ending today)
  const today = new Date();
  today.setHours(0,0,0,0);
  let streak = 0;
  let dayCursor = new Date(today);
  const testDates = recentTests.map(t => t.date).filter(Boolean);
  while (true) {
    const dayStr = `${dayCursor.getFullYear()}-${String(dayCursor.getMonth()+1).padStart(2, '0')}-${String(dayCursor.getDate()).padStart(2, '0')}`;
    if (testDates.includes(dayStr)) {
      streak++;
      dayCursor.setDate(dayCursor.getDate() - 1);
    } else {
      break;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-xl text-gray-700">Loading your dashboard...</div>
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
                  <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{accuracyRate}%</p>
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
                  <p className="text-2xl font-bold text-gray-900">{streak} days</p>
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
                  {error && (
                    <div className="text-center text-gray-400 py-8">You have taken no tests so far.</div>
                  )}
                  {recentTests.length === 0 && !error ? (
                    <div className="text-center text-gray-400 py-8">
                      No recent tests yet. Take a test to see your results here!
                    </div>
                  ) : (
                    recentTests.map((test) => {
                      // Calculate score dynamically for each test
                      let correct = 0;
                      let answered = 0;
                      if (test.questionData && test.userAnswers) {
                        test.questionData.forEach((q: any, idx: number) => {
                          const userAnswer = parseInt(test.userAnswers[idx]);
                          if (!isNaN(userAnswer)) {
                            answered++;
                            if (userAnswer === q.correct) correct++;
                          }
                        });
                      }
                      const score = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                      return (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate(`/review/${test.id}`)}
                        >
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
                            <Badge variant={score >= 80 ? "default" : "secondary"}>
                              {score}%
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      );
                    })
                  )}
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
