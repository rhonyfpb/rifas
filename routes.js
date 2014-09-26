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

		socket.on("admin number change", function(number, assigned) {
			raffle.resultado[number].asignado = assigned;
			io.emit("number change", number, assigned);
			io.emit("admin number change");
		});

		socket.on("number payment", function(number) {
			if(raffle.resultado[number].pagado === false) {
				raffle.resultado[number].pagado = true;
				io.emit("number payment", number);
			}
		});

		socket.on("generate number", function() {
			var position, number, i = 0, result = {}, validate = [], contExt = true, contInt;
			if(raffle.state !== "generating") {
				raffle.state = "generating";
				io.emit("status change", "generando");
			}
			result = makeResult();
			if(result.winner !== undefined) {
				io.emit("generate number", result.winner, result.fakes);
			}
		});

	};

	var makeResult = function() {
		var result = {}, contExt = true, position, number;
		if(raffle.elegidos.length < Number(raffle.ganadores)) {
			while(contExt) {
				position = generateNumber(0, raffle.numeros.length);
				number = raffle.numeros[position];
				if(raffle.elegidos.indexOf(number) === -1) {
					raffle.elegidos.push(number);
					raffle.resultado[number].ganador = true;
					result.winner = number;
					result.fakes = [];
					contInt = 2;
					while(contInt > 0) {
						position = generateNumber(0, raffle.numeros.length);
						number = raffle.numeros[position];
						if(raffle.elegidos.indexOf(number) === -1 && result.fakes.indexOf(number) === -1) {
							result.fakes.push(number);
							contInt--;
						}
					}
					contExt = false;
				}
			}
		}
		return result;
	};

	var generateNumber = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
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
							resultado[num.toString()] = { asignado: null, pagado: false, ganador: false };
							arrNumeros.push(num.toString());
						} else {
							if(/^\d+-\d+$/.test(numeros[i])) {
								num = numeros[i].split("-");
								n1 = Number(num[0]);
								n2 = Number(num[1]);
								if(n1 <= n2) {
									for(j=n1; j<=n2; j++) {
										resultado[j.toString()] = { asignado: null, pagado: false, ganador: false };
										arrNumeros.push(j.toString());
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
			raffle.elegidos = [];
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
						var asignado;
						if(result[number]) {
							asignado = result[number].asignado;
							return asignado === null ? "vacío" : asignado;
						} else {
							return "vacío";
						}
					},
					state: function(estado) {
						return estado === "waiting" ? "esperando" : "";
					},
					payment: function(result, number) {
						var pagado;
						if(result[number]) {
							pagado = result[number].pagado;
							return pagado ? "pagado" : "no pagado";
						} else {
							return "no pagado";
						}
					},
					makeInputs: function(ganadores) {
						var i = 0;
						var result = "";
						for(; i < ganadores; i++) {
							result += "<input id=\"w" + (i+1) + "\" type=\"number\" disabled=\"disabled\" /> ";
						}
						return result;
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
		if((raffle.state === "waiting" || raffle.state === "open" || raffle.state === "sealed" || raffle.state === "generating") && raffle.identificador === id) {
			io.sockets.on("connection", connection);
			response.render("raffle-user", {
				numeros: raffle.numeros,
				resultado: raffle.resultado,
				estado: raffle.state,
				elegidos: raffle.elegidos,
				helpers: {
					increment: function(index) {
						return typeof index === "number" ? index + 1 : Number(index) + 1;
					},
					assign: function(result, number) {
						var asignado;
						if(result[number]) {
							asignado = result[number].asignado;
							return asignado === null ? "vacío" : asignado;
						} else {
							return "vacío";
						}
					},
					state: function(estado) {
						if(estado === "waiting") {
							return "esperando";
						} else if(estado === "open") {
							return "abierta";
						} else if(estado === "sealed") {
							return "cerrada";
						} else if(estado === "generating") {
							return "generando";
						} else {
							return "";
						}
					},
					notEmpty: function(result, number) {
						var asignado;
						if(result[number]) {
							asignado = result[number].asignado;
							return asignado === null ? "" : " disabled=\"disabled\"";
						} else {
							return "";
						}
					},
					payment: function(result, number) {
						var pagado;
						if(result[number]) {
							pagado = result[number].pagado;
							return pagado ? "pagado" : "no pagado";
						} else {
							return "no pagado";
						}
					},
					list: function(elegidos) {
						var i = 0, result = "";
						if(elegidos.length > 0) {
							result += "<div class=\"numero\" style=\"border: 1px solid black; line-height: 100px; width: 100px; text-align: center; font-size: xx-large; float: left; display: block;\">" + elegidos[elegidos.length-1] + "</div>\n";
						}
						result += "<div class=\"lista\">\n";
						for(; i<elegidos.length; i++) {
							result += "<div style=\"float: left; display: inline-block; line-height: 25px; width: 25px; border: 1px dotted black; text-align: center; margin: 0px 5px;\">" + elegidos[i] + "</div>\n";
						}
						result += "</div>\n";
						return result;
					}
				}
			});
		} else {
			response.status(404);
			response.render("404");
		}
	});

};