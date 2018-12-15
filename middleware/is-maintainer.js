module.exports = (req, res, next) => {
  if (req.rank !== ('maintainer' && 'admin')) {
    const error = new Error('Not maintainer');
    error.statusCode = 401;
    next(error);
  }
  next();
};
