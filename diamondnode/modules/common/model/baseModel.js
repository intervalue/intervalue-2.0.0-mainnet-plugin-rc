"use strict";
/**
 * Created by walter on 2016/6/12.
 */
const util = require('util');
const _ = require('lodash');
const mysql = require('mysql');
//路径
const MySqlConfig = require('../../../db_server/mysql');
const logger = require('log4js');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const async = require('async');
const validator = require('validator');
const moment = require('moment');

let log_path = 'log/';

function Model() {
  var self = this;
  this.prefix = 't_';
  this.primary_key = '';
  this.fields = [];
  if (this.prefix) {
    this.table = this.prefix + this.table;
  }


  this.getFields(function (fields) {
    this.fields = fields;
    // console.log('======='+JSON.stringify(self.fields));
  }.bind(this), true);

  this.formatCondition = formatCondition;
  this.formatQuery = formatQuery;
  this.formatLikeQuery = formatLikeQuery;
  this.checkRequire = checkRequire;
  this.checkRule = checkRule;


}

/**
 * 对象转查询语句
 * @param {object|string} params
 * @returns {string}
 */
function formatQuery(params) {
  var map = [];
  var result = '';
  var sql = '';
  var join = '';
  var field = '';
  var queryParams = _.clone(params);

  if (_.isObject(queryParams)) {
    if (_.has(queryParams, 'join')) {
      join = _.join(queryParams['join'], ' ');

      queryParams['join'] = undefined;
    }
    if (_.has(queryParams, 'field')) {
      field = queryParams['field'];
      queryParams['field'] = undefined;
    }

    if (_.has(queryParams, '__string')) {
      if (_.isArray(queryParams['__string'])) {
        map = map.concat(queryParams['__string']);
      } else {
        map.push(queryParams['__string']);
      }
      queryParams['__string'] = undefined;
    }

    _.forEach(queryParams, function (value, key) {
      if (!_.isNil(value) && key) {
        if (_.isArray(value)) {
          map.push(mysql.escapeId(key) + ' ' + value[0] + ' ' + value[1]);
        } else {
          map.push(mysql.escapeId(key) + '=' + mysql.escape(value));
        }
      }
    });
    result = map.join(' AND ');
  } else if (_.isString(queryParams)) {
    result = _.trim(queryParams);
  }


  if (join) {
    sql = join;
  }
  if (result) {
    sql = sql + ' WHERE ' + result;
  }

  return sql;
}

/**
 * 对象转查询语句
 * @param {object|string} params
 * @returns {string}
 */
function formatLikeQuery(params) {
  var map = [];
  var result = '';
  var sql = '';
  var join = '';
  var field = '';
  var queryParams = _.clone(params);

  if (_.isObject(queryParams)) {
    if (_.has(queryParams, 'join')) {
      join = _.join(queryParams['join'], ' ');

      queryParams['join'] = undefined;
    }
    if (_.has(queryParams, 'field')) {
      field = queryParams['field'];
      queryParams['field'] = undefined;
    }

    if (_.has(queryParams, '__string')) {
      if (_.isArray(queryParams['__string'])) {
        map = map.concat(queryParams['__string']);
      } else {
        map.push(queryParams['__string']);
      }
      queryParams['__string'] = undefined;
    }

    _.forEach(queryParams, function (value, key) {
      if (!_.isNil(value) && key) {
        if (_.isArray(value)) {
          map.push(mysql.escapeId(key) + ' ' + value[0] + ' ' + value[1]);
        } else {
          map.push(mysql.escapeId(key) + ' ' + 'LIKE' + ' ' + mysql.escape("%" + value + "%"));
        }
      }
    });
    result = map.join(' OR ');
  } else if (_.isString(queryParams)) {
    result = _.trim(queryParams);
  }


  if (join) {
    sql = join;
  }
  if (result) {
    sql = sql + ' WHERE ' + result;
  }
  return sql;
}

/**
 * 对象转条件语句
 * @param {object} condition
 * @returns {string}
 */
function formatCondition(condition) {
  var map = [];
  var result = '';
  if (condition['group']) {
    map.push('GROUP BY ' + condition['group']);
  }
  if (!_.isEmpty(condition['having'])) {
    map.push('HAVING ' + _.join(condition['having'], " AND "));
  }
  if (condition['order']) {
    map.push('ORDER BY ' + condition['order']);
  }
  if (condition['limit']) {
    map.push('LIMIT ' + condition['limit']);
  }
  if (condition['lock']) {
    map.push('FOR UPDATE');
  }
  result = map.join(' ');
  return result;
}

/*从数据库获取字段信息*/
function getFieldsFromDB(callback) {
  var fields = [];
  var sql = util.format('SHOW COLUMNS FROM %s', mysql.escapeId(this.table));
  MySqlConfig.master.getConnection(function (err, connection) {
    if (err) throw err;

    connection.query(sql)
      .on('result', function (row) {
        fields.push({ name: row.Field, type: row.Type })
      })
      .on('end', function () {
        connection.release();

        callback(fields);
      })
  });
}

/*从文件缓存获取字段*/
function getFieldsFromCache(callback) {
  var fields = '';
  var src = path.join('modules/common/cache/mysql', this.table);
  fs.readFile(src, function (err, data) {
    if (!_.isEmpty(data)) {
      fields = JSON.parse(data);
    }
    callback(fields)
  });
}

/**
 *  获取表字段
 * @param {function} callback
 * @param {boolean} [fromDB]
 */
function getFields(callback, fromDB) {
  this.getFieldsFromCache(function (fields) {
    if (fields && !fromDB) {
      // console.log('from cache');
      return callback(fields);
    }
    this.getFieldsFromDB(function (fields) {
      // console.log(fields);
      if (fields) {
        // console.log('from db');
        cacheFields(fields, this.table);      //缓存数据至文件
      }
      callback(fields);
    }.bind(this))
  }.bind(this));
}

/*缓存字段信息到文件*/
function cacheFields(fields, table) {
  var src = path.join('modules/common/cache/mysql', table);
  async.waterfall([
    function (callback) {
      mkdirp(path.dirname(src), function (err) {
        callback(err);
      });
    },
    function (callback) {
      var write_stream = fs.createWriteStream(src);
      callback(null, write_stream)
    }
  ], function (err, write_stream) {
    write_stream.end(JSON.stringify(fields));
  });
}
/**
 * 创建新增数据--过滤多余数据
 * @param {object} input
 * @returns {object} data
 */
function formatData(input) {
  var data = {};
  _.forEach(this.fields, function (field) {
    if (_.has(input, field.name)) {
      data[field.name] = input[field.name];
    }
  });
  return data;
}

/**
 * 检查插入时必须字段
 * @param data
 * @returns {boolean}
 */
function checkRequire(data) {

  var require = '';
  if (_.isEmpty(this.insert_require)) {
    return true;
  }
  _.forEach(this.insert_require, function (value) {
    if (!_.has(data, value) || _.isNil(data[value]) || data[value].length == 0) {
      require = value;
      return false;
    }
  });
  if (require) {
    throw new Error(require + ' 必须');
  }
}

/**
 * 检查字段规则
 * @param data
 * @returns {boolean}
 */
function checkRule(data) {
  var fails = '';
  if (_.isEmpty(this.rules)) {
    return true;
  }
  _.forEach(this.rules, function (rule) {
    if (_.has(data, rule.key)) {
      var value = data[rule.key];
      if (!value) {
        return true;
      }
      var result = validator[rule.function].call(null, value, rule.arg);
      if (!result) {
        fails = rule.msg;
      }
      return result;
    }
  });
  if (fails) {
    throw new Error(fails);
  }
  return true;
}

/**
 * 更新数据检测
 * @param data
 */
function formatUpdate(data) {
  var update = [];
  _.forEach(data, function (value, key) {
    if (_.isArray(value)) {
      update.push(key + "=" + _.join(value, ' '));
      delete data[key];
    }
  });
  return _.join(update, ',');
}

/************************原型******************************************/

Model.prototype.getFieldsFromDB = getFieldsFromDB;
Model.prototype.getFields = getFields;
Model.prototype.getFieldsFromCache = getFieldsFromCache;
Model.prototype.formatData = formatData;
Model.prototype.checkRequire = checkRequire;
Model.prototype.checkRule = checkRule;

/**
 * 统计数量
 * @param {object} queryParams
 * @param {object} [condition]
 * @param {function} callback
 */
Model.prototype.count = function (queryParams) {

  var field = '*';
  if (queryParams['field']) {
    field = queryParams['field'];
  }
  var query_str = this.formatQuery(queryParams);
  var condition = '';
  var callback = function () { };
  if (!_.isFunction(arguments[1])) {
    condition = this.formatCondition(arguments[1]);
    callback = arguments[2];
  } else {
    callback = arguments[1];
  }
  var sql = util.format('SELECT COUNT(*) FROM %s %s ', mysql.escapeId(this.table), query_str) + condition;
  var count = 0;

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, function (err, rows, fields) {

      if (err) {
        callback(err);
      }
      else {
        count = rows[0]['COUNT(*)'];
        callback(null, count);
      }

    });

    connection.release();
  });
};

/**
 * 
 * @param {object} queryParams
 * @param {object} [condition]
 * @param {function} callback
 * @returns {array}
 */
Model.prototype.select = function (queryParams) {
  var field = '*';
  if (queryParams['field']) {
    field = queryParams['field'];
    if (_.isArray(field)) {
      field = _.join(field, ",");
    }
  }
  var query_str = this.formatQuery(queryParams);
  var condition = '';
  var callback = function () { };
  if (!_.isFunction(arguments[1])) {
    condition = this.formatCondition(arguments[1]);
    callback = arguments[2];
  } else {
    callback = arguments[1];
  }
  var sql = util.format('SELECT %s FROM %s %s ', field, mysql.escapeId(this.table), query_str) + condition;
  
  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, function (err, rows, fields) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, rows);
      }
    });

    connection.release();
  });
};


/**
 * 
 * @param {object} queryParams
 * @param {object} [condition]
 * @param {function} callback
 * @returns {array}
 */
Model.prototype.like_select = function (queryParams) {
  var field = '*';
  if (queryParams['field']) {
    field = queryParams['field'];
    if (_.isArray(field)) {
      field = _.join(field, ",");
    }
  }
  var query_str = this.formatLikeQuery(queryParams);
  var condition = '';
  var callback = function () { };
  if (!_.isFunction(arguments[1])) {
    condition = this.formatCondition(arguments[1]);
    callback = arguments[2];
  } else {
    callback = arguments[1];
  }
  var sql = util.format('SELECT %s FROM %s %s ', field, mysql.escapeId(this.table), query_str) + condition;

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, function (err, rows, fields) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, rows);
      }
    });

    connection.release();
  });
};



/**
 * 
 * @param queryParams
 * @param [condition]
 * @returns {object}
 */
Model.prototype.find = function (queryParams) {
  var field = '*';
  if (queryParams['field']) {
    field = queryParams['field'];
  }
  var query_str = this.formatQuery(queryParams);
  var condition = '';
  var callback = function () { };
  var limit = { limit: '1' };
  if (!_.isFunction(arguments[1])) {
    condition = this.formatCondition(_.merge(arguments[1], limit));
    callback = arguments[2];
  } else {
    condition = this.formatCondition(limit);
    callback = arguments[1];
  }
  var sql = util.format('SELECT %s FROM %s %s ', field, mysql.escapeId(this.table), query_str) + condition;

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, function (err, rows, fields) {

      if (err) {
        callback(err);
      }
      else {
        let data = {};
        if (!_.isEmpty(rows)) {
          data = rows[0];
        }
        callback(null, data);
      }
    });

    connection.release();
  });
};

/**
 * 
 * @param connection
 * @param queryParams
 */
Model.prototype.find2 = function (connection, queryParams) {
  var field = '*';
  if (queryParams['field']) {
    field = queryParams['field'];
  }
  var query_str = this.formatQuery(queryParams);
  var condition = '';
  var callback = function () { };
  var limit = { limit: '1' };
  if (!_.isFunction(arguments[2])) {
    condition = this.formatCondition(_.merge(arguments[2], limit));
    callback = arguments[3];
  } else {
    condition = this.formatCondition(limit);
    callback = arguments[2];
  }
  var sql = util.format('SELECT %s FROM %s %s ', field, mysql.escapeId(this.table), query_str) + condition;

  var data = {};
  connection.query(sql, function (err, rows, fields) {
    if (err) return callback(err);

    if (!_.isEmpty(rows)) {
      data = rows[0];
    }
    callback(null, data);
  })
};

Model.prototype.delete = function (queryParams, callback) {
  var query_str = this.formatQuery(queryParams);
  var sql = util.format('DELETE FROM %s %s ', mysql.escapeId(this.table), query_str);
  var affectedRows = 0;

  fs.appendFileSync(log_path + 'sql-' + moment().format("MM-DD") + '.log', moment().format("MM-DD H:m:s") + "  " + sql + "\n");

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, function (err, result) {
      if (err) {
        callback(err);
      }
      else {
        affectedRows = result.affectedRows;
        callback(null, affectedRows);
      }
    });

    connection.release();

  });
};

Model.prototype.delete2 = function (connection, queryParams, callback) {
  var query_str = this.formatQuery(queryParams);
  var sql = util.format('DELETE FROM %s %s ', mysql.escapeId(this.table), query_str);
  var affectedRows = 0;

  fs.appendFileSync(log_path + 'sql-' + moment().format("MM-DD") + '.log', moment().format("MM-DD H:m:s") + "  " + sql + "\n");

  connection.query(sql, function (err, result) {
    if (err) return callback(err);

    affectedRows = result.affectedRows;
    callback(null, affectedRows);
  });
};

Model.prototype.getById = function (id, callback) {
  var sql = util.format('SELECT * FROM %s WHERE %s=%d', mysql.escapeId(this.table), mysql.escapeId(this.primary_key), mysql.escape(id | 0));

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, function (err, rows, fields) {

      if (err) {
        callback(err);
      }
      else {
        let data = {};
        if (!_.isEmpty(rows)) {
          data = rows[0];
        }
        callback(null, data);
      }
    });

    connection.release();
  });
};

Model.prototype.delById = function (id, callback) {

  var sql = util.format('DELETE FROM %s WHERE %s=%d', mysql.escapeId(this.table), mysql.escapeId(this.primary_key), mysql.escape(id));
  var affectedRows = 0;

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, function (err, result) {

      if (err) {
        callback(err);
      }
      else {
        affectedRows = result.affectedRows;
        callback(null, affectedRows);
      }
    });

    connection.release();
  });
};

Model.prototype.update = function (queryParams, data, callback) {
  data = this.formatData(data);
  var query_str = this.formatQuery(queryParams);
  var other_data = formatUpdate(data);
  if (other_data && !_.isEmpty(data)) {
    other_data += ', ?';
  } else {
    other_data += '?'
  }
  var sql = util.format('UPDATE %s SET %s  ', mysql.escapeId(this.table), other_data) + query_str;
  var status = 0;

  fs.appendFileSync(log_path + 'sql-' + moment().format("MM-DD") + '.log', moment().format("MM-DD H:m:s") + "  " + sql + "  " + JSON.stringify(data) + "\n");

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, data, function (err, result) {

      if (err) {
        callback(err);
      }
      else {
        if (!result.affectedRows) {         //受影响的行数
          status = false;
        } else {
          status = result.changedRows;
        }
        callback(null, status);
      }
    });

    connection.release();

  });
};


Model.prototype.update2 = function (connection, queryParams, data, callback) {

  data = this.formatData(data);

  var query_str = this.formatQuery(queryParams);
  var other_data = formatUpdate(data);
  if (other_data && !_.isEmpty(data)) {
    other_data += ', ?';
  } else if (!_.isEmpty(data)) {
    other_data += '?'
  } else {

  }
  var sql = util.format('UPDATE %s SET %s  ', mysql.escapeId(this.table), other_data) + query_str;
  var status = 0;

  fs.appendFileSync(log_path + 'sql-' + moment().format("MM-DD") + '.log', moment().format("MM-DD H:m:s") + "  " + sql + "  " + JSON.stringify(data) + "\n");

  connection.query(sql, data, function (err, result) {
    if (err) {
      return callback(err);
    }

    if (!result.affectedRows) {         //受影响的行数
      status = false;
    } else {
      status = result.changedRows;
    }

    callback(null, status);
  })
};

/**
 * 新增数据
 * @param {object} data
 * @param {function} callback
 */
Model.prototype.add = function (data, callback) {
  data = this.formatData(data);
  var sql = util.format('INSERT INTO %s SET ?', mysql.escapeId(this.table));
  var insertId = 0;
  fs.appendFileSync(log_path + 'sql-' + moment().format("MM-DD") + '.log', moment().format("MM-DD H:m:s") + "  " + sql + "  " + JSON.stringify(data) + "\n");

  MySqlConfig.master.getConnection(function (err, connection) {

    if (err) {
      return callback(err);
    }

    connection.query(sql, data, function (err, result) {

      if (err) {
        callback(err);
      }
      else {
        insertId = result.insertId;
        callback(null, insertId);
      }
    });

    connection.release();
  });
};

/**
 * 不自动生成Connection
 * @param connection
 * @param data
 * @param callback
 */
Model.prototype.add2 = function (connection, data, callback) {
  data = this.formatData(data);
  var sql = util.format('INSERT INTO %s SET ?', mysql.escapeId(this.table));
  var insertId = 0;

  fs.appendFileSync(log_path + 'sql-' + moment().format("MM-DD") + '.log', moment().format("MM-DD H:m:s") + "  " + sql + "  " + JSON.stringify(data) + "\n");

  connection.query(sql, data, function (err, result) {
    if (err) return callback(err);

    insertId = result.insertId;
    callback(null, insertId);
  })
};

module.exports = Model;