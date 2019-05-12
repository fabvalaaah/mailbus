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
    new transports.Console({
      level: "info"
    }),
    new transports.Console({
      level: "error"
    }),
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

const fetchOptions = {
  bodies: [""],
  markSeen: false
};

let connection;

const compareEmails = (email1, email2) => {
  if (email1.attributes.date === email2.attributes.date) {
    return 0;
  }

  return email1.attributes.date < email2.attributes.date ? -1 : 1;
};

const fetchUnseenEmails = () => connection.search(["UNSEEN"], fetchOptions);

const getEmailByUID = uid => connection.search([["UID", uid]], fetchOptions);

const isEmailSeenByUID = uid =>
  getEmailByUID(uid).then(email => {
    if (email[0]) {
      let seen = false;
      email[0].attributes.flags.map(flag => {
        if (flag.toUpperCase() === "\\SEEN") {
          seen = true;
        }
      });

      return seen;
    }

    Promise.reject();
  });

const markEmailAsSeenByUID = uid => connection.addFlags(uid, ["\\SEEN"]);

const config = {
  ...require("./config.json"),
  onend: () => {
    logger.info("ended");
  },
  onclose: () => {
    logger.info("closed");
  },
  onmail: () => {
    fetchUnseenEmails()
      .then(async emails => {
        // Sorting unseen emails to process them chronologically (just to make sure)
        emails.sort(compareEmails);

        // Iterating through unseen emails
        for (let i = 0; i < emails.length; i++) {
          // Parsing current unseen email
          const email = emails[i];
          let parsed;
          try {
            parsed = await simpleMailParser(email.parts[0].body);
          } catch (err) {
            logger.error(
              `failed to parse the email with UID "${
                email.attributes.uid
              }"\n${err}`
            );
            continue;
          }
          const actionName = parsed.subject.trim().toLowerCase();
          const payload = parsed.text.trim();

          // Getting the corresponding action name regarding the email subject
          logger.info(`"${actionName}" action triggered`);
          const actionInstance = actions[actionName];
          if (!actionInstance) {
            logger.info(`action "${actionName}" not found`);
            continue;
          }

          // Checking if the email is still unseen (it could have been processed
          // by another mailbus instance at this point)
          let isSeen;
          try {
            isSeen = await isEmailSeenByUID(email.attributes.uid);
          } catch (err) {
            logger.error(
              `failed to get the email with UID "${
                email.attributes.uid
              }"\n${err}`
            );
            continue;
          }
          if (isSeen) {
            logger.info(`action "${actionName}" already performed`);
            continue;
          }

          // Marking the email as seen to prevent it to be processed by another
          // mailbus instance
          try {
            await markEmailAsSeenByUID(email.attributes.uid);
          } catch (err) {
            logger.error(
              `failed to mark the email with UID ${
                email.attributes.uid
              } as seen\n${err}`
            );
            continue;
          }

          // Performing the actual action
          try {
            actionInstance.action(payload);
          } catch (err) {
            logger.error(`failed to perform the action ${actionName}\n${err}`);
          }
        }
      })
      .catch(err => {
        logger.error(`failed to fetch unseen emails\n${err}`);
      });
  }
};

simpleImap.connect(config).then(conn => {
  connection = conn;
  connection.openBox("INBOX");
  logger.info("started");
});
