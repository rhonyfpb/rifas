module.exports = function(app, auth) {

	var authentication = function(request, response, next) {
		var credentials = require("basic-auth")(request);
		if(!credentials || credentials.name !== auth.user || credentials.pass !== auth.password) {
			response.status(401);
			response.set("WWW-Authenticate", "Basic realm=\"Ingresa los datos\"");
			response.render("401");
		} else {
			next();
		}
	};

	app.get("/", function(request, response) {
		response.render("home");
	});

	app.get("/user", function(request, response) {
		//response.render("home");
	});

	app.get("/admin", authentication, function(request, response) {
		response.render("admin");
	});

	app.post("/admin", authentication, function(request, response) {
		if(request.xhr) {
			var data = request.body.nombre;
			if(data) {
				var url = "/" + data + "/config";
				response.json({
					url: url
				});
			} else {
				response.send(500, "Nombre no válido.");
			}
		} else {
			response.send(404, "Manejador no encontrado.");
		}
	});

};