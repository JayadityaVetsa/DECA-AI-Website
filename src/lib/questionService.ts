import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "./firebase";
import { DECAQuestionGenerator } from "./questionGenerator";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const functions = getFunctions();
const getUniqueQuestionForUserCallable = httpsCallable(functions, "getUniqueQuestionForUser");

export interface Question {
  id: string;
  text: string;
  event: string;
  timestamp: any;
  aiGenerated: boolean;
}

export interface GlobalQuestion {
  id: string;
  text: string;
  event: string;
  timestamp: any;
  aiGenerated: boolean;
  // Additional fields for compatibility with existing system
  cluster?: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
}

export const fetchUniqueQuestion = async (event: string): Promise<GlobalQuestion> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to fetch questions");
    }

    const result = await getUniqueQuestionForUserCallable({ event });
    return result.data as GlobalQuestion;
  } catch (error) {
    console.error("Error fetching unique question:", error);
    throw error;
  }
};

// Function to save a generated question to global storage
export const saveQuestionToGlobalStorage = async (question: any, event: string) => {
  try {
    console.log("Attempting to save question to global storage...");
    console.log("Auth current user:", auth.currentUser);
    console.log("Question:", question);
    console.log("Event:", event);
    
    if (!auth.currentUser) {
      console.warn("User not authenticated, skipping global storage");
      return;
    }

    const globalQuestion = {
      text: question.question_text,
      event,
      timestamp: serverTimestamp(),
      aiGenerated: true,
      cluster: question.cluster,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      difficulty_level: question.difficulty_level
    };

    console.log("Saving global question:", globalQuestion);
    
    // Save to global questions collection
    const docRef = await addDoc(collection(db, "questions"), globalQuestion);
    console.log("✅ Question saved to global storage with ID:", docRef.id);
  } catch (error) {
    console.error("❌ Error saving question to global storage:", error);
  }
};

// Function to mark a question as seen for a user
export const markQuestionAsSeen = async (questionId: string, event: string) => {
  try {
    if (!auth.currentUser) {
      console.warn("User not authenticated, skipping seen tracking");
      return;
    }

    await addDoc(collection(db, "users", auth.currentUser.uid, "seenQuestions"), {
      questionId,
      event,
      seenAt: serverTimestamp()
    });
    console.log("Question marked as seen:", questionId);
  } catch (error) {
    console.error("Error marking question as seen:", error);
  }
};

// Enhanced function that uses global storage but falls back to existing AI
export const getQuestionWithGlobalStorage = async (
  event: string,
  cluster: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<any> => {
  try {
    // First try to get from global storage
    const globalQuestion = await fetchUniqueQuestion(event);
    
    // Convert global question to DECAQuestion format
    const decaQuestion = {
      id: globalQuestion.id,
      cluster: globalQuestion.cluster || cluster,
      event: globalQuestion.event,
      question_text: globalQuestion.text,
      options: globalQuestion.options || {
        A: "Option A",
        B: "Option B", 
        C: "Option C",
        D: "Option D"
      },
      correct_answer: globalQuestion.correct_answer || 'A',
      performance_indicators: [],
      difficulty_level: globalQuestion.difficulty_level || difficulty,
      explanation: globalQuestion.explanation || "Explanation not available"
    };

    // Mark as seen for this user
    await markQuestionAsSeen(globalQuestion.id, event);
    
    return decaQuestion;
  } catch (error) {
    console.log("Global storage failed, falling back to existing AI generation:", error);
    
    // Fall back to existing AI generation
    const aiQuestion = await DECAQuestionGenerator.generateSingleQuestion(
      cluster,
      event,
      [], // performance indicators
      difficulty,
      [], // existing questions
      3 // max attempts
    );

    // Save to global storage for future use
    await saveQuestionToGlobalStorage(aiQuestion, event);
    
    return aiQuestion;
  }
};

// Function to get a unique question for a user (ensures no duplicates)
export const getUniqueQuestionForUser = async (
  event: string,
  cluster: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<any> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated");
    }

    // Get all questions for this event from global storage
    const questionsQuery = query(
      collection(db, "questions"),
      where("event", "==", event)
    );
    const questionsSnapshot = await getDocs(questionsQuery);
    const allQuestions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GlobalQuestion[];

    // Get all seen questions for this user and event
    const seenQuery = query(
      collection(db, "users", auth.currentUser.uid, "seenQuestions"),
      where("event", "==", event)
    );
    const seenSnapshot = await getDocs(seenQuery);
    const seenQuestionIds = seenSnapshot.docs.map(doc => doc.data().questionId);

    // Find unseen questions
    const unseenQuestions = allQuestions.filter(q => !seenQuestionIds.includes(q.id));

    if (unseenQuestions.length > 0) {
      // Return a random unseen question
      const randomQuestion = unseenQuestions[Math.floor(Math.random() * unseenQuestions.length)];
      
      // Mark as seen
      await markQuestionAsSeen(randomQuestion.id, event);
      
      // Convert to DECAQuestion format
      return {
        id: randomQuestion.id,
        cluster: randomQuestion.cluster || cluster,
        event: randomQuestion.event,
        question_text: randomQuestion.text,
        options: randomQuestion.options || {
          A: "Option A",
          B: "Option B", 
          C: "Option C",
          D: "Option D"
        },
        correct_answer: randomQuestion.correct_answer || 'A',
        performance_indicators: [],
        difficulty_level: randomQuestion.difficulty_level || difficulty,
        explanation: randomQuestion.explanation || "Explanation not available"
      };
    } else {
      // No unseen questions, generate new one with AI
      console.log("No unseen questions found, generating new one with AI");
      const aiQuestion = await DECAQuestionGenerator.generateSingleQuestion(
        cluster,
        event,
        [], // performance indicators
        difficulty,
        [], // existing questions
        3 // max attempts
      );

      // Save to global storage
      await saveQuestionToGlobalStorage(aiQuestion, event);
      
      return aiQuestion;
    }
  } catch (error) {
    console.error("Error getting unique question:", error);
    
    // Fallback to AI generation
    const aiQuestion = await DECAQuestionGenerator.generateSingleQuestion(
      cluster,
      event,
      [], // performance indicators
      difficulty,
      [], // existing questions
      3 // max attempts
    );

    // Save to global storage
    await saveQuestionToGlobalStorage(aiQuestion, event);
    
    return aiQuestion;
  }
}; 

// Simple integration function for existing test generation
export const integrateWithExistingAI = async (
  cluster: string,
  event: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<any> => {
  try {
    // Try to get a unique question from global storage
    const uniqueQuestion = await getUniqueQuestionForUser(event, cluster, difficulty);
    
    // If we got a question from global storage, return it
    if (uniqueQuestion) {
      console.log("Using question from global storage");
      return uniqueQuestion;
    }
    
    // If no unique question found, generate with existing AI
    console.log("Generating new question with existing AI");
    const aiQuestion = await DECAQuestionGenerator.generateSingleQuestion(
      cluster,
      event,
      [], // performance indicators
      difficulty,
      [], // existing questions
      3 // max attempts
    );
    
    // Save the new question to global storage
    await saveQuestionToGlobalStorage(aiQuestion, event);
    
    return aiQuestion;
  } catch (error) {
    console.error("Error in integration:", error);
    
    // Fallback to existing AI generation
    const aiQuestion = await DECAQuestionGenerator.generateSingleQuestion(
      cluster,
      event,
      [], // performance indicators
      difficulty,
      [], // existing questions
      3 // max attempts
    );
    
    // Try to save to global storage
    await saveQuestionToGlobalStorage(aiQuestion, event);
    
    return aiQuestion;
  }
}; 