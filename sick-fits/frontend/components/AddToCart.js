import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const ADD_TO_CART_MUTATION = gql`
  mutation addToCart($id: ID!) {
    addToCart(id: $id) {
      id
      quantity
      item {
        # mirroring what is queried inside of User component
        id
        image
        price
        title
        description
        # comes with typename
      }
    }
  }
`;

class AddToCart extends React.Component {
  update = (cache, payload) => {
    console.log('Running add to cart update fn');
    // 1. read the cache and make a copy
    const data = cache.readQuery({
      query: CURRENT_USER_QUERY,
    });

    // 2. payload comes with the cartItem that is added. Check if there are existing items inside data.me.cart then increase quantity else create new cartItem
    console.log('me', data.me);
    console.log('payload.data', payload.data);
    const { cart } = data.me;
    if (payload.data.addToCart.id.startsWith('-')) {
      // payload comes from optimistic response because of negative random number
      // check if item in payload exists inside of cart (not the cartItem.id but the actual item.id). if it does then increase cartItem quantity by 1 else create new cartItem
      const payloadItemId = payload.data.addToCart.item.id;

      // there should only be one unique cartItem that should match. If this is empty means cartItem doesn't exist
      const existingCartItemIndex = cart.findIndex(
        cartItem => cartItem.item.id === payloadItemId
      );

      // if findIndex returns -1 means cartItem is not inside of cart
      if (existingCartItemIndex === -1) {
        cart.push(payload.data.addToCart);
      } else {
        cart[existingCartItemIndex].quantity += 1;
      }

      console.log('me2', data.me);
      // write data to cache
      cache.writeQuery({
        query: CURRENT_USER_QUERY,
        data,
      });
    } else {
      // payload comes from server response. If cartItem exists remove it from cart and replace it with the new cartItem in case details changed, otherwise push new cartItem into cart
      const payloadCartItemId = payload.data.addToCart.id;
      const matchingCartItemIndex = cart.findIndex(
        cartItem => cartItem.id === payloadCartItemId
      );

      // if findIndex returns -1 means cartItem is not inside of cart
      if (matchingCartItemIndex === -1) {
        cart.push(payload.data.addToCart);
      } else {
        cart.splice(matchingCartItemIndex, 1, payload.data.addToCart); // replace existing cartItem with payload's cartItem to retain position inside of array
      }

      // cart.length === 0 && cart.push(payload.data.addToCart);
      console.log('me3', data.me);
      cache.writeQuery({
        query: CURRENT_USER_QUERY,
        data,
      });
    }
  };

  render() {
    const { id, itemDetails } = this.props;
    return (
      <Mutation
        mutation={ADD_TO_CART_MUTATION}
        variables={{ id }}
        // refetchQueries={[{ query: CURRENT_USER_QUERY }]}
        // 1. write optimisticresponse
        optimisticResponse={{
          __typeName: 'Mutation',
          addToCart: {
            __typename: 'CartItem',
            id: Math.round(Math.random() * -1000000).toString(),
            quantity: 1,
            item: { ...itemDetails },
          },
        }}
        // 2. write update function
        update={this.update}
      >
        {(addToCart, { loading }) => (
          <button onClick={addToCart} disabled={loading}>
            Add{loading && 'ing'} To Cart 🛒
          </button>
        )}
      </Mutation>
    );
  }
}

export default AddToCart;
