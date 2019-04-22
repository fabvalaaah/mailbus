/*
 * MIT License
 *
 * Copyright (c) 2019 Fabvalaaah - fabvalaaah@laposte.net
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * DONATION:
 * As I share these sources for commercial use too, maybe you could consider
 * sending me a reward (even a tiny one) to my Ethereum wallet at the address
 * 0x1fEaa1E88203cc13ffE9BAe434385350bBf10868
 * If so, I would be forever grateful to you and motivated to keep up the good
 * work for sure :oD Thanks in advance !
 *
 * FEEDBACK:
 * You like my work? It helps you? You plan to use/reuse/transform it? You have
 * suggestions or questions about it? Just want to say "hi"? Let me know your
 * feedbacks by mail to the address fabvalaaah@laposte.net
 *
 * DISCLAIMER:
 * I am not responsible in any way of any consequence of the usage
 * of this piece of software. You are warned, use it at your own risks.
 */

// Logger init
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(label({ label: "mailbus" }), timestamp(), myFormat),
  transports: [
    new transports.File({
      filename: "./logs/info.log",
      level: "info"
    }),
    new transports.File({
      filename: "./logs/error.log",
      level: "error"
    })
  ]
});
// -------

const simpleImap = require("imap-simple");
const simpleMailParser = require("mailparser").simpleParser;
const importModules = require("import-modules");
const actions = importModules("./actions");

let connection;

const config = {
  ...require("./config.json"),
  onend: () => {
    logger.info("ended");
  },
  onclose: () => {
    logger.info("closed");
  },
  onmail: () => {
    let searchCriteria = ["UNSEEN"];

    let fetchOptions = {
      bodies: [""],
      markSeen: true
    };

    connection
      .search(searchCriteria, fetchOptions)
      .then(async emails => {
        // No 'map' usage cause order matters
        // (forEach suffers of low performances BTW)
        for (let i = 0; i < emails.length; i++) {
          let email = emails[i];

          // No promise usage to ensure the sequential execution
          let parsed = await simpleMailParser(email.parts[0].body);
          let actionName = parsed.subject.trim().toLowerCase();
          let payload = parsed.text.trim();

          logger.info(`"${actionName}" action triggered`);
          let actionInstance = actions[actionName];
          if (actionInstance) {
            try {
              actionInstance.action(payload);
            } catch (err) {
              logger.error(
                `something wrong happened while performing the action\n${err}`
              );
            }
          } else {
            logger.info(`"${actionName}" not found`);
          }
        }
      })
      .catch(err => {
        logger.error(`failed to fetch unread emails\n${err}`);
      });
  }
};

simpleImap.connect(config).then(conn => {
  connection = conn;
  connection.openBox("INBOX");
  logger.info("started");
});
