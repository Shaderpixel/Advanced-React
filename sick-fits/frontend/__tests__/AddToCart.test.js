import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import { ApolloConsumer } from 'react-apollo';
import AddToCart, { ADD_TO_CART_MUTATION } from '../components/AddToCart';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser, fakeItem, fakeCartItem } from '../lib/testUtils';

const item = fakeItem();
const mocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: { ...fakeUser() },
      },
    },
  },
  // Add_To_Cart_Mutation query request-response combination
  {
    request: {
      query: ADD_TO_CART_MUTATION,
      variables: { id: item.id },
    },
    result: {
      data: {
        addToCart: {
          ...fakeCartItem(),
          quantity: 1,
        },
      },
    },
  },
];

describe('<AddToCart />', () => {
  it('renders and matches the snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <AddToCart id={item.id} itemDetails={{ ...item }} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(toJSON(wrapper.find('button'))).toMatchSnapshot();
    // console.log(wrapper.debug());
  });

  it('adds an item to cart when clicked', async () => {
    let apolloClient;
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <ApolloConsumer>
          {client => {
            apolloClient = client;
            // itemDetails prop needed for optimistic response
            return <AddToCart id={item.id} itemDetails={{ ...item }} />;
          }}
        </ApolloConsumer>
      </MockedProvider>
    );
    await wait();
    wrapper.update();

    const {
      data: { me }, // destructure {}.data.me
    } = await apolloClient.query({
      query: CURRENT_USER_QUERY,
    });
    expect(me.cart).toHaveLength(0);

    // add an item to the cart
    wrapper.find('button').simulate('click');
    await wait();

    // check if the item is now in the cart, cache needs to be requeried
    const {
      data: { me: me2 },
    } = await apolloClient.query({
      query: CURRENT_USER_QUERY,
    });
    // console.log(me2);
    expect(me2.cart).toHaveLength(1);
    expect(me2.cart[0].id).toEqual(fakeCartItem().id);
    expect(me2.cart[0].quantity).toEqual(1);
    // console.log(wrapper.debug());
  });

  it('changes from add to adding when button is clicked', async () => {
    let apolloClient;
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <ApolloConsumer>
          {client => {
            apolloClient = client;
            // itemDetails prop needed for optimistic response
            return <AddToCart id={item.id} itemDetails={{ ...item }} />;
          }}
        </ApolloConsumer>
      </MockedProvider>
    );
    await wait();
    wrapper.update();

    // for some reason, with the update function inside the AddToCart component, it will look for a me field so we need this
    const {
      data: { me }, // destructure {}.data.me
    } = await apolloClient.query({
      query: CURRENT_USER_QUERY,
    });

    await wait();
    wrapper.update();
    expect(wrapper.text()).toContain('Add To Cart');
    wrapper.find('button').simulate('click');
    expect(wrapper.text()).toContain('Adding To Cart');
    // console.log(wrapper.debug());
  });
});
