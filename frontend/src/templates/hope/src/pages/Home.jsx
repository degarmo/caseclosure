import React, { useState, useEffect } from "react";
import { MissingPerson } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MapPin, 
  Calendar, 
  Phone, 
  Share2, 
  Download,
  Car,
  User,
  AlertTriangle,
  Heart
} from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const [missingPerson, setMissingPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonData();
  }, []);

  const loadPersonData = async () => {
    try {
      const persons = await MissingPerson.list("-created_date", 1);
      if (persons.length > 0) {
        setMissingPerson(persons[0]);
      }
    } catch (error) {
      console.error("Error loading person data:", error);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Help Find ${missingPerson?.full_name}`,
        text: `Please help find ${missingPerson?.full_name}. Last seen on ${missingPerson?.last_seen_date} in ${missingPerson?.last_seen_location}.`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="bg-red-500/20 text-white border-red-400 mb-4 px-6 py-2">
              <AlertTriangle className="w-4 h-4 mr-2" />
              MISSING PERSON
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Help Find {missingPerson?.full_name || "Sarah Johnson"}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Every share, every call, every tip matters. Help us bring her home safely.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Photo Section */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="relative inline-block">
                <img
                  src={missingPerson?.main_photo || "https://images.unsplash.com/photo-1494790108755-2616b9a7bd28?w=400&h=400&fit=crop&crop=face"}
                  alt={missingPerson?.full_name || "Missing Person"}
                  className="w-72 h-72 md:w-96 md:h-96 object-cover rounded-2xl shadow-2xl border-4 border-white/20"
                />
                <div className="absolute -top-2 -right-2 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                  MISSING
                </div>
              </div>
            </motion.div>

            {/* Key Information */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-white">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    Quick Facts
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-200">Age</p>
                      <p className="font-semibold">{missingPerson?.age || "28"} years old</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Height</p>
                      <p className="font-semibold">{missingPerson?.height || "5'6\""}</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Hair</p>
                      <p className="font-semibold">{missingPerson?.hair_color || "Brown"}</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Eyes</p>
                      <p className="font-semibold">{missingPerson?.eye_color || "Green"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-white">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Last Seen
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-200" />
                      <span>{missingPerson?.last_seen_date || "January 15, 2024"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-200" />
                      <span>{missingPerson?.last_seen_location || "Downtown Portland, OR"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleShare}
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 flex-1"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share This Page
                </Button>
                <a href="tel:911" className="flex-1">
                  <Button size="lg" className="w-full bg-red-500 hover:bg-red-600">
                    <Phone className="w-5 h-5 mr-2" />
                    Report Tip
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Information Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900"
          >
            Critical Information
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Last Seen Wearing</h3>
                  <p className="text-gray-600">
                    {missingPerson?.last_seen_wearing || "Blue jeans, white t-shirt, black jacket"}
                  </p>
                  <Link to={createPageUrl("About")} className="inline-block mt-4">
                    <Button variant="outline">View Full Profile</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Vehicle Information</h3>
                  <p className="text-gray-600">
                    {missingPerson?.vehicle_year || "2019"} {missingPerson?.vehicle_color || "Red"} {missingPerson?.vehicle_make || "Honda"} {missingPerson?.vehicle_model || "Civic"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    License: {missingPerson?.vehicle_plate || "ABC-1234"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Reward Offered</h3>
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    ${missingPerson?.reward_amount || "10,000"}
                  </p>
                  <p className="text-sm text-gray-600">
                    For information leading to safe return
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How You Can Help
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Your help could be the key to bringing her home safely
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link to={createPageUrl("Spotlight")} className="flex-1">
                <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  View Updates
                </Button>
              </Link>
              <Link to={createPageUrl("Contact")} className="flex-1">
                <Button size="lg" className="w-full bg-blue-800 hover:bg-blue-900">
                  Submit a Tip
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}