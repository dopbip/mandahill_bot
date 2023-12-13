const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '8000',
    Meta_WA_VerifyToken: 'happy_panda_in_space',
    Meta_WA_accessToken: 'EAAICMPLTiqUBACkDS295GYCxYMgHdXheHaPnXiIa2WWL8Cl1ZAONUi4nkC7UGE1FlkGwttzrCxDPNmSOtB6kuZACuV05PjZCF2fXoGOxt7iw1P3TFv8oOGgkXezBx9xQy8XN9FZACZCQa8WoC9jJu3US2DBfFLZCeZBUx7Y2Tsi7gEUFtjZCqDBQ7a2CaDVVHOZAYswt0MSedjYbkAeBW8hsj',
    Meta_WA_SenderPhoneNumberId: '118618771205644',
    Meta_WA_wabaId: '118416884561172',
};

const fallback = {
    ...process.env,
    NODE_ENV: undefined,
};

module.exports = (environment) => {
    console.log(`Execution environment selected is: "${environment}"`);
    if (environment === 'production') {
        return production;
    } else if (environment === 'development') {
        return development;
    } else {
        return fallback;
    }
};