"use strict";

/**
 * Created by lhp on 2016/3/25.
 */
const util = require('util');
const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');
let log_path = process.cwd()+'/log/';
let error_log = log_path +'errors/error_' + moment().format("YYYY_MM_DD")+'/error-' + moment().format("YYYY_MM_DD_HH") + '.log';
const baseModel = require('./baseModel');
const webHelper = require('../../../util/webhelper');
const common = require('../../../util/common');
const Transaction_index = require('./transaction_index');
const sqlPromise = require('../../../util/commonSQLExec');
const Bignumber = require('bignumber.js');
const redis = require('../../../util/common')
var Transaction_indexModel = new Transaction_index();
const config = require('../../../util/config')
const Accounts_messages = require('../../common/model').Accounts_messages;
//fs.appendFileSync(log_path + 'sql-' + moment().format("MM-DD") + '.log', moment().format("MM-DD H:m:s") + "  " + sql + "\n");

let tranList = [];
/*用户基本类型*/
function Transations() {
    this.table = 'transactions_0';
    baseModel.call(this);
    this.primary_key = 'hash';
    this.insert_require = ['amount', 'fee', 'addressFrom', 'addressTo', 'result', 'remark','amount_point', 'fee_point', 'creation_date','type'];
    this.rules = [];
}
util.inherits(Transations, baseModel);

/**
 * 本地发起交易成功后
 * @param opts
 * @returns {Promise<*>}
 */
Transations.prototype.insertTransactions = async function(opts) {
    try{
        let data = opts;
        let amountt = data.amount;
        let amount = parseInt(amountt.replace(/"/g,'').substring(-1,amountt.length-18) ? amountt.replace(/"/g,'').substring(-1,amountt.length-18) : 0);
        let amountPoint = parseInt(amountt.replace(/"/g,'').substring(amountt.length-18,amountt.length) ? amountt.replace(/"/g,'').substring(amountt.length-18,amountt.length) : 0) ;

        let fee = data.fee*data.nrgPrice+"";
        let feeInt = parseInt(fee.replace(/"/g,'').substring(-1,fee.length-18) ? fee.replace(/"/g,'').substring(-1,fee.length-18) : 0);
        let feePoint = parseInt(fee.replace(/"/g,'').substring(fee.length-18,fee.length) ? fee.replace(/"/g,'').substring(fee.length-18,fee.length) : 0);

        let sql = "INSERT INTO t_transactions_0 (hash,creation_date,amount,fee,addressFrom,addressTo,result,remark,amount_point,fee_point,type,nrgPrice) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";

        let values = [data.signature, data.timestamp, amount, feeInt, data.fromAddress, data.toAddress, "pending",data.note, amountPoint, feePoint,1 , data.nrgPrice]

        let a = await  sqlPromise.promiseSqlWithParameters(sql, values);
        refreshTranList(data.signature,'pending');
        return null;

    }catch (e) {
        console.log(e.toString())
        return e.toString();
    }


}

/**
 * 根据hash更新本地交易
 */
Transations.prototype.updateHashTransactions = async () => {
    let res = await getPendingTransactions();
    if(res){
        _.forEach(res,async function (i) {
           let result =  await getHashResult(i.hash);
           //console.log(`${JSON.stringify(result)}`)
            if(result && result.isStable){
                let flag = result.isValid ? 'good':'final-bad';
                let sql ="update t_transactions_0 set result = ? where hash = ?";
                sqlPromise.promiseSqlWithParameters(sql,[flag, i.hash])
                refreshTranList(i.hash,getResultFromTran(flag))
            }
        })
    }
}


/**
 * 根据hash查询
 * @param hash
 * @param cb
 * @returns {Promise<*>}
 */
Transations.prototype.getHashResult = async (hash,cb) =>{
    try{
        let sql ="select * from t_transactions_0 where hash = ?";
        let res = await sqlPromise.promiseSqlWithParameters(sql,[hash])
        if(res.length == 1){
            cb(null,res[0])
        }else {
            cb(null, '')
        }
    }catch (e) {
        console.log('getHashResult: ',e.toString());
       // return null;
        cb(e.toString())
    }
}


/**
 * 根据hash查询
 * @param hash
 * @param cb
 * @returns {Promise<*>}
 */
async function getHashResult (hash){
    try{
        let pubkey ='AoulFnsMkNo1HFZHTQ1SzWwgFVlwVHF39O17FBDs8vIj';
        let localfullnode = await common.getLocalfullnode(pubkey);
        if(!localfullnode) return cb(e.toString());
        let result = JSON.parse(await webHelper.httpPost(getUrl(localfullnode, '/v1/gettransaction'), null, buildData({hash})));
        //console.log(result)
        if(result.code == 200 && result.data != ''){
            return JSON.parse(result.data);
        }
    }catch (e) {
        console.log('getHashResult: ',e.toString());
        // return null;
        return e.toString()
    }
}


/**
 * 调用共识网接口查询TPs
 * @returns {Promise<*>}
 */
Transations.prototype.getMessageInfo = async () =>{
    try{
        let pubkey ='AoulFnsMkNo1HFZHTQ1SzWwgFVlwVHF39O17FBDs8vIj';
        let localfullnode = await common.getLocalfullnode(pubkey);
        if(!localfullnode) return null;
        let result = JSON.parse(await webHelper.httpPost(getUrl(localfullnode, '/v1/getmessageInfo'), null, {}));
        //console.log(result)
        if(result.code == 200 && result.data != ''){
            return JSON.parse(result.data);
        }
    }catch (e) {
        console.log('getHashResult: ',e.toString());
        return null;
    }
}

/**
 * 更新所有交易记录
 * @param pubkey
 * @returns {Promise<void>}
 */
let init = false;
let dbsize = 0;
Transations.prototype.updateAllTransactionHistory = async (pubkey) =>{
    if(!dbsize) dbsize = await common.dbsizeRedis();
    if(!init && dbsize ==  0) await iniTranList();
    pubkey ='AoulFnsMkNo1HFZHTQ1SzWwgFVlwVHF39O17FBDs8vIj';
    let address ='all';
    try{
        let localfullnode = await common.getLocalfullnode(pubkey);
        //console.log(localfullnode)
        if(!localfullnode) return;

        //存储此次交易记录的数组
        let trans = null;

            let tableIndex = 0;
            let offset = 0;
            let res = await Transaction_indexModel.select(address);
            //console.log(res)
            if(res.length == 1){
                tableIndex = res[0].tableIndex;
                offset = res[0].offset;
            }else {
                await  Transaction_indexModel.add(address ,tableIndex, offset);
            }
            let data = await getAllTransactionHistory(localfullnode, address ,tableIndex, offset);
            //console.log('data:    ',data)
            let result = data.result;
            //如果交易记录不为空，需要加入到待处理的数组中。
            if (result != null) {
                if (trans == null) {
                    trans = [];
                }
                if (result.length > 0) {
                    trans = trans.concat(result);
                }
            }
            if (trans == null && result == null) {
                return;
            }
        data.address = address;
        for (var tran of trans) {
            if(!tran){
                continue;
            }

            //let my_tran = _.find(tranList, { id: tran.hash });
            let  my_tran = await redis.getRedis(tran.hash);
             //console.log(!my_tran);

            //本地存在交易记录，状态是待确认，需要进行状态的更新。

            if (my_tran && tran.isStable && tran.isValid && my_tran.result == 'pending') {
                await updateTran(tran, data);
            }
            //本地存在交易记录，共识网判定交易非法，需要更新交易状态到本地
            else if (my_tran && tran.isStable && !tran.isValid) {
                await badTran(tran, data);
            }
            //本地不存在此交易记录，需往本地插入交易记录
            else if (!my_tran) {
                await insertTran(tran, data);
            } else {
                //console.log(tran.hash)
                 await Transaction_indexModel.update(address,data.tableIndex,data.offset)
                 refreshTranList(tran.hash,getResultFromTran(tran))
            }
        }
    }catch (e) {
        //fs.appendFileSync(error_log, moment().format("MM-DD H:m:s")+": "+e.toString()+"\n");
        console.log("updateAllTransactionHistory: ",e.toString())
    }

}



/**
 * 新增交易记录
 * @param tran
 * @param data
 * @returns {Promise<void>}
 */
async function insertTran(tran, data) {
    let updateTime = tran.updateTime;
    let obj = tran;
    tran = JSON.parse(tran.message);
    let amount = tran.amount;
    if(!amount) {
        amount ="0";
        tran.fee = "0";
    }
    let amountInt = amount.replace(/"/g, '').substring(-1, amount.length - 18) ? amount.replace(/"/g, '').substring(-1, amount.length - 18) : 0;
    let amountPoint = amount.replace(/"/g, '').substring(amount.length - 18, amount.length) ? amount.replace(/"/g, '').substring(amount.length - 18, amount.length) : 0;
    let NRG_PRICE = tran.nrgPrice || 0;
    let fee = (tran.fee * NRG_PRICE).toString();
    let feeInt = fee.replace(/"/g,'').substring(-1,fee.length-18) ? fee.replace(/"/g,'').substring(-1,fee.length-18) : 0;
    let feePoint = fee.replace(/"/g,'').substring(fee.length-18,fee.length) ? fee.replace(/"/g,'').substring(fee.length-18,fee.length) : 0;

    let Base64 = require('../../../util/base64Code');
    let note = tran.remark ? Base64.decode(tran.remark) : '';
    var fields = "hash, creation_date, amount, fee, addressFrom, addressTo, result, remark, amount_point, fee_point, type, nrgPrice, eHash, isStable, isValid, lastIdx, pubkey, timeStamp, vers, id";
    var values = "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?";
    var params = [tran.signature, updateTime, amountInt || 0, feeInt || 0, tran.fromAddress, tran.toAddress || '', getResultFromTran(obj), note || '', amountPoint || 0, feePoint || 0,tran.type, tran.nrgPrice || 0, obj.eHash, obj.isStable ? 1: 0, obj.isValid ? 1: 0, obj.lastIdx ? 1 : 0, tran.pubkey, tran.timestamp, tran.vers,obj.id];
    if(tran.snapVersion){
        fields += " ,snapVersion";
        values +=",?";
        params.push(tran.snapVersion)
    }
    let sql ="INSERT INTO t_transactions_0 (" + fields + ") VALUES (" + values + ")";
    let sql1 ="update t_transactions_index set tableIndex=?,offset=? where address =?";
    let params1=[data.tableIndex, data.offset, data.address];
    try{
        let cmds =[];
        cmds.push({sql:sql,args:params})
        cmds.push({sql:sql1,args:params1})
        await sqlPromise.executeTrans(cmds);
        //console.log('res========= ',res)
        // await sqlPromise.promiseSqlWithParameters(sql,params);
        // await Transaction_indexModel.update(data.address, data.tableIndex, data.offset);
        refreshTranList(tran.signature,getResultFromTran(obj));
    }catch (e) {
        console.log('insertTran: ',e);
        return e.toString()

    }
}

/**
 * 失败交易
 */
async function badTran(tran, data) {
    let id = tran.hash;
    let sql ="update t_transactions_0 set result = 'final-bad' where id = ?";
    let params =[id];
    let sql1 ="update t_transactions_index set tableIndex=?,offset=? where address =?";
    let params1=[data.tableIndex, data.offset, data.address];
    try{
        let cmds =[];
        cmds.push({sql:sql,args:params})
        cmds.push({sql:sql1,args:params1})
        await sqlPromise.executeTrans(cmds);
        refreshTranList( id, 'final-bad')
    }catch (e) {
        console.log('updateTran: ',e.toString())
    }
}

/**
 * 通过交易的状态返回数据库中状态的值
 * @param tran
 * @returns {string}
 */
function getResultFromTran(tran) {
    if (tran.isStable && tran.isValid) {
        return 'good';
    } else if (tran.isStable && !tran.isValid) {
        return 'final-bad';
    } else if (!tran.isStable) {
        return 'pending';
    }
}




/**
 * 更新已有交易状态
 * @param tran
 * @param data
 * @returns {Promise<void>}
 */
async function updateTran(tran, data) {
    let id = tran.hash;
    let sql ="update t_transactions_0 set result = 'good' where id = ?";
    let params =[id];
    let sql1 ="update t_transactions_index set tableIndex=?,offset=? where address =?";
    let params1=[data.tableIndex, data.offset, data.address];
    try{
        let cmds =[];
        cmds.push({sql:sql,args:params})
        cmds.push({sql:sql1,args:params1})
        await sqlPromise.executeTrans(cmds);
        refreshTranList( id, 'good')
    }catch (e) {
        console.log('updateTran: ',e.toString())
    }

}


async function getAllTransactionHistory(localfullnode, address, tableIndex, offset) {
    //let type = [1, 2, 3, 4];
    let resultMessage = JSON.parse(await webHelper.httpPost(getUrl(localfullnode, '/v1/getmessagelist'), null, buildData({ tableIndex,offset})));
    let result = resultMessage.data;
    if(resultMessage.code == 200) {
        result = JSON.parse(result);
        tableIndex = result.tableIndex?result.tableIndex:0;
        offset     = result.offset?result.offset:0;
        return result.list? {result:result.list,tableIndex,offset,address}:{result:[],tableIndex,offset,address};
    }else {
        return {result:[],tableIndex,offset,address}
    }
}


/**
 * 从共识网获取交易记录
 * @param localfullnode
 * @param address
 * @param tableIndex
 * @param offset
 * @returns {Promise<*>}
 */
async function getTransactionHistory(localfullnode, address, tableIndex, offset) {
    let type = [1, 2];
    let resultMessage = JSON.parse(await webHelper.httpPost(getUrl(localfullnode, '/v1/gettransactionlist'), null, buildData({ address,tableIndex,offset, type })));
    let result = resultMessage.data;
    if(resultMessage.code == 200) {
        result = JSON.parse(result);
        tableIndex = result.tableIndex?result.tableIndex:0;
        offset     = result.offset?result.offset:0;
        return result.list? {result:result.list,tableIndex,offset,address}:{result:[],tableIndex,offset,address};
    }else {
        return {result:[],tableIndex,offset,address}
    }
}


/**
 * 初始本地交易记录
 * @param address
 * @returns {Promise<void>}
 */
async function iniTranList() {
   let sql ="select hash,result  from t_transactions_0 "
    //交易列表
    try{
        tranList = await sqlPromise.promiseSql(sql)
        for(let item of tranList){
            Redis.set(item.hash,item.result, function (err, res) {
            })
        }
        //console.log(tranList)
    init = true;
    }catch (e) {
        console.log('iniTranList: ',e.toString())
    }
}

async function getPendingTransactions() {
    let sql ="select * from t_transactions_0 where result='pending'";
    //交易列表
    try{
        let list = await sqlPromise.promiseSql(sql)
        if(list.length > 0){
            return list
        }else{
            return null;
        }
    }catch (e) {
        console.log('iniTranList: ',e.toString())
        return null;
    }
}


//刷新本地交易记录列表
function refreshTranList( hash ,result) {
    Redis.get(hash,(err, res) => {
        if (!res) {
            Redis.set(hash,result)
        }
    });

}


Transations.prototype.getTransactionList = async (opts, cb) => {
    let sql ="select *, case when result='final-bad' then 'invalid' when addressFrom=? then 'sent' else 'received' end as action from t_transactions_0 where addressFrom=? or addressTo=?  order by timeStamp LIMIT ?,?";
    try{
        let result = await sqlPromise.promiseSqlWithParameters(sql,[opts.address, opts.address, opts.address, opts.page, opts.pageSize]);
        cb(null, result)
    }catch (e) {
        cb(e.toString());
    }
}

/**
 * 根据type类型获取
 * @param opts
 * @param cb
 * @returns {Promise<void>}
 */
Transations.prototype.getAllTransactionList = async (opts, cb) => {
    let sql ="select * from t_transactions_0 where 1=1";
    let value = [];
    if(opts.type) {
        sql +=" and type=?";
        value.push(opts.type)
    }
    value.push((opts.page-1)*opts.pageSize);
    value.push(opts.pageSize);
    sql+=" order by creation_date desc LIMIT ?,?";
    try{
        let result = await sqlPromise.promiseSqlWithParameters(sql,value);
        if(result.length > 0){
            for(let i of result){
                i.amount = new Bignumber(i.amount).plus((new Bignumber(i.amount_point)).div(new Bignumber(config.INVEValue.toString()))).toFixed();
            }
        }
        cb(null, result)
    }catch (e) {
        cb(e.toString());
    }
}


/**
 * 获取总交易数据
 * @param opts
 * @param cb
 * @returns {Promise<void>}
 */
Transations.prototype.getAllTransactionListPage = async (opts, cb) => {
    let sql ="select count(*) as t from t_transactions_0 where 1=1";
    if(opts.type) {
        sql +=" and type="+opts.type;
    }

    try{
        let totalCount = await sqlPromise.promiseSql(sql);
        cb(null, totalCount[0].t)
    }catch (e) {
        cb(e.toString());
    }
}

/**
 * 根据hash或adress查询交易记录
 * @param opts
 * @param cb
 * @returns {Promise<void>}
 */
Transations.prototype.getHashTransaction = async (opts, cb) => {
    let sql ="select *, cast(amount_point as CHAR ) as amount_point,cast(fee_point as CHAR ) as fee_point from t_transactions_0 where 1=1   AND ";
    let sql1 ="select count(*) as t from t_transactions_0 where 1=1   and";
    let limit;
    let value = [];
    let value1 = [];
    let address = false;
    Object.keys(opts).forEach(function(key){
        if(key !='page' && key !='limit' && key !='address'){
            sql +=` ${key}=?`;
            value.push(opts[key]);
        }else if(key =='address'){
            address = true;
            sql +=' addressFrom=? or addressTo=?';
            sql1 +=' addressFrom=? or addressTo=?';
            value.push(opts[key]);
            value.push(opts[key]);
            value1.push(opts[key]);
            value1.push(opts[key]);
        }else if(key =='page'){
            sql +=" order by creation_date DESC ";
            limit=" limit ?,?";
            value.push((Number(opts[key])-1)*Number(opts['limit']));
            value.push(Number(opts['limit']));
            sql += limit;
        }
    });

    let obj ={};
    let isLimit = sql.match(/limit/);
    if(!isLimit) {
        sql +=" order by creation_date DESC ";
        sql +=' limit 0,10';
    }
    try{
        let res = await sqlPromise.promiseSqlWithParameters(sql,value);

        if(!address){
            obj = res[0];
            if(obj){
                obj.amount = new Bignumber(obj.amount.toString()).plus(new Bignumber(obj.amount_point.toString()).div(new Bignumber(config.INVEValue.toString()))).toFixed();
                obj.fee = new Bignumber(obj.fee.toString()).plus((new Bignumber(obj.fee_point.toString())).div(new Bignumber(config.INVEValue.toString()))).toFixed();
            }else {
                obj = {};
                obj.amount = 0;
                obj.fee = 0;
            }
        }else {
            let res1 = await sqlPromise.promiseSqlWithParameters(sql1,value);
            obj.currPage = opts.page || 1;
            obj.pageSize = opts.limit || 10;
            obj.totalCount = res1[0].t;
            obj.totalPage = Math.ceil(res1[0].t/(opts.limit || 10));
            obj.list = formatTrans(res);
        }
        cb(null, obj)
    }catch (e) {
        cb(e.toString());
    }
}

/**
 * 格式化金额
 * @param res
 * @returns {*}
 */
function formatTrans(res){
    for(let i of res){
        i.amount = new Bignumber(i.amount).plus((new Bignumber(i.amount_point)).div(new Bignumber(config.INVEValue.toString()))).toFixed();
        i.fee = new Bignumber(i.fee).plus((new Bignumber(i.fee_point)).div(new Bignumber(config.INVEValue.toString()))).toFixed();

    }
    //console.log(res)
    return res;
}

/**
 * 获取账户余额
 * @param address
 * @param cb
 * @returns {Promise<void>}
 */
Transations.prototype.getBalance = async  (address, cb) => {
    let sqlto="select  *,cast(amount_point as CHAR ) as amount_point,cast(fee_point as CHAR ) as fee_point,addressTo address  from t_transactions_0 where addressTo=?";
    let sqlFrom="select  *,addressFrom address from t_transactions_0 where addressFrom=?";
    let resTo = await sqlPromise.promiseSqlWithParameters(sqlto,[address]);
    let resFrom = await sqlPromise.promiseSqlWithParameters(sqlFrom,[address]);
    let to ={amount:0 ,amountPoint: 0}
    let from ={amount:0 ,amountPoint: 0}
    if(resTo && resTo.length > 0) {
        let amount = 0;
        let amountPoint = 0;
        resTo.forEach(function (i) {
            if(i.result == 'good'){
                amount+= Number(i.amount);
                amountPoint+=Number(i.amount_point)
            }
        });
        to.amount = amount;
        to.amountPoint = amountPoint.toString();
    }
    if(resFrom && resFrom.length > 0) {
        let amount = 0;
        let amountPoint = 0;
        resFrom.forEach(function (i) {
            if(i.result =='good' || i.result == 'pending'){
                amount+= (i.amount+i.fee);
                amountPoint+=(Number(i.amount_point)+Number(i.fee_point))
            }
        });
        from.amount = amount;
        from.amountPoint = amountPoint;
    }

    let stables = new Bignumber(to.amount.toString()).minus(new Bignumber(from.amount.toString())).plus(new Bignumber(to.amountPoint.toString()).div(new Bignumber((require('../../../util/config').INVEValue).toString()).toString())).minus(new Bignumber(from.amountPoint.toString()).div(new Bignumber((require('../../../util/config').INVEValue).toString()))).toFixed();
    cb(null, stables)

}

/**
 * 查询地址余额
 * @param address
 * @param cb
 * @returns {Promise<*>}
 */
// Transations.prototype.getBalance = async (address,cb) =>{
//     if(address ==''){
//         return cb(0)
//     }
//     let pubkey ='AoulFnsMkNo1HFZHTQ1SzWwgFVlwVHF39O17FBDs8vIj';
//     let localfullnode = await common.getLocalfullnode(pubkey);
//     if(!localfullnode) return cb(`localfullnode is null`);
//     try{
//         let result = JSON.parse(await webHelper.httpPost(getUrl(localfullnode, '/v1/account/info'), null, buildData({address})));
//         //console.log(result)
//         let data = JSON.parse(result.data)
//         cb(null, data.balance ==0 ? 0 : new Bignumber(data.balance.toString()).div(new Bignumber("1000000000000000000")).toFixed());
//     }catch (e) {
//         cb(e.toString())
//     }
// }


/**
 * 获取地址信息
 * @returns {Promise<void>}
 */
Transations.prototype.getAccountMessage = async () => {
    let sql ="select count(*) as t from t_transactions_0";
    let sql1 ="select count(*) as t from (select addressFrom as address from t_transactions_0 UNION select  addressTo from t_transactions_0 )a where address <>''"
    try{
        let res = await sqlPromise.promiseSql(sql);
        let res1 = await sqlPromise.promiseSql(sql1);
        Redis.set('messageTotal',res[0].t);
        Redis.set('accountsTotal',res1[0].t);
        let a = await redis.getRedis(`message${moment().format('YYYY-MM-DD')}`);
        if(!a) {
            let res2 = await sqlPromise.promiseSqlWithParameters("select * from t_accounts_messages  where creation_date_day=? order by creation_date_day DESC ", [moment().format('YYYY-MM-DD')]);
            let obj = {
                creation_date_day: moment().format('YYYY-MM-DD'),
                messageTotal: res[0].t,
                accountsTotal: res1[0].t,
                creation_date: Math.round(Date.now())
            }
            if (res2.length > 0) {
                Redis.set(`message${moment().format('YYYY-MM-DD')}`, `${res[0].t}-${res1[0].t}`);
            } else {
                let sqlAcount = "insert into t_accounts_messages (creation_date_day,messageTotal,accountsTotal,creation_date) values (?,?,?,?)";
                await sqlPromise.promiseSqlWithParameters(sqlAcount, [obj.creation_date_day, obj.messageTotal, obj.accountsTotal, obj.creation_date])
                Redis.set(`message${moment().format('YYYY-MM-DD')}`, `${res[0].t}-${res1[0].t}`);
            }
        }
    }catch (e) {
        console.log('getAccountMessage: ',e.toString());
    }
}

//组装访问共识网的url
let getUrl = (localfullnode, suburl) => {
    return 'http://' + localfullnode + suburl;
}
//组装往共识网发送数据的对象
let buildData = (data) => {
    return JSON.parse(JSON.stringify(data));
}

module.exports = Transations;


