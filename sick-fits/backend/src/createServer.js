const { GraphQLServer } = require('graphql-yoga');
const Path = require('path');
// Resolvers
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const db = require('./db');

// Create the GraphQL Yoga Server

function createServer() {
  return new GraphQLServer({
    typeDefs: Path.resolve(__dirname, 'schema.graphql'),
    resolvers: {
      Mutation,
      Query,
    },
    resolverValidationOptions: {
      // to remove certain error validation messages
      requireResolversForResolveType: false,
    },
    context: req => ({ ...req, db }),
  });
}

module.exports = createServer;
