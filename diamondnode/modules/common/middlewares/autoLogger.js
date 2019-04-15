const log4J = require('../../../util/logger/log');
const ReqLogger = log4J.getLogger("requestLog");
const utils = require('../../../util/functions');

/**
 * 自动计时处理
 */
const autoLoggerProcess = (req, res, next) => {

    //使用高精度计时器避免受到系统影响，不使用Date.now()计时。
    const startTime = process.uptime();

    //开始下一轮（异步）
    next();

    //响应输出之后计时
    res.once('finish', () => {
        const endTime = process.uptime();
        const finalResult = ((endTime - startTime) * 1000).toFixed(2);
        const remoteIP = utils.getClientIp(req);
        ReqLogger.info(`客户端地址：${remoteIP}；访问路径：${req.originalUrl || req.url}；请求方式：${req.method}；耗时：${finalResult}毫秒。`);
    });
};

module.exports = autoLoggerProcess;