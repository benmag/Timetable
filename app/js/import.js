/* GLOBAL */
var CLASS_NAME = 0;
var CLASSES = 1;

/**
 * Show a notification indicating the class has been imported.
 * Clicking the notification will open up the timetabler
 * TODO Fix the scope of launchTimetabler
 */
function notify(text) {
  // Check their bowser can handle notifications
  if (!Notification) {
    launchTimetabler(true, null);
  } else {
    if (Notification.permission != "granted") {
      Notification.requestPermission();
    } else {
      var notification = new Notification(text, {
        icon: "https://www.qut.edu.au/qut-logo-og-200.jpg",
        body: "Click here to start planning."
      });

      notification.onclick = function() {
        launchTimetabler(true, null);
      };
    }
  }
}

/**
 * Convert the given string into Camel Case (e.g. "Class Name" -> "className")
 * http://stackoverflow.com/a/2970667
 */
function camelise(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

/**
 * Sort the list of units in the sidebar alphabetically
 * http://stackoverflow.com/a/304428
 */
function sortUnitsAlphabetically() {
  var items = $("#class-container").find(".class-list").get();
  items.sort(function(a,b){
    var keyA = $(a).text();
    var keyB = $(b).text();

    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

  $("#class-container").append(items);
}

/**
 * Adds the unit and class elements into the sidebar
 */
function updateUnitList(unitData) {
  // Add the unit data directly to localStorage
  var storedData = JSON.parse(localStorage.getItem("unitData")) || {};
  storedData[unitData.unitID] = unitData;
  localStorage.setItem("unitData", JSON.stringify(storedData));

  // Check if the class has already been imported
  if ($("#class-container").find(".unit-name:contains(" + unitData.unitID + ")").length > 0) {
    notify(unitData.unitID + " has already been imported!");
    return false;
  }

  // Check if the max units has been reached
  if ($("#class-container").find(".class-list").length >= 10) {
    notify("Max units imported. Take it easy, tiger!");
    return false;
  }

  // Placeholder categories for classes
  var sortedClasses = {
    "LEC": ["Lectures",           []],
    "LET": ["Lectorial",          []],
    "TUT": ["Tutorials",          []],
    "PRC": ["Practicals",         []],
    "WOR": ["Workshops",          []],
    "CLB": ["Computer Labs",      []],
    "CTU": ["Computing Tutorial", []],
    "STU": ["Studios",            []],
    "SEM": ["Seminars",           []],
    "SSE": ["Support Sessions",   []],
    "FTR": ["Field Trips",        []]
  };

  // Convert the class data into div elements and categorise by class type
  var len = unitData.classes.length, i = 0;
  for (i; i < len; i++) {
    var classData = unitData.classes[i];
    var classType = classData.classType;
    var day = classData.day;
    var start = classData.start;
    var end = classData.end;

    // Create the class text element
    var classText = crel("div", {
      "class": "class-text"
    }, day + ": " + start + " - " + end );

    // Create the class
    var classElement = crel("div", {
      "class": "class",
      "classIndex": i,
      "className": classData.className,
      "classType": classType,
      "day": day,
      "start": start,
      "end": end,
      "location": classData.location,
      "staff": classData.staff,
    }, classText);

    classElement.selected = classData.selected;

    // Check if the class type exists
    if (classType in sortedClasses) {
      // Add the class to its respective category
      sortedClasses[classType][CLASSES].push(classElement);
    } else {
      // Add the class type as a new category
      sortedClasses[classType] = [classType + "s", [classElement]];
    }
  }

  var classGroups = [];

  Object.keys(sortedClasses).forEach(function(key) {
    var classes = sortedClasses[key][CLASSES];
    if (classes.length === 0) {
      return false;
    }

    // Add a bold heading for the category
    var classGroup = [crel("div", {
      "class": camelise(sortedClasses[key][CLASS_NAME])
    }, crel("b", {
      "class": "class-type"
    }, sortedClasses[key][CLASS_NAME]))];

    // Automatically select classes with no alternatives
    // BUG Making the class selected does not add the class to the calendar. Refresh required
    // TODO Maybe make this feature optional
    // if (classes.length === 1) {
    //   classes[0].selected = true;
    // }

    // Append the classes after the heading and add to list of groups
    $(classGroup[0]).append(classes);
    classGroups.push(classGroup);
  });

  // Add the class groups into a hidden div to be expanded later
  unitList = [crel("div", {
    "class": "classes",
    "style": "display: none;"
  })].concat(classGroups);

  // Create a list item for the unit to be added to the sidebar
  var unitElement = crel("li", {
    "class": "class-list",
    "unitID": unitData.unitID,
    "unitName": unitData.unitName
  }, crel("div", {
      "class": "list-button remove-unit",
      "aria-hidden": true
    }, "x"),
    crel("div", {
      "class": "unit-name"
    }, unitData.unitID),
    crel.apply(crel, unitList)
  );

  // Add the element to the class list in the sidebar
  $("#class-container").append(unitElement);
  $(window).trigger("resize");
  $(unitElement).children(".classes").scrollLock();

  // Notify the user that their times have been imported
  // notify("Class times for " + unitID + " imported!");

  // Sort the units in the sidebar alphabetically
  sortUnitsAlphabetically();

  // TODO Update the calendar if classes have been selected automatically
}

/**
 * Listen for various Chrome messages from the injected script TODO
 */
if (window.chrome && chrome.runtime && chrome.runtime.id) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.unitImport) {
      // Update timetable options
      classInfo = JSON.parse(request.unitData);
      updateUnitList(classInfo);
    }
  });
}
