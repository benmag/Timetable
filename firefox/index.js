// Import the page-mod API
var pageMod = require("sdk/page-mod");

var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");

// Import the self API
var self = require("sdk/self");
 
// Create a page-mod
pageMod.PageMod({
  include: "https://qutvirtual3.qut.edu.au/qv*",
  contentScriptFile: [self.data.url("js/jquery.js"), self.data.url("js/inject.js")]
});

var button = buttons.ActionButton({
  id: "timetabler-link",
  label: "Open QUT Timetabler",
  icon: {
    "16": "./icon16.png",
    "48": "./icon48.png",
    "128": "./icon128.png"
  },
  onClick: handleClick
});

function handleClick(state) {
  var alertContentScript = "self.port.on('unit', function(message) {" +
                           "  alert('hello');" +
                           "  class_info = JSON.parse(message);" +
                           "  updateClassTimesList();" +
                           "})";

  tabs.on("ready", function(tab) {
    worker = tab.attach({
      contentScript: alertContentScript
    });
  });

  tabs.open("index.html");
}

