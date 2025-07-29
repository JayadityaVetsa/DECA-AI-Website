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
import Avatar from "react-avatar";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-200">Loading your dashboard...</div>
      </div>
    );
  }

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
                {userData?.profilePicUrl ? (
                  <img
                    src={userData.profilePicUrl}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border-2 border-blue-300 shadow"
                  />
                ) : user ? (
                  <Avatar name={user.displayName || user.email || "User"} size="36" round={true} />
                ) : null}
              </Link>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {userData?.name || user?.displayName || "DECA Member"}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {userData && (
              <>
                <span className="font-semibold">Grade:</span> {userData.grade} &nbsp;|&nbsp;
                <span className="font-semibold">Event:</span> {userData.event}
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Quick Actions & Recent Results */}
          <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-blue-600" /> Quick Actions
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Choose your learning mode and jump in</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Link to="/test">
                  <Button className="w-full h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-md dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors">
                      <BookOpen className="h-6 w-6" />
                    Practice Test
                    <span className="text-xs opacity-90 font-normal">With AI Tutor Help</span>
                    </Button>
                  </Link>
                  <Link to="/full-test">
                  <Button className="w-full h-24 flex flex-col gap-2 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-xl shadow-md dark:bg-red-700 dark:hover:bg-red-800 transition-colors">
                      <AlertTriangle className="h-6 w-6" />
                    Full Test
                    <span className="text-xs opacity-90 font-normal">No AI Assistance</span>
                    </Button>
                  </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="w-full h-16 flex flex-col gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 font-semibold rounded-xl shadow-md transition-colors">
                      <MessageCircle className="h-6 w-6" />
                      Chat with AI Tutor
                    </Button>
                <Button className="w-full h-16 flex flex-col gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 font-semibold rounded-xl shadow-md transition-colors">
                    <BarChart3 className="h-6 w-6" />
                    View Analytics
                  </Button>
                </div>
            </div>

            {/* Recent Test Results */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Recent Test Results</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Your latest practice test performance</p>
              {recentTests.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No recent tests yet. Take a test to see your results here!</div>
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
                      className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer mb-2"
                      onClick={() => navigate(`/review/${test.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          test.type === 'Practice' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          {test.type === 'Practice' ? (
                            <BookOpen className={`h-6 w-6 ${test.type === 'Practice' ? 'text-blue-600' : 'text-red-600'}`} />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{test.category}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {test.questions} questions • {test.date} • {test.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={score >= 80 ? "default" : "secondary"} className={score >= 80 ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                          {score}%
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })
              )}
                </div>
          </div>

          {/* Right: Areas for Improvement & Achievements */}
          <div className="space-y-8">
            {/* Areas for Improvement */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Areas for Improvement</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Focus on these topics to boost your scores</p>
              {weakAreas.map((area, idx) => (
                <div key={idx} className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-900 dark:text-white font-medium">{area.topic}</span>
                    <span className="text-green-500 font-semibold">{area.improvement}</span>
                    </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-2 rounded-full bg-blue-500 dark:bg-blue-400"
                      style={{ width: `${area.accuracy}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{area.accuracy}% accuracy</span>
                  </div>
                ))}
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Achievements</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Your learning milestones</p>
              <div className="space-y-3">
                {achievements.map((ach, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm ${
                      ach.completed
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{ach.icon}</span>
                    <span className="font-semibold">{ach.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
