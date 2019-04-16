package test;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import one.inve.bean.message.TransactionMessage;
import one.inve.core.Config;
import one.inve.util.HttpUtils;
import one.inve.utils.SignUtil;

import java.math.BigInteger;
import java.util.HashMap;

/**
 * Transaction signature demo
 */
public class TxSignTest {
    public static void main(String[] args) {
        BigInteger nrgPrice = null;
        try {
            String url = Config.DEFAULT_SEED_PUBIP + ":" + Config.DEFAULT_SEED_HTTP_PORT + Config.GET_NRG_PRICE_URI;
            String resultStr = HttpUtils.httpPost(url, new HashMap<>());
            JSONObject resultJson = JSONObject.parseObject(resultStr);
            nrgPrice = BigInteger.valueOf(Long.valueOf(JSONObject.parseObject(resultJson.getString("data")).getString("nrgPrice")));
        } catch (Exception e) {
            e.printStackTrace();
        }
        TransactionMessage tm = null;
        try {
            tm = new TransactionMessage("heart wash dose bag either wool impulse mistake cancel small rail file",
                    "FODALDEJMW5YIMUNPBCYB7P5QQPXQZ73", "6BHR46ERTTBWYFQROGMNBGX6DIWXMNHJ",
                    new BigInteger("1000000000000000"), BigInteger.valueOf(50000), nrgPrice);
        } catch (Exception e) {
            e.printStackTrace();
        }
        String message = tm.getMessage();
        JSONObject object = JSON.parseObject(message);
        boolean vefiry = false;
        try {
            vefiry = SignUtil.verify(object.getString("message"));
        } catch (Exception e) {
            e.printStackTrace();
        }
        if (vefiry) {
            System.out.println("send message:" + JSON.toJSONString(message));
        }
    }
}
