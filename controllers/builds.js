const fs = require('fs-extra');
const path = require('path');
const mkdirp = require('mkdirp');
const md5File = require('md5-file/promise');

const { validationResult } = require('express-validator/check');

const Build = require('../models/build');

exports.getBuilds = async (req, res, next) => {
  try {
    const totalItems = await Build.find().countDocuments();
    const builds = await Build.find()
    res.status(200).json({
      message: 'Fetched builds successfully.',
      builds: builds,
      totalItems: totalItems
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createBuild = async (req, res, next) => {
  const name = req.file.originalname;
  const device = req.body.device
  const version = req.body.version;
  const channel = req.body.channel;
  const size = req.file.size;
  const md5 = await md5File(req.file.path);
  const buildUrl = `${channel}/${device}/${name}`;
  const build = new Build({
    name: name,
    device: device,
    version: version,
    channel: channel,
    size: size,
    md5: md5,
    buildUrl: buildUrl
  });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    clearBuild(buildUrl);
    next(error);
  }
  if (!req.file) {
    const error = new Error('No build zip provided.');
    error.statusCode = 422;
    clearBuild(buildUrl);
    next(error);
  }
  try {
    await build.save();
    res.status(201).json({
      message: 'Build created successfully!',
      build: build
    });
    const filePath = path.resolve(appRoot, process.env.BUILDS_FOLDER, `${channel}/${device}`)
    if (!fs.existsSync(filePath)){
      await mkdirp(filePath);
    }
    await fs.move(req.file.path, filePath + "/" + name);
    
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    clearBuild(buildUrl);
    next(err);
  }
};

exports.getBuild = async (req, res, next) => {
  const buildId = req.params.buildId;
  const build = await Build.findById(buildId);
  try {
    if (!build) {
      const error = new Error('Could not find build.');
      error.statusCode = 404;
      next(error);
    }
    res.status(200).json({ message: 'Build fetched.', build: build });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getLatestBuild = async (req, res, next) => {
  const channelId = req.params.channelId;
  const deviceId = req.params.deviceId;
  const build = await Build.findOne({ channel: channelId , device: deviceId }).sort({ createdAt: -1 });
  try {
    if (!build) {
      const error = new Error('Could not find build.');
      error.statusCode = 404;
      next(error);
    }
    res.status(200).json({ message: 'Build fetched.', build: build });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteBuild = async (req, res, next) => {
  const buildId = req.params.buildId;
  try {
    const build = await Build.findById(buildId);

    if (!build) {
      const error = new Error('Could not find build.');
      error.statusCode = 404;
      next(error);
    }
    clearBuild(build.buildUrl);
    await Build.findByIdAndRemove(buildId);

    res.status(200).json({ message: 'Deleted build.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearBuild = filePath => {
  filePath = path.resolve(appRoot, process.env.BUILDS_FOLDER, filePath);
  fs.unlink(filePath, err => {});
};
