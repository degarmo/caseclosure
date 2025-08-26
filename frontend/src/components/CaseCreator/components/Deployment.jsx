import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Rocket, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X, 
  ChevronRight,
  Copy,
  ExternalLink,
  HelpCircle,
  Info
} from 'lucide-react';
import { deployCaseWebsite, checkDeploymentStatus } from '../services/caseAPI';

const handleDeploy = async (domainConfig) => {
  try {
    const result = await deployCaseWebsite(caseId, domainConfig);
    
    // Poll for status
    const checkStatus = setInterval(async () => {
      const status = await checkDeploymentStatus(caseId);
      if (status.status === 'deployed') {
        clearInterval(checkStatus);
        // Show success
      }
    }, 3000);
  } catch (error) {
    // Handle error
  }
};

// Main Deployment Component with Tutorial
export default function DeploymentFlow({ caseData, onComplete }) {
  const [step, setStep] = useState('domain'); // domain, deploying, complete
  const [domainType, setDomainType] = useState('subdomain');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [error, setError] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dnsInstructions, setDnsInstructions] = useState(null);
  
  // Generate suggested subdomain
  useEffect(() => {
    if (caseData?.first_name && caseData?.last_name && !subdomain) {
      const suggested = `${caseData.first_name}${caseData.last_name}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      setSubdomain(suggested);
    }
  }, [caseData]);

  // Tutorial steps
  const tutorialSteps = [
    {
      title: "Welcome to Website Deployment! 🚀",
      content: "Let's get your memorial website online. This process is simple and takes just a few minutes.",
      target: null,
      position: 'center'
    },
    {
      title: "Choose Your Web Address",
      content: "You have two options: Use a free CaseClosure subdomain (recommended for beginners) or connect your own domain.",
      target: '.domain-selection',
      position: 'bottom'
    },
    {
      title: "Free Subdomain",
      content: "This is the easiest option! Just pick a name and we handle everything. Your site will be at yourname.caseclosure.org",
      target: '.subdomain-option',
      position: 'right'
    },
    {
      title: "Custom Domain",
      content: "If you own a domain (like johndoe.com), you can use it here. You'll need to update some settings with your domain provider.",
      target: '.custom-domain-option',
      position: 'right'
    }
  ];

  const currentTutorial = tutorialSteps[tutorialStep];

  const handleDeploy = async () => {
    setError('');
    
    // Validation
    if (domainType === 'subdomain') {
      if (!subdomain) {
        setError('Please enter a subdomain name');
        return;
      }
      if (subdomain.length < 3) {
        setError('Subdomain must be at least 3 characters');
        return;
      }
      if (!/^[a-z0-9-]+$/.test(subdomain)) {
        setError('Use only lowercase letters, numbers, and hyphens');
        return;
      }
    } else {
      if (!customDomain) {
        setError('Please enter your domain');
        return;
      }
    }

    setStep('deploying');
    setShowTutorial(false);

    try {
      // Call deployment API
      const response = await fetch(`/api/cases/${caseData.id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: domainType === 'subdomain' ? subdomain : '',
          custom_domain: domainType === 'custom' ? customDomain : ''
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Start polling for deployment status
        pollDeploymentStatus(caseData.id);
        
        if (domainType === 'custom') {
          setDnsInstructions(data.dns_instructions);
        }
      } else {
        setError(data.error);
        setStep('domain');
      }
    } catch (err) {
      setError('Deployment failed. Please try again.');
      setStep('domain');
    }
  };

  const pollDeploymentStatus = async (caseId) => {
    const checkStatus = async () => {
      const response = await fetch(`/api/cases/${caseId}/deployment-status`);
      const data = await response.json();
      
      setDeploymentStatus(data);
      
      if (data.status === 'deployed') {
        setStep('complete');
        clearInterval(interval);
      } else if (data.status === 'failed') {
        setError('Deployment failed: ' + data.error);
        setStep('domain');
        clearInterval(interval);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus(); // Check immediately
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Tutorial Overlay Component
  const TutorialOverlay = () => {
    if (!showTutorial || !currentTutorial) return null;

    return (
      <div className="fixed inset-0 z-50">
        {/* Dark backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        
        {/* Tutorial tooltip */}
        <div className={`absolute ${
          currentTutorial.position === 'center' 
            ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            : ''
        } bg-white rounded-lg shadow-xl p-6 max-w-md z-50 animate-fade-in`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{currentTutorial.title}</h3>
            <button
              onClick={() => setShowTutorial(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{currentTutorial.content}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {tutorialSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === tutorialStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {tutorialStep > 0 && (
                <button
                  onClick={() => setTutorialStep(tutorialStep - 1)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Previous
                </button>
              )}
              
              {tutorialStep < tutorialSteps.length - 1 ? (
                <button
                  onClick={() => setTutorialStep(tutorialStep + 1)}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                >
                  Got it!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Domain Selection Step
  const DomainStep = () => (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <Globe className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Choose Your Web Address</h2>
        <p className="text-gray-600">
          This is how people will find your memorial website online
        </p>
      </div>

      <div className="domain-selection space-y-4 mb-6">
        {/* Subdomain Option */}
        <label className="subdomain-option block p-4 border-2 rounded-lg cursor-pointer hover:border-blue-400 transition-colors relative">
          <input
            type="radio"
            value="subdomain"
            checked={domainType === 'subdomain'}
            onChange={(e) => setDomainType(e.target.value)}
            className="sr-only"
          />
          <div className="flex items-start">
            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex items-center justify-center ${
              domainType === 'subdomain' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {domainType === 'subdomain' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Free CaseClosure Subdomain</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Quick and easy setup • No technical knowledge required
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Your site: {subdomain || 'yourname'}.caseclosure.org
              </p>
            </div>
          </div>
        </label>

        {/* Custom Domain Option */}
        <label className="custom-domain-option block p-4 border-2 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
          <input
            type="radio"
            value="custom"
            checked={domainType === 'custom'}
            onChange={(e) => setDomainType(e.target.value)}
            className="sr-only"
          />
          <div className="flex items-start">
            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex items-center justify-center ${
              domainType === 'custom' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {domainType === 'custom' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <span className="font-semibold">Use Your Own Domain</span>
              <p className="text-sm text-gray-600 mt-1">
                Connect a domain you already own • Requires DNS configuration
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Domain Input Fields */}
      {domainType === 'subdomain' && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose your subdomain name
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="yourname"
            />
            <span className="px-4 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
              .caseclosure.org
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Use only lowercase letters, numbers, and hyphens
          </p>
        </div>
      )}

      {domainType === 'custom' && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your domain
          </label>
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example.com or memorial.example.com"
          />
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">DNS Setup Required</p>
                <p className="text-amber-700">
                  After deployment, you'll need to update your domain's DNS settings. 
                  We'll provide simple instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setShowTutorial(true)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Show Tutorial
        </button>
        
        <button
          onClick={handleDeploy}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Rocket className="w-5 h-5" />
          Deploy Website
        </button>
      </div>
    </div>
  );

  // Deploying Step
  const DeployingStep = () => (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <div className="mb-8">
        <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Deploying Your Website</h2>
        <p className="text-gray-600">This usually takes 1-2 minutes...</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <DeploymentStep 
            complete={deploymentStatus?.steps?.files} 
            label="Generating website files" 
          />
          <DeploymentStep 
            complete={deploymentStatus?.steps?.upload} 
            label="Uploading to servers" 
          />
          <DeploymentStep 
            complete={deploymentStatus?.steps?.dns} 
            label="Configuring domain" 
          />
          {domainType === 'custom' && (
            <DeploymentStep 
              complete={deploymentStatus?.steps?.ssl} 
              label="Setting up SSL certificate" 
            />
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Don't close this window while deployment is in progress
      </p>
    </div>
  );

  // Complete Step
  const CompleteStep = () => (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Website is Live! 🎉</h2>
        <p className="text-gray-600">
          Your memorial website has been successfully deployed
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your website URL:
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={deploymentStatus?.url || ''}
            readOnly
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm"
          />
          <button
            onClick={() => copyToClipboard(deploymentStatus?.url)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <Copy className="w-5 h-5" />
          </button>
          <a
            href={deploymentStatus?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            Visit Site <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {domainType === 'custom' && dnsInstructions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Action Required: Update DNS Settings
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            To complete the setup, add these DNS records with your domain provider:
          </p>
          
          <div className="bg-white rounded p-4 font-mono text-sm">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="font-semibold">Type</div>
              <div className="font-semibold">Name</div>
              <div className="font-semibold">Value</div>
              
              <div>CNAME</div>
              <div>{customDomain}</div>
              <div className="flex items-center gap-2">
                <span>cdn.caseclosure.org</span>
                <button
                  onClick={() => copyToClipboard('cdn.caseclosure.org')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-amber-700 mt-3">
            DNS changes can take up to 48 hours to propagate, but usually work within a few hours.
          </p>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to Dashboard
        </button>
        <button
          onClick={() => window.open(deploymentStatus?.url, '_blank')}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Open Website
        </button>
      </div>
    </div>
  );

  // Helper component for deployment steps
  const DeploymentStep = ({ complete, label }) => (
    <div className="flex items-center gap-3">
      {complete ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      )}
      <span className={complete ? 'text-green-700' : 'text-gray-600'}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TutorialOverlay />
      
      {step === 'domain' && <DomainStep />}
      {step === 'deploying' && <DeployingStep />}
      {step === 'complete' && <CompleteStep />}
    </div>
  );
}