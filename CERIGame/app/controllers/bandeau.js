angular.module('Quizz').controller('bandeau', ['$scope', 'webSocket', '$http',  function($scope, webSocket, $http){
	
	$scope.message = "";
	$scope.showNotification = false;
	$scope.disparition = false;

	$scope.test = function(){
		$http
		.get('/getHistDefis', {
			params: {id: localStorage.getItem('id')}
		})
		.then(function(response) {
			console.log(response);
		});
	}

	$scope.returnNotification = function(){
		return $scope.showNotification;
	}

	$scope.returnDisparition = function(){
		$scope.disparition = true;
		return $scope.disparition;
	}

	webSocket.on('notification', function(data) {
		$scope.$apply(function () {
           $scope.message = data.description;
        });
        if (data.description == "") {
        	$scope.$apply(function () {
           $scope.showNotification = false;
        });}
        else {
        	$scope.showNotification = true;
        	$scope.disparition = false;
        }
	});
}]);

