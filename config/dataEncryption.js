import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) throw new Error("Encryption key is missing.");

// Encrypt data
export const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};


export const decryptData = (req, res, next) => {
    try {
      if (req.is("multipart/form-data")) {
        if (!req.body) {
          return res.status(400).json({ error: "No form data received" });
        }
  
        // Decrypt text fields while keeping files intact
        for (const key in req.body) {
          try {
            const encryptedValue = req.body[key];
  
            if (typeof encryptedValue !== "string") continue;
  
            const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
            let decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
  
            if (!decryptedValue) throw new Error(`Invalid decryption for key: ${key}`);
  
            // 🔹 Fix extra quotes issue
            decryptedValue = JSON.parse(decryptedValue); 
  
            req.body[key] = decryptedValue;
          } catch (error) {
            console.error(`Decryption error for field ${key}:`, error);
            return res.status(400).json({ error: `Failed to decrypt field: ${key}` });
          }
        }
  
        return next();
      }
  
      // Handle normal JSON requests
      const { encryptedData } = req.body;
  
      if (encryptedData) {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        let jsonString = bytes.toString(CryptoJS.enc.Utf8);
  
        if (!jsonString) throw new Error("Invalid decryption output");
  
        req.body = JSON.parse(jsonString);
      }
  
      next();
    } catch (error) {
      console.error("Decryption error:", error);
      res.status(400).json({ error: "Failed to decrypt data" });
    }
  };

