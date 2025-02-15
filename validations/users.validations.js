import Joi from 'joi';

export const userCreate = Joi.object({
    f_name: Joi.string().min(2).max(50).required(),
    l_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    role_id: Joi.number().integer().required(),
    permission:Joi.array().optional()
});
