const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deviceSchema = new Schema(
  {
    codename: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    manufacturer: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    maintainer: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
