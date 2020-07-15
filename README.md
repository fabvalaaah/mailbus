# MailBus

Node.js event broker over an email box.

**This piece of software is a proof of concept.**<br/><br/>
Its main purpose is to demonstrate the possible usage of an email box to store event messages chronologically and to automatically execute related actions locally on a device running a MailBus daemon instance listening to this email box.

Correspondences:

- Email box ⇨ The event broker
- Emails ⇨ The event messages (if their subjects correspond to names of actual actions)
- MailBus daemon ⇨ The event consumer locally executing actions related to event emails

Further observations:

- MailBus daemon can be bound to a multi-purpose email box (event emails will then get mixed with regular emails)
- Event actions are launched chronologically
- Event history is kept (event emails are just mark as read when consumed by MailBus)
- A "multiple channels" behavior can be achieved by using several specific email boxes (furthermore, email box mechanisms such as forwarding make complex workflows between channels possible)

## Installation

- `npm i`
- Rename _config.EXAMPLE.json_ into _config.json_ then fill its blank values and tweak its parameters if necessary. The list of available "node-imap" module configuration options can be found here if needed: https://github.com/mscdex/node-imap#connection-instance-methods
- Put your own actions' behaviors (written in Node.js) in _./actions_ (see _./actions/test.js_ and _./actions/video.js_ for inspiration).

## Usage

MailBus works with PM2 to manage connection failures and for monitoring features:

- Start MailBus daemon ⇨ `npm start`
- Stop MailBus daemon ⇨ `npm stop`
- Get the monitoring ⇨ `pm2 monit`
- Get logs ⇨ `pm2 logs mailbus`
- Get the list of instances ⇨ `pm2 list`
- Empty the list of instances ⇨ `pm2 delete mailbus`

Actions are stored in _./actions_<br/>
Logs are stored in _./logs_

### Quick example

Start the MailBus daemon then send an email to the email box MailBus is listening to. Set "test" (the name of the test action _./actions/test.js_) as the subject of this email and type something in its body section (e.g. "Hello world!"). Shortly after the email sending, the MailBus instance will detect this email containing a subject corresponding to the name of one of its known actions. It will then execute the test action on the payload (e.g. "Hello world!") by outputing it to the log file _./logs/info.log_ (`pm2 logs mailbus`).

## Disclaimer

I am not responsible in any way of any consequence of the usage of this piece of software. You are warned, use it at your own risks.
