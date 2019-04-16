const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const expressValidator = require('express-validator')
const { query,check, validationResult } = require('express-validator/check');
const cors = require('cors')

const mongoose = require('mongoose')
const Schema = mongoose.Schema;
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track')

app.use(cors())

app.use(expressValidator())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



const Users = mongoose.model('Users', { name: String });
var schema = new Schema({ username: String, description: String, duration: Number, date: { type: Date, default: Date.now } });
schema.path('date').get(function(v) {
  return v.toDateString();
});
const Exercises = mongoose.model('Exercises', schema);

var validate = (method) => {
  switch (method) {
    case 'findExcercises':
      {
        return [
          query('userId', 'Please provide userId').exists({checkFalsy:false}),
          query('limit').optional().isInt(),
          query(['from', 'to'],"Date should be in YYYY-MM-DD format").optional().isISO8601(),
        ]
      }
  }
}



app.route('/api/exercise/users')
  .get(function(req, res) {
    Users.find({}, function(err, docs) {
      if (err) { throw err; }
      res.json(docs);
    });

  });


app.route('/api/exercise/log/')
  .get(validate("findExcercises"), (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    //TODO: maybe there is a better way
    const keys = Object.keys(req.query);
    console.log("User Id=" + JSON.stringify(keys));
    let userId = req.query.userId;
    
    Users.findById(userId)
      .exec(function(err, result) {
        if (err) { throw err; }


        var query = { username: result.name };

        let fromDate = req.query.from;
        if (fromDate) {
          query.date = { "$gte": new Date(fromDate) };
        }
        let toDate = req.query.to;
        if (toDate) {
          query.date = { "$lte": new Date(toDate) };
        }
        var exercises = Exercises.find(query, { _id: false, __v: false });
        let limit = parseInt(req.query.limit);
        if (limit) {
          exercises = exercises.limit(limit);
        }
        exercises.exec(function(err, docs) {
          if (err) { throw err; }
          console.log(docs);
          //TODO: change date format
          res.json({count:docs.length,log:docs});
        });

      });

  });

app.route('/api/exercise/new-user')
  .post(function(req, res) {
    //TODO: check if username is taken
    let u = new Users({ name: req.body.username });
    console.log("Saving new user " + req.body.username);
    u.save();
    res.json(u);
  });





app.route('/api/exercise/add')
  .post(function(req, res) {

    Users.findById(req.body.userId)
      .exec(function(err, result) {
        if (err) { throw err; }
        //TODO: check if date is in future
        let ex = new Exercises({
          username: result.name,
          description: req.body.description,
          duration: req.body.duration
        });
        let date = req.body.date;
        if (date) {
          //TODO: add error handling
          ex.date = new Date(date);
        }

        console.log("Saving new exercises " + ex);
        ex.save();
        res.json(ex);
      });

  });



// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})



// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  }
  else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
