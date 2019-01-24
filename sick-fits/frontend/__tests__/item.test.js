import { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';
import Item from '../components/Item';
import AddtoCartComponent from '../components/AddToCart';
import DeleteItem from '../components/DeleteItem';

const fakeItem = {
  id: 'ABC123',
  title: 'A Cool Item',
  price: 50000,
  description: 'This item is really cool!',
  image: 'dog.jpg',
  largeImage: 'largeDog.jpg',
};

describe('<Item />', () => {
  // it('render the image properly', () => {
  //   const wrapper = shallow(<Item item={fakeItem} />);
  //   const img = wrapper.find('img');
  //   // console.log(img.props());
  //   expect(img.props().src).toBe(fakeItem.image);
  //   expect(img.props().alt).toBe(fakeItem.title);
  // });
  // it('render the title and PriceTag properly', () => {
  //   const wrapper = shallow(<Item item={fakeItem} />);
  //   const PriceTag = wrapper.find('PriceTag');
  //   // console.log(PriceTag.children().text());
  //   // console.log(PriceTag.dive().text());
  //   // console.log(wrapper.debug());
  //   // console.log(PriceTag.debug());
  //   expect(PriceTag.children().text()).toBe('$500');
  //   expect(wrapper.find('Title a').text()).toBe(fakeItem.title);
  // });
  // it('render out the buttons properly', () => {
  //   const wrapper = shallow(<Item item={fakeItem} />);
  //   // console.log(wrapper.debug());
  //   const buttonList = wrapper.find('.buttonList');
  //   console.log(buttonList.children().debug());
  //   expect(buttonList.children()).toHaveLength(3);
  //   // check to see if the button components exist
  //   expect(
  //     buttonList.children().containsMatchingElement(DeleteItem)
  //   ).toEqual(true);
  //   // or check if the button selectors are there
  //   expect(buttonList.find('Link')).toHaveLength(1);
  //   expect(buttonList.find('Link').exists()).toBe(true);
  //   expect(buttonList.find('AddToCart').exists()).toBe(true);
  //   expect(buttonList.find('DeleteItem').exists()).toBe(true);
  //   expect(buttonList.find('Link')).toBeTruthy();
  // });
  // snapshot testing
  it('render and match the snapshot', () => {
    const wrapper = shallow(<Item item={fakeItem} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });
});
