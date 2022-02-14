import React, { Component } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  padding: 50px 100px 50px 0;
  font-size: 30px;

  img {
    height: 60px;
    width: 60px;
    border-radius: 100%;
    border: 1p solid rgba(0, 0, 0, 0.1);
    margin-bottom: -5px;
    margin-right: 15px;
  }
`;
const TotalReviews = styled.div`
  font-size: 18px;
  padding: 10px 0;
`;
const TotalOutOf = styled.div`
  font-size: 18px;
  font-weight: bold;
  padding: 10px 0;
`;

export default class Header extends Component {
  render() {
    const { name, image_url, avg_score } = this.props.attributes;
    const total = this.props.reviews.length;
    return (
      <Wrapper>
        <h1>
          <img src={image_url} alt={name} />
          {name}
        </h1>
        <TotalReviews>{total} User Reviews</TotalReviews>
        <div className="star-rating"></div>
        <TotalOutOf>{avg_score} out of 5</TotalOutOf>
      </Wrapper>
    );
  }
}
