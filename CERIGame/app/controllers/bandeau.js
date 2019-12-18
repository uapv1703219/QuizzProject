angular.module('Quizz').controller('bandeau', ['$scope', 'webSocket', '$http',  function($scope, webSocket, $http){
	
	$scope.message = "";
	$scope.showNotification = false;

	$scope.test = function(){
		
	}

	webSocket.on('notification', function(data) {
		$scope.$apply(function () {
           $scope.message = data.description;
        });
        if (data.description == "") {
        	$scope.$apply(function () {
           $scope.showNotification = false;
        });}
        else {$scope.showNotification = true;}
	});
}]);

