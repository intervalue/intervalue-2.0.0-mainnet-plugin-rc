const log4js = require('log4js');
const LOGCONFIGs = require('./logInit').LogInit;

const log_config = {
  appenders:
    {
      errorLog: {
        type: 'dateFile',
        filename: LOGCONFIGs.ERRORFILEPATH,
        //嵌套文件夹_yyyy_MM_dd，如果没有这个，直接在filename后追加pattern生成文件名。
        pattern: '_yyyy_MM_dd/error-yyyy_MM_dd_hh.log',
        alwaysIncludePattern: true
      },
      requestLog: {
        type: 'dateFile',
        filename: LOGCONFIGs.REQUESTLOGPATH,
        pattern: '_yyyy_MM_dd/request-yyyy_MM_dd_hh.log',
        alwaysIncludePattern: true
      },
      otherLog: {
        type: 'dateFile',
        filename: LOGCONFIGs.OTHERLOGPATH,
        pattern: '_yyyy_MM_dd/other-yyyy_MM_dd_hh.log',
        alwaysIncludePattern: true
      },
      //这个仅仅是默认的，保留；因为categories必须要default字段属性。
      defaultLog: {
        type: 'stdout'
      }
    },
  categories: {
    errorLog: { appenders: ['errorLog'], level: "error" },
    requestLog: { appenders: ['requestLog'], level: "info" },
    otherLog: { appenders: ['otherLog'], level: "info" },
    default: { appenders: ['defaultLog'], level: "debug" }
  }
};

LOGCONFIGs.InitLogEnv();
log4js.configure(log_config);

module.exports = log4js;