var hasError = false;

/**
 * Toggle the visibility of the sidebar
 */
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $(".wrapper").toggleClass("toggled");
});

/**
 * Set an appropriate max-height for the current class list and show it
 */
function slideDownCurrentList(currentList, allLists) {
  currentList.slideDown();
  var distFromTop = currentList.offset().top - $(window).scrollTop();
  var listsUnderCurrent = allLists.length - currentList.index(".classes") - 1;
  var underOffset = listsUnderCurrent * (currentList.parent().next().height());
  var maxHeight = Math.max($(window).height() - distFromTop - underOffset, 150);
  currentList.css("max-height", maxHeight);
}

/**
 * Show an error message with available solutions
 */
function showError(text) {
  if (!hasError) {
    hasError = true;
    $(".modal-body").html(text + "</br></br>How would you like to handle the issue?");
    $("#errorModal").modal("show");
  }
}

/**
 * Generate a nice little output of the classes the user has selected
 * so they can be ready for registration day
 */
function generateClassOutput() {
  $(".unitOverview").html(""); // Clear what was there before

  // Create headings and containers for selected class data
  $(".class-list a").each(function(index) {
    var unitContainer = crel("div", {
        "id": $(this).text()
      }, // Unit Container
      crel("h3", $(this).text()), // Unit Heading
      crel("div", {
        "class": "selected_classes"
      }) // Class Container
    );
    $(".unitOverview").append(unitContainer);
  });

  // Add the classes into the selected classes section we created before
  $("div[selected]").each(function(index) {
    var overview = getClassOverview($(this));

    // Check for missing data
    if (overview.indexOf("undefined") > -1) {
      showError("Old or broken class data has been detected! " +
        "This may be caused by an update, or by invalid HTML editing. " +
        "Note that you should refresh the page if you fix manually.");
    }

    // Append selected class data to the container with the same unit ID
    var unitID = $(this).parents().eq(2).find("a").text();
    $("#" + unitID + ">.selected_classes").append(overview);
  });
}

/**
 * Load a hint underneath the calendar
 */
function loadHint() {
  // TODO Load hints from an external source
  var hints = [
    "Hover your mouse over a class type in the sidebar to preview all available classes of that type!",
    "Search for a unit code or description using the search bar at the top-left and pressing 'Enter'!",
    "Use the dropdown in the search bar to select your campus when searching for classes!",
    "New to QUT? We have 3 campuses: Gardens Point (GP), Kelvin Grove (KG) and Caboolture (CB)!",
    "These tips will show every time you refresh the page. Want to see a new one? Ctrl+R!",
    "You can search for a unit code, or a unit description using the 'unit search' box in the sidebar!"
  ];

  // Randomly select a hint from the array
  var hint = hints[Math.floor(Math.random() * hints.length)];
  $(".alert").append(hint);
}

/**
 * Handle sidebar height adjustments when the window is resized
 */
$(window).resize(function() {
  var currentList = $(".classes:visible");
  if (currentList.length == 1) {
    var allLists = $(".classes");
    slideDownCurrentList(currentList, allLists);
  }
});

/**
 * Save current units so we don't have to import them every time we refresh
 */
$(window).unload(function() {
  saveClassData();
  saveCampus();
});

$(document).ready(function() {
  jconfirm.defaults = {
    backgroundDismiss: true,
    keyboardEnabled: true,
    opacity: 1
  };

  // Load the campus selector options for unit search
  getSemesterIDs().done(function() {
    // Load the previous campus into the dropdown
    loadCampus();
  }).fail(function() {

  });

  // Load the helpful hints underneath the calendar
  loadHint();

  // Initialize the calendar
  var cal = $(".calendar").fullCalendar({
    header: false,
    allDaySlot: false,
    allDayDefault: false,
    defaultView: "agendaWeek",
    displayEventTime: false,
    minTime: "07:00:00",
    maxTime: "22:00:00",
    height: "auto",
    columnFormat: "ddd",
    slotEventOverlap: false,
    weekends: false
  });

  // Load the class data into the sidebar and calendar
  loadClassData(cal);

  /**
   * Trigger a search when the user presses the Enter key in the search bar
   */
  $("#unit-search").keyup(function(event) {
    if (event.keyCode == 13) { // ENTER_KEY
      var searchText = $(this).val().trim();
      if (searchText !== "") {
        var semesterID = $("#campus-selector").val();

        // Determine if search is a unit code or unit description
        var unitCodeRegex = /\b[a-zA-Z]{3}\d{3}\b/; // 3 letters, 3 digits
        if (unitCodeRegex.test(searchText)) {
          searchUnitCode(searchText, semesterID);
        } else {
          searchDescription(searchText, semesterID);
        }
      }

      // Select the text, ready for the next search
      $(this).select();
    }
  });

  /**
   * Show or hide the classes for an imported subject
   */
  $(document).on("click", ".class-list a", function() {
    var currentList = $(this).next(".classes");

    // Determine if the current list is showing
    if (currentList.css("display") == "none") {
      var allLists = $(this).parent().parent().find(".classes");
      var allVisible = allLists.filter(":visible");

      // Hide any visible class lists before showing the clicked list
      if (allVisible.length !== 0) {
        allVisible.slideUp(function() {
          slideDownCurrentList(currentList, allLists);
        });
      } else {
        slideDownCurrentList(currentList, allLists);
      }
    } else {
      currentList.slideUp();
    }
  });

  /**
   * Preview all same-type classes when the user hovers over a class-type heading
   */
  $(document).on("mouseover", ".classes b", function() {
    if (!hasError) {
      $(this).nextAll(".class:not([selected])").each(function() {
        previewClass(cal, $(this));
      });
    }
  });

  /**
   * Preview a class on the calendar when the user hovers over it in the sidebar
   */
  $(document).on("mouseover", ".class", function() {
    if (!hasError) {
      previewClass(cal, $(this));
    }
  });

  /**
   * Preview a class on the calendar when the user hovers over it in the sidebar
   */
  $(document).on("mouseout", ".class", function() {
    removeClassPreview(cal, $(this));
    cal.fullCalendar("removeEvents", "preview");
  });

  /**
   * Remove previews once user stops hovering over a class or class-type heading
   */
  $(document).on("mouseout", ".classes", function() {
    cal.fullCalendar("removeEvents", "preview");
  });

  function getTimes(classElement) {
    var day = classElement.attr("day");

    var start = Date.parse(day + " " + classElement.attr("start"));
    var end = Date.parse(day + " " + classElement.attr("end"));

    return {
      "day": day,
      "start": start,
      "end": end
    };
  }

  /**
   * Add the class to the calendar when the user clicks on it
   */
  $(document).on("click", ".class", function() {
    // If the class is selected, it is already on the calendar
    if (!hasError && $(this).attr("selected") != "selected") {
      // Add the class to the calendar
      cal.fullCalendar("removeEvents", "preview");
      addClass(cal, $(this));

      // Check for overlapping classes
      classA = getTimes($(this));
      var title = $(this).siblings("b");
      var selectedClasses = $(".class-container").find("div.class[selected]");
      selectedClasses.each(function(i, c) {
        classB = getTimes($(c));

        var sameDay = (classA.day == classB.day);
        var timeOverlap = (classA.start < classB.end &&
          classA.end > classB.start);

        if (sameDay && timeOverlap) {
          // TODO Make sure these classes aren't meant to overlap (e.g. PR1 & PR2)
          // TODO Overlapping class times: Show a warning to the user
          alert('overlap');

          // Break the loop so we don't keep checking classes
          return false;
        }

      });

      addDuplicateBadge($(this));

      // Add the class as selected
      $(this).attr("selected", "true");
      $(this).append(crel("div", {
        "class": "remove-class"
      }, "x"));

      // Update the selected class list
      generateClassOutput();

      // Track this with GA
      var GAlabel = "[" + $(this).attr("classType") + "] " +
        $(this).attr("day") + "(" + $(this).attr("start") + "-" +
        $(this).attr("end") + ") " + "@ " + $(this).attr("location");
      _gaq.push(["_trackEvent", $(this).attr("unitName"), "enrol", GAlabel]);
    }
  });

  /**
   * Remove a selected class from the calendar and its 'remove-class' button
   */
  $(document).on("click", ".remove-class", function() {
    var classElement = $(this).parent();

    removeClass(cal, classElement);

    // TODO Check if class times overlap

    removeDuplicateBadge(classElement);

    // Remove the 'x' label
    $(this).remove();

    // Update the selected class list
    generateClassOutput();

    // Track this with GA
    var GAlabel = "[" + classElement.attr("classType") + "] " +
      classElement.attr("day") + "(" + classElement.attr("start") + "-" +
      classElement.attr("end") + ") " + "@ " + classElement.attr("location");
    _gaq.push(["_trackEvent", classElement.attr("unitName"), "unenrol", GAlabel]);

    // Since the remove button is a child of the class div,
    // return so that the click event doesn't propegate downwards
    return false;
  });

  /**
   * Remove a unit from the list of imported units in the sidebar
   */
  $(document).on("click", ".remove-unit", function() {
    var unitHeader = $(this).parent();

    // Remove all classes from this unit
    var subjectCode = unitHeader.find("a").text();
    cal.fullCalendar("removeEvents", function(event) {
      return (event.id.indexOf(subjectCode) > -1);
    });

    // Remove the unit listing
    unitHeader.remove();
    generateClassOutput();

    //Trigger a resize event to resize the sidebar
    $(window).trigger("resize");

    // Track this with GA
    _gaq.push(["_trackEvent", subjectCode, "unenrol", subjectCode]);
  });

  /**
   * Remove all children from the class data container
   */
  $(document).on("click", ".remove-all", function() {
    hasError = false;
    $(".class-container").empty();
    generateClassOutput();
  });

});
