"use strict";
/**
 * Created by lhp on 2019/3/8.
 */
const Log4J = require('../util/logger/log');
const OtherLog = Log4J.getLogger("otherLog");
const EOL = require('os').EOL;

//全局变量
global.Mysql = require('./mysql');
global.Redis = require('./redis');
//
//
// //监听Redis启动事件
// Redis.on('ready', function () {
//     OtherLog.info(`Redis started at ${new Date().toLocaleString()}`);
// });
// Redis.on('error', function (err) {
//     OtherLog.error(`Redis Error occured: ${new Date().toLocaleString() + EOL + err.message + EOL + err.stack}`);
// });
