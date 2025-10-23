// src/components/spotlight/SpotlightPost.jsx
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

const SpotlightPost = ({ post, onLike, onComment, onEdit }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [imageIndex, setImageIndex] = useState(0);

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  // Render HTML content safely
  const renderContent = (htmlContent) => {
    return (
      <div 
        className="post-content-html"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  return (
    <div className="spotlight-post">
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.author_name[0].toUpperCase()}
          </div>
          <div className="author-info">
            <span className="author-name">{post.author_name}</span>
            <span className="post-time">
              {format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        
        {post.status === 'scheduled' && (
          <span className="post-badge scheduled">
            Scheduled for {format(new Date(post.scheduled_for), 'MMM d, h:mm a')}
          </span>
        )}
        
        <button className="btn-more">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {post.title && <h2 className="post-title">{post.title}</h2>}

      <div className="post-content">
        {renderContent(post.content)}
      </div>

      {post.media && post.media.length > 0 && (
        <div className="post-media">
          {post.media.length > 1 && (
            <div className="media-indicators">
              {post.media.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === imageIndex ? 'active' : ''}`}
                  onClick={() => setImageIndex(index)}
                />
              ))}
            </div>
          )}
          <img
            src={post.media[imageIndex].file}
            alt={post.media[imageIndex].caption}
            className="post-image"
          />
        </div>
      )}

      <div className="post-stats">
        <span>{post.likes_count} likes</span>
        <span>{post.comments_count} comments</span>
        <span>{post.views_count} views</span>
      </div>

      <div className="post-actions">
        <button
          className={`btn-action ${post.is_liked ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
        </button>
        <button
          className="btn-action"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle size={20} />
        </button>
        <button className="btn-action">
          <Share2 size={20} />
        </button>
        <button className="btn-action">
          <Bookmark size={20} />
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          <div className="comment-input">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <button onClick={handleComment}>Post</button>
          </div>
          
          <div className="comments-list">
            {post.comments && post.comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-author">{comment.author_name}</div>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-time">
                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotlightPost;