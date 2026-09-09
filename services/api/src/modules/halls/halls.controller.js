const hallService = require('./halls.service');
const { HttpError } = require('../../common/http-error');

async function getHalls(req, res, next) {
  try {
    const result = await hallService.getHalls(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getHallById(req, res, next) {
  try {
    const { id } = req.params;
    const hall = await hallService.getHallById(id);
    
    if (!hall) {
      throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
    }

    res.json(hall);
  } catch (error) {
    next(error);
  }
}

async function getServices(req, res, next) {
  try {
    const result = await hallService.getServices();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHalls,
  getHallById,
  getServices
};
