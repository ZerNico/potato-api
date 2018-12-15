const express = require('express');
const { body } = require('express-validator/check');
const multer = require('multer');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');
const isMaintainer = require('../middleware/is-maintainer');

const router = express.Router();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.POSTS_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ 
  storage: fileStorage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
 });

// GET /feed/posts
router.get('/posts', feedController.getPosts);

// POST /feed/post
router.post(
  '/post',
  isAuth,
  isAdmin,
  upload.single('image'),
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 }),
    body('preview')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
  ],
  feedController.createPost
);

router.get('/post/:postId', feedController.getPost);

router.put(
  '/post/:postId',
  isAuth,
  isAdmin,
  upload.single('image'),
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 }),
    body('preview')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
  ],
  feedController.updatePost
);

router.delete('/post/:postId', isAuth, isAdmin, feedController.deletePost);

module.exports = router;
