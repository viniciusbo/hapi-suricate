var expect = require('chai').expect;
var Hapi = require('hapi');
var Suricate = require('../src/suricate');
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');

var SubSchema = new mongoose.Schema({
	title: String
});
var Schema = new mongoose.Schema({
	name: String,
	age: Number,
	subSchema: [SubSchema]
});
var Model = mongoose.model('Model', Schema);

var createDummyModel = function(callback) {
	var model = new Model({
		name: 'vinicius',
		age: 23,
		subSchema: [{
			title: 'lorem ipsum'
		}]
	});
	model.save(function(err, doc) {
		if (err)
			return callback(err);

		callback(false, doc);
	});
};

describe('Suricate', function() {
	var server;
	var handler;

	var defineRoutes = function() {
		var routes = [
			{
				method: 'POST',
				path: '/model',
				handler: handler.create
			},
			{
				method: 'GET',
				path: '/model',
				handler: handler.find
			},
			{
				method: 'GET',
				path: '/model/{id}',
				handler: handler.findById
			},
			{
				method: 'PUT',
				path: '/model/{id}',
				handler: handler.update
			},
			{
				method: 'DELETE',
				path: '/model/{id}',
				handler: handler.remove
			}
		];

		server.route(routes);
	};

	before(function(done) {
		mockgoose(mongoose);
		mongoose.connect('mongodb://localhost:27017');

		server = new Hapi.Server();
		server.connection({ port: 8888 });

		handler = new Suricate(Model);

		defineRoutes();

		done();
	});

	beforeEach(function(done) {
		mockgoose.reset();

		done();
	});

	it('find existing document by attribute', function(done) {
		createDummyModel(function(err, doc) {
			server.inject({
				method: 'GET',
				url: '/model?name=vinicius',
			}, function(res) {
				expect(res.statusCode).to.equal(200);
				expect(res.result[0].name).to.equal('vinicius');

				done();
			});
		});
	});

	it('find unexistent document', function(done) {
		createDummyModel(function(err, doc) {
			server.inject({
				method: 'GET',
				url: '/model?name=ze',
			}, function(res) {
				expect(res.statusCode).to.equal(200);
				expect(res.result.length).to.equal(0);

				done();
			});
		});
	});

	it('find document by id', function(done) {
		createDummyModel(function(err, doc) {
			server.inject({
				method: 'GET',
				url: '/model/' + doc._id
			}, function(res) {
				expect(res.statusCode).to.equal(200);
				expect(res.result._id).not.to.be.null;
				expect(res.result.name).to.equal('vinicius');
				expect(res.result.age).to.equal(23);

				done();
			});
		});
	});

	it('create new document', function(done) {
		server.inject({
			method: 'POST',
			url: '/model',
			payload: {
				name: 'vinicius',
				age: 23
			}
		}, function(res) {
			expect(res.statusCode).to.equal(200);

			var payload = JSON.parse(res.payload);

			expect(payload._id).not.to.be.null;
			expect(payload.name).to.equal('vinicius');
			expect(payload.age).to.equal(23);

			done();
		});
	});

	it('update document', function(done) {
		createDummyModel(function(err, doc) {
			server.inject({
				method: 'PUT',
				url: '/model/' + doc._id,
				payload: {
					name: 'jao',
					age: 21
				}
			}, function(res) {
				expect(res.statusCode).to.equal(200);

				var payload = JSON.parse(res.payload);

				expect(payload.name).to.equal('jao');
				expect(payload.age).to.equal(21);

				done();
			});
		});

	});

	it('remove document', function(done) {
		createDummyModel(function(err, doc) {
			server.inject({
				method: 'DELETE',
				url: '/model/' + doc._id
			}, function(res) {
				expect(res.statusCode).to.equal(200);

				done();
			});
		});
	});

	after(function() {
		mockgoose.reset();
	    mongoose.connection.close();
	});
});

describe('Suricate with callbacks', function() {
	var server;
	var handler;

	before(function(done) {
		mockgoose(mongoose);
		mongoose.connect('mongodb://localhost:27017');

		server = new Hapi.Server();
		server.connection({ port: 8888 });

		handler = new Suricate(Model);

		done();
	});

	beforeEach(function(done) {
		mockgoose.reset();

		done();
	});

	it('find existing document with callback', function(done) {
		server.route({
			method: 'GET',
			path: '/model',
			handler: function(request, reply) {
				handler.find(request, reply, function(err, docs) {
					expect(docs[0].name).to.equal('vinicius');

					done();
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'GET',
				url: '/model?name=vinicius'
			}, function(res) {});
		});
	});

	it('find document by id', function(done) {
		server.route({
			method: 'GET',
			path: '/model/{id}',
			handler: function(request, reply) {
				handler.find(request, reply, function(err, docs) {
					expect(docs[0].name).to.equal('vinicius');

					done();
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'GET',
				url: '/model/' + doc._id
			}, function(res) {});
		});
	});

	it('create new document', function(done) {
		server.route({
			method: 'POST',
			path: '/model',
			handler: function(request, reply) {
				handler.create(request, reply, function(err, doc) {
					expect(doc.name).to.equal('jao');

					done();
				});
			}
		});

		server.inject({
			method: 'POST',
			url: '/model',
			payload: {
				name: 'jao',
				age: 21
			}
		}, function(res) {});
	});

	it('update existing document', function(done) {
		server.route({
			method: 'PUT',
			path: '/model/{id}',
			handler: function(request, reply) {
				handler.update(request, reply, function(err, doc) {
					expect(doc.name).to.equal('jao');
					expect(doc.age).to.equal(21);

					done();
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'PUT',
				url: '/model/' + doc._id,
				payload: {
					name: 'jao',
					age: 21
				}
			}, function(res) {});
		});
	});

	it('remove existing document', function(done) {
		server.route({
			method: 'DELETE',
			path: '/model/{id}',
			handler: function(request, reply) {
				handler.remove(request, reply, function(err, doc) {
					expect(err).to.be.false;

					done();
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'DELETE',
				url: '/model/' + doc._id,
			}, function(res) {});
		});
	});

	it('find subdocuments', function(done) {
		server.route({
			method: 'GET',
			path: '/model/{id}/subSchema',
			handler: function(request, reply) {
				handler.findById(request, reply, function(err, doc) {
					expect(doc.subSchema.length).to.equal(1);

					done();
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'GET',
				url: '/model/' + doc._id + '/subSchema'
			}, function(res) {})
		});
	});

	it('find subdocument by id', function(done) {
		server.route({
			method: 'GET',
			path: '/model/{id}/subSchema/{subId}',
			handler: function(request, reply) {
				handler.findById(request, reply, function(err, doc) {
					expect(doc.subSchema.id(request.params.subId).title).to.equal('lorem ipsum')

					done();
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'GET',
				url: '/model/' + doc._id + '/subSchema/' + doc.subSchema[0]._id,
			}, function(res) {});
		});
	});

	it('add subdocument', function(done) {
		server.route({
			method: 'POST',
			path: '/model/{id}/subSchema',
			handler: function(request, reply) {
				var payload = {
					subSchema: request.payload
				};
				request.payload = payload;

				handler.update(request, reply, function(err, doc) {
					var subSchemaLength = doc.subSchema.length;

					expect(doc.subSchema[subSchemaLength - 1].title).to.equal('dolor sit amet');

					done();
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'POST',
				url: '/model/' + doc._id + '/subSchema',
				payload: {
					title: 'dolor sit amet'
				}
			}, function(res) {});
		});
	});

	it('update subdocument', function(done) {
		server.route({
			method: 'PUT',
			path: '/model/{id}/subSchema/{subId}',
			handler: function(request, reply) {
				handler.findById(request, reply, function(err, doc) {
					var subSchema = doc.subSchema.id(request.params.subId);
					subSchema.title = request.payload.title;

					doc.save(function(err, doc) {
						expect(doc.subSchema.id(request.params.subId).title).to.equal('dolor sit amet');

						done();
					});
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'PUT',
				url: '/model/' + doc._id + '/subSchema/' + doc.subSchema[0]._id,
				payload: {
					title: 'dolor sit amet'
				}
			}, function(res) {});
		});
	});

	it('remove subdocument', function(done) {
		server.route({
			method: 'DELETE',
			path: '/model/{id}/subSchema/{subId}',
			handler: function(request, reply) {
				handler.findById(request, reply, function(err, doc) {
					var subSchema = doc.subSchema.id(request.params.subId);
					subSchema.remove();

					doc.save(function(err, doc) {
						expect(doc.subSchema.length).to.equal(0);

						done();
					});
				});
			}
		});

		createDummyModel(function(err, doc) {
			server.inject({
				method: 'DELETE',
				url: '/model/' + doc._id + '/subSchema/' + doc.subSchema[0]._id,
			}, function(res) {});
		});
	});

	after(function() {
		mockgoose.reset();
	    mongoose.connection.close();
	});
});