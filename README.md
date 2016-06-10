# Express-Route-Builder
Quickly compile Express.js routes with minimal code.

**NOTE: Requires Node.js v6.x**

## Quick Use

#### index.js
Setup your Express app as usual. It's a good idea to create a separate module to handle the building of your routes so as to keep your `index.js` minimal.

```javascript
const express = require('express');
const app = express();
const routes = require('./routes');

routes.setup(app);
```

#### routes.js
Specify the module filenames that will handle each path with the `.addRoute()` method.

```javascript
const path = require('path');
const express = require('express');
const ExpressRouteBuilder = require('express-route-builder');

module.exports.setup = function (app) {
  const baseDir = path.join(__dirname, 'controllers/');
  const builder = new ExpressRouteBuilder(express, app, baseDir);

  builder.addRoute('/comments', 'comments');
  builder.addRoute('/users', 'users');
};
```

#### controllers/comments.js (etc)
In each of the route modules you should specify functions named after the HTTP methods you want to expose. You can use any of the HTTP methods that Express supports, including:

_`get, post, put, head, delete, options, trace, copy, lock, mkcol, move, purge, propfind, proppatch, unlock, report, mkactivity, checkout, merge, m-search, notify, subscribe, unsubscribe, patch, search, connect`_

**Note:** The function names must be lowercase.

```javascript
module.exports.get = function (req, res, next) { ... };
module.exports.post = function (req, res, next) { ... };
// ...and so on.

```

## Static Files
Serving up static files is very easy and uses the same arguments as `express.static()` except with the arguments reversed. To specify multiple static directories call the `.addStatic()` method multiple times. Files will be looked up in the order the directories are specified.

```javascript
  // Adds a directory from which express will serve up your static files.
  // For "photo.jpg" the resulting URL will be "http://www.example.com/photo.jpg"
  // and the file will be served up from the directory specified.
  builder.addStatic('/path/to/static/directory');

  // You can also specify a prefix to use in the URL as the second parameter.
  // This time "photo.jpg" will have a URL of "http://www.example.com/images/photos/photo.jpg"
  builder.addStatic('/path/to/static/directory', 'images/photos');
```

## API

#### new ExpressRouteBuilder(express, app, baseDir = process.cwd());
Creates a new instance of the builder. The base directory is optional and defaults to the current working directory of your app.

#### .addRoute(path, filename, middleware = []);
Adds a route to your Express app based on the path given; you can specify any path that Express accepts. The filename should be the name of the module which will handle this route, relative to the base path given in the constructor. Also, you can optionally specify an array of middleware functions to use before the route is processed.

#### .addStatic(dir, prefix = null);
Adds a directory to your express app where static files will be served up from. The directory will be relative to the current working directory of your app so it's a good idea to specify an absolute path. The prefix parameter is optional and will be prepended to the file path in the URL, just like with express.static().
