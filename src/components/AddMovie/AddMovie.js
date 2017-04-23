import React, { Component } from 'react';
import Flexbox from 'flexbox-react';
import Form from 'muicss/lib/react/form';
import Input from 'muicss/lib/react/input';
import Button from 'muicss/lib/react/button';
import Rating from 'react-rating';
import Autocomplete from 'react-autocomplete';

import './AddMovie.css';

class AddMovie extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAddMovie: false,
      addMovie: {},
      moviesSuggestions: [],
      autocompleteValue: ''
    };
  }

  addMovie() {
    this.setState({
      showAddMovie: true,
    });
  }

  addAttr(type, obj) {
    const update = {};
    update[type] = obj.currentTarget.value;

    this.setState({
      addMovie: Object.assign({}, this.state.addMovie, update),
    });
  }

  submitNewMovie(e) {
    e.preventDefault();

    if (this.props.onAddMovie && typeof this.props.onAddMovie === 'function') {
      this.props.onAddMovie(this.state.addMovie);
    }

    this.setState({
      addMovie: {},
      showAddMovie: false,
    });
  }

  setRating(rating) {
    this.addAttr('rating', {
      currentTarget: {
        value: rating,
      },
    });
  }

  fetchMovies(event, value) {
    this.setState({ autocompleteValue: value });

    if (!this.isSearchable(value)) {
      this.setState({ moviesSuggestions: [] });

      return Promise.resolve([]);
    }

    return fetch(`https://api.themoviedb.org/3/search/movie?api_key=${this.props.apiKey}&query=${value}`)
      .then(response => response.json())
      .then(response => {
        this.setState({ moviesSuggestions: response.results || [] });

        return response.results || [];
      });
  }

  isSearchable(query) {
    return query.length > 2;
  }

  fetchMovieDetails(id) {
    return fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${this.props.apiKey}`)
      .then(response => response.json());
  }

  submitSuggestedMovie(value, movie) {
    this.fetchMovieDetails(movie.id)
      .then(details => {
        if (this.props.onAddMovie && typeof this.props.onAddMovie === 'function') {
          this.props.onAddMovie({
            id: movie.id,
            title: movie.title,
            director: this.getDirector(details),
            year: this.getReleaseYear(movie.release_date),
            rating: this.convertRating(movie.vote_average)
          })
        }
      });
  }

  getDirector(details) {
    return details.crew.find(member => member.job === 'Director').name;
  }

  getReleaseYear(date) {
    return date.split('-')[0];
  }

  convertRating(rating) {
    return Math.round(rating / 10 * 5);
  }

  renderSuggestion(renderMovie, isHighlighted) {
    const styles = {};

    if (isHighlighted) {
      styles.background = '#222B31';
    }

    Object.assign(styles, this.getSelectedSuggestionStyle(renderMovie));

    return (<div style={styles} >{renderMovie.title}</div>)
  }

  getSelectedSuggestionStyle(renderMovie) {
    const isSelected = Object.keys(this.props.movies).find(movie => {
      return this.props.movies[movie].id === renderMovie.id
    });

    return isSelected ?  { display: 'none' } : {};
  }

  render() {
    const dropdownStyle = {
      position: 'absolute',
      display: this.state.moviesSuggestions.length ? 'block' : 'none',
      left: 0,
      borderRadius: '3px',
      background: '#3a3e41',
      border: '1px solid #555',
      padding: '2px 0',
      fontSize: '90%',
      overflow: 'auto',
      zIndex: '1'
    };

    const autocomplete = this.props.apiKey ? (<div className="autocomplete">
      <Autocomplete
        inputProps={{ name: 'movies-autocomplete', id: 'movies-autocomplete', placeholder: 'Search movies...' }}
        ref="autocomplete"
        value={this.state.autocompleteValue}
        items={this.state.moviesSuggestions}
        getItemValue={movie => movie.title}
        onSelect={this.submitSuggestedMovie.bind(this)}
        onChange={this.fetchMovies.bind(this)}
        renderItem={this.renderSuggestion.bind(this)}
        menuStyle={dropdownStyle}
      />
    </div>) : '';

    return (
      <Flexbox>
        {autocomplete}
        <a href="#add"
          className="add-movie"
          onClick={(e) => {
            e.preventDefault();
            this.addMovie();
          }}
        >
          <i className="material-icons">add</i>
        </a>
        <Flexbox className="overlay add-movie-overlay" style={{display: (this.state.showAddMovie === true ? 'flex' : 'none')}}>
          <Flexbox className="add-movie-container">
            <Form
              onSubmit={this.submitNewMovie.bind(this)}
              className="add-movie-form"
            >
              <legend>Add Movie</legend>
              <Input ref="title" label="Title" floatingLabel={true} onChange={this.addAttr.bind(this, 'title')} />
              <Input ref="director" label="Director" floatingLabel={true} onChange={this.addAttr.bind(this, 'director')} />
              <Input ref="year" label="Year of Release" floatingLabel={true} onChange={this.addAttr.bind(this, 'year')} />
              <div className="mui-textfield" style={{marginBottom: 0}}>
                <div style={{marginBottom: 15}}>Rating</div>
                <Rating
                  initialRate={this.state.addMovie.rating || 0}
                  onClick={this.setRating.bind(this)}
                />
              </div>
              <div style={{textAlign: 'right'}}>
                <Button
                  variant="flat"
                  onClick={(e) => {
                    e.preventDefault();
                    this.setState({
                      showAddMovie: false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button variant="flat" color="primary">Submit</Button>
              </div>
            </Form>
          </Flexbox>
        </Flexbox>
      </Flexbox>
    );
  }
}

export default AddMovie;
