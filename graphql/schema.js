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
  
  type Message {
    _id: ID!
    owner: Profile!
    message: String!
    timestamp: String!
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
  
  type Query {
    getPostsForFollowers: [Post]
    getUserProfile(username: String!): Profile
    getFollowers(username: String!): [String]
    getFollowing(username: String!): [String]
    getMessages(username: String!): [Message]
    getRecommendations: [Profile]
  }
  
  type Mutation {
    register(username: String!, password: String!): String
    login(username: String!, password: String!): String
    updateProfile(profile_photo: String, description: String): Profile
    followUser(target: String!): String
    unfollowUser(target: String!): String
    sendMessage(message: String!): Message
    deleteMessage(messageId: ID!): String
    logout: String
    createPost(imagePath: String!, description: String): Post
  }
`;