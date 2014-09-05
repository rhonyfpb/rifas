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
			console.log("data", data);
		}).fail(function() {
			console.log("arguments", arguments);
		});
	}
});