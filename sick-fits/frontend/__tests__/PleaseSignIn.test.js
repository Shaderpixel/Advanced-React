import { mount } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import wait from 'waait';
import { fakeUser } from '../lib/testUtils';
import { CURRENT_USER_QUERY } from '../components/User';
import PleaseSignIn from '../components/PleaseSignIn';

const notSignedinMocks = [
  {
    request: {
      query: CURRENT_USER_QUERY,
    },
    result: {
      data: {
        me: null,
      },
    },
  },
];

const signedinMocks = [
  {
    request: {
      query: CURRENT_USER_QUERY,
    },
    result: {
      data: {
        me: fakeUser(),
      },
    },
  },
];

describe('<PleaseSignIn />', () => {
  it('should render the sign in dialog to logged out users', async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedinMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );

    await wait();
    wrapper.update();

    expect(wrapper.text()).toContain('Please Sign In Before Continuing');
    expect(wrapper.find('Signin').exists()).toBeTruthy();

    // console.log(wrapper.debug());
  });

  it('should render the child component when the user is signed in', async () => {
    const Hey = () => <p>Hey!</p>; // mock child component

    const wrapper = mount(
      <MockedProvider mocks={signedinMocks}>
        <PleaseSignIn>
          <Hey />
        </PleaseSignIn>
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // console.log(wrapper.debug());
    expect(wrapper.text()).toContain('Hey!');
    // expect(wrapper.find('Hey').exists()).toBe(true);
    // expect(wrapper.find('Hey')).toHaveLength(1); // similar to the one before
    expect(wrapper.contains(<Hey />)).toBe(true); // similar to the one before
  });
});
