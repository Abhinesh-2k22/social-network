# Social Network Clone

A full-stack social network application built with Node.js, Express, GraphQL, MongoDB, and Neo4j.

## Features

- User authentication (register, login, logout)
- User profiles with customizable photos and descriptions
- Follow/unfollow other users
- Create posts with images and descriptions
- View posts from users you follow
- Delete your own posts
- User search and recommendations

## Tech Stack

### Backend
- Node.js and Express
- GraphQL with Apollo Server
- MongoDB for user profiles and posts
- Neo4j for social graph (following relationships)
- JWT for authentication
- Multer for file uploads

### Frontend
- React
- Apollo Client for GraphQL
- Material UI for components
- React Router for navigation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Neo4j Database

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/social-network-clone.git
cd social-network-clone
```

2. Install backend dependencies:
```
npm install
```

3. Install frontend dependencies:
```
cd frontend
npm install
cd ..
```

4. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
NEO4J_URI=your_neo4j_connection_string
NEO4J_USER=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password
JWT_SECRET=your_jwt_secret
```

## Running the Application

1. Start the backend server:
```
npm start
```

2. In a separate terminal, start the frontend development server:
```
cd frontend
npm start
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
social-network-clone/
├── config/             # Database configuration
├── graphql/            # GraphQL schema and resolvers
├── models/             # MongoDB models
├── uploads/            # Uploaded files
├── frontend/           # React frontend
│   ├── public/         # Static files
│   └── src/            # React components
├── server.js           # Express server
└── .env                # Environment variables
```

## License

MIT 