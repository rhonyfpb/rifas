$(document).ready(function() {

	$(document).on("ajaxSend", function() {
		$(".error").addClass("not-visible").removeClass("visible").text("");
	});

	// IDENTIFICADOR
	$("#crear").on("click", function() {
		var identificador = $("#identificador").val();
		if(identificador) {
			$.ajax({
				url: "/admin",
				method: "POST",
				data: {
					identificador: identificador,
					estado: "inicio"
				}
			}).done(function(data) {
				if(data.status === "ok") {
					if(data.config === true) {
						$("#grupo-identificador").addClass("not-visible").removeClass("visible");
						$("#grupo-configuracion").addClass("visible").removeClass("not-visible");
						$("#identificador-server").text(data.identificador);
					}
				}
			}).fail(function(objError) {
				var response = objError.responseJSON;
				if(response && response.status) {
					if(response.status === "error") {
						$(".error").addClass("visible").removeClass("not-visible").text(response.message);
					}
				} else {
					$(".error").addClass("visible").removeClass("not-visible").text("Error no especificado");
				}
			});
		}
	});

	// CONFIGURACION
	$("#guardar").on("click", function() {
		var nombre = $("#nombre-largo").val() || "Rifa";
		var numeros = $("#numeros").val() || "1-30";
		var ganadores = $("#ganadores").val() || "1";
		$.ajax({
			url: "/admin",
			method: "POST",
			data: {
				nombre: nombre,
				numeros: numeros,
				ganadores: ganadores,
				estado: "configuracion"
			}
		}).done(function(data) {
			if(data.status === "ok") {
				if(data.start === true) {
					$("#grupo-configuracion").addClass("not-visible").removeClass("visible");
					$("#grupo-confirmacion").addClass("visible").removeClass("not-visible");
					$("#nombre-server").text(data.nombre);
					$("#elegibles-server").text(data.elegibles);
					$("#url-publica").text(data.urlPublica);
					$("#url-admin").text(data.urlAdmin);
				}
			}
		});
	});

	// CONFIRMACION
	$("#iniciar").on("click", function() {
		$.ajax({
			url: "/admin",
			method: "POST",
			data: {
				estado: "iniciar"
			}
		}).done(function(data) {
			if(data.status === "ok") {
				if(data.init === true) {
					window.location = data.url;
				}
			}
		});
	});

});