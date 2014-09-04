module.exports = function(app, auth) {

	app.get("/", function(request, response) {
		response.render("home");
	});

	app.get("/user", function(request, response) {
		//response.render("home");
	});

	app.get("/admin",function(request, response, next) {
		var credentials = require("basic-auth")(request);
		if(!credentials || credentials.name !== auth.user || credentials.pass !== auth.password) {
			response.status(401);
			response.set("WWW-Authenticate", "Basic realm=MyRealmName");
			response.render("401");
		} else {
			next();
		}
	}, function(request, response) {
		response.render("admin");
	});

};