angular.module('Quizz').controller('login',  ['$scope', 'auth', '$http', function($scope, auth, $http){
	
	$scope.isLogged = false;
	$scope.connexionStatus = "UnConnected";

	
	$scope.lastConnexion = localStorage.getItem('session.lastConnexion');
	$scope.humeur = null;
	$scope.user = getUserFromLocalStorage();

  $scope.load = function() {
    $scope.isLogged = auth.isLoggedIn();
  	}

	$scope.login = function(){
		auth.logIn($scope.username, $scope.password).then(function(data){
			$scope.isLogged = true;
			$scope.connexionStatus = "Connected";
			$scope.user = getUserFromLocalStorage();
			$scope.lastConnexion = localStorage.getItem('session.lastConnexion');
			$scope.getHumeur();
			//alert(data.statusMsg);
		});

	}

	$scope.logout = function(){
		auth.logOut().then(function(data){
			$scope.isLogged = auth.isLoggedIn();
			$scope.connexionStatus = "Disconnected";
		});
	}

	$scope.setHumeur = function() {
		$http.
		post('/setHumeur', {'id': localStorage.getItem('id'), 'humeur' : $scope.humeur});
		$scope.humeur = $scope.humeur;
	}

	$scope.getHumeur = function() {
		$http
		.get('/getHumeur', {
			params: {id : localStorage.getItem('id')}
		})
		.then(function(response) {
			//console.log(response);
			$scope.humeur = response.data.data.rows[0].humeur;
			//console.log(response.data.data.rows);
		});
	}

    function getUserFromLocalStorage() {	//Enlève les guillments du local storage
		var tmp = localStorage.getItem('session.user');
		if(tmp != null)
		{
			return tmp.substr(1, tmp.length - 2);
		}
		else return null;
	}

}]);

//angular.module('myApp.controllers').controller('Ctrlr1', ['$scope', '$http', function($scope, $http) {}]);