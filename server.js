const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const expressValidator = require('express-validator')
const { query, check, body, validationResult } = require('express-validator/check');
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

const usersSchema = new Schema({ name: { type: String, index: { unique: true } } });
const Users = mongoose.model('Users', usersSchema);
var ExerciseSchema = new Schema({ username: String, description: String, duration: Number, date: { type: Date, default: Date.now } });

ExerciseSchema.methods.toJSON = function() {
  var exercise = this;
  var exerciseObject = exercise.toObject();
  exerciseObject.date = exerciseObject.date.toDateString();
  return exerciseObject;
};

var Exercises = mongoose.model('Exercises', ExerciseSchema);


const isMongoId = (value, { req }) => {
  new mongoose.Types.ObjectId(value);
  return true;
};

const userExists = (value) => {
  return Users.count({ _id: value }).then((count) => {
    if (count === 0) throw new Error("User doesn't exist");
    return true;
  });
}


const userAlreadyExists = (value) => {
  return Users.count({ name: value }).then((count) => {
    if (count > 0) throw new Error("Username already taken");
    return true;
  });
}
const datesInOrder = (fromDate, { req }) => {
  const toDate=req.body.to;
  if (fromDate&&toDate&&new Date(fromDate).getTime() >= new Date(toDate).getTime()) {
    throw new Error('start date must be before end date');
  }
  return true;
}
const dateIsNotInFuture=(v)=>{
  if (v&&new Date(v).getTime() >= new Date().getTime()) {
    throw new Error('Invalid date');
  }
  return true;
}


var validate = (method) => {
  switch (method) {
    case 'createUser':
      {
        return [
          body('username', 'Please provide valid username').exists({ checkFalsy: true }).custom(userAlreadyExists),
        ]
      }
    case 'findExcercises':
      {
        return [
          query('userId', 'Please provide valid userId').exists({ checkFalsy: true }).custom(isMongoId).custom(userExists),
          query('limit').optional().isInt(),
          query(['from', 'to'], "Date should be in YYYY-MM-DD format").optional().isISO8601().custom(dateIsNotInFuture),
          query('from').custom(datesInOrder)
        ]
      }
    case 'createExcercise':
      {
        return [
          body('description').exists({ checkFalsy: true }).isString(),
          body('duration').exists({ checkFalsy: true }),
          body('userId', 'Please provide valid userId').exists({ checkFalsy: true }).custom(isMongoId).custom(val => userExists(val))
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

const processValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
}

app.route('/api/exercise/log/')
  .get(validate("findExcercises"), (req, res) => {
    processValidation(req, res);
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
          res.json({ count: docs.length, log: docs });
        });

      });

  });

app.route('/api/exercise/new-user')
  .post(validate("createUser"), function(req, res) {
    processValidation(req, res);
    let u = new Users({ name: req.body.username });
    console.log("Saving new user " + req.body.username);
    u.save();
    res.json(u);
  });





app.route('/api/exercise/add')
  .post(validate("createExcercise"), function(req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

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
