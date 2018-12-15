module.exports = (req, res, next) => {
  if (req.rank !== 'admin') {
    const error = new Error('Not admin.');
    error.statusCode = 401;
    next(error);
  }
  next();
};
