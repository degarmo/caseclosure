import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Heart, GraduationCap, Users, MapPin } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Sarah's Story</h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          Remembering a beautiful soul who touched so many lives
        </p>
      </div>

      {/* Main Photo and Bio */}
      <Card className="mb-12 shadow-lg border-0">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=600&fit=crop"
                alt="Sarah Johnson"
                className="w-full h-96 lg:h-[500px] object-cover rounded-lg shadow-md"
              />
            </div>
            <div className="lg:w-1/2 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Sarah Elizabeth Johnson</h2>
                <p className="text-slate-600 text-lg">March 15, 1999 - December 15, 2023</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-slate-600">
                    Sarah was known for her compassionate heart and infectious laughter. She had a way of making everyone around her feel special and loved.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <p className="text-slate-600">
                    Recent graduate from State University with a Bachelor's degree in Social Work, magna cum laude. She was passionate about helping children and families in crisis.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-slate-600">
                    Beloved daughter to Michael and Linda Johnson, loving sister to Emma and Jake, and cherished friend to many across the community.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <p className="text-slate-600">
                    Born and raised in our community, Sarah volunteered at the local shelter and was actively involved in various charitable organizations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Message */}
      <Card className="mb-12 shadow-lg border-yellow-200">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">A Message from Sarah's Family</h3>
          </div>
          <blockquote className="text-lg text-slate-600 italic leading-relaxed text-center">
            "Sarah was the light of our lives. Her dream was to make the world a better place for children who needed someone to advocate for them. She was just beginning her career in social work and was so excited about the difference she could make. We will never stop fighting for justice for our beautiful daughter. Every day we wake up hoping for answers, hoping someone will come forward with information that can help bring closure to our family. Sarah deserves justice, and we won't rest until we find it."
          </blockquote>
          <p className="text-center text-slate-500 mt-6">- The Johnson Family</p>
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Remembering Sarah</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop", caption: "Sarah at graduation" },
            { url: "https://images.unsplash.com/photo-1494790108755-2616c9703b73?w=400&h=400&fit=crop", caption: "Family vacation 2023" },
            { url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop", caption: "Volunteering at the shelter" },
            { url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&h=400&fit=crop", caption: "Sarah with friends" },
            { url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop", caption: "Always smiling" },
            { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", caption: "Sarah at her 24th birthday" }
          ].map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg"></div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg p-4">
                <p className="text-white text-sm font-medium">{photo.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="shadow-lg gold-gradient">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Help Us Find Answers</h3>
          <p className="text-slate-700 mb-6">
            If you have any information about Sarah's disappearance, no matter how small, please reach out. Your tip could be the key to bringing justice for Sarah.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200">
              Submit Anonymous Tip
            </button>
            <button className="border-2 border-slate-800 text-slate-800 px-6 py-3 rounded-lg font-medium hover:bg-slate-800 hover:text-white transition-all duration-200">
              Share Sarah's Story
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}