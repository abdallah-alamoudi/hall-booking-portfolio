const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const payload = await authService.login(req.body || {});
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const payload = await authService.register(req.body || {});
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register };
