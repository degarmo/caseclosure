// src/templates/beacon/src/pages/Spotlight.jsx
// Clean version without API dependencies - displays data from props

import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";

export default function Spotlight({ caseData, customizations, isPreview }) {
  // Get spotlight posts from caseData instead of API
  const updates = caseData?.spotlight_posts || [];
  
  // For preview mode, show sample data if no posts exist
  const displayUpdates = isPreview && updates.length === 0 ? [
    {
      id: 'preview-1',
      title: 'Case Update',
      content: 'This is where case updates will appear.',
      created_at: new Date().toISOString(),
      likes_count: 0
    }
  ] : updates;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Case Spotlight</h1>
          <p className="text-xl text-slate-600">
            Follow the latest developments in {caseData?.first_name || 'this'}'s case
          </p>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl space-y-6">
            {displayUpdates.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No updates found</h3>
                  <p className="text-slate-600">
                    Come back later for updates on the case.
                  </p>
                </CardContent>
              </Card>
            ) : (
              displayUpdates.map((update) => (
                <Card key={update.id} className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-slate-600 font-semibold text-sm">
                          {caseData?.first_name?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{update.title}</h3>
                        <p className="text-sm text-slate-500">
                          {new Date(update.created_at || update.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{update.content}</p>
                    
                    {update.image_url && (
                      <img 
                        src={update.image_url} 
                        alt={update.title}
                        className="w-full rounded-lg mb-4"
                      />
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{update.likes_count || 0} likes</span>
                      {update.view_count && <span>{update.view_count} views</span>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}