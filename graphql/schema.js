// schema.js
import { gql } from "apollo-server-express";

export default gql`
  scalar Upload
  
  type Profile {
    _id: ID!
    username: String!
    profile_photo: String
    description: String
  }
  
  
  type Post {
    _id: ID!
    owner: Profile!
    imagePath: String!
    description: String
    timestamp: String!
  }
  
  type User {
    id: ID!
    username: String!
    following: [String]
    followers: [String]
  }
  
  type UploadResponse {
    success: Boolean!
    filePath: String
    error: String
  }
  
  type LoginResponse {
    success: Boolean!
    token: String!
    username: String!
  }
  
  type Query {
    getPostsForFollowers: [Post]
    getUserProfile(username: String): Profile
    getFollowers(username: String): [String]
    getFollowing(username: String): [String]
    getRecommendations: [Profile]
    getMyPosts: [Post] 
    searchUser(username: String!): [Profile] 
    getPostsByUser(userId: ID!): [Post]
  }
  
  type Mutation {
    register(username: String!, password: String!): String
    login(username: String!, password: String!): LoginResponse
    updateProfile(profile_photo: String, description: String): Profile
    followUser(target: String!): String
    unfollowUser(target: String!): String
    logout: String
    createPost(imagePath: String!, description: String): Post
    deleteProfile: String 
    deletePost(postId: ID!): String 
  }
`;