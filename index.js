'use strict';

/*
 * EXPRESS ROUTE BUILDER
 * Quickly compile Express.js routes with minimal code.
 */

const pathify = require('path').join;
const httpMethods = [
  'get',
  'post',
  'put',
  'head',
  'delete',
  'options',
  'trace',
  'copy',
  'lock',
  'mkcol',
  'move',
  'purge',
  'propfind',
  'proppatch',
  'unlock',
  'report',
  'mkactivity',
  'checkout',
  'merge',
  'm-search',
  'notify',
  'subscribe',
  'unsubscribe',
  'patch',
  'search',
  'connect',
];

module.exports = class ExpressRouteBuilder {

  /*
   * Initialise the builder.
   */
  constructor (_express, _app, _baseDir) {

    this.express = _express;
    this.app = _app;
    this.baseDir = _baseDir || process.cwd();

    this.routes = {};

  }

  /*
   * Adds a static directory to the express app.
   */
  addStatic (dir, mountPath = null) {

    if (mountPath) {
      this.app.use(this.express.static(mountPath, dir));
    } else {
      this.app.use(this.express.static(dir));
    }

  }

  /*
   * Adds a route to the Express app.
   */
  addRoute (path, input, _middleware = []) {

    let middleware = _middleware || [];
    let fullFilename;
    let module;

    // Attempt to load in the module if a filename is given.
    if (typeof input === 'string') {
      try {
        fullFilename = pathify(this.baseDir, input);
        module = require(fullFilename);
      } catch (err) {
        throw new Error(`Unable to load module "${fullFilename}" (${err.code || err.name}).`);
      }

    // Otherwise assume the input is an object.
    } else {
      module = input;
    }

    // Check each of the middleware methods.
    middleware = (Array.isArray(middleware) ? middleware : [middleware]);
    for (let m = 0, mlen = middleware.length; m < mlen; m++) {
      const middlewareFn = middleware[m];

      if (typeof middlewareFn !== 'function') {
        const type = typeof middlewareFn;

        throw new Error(`Middleware for path "${path}" at index ${m} should be a function and not "${type}"!`);
      }
    }

    // Apply the module's handler functions that are present for any of the supported HTTP methods.
    for (let v = 0, vlen = httpMethods.length; v < vlen; v++) {
      const httpMethod = httpMethods[v];
      const handler = module[httpMethod];

      // Handler is not a function.
      if (typeof handler !== 'function') { continue; }

      // Check if we already have a handler mounted on this path and HTTP method.
      if (this.routes[path] && this.routes[path][httpMethod]) {
        throw new Error(`A ${httpMethod.toUpperCase()} route already exists for the path "${path}".`);
      }

      // Mount route with middleware.
      if (middleware && middleware.length) {
        this.app[httpMethod](path, middleware, handler);

      // Mount route without middleware.
      } else {
        this.app[httpMethod](path, handler);
      }

      // Remember that we've mounted on this path and HTTP method to prevent double mounting.
      if (!this.routes[path]) { this.routes[path] = {}; }
      this.routes[path][httpMethod] = true;
    }

    return this;

  }

};
