const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');

tagsRouter.use((req, res, next) => {
    console.log("A request is being made to /tags");
  
  
    next();
  });

  tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    const { tagName } = req.params
    try {
      // use our method to get posts by tag name from the db
      const posts = await getPostsByTagName(tagName)
      // send out an object to the client { posts: // the posts }
      res.send({ posts })
    } catch ({ name, message }) {
      // forward the name and message to the error handler
      next({ name, message });
    }
  });

  tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags();

    res.send({
      tags
    });
  });


module.exports = tagsRouter;