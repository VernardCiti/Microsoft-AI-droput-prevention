// src/services/agentService.js
import { getChatCompletion } from './azureOpenAIService';

export const processAgentQuery = async (query, student, allStudents = []) => {
  try {
    // Handle dashboard-level queries (no specific student selected)
    if (!student) {
      return {
        message: "I can help analyze overall student data. Here are some things you can ask:",
        recommendations: [
          "Show me high risk students",
          "What patterns do you see in attendance?",
          "Compare performance across schools"
        ]
      };
    }

    // Validate student object
    if (!student.StudentID && !student.id) {
      throw new Error("Invalid student data - missing identifier");
    }

    // Create safe context object
    const context = {
      student: {
        id: student.StudentID || student.id,
        name: student.Name || `${student.FirstName || ''} ${student.LastName || ''}`.trim(),
        grade: student.Grade || 'Unknown',
        school: student.School || 'Unknown',
        counselor: student.Counselor || 'Not assigned',
        riskScore: student.RiskScore || 0,
        riskLevel: getRiskLevel(student.RiskScore),
        detailedRisks: student.detailedRisks || {},
        attendance: student.Attendance || 0,
        assignmentsSubmitted: student.AssignmentsSubmitted || 0,
        engagementScore: student.EngagementScore || 0,
        lastFeedback: student.lastFeedback || student.LastFeedback || 'No feedback available',
        counselorNotes: student.Notes || student.counselorNotes || 'No notes available',
        lastLoginDate: formatDate(student.LastLoginDate),
        interventions: student.interventions || 0
      },
      systemStats: {
        totalStudents: allStudents.length,
        highRiskCount: allStudents.filter(s => (s.RiskScore || 0) >= 70).length,
        mediumRiskCount: allStudents.filter(s => (s.RiskScore || 0) >= 30 && (s.RiskScore || 0) < 70).length
      }
    };

    // System prompt
    const systemPrompt = `[Previous content unchanged...]`;
    
    // Call Azure OpenAI with error handling
    const response = await getChatCompletion(systemPrompt, query, context);
    
    if (!response || !response.message) {
      throw new Error("Invalid response from AI service");
    }

    return response;

  } catch (error) {
    console.error("Agent processing error:", error);
    return {
      message: "I encountered an error processing your request. Please try again later.",
      isError: true,
      recommendations: [
        "Refresh the page and try again",
        "Check your internet connection",
        "Contact support if the issue persists"
      ]
    };
  }
};

// Helper functions
const getRiskLevel = (score) => {
  if (score === undefined || score === null) return "unknown";
  if (score >= 70) return "high";
  if (score >= 30) return "medium";
  return "low";
};

const formatDate = (date) => {
  if (!date) return "Unknown";
  if (date instanceof Date) return date.toISOString();
  return String(date);
};