# Hapi Suricate

Simple and flexible Hapi route REST handlers for your Mongoose models.

```javascript
var handler = new Suricate(MongooseModel);
hapi.route([
  method: 'POST',
  path: '/route',
  handler: handler.create
]);
```

## Instalation

Run `npm install hapi-suricate` on your project folder.


## Basic usage

Bind `.create`, `.find`, `.findById`, `.update` and `.remove` directly to your routes:

```javascript
var Hapi = require('hapi');
var mongoose = require('mongoose');
var Suricate = require('hapi-suricate');

// Define your models
var Schema = new mongoose.Schema({ });
var Model = mongoose.model('Model', Schema);

// Instantiate Hapi server
var hapi = new Hapi.Server();
var handler = new Suricate(Model);

// Define routes
hapi.route([
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
]);
```
## Using with your own route handlers

This is useful when working with subresources.

```javascript
var Hapi = require('hapi');
var mongoose = require('mongoose');
var Suricate = require('hapi-suricate');

// Define your models
var Schema = new mongoose.Schema({ });
var Model = mongoose.model('Model', Schema);

// Instantiate Hapi server
var hapi = new Hapi.Server();
var handler = new Suricate(Model);

// Define routes
hapi.route([
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
  },
  {
    methods: 'GET',
    path: '/model/{id}/subSchema/{subId}',
    handler: function(request, reply) {
      handler.findById(request, reply, function(err, doc) {
        var subDoc = doc.subSchema.id(request.params.subId);
        reply(subDoc);
      });
    }
  },
  {
    method: 'POST',
    path: '/model/{id}/subSchema',
    handler: function(request, reply) {
      var payload = {
        subSchema: request.payload
      };
      request.payload = payload;

      handler.update(request, reply, function(err, doc) {
        reply(doc.subSchema);
      });
    }
  },
  {
    method: 'PUT',
    path: '/model/{id}/subSchema/{subId}',
    handler: function(request, reply) {
      handler.findById(request, reply, function(err, doc) {
        var subSchema = doc.subSchema.id(request.params.subId);
        subSchema.title = request.payload.title;

        doc.save(function(err, doc) {
          reply(doc.subSchema);
        });
      });
    }
  },
  {
    method: 'DELETE',
    path: '/model/{id}/subSchema/{subId}',
    handler: function(request, reply) {
      handler.findById(request, reply, function(err, doc) {
        var subSchema = doc.subSchema.id(request.params.subId);
        subSchema.remove();

        doc.save(function(err, doc) {
          reply(doc.subSchema);
        });
      });
    }
  }
]);
```

## Testing

Despite Mockgoose intercepts Mongoose commands and keep MongoDb instance untouch, you should have a local MongoDb instance running on port 27017 to be able to run the test.

1. Clone repository `git clone https://github.com/viniciusbo/hapi-suricate.git && cd hapi-suricate`
2. Run `npm install`
3. And then `npm test`
