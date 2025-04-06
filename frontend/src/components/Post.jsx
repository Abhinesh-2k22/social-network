import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';

const DELETE_POST = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId)
  }
`;

const Post = ({ post, refetch, isCurrentUserProfile }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const navigate = useNavigate();
  
  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => {

      if (refetch) {
        console.log('Refetching data after post deletion');
        refetch();
      }
      
      // Redirect to the profile page after deleting a post
      navigate(`/profile/${post.owner.username}`);
    },
  });

  useEffect(() => {

    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
        setIsOwnPost(parsedUser.username === post.owner.username);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    
    // If isCurrentUserProfile is true, this post belongs to the current user
    if (isCurrentUserProfile) {
      setIsOwnPost(true);
    }
  }, [post.owner.username, isCurrentUserProfile]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost({ variables: { postId: post._id } });
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };


  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return 'Unknown time';
      
      let date;
      

      if (typeof timestamp === 'number' || /^\d+$/.test(timestamp)) {
        // Convert to milliseconds if it's in seconds
        const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
        date = new Date(parseInt(ms));
      } else {
        // Try parsing as ISO string
        date = new Date(timestamp);
      }
      
      // Validate the date
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
        {post.description && (
          <p className="text-gray-800">
            <span className="font-semibold">{post.owner.username}</span> {post.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Post; 