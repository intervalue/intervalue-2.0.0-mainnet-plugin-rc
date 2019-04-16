package test;

import one.inve.core.Config;
import one.inve.util.HttpUtils;

import java.util.HashMap;

/**
 * Query transaction information demo
 */
public class TxInfoTest {
    public static void main(String[] args) {
        String hash = "32GJc3jDfaFlw2yrzPh7/xM4X+a0bQV75hh+uLeNiBU64nEhf6pJlHL50Yx6AjzoFeykUvRfftomLeUo+8kWL7lQ==";
        HashMap<String, String> data = new HashMap<String, String>();
        data.put("hash", hash);
        String result = null;
        try {
            String url = "http://35.170.77.230:" + Config.DEFAULT_HTTP_PORT + Config.GET_MESSAGE_URI;
            result = HttpUtils.httpPost(url, data);
            System.out.println("get message info result:" + result);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}
