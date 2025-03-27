import Joi from 'joi';

export const insuranceDetailsSchema = Joi.object({
    provider_id: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"provider_id" must be a number',
            'number.integer': '"provider_id" must be an integer',
            'any.required': '"provider_id" is required'
        }),
    recipient_name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.base': '"recipient_name" must be a string',
            'string.min': '"recipient_name" must be at least 3 characters long',
            'string.max': '"recipient_name" must be less than or equal to 100 characters long',
            'any.required': '"recipient_name" is required'
        }),
    recipient_ma: Joi.string()
        .required()
        .messages({
            'string.base': '"recipient_ma" must be a string',
            'any.required': '"recipient_ma" is required'
        }),
    doctor_id: Joi.number().optional()
        .integer()
        .allow(null) // Allowing null if it's not required
        .messages({
            'number.base': '"doctor_id" must be a number',
            'number.integer': '"doctor_id" must be an number',
        }),
    prsrb_prov: Joi.string().trim().optional().allow(''),
    from_service_date: Joi.date()
        .iso()
        .required()
        .messages({
            'date.base': '"from_service_date" must be a valid date',
            'any.required': '"from_service_date" is required'
        }),
    to_service_date: Joi.date()
        .iso()
        .greater(Joi.ref('from_service_date'))
        .required()
        .messages({
            'date.base': '"to_service_date" must be a valid date',
            'any.required': '"to_service_date" is required',
            'date.greater': '"to_service_date" must be greater than "from_service_date"'
        }),
    recipient_is: Joi.string()
        .required()
        .messages({
            'string.base': '"recipient_is" must be a string',
            'any.required': '"recipient_is" is required'
        }),
    procedure_code: Joi.string()
        .required()
        .messages({
            'string.base': '"procedure_code" must be a string',
            'any.required': '"procedure_code" is required'
        }),
    units: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"units" must be a number',
            'number.integer': '"units" must be an number',
            'any.required': '"units" is required'
        }),
    plan_of_care: Joi.string()
        .required()
        .messages({
            'string.base': '"plan_of_care" must be a string',
            'any.required': '"plan_of_care" is required'
        }),
      global_hours_per_week:Joi.number()
        .positive()
        .integer()
        .required()
        .messages({
          'number.base': 'Global Hours Per Week is required',
          'number.positive': 'Global Hours Per Week must be more then 0',
          'number.integer': 'Global Hours Per Week must be an number',
        }),
    number_of_days: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"number_of_days" must be a number',
            'number.integer': '"number_of_days" must be an number',
            'any.required': '"number_of_days" is required'
        }),
    max_per_day: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"max_per_day" must be a number',
            'number.integer': '"max_per_day" must be an number',
            'any.required': '"max_per_day" is required'
        }),
    max_per_day_unit: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"max_per_day_unit" must be a number',
            'number.integer': '"max_per_day_unit" must be an number',
            'any.required': '"max_per_day_unit" is required'
        }),
    insurance_status: Joi.string()
        .allow(null) // Allowing null if it's not required
        .messages({
            'string.base': '"insurance_status" must be a string',
        }),
    mmis_entry: Joi.string()
        .allow(null) // Allowing null if it's not required
        .messages({
            'string.base': '"mmis_entry" must be a string',
        }),
    rsn: Joi.string()
        .allow(null) // Allowing null if it's not required
        .messages({
            'string.base': '"rsn" must be a string',
        }),
    comment_pa: Joi.string()
        .allow(null) // Allowing null if it's not required
        .messages({
            'string.base': '"comment_pa" must be a string',
        })
});


// Define Joi schema for provider data
export const providerSchema = Joi.object({
    provider_name: Joi.string()
        .min(2)
        .required()
        .messages({
            'string.empty': 'Provider name is required',
            'string.min': 'Provider name must be at least 2 characters'
        }),

    phone_no_1: Joi.string()
        .pattern(/^\d{3}-\d{3}-\d{4}$/)
        .required()
        .messages({
            'string.empty': 'Phone number 1 is required',
            'string.pattern.base': 'Phone number 1 must be a valid phone number'
        }),

    phone_no_2: Joi.string()
        .allow('', null)  // Allow empty or null values
        .optional()       // Make it optional
        .pattern(/^\d{3}-\d{3}-\d{4}$/)  // Only validate if it's present
        .messages({
            'string.pattern.base': 'Phone number 2 must be a valid phone number'
        }),
    is_default: Joi.boolean()
        .optional(),
    provider_code: Joi.string()
        .required()
        .messages({'string.empty': 'Provider code is required'}),
    provider_email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Provider email is required',
            'string.email': 'Provider email must be a valid email address'
        })
});



export const insuranceFormSchema = Joi.object({
  comment: Joi.string().allow("").optional(),
    comment_pa: Joi.string().required().messages({
      'string.empty': 'PA Comment is required',
    }),
    doctor_name: Joi.string().required().messages({
      'string.empty': 'Doctor name is required',
    }),
    doctor_number: Joi.string()
      .pattern(/^1?-?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(\s?(x|ext\.?|extension)\s?\d{1,5})?$/)
      .required()
      .messages({
        'string.pattern.base': 'Doctor phone number must be numeric',
        'string.empty': 'Doctor number is required',
      }),
    from_service_date: Joi.date().required().messages({
      'date.base': 'From date is required',
    }),
    insurance_status: Joi.string()
      .valid('active', 'pending', 'closed')
      .required()
      .messages({
        'any.only': 'Invalid insurance status',
      }),
    provider_id:Joi.number(),
    global_hours_per_week:Joi.number()
    .positive()
    .integer()
    .required()
    .messages({
      'number.base': 'Global Hours Per Week is required',
      'number.positive': 'Global Hours Per Week must be positive',
      'number.integer': 'Global Hours Per Week must be an number',
    }),
    max_per_day: Joi.number()
      .positive()
      .integer()
      .required()
      .messages({
        'number.base': 'Max per day is required',
        'number.positive': 'Max per day must be positive',
        'number.integer': 'Max per day must be an number',
      }),
    max_per_day_unit: Joi.number()
      .positive()
      .integer()
      .required()
      .messages({
        'number.base': 'Units are required',
        'number.positive': 'Units must be positive',
        'number.integer': 'Units must be an number',
      }),
    mmis_entry: Joi.string().required().messages({
      'string.empty': 'MMIS entry is required',
    }),
    number_of_days: Joi.number()
      .positive()
      .integer()
      .required()
      .messages({
        'number.base': 'Number of days is required',
        'number.positive': 'Number of days must be positive',
        'number.integer': 'Number of days must be an number',
      }),
    plan_of_care: Joi.string().required().messages({
      'string.empty': 'Plan of care is required',
    }),
    procedure_code: Joi.string()
      .valid('T1002', 'T1003', 'T1004')
      .required()
      .messages({
        'any.only': 'Procedure code is required',
      }),
    procedure_units: Joi.number().optional().allow(null),
    provider_name: Joi.string().required().messages({'string.empty': 'Provider name is required',}),
    provider_number: Joi.string().pattern(/^[0-9]+$/).required().messages({ 'string.pattern.base': 'Provider number must be numeric', 'string.empty': 'Provider number is required',}),
    prsrb_prov: Joi.string().trim().optional().allow(''),
    recipient_is: Joi.string()
      .valid('MW', 'REM', 'REM OPT MODEL WAIVER')
      .required()
      .messages({
        'any.only': 'Invalid recipient status',
      }),
    recipient_ma: Joi.string().required().messages({
      'string.empty': 'Recipient MA number is required',
    }),
    recipient_name: Joi.string().required().messages({
      'string.empty': 'Recipient name is required',
    }),
    rsn: Joi.string().required().messages({
      'string.empty': 'RSN is required',
    }),
    sender: Joi.string().required().messages({
      'string.empty': 'Sender is required',
    }),
    sender_date: Joi.date().required().messages({
      'date.base': 'Sender date is required',
    }),
    to_service_date: Joi.date()
      .greater(Joi.ref('from_service_date'))
      .required()
      .messages({ 'date.greater': 'To date must be after From date', 'date.base': 'To date is required',}),
    save_type:Joi.string().optional().allow(null),
    pa:Joi.string()
    .valid('NEW', 'RENEWAL', 'OTHERS')
    .required()
    .messages({
      'any.only': 'Please select PA',
    }),
    dob: Joi.date().iso().required(),
  });



export const simpleRenewalSchema = Joi.object({
  from_service_date: Joi.date()
    .required()
    .label('From Service Date')
    .messages({
      'date.base': '"From Service Date" must be a valid date',
      'any.required': '"From Service Date" is required'
    }),
  
  to_service_date: Joi.date()
    .greater(Joi.ref('from_service_date'))
    .required()
    .label('To Service Date')
    .messages({
      'date.base': '"To Service Date" must be a valid date',
      'date.greater': '"To Service Date" must be after "From Service Date"',
      'any.required': '"To Service Date" is required'
    }),

  plan_of_care: Joi.string()
    .required()
    .label('Plan of Care')
    .messages({
      'string.base': '"Plan of Care" must be a string',
      'any.required': '"Plan of Care" is required'
    }),
  send_email:Joi.number().optional()
});
  