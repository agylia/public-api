// dependencies

const crypto = require('crypto');
const superagent = require('superagent');


// globals

const API_ROUTE = "https://api.portal-agylia.com/ValidateSignature";
const API_USERNAME = "<your username>";
const API_KEY = "<your API key>";
const USER_USERNAME = "testuser";
const USER_PASSWORD = "testpassword";


// helpers

function buildSignature(apiKey, username, password) {
  const key = crypto.createHash('md5').update(apiKey).digest('hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  const rawData = ":u:" + username + ":p:" + password + ":t:" + new Date().toISOString();
  const encryptedData = cipher.update(rawData);
  const cipherText = Buffer.concat([encryptedData, cipher.final()]);

  return Buffer.concat([iv, cipherText]).toString('base64')
}


// main

superagent
  .post(API_ROUTE)
  .auth(API_USERNAME, API_KEY)
  .send({
    params: {
      signature: buildSignature(
        API_KEY,
        USER_USERNAME,
        USER_PASSWORD)
    }
  })
  .set('accept', 'json')
  .end((err, res) => {
    if (err) {
      console.log("ERR! " + err.status);
    } else {
      console.log(res.status + " - " + res.text);
    }
  });
