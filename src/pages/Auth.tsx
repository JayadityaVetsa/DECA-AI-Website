import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Brain } from "lucide-react";

const Auth: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [event, setEvent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
          // Store extra info in Firestore
          await setDoc(doc(db, "users", auth.currentUser.uid), {
            name,
            grade,
            event,
            email,
            createdAt: new Date()
          });
        }
        navigate("/dashboard");
      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DECA AI Platform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Auth Card */}
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white dark:bg-gray-900">
          <CardHeader className="text-center pb-2">
            <CardTitle>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                {isSignup ? "Create Your Account" : "Welcome Back"}
              </span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
              {isSignup
                ? "Sign up to unlock unlimited DECA practice, AI tutoring, and more."
                : "Log in to continue your DECA journey with AI-powered tools."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <>
                  <div>
                    <Label>Name</Label>
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" />
                  </div>
                  <div>
                    <Label>Grade</Label>
                    <Input type="text" value={grade} onChange={e => setGrade(e.target.value)} required placeholder="e.g. 11" />
                  </div>
                  <div>
                    <Label>DECA Event</Label>
                    <Input type="text" value={event} onChange={e => setEvent(e.target.value)} required placeholder="e.g. Marketing, Finance" />
                  </div>
                </>
              )}
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <Button type="submit" disabled={loading} className="w-full text-lg py-6 mt-2">
                {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
              </Button>
            </form>
            <div className="text-center mt-6">
              {isSignup ? (
                <span className="text-gray-700">
                  Already have an account?{' '}
                  <Button variant="link" onClick={() => setIsSignup(false)} className="text-blue-600">Login</Button>
                </span>
              ) : (
                <span className="text-gray-700">
                  New user?{' '}
                  <Button variant="link" onClick={() => setIsSignup(true)} className="text-blue-600">Sign Up</Button>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth; 