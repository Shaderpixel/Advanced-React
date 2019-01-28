import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';

const CREATE_ITEM_MUTATION = gql`
  mutation CREATE_ITEM_MUTATION(
    # Passing in arguments to the CREATE_ITEM_MUTATION function. Typed language, also variables are prefixed with $ sign
    $title: String!
    $description: String!
    $price: Int!
    $image: String!
    $largeImage: String!
    $imagePublicId: String!
  ) {
    createItem( # Storing field values using variables of the same name. createItem comes from schema.graphql in the backend
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
      imagePublicId: $imagePublicId
    ) {
      id #return the id
    }
  }
`;

class CreateItem extends Component {
  state = {
    title: '',
    description: '',
    image: '',
    largeImage: '',
    imagePublicId: '',
    price: 0,
  };

  handleChange = e => {
    const { name, type, value } = e.target;
    const val = value && (type === 'number' ? parseFloat(value) : value);
    this.setState({ [name]: val });
  };

  uploadFile = async e => {
    const files = e.target.files;
    // TODO should check if no image files were added
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
    // console.log(file);
    this.setState({
      image: file.secure_url,
      largeImage: file.eager[0].secure_url,
      imagePublicId: file.public_id,
    });
  };

  render() {
    return (
      <Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state}>
        {(createItem, { loading, error }) => (
          // called bool whether the query has been executed, data gives us the data that has been returned
          <Form
            data-test="form"
            onSubmit={async e => {
              // stop the form from submitting
              e.preventDefault();
              // TODO challenge, check to make sure that the image has finish uploading in event of a very large file before running the mutation otherwise it will come back with an error saying that the this.state.image and largeImage is empty
              // call the mutation
              const res = await createItem();
              // change them to the single item page
              Router.push({
                pathname: '/item',
                query: { id: res.data.createItem.id },
              });
            }}
          >
            <Error error={error} />
            {/* Only displayed if error is passed to the Error component. See ErrorMessage.js */}
            <fieldset disabled={loading} aria-busy={loading}>
              <label htmlFor="file">
                File
                <input
                  type="file"
                  id="file"
                  name="file"
                  placeholder="Upload an image"
                  required
                  onChange={this.uploadFile}
                />
                {this.state.image && (
                  <img
                    src={this.state.image}
                    alt="Upload Preview"
                    width="200"
                  />
                )}
              </label>
              <label htmlFor="title">
                Title
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Title"
                  required
                  value={this.state.title}
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
                  value={this.state.price}
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
                  value={this.state.description}
                  onChange={this.handleChange}
                />
              </label>
              <button type="submit">Submit</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

export default CreateItem;
export { CREATE_ITEM_MUTATION };
