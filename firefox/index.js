// Import the page-mod API
var pageMod = require("sdk/page-mod");

var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");

// Import the self API
var self = require("sdk/self");

 
// Create a page-mod
// It will run a script whenever a ".org" URL is loaded
// The script replaces the page contents with a message
pageMod.PageMod({
  include: "https://qutvirtual3.qut.edu.au/qv*",
  contentScriptFile: [self.data.url("js/jquery.js"), self.data.url("js/inject.js")]
});

var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Visit Mozilla",
  icon: {
    "16": "./icon16.png",
    "48": "./icon32.png",
    "128": "./icon64.png"
  },
  onClick: handleClick
});

function handleClick(state) {
  tabs.open("index.html");
}