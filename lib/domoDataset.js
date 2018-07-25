var CONF = require('../config/' + process.env.NODE_ENV + '/conf');

const {DomoClient} = require('domo-sdk');
const {API_SCOPE} = require('domo-sdk/dist/common/Constants');
const clientId = CONF.domoApiAuth.clientId;
const clientSecret = CONF.domoApiAuth.clientSecret;
const host = 'api.domo.com';
const scopes = [API_SCOPE.DATA];
const logger = require('../server/log');

const domo = new DomoClient(clientId, clientSecret, scopes, host);

var exports = module.exports = {};

exports.updateDataset = updateDataset;
exports.createDataset = createDataset;
exports.exportJson = exportJson;
exports.importJson = importJson;
exports.importCsv = importCsv;
exports.getDataset = getDataset;
exports.getOrCreateDataset = getOrCreateDataset;


function updateDataset(config) {
    var dataSet = {
          name: config.name,
          description: config.description,
          schema: {
            columns: config.model,
          },
        };

    return domo.datasets.update(config.dataSetId, dataSet)
    .then((res) => {
        return config;
    })
    .catch(function(err) {
      logger.warn(err);
      return Promise.reject(err);
    });
}

function createDataset(dataset) {
  return domo.datasets.create(dataset)
  .then((res) => {
      return res.id;
  })
  .catch(function(err) {
    logger.warn(err);
    return Promise.reject(err);
  });
}

function getDataset(datasetId) {
  return domo.datasets.get(datasetId)
  .catch(function(err) {
    logger.warn(err);
    return Promise.reject(err);
  });
}

function getOrCreateDataset(dataset, datasetId) {
  if(datasetId) {
    return domo.datasets.get(datasetId)
    .catch(function(err) {
      logger.warn(err);
      return createDataset(dataset);
    });
  } else {
    return createDataset(dataset);
  }
}

function importCsv(datasetID, csv) {
  return domo.datasets.importData(datasetID, csv)
  .then((res) => {
      return res.id;
  })
  .catch(function(err) {
    logger.warn(err);
    return Promise.reject(err);
  });
}

function importJson(datasetID, json) {
  var json2csv = require('json2csv');
  var fields = [];
  Object.keys(reqData[0]).forEach(function(prop) {
      fields.push(prop);
  });
  return new Promise((res, rej) => {
    json2csv(
      {data: json, fields: fields, hasCSVColumnTitle: false},
      function(err, csv) {
        csv = csv.replace(/\\+N/gi, '');
        if(err) {
          rej(err);
        } else {
          res(csv);
        }
      }
    );
  })
  .then((resp) => {
    return importCsv(datasetID, resp);
  })
  .catch(function(err) {
    logger.warn(err);
    return Promise.reject(err);
  });
}

function exportCsv(datasetID, csv) {
  return domo.datasets.exportData(datasetID, true)
  .catch(function(err) {
    logger.warn(err);
    return Promise.reject(err);
  });
}

function exportJson(datasetID, csv) {
  return exportCsv(datasetID, csv)
  .then((resp) => {
    var domoData = resp.replace(/\\+N/gi, '');
    var Converter = require('csvtojson').Converter;
    var converter = new Converter({trim: true});
    return new Promise((res, rej) => {
      converter.fromString(domoData, function(err, result) {
          if(err) {
            rej(err);
          } else {
            res(result);
          }
      });
    });
  })
  .catch(function(err) {
    logger.warn(err);
    return Promise.reject(err);
  });
}
