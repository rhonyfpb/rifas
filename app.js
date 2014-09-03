var http = require("http");
var express = require("express");
var handlebars = require("express-handlebars").create({
	defaultLayout: "main"
});

var app = express();

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

// 404 handler
app.use(function(request, response, next) {
	response.status(404);
	response.render("404");
});

http.createServer(app).listen(3000, function() {
	console.log("Application started on http://localhost:3000; press Ctrl-C to terminate.");
});