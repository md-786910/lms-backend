//configure event emitter
const eventObj = require("../events/events");
const EventEmiter = require("events");
const eventEmitter = new EventEmiter();

eventEmitter.on(eventObj.REGISTER_EMPLOYE, (data) => {
  console.log({ data });
});

module.exports = eventEmitter;
