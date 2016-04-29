/**
 * Open or focus the main timetabler page
 */
function launchTimetabler(focus) {
  var optionsUrl = chrome.extension.getURL("timetabler.html");
  chrome.tabs.query({ url: optionsUrl }, function(tabs) {
    if (tabs.length === 0) {
      // If tab doesn't exist, create it
      chrome.tabs.create({ url: "timetabler.html" });
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
 * Show a notification indicating the class has been imported.
 * Clicking the notification will open up the timetabler
 */
function notify(text) {
  // Check their bowser can handle notifications
  if (!Notification) {
    launchTimetabler(true);
  } else {
    if (Notification.permission != "granted") {
      Notification.requestPermission();
    } else {
      var notification = new Notification(text, {
        icon: "https://www.qut.edu.au/qut-logo-og-200.jpg",
        body: "Click here to start planning."
      });

      notification.onclick = function () {
        launchTimetabler(true);
      };
    }
  }
}

/**
 * Convert the given string into Camel Case (e.g. "Class Name" -> "className")
 */
function camelise(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

/**
 * Sort the list of units in the sidebar alphabetically
 */
function sortUnitsAlphabetically() {
  var items = $(".class_container .class_list").get();
  items.sort(function(a,b){
    var keyA = $(a).text();
    var keyB = $(b).text();

    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

  var ul = $(".class_container");
  $.each(items, function(i, li){
    ul.append(li);
  });
}

/**
 * Adds the unit and class elements into the sidebar
 */
function updateUnitList(unitData) {
  var unitID = unitData.unitID;
  var unitName = unitData.unitName;
  var classes = unitData.classes;

  // Check if the class has already been imported
  if ($(".class_container").find("a:contains(" + unitID + ")").length > 0) {
    notify(unitID + " has already been imported!");
    return;
  }

  // Check if the max units has been reached
  if ($(".class_container").find(".class_list").length >= 10) {
    notify("Max units imported. Take it easy, tiger!");
    return;
  }

  // Placeholder categories for classes
  var categorisedClasses = {
    "LEC": [],
    "TUT": [],
    "PRC": [],
    "WOR": [],
    "CLB": [],
    "other": []
  };

  var classNames = {
    "LEC": "Lectures",
    "TUT": "Tutorials",
    "PRC": "Practicals",
    "WOR": "Workshops",
    "CLB": "Computer Labs",
    "other": "Other Classes",
  };

  var validClassTypes = [];
  $.each(categorisedClasses, function(key) {
    validClassTypes.push(key);
  });

  // Convert the times into a bunch of elements
  for (var c in classes) {
    var classType = classes[c].classType;

    var classElement = crel("div", {
        "class": "class",
        "unitID": unitID,
        "unitName": unitName,
        "className": classes[c].className,
        "classType": classType,
        "day": classes[c].day,
        "start": classes[c].time.start,
        "end": classes[c].time.end,
        "location": classes[c].location,
        "staff": classes[c].staff
      },
      classes[c].day + ": " + classes[c].time.raw
    );

    // Add each class type to their respective variable
    if ($.inArray(classType, validClassTypes) >= 0) {
      categorisedClasses[classType].push(classElement);
    } else {
      categorisedClasses.other.push(classElement);
    }
  }

  var classCategoryElements = [];
  var crelOptions;
  $.each(categorisedClasses, function(key, classes) {
    if (classes.length > 0) {
      crelOptions = ["div", {"class": camelise(classNames[key])}, crel("b", classNames[key])];
      crelOptions = crelOptions.concat(classes);
      classCategoryElements.push(crel.apply(crel, crelOptions));
    }
  });

  crelOptions = ["div", {"class": "classes", "style": "display: none;"}].concat(classCategoryElements);
  classesElement = crel.apply(crel, crelOptions);

  var classListElement = crel("li", {"class": "class_list"},
    crel("div", {"class": "remove_unit"}, "x"),
    crel("a", unitID),
    classesElement
  );

  // Add the element to the class list in the sidebar
  $(".class_container").append(classListElement);
  $(window).trigger("resize");
  $(classesElement).scrollLock();

  // Notify the user that their times have been imported
  notify("Class times for " + unitID + " imported!");

  // Sort the units in the sidebar alphabetically
  sortUnitsAlphabetically();

  // Track this with GA
  _gaq.push(["_trackEvent", unitName, "imported"]);
}

/**
 * Listen for various Chrome messages from the injected script
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "checkTab"){
    // Check the timetabler is open, but do not focus the tab
    launchTimetabler(false);
    sendResponse("Done!");
  } else if (request.type == "unit_import"){
    // Update timetable options
    classInfo = JSON.parse(request.class_info);
    updateUnitList(classInfo);
  }
});

/**
 * Initialise Google Analytics
 */
var _gaq = _gaq || [];
_gaq.push(["_setAccount", "UA-51599319-1"]);
_gaq.push(["_trackPageview"]);

(function() {
  var ga = document.createElement("script"); ga.type = "text/javascript"; ga.async = true;
  ga.src = "https://ssl.google-analytics.com/ga.js";
  var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ga, s);
})();
