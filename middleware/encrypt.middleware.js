import { encryptData } from "../config/dataEncryption.js"; // Import encryption utility

export const encryptionMiddleware = () => {
    return (req, res, next) => {
      // Store the original res.json function
      const originalJson = res.json;
      
      // Override the res.json function
      res.json = function (data) {
        // Skip encryption if specifically requested
        if (req.skipEncryption) {
          return originalJson.call(this, data);
        }
  
        try {
          const encryptedResponse = {
            encryptedData: encryptData(data),
            timestamp: Date.now()
          };
          
          return originalJson.call(this, encryptedResponse);
        } catch (error) {
          console.error('Response encryption failed:', error);
          return res.status(500).json({ 
            error: 'Internal server error', 
            message: 'Failed to encrypt response' 
          });
        }
      };
  
      // Also handle res.send for cases where it's used with objects
      const originalSend = res.send;
      res.send = function (data) {
        // Only encrypt if the data is an object/array and encryption isn't skipped
        if (typeof data === 'object' && !req.skipEncryption) {
          return res.json(data);
        }
        return originalSend.call(this, data);
      };
  
      next();
    };
  };