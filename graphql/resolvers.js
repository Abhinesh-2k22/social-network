import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Profile from "../models/Profile.js";
import { neo4jDriver } from "../config/db.js";
import BlacklistedToken from '../models/BlacklistedToken.js';
import Post from "../models/Post.js";
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import { finished } from 'stream/promises';
import { fileURLToPath } from 'url';

const generateToken = (username) => jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storeFile = async (file) => {
  const { createReadStream, filename } = await file;
  const stream = createReadStream();

  // Create a unique filename
  const uniqueFilename = `${Date.now()}-${filename}`;
  const uploadDir = path.join(__dirname, '../uploads');
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // Create a write stream
  const writeStream = fs.createWriteStream(filePath);
  
  // Pipe the read stream to the write stream
  stream.pipe(writeStream);
  
  // Wait for the stream to finish
  await finished(writeStream);
  
  return {
    filename: uniqueFilename,
    path: filePath,
    url: `/uploads/${uniqueFilename}`
  };
};

export default {
  Upload: {
    async resolve(parent, args, context, info) {
      console.log("Upload resolver called with args:", args);
      const { createReadStream, filename, mimetype, encoding } = await args;
      const stream = createReadStream();
      const file = await storeFS({ stream, filename });
      return { filename, mimetype, encoding, path: file };
    },
  },
  Query: {
    async getPostsForFollowers(_, __, context) {
      const username = context.user?.username;
      if (!username) throw new Error("Unauthorized");

      const profile = await Profile.findOne({ username });
      if (!profile) throw new Error("Profile not found");

      // Get the usernames of the users this profile follows from Neo4j
      const session = neo4jDriver.session();
      const followingResult = await session.run(
        "MATCH (u:User {username: $username})-[:FOLLOWS]->(f:User) RETURN f.username AS followedUsername",
        { username }
      );
      session.close();
      const followingUsernames = followingResult.records.map(record => record.get("followedUsername"));

      // Find the MongoDB profiles of the followed users
      const followedProfiles = await Profile.find({ username: { $in: followingUsernames } });
      const followedProfileIds = followedProfiles.map(p => p._id);

      // Retrieve posts from these followed users
      return await Post.find({ owner: { $in: followedProfileIds } }).populate('owner').sort({ timestamp: 'desc' });
    },
    async getUserProfile(_, { username }, context) {
      // If username is not provided, use the current user's username from context
      if (!username && context.user?.username) {
        username = context.user.username;
      }
      
      // If still no username, throw an error
      if (!username) {
        throw new Error("Username is required");
      }
      
      return await Profile.findOne({ username });
    },

    async getFollowers(_, { username }, context) {
      // If username is not provided, use the current user's username from context
      if (!username && context.user?.username) {
        username = context.user.username;
      }
      
      // If still no username, throw an error
      if (!username) {
        throw new Error("Username is required");
      }

      const session = neo4jDriver.session();
      const result = await session.run(
        "MATCH (u:User {username: $username})<-[:FOLLOWS]-(f) RETURN f.username",
        { username }
      );
      session.close();
      return result.records.map((r) => r.get("f.username"));
    },

    async getFollowing(_, { username }, context) {
      // If username is not provided, use the current user's username from context
      if (!username && context.user?.username) {
        username = context.user.username;
      }
      
      // If still no username, throw an error
      if (!username) {
        throw new Error("Username is required");
      }

      const session = neo4jDriver.session();
      const result = await session.run(
        "MATCH (u:User {username: $username})-[:FOLLOWS]->(f) RETURN f.username",
        { username }
      );
      session.close();
      return result.records.map((r) => r.get("f.username"));
    },
    async getMyPosts(_, __, context) {
      const username = context.user?.username;
      if (!username) throw new Error("Unauthorized");

      const profile = await Profile.findOne({ username });
      if (!profile) throw new Error("Profile not found");

      return await Post.find({ owner: profile._id }).populate('owner').sort({ timestamp: 'desc' });
    },

    async getPostsByUser(_, { userId }, context) {
      // Check if user is authenticated
      if (!context.user?.username) {
        console.log("Unauthorized: No user in context");
        throw new Error("Unauthorized");
      }
      
      console.log("Getting posts for user ID:", userId);
      
      // Find the profile by ID
      const profile = await Profile.findById(userId);
      if (!profile) {
        console.log("Profile not found for ID:", userId);
        throw new Error("Profile not found");
      }
      
      console.log("Found profile:", profile.username);
      
      // Return posts for this user
      const posts = await Post.find({ owner: userId }).populate('owner').sort({ timestamp: 'desc' });
      console.log(`Found ${posts.length} posts for user ${profile.username}`);
      
      return posts;
    },

    async searchUser(_, { username }, context) {
      const currentUsername = context.user?.username;
      console.log("Current username:", currentUsername);
      console.log("Searching for username:", username);
      if (!currentUsername) throw new Error("Unauthorized");
    
      // Exact match (case-insensitive) using findOne, excluding current user
      const result = await Profile.findOne({username});
      if (result && result.username === currentUsername) {
        return []; // Returning an empty array to align with the schema's [Profile] return type
      }
      return result ? [result] : [];
    },


    // async getRecommendations(_, __, context) {
    //   // Get the current user's username from the context
    //   const currentUsername = context.user?.username;
    //   if (!currentUsername) throw new Error("Unauthorized");

    //   const session = neo4jDriver.session();
    //   try {
    //     // Cypher query to find recommended users
    //     const result = await session.run(
    //       `
    //       MATCH (current:User {username: $currentUsername})-[:FOLLOWS]->(followed:User)<-[:FOLLOWS]-(rec:User)
    //       WHERE NOT (rec)-[:FOLLOWS]->(current)
    //         AND NOT (current)-[:FOLLOWS]->(rec)
    //         AND rec <> current
    //       RETURN rec.username AS username, count(followed) AS mutualCount
    //       ORDER BY mutualCount DESC
    //       LIMIT 5
    //       `,
    //       { currentUsername }
    //     );

    //     // Extract usernames from the query result
    //     const recommendedUsernames = result.records.map(record => record.get("username"));

    //     // Fetch profiles from MongoDB
    //     const recommendedProfiles = await Profile.find({ username: { $in: recommendedUsernames } });

    //     return recommendedProfiles;
    //   } finally {
    //     session.close();
    //   }
    // },
    async getRecommendations(_, __, context) {
      // Get the current user's username from the context
      const currentUsername = context.user?.username;
      if (!currentUsername) throw new Error("Unauthorized");
    
      const session = neo4jDriver.session();
      try {
        // Cypher query to find recommended users
        const result = await session.run(
          `
          MATCH (current:User {username: $currentUsername})-[:FOLLOWS]->(followed:User)<-[:FOLLOWS]-(rec:User)
          WHERE NOT (rec)-[:FOLLOWS]->(current)
            AND NOT (current)-[:FOLLOWS]->(rec)
            AND rec <> current
          RETURN rec.username AS username, count(followed) AS mutualCount
          ORDER BY mutualCount DESC
          LIMIT 5
          `,
          { currentUsername }
        );
    
        // Extract usernames from the query result
        const recommendedUsernames = result.records.map(record => record.get("username"));
    
        // Fetch profiles from MongoDB
        let recommendedProfiles = [];
        
        if (recommendedUsernames.length > 0) {
          recommendedProfiles = await Profile.find({ username: { $in: recommendedUsernames } });
        }
    
        // If no recommendations, return 5 random members
        if (recommendedProfiles.length < 2) {
          // Fetch 5 random profiles excluding the current user
          recommendedProfiles = await Profile.aggregate([
            { $match: { username: { $ne: currentUsername } } },
            { $sample: { size: 5 } }
          ]);
        }
    
        return recommendedProfiles;
      } finally {
        session.close();
      }
    }
  },
  Mutation: {
    async register(_, { username, password }) {
      const existing = await Profile.findOne({ username });
      if (existing) throw new Error("Username already taken");

      const hash = await bcrypt.hash(password, 10);
      const newProfile = new Profile({ username, password: hash });
      await newProfile.save();

      // Add to Neo4j too
      const session = neo4jDriver.session();
      await session.run(
        "CREATE (u:User {username: $username})",
        { username }
      );
      await session.close();

      return "Registration successful";
    },

    async login(_, { username, password }, { res }) {
      const profile = await Profile.findOne({ username });
      console.log("Profile found:", profile);
      if (!profile) throw new Error("User not found");

      const match = await bcrypt.compare(password, profile.password);
      if (!match) throw new Error("Invalid credentials");

      const token = generateToken(username);
      
      // Set the auth token cookie with proper options
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        domain: 'localhost' // Add domain for local development
      });
      
      console.log("Token set in cookie:", token);
      
      // Return the token in the response so the client can store it in memory
      return {
        success: true,
        token: token,
        username: username
      };
    },

    async logout(_, __, context) {
      const auth = context.req.headers.authorization || "";
      const token = auth.replace("Bearer ", "");

      if (!token) return "No token found";

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const alreadyBlacklisted = await BlacklistedToken.findOne({ token });
        if (alreadyBlacklisted) return "Already logged out";

        await BlacklistedToken.create({
          token,
          expiresAt: new Date(decoded.exp * 1000),
        });

        return "Logout successful";
      } catch (err) {
        return "Invalid token";
      }
    },

    async updateProfile(_, { profile_photo, description }, context) {
      const username = context.user?.username;
      if (!username) throw new Error("Not authenticated");

      return await Profile.findOneAndUpdate(
        { username },
        { profile_photo, description },
        { new: true }
      );
    },

    async followUser(_, { target }, context) {
      const username = context.user?.username;
      if (!username) throw new Error("Unauthorized");

      if (username === target) {
        throw new Error("You cannot follow yourself");
      }

      const session = neo4jDriver.session();

      // Check if relationship already exists
      const checkResult = await session.run(
        `
          MATCH (a:User {username: $username})-[r:FOLLOWS]->(b:User {username: $target})
          RETURN r
        `,
        { username, target }
      );

      if (checkResult.records.length > 0) {
        await session.close();
        return "Already following";
      }

      // Create follow relationship if it doesn't exist
      await session.run(
        `
          MATCH (a:User {username: $username}), (b:User {username: $target})
          CREATE (a)-[:FOLLOWS]->(b)
        `,
        { username, target }
      );

      await session.close();
      return "Followed successfully";
    },

    async unfollowUser(_, { target }, context) {
      const username = context.user?.username;
      if (!username) throw new Error("Unauthorized");

      const session = neo4jDriver.session();
      await session.run(
        "MATCH (a:User {username: $username})-[r:FOLLOWS]->(b:User {username: $target}) DELETE r",
        { username, target }
      );
      session.close();
      return "Unfollowed successfully";
    },
    async deleteProfile(_, __, { res, user }) {
      if (!user?.username) throw new Error("Not authenticated");

      const username = user.username;
      const profile = await Profile.findOne({ username });
      if (!profile) throw new Error("Profile not found");

      // Delete all posts by this user
      await Post.deleteMany({ owner: profile._id });

      // Delete the profile from MongoDB
      await Profile.deleteOne({ username });

      // Delete the user from Neo4j
      const session = neo4jDriver.session();
      await session.run("MATCH (u:User {username: $username}) DELETE u", { username });
      await session.close();

      // Clear the authentication cookie
      res.clearCookie('authToken');

      return "Profile deleted successfully";
    },

    async deletePost(_, { postId }, { user }) {
      if (!user?.username) throw new Error("Not authenticated");

      const post = await Post.findById(postId).populate('owner');
      if (!post) throw new Error("Post not found");

      if (post.owner.username !== user.username) {
        throw new Error("Not authorized to delete this post");
      }

      await Post.findByIdAndDelete(postId);
      return "Post deleted successfully";
    },

    async createPost(_, { imagePath, description }, context) {
      const username = context.user?.username;
      if (!username) throw new Error("Unauthorized");
    
      const profile = await Profile.findOne({ username });
      if (!profile) throw new Error("Profile not found");
    
      const newPost = new Post({
        owner: profile._id,
        imagePath, // This now comes directly as a path string
        description,
        timestamp: new Date()
      });
      
      const savedPost = await newPost.save();
      
      // Populate the owner field before returning
      return await Post.findById(savedPost._id).populate('owner');
    }
  },
};