package test;

import com.alibaba.fastjson.JSON;
import one.inve.core.Config;
import one.inve.util.HttpUtils;

import java.util.HashMap;

/**
 * Broadcast transaction message demo
 */
public class TxSendTest {
    public static void main(String[] args) {
        String message = "{\"message\":{\"nrgPrice\":\"1000000000\",\"amount\":\"1000000000000000\",\"signature\":\"32GJc3jDfaFlw2yrzPh7/xM4X+a0bQV75hh+uLeNiBU64nEhf6pJlHL50Yx6AjzoFeykUvRfftomLeUo+8kWL7lQ==\",\"fee\":\"500000\",\"vers\":\"2.0\",\"fromAddress\":\"FODALDEJMW5YIMUNPBCYB7P5QQPXQZ73\",\"remark\":\"\",\"type\":1,\"toAddress\":\"6BHR46ERTTBWYFQROGMNBGX6DIWXMNHJ\",\"timestamp\":1555393999374,\"pubkey\":\"AqFVwB03m1k2LhA9VrFbHTb8jgoLRCZPa31Wi39Rb1wk\"}}";
        HashMap<String, String> data = JSON.parseObject(message, HashMap.class);
        data.put("message", JSON.toJSONString(data.get("message")));
        String result = null;
        try {
            String url = "http://35.170.77.230:" + Config.DEFAULT_HTTP_PORT + Config.SEND_MESSAGE_URI;
            result = HttpUtils.httpPost(url, data);
            System.out.println("send message result:" + result);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}
