import React, { Component } from "react";
import AirlineCard from "./AirlineCard";

export default class Airlines extends Component {
  constructor(props) {
    super(props);
    this.state = {
      airlines: [],
    };
  }

  componentDidMount() {
    this.readAirlines();
  }

  readAirlines = () => {
    fetch("/api/v1/airlines.json")
      .then((resp) => resp.json())
      .then((airlinesArray) => this.setState({ airlines: airlinesArray.data }))
      .catch((errors) => console.log("Airline read errors:", errors));
  };

  render() {
    let card = this.state.airlines.map((airline) => {
      return <AirlineCard key={airline.id} attributes={airline.attributes} />;
    });
    return (
      <section>
        <div className="header">
          <h1>OpenFlights</h1>
          <div className="subheader">Honest to goodness airline reviews.</div>
        </div>
        <div className="grid"></div>
        {card}
      </section>
    );
  }
}
