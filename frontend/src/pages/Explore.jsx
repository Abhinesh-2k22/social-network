import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getUserProfile {
      _id
      username
    }
  }
`;

const SEARCH_USERS = gql`
  query SearchUsers($username: String!) {
    searchUser(username: $username) {
      _id
      username
      profile_photo
      description
    }
  }
`;

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations {
    getRecommendations {
      _id
      username
      profile_photo
      description
    }
  }
`;

const GET_FOLLOWING = gql`
  query GetFollowing {
    getFollowing
  }
`;

const FOLLOW_USER = gql`
  mutation FollowUser($target: String!) {
    followUser(target: $target)
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($target: String!) {
    unfollowUser(target: $target)
  }
`;

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [followingMap, setFollowingMap] = useState({});
  const navigate = useNavigate();
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Get current user from GraphQL query
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
  
  // Get search results
  const { loading: searchLoading, data: searchData } = useQuery(SEARCH_USERS, {
    variables: { username: debouncedQuery },
    skip: !debouncedQuery,
  });
  
  // Get recommendations when no search query
  const { loading: recommendationsLoading, data: recommendationsData } = useQuery(GET_RECOMMENDATIONS, {
    skip: !!debouncedQuery,
  });
  
  // Mutations
  const [followUser] = useMutation(FOLLOW_USER, {
    onCompleted: (data) => {
      console.log('Follow successful:', data);
      // Update the followingMap state
      setFollowingMap(prev => ({
        ...prev,
        [targetUsername]: true
      }));
      // Refetch following data to ensure consistency
      refetchFollowing();
    },
    onError: (error) => {
      console.error('Follow error:', error);
      setError(error.message);
    }
  });
  
  const [unfollowUser] = useMutation(UNFOLLOW_USER, {
    onCompleted: (data) => {
      console.log('Unfollow successful:', data);
      // Update the followingMap state
      setFollowingMap(prev => ({
        ...prev,
        [targetUsername]: false
      }));
      // Refetch following data to ensure consistency
      refetchFollowing();
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
      setError(error.message);
    }
  });
  
  // Get following list with refetch capability
  const { data: followingData, refetch: refetchFollowing } = useQuery(GET_FOLLOWING, {
    skip: !currentUser?.username,
  });
  
  // Update following map when following data changes
  useEffect(() => {
    if (followingData?.getFollowing) {
      const followingStatus = {};
      followingData.getFollowing.forEach(username => {
        followingStatus[username] = true;
      });
      setFollowingMap(followingStatus);
    }
  }, [followingData]);
  
  const [targetUsername, setTargetUsername] = useState(null);
  
  const handleFollowToggle = async (username) => {
    if (!currentUser) return;
    setTargetUsername(username);
    
    try {
      if (followingMap[username]) {
        await unfollowUser({ variables: { target: username } });
      } else {
        await followUser({ variables: { target: username } });
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      setError(error.message);
    }
  };
  
  // Determine which data to display based on search query
  const displayData = debouncedQuery ? searchData?.searchUser : recommendationsData?.getRecommendations;
  const isLoading = userLoading || (debouncedQuery ? searchLoading : recommendationsLoading);
  
  if (userError) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : displayData?.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            {debouncedQuery ? 'Search Results' : 'Recommended Users'}
          </h2>
          {displayData.map((user) => (
            <div key={user._id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <Link to={`/profile/${user.username}`} className="flex items-center">
                <img
                  src={user.profile_photo || '/default-avatar.png'}
                  alt={user.username}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h3 className="font-medium">{user.username}</h3>
                  {user.description && (
                    <p className="text-sm text-gray-500">{user.description}</p>
                  )}
                </div>
              </Link>
              {currentUser?.username !== user.username && (
                <button
                  onClick={() => handleFollowToggle(user.username)}
                  className={`px-4 py-2 rounded-lg ${
                    followingMap[user.username]
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {followingMap[user.username] ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : debouncedQuery ? (
        <div className="text-center text-gray-500 py-8">
          No users found matching "{debouncedQuery}"
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No recommendations available
        </div>
      )}
    </div>
  );
};

export default Explore; 