// frontend/src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, Loader2, Shield, CheckCircle, InfoIcon, UserPlus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/utils/axios";

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [betaMode, setBetaMode] = useState(null); // null = loading, true/false = loaded
  
  // NEW: Check for case invitation code from URL
  const caseInvitationCode = searchParams.get('invitation_code');
  const isCaseInvitation = !!caseInvitationCode;
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    invite_code: "",
    invitation_code: caseInvitationCode || "" // NEW: Include case invitation code
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check beta mode status on mount
  useEffect(() => {
    checkBetaMode();
  }, []);

  const checkBetaMode = async () => {
    try {
      const response = await api.get('/auth/settings/public/invite-status/');
      console.log('Beta mode response:', response.data);
      // Use is_invite_only or fall back to can_register logic
      setBetaMode(response.data.is_invite_only === true);
    } catch (error) {
      console.error('Error checking beta mode:', error);
      // Default to invite-only if API fails
      setBetaMode(true);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user types
    if (error) setError("");
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // NEW: If it's a case invitation, don't require admin invite code
    if (!isCaseInvitation && betaMode) {
      if (!formData.invite_code) {
        errors.invite_code = "Invite code is required";
      } else if (formData.invite_code.length !== 8) {
        errors.invite_code = "Invite code must be 8 characters";
      }
    }
    
    // Validate email
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Validate password
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    // NEW: For case invitations, require first and last name
    if (isCaseInvitation) {
      if (!formData.first_name || !formData.first_name.trim()) {
        errors.first_name = "First name is required";
      }
      if (!formData.last_name || !formData.last_name.trim()) {
        errors.last_name = "Last name is required";
      }
    }
    
    // Names are optional for normal signup but validate if provided
    if (formData.first_name && formData.first_name.length > 100) {
      errors.first_name = "First name is too long";
    }
    if (formData.last_name && formData.last_name.length > 100) {
      errors.last_name = "Last name is too long";
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const registrationData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim()
      };

      // NEW: Include case invitation code if present (takes priority)
      if (isCaseInvitation) {
        registrationData.invitation_code = caseInvitationCode;
      }
      // Only include admin invite code if beta mode is enabled AND no case invitation
      else if (betaMode) {
        registrationData.invite_code = formData.invite_code.toUpperCase().trim();
      }

      console.log('Registration data:', registrationData);

      const response = await api.post("auth/register/", registrationData, {
        headers: { "Content-Type": "application/json" },
      });

      // Registration successful
      if (isCaseInvitation && response.data.case_title) {
        setSuccess(`Welcome! You now have access to ${response.data.case_title}`);
      } else {
        setSuccess("Registration successful! Welcome to CaseClosure.");
      }
      
      // Store tokens and user data if provided
      if (response.data.access && response.data.refresh) {
        localStorage.setItem("access", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);
        
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        
        // NEW: If case invitation signup, redirect to the specific case
        if (response.data.case_id) {
          console.log('Redirecting to case:', response.data.case_id);
          setTimeout(() => {
            navigate(`/cases/${response.data.case_id}`);
          }, 1500);
        } else {
          // Normal signup - redirect to dashboard
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        }
      } else {
        // Redirect to signin page if no tokens
        setTimeout(() => {
          navigate("/signin", { 
            state: { 
              message: "Registration successful! Please sign in.",
              email: formData.email 
            } 
          });
        }, 1500);
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle field errors
        if (errorData.field_errors) {
          setFieldErrors(errorData.field_errors);
          setError(errorData.error || "Please correct the errors below.");
        }
        else if (errorData.invite_code || errorData.invitation_code || errorData.email || errorData.password) {
          const errors = {};
          if (errorData.invite_code) {
            errors.invite_code = Array.isArray(errorData.invite_code) 
              ? errorData.invite_code[0] 
              : errorData.invite_code;
          }
          if (errorData.invitation_code) {
            errors.invitation_code = Array.isArray(errorData.invitation_code) 
              ? errorData.invitation_code[0] 
              : errorData.invitation_code;
          }
          if (errorData.email) {
            errors.email = Array.isArray(errorData.email) 
              ? errorData.email[0] 
              : errorData.email;
          }
          if (errorData.password) {
            errors.password = Array.isArray(errorData.password) 
              ? errorData.password[0] 
              : errorData.password;
          }
          if (errorData.first_name) {
            errors.first_name = Array.isArray(errorData.first_name) 
              ? errorData.first_name[0] 
              : errorData.first_name;
          }
          if (errorData.last_name) {
            errors.last_name = Array.isArray(errorData.last_name) 
              ? errorData.last_name[0] 
              : errorData.last_name;
          }
          setFieldErrors(errors);
          setError("Please correct the errors below.");
        }
        else if (errorData.error) {
          setError(errorData.error);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError("Registration failed. Please check your information and try again.");
        }
      } else if (err.request) {
        setError("Cannot connect to server. Please check your connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    console.log("Google signup clicked");
  };

  if (betaMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="space-y-1 pb-8 pt-10 px-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" 
                   style={{
                     background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                   }}>
                <User className="w-8 h-8 text-slate-800" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center text-slate-800">
              {isCaseInvitation ? "Accept Invitation" : "Create Your Account"}
            </CardTitle>
            <p className="text-center text-slate-600">
              {isCaseInvitation 
                ? "You've been invited to collaborate on a case"
                : betaMode 
                  ? "Enter your invite code to get started"
                  : "Join CaseClosure today"
              }
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            {/* NEW: Case Invitation Alert */}
            {isCaseInvitation && (
              <Alert className="border-blue-200 bg-blue-50">
                <UserPlus className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You're signing up with a case invitation. Complete the form below to get immediate access.
                </AlertDescription>
              </Alert>
            )}

            {/* Success/Error Messages */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Sign Up - Only show if NOT a case invitation */}
            {!isCaseInvitation && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignup}
                  disabled={true}
                  className="w-full h-12 rounded-xl border-2 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 opacity-50" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google (Coming Soon)
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">
                      {betaMode ? "Sign up with invite code" : "Create your account"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Admin Invite Code Field - Only show if beta mode AND NOT a case invitation */}
              {betaMode === true && !isCaseInvitation && (
                <div className="space-y-2">
                  <Label htmlFor="invite_code">
                    Invite Code <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="invite_code"
                      type="text"
                      value={formData.invite_code}
                      onChange={(e) => handleInputChange('invite_code', e.target.value.toUpperCase())}
                      placeholder="XXXXXXXX"
                      className={`pl-10 rounded-xl h-12 uppercase font-mono tracking-wider ${
                        fieldErrors.invite_code ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      required={betaMode && !isCaseInvitation}
                      disabled={isLoading}
                      maxLength={8}
                    />
                  </div>
                  {fieldErrors.invite_code && (
                    <p className="text-sm text-red-600">{fieldErrors.invite_code}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Enter your 8-character invite code.{' '}
                    <Link to="/request-account" className="text-blue-600 hover:underline">
                      Don't have one? Request access
                    </Link>
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={
                      isCaseInvitation 
                        ? "Enter your email address"
                        : betaMode 
                          ? "Use the same email from your request" 
                          : "Enter your email"
                    }
                    className={`pl-10 rounded-xl h-12 ${
                      fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-red-600">{fieldErrors.email}</p>
                )}
                {betaMode === true && !isCaseInvitation && (
                  <p className="text-xs text-slate-500">
                    Must match the email address your invite code was sent to
                  </p>
                )}
                {isCaseInvitation && (
                  <p className="text-xs text-slate-500">
                    Use the email address where you received the invitation
                  </p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name {isCaseInvitation && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="John"
                    className={`rounded-xl h-12 ${
                      fieldErrors.first_name ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    required={isCaseInvitation}
                    disabled={isLoading}
                  />
                  {fieldErrors.first_name && (
                    <p className="text-sm text-red-600">{fieldErrors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name {isCaseInvitation && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Doe"
                    className={`rounded-xl h-12 ${
                      fieldErrors.last_name ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    required={isCaseInvitation}
                    disabled={isLoading}
                  />
                  {fieldErrors.last_name && (
                    <p className="text-sm text-red-600">{fieldErrors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="At least 8 characters"
                    className={`pl-10 pr-10 rounded-xl h-12 ${
                      fieldErrors.password ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-600">{fieldErrors.password}</p>
                )}
                <p className="text-xs text-slate-500">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || betaMode === null}
                className="w-full text-slate-800 hover:shadow-lg transition-all duration-300 rounded-xl h-12 text-lg font-semibold"
                style={{
                  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : isCaseInvitation ? (
                  'Accept Invitation & Sign Up'
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-slate-800 hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-slate-500">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-slate-700">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}