const { body, param, query, validationResult } = require('express-validator');

// Helper to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: errors.array() 
    });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and _'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('sport')
    .optional()
    .trim()
    .escape(),
  
  body('location')
    .optional()
    .trim()
    .escape(),
  
  validate
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

// Team validators
const createTeamValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Team name must be between 3-50 characters')
    .escape(),
  
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport is required')
    .escape(),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .escape(),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .escape(),
  
  body('date')
    .isISO8601()
    .withMessage('Invalid date')
    .toDate(),
  
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (use HH:MM)'),
  
  body('max_players')
    .isInt({ min: 2, max: 100 })
    .withMessage('Number of players must be between 2-100'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description can be max 500 characters')
    .escape(),
  
  validate
];

// Tournament validators
const createTournamentValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3-100 characters')
    .escape(),
  
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport is required')
    .escape(),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .escape(),
  
  body('start_date')
    .isISO8601()
    .withMessage('Invalid start date')
    .toDate(),
  
  body('end_date')
    .isISO8601()
    .withMessage('Invalid end date')
    .toDate()
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('max_teams')
    .isInt({ min: 2, max: 128 })
    .withMessage('Number of teams must be between 2-128'),
  
  body('entry_fee')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Entry fee must be between 0-10000€'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description can be max 1000 characters')
    .escape(),
  
  validate
];

// Field validators
const createFieldValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Field name must be between 3-100 characters')
    .escape(),
  
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport is required')
    .escape(),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .escape(),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5-200 characters')
    .escape(),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Price must be between 0-1000€'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description can be max 500 characters')
    .escape(),
  
  validate
];

// Profile validators

const updateProfileValidator = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name can be max 50 characters'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name can be max 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio can be max 500 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Invalid phone format'),
  
  body('instagram')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Invalid Instagram username'),
  
  body('twitter')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Invalid Twitter username'),
  
  validate
];

// Stats validators
const addMatchValidator = [
  body('sport')
    .trim()
    .notEmpty()
    .withMessage('Sport is required')
    .escape(),
  
  body('matchData.opponent')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Opponent must be between 2-100 characters')
    .escape(),
  
  body('matchData.result')
    .isIn(['win', 'loss', 'draw'])
    .withMessage('Result must be: win, loss or draw'),
  
  body('matchData.goalsScored')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Goals scored must be between 0-50'),
  
  body('matchData.assists')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Assists must be between 0-50'),
  
  validate
];

// UUID validators (for Supabase)
const uuidValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  validate
];

const teamIdValidator = [
  param('teamId')
    .isUUID()
    .withMessage('Invalid team ID'),
  validate
];

const tournamentIdValidator = [
  param('tournamentId')
    .isUUID()
    .withMessage('Invalid tournament ID'),
  validate
];

const matchIdValidator = [
  param('matchId')
    .isUUID()
    .withMessage('Invalid match ID'),
  validate
];

const fieldIdValidator = [
  param('fieldId')
    .isUUID()
    .withMessage('Invalid field ID'),
  validate
];

const videoIdValidator = [
  param('videoId')
    .isUUID()
    .withMessage('Invalid video ID'),
  validate
];

const userIdValidator = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  createTeamValidator,
  createTournamentValidator,
  createFieldValidator,
  updateProfileValidator,
  addMatchValidator,
  uuidValidator,
  teamIdValidator,
  tournamentIdValidator,
  matchIdValidator,
  fieldIdValidator,
  videoIdValidator,
  userIdValidator
};