angular.module('Quizz').factory('webSocket', [function(){

	var socket = io();
	return {
		on: function(eventName, callback){
	 			socket.on(eventName, callback);
 		},
 		emit: function(eventName, data) {
	 		socket.emit(eventName, data);
 		}
 	};

	/*var webSocket = {};

	var socket = io();

	webSocket.emit = function(eventName, data)
	{
		socket.emit(eventName, data);
	}

	webSocket.on = function(eventName)
	{
		var tmp;
		socket.on(eventName, function(data){ tmp = data.description; });
		console.log(tmp);
	}

	return webSocket;*/
}]);