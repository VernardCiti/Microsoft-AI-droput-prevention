// src/components/CopilotWidget.jsx
import React from 'react';

const CopilotWidget = () => (
  <div style={{ margin: "20px 0" }}>
    <h2>Homework Help Chat</h2>
    <iframe
      src="https://web.powerva.microsoft.com/embed/COPILOT_ID" // Replace COPILOT_ID with your actual Copilot widget ID
      width="100%"
      height="500px"
      frameBorder="0"
      title="Copilot Chat"
    />
  </div>
);

export default CopilotWidget;
