const cluster = require("cluster");
const http = require("http");
const numCPUs = require('os').cpus().length;
const LOGINITs = require('../util/logger/logInit').LogInit;
const Log4J = require('../util/logger/log');
const OtherLog = Log4J.getLogger("otherLog");


function startRunning() {

  cluster.setupMaster({
    exec: './www',
    silent: false
  });

  for (let i = 1; i <= numCPUs; ++i) {
    const processWork = cluster.fork();
    //当退出之后重新启动
    processWork.on("exit", (code, signal) => {
      OtherLog.warn(`Running进程退出，自动重新启动，Code：${signal}，Signal：${signal}`);
      cluster.setupMaster({
        exec: wwwFileDependency,
        silent: false
      });
      cluster.fork();
    });
  }
}
//#endregion

//初始化日志
LOGINITs.InitLogEnv();
//启动主程序和Pooling
startRunning();