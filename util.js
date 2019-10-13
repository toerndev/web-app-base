const exec = require('child_process').exec;
const fs = require('fs');

async function execSyncWithOutput(cmd) {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, err => {
      reject(err);
    });
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on('exit', () => resolve());
  });
}

async function modifyJson(jsonPath, fn) {
  const jsonStr = fs.readFileSync(jsonPath, 'utf8');
  const obj = JSON.parse(jsonStr);
  fn(obj);
  fs.writeFileSync(jsonPath, JSON.stringify(obj, null, 2), 'utf8');
}

// pattern must not contain double quotes
async function runSed(filepath, pattern) {
  const cmd = `sed -i "${pattern}" '${filepath}'`;
  console.log(cmd);
  await execSyncWithOutput(cmd);
}

module.exports = {
  execSyncWithOutput,
  modifyJson,
  runSed,
};
