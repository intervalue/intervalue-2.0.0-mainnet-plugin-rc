const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const config = require('./config');
const app = express();
const apiModule = require('./modules/api');       //API 模块
const log4J = require('./util/logger/log');
const ErrorLog = log4J.getLogger("errorLog");
const utils = require('./util/functions');
const EOL = require('os').EOL;

const isProd = false; //是否是生产环境（生产环境才记录日志，否则直接返回给前端）。

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.disable('x-powered-by');

app.use(logger('dev'));
app.use(bodyParser.text({ type: 'text/xml' }));
app.use(bodyParser.json({
    limit: config.file_limit
}));
app.use(bodyParser.urlencoded({ extended: true, limit: config.file_limit }));
app.use(multer().any());
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/v1', cors(), apiModule);


//什么也没有匹配到，直接是404
app.use(function (req, res, next) {

    //转给统一的内部错误记录处理，内部视为500错误。因为前端不应该访问一个不存在的路径
    const pageNotFoundErr = new Error(`访问了一个不存在的路径：${req.url || req.originalUrl}`);
    //必须设置这个code，因为在error中不必再次使用res向页面输出结果。
    pageNotFoundErr.code = 404;
    //交给统一的ErrorHandler处理不存在的路径。
    next(pageNotFoundErr);

});

//#region 错误处理
app.use(function (err, req, res, next) {

    console.error(`发生错误，具体情况：`, err);

    const remoteIP = utils.getClientIp(req);

    //将err的code转化为数字类型，判断是否为500
    //如果不是500，默认设置为500.
    err.code = utils.safeToInt(err.code);

    if (isNaN(err.code)) {
        err.code = 500;
    }

    //404表示找不到页面
    if (err.code === 404) {
        res.status(404);
        return res.send(`Page Not Found`);
    }

    //生产环境中，只要是有出错信息，一律显示
    if (isProd) {

        //不是500错误，表示业务逻辑错误，可以告知客户端
        if (err.code !== 500) {
            res.error(err);
        }
        else {
            //服务器错误，隐藏真实错误
            res.status(500);
            res.send('处理信息时发生错误，请联系管理员。');
        }
    }
    else {
        res.error(err);
    }

    //无论何种情况，服务器上都记录日志供后台查阅。只记录访问后端（api开头的错误）
    const accessedUrl = (req.originalUrl || req.url);

    if (accessedUrl.toLowerCase().indexOf("/api") === 0) {

        let finalLogFormatted = `客户端地址：${remoteIP}；访问路径：${accessedUrl}；请求方式：${req.method}；错误码：${err.code}；错误信息：${err.message}`;
        //如果有附加信息，动态拼接上
        if (err.data) {
            finalLogFormatted += `附加信息：${JSON.stringify(err.data)}`;
        }
        //因为stack是具有换行的字符串，放入JSON.stringify中会导致格式化异常，另外存放。
        if (err.code === 500) {
            finalLogFormatted += EOL + err.stack;
        }
        finalLogFormatted += EOL;
        ErrorLog.error(finalLogFormatted);
    }

    res.end();

});
//#endregion

module.exports = app;