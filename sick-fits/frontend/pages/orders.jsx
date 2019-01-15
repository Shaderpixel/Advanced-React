import OrderList from '../components/OrderList';
import PleaseSignIn from '../components/PleaseSignIn';

const orders = props => (
  <div>
    <PleaseSignIn>
      <OrderList />
    </PleaseSignIn>
  </div>
);

export default orders;
