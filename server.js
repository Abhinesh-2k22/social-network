// server.js
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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

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

app.use(cors());
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

const context = async ({ req }) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (!token) return { user: null, req };

  // Check if token is blacklisted
  const isBlacklisted = await BlacklistedToken.findOne({ token });
  if (isBlacklisted) {
    throw new Error("Token is blacklisted");
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return { user, req };
  } catch (err) {
    console.log("JWT verification failed:", err.message);
    return { user: null, req };
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  csrfPrevention: false
});

await server.start();
server.applyMiddleware({ app });

connectMongo();
connectNeo4j();

app.listen(4000, () => console.log(`Server running at http://localhost:4000/graphql`));