const { HttpError } = require('../../common/http-error');

function getCurrentUser(authUser) {
  if (!authUser || !authUser.userId || !authUser.role) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'User is not authenticated');
  }

  return {
    id: authUser.userId,
    role: authUser.role,
    fullName: authUser.fullName || 'Demo User'
  };
}

module.exports = { getCurrentUser };
