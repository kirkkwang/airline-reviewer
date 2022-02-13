import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import Airlines from "./Airlines/Airlines";
import Airline from "./Airline/Airline";

export default class App extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={Airlines} />
        <Route exact path="/airlines/:slug" component={Airline} />
      </Switch>
    );
  }
}
