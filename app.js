var http = require("http");
var express = require("express");
var routes = require("./routes.js");
var handlebars = require("express-handlebars").create({
	defaultLayout: "main"
});
var bodyParser = require("body-parser");

var secret = require("./secret.js");

var app = express();

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

app.set("port", process.env.PORT || 3000);

// log
switch(app.get("env")) {
	case "development":
		app.use(require("morgan")("dev"));
		break;
}

// static
app.use(express.static(__dirname + "/public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(require("serve-favicon")(__dirname + "/public/img/favicon.ico"));

// routes
routes(app, secret.auth);

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