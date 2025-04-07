import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.KeyGenerator;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class AES {

    public static AES cipherInstance = null;
    public static final String unicode = "UTF-8";
    public static final String algorithm = "AES";

    private AES(){

    }
    public static AES getInstance(){
        if(cipherInstance == null){
            cipherInstance = new AES();
        }
        return cipherInstance;
    }

    public String encrypt(String data, String key) {
        return "";
    }
    public String decrypt(String data, String key) {
        return "";
    }
}
