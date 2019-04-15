"use strict";
const express = require('express');
const _ = require('lodash');
const router = express.Router();
const transactionsController = require('../controllers/transactions');

_.forEach(transactionsController, function (action, name) {
    router.post('/' + name, action);
});


module.exports = router;