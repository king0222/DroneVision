const { dialog, app } = window.require('electron').remote;
const fs = window.require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

// Opening a File from electron browser

export const saveFile = (target, targetData) => {
  const fileName =
    target === 'flight-instructions'
      ? 'flightInstructions.dvz'
      : 'sceneObjects.dvzo';

  const fileExt = target === 'flight-instructions' ? 'dvz' : 'dvzo';
  const options = {
    defaultPath: path.join(app.getPath('desktop'), fileName),
    // Add a file extension
    filters: [{ name: 'object', extensions: [fileExt] }],
  };

  dialog.showSaveDialog(null, options, fileName => {
    if (fileName === undefined) {
      return;
    }
    const targetObj = {};
    targetObj[target] = targetData;
    fs.writeFile(fileName, JSON.stringify(targetObj), err => {
      if (err) {
        alert('An error ocurred creating the file ' + err.message);
      }
      alert('The file has been succesfully saved');
    });
  });
};

// The dialog blocks the main thread until the user select the file

const promisifiedDialog = target => {
  let fileExt;
  if (target === 'both') {
    fileExt = ['dvz', 'dvzo'];
  } else if (target === 'flight-instructions') {
    fileExt = ['dvz'];
  } else {
    fileExt = ['dvzo'];
  }
  const options = {
    properties: ['openFile', 'multiSelections'],
    defaultPath: app.getPath('desktop'),
    filters: [{ name: 'object', extensions: fileExt }],
  };
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog(null, options, (fileNames, err) => {
      if (!err && fileNames !== undefined) {
        resolve(fileNames);
      } else {
        reject(err);
      }
    });
  });
};

// Saving a File from electron browser

export const loadFile = async target => {
  const fileNames = await promisifiedDialog(target);
  const res = [];
  for (let fileName of fileNames) {
    const data = await readFileAsync(fileName);
    res.push(JSON.parse(data));
  }
  return res.reduce((accum, el) => ({ ...accum, ...el }), {});
};
