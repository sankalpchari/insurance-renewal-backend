import InsuranceProvider from "../models/InsuranceProvider.model.js";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import InsuranceDetails from "../models/insuranceDetails.model.js";
import DoctorDetails from "../models/doctors.model.js";
import EmailStatus from "../models/emailStatus.model.js";
import { Sequelize } from "sequelize";
import { raw } from "mysql2";

export const getDashboardStats = async (req, res) => {
    try {
        // Count the total entries in both tables
        const receipientCount = await InsuranceReceipient.count();
        const providerCount = await InsuranceProvider.count();
        const doctors = await DoctorDetails.count();

        const monthlyRenewalCounts = await EmailStatus.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.col('created_at')), 'year'],
                [Sequelize.fn('MONTH', Sequelize.col('created_at')), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_renewals']
            ],
            group: [
                Sequelize.fn('YEAR', Sequelize.col('created_at')),
                Sequelize.fn('MONTH', Sequelize.col('created_at'))
            ],
            order: [
                [Sequelize.fn('YEAR', Sequelize.col('created_at')), 'ASC'],
                [Sequelize.fn('MONTH', Sequelize.col('created_at')), 'ASC']
            ],
            raw:true
        });

        console.log(monthlyRenewalCounts);



        return res.status(200).json({
            success: true,
            data: {
                receipient:receipientCount,
                provider:providerCount,
                doctors,
                insurance:monthlyRenewalCounts
            }
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "Failed to get dashboard stats"
        });
    }
};
