angular.module('Quizz').service('session', [function(){

	this._user = JSON.parse(localStorage.getItem('session.user')); 
	
	this.getUser = function(){ return this._user; };
	
	this.setUser = function(user){ 
		this._user = user;
		localStorage.setItem('session.user', JSON.stringify(user)); 
		localStorage.setItem('session.lastConnexion', localStorage.getItem('session.date'));
		//var dateFormat = require('dateformat');
		var now =  new Date(Date.now()).toLocaleString();
		localStorage.setItem('session.date', now);
		return this; 

	};
	
	this.destroy = function(){
		//console.log('Bdestroy :' + this.user);
		this._user = null;
		//console.log('destroy :' + this._user);
		//localStorage.removeItem('session.user');
	}
	
}]);