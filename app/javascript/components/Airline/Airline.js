import React, { Component } from "react";
import Header from "./Header";
import ReviewForm from "./ReviewForm";
import styled from "styled-components";

const Wrapper = styled.div`
  margin-left: auto;
  margin-right: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
`;

const Column = styled.div`
  background: #fff;
  height: 100vh;
  overflow: scroll;

  &:last-child {
    background: #000;
  }
`;

const Main = styled.div`
  padding-left: 50px;
`;

export default class Airline extends Component {
  constructor(props) {
    super(props);
    this.state = {
      airline: "",
      reviewsArray: "",
      review: { title: "", description: "", score: "" },
      loaded: false,
    };
  }

  componentDidMount() {
    this.readAirline();
  }

  readAirline = () => {
    const slug = this.props.match.params.slug;
    fetch(`/api/v1/airlines/${slug}.json`)
      .then((resp) => resp.json())
      .then((airlineArray) =>
        this.setState({
          airline: airlineArray.data,
          reviewsArray: airlineArray.included,
          loaded: true,
        })
      )
      .catch((errors) => console.log("Airline read errors:", errors));
  };

  handleChange = (e) => {
    this.setState({
      review: {
        ...this.state.review,
        [e.target.name]: e.target.value,
        airline_id: this.state.airline.id,
        score: this.state.review.score,
      },
    });
  };

  handleSubmit = () => {
    const { review, reviewsArray, airline } = this.state;
    fetch("/api/v1/reviews", {
      body: JSON.stringify(review),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
      .then((resp) => resp.json())
      .then((resp) => {
        const included = [...reviewsArray, resp.data];
        this.setState({
          airline: { ...airline, included },
          reviewsArray: included,
        });
      })
      .catch((errors) => console.log("Review create errors:", errors));
  };

  handleRating = (score) => {
    this.setState({
      review: {
        ...this.state.review,
        score: score,
      },
    });
  };

  render() {
    const { airline, loaded, reviewsArray, review } = this.state;
    return (
      <Wrapper>
        {loaded && (
          <>
            <Column>
              <Main>
                <Header
                  attributes={airline.attributes}
                  reviews={reviewsArray}
                />
                <div className="reviews"></div>
              </Main>
            </Column>
            <Column>
              <ReviewForm
                handleChange={this.handleChange}
                handleSubmit={this.handleSubmit}
                handleRating={this.handleRating}
                attributes={airline.attributes}
                review={review}
              />
            </Column>
          </>
        )}
      </Wrapper>
    );
  }
}
