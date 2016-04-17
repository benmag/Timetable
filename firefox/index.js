var pageMod = require("sdk/page-mod");
var {ActionButton} = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var self = require("sdk/self");
 
// Inject buttons into QUT pages with class info
pageMod.PageMod({
  include: "https://qutvirtual3.qut.edu.au/qv*",
  contentScriptFile: ["./js/jquery.js", "./js/inject.js"],
  onAttach: startListening
});
pageMod.PageMod({
  include: "resource://firefox/data/index.html",
  contentScriptFile: ["./js/main.js"],
  onAttach: "window.alert('injected');"
});

const pageAction = ActionButton({
  id: "timetabler-open",
  label: "Open QUT Timetabler",
  icon: {
    "16": "./icon16.png",
    "48": "./icon48.png",
    "128": "./icon128.png"
  },
  onClick: handleClick
});

function handleClick(state) {
  tabs.open("index.html");
}

function startListening(worker) {
  worker.port.on('unit', function(payload) {
    //Check if timetabler is open
    for (let tab of tabs) {
      if (tab.url == "resource://firefox/data/index.html") {
        
        //Send payload to timetabler
        tab.activate();
        worker = tab.attach({
          contentScript: "alert('hello');"
        });
        worker.port.emit("unit", payload);
        return;
        
      }
    }
    
    tabs.open({
      url: "index.html",
      onOpen: function onOpen(tab) {
        tab.window.port.emit("unit", payload);
      }
    });
    
  });
} 

