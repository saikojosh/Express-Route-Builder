'use strict';

/*
 * EXPRESS ROUTE BUILDER
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
];

module.exports = class ExpressRouteBuilder {

  /*
   * Initialise the builder.
   */
  constructor (_express, _app, _baseDir) {

    this.express = _express;
    this.app = _app;
    this.baseDir = _baseDir || process.cwd();

  }

  /*
   * Adds a route ready for compiling.
   */
  addRoute (path, filename, _middleware) {

    const middleware = (Array.isArray(_middleware || []) ? _middleware : [_middleware]);
    let fullPath;
    let module;

    // Check we don't already have a route for this path.
    if (this.routes.find(element => element.path === path)) {
      throw new Error(`A route already exists for "${path}".`);
    }

    // Attempt to load in the module.
    try {
      fullPath = pathify(this.baseDir, filename);
      module = require(fullPath);
    } catch (err) {
      throw new Error(`Unable to load module "${fullPath}" (${err.code || err.name}).`);
    }

    // Create a new router instance.
    const router = this.express.Router();
    const route = router.route(path);

    // Add middleware, if any.
    for (let m = 0, mlen = middleware.length; m < mlen; m++) {
      const middlewareFn = middleware[m];

      if (typeof middlewareFn !== 'function') {
        throw new Error(`Middleware for path "${path}" at index ${m} should be a function and not "${typeof middlewareFn}"!`);
      }

      router.use(middlewareFn);
    }

    // Apply the module's handler functions that are present for any of the supported HTTP methods.
    for (let v = 0, vlen = httpMethods.length; v < vlen; v++) {
      const httpMethod = httpMethods[v];
      const handler = module[httpMethod];

      if (typeof handler !== 'function') { continue; }

      route[httpMethod](handler);
    }

    // Finally, mount the route.
    this.app.use(path, router);

    return this;

  }

};
