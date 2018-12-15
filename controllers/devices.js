const fs = require('fs');
const path = require('path');
var Jimp = require('jimp');

const { validationResult } = require('express-validator/check');

const Device = require('../models/device');
const User = require('../models/user');

exports.getDevices = async (req, res, next) => {
  try {
    const totalItems = await Device.find().countDocuments();
    const devices = await Device.find()
    res.status(200).json({
      message: 'Fetched devices successfully.',
      devices: devices,
      totalItems: totalItems
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createDevice = async (req, res, next) => {
  const fileName = req.file.filename.substr(0, req.file.filename.lastIndexOf(".")) + ".jpg";
  const imageUrl = "devices/" + fileName;
  const codename = req.body.codename;
  const name = req.body.name;
  const manufacturer = req.body.manufacturer;
  const maintainer = req.body.maintainer;
  const device = new Device({
    codename: codename,
    name: name,
    manufacturer: manufacturer,
    imageUrl: imageUrl,
    maintainer: maintainer
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
    await device.save();
    res.status(201).json({
      message: 'Device created successfully!',
      device: device
    });
    Jimp.read(path.resolve(appRoot, process.env.DEVICES_FOLDER, req.file.filename)).then((image) => {
      image
        .resize(Jimp.AUTO, 600)
        .quality(60)
        .write(path.resolve(appRoot, process.env.DEVICES_FOLDER, fileName), Jimp.MIME_JPG);
      if (fileName != req.file.filename) clearImage(req.file.filename);
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      clearImage(imageUrl.split('/')[1]);
    }
    next(err);
  }
};

exports.getDevice = async (req, res, next) => {
  const deviceId = req.params.deviceId;
  const device = await Device.findById(deviceId);
  try {
    if (!device) {
      const error = new Error('Could not find device.');
      error.statusCode = 404;
      next(error);
    }
    res.status(200).json({ message: 'Device fetched.', device: device });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateDevice = async (req, res, next) => {
  const deviceId = req.params.deviceId;
  const codename = req.body.codename;
  const name = req.body.name;
  const manufacturer = req.body.manufacturer;
  const maintainer = req.body.maintainer;
  const fileName = req.file.filename.substr(0, req.file.filename.lastIndexOf(".")) + ".jpg";
  const imageUrl = "devices/" + fileName;
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
    const device = await Device.findById(deviceId);
    if (!device) {
      const error = new Error('Could not find device.');
      error.statusCode = 404;
      next(error);
    }
    if (imageUrl !== device.imageUrl) {
      clearImage(device.imageUrl.split('/')[1]);
    }
    device.codename = codename;
    device.name = name;
    device.manufacturer = manufacturer;
    device.maintainer = maintainer;
    device.imageUrl = imageUrl;
    const result = await device.save();
    Jimp.read(path.resolve(appRoot, process.env.DEVICES_FOLDER, req.file.filename)).then((image) => {
      image
        .resize(Jimp.AUTO, 600)
        .quality(60)
        .write(path.resolve(appRoot, process.env.DEVICES_FOLDER, fileName), Jimp.MIME_JPG);
      if (fileName != req.file.filename) clearImage(req.file.filename);
    });
    res.status(200).json({ message: 'Device updated!', device: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      clearImage(imageUrl.split('/')[1]);
    }
    next(err);
  }
};

exports.deleteDevice = async (req, res, next) => {
  const deviceId = req.params.deviceId;
  try {
    const device = await Device.findById(deviceId);

    if (!device) {
      const error = new Error('Could not find device.');
      error.statusCode = 404;
      next(error);
    }
    clearImage(device.imageUrl.split('/')[1]);
    await Device.findByIdAndRemove(deviceId);

    res.status(200).json({ message: 'Deleted device.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = filePath => {
  filePath = path.resolve(appRoot, process.env.DEVICES_FOLDER, filePath);
  fs.unlink(filePath, err => {});
};
