"use strict";
const express = require('express');
const api = express();

const transactions = require('./routes/transactions');

const messages = require('./routes/messages');
const processForReqAndResp = require('../common/middlewares/helper');
const autoLoggerProcess = require('../common/middlewares/autoLogger');

api.use(processForReqAndResp, autoLoggerProcess);
api.use('/transactions', transactions);
api.use('/message', messages);
api.on('mount', function (parent) {
    console.log("Api Module is mounted at " + api.mountpath);
});

module.exports = api;