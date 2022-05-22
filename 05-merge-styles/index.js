/* eslint-disable no-unused-vars */
const path = require('path');
const {writeFile} = require('node:fs/promises');
const {readdir} = require('node:fs/promises');
const {stat} = require('node:fs/promises');
const {readFile} = require('node:fs/promises');
const {unlink} = require('node:fs/promises');

const pathToProjectFolder = path.join(__dirname, 'project-dist');
const pathToBundle = path.join(pathToProjectFolder, 'bundle.css');
const pathToStylesFolder = path.join(__dirname, 'styles');

async function checkIsBundleExist() {
  const promise = new Promise( (resolve) => {
    let result = stat(pathToBundle);
    result.then(
      (stats) => resolve(true),
      (error) => resolve(false)
    );
  });
  return promise;
}

async function createBundleFile(content) {
  const promise = new Promise( (resolve) => {
    const check = checkIsBundleExist();
    check.then(
      (data) => {
        if (data === true) {
          const deleteBundle = unlink(pathToBundle);
          deleteBundle.then(
            () => {
              writeFile( pathToBundle, content, (err) => {
                if (err) throw err;
                resolve('done');
              } );
            }
          );
        }else if (data === false) {
          writeFile( pathToBundle, content, (err) => {
            if (err) throw err;
            resolve('done');
          } );
        }
      }
    );
  });
  return promise;
}

async function getContentFromFile(pathToFile) {
  const placeholder1 = '\n/*===============================*/\n';
  const placeholder2 = '/*===============================*/\n';
  let promise = new Promise( (resolve) => {
    let stats = stat(pathToFile);
    stats.then(
      (value) => {
        if (value.isFile() && path.extname(pathToFile) === '.css') {
          const getContent = readFile(pathToFile, 'UTF-8');
          getContent.then(
            (data) => {
              const name = `/*         ${path.basename(pathToFile)}          */\n`;
              resolve(placeholder1 + name + placeholder2 + data);
            }
          );
        } else {
          resolve('');
        }
      },
      (err) => console.log(`error in function getContentFromFile____${err}`)
    );
  } );
  return promise;
}

async function createContentForBundleFile() {
  let contentForBundle = '';
  const promise = new Promise( (resolve) => {
    const readFolder = readdir(pathToStylesFolder);
    readFolder.then(
      (files) => {
        const arrayOfPromises = [];
        for (let file of files) {
          const pathToFile = path.join(pathToStylesFolder, file);
          const content = getContentFromFile(pathToFile);
          arrayOfPromises.push(content);
          content.then(
            (value) => {
              contentForBundle = contentForBundle + value;
            }
          );
        }

        Promise.all(arrayOfPromises).then(
          () => resolve(contentForBundle)
        );
      },
      (error) => console.log(error)
    );
    
  });

  return promise;
}

createContentForBundleFile().then(
  (content) => {
    createBundleFile(content);
    console.log('bundle.css успешно создан');
  }
);
