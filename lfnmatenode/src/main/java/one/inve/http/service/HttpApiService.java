package one.inve.http.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import one.inve.bean.wallet.Wallet;
import one.inve.bean.wallet.WalletBuilder;
import one.inve.beans.LocalFullNode;
import one.inve.core.Config;
import one.inve.http.DataMap;
import one.inve.http.annotation.MethodEnum;
import one.inve.http.annotation.RequestMapper;
import one.inve.util.HttpUtils;
import one.inve.util.ResponseUtils;
import one.inve.util.StringUtils;
import one.inve.bean.message.TransactionMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;

public class HttpApiService {
    private static final Logger logger = LoggerFactory.getLogger(HttpApiService.class);

    public HttpApiService() {

    }

    private Wallet wallet;

    /**
     * 发送消息上链
     *
     * @param data 消息
     * @return 成功返回“”，否则返回错误信息
     */
    @RequestMapper(value = "/v1/sendmsg", method = MethodEnum.POST)
    public String sendMessage(HashMap<String, String> data) {
        logger.info("send message ... data: {}", JSON.toJSONString(data));
        if (null == data || data.isEmpty()) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        LocalFullNode lfn = getlocalfullnode();
        if (null == lfn) {
            logger.error("sendMessage localfullnode is null");
            return ResponseUtils.handleExceptionResponse();
        }
        try {
            String result = null;
            String url = "http://" + lfn.getIp() + ":" + lfn.getHttpPort() + Config.SEND_MESSAGE_URI;
            result = HttpUtils.httpPost(url, data);
            return result;
        } catch (Exception e) {
            logger.error("sendMessage handle error: {}", e);
            return ResponseUtils.response(203, "send msg error");
        }
    }


    /**
     * 查询message列表
     *
     * @param data 查询参数
     *             例： { "address": "4PS6MZX6T7ELDSD2RUOZRSYGCC5RHOS7", "tableIndex":0, "offset":0}
     *             - address 地址
     *             - tableIndex 表索引
     *             - offset 表中偏移量
     * @return message记录列表
     */
    @RequestMapper(value = "/v1/message/list", method = MethodEnum.POST)
    public String getMessageList(HashMap<String, String> data) {
        logger.info("get message list ... data: {}", JSON.toJSONString(data));
        if (null == data || data.isEmpty()) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        try {
            String trans = null;
            String url = Config.DEFAULT_NODE_PUBIP + ":" + Config.DEFAULT_NODE_HTTP_PORT + Config.GET_MESSAGE_LIST_URI;
            trans = HttpUtils.httpPost(url, data);
            return (null == trans) ? "" : trans;
        } catch (Exception e) {
            logger.error("getMessageList handle error: {}", e);
            return ResponseUtils.handleExceptionResponse();
        }
    }

    /**
     * 根据hash值查询对应message记录
     *
     * @param data message的Hash值
     *             例： {"hash":"33AM+B7ZRErCw9wkR9XXHKIdR0crmEUr6M4LIoQOREI4faaTw6qmC7Og1WP65hKJPKwSyKFOnKN0yny29kAmXAQVM="}
     * @return message记录
     */
    @RequestMapper(value = "/v1/message/info", method = MethodEnum.POST)
    public String getMessage(HashMap<String, String> data) {
        logger.info("get message ... data: {}", JSON.toJSONString(data));
        if (null == data || data.isEmpty()) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        try {
            String message = null;
            String url = Config.DEFAULT_NODE_PUBIP + ":" + Config.DEFAULT_NODE_HTTP_PORT + Config.GET_MESSAGE_URI;
            message = HttpUtils.httpPost(url, data);
            return (null == message) ? "" : message;
        } catch (Exception e) {
            logger.error("getMessage handle error: {}", e);
            return ResponseUtils.handleExceptionResponse();
        }
    }


    @RequestMapper(value = "/v1/wallet/gen", method = MethodEnum.POST)
    public String newWallet(DataMap<String, Object> data) {
        logger.info("new wallet ... data: {}", JSON.toJSONString(data));
        try {
            wallet = WalletBuilder.generateWallet();
            JSONObject walletJson = new JSONObject();
            walletJson.put("pubKey", wallet.getExtKeys().getPubKey());
            walletJson.put("priKey", wallet.getExtKeys().getPrivKey());
            walletJson.put("words", wallet.getMnemonic());
            walletJson.put("address", wallet.getAddress());
            return ResponseUtils.normalResponse((null == walletJson) ? "" : JSON.toJSONString(walletJson));
        } catch (Exception e) {
            logger.error("newWallet handle error:{}", e);
            return ResponseUtils.handleExceptionResponse();
        }
    }

    @RequestMapper(value = "/v1/wallet/sign", method = MethodEnum.POST)
    public String newSignMessage(DataMap<String, Object> data) {
        logger.info("new sign message ... data: {}", JSON.toJSONString(data));
        if (null == data || data.isEmpty()) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        String words = data.getString("words");
        if (StringUtils.isEmpty(words)) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        String fromAddress = data.getString("fromAddress");
        if (StringUtils.isEmpty(fromAddress)) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        String toAddress = data.getString("toAddress");
        if (StringUtils.isEmpty(toAddress)) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        String amountStr = data.getString("amount");
        BigInteger amount = new BigInteger(amountStr);
        if (null == amount) {
            logger.error("parameter is empty.");
            return ResponseUtils.paramIllegalResponse();
        }
        if (amount.compareTo(BigInteger.ZERO) <= 0) {
            logger.error("amount is illegal");
            return ResponseUtils.paramIllegalResponse();
        }
        try {
            String url = Config.DEFAULT_SEED_PUBIP + ":" + Config.DEFAULT_SEED_HTTP_PORT + Config.GET_NRG_PRICE_URI;
            String resultStr = HttpUtils.httpPost(url, new HashMap<>());
            if (StringUtils.isEmpty(resultStr)) {
                return ResponseUtils.handleExceptionResponse();
            }
            JSONObject resultJson = JSONObject.parseObject(resultStr);
            if (200 != resultJson.getInteger("code")) {
                return ResponseUtils.handleExceptionResponse();
            }
            BigInteger nrgPrice = BigInteger.valueOf(Long.valueOf(JSONObject.parseObject(resultJson.getString("data")).getString("nrgPrice")));
            if (null == nrgPrice || nrgPrice.compareTo(BigInteger.ZERO) <= 0) {
                throw new RuntimeException("nrgPrice is illegal.");
            }
            String message = null;
            TransactionMessage transactionMessage = new TransactionMessage(words, fromAddress, toAddress, amount, new BigInteger("50000"), nrgPrice);
            message = transactionMessage.getMessage();
            return ResponseUtils.normalResponse((null == message) ? "" : message);
        } catch (Exception e) {
            logger.error("newSignMessage handle error:{}", e);
            return ResponseUtils.handleExceptionResponse();
        }
    }

    /**
     * 获取nrg price
     *
     * @param data 参数
     * @return nrg price
     */
    @RequestMapper(value = "/v1/price/nrg", method = MethodEnum.POST)
    public String getNrgPrice(HashMap<String, String> data) {
        logger.info("get nrg price ... data: {}", JSON.toJSONString(data));
        try {
            String priceInfo = null;
            String url = Config.DEFAULT_SEED_PUBIP + ":" + Config.DEFAULT_SEED_HTTP_PORT + Config.GET_NRG_PRICE_URI;
            priceInfo = HttpUtils.httpPost(url, new HashMap<>());
            return StringUtils.isEmpty(priceInfo)
                    ? ResponseUtils.handleExceptionResponse() : priceInfo;
        } catch (Exception e) {
            logger.error("getNrgPrice handle error: {}", e);
            return ResponseUtils.handleExceptionResponse();
        }
    }

    private List<LocalFullNode> getLocalfullnodes() {
        try {
            String url = Config.DEFAULT_SEED_PUBIP + ":" + Config.DEFAULT_SEED_HTTP_PORT + Config.GET_LOCALFULLNODES;
            HashMap<String, String> params = new HashMap<String, String>();
            params.put("pubkey", Config.DEFAULT_PUBKEY);
            String resultStr = HttpUtils.httpPost(url, params);
            if (StringUtils.isEmpty(resultStr)) {
                logger.error("getLocalfullnodes response is null");
                return null;
            }
            JSONObject resultJson = JSONObject.parseObject(resultStr);
            if (200 != resultJson.getInteger("code")) {
                logger.error("getLocalfullnodes response code is not 200");
                return null;
            }
            List list = JSONObject.parseObject(resultJson.getString("data"), List.class);
            for (int i = list.size() - 1; i >= 0; i--) {
                LocalFullNode lfn = JSONObject.parseObject(list.get(i).toString(), LocalFullNode.class);
                list.set(i, lfn);
            }
            return list;
        } catch (Exception e) {
            logger.error("getLocalfullnodes handle error: {}", e);
            return null;
        }
    }

    private LocalFullNode getlocalfullnode() {
        try {
            List<LocalFullNode> list = getLocalfullnodes();
            int i = (int) (1 + Math.random() * 4 - 1);
            LocalFullNode lfn = list.get(i);
            return lfn;
        } catch (Exception e) {
            logger.error("getLocalfullnode handle error: {}", e);
            return null;
        }
    }


}
