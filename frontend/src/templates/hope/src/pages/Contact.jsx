import React, { useState } from "react";
import { ContactSubmission } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Eye, 
  AlertTriangle,
  Send,
  Shield,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    location: "",
    date_of_incident: "",
    anonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      await ContactSubmission.create(formData);
      setShowSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        location: "",
        date_of_incident: "",
        anonymous: false
      });
      
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("There was an error submitting your information. Please try again or call directly.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="bg-green-500/10 text-green-600 border-green-200 mb-4 px-6 py-2">
            <MessageCircle className="w-4 h-4 mr-2" />
            CONTACT & TIPS
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Have Information About Sarah?
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Any detail, no matter how small, could be the key to bringing Sarah home. 
            Your tip could make all the difference.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Emergency Contact Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Emergency Contact */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Phone className="w-5 h-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 mb-4">
                  If you see Sarah or have immediate safety concerns:
                </p>
                <a href="tel:911" className="block w-full">
                  <Button size="lg" className="w-full bg-red-500 hover:bg-red-600">
                    <Phone className="w-5 h-5 mr-2" />
                    Call 911 Now
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Police Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Police Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900">Case Number</p>
                  <p className="text-gray-600 font-mono">MP2024-001</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Detective</p>
                  <p className="text-gray-600">Det. Michael Rodriguez</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <a href="tel:503-823-0000" className="text-blue-600 hover:underline">
                    (503) 823-0000
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Family Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-500" />
                  Family Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900">Family Liaison</p>
                  <p className="text-gray-600">Jennifer Johnson (Sister)</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <a href="tel:503-555-0123" className="text-blue-600 hover:underline">
                    (503) 555-0123
                  </a>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a href="mailto:findsarah2024@gmail.com" className="text-blue-600 hover:underline">
                    findsarah2024@gmail.com
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Anonymous Tip Line */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Eye className="w-5 h-5" />
                  Anonymous Tip Line
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-600 mb-4 text-sm">
                  You can remain completely anonymous
                </p>
                <a href="tel:1-800-MISSING" className="block w-full">
                  <Button size="lg" variant="outline" className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                    <Phone className="w-5 h-5 mr-2" />
                    1-800-MISSING
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Submit a Tip or Information</CardTitle>
                <p className="text-gray-600">
                  All information is treated confidentially and forwarded to law enforcement
                </p>
              </CardHeader>
              <CardContent>
                {showSuccess && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <AlertTriangle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Thank you! Your information has been submitted and will be reviewed immediately.
                      If this is an emergency, please call 911.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Anonymous Option */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="anonymous"
                      checked={formData.anonymous}
                      onCheckedChange={(checked) => handleInputChange('anonymous', checked)}
                    />
                    <div>
                      <Label htmlFor="anonymous" className="font-medium">
                        Submit anonymously
                      </Label>
                      <p className="text-sm text-gray-500">
                        Check this if you prefer to remain anonymous
                      </p>
                    </div>
                  </div>

                  {/* Personal Information */}
                  {!formData.anonymous && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tip Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Type of Information</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => handleInputChange('subject', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select the type of information" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sighting">Possible Sighting</SelectItem>
                          <SelectItem value="tip">General Tip/Information</SelectItem>
                          <SelectItem value="support">Offer Support/Help</SelectItem>
                          <SelectItem value="media">Media Inquiry</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location (if applicable)</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="Where did this occur?"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_incident">Date (if applicable)</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="date_of_incident"
                            type="date"
                            value={formData.date_of_incident}
                            onChange={(e) => handleInputChange('date_of_incident', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">
                        Information Details <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Please provide as much detail as possible. Include what you saw, when you saw it, and any other relevant information..."
                        className="h-32"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        The more detail you can provide, the more helpful your tip will be.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.subject || !formData.message}
                      size="lg"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Submit Information
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        subject: "",
                        message: "",
                        location: "",
                        date_of_incident: "",
                        anonymous: false
                      })}
                    >
                      Clear Form
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Your Privacy is Protected</p>
                        <p>
                          All information submitted through this form is treated with strict confidentiality 
                          and shared only with law enforcement officials working on Sarah's case.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}