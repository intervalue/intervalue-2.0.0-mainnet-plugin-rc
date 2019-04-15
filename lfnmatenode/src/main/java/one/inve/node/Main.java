package one.inve.node;

import one.inve.http.NettyHttpServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    public Main() {
    }

    /**
     * 初始化
     */
    private void init(String[] args) {
        try {
            // 启动http接口
            NettyHttpServer.bootstrapHttpService();
        } catch (Exception e) {
            logger.error("{}", e);
        }
    }

    /**
     * lfnmatenode入口
     *
     * @param args 参数
     */
    public static void main(String[] args) {
        Main main = new Main();
        main.init(args);
    }

}
