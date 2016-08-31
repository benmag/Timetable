/**
 * Show a notification indicating the class has been imported.
 * Clicking the notification will open up the timetabler
 * TODO: Fix the scope of launchTimetabler
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
  var items = $(".class-container .class-list").get();
  items.sort(function(a,b){
    var keyA = $(a).text();
    var keyB = $(b).text();

    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

  var ul = $(".class-container");
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
  if ($(".class-container").find("a:contains(" + unitID + ")").length > 0) {
    notify(unitID + " has already been imported!");
    return;
  }

  // Check if the max units has been reached
  if ($(".class-container").find(".class-list").length >= 10) {
    notify("Max units imported. Take it easy, tiger!");
    return;
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
  for (var c in classes) {
    var classType = classes[c].classType;

    var day = classes[c].day;
    var start = classes[c].time.start;
    var end = classes[c].time.end;
    var classElement = crel("div", {
      "class": "class",
      "unitID": unitID,
      "unitName": unitName,
      "className": classes[c].className,
      "classType": classType,
      "day": day,
      "start": start,
      "end": end,
      "location": classes[c].location,
      "staff": classes[c].staff
    }, day + ": " + start + " - " + end );

    // Add each class type to their respective category
    if (classType in categorisedClasses) {
      categorisedClasses[classType].push(classElement);
    } else {
      // Add the class type as a new category
      classNames[classType] = classType + "s";
      categorisedClasses[classType] = [classElement];
    }
  }

  var classGroups = [];
  $.each(categorisedClasses, function(key, classes) {
    if (classes.length > 0) {
      // Add a bold heading for the category
      var classGroup = [crel("div", {
        "class": camelise(classNames[key].toLowerCase())
      }, crel("b", classNames[key]))];

      // Automatically select classes with no alternatives
      if (classes.length === 1) {
        $(classes[0]).attr("selected", "true");
        $(classes[0]).append(crel("div", {"class": "remove-class"}, "x"));
      }

      // Append the classes after the heading and add to list of groups
      classGroup = classGroup.concat(classes);
      classGroups.push(classGroup);
    }
  });

  // Add the class groups into a hidden div to be expanded later
  unitList = [crel("div", {
    "class": "classes", "style": "display: none;"
  })].concat(classGroups);

  // Create a list item for the unit to be added to the sidebar
  var unitElement = crel("li", {"class": "class-list"},
    crel("div", {"class": "remove-unit"}, "x"),
    crel("a", unitID),
    crel.apply(crel, unitList)
  );

  // Add the element to the class list in the sidebar
  $(".class-container").append(unitElement);
  $(window).trigger("resize");
  $(unitElement).scrollLock();

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
  if (request.unitImport) {
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
