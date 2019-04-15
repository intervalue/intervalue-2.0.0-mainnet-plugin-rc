"use strict";
const express = require('express');
const _ = require('lodash');
const router = express.Router();
const messagesController = require('../controllers/messages');

_.forEach(messagesController, function (action, name) {
    router.post('/' + name, action);
});


module.exports = router;