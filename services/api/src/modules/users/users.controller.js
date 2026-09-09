const usersService = require('./users.service');

function getMe(req, res, next) {
  try {
    const user = usersService.getCurrentUser(req.user);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = { getMe };
