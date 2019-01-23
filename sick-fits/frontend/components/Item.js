// Handles the rendering of each individual item
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Title from './styles/Title';
import ItemStyles from './styles/ItemStyles';
import PriceTag from './styles/PriceTag';
import formatCurrency from '../lib/formatMoney';
import DeleteItem from './DeleteItem';
import AddToCart from './AddToCart';

export default class Item extends Component {
  static propTypes = {
    item: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      largeImage: PropTypes.string.isRequired,
    }),
  };

  render() {
    // console.log(this.props);
    const { item } = this.props;
    return (
      <ItemStyles>
        {item.image && <img src={item.image} alt={item.title} />}
        <Title>
          <Link
            href={{
              pathname: '/item',
              query: { id: item.id },
            }}
          >
            <a>{item.title}</a>
          </Link>
        </Title>
        <PriceTag>{formatCurrency(item.price)}</PriceTag>
        <p>{item.description}</p>
        <div className="buttonList">
          {/* buttonList class comes from ItemStyles.js */}
          <Link
            href={{
              pathname: 'update',
              query: { id: item.id },
            }}
          >
            <a>Edit ✏️</a>
          </Link>
          {/* How to do the optimistic response for adding to cart when cartItem.id is needed? */}
          <AddToCart id={item.id} itemDetails={{ ...this.props.item }} />
          <DeleteItem id={item.id}>Delete This Item 🗑</DeleteItem>
        </div>
      </ItemStyles>
    );
  }
}
