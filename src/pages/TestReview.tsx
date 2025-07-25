import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

const TestReview = () => {
  const { testId } = useParams();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      setError("");
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("You must be logged in to view this test review.");
          setLoading(false);
          return;
        }
        const testRef = doc(db, "users", user.uid, "testResults", testId!);
        const testSnap = await getDoc(testRef);
        if (testSnap.exists()) {
          setTest(testSnap.data());
        } else {
          setError("Test not found.");
        }
      } catch (err) {
        setError("Failed to fetch test result.");
      }
      setLoading(false);
    };
    fetchTest();
  }, [testId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading test review...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">{error}</div>;
  }
  if (!test) {
    return null;
  }

  // Calculate score dynamically
  let correct = 0;
  let answered = 0;
  if (test && test.questionData && test.userAnswers) {
    test.questionData.forEach((q: any, idx: number) => {
      const userAnswer = parseInt(test.userAnswers[idx]);
      if (!isNaN(userAnswer)) {
        answered++;
        if (userAnswer === q.correct) correct++;
      }
    });
  }
  const score = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  // Helper to format time (assume test.timeTaken is in seconds)
  function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        {/* Score Summary */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-10">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <div className="text-5xl font-bold text-green-600 dark:text-green-300 mb-2">{correct}</div>
            <div className="text-lg text-gray-700 dark:text-gray-200">Correct</div>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <div className="text-5xl font-bold text-red-600 dark:text-red-300 mb-2">{answered - correct}</div>
            <div className="text-lg text-gray-700 dark:text-gray-200">Incorrect</div>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-300 mb-2">{formatTime(test.timeTaken)}</div>
            <div className="text-lg text-gray-700 dark:text-gray-200">Time Taken</div>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <div className={`text-5xl font-bold mb-2 ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{score}%</div>
            <div className="text-lg text-gray-700 dark:text-gray-200">Final Score</div>
          </div>
        </div>
        {/* Question Review */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Question Review</h2>
        <div className="space-y-8">
          {test.questionData && test.questionData.map((q: any, idx: number) => {
            const userAnswer = parseInt(test.userAnswers[idx]);
            const isCorrect = userAnswer === q.correct;
            return (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{q.category}</Badge>
                  <Badge variant={q.difficulty === 'Beginner' ? 'secondary' : q.difficulty === 'Intermediate' ? 'default' : 'destructive'} className={q.difficulty === 'Beginner' ? '' : q.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>{q.difficulty}</Badge>
                  {isCorrect ? (
                    <span className="text-green-600 dark:text-green-300 font-bold">✔</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-300 font-bold">✘</span>
                  )}
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">Question {idx + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{q.question}</h3>
                <div className="space-y-3 mb-4">
                  {q.options.map((option: string, optionIndex: number) => {
                    const isUserAnswer = userAnswer === optionIndex;
                    const isCorrectAnswer = q.correct === optionIndex;
                    let optionBg = 'bg-gray-100 dark:bg-gray-700';
                    let optionText = 'text-gray-900 dark:text-gray-100';
                    let optionFont = '';
                    if (isCorrectAnswer) {
                      optionBg = 'bg-green-100 dark:bg-green-900/40';
                      optionText = 'text-green-700 dark:text-green-200';
                      optionFont = 'font-bold';
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      optionBg = 'bg-red-100 dark:bg-red-900/40';
                      optionText = 'text-red-700 dark:text-red-200';
                      optionFont = 'font-bold';
                    } else if (isUserAnswer) {
                      optionBg = 'bg-blue-100 dark:bg-blue-800/40';
                      optionText = 'text-blue-700 dark:text-blue-200';
                      optionFont = 'font-bold';
                    }
                    return (
                      <div
                        key={optionIndex}
                        className={`p-4 rounded-xl border ${optionBg} border-gray-200 dark:border-gray-600 flex items-center gap-2 ${optionText} ${optionFont}`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                        <span>{option}</span>
                        {isCorrectAnswer && <span className="ml-auto">✔</span>}
                        {isUserAnswer && !isCorrectAnswer && <span className="ml-auto">✘</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mt-2">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Explanation:</h4>
                  <p className="text-blue-700 dark:text-blue-100 font-medium">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestReview; 