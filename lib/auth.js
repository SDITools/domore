var request = require('request');
const logger = require('../server/log');
var fs = require('fs');
var url = require('url');
var CONF = require('../config/' + process.env.NODE_ENV + '/conf');

var reqCallback = null;

const authEndpoint = 'https://api.domo.com/oauth/token';
const scopes = ['data', 'user'];
const grantType = 'client_credentials';

var exports = module.exports = {};
exports.getAuth = function(callback) {
    reqCallback = callback;

    var authUrl = new url.URL(authEndpoint);
    authUrl.searchParams.append('grant_type', grantType);
    authUrl.searchParams.append('scope', scopes.join(' '));

    var encodedHeader = encodeHeader();
    var headerOptions = {
        'Authorization': 'Basic ' + encodedHeader,
        'Accept': 'application/json'
    };
    var options = {
        url: authUrl.toString(),
        headers: headerOptions,
    };
    request(options, authCallback);
};

function encodeHeader() {
    var clientString = CONF.domoApiAuth.clientId + ':' + CONF.domoApiAuth.clientSecret;
    var encodedString = new Buffer(clientString).toString('base64');
    return encodedString;
}

function authCallback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var jsonResponse = JSON.parse(body);
        var accessToken = jsonResponse.access_token;
        fs.writeFileSync('accessToken.txt', accessToken);
        if (reqCallback) {
            reqCallback();
        }
    } else {
        logger.error(response);
    }
}
