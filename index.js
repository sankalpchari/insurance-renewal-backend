import dotenvx from "@dotenvx/dotenvx";
dotenvx.config(); 
import sequelize from "./config/db.js";
import express from "express";
import cors from "cors";
import "./models/initalizeModels.js";
import path from "path"
import { authRouter, doctorRoutes, insuranceRouter, InsuranceReceipientRouter, userRoutes, dashboardStats} from "./routes/routes.js"
import { fileURLToPath } from 'url';
import "./services/email.service.js";
import rateLimit from 'express-rate-limit';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);


const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  });
  
  // Apply the rate limiter to all requests
app.use(limiter);

//================== app.use begins =============================

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
//===================== app.use ends ============================

//===================== app routes begins ========================


app.get(`/`, (req, res) => {
    res.send(" API is running ....");
});

app.use(`${process.env.URL_PREFIX}/auth`,authRouter);
app.use(`${process.env.URL_PREFIX}/doctors`,doctorRoutes);
app.use(`${process.env.URL_PREFIX}/insurance`,insuranceRouter);
app.use(`${process.env.URL_PREFIX}/insurance-receipient`, InsuranceReceipientRouter);
app.use(`${process.env.URL_PREFIX}/users`, userRoutes)
app.use(`${process.env.URL_PREFIX}/dashboard`, dashboardStats)
// future use

// app.use(`${process.env.URL_PREFIX}/auth`,authRouter)

//==================== app.use ends ==============================


app.listen(process.env.PORT, ()=>{
    console.log(`app running on port ${process.env.PORT}`)
});



