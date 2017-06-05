"use strict";

function Suricate(Model) {
	var Model = Model;

	var callReplyOrCallback = function(err, result, reply, callback) {
		if (!!callback == true) {
			if (err)
				return callback(err);

			return callback(false, result);
		}

		if (err) 
			return reply(new Error(err));

		reply(result);
	};

	this.find = function(request, reply, callback) {
		Model.find(request.query, function(err, docs) {
			callReplyOrCallback(err, docs, reply, callback);
		});
	};

	this.findOne = function(request, reply, callback) {
		Model.findOne(request.query, function(err, doc) {
			callReplyOrCallback(err, doc, reply, callback);
		});
	};

	this.findById = function(request, reply, callback) {
		Model.findById(request.params.id, function(err, doc) {
			callReplyOrCallback(err, doc, reply, callback);
		});
	};

	this.create = function(request, reply, callback) {
		Model.create(request.payload, function(err, doc) {
			callReplyOrCallback(err, doc, reply, callback);
		});
	};

	this.update = function(request, reply, callback) {
		Model.findOneAndUpdate({ _id: request.params.id }, request.payload, function(err, doc) {
			callReplyOrCallback(err, doc, reply, callback);
		});
	};

	this.remove = function(request, reply, callback) {
		Model.findOneAndRemove({ _id: request.params.id }, function(err) {
			callReplyOrCallback(err, {}, reply, callback);
		});
	};
};

module.exports = Suricate;