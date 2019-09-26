const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/auth');
const Profile = require('../../Models/Profile');
const User = require('../../Models/User');
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');

// @route GET api/profile/me
// @desc Get current users profile
// @access private
router.get('/me', auth, (req, res) => {
    Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar'])
        .then(me => {
            if (!me) {
                return res.status(400).json({ msg: 'There is no profile for this user' })
            }

            res.status(200).json({ profile: me })

        })
        .catch(err => req.status(200).json({ msg: `Error occured ${err}` }));
});

// @route POST api/profile
// @desc create user profile
// @access private
router.post('/', [auth, [
    check('status').not().isEmpty().withMessage('Status is required'),
    check('skills').not().isEmpty().withMessage('Skills are required')
]], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() })
    }

    const {
        company,
        website,
        bio,
        location,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    // Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) {
        profileFields.company = company;
    }
    if (website) {
        profileFields.website = website;
    }
    if (bio) {
        profileFields.bio = bio;
    }
    if (location) {
        profileFields.location = location;
    }
    if (status) {
        profileFields.status = status;
    }
    if (githubusername) {
        profileFields.githubusername = githubusername;
    }
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Social media
    profileFields.social = {};
    if (youtube) {
        profileFields.social.youtube = youtube;
    }
    if (facebook) {
        profileFields.social.facebook = facebook;
    }
    if (linkedin) {
        profileFields.social.linkedin = linkedin;
    }
    if (twitter) {
        profileFields.social.twitter = twitter;
    }
    if (instagram) {
        profileFields.social.instagram = instagram;
    }

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if (profile) {
                //Updating profile details
                Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
                    .then(updatedUser => res.status(200).json({ user: updatedUser }))
                    .catch(updateError => console.log('error', updateError));

            } else {
                const newProfile = new Profile(profileFields);
                newProfile.save()
                    .then(newUser => res.status(200).json({ user: newUser }))
                    .catch(newUserError => res.status(400).json({ message: 'failed to create a user, try again later' }));
            }
        })
        .catch(serverError => res.status(400).json({ error: `Server error ${serverError}` }));

});

// @route GET api/profile
// @desc get all profiles
// @access public
router.get('/', async(req, res) => {

    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json({ profiles })
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
});


// @route GET api/profiles/user/:user_id
// @desc get profile by userId
// @access public
router.get('/user/:user_id', async(req, res) => {

    try {
        const profile = await Profile.findOne({ user: req.params.user_id })
            .populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' })
        }
        res.status(200).json({ profile })
    } catch (error) {
        console.log(error.message);
        if (error.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' })
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});


// @route DELETE api/profiles
// @desc delete profile, user and posts
// @access private
router.delete('/', auth, async(req, res) => {
    try {
        // @todo - remove users posts

        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id })

        // Remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.status(200).json({ msg: 'User got removed' });

    } catch (error) {
        res.status(500).json({ msg: 'Server error in deleting the user' });
    }
});

//  @route PUT api/profiles/experience
//  @desc Add profile experience
//  @access Private

router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } = req.body;

    const expData = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };

    try {

        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(expData);

        await profile.save();

        return res.json({ profile });

    } catch (error) {
        console.log(error.message);
        return res.json({ msg: 'Server Error' });
    }
});

//  @route DELETE api/profiles/experience/:exp_id
//  @desc Delete experience
//  @access Private
router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experience.map(exp => exp.id).indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        return res.json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//  @route PUT api/profiles/education
//  @desc Add profile education
//  @access Private

router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, from, to, current, description } = req.body;

    const eduData = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    };

    try {

        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(eduData);

        await profile.save();

        return res.json({ profile });

    } catch (error) {
        console.log(error.message);
        return res.json({ msg: 'Server Error' });
    }
});

//  @route DELETE api/profiles/education/:exp_id
//  @desc Delete education
//  @access Private
router.delete('/education/:edu_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education.map(edu => edu.id).indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1);
        await profile.save();
        return res.json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//  @route GET api/profiles/github/:username
//  @desc Get github profile assocaited with the username
//  @access Public
router.get('/github/:username', async(req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
                sort=created&client_id=${config.get("githubClientId")}&client_secret=$
                {config.get("githubClientSecret")}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        }

        request(options, (error, response, body) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            if (response.statusCode !== 200) {
                return res.status(404).json({ error: "Github Profile Not Found" });
            }

            res.json(JSON.parse(body));
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;