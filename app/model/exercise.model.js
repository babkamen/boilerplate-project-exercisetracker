const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var ExerciseSchema = new Schema({ username: String, description: String, duration: Number, date: { type: Date, default: Date.now } });

ExerciseSchema.methods.toJSON = function() {
  var exercise = this;
  var exerciseObject = exercise.toObject();
  exerciseObject.date = exerciseObject.date.toDateString();
  return exerciseObject;
};

module.exports = mongoose.model('Exercises', ExerciseSchema);
