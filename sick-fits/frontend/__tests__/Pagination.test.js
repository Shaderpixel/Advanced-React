import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import Router from 'next/router';
import Pagination, { PAGINATION_QUERY } from '../components/Pagination';

// Mock the router to do nothing when pushing or prefetching
Router.router = {
  push() {},
  prefetch() {},
};

// Need to test for very little items, tons of items
function makeMocksFor(length) {
  return [
    {
      request: {
        query: PAGINATION_QUERY,
      },
      result: {
        data: {
          itemsConnection: {
            __typename: 'aggregate',
            aggregate: {
              __typename: 'count',
              count: length,
            },
          },
        },
      },
    },
  ];
}

describe('<Pagination />', () => {
  it('displays a loading message', () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(3)}>
        <Pagination page={1} />
      </MockedProvider>
    );

    expect(wrapper.text()).toContain('Loading...');
    // console.log(wrapper.debug());
  });

  it('renders pagination for 18 items', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={1} />
      </MockedProvider>
    );

    await wait();
    wrapper.update();
    expect(wrapper.find('.totalPages').text()).toEqual('5');
    const pagination = wrapper.find('div[data-test="pagination"]');
    expect(toJSON(pagination)).toMatchSnapshot();
    console.log(wrapper.debug());
  });

  it('disables prev button on first page', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={1} />
      </MockedProvider>
    );

    await wait();
    wrapper.update();
    // console.log(wrapper.debug());
    const prevButton = wrapper.find('a.prev');
    const nextButton = wrapper.find('a.next');
    expect(prevButton.prop('aria-disabled')).toEqual(true);
    expect(nextButton.prop('aria-disabled')).toEqual(false);
  });

  it('disables next button on last page', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={5} />
      </MockedProvider>
    );

    await wait();
    wrapper.update();
    // console.log(wrapper.debug());
    const prevButton = wrapper.find('a.prev');
    const nextButton = wrapper.find('a.next');
    expect(prevButton.prop('aria-disabled')).toEqual(false);
    expect(nextButton.prop('aria-disabled')).toEqual(true);
  });

  it('enables all buttons on any middle pages', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(18)}>
        <Pagination page={3} />
      </MockedProvider>
    );

    await wait();
    wrapper.update();
    console.log(wrapper.debug());
    const prevButton = wrapper.find('a.prev');
    const nextButton = wrapper.find('a.next');
    expect(prevButton.prop('aria-disabled')).toEqual(false);
    expect(nextButton.prop('aria-disabled')).toEqual(false);
  });
});
