import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

// Query to get the current user's profile
const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getUserProfile {
      _id
      username
    }
  }
`;

// Mutation to log out
const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUsername, setCurrentUsername] = useState(null);
  
  // Get current user from GraphQL query
  const { loading, error } = useQuery(GET_CURRENT_USER, {
    onCompleted: (data) => {
      if (data?.getUserProfile) {
        setCurrentUsername(data.getUserProfile.username);
      } else {
        navigate('/login');
      }
    },
    onError: () => {
      navigate('/login');
    }
  });
  
  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      // Clear the auth token cookie
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
      
      // Redirect to login
      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
    }
  });

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    { name: 'Feed', href: '/feed', icon: HomeIcon },
    { name: 'Explore', href: '/explore', icon: MagnifyingGlassIcon },
    { name: 'Create Post', href: '/post', icon: PlusCircleIcon },
    { name: 'Profile', href: `/profile/${currentUsername}`, icon: UserCircleIcon },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center h-16 px-4 border-b">
              <h1 className="text-xl font-bold text-blue-600">Social Network</h1>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {currentUsername ? currentUsername[0].toUpperCase() : '?'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{currentUsername || 'User'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-100"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 ml-64">
          <main className="p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout; 