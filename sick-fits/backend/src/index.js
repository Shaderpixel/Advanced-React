// let's go!
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: 'variables.env' });
const jwt = require('jsonwebtoken');
const createServer = require('./createServer');
const db = require('./db'); // db is the Prisma api: prisma.graphql

// spin up Yoga server
const server = createServer();

// Use express middleware to handle cookie JWT for authentication
server.express.use(cookieParser());

// Use express middleware to populate current user
// decode the JWT so we can get the user Id on each request
server.express.use((req, res, next) => {
  // console.log(req.cookies);
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put the userid onto the req for future requests to access
    req.userId = userId;
  }
  next();
});

// 2. Create a middleware that populates the user on each request
server.express.use(async (req, res, next) => {
  // if they aren't logged in, skip this
  if (!req.userId) return next();
  const user = await db.query.user({
    where: { id: req.userId }, // req.userId is populated in the previous middleware
  },
  '{id, permissions, email, name}'); // second argument is a graphQl query

  req.user = user; // set the user on every single request

  next();
});

server.start({
  // cors to only allow our website accessing the endpoint
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
  },
}, (deets) => {
  console.log(`Server is now running on port http://localhost:${deets.port}`);
});
