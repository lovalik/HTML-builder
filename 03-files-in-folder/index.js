const fs = require('fs');
const path = require('path');

const folderName = 'secret-folder';
const pathToFolder = path.join(__dirname, folderName);

fs.readdir(pathToFolder, 'UTF-8', (error, date) => {
  if (error) {
    console.log(error);
  } else {
    for(let file of date) {
      fs.stat( path.join(pathToFolder, file), 'utf-8', (error, stats) => {
        if (error) {
          console.log(error);
        } else {
          if ( !stats.isFile() ) return;

          const name = path.basename(path.join(pathToFolder, file), path.extname(file));
          const extension = path.extname(file).match(/[\w]{1,30}$/);

          console.log(`${name} -- ${extension} -- ${stats.size} byte`);
        }
      });
    }
  }
});
