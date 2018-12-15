const express = require('express');
const { body } = require('express-validator/check');

const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

const router = express.Router();

router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists!');
          }
        });
      })
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 5 }),
    body('name')
      .trim()
      .not()
      .isEmpty(),
    body('username')
      .custom((value, { req }) => {
        return User.findOne({ username: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('Username already exists!');
          }
        });
      })
      .trim()
      .not()
      .isEmpty()
  ],
  authController.signup
);

router.post(
  '/login', 
  body('email').normalizeEmail(),
  authController.login
);

router.put(
  '/rank/:userId', 
  isAuth,
  isAdmin,
  body('rank')
    .trim()
    .isLength({ min: 3 }),
  authController.updateRank
);

router.get('/me', isAuth, authController.me);


module.exports = router;
