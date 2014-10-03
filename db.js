var redis = require("redis");
var client = redis.createClient();

redis.debug_mode = true;

client.select(1);

exports.get = function(id) {
	//
};

exports.set = function(id, obj) {
	var string = JSON.stringify(obj);
	client.set(id, string, redis.print);
};