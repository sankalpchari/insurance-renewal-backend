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
    doctor_id: Joi.number()
        .integer()
        .allow(null) // Allowing null if it's not required
        .messages({
            'number.base': '"doctor_id" must be a number',
            'number.integer': '"doctor_id" must be an integer',
        }),
    prsrb_prov: Joi.string()
        .required()
        .messages({
            'string.base': '"prsrb_prov" must be a string',
            'any.required': '"prsrb_prov" is required'
        }),
    pa: Joi.string()
        .required()
        .messages({
            'string.base': '"pa" must be a string',
            'any.required': '"pa" is required'
        }),
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
            'number.integer': '"units" must be an integer',
            'any.required': '"units" is required'
        }),
    plan_of_care: Joi.string()
        .required()
        .messages({
            'string.base': '"plan_of_care" must be a string',
            'any.required': '"plan_of_care" is required'
        }),
    number_of_days: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"number_of_days" must be a number',
            'number.integer': '"number_of_days" must be an integer',
            'any.required': '"number_of_days" is required'
        }),
    max_per_day: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"max_per_day" must be a number',
            'number.integer': '"max_per_day" must be an integer',
            'any.required': '"max_per_day" is required'
        }),
    max_per_day_unit: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': '"max_per_day_unit" must be a number',
            'number.integer': '"max_per_day_unit" must be an integer',
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
        .pattern(/^\d{3}-\d{3}-\d{4}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Phone number 2 must be a valid phone number'
        }),
    is_default: Joi.boolean()
        .optional(),
    provider_code: Joi.string()
        .required()
        .messages({'string.empty': 'Provider code is required'}),
});



export const insuranceFormSchema = Joi.object({
    comment: Joi.string().required().messages({
      'string.empty': 'Comment is required',
    }),
    comment_pa: Joi.string().required().messages({
      'string.empty': 'PA Comment is required',
    }),
    doctor_name: Joi.string().required().messages({
      'string.empty': 'Doctor name is required',
    }),
    doctor_number: Joi.string()
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Doctor number must be numeric',
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
    max_per_day: Joi.number()
      .positive()
      .integer()
      .required()
      .messages({
        'number.base': 'Max per day is required',
        'number.positive': 'Max per day must be positive',
        'number.integer': 'Max per day must be an integer',
      }),
    max_per_day_unit: Joi.number()
      .positive()
      .integer()
      .required()
      .messages({
        'number.base': 'Units are required',
        'number.positive': 'Units must be positive',
        'number.integer': 'Units must be an integer',
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
        'number.integer': 'Number of days must be an integer',
      }),
    pa: Joi.string().valid('NEW', 'RENEWAL', 'OTHERS').required().messages({
      'any.only': 'PA status is required',
    }),
    plan_of_care: Joi.string().required().messages({
      'string.empty': 'Plan of care is required',
    }),
    procedure_code: Joi.string()
      .valid('TI003', 'TI002', 'TI004')
      .required()
      .messages({
        'any.only': 'Procedure code is required',
      }),
    procedure_val: Joi.number()
      .optional()
      .allow(null)
      .when('procedure_code', {
        is: 'TI003',
        then: Joi.required().messages({
          'any.required': 'Procedure units for TI003 are required',
        }),
      }),
    provider_name: Joi.string().required().messages({
      'string.empty': 'Provider name is required',
    }),
    provider_number: Joi.string()
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Provider number must be numeric',
        'string.empty': 'Provider number is required',
      }),
    prsrb_prov: Joi.string().required().messages({
      'string.empty': 'Prescription provider is required',
    }),
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
    time: Joi.string().required().messages({
      'string.empty': 'Time is required',
    }),
    to_service_date: Joi.date()
      .greater(Joi.ref('from_service_date'))
      .required()
      .messages({
        'date.greater': 'To date must be after From date',
        'date.base': 'To date is required',
      }),
  });
  