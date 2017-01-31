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
  var items = $(".class-container").find(".class-list").get();
  items.sort(function(a,b){
    var keyA = $(a).text();
    var keyB = $(b).text();

    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

  $(".class-container").append(items);
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
  if ($(".class-container").find(".unit-name:contains(" + unitData.unitID + ")").length > 0) {
    notify(unitData.unitID + " has already been imported!");
    return false;
  }

  // Check if the max units has been reached
  if ($(".class-container").find(".class-list").length >= 10) {
    notify("Max units imported. Take it easy, tiger!");
    return false;
  }

  // Human-readable class types
  var classNames = {
    "LEC": "Lectures",
    "TUT": "Tutorials",
    "PRC": "Practicals",
    "WOR": "Workshops",
    "CLB": "Computer Labs"
  };

  // Placeholder categories for classes
  var categorisedClasses = {
    "LEC": [],
    "TUT": [],
    "PRC": [],
    "WOR": [],
    "CLB": []
  };

  // Convert the class data into div elements and categorise by class type
  for (var c in unitData.classes) {
    // Check key doesn't originate from prototype
    if (!unitData.classes.hasOwnProperty(c)) {
      continue;
    }

    var classType = unitData.classes[c].classType;
    var day = unitData.classes[c].day;
    var start = unitData.classes[c].start;
    var end = unitData.classes[c].end;

    // Create the class
    var classElement = crel("div",
      {
        "class": "class",
        "unitID": unitData.unitID,
        "unitName": unitData.unitName,
        "className": unitData.classes[c].className,
        "classType": classType,
        "day": day,
        "start": start,
        "end": end,
        "location": unitData.classes[c].location,
        "staff": unitData.classes[c].staff,
      },
      crel("div", {
        "class": "class-text"
      }, day + ": " + start + " - " + end )
    );

    classElement.selected = unitData.classes[c].selected;

    // Check if the class type exists
    if (classType in categorisedClasses) {
      // Add the class to its respective category
      categorisedClasses[classType].push(classElement);
    } else {
      // Add the class type as a new category
      classNames[classType] = classType + "s";
      categorisedClasses[classType] = [classElement];
    }
  }

  var classGroups = [];

  Object.keys(categorisedClasses).forEach(function(key) {
    var classes = categorisedClasses[key];
    if (classes.length < 1) {
      return false;
    }

    // Add a bold heading for the category
    var classGroup = [crel("div", {
      "class": camelise(classNames[key])
    }, crel("b", {"class": "class-type"}, classNames[key]))];

    // TODO Automatically select classes with no alternatives
    // if (classes.length === 1) {
    //   $(classes[0]).attr("selected", "true");
    //   $(classes[0]).append(crel("div", {"class": "remove-class"}, "x"));
    // }

    // Append the classes after the heading and add to list of groups
    $(classGroup[0]).append(classes);
    classGroups.push(classGroup);
  });

  // Add the class groups into a hidden div to be expanded later
  unitList = [crel("div", {
    "class": "classes", "style": "display: none;"
  })].concat(classGroups);

  // Create a list item for the unit to be added to the sidebar
  var unitElement = crel("li", {
    "class": "class-list"
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
  $(".class-container").append(unitElement);
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
