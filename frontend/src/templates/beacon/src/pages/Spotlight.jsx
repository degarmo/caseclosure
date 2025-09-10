// src/templates/beacon/src/pages/Spotlight.jsx
// Clean version without API dependencies - displays data from props

import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";

export default function Spotlight({ caseData, customizations, isPreview, isEditing }) {
  // Sample posts for preview/editing
  const samplePosts = [
    {
      id: 'sample-1',
      title: 'Investigation Update',
      content: 'Detectives are following new leads in the case. We appreciate all the tips that have come in and encourage anyone with information to continue reaching out.',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      likes_count: 45,
      view_count: 234
    },
    {
      id: 'sample-2',
      title: 'Community Search This Weekend',
      content: 'We are organizing a community search this Saturday at 9 AM. Please meet at the community center if you would like to help. Bring water and wear comfortable shoes.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      likes_count: 89,
      view_count: 567
    },
    {
      id: 'sample-3',
      title: 'Thank You for Your Support',
      content: `The family would like to thank everyone for their continued support and prayers during this difficult time. Your kindness means more than words can express.`,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      likes_count: 156,
      view_count: 892
    }
  ];
  
  // Use real posts if available, otherwise use sample posts in edit/preview mode
  const updates = caseData?.spotlight_posts && caseData.spotlight_posts.length > 0 
    ? caseData.spotlight_posts 
    : (isEditing || isPreview) ? samplePosts : [];

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
            {updates.length === 0 ? (
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
              updates.map((update) => (
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