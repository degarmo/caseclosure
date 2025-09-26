import React, { useState } from 'react';
import api from '@/utils/axios';

export default function InviteInvestigator({ caseId, onComplete }) {
  const [formData, setFormData] = useState({
    officer_name: '',
    badge_number: '',
    department: '',
    email: '',
    can_view_tips: true,
    can_view_tracking: false,
    can_view_personal_info: false,
    can_export_data: false,
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post(`/cases/${caseId}/invite-investigator/`, formData);
      
      if (response.data.success) {
        alert('Invitation sent successfully!');
        onComplete();
      }
    } catch (error) {
      alert('Failed to send invitation');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Invite Law Enforcement</h3>
      
      <input
        type="text"
        placeholder="Officer Name"
        value={formData.officer_name}
        onChange={(e) => setFormData({...formData, officer_name: e.target.value})}
        required
        className="w-full p-2 border rounded"
      />
      
      <input
        type="email"
        placeholder="Officer Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
        className="w-full p-2 border rounded"
      />
      
      <input
        type="text"
        placeholder="Department"
        value={formData.department}
        onChange={(e) => setFormData({...formData, department: e.target.value})}
        required
        className="w-full p-2 border rounded"
      />
      
      <input
        type="text"
        placeholder="Badge Number"
        value={formData.badge_number}
        onChange={(e) => setFormData({...formData, badge_number: e.target.value})}
        className="w-full p-2 border rounded"
      />
      
      <div className="space-y-2">
        <h4 className="font-medium">Grant Access To:</h4>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.can_view_tips}
            onChange={(e) => setFormData({...formData, can_view_tips: e.target.checked})}
          />
          View Tips & Leads
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.can_view_tracking}
            onChange={(e) => setFormData({...formData, can_view_tracking: e.target.checked})}
          />
          View Visitor Tracking Data
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.can_view_personal_info}
            onChange={(e) => setFormData({...formData, can_view_personal_info: e.target.checked})}
          />
          View Personal Information
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.can_export_data}
            onChange={(e) => setFormData({...formData, can_export_data: e.target.checked})}
          />
          Export Data
        </label>
      </div>
      
      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">
        Send Invitation
      </button>
    </form>
  );
}