package one.inve.beans;

public class LocalFullNode {

    private long httpPort;
    private String ip;
    private long rpcPort;
    private int status;
    private int type;

    public long getHttpPort() {
        return httpPort;
    }

    public void setHttpPort(long httpPort) {
        this.httpPort = httpPort;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public long getRpcPort() {
        return rpcPort;
    }

    public void setRpcPort(long rpcPort) {
        this.rpcPort = rpcPort;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public int getType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }
}
