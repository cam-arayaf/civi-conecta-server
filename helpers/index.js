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

const arrayObjectIdData = (schema, ref, required = false) => [
  objectIdData(schema, ref, required),
];

const errorResponse = (resp, status, error) =>
  resp.status(status).json({ ok: false, error });

const getFileUrl = (req, file) => {
  const { headers, protocol } = req;
  const { host } = headers;
  return `${protocol}://${host}${file}`;
};

const addBaseUrlToFile = (req, element) =>
  (element.files = element.files.map((file) => getFileUrl(req, file)));

const addBaseUrlToFiles = (req, entity) =>
  entity.forEach((element) => addBaseUrlToFile(req, element));

const nullCatch = () => null;

module.exports = {
  normalStringData,
  enumStringData,
  objectIdData,
  arrayObjectIdData,
  errorResponse,
  getFileUrl,
  addBaseUrlToFile,
  addBaseUrlToFiles,
  nullCatch,
};
