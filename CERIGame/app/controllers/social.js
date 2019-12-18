angular.module('Quizz').controller('social', ['$scope', 'webSocket', '$http',  function($scope, webSocket, $http){
	$scope.historique = null;
	$scope.menu = "Historique";
	$scope.showSocial = true;
	$scope.showHistorique = false;
	$scope.users = null;

	$scope.switchView = function() {
		$scope.showSocial = !$scope.showSocial;
		$scope.showHistorique = !$scope.showHistorique;

		if ($scope.menu == "Historique") { $scope.menu = "Social"; }
		else { $scope.menu = "Historique"; }
	}

	$scope.getHistorique = function(){
		$scope.historique = [];
		$http
		.get('/getHistoriqueOf', {
			params: {id : localStorage.getItem('id')}
		})
		.then(function(response) {
			//console.log(response);
			var cpt = 0;
			response.data.data.rows.forEach(function(obj) {
				$scope.historique.push(obj);
				cpt++;
			});
			//console.log(response.data.data.rows);
		});
	}

	webSocket.on('social', function(data) {
		$scope.$apply(function () {
			console.log(data.social);
           $scope.users = data.social;
           $scope.$apply();
        });
	});

	$scope.getSocial = function(){
		$http
		.get('/getSocial')
		.then(function(response) {
			//console.log(response);
			$scope.users = response.data.data.rows;
			console.log($scope.users);
		});
	}

}]);