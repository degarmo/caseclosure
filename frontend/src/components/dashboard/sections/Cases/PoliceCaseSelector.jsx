// src/components/dashboard/sections/Cases/PoliceCaseSelector.jsx
import React, { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from '../../../../utils/axios';

export default function PoliceCaseSelector({ selectedCaseId, onSelectCase, permissions }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAccessibleCases();
  }, []);

  const fetchAccessibleCases = async () => {
    try {
      setLoading(true);
      // Get cases user has access to (either owns or has CaseAccess)
      const response = await axios.get('/cases/');
      
      let caseList = Array.isArray(response.data) ? response.data : (response.data.results || []);
      
      // Filter to readable items
      caseList = caseList.filter(c => 
        c && (c.case_title || c.first_name || c.last_name)
      );
      
      setCases(caseList);
      
      // Auto-select first case if none selected
      if (!selectedCaseId && caseList.length > 0) {
        onSelectCase(caseList[0].id);
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const title = c.case_title || `${c.first_name} ${c.last_name}`;
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  if (!permissions?.canViewAllCases) {
    return null;
  }

  return (
    <div className="w-full max-w-xs">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Select Case
        </h3>

        {/* Main Selector Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
        >
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {selectedCase?.case_title || `${selectedCase?.first_name} ${selectedCase?.last_name}` || 'Select...'}
            </p>
          </div>
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute mt-2 w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Case List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading cases...
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No cases found
                </div>
              ) : (
                filteredCases.map(caseItem => (
                  <button
                    key={caseItem.id}
                    onClick={() => {
                      onSelectCase(caseItem.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                      selectedCaseId === caseItem.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {caseItem.case_title || `${caseItem.first_name} ${caseItem.last_name}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {caseItem.case_type} • {caseItem.crime_type || 'N/A'}
                        </p>
                      </div>
                      {selectedCaseId === caseItem.id && (
                        <CheckCircleIcon className="w-4 h-4 text-indigo-600 ml-2 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        )}

        {/* Case Stats */}
        {selectedCase && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                selectedCase.deployment_status === 'deployed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {selectedCase.deployment_status || 'not_deployed'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Access Type:</span>
              <span className="text-gray-900 dark:text-white font-medium">Read-Only</span>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={fetchAccessibleCases}
          className="w-full mt-3 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
        >
          Refresh Cases
        </button>
      </div>
    </div>
  );
}