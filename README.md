# MailBus

MailBus is a daemon that triggers actions on emails content regarding
their subjects.

This NodeJS project has been developed and tested on the following environment:
- Lubuntu Linux 18.04.2 LTS (Bionic Beaver) x64
- NPM 6.4.1
- NodeJS v10.15.3 (managed with NVM)
- Microsoft Visual Studio Code
- using the "laposte.net" email provider (https://www.laposte.net/accueil)

MailBus considers an email box as a queue. MailBus listens to this
email box waiting to receive new messages. When new messages are detected, they are
read sequentially in a chronological order. If the subject of an email corresponds to the name of an action
which is basically a NodeJS plugin stored in the "actions" folder of the project,
it will then mark the email as read to prevent it to be read again and it will execute
the code of this action. If the subject of an email doesn't correspond to an actual action,
it is left as is (nothing is done and the email is not tagged as read).

Using an email box as a message/event broker or a queue is not that natural but provides
some interesting benefits:
- It does not need any particular installation, configuration or maintenance,
  fully relieving on the email provider and the IMAP protocol.
- It just comes in addition of a traditional usage of an email box.
- It keeps the history of messages.
- Even if MailBus has been thought with one instance per email box in mind to ensure the actions to be executed sequentially, it can be scaled by adding several instances on a single email box. As a consequence in this situation, actions may not be performed in a chronological order. However, there is no load-balancing mechanism (just a first-come first-served mechanism).

Using an email box also brings downsides:
- Event processing can not be considered as "real-time" because of the delay that can exist between the email sending and its reception/processing (in most cases, it's around few seconds but this time is not garanteed and can sometimes be longer than minutes).
- You may expect issues with some email providers. In particular, it must support long term connections ("keepalive" and "noop" usage must be configured in the "config.json" file).

## Installation

- Get to the root directory, then run `npm i` to grab all the needed modules from
  NPM to make things work.
- Rename "config.EXAMPLE.json" into "config.json" then replace the missing values with your own into the file. If needed, the full list of configuration options is here in the "node-imap" NPM module documentation: https://github.com/mscdex/node-imap#connection-instance-methods
- Put your own NodeJS actions in the "actions" folder. Go see "actions/test.js" and "actions/youtube.js" as examples to get a starting point.

Changes in the configuration and in the "actions" folder will only be considered at MailBus start.

## Usage

MailBus better works with PM2 (http://pm2.keymetrics.io/) to manage restarts at connexion failures and for its great monitoring features as well. That's the reason why "pm2" is automatically installed globally when running `npm i` (thanks to the "preinstall" script of "package.json"). Then, launching and keeping an eye on MailBus becomes easy:
- Simply execute `npm start` in a console opened in the root directory of the project to run the daemon.
- Execute `pm2 monit` to monitor the pm2 wrapped NodeJS application.
- Execute `pm2 list` to list running pm2 wrapped NodeJS application and get the ID of MailBus.
- Execute `pm2 stop <the ID of MailBus>` to stop the daemon.
- If you want to make sure everything is running OK, just send an email to the one MailBus is listening to. This email subject must be `test` and its body can be `Hello world!` (or whatever you want). Then you will see the "test" action (with the payload) has been processed in the "logs/info.log" file.

## The basic YouTube use case

So, here's the basic story that brought this up: I'm watching an interesting documentary on YouTube with my Android smartphone while doing the dishes. Then I have to go to bed so I now want to quickly and easily share this video with the Raspberry Pi (running a MailBus daemon) connected to my very old 720p flatpanel TV of my bedroom. I just have to use the "share by email" option of the YouTube Android app, changing its default email subject by `youtube`. Few seconds later, this video is automatically opened (and paused) in fullscreen by MailBus on my TV.

## DONATION

As I share these sources for commercial use too, maybe you could consider
sending me a reward (even a tiny one) to my **Ethereum** wallet at the address
**0x1fEaa1E88203cc13ffE9BAe434385350bBf10868**
If so, I would be forever grateful to you and motivated to keep up the good work
for sure :oD **Thanks in advance!**

## FEEDBACK

You like my work? It helps you? You plan to use/reuse/transform it? You have
suggestions or questions about it? Just want to say "hi"? Let me know your
feedbacks by mail to the address fabvalaaah@laposte.net

## DISCLAIMER

I am not responsible in any way of any consequence of the usage of this piece of
software. You are warned, use it at your own risks.
