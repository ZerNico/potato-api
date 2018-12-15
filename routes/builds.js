const express = require('express');
const { body } = require('express-validator/check');
const multer = require('multer');
const mongoose = require('mongoose');

const buildController = require('../controllers/builds');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');
const isMaintainer = require('../middleware/is-maintainer');
const User = require('../models/user');

const router = express.Router();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.BUILDS_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/zip'
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
    fileSize: 1024 * 1024 * 1024
  }
 });

// GET /builds/builds
router.get('/builds', buildController.getBuilds);

// POST /builds/build
router.post(
  '/build',
  isAuth,
  isMaintainer,
  upload.single('build'),
  [
    body('device')
      .trim()
      .isLength({ min: 3 }),
    body('version')
      .trim()
      .isLength({ min: 3 }),
    body('channel')
      .trim()
      .isLength({ min: 3 })
  ],
  buildController.createBuild
);

// GET /builds/build/:buildId
router.get('/build/:buildId', buildController.getBuild);

// GET /builds/latest/:channelId/:deviceId
router.get('/latest/:channelId/:deviceId', buildController.getLatestBuild);

// DELETE /builds/build/:buildId
router.delete('/build/:buildId', isAuth, isMaintainer, buildController.deleteBuild);

module.exports = router;
