var CONF = require('../config/' + process.env.NODE_ENV + '/conf');

const {DomoClient} = require('domo-sdk');
const {API_SCOPE, UPDATE_METHODS} = require('domo-sdk/dist/common/Constants');
const clientId = CONF.domoApiAuth.clientId;
const clientSecret = CONF.domoApiAuth.clientSecret;
const moment = require('moment');
const host = 'api.domo.com';
const scopes = [API_SCOPE.DATA];

const domo = new DomoClient(clientId, clientSecret, scopes, host);

var exports = module.exports = {};

exports.startStream = startStream;

exports.addStreamPart = addStreamPart;

exports.endStreamExecution = endStreamExecution;

exports.abortStreamExecution = abortStreamExecution;

function startStream(config) {
    var conf = {
        dataSet: {
          name: config.name+'_'+moment().format('YYYY-MM-DD'),
          description: 'Dataset from stream data connector',
          schema: {
            columns: config.model,
          },
        },
        updateMethod: UPDATE_METHODS[UPDATE_METHODS.REPLACE],
      };
    var startObj = {method: 'create', param: conf};
    if(config.streamId && config.streamId !== null) {
        startObj = {method: 'get', param: config.streamId};
    }
    if(config.append) {
        conf.updateMethod = UPDATE_METHODS[UPDATE_METHODS.APPEND];
    }

    return domo.streams[startObj.method](startObj.param)
    .then((res) => {
        logger.info('\nNew Stream: ', res.id, res.dataSet.id);
        if(res.deleted) {
            return domo.streams.create(conf)
            .then(function(re) {
                config.streamId = re.id;
                config.dataSetId = res.dataSet.id;
                return startStreamExecution(re);
            });
        } else {
            config.streamId = res.id;
            config.dataSetId = res.dataSet.id;
            return startStreamExecution(res);
        }
    })
    .catch(function(err) {
        return domo.streams.create(conf)
        .then(function(re) {
            config.streamId = re.id;
            return startStreamExecution(re);
        })
        .catch(function(err) {
            return Promise.reject(err);
        });
    });
}

function startStreamExecution(res) {
    return domo.streams.createExecution(res.id).then((rs) => {
        return {streamId: res.id, execId: rs.id};
    })
    .catch(function(err) {
        return Promise.reject(err);
    });
}

function addStreamPart(obj) {
    // obj.body = 'test,another test,something else\n';
    return domo.streams.uploadPart(obj.streamId, obj.execId, obj.partId, obj.body)
    .catch(function(err) {
        return Promise.reject(err);
    });
}

function endStreamExecution(obj) {
    return domo.streams.commit(obj.streamId, obj.streamExe.execId)
    .catch(function(err) {
        return Promise.reject(err);
    });
}

function abortStreamExecution(obj) {
    return domo.streams.abort(obj.streamId, obj.streamExe.execId);
}
