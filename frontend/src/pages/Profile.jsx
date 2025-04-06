import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Edit3, LogOut, Trash2, X } from 'lucide-react';
import Post from '../components/Post';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getUserProfile {
      _id
      username
    }
  }
`;

const GET_USER_PROFILE = gql`
  query GetUserProfile($username: String) {
    getUserProfile(username: $username) {
      _id
      username
      profile_photo
      description
    }
    getFollowers(username: $username)
    getFollowing(username: $username)
  }
`;

const GET_USER_POSTS = gql`
  query GetUserPosts($username: String) {
    getUserProfile(username: $username) {
      _id
    }
  }
`;

const GET_POSTS_BY_USER = gql`
  query GetPostsByUser($userId: ID!) {
    getPostsByUser(userId: $userId) {
      _id
      imagePath
      description
      timestamp
      owner {
        _id
        username
        profile_photo
      }
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($profile_photo: String, $description: String) {
    updateProfile(profile_photo: $profile_photo, description: $description) {
      _id
      username
      profile_photo
      description
    }
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

const DELETE_PROFILE = gql`
  mutation DeleteProfile {
    deleteProfile
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileUsername, setProfileUsername] = useState(username);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPhoto, setEditPhoto] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  
  console.log('URL username param:', username);
  
  // Get current user from GraphQL query
  const { loading: userLoading, error: userError } = useQuery(GET_CURRENT_USER, {
    onCompleted: (data) => {
      if (data?.getUserProfile) {
        setCurrentUser(data.getUserProfile);
        
        // If no username in URL, redirect to current user's profile
        if (!username) {
          console.log('No username in URL, redirecting to current user profile');
          navigate(`/profile/${data.getUserProfile.username}`);
          return;
        }
        
        // Set the profile username from URL param
        setProfileUsername(username);
      } else {
        navigate('/login');
      }
    },
    onError: () => {
      navigate('/login');
    }
  });
  
  // Update profileUsername when URL parameter changes
  useEffect(() => {
    if (username) {
      console.log('URL username parameter changed to:', username);
      setProfileUsername(username);
    }
  }, [username]);
  
  // Second useEffect: Update isCurrentUser when currentUser or profileUsername changes
  useEffect(() => {
    if (currentUser && profileUsername) {
      setIsCurrentUser(currentUser.username === profileUsername);
      console.log('Is current user profile:', currentUser.username === profileUsername);
    }
  }, [currentUser, profileUsername]);
  
  // Get profile data with refetch capability
  const { loading: profileLoading, error: profileError, data: profileData, refetch: refetchProfile } = useQuery(GET_USER_PROFILE, {
    variables: { username: profileUsername },
    skip: !profileUsername,
    onCompleted: (data) => {
      console.log('Profile data loaded:', data);
      if (data?.getUserProfile) {
        setEditPhoto(data.getUserProfile.profile_photo || '');
        setEditDesc(data.getUserProfile.description || '');
      } else {
        console.error('No profile data found for username:', profileUsername);
        setError('Profile not found');
      }
      
      // Check if current user is following this profile
      if (data?.getFollowers && currentUser) {
        const isFollowing = data.getFollowers.includes(currentUser.username);
        console.log('Is current user following:', isFollowing);
        setIsFollowing(isFollowing);
      }
      
      console.log('Followers data:', data?.getFollowers);
      console.log('Following data:', data?.getFollowing);
    },
    onError: (error) => {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    }
  });
  
  // Get user ID for posts query
  const { data: userData, error: userDataError } = useQuery(GET_USER_POSTS, {
    variables: { username: profileUsername },
    skip: !profileUsername,
    onCompleted: (data) => {
      console.log('User data loaded:', data);
      if (data?.getUserProfile) {
        console.log('Setting userId to:', data.getUserProfile._id);
        setUserId(data.getUserProfile._id);
      } else {
        console.error('No user profile found in userData');
      }
    },
    onError: (error) => {
      console.error('Error fetching user data:', error);
    }
  });
  
  // Get posts for this user
  const { loading: postsLoading, error: postsError, data: postsData, refetch: refetchPosts } = useQuery(GET_POSTS_BY_USER, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      console.log('Posts data loaded:', data);
      if (data?.getPostsByUser) {
        console.log('Number of posts loaded:', data.getPostsByUser.length);
      } else {
        console.error('No posts data found in postsData');
      }
    },
    onError: (error) => {
      console.error('Error loading posts:', error);
      setError('Failed to load posts: ' + error.message);
    }
  });
  

  const [followUser] = useMutation(FOLLOW_USER, {
    onCompleted: (data) => {
      console.log('Follow successful:', data);
      setIsFollowing(true);
      // Refetch profile data to update followers count
      refetchProfile();
    },
    onError: (error) => {
      console.error('Follow error:', error);
      setError('Failed to follow user');
    }
  });
  
  const [unfollowUser] = useMutation(UNFOLLOW_USER, {
    onCompleted: (data) => {
      console.log('Unfollow successful:', data);
      setIsFollowing(false);
      // Refetch profile data to update followers count
      refetchProfile();
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
      setError('Failed to unfollow user');
    }
  });
  
  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      console.log('Profile updated:', data);
      setIsEditing(false);
      // Refetch profile data to show updated info
      refetchProfile();
    },
    onError: (error) => {
      console.error('Update profile error:', error);
      setError('Failed to update profile');
    }
  });
  
  const [deleteProfile] = useMutation(DELETE_PROFILE, {
    onCompleted: (data) => {
      console.log('Profile deleted:', data);
      navigate('/login');
    },
    onError: (error) => {
      console.error('Delete profile error:', error);
      setError('Failed to delete profile');
    }
  });
  
  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      // Clear the auth token cookie
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    }
  });
  
  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowUser({ variables: { target: profileUsername } });
    } else {
      followUser({ variables: { target: profileUsername } });
    }
  };
  
  const handleUpdateProfile = () => {
    updateProfile({
      variables: {
        profile_photo: editPhoto,
        description: editDesc
      }
    });
  };
  
  const handleDeleteProfile = () => {
    deleteProfile();
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const handleShowFollowers = () => {
    setShowFollowers(true);
    setShowFollowing(false);
  };
  
  const handleShowFollowing = () => {
    setShowFollowing(true);
    setShowFollowers(false);
  };
  
  const handleCloseModal = () => {
    setShowFollowers(false);
    setShowFollowing(false);
  };
  
  // Function to refresh all data
  const refreshAllData = () => {
    console.log('Refreshing all profile data');
    refetchProfile();
    refetchPosts();
  };
  
  if (userLoading || profileLoading || postsLoading) {
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
  
  if (profileError) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading profile: {profileError.message}
      </div>
    );
  }
  
  if (!profileData?.getUserProfile) {
    return (
      <div className="text-center text-yellow-500 p-4">
        No profile found for username: {profileUsername}
      </div>
    );
  }
  
  const profile = profileData.getUserProfile;
  const followers = profileData.getFollowers || [];
  const following = profileData.getFollowing || [];
  const posts = postsData?.getPostsByUser || [];
  
  console.log('Profile data:', profileData);
  console.log('Followers:', followers);
  console.log('Following:', following);
  console.log('Followers count:', followers.length);
  console.log('Following count:', following.length);
  
  // Ensure followers and following are arrays
  const followersArray = Array.isArray(followers) ? followers : [];
  const followingArray = Array.isArray(following) ? following : [];
  
  // Calculate counts
  const followersCount = followersArray.length;
  const followingCount = followingArray.length;
  const postsCount = posts.length;
  
  if (userDataError) {
    console.error('User data error:', userDataError);
    setError('Error loading user data: ' + userDataError.message);
  }

  if (postsError) {
    console.error('Posts error:', postsError);
    setError('Error loading posts: ' + postsError.message);
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img
              src={profile.profile_photo || '/default-avatar.png'}
              alt={profile.username}
              className="w-20 h-20 rounded-full mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {profile.description && (
                <p className="text-gray-600 mt-1">{profile.description}</p>
              )}
            </div>
          </div>
          
          {isCurrentUser ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                title="Edit Profile"
              >
                <Edit3 size={20} />
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                title="Delete Profile"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleFollowToggle}
              className={`px-4 py-2 rounded-lg ${
                isFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
        
        <div className="flex justify-between border-t border-b py-4 mb-6">
          <div className="text-center">
            <span className="font-bold text-xl text-black">{postsCount}</span>
            <p className="text-gray-600">Posts</p>
          </div>
          <div className="text-center cursor-pointer" onClick={handleShowFollowers}>
            <span className="font-bold text-xl text-black">{followersCount}</span>
            <p className="text-gray-600">Followers</p>
          </div>
          <div className="text-center cursor-pointer" onClick={handleShowFollowing}>
            <span className="font-bold text-xl text-black">{followingCount}</span>
            <p className="text-gray-600">Following</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map(post => (
              <Post 
                key={post._id} 
                post={post} 
                refetch={refreshAllData} 
                isCurrentUserProfile={isCurrentUser}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No posts yet
            </div>
          )}
        </div>
      </div>
      

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Profile Photo URL</label>
              <input
                type="text"
                value={editPhoto}
                onChange={(e) => setEditPhoto(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full p-2 border rounded"
                rows="3"
                placeholder="Tell us about yourself"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Profile</h2>
            <p className="mb-4">
              Are you sure you want to delete your profile? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      

      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Followers</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {followersArray.length > 0 ? (
                <ul className="divide-y">
                  {followersArray.map((follower) => (
                    <li key={follower} className="py-3">
                      <Link
                        to={`/profile/${follower}`}
                        className="flex items-center"
                        onClick={handleCloseModal}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium">
                            {follower[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{follower}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">No followers yet</p>
              )}
            </div>
          </div>
        </div>
      )}
      

      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Following</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {followingArray.length > 0 ? (
                <ul className="divide-y">
                  {followingArray.map((followed) => (
                    <li key={followed} className="py-3">
                      <Link
                        to={`/profile/${followed}`}
                        className="flex items-center"
                        onClick={handleCloseModal}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium">
                            {followed[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{followed}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">Not following anyone yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 
