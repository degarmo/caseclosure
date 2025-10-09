// services/deploymentAPI.js
import api from '@/api/axios'; // Import your authenticated axios instance

export const checkSubdomainAvailability = async (subdomain, caseId = null) => {
  try {
    const response = await api.post('/cases/check_subdomain/', {  // ✅ FIXED: hyphen not underscore
      subdomain,
      case_id: caseId  // ✅ Already passing case_id
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to check availability');
  }
};

export const deployCase = async (caseId, deploymentData) => {
  try {
    const response = await api.post(`/cases/${caseId}/deploy/`, deploymentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to deploy');
  }
};

export const updateDeployment = async (caseId, updateData) => {
  try {
    const response = await api.post(`/cases/${caseId}/deploy/`, updateData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update deployment');
  }
};

export const getCaseDeploymentStatus = async (caseId) => {
  try {
    const response = await api.get(`/cases/${caseId}/deployment_status/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get deployment status');
  }
};

export const addCustomDomain = async (caseId, domain) => {
  try {
    const response = await api.post(`/cases/${caseId}/add_custom_domain/`, {
      domain
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add custom domain');
  }
};