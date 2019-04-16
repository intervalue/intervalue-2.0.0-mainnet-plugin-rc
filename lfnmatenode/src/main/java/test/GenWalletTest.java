package test;

import one.inve.bean.wallet.Wallet;
import one.inve.bean.wallet.WalletBuilder;

/**
 * Generate wallet demo
 */
public class GenWalletTest {
    public static void main(String[] args) {
        Wallet wallet = null;
        try {
            wallet = WalletBuilder.generateWallet();
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("wallet address:"+wallet.getAddress());
        System.out.println("wallet mnemonic word:"+wallet.getMnemonic());
        System.out.println("wallet main private key:"+wallet.getKeys().getPrivKey());
        System.out.println("wallet main public key:"+wallet.getKeys().getPubKey());
        System.out.println("wallet extend private key:"+wallet.getExtKeys().getPrivKey());
        System.out.println("wallet extend public key:"+wallet.getExtKeys().getPubKey());
    }
}
