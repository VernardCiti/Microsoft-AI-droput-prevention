// src/services/agentService.js
import { getChatCompletion } from './azureOpenAIService';

// Process agent queries with proper context
export const processAgentQuery = async (query, student, systemContext = {}) => {
  try {
    // Create a context object with relevant system information
    const context = {
      student: {
        id: student.StudentID,
        name: student.Name || `${student.FirstName || ''} ${student.LastName || ''}`.trim(),
        grade: student.Grade,
        school: student.School,
        counselor: student.Counselor,
        riskScore: student.RiskScore,
        riskLevel: getRiskLevel(student.RiskScore),
        detailedRisks: student.detailedRisks || {},
        attendance: student.Attendance,
        assignmentsSubmitted: student.AssignmentsSubmitted,
        engagementScore: student.EngagementScore,
        lastFeedback: student.lastFeedback || student.LastFeedback,
        counselorNotes: student.Notes || student.counselorNotes,
        lastLoginDate: student.LastLoginDate instanceof Date 
          ? student.LastLoginDate.toISOString() 
          : student.LastLoginDate,
        interventions: student.interventions || 0
      },
      systemCapabilities: {
        contactStudent: "Can initiate contact with the student via email or messaging",
        createInterventionPlan: "Can create structured intervention plans for at-risk students",
        scheduleMeeting: "Can schedule meetings with students, counselors, or parents",
        viewDetailedMetrics: "Can access detailed metrics on student performance and engagement",
        recommendResources: "Can recommend educational resources and support services"
      },
      ...systemContext // Allow for additional context to be passed in
    };
    
    // System prompt provides instructions to the AI about how to behave
    const systemPrompt = `
      You are an AI education copilot assistant helping school administrators and counselors with their student risk monitoring system.
      
      You have access to the following STUDENT DATA:
      ${JSON.stringify(context.student, null, 2)}
      
      YOUR ROLE is to help educators by:
      1. Analyzing student data to identify risks or concerns
      2. Suggesting appropriate interventions based on risk factors
      3. Answering questions about the student and the system
      4. Making evidence-based recommendations
      
      RISK LEVELS are defined as:
      - High Risk (70-100): Requires immediate intervention
      - Medium Risk (30-69): Requires monitoring and preventative measures
      - Low Risk (0-29): Maintain support and provide positive reinforcement
      
      RISK FACTORS include:
      - Academic: Based on assignment completion and grades
      - Behavioral: Based on reported incidents and classroom behavior
      - Attendance: Based on presence and participation
      - Engagement: Based on system interaction and class participation
      - Emotional: Based on sentiment analysis of student feedback
      
      SYSTEM CAPABILITIES include:
      ${Object.entries(context.systemCapabilities).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
      
      RESPONSE FORMAT:
      - Keep responses concise and actionable (2-3 paragraphs maximum)
      - When appropriate, include a "Recommendations:" section with 3-5 bullet points
      - Base recommendations on specific risk factors and student data
      - Be professional, supportive, and educational
      
      YOU CAN ACCESS:
      - Current student data and risk assessments
      - Historical attendance and assignment patterns
      - Sentiment analysis of student feedback
      - Intervention tracking and outcomes
    `;
    
    // Call Azure OpenAI
    return await getChatCompletion(systemPrompt, query, context);
    
  } catch (error) {
    console.error("Agent processing error:", error);
    throw error;
  }
};

// Helper function to get risk level string
const getRiskLevel = (score) => {
  if (score >= 70) return "high";
  if (score >= 30) return "medium";
  return "low";
};