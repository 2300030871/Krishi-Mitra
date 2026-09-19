const Razorpay = require('razorpay');

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  return {
    keyId,
    keySecret,
    enabled: Boolean(keyId && keySecret),
  };
};

const createRazorpayClient = () => {
  const config = getRazorpayConfig();

  if (!config.enabled) {
    return null;
  }

  return new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });
};

module.exports = {
  getRazorpayConfig,
  createRazorpayClient,
};
