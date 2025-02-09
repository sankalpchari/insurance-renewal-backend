import crypto from "crypto";
const algorithm = "aes-256-cbc";
const secretKey = process.env.DB_ENCRYPTION_KEY;
const iv = crypto.randomBytes(16);

export const encryptData = (data) => {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptData = (encryptedData) => {
    const [ivHex, encryptedText] = encryptedData.split(":");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "hex"), Buffer.from(ivHex, "hex"));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
