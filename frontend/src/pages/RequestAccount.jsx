import React, { useState } from "react";
import { AccountRequest } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Heart } from "lucide-react";

export default function RequestAccount() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    relation: '',
    organization: '',
    location: '',
    description: '',
    supporting_links: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.relation) {
      return;
    }
    setIsSubmitting(true);
    
    try {
      await AccountRequest.create(formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting account request:', error);
    }
    
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="floating-card bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20">
          <div className="w-16 h-16 accent-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-slate-800" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-4">Request Submitted</h1>
          <p className="text-xl text-slate-600 mb-8">
            Thank you for your submission. Our team will review your request and get back to you within 48 hours.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="accent-gradient text-slate-800 rounded-full px-8"
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
          Request an Account
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Requesting an account allows you to create and manage a case page on CaseClosure. 
          Please provide as much detail as possible so our team can verify your request.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="floating-card bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <UserPlus className="w-6 h-6 text-slate-600" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} placeholder="Your first name" required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} placeholder="Your last name" required className="rounded-xl" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="your@email.com" required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Cell Phone</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="(555) 123-4567" className="rounded-xl" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label htmlFor="relation">Relation to Case *</Label>
                  <Select value={formData.relation} onValueChange={(value) => handleInputChange('relation', value)} required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select your relation..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Family Member">Family Member</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Law Enforcement">Law Enforcement</SelectItem>
                      <SelectItem value="Private Investigator">Private Investigator</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Concerned Citizen">Concerned Citizen</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (if applicable)</Label>
                  <Input id="organization" value={formData.organization} onChange={(e) => handleInputChange('organization', e.target.value)} placeholder="e.g., Austin Police Dept." className="rounded-xl" />
                </div>
              </div>

               <div className="space-y-2">
                  <Label htmlFor="location">Your Location</Label>
                  <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="e.g., Austin, TX" className="rounded-xl" />
                </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Please describe the case or your reason for needing an account..." rows={5} required className="rounded-xl" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supporting_links">Supporting Links</Label>
                <Textarea id="supporting_links" value={formData.supporting_links} onChange={(e) => handleInputChange('supporting_links', e.target.value)} placeholder="Paste links to news articles, social media, GoFundMe, etc. (one per line)" rows={3} className="rounded-xl" />
                <p className="text-xs text-slate-500">Provide any links that can help us verify the case and your connection to it.</p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full accent-gradient text-slate-800 hover:shadow-lg transition-all duration-300 rounded-xl py-3 text-lg font-semibold">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}