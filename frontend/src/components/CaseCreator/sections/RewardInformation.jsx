// src/components/CaseCreator/sections/RewardInformation.jsx

import React from 'react';
import { DollarSign } from 'lucide-react';
import SectionWrapper from '../components/SectionWrapper';
import InputField from '../components/InputField';

/**
 * RewardInformation Section Component
 * Handles reward offering details
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 */
const RewardInformation = ({ 
  caseData, 
  errors, 
  onChange 
}) => {
  
  return (
    <SectionWrapper 
      title="Reward Information" 
      icon={<DollarSign className="w-5 h-5" />}
    >
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={caseData.reward_offered}
            onChange={(e) => onChange('reward_offered', e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm font-medium">Reward is being offered</span>
        </label>
        
        {caseData.reward_offered && (
          <InputField
            label="Reward Amount ($)"
            type="number"
            value={caseData.reward_amount}
            onChange={(value) => onChange('reward_amount', value)}
            placeholder="Enter amount"
            error={errors.reward_amount}
          />
        )}
      </div>
    </SectionWrapper>
  );
};

export default RewardInformation;