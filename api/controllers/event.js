let db = require('../../lib/db.js'),
	errorHandler = require('../../lib/errorHandler.js');

module.exports = {
	/* Public methods */
/*
	findAll : function(req, res, done){
		db.get().queryAsync('SELECT * FROM ' + db.tables.service + ' WHERE is_active = 1', function(err, rows){
			if(err){
				res.status(500).json({"message":"Internal server error."});
			}
			res.status(200).json(rows);
			done();
		});
	},
*/
	findServiceByPromoter : function(req, res){
		//Hay que mejorarlo y hacer una comprobacion previa de que el provider esté activo, o con un JOIN seria suficiente
		db.get().queryAsync('SELECT * FROM ' + db.tables.service + ' WHERE fk_promoter = ? AND is_active = 1',
		 req.swagger.params.providerId.value, function(err, rows){
			if (rows.length == 0){
				res.status(404).json({"message": "Service not found."});
				return done();
			}
			rows.forEach(function(row){
				delete row.is_draft;
				delete row.is_active;
				delete row.dt_create_timestamp;
			});

			return res.status(200).json(rows);
		})
		.catch(function(err){
			errorHandler.internalServer(res, err);
		});
	},

	createEvent : function(req, res) {
		req.body.fk_promoter = req.authInfo._id;
		var connection, eventId;

		db.get().getConnectionAsync()
		.then(function(dbConnection){
			connection = dbConnection;
			return connection.beginTransaction();
		})
		.then(function(){
			return connection.queryAsync('INSERT INTO ' + db.tables.event + ' SET ?', req.swagger.params.body.value);
		})
		.then(function(result){
			eventId = result.insertId;

			return connection.queryAsync('INSERT INTO ' + db.tables.event_description + 
				' (fk_event, tx_description) VALUES (?,"")', eventId);
		})
		.then(function(result){
			return connection.commit();
		})
		.then(function(){
			connection.release();
			return res.status(200).json({"eventId": eventId});
		})
		.catch(function(err){
			if (connection != undefined){
				connection.rollback();
			}
			errorHandler.internalServer(res, err);
		});
	},

	updateEvent: function(req, res){
		db.get().queryAsync('UPDATE ' +  db.tables.event +' SET ? WHERE _id = ? AND fk_promoter = ?',
			[req.swagger.params.body.value, req.swagger.params.body.value._id, req.authInfo._id])
		.then(function(result){
			if(result.affectedRows == 0){
				return res.status(404).json({"message": "Event not found."});
			}
			return res.status(200).json(result);
		})
		.catch(function(err){
			errorHandler.internalServer(res, err);
		});
	},

	updateEventDescription : function(req, res){
		db.get().queryAsync('UPDATE ' + db.tables.event_description + ' AS description ' +
			'JOIN ' + db.tables.event + ' AS event ON description.fk_agency_event = event._id ' +
			'SET ? WHERE event.fk_promoter = ? AND event._id = ?',
			[req.swagger.params.body.value, req.authInfo._id, req.swagger.params.body.value.fk_event])
		.then(function(result){
			if(result.affectedRows == 0){
				return res.status(404).json({"message": "Event not found."});
			}
			return res.status(200).json(result);
		})
		.catch(function(err){
			errorHandler.internalServer(res, err);
		});
	}
/*

	delete : function(req, res, done) {
		db.get().queryAsync('UPDATE ' + db.tables.service + ' SET is_active = 0 WHERE _id = ? ', req.params.id, function (err, rows) {
			if(err){
				res.status(500).json({"message":"Internal server error."});
				return done(err);
			}
			res.status(200).json();
			done();
		})
	},

*/
	/* Internal methods non-callable from client */

}