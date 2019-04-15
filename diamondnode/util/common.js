"use strict";
const config = require('./config')
const webHelper = require("./webhelper.js");
const _ = require('lodash');





let urlList = [];

async function getLocalfullnode(pubkey){
    //console.log(urlList)
    try{
        if(urlList.length == 0){
            let result = JSON.parse(await webHelper.httpPost(config.my_device_hashnetseed_url + '/v1/getlocalfullnodes', null, {pubkey: pubkey}));
            if(result.code != 200){
                console.log(`getLocalfullnode err: ${result.data}`);
                return;
            }else{
                if(result.data ==''){
                    console.log(`getLocalfullnode is null`);
                    return; null
                }else {
                    let localfullnodes = JSON.parse(result.data);
                    _.forEach(localfullnodes,function (res) {
                        urlList.push(`${res.ip}:${res.httpPort}`)
                    });
                }
            }
        }
        let localfullnode =urlList[Math.ceil(Math.random() * urlList.length-1)].replace("172.17.2.119:35","localfullnode01.ginvip.com:36");
        return localfullnode;
    } catch (e) {
        console.log('catch getLocalfullnode: localfullnode is null ', e.toString());
        return null;
    }

}


function getRedis(k){
    return new Promise((resolve, reject) =>{
        Redis.get(k, (err, res) => {
            if(err) reject(err)
            resolve(res);
        });
    });
}

function dbsizeRedis(){
    return new Promise((resolve, reject) =>{
        Redis.dbsize( (err, res) => {
            if(err) reject(err)
            resolve(res);
        });
    });
}


exports.getLocalfullnode = getLocalfullnode;
exports.getRedis = getRedis;
exports.dbsizeRedis = dbsizeRedis;
exports.urlList = urlList;