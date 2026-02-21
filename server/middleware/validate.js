const mongoose = require('mongoose');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isEmail = (value) => isNonEmptyString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isRole = (value) => value === 'student' || value === 'organizer';
const isPositiveInt = (value) => Number.isInteger(value) && value > 0;
const isISODate = (value) => isNonEmptyString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTime = (value) => isNonEmptyString(value) && /^\d{2}:\d{2}$/.test(value);
const isObjectId = (value) => isNonEmptyString(value) && mongoose.Types.ObjectId.isValid(value);

const validateBody = (validators) => (req, res, next) => {
  const errors = [];

  Object.entries(validators).forEach(([field, validator]) => {
    const result = validator(req.body[field], req.body);
    if (result !== true) {
      errors.push(result || `Invalid ${field}`);
    }
  });

  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  return next();
};

const validateOptionalBody = (validators) => (req, res, next) => {
  const errors = [];

  Object.entries(validators).forEach(([field, validator]) => {
    if (req.body[field] === undefined) return;
    const result = validator(req.body[field], req.body);
    if (result !== true) {
      errors.push(result || `Invalid ${field}`);
    }
  });

  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  return next();
};

const validateObjectIdParam = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({ message: `Invalid ${paramName}` });
  }
  return next();
};

module.exports = {
  validateBody,
  validateOptionalBody,
  validateObjectIdParam,
  isNonEmptyString,
  isEmail,
  isRole,
  isPositiveInt,
  isISODate,
  isTime,
  isObjectId
};
