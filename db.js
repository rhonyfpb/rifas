var redis = require("redis");
var Promise = require("es6-promise").Promise;
var client = redis.createClient();

//redis.debug_mode = true;

client.select(1);

exports.get = function(id) {
	var promise = new Promise(function(resolve, reject) {
		client.get(id, function(err, response) {
			if(err !== null) {
				reject();
			} else {
				if(response === null) {
					reject();
				} else {
					var obj = JSON.parse(response);
					resolve(obj);
				}
			}
		});
	});
	return promise;
};

exports.set = function(id, obj) {
	var promise = new Promise(function(resolve, reject) {
		var string = JSON.stringify(obj);
		client.set(id, string, function(err, response) {
			if(err !== null) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
	return promise;
};