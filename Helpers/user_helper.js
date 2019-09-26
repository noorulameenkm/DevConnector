const bcrypt = require('bcrypt');
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const config = require('config');
const jwtSecret = config.get('jwtSecret');

const encryptPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10)
            .then(salt => bcrypt.hash(password, salt))
            .then(encPass => resolve(encPass))
            .catch(err => reject(err));
    })
}

const getJwtToken = (userData) => {
    return new Promise((resolve, reject) => {
        const payload = {
            user: {
                id: userData.id
            }
        }
        jwt.sign(payload, jwtSecret, { expiresIn: 360000 }, (err, token) => {
            if (err)
                reject(err);
            else
                resolve(token);
        })
    })
}

module.exports = {
    encryptPassword,
    getJwtToken
}