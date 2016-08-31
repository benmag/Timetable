/**
 * Response variable to be set when responding to IPC message asynchronously
 */
var asyncResponse = null;

/**
 * Called when the user clicks on the extension icon in the address bar
 */
chrome.browserAction.onClicked.addListener(function(tab) {
  launchTimetabler(true);
});

/**
 * Open or focus the main timetabler page
 */
function launchTimetabler(indexURL) {
  // Add event listener to respond when the page has loaded
  chrome.tabs.onUpdated.addListener(checkLoad);
  chrome.tabs.create({ url: indexURL, active: false });
}

function focusTimetabler(tabs) {
  // If there's more than one, close all but the first
  for (var i = 1; i < tabs.length; i++) {
      chrome.tabs.remove(tabs[i].id);
  }

  // Focus the window and tab containing the page we want
  chrome.tabs.update(tabs[0].id, {active: true});
  chrome.windows.update(tabs[0].windowId, {focused: true});
}

/**
 * Listen for checkTab messages from the injected script
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.checkTab){
    // Check if a timetabler tab is open
    var indexURL = chrome.extension.getURL("index.html");
    chrome.tabs.query({ url: indexURL }, function(tabs) {
      if (tabs.length === 0) {
        launchTimetabler(indexURL);
        asyncResponse = sendResponse;
      } else {
        focusTimetabler(tabs);
        sendResponse("Done!");
      }
    });

    // Keep the port open for async response
    return true;
  }
});

/**
 * Checks if the timetabler page has finished loading
 */
function checkLoad(tabId, info, tab) {
  // "loading" seems to achieve enough wait time
  if (info.status == "loading") { // "complete"
    if (tab.url == chrome.extension.getURL("index.html")) {
      chrome.tabs.onUpdated.removeListener(checkLoad);
      asyncResponse("Done!");
      asyncResponse = null;
    }
  }
}
