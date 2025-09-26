// src/pages/dashboard/components/SpotlightPostsList.jsx
import React from 'react';
import { format } from 'date-fns';
import { Eye, Heart, MessageCircle, Clock, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SpotlightPostsList({ 
  posts, 
  onRefresh, 
  title, 
  emptyMessage,
  showScheduledTime = false 
}) {
  const getStatusBadge = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={colors[status] || colors.draft}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>

      {posts.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {posts.map((post) => (
            <div key={post.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {post.title || 'Untitled Post'}
                    </h3>
                    {getStatusBadge(post.status)}
                    {post.priority !== 'medium' && (
                      <Badge variant="outline" className="capitalize">
                        {post.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {post.content_text || post.content}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count || 0}
                    </span>
                    
                    {showScheduledTime && post.scheduled_for && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(post.scheduled_for), 'MMM d, h:mm a')}
                      </span>
                    )}
                    
                    {!showScheduledTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(post.created_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}