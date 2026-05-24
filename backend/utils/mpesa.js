const axios = require('axios');
const moment = require('moment');

/**
 * GET ACCESS TOKEN
 */
async function getAccessToken() {

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`
      }
    }
  );

  return response.data.access_token;
}

/**
 * STK PUSH
 */
async function stkPush(phone, amount) {

  const token = await getAccessToken();

  const timestamp = moment().format('YYYYMMDDHHmmss');

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,

      TransactionType: "CustomerPayBillOnline",

      Amount: amount,

      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,

      PhoneNumber: phone,

      CallBackURL: process.env.MPESA_CALLBACK_URL,

      AccountReference: "EarnHub",

      TransactionDesc: "Withdrawal"
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
}

module.exports = { stkPush };