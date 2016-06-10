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
  addStatic (dir, prefix = null, _middleware = [], options = {}) {

    const middleware = this.prepareMiddlewareArray(_middleware);
    const args = [];
    const { mResult, mIndex, mType } = this.checkMiddlewareMethods(middleware);

    if (!mResult) {
      throw new Error(`Middleware for static directory "${dir}" at index ${mIndex} should be a function and not "${mType}"!`);
    }

    // Build the arguments to pass to app.use().
    if (prefix) { args.push(prefix); }
    if (middleware && middleware.length) { args.push(middleware); }
    args.push(this.express.static(dir, options));

    this.app.use.apply(null, args);

  }

  /*
   * Adds a route to the Express app.
   */
  addRoute (path, input, _middleware = []) {

    const middleware = this.prepareMiddlewareArray(_middleware);
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
    const { mResult, mIndex, mType } = this.checkMiddlewareMethods(middleware);

    if (!mResult) {
      throw new Error(`Middleware for path "${path}" at index ${mIndex} should be a function and not "${mType}"!`);
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

  /*
   * Ensures the middleware is an array.
   */
  prepareMiddlewareArray (middlewareList) {
    if (!middlewareList) { return []; }
    return (Array.isArray(middlewareList) ? middlewareList : [middlewareList]);
  }

  /*
   * Ensure all middlewares are valid.
   */
  checkMiddlewareMethods (middlewareList) {

    // Check each function in turn.
    for (let index = 0, ilen = middlewareList.length; index < ilen; index++) {
      const middlewareFn = middlewareList[index];

      if (typeof middlewareFn !== 'function') {
        const type = typeof middlewareFn;

        return { mResult: false, index, type };
      }
    }

    // All OK!
    return { mResult: true };

  }

};
