const express = require('express');
const pgClient = require('pg');
var sha1 = require('sha1');
const bodyParser= require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '10mb'}));

//PostGreSQL
var __dirname = '/home/nas02a/etudiants/inf/uapv1703219/QuizzProject/'; //variable contenant le répertoire des sources sur le serveur physique 
var pool = new pgClient.Pool({user: 'uapv1703219', host: '127.0.0.1', database: 'etd', password: '0LDbn9', port: 5432 });
pool.connect(function(err, client, done) { 
	if(err) {console.log('Errorconnecting to pg server' + err.stack);}  
	else{ console.log('Connection established with pgdb server');} 
	}); // Exécution de la requête SQL et traitement du résultat

var server = app.listen(3154 , function() {

	console.log('listening 3154');

	app.post('/login', function(request, res) {
		console.log('login :' + request.body.pseudo + ' password :' + request.body.mdp)

		//Définition de la requéte SQL pour la connexion
		sql="select * from fredouil.users where identifiant = '" + request.body.pseudo + "';";

		var dataReturn;

		//Execution de la requete et traitement
		pool.query(sql, (err, result) => {
			//console.log(result.rows[0]); //DEBUG
			if(err){
				console.log('Erreur d’exécution de la requete' + err.stack);
				dataReturn = 'Une erreur est survenue pendant la l\'écécution de la requête.';
			}
			else if((result.rows[0] != null) && (result.rows[0].motpasse == sha1(request.body.mdp))){
				dataReturn = 'C\'est toi ? Bienvenue !';		//Connexion réussie
			}
			else {
				dataReturn = 'T\'es qui dans l\'esport ?';	//Connexion échouée
				}
				res.send(dataReturn);
			});
	});


	app.all('/', function(request, res) {
		res.sendFile(__dirname +'CERIGame/index.html');
	});
});