const normalStringData = (stringOptions, validate) => ({
  ...stringOptions,
  validate,
});

const enumStringData = (stringOptions, enumOptions) => ({
  ...stringOptions,
  default: enumOptions.values[0],
  enum: enumOptions,
});

const objectIdData = (
  { Types: { ObjectId: type } },
  ref,
  required = false
) => ({
  type,
  ref,
  required,
});

const errorResponse = (resp, status, error) =>
  resp.status(status).json({ ok: false, error });

const getBaseUrl = (req) => {
  const { headers, protocol } = req;
  const { host } = headers;
  return `${protocol}://${host}`;
};

const getFileUrl = (req, file) => `${getBaseUrl(req)}${file}`;
const nullCatch = () => null;

const getExpirationTokenText = (tokenExpiration) => {
  const numberExpiration = +tokenExpiration.replace(/[^0-9]/g, "");
  const letterSOrNothing = numberExpiration === 1 ? "" : "s";
  const y = `${numberExpiration} año${letterSOrNothing}`;
  const d = `${numberExpiration} día${letterSOrNothing}`;
  const h = `${numberExpiration} hora${letterSOrNothing}`;
  const m = `${numberExpiration} minuto${letterSOrNothing}`;
  const s = `${numberExpiration} segundo${letterSOrNothing}`;
  const time = { y, d, h, m, s }[tokenExpiration.replace(/[0-9]/g, "")];
  return time || tokenExpiration;
};

const getRandomPassword = () => {
  const chars = `0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
  const getNumber = () => Math.floor(Math.random() * chars.length);
  const getChar = (number) => chars.substring(number, number + 1);
  const password = [...Array(15)].map(() => getChar(getNumber())).join("");

  const regex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

  return regex.test(password) ? password : getRandomPassword();
};

const getAssociatedEntitiesMessage = (firstEntity, secondEntity) =>
  `This ${firstEntity} has associated ${secondEntity}`;

const getFtpConnectionOptions = () => {
  const { FTP_HOST, FTP_PORT, FTP_SECURE } = process.env;
  const { FTP_USER, FTP_PASSWORD } = process.env;
  const host = FTP_HOST;
  const port = FTP_PORT;
  const user = FTP_USER;
  const password = FTP_PASSWORD;
  const secure = FTP_SECURE;
  return { host, port, user, password, secure };
};

const getDateString = (date, dayFirst = true) => {
  const dateString = date.toJSON().replace(/-/g, "/").replace(/T.+/, "");
  const dateObject = new Date(dateString);
  const yyyy = dateObject.getFullYear().toString();
  const mm = (dateObject.getMonth() + 1).toString().padStart(2, "0");
  const dd = dateObject.getDate().toString().padStart(2, "0");
  return `${dayFirst ? dd : yyyy}/${mm}/${dayFirst ? yyyy : dd}`;
};

const getCleanedRun = (value) =>
  typeof value === "string"
    ? value.replace(/[^0-9kK]+/g, "").toUpperCase()
    : "";

const isValidRun = (value) => {
  const run = getCleanedRun(value);
  let runDigits = parseInt(run.slice(0, -1), 10);
  let m = 0;
  let s = 1;

  while (runDigits > 0) {
    s = (s + (runDigits % 10) * (9 - (m % 6))) % 11;
    runDigits = Math.floor(runDigits / 10);
    m += 1;
  }

  const checkDigit = s > 0 ? String(s - 1) : "K";
  return checkDigit === run.slice(-1);
};

const getFormattedRun = (value) => {
  const run = getCleanedRun(value);

  const formattedRun = () => {
    let result = `${run.slice(-4, -1)}-${run.substr(run.length - 1)}`;

    for (let i = 4; i < run.length; i += 3) {
      result = `${run.slice(-3 - i, -i)}.${result}`;
    }

    return result;
  };

  return run.length <= 1 ? run : formattedRun();
};

module.exports = {
  normalStringData,
  enumStringData,
  objectIdData,
  errorResponse,
  getFileUrl,
  nullCatch,
  getBaseUrl,
  getExpirationTokenText,
  getRandomPassword,
  getAssociatedEntitiesMessage,
  getFtpConnectionOptions,
  getDateString,
  getCleanedRun,
  isValidRun,
  getFormattedRun,
};
