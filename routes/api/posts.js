const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/auth');
const User = require('../../Models/User');
const Post = require('../../Models/Posts');
const { check, validationResult } = require('express-validator');

// @route POST api/posts
// @desc add a post
// @access Private

router.post('/', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {

        // Getting user information
        const user = await User.findById(req.user.id).select('-password');

        // creating a new post
        const newPost = new Post({
            user: req.user.id,
            text: req.body.text,
            name: user.name,
            avatar: user.avatar
        });

        // Saving new post to the collection
        const post = await newPost.save();

        //returning the response to front end
        res.status(301).json({ post });

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// @route GET api/posts
// @desc get all the 
// @access Private

router.get('/', auth, async(req, res) => {

    try {

        // Fetching all the posts from posts collection
        const posts = await Post.find().sort({ date: -1 });

        // returning all the posts
        return res.status(200).json({ posts });

    } catch (err) {
        console.log(err.message);

        // returning the internal server error to the front end
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// @route GET api/posts/:id
// @desc get post by id 
// @access Private

router.get('/:id', auth, async(req, res) => {

    // Getting the post id from request params
    const postId = req.params.id;
    try {

        // Fetching the post from posts collection
        const post = await Post.findById(postId);

        if (!post) {

            // If there is no post with this id, then return Not Found error
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // returning the post
        return res.status(200).json({ post })
    } catch (err) {
        console.log(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // returning the error
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// @route DELETE api/posts/:id
// @desc delete post by id 
// @access Private
router.delete('/:id', auth, async(req, res) => {

    // Getting the post ID from request params
    const postId = req.params.id;

    // Getting the userId from req object
    const userId = req.user.id;

    try {

        // Get the post that need to be deleted
        const post = await Post.findById(postId);

        if (!post) {

            // If there is no post with this id, then return Not Found error
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // Check if the user is authorised to delete the post
        if (post.user.toString() !== userId) {
            return res.status(401).json({ error: 'Unauthorised user' });
        }

        // Delete the post
        await post.remove();

        // Returning the success response
        return res.status(200).json({ msg: 'Post Deleted Successfully' });

    } catch (err) {
        console.log(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        res.status(500).json({ error: 'Internal server Error' });
    }
});


// @route PUT api/posts/like/:id
// @desc Like posts by id 
// @access Private
router.put('/like/:id', auth, async(req, res) => {

    // Get the id from route params
    const postId = req.params.id;

    try {

        const newLike = { user: req.user.id };

        // Getting the post
        const post = await Post.findById(postId);

        if (!post) {

            // If there is no post with this id, then return Not Found error
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // Check whether he has already liked the post

        if (post.likes.filter(like => like.user.toString() === req.user.id).length !== 0) {
            return res.status(405).json({ msg: 'The user has already liked the post' });
        }


        // Adding new like to the begginning of the likes array of the current post
        post.likes.unshift(newLike);

        await post.save();

        res.status(301).json({ post });
    } catch (err) {

        console.log(err.message);

        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        return res.status(500).json({ msg: 'Internal Server Error' });
    }

});

// @route PUT api/posts/unlike/:id
// @desc UnLike posts by id 
// @access Private
router.put('/unlike/:id', auth, async(req, res) => {

    // Get the id from route params
    const postId = req.params.id;

    try {

        // Getting the post
        const post = await Post.findById(postId);

        if (!post) {

            // If there is no post with this id, then return Not Found error
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // Check whether he has already liked the post
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(405).json({ msg: 'The user hasn\'t liked the post' });
        }


        // Removing the like from the likes array of the current post
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);

        await post.save();

        res.status(301).json({ post });
    } catch (err) {

        console.log(err.message);

        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        return res.status(500).json({ msg: 'Internal Server Error' });
    }

});

// @route POST api/posts/comment/:id
// @desc add a comment to the post
// @access Private

router.post('/comment/:id', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async(req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {

        // Get the id from route params
        const postId = req.params.id;

        // Getting user information
        const user = await User.findById(req.user.id).select('-password');

        // creating a new post
        const newComment = {
            user: req.user.id,
            text: req.body.text,
            name: user.name,
            avatar: user.avatar
        };

        // Getting the post
        const post = await Post.findById(postId);

        if (!post) {

            // If there is no post with this id, then return Not Found error
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // Saving new comment to the collection
        post.comments.unshift(newComment);
        await post.save();

        //returning the response to front end
        res.status(301).json({ post });

    } catch (err) {
        console.log(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// @route DELETE api/posts/comment/:id/:commentId
// @desc Delete the comment from a post 
// @access Private
router.delete('/comment/:id/:commentId', auth, async(req, res) => {

    // Get the id from route params
    const postId = req.params.id;

    //Get the commentId
    const commentId = req.params.commentId;

    try {

        // Getting the post
        const post = await Post.findById(postId);

        if (!post) {

            // If there is no post with this id, then return Not Found error
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // Check whether the user has already commented to the post
        let comment = post.comments.find(comment => comment.id === commentId)

        if (!comment) {
            return res.status(405).json({ msg: 'Comment Does Not Exist' });
        }

        // Check the user made this comment or not
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User Not Authorized' });
        }

        // Removing the comment
        const removeIndex = post.comments.map(comment => comment.id).indexOf(commentId);
        post.comments.splice(removeIndex, 1);

        await post.save();

        res.status(301).json({ post });
    } catch (err) {

        console.log(err.message);

        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        return res.status(500).json({ msg: 'Internal Server Error' });
    }

});

module.exports = router;