// we don't have to import react since Next.js will takecare of it for us.
// using stateless functional component
import Items from '../components/Items';

const Home = props => (
  <div>
    <Items page={parseFloat(props.query.page) || 1} /> 
  </div>
);

export default Home;
