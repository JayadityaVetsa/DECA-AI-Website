import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Test from "./pages/Test";
import FullTest from "./pages/FullTest";
import Tutor from "./pages/Tutor";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import TestReview from "./pages/TestReview";
import Forum from "./pages/Forum";
import ForumDetail from "./pages/ForumDetail";
import Settings from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test" element={<Test />} />
          <Route path="/full-test" element={<FullTest />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/review/:testId" element={<TestReview />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:questionId" element={<ForumDetail />} />
          <Route path="/profile" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
