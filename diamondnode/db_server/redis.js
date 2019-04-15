/**
 * Created by lhp on 2019/3/8.
 */

"use strict";

const config = require('./config');
const redis = require('redis');

module.exports = redis.createClient(config.redis);