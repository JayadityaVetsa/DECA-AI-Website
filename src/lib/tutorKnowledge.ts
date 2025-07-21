// Tutor Knowledge Base - Loads extracted explanations from DECA PDFs
let extractedExplanations: any = null;

export async function loadDECAExplanations() {
  if (!extractedExplanations) {
    try {
      const response = await fetch('/src/data/extractedExplanations.json');
      extractedExplanations = await response.json();
      console.log(`📚 Loaded ${extractedExplanations.metadata.totalExplanations} DECA explanations`);
    } catch (error) {
      console.error('Error loading DECA explanations:', error);
      extractedExplanations = { explanations: [] };
    }
  }
  return extractedExplanations;
}

export async function findRelevantExplanations(topic: string, questionText?: string): Promise<string[]> {
  const data = await loadDECAExplanations();
  const explanations = data.explanations || [];
  
  const relevant = explanations.filter((exp: any) => {
    const explanationText = exp.explanation.toLowerCase();
    const topicLower = topic.toLowerCase();
    
    // Check if explanation is relevant to the topic
    return explanationText.includes(topicLower) || 
           (questionText && explanationText.includes(questionText.toLowerCase().substring(0, 50)));
  });
  
  return relevant.slice(0, 3).map((exp: any) => exp.explanation); // Return top 3 relevant explanations
}

export async function getRandomDECAExplanation(): Promise<string> {
  const data = await loadDECAExplanations();
  const explanations = data.explanations || [];
  
  if (explanations.length === 0) {
    return "I'd be happy to help explain DECA concepts! Ask me about marketing, finance, business management, or entrepreneurship topics.";
  }
  
  const randomIndex = Math.floor(Math.random() * explanations.length);
  return explanations[randomIndex].explanation;
}

export async function getDECAExplanationsByKeywords(keywords: string[]): Promise<string[]> {
  const data = await loadDECAExplanations();
  const explanations = data.explanations || [];
  
  const matches = explanations.filter((exp: any) => {
    const explanationText = exp.explanation.toLowerCase();
    return keywords.some(keyword => explanationText.includes(keyword.toLowerCase()));
  });
  
  return matches.slice(0, 5).map((exp: any) => exp.explanation);
}

export async function getExplanationStats() {
  const data = await loadDECAExplanations();
  return {
    totalExplanations: data.metadata?.totalExplanations || 0,
    sources: data.metadata?.files?.map((f: any) => f.fileName) || [],
    lastUpdated: data.metadata?.processedAt || new Date().toISOString()
  };
} 