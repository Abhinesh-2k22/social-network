// models/Post.js
import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  imagePath: { type: String, required: true }, // Path to the uploaded image
  description: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Post", PostSchema);