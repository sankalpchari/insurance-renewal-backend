import dotenvx from "@dotenvx/dotenvx";
dotenvx.config(); 
import sequelize from "./config/db.js";
import express from "express";
import cors from "cors";
import "./models/initalizeModels.js";
import path from "path"
import { authRouter, doctorRoutes, insuranceRouter, InsuranceRecipientRouter, userRoutes, dashboardStats, settingsRouter} from "./routes/routes.js"
import { fileURLToPath } from 'url';
import "./services/email.service.js";
import rateLimit from 'express-rate-limit';
import {encryptionMiddleware} from "./middleware/encrypt.middleware.js";
import { decryptData } from "./config/dataEncryption.js";
import { startCron } from "./cron/cronjob.js"; 

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);


const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  });

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
  
  // Apply the rate limiter to all requests
app.use(limiter);

//================== app.use begins =============================

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(decryptData);
app.use(encryptionMiddleware());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
//===================== app.use ends ============================

//===================== app routes begins ========================


app.get(`/`, (req, res) => {
    res.send(" API is running ....");
});
// app.use(decryptData);
app.use(`${process.env.URL_PREFIX}/auth`,authRouter);
app.use(`${process.env.URL_PREFIX}/doctors`,doctorRoutes);
app.use(`${process.env.URL_PREFIX}/insurance`,insuranceRouter);
app.use(`${process.env.URL_PREFIX}/insurance-receipient`, InsuranceRecipientRouter);
app.use(`${process.env.URL_PREFIX}/users`, userRoutes)
app.use(`${process.env.URL_PREFIX}/dashboard`, dashboardStats)
app.use(`${process.env.URL_PREFIX}/settings`, settingsRouter)
// future use

// app.use(`${process.env.URL_PREFIX}/auth`,authRouter)

//==================== app.use ends ==============================


// cron jobs 

// startCron();
app.listen(process.env.PORT, ()=>{
    console.log(`app running on port ${process.env.PORT}`)
});



