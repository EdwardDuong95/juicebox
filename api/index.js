const express = require('express');
const apiRouter = express.Router();
const usersRouter = require('./users');
const postsRouter = require('./posts');
const tagsRouter = require('./tags');



apiRouter.use ('/tags', tagsRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/posts', postsRouter);
module.exports = apiRouter;