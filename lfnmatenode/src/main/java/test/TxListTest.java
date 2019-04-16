package test;

import one.inve.core.Config;
import one.inve.util.HttpUtils;

import java.util.HashMap;

/**
 * Query transaction list demo
 */
public class TxListTest {
    public static void main(String[] args) {
        String address = "6BHR46ERTTBWYFQROGMNBGX6DIWXMNHJ";
        HashMap<String, String> data = new HashMap<String, String>();
        data.put("address", address);
        data.put("tableIndex","0");//optional parameter,default is "0"
        data.put("offset","0");//optional parameter,default is "0"
        String result = null;
        try {
            String url = "http://35.170.77.230:" + Config.DEFAULT_HTTP_PORT + Config.GET_MESSAGE_LIST_URI;
            result = HttpUtils.httpPost(url, data);
            System.out.println("get message list result:" + result);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}
