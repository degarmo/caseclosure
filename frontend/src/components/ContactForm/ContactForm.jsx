// src/components/ContactForm/ContactForm.jsx
import React, { useState } from 'react';
import { submitContactForm } from '../../services/contactService';
import SuccessMessage from './SuccessMessage';
import './ContactForm.css';

const ContactForm = ({ 
  siteId = null, // null for main site, victimSiteId for memorial sites
  siteName = "Our Team",
  messageTypes = ['Tip', 'Support', 'Question', 'Other']
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    messageType: 'Tip',
    message: '',
    isAnonymous: false,
    honeypot: '', // Spam protection
  });

  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    error: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Clear contact info if anonymous is checked
      ...(name === 'isAnonymous' && checked ? {
        name: '',
        email: '',
        phone: ''
      } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's a bot
    if (formData.honeypot) {
      console.warn('Bot detected');
      return;
    }

    // Validation
    if (!formData.message.trim()) {
      setStatus({ submitting: false, success: false, error: 'Message is required' });
      return;
    }

    if (!formData.isAnonymous && !formData.email && !formData.phone) {
      setStatus({ 
        submitting: false, 
        success: false, 
        error: 'Please provide either email or phone, or check "Submit Anonymously"' 
      });
      return;
    }

    setStatus({ submitting: true, success: false, error: null });

    try {
      const payload = {
        ...formData,
        siteId,
        siteName,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        // Don't send honeypot to backend
        honeypot: undefined,
      };

      await submitContactForm(payload);
      
      setStatus({ submitting: false, success: true, error: null });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        messageType: 'Tip',
        message: '',
        isAnonymous: false,
        honeypot: '',
      });

    } catch (error) {
      setStatus({ 
        submitting: false, 
        success: false, 
        error: error.message || 'Failed to submit message. Please try again.' 
      });
    }
  };

  if (status.success) {
    return <SuccessMessage onClose={() => setStatus(prev => ({ ...prev, success: false }))} />;
  }

  return (
    <div className="contact-form-container">
      <div className="contact-form-header">
        <h2>Contact {siteName}</h2>
        <p>
          {siteId 
            ? "Have information about this case? Share a tip or message of support." 
            : "Get in touch with us. All messages are reviewed by our team."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="contact-form">
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="honeypot"
          value={formData.honeypot}
          onChange={handleChange}
          style={{ display: 'none' }}
          tabIndex="-1"
          autoComplete="off"
        />

        <div className="form-group">
          <label htmlFor="messageType">Message Type *</label>
          <select
            id="messageType"
            name="messageType"
            value={formData.messageType}
            onChange={handleChange}
            required
          >
            {messageTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
            />
            <span>Submit Anonymously</span>
          </label>
          <p className="help-text">
            Your contact information will not be stored or shared
          </p>
        </div>

        {!formData.isAnonymous && (
          <>
            <div className="form-group">
              <label htmlFor="name">Name (Optional)</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <p className="help-text">Provide at least email or phone number</p>
          </>
        )}

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="6"
            placeholder="Your message..."
          />
          <span className="char-count">{formData.message.length} characters</span>
        </div>

        {status.error && (
          <div className="error-message">
            {status.error}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={status.submitting}
        >
          {status.submitting ? 'Submitting...' : 'Submit Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;