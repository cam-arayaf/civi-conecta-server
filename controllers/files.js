const fs = require("fs");
const path = require("path");
const Classes = require("../models/classes");
const Exceptions = require("../models/exceptions");
const Events = require("../models/events");
const { errorResponse, getFileUrl } = require("../helpers");

const mapModels = { Class: Classes, Exception: Exceptions, Event: Events };

const getFile = (req, resp) => {
  const { entity, query } = req;
  const { pathFind } = entity;
  const pathFile = path.resolve(__dirname, `../${pathFind}/${query.file}`);
  const fileNotFound = !fs.existsSync(pathFile);
  if (fileNotFound) return errorResponse(resp, 400, "File not found");
  resp.download(pathFile);
};

const uploadFile = (req, resp) => {
  const { entity, files, originalUrl } = req;
  const { _id, currentFiles, pathFind, type } = entity;
  if (!files) return errorResponse(resp, 400, "No files were uploaded");
  const { file } = files;
  if (!file) return errorResponse(resp, 400, "No files were uploaded");
  const hasMultipleFiles = Object.keys(files).length > 1;
  if (hasMultipleFiles) return errorResponse(resp, 400, "Only one file");
  const { name } = file;
  const noExtension = name.indexOf(".") === -1;
  if (noExtension) return errorResponse(resp, 400, "File must have extension");
  const fileSplitted = name.replace(" ", "_").split(".");
  const extension = fileSplitted.pop();
  const newFile = fileSplitted.join(".");
  const totalFiles = fs.existsSync(pathFind) ? fs.readdirSync(pathFind) : [];
  const checkIfSameFile = (oldFile) => new RegExp(newFile + ".*").test(oldFile);
  const sameFiles = totalFiles.filter(checkIfSameFile);

  const currentFile = sameFiles.reduce((prev, curr) => {
    const fileNumber = +curr
      .split(".")
      .slice(0, -1)
      .join(".")
      .split("_(")
      .pop()
      .replace(/[^0-9]/, "");

    const formattedFileNumber = isNaN(fileNumber) ? 1 : fileNumber;
    return formattedFileNumber - prev === 1 ? formattedFileNumber : prev;
  }, 0);

  const fileNameQuantity = currentFile ? `_(${currentFile + 1})` : "";
  const fileName = `${newFile}${fileNameQuantity}.${extension}`;
  const fileUpload = `${pathFind}/${fileName}`;
  file.mv(fileUpload, (error) => error && errorResponse(resp, 500, error));
  const changedOriginalUrl = originalUrl.replace("upload", "get");
  const strPathFile = `${changedOriginalUrl}&file=${fileName}`;
  const update = { files: currentFiles.concat(strPathFile) };
  const options = { new: true, runValidators: true, context: "query" };

  mapModels[type].findByIdAndUpdate(_id, update, options, (error, entity) => {
    if (error) return errorResponse(resp, 500, error);
    if (!entity) return errorResponse(resp, 400, `${type} not found`);
    resp.json({ ok: true, uploadedFile: getFileUrl(req, strPathFile) });
  });
};

const deleteFile = (req, resp) => {
  const { entity, originalUrl, query } = req;
  const { _id, currentFiles, pathFind, type } = entity;
  const pathFile = path.resolve(__dirname, `../${pathFind}/${query.file}`);
  const fileNotFound = !fs.existsSync(pathFile);
  if (fileNotFound) return errorResponse(resp, 400, "File not found");
  fs.unlinkSync(pathFile);
  // const isEmptyDirectory = !fs.readdirSync(pathFind).length;
  // const parentPath = path.resolve(__dirname, `../${pathFind}`);
  // (() => isEmptyDirectory && fs.rmdirSync(parentPath))();
  const changedOriginalUrl = originalUrl.replace("delete", "get");
  const files = currentFiles.filter((f) => f !== changedOriginalUrl);
  const update = { files };
  const options = { new: true, runValidators: true, context: "query" };

  mapModels[type].findByIdAndUpdate(_id, update, options, (error, entity) => {
    if (error) return errorResponse(resp, 500, error);
    if (!entity) return errorResponse(resp, 400, `${type} not found`);
    resp.json({ ok: true, deletedFile: getFileUrl(req, changedOriginalUrl) });
  });
};

module.exports = { getFile, uploadFile, deleteFile };
