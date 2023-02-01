const AdmZip = require("adm-zip");
const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");

const {
  errorResponse,
  getFileUrl,
  getFtpConnectionOptions,
} = require("../helpers");

const setUploadsFolderZip = (mustCreateFolder) => {
  const pathFolder = path.resolve(__dirname, "../uploads");
  const pathZip = path.resolve(__dirname, "../uploads.zip");
  const options = { recursive: true };
  (() => fs.existsSync(pathFolder) && fs.rmSync(pathFolder, options))();
  (() => fs.existsSync(pathZip) && fs.rmSync(pathZip))();
  return mustCreateFolder && fs.mkdirSync(pathFolder);
};

const getFile = async (req, resp) => {
  const { pathFind, query } = req;
  const { file } = query;
  const fileNotFoundMsg = "File not found";
  const noFile = !file || typeof file !== "string" || !file.trim().length;
  if (noFile) return errorResponse(resp, 400, fileNotFoundMsg);
  const pathTo = `./uploads/${file}`;
  const client = new ftp.Client();

  try {
    setUploadsFolderZip(true);
    await client.access(getFtpConnectionOptions());
    const filesArr = await client.list(pathFind);
    const hasFile = filesArr.some(({ name }) => name === file);
    if (!hasFile) return errorResponse(resp, 400, fileNotFoundMsg);
    await client.downloadTo(pathTo, `${pathFind}/${file}`);
    client.close();
  } catch (error) {
    setUploadsFolderZip(false);
    client.close();
    return errorResponse(resp, 500, error);
  }

  const pathFile = path.resolve(__dirname, `.${pathTo}`);
  const fileNotFound = !fs.existsSync(pathFile);
  if (fileNotFound) return errorResponse(resp, 400, fileNotFoundMsg);
  resp.download(pathFile);
};

const uploadFile = async (req, resp) => {
  const errorNotFiles = "No files were uploaded";
  const errorOnlyOneFile = "Only one file";
  const invalidNameMsg = `Name must be between 4 and 100 characters and must have extension`;
  const { pathFind, files, originalUrl } = req;
  if (!files) return errorResponse(resp, 400, errorNotFiles);
  const { file } = files;
  if (!file) return errorResponse(resp, 400, errorNotFiles);
  const hasMultipleFiles = Object.keys(files).length > 1 || file.length > 1;
  if (hasMultipleFiles) return errorResponse(resp, 400, errorOnlyOneFile);
  const { name } = file;
  const noName = !name || typeof name !== "string" || !name.trim().length;
  if (noName) return errorResponse(resp, 400, invalidNameMsg);
  const noExtension = name.indexOf(".") === -1;
  const noMinCharacters = name.trim().length < 4;
  const noMaxCharacters = name.trim().length > 100;
  const invalidName = noExtension || noMinCharacters || noMaxCharacters;
  if (invalidName) return errorResponse(resp, 400, invalidNameMsg);
  const fileSplitted = name.trim().replace(/\s/g, "_").split(".");
  const extension = fileSplitted.pop();
  const newFile = fileSplitted.join(".");
  const client = new ftp.Client();

  try {
    setUploadsFolderZip(true);
    await client.access(getFtpConnectionOptions());
    const filesArr = await client.list(pathFind);
    client.close();
    const totalFiles = filesArr.map(({ name }) => name);
    const isSameFile = (oldFile) => new RegExp(newFile + ".*").test(oldFile);
    const sortFiles = (a, b) => (a > b ? 1 : a < b ? -1 : 0);
    const sameFiles = totalFiles.filter(isSameFile).sort(sortFiles);

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
    const fileUpload = `./uploads/${fileName}`;

    file.mv(fileUpload, async (error) => {
      if (error) return errorResponse(resp, 500, error);
      await client.access(getFtpConnectionOptions());
      await client.uploadFromDir(`./uploads`, pathFind);
      client.close();
      setUploadsFolderZip(false);
      const firstPath = `${originalUrl}&file=${fileName}`;
      const getPath = getFileUrl(req, firstPath.replace("upload", "get"));
      const deletePath = getFileUrl(req, firstPath.replace("upload", "delete"));
      const fileObj = { fileName, getPath, deletePath };
      resp.json({ ok: true, uploadedFile: fileObj });
    });
  } catch (error) {
    setUploadsFolderZip(false);
    client.close();
    return errorResponse(resp, 500, error);
  }
};

const updateFile = async (req, resp) => {
  const { pathFind, originalUrl, query, body } = req;
  const { file } = query;
  const { name } = body;
  const invalidNameMsg = `Name must be between 4 and 40 characters and must have extension`;
  const noName = !name || typeof name !== "string" || !name.trim().length;
  if (noName) return errorResponse(resp, 400, invalidNameMsg);
  const noExtension = name.indexOf(".") === -1;
  const noMinCharacters = name.trim().length < 4;
  const noMaxCharacters = name.trim().length > 40;
  const invalidName = noExtension || noMinCharacters || noMaxCharacters;
  if (invalidName) return errorResponse(resp, 400, invalidNameMsg);
  const fileName = name.trim().replace(/\s/g, "_");
  const client = new ftp.Client();

  try {
    setUploadsFolderZip(false);
    await client.access(getFtpConnectionOptions());
    const filesArr = await client.list(pathFind);
    const hasFile = filesArr.some((f) => f.name === file);
    if (!hasFile) return errorResponse(resp, 400, "File not found");
    const sameNameFn = (f) => f.name === fileName && fileName === file;
    const isSameName = filesArr.some(sameNameFn);
    if (isSameName) return errorResponse(resp, 400, "New name equals old name");
    const existNameFn = (f) => f.name === fileName && fileName !== file;
    const isExistName = filesArr.some(existNameFn);
    if (isExistName) return errorResponse(resp, 400, "Name already exists");
    await client.rename(`${pathFind}/${file}`, `${pathFind}/${fileName}`);
    client.close();
  } catch (error) {
    setUploadsFolderZip(false);
    client.close();
    return errorResponse(resp, 500, error);
  }

  const newUrl = originalUrl.replace(file, fileName);
  const getPath = getFileUrl(req, newUrl.replace("update", "get"));
  const deletePath = getFileUrl(req, newUrl.replace("update", "delete"));
  const fileObj = { fileName, getPath, deletePath };
  resp.json({ ok: true, updatedFile: fileObj });
};

const deleteFile = async (req, resp) => {
  const { pathFind, originalUrl, query } = req;
  const { file } = query;
  const fileNotFoundMsg = "File not found";
  const noFile = !file || typeof file !== "string" || !file.trim().length;
  if (noFile) return errorResponse(resp, 400, fileNotFoundMsg);
  const client = new ftp.Client();

  try {
    setUploadsFolderZip(false);
    await client.access(getFtpConnectionOptions());
    const filesArr = await client.list(pathFind);
    const hasFile = filesArr.some(({ name }) => name === file);
    if (!hasFile) return errorResponse(resp, 400, fileNotFoundMsg);
    await client.remove(`${pathFind}/${file}`);
    client.close();
  } catch (error) {
    setUploadsFolderZip(false);
    client.close();
    return errorResponse(resp, 500, error);
  }

  const getPath = getFileUrl(req, originalUrl.replace("delete", "get"));
  const deletePath = getFileUrl(req, originalUrl);
  const fileObj = { fileName: query.file, getPath, deletePath };
  resp.json({ ok: true, deletedFile: fileObj });
};

const getUploadsInZipFile = async (req, resp) => {
  setUploadsFolderZip(true);
  const folderName = "uploads";
  const folderPath = `./${folderName}`;
  const ftpQuota = ".ftpquota";
  const client = new ftp.Client();

  try {
    await client.access(getFtpConnectionOptions());
    const filesArr = await client.list();
    const hasFiles = !!filesArr.filter((f) => f.name !== ftpQuota).length;
    if (!hasFiles) return errorResponse(resp, 400, "No files uploaded");
    await client.downloadToDir(folderPath, `./`);
    client.close();
  } catch (error) {
    setUploadsFolderZip(false);
    client.close();
    return errorResponse(resp, 500, error);
  }

  const pathFtpQuota = path.resolve(__dirname, `../uploads/${ftpQuota}`);
  (() => fs.existsSync(pathFtpQuota) && fs.rmSync(pathFtpQuota))();
  const hasntFolder = !fs.existsSync(folderPath);
  if (hasntFolder) return errorResponse(resp, 400, "Folder not found");
  const zip = new AdmZip();
  zip.addLocalFolder(folderPath);
  const fileName = `${folderName}.zip`;
  zip.writeZip(fileName);
  resp.download(path.resolve(__dirname, `../${fileName}`));
};

const uploadAndUncompressUploadsZip = (req, resp) => {
  setUploadsFolderZip(true);
  const { files } = req;
  const noFilesMessage = "No files were uploaded";
  if (!files) return errorResponse(resp, 400, noFilesMessage);
  const { file } = files;
  if (!file) return errorResponse(resp, 400, noFilesMessage);
  const hasMultipleFiles = Object.keys(files).length > 1 || file.length > 1;
  const onlyUploadsZipMessage = "File must be only uploads.zip";
  if (hasMultipleFiles) return errorResponse(resp, 400, onlyUploadsZipMessage);
  const { name } = file;
  const fileName = "uploads.zip";
  if (name !== fileName) return errorResponse(resp, 400, onlyUploadsZipMessage);
  const filePath = `./${fileName}`;

  file.mv(filePath, async (error) => {
    if (error) return errorResponse(resp, 500, error);
    const client = new ftp.Client();

    try {
      new AdmZip(filePath).extractAllTo(`${path.parse(filePath).name}`);
      await client.access(getFtpConnectionOptions());
      await client.uploadFromDir(`./uploads`, "./");
      client.close();
      setUploadsFolderZip(false);
      resp.json({ ok: true, uploadAndUncompressFile: fileName });
    } catch (error) {
      setUploadsFolderZip(false);
      client.close();
      const zipFormatMsg = `Error: Invalid or unsupported zip format. No END header found`;
      const finalErr = error.toString() === zipFormatMsg ? zipFormatMsg : error;
      errorResponse(resp, 500, finalErr);
    }
  });
};

const deleteUploadsZip = (req, resp) => {
  const fileName = "uploads.zip";
  const pathFile = path.resolve(__dirname, `../${fileName}`);
  const fileNotFound = !fs.existsSync(pathFile);
  if (fileNotFound) return errorResponse(resp, 400, "File not found");
  fs.unlinkSync(pathFile);
  resp.json({ ok: true, deletedFile: fileName });
};

module.exports = {
  getFile,
  uploadFile,
  updateFile,
  deleteFile,
  getUploadsInZipFile,
  uploadAndUncompressUploadsZip,
  deleteUploadsZip,
};
