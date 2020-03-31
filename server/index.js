const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const {PORT, DENZEL_IMDB_ID, LIMIT_SEARCH, METASOCRE_SEARCH, MONGO_URL, DBNAME} = require('./constants');

const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const imdb = require('./imdb');


const METASCORE = 77;

const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true});
});



app.listen(PORT, () => {
  console.log(`📡 Running on port ${PORT}`)
  MongoClient.connect(MONGO_URL, { useNewUrlParser: true }, (error, client) => {
      if(error) {
          throw error;
      }
      database = client.db(DBNAME);
      collection_movie = database.collection("movies");
      collection_awesome = database.collection("awesome");
      collection_review = database.collection("reviews");
      console.log("Connected to databse named `" + DBNAME + "`!");
  });
});


// Get all the movies in the database
app.get("/movies/all", (request, response) => {
  collection_movie.find({}).sort( { "metascore": -1 } ).toArray((error, res) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(res);
  });
});


// Get all the denzel movies in the database
app.get("/movies/all/denzel", (request, response) => {
  collection_movie.find({"actor_id": DENZEL_IMDB_ID}).toArray((error, res) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(res);
  });
});



// Populate the database with all the movies from IMDb for an actor with a specific id
app.get('/movies/populate/:id', async (request, response) => {
  try {
    const actor_id = request.params.id;
    const movies = await imdb(actor_id);
    const awesome = movies.filter(movie => movie.metascore >= METASCORE);
  
    collection_movie.deleteMany({"actor_id": actor_id});
    collection_awesome.deleteMany({"actor_id": actor_id});

    collection_movie.insertMany(movies, (error, res_movies) => { 
      if(error) {
        return response.status(500).send(error);
      }
      collection_awesome.insertMany(awesome, (error, res_awesome) => {
        if(error) {
          return response.status(500).send(error);
        }
        response.send({'total_movies_inserted': res_movies.ops.length, 'total_movies_awesome_inserted': res_awesome.ops.length});
      });
    });

  } catch (error) {
    console.log(error);
  }
 
  //response.send({'total_movies_inserted': movies.length, 'total_movies_awesome_inserted': awesome.length});
});



// Count the number of movies (movies and awesome movies) in the database 
app.get('/movies/count', (request, response) => {

  //let total_movies;
  //let total_awesome;

  collection_movie.count({}, (error, res_movie) => {
    if(error) {
        return response.status(500).send(error);
    }
    collection_awesome.count({}, (error, res_awesome) => {
      if(error) {
          return response.status(500).send(error);
      }
      
      response.send({"total_movie": res_movie, "total_awesome": res_awesome});
    });
  }); 
});



// Count the number of movies (movies and awesome movies) in the database for a specific actor id
app.get('/movies/count/:id', (request, response) => {

  //let total_movies;
  //let total_awesome
  const actor_id = request.params.id;

  collection_movie.count({"actor_id": actor_id}, (error, res_movie) => {
    if(error) {
        return response.status(500).send(error);
    }
    collection_awesome.count({"actor_id": actor_id}, (error, res_awesome) => {
      if(error) {
          return response.status(500).send(error);
      }
      
      response.send({"total_movie": res_movie, "total_awesome": res_awesome});
    });
  }); 
});


// Fetch a random must-watch movie
app.get("/movies", (request, response) => {
  collection_awesome.find().toArray((error, result) => {
      if(error) {
          return response.status(500).send(error);
      }

      var number_of_movies = result.length;
      var random_int = Math.floor(Math.random() * (number_of_movies));
      response.send(result[random_int]);
      //console.log("the random int was : ", random_int);
  });
});



// Search for Denzel's movies
app.get("/movies/search", (request, response) => {
  try {
    let limit= request.query.limit || 5;
    limit = parseInt(limit, 10);
    let metascore_= request.query.metascore || 0;
    //console.log("limit: " + limit + ' type: ' + typeof limit);
    metascore_= parseInt(metascore_, 10)
    //console.log('metascore: ' + metascore_ + ' type: ' + typeof metascore_);

    var greater_query={$gt:metascore_}

    collection_movie.find({"actor_id": DENZEL_IMDB_ID, "metascore" : greater_query}).sort( { "metascore": -1 } ).toArray((error, res) => {
      if(error) {
        return response.status(500).send(error);
      }
      response.send({"limit": limit,
      "total": res.length,
      "results": res.slice(0, limit)});
    });
  } catch (error) {
  console.log(error)
}});



// Search for movies of a specific actor
app.get("/movies/search/:id", (request, response) => {
  try {
    const actor_id = request.params.id;
    let limit= request.query.limit || LIMIT_SEARCH;
    limit = parseInt(limit);
    let metascore_= request.query.metascore || METASOCRE_SEARCH;
    metascore_= parseInt(metascore_);

    var greater_query={$gte:metascore_};

    collection_movie.find({"actor_id": actor_id, "metascore" : greater_query}).sort( { "metascore": -1 } ).toArray((error, res) => {
      if(error) {
        return response.status(500).send(error);
      }
      response.send({"limit": limit,
      "total": res.length,
      "results": res.slice(0, limit)});
    });
  } catch (error) {
  console.log(error)
}});



//Save a watched date and a review
app.post("/movies/:id", (request, response) => {
  try {
    //console.log(request.body.date);
    
    let date_= request.body.date || null;
    let review_= request.body.review || null;
    var movie_id = request.params.id.toString();
    var data= {movie_id,date_,review_};
    //console.log(data);
    
    
    var id_movie = { "id": movie_id };
    //var new_values = { $set: {date: date_, review: review_ }};
    var new_values = {date: date_, review: review_ };


    collection_movie.find(id_movie).toArray( (error, res) => {
      if(error) {
        return response.status(500).send(error);
      }

      var this_movie = { "movie.id": movie_id };

      //response.send(res);
      //console.log({movie : res[0], review : new_values});
      
      collection_review.update(this_movie, {movie:res[0], review:new_values}, { upsert: true } , (error, res_final) => {
        if(error) {
            return response.status(500).send(error);
        }
        
        response.send({movie:res[0], review:new_values});
        });
    });
  } catch (error) {
console.log(error)
} 
});