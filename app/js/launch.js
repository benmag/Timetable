/**
 * Response variable to be set when responding to IPC message asynchronously
 */
var asyncResponseMethod = null;

/**
 * Called when the user clicks on the extension icon in the address bar
 */
chrome.browserAction.onClicked.addListener(function(tab) {
  launchTimetabler(true, null);
});

/**
 * Open or focus the main timetabler page
 */
function launchTimetabler(focus, sendResponse) {
  // Check if a timetabler tab is open
  // BUG Tab check does not work in Firefox
  var indexURL = chrome.extension.getURL("index.html");
  chrome.tabs.query({ url: indexURL }, function(tabs) {
    if (tabs.length === 0) {
      // Add event listener to respond when the page has loaded
      if (sendResponse !== null) {
        asyncResponseMethod = sendResponse;
        chrome.tabs.onUpdated.addListener(checkLoad);
      }
      chrome.tabs.create({ url: indexURL, active: focus });
    } else {
      // If there's more than one, close all but the first
      var len = tabs.length, i = 1;
      for (i; i < len; i++) {
        chrome.tabs.remove(tabs[i].id);
      }

      // Focus the window and tab containing the page we want
      chrome.tabs.update(tabs[0].id, {active: true});
      chrome.windows.update(tabs[0].windowId, {focused: true});

      // Tell the injected script to send data
      if (sendResponse !== null) {
        sendResponse("Done!");
      }
    }
  });
}

/**
 * Listen for checkTab messages from the injected script
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.checkTab){
    // Pass along the sendReponse method for delayed use
    launchTimetabler(false, sendResponse);

    // Keep the port open for async response
    return true;
  }
});

/**
 * Checks if the timetabler page has finished loading
 */
function checkLoad(tabId, info, tab) {
  // "loading" seems to achieve enough wait time
  if (tab.url == chrome.extension.getURL("index.html")) {
    if (info.status == "complete") { // "complete"
      chrome.tabs.onUpdated.removeListener(checkLoad);
      asyncResponseMethod("Done!");
      asyncResponseMethod = null;
    }
  }
}

/**
 * Check whether new version is installed
 * http://stackoverflow.com/a/14957674
 */
chrome.runtime.onInstalled.addListener(function(details) {
  // TODO Check for and remove deprecated 'classLists' in localStorage
  if (details.reason == "install"){
    console.log("This is a first install!");
  } else if (details.reason == "update"){
    var thisVersion = chrome.runtime.getManifest().version;
    console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
  }
});
