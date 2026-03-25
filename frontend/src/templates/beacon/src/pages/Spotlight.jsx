// src/templates/beacon/src/pages/Spotlight.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Share2 } from "lucide-react";

export default function Spotlight({ caseData, customizations, isPreview, isEditing }) {
  const samplePosts = [
    {
      id: 'sample-1',
      title: 'Investigation Update',
      content: 'Detectives are following new leads in the case. We appreciate all the tips that have come in and encourage anyone with information to continue reaching out.',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      likes_count: 45,
      view_count: 234
    },
    {
      id: 'sample-2',
      title: 'Community Search This Weekend',
      content: 'We are organizing a community search this Saturday at 9 AM. Please meet at the community center if you would like to help. Bring water and wear comfortable shoes.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      likes_count: 89,
      view_count: 567
    },
    {
      id: 'sample-3',
      title: 'Thank You for Your Support',
      content: `The family would like to thank everyone for their continued support and prayers during this difficult time. Your kindness means more than words can express.`,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      likes_count: 156,
      view_count: 892
    }
  ];
  
  const updates = caseData?.spotlight_posts && caseData.spotlight_posts.length > 0 
    ? caseData.spotlight_posts 
    : (isEditing || isPreview) ? samplePosts : [];

  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleShare = async (post) => {
    const shareUrl = window.location.href;
    const shareTitle = `${post.title} - ${caseData?.first_name}'s Case`;
    const shareText = `Check out this update: ${post.title}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (e) {
      // silently handled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Case Spotlight</h1>
          <p className="text-xl text-slate-600">
            Follow the latest developments in {caseData?.first_name || 'this'}'s case
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-3xl space-y-7">
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
                  <CardContent className="p-7 md:p-8">
                    <div className="mb-5 flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
                          <span className="text-base font-semibold text-slate-600">
                            {caseData?.first_name?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">{update.title}</h3>
                          <p className="text-sm text-slate-500 md:text-[15px]">
                            {new Date(update.created_at || update.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(update)}
                        className="text-slate-600 hover:text-slate-900 flex-shrink-0"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <p className="mb-5 whitespace-pre-wrap text-[17px] leading-8 text-slate-600">
                      {stripHtml(update.content || update.content_text || '')}
                    </p>
                    
                    {(update.featured_image || update.image_url) && (
                      <img
                        src={update.featured_image || update.image_url}
                        alt={update.title}
                        className="mb-5 w-full rounded-xl"
                      />
                    )}

                    <div className="flex items-center gap-4 text-[15px] text-slate-500">
                      <span>{update.likes_count || 0} likes</span>
                      {(update.views_count || update.view_count) > 0 && <span>{update.views_count || update.view_count} views</span>}
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
