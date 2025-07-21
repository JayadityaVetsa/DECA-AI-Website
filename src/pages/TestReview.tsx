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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">Test Review</CardTitle>
            <CardDescription className="text-lg">
              {test.category} • {test.questions} questions • {test.type}
            </CardDescription>
            <div className="text-5xl font-bold mt-4">
              <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                {score}%
              </span>
            </div>
          </CardHeader>
        </Card>
        <div className="space-y-8">
          {test.questionData && test.questionData.map((q: any, idx: number) => {
            const userAnswer = parseInt(test.userAnswers[idx]);
            const isCorrect = userAnswer === q.correct;
            return (
              <Card key={idx} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{q.category}</Badge>
                      <Badge variant={q.difficulty === 'Beginner' ? 'secondary' : q.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                        {q.difficulty}
                      </Badge>
                      {isCorrect ? (
                        <span className="text-green-600 font-bold">Correct</span>
                      ) : (
                        <span className="text-red-600 font-bold">Wrong</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">Question {idx + 1}</span>
                  </div>
                  <CardTitle className="text-lg font-semibold leading-relaxed">
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {q.options.map((option: string, optionIndex: number) => {
                      const isUserAnswer = userAnswer === optionIndex;
                      const isCorrectAnswer = q.correct === optionIndex;
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
                    <p className="text-blue-700">{q.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestReview; 