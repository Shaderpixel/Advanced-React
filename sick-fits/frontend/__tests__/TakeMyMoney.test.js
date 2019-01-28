import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import NProgress from 'nprogress';
import router from 'next/router';
import { MockedProvider } from 'react-apollo/test-utils';
import Router from 'next/router';
import TakeMyMoney, { CREATE_ORDER_MUTATION } from '../components/TakeMyMoney';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser, fakeCartItem } from '../lib/testUtils';

Router.router = { push() {} };

const mocks = [
  {
    request: {
      query: CURRENT_USER_QUERY,
    },
    result: {
      data: {
        me: {
          ...fakeUser(),
          cart: [fakeCartItem()],
        },
      },
    },
  },
];

describe('<TakeMyMoney />', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const checkoutButton = wrapper.find('ReactStripeCheckout');
    expect(toJSON(checkoutButton)).toMatchSnapshot();
    // console.log(wrapper.debug());
  });
  it('creates an order ontoken', async () => {
    const createOrderMock = jest.fn().mockResolvedValue({
      data: { createOrder: { id: 'xyz789' } },
    });
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // gain access to the TakeMyMoney component's methods so that we can manually call onToken method
    const component = wrapper.find('TakeMyMoney').instance();
    // we manually provide a res.id and the createOrderMock function
    component.onToken({ id: 'abc123' }, createOrderMock);
    expect(createOrderMock).toHaveBeenCalled();
    expect(createOrderMock).toHaveBeenCalledWith({
      variables: { token: 'abc123' },
    });

    // no real need to test what the createOrderMock resolves to since we can't test it inside of onToken but we can test the outcome of the orderID as it will be used to push to a new /order page with that id. See following test.
    // expect(createOrderMock()).resolves.toEqual({
    //   data: { createOrder: { id: 'xyz789' } },
    // });
  });

  it('turns the progress bar on', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    NProgress.start = jest.fn();
    const createOrderMock = jest.fn().mockResolvedValue({
      data: { createOrder: { id: 'xyz789' } },
    });
    // gain access to the TakeMyMoney component's methods so that we can manually call onToken method
    const component = wrapper.find('TakeMyMoney').instance();
    // we manually provide a res.id and the createOrderMock function
    component.onToken({ id: 'abc123' }, createOrderMock);
    expect(NProgress.start).toHaveBeenCalled();
  });

  it('routes to the order page when completed', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const createOrderMock = jest.fn().mockResolvedValue({
      data: { createOrder: { id: 'xyz789' } },
    });
    // gain access to the TakeMyMoney component's methods so that we can manually call onToken method
    const component = wrapper.find('TakeMyMoney').instance();
    // mock the router
    Router.router.push = jest.fn();
    // we manually provide a res.id and the createOrderMock function
    component.onToken({ id: 'abc123' }, createOrderMock);
    await wait();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: '/order',
      query: {
        id: 'xyz789',
      },
    });
  });
});
