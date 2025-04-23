// src/services/copilot.js
import axios from 'axios';

// Remove hook usage here. Accept analyzeSentiment as parameter.
export const triggerIntervention = async (message, user, analyzeSentiment) => {
  // Step 1: Basic filtering to conserve Azure calls
  const redFlags = ['suicide', 'kill', 'end it'];
  if (!redFlags.some(flag => message.toLowerCase().includes(flag))) return;

  // Step 2: Use the provided analyzeSentiment function to perform analysis
  const analysis = await analyzeSentiment(message);
  
  // Step 3: Trigger the Copilot workflow if negative sentiment is high
  if (analysis.documents[0].confidenceScores.negative > 0.8) {
    await axios.post(process.env.REACT_APP_COPILOT_WEBHOOK, {
      studentId: user.uid,
      message,
      timestamp: new Date().toISOString()
    });
  }
};
