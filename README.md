## Backend

### App set up

```shell
rails new open-flights --webpack=react --database=postgresql -T

cd open-flights
rails db:create
```

### Database set up

#### Generate and migrate

```shell
# default wil be string if not specified
# slug is a unique identifier for each airline

rails g model Airline name image_url slug

# add data type when not using default string
# add belongs_to directly to set up foreign key

rails g model Review title description score:integer airline:belongs_to

rails db:migrate
```

#### Setting up model

```ruby
# app/models/airline.rb
# in the Review model, the relation was automatically set up by the generate command, but now Airline needs the relation set up
class Airline < ApplicationRecord
  has_many :reviews

  # sets slug before it gets created in the database
  before_create :slugify

  # creates a URL safe version of the airline name that hyphenates spaces and lowercases every word
  # ex. `"United Airlines".parameterize
  # => "united-airlines"
  def slugify
    self.slug = name.parameterize
  end

  # get average score of reviews for airline
  def avg_score
    # guard return for if there are no reviews
    return 0 unless reviews.count.positive?

    reviews.average(:score).round(2).to_f
  end
end
```

#### Seed database

```ruby
airlines = Airline.create([
  {
    name: "United Airlines",
    image_url: "https://open-flights.s3.amazonaws.com/United-Airlines.png"
  },
  {
    name: "Southwest",
    image_url: "https://open-flights.s3.amazonaws.com/Southwest-Airlines.png"
  },
  {
    name: "Delta",
    image_url: "https://open-flights.s3.amazonaws.com/Delta.png"
  },
  {
    name: "Alaska Airlines",
    image_url: "https://open-flights.s3.amazonaws.com/Alaska-Airlines.png"
  },
  {
    name: "JetBlue",
    image_url: "https://open-flights.s3.amazonaws.com/JetBlue.png"
  },
  {
    name: "American Airlines",
    image_url: "https://open-flights.s3.amazonaws.com/American-Airlines.png"
  }
])

reviews = Review.create({
  {
    title: 'Great airline',
    description: 'I had a lovely time.',
    score: 5,
    airline: airlines.first
  },
  {
    title: 'Bad airline',
    description: 'I had a bad time.',
    score: 1,
    airline: airlines.first
  }
})
```

```shell
rails db:seed
```

### API set up

#### Install Fast JSON API

Gem by team at Netflix, similar to ActiveModelSerializers

add `gem 'fast_jsonapi'` to `Gemfile`

```shell
bundle install

rails g serializer Airline name image_url slug

rails g serializer Review title description score airline_id

# restart rails console if active
# might needs to stop the spring Rails application preloader as well
spring stop
```

```ruby
# app/serializers/airline_serializer.rb
# add has_many relation
# added `:avg_score` to be referenced by frontend component later
class AirlineSerializer
  include FastJsonapi::ObjectSerializer
  attributes :name, :image_url, :slug, :avg_score

  has_many :reviews
end
```

### Controllers set up

#### Setting routes

```ruby
Rails.application.routes.draw do
  # set up root page to index
  root 'pages#index'

  # set up namespaces (hierarchy structure)
  namespace :api do
    namespace :v1 do
      # uses slug as in routing instead of primary ID
      resources :ailrines, param: :slug

      # scopes CRUD down to only create and destroy
      resources :reviews, only: %i[create destroy]
    end
  end

  # route all requests that are not in pre-existing in API back to index path
  # improves deconflicting of react routes and rails routes
  get '*path', to: 'pages#index', via: :all
end
```

#### Create controllers

Manually create a pages_controller.rb because of the routes.rb set up, rails g won't work

```shell
touch app/controllers/pages_controller.rb
mkdir app/controllers/api
mkdir app/controllers/api/v1
touch app/controllers/api/v1/airlines_controller.rb
touch app/controllers/api/v1/reviews_controller.rb
```

```ruby
# pages_controller.rb
class PagesController < ApplicationController
  def index; end
end
```

```ruby
# airlines_controller.rb
# name space inside module that corresponds with the namespaces in routes
module Api
  module V1
    class AirlinesController < ApplicationController
      def index
        airlines = Airline.all

        # render data with AirlineSerializer
        render json: AirlineSerializer.new(airlines, options).serialized_json
      end

      def show
        # find airline based off the slug parameter as specified in routes.rb
        airline = Airline.find_by(slug: params[:slug])

        render json: AirlineSerializer.new(airline, options).serialized_json
      end

      def create
        # add strong params, create private airline_params method below
        airline = Airline.new(airline_params)

        if airline.save
          render json: AirlineSerializer.new(airline).serialized_json
        else
          render json: { error: airline.errors.messages }, status: 422
        end
      end

      def update
        # find the existing airline by it's slug
        airline = Airline.find_by(slug: params[:slug])

        if airline.update(airline_params)
          render json: AirlineSerializer.new(airline, options).serialized_json
        else
          render json: { error: airline.errors.message }, status: 422
        end
      end

      def destroy
        airline = Airline.find_by(slug: params[:slug])

        if airline.destroy
          head :no_content
        else
          render json: { error: airline.errors.messages }, status: 422
        end
      end

      private

      def airline_params
        params.require(:airline).permit(:name, :img_url)
      end

      # when rendering data from AirlineSerializer, adds any associated Reviews data in the JSON payload
      # with Fast API, structure data as a compound document
      # when AirlineSerializer gets initialized, have an optiont to pass in the options hash to specify any additional resources to be included
      def options
        # or - equal operator, if @options is true, it will equal @options, if false, it will equal { include: %i[reviews] }
        @options ||= { include: %i[reviews] }
      end
    end
  end
end
```

```ruby
# reviews_controller.rb
module Api
  module V1
    class ReviewsController < ApplicationController
      def create
        review = Review.new(review_params)

        if review.save
          render json: ReviewSerializer.new(review).serialized_json
        else
          render json: { error: review.errors.messages }, status: 422
        end
      end

      def destroy
        review = Review.find(params[:id])

        if review.destroy
          head :no_content
        else
          render json: { error: review.errors.messages }, status: 422
        end
      end

      private

      def review_params
        params
          .require(:review)
          .permit(:title, :description, :score, :airline_id)
      end
    end
  end
end
```

#### Testing API

Send GET request to `http://localhost:3000/api/v1/airlines`, should see JSON of data

Send GET request to `http://localhost:3000/api/v1/airlines/united-airlines`, using the slug, should see JSon of a single airline (United Airlines)

Before making POST request, add `protect_from_forgery with: :null_session` into the `airlines_controller.rb` and `reviews_controllers.rb` to avoid AuthenticityToken error

Send POST request to 'http://localhost:3000/api/v1/airlines`, with a JSON payload

```json
{
  "name": "fake airline"
}
```

Send PATCH request to 'http://localhost:3000/api/v1/fake-airline, with a JSON payload

```json
{
  "name": "other fake airline"
}
```

Send DELETE request to 'http://localhost:3000/api/v1/airlines/fake-airline', should see no body returned

Send POST request to 'http://localhost:3000/api/v1/reviews', with a JSON payload

```json
{
  "title": "Great experience!",
  "description": "had a great time!",
  "score": 4,
  "airline_id": 1
}
```

Send DELETE request to 'http://localhost:3000/api/v1/reviews/3', should see no body returned

## Frontend

### Render view through React

```shell
mkdir app/views/pages
mkdir app/javascript/components
mkdir app/javascript/components/Airlines
touch app/javascript/components/Airlines/Airlines.js
mkdir app/javascript/components/Airline
touch app/javascript/components/Airline/Airline.js
touch app/javascript/components/App.js
touch app/views/pages/index.html.erb
mv app/javascript/packs/hello_react.jsx app/javascript/packs/index.jsx
yarn add react-router-dom@5.3.0
```

copy and paste
`<%= javascript_pack_tag 'index' %>`

#### Turning off/on rack-mini-profiler (thing in top left corner)

add `?pp=disable` at the end of URL to disable, `?pp=enable` to enable, `?pp=help` for more options (when enabled)

#### App.js

```javascript
// App.js
import React, { Component } from "react";

export default class App extends Component {
  render() {
    return <>Hello World!</>;
  }
}
```

```javascript
// index.jsx
import React from "react";
import ReactDOM from "react-dom";
import App from "../components/App";
import { BrowserRouter as Router, Route } from "react-router-dom";

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(
    <Router>
      <Route path="/" component={App} />
    </Router>,
    document.body.appendChild(document.createElement("div"))
  );
});
```

```javascript
// App.js
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
```

### Setting up the components

see `app/javascript/components/Airlines/Airlines.js`

#### Add a new component to display grids of airlines

```shell
touch app/javascript/components/Airlines/AirlineCard.js
```

#### Add styled-components

Add styled-components and import into `Airlines.js` and `AirlineCard.js`

```shell
yarn add styled-components
```

```javascript
// Airlines.js, AirlineCard.js
import styled from "styled-components";
```

#### Fix blank page when navigating back from a show page

- Remove all turbolinks `, 'data-turbolinks-track': 'reload'` from `app/views/layouts/application.html.erb`
- Comment out `import Turbolinks from "turbolinks"` and `Turbolinks.start()` from `app/javascript/packs/application.js`
- Comment out `gem 'turbolinks', '~> 5'` from `Gemfile`
- Stop server
- `bundle install`
- `rails s`
- On a separate terminal tab, start webpack dev server, `./bin/webpack-dev-server`

### Build out show page

#### State and fetch

create state and fetch for `app/javascript/components/Airline/Airline.js`

```javascript
// app/javascript/components/Airline/Airline.js
constructor(props) {
    super(props);
    this.state = {
      airline: "",
      reviewArray: "",
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
      })
    )
    .catch((errors) => console.log("Airline read errors:", errors));
};
```

#### Header component

```shell
touch app/javascript/components/Airline/Header.js
```

After filling out the component, go back to `app/javascript/components/Airline/Airline.js` and import the Header.
Replace the header div with the Header component and pass `this.airline.attributes.data` as props.
Add new state object and set it to equal `false`, `loaded: false` to prevent warnings when state is loaded.
Once API call is complete, set `loaded` to `true`.
Add conditional, if `loaded` then `Header`
Add a `review` key as well to be used later.

```javascript
{
  loaded && <Header attributes={this.airline.data.attributes} />;
}
```

Add styling to both Airline and Header with:

```javascript
import styled from "styled-components";
```

#### Create ReviewForm component

```shell
touch app/javascript/components/Airline/ReviewForm.js
```

Give basic form tags to `ReviewForm` and import into `Airline.js` and move `loaded` just below `<Wrapper>`.
Add JSX fragments where needed.

```javascript
<Wrapper>
  {loaded && (
    <>
      {" "}
      // JSX fragment needed here
      <Column>
        <Main>
          <Header attributes={airline.attributes} reviews={reviewsArray} />
          <div className="reviews"></div>
        </Main>
      </Column>
      <Column>
        <ReviewForm />
      </Column>
    </>
  )}
</Wrapper>
```

```javascript
// Airline.js
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
    // using spread operator here to create an object with multiple keys, `title` and `description` in this case
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
        // updating state of airline and reviewsArray (for length) so the page will reflect the change without a refresh
        airline: { ...airline, included },
        reviewsArray: included,
      });
    })
    .catch((errors) => console.log("Review create errors:", errors));
};
```

#### ReviewForm star rating

```javascript
import React, { Component, Fragment } from "react";
// Need `Fragment` component to wrap the return because div was making the alignment of radio buttons vertical, can probably use div still but would need some extra CSS.  Had to put it inside the class insteda of in a variable outside because later will pass props
[5, 4, 3, 2, 1].map((score, index) => {
  return (
    <Fragment key={index}>
      <input
        type="radio"
        value={score}
        checked={review.score === score}
        name="rating"
        onChange={() => console.log("selected:", score)}
        id={`rating-${score}`}
      />
      <label onClick={() => handleRating(score)}></label> // `handleRating` will be used later
    </Fragment>
  );
});

export default class ReviewForm extends Component {
  render() {
    const { handleChange, handleSubmit, attributes, review } = this.props;

    return (
      <div className="Wrapper"> //...
//
//
//
```

#### Style ReviewForm

```shell
mkdir app/javascript/components/Airline/Stars
touch app/javascript/components/Airline/Stars/Gray.js
touch app/javascript/components/Airline/Stars/Selected.js
touch app/javascript/components/Airline/Stars/Hover.js
```

Example of `encodeUIRComponent`

```javascript
const Hover =
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='126.729' height='126.73'><path fill='#d8b11e' d='M121.215 44.212l-34.899-3.3c-2.2-.2-4.101-1.6-5-3.7l-12.5-30.3c-2-5-9.101-5-11.101 0l-12.4 30.3c-.8 2.1-2.8 3.5-5 3.7l-34.9 3.3c-5.2.5-7.3 7-3.4 10.5l26.3 23.1c1.7 1.5 2.4 3.7 1.9 5.9l-7.9 32.399c-1.2 5.101 4.3 9.3 8.9 6.601l29.1-17.101c1.9-1.1 4.2-1.1 6.1 0l29.101 17.101c4.6 2.699 10.1-1.4 8.899-6.601l-7.8-32.399c-.5-2.2.2-4.4 1.9-5.9l26.3-23.1c3.8-3.5 1.6-10-3.6-10.5z'/></svg>
`);

export default Hover;
```

Add styling to stars, see `ReviewForm.js`

#### Creating state for rating

create new function in `Airline.js` called `handleRating`

```javascript
handleRating = (score) => {
  this.setState({
    // set review with spread to add score from the click on the form
    review: {
      ...this.state.review,
      score: score,
    },
  });
};
```
