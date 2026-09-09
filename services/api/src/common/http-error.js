class HttpError extends Error {
  constructor(status, codeOrMessage, message, details = {}) {
    const hasExplicitCode = typeof message === 'string';
    const resolvedMessage = hasExplicitCode ? message : codeOrMessage;
    const resolvedCode = hasExplicitCode ? codeOrMessage : 'ERROR';

    super(resolvedMessage);
    this.name = 'HttpError';
    this.status = status;
    this.code = resolvedCode;
    this.details = details;
  }
}

module.exports = { HttpError };
