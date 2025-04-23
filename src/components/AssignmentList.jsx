// src/components/AssignmentList.jsx
import React from 'react';
import './AssignmentList.css';

const AssignmentList = ({ assignments, onStatusChange }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
  };
  
  const getUrgencyClass = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  };

  return (
    <div className="assignment-list">
      {assignments.length === 0 ? (
        <div className="no-assignments">
          <p>No upcoming assignments!</p>
        </div>
      ) : (
        assignments.map(assignment => (
          <div 
            className={`assignment-item ${getUrgencyClass(assignment.dueDate)}`} 
            key={assignment.id}
          >
            <div className="assignment-info">
              <h3>{assignment.title}</h3>
              <p className="assignment-course">{assignment.course}</p>
              <div className="assignment-meta">
                <span className="due-date">Due: {formatDate(assignment.dueDate)}</span>
                <span className={`time-remaining ${getUrgencyClass(assignment.dueDate)}`}>
                  {getDaysRemaining(assignment.dueDate)}
                </span>
              </div>
            </div>
            
            <div className="assignment-actions">
              <select 
                value={assignment.status} 
                onChange={(e) => onStatusChange(assignment.id, e.target.value)}
                className={`status-select ${assignment.status}`}
              >
                <option value="pending">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AssignmentList;