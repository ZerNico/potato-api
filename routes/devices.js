const express = require('express');
const { body } = require('express-validator/check');
const multer = require('multer');
const mongoose = require('mongoose');

const deviceController = require('../controllers/devices');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');
const isMaintainer = require('../middleware/is-maintainer');
const User = require('../models/user');

const router = express.Router();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.DEVICES_FOLDER);
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

// GET /devices/devices
router.get('/devices', deviceController.getDevices);

// POST /devices/device
router.post(
  '/device',
  isAuth,
  isAdmin,
  upload.single('image'),
  [
    body('codename')
      .trim()
      .isLength({ min: 3 }),
    body('name')
      .trim()
      .isLength({ min: 1 }),
    body('manufacturer')
      .trim()
      .isLength({ min: 2 }),
    body('maintainer')
      .trim()
      .isLength({ min: 2 })
  ],
  deviceController.createDevice
);

// GET /devices/device/:deviceId
router.get('/device/:deviceId', deviceController.getDevice);


// PUT /devices/device/:deviceId
router.put(
  '/device/:deviceId',
  isAuth,
  isAdmin,
  upload.single('image'),
  [
    body('codename')
      .trim()
      .isLength({ min: 3 }),
    body('name')
      .trim()
      .isLength({ min: 1 }),
    body('manufacturer')
      .trim()
      .isLength({ min: 2 }),
    body('maintainer')
      .trim()
      .isLength({ min: 2 })
  ],
  deviceController.updateDevice
);

// DELETE /devices/device/:deviceId
router.delete('/device/:deviceId', isAuth, isAdmin, deviceController.deleteDevice);

module.exports = router;
