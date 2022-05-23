/* eslint-disable no-unused-vars */
const {stat} = require('node:fs/promises');
const path = require('path');
const {mkdir} = require('node:fs/promises');
const {readdir} = require('node:fs/promises');
const {rm} = require('node:fs/promises');
const {writeFile} = require('node:fs');
const {readFile} = require('node:fs/promises');
const {copyFile} = require('node:fs/promises');

const pathToProject = path.join(__dirname, 'project-dist');
const pathToIndex = path.join(pathToProject, 'index.html');
const pathToSourceAssets = path.join(__dirname, 'assets');
const pathToProjectAssets = path.join(pathToProject, 'assets');
const pathToStyles = path.join(__dirname, 'styles');
const pathToComponents = path.join(__dirname, 'components');
let contentForStyles = '';
let contentForIndexHTML = '';
let arrayOfComponentsData = [];

//проверяем есть ли директория проекта
async function checkExistingDirectory() {
  let promise = new Promise( (resolve) => {
    const getStats = stat(pathToProject);
    getStats.then(
      (value) => resolve(true),
      (err) => resolve(false)
    );
  } );
  return promise;
}

//удаляем директорию если она уже существует 
async function removeDirectory() {
  let promise = new Promise( (resolve) => {
    const projectDirExist = checkExistingDirectory();
    projectDirExist.then(
      (value) => {
        // console.log(`директория существует--${value}`);
        if(value === true) {
          const removeDir = rm(pathToProject, {recursive:true});
          removeDir.then(
            (value) => resolve('removed'),
            (err) => { 
              console.log(err);
              console.log(`       Внимание!
                Если Вы видите эту ошибку, это значит, что во время выполнения программы
                у Вас был открыт какой-либо файл из директории project-dist(например картинка,
                index.html или любой другой) и это блокирует выполнение пакета.
                Пожалуйста, закройте все открытые файлы из директории project-dist и
                перезапустите NODE.js набрав в консоли команду exit или вручную удалите
                директорию project-dist и перезапустите программу выполнив node 06-build-page`);
            } );
        } else {
          resolve('removed');
        }
      },
      (err) => console.log(`error in function removeDirectory____${err}`)
    );
  } );
  return promise;
}

//создаем директорию проекта 
async function createProjectDirectory() {
  let promise = new Promise( (resolve) => {
    const remove = removeDirectory();
    remove.then(
      (value) => {
        // console.log(`что сделано--${value}`);
        if(value === 'removed') {
          const createDir = mkdir(pathToProject);
          createDir.then(
            () => resolve('created'),
            (err) => console.log(`error in function createProjectDirectory____${err}`)
          );
        }
      },
      (err) => console.log(`error in function createProjectDirectory____${err}`)
    );
  } );
  return promise;
}

// Читаем папку со стилями и получаем список файлов и директорий в ней
async function readFolderWithStylesFiles() {
  let promise = new Promise( (resolve) => {
    const read = readdir(pathToStyles, 'UTF-8');
    read.then(
      (value) => resolve(value),
      (err) => console.log(`error in function readFolderWithStylesFiles____${err}`)
    );
  } );
  return promise;
}

// Читаем файл со стилями, получаем содержимое
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

// Создаем контент для файла со стилями в bundle
async function createContentForStyleFile() {
  let promise = new Promise( (resolve) => {
    const createArrayOfFiles = readFolderWithStylesFiles();
    createArrayOfFiles.then(
      (files) => {
        let array = [];
        for(let file of files ) {
          const pathToFile = path.join(pathToStyles, file);
          const content = getContentFromFile(pathToFile);
          array.push(content);
          content.then(
            (value) => contentForStyles = contentForStyles + value
          );
        }
        Promise.all(array).then( () => resolve(contentForStyles) );
      },
      (err) => console.log(`error in function createContentForStyleFile____${err}`)
    );
  } );
  return promise;
}

// Добавляем контент в style.css
async function addContentToStyle() {
  let promise = new Promise( (resolve) => {
    const createContent = createContentForStyleFile();
    createContent.then(
      () => {
        writeFile(path.join(pathToProject, 'style.css'), contentForStyles, (err) => {
          if (err) throw err;
          resolve('content was added');
        });
        
      },
      (err) => console.log(`error in function addContentToStyle____${err}`)
    );
  } );
  return promise;
}

//создаем директорию assets 
async function createAssetsDirectory() {
  let promise = new Promise( (resolve) => {
    const createDir = mkdir(pathToProjectAssets);
    createDir.then(
      () => resolve('created'),
      (err) => console.log(`error in function createAssetsDirectory____${err}`)
    );
  } );
  return promise;
}

function findMatches(fileName){
  for (let component of arrayOfComponentsData) {
    if (component.component === fileName) return true;
  }
  return false;
}

function getIndex(file) {
  for( let i = 0; i < arrayOfComponentsData.length; i++) {
    if( arrayOfComponentsData[i].component === file ) {
      return i;
    }
  }
}

// Находим имена компонентов для замены
async function getTegsNameToReplace() {
  let promise = new Promise( (resolve) => {
    const data = readFile(path.join(__dirname, 'template.html'), 'utf-8');
    data.then(
      (data) => {
        contentForIndexHTML = data;
        const regexpforComponent = new RegExp(/{{([\w|.|\s|\d|-]{1,50})}}/, 'g');
        const regexpforComponentSpaces = new RegExp(/^([\s]{1,20}){{/, 'mg');
        let arrayOfMatches = contentForIndexHTML.match(regexpforComponent);
        let arrayOfMatchesSpaces = contentForIndexHTML.match(regexpforComponentSpaces);
        for(let match of arrayOfMatches) {
          arrayOfComponentsData.push({tegName: match});
        }

        for(let i = 0; i < arrayOfMatchesSpaces.length; i++) {
          const numberSpaces = arrayOfMatchesSpaces[i].length - 3;
          arrayOfComponentsData[i].spaces = numberSpaces;
        }

        const componentNAmeRegExp = new RegExp(/[\w|.|\s|\d|-]{1,50}/);

        for(let i = 0; i < arrayOfComponentsData.length; i++ ) {
          arrayOfComponentsData[i].component = `${arrayOfComponentsData[i].tegName.match(componentNAmeRegExp)[0]}.html`;
        }

        resolve('done');
      }
    );
  } );
  return promise;
}

//Получаем контент из файла компонента и пишем в массив с данными
async function getComponentContent(file) {
  const promise = new Promise( (resolve) => {
    const pathToFile = path.join(pathToComponents, file);
    const stats = stat(pathToFile);
    stats.then(
      (stats) => {
        if(stats.isFile() && findMatches(file)) {
          const read = readFile(pathToFile, 'utf-8');
          read.then(
            (value) => {
              let index = getIndex(file);
              arrayOfComponentsData[index].data = value;
              resolve('done');
            },
            (err) => console.log(`error in function getComponentContent____${err}`)
          );
        } else {
          resolve('done');
        }
      }
    );
  } );
  return promise;
}

//Проходим по всем компонентам и записываем их данные в массив
async function createArrayOfDataFromComponents() {
  let promise = new Promise( (resolve) => {
    let array0fPromises = [];
    const readComponentDir = readdir(pathToComponents, 'UTF-8');
    
    readComponentDir.then(
      (dirContent) => {
        for(let file of dirContent) {
          const promise = getComponentContent(file);
          array0fPromises.push(promise);
        }
        Promise.all(array0fPromises).then(() => {
          resolve('done');
        });
      }
    );
  } );

  return promise;
}

function createContentForIndexHTML() {

  const border1 = '<!-- ============================== -->';
  const border2 = '<!-- ============================== -->';

  for(let i = 0; i < arrayOfComponentsData.length; i++ ) {
    let reg1 = new RegExp(/^[^\r\n<]/, 'mg');
    let reg2 = new RegExp(/^</, 'mg');
    let arr = [];
    for(let k = 0; k <arrayOfComponentsData[i].spaces; k++ ) {
      let spaces = ' ';
      arr.push(spaces);
    }
    const teg = `<!--           ${arrayOfComponentsData[i].tegName}           -->`;
    let stringOfspaces = arr.join('');
    arrayOfComponentsData[i].data =  arrayOfComponentsData[i].data.replace(reg1, `${stringOfspaces}`);
    arrayOfComponentsData[i].data =  arrayOfComponentsData[i].data.replace(reg2, `${stringOfspaces}<`);
    contentForIndexHTML = contentForIndexHTML.replace(`${stringOfspaces}${arrayOfComponentsData[i].tegName}`, `${border1}\n${teg}\n${border2}\n${arrayOfComponentsData[i].data}`);
  }
}

async function readFolderWithAssets(pathToDirSrc, pathToDest) {
  const arrayOfPromises = [];
  let promise = new Promise( (resolve) => {
    const read = readdir(pathToDirSrc, 'UTF-8');
    arrayOfPromises.push(read);
    read.then(
      (filesInFolder) => {
        for(let file of filesInFolder) {
          const pathToFile = path.join(pathToDirSrc, file);
          const stats = stat(pathToFile);

          stats.then(
            (stats) => {
              if(stats.isFile()) {
                const copy = copyFile(pathToFile, path.join(pathToDest, file));
                arrayOfPromises.push(copy);
                copy.then(
                  () => resolve('done'),
                  (err) => console.log(`error____${err}`)
                );
              }
              if(stats.isDirectory()) {

                const pathToDestDirectory = path.join(pathToDest, file);
                let createDir = mkdir(pathToDestDirectory);
                arrayOfPromises.push(createDir);
                createDir.then(
                  () => readFolderWithAssets(pathToFile, pathToDestDirectory),
                  (err) => console.log(`error____${err}`)
                );
              }
            }
          );
        }
      },
      (err) => {
        console.log(`error in function readFolderWithAssets____${err}`);
      }
    );
    Promise.all(arrayOfPromises).then(() => {
      resolve('done');
    });
  } );
  return promise;
}

createProjectDirectory().then(
  () => createAssetsDirectory()
).then(
  () => readFolderWithAssets(pathToSourceAssets, pathToProjectAssets)
).then(  
  () => addContentToStyle()
).then(
  () => getTegsNameToReplace()
).then(
  () => createArrayOfDataFromComponents()
).then(
  () => createContentForIndexHTML()
).then(
  () => {
    writeFile(pathToIndex, contentForIndexHTML, (err) => {
      if (err) throw err;
    });
  }
).then(
  () => console.log('Бандл создан!')
);
