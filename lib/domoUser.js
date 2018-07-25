var CONF = require('../config/' + process.env.NODE_ENV + '/conf');

const {DomoClient} = require('domo-sdk');
const {API_SCOPE} = require('domo-sdk/dist/common/Constants');
const clientId = CONF.domoApiAuth.clientId;
const clientSecret = CONF.domoApiAuth.clientSecret;
const host = 'api.domo.com';
const scopes = [API_SCOPE.USER];
const logger = require('../server/log');

const domo = new DomoClient(clientId, clientSecret, scopes, host);

module.exports = {
  getUser: async function(userId) {
    return domo.users.get(userId)
    .catch( (err) => {
      logger.warn(err);
      return Promise.reject(err);
    });
  },

  getAllUsers: async function(limit = 500, offset = 0) {
    let userList = await domo.users.list(limit, offset);
    if(userList.length === limit) {
      // Get the next page of users
      let nextPageUsers = await getAllUsers(limit, limit + offset);
      return userList.concat(nextPageUsers);
    } else {
      // We're on the last page
      return userList;
    }
  }
};
