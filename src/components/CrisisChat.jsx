// src/components/CrisisChat.jsx
import React, { useState } from 'react';
import { triggerIntervention } from '../services/copilot';


const CrisisChat = () => {
  const [message, setMessage] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    await triggerIntervention(message);
    setMessage('');
  };

  return (
    <div className="chat-container">
      <form onSubmit={handleSubmit}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default CrisisChat;
