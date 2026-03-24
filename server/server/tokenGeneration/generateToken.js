require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.createSecretToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn: 3 * 24 * 60 * 60,
  });
};

//header.payload.signature token format  Header - Says "I'm a JWT"
//Payload - The data (like userId: "123456")
//Signature - Proves it's not fake