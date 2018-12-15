const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().select("-content")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: 'Fetched posts successfully.',
      posts: posts,
      totalItems: totalItems
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const preview = req.body.preview || req.body.content.substring(0,150) + "...";
  const fileName = req.file.filename.substr(0, req.file.filename.lastIndexOf(".")) + ".jpg";
  const imageUrl = "posts/" + fileName;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    preview: preview,
    imageUrl: imageUrl,
    creator: req.userId
  });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    clearImage(imageUrl.split('/')[1]);
    next(error);
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    clearImage(imageUrl.split('/')[1]);
    next(error);
  }
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: { _id: user._id, name: user.name }
    });
    Jimp.read(path.resolve(appRoot, process.env.POSTS_FOLDER, req.file.filename)).then((image) => {
      image
        .resize(Jimp.AUTO, 600)
        .quality(60)
        .write(path.resolve(appRoot, process.env.POSTS_FOLDER, fileName), Jimp.MIME_JPG);
      if (fileName != req.file.filename) clearImage(req.file.filename);
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    clearImage(imageUrl.split('/')[1]);
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  try {
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      next(error);
    }
    res.status(200).json({ message: 'Post fetched.', post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const preview = req.body.preview || req.body.content.substring(0,150) + "...";
  const title = req.body.title;
  const content = req.body.content;
  const fileName = req.file.filename.substr(0, req.file.filename.lastIndexOf(".")) + ".jpg";
  const imageUrl = "posts/" + fileName;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    clearImage(imageUrl.split('/')[1]);
    next(error);
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    clearImage(imageUrl.split('/')[1]);
    next(error);
  }
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      next(error);
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl.split('/')[1]);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    post.preview = preview;
    const result = await post.save();
    Jimp.read(path.resolve(appRoot, process.env.POSTS_FOLDER, req.file.filename)).then((image) => {
      image
        .resize(Jimp.AUTO, 600)
        .quality(60)
        .write(path.resolve(appRoot, process.env.POSTS_FOLDER, fileName), Jimp.MIME_JPG);
      if (fileName != req.file.filename) clearImage(req.file.filename);
    });
    res.status(200).json({ message: 'Post updated!', post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    clearImage(imageUrl.split('/')[1]);
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      next(error);
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      next(error);
    }
    clearImage(post.imageUrl.split('/')[1]);
    await Post.findByIdAndRemove(postId);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    res.status(200).json({ message: 'Deleted post.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = filePath => {
  filePath = path.resolve(appRoot, process.env.POSTS_FOLDER, filePath);
  fs.unlink(filePath, err => {});
};
