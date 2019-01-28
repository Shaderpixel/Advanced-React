import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import Router from 'next/router';
import { MockedProvider } from 'react-apollo/test-utils';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';
import { fakeItem } from '../lib/testUtils';

describe('<CreateItem />', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    // console.log(wrapper.find('form[data-test="form"]').debug());
    expect(toJSON(wrapper.find('form[data-test="form"]'))).toMatchSnapshot();
  });

  it('uploads a file when changed', async () => {
    const dogImage = 'https://dog.com/dog.jpg';

    // mock the global browser fetch API
    global.fetch = jest.fn().mockResolvedValue({
      json: () => ({
        secure_url: dogImage,
        eager: [{ secure_url: dogImage }],
        public_id: '123abc',
      }),
    });

    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );

    const input = wrapper.find('input[name="file"]');
    input.simulate('change', {
      target: {
        files: ['fakedog.jpg'],
      },
    });

    await wait();
    wrapper.update();
    const component = wrapper.find('CreateItem').instance();
    // console.log(component);
    expect(component.state.image).toEqual(dogImage);
    expect(component.state.largeImage).toEqual(dogImage);
    expect(component.state.imagePublicId).toEqual('123abc');
    expect(global.fetch).toHaveBeenCalled();
    // expect(global.fetch).toHaveBeenCalledWith(
    //   'https://api.cloudinary.com/v1_1/shaderpixel/image/upload',
    //   {"body": {Symbol(impl): {"_entries": [{"name": "file", "value": "fakedog.jpg"}, {"name": "upload_preset", "value": "sickfits"}], Symbol(wrapper): [Circular]}}, "method": "POST"}
    // );
    global.fetch.mockReset();
  });

  it('handles state updating', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    wrapper
      .find('#title')
      .simulate('change', { target: { name: 'title', value: 'Testing' } });
    wrapper.find('#price').simulate('change', {
      target: { name: 'price', value: 50000, type: 'number' },
    });
    wrapper.find('#description').simulate('change', {
      target: { name: 'description', value: 'This is a really nice item' },
    });
    expect(wrapper.find('CreateItem').instance().state).toMatchObject({
      title: 'Testing',
      price: 50000,
      description: 'This is a really nice item',
    });
  });

  it('creates an item when the form is submitted', async () => {
    const item = fakeItem();

    global.fetch = jest.fn().mockResolvedValue({
      json: () => ({
        secure_url: item.image,
        eager: [{ secure_url: item.largeImage }],
        public_id: item.imagePublicId,
      }),
    });

    const mocks = [
      {
        request: {
          query: CREATE_ITEM_MUTATION,
          variables: {
            title: item.title,
            description: item.description,
            image: item.image,
            largeImage: item.largeImage,
            imagePublicId: item.imagePublicId,
            price: item.price,
          },
        },
        result: {
          data: {
            createItem: {
              ...item,
            },
          },
        },
      },
    ];

    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );

    // Simulate someone filling up the form
    wrapper
      .find('#title')
      .simulate('change', { target: { name: 'title', value: item.title } });
    wrapper.find('#price').simulate('change', {
      target: { name: 'price', value: item.price, type: 'number' },
    });
    wrapper.find('#description').simulate('change', {
      target: { name: 'description', value: item.description },
    });
    wrapper.find('input[name="file"]').simulate('change', {
      target: {
        files: ['fakedog.jpg'],
      },
    });
    await wait();

    // mock the router
    Router.router = { push: jest.fn() };
    wrapper.find('form').simulate('submit');
    await wait(100);
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: '/item',
      query: { id: 'abc123' },
    });
    global.fetch.mockReset();
  });
});
