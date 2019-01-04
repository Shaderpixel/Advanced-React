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
        # query what is requested in User
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
    // 2. check if there are existing items inside data.me.cartItems then increase quantity else create temp cartItems
    console.log('me', data.me);
    console.log('payload.data', payload.data);
    const cart = data.me.cart;
    if (!cart.length && payload.data.addToCart.id.startsWith('-')) {
      cart.push({
        id: payload.data.addToCart.id,
        quantity: payload.data.addToCart.quantity,
        item: { ...payload.data.addToCart.item },
        __typename: 'CartItem',
      });

      console.log('me2', data.me);
      // 3. write data to cache
      cache.writeQuery({
        query: CURRENT_USER_QUERY,
        data,
      });
    } else {
      // perform a refetch of the CURRENT_USER_QUERY because the payload no longer has the itemDetail that we initially sent over..not sure how
      cart.length === 0 && cart.push(payload.data.addToCart);
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
