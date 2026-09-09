const ownerHallService = require('./halls.owner.service');

async function createHall(req, res, next) {
  try {
    const userId = req.user.userId;
    const result = await ownerHallService.createHall(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateHall(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await ownerHallService.updateHall(userId, id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getMyHalls(req, res, next) {
  try {
    const userId = req.user.userId;
    const result = await ownerHallService.getMyHalls(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getHallById(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await ownerHallService.getHallById(userId, id);
    if (!result) {
      const { HttpError } = require('../../common/http-error');
      throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteHall(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    await ownerHallService.deleteHall(userId, id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createHall,
  updateHall,
  deleteHall,
  getMyHalls,
  getHallById
};
