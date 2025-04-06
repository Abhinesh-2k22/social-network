import express from "express";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import multer from "multer"; // Install with: npm install multer
import dotenv from "dotenv";
import typeDefs from "./graphql/schema.js";
import resolvers from "./graphql/resolvers.js";
import { connectMongo, connectNeo4j } from "./config/db.js";
import jwt from "jsonwebtoken";
import BlacklistedToken from "./models/BlacklistedToken.js";
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cookieParser());

// Setup storage for multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

//gemini app.use(cors({}));
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend domain
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create a separate route for file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return the file path that can be saved in the database
  return res.json({
    success: true,
    filePath: `/uploads/${req.file.filename}`
  });
});

// Update your context function in server.js
const context = async ({ req, res }) => {
  // Get the token from cookie or authorization header
  const authCookie = req.cookies ? req.cookies.authToken : null;
  const authHeader = req.headers.authorization || "";
  const token = authCookie || authHeader.replace("Bearer ", "");
  
  console.log("Cookies:", req.cookies);
  console.log("Auth cookie:", authCookie);
  console.log("Auth header:", authHeader);
  console.log("Final token:", token);
  
  if (!token) {
    console.log("No token found in request");
    return { user: null, req, res };
  }

  // Check if token is blacklisted
  const isBlacklisted = await BlacklistedToken.findOne({ token });
  if (isBlacklisted) {
    console.log("Token is blacklisted");
    throw new Error("Token is blacklisted");
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified, user:", user);
    return { user, req, res };
  } catch (err) {
    console.log("JWT verification failed:", err.message);
    return { user: null, req, res };
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  csrfPrevention: false,
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
  }
});

await server.start();
server.applyMiddleware({ 
  app,
  cors: false,
  path: '/graphql'
});

connectMongo();
connectNeo4j();

app.listen(4000, () => console.log(`Server running at http://localhost:4000/graphql`));