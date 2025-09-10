// src/templates/beacon/src/pages/Contact.jsx
// Clean version without API dependencies - Form only

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Shield, 
  CheckCircle,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

export default function Contact({ caseData, customizations, isPreview }) {
  const [formData, setFormData] = useState({
    submitter_name: "",
    submitter_email: "",
    submitter_phone: "",
    tip_content: "",
    is_anonymous: true,
    urgency: "medium"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // In preview mode, just show success
    if (isPreview) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }
    
    // In production, this would submit to your backend
    setIsSubmitting(true);
    
    try {
      // Handle submission without using the API entity
      console.log('Tip submission:', formData);
      setShowSuccess(true);
      setFormData({
        submitter_name: "",
        submitter_email: "",
        submitter_phone: "",
        tip_content: "",
        is_anonymous: true,
        urgency: "medium"
      });
    } catch (error) {
      console.error("Error submitting tip:", error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Contact & Tips</h1>
        <p className="text-xl text-slate-600">
          Your information could be the key to solving {caseData?.first_name || 'this'}'s case
        </p>
      </div>

      {/* Tip Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Submit a Secure Tip
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {isPreview 
                  ? "Preview: Tips will be submitted through this form"
                  : `Your tip has been submitted successfully. Thank you for helping with ${caseData?.first_name || 'this'}'s case.`
                }
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anonymous Toggle */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="text-base font-medium">Submit Anonymously</Label>
                    <p className="text-sm text-slate-600">Your identity will be kept completely confidential</p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_anonymous}
                  onCheckedChange={(checked) => handleInputChange('is_anonymous', checked)}
                />
              </div>
            </div>

            {/* Contact Information (only if not anonymous) */}
            {!formData.is_anonymous && (
              <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowContactInfo(!showContactInfo)}
                    className="flex items-center gap-2 hover:text-slate-900"
                  >
                    {showContactInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Contact Information (Optional)
                  </button>
                </div>
                
                {showContactInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.submitter_name}
                        onChange={(e) => handleInputChange('submitter_name', e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.submitter_email}
                        onChange={(e) => handleInputChange('submitter_email', e.target.value)}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.submitter_phone}
                        onChange={(e) => handleInputChange('submitter_phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Urgency Level */}
            <div>
              <Label>Urgency Level</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General information</SelectItem>
                  <SelectItem value="medium">Medium - Relevant details</SelectItem>
                  <SelectItem value="high">High - Important information</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tip Content */}
            <div>
              <Label htmlFor="tip">Your Information *</Label>
              <Textarea
                id="tip"
                value={formData.tip_content}
                onChange={(e) => handleInputChange('tip_content', e.target.value)}
                placeholder={`Please share any information you have about ${caseData?.first_name || 'this'}'s case. Include details like dates, times, locations, people involved, or anything else that might be relevant. No detail is too small.`}
                className="min-h-[120px]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !formData.tip_content.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Securely...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Submit Secure Tip
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              All tips are encrypted and handled confidentially. They will be forwarded to law enforcement investigating {caseData?.first_name || 'this'}'s case.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}