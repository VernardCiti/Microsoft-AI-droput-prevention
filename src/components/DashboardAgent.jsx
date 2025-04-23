import React, { useState, useEffect, useRef } from 'react';
import { processAgentQuery } from '../services/agentService';
import { MessageCircle, X, Send, AlertCircle } from 'lucide-react';
import './DashboardAgent.css';

const DashboardAgent = ({ students = [], selectedStudent = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const getRiskLevel = (score) => {
    if (score >= 70) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  };
  
  // Reset when selected student changes
  useEffect(() => {
    if (selectedStudent) {
      resetConversation(selectedStudent);
    }
  }, [selectedStudent]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const resetConversation = (student = null) => {
    // If no student is selected, provide dashboard-level help
    if (!student) {
      setMessages([{
        sender: 'agent',
        text: "I'm your Dashboard Assistant. How can I help you analyze the student data?",
        timestamp: new Date(),
        recommendations: [
          "Summarize high risk students",
          "What patterns do you see in the data?",
          "What interventions would you recommend?"
        ]
      }]);
      return;
    }
    
    // Create welcome message based on student risk level
    const riskLevel = student.RiskScore >= 70 ? 'high' : 
                     student.RiskScore >= 30 ? 'medium' : 'low';
    
    let welcomeMessage;
    const studentName = student.Name || `${student.FirstName || ''} ${student.LastName || ''}`.trim();
    
    if (riskLevel === 'high') {
      welcomeMessage = {
        sender: 'agent',
        text: `I'm analyzing ${studentName}'s data. Their risk score of ${student.RiskScore} indicates high concern. How would you like to address this?`,
        timestamp: new Date(),
        recommendations: [
          "What factors are contributing to their high risk?",
          "What interventions do you recommend?",
          "Show me their recent activity"
        ],
        riskLevel: 'high'
      };
    } else if (riskLevel === 'medium') {
      welcomeMessage = {
        sender: 'agent',
        text: `I'm analyzing ${studentName}'s data. Their risk score of ${student.RiskScore} indicates moderate concern. How can I help you support them?`,
        timestamp: new Date(),
        recommendations: [
          "What areas should we monitor?",
          "What preventative measures do you suggest?",
          "How is their attendance and engagement?"
        ],
        riskLevel: 'medium'
      };
    } else {
      welcomeMessage = {
        sender: 'agent',
        text: `I'm analyzing ${studentName}'s data. Their risk score of ${student.RiskScore} is low. How can I help you maintain their progress?`,
        timestamp: new Date(),
        recommendations: [
          "How can we maintain their positive trajectory?",
          "What enrichment opportunities would you recommend?",
          "What's their current engagement like?"
        ],
        riskLevel: 'low'
      };
    }
    
    setMessages([welcomeMessage]);
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await processAgentQuery(
        input, 
        selectedStudent, 
        students
      );

      const agentMessage = {
        sender: 'agent',
        text: response.message,
        timestamp: new Date(),
        recommendations: response.recommendations || [],
        riskLevel: selectedStudent ? 
          getRiskLevel(selectedStudent.RiskScore) : null,
        isError: response.isError || false
      };
      
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Agent processing error:', error);
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: 'A serious error occurred. Please refresh the page and try again.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleRecommendationClick = (recommendation) => {
    setInput(recommendation);
  };
  
  return (
    <div className={`dashboard-agent ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <button className="agent-toggle" onClick={() => setIsExpanded(true)}>
          <MessageCircle size={20} />
          <span>Ask Assistant</span>
        </button>
      ) : (
        <div className="agent-container">
          <div className="agent-header">
            <h3>
              {selectedStudent ? 
                `Student Assistant: ${selectedStudent.Name || ''}` : 
                'Dashboard Assistant'}
            </h3>
            <button className="close-btn" onClick={() => setIsExpanded(false)}>
              <X size={18} />
            </button>
          </div>
          
          <div className="agent-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.sender === 'user' ? 'user-message' : 'agent-message'} 
                           ${msg.isError ? 'error-message' : ''} 
                           ${msg.riskLevel ? msg.riskLevel + '-risk' : ''}`}
              >
                <div className="message-content">
                  <p>{msg.text}</p>
                  
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="recommendations">
                      <h4>Suggestions:</h4>
                      <ul>
                        {msg.recommendations.map((rec, idx) => (
                          <li 
                            key={idx} 
                            onClick={() => handleRecommendationClick(rec)} 
                            className="recommendation-item"
                          >
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {isLoading && (
              <div className="agent-typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
          
          <div className="agent-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedStudent ? 
                "Ask about this student..." : 
                "Ask about the dashboard data..."}
              rows={2}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="send-btn"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAgent;
