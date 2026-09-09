const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');

/**
 * Deletes a file from the server's uploads directory.
 * @param {string} relativeUrl - The relative URL string from the database (e.g., '/uploads/halls/abc.jpg')
 */
function deleteFile(relativeUrl) {
  if (!relativeUrl) return;

  try {
    // 1. Remove the leading /v1 if present (though DB usually stores relative to base)
    // The DB stores: /uploads/halls/file.ext
    // The static mount is mapped to env.uploadDir
    // So /uploads/halls/file.ext maps to {env.uploadDir}/halls/file.ext
    
    // We assume relativeUrl is like /uploads/halls/filename.ext
    // We need to map /uploads to the physical path
    
    // If it's a full URL, we can't delete it (it might be external, though not in this app)
    if (relativeUrl.startsWith('http')) return;

    // Resolve physical path
    // Example: /uploads/halls/123.jpg -> {uploadDir}/halls/123.jpg
    const fileName = relativeUrl.replace(/^\/?uploads\//, '');
    const physicalPath = path.resolve(env.uploadDir, fileName);

    if (fs.existsSync(physicalPath)) {
      fs.unlinkSync(physicalPath);
      console.log(`[FILE_CLEANUP] Deleted file: ${physicalPath}`);
    } else {
      console.warn(`[FILE_CLEANUP] File not found for deletion: ${physicalPath}`);
    }
  } catch (error) {
    console.error(`[FILE_CLEANUP] Error deleting file ${relativeUrl}:`, error.message);
  }
}

module.exports = { deleteFile };
