const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression')
const morgan = require('morgan')

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const buildRoutes = require('./routes/builds');

global.appRoot = path.resolve(__dirname);

const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false })); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use('/posts', express.static(path.join(__dirname, 'posts')));
app.use('/devices', express.static(path.join(__dirname, 'devices')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);
app.use('/builds', buildRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    process.env.MONGO_STRING
  )
  .then(result => {
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => console.log(err));
