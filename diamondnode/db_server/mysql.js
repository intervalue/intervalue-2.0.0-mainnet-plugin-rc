"use strict";
/**
 * Created by lhp on 2019/3/8.
 */
const mysql = require('mysql');
const config = require('./config');

const poolCluster = mysql.createPoolCluster({
  'canRetry': true,
  'removeNodeErrorCount': 2,
  'restoreNodeTimeout': 5 * 60 * 1000
});
poolCluster.add('MASTER', config.mysql_master);

poolCluster.on('remove', function (nodeId) {
  console.log('Mysql Removed node : ' + nodeId);
});
const master = poolCluster.of('MASTER');

exports.master = master;