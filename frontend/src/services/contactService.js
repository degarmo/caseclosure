// src/services/contactService.js
import api from "@/utils/axios";
import ENV from "@/config/environment";

/**
 * Submit a contact inquiry from the main site
 * @param {Object} data - Contact form data
 * @returns {Promise} API response
 */
export const submitContactInquiry = async (data) => {
  try {
    if (ENV.enableDebugLogging) {
      console.log('[DEV] Contact inquiry submission:', data);
    }

    const response = await api.post('/contact/inquiry', {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      inquiry_type: data.inquiry_type,
      subject: data.subject,
      message: data.message,
      case_reference: data.case_reference || null,
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
    });

    if (ENV.enableDebugLogging) {
      console.log('[DEV] Contact inquiry response:', response.data);
    }

    return response.data;
  } catch (error) {
    console.error('Error submitting contact inquiry:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to submit inquiry. Please try again.'
    );
  }
};

/**
 * Submit a tip from a victim memorial site
 * @param {Object} data - Tip form data
 * @param {string} caseId - The case/site ID this tip is for
 * @returns {Promise} API response
 */
export const submitTip = async (data, caseId) => {
  try {
    if (ENV.enableDebugLogging) {
      console.log('[DEV] Tip submission:', { data, caseId });
    }

    const response = await api.post('/contact/tip', {
      case_id: caseId,
      submitter_name: data.is_anonymous ? null : (data.submitter_name || null),
      submitter_email: data.is_anonymous ? null : (data.submitter_email || null),
      submitter_phone: data.is_anonymous ? null : (data.submitter_phone || null),
      tip_content: data.tip_content,
      is_anonymous: data.is_anonymous,
      urgency: data.urgency,
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
    });

    if (ENV.enableDebugLogging) {
      console.log('[DEV] Tip response:', response.data);
    }

    return response.data;
  } catch (error) {
    console.error('Error submitting tip:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to submit tip. Please try again.'
    );
  }
};

/**
 * Get contact messages for admin dashboard
 * @param {Object} filters - Filter options
 * @returns {Promise} API response with messages
 */
export const getContactMessages = async (filters = {}) => {
  try {
    const response = await api.get('/contact/messages', {
      params: {
        type: filters.type, // 'inquiry' or 'tip'
        case_id: filters.caseId,
        status: filters.status,
        page: filters.page || 1,
        limit: filters.limit || 20,
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    throw error;
  }
};

/**
 * Update message status (for admin)
 * @param {string} messageId - Message ID
 * @param {string} status - New status
 * @returns {Promise} API response
 */
export const updateMessageStatus = async (messageId, status) => {
  try {
    const response = await api.patch(`/contact/messages/${messageId}`, {
      status
    });

    return response.data;
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
};