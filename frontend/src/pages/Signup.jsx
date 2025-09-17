// frontend/src/pages/Signup.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, Loader2, Shield, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axios";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    invite_code: ""
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear both general and field-specific errors when user types
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
    
    // Validate invite code
    if (!formData.invite_code) {
      errors.invite_code = "Invite code is required";
    } else if (formData.invite_code.length !== 8) {
      errors.invite_code = "Invite code must be 8 characters";
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
    
    // Names are optional but validate if provided
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
        last_name: formData.last_name.trim(),
        invite_code: formData.invite_code.toUpperCase().trim()
      };

      const response = await api.post("auth/register/", registrationData, {
        headers: { "Content-Type": "application/json" },
      });

      // Registration successful
      setSuccess("Registration successful! Welcome to CaseClosure.");
      
      // Store tokens and user data if provided
      if (response.data.access && response.data.refresh) {
        localStorage.setItem("access", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);
        
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        
        // Redirect directly to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
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
      
      // Handle different error types from backend
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Check for field_errors object first (our custom format)
        if (errorData.field_errors) {
          setFieldErrors(errorData.field_errors);
          
          // Set general error message if provided
          if (errorData.error) {
            setError(errorData.error);
          } else {
            setError("Please correct the errors below.");
          }
        }
        // Check for direct field errors (DRF default format)
        else if (errorData.invite_code || errorData.email || errorData.password) {
          const errors = {};
          if (errorData.invite_code) {
            errors.invite_code = Array.isArray(errorData.invite_code) 
              ? errorData.invite_code[0] 
              : errorData.invite_code;
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
          setFieldErrors(errors);
          setError("Please correct the errors below.");
        }
        // General error message
        else if (errorData.error) {
          setError(errorData.error);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else if (errorData.non_field_errors) {
          setError(Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors);
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError("Registration failed. Please check your information and try again.");
        }
      } else if (err.request) {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    setError("Google signup will be available after the beta period.");
    setTimeout(() => setIsGoogleLoading(false), 2000);
  };

  // Show success state
  if (success && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md floating-card bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CaseClosure!</h2>
            <p className="text-gray-600 mb-4">{success}</p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-16 h-16 accent-gradient rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-slate-800" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold gradient-text mb-2">Create Account</h1>
          <p className="text-slate-600">Join CaseClosure to honor your loved one</p>
        </div>

        <Card className="floating-card bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Sign Up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Beta Notice */}
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Invite-Only Beta:</strong> You'll need an invite code from your account request approval email.
              </AlertDescription>
            </Alert>

            {/* Success Message */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google OAuth Button - Disabled during beta */}
            <Button
              onClick={handleGoogleSignup}
              variant="outline"
              className="w-full h-12 text-slate-400 border-slate-200 cursor-not-allowed rounded-xl opacity-50"
              disabled={true}
              title="Google signup will be available after beta"
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
                <span className="bg-white px-2 text-slate-500">Sign up with invite code</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invite Code Field - REQUIRED */}
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
                    required
                    disabled={isLoading}
                    maxLength={8}
                  />
                </div>
                {fieldErrors.invite_code && (
                  <p className="text-sm text-red-600">{fieldErrors.invite_code}</p>
                )}
                <p className="text-xs text-slate-500">
                  Check your approval email for your 8-character code. 
                  Don't have one? <Link to="/request-account" className="text-blue-600 hover:underline">Request access</Link>
                </p>
              </div>

              {/* Email - Must match invite code */}
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
                    placeholder="Use the same email from your request"
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
                <p className="text-xs text-slate-500">
                  Must match the email address your invite code was sent to
                </p>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="John"
                    className={`rounded-xl h-12 ${
                      fieldErrors.first_name ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={isLoading}
                  />
                  {fieldErrors.first_name && (
                    <p className="text-sm text-red-600">{fieldErrors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Doe"
                    className={`rounded-xl h-12 ${
                      fieldErrors.last_name ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full accent-gradient text-slate-800 hover:shadow-lg transition-all duration-300 rounded-xl h-12 text-lg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
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

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}