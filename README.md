### App set up

```shell
$ rails new open-flights --webpack=react --database=postgresql -T

$ cd open-flights
$ rails db:create
```

### Database set up

#### Generate and migrate

```shell
# default wil be string if not specified
# slug is a unique identifier for each airline

$ rails g model Airline name image_url slug

# add data type when not using default string
# add belongs_to directly to set up foreign key

$ rails g model Review title description score:integer airline:belongs_to

$ rails db:migrate
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
$ rails db:seed
```

### API set up

#### Install Fast JSON API

Gem by team at Netflix, similar to ActiveModelSerializers

add `gem 'fast_jsonapi'` to `Gemfile`

```shell
$ bundle install

$ rails g serializer Airline name image_url slug

$ rails g serializer Review title description score airline_id

# restart rails console if active
# might needs to stop the spring Rails application preloader as well
$ spring stop
```

```ruby
# app/serializers/airline_serializer.rb
# add has_many relation
class AirlineSerializer
  include FastJsonapi::ObjectSerializer
  attributes :name, :image_url, :slug

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
      resources :reviews, only: [:create, :destroy]
    end
  end
# route all requests that are not in pre-existing in API back to index path
# improves deconflicting of react routes and rails routes
  get '*path', to: 'pages#index' via: :all
end
```
