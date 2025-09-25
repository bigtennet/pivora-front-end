const { Users } = require("../models/users.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.tokenRequired = async (req, res, next) => {
     console.log('🔐 Auth middleware hit for:', req.method, req.path);
     console.log('📋 Headers:', req.headers);
     
     const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.accesstoken;
     
     if (!token) {
          console.log('❌ No token found');
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });

          const user = await Users.findOne({
               _id: decodedToken._id,
          });
          if (!user) {
               return res.status(401).json({
                    status: false,
                    message: "You've got some errors.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const { password, ...userData } = user._doc;
          req.user = userData;

          next();
     } catch (error) {
          console.error('Token validation failed', { error: error.message });
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};
