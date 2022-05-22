/* eslint-disable no-unused-vars */
const {mkdir} = require('node:fs/promises');
const {readdir} = require('node:fs');
const {unlink} = require('node:fs/promises');
const {stat} = require('node:fs/promises');
const {copyFile} = require('node:fs/promises');
const path = require('path');

const pathToInitialFolderName = path.join(__dirname, 'files');
const pathToCounterpartFolder = path.join(__dirname, 'files-copy');

async function checkIsFolderExist() {
  const promise = new Promise( (resolve)=> {
    let result = stat(pathToCounterpartFolder);
    result.then( 
      (result) => resolve(true),
      (error) => resolve(false)
    );
  });
  return promise;
}

checkIsFolderExist().then(
  (data) => {

    if (data === true) {
      readdir(pathToCounterpartFolder, (error, files) => {
        if (error) {
          console.log(error);
        } else {
          for(let file of files) {
            unlink( path.join(pathToCounterpartFolder, file) );
          }
        }
      } );
  
      readdir(pathToInitialFolderName, (error, date) => {
        if (error) {
          console.log(error);
        } else {
          for(let file of date) {
            let src = path.join(pathToInitialFolderName, file);
            let promise = stat(src);
            promise.then(
              (result) => {
                if (result.isFile()) {
                  let dest = path.join(pathToCounterpartFolder, file);
                  copyFile(src, dest);
                }
              }
            );
          }
        }
      });

    } else if (data === false) {
      mkdir(pathToCounterpartFolder, { recursive: true });

      readdir(pathToInitialFolderName, (error, files) => {
        if (error) {
          console.log(error);
        } else {
          for(let file of files) {
            let src = path.join(pathToInitialFolderName, file);
            let promise = stat(src);
            promise.then(
              (result) => {
                if (result.isFile()) {
                  let dest = path.join(pathToCounterpartFolder, file);
                  copyFile(src, dest);
                }
              }
            );
          }
        }
      });
    }
  },

  (error) => console.log(error)
);
