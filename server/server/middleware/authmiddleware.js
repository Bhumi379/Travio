const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  

  // accept BOTH tokens
  const token = req.cookies.token || req.cookies.adminToken;

  if (!token) {
   
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    

    req.user = decoded; // contains id, role
    next();
  } catch (err) {
    console.log(" Token invalid:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
