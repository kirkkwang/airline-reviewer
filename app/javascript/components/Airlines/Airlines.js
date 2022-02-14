import React, { Component } from "react";
import styled from "styled-components";
import AirlineCard from "./AirlineCard";

const Home = styled.div`
  text-align: center;
  max-width: 1200px
  margin-left: auto;
  margin-right: auto;
`;
const Header = styled.div`
  padding: 100px 100px 10px 100px;

  h1 {
    font-size: 42px;
  }
`;
const Subheader = styled.div`
  font-weight: 300;
  font-size: 26px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 20px;
  width: 100%;
  padding: 20px;
`;
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
      .catch((errors) => console.log("Airlines read errors:", errors));
  };

  render() {
    let card = this.state.airlines.map((airline) => {
      return <AirlineCard key={airline.id} attributes={airline.attributes} />;
    });
    return (
      <Home>
        <Header>
          <h1>OpenFlights</h1>
          <Subheader>Honest to goodness airline reviews.</Subheader>
        </Header>
        <Grid>{card}</Grid>
      </Home>
    );
  }
}
