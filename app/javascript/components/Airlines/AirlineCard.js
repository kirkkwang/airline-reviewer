import React, { Component } from "react";
import { BrowserRouter as Router, Link } from "react-router-dom";

export default class AirlineCard extends Component {
  render() {
    const { image_url, name, avg_score, slug } = this.props.attributes;
    return (
      <div className="card">
        <div className="airline-logo">
          <img src={image_url} alt={name} />
        </div>
        <div className="airline-name">{name}</div>
        <div className="airline-score">{avg_score}</div>
        <div className="airline-link">
          <Link to={`/airlines/${slug}`}>View Airline</Link>
        </div>
      </div>
    );
  }
}
