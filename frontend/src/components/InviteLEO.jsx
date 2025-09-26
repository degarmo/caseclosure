// src/components/InviteLEO.jsx
import React, { useState } from 'react';
import { Shield, Copy, Mail } from 'lucide-react';
import api from '@/utils/axios';

export default function InviteLEO({ caseId }) {
  const [form, setForm] = useState({
    officer_name: '',
    officer_email: '',
    department: '',
    badge_number: ''
  });
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post(`/cases/${caseId}/invite_leo/`, form);
      setInviteCode(response.data.invite_code);
      
      // Reset form
      setForm({
        officer_name: '',
        officer_email: '',
        department: '',
        badge_number: ''
      });
    } catch (error) {
      alert('Failed to create invitation');
    }
    setLoading(false);
  };
  
  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    alert('Code copied to clipboard');
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Invite Law Enforcement</h2>
        </div>
        
        {!inviteCode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Officer Name *
              </label>
              <input
                type="text"
                required
                value={form.officer_name}
                onChange={(e) => setForm({...form, officer_name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Detective John Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Officer Email *
              </label>
              <input
                type="email"
                required
                value={form.officer_email}
                onChange={(e) => setForm({...form, officer_email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="j.smith@police.gov"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm({...form, department: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="City Police Department"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Badge Number (Optional)
              </label>
              <input
                type="text"
                value={form.badge_number}
                onChange={(e) => setForm({...form, badge_number: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="12345"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">LEO Will Have Access To:</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Read-only case information</li>
                <li>• Tips and messages</li>
                <li>• Basic visitor analytics</li>
                <li>• Spotlight updates</li>
              </ul>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Invitation...' : 'Send Invitation'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-green-800 mb-4">
                Invitation created successfully!
              </p>
              
              <div className="bg-white p-4 rounded-lg border-2 border-dashed">
                <p className="text-sm text-gray-600 mb-2">Access Code:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold">
                    {inviteCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              An email has been sent to the officer with instructions.
            </p>
            
            <button
              onClick={() => setInviteCode('')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Invite Another Officer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}