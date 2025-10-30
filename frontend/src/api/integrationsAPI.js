// api/integrationsAPI.js
import api from './config';

/**
 * Integrations API methods
 * LLM, Email, File Upload, Image Generation, Data Extraction
 */
const integrationsAPI = {
  invokeLLM: (data) => api.post('/integrations/llm/', data),
  
  sendEmail: (data) => api.post('/integrations/email/', data),
  
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/integrations/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  generateImage: (data) => api.post('/integrations/generate-image/', data),
  
  extractDataFromUploadedFile: (fileId) => 
    api.post('/integrations/extract/', { file_id: fileId }),
};

// Export as Core for backward compatibility
const Core = integrationsAPI;

// Export individual functions for convenience
const InvokeLLM = integrationsAPI.invokeLLM;
const SendEmail = integrationsAPI.sendEmail;
const UploadFile = integrationsAPI.uploadFile;
const GenerateImage = integrationsAPI.generateImage;
const ExtractDataFromUploadedFile = integrationsAPI.extractDataFromUploadedFile;

// Named exports
export { 
  integrationsAPI,
  Core,
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile
};

// Default export
export default integrationsAPI;