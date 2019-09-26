const express = require('express');
const router = express.Router();

// @route GET api/posts
// @desc test route
// @access PUBLIC
router.get('/', (req, res) => {
    res.send('Hello this is posts');
})

module.exports = router;