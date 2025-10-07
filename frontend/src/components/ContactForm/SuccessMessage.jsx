// src/components/ContactForm/SuccessMessage.jsx
import React from 'react';
import './ContactForm.css';

const SuccessMessage = ({ onClose }) => {
  return (
    <div className="success-message-container">
      <div className="success-icon">✓</div>
      <h3>Message Sent Successfully!</h3>
      <p>
        Thank you for reaching out. We've received your message and will 
        respond as soon as possible.
      </p>
      <button onClick={onClose} className="close-button">
        Send Another Message
      </button>
    </div>
  );
};

export default SuccessMessage;