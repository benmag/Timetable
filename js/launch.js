
var class_info;


/**
 * Open up the timetabler application or if it's already open,
 * bring the user to it
 */
function openOrFocusOptionsPage(selectTab) {
  var optionsUrl = chrome.extension.getURL('timetabler.html');
  // Check all tabs for the timetabler
  chrome.tabs.query({}, function(extensionTabs) {
    var found = false;
    for (var i=0; i < extensionTabs.length; i++) {
      if (optionsUrl == extensionTabs[i].url) {
        found = true;
        if (selectTab) {
          console.log("tab id: " + extensionTabs[i].id);
          chrome.tabs.update(extensionTabs[i].id, {"selected": true});
        }
      }
    }

    if (!found) {
      // Get original tab ID
      chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
      }, function(tabs) {
        var oldTab = tabs[0];

        // Open the Timetabler next to the current tab
        chrome.tabs.create({index: oldTab.index + 1, url: "timetabler.html"});

        // Get the new tab ID
        chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        }, function(newTabs) {
          var newTabID = newTabs[0].id;

          // Wait for the new tab to finish loading...
          chrome.tabs.onUpdated.addListener(function CheckLoaded(newTabID, info) {
            if (info.status == "complete") {
              chrome.tabs.onUpdated.removeListener(CheckLoaded);
              sendResponse("Done!");
            }
          });

        });

        if (!selectTab) {
          chrome.tabs.update(oldTab.id, {"selected": true});
        }

      });

    }
  });
}

/**
 * Called when the user clicks on the browser action icon (the extension icon in the address bar)
 * NOTE: Might get rid of this... Seems kinda pointless
 */
chrome.browserAction.onClicked.addListener(function(tab) {
  openOrFocusOptionsPage(true);
});


/**
 * Triggers a chrome notification so the user can see
 * that their class times have been imported. Clicking the
 * notification will open up the timetabler
 */
function notify(title) {
  // Check their bowser can handle notifications
  if (!Notification) {
    openOrFocusOptionsPage();
  }

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  } else {
    var notification = new Notification(title, {
      icon: 'https://www.qut.edu.au/qut-logo-og-200.jpg',
      body: 'Click here to start planning.'
    });
  }

  notification.onclick = function () {
    console.log(class_info);
    openOrFocusOptionsPage();
  };
}


/**
 * Adds the subject and class elements into the list on the left hand side of the timetabler page.
 */
function updateClassTimesList() {
  var unit = class_info.unit;
  var subject = class_info.subject;
  var times = class_info.times;

  // Check if the class is already imported
  if ($('.class_container').find('a:contains(' + unit + ')').length > 0) {
    notify(unit + ' has already been imported!');
    return;
  }

  // Check if the max units has been reached
  if ($('.class_container').find('.class_list').length >= 10) {
    notify('Max units imported. Take it easy, tiger!');
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

  var divClasses = {
    "LEC": "lectures",
    "TUT": "tutorials",
    "PRC": "practicals",
    "WOR": "workshops",
    "CLB": "computerLabs",
    "other": "otherTypes",
  };

  var humanReadableClassNames = {
    "LEC": "Lectures",
    "TUT": "Tutorials",
    "PRC": "Practicals",
    "WOR": "Workshops",
    "CLB": "Computer Labs",
    "other": "Other",
  };

  var validClassTypes = [];
  $.each(categorisedClasses, function(key) { validClassTypes.push(key) });

  // Convert the times into a bunch of elements
  for (time in times) {
    var classType = times[time].activity;

    var classElement = crel("div", {
        "class": "class " + times[time].activity.toLowerCase() + " ui-draggable",
        "text": unit + "\n" + times[time].activity + " " + times[time].location + "\n\n" + subject,
        "activity": times[time].activity,
        "day": times[time].day,
        "start": times[time].time.start,
        "end": times[time].time.end,
        "location": times[time].location,
        "subject": subject,
        "style": "position: relative;"
      },
      times[time].day + ': ' + /*' @ ' + times[time].location + '<br>' + */
      times[time].time.raw
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
      crelOptions = ["div", {"class": divClasses[key]}, crel('b', {"class": key.toLowerCase()}, humanReadableClassNames[key])];
      crelOptions = crelOptions.concat(classes);
      classCategoryElements.push(crel.apply(crel, crelOptions));
    }
  });

  var crelOptions = ["div", {"class": "classes", "style": "display: none;"}].concat(classCategoryElements)
    , classesElement = crel.apply(crel, crelOptions);

  var classListElement = crel("li", {"class": "class_list"},
    crel("div", {"class": "remove_unit"}, "x"),
    crel("a", unit),
    classesElement
  );

  // Add the element to the class list in the sidebar
  $('.class_container').append(classListElement);
  $(window).trigger('resize');
  $(classesElement).scrollLock();

  // Notify the user that their times have been imported
  notify('Class times for ' + unit + ' imported!');

  // Track this with GA
  _gaq.push(['_trackEvent', subject, 'imported'])
}

// Listen for 'importComplete' message (triggered when classes are imported)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.type == "init") {
    // Open up the timetabler page
    openOrFocusOptionsPage(true);
  } else if (request.type == "checkTab"){
    // Check the timetabler is open, but do not focus the tab
    openOrFocusOptionsPage(false);
    sendResponse("Done!");
  } else if (request.type == "importComplete"){
    // Update the global class_info var to hold this subject now
    class_info = JSON.parse(request.class_info);
    // Update timetable options
    updateClassTimesList();
  }
});

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-51599319-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
