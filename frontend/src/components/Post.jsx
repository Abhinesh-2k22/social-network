import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Heart, MessageCircle, Send } from 'lucide-react';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getUserProfile {
      _id
      username
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId)
  }
`;

const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      _id
      likes
      likeCount
    }
  }
`;

const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      _id
      likes
      likeCount
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $comment: String!) {
    addComment(postId: $postId, comment: $comment) {
      _id
      comments {
        username
        comment
        timestamp
      }
    }
  }
`;

const Post = ({ post, refetch, isCurrentUserProfile }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();
  
  // Get current user from GraphQL
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_CURRENT_USER, {
    onCompleted: (data) => {
      console.log('Current user data received:', data);
      if (data?.getUserProfile) {
        setCurrentUser(data.getUserProfile);
        setIsOwnPost(data.getUserProfile.username === post.owner.username);
        setIsLiked(post.likes && post.likes.includes(data.getUserProfile.username));
        console.log('Current user set:', data.getUserProfile.username);
        console.log('Is liked:', post.likes && post.likes.includes(data.getUserProfile.username));
      }
    },
    onError: (error) => {
      console.error('Error fetching current user:', error);
    }
  });
  
  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => {
      if (refetch) {
        console.log('Refetching data after post deletion');
        refetch();
      }
      navigate(`/profile/${post.owner.username}`);
    },
  });

  const [likePost] = useMutation(LIKE_POST, {
    onCompleted: (data) => {
      console.log('Like successful:', data);
      setIsLiked(true);
      if (refetch) refetch();
    },
    onError: (error) => {
      console.error('Like error:', error);
    }
  });

  const [unlikePost] = useMutation(UNLIKE_POST, {
    onCompleted: (data) => {
      console.log('Unlike successful:', data);
      setIsLiked(false);
      if (refetch) refetch();
    },
    onError: (error) => {
      console.error('Unlike error:', error);
    }
  });

  const [addComment] = useMutation(ADD_COMMENT, {
    onCompleted: (data) => {
      console.log('Comment added successfully:', data);
      setCommentText('');
      if (refetch) refetch();
    },
    onError: (error) => {
      console.error('Add comment error:', error);
    }
  });

  useEffect(() => {
    if (isCurrentUserProfile) {
      setIsOwnPost(true);
    }
  }, [isCurrentUserProfile]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost({ variables: { postId: post._id } });
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      console.log('No current user found');
      return;
    }
    
    console.log('Handling like for post:', post._id, 'Current user:', currentUser.username);
    console.log('Current like state:', isLiked);
    console.log('Post likes array:', post.likes);
    
    try {
      if (isLiked) {
        console.log('Unliking post...');
        const result = await unlikePost({ variables: { postId: post._id } });
        console.log('Unlike result:', result);
      } else {
        console.log('Liking post...');
        const result = await likePost({ variables: { postId: post._id } });
        console.log('Like result:', result);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      console.error('Error details:', error.message);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) {
      console.log('Cannot add comment:', { commentText: commentText.trim(), currentUser });
      return;
    }
    
    console.log('Adding comment:', commentText.trim(), 'to post:', post._id);
    console.log('Current user:', currentUser.username);
    
    try {
      const result = await addComment({ variables: { postId: post._id, comment: commentText.trim() } });
      console.log('Add comment result:', result);
    } catch (error) {
      console.error('Error adding comment:', error);
      console.error('Error details:', error.message);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return 'Unknown time';
      
      let date;
      
      if (typeof timestamp === 'number' || /^\d+$/.test(timestamp)) {
        const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
        date = new Date(parseInt(ms));
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', timestamp);
        return 'Unknown time';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown time';
    }
  };
  
  // Show loading state while fetching user data
  if (userLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Show error state if user data fails to load
  if (userError) {
    console.error('User data error:', userError);
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${post.owner.username}`} className="flex items-center">
          <img
            src={post.owner.profile_photo || '/default-avatar.png'}
            alt={post.owner.username}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <p className="font-semibold">{post.owner.username}</p>
            <p className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</p>
          </div>
        </Link>
        
        {isOwnPost && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
            title="Delete post"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      
      <div className="post-image-container">
        <img
          src={`http://localhost:4000${post.imagePath}`}
          alt="Post"
          className="w-full object-cover"
        />
      </div>
      
      <div className="p-4">
        {/* Like and Comment buttons */}
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              isLiked 
                ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                : 'text-gray-500 bg-white hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{post.likeCount || 0}</span>
          </button>
          
          <button
            onClick={toggleComments}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              showComments 
                ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                : 'text-gray-500 bg-white hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <MessageCircle size={20} />
            <span>{post.comments ? post.comments.length : 0}</span>
          </button>
        </div>

        {/* Description */}
        {post.description && (
          <p className="text-gray-800 mb-3">
            <span className="font-semibold">{post.owner.username}</span> {post.description}
          </p>
        )}

        {/* Collapsible Comments section */}
        {showComments && (
          <div className="border-t pt-3 mb-3">
            {/* Comments display */}
            {post.comments && post.comments.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {post.comments.map((comment, index) => (
                  <div key={index} className="text-sm bg-gray-50 p-2 rounded-lg">
                    <span className="font-semibold text-black">{comment.username}</span>{' '}
                    <span className="text-gray-700">{comment.comment}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment form */}
            {currentUser && (
              <form onSubmit={handleComment} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Post; 