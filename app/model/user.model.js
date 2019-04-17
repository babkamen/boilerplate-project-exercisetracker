const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const usersSchema = new Schema({ name: { type: String, index: { unique: true } } });
module.exports = mongoose.model('Users', usersSchema);