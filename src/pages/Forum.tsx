import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Home, MessageCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Forum = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError("");
      try {
        const qSnap = await getDocs(query(collection(db, "forumQuestions"), orderBy("createdAt", "desc")));
        setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setError("Failed to load forum questions.");
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const handlePost = async (e: any) => {
    e.preventDefault();
    setPosting(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to post a question.");
        setPosting(false);
        return;
      }
      await addDoc(collection(db, "forumQuestions"), {
        title: newTitle,
        body: newBody,
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        createdAt: serverTimestamp()
      });
      setNewTitle("");
      setNewBody("");
      setShowForm(false);
      // Refresh questions
      const qSnap = await getDocs(query(collection(db, "forumQuestions"), orderBy("createdAt", "desc")));
      setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError("Failed to post question.");
    }
    setPosting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Navigation Bar */}
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
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/forum">
                <Button variant="ghost">Forum</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Forum Content */}
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Show create post form only if showForm is true */}
          {showForm && (
            <Card className="border-0 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold mb-2">Create a Post</CardTitle>
                <CardDescription className="text-gray-600 mb-2">Ask a question to the community</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePost} className="space-y-4 mb-6">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Question title"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                  />
                  <textarea
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Describe your question..."
                    value={newBody}
                    onChange={e => setNewBody(e.target.value)}
                    rows={4}
                    required
                  />
                  <div className="flex justify-between items-center">
                    <Button type="submit" disabled={posting || !newTitle || !newBody}>
                      {posting ? "Posting..." : "Post Question"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                  {error && <div className="text-red-500 text-center mt-2">{error}</div>}
                </form>
              </CardContent>
            </Card>
          )}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-xl">Loading...</div>
            ) : questions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No questions yet. Be the first to ask a question!
              </div>
            ) : (
              questions.map(q => (
                <Card
                  key={q.id}
                  className="border-0 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/forum/${q.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">{q.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      by {q.userName} {q.createdAt && q.createdAt.toDate ? (
                        <span className="text-xs text-gray-400 ml-2">
                          {q.createdAt.toDate().toLocaleString()}
                        </span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-700 text-base whitespace-pre-line line-clamp-2">{q.body}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        {/* Floating Add Post Button */}
        {!showForm && (
          <button
            className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center z-50"
            onClick={() => setShowForm(true)}
            aria-label="Add Post"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Forum; 