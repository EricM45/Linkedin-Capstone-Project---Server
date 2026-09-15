# LinkedIn Clone — Server

An Express/MongoDB API for a LinkedIn-style professional network, built as a MERN stack capstone project. Pairs with the [client repo](https://github.com/EricM45/Linkedin-Capstone-Project---Client).

## Features

- JWT auth with bcrypt password hashing
- Posts, likes, comments, reposts
- Connections: requests, accept/ignore, suggestions
- Jobs: post, search, apply
- Real-time messaging and notifications via Socket.IO
- Security hardening: Helmet, rate limiting, no error-message leakage

## Tech Stack

Node.js · Express · MongoDB / Mongoose · Socket.IO · JWT · bcrypt · Helmet

## Getting Started

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your own MongoDB connection string and a random JWT secret:

```
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/linkedin_clone
JWT_SECRET=generate-a-long-random-string
CLIENT_URL=http://localhost:5173
```

Then seed the database with demo data and start the server:

```bash
npm run seed
npm run dev
```

The API runs on `http://localhost:4000`. Start the [client](https://github.com/EricM45/Linkedin-Capstone-Project---Client) to use it from the browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server with nodemon (auto-restart) |
| `npm start` | Start the server |
| `npm run seed` | Reset the database with realistic demo data |

## Demo Login

```
eric@gmail.com / 123
```

## Security Notes

`.env` is gitignored and never committed — use `.env.example` as a template. Never commit real database credentials or JWT secrets.
