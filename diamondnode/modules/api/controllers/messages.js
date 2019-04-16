/**
 * Created by lhp on 2019/3/8.
 */
"use strict";
const TransactionsModel = require('../../common/model').Transactions;
const config = require('../../../util/config');
const base64 = require('../../../util/base64Code');


/**
 * 根据hash查询交易信息
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.info = async (req, res, next) => {
    let data = req.data;
    if(!data.hash || data.hash =="") return next(new Error(`hash 字段不能为空！`));
    try {
        let result =  await getHash(data.hash)
        res.success(result)
    }catch (e) {
        return next(new Error(e.toString()));
    }




}

function  getHash(hash) {
    return new Promise(function (resolve, reject) {
        TransactionsModel.getHashResult(hash, (err, result) =>{
            if(err)  return reject(new Error(err),null);
            let obj = {
                eHash: result.eHash,
                hash: result.hash,
                id: result.id,
                isStable: result.isStable ? true : false,
                isValid: result.isValid ? true: false,
                lastIdx: result.lastIdx ? true :false,
                updateTime: result.creation_date
            }
            let message = {
                fromAddress: result.addressFrom,
                toAddress: result.addressTo,
                amount: (result.amount*config.INVEValue+result.amount_point).toString(),
                timestamp: result.timeStamp,
                remark: result.remark ? base64.decode(result.remark) : '',
                vers: result.vers,
                pubkey: result.pubkey,
                type: result.type,
                fee: result.fee*config.INVEValue+result.fee_point,
                nrgPrice: result.nrgPrice,
                signature: result.hash
            }
            obj.message = message;
            resolve(obj);
        });
    })

}

/**
 * 查询交易列表
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
exports.list = async (req, res, next) => {
    let data = req.data;
    let address = data.address;
    let tableIndex = data.tableIndex;
    let offset = data.offset;
    let obj ={
        address: address,
        page: Number(offset),
        pageSize: 10
    }
    TransactionsModel.getTransactionList(obj,async function (err, result) {
        let list = [];
        for(let i of result){
          let result1 = await getHash(i.hash);
            list.push(result1)
        }
        let data = {
            list : list,
            offset: (Number(offset)+result.length).toString(),
            tableIndex: "0"
        }
        res.success(data)
    })


}

