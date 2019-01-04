// we don't have to import react since Next.js will takecare of it for us.
// using stateless functional component
import SingleItem from '../components/SingleItem';

const Item = props => (
  <div>
    <SingleItem id={props.query.id} />
  </div>
);

export default Item;
