// src/services/azureOpenAIService.js
import { useAzure } from '../hooks/useAzure';

// Cache for responses to reduce API calls
const responseCache = new Map();

export const getChatCompletion = async (systemPrompt, userQuery, context = {}) => {
  // Create a cache key from the query and relevant context
  const cacheKey = `${userQuery}-${context.student?.StudentID || ''}-${context.student?.RiskScore || ''}`;
  
  // Check cache first
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }
  
  // Check if we're in development/test mode
  const isDevelopment = process.env.REACT_APP_NODE_ENV !== 'production';
  
  if (isDevelopment) {
    // In development, use mock responses
    const mockResponse = getMockResponse(userQuery, context);
    responseCache.set(cacheKey, mockResponse);
    return mockResponse;
  }
  
  // For production: Actual Azure OpenAI call
  try {
    const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
    const key = process.env.REACT_APP_AZURE_OPENAI_KEY;
    const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT;
    
    if (!endpoint || !key || !deploymentName) {
      console.warn("Azure OpenAI credentials not configured, falling back to mock responses");
      const fallbackResponse = getMockResponse(userQuery, context);
      responseCache.set(cacheKey, fallbackResponse);
      return fallbackResponse;
    }
    
    // Create a properly formatted request for Azure OpenAI
    const response = await fetch(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-07-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': key
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userQuery
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      }
    );
    
    // Handle rate limiting
    if (response.status === 429) {
      console.warn("Rate limited by Azure OpenAI API, retrying after delay");
      const retryAfter = parseInt(response.headers.get('Retry-After') || '30');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return getChatCompletion(systemPrompt, userQuery, context);
    }
    
    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "I couldn't generate a response.";
    
    // Parse the response and store in cache
    const parsedResponse = parseAgentResponse(responseText);
    responseCache.set(cacheKey, parsedResponse);
    
    return parsedResponse;
    
  } catch (error) {
    console.error("Azure OpenAI API Error:", error);
    
    // Fallback to mock responses on error
    const fallbackResponse = getMockResponse(userQuery, context);
    responseCache.set(cacheKey, fallbackResponse);
    return fallbackResponse;
  }
};

// Parse agent response to extract recommendations
const parseAgentResponse = (rawResponse) => {
  try {
    // If the response is already structured
    if (typeof rawResponse === 'object' && rawResponse.message) {
      return rawResponse;
    }
    
    const recommendations = [];
    let messageText = rawResponse;
    
    // Look for recommendations section (various formats)
    const recommendationPatterns = [
      /Recommendations?:/i,
      /Suggested actions?:/i,
      /I recommend:/i,
      /Here are my recommendations?:/i
    ];
    
    // Find the first matching pattern
    let recommendationsIndex = -1;
    let matchedPattern = null;
    
    for (const pattern of recommendationPatterns) {
      const match = rawResponse.match(pattern);
      if (match && match.index !== undefined) {
        recommendationsIndex = match.index;
        matchedPattern = match[0];
        break;
      }
    }
    
    if (recommendationsIndex !== -1) {
      // Split into message and recommendations
      messageText = rawResponse.substring(0, recommendationsIndex).trim();
      
      // Extract recommendations
      const recSection = rawResponse.substring(recommendationsIndex + matchedPattern.length);
      const recLines = recSection.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      recLines.forEach(line => {
        // Check if line starts with a bullet point, number, or dash
        if (line.match(/^[-*•]|\d+[\.)]\s/)) {
          // Remove the bullet point or number
          const recText = line.replace(/^[-*•]|\d+[\.)]\s/, '').trim();
          if (recText) recommendations.push(recText);
        } else {
          // If no bullet/number but line looks like a recommendation
          // and isn't too long (to avoid capturing paragraphs)
          if (line.length > 10 && line.length < 150) recommendations.push(line);
        }
      });
    }
    
    return {
      message: messageText,
      recommendations: recommendations.length > 0 ? recommendations : null
    };
  } catch (error) {
    console.error("Error parsing agent response:", error);
    return { message: rawResponse };
  }
};

// Generate mock responses for development or when API fails
const getMockResponse = (query, context) => {
  const student = context.student || {};
  const name = student.name || student.Name || 'the student';
  const riskScore = student.riskScore || student.RiskScore || 50;
  const riskLevel = riskScore >= 70 ? 'high' : (riskScore >= 30 ? 'medium' : 'low');
  
  // Normalize query for easier matching
  const normalizedQuery = query.toLowerCase().trim();
  
  // Risk assessment response
  if (normalizedQuery.includes('risk') || normalizedQuery.includes('assessment')) {
    return {
      message: `${name} has a ${riskLevel} risk score of ${riskScore}. ${getRiskAssessment(student)}`,
      recommendations: getRiskRecommendations(student)
    };
  } 
  // Attendance query
  else if (normalizedQuery.includes('attendance') || normalizedQuery.includes('absent')) {
    const attendance = student.Attendance || student.attendance || 85;
    return {
      message: `${name}'s attendance rate is ${attendance}%. ${getAttendanceAssessment(attendance)}`,
      recommendations: getAttendanceRecommendations(attendance)
    };
  }
  // Academic performance query
  else if (normalizedQuery.includes('academic') || normalizedQuery.includes('performance') || 
           normalizedQuery.includes('assignment') || normalizedQuery.includes('grade')) {
    const assignments = student.AssignmentsSubmitted || 80;
    return {
      message: `${name} has completed ${assignments}% of assignments. ${getAcademicAssessment(assignments)}`,
      recommendations: getAcademicRecommendations(assignments, riskLevel)
    };
  }
  // Engagement query
  else if (normalizedQuery.includes('engage') || normalizedQuery.includes('participation')) {
    const engagement = student.EngagementScore || student.engagementScore || 75;
    return {
      message: `${name}'s engagement score is ${engagement}/100. ${getEngagementAssessment(engagement)}`,
      recommendations: getEngagementRecommendations(engagement)
    };
  }
  // Recent feedback query
  else if (normalizedQuery.includes('feedback') || normalizedQuery.includes('comment') || 
           normalizedQuery.includes('sentiment')) {
    const feedback = student.lastFeedback || student.LastFeedback || "No recent feedback available.";
    return {
      message: `Recent feedback from ${name}: "${feedback}" ${getFeedbackAssessment(feedback, riskLevel)}`,
      recommendations: getFeedbackRecommendations(riskLevel)
    };
  }
  // System capabilities query
  else if (normalizedQuery.includes('system') || normalizedQuery.includes('dashboard') || 
           normalizedQuery.includes('feature') || normalizedQuery.includes('what can you do')) {
    return {
      message: "The Student Risk Monitoring System helps educators identify and support at-risk students. The system analyzes multiple data points including attendance, assignment completion, engagement metrics, and student feedback to calculate risk scores.",
      recommendations: [
        "Use the Radar View to visualize risk factors",
        "Switch to Table View for detailed student information",
        "Try Distribution View to see risk patterns across the school",
        "Filter by risk level to focus on specific student groups"
      ]
    };
  }
  // Intervention query
  else if (normalizedQuery.includes('intervention') || normalizedQuery.includes('help') || 
           normalizedQuery.includes('support') || normalizedQuery.includes('plan')) {
    return {
      message: `Based on ${name}'s current data, here are intervention recommendations:`,
      recommendations: getInterventionRecommendations(student)
    };
  }
  // General query/default response
  else {
    return {
      message: `I can help you analyze ${name}'s data and provide recommendations. You can ask about risk factors, attendance, academic performance, engagement, recent feedback, or request specific interventions.`,
      recommendations: [
        "Try asking 'What's causing the high risk score?'",
        "Ask 'What interventions do you recommend?'",
        "Ask 'How does the risk assessment system work?'"
      ]
    };
  }
};

// Helper functions for generating detailed mock responses
const getRiskAssessment = (student) => {
  const risks = student.detailedRisks || {};
  
  // Find the highest risk factors
  const riskFactors = Object.entries(risks).sort((a, b) => b[1] - a[1]);
  
  if (riskFactors.length === 0) {
    return "No detailed risk breakdown is available.";
  }
  
  const topRisks = riskFactors.slice(0, 2).map(([factor, score]) => 
    `${factor} (${score}%)`
  ).join(' and ');
  
  return `The primary areas of concern are ${topRisks}.`;
};

const getRiskRecommendations = (student) => {
  const score = student.RiskScore || student.riskScore || 50;
  
  if (score >= 70) {
    return [
      "Schedule immediate counseling session",
      "Initiate parent/guardian communication",
      "Create a daily check-in protocol",
      "Develop a customized intervention plan",
      "Consider academic accommodation options"
    ];
  } else if (score >= 30) {
    return [
      "Schedule bi-weekly check-ins",
      "Review academic progress areas",
      "Consider study support resources",
      "Monitor engagement metrics closely",
      "Provide positive reinforcement for improvements"
    ];
  } else {
    return [
      "Continue current support systems",
      "Recognize positive achievements",
      "Consider enrichment opportunities",
      "Maintain regular check-ins"
    ];
  }
};

const getAttendanceAssessment = (attendance) => {
  if (attendance < 80) {
    return "This is significantly below the target attendance rate and requires immediate attention.";
  } else if (attendance < 90) {
    return "This is below the target attendance rate and should be monitored.";
  } else {
    return "This is within or above the target attendance rate.";
  }
};

const getAttendanceRecommendations = (attendance) => {
  if (attendance < 80) {
    return [
      "Schedule attendance intervention meeting",
      "Create attendance contract with daily check-ins",
      "Investigate underlying causes (health, transportation, etc.)",
      "Consider home visit or family outreach"
    ];
  } else if (attendance < 90) {
    return [
      "Monitor attendance patterns for specific days/periods",
      "Check in with student about any barriers to attendance",
      "Send attendance reminder communications",
      "Recognize improvement with positive reinforcement"
    ];
  } else {
    return [
      "Maintain current attendance support",
      "Recognize consistent attendance",
      "Continue regular monitoring"
    ];
  }
};

const getAcademicAssessment = (assignments) => {
  if (assignments < 70) {
    return "This completion rate indicates significant academic risk.";
  } else if (assignments < 85) {
    return "This completion rate suggests some academic challenges.";
  } else {
    return "This completion rate indicates good academic engagement.";
  }
};

const getAcademicRecommendations = (assignments, riskLevel) => {
  if (assignments < 70) {
    return [
      "Create assignment completion plan with daily goals",
      "Schedule academic intervention session",
      "Consider tutoring or additional support resources",
      "Review for learning accommodations that may be needed",
      "Break down assignments into manageable parts"
    ];
  } else if (assignments < 85) {
    return [
      "Identify specific assignment types that are challenging",
      "Provide additional guidance on upcoming assignments",
      "Consider peer study groups or collaborative options",
      "Check in on assignment progress weekly"
    ];
  } else {
    return [
      "Maintain current academic support",
      "Consider advanced or enrichment opportunities",
      "Provide positive reinforcement for consistent work"
    ];
  }
};

const getEngagementAssessment = (engagement) => {
  if (engagement < 60) {
    return "This indicates significant disengagement that requires intervention.";
  } else if (engagement < 80) {
    return "This indicates moderate engagement that could be improved.";
  } else {
    return "This indicates good engagement with learning activities.";
  }
};

const getEngagementRecommendations = (engagement) => {
  if (engagement < 60) {
    return [
      "Schedule student interest inventory to identify motivators",
      "Create engagement plan with student input",
      "Consider alternative learning approaches or materials",
      "Implement frequent positive feedback opportunities",
      "Check for potential barriers to engagement"
    ];
  } else if (engagement < 80) {
    return [
      "Identify specific activities or subjects with lower engagement",
      "Incorporate more interactive or hands-on elements",
      "Consider cooperative learning opportunities",
      "Provide more frequent feedback and encouragement"
    ];
  } else {
    return [
      "Maintain current engagement strategies",
      "Consider leadership or mentoring opportunities",
      "Allow for deeper exploration of interest areas"
    ];
  }
};

const getFeedbackAssessment = (feedback, riskLevel) => {
  if (riskLevel === 'high') {
    return "This feedback suggests significant distress or disengagement.";
  } else if (riskLevel === 'medium') {
    return "This feedback indicates some challenges that should be addressed.";
  } else {
    return "This feedback is generally positive.";
  }
};

const getFeedbackRecommendations = (riskLevel) => {
  if (riskLevel === 'high') {
    return [
      "Schedule 1:1 conversation to explore concerns",
      "Consider counseling referral if emotional concerns present",
      "Follow up on specific issues mentioned in feedback",
      "Create opportunities for positive experiences"
    ];
  } else if (riskLevel === 'medium') {
    return [
      "Follow up on specific challenges mentioned",
      "Provide additional support in challenging areas",
      "Check in regularly to monitor progress",
      "Create opportunities for success and positive feedback"
    ];
  } else {
    return [
      "Continue to provide regular feedback opportunities",
      "Recognize positive attitudes and engagement",
      "Encourage continued participation and effort"
    ];
  }
};

const getInterventionRecommendations = (student) => {
  const score = student.RiskScore || student.riskScore || 50;
  const risks = student.detailedRisks || {};
  
  // Base recommendations on risk level
  const baseRecs = getRiskRecommendations(student);
  
  // Add specific recommendations based on risk factors
  const specificRecs = [];
  
  if (risks.attendance && risks.attendance > 60) {
    specificRecs.push("Implement attendance improvement plan with daily check-ins");
  }
  
  if (risks.academic && risks.academic > 60) {
    specificRecs.push("Provide targeted academic support in challenging areas");
  }
  
  if (risks.engagement && risks.engagement > 60) {
    specificRecs.push("Create personalized engagement strategies based on interests");
  }
  
  if (risks.emotional && risks.emotional > 60) {
    specificRecs.push("Consider emotional support resources or counseling referral");
  }
  
  if (risks.behavioral && risks.behavioral > 60) {
    specificRecs.push("Implement behavior support plan with clear expectations");
  }
  
  // Combine recommendations (avoid duplicates)
  return [...new Set([...specificRecs, ...baseRecs])].slice(0, 5);
};