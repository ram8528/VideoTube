# VideoTube Backend

This is the backend for the VideoTube application, a platform for users to upload, view, and interact with videos. This backend is built using Node.js, Express, and MongoDB.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Videos](#videos)
  - [Playlists](#playlists)
  - [Subscriptions](#subscriptions)
  - [Dashboard](#dashboard)
- [Models](#models)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/videotube-backend.git
   cd videotube-backend

   Install dependencies:

Set up environment variables:    npm install

Create a .env file in the root directory and add the following variables:
PORT=3000
MONGODB_URI=mongodb://localhost:27017/videotube
JWT_SECRET=your_jwt_secret

Start the server:  npm start

