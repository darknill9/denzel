const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const {PORT} = require('./constants');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const imdb = require('./imdb');
const DENZEL_IMDB_ID = 'nm0000243';
const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true});
});

const url = 'mongodb+srv://dbUser1:jupiter@cluster0-ufodu.mongodb.net/test?retryWrites=true&w=majority';

const dbName = 'IMDB';



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

/*

const countMovies = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('movies');
  // Find some documents

  collection.count(function(err, movies) {
    assert.equal(err, null);
    console.log("number of movies in the database");
    console.log(movies)
    callback(movies);
    return movies;
  });
}


const findMovies = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('movies');
  // Find some documents

  collection.find({}).toArray(function(err, movies) {
    assert.equal(err, null);
    console.log("Found the following movies");
    console.log(movies)
    callback(movies);
  });
}


let insertMovies = function(db, actor_id, list_movies, list_awesome_movies) {
  // Get the documents collection
  const collection = db.collection('movies');
  const collection_awesome = db.collection('awesome');
  
  

  collection.insertMany(list_movies);
  collection_awesome.insertMany(list_awesome_movies);
  //console.log(movies); 
}



const countMovies = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('movies');
  // Find some documents

  collection.count(function(err, movies) {
    assert.equal(err, null);
    //console.log("number of movies in the database");
    //console.log(movies)
    callback(movies);
    return movies;
  });
}
*/


// Populate the database with all the movies from IMDb from actor with a specific id
app.get('/movies/populate/:actor_id', async (request, response) => {

  const actor_id = request.params.actor_id;
  const movies = await imdb(actor_id);
  const awesome = movies.filter(movie => movie.metascore >= 70);

  collection_movie.deleteMany({"actor_id": actor_id});
  collection_awesome.deleteMany({"actor_id": actor_id});

  collection_movie.insertMany(movies);
  collection_awesome.insertMany(awesome);

  //console.log(movies);
  //console.log("AWESOME MOVIES");
  //console.log(awesome);
  response.send({'total_movies_inserted': movies.length, 'total_movies_awesome_inserted': awesome.length});
});





/*

app.get('/movies/populate_with_json/:actor_id', async (request, response) => {
  
  //console.log(request.params.actor_id+".json");
  const path = request.params.actor_id+".json";
  
  if (fs.existsSync(path)){}
  else{
    const movies = await imdb(request.params.actor_id);
    const awesome = movies.filter(movie => movie.metascore >= 70); 
    let list_awesome_movies = JSON.stringify(awesome, null, 2);
    fs.writeFileSync(path, list_awesome_movies);
  }


  let moviesData = fs.readFileSync(path);  
  let movies = JSON.parse(moviesData);  

  
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to server");


    const db = client.db(dbName);
    const collection = db.collection(request.params.actor_id);

    collection.insertMany(movies);
    
    
    client.close();
    
  });
  


  const total = movies.length;
  //console.log(total);
  //console.log(awesome);
  response.send({'total': total});


});
*/


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
      
      response.send({"total_movie":res_movie.length, "total_awesome":res_awesome.length});
    });


  });
  
  
  //const total_awesome = collection_awesome.count(); 
  //response.send(result.ops);
  //response.send({'total':result.ops.length});

  //console.log(total_movies);
  //response.send({'total': 5445, 'total bis': 2752, 'tot':total_awesome});

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
      console.log("random value=", random_value);
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



//Fetch a specific movie
app.get("/movies/:id", (request, response) => {
var obj_id=request.params.id.toString();
  //var obj_id="\""+request.params.id.toString()+"\"";
  //collection_movie.findOne({ "_id": new ObjectId(obj_id) }, (error, result) => {
  //var mongo = require('mongodb');
  //var o_id = new mongo.ObjectID(obj_id);
  //var o_id = new ObjectID("5e7655f1bc0288ac954f21a4");
  //var o_id = new ObjectID(obj_id);
  //console.log('id: ' + o_id + ' type: ' + typeof o_id);
  //collection_movie.findOne({ "_id": o_id }, (error, result) => {
  collection_movie.findOne({ "_id": new ObjectId(obj_id) }, (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(result);
  });
});