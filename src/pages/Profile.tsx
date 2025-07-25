import { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Avatar from "react-avatar";
import { Brain } from "lucide-react";

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load user and profile pic
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch profilePicUrl from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setProfilePicUrl(userDoc.data().profilePicUrl || "");
        }
      } else {
        setUser(null);
        setProfilePicUrl("");
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load dark mode preference
  useEffect(() => {
    const stored = localStorage.getItem("decaai-darkmode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle dark mode
  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem("decaai-darkmode", newValue ? "true" : "false");
    if (newValue) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      // Save URL to Firestore
      await setDoc(doc(db, "users", user.uid), { profilePicUrl: url }, { merge: true });
      setProfilePicUrl(url);
      setSuccess("Profile picture updated!");
    } catch (err) {
      setError("Failed to upload profile picture.");
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors">
      {/* Navigation Bar */}
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
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
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
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border-2 border-blue-300 shadow"
                  />
                ) : user ? (
                  <Avatar name={user.displayName || user.email || "User"} size="36" round={true} />
                ) : null}
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Settings</h1>
        {/* Profile Section */}
        <div className="flex flex-col items-center space-y-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-300 shadow-lg"
            />
          ) : user ? (
            <Avatar name={user.displayName || user.email || "User"} size="128" round={true} />
          ) : null}
          <div className="text-lg font-semibold mt-2 text-gray-900 dark:text-gray-100">
            {user?.displayName || user?.email || "User"}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
          >
            {uploading ? "Uploading..." : "Change Profile Picture"}
          </Button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </div>
        {/* Settings Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Dark Mode</span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleDarkModeToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer dark:peer-checked:bg-blue-600 transition-all"></div>
              <div className="absolute left-1 top-1 bg-white dark:bg-gray-800 w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 