const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const buildSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    device: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true
    },
    buildUrl: {
      type: String,
      required: true
    },
    md5: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Build', buildSchema);
