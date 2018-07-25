const {DomoClient} = require('domo-sdk');
const DomoConstants = require('domo-sdk/dist/common/Constants');

class DomoreClient {
  constructor(clientId, clientSecret, scopes, host = 'api.domo.com') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.host = host;

    this.domoClient = new DomoClient(clientId, clientSecret, scopes, host);
  }

  get domo() {
    return this.domoClient;
  }
}

module.exports = DomoreClient;