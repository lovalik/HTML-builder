const process = require('process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const file = 'message.txt';
let userMessage = '';
let pathToFile = path.join(__dirname, file);

function deleteFile() {
  fs.unlink(pathToFile, (error) => {
    if (error) {
      console.log(error);
    }
  });
}

function writeFile(text) {
  fs.writeFile(pathToFile, text, (error) => {
    if (error) {
      console.log(error);
    }
  });
}

writeFile(userMessage);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Hello, please enter your message:');

rl.on('line', (input) => {
  rl.prompt();
  if( input === 'exit') {
    rl.close();
    deleteFile();
  } else {
    userMessage = userMessage + input + ' ';
    writeFile(userMessage);
  }
});

process.on('exit', () => {
  deleteFile();
  console.log('Goodbye!');
});
