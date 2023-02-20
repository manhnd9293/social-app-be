const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({message: "No token provided!"});
    }
    const jwtSecret = process.env.JWT_SECRET;
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).send({message: "Fail to authenticate user!"});
        }
        req.accessToken = token;
        req.userId = decoded.id;
        next();
    });
};

module.exports = {
    verifyToken
};