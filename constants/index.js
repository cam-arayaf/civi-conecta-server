const { isValidRun } = require("../helpers");

const schemaOptions = { timestamps: true };
const enumMessage = `{VALUE} isn't a valid`;
const required = [true, "{PATH} is required"];
const uniqueMessage = { message: "{PATH} must be unique" };
const booleanData = { type: Boolean, default: true };
const stringData = { type: String, trim: true };
const numberData = { type: Number, min: 1 };
const numberDataZeroFour = { type: Number, min: 0, max: 4 };
const dateData = { type: Date };
const requiredStringData = { ...stringData, required };
const requiredNumberData = { ...numberData, required };
const requiredNumberDataZeroFour = { ...numberDataZeroFour, required };
const requiredDateData = { ...dateData, required };
const uniqueStringData = { ...requiredStringData, unique: true };
const uniqueNumberData = { ...requiredNumberData, unique: true };
const uniqueNumberDataZeroFour = { ...requiredNumberDataZeroFour, required };
const uniqueDateData = { ...requiredDateData, unique: true };
const seedUserLogin = "seed-user-login";
const seedRecoveryPassword = "seed-recovery-password";
const seedSurveyStudents = "seed-survey-students";
const tokenExpirationUserLogin = "7d";
const tokenExpirationRecoveryPassword = "7d";
const tokenExpirationSurveyStudents = "7d";
const subjectEmailRecoveryPassword = "Recovery Password";
const subjectEmailSurveyStudents = "Survey Students";
const nameTransporterRecoveryPassword = "CiviConecta Support Team";
const nameTransporterSurveyStudents = "CiviConecta Team";
const ftpHost = "localhost";
const ftpPort = 21;
const ftpUser = "anonymous";
const ftpPassword = "guest";
const ftpSecure = false;
const databaseUrl = "mongodb://127.0.0.1:27017/civi-conecta";
const port = 3001;

const validateEmail = {
  validator: (value) =>
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value),
  message: (props) =>
    `${props.path} must have a correct format of email addresses`,
};

const validateLetterAToD = {
  validator: (value) => /^[A-Da-d]{1}$/.test(value),
  message: (props) => `${props.path} must be between A and D`,
};

const validateLetterAToZ = {
  validator: (value) => /^[A-Za-z]{1}$/.test(value),
  message: (props) => `${props.path} must be between A and Z`,
};

const validatePassword = {
  validator: (value) =>
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/.test(
      value
    ),
  message: (props) =>
    `${props.path} is required and must have at least one lowercase letter, one uppercase letter, one numeric digit, one special character and be between 8 and 15 characters`,
};

const validateText = {
  validator: (value) => /^.{1,}$/.test(value),
  message: (props) => `${props.path} must be at least 1 character`,
};

const validateRun = {
  validator: (value) => isValidRun(value),
  message: (props) => `${props.path} must have correct format`,
};

const validLevels = {
  values: ["5º", "6º", "7º", "8º"],
  message: `${enumMessage} level`,
};

const validRoles = {
  values: ["Administrator", "User"],
  message: `${enumMessage} role`,
};

const validTypes = {
  values: ["Teacher", "Student"],
  message: `${enumMessage} type`,
};

module.exports = {
  schemaOptions,
  enumMessage,
  required,
  uniqueMessage,
  booleanData,
  stringData,
  numberData,
  numberDataZeroFour,
  dateData,
  requiredStringData,
  requiredNumberData,
  requiredNumberDataZeroFour,
  requiredDateData,
  uniqueStringData,
  uniqueNumberData,
  uniqueNumberDataZeroFour,
  uniqueDateData,
  seedUserLogin,
  seedRecoveryPassword,
  seedSurveyStudents,
  tokenExpirationUserLogin,
  tokenExpirationRecoveryPassword,
  tokenExpirationSurveyStudents,
  subjectEmailRecoveryPassword,
  subjectEmailSurveyStudents,
  nameTransporterRecoveryPassword,
  nameTransporterSurveyStudents,
  ftpHost,
  ftpPort,
  ftpUser,
  ftpPassword,
  ftpSecure,
  databaseUrl,
  port,
  validateEmail,
  validateLetterAToD,
  validateLetterAToZ,
  validatePassword,
  validateText,
  validateRun,
  validLevels,
  validRoles,
  validTypes,
};
