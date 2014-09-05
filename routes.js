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
			if(/^[-\w]{5,25}$/.test(data)) {
				response.json({
					status: "ok",
					url: "/" + data,
					config: true
				});
			} else {
				response.status(500);
				response.json({
					status: "error",
					message: "Nombre no válido; debe ser una cadena entre 5 y 25 caracteres."
				});
			}
		} else {
			response.status(500);
			response.send("Manejador no encontrado");
		}
	});

};