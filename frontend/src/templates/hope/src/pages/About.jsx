import React, { useState, useEffect } from "react";
import { MissingPerson } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Calendar, 
  Car, 
  Phone,
  Share2,
  Download,
  Heart,
  Info
} from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  const [missingPerson, setMissingPerson] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
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
        text: `Please help find ${missingPerson?.full_name}. Missing since ${missingPerson?.last_seen_date}.`,
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

  const defaultPhotos = [
    "https://images.unsplash.com/photo-1494790108755-2616b9a7bd28?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face"
  ];

  const photos = missingPerson?.photos?.length > 0 ? missingPerson.photos : defaultPhotos;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="bg-red-500/10 text-red-600 border-red-200 mb-4 px-6 py-2">
            <User className="w-4 h-4 mr-2" />
            MISSING PERSON PROFILE
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            About {missingPerson?.full_name || "Sarah Johnson"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know to help bring her home safely
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Photo Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Main Photo */}
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={photos[selectedPhoto]}
                      alt={`${missingPerson?.full_name || 'Missing Person'} - Photo ${selectedPhoto + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(index)}
                        className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                          selectedPhoto === index
                            ? "border-blue-500 scale-95"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleShare} variant="outline" size="sm" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="w-6 h-6 text-blue-500" />
                  Biography
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {missingPerson?.bio || 
                    "Sarah is a loving daughter, sister, and friend who lights up every room she enters. She's known for her infectious laugh and her passion for helping others. Sarah works as a nurse at the local hospital and volunteers at the animal shelter on weekends. She loves hiking, photography, and spending time with her golden retriever, Max. Her family and friends describe her as kind-hearted, dependable, and always willing to lend a helping hand to anyone in need."
                  }
                </p>
              </CardContent>
            </Card>

            {/* Physical Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-green-500" />
                  Physical Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">Age</p>
                      <p className="text-gray-700">{missingPerson?.age || "28"} years old</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Height</p>
                      <p className="text-gray-700">{missingPerson?.height || "5'6\""}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Weight</p>
                      <p className="text-gray-700">{missingPerson?.weight || "135 lbs"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">Hair Color</p>
                      <p className="text-gray-700">{missingPerson?.hair_color || "Brown, shoulder-length"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Eye Color</p>
                      <p className="text-gray-700">{missingPerson?.eye_color || "Green"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Distinguishing Features</p>
                      <p className="text-gray-700">Small scar on left eyebrow, tattoo of a star on right wrist</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Seen Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Last Seen Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Date</p>
                        <p className="text-gray-700">{missingPerson?.last_seen_date || "January 15, 2024"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Location</p>
                        <p className="text-gray-700">{missingPerson?.last_seen_location || "Downtown Portland, OR - Pioneer Courthouse Square"}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-2">What She Was Wearing</p>
                    <p className="text-gray-700">
                      {missingPerson?.last_seen_wearing || "Blue jeans, white button-up shirt, black leather jacket, white sneakers, carrying a brown leather purse"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-purple-500" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">Vehicle Details</p>
                      <p className="text-lg text-gray-700">
                        {missingPerson?.vehicle_year || "2019"} {missingPerson?.vehicle_color || "Red"} {missingPerson?.vehicle_make || "Honda"} {missingPerson?.vehicle_model || "Civic"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">License Plate</p>
                      <p className="text-xl font-mono bg-gray-100 px-3 py-1 rounded inline-block">
                        {missingPerson?.vehicle_plate || "ABC-1234"}
                      </p>
                    </div>
                  </div>
                  <div>
                    {missingPerson?.vehicle_photo && (
                      <img
                        src={missingPerson.vehicle_photo}
                        alt="Vehicle"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information from Family</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900">Case Number</p>
                    <p className="text-gray-700 font-mono">{missingPerson?.case_number || "MP2024-001"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Reward</p>
                    <p className="text-2xl font-bold text-green-600">${missingPerson?.reward_amount || "10,000"}</p>
                    <p className="text-sm text-gray-500">For information leading to safe return</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Additional Details</p>
                    <p className="text-gray-700">
                      {missingPerson?.additional_info || 
                        "Sarah is diabetic and needs regular insulin. She may seem confused or disoriented without medication. She is not familiar with the downtown area and may be lost. Her phone has been turned off since the day she disappeared. Please approach with care and contact authorities immediately if you see her."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Seen Sarah? Act Now!</h3>
                <p className="mb-6 text-blue-100">
                  If you have any information about Sarah's whereabouts, please contact authorities immediately.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <a href="tel:911" className="flex-1">
                    <Button size="lg" className="w-full bg-red-500 hover:bg-red-600">
                      <Phone className="w-5 h-5 mr-2" />
                      Call 911
                    </Button>
                  </a>
                  <a href={`tel:${missingPerson?.family_contact || '555-0123'}`} className="flex-1">
                    <Button size="lg" variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                      <Phone className="w-5 h-5 mr-2" />
                      Call Family
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}