/**
 * Open or focus the main timetabler page
 */
function launchTimetabler(focus) {
  var optionsUrl = chrome.extension.getURL("index.html");
  chrome.tabs.query({ url: optionsUrl }, function(tabs) {
    if (tabs.length === 0) {
      // If tab doesn't exist, create it
      chrome.tabs.create({ url: optionsUrl });
    } else {
      // If there's more than one, close all but the first
      for (var i = 1; i < tabs.length; i++) {
          chrome.tabs.remove(tabs[i].id);
      }

      if (focus) {
        chrome.tabs.update(tabs[0].id, {active: true});
        chrome.windows.update(tabs[0].windowId, {focused:true});
      }
    }
  });
}

/**
 * Called when the user clicks on the extension icon in the address bar
 */
chrome.browserAction.onClicked.addListener(function(tab) {
  launchTimetabler(true);
});

/**
 * Listen for various Chrome messages from the injected script
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "checkTab"){
    // Check the timetabler is open, but do not focus the tab
    launchTimetabler(false);
    sendResponse("Done!");
  }
});
