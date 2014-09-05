$(document).on("ajaxSend", function() {
	$(".error").addClass("not-visible").removeClass("visible").text("");
});

$("#crear").on("click", function() {
	var nombre = $("#nombre").val();
	if(nombre) {
		$.ajax({
			url: "/admin",
			method: "POST",
			data: {
				nombre: nombre
			}
		}).done(function(data) {
			if(data.status === "ok") {
				if(data.config === true) {

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