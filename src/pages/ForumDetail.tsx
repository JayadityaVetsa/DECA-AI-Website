import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Avatar from "react-avatar";
import { Plus } from "lucide-react";

const ForumDetail = () => {
  const { questionId } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newReply, setNewReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [userPics, setUserPics] = useState<Record<string, string>>({});
  const [showReplyForm, setShowReplyForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch the specific question document
        const qSnap = await getDocs(query(collection(db, "forumQuestions")));
        const q = qSnap.docs.find(d => d.id === questionId);
        let questionData: any = null;
        if (q) questionData = { id: q.id, ...q.data() };
        else setError("Question not found.");
        setQuestion(questionData);

        // Fetch replies for this question
        const rSnap = await getDocs(query(collection(db, "forumQuestions", questionId!, "replies"), orderBy("createdAt", "asc")));
        const repliesData = rSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as { userId?: string; userName?: string; body?: string; createdAt?: any }) }));
        setReplies(repliesData);

        // Fetch profilePicUrls for question author and all reply authors
        const userIds = Array.from(new Set([
          questionData?.userId,
          ...repliesData.map(r => r.userId)
        ].filter(Boolean)));
        const pics: Record<string, string> = {};
        await Promise.all(userIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists() && userDoc.data().profilePicUrl) {
            pics[uid] = userDoc.data().profilePicUrl;
          }
        }));
        setUserPics(pics);
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
      setShowReplyForm(false); // Hide form after posting
      // Refresh replies
      const rSnap = await getDocs(query(collection(db, "forumQuestions", questionId!, "replies"), orderBy("createdAt", "asc")));
      setReplies(rSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as { userId?: string; userName?: string; body?: string; createdAt?: any }) })));
    } catch (err) {
      setError("Failed to post reply.");
    }
    setPosting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">{error}</div>;
  if (!question) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              {question.userId && userPics[question.userId] ? (
                <img src={userPics[question.userId]} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-blue-200 shadow" />
              ) : question.userName ? (
                <Avatar name={question.userName} size="28" round={true} />
              ) : null}
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
            {/* Show reply form only if showReplyForm is true */}
            {showReplyForm && (
              <form onSubmit={handleReply} className="space-y-4 mb-6">
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Write your reply..."
                  value={newReply}
                  onChange={e => setNewReply(e.target.value)}
                  rows={3}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={posting || !newReply} className="w-full">
                    {posting ? "Posting..." : "Post Reply"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowReplyForm(false); setNewReply(""); }}>
                    Cancel
                  </Button>
                </div>
                {error && <div className="text-red-500 text-center mt-2">{error}</div>}
              </form>
            )}
            <div className="space-y-4">
              {replies.length === 0 ? (
                <div className="text-gray-500 text-center">No replies yet. Be the first to reply!</div>
              ) : (
                replies.map(r => (
                  <Card key={r.id} className="border-0 shadow-sm">
                    <CardContent className="py-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {r.userId && userPics[r.userId] ? (
                            <img src={userPics[r.userId]} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-blue-200 shadow" />
                          ) : r.userName ? (
                            <Avatar name={r.userName} size="24" round={true} />
                          ) : null}
                          <div className="font-semibold text-blue-900">{r.userName}</div>
                        </div>
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
            {/* Floating Add Reply Button */}
            {!showReplyForm && (
              <button
                className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center z-50"
                onClick={() => setShowReplyForm(true)}
                aria-label="Add Reply"
              >
                <Plus className="h-6 w-6" />
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForumDetail; 