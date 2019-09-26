const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../Models/User');
const gravatar = require('gravatar');
const userHelpers = require('../../Helpers/user_helper');

// @route POST api/users
// @desc register user
// @access PUBLIC
router.post('/', [
    check('name').not().isEmpty().withMessage('Please provide a name'),
    check('email').isEmail().withMessage('Should provide a valid Email address'),
    check('password').not().isEmpty().withMessage('Should provide a password')
    .isLength({ min: 6 }).withMessage('Password length should be minimum 6 characters')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // check the user exists or not
    User.findOne({ email })
        .then(user => {
            if (user) {
                return res.status(500).json({ errors: [{ message: 'User already exists' }] });
            } else {
                // find the gravatar link
                const gravatarUrl = gravatar.url(email, {
                    s: '200',
                    r: 'pg',
                    d: 'mm'
                });

                // new User Details
                const newUser = new User({
                    name,
                    email,
                    password,
                    avatar: gravatarUrl.slice(2)
                })

                // Encrypt the password
                userHelpers.encryptPassword(password)
                    .then(encPass => {
                        newUser.password = encPass;
                        newUser.save()
                            .then(userData => userHelpers.getJwtToken(userData))
                            .then(jwtToken => res.status(200).json({ token: jwtToken }))
                            .catch(err => res.status(500).json({ errors: [{ message: err }] }));
                    })
                    .catch(err => res.status(500).json({ errors: [{ message: 'sever error while creating the hash' }] }))
            }
        })
        .catch(err => res.status(500).json({ errors: [{ message: err }] }))
})

module.exports = router;