import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Users, 
  Shield, 
  ArrowRight,
  Star,
  Quote
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Preserving Memories,<br />
              <span className="text-blue-500">Honoring Lives</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Create lasting digital memorials and preserve precious memories of your loved ones 
              with our compassionate, professional remembrance services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("Services")}>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                  Explore Services
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("About")}>
                <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-500 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Families Choose Remember
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We understand the importance of preserving memories and providing support during difficult times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-white fill-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Compassionate Care</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our team understands the sensitivity required when creating memorials. 
                  We handle every detail with the utmost care and respect.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Secure & Private</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your family's memories and information are protected with enterprise-level 
                  security and complete privacy controls.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Family Support</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access helpful resources, tips, and guidance to navigate this difficult 
                  journey with support from our caring community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Stories of Remembrance
            </h2>
            <p className="text-xl text-gray-600">
              Hear from families we've had the honor to serve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-blue-500 mb-4 opacity-50" />
                <p className="text-gray-600 mb-4 leading-relaxed">
                  "Remember helped us create a beautiful tribute for our mother. 
                  The process was handled with such care and sensitivity."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-600 font-medium">SM</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sarah M.</p>
                    <p className="text-sm text-gray-500">Verified Client</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-blue-500 mb-4 opacity-50" />
                <p className="text-gray-600 mb-4 leading-relaxed">
                  "The support and resources provided were invaluable during our 
                  difficult time. We're grateful for the compassionate service."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-600 font-medium">DJ</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">David J.</p>
                    <p className="text-sm text-gray-500">Verified Client</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-blue-500 mb-4 opacity-50" />
                <p className="text-gray-600 mb-4 leading-relaxed">
                  "Having a permanent place to share memories and stories has 
                  brought our entire family comfort and healing."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-600 font-medium">ML</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Maria L.</p>
                    <p className="text-sm text-gray-500">Verified Client</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Honor Your Loved One?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Let us help you create a lasting memorial that celebrates their life 
            and preserves their memory for generations to come.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("Contact")}>
              <Button className="bg-white text-blue-500 hover:bg-gray-50 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl("Services")}>
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-500 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200">
                View Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}