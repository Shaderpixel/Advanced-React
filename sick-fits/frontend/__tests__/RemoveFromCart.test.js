import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import { ApolloConsumer } from 'react-apollo';
import RemoveFromCart, {
  REMOVE_FROM_CART_MUTATION,
} from '../components/RemoveFromCart';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser, fakeItem, fakeCartItem } from '../lib/testUtils';

global.alert = console.log;

const mocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: { ...fakeUser(), cart: [fakeCartItem({ id: fakeItem().id })] },
      },
    },
  },
  {
    request: {
      query: REMOVE_FROM_CART_MUTATION,
      variables: {
        id: fakeCartItem().id,
      },
    },
    result: {
      data: {
        removeFromCart: {
          __typename: fakeCartItem().__typename,
          id: fakeCartItem().id,
        },
      },
    },
  },
];

describe('<RemoveFromCart/>', () => {
  it('renders and matches snapshot', () => {
    const wrapper = mount(
      <MockedProvider>
        <RemoveFromCart id={fakeItem().id} />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('button'))).toMatchSnapshot();
  });

  it('removes the item from cart', async () => {
    let apolloClient;
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <ApolloConsumer>
          {client => {
            apolloClient = client;
            return <RemoveFromCart id={fakeItem().id} />;
          }}
        </ApolloConsumer>
      </MockedProvider>
    );

    const res = await apolloClient.query({
      query: CURRENT_USER_QUERY,
    });
    expect(res.data.me.cart).toHaveLength(1);
    expect(res.data.me.cart[0].item.price).toBe(5000);

    // simulate removal of item from cart
    wrapper.find('button').simulate('click');
    await wait();
    wrapper.update();
    // read the current user again
    const res2 = await apolloClient.query({
      query: CURRENT_USER_QUERY,
    });
    expect(res2.data.me.cart).toHaveLength(0);

    // console.log(res2.data.me);
  });
});
