var hasError = false;
var ENTER_KEY = 13;
var cal;

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
  $(".class_list a").each(function(index) {
    var unitContainer = crel("div", {"id": $(this).text()}, // Unit Container
      crel("h3", $(this).text()), // Unit Heading
      crel("div", {"class": "selected_classes"}) // Class Container
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
  // TODO Load tips from an external source
  var hints = [
    "Hover your mouse over a class type in the sidebar to preview all available classes of that type!",
    "Search for a unit code or description using the search bar at the top-left and pressing 'Enter'!",
    "Use the dropdown in the search bar to select your campus when searching for classes!",
    "New to QUT? We have 3 campuses: Gardens Point (GP), Kelvin Grove (KG) and Caboolture (CB)!",
    "These tips will show every time you refresh the page. Want to see a new one? Ctrl+R!"
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
  getAllSemesterIDs().done(function() {
    // Load the previous campus into the dropdown
    loadCampus();
  });

  // Load the helpful hints underneath the calendar
  loadHint();

  // Initialize the calendar
  cal = $(".calendar").fullCalendar({
    header: false,
    allDaySlot: false,
    allDayDefault: false,
    defaultView: "agendaWeek",
    minTime: "07:00:00",
    maxTime: "22:00:00",
    height: "auto",
    columnFormat: { week: "ddd" },
    slotEventOverlap: false,
    weekends: false,
    editable: false,
    droppable: false
  });

  // Load the class data into the sidebar and calendar
  loadClassData();

  /**
   * Trigger a search when the user presses the Enter key in the search bar
   */
  $("#unit-search").keyup(function(event) {
    if (event.keyCode == ENTER_KEY) {
      var searchText = $(this).val().trim();
      if (searchText !== "") {
        var semesterID = $("#campus-selector").val();

        // Determine if search is a unit code or unit description
        var regex = /\b[a-zA-Z]{3}\d{3}\b/; // 3 letters, 3 digits
        if (regex.test(searchText)){
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
  $(document).on("click", ".class_list a", function() {
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
      $(this).nextAll(".class").each(function() {
        previewClass(cal, $(this));
      });
    }
  });

  /**
   * Preview a class on the calendar when the user hovers over it in the sidebar
   */
  $(document).on("mouseover", ".class", function(){
    if (!hasError) {
      previewClass(cal, $(this));
    }
  });

  /**
   * Remove previews once user stops hovering over a class or class-type heading
   */
  $(document).on("mouseout", ".classes", function() {
    cal.fullCalendar("removeEvents", "preview");
  });

  /**
   * Add the class to the calendar when the user clicks on it
   */
  $(document).on("click", ".class", function() {
    // If the class is selected, it is already on the calendar
    if (!hasError && $(this).attr("selected") != "selected") {
      // Add the class to the calendar
      cal.fullCalendar("removeEvents", "preview");
      addClass(cal, $(this));

      // Add the class as selected
      $(this).attr("selected", "true");
      $(this).append(crel("div", {"class": "remove_class"}, "x"));
      generateClassOutput();

      // Update error status
      // TODO Check if class times overlap
      var classCount = $(this).parent().children("div[selected='selected']").length;
      if (classCount > 1) {
        //alert("show error");
        // TODO Add error icon
      }

      // Track this with GA
      var GAlabel = "[" + $(this).attr("classType") + "] " +
      $(this).attr("day") + "(" + $(this).attr("start") + "-" +
      $(this).attr("end") + ") " + "@ " + $(this).attr("location");
      _gaq.push(["_trackEvent", $(this).attr("unitName"), "enrol", GAlabel]);
    }
  });

  /**
   * Remove a selected class from the calendar and its 'remove_class' button
   */
  $(document).on("click", ".remove_class", function() {
    var classElement = $(this).parent();

    // Only remove that class, nothing else.
    cal.fullCalendar("removeEvents", getClassID(classElement));

    // Remove the class selection
    classElement.removeAttr("selected");
    $(this).remove();
    generateClassOutput();

    // Track this with GA
    var GAlabel = "[" + classElement.attr("classType") + "] " +
    classElement.attr("day") + "(" + classElement.attr("start") + "-" +
    classElement.attr("end") + ") " + "@ " + classElement.attr("location");
    _gaq.push(["_trackEvent", classElement.attr("unitName"), "unenrol", GAlabel]);

    // Since the button is a child of the class div,
    // return so that we don't add the class again
    return false;
  });

  /**
   * Remove a unit from the list of imported units in the sidebar
   */
  $(document).on("click", ".remove_unit", function() {
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
  $(document).on("click", ".remove_all", function() {
    hasError = false;
    $(".class_container").empty();
    generateClassOutput();
  });

});
