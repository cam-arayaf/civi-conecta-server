const {
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
} = require("../constants");

process.env.SEED_USER_LOGIN = process.env.SEED_USER_LOGIN || seedUserLogin;

process.env.SEED_RECOVERY_PASSWORD =
  process.env.SEED_RECOVERY_PASSWORD || seedRecoveryPassword;

process.env.SEED_SURVEY_STUDENTS =
  process.env.SEED_SURVEY_STUDENTS || seedSurveyStudents;

process.env.TOKEN_EXPIRATION_USER_LOGIN =
  process.env.TOKEN_EXPIRATION_USER_LOGIN || tokenExpirationUserLogin;

process.env.TOKEN_EXPIRATION_RECOVERY_PASSWORD =
  process.env.TOKEN_EXPIRATION_RECOVERY_PASSWORD ||
  tokenExpirationRecoveryPassword;

process.env.TOKEN_EXPIRATION_SURVEY_STUDENTS =
  process.env.TOKEN_EXPIRATION_SURVEY_STUDENTS || tokenExpirationSurveyStudents;

process.env.SUBJECT_EMAIL_RECOVERY_PASSWORD =
  process.env.SUBJECT_EMAIL_RECOVERY_PASSWORD || subjectEmailRecoveryPassword;

process.env.SUBJECT_EMAIL_SURVEY_STUDENTS =
  process.env.SUBJECT_EMAIL_SURVEY_STUDENTS || subjectEmailSurveyStudents;

process.env.NAME_TRANSPORTER_RECOVERY_PASSWORD =
  process.env.NAME_TRANSPORTER_RECOVERY_PASSWORD ||
  nameTransporterRecoveryPassword;

process.env.NAME_TRANSPORTER_SURVEY_STUDENTS =
  process.env.NAME_TRANSPORTER_SURVEY_STUDENTS || nameTransporterSurveyStudents;

process.env.HOST_TRANSPORTER = process.env.HOST_TRANSPORTER || "";
process.env.PORT_TRANSPORTER = process.env.PORT_TRANSPORTER || "";
process.env.SECURE_TRANSPORTER = process.env.SECURE_TRANSPORTER || "";
process.env.SERVICE_TRANSPORTER = process.env.SERVICE_TRANSPORTER || "";
process.env.USERNAME_TRANSPORTER = process.env.USERNAME_TRANSPORTER || "";
process.env.PASSWORD_TRANSPORTER = process.env.PASSWORD_TRANSPORTER || "";
process.env.RECOVERY_PASSWORD_URL = process.env.RECOVERY_PASSWORD_URL || "";
process.env.SURVEY_STUDENTS_URL = process.env.SURVEY_STUDENTS_URL || "";
process.env.AUTO_LOGIN_URL = process.env.AUTO_LOGIN_URL || "";
process.env.FTP_HOST = process.env.FTP_HOST || ftpHost;
process.env.FTP_PORT = process.env.FTP_PORT || ftpPort;
process.env.FTP_USER = process.env.FTP_USER || ftpUser;
process.env.FTP_PASSWORD = process.env.FTP_PASSWORD || ftpPassword;
process.env.FTP_SECURE = process.env.FTP_SECURE || ftpSecure;
process.env.DATABASE_URL = process.env.DATABASE_URL || databaseUrl;
process.env.PORT = process.env.PORT || port;
