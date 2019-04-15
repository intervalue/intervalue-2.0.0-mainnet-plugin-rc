"use strict";

/**
 * Created by lhp on 2018/4/2.
 */
const util = require('util');

const baseModel = require('./baseModel');
const sqlPromise = require('../../../util/commonSQLExec');

/*用户基本类型*/
function Accounts_messages() {
    this.table = 'accounts_messages';
    baseModel.call(this);
    this.primary_key = 'creation_date_day';
    this.insert_require = ['messageTotal', 'accountsTotal', 'creation_date'];
    this.rules = ['address'];
}
util.inherits(Accounts_messages, baseModel);


/**
 * 统计地址、消息数量
 * @returns {Promise<{messageTotal: Array, accountsTotal: Array}>}
 */
Accounts_messages.prototype.selectAll = async () => {
    let sql ="select * from t_accounts_messages ORDER BY creation_date_day";
    let res = await sqlPromise.promiseSql(sql);
    if(res && res.length >0){
        return format(res);
    }

}

function format(opts) {
    let messageTotal =[];
    let accountsTotal = [];
    for(let i of opts){
        messageTotal.push(i.messageTotal);
        accountsTotal.push(i.accountsTotal);
    }
    let obj ={
        messageTotal: messageTotal,
        accountsTotal: accountsTotal
    }
    return obj;
}


module.exports = Accounts_messages;


