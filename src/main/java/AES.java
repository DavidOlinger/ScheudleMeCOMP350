import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.KeyGenerator;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class AES {

    public static AES cipherInstance = null;

    private AES(){

    }
    public static AES getInstance(){
        if(cipherInstance == null){
            cipherInstance = new AES();
        }
        return cipherInstance;
    }

    public String encrypt(String data, String key) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes("UTF-8"), "AES");
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedData = cipher.doFinal(data.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(encryptedData);
        } catch (Exception e){
            System.err.println(e);
            return "ENCRYPTION FAILURE";
        }
    }
    public String decrypt(String data, String key) {
        return "";
    }
}
