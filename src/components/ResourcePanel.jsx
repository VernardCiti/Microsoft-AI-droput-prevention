// src/components/ResourcePanel.jsx
import React from 'react';
import './ResourcePanel.css';

const ResourcePanel = ({ counselor, resources }) => {
  return (
    <div className="resource-panel">
      <div className="counselor-card">
        <h3>Your Counselor</h3>
        <div className="counselor-info">
          <div className="counselor-avatar">
            {counselor.charAt(0)}
          </div>
          <div className="counselor-details">
            <p className="counselor-name">{counselor}</p>
            <button className="contact-btn">Schedule Meeting</button>
          </div>
        </div>
      </div>
      
      {resources.map((category, index) => (
        <div className="resource-category" key={index}>
          <h3>{category.title}</h3>
          <ul className="resource-list">
            {category.items.map((resource, idx) => (
              <li key={idx} className="resource-item">
                <a href={resource.link} className="resource-link">
                  {resource.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      
      <div className="emergency-support">
        <h3>Need Immediate Support?</h3>
        <p>If you're experiencing a crisis or need immediate help:</p>
        <button className="emergency-btn">Access Crisis Resources</button>
      </div>
    </div>
  );
};

export default ResourcePanel;