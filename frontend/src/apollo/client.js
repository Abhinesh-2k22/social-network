import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create an HTTP link to the GraphQL server
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include', // This will ensure cookies are sent with requests
});

// Add a custom logging link to log requests and responses
const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = new Date().getTime();
  
  // Log the request
  console.log('GraphQL Request:', {
    operationName: operation.operationName,
    query: operation.query.loc?.source.body,
    variables: operation.variables,
  });
  
  return forward(operation).map((response) => {
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    
    // Log the response
    console.log('GraphQL Response:', {
      operationName: operation.operationName,
      data: response.data,
      errors: response.errors,
      duration: `${duration}ms`,
    });
    
    return response;
  });
});

// Add auth link to handle additional authorization if needed
const authLink = setContext((_, { headers }) => {
  // Get the token from localStorage if it exists
  const token = localStorage.getItem('token');
  
  return {
    headers: {
      ...headers,
      // Add the token to the Authorization header if it exists
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Ensure credentials are included
    credentials: 'include',
  }
});

const client = new ApolloClient({
  link: authLink.concat(loggingLink.concat(httpLink)),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
  credentials: 'include', // This ensures cookies are sent with every request
});

export default client; 