import React, { useState, useEffect, useRef } from 'react';
import { processAgentQuery } from '../services/agentService';
import './CopilotDialog.css';

const CopilotDialog = ({ student, onClose, resources = [] }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initialize with a welcome message
  useEffect(() => {
    const studentName = student.Name || `${student.FirstName || ''} ${student.LastName || ''}`.trim();
    const riskLevel = student.RiskScore >= 70 ? 'high' : 
                     student.RiskScore >= 30 ? 'medium' : 'low';
    
    // Create an appropriate welcome message based on risk level
    let welcomeMessage;
    if (riskLevel === 'high') {
      welcomeMessage = {
        sender: 'agent',
        text: `I'm your Student Risk Copilot. ${studentName} has a high risk score of ${student.RiskScore}. How would you like to address their situation today?`,
        timestamp: new Date(),
        recommendations: [
          "What factors are contributing to their high risk?",
          "What interventions do you recommend?",
          "Show me their recent feedback"
        ]
      };
    } else if (riskLevel === 'medium') {
      welcomeMessage = {
        sender: 'agent',
        text: `I'm your Student Risk Copilot. ${studentName} has a moderate risk score of ${student.RiskScore}. How can I help you support them?`,
        timestamp: new Date(),
        recommendations: [
          "What areas should we monitor?",
          "What preventative measures do you suggest?",
          "How is their attendance and engagement?"
        ]
      };
    } else {
      welcomeMessage = {
        sender: 'agent',
        text: `I'm your Student Risk Copilot. ${studentName} has a low risk score of ${student.RiskScore}. How can I help you continue their progress?`,
        timestamp: new Date(),
        recommendations: [
          "How can we maintain their positive trajectory?",
          "What enrichment opportunities would you recommend?",
          "What's their current engagement like?"
        ]
      };
    }
    
    setMessages([welcomeMessage]);
  }, [student]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
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
      // Process the query with our agent service
      const response = await processAgentQuery(input, student);
      
      const agentMessage = {
        sender: 'agent',
        text: response.message,
        timestamp: new Date(),
        recommendations: response.recommendations || []
      };
      
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Agent processing error:', error);
      
      const errorMessage = {
        sender: 'agent',
        text: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
    <div className="copilot-dialog-overlay" onClick={(e) => {
      // Close dialog when clicking outside, but not on children
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="copilot-dialog">
        <div className="copilot-header">
          <h3>
            Education Copilot
            <span className="student-name">
              {student.Name || `${student.FirstName || ''} ${student.LastName || ''}`.trim()}
            </span>
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="copilot-messages">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.sender === 'user' ? 'user-message' : 'agent-message'} ${msg.isError ? 'error-message' : ''}`}
            >
              <div className="message-content">
                <p>{msg.text}</p>
                
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h4>Suggestions:</h4>
                    <ul>
                      {msg.recommendations.map((rec, idx) => (
                        <li key={idx} onClick={() => handleRecommendationClick(rec)} className="recommendation-item">
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
        
        <div className="copilot-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about this student or the system..."
            rows={2}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="send-btn"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopilotDialog;