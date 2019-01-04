/* eslint-disable react/react-in-jsx-scope */
import Link from 'next/link';
import UpdateItem from '../components/UpdateItem';

// query is destructured from props
const Sell = ({ query }) => (
  <div>
    <UpdateItem id={query.id} />
  </div>
);

export default Sell;
