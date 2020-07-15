const shell = require("shelljs");

const action = (payload) => {
  shell.exec(`sh ./actions/video.sh ${payload}`);
};

module.exports = {
  action,
};
