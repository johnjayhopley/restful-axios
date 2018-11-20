/**
 * Restful
 * @version 1.0.0
 * @dependacies
 *   - axios
 *   - @jhopley/funkit/src/object/assignDeep
 * @author John Hopley <john.hopley@readingroom.com>
 */
import axios from 'axios';
import assignDeep from 'funckit/src/object/assignDeep';
import httpStatusMap from './http-status-map.js';

const hasOwnProperty = (object, prop) => Object.prototype.hasOwnProperty.call(
  object,
  prop,
);

export default class Restful {

  /**
   * @constructor
   * @param {Object} config
   * @param {Object} options
   * @return {Void}
   * @description
   *  - Config sets the general axios options so any specific
   *    additional axios configuration should be passed through.
   *    This is the global configuration so anything applied here
   *    will apply to all model endpoints.
   *  - Options are intended for Restful module options.
   *  - Options.cleanAxiosResponse keep/remove request
   *    information returned from axios promises.
   */
  constructor(config, options = {}) {
    this.config = assignDeep({
      headers: {
        Accept: 'application/json',
      },
    }, config);

    this.api = {
      options: Object.assign({
        cleanAxiosResponse: true,
      }, options),
    };

    this.axios = axios;
  }

  /**
   * @description returns request method to the api object.
   * @return {Function}
   */
  dispatchRequestMethod() {
    return this.request;
  }

  /**
   * @param {Object} params
   * @return {Promise}
   * @description
   *  - Promise initialtes axios promise.
   *  - The axios request will be based on it's parents (model) properties.
   */
  request(params = {}) {
    return new Promise((resolve) => {
      axios(assignDeep(this.model, { params })).then((response) => {
        let returnResponse = Object.assign(
          response,
          Restful.responseWrapper(response),
        );

        if (this.options.cleanAxiosResponse) {
          returnResponse = {
            data: returnResponse.data,
            status: returnResponse.status,
          };
        }
        if (this.model.transform !== undefined && typeof this.model.transform === 'function') {
          returnResponse = assignDeep(
            returnResponse,
            { data: this.model.transform(returnResponse.data) },
          );
        }

        resolve(returnResponse);
      }).catch((error) => {
        throw new Error(error);
      });
    });
  }

  /**
   * @static
   * @param {Object} response
   * @return {Object}
   * @description transforms axios response to
   * inlcude restful status descriptions and flags.
   */
  static responseWrapper(response) {
    return {
      status: {
        code: response.status,
        definition: httpStatusMap[response.status],
        isOk: response.status === 200,
        isCreated: response.status === 201,
        isBadRequest: response.status === 400,
        isForbidden: response.status === 403,
        isNotFound: response.status === 404,
        isServerError: response.status === 500,
      },
    };
  }

  /**
   * @param {String} endpointUrl
   * @return {String}
   * @description constructs url from base url and model
   * endpoint values.
   */
  mapUrl(endpointUrl) {
    if (!hasOwnProperty(this.config, 'baseUrl')) {
      return endpointUrl;
    }

    return `${this.config.baseUrl}${endpointUrl}`;
  }

  /**
   * @param {Object} model
   * @return {Void}
   * @description
   *  - Creates model namespace in this.api.
   *  - Iterates through model enpoints and appends
   *    them into the a model namespace and attaches the
   *    request method to each accordingly.
   */
  addModel(model) {
    if (typeof model !== 'object') {
      throw new Error('Model object has not been provided');
    }

    if (!Object.prototype.hasOwnProperty.call(model, 'name')) {
      throw new Error('Model name missing, you will have to provide a model namespace to include your endpoints.');
    }

    this.api[model.name] = {};
    const returnModel = model;

    Object.entries(returnModel.endpoints).forEach((endpoint) => {
      returnModel.endpoints[endpoint[0]].url = this.mapUrl(returnModel.endpoints[endpoint[0]].url);

      this.api[returnModel.name][endpoint[0]] = {
        model: assignDeep(returnModel.endpoints[endpoint[0]], this.config),
        options: this.api.options,
        request: this.dispatchRequestMethod(),
      };
    });
  }
}

