const jwt = require('jsonwebtoken');
const config = require('config');

const authMiddleware = (req, res, next) => {

    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorisation denied' })
    }

    try {

        const decodedToken = jwt.verify(token, config.get('jwtSecret'));
        req.user = decodedToken.user;
        next();

    } catch (e) {
        return res.status(401).json({ message: 'Invalid Token' })
    }


}

module.exports = authMiddleware;