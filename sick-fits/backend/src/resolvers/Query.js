const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  // instead of writing our own query for simple querying, we can just use the ones defined within Prisma API by forwarding the query to their API
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parents, args, ctx, info) {
    // check if there is a current user ID
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info,
    );
  },
  async users(parent, args, ctx, info) {
    // 1. Check if the user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in');
    }
    // 2. Check if the user has the permissions to query all the users, if there are no errors it will not return anything and keep going
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);
    // 3. if they do, query all the users!
    return ctx.db.query.users({}, info);
  },
  async order(parent, args, ctx, info) {
    // 1. Make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error("You aren't logged in");
    }
    // 2. Query the current order
    const order = await ctx.db.query.order({
      where: { id: args.id },
    }, info);
    // 3. Check if they have the permissions to see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes('ADMIN');
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error("You can't see this budd");
    }

    // 4. Return the order
    return order;
  },
  async orders(parent, args, ctx, info) {
    const { userId } = ctx.request;
    // 1. check if they are logged in
    if (!userId) {
      throw new Error('Please log in to view orders');
    }
    // return the order

    return ctx.db.query.orders({
      where: { user: { id: userId } },
    }, info);
  },
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // },
};

module.exports = Query;
