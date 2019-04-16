
-- ----------------------------
-- Table structure for t_transactions_0
-- ----------------------------
DROP TABLE IF EXISTS `t_transactions_0`;
CREATE TABLE `t_transactions_0` (
  `hash` varchar(255) NOT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `fee` bigint(20) DEFAULT NULL,
  `addressFrom` varchar(32) DEFAULT NULL,
  `addressTo` varchar(32) DEFAULT NULL,
  `result` varchar(20) DEFAULT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `amount_point` bigint(20) DEFAULT NULL,
  `fee_point` bigint(20) DEFAULT NULL,
  `creation_date` varchar(20) DEFAULT NULL,
  `type` bigint(20) DEFAULT NULL,
  `snapVersion` bigint(20) DEFAULT NULL,
  `nrgPrice` varchar(20) DEFAULT NULL,
  `eHash` varchar(255) DEFAULT NULL,
  `isStable` int(11) DEFAULT NULL,
  `isValid` int(11) DEFAULT NULL,
  `lastIdx` int(11) DEFAULT NULL,
  `pubkey` varchar(255) DEFAULT NULL,
  `timeStamp` varchar(20) DEFAULT NULL,
  `id` varchar(255) DEFAULT NULL,
  `vers` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`hash`),
  KEY `address` (`addressFrom`,`addressTo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for t_transactions_index
-- ----------------------------
DROP TABLE IF EXISTS `t_transactions_index`;
CREATE TABLE `t_transactions_index` (
  `address` varchar(255) NOT NULL,
  `tableIndex` bigint(255) DEFAULT NULL,
  `offset` bigint(255) DEFAULT NULL,
  PRIMARY KEY (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
