import InsuranceProvider from "../models/InsuranceProvider.model.js";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import InsuranceDetails from "../models/insuranceDetails.model.js";
import DoctorDetails from "../models/doctors.model.js";
import EmailStatus from "../models/emailStatus.model.js";
import sequelize,{ Op, literal, col } from 'sequelize';

export const getDashboardStats = async (req, res) => {
    try {

        const currentDate = new Date();
        
        // Upcoming insurance renewals with joins
        const upcomingRenewals = await InsuranceDetails.findAll({
          where: {
              is_active: 1,
              is_draft: 0,
              record_type: 1,
              to_service_date: { [Op.gte]: currentDate }, // Future expiry date
              [Op.and]: literal('DATEDIFF(to_service_date, NOW()) <= 10') // At most 10 days left
          },
          attributes: {
              include: [
                  [literal('DATEDIFF(to_service_date, NOW())'), 'daysUntilExpiry'],
              ],
          },
          include: [
              { model: InsuranceProvider, as: 'InsuranceProvider', attributes: ['provider_name'] },
              { model: DoctorDetails, as: 'DoctorDetail', attributes: ['doctor_name'] },
              { model: InsuranceReceipient, as: 'InsuranceReceipient', attributes: ['ID', 'name', 'receipient_ma'] },
          ],
          attributes: {
              include: [
                  [sequelize.col('InsuranceProvider.provider_name'), 'provider_name'],
                  [sequelize.col('DoctorDetail.doctor_name'), 'doctor_name'],
                  [sequelize.col('InsuranceReceipient.ID'), 'receipient_ID'],
                  [sequelize.col('InsuranceReceipient.name'), 'receipient_name'],
                  [sequelize.col('InsuranceReceipient.receipient_ma'), 'receipient_ma'],
                  [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                  [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
              ]
          },
          order: [[literal('DATEDIFF(to_service_date, NOW())'), 'ASC']], // Sort by soonest expiry
          limit: 3,
          raw: true,
      });
      

        // Recent renewals with joins
        const recentRenewals = await InsuranceDetails.findAll({
            where: {
              is_active: 1,
              is_draft:0,
              record_type:1
            },
            attributes: {
              include: [
                [literal('DATEDIFF(NOW(), created_date)'), 'daysSinceRenewal'],
              ],
            },
            include: [
                { model: InsuranceProvider, as: 'InsuranceProvider', attributes: ['provider_name']},
                { model: DoctorDetails, as: 'DoctorDetail', attributes: ['doctor_name']},
                { model: InsuranceReceipient, as: 'InsuranceReceipient', attributes: ['name','receipient_ma']},
              ],
              attributes: {
                  include: [
                      [sequelize.col('InsuranceProvider.provider_name'), 'provider_name'],
                      [sequelize.col('DoctorDetail.doctor_name'), 'doctor_name'],
                      [sequelize.col('InsuranceReceipient.name'), 'receipient_name'],
                      [sequelize.col('InsuranceReceipient.receipient_ma'), 'receipient_ma'],
                      [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                      [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
                  ]
              },
            order: [[literal('DATEDIFF(NOW(), created_date)'), 'DESC']],
            limit: 3,
            raw:true
        });

        return res.status(200).json({
            success: true,
            data: {
                upcomingRenewals,
                recentRenewals,
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            success: false,
            message: "Failed to get dashboard stats",
        });
    }
};
