const availabilityService = require('./availability.service');

async function createBlock(req, res, next) {
  try {
    const { id: hallId } = req.params;
    const ownerId = req.user.userId;
    const block = await availabilityService.createBlock(ownerId, hallId, req.body);
    res.status(201).json(block);
  } catch (error) {
    next(error);
  }
}

async function deleteBlock(req, res, next) {
  try {
    const { id: blockId } = req.params;
    const ownerId = req.user.userId;
    const result = await availabilityService.deleteBlock(ownerId, blockId);
    res.status(204).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAvailability(req, res, next) {
  try {
    const { id: hallId } = req.params;
    const result = await availabilityService.getAvailability(hallId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getOwnerAvailability(req, res, next) {
  try {
    const { id: hallId } = req.params;
    const ownerId = req.user.userId;
    const result = await availabilityService.getOwnerAvailability(ownerId, hallId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBlock,
  deleteBlock,
  getAvailability,
  getOwnerAvailability
};
