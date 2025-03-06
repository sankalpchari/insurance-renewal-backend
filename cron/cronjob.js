import cron from "node-cron";
import InsuranceDetails from "../models/insuranceDetails.model.js";
import InsuranceProvider from "../models/InsuranceProvider.model.js";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import DoctorDetails from "../models/doctors.model.js";
import EmailStatus from "../models/emailStatus.model.js";
import sequelize,{ Op, literal, col, where } from 'sequelize';
import {createEmailBody, sendMailgunEmail} from "../services/email.service.js";
import Settings from "../models/setting.model.js";
import { raw } from "mysql2";
import User from "../models/users.model.js";

export function startCron(){
    cron.schedule('* * * * *', async() => {
        try{
            let users = await User.findAll({
                attributes:['email'],
                where:{
                    is_deleted:0
                }, 
                raw :true
            });

            users = users.map(usr=>usr.email);
            const renewals = await InsuranceDetails.findAll({
                where: {
                    is_active: 1,
                    is_draft: 0,
                    record_type: 1,
                },
                attributes: {
                    include: [
                        [sequelize.col('InsuranceProvider.provider_name'), 'provider_name'],
                        [sequelize.col('InsuranceReceipient.ID'), 'recipient_ID'],
                        [sequelize.col('InsuranceReceipient.name'), 'recipient_name'],
                        [sequelize.col('InsuranceReceipient.recipient_ma'), 'recipient_ma'],
                        [literal('DATEDIFF(to_service_date, NOW())'), 'daysUntilExpiry'],
                        [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                        [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
                    ],
                },
                include: [
                    { model: InsuranceProvider, as: 'InsuranceProvider', attributes: ['provider_name'] },
                    { model: InsuranceReceipient, as: 'InsuranceReceipient', attributes: ['ID', 'name', 'recipient_ma'] },
                ],
                order: [[literal('DATEDIFF(to_service_date, NOW())'), 'ASC']], // Sort by soonest expiry
                raw: true,
            });

            const categorizedRenewals = {
                overdue: renewals.filter(r => r.daysUntilExpiry < 0),
                dueIn5Days: renewals.filter(r => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 5),
                dueIn1Week: renewals.filter(r => r.daysUntilExpiry >= 6 && r.daysUntilExpiry <= 7),
                dueIn1Month: renewals.filter(r => r.daysUntilExpiry >= 8 && r.daysUntilExpiry <= 30),
            };


            let total = 0
            for(const key in categorizedRenewals){
                total += categorizedRenewals[key].length
            }
 

            categorizedRenewals["siteUrl"] = process.env.FE_URL;
            categorizedRenewals["total"] = total

            const body = await createEmailBody("insuranceStats",categorizedRenewals);

            const usersList = users?.join(",") || process.env.DEFAULT_EMAIL; 
            const date = new Date().toISOString().split("T")[0];
            const subject = "Authorization Renewal Report for :"+ date

            await sendMailgunEmail({
                to: usersList,
                subject: subject,
                html: body
            });

            console.log("Daily email sent to user");

        }catch(e){
            console.log(e);
        }
      
    });
}
