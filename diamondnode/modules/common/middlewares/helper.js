/**
 * Created by lhp on 2019/3/8.
 */
const _ = require('lodash');
const moment = require('moment');
const utils = require('../../../util/functions');

const processForReqAndResp = function (req, res, next) {
  //#region req的处理
  var data = {};
  // if (req.query) {
  //   data = _.merge(data, req.query);
  // }
  if (req.body) {
    data = _.merge(data, req.body);
  }
  req.data = data;

  /**
   * 成功后返回信息
   * @param {Object} returnData 任意成功之后返回的对象。
   * @param {String} returnMsg 任意成功之后需要给前端的字符串。
   */
  res.success = function (returnData = null, returnMsg = null) {
    const response = {
      code: 200,
      server_time: moment().unix(),
      msg: returnMsg,
      data: returnData
    };
    res.json(response);
  };
  //#endregion

  //#region resp的附加方法处理
  res.error = function (code, msg) {

    const response =
      {
        code: 500,
        server_time: moment().unix(),
        msg: null
      };

    //先判断code是否是Error，是的话直接从Error里边获取信息
    if (_.isError(code)) {
      const _err = code;
      _err.code = utils.safeToInt(_err.code);
      if (!isNaN(_err.code)) {
        response.code = _err.code;
      }
      response.msg = _err.message;
      if(_err.data){
        response.data = _err.data;
      }
    }
    else {
      //否则人为构建Error信息
      response.code = code;
      response.msg = msg;
    }

    res.json(response);
  };

  res.wrong = function (msg) {
    const response = {
      msg: msg
    };
    res.status(501).json(response);
  };
  //#endregion

  //#region 允许跨域
  res.header("Access-Control-Allow-Origin", "*");
  //#endregion
  //进入正式处理的环节
  next();
};

module.exports = processForReqAndResp;