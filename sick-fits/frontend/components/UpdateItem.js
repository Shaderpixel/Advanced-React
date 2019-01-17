import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';

const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      price
      image
    }
  }
`;
const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
    # Passing in arguments to the UPDATE_ITEM_MUTATION function. Typed language, also variables are prefixed with $ sign
    $id: ID!
    $title: String
    $description: String
    $price: Int
    $image: String
    $largeImage: String
    $imagePublicId: String
  ) {
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
      imagePublicId: $imagePublicId
    ) {
      id # return the id
      title
      description
      price
      image # return the updated image so that we can update the state
    }
  }
`;

class UpdateItem extends Component {
  state = {};

  handleChange = e => {
    const { name, type, value } = e.target;
    const val = value && type === 'number' ? parseFloat(value) : value;
    this.setState({ [name]: val });
  };

  updateItem = async (e, updateItemMutation) => {
    // console.log(updateItemMutation);
    e.preventDefault();
    console.log('Updating Item!!');
    console.log(this.state);
    const res = await updateItemMutation({
      variables: {
        id: this.props.id,
        ...this.state,
      },
    });
    this.setState({ image: res.data.updateItem.image });
    console.log('updated');
  };

  uploadFile = async e => {
    console.log(e.target.files);
    const files = e.target.files;
    if (!files.length) return; // no files added
    // console.log('files', files);
    const data = new FormData();
    data.append('file', files[0]);
    data.append('upload_preset', 'sickfits');
    const res = await fetch(
      'https://api.cloudinary.com/v1_1/shaderpixel/image/upload',
      {
        method: 'POST',
        body: data,
      }
    );
    const file = await res.json();
    console.log(file);
    this.setState({
      image: file.secure_url,
      largeImage: file.eager[0].secure_url,
      imagePublicId: file.public_id,
    });
  };

  render() {
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id }}>
        {({ data, loading }) => {
          console.log('data', data);
          if (loading) return <p>Loading...</p>;
          if (!data.item) return <p>No Item Found for ID {this.props.id}.</p>;
          return (
            // data and loading from payload is now exposed to Mutation because of parent child relationship
            <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
              {(updateItem, { loading, error }) => (
                // updateItem is the mutation call, this.updateItem is the component method
                <Form onSubmit={e => this.updateItem(e, updateItem)}>
                  <Error error={error} />
                  {/* Only displayed if error is passed to the Error component. SEe ErrorMessage.js */}
                  <fieldset disabled={loading} aria-busy={loading}>
                    <label htmlFor="title">
                      Title
                      <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Title"
                        required
                        defaultValue={data.item.title}
                        onChange={this.handleChange}
                      />
                    </label>
                    <label htmlFor="price">
                      Price
                      <input
                        type="number"
                        id="price"
                        name="price"
                        placeholder="Price"
                        required
                        defaultValue={data.item.price}
                        onChange={this.handleChange}
                      />
                    </label>
                    <label htmlFor="description">
                      Description
                      <textarea
                        id="description"
                        name="description"
                        placeholder="Enter A Description"
                        required
                        defaultValue={data.item.description}
                        onChange={this.handleChange}
                      />
                    </label>
                    <label htmlFor="image">
                      Image
                      <input
                        type="file"
                        id="image"
                        description="image"
                        placeholder="Upload an Image"
                        onChange={this.uploadFile}
                      />
                      {data.item.image && (
                        <img
                          src={this.state.image || data.item.image}
                          alt="existing upload preview"
                          width="200"
                        />
                      )}
                    </label>
                    <button type="submit">
                      Sav{loading ? 'ing' : 'e'} Changes
                    </button>
                  </fieldset>
                </Form>
              )}
            </Mutation>
          );
        }}
      </Query>
    );
  }
}

export default UpdateItem;
export { UPDATE_ITEM_MUTATION };
