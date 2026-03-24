const jwt = require('jsonwebtoken');  

module.exports = (req, res, next) => {
  try {
    const token =  req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Admin not logged in" });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }
    
    req.admin = decoded;
    next();
  } catch(err){
    console.log("Middleware error:", err.message); 
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
