const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto'); // node built in module
const { promisify } = require('util'); // node built in module to turn callback based function into promise based function
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');
const cloudinary = require('../cloudinary');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          user: {
            // this is how we create a relationship between the item and the user
            connect: { id: ctx.request.userId },
          },
          ...args,
        },
      },
      info,
    );

    return item;
  },

  async updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    const itemId = args.id;
    // remove the ID from the updates
    delete updates.id;
    // use the itemId to query for the item's existing imagePublicID
    const item = await ctx.db.query.item({
      where: { id: itemId },
    });
    // TODO need to check if images are part of the args before calling the delete function args.image && deleteImage()

    async function deleteImage(imagePublicId) {
      return cloudinary.v2.uploader.destroy(
        imagePublicId, { invalidate: true },
        (error, result) => {
          if (error) console.log(`Error deleting image: ${JSON.stringify(error)}`);
          console.log(`Result of deleting image: ${JSON.stringify(result.result)}`);
        },
      );
    }

    // use Cloudinary SDK to delete the existing image via the signed preset
    const { imagePublicId } = item;
    const deleteRes = await args.image && deleteImage(imagePublicId);
    console.log(deleteRes);
    // run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: { id: args.id },
      },
      info,
    );
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. Find the item, instead of passing _info_ we ask for specific details
    // we request for the user.id by requesting for the user first
    const item = await ctx.db.query.item({ where }, '{id title imagePublicId user {id}}');
    // console.log(item);
    // 2. Check if they own that item, or have the permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission));

    if (!ownsItem && !hasPermissions) {
      throw new Error("You don't have permissions to do that!");
    }

    // 3. Delete it!
    function deleteImage(imagePublicId) {
      return cloudinary.v2.uploader.destroy(
        imagePublicId, { invalidate: true },
        (error, result) => {
          if (error) console.log(`Error deleting image: ${JSON.stringify(error)}`);
          console.log(`Result of deleting image: ${JSON.stringify(result.result)}`);
        },
      );
    }

    // use Cloudinary SDK to delete the existing image via the signed preset
    const { imagePublicId } = item;
    const deleteRes = await imagePublicId && deleteImage(imagePublicId);
    console.log(deleteRes);
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    // lowercase their email
    console.log(args);
    args.email = args.email.toLowerCase();
    // hash & salt their password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }, // set default permission to user
        },
      },
      info,
    );
    // create a JWT for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // we set the JWT as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true, // allow only http access your cookies and not through other means such as JS from libraries or browser extensions
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // Finally we return the user to the browser
    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      // error messsage will be caught by our front-end query/mutation
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!');
    }
    // 3. generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. Return the user
    return user;
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },

  async requestReset(parent, { email }, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. Set a reset token and expiry on that user.
    // Token needs to be random, unique, and cryptographically strong
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      data: { resetToken, resetTokenExpiry },
      where: { email },
    });
    // 3. Email them that reset token
    const mailRes = await transport.sendMail({
      from: 'lock.j.h@gmail.com',
      to: user.email,
      subject: 'Your password reset token',
      html: makeANiceEmail(`Your Password Reset Token is here!
      \n\n
      <a href="${
  process.env.FRONTEND_URL
}/reset?resetToken=${resetToken}">Click Here to Reset</a>`),
    });

    // 4. Return the message
    return { message: 'Thanks!' };
  },

  async resetPassword(
    parent,
    { password, confirmPassword, resetToken },
    ctx,
    info,
  ) {
    // 1. check if the passwords match
    if (password !== confirmPassword) {
      throw new Error("Your passwords don't match");
    }
    // 2. check if its a legit reset token (why this is not first step)
    // 3. check if reset token has expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - 60 * 60 * 1000, // why minus again?
        // oldDateNow + (60 * 60 * 1000) >= newDateNow
      },
    });
    if (!user) {
      throw new Error('This token is either invalid or expired!');
    }
    // 4. hash their new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // 5. save the new password to the user and remove the old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 8. return the new user
    return updatedUser;
  },

  async updatePermissions(parent, args, ctx, info) {
    // 1. Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do this!');
    }
    // 2. Query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      info,
    );
    // 3. Check if they have permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // 4. Update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: { id: args.userId },
      },
      info,
    );
  },

  async addToCart(parent, args, ctx, info) {
    const { userId } = ctx.request;
    // 1. Make sure they are signed in
    if (!userId) {
      throw new Error('You must be signed in!');
    }
    // 2. Query the users current cart using both the userId and the item's id as a unique combo pair since we don't know the cartItem's unique ID
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }, // the item that we're going to be passing along from client
      },
    });
    // 3. Check if the item is already in their cart and increment by 1 if it is
    if (existingCartItem) {
      console.log('This item is already in their cart');
      return ctx.db.mutation.updateCartItem(
        {
          where: {
            id: existingCartItem.id,
          },
          data: {
            quantity: existingCartItem.quantity + 1,
          },
        },
        info,
      );
    }
    // 4. If its not, create a fresh CartITem for that user!
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: { connect: { id: userId } },
          item: { connect: { id: args.id } },
        },
      },
      info,
    );
  },

  async removeFromCart(parent, args, ctx, info) {
    // 1. Find the cart item
    const cartItem = await ctx.db.query.cartItem(
      { where: { id: args.id } },
      `{
        id
        user {id}
      }`,
    );
    // 1.5 make sure we found an item
    if (!cartItem) throw new Error('No cart item found!');
    // 2. Make sure they own that cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('Cheatin huhh');
    }
    // 3. Delete the cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: {
          id: args.id,
        },
      },
      info,
    );
  },

  async createOrder(parents, args, ctx, info) {
    // 1. Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in to complete this order.');
    }
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `
      {id
      name
      email
      cart {
        id
        quantity
        item {
          id
          title
          description
          price
          image
          largeImage
        }
      }}
    `,
    );
    // 2. Recalculate the total price server side to avoid client hacks
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.quantity * cartItem.item.price,
      0,
    );
    console.log(`Going to charge for a total of ${amount}`);
    console.log(user);
    // 3. Create the stripe charge (turn token into money)
    // create variable object that stores metadara loop over and store cartid and quantity?
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token,
    });
    console.log(charge);
    // 4. Convert the CartItems to OrderItems - an array of OrderItem
    const orderItems = user.cart.map((cartItem) => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } }, // create a relationship here with the current logged in user
      };
      delete orderItem.id; // remove the item id
      return orderItem;
    });
    // 5. Create the Order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } },
      },
    });
    // 6. Clean up - clear the users cart, delete cartItems
    // get all the cartItem ids inside the user's cart
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    // delete the cartItems
    await ctx.db.mutation.deleteManyCartItems({
      where: { id_in: cartItemIds },
    });
    // 7. Return Order to the client
    return order;
  },
};

module.exports = Mutations;
