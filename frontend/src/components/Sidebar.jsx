import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User, LogOut } from 'lucide-react';
import { useMutation, gql } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [logout] = useMutation(LOGOUT_MUTATION);
  const [currentUsername, setCurrentUsername] = useState(null);

  // Get current user from token whenever location changes
  useEffect(() => {
    const getCurrentUser = () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
      if (!token) return null;
      try {
        const decoded = jwtDecode(token);
        return decoded.username;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    };

    const username = getCurrentUser();
    setCurrentUsername(username);
    console.log('Current username in sidebar:', username);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      // Clear the auth token cookie
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 p-4">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <nav className="space-y-2">
            <Link
              to="/"
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <Home size={24} />
              <span>Home</span>
            </Link>
            <Link
              to="/explore"
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <Search size={24} />
              <span>Explore</span>
            </Link>
            {currentUsername && (
              <Link
                to={`/profile/${currentUsername}`}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                <User size={24} />
                <span>Profile</span>
              </Link>
            )}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg text-red-500"
        >
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 