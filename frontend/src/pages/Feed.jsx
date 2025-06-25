import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import PostList from '../components/PostList';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getUserProfile {
      _id
      username
    }
  }
`;

const GET_POSTS = gql`
  query GetPostsForFollowers {
    getPostsForFollowers {
      _id
      imagePath
      description
      timestamp
      likes
      likeCount
      comments {
        username
        comment
        timestamp
      }
      owner {
        _id
        username
        profile_photo
      }
    }
  }
`;

const Feed = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Query to check authentication and get current user
  const { loading: userLoading, error: userError } = useQuery(GET_CURRENT_USER, {
    onCompleted: (data) => {
      if (data?.getUserProfile) {
        setCurrentUser(data.getUserProfile);
      } else {
        navigate('/login');
      }
    },
    onError: () => {
      navigate('/login');
    }
  });

  // Query to get posts once we have the current user
  const { loading: postsLoading, error: postsError, data: postsData, refetch: refetchPosts } = useQuery(GET_POSTS, {
    skip: !currentUser,
  });

  if (userLoading || postsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (userError) {
    navigate('/login');
    return null;
  }

  if (postsError) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading posts: {postsError.message}
      </div>
    );
  }

  const posts = postsData?.getPostsForFollowers || [];

  return (
    <div className="max-w-2xl mx-auto">
      <h5 className="text-2xl font-bold mb-6 text-black ">Your Feed</h5>
      <PostList posts={posts} refetch={refetchPosts} />
    </div>
  );
};

export default Feed; 