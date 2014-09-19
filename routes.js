module.exports = function(app, auth, io) {

	var raffle = {};

	var connection = function(socket) {
		
		socket.on("status change", function(status) {
			if(status === "abrir") {
				raffle.state = "open";
				io.emit("status change", status);
			} else if(status === "cerrar") {
				raffle.state = "sealed";
				io.emit("status change", status);
			}
		});

		socket.on("number change", function(number, assigned) {
			if(raffle.resultado[number].asignado === null) {
				raffle.resultado[number].asignado = assigned;
				io.emit("number change", number, assigned);
			}
		});

	};

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
						raffle.listaGanadores = {};
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
					var ganadores = data.ganadores;
					var i = 0, j, n1, n2, num, resultado = {};

					var arrNumeros = [];
					numeros = numeros.replace(/\s/g, "").split(",");
					for(; i<numeros.length; i++) {
						if(/^\d+$/.test(numeros[i])) {
							num = Number(numeros[i]);
							resultado[num] = { asignado: null };
							arrNumeros.push(num);
						} else {
							if(/^\d+-\d+$/.test(numeros[i])) {
								num = numeros[i].split("-");
								n1 = Number(num[0]);
								n2 = Number(num[1]);
								if(n1 <= n2) {
									for(j=n1; j<=n2; j++) {
										resultado[j] = { asignado: null };
										arrNumeros.push(j);
									}
								}
							}
						}
					}

					raffle.state = "config";
					raffle.nombre = nombre;
					raffle.numeros = arrNumeros;
					raffle.ganadores = ganadores;
					raffle.resultado = resultado;

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
	
	app.get("/admin/:id", authentication, function(request, response) {
		var id = request.params.id;
		if(raffle.state === "init" && raffle.identificador === id) {
			io.sockets.on("connection", connection);
			raffle.state = "waiting";
			response.render("raffle-admin", {
				nombre: raffle.nombre,
				identificador: raffle.identificador,
				urlPublica: raffle.server + raffle.urlPublica,
				urlAdmin: raffle.server + raffle.urlAdmin,
				posibles: raffle.numeros.length,
				ganadores: raffle.ganadores,
				estado: raffle.state,
				numeros: raffle.numeros,
				resultado: raffle.resultado,
				helpers: {
					increment: function(index) {
						return typeof index === "number" ? index + 1 : Number(index) + 1;
					},
					assign: function(result, number) {
						var asignado = result[number].asignado;
						return asignado === null ? "vacío" : asignado;
					},
					state: function(estado) {
						return estado === "waiting" ? "esperando" : "";
					}
				}
			});
		} else {
			response.status(404);
			response.render("404");
		}
	});

	app.get("/rifa/:id", function(request, response) {
		var id = request.params.id;
		if((raffle.state === "waiting" || raffle.state === "open" || raffle.state === "sealed") && raffle.identificador === id) {
			io.sockets.on("connection", connection);
			response.render("raffle-user", {
				numeros: raffle.numeros,
				resultado: raffle.resultado,
				estado: raffle.state,
				isWaiting: raffle.state === "waiting" ? true : false,
				isOpen: raffle.state === "open" ? true : false,
				helpers: {
					increment: function(index) {
						return typeof index === "number" ? index + 1 : Number(index) + 1;
					},
					assign: function(result, number) {
						var asignado = result[number].asignado;
						return asignado === null ? "vacío" : asignado;
					},
					state: function(estado) {
						if(estado === "waiting") {
							return "esperando";
						} else if(estado === "open") {
							return "abierta";
						} else {
							return "";
						}
					},
					notEmpty: function(result, number) {
						var asignado = result[number].asignado;
						return asignado === null ? "" : " disabled=\"disabled\"";
					}
				}
			});
		} else {
			response.status(404);
			response.render("404");
		}
	});

};