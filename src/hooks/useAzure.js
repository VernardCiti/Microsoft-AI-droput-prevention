
// src/hooks/useAzure.js
import { useCallback } from 'react';
console.log('Starting Azure analysis...outside');
export const useAzure = () => {
  const analyzeSentiment = useCallback(async (text) => {
    // Mock mode for development
    if (process.env.REACT_APP_NODE_ENV !== 'production') {
    
      return {
        
        documents: [{
          confidenceScores: {
            negative: Math.random() * 0.8 // Demo-friendly mock data
          }
        }]
      };
    }
    console.log('Starting Azure analysis...1111111111111');
    try {
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay

      const response = await fetch(
        process.env.REACT_APP_AZURE_TEXT_ANALYTICS_ENDPOINT,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_AZURE_KEY
          },
          body: JSON.stringify({
            documents: [{
              id: "1",
              text: text.substring(0, 5000),
              language: "en"
            }]
          })
        }
      );

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || 30);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return analyzeSentiment(text);
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Azure response111111111111111111111111111111:', response.status);
      return await response.json();
    } catch (error) {
      console.error("Azure API Error:", error);
      return { documents: [{}] };
    }
  }, []);

  return { analyzeSentiment };
};