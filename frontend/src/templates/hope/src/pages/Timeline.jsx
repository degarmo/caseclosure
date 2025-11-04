
import React, { useState, useEffect } from "react";
import { TimelineEvent } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils"; // Added this import
import { 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Eye, 
  Search, 
  Newspaper,
  Users,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      const timelineEvents = await TimelineEvent.list("-event_date");
      setEvents(timelineEvents);
    } catch (error) {
      console.error("Error loading timeline:", error);
    }
    setLoading(false);
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "disappearance":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "sighting":
        return <Eye className="w-5 h-5 text-orange-500" />;
      case "investigation":
        return <Search className="w-5 h-5 text-blue-500" />;
      case "media":
        return <Newspaper className="w-5 h-5 text-purple-500" />;
      case "family_update":
        return <Users className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case "disappearance":
        return "bg-red-100 border-red-200 text-red-800";
      case "sighting":
        return "bg-orange-100 border-orange-200 text-orange-800";
      case "investigation":
        return "bg-blue-100 border-blue-200 text-blue-800";
      case "media":
        return "bg-purple-100 border-purple-200 text-purple-800";
      case "family_update":
        return "bg-green-100 border-green-200 text-green-800";
      default:
        return "bg-gray-100 border-gray-200 text-gray-800";
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 mb-4 px-6 py-2">
            <Clock className="w-4 h-4 mr-2" />
            CASE TIMELINE
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Timeline of Events
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A chronological overview of all events, sightings, and updates related to Sarah's case
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-purple-400"></div>

          {/* Timeline Events */}
          <div className="space-y-8">
            {events.length > 0 ? (
              events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative flex items-start gap-6"
                >
                  {/* Timeline Dot */}
                  <div className="flex-shrink-0 w-16 h-16 bg-white border-4 border-blue-200 rounded-full flex items-center justify-center shadow-lg z-10">
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Event Card */}
                  <Card className="flex-1 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <div className="flex flex-col md:items-end gap-2">
                          <Badge className={getEventColor(event.event_type)}>
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.event_date), "MMMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {event.description}
                      </p>
                      
                      <div className="flex flex-col md:flex-row gap-4">
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.source && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Newspaper className="w-4 h-4" />
                            <span>Source: {event.source}</span>
                          </div>
                        )}
                      </div>

                      {event.image_url && (
                        <div className="mt-4">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full max-w-md h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              // Default timeline events when no data exists
              [
                {
                  title: "Sarah Reported Missing",
                  description: "Sarah Johnson was reported missing by her family when she failed to return home from work. Her car was found abandoned in downtown Portland.",
                  event_date: "2024-01-15",
                  event_type: "disappearance",
                  location: "Portland, OR",
                  source: "Portland Police Department"
                },
                {
                  title: "Search and Rescue Operation Begins",
                  description: "Local authorities launched a comprehensive search operation involving K-9 units, helicopters, and volunteer search teams across the downtown area.",
                  event_date: "2024-01-16",
                  event_type: "investigation",
                  location: "Downtown Portland, OR",
                  source: "Portland Search & Rescue"
                },
                {
                  title: "Possible Sighting Reported",
                  description: "A witness reported seeing someone matching Sarah's description at a gas station on the outskirts of the city. Security footage is being reviewed.",
                  event_date: "2024-01-18",
                  event_type: "sighting",
                  location: "Beaverton, OR",
                  source: "Witness Report"
                },
                {
                  title: "Media Coverage Begins",
                  description: "Local news stations pick up the story, broadcasting Sarah's information and asking for public assistance in the search efforts.",
                  event_date: "2024-01-19",
                  event_type: "media",
                  location: "Regional Media Outlets",
                  source: "Local News Networks"
                },
                {
                  title: "Family Press Conference",
                  description: "Sarah's family held an emotional press conference, pleading for her safe return and announcing a reward for information leading to her whereabouts.",
                  event_date: "2024-01-22",
                  event_type: "family_update",
                  location: "Portland, OR",
                  source: "Johnson Family"
                }
              ].map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative flex items-start gap-6"
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-white border-4 border-blue-200 rounded-full flex items-center justify-center shadow-lg z-10">
                    {getEventIcon(event.event_type)}
                  </div>
                  <Card className="flex-1 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <div className="flex flex-col md:items-end gap-2">
                          <Badge className={getEventColor(event.event_type)}>
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.event_date), "MMMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Newspaper className="w-4 h-4" />
                          <span>Source: {event.source}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-white/80 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Time Is Critical</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                The more time passes, the more crucial every piece of information becomes. 
                If you have any details about these events or other information about Sarah, please come forward.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <a href="tel:911" className="flex-1">
                  <button className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Call 911
                  </button>
                </a>
                <a href={createPageUrl("Contact")} className="flex-1">
                  <button className="w-full bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors">
                    Submit Tip
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
