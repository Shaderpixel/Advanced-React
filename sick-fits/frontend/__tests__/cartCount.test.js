import { shallow, mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import CartCountComponent from '../components/CartCount';

describe('<CartCountComponent />', () => {
  it('render ', () => {
    shallow(<CartCountComponent count={10} />);
  });

  it('match the snapshot', () => {
    const wrapper = shallow(<CartCountComponent count={11} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('update via props', () => {
    const wrapper = shallow(<CartCountComponent count={50} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
    wrapper.setProps({ count: 10 });
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('should show mounting', () => {
    const wrapper = mount(<CartCountComponent count={50} />);
    console.log(wrapper.debug());
  });
});
