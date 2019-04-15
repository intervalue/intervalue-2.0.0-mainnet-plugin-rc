"use strict";
const TransactionsModel = require('../../common/model').Transactions;

/**
 * 发送交易后，交易记录存入数据库
 * @param req
 * @param res
 * @param next
 */
exports.add = async (req, res, next) =>{
        let data = req.data;
        let result = await TransactionsModel.insertTransactions(data);
        if(result) return next(new Error(result));
        res.success('');
}

/**
 * 查询交易列表
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.list = (req, res, next) => {
    let data = req.data;
    if(!data.address || data.address =="") return next(new Error(`address 字段不能为空！`));
    let obj ={
        address: data.address,
        page: data.page ? data.page : 1,
        pageSize: data.pageSize ? data.pageSize : 10
    }
    TransactionsModel.getTransactionList(obj ,(err, result) => {
        if(err)  return next(new Error(err));
        res.success(result);
    });

}

/**
 * 查询地址余额
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.balance = (req, res, next) =>{
    let data = req.data;
    if(!data.address || data.address =="") return next(new Error(`address 字段不能为空！`));
    TransactionsModel.getBalance(data.address ,(err, result) => {
        if(err)  return next(new Error(err));
        res.success(result);
    });
}
