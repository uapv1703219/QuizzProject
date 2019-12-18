var __dirname = '/home/nas02a/etudiants/inf/uapv1703219/QuizzProject/'; //variable contenant le répertoire des sources sur le serveur physique 
var mongoUrl = 'mongodb://localhost:27017/db';

const express = require('express');
const pgClient = require('pg');
var sha1 = require('sha1');
const bodyParser= require('body-parser');
const session = require('express-session');
var helmet = require('helmet');
var MongoClient = require('mongodb').MongoClient;

const app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(helmet()); //Permet d'avtiver la sécurité X-Content-Type-Options

app.use(express.static(__dirname + '/CERIGame/'));

//---------------------Session------------------------------

const MongoDBStore = require('connect-mongodb-session')(session);

app.use(session({	// charge le middleware express-session dans la pile 
	secret: 'Quizz',
	saveUninitialized: false, // Session créée uniquement à la première sauvegarde de données
	resave: true, // pas de session sauvegardée si pas de modif
	store : new MongoDBStore({ // instance de connect-mongodb-session
		uri: "mongodb://127.0.0.1:27017/users",
		collection: 'mySessions',
		touchAfter: 24 * 3600 // 1 sauvegarde toutes les 24h hormis si données MAJ 
	}), 
	cookie : {maxAge : 24 * 3600 * 10} // millisecond valeur par défaut  { path: '/', httpOnly: true, secure: false, maxAge: null } 
}));

//---------------------Requetes post-------------------------
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '10mb'}));


//----------------------PostGreSQL------------------------------
var pool = new pgClient.Pool({user: 'uapv1703219', host: '127.0.0.1', database: 'etd', password: '0LDbn9', port: 5432 });
pool.connect(function(err, client, done) { 
	if(err) {console.log('Error connecting to pg server' + err.stack);}  
	else{ console.log('Connection established with pgdb server');} 
	}); // Exécution de la requête SQL et traitement du résultat

//---------------------Fonction principale---------------------------

app.post('/login', function(request, res) {

	console.log('login :' + request.body.username + ' password :' + request.body.password);

	//Définition de la requéte SQL pour la connexion
	sql="select * from fredouil.users where identifiant = '" + request.body.username + "';";

	//Execution de la requete et traitement
	pool.query(sql, (err, result) => {
		//console.log(result.rows[0]); //DEBUG
		if(err){
			console.log('Erreur d’exécution de la requete' + err.stack);
			res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
		}
		else if((result.rows[0] != null) && (result.rows[0].motpasse == sha1(request.body.password))){
			//Connexion réussie
			console.log("User Connected");

			//Création de Session
			request.session.isConnected = true; 
			request.session.username = request.body.username;
			//console.log(request.session.id +' expire dans '+request.session.cookie.maxAge);
			//io.emit('notification', { description: 'Connexion réussie !'});
			notificationSend('Connexion réussie !');


			statusOnline = "UPDATE fredouil.users SET statut = 1 where identifiant = '" + request.body.username + "';";
			pool.query(statusOnline, (err, result) => {
				if(err){
					console.log('Erreur d’exécution de la requete' + err.stack);
					res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
				}
			});
			res.status(200).send({
					statusMsg: 'Vous êtes reconnu !',
					statusResp: true,
					data: request.session,
					id: result.rows[0].id
			});
		}
		else {
			notificationSend('Pseudo/Mot de passe Inconnu !');
			res.status(403).send({
					statusMsg: 'Pseudo/Mot de passe Inconnu !',
					statusResp: true
			});
		}
			
	});
	//pool.release();
});

app.get('/logout', function(request, res) {
	if(request.session.isConnected == false)
	{
		res.status(401).send({
					statusMsg: 'Non connecté !'
			});
	}
	else {
		//request.session.isConnected = false;

		//console.log(request.session);
		//request.session.cookie.maxAge = 0;
		//request.session.cookie._expires = Date.now();
		//console.log(request.session.cookie);
		res.clearCookie('connect.sid', {path: '/'});
		notificationSend('Vous êtes bien déconnécté !');
		/*io.emit('notification', { description: 'Vous êtes bien déconnécté !'});
		notificationReset();*/
		
		statusOffline = "UPDATE fredouil.users SET statut = 0 where identifiant = '" + request.session.username + "';";
		pool.query(statusOffline, (err, result) => {
			if(err){
				console.log('Erreur d’exécution de la requete' + err.stack);
				res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
			}
		});
		//pool.release();

		res.status(200).send({
					statusMsg: 'Déconnécté !'
			});
	}
});

app.all('/', function(request, res) {
	//res.sendFile(__dirname +'CERIGame/index.html');
	res.sendFile('index.html');
});

app.get('/getQuizzs', function(request, res) {
	MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function(error, client) {
	    if (error) 
	    {
	    	throw error;
	    	res.status(500).send();
	    }
	    else
	    {
	    	const db = client.db("db");
	    	db.collection("quizz").find({}).project({thème : 1}).toArray(function(err, results) {
    			res.status(200).send({
		    		quizz : results
		   		});
			});
			client.close();
		}
	});
});

app.get('/getAuteur', function(request, res) {
	MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function(error, client) {
	    if (error) 
	    {
	    	throw error;
	    	res.status(500).send();
	    }
	    else
	    {
			const db = client.db("db");
			db.collection("quizz").find({thème : request.query.data}).project({rédacteur : 1}).toArray(function(err, results) {
				res.status(200).send({
					auteur : results
				});
			});
			client.close();
			notificationSend('Auteur récupérer !');
		}
	});

});

app.get('/getQuestions', function(request, res) {
	MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function(error, client) {
	    if (error) 
	    {
	    	throw error;
	    	res.status(500).send();
	    }
	    else
	    {
	    	const db = client.db("db");
			db.collection("quizz").find({thème : request.query.theme}).project({quizz : 1}).toArray(function(err, results) {
				//console.log(results[0].quizz);

				var ret = [];
				var err = false;
				//console.log(results[0].quizz.length);
				ret.push(results[0].quizz[Math.floor(Math.random() * results[0].quizz.length) + 1.0]);
				//console.log(ret[0].id);
				while(ret.length != request.query.nbQuestions)
				{
					var num = Math.floor(Math.random() * results[0].quizz.length) + 1;
					err = false;
					for (var i = 0; i < ret.length; i++) {
						//console.log(i + " i");
						//console.log(ret.length + " len");
						//console.log(ret[i]);
						if(ret[i].id == num) { err = true; break; }
					}
					//console.log("------------------------------");
					//console.log(ret);
					//console.log(ret.length);
					if(!err)
					{
						ret.push(results[0].quizz[num]);
					}
				}
				res.status(200).send({
					questions : ret
				});
			});
			client.close();
	    }
	});
});

app.post('/addHistorique', function(request, res) {
	//console.log(request.body);
	var sql = 'INSERT INTO fredouil.historique (id_users, date, nbreponse, temps, score)'
	+ ' VALUES (' + request.body.id+', now(), '+request.body.nbRep+', '+request.body.temps +', '+ request.body.score +');';
	pool.query(sql, (err, result) => {
		//console.log(result.rows[0]); //DEBUG
		if(err){
			console.log('Erreur d’exécution de la requete ' + err.stack);
			res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
		}
		else { res.status(200).send(); }
	});
});

app.get('/getHistoriqueOf', function(request, res) {
	//console.log(request.query);
	var sql = "SELECT * FROM fredouil.historique WHERE id_users = " + request.query.id + ";";
	pool.query(sql, (err, result) => {
		//console.log(result.rows[0]); //DEBUG
		if(err){
			console.log('Erreur d’exécution de la requete' + err.stack);
			res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
		}
		else
		{
			res.status(200).send({
				data: result
			});
		}
	});
});

app.post('/setHumeur', function(request, res) {
	var sql = "UPDATE fredouil.users SET humeur = '" + request.body.humeur + "' where id = " + request.body.id + ";";
	pool.query(sql, (err, result) => {
		//console.log(result.rows[0]); //DEBUG
		if(err){
			console.log('Erreur d’exécution de la requete' + err.stack);
			res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
		}
		else { res.status(200).send(); }
	});
});

app.get('/getHumeur', function(request, res) {
	var sql = "SELECT humeur FROM fredouil.users WHERE id = " + request.query.id + ";";
	pool.query(sql, (err, result) => {
		//console.log(result.rows[0]); //DEBUG
		if(err){
			console.log('Erreur d’exécution de la requete' + err.stack);
			res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
		}
		else
		{
			res.status(200).send({
				data: result
			});
		}
	});
});

app.get('/getSocial', function(request, res) {
	var sql = "SELECT identifiant, humeur, statut FROM fredouil.users;";
	pool.query(sql, (err, result) => {
		//console.log(result.rows[0]); //DEBUG
		if(err){
			console.log('Erreur d’exécution de la requete' + err.stack);
			res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
		}
		else
		{
			res.status(200).send({
				data: result
			});
		}
	});
});

//-----------------WEB SOCKETS--------------------------

io.on('connection', function(socket) {
   console.log('A user connected');

  /* setTimeout(function() {
      socket.emit('notification', { description: 'A custom event named testerEvent!'}); console.log('Message send !');}, 4000);
*/
   socket.on('emit', function(data) { console.log(data);});
   	socket.on('disconnect', function () {
      console.log('A user disconnected');
   		});

   	setInterval(function() {
   		selectFromTable("users", ["identifiant", "humeur", "statut"])
		.then(function(result) {
			//console.log(result.rows);
			io.emit('social', {social: result.rows});
		});
   	}, 20000);

	});

http.listen(3154 , function() {
	console.log('listening 3154');
});

function notificationSend(data)
{
	io.emit('notification', {description: data});
	setTimeout(function() {
		io.emit('notification', { description: ""});
	}, 5000);
}

/*function getClient() {
	MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function(error, client) {
	    if (error) 
	    {
	    	console.log('Hello');
	    	throw error;
	    	res.status(500).send();
	    }
	    else
	    {
	    	return client;
		}
	});
}*/

//-----------Utilis----------------

function errorRequestPgFail(err, res) {
	console.log('Erreur d’exécution de la requete : ' + err.stack);
	res.status(500).send("Une erreur est survenue pendant la l'éxécution de la requête.");
}

function deleteInTable(table, varNamesConditions, varValuesConditions) {
	sql = "DELETE FROM fredouil." + table + " WHERE ";
	for (var i = 0; i < varNamesConditions.length; i++) {
		sql += varNamesConditions[i] + ' $' + (i + 1) + ' AND ';
	}
	sql = sql.substring(0, sql.length - 5);
	sql += ";";
	console.log(sql);
	return pool.query(sql, varValuesConditions);
}

function updateInTable(table, varNames, varValues, varNamesConditions, varValuesConditions) {
	sql = "UPDATE fredouil." + table + " SET ";
	for (var i = 0; i < varNames.length; i++) {
		sql += varNames[i] + " = $" + (i + 1) + ", ";
	}
	sql = sql.substring(0, sql.length - 2);
	if (varNamesConditions != null) {
		sql += " WHERE ";
		for (var i = 0; i < varNamesConditions.length; i++) {
			sql += varNamesConditions[i] + ' $' + (i + varNames.length + 1) + ' AND ';
		}
		sql = sql.substring(0, sql.length - 5);
	}
	sql += ";";
	console.log(sql);
	for (var i = 0; i < varValuesConditions.length; i++) {
		varValues.push(varValuesConditions[i]);
	}

	return pool.query(sql, varValues);
}

function selectFromTable(table, varNames, varNamesConditions, varValuesConditions, join) {
	sql = "SELECT ";
	for (var i = 0; i < varNames.length; i++) {
		sql += varNames[i] + ', ';
	}
	sql = sql.substring(0, sql.length - 2);
	sql += " FROM fredouil." + table;

	if (varNamesConditions != null) {
		sql += " WHERE ";
		for (var i = 0; i < varNamesConditions.length; i++) {
			sql += varNamesConditions[i] + ' $' + (i + 1) + ' AND ';
		}
		sql = sql.substring(0, sql.length - 5);
	}

	if(join != null) { sql += ' ' + join; }

	sql += ";";
	console.log(sql);
	return pool.query(sql, varValuesConditions);
}

function insertIntoTable(table, varNames, varValues) {
	sql = 'INSERT INTO fredouil.' + table + ' (';
	for (var i = 0; i < varNames.length; i++) {
	 	sql += varNames[i] + ', ';
	} 
	sql = sql.substring(0, sql.length - 2);
	sql += ') VALUES (';
	for (var i = 1; i < varValues.length + 1; i++) {
		sql += '$' + i + ', ';
	}
	sql = sql.substring(0, sql.length - 2);
	sql += ');';
	console.log(sql);
	return pool.query(sql, varValues);

}