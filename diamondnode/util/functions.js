const http = require('http');
const os = require('os');
const Log4J = require('./logger/log');
const Logger = Log4J.getLogger("errorLog");
const request = require("request");

/**
 * 获取客户端IP以及详细信息（用于日志记录）。
 * @param {*Request对象} req 
 */
exports.getClientIpDetailInfo = function (req) {

  //私有函数，当地址=127.0.0.1的时候，应该获取服务端外网地址
  //使用国际查询接口：http://ip-api.com/json/你的IP地址
  //返回结果：
  //```
  //   {
  //     "as": "AS56040 China Mobile communications corporation",
  //     "city": "Shenzhen",
  //     "country": "China",
  //     "countryCode": "CN",
  //     "isp": "China Mobile Guangdong",
  //     "lat": 22.5333,
  //     "lon": 114.1333,
  //     "org": "China Mobile",
  //     "query": "117.136.39.203",
  //     "region": "GD",
  //     "regionName": "Guangdong",
  //     "status": "success",
  //     "timezone": "Asia/Shanghai",
  //     "zip": ""
  // }
  //```
  function getServerIP(ipAddress = "myip") {

    const getIPPromise = new Promise((succ, fail) => {

      //发起请求的参数
      const options = {
        hostname: `ip-api.com`,
        path: `/json/${ipAddress}`,
        method: 'GET'
      };

      //开始查询
      const req = http.request(options, (res) => {

        //反馈结果
        let result =
          {
            remoteIP: ipAddress,
            country: '未知',
            region: '未知',
            city: '未知',
            isp: '未知'
          };

        //如果无法查询外网，默认设置为内网返回IP
        if (result.remoteIP === 'myip') {
          const ips = os.networkInterfaces();
          for (let prop in ips) {
            result.remoteIP = ips[prop].filter(v => v.family === "IPv4")[0].address;
            break;
          }
        }

        //表示获得到了数据
        if (res.statusCode === 200) {
          res.setEncoding("utf8");
          //当data来的时候，积累data
          const dataArray = new Array();
          //成功数据不断积累
          res.on('data', (data) => {
            dataArray.push(data);
          });
          //最终汇总数据
          res.on('end', () => {

            const jsonString = dataArray.join("");
            const d = JSON.parse(jsonString);

            //可以查到
            if (d.status === "success") {

              result.remoteIP = ipAddress;
              result.country = d.country;
              result.region = d.region;
              result.city = d.city;
              result.isp = d.as;
            }
            else {
              //否则返回具体错误消息
              result = d;
            }
            //返回最终结果
            succ(result);
          });
          //出错了，忽略
          res.on('error', (err) => {
            //记录一下，可以忽略此错误
            Logger.warn(`淘宝接口调用出错，此错误可以忽略。`, err.message);
            succ(result);
          });
        }
        else {
          //返回statusCode不是200，说明有错
          Logger.warn(`IP查询有错，接口状态不对，此错误可以忽略；返回状态码：`, res.statusCode);
          succ(result);
        }
      });

      req.end();
    });

    return getIPPromise;
  }

  const remoteRealIP = getClientIp(req);
  console.log("IP Address", remoteRealIP);
  return getServerIP(remoteRealIP);
};

/**
 * 获取客户端IP（简单对象，只获得IP地址）。
 * @param {*Request对象} req 
 */
function getClientIp(req) {

  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress || req.ip;

  ip = ip.split(",");
  ip = ip[0];

  //如果IP格式：::ffff:127.0.0.1，只截取最后的127.0.0.1
  const removeStr = '::ffff:';
  const index = ip.indexOf(removeStr);
  if (index !== -1) {
    const ipReplacer = new RegExp(removeStr, "gui");
    ip = ip.replace(ipReplacer, "");
  }

  //如果是127.0.0.1，那么说明和服务器IP一样，取服务器的IP
  if (ip === '127.0.0.1') {
    const ips = os.networkInterfaces();
    for (let prop in ips) {
      ip = ips[prop].filter(v => v.family === "IPv4")[0].address;
      break;
    }
  }

  return ip;
};
exports.getClientIp = getClientIp;


/**
 * 把任意一个值转化为整型数字。
 * @param {*被转化的值} value 
 * @returns
 * 如果成功转化，返回转化后的数字；否则返回NaN
 */
function _safeToInt(value) {

  const tryConvertValue = parseInt(value);

  //因为parseXXX方法只会转字符串中可转化的部分（如3.1abc不是字符串，但是parseInt转化成3）
  //且Number对于null，空会返回0.所以必须两者都判断。

  if (isNaN(Number(value)) || isNaN(tryConvertValue)) {
    return NaN;
  }
  return tryConvertValue;
}
exports.safeToInt = (value) => {
  return _safeToInt(value);
};
/**
 * 把任意一个值转化为浮点型数字。
 * @param {*被转化的值} value 
 * @returns
 * 如果成功转化，返回转化后的数字；否则返回NaN
 */
function _safeToFloat(value) {

  //因为parseXXX方法只会转字符串中可转化的部分（如3.1abc不是字符串，但是parseInt转化成3.1）
  //且Number对于null，空会返回0.所以必须两者都判断。

  const tryConvertValue = parseFloat(value);

  if (isNaN(Number(value)) || isNaN(tryConvertValue)) {
    return NaN;
  }
  return tryConvertValue;
}
exports.safeToFloat = (value) => {
  return _safeToFloat(value);
};

/**
 * 批量验证字段值是否不能为空或者NaN（仅数值类型Int字段）
 * @param {Object} entityObj 被验证的Object。
 * @param {Array} fields 必填的数值类型字段。
 * @returns
 * 全部正确返回null，否则返回出错字段名字和实际值。
 */
exports.batchFieldsValidationForNumberInt = (entityObj, fields) => {
  let actualResult = null;

  for (let field of fields) {
    entityObj[field] = actualResult = _safeToInt(entityObj[field]);
    if (isNaN(entityObj[field])) {
      return [field, JSON.stringify(actualResult)];
    }
  }
  return null;
}

/**
 * 批量验证字段值是否不能为空或者NaN（仅数值类型Float字段）
 * @param {Object} entityObj 被验证的Object。
 * @param {Array} fields 必填的数值类型字段。
 * @returns
 * 全部正确返回null，否则返回出错字段名字和实际值。
 */
exports.batchFieldsValidationForNumberFloat = (entityObj, fields) => {

  let actualResult = null;

  for (let field of fields) {
    entityObj[field] = actualResult = _safeToFloat(entityObj[field]);
    if (isNaN(entityObj[field])) {
      return [field, JSON.stringify(actualResult)];
    }
  }
  return null;
}

/**
 * 批量验证String类型不能为空。
 * @param {Object} entityObj 被验证的Object。
 * @param {Array} fields 必填的数值类型字段。
 * @returns
 * 全部正确返回null，否则返回出错字段名字和实际值。
 */
exports.batchFieldsValidationForString = (entityObj, fields) => {
  let actualResult = null;

  for (let field of fields) {
    actualResult = entityObj[field];
    if (!actualResult || typeof actualResult !== 'string') {
      return [field, JSON.stringify(actualResult)];
    }
    else {
      actualResult = actualResult.trim();
      if (actualResult === "") {
        return [field, JSON.stringify(actualResult)];
      }
      else {
        entityObj[field] = actualResult;
      }
    }
  }
  return null;
}
/**
 * 一定范围内随机数生成（范围在startNumber和endNumber之间，同时包含A和B自身；默认范围100000到999999）。
 * @param {Number} startNumber 起始的数字。
 * @param {Number} endNumber 结束的数字。
 * @returns {Number} 生成的随机数。
 */
exports.generateRandomNumber = (startNumber = 100000, endNumber = 999999) => {
  let randomNumber = Math.random() * (endNumber - startNumber + 1) + startNumber;
  randomNumber = Math.floor(randomNumber);
  return randomNumber;
}

/**
 * promise化request
 * @param {Object} opts 
 */
exports.PromiseReq = (opts = {}) => {
  if (!opts.timeout) opts.timeout = 15000;
  return new Promise((resolve, reject) => {
    request(opts, (e, r, d) => {
      if (e) {
        // console.log(e);
        return reject(e);
      }
      if (r.statusCode != 200) {
        console.log("back statusCode：", r.statusCode);
        return reject(`back statusCode：${r.statusCode}`);
      }
      return resolve(d);
    });
  })
};

/**
 * await 返回成功数据
 * @param {any} data 
 */
exports.success = (data = '') => {
  return { code: 1, data };
};

/**
 * await 返回错误数据
 * @param {any} data 
 */
exports.fail = (err) => {
  if (typeof err == "string") err = new Error(err);
  return { code: -1, err };
};