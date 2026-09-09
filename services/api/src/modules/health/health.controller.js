const healthService = require('./health.service');

function getHealth(req, res) {
  const data = healthService.getHealthStatus();
  res.status(200).json(data);
}

module.exports = { getHealth };
