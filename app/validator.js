const { query, body } = require('express-validator/check');

const userRepo = require('./repository/user.repo.js')

const mongoose = require('mongoose')


module.exports.validate = (method) => {
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
          query('from').custom(datesAreInOrder)
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

const isMongoId = (value, { req }) => {
  new mongoose.Types.ObjectId(value);
  return true;
};

const userExists = (id) => {
  return userRepo.existsWithId(id).then((r)=>{
    if(!r)throw new Error("User doesn't exist");
    return true;
  });
}


const userAlreadyExists = (username) => {
  return userRepo.existsWithUsername(username).then((r)=>{
    if(r)throw new Error("Username already taken");
    return true;
  });
}

const datesAreInOrder = (fromDate, { req }) => {
  var toDate = req.query.to;
  if (fromDate && toDate && new Date(fromDate).getTime() >= new Date(toDate).getTime()) {
    throw new Error('From date must be before to date');
  }
  return true;
}
const dateIsNotInFuture = (v) => {
  if (v && new Date(v).getTime() >= new Date().getTime()) {
    throw new Error('Invalid date');
  }
  return true;
}
