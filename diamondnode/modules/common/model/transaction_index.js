"use strict";

/**
 * Created by lhp on 2016/3/25.
 */
const util = require('util');
const baseModel = require('./baseModel');
const sqlPromise = require('../../../util/commonSQLExec');

/*用户基本类型*/
function Transations_index() {
    this.table = 'transactions_index';
    baseModel.call(this);
    this.primary_key = 'id';
    this.insert_require = ['address', 'tableIndex', 'offset'];
    this.rules = [];
}
util.inherits(Transations_index, baseModel);


/**
 * 查询地址对应交易记录索引
 * @param address
 * @returns {Promise<string>}
 */
Transations_index.prototype.select = async (address) => {
    let sql ='SELECT tableIndex, offset from t_transactions_index where address=?';
    try{
        let result =  await  sqlPromise.promiseSqlWithParameters(sql, [address]);
        return result;
    }catch (e) {
        return e.toString();
    }
}

/**
 * 更新索引
 * @param address
 * @param tableIndex
 * @param offset
 * @returns {Promise<string>}
 */
Transations_index.prototype.update = async (address, tableIndex, offset) => {
    let sql ="update t_transactions_index set tableIndex=?,offset=? where address =?";
    try{
        let result =  await  sqlPromise.promiseSqlWithParameters(sql, [tableIndex, offset, address]);
        return result;
    }catch (e) {
        console.log('update index: ',e.toString())
        return e.toString();
    }
}

/**
 * 首次新增索引信息
 * @param address
 * @param tableIndex
 * @param offset
 * @returns {Promise<string>}
 */
Transations_index.prototype.add = async (address, tableIndex, offset) => {
    let sql ="insert into t_transactions_index (tableIndex, offset, address) values (?, ?, ?)";
    try{
        let result =  await  sqlPromise.promiseSqlWithParameters(sql, [tableIndex, offset, address]);
        return result;
    }catch (e) {
        return e.toString();
    }
}


module.exports = Transations_index;


