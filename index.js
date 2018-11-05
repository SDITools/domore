const {DomoClient} = require('domo-sdk');
const DomoConstants = require('domo-sdk/dist/common/Constants');
const User = require('./lib/user');
const Dataset = require('./lib/dataset');

class DomoreClient {
  constructor(clientId, clientSecret, scopes, host = 'api.domo.com') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.host = host;

    this.domoClient = new DomoClient(clientId, clientSecret, scopes, host);
    this.user = new User(this.domoClient);
    this.dataset = new Dataset(this.domoClient);
  }

  get domo() {
    return this.domoClient;
  }

  get users() {
    return this.user;
  }

  get datasets() {
    return this.dataset;
  }
}

module.exports = DomoreClient;