const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Creating a schema for the newly registered users
let userSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
});

// Create a collection called User with the schema that we created above
const User = mongoose.model("User", userSchema);
module.exports = User;