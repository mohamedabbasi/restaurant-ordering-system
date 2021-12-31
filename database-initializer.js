let userNames = ["Louis", "Jackson", "Samuel", "Mohamed", "Bilal", "Connor", "Heath", "Peter", "Lionel", "Tokyo"];
let users = [];
const USER_COLLECTION = "USER_COLLECTION";

userNames.forEach(name => {
	let user = {};
	user.username = name;
	user.password = name;
	user.privacy = false;
	users.push(user);
});

let mongo = require("mongodb");
let MongoClient = mongo.MongoClient;
let db;

MongoClient.connect("mongodb://localhost:27017/ordering-system", function(err, client) {
	if(err) throw err;	
	db = client.db("ordering-system");

	db.listCollections().toArray(function(err, result) {
		if(result.length == 0) {
			db.collection(USER_COLLECTION).insertMany(users, function(err, result) {
				if(err) {
					throw err;
				} console.log(result.insertedCount + " Users successfully added (should be 10).");
				client.close();
			}); return;
		}
		
		let numDropped = 0;
		let toDrop = result.length;
		result.forEach(collection => {
			db.collection(collection.name).drop(function(err, delOK) {
				if(err) {
					throw err;
				} console.log("Dropped collection: " + collection.name);
				numDropped++;

				if(numDropped == toDrop) {
					db.collection(USER_COLLECTION).insertMany(users, function(err, result) {
						if(err) {
							throw err;
						} console.log(result.insertedCount + " Users successfully added (should be 10).");
						console.log(users);
						client.close();
					});
				}
			});		
		});
	});
});