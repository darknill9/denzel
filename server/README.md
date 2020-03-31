## Launch the application

### REST endpoints

To launch the server and the api endpoints run 

```sh
❯ node server.js
```


## How i developped the app

I created a mongoDB Atlas database which means you can have issue requesting the API because sometimes it crashes.
I made 3 collections, one for all movies, one for awesome ones and one for reviews (where there is the movie & review, both for each review).
I modified the imdb.js to export the actor ID to have it in the database and so have a lot of movies of different actors.


If you want commands to see some usefull commands and API queries used for developping, see the commands.txt file, commands that you can enter in a cmd like that or just the url in Insomnia for example.