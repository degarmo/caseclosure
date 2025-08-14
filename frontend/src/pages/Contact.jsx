import React, { useState } from "react";
import { ContactInquiry } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Heart } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiry_type: 'general',
    subject: '',
    message: '',
    case_reference: ''
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
    setIsSubmitting(true);
    
    try {
      await ContactInquiry.create(formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiry_type: 'general',
        subject: '',
        message: '',
        case_reference: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
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
          <h1 className="text-3xl font-bold gradient-text mb-4">Thank You</h1>
          <p className="text-xl text-slate-600 mb-8">
            Your message has been received. We understand the urgency of your situation 
            and will respond within 24 hours.
          </p>
          <Button 
            onClick={() => setSubmitted(false)}
            className="accent-gradient text-slate-800 rounded-full px-8"
          >
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
          Contact Us
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          We're here to support you every step of the way. Reach out with questions, 
          concerns, or if you need help getting started.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="floating-card bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <MessageSquare className="w-6 h-6 text-slate-600" />
              Send us a Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your full name"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiry_type">Inquiry Type *</Label>
                  <Select 
                    value={formData.inquiry_type}
                    onValueChange={(value) => handleInputChange('inquiry_type', value)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="case_submission">New Case Submission</SelectItem>
                      <SelectItem value="press">Media/Press</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Brief description of your inquiry"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case_reference">Case Reference (if applicable)</Label>
                <Input
                  id="case_reference"
                  value={formData.case_reference}
                  onChange={(e) => handleInputChange('case_reference', e.target.value)}
                  placeholder="Existing case name or reference number"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Please provide as much detail as possible about your inquiry..."
                  rows={6}
                  required
                  className="rounded-xl"
                />
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full accent-gradient text-slate-800 hover:shadow-lg transition-all duration-300 rounded-xl py-3 text-lg font-semibold"
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}