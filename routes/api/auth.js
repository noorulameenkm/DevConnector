const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/auth');
const User = require('../../Models/User');
const userHelper = require('../../Helpers/user_helper');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');

// @route GET api/auth
// @desc test route
// @access PUBLIC
router.get('/', auth, (req, res) => {

    User.findById(req.user.id).select('-password')
        .then(user => {
            return res.status(200).json(user);
        })
        .catch(err => res.status(500).json({ message: 'Server Error' }));

});

router.post('/', [
        check('email').isEmail().withMessage('Should provide a valid Email address'),
        check('password').not().isEmpty().withMessage('Should provide a password')
    ],
    (req, res) => {

        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(500).json({ errors: error.array() });
        }

        const { email, password } = req.body;

        User.findOne({ email })
            .then(user => {
                if (!user) {
                    return res.json({ message: 'Invalid Credentials' });
                }

                bcrypt.compare(password, user.password, (err, response) => {
                    if (err) {
                        throw err;
                    } else {
                        if (!response) {
                            return res.json({ message: 'Invalid Credentials' });
                        }

                        userHelper.getJwtToken(user)
                            .then(token => res.json({ token }))
                            .catch(err => res.json({ message: `Error ${err}` }));
                    }
                })
            })
            .catch(err => res.json({ message: `Error ${err}` }));
    });

module.exports = router;