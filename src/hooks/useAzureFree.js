// src/hooks/useAzure.js
import { useState, useCallback } from 'react';

export const useAzure = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // For demonstration, we're simulating the Azure Text Analytics API
  // In a real implementation, this would make an actual API call
  const analyzeSentiment = useCallback(async (text) => {
    if (!text || text.trim() === '') {
      return {
        documents: [
          {
            id: '1',
            sentiment: 'neutral',
            confidenceScores: {
              positive: 0.33,
              neutral: 0.34,
              negative: 0.33
            }
          }
        ]
      };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simple sentiment heuristics for demo
      const lowerText = text.toLowerCase();
      
      // Check for negative keywords
      const negativeKeywords = ['struggling', 'difficult', 'hard', 'failing', 
                              'behind', 'stressed', 'overwhelmed', 'worried',
                              'anxiety', 'depressed', 'hate', 'terrible', 'bad'];
      
      // Check for positive keywords
      const positiveKeywords = ['good', 'great', 'excellent', 'happy', 
                               'enjoying', 'understand', 'confident', 'prepared',
                               'success', 'well', 'improving', 'better', 'best'];
      
      // Count keyword occurrences
      let negativeCount = 0;
      let positiveCount = 0;
      
      negativeKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) negativeCount++;
      });
      
      positiveKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) positiveCount++;
      });
      
      // Calculate sentiment scores
      let negative = 0.1; // base negativity
      let positive = 0.1; // base positivity
      
      if (negativeCount > 0 || positiveCount > 0) {
        negative = Math.min(0.9, negative + (negativeCount * 0.2));
        positive = Math.min(0.9, positive + (positiveCount * 0.2));
      }
      
      // Ensure scores sum to 1
      const neutral = Math.max(0, 1 - negative - positive);
      
      // Determine sentiment label
      let sentiment = 'neutral';
      if (positive > negative && positive > neutral) sentiment = 'positive';
      if (negative > positive && negative > neutral) sentiment = 'negative';
      
      return {
        documents: [
          {
            id: '1',
            sentiment: sentiment,
            confidenceScores: {
              positive: positive,
              neutral: neutral,
              negative: negative
            }
          }
        ]
      };
    } catch (err) {
      setError(err);
      console.error('Azure sentiment analysis error:', err);
      // Return fallback values
      return {
        documents: [
          {
            id: '1',
            sentiment: 'neutral',
            confidenceScores: {
              positive: 0.33,
              neutral: 0.34,
              negative: 0.33
            }
          }
        ]
      };
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    analyzeSentiment,
    loading,
    error
  };
};