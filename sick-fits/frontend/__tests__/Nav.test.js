import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import { CURRENT_USER_QUERY } from '../components/user';
import Nav from '../components/Nav';
import { fakeUser, fakeCartItem } from '../lib/testUtils';

const NotSignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: null } },
  },
];

const signedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: fakeUser() } },
  },
];

const signedInMocksWithCartItems = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          ...fakeUser(),
          cart: [fakeCartItem(), fakeCartItem(), fakeCartItem()],
        },
      },
    },
  },
];

describe('<Nav />', () => {
  it('should render a minimal nav when signed out', async () => {
    const wrapper = mount(
      <MockedProvider mocks={NotSignedInMocks}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.text()).toContain('Sign In');
    // console.log(wrapper.debug());

    const nav = wrapper.find('ul[data-test="nav"]');
    expect(toJSON(nav)).toMatchSnapshot();
  });

  it('should render full nav when signed in', async () => {
    const wrapper = mount(
      <MockedProvider mocks={signedInMocks}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const nav = wrapper.find('ul[data-test="nav"]');
    console.log(nav.debug());
    expect(nav.children().length).toBe(7);
    expect(nav.text()).toContain('Sign Out');
    expect(nav.text()).toContain('Sell');
    expect(nav.text()).toContain('Orders');
    expect(nav.text()).toContain('Account');
    expect(nav.find('Link')).toHaveLength(5);
    expect(
      nav
        .find('Link')
        .at(0)
        .props().href
    ).toBe('/items');
    expect(
      nav
        .find('Link')
        .at(1)
        .props().href
    ).toBe('/sell');
    expect(
      nav
        .find('Link')
        .at(2)
        .props().href
    ).toBe('/orders');
    expect(
      nav
        .find('Link')
        .at(3)
        .props().href
    ).toBe('/me');
    // console.log(
    //   nav
    //     .children()
    //     .find('Link')
    //     .debug()
    // );
    // expect(toJSON(nav)).toMatchSnapshot();
  });

  // not really necessary since we already have a test for cartCount, this is just for demo purposes
  it('should render the amount of items in the cart', async () => {
    const wrapper = mount(
      <MockedProvider mocks={signedInMocksWithCartItems}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const nav = wrapper.find('ul[data-test="nav"]');
    const count = nav.find('div.count');
    // console.log(count.debug());
    expect(toJSON(count)).toMatchSnapshot();
  });
});
