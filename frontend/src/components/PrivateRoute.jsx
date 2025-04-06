import { Navigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const CHECK_AUTH = gql`
  query CheckAuth {
    getMyPosts {
      _id
    }
  }
`;

const PrivateRoute = ({ children }) => {
  const { loading, error } = useQuery(CHECK_AUTH, {
    fetchPolicy: 'network-only',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    console.error('Authentication error:', error);
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute; 