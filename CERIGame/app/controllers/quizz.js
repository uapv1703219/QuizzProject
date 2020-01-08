angular.module('Quizz').controller('quizz', ['$scope', '$http', function($scope,  $http){

	$scope.showSelect = true;
	$scope.showQuizzPrep = false; // TODO : à remettre false !
	$scope.showQuizz = false;
	$scope.showNext = false;
	$scope.showResults = false;

	$scope.leTheme = null;
	$scope.themes = null;
	$scope.auteur = null;
	$scope.anecdote = null;

	var questions = null;
	var objectif = 200;

	$scope.cptQuestion = 0;
	$scope.laQuestion = null;
	$scope.result = null;
	$scope.lesReponses = null;
	$scope.score = 0;
	var scoreTemp = 0;
	$scope.progress = "0%";
	$scope.mult = 1.0;
	$scope.nbRep = 3;

	$scope.nbQuestions = 2;

	var tempsBegin;
	var tempsEnd;
	$scope.tempsTotal = 0;

	$scope.getQuizz = function() {
		$http
	 	.get('/getQuizzs')
	 	.then(function(response) {
	 		//console.log(response.data.quizz);
	 		var ret = [];
	 		response.data.quizz.forEach(function(obj) {
	 			ret.push(obj.thème);
	 		});
	 		$scope.themes = ret;
	 	});
	}

	$scope.launch = function() {
		$scope.showQuizzPrep = false;
		$scope.showQuizz = true  ;
		$scope.cptQuestion = 0;
		scoreTemp = 0;
		$scope.progress = "0%";

		$http
		.get('/getQuestions', {
			params: {nbQuestions : $scope.nbQuestions, theme : $scope.leTheme}
		})
		.then(function(response) {
			var ret = [];
			response.data.questions.forEach(function(obj) {
				ret.push(obj);
			});
			questions = ret;
			//console.log(questions[0]);

			tempsBegin = new Date();
			console.log(tempsBegin);

			$scope.laQuestion = questions[$scope.cptQuestion].question;
			$scope.lesReponses = getReponsesWithNbRep(); //questions[$scope.cptQuestion].propositions;	//A faire avec nbRep
			$scope.anecdote = questions[$scope.cptQuestion].anecdote;
		});
	}

	$scope.quizzPrep = function(data) {
		$scope.showSelect = false;
		$scope.showQuizzPrep = true;
		$scope.leTheme = data;
		$scope.mult = 1.0;
		$scope.nbRep = 3;
		$scope.score = 0;
		$http
	 	.get('/getAuteur', {
    		params: { data : data }
		})
	 	.then(function(response) {
	 		$scope.auteur = response.data.auteur[0].rédacteur;
	 		//console.log($scope.themes);
	 	});

	}

	$scope.envoieReponse = function(data) {
		//console.log(questions[$scope.cptQuestion].réponse);
		tempsEnd = new Date();
		$scope.tempsTotal += tempsEnd - tempsBegin;

		if(data == questions[$scope.cptQuestion].réponse)
		{
			$scope.result = "Bravo !";
			scoreTemp += 1;
		}
		else
		{
			$scope.result = "Faux, la bonne réponse était : " + questions[$scope.cptQuestion].réponse;
		}
		$scope.showNext = true;
	}

	$scope.nextQuestion = function() {
		$scope.showNext = false;
		$scope.cptQuestion++;
		$scope.progress =  (($scope.cptQuestion / $scope.nbQuestions) * 100) + "%";
		tempsBegin = new Date();
		if($scope.cptQuestion != $scope.nbQuestions)
		{
			$scope.laQuestion = questions[$scope.cptQuestion].question;
			$scope.lesReponses = getReponsesWithNbRep(); //questions[$scope.cptQuestion].propositions;	//A faire avec nbRep
			$scope.anecdote = questions[$scope.cptQuestion].anecdote;
		}
		else
		{
			$scope.score = ((scoreTemp * (objectif / $scope.nbQuestions)) * $scope.mult) - (((($scope.tempsTotal / 1000) * (1.6667 * $scope.nbQuestions))) / 2);
			$scope.score = Math.floor($scope.score);
			$scope.showQuizz = false;
			$scope.showResults = true;

			$http
 			.post('/addHistorique', {'id': localStorage.getItem('id'), 'nbRep': $scope.nbRep, 'temps' : $scope.tempsTotal, 'score' : $scope.score});

			tempsBegin = null;
			tempsTotal = null;
			$scope.tempsEnd = null;
			scoreTemp = 0;

			
		}
	}

	$scope.defi = function() {
		$http
		.post('/defi', {'id_user_defiant': 29,
						'id_user_defie': 29,
						'score_user_defiant': $scope.score,
						'theme_quizz' : $scope.leTheme});
	}

	$scope.backHome = function() {
		$scope.score = 0;
		$scope.showSelect = true;
		$scope.showQuizzPrep = false;
		$scope.showQuizz = false;
		$scope.leTheme = null;
		$scope.showResults = false;
		$scope.showNext = false;
	}

	$scope.setFacile = function() {
		$scope.mult = 0.5;
		$scope.nbRep = 2;
	}

	$scope.setMoyen = function() {
		$scope.mult = 1.0;
		$scope.nbRep = 3;
	}

	$scope.setDifficile = function() {
		$scope.mult = 1.5;
		$scope.nbRep = 4;
	}


	function getReponsesWithNbRep()
	{
		ret = [];
		var err = false;
		var num = 0;
		ret.push(questions[$scope.cptQuestion].réponse);

		while(ret.length != $scope.nbRep)
		{
			var propositions = questions[$scope.cptQuestion].propositions;
			num = Math.floor(Math.random() * questions[$scope.cptQuestion].propositions.length);
			err = false;
			for (var i = 0; i < ret.length; i++) {
				if(ret[i] == propositions[num]) { err = true; break; }
			}
			if(!err)
			{
				ret.push(propositions[num]);
			}
		}
		
		return ret.sort(() => Math.random() - 0.5);
	}
}]);