const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const {PORT, DENZEL_IMDB_ID} = require('./constants');

const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const imdb = require('./imdb');

const url = 'mongodb+srv://dbUser1:jupiter@cluster0-ufodu.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'IMDB';
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
  MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
      if(error) {
          throw error;
      }
      database = client.db(dbName);
      collection_movie = database.collection("movies");
      collection_awesome = database.collection("awesome");
      collection_review = database.collection("reviews");
      console.log("Connected to databse named `" + dbName + "`!");
  });
});


// Get all the movies in the database
app.get("/movies/all", (request, response) => {
  collection_movie.find({}).toArray((error, res) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(res);
  });
});


// Get all the denzel movies in the database
app.get("/movies/all/denzel", (request, response) => {
  collection_movie.find({"actor_id": DENZEL_IMDB_ID}).toArray((error, rse) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(res);
  });
});





// Populate the database with all the movies from IMDb from actor with a specific id
app.get('/movies/populate/:id', async (request, response) => {

  const actor_id = request.params.id;
  const movies = await imdb(actor_id);
  const awesome = movies.filter(movie => movie.metascore >= METASCORE);

  collection_movie.deleteMany({"actor_id": actor_id});
  collection_awesome.deleteMany({"actor_id": actor_id});

  //collection_movie.insertMany(movies);
  //collection_awesome.insertMany(awesome);




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
  //response.send({'total_movies_inserted': movies.length, 'total_movies_awesome_inserted': awesome.length});
});



// Count the number of movies (movies and awesome movies) in the database 
app.get('/movies/count', (request, response) => {

  //let total_movies;
  //let total_awesome
  // Use connect method to connect to the server

  collection_movie.find().toArray((error, res_movie) => {
    if(error) {
        return response.status(500).send(error);
    }
    collection_awesome.find().toArray((error, res_awesome) => {
      if(error) {
          return response.status(500).send(error);
      }
      
      response.send({"total_movie": res_movie.length, "total_awesome": res_awesome.length});
    });
  });
  //const total_awesome = collection_awesome.count(); 
});



// Count the number of movies (movies and awesome movies) in the database for a specific actor id
app.get('/movies/count/:id', (request, response) => {

  //let total_movies;
  //let total_awesome
  // Use connect method to connect to the server
  const actor_id = request.params.id;
  collection_movie.find({"actor_id": actor_id}).toArray((error, res_movie) => {
    if(error) {
        return response.status(500).send(error);
    }
    collection_awesome.find({"actor_id": actor_id}).toArray((error, res_awesome) => {
      if(error) {
          return response.status(500).send(error);
      }
      
      response.send({"total_movie":res_movie.length, "total_awesome":res_awesome.length});
    });
  });
  //const total_awesome = collection_awesome.count(); 
});


// Fetch a random must-watch movie
app.get("/movies", (request, response) => {
  collection_awesome.find().toArray((error, result) => {
      if(error) {
          return response.status(500).send(error);
      }

      var number_of_movies = result.length;
      var random_value = Math.floor(Math.random() * (number_of_movies));
      response.send(result[random_value]);
      //console.log("random value=", random_value);
  });
})






//Search for Denzel's movies. 
app.get("/movies/search", (request, response) => {
  try {
      let limit= request.query.limit || 5;
      let metascore_= request.query.metascore || 0;
      console.log("limit: " + limit)
      metascore_= parseInt(metascore_,10)
      console.log('metascore: ' + metascore_ + ' type: ' + typeof metascore_);

      var greater_query={$gt:metascore_}
      //var greater_query={$gt:76}

      collection_movie.find({"actor_id": DENZEL_IMDB_ID,"metascore" : greater_query}).sort( { "metascore": -1 } ).toArray((error, result) => {
          if(error) {
              return response.status(500).send(error);
          }
          response.send(result.slice(1,limit+1));
      });
} catch (error) {
  console.log(error)
}
});

//Save a watched date and a review.
app.post("/movies/:id", (request, response) => {
   try {
      let date= request.query.date || null;
      let review= request.query.review || null;
      var movie_id=request.params.id.toString();
      var data= {movie_id,date,review};
      console.log(data);
      collection_review.insertOne(data, (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(data);
  });
} catch (error) {
  console.log(error)
}
  
});

