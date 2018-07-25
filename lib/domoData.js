var request = require('request');
var fs = require('fs');
var auth = require('./domoAuth.js');
var reqCallback = null;
var reqDataset = null;
var reqData = null;
var notifyObj = null;
var winston = require('winston');

var exports = module.exports = {};
exports.getData = function(dataset, callback) {
    reqCallback = callback;
    reqDataset = dataset;
    auth.getAuth(getCallback);
};

exports.setData = function(dataset, data, notifyObject, callback) {
    reqCallback = callback;
    reqDataset = dataset;
    reqData = data;
    notifyObj = notifyObject;
    auth.getAuth(setCallback);
};

function getCallback() {
    var dataUrl = 'https://api.domo.com/v1/datasets/' + reqDataset + '/data?includeHeader=true&fileName=data-dump.csv';
    var accessFile = './accessToken.txt';
    var bearerToken = fs.readFileSync(accessFile, 'utf8');
    var headerOptions = {
        'Authorization': 'bearer ' + bearerToken,
    };
    var options = {
        url: dataUrl,
        headers: headerOptions,
    };

    function respCallback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var domoData = body;
            domoData = domoData.replace(/\\+N/gi, '');
            var Converter = require('csvtojson').Converter;
            var converter = new Converter({trim: true});
            converter.fromString(domoData, function(err, result) {
                reqCallback(null, result);
            });
        } else {
            if (error) {
                winston.log('error', 'domoData respCallback: ' + error);
                reqCallback('domoData: ' + error, null);
            } else if (response.statusCode != 200) {
                winston.log('error', 'domoData respCallback: Error in Domo API response: http ' + JSON.stringify(response));
                reqCallback('domoData: Error in Domo API response: http ' + response.statusCode, null);
            }
        }
    }
    request(options, respCallback);
}

function setCallback() {
    var dataUrl = 'https://api.domo.com/v1/datasets/' + reqDataset + '/data';
    var accessFile = './accessToken.txt';
    var bearerToken = fs.readFileSync(accessFile, 'utf8');
    var headerOptions = {
        'Authorization': 'bearer ' + bearerToken,
        'content-type': 'text/csv',
    };
    var options = {
        method: 'PUT',
        url: dataUrl,
        headers: headerOptions,
    };
    var json2csv = require('json2csv');
    var fields = [];
    Object.keys(reqData[0]).forEach(function(prop) {
        fields.push(prop);
    });

    json2csv(
      {data: reqData, fields: fields, hasCSVColumnTitle: false},
      function(err, csv) {
        csv = csv.replace(/\\+N/gi, '');
        options.body = csv;
        request(options, respCallback);
      }
    );
    function respCallback(error, response, body) {
        if (!error && response.statusCode == 204) {
            var respObj = (notifyObj)?notifyObj:body;
            reqCallback(null, respObj);
        } else {
            if (error) {
                winston.log('error', 'domoData respCallback: ' + error);
                reqCallback('domoData: ' + error, null);
            } else if (response.statusCode != 204) {
                winston.log('error', 'domoData respCallback: Error in Domo API response: http ' + JSON.stringify(response));
                reqCallback('domoData: Error in Domo API response: http ' + response.statusCode, null);
            }
        }
    }
}
