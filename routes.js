module.exports = function(app, auth) {

	var raffle = {};

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
			var data = request.body;
			var estado = data.estado;
			switch(estado) {
				case "inicio":
					var identificador = data.identificador;
					if(/^[-\w]{5,25}$/.test(identificador)) {
						raffle.state = "pending";
						raffle.server = request.headers.origin;
						raffle.identificador = identificador;
						raffle.urlPublica = "/rifa/" + identificador;
						raffle.urlAdmin = "/admin/" + identificador;
						response.json({
							identificador: identificador,
							status: "ok",
							config: true
						});
					} else {
						response.status(500);
						response.json({
							status: "error",
							message: "Identificador no válido; debe ser una cadena entre 5 y 25 caracteres."
						});
					}
					break;
				case "configuracion":
					var nombre = data.nombre;
					var numeros = data.numeros;
					var plazas = data.plazas;
					var ganadores = data.ganadores;
					var i = 0, j, n1, n2, num;

					var arrNumeros = [];
					numeros = numeros.replace(/\s/g, "").split(",");
					for(; i<numeros.length; i++) {
						if(/^\d+$/.test(numeros[i])) {
							arrNumeros.push(Number(numeros[i]));
						} else {
							if(/^\d+-\d+$/.test(numeros[i])) {
								num = numeros[i].split("-");
								n1 = Number(num[0]);
								n2 = Number(num[1]);
								if(n1 <= n2) {
									for(j=n1; j<=n2; j++) {
										arrNumeros.push(j);
									}
								}
							}
						}
					}

					raffle.state = "config";
					raffle.nombre = nombre;
					raffle.numeros = arrNumeros;
					raffle.plazas = plazas;
					raffle.ganadores = ganadores;

					response.json({
						urlPublica: raffle.server + raffle.urlPublica,
						urlAdmin: raffle.server + raffle.urlAdmin,
						elegibles: raffle.numeros.length,
						nombre: raffle.nombre,
						status: "ok",
						start: true
					});
					break;
				case "iniciar":
					raffle.state = "init";

					// add dynamic route

					response.json({
						url: raffle.server + raffle.urlAdmin,
						status: "ok",
						init: true
					});
					break;
				default:
					break;
			}
		} else {
			response.status(500);
			response.send("Manejador no encontrado");
		}
	});

};