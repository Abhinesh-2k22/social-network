const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');

// Create an Apollo Client
const client = new ApolloClient({
  link: createHttpLink({
    uri: 'http://localhost:4000/graphql',
    credentials: 'include'
  }),
  cache: new InMemoryCache()
});

// Test query for followers and following
const TEST_QUERY = gql`
  query TestQuery($username: String) {
    getUserProfile(username: $username) {
      username
    }
    getFollowers(username: $username)
    getFollowing(username: $username)
  }
`;

// Function to run the test
async function testGraphQL() {
  try {
    const result = await client.query({
      query: TEST_QUERY,
      variables: { username: 'abhi' }
    });
    
    console.log('GraphQL Test Result:', result);
    console.log('Followers:', result.data.getFollowers);
    console.log('Following:', result.data.getFollowing);
  } catch (error) {
    console.error('GraphQL Test Error:', error);
  }
}

// Run the test
testGraphQL(); 