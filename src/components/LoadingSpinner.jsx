// src/components/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="spinner">
      <div className="spinner-circle"></div>
      <div className="spinner-circle inner"></div>
    </div>
  );
};

export default LoadingSpinner;