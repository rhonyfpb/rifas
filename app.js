var http = require("http");
var express = require("express");
var routes = require("./routes.js");
var handlebars = require("express-handlebars").create({
	defaultLayout: "main"
});

var app = express();

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

app.set("port", process.env.PORT || 3000);

// login
switch(app.get("env")) {
	case "development":
		app.use(require("morgan")("dev"));
		break;
}

// routes
routes(app);

// 404 handler
app.use(function(request, response, next) {
	response.status(404);
	response.render("404");
});

// 500 handler
app.use(function(error, request, response, next) {
	console.error(error.stack);
	response.status(500);
	response.render("500");
});

http.createServer(app).listen(app.get("port"), function() {
	console.log("Application started in " + app.get("env") + " mode on http://localhost:" + app.get("port") + "; press Ctrl-C to terminate.");
});