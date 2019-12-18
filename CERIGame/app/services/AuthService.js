angular.module('Quizz').service('auth', ['$http', 'session', function($http, session){

	/** * Check whether the user islogged in * @returnsboolean*/
	this.isLoggedIn = function isLoggedIn(){ 
		//console.log(session.getUser());
		return session.getUser() !== null; 
	};
	
	this.logIn = function(username, pwd){
		return $http
 		.post('/login', {'username': username, 'password': pwd})
 		.then(function(response){
 			//console.log(response.data.statusResp + '  ' + session);
 			if(response.data.statusResp){
 				session.setUser(response.data.data.username);
 				localStorage.setItem('id', response.data.id);
 				//alert('Connecté => status reponse:' +response.data.statusResp+' message: '+response.data.statusMsg+' objet: '+JSON.stringify(response.data.data.username));
 			}
 			return(response.data);
 		});
	};

 this.logOut = function(){
 	return $http
 	.get('/logout')
 	.then(function(response){
 		// Destroy session in the browser
 		session.destroy();
		 return(response.data);
 	});
 };

}]);