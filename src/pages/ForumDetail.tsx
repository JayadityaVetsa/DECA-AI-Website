import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ForumDetail = () => {
  const { questionId } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newReply, setNewReply] = useState("");
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const qSnap = await getDocs(query(collection(db, "forumQuestions")));
        const q = qSnap.docs.find(d => d.id === questionId);
        if (q) setQuestion({ id: q.id, ...q.data() });
        else setError("Question not found.");
        const rSnap = await getDocs(query(collection(db, "forumQuestions", questionId!, "replies"), orderBy("createdAt", "asc")));
        setReplies(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setError("Failed to load question or replies.");
      }
      setLoading(false);
    };
    fetchDetail();
  }, [questionId]);

  const handleReply = async (e: any) => {
    e.preventDefault();
    setPosting(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to reply.");
        setPosting(false);
        return;
      }
      await addDoc(collection(db, "forumQuestions", questionId!, "replies"), {
        body: newReply,
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        createdAt: serverTimestamp()
      });
      setNewReply("");
      // Refresh replies
      const rSnap = await getDocs(query(collection(db, "forumQuestions", questionId!, "replies"), orderBy("createdAt", "asc")));
      setReplies(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError("Failed to post reply.");
    }
    setPosting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">{error}</div>;
  if (!question) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold mb-2">{question.title}</CardTitle>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-600">by {question.userName}</span>
              {question.createdAt && question.createdAt.toDate ? (
                <span className="text-xs text-gray-400">{question.createdAt.toDate().toLocaleString()}</span>
              ) : null}
            </div>
            <div className="text-gray-700 text-base whitespace-pre-line mb-2">{question.body}</div>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Replies</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReply} className="space-y-4 mb-6">
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Write your reply..."
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                rows={3}
                required
              />
              <Button type="submit" disabled={posting || !newReply} className="w-full">
                {posting ? "Posting..." : "Post Reply"}
              </Button>
              {error && <div className="text-red-500 text-center mt-2">{error}</div>}
            </form>
            <div className="space-y-4">
              {replies.length === 0 ? (
                <div className="text-gray-500 text-center">No replies yet. Be the first to reply!</div>
              ) : (
                replies.map(r => (
                  <Card key={r.id} className="border-0 shadow-sm">
                    <CardContent className="py-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-blue-900">{r.userName}</div>
                        {r.createdAt && r.createdAt.toDate ? (
                          <div className="text-xs text-gray-400">{r.createdAt.toDate().toLocaleString()}</div>
                        ) : null}
                      </div>
                      <div className="text-gray-700 mt-1 whitespace-pre-line">{r.body}</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForumDetail; 