const ERRORFILEPATH = "./log/errors/error";
const REQUESTLOGPATH = "./log/requests/request";
const OTHERLOGPATH = "./log/others/other";
const fs = require('fs');

/**
 * 判断当前路径下是否有log文件夹和db.log/error.log，没有应该自动创建
 */
function InitLogEnv() {

    if (!fs.existsSync("log")) {
        fs.mkdirSync("log");
    }
}

exports.LogInit =
    {
        ERRORFILEPATH: ERRORFILEPATH,
        REQUESTLOGPATH: REQUESTLOGPATH,
        InitLogEnv: InitLogEnv,
        OTHERLOGPATH: OTHERLOGPATH
    };