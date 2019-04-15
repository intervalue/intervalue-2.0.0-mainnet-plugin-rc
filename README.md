
#  intervalue-2.0.0-mainnet-plugin-rc

## diamondnode
The diamondnode contains a full ledge which is retrieved after reaching a consensus via foundation nodes.

### installation/configuration/starting instruction
* install nodejs 8.11.3 or above/dependent packages
* install mysql,create custom database and run sql script file in **lfnmatenode/db_sever/db.sql**
* install redis
* checkout diamondnode/db_server/config.js items in accordance with your actual mysql,redis 
* open a port 9000(which allows lfnmatenode to have a connection) in the firewall
* running diamondnode via typing "node diamondnode/bin/cluster.js"



## lfnmatenode
The lfnmatenode provides a ease-of-use approach to generate wallet,commit transactions and have access to diamondnode to verify final transaction state.

### installation/configuration/starting instruction
* install jdk 1.8.0_181 or above
* replace this with custom ip setting(**lfnmatenode/src/main/java/one/inve/core**) which points to a diamondnode address.
```java
    public static final String DEFAULT_NODE_PUBIP = "http://172.17.2.222";
```
* start lfnmatenode by running main-class one.inve.node.Main
