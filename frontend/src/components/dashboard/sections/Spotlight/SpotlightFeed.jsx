// SpotlightFeed.jsx
import React from 'react';
import SpotlightPost from './SpotlightPost';

const SpotlightFeed = ({ posts, onLike, onComment, onEdit }) => {
  return (
    <div className="spotlight-feed">
      {posts.length === 0 ? (
        <div className="feed-empty">
          <p>No posts yet. Create your first spotlight!</p>
        </div>
      ) : (
        posts.map(post => (
          <SpotlightPost
            key={post.id}
            post={post}
            onLike={onLike}
            onComment={onComment}
            onEdit={onEdit}
          />
        ))
      )}
    </div>
  );
};

export default SpotlightFeed;