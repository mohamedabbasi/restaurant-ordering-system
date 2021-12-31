const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Creating a schema for a new order
let orderSchema = new Schema({
    username: {type: String, required: true},
    restaurantID: {type: Number, required: true},
    restaurantName: {type: String, required: true},
    total: {type: Number, required: true},
    subtotal: {type: Number, required: true},
    fee: {type: Number, required: true},
    tax: {type: Number, required: true},
    order: {type: Object, required: true},
});

// Create a collection called Order with the schema that we created above
const Orders = mongoose.model("Orders", orderSchema);
module.exports = Orders;