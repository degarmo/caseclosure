import React, { useState, useEffect } from "react";
import { TimelineEvent } from "../api/entities";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  Calendar, 
  MapPin, 
  ExternalLink, 
  AlertTriangle,
  Shield,
  Gavel,
  Heart,
  Newspaper,
  Star
} from "lucide-react";
import { format } from "date-fns";

const eventTypeConfig = {
  incident: { color: "bg-red-500", icon: AlertTriangle, label: "Incident" },
  investigation: { color: "bg-blue-500", icon: Shield, label: "Investigation" },
  arrest: { color: "bg-orange-500", icon: Gavel, label: "Arrest" },
  court: { color: "bg-purple-500", icon: Gavel, label: "Court" },
  memorial: { color: "bg-pink-500", icon: Heart, label: "Memorial" },
  media: { color: "bg-green-500", icon: Newspaper, label: "Media" },
  other: { color: "bg-slate-500", icon: Star, label: "Other" }
};

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await TimelineEvent.list("-date");
      setEvents(data);
    } catch (error) {
      console.error("Error loading timeline events:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex gap-8 animate-pulse">
              <div className="w-32 h-6 bg-slate-200 rounded"></div>
              <div className="flex-1">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Case Timeline</h1>
        <p className="text-xl text-slate-600">
          A chronological overview of events in Sarah's case
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-32 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        <div className="space-y-12">
          {events.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No timeline events</h3>
                <p className="text-slate-600">
                  Timeline events will be added as the case develops.
                </p>
              </CardContent>
            </Card>
          ) : (
            events.map((event, index) => {
              const config = eventTypeConfig[event.event_type];
              const Icon = config.icon;
              
              return (
                <div key={event.id} className="relative">
                  {/* Date badge (mobile) */}
                  <div className="md:hidden mb-4">
                    <Badge variant="outline" className="bg-white border-slate-300">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(event.date), "MMM d, yyyy")}
                    </Badge>
                  </div>

                  <div className="flex gap-8">
                    {/* Date (desktop) */}
                    <div className="hidden md:block w-32 text-right">
                      <div className="sticky top-24">
                        <div className="text-sm font-medium text-slate-600">
                          {format(new Date(event.date), "MMM d")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(event.date), "yyyy")}
                        </div>
                      </div>
                    </div>

                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0">
                      <div className={`absolute -left-2 w-4 h-4 ${config.color} rounded-full border-4 border-white shadow-md`}>
                      </div>
                      {event.is_major && (
                        <div className="absolute -left-4 -top-2 w-8 h-8 bg-yellow-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-800" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-200 ${
                        event.is_major ? 'border-yellow-200' : ''
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 ${config.color} rounded-lg`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                {config.label}
                              </Badge>
                              {event.is_major && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  Major Event
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-slate-800 mb-3">
                            {event.title}
                          </h3>
                          
                          <p className="text-slate-600 leading-relaxed mb-4">
                            {event.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}
                            {event.source_url && (
                              <a
                                href={event.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Source
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="mt-16 shadow-lg gold-gradient">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Help Complete the Timeline</h3>
          <p className="text-slate-700 mb-6">
            If you have information about any events related to Sarah's case, please share it with us. Every detail matters.
          </p>
          <Button size="lg" className="bg-slate-800 text-white hover:bg-slate-700">
            <Shield className="w-5 h-5 mr-2" />
            Submit Information
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}