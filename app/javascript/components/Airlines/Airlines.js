import React, { Component } from "react";

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
    let airlinesList = this.state.airlines.map((airline) => {
      return <li key={airline.id}>{airline.attributes.name}</li>;
    });
    return (
      <section>
        <div className="header">
          <h1>OpenFlights</h1>
          <div className="subheader">Honest to goodneess airline reviews.</div>
        </div>
        <div className="grid"></div>
        <ul>{airlinesList}</ul>
      </section>
    );
  }
}
