

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Lock, CheckCircle } from 'lucide-react';

export default function VerifyAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password
  const [formData, setFormData] = useState({
    email: '',
    verification_code: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Enter email and send code
  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/accounts/send-verification/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep(2);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2 & 3: Verify code and create account
  const handleCreateAccount = async () => {
    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/accounts/verify-account/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verification_code,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Account created successfully
        navigate('/create-case');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <Mail className="w-6 h-6" />
            <span className="ml-2 text-sm">Email</span>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <Phone className="w-6 h-6" />
            <span className="ml-2 text-sm">Verify</span>
          </div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <Lock className="w-6 h-6" />
            <span className="ml-2 text-sm">Password</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Complete Your Account Setup</h1>
        
        {/* Step 1: Email */}
        {step === 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter your approved email address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border rounded-lg"
              placeholder="john.doe@email.com"
            />
            <button
              onClick={handleSendCode}
              disabled={loading || !formData.email}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}
        
        {/* Step 2: Verification Code */}
        {step === 2 && (
          <div>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <CheckCircle className="inline w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">
                We've sent a code to your phone ending in ****
              </span>
            </div>
            
            <label className="block text-sm font-medium mb-2">
              Enter 6-digit verification code
            </label>
            <input
              type="text"
              value={formData.verification_code}
              onChange={(e) => setFormData({...formData, verification_code: e.target.value})}
              className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength="6"
            />
            <button
              onClick={() => setStep(3)}
              disabled={formData.verification_code.length !== 6}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
            
            <button
              onClick={handleSendCode}
              className="w-full mt-2 text-blue-600 text-sm hover:underline"
            >
              Resend Code
            </button>
          </div>
        )}
        
        {/* Step 3: Create Password */}
        {step === 3 && (
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Create Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              onClick={handleCreateAccount}
              disabled={loading || !formData.password || !formData.confirm_password}
              className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account & Continue'}
            </button>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}