var hasError = false;
var ENTER_KEY = 13;

/**
 * Toggle the visibility of the sidebar
 */
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $(".wrapper").toggleClass("toggled");
});

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
    var classData = $(this).attr("classType") + " " +
                    $(this).attr("day") + " " +
                    $(this).attr("start") + " - " +
                    $(this).attr("end") + " " +
                    $(this).attr("location") + "<br />";

    // Check for missing data
    if (classData.indexOf("undefined") > -1) {
      showError("Old or broken class data has been detected! " +
      "This may be caused by an update, or by invalid HTML editing. " +
      "Note that you should refresh the page if you fix manually.");
    }

    // Append selected class data to the container with the same unit ID
    var unitID = $(this).parents().eq(2).find("a").text();
    $("#" + unitID + ">.selected_classes").append(classData);
  });
}

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
 * Fetch semester IDs from the QUT advanced search page using HTTP GET
 */
function getSemesterIDs() {
  var advSearch = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.show_search_adv";

  // Attempt cross-site GET
  $.get(advSearch, function(data) {
    // Remove the backup options
    $("select").empty();

    // Extract the dropdown from the data
    var select = $(data).find("select[name='p_time_period_id']")[0];

    // Add each option to our own dropdown
    // TODO Store these results in localStorage for offline use
    $.each(select.options, function() {
      // Remove the date ranges from the text
      var regex = /.+(?:GP|KG|CB)/;
      var text = regex.exec(this.text);
      $("select").append($("<option />").val(this.value).text(text));
    })

  })
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
$(window).on("resize", function(){
  var currentList = $(".classes:visible");
  if (currentList.length == 1) {
    var allLists = $(".classes");
    slideDownCurrentList(currentList, allLists);
  }
}).resize();

/**
 * Save current units so we don't have to import them every time we refresh
 */
$( window ).unload(function() {
  var data = "";
  $(".class_list").each(function() {
    data += $(this).get(0).outerHTML;
  });
  localStorage.setItem("classLists", data);
});

$(document).ready(function() {

  // Load the campus selector options for unit search
  getSemesterIDs();

  // Load the helpful hints underneath the calendar
  loadHint();

  // Initialize the calendar
  var cal = $(".calendar").fullCalendar({
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

  // Restore saved subjects from localStorage
  var classLists = localStorage.getItem("classLists");
  if (classLists !== null) {
    $(".class_container").append(classLists);
    $(".classes").scrollLock();
    generateClassOutput();

    // Add the selected units to the calendar
    if (!hasError) {
      $(".class[selected='selected']").each(function() {
        addClass($(this));
      });
    }
  }

  /**
   * Trigger a search when the user presses the Enter key in the search bar
   */
  $("#unit-search").keyup(function(event) {
    if (event.keyCode == ENTER_KEY) {
      /*var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.process_search?";
      var params = {
        p_time_period_id: $("#campus-selector").val()
      };

      // Determine if search is a unit code or unit description
      var searchText = $(this).val().trim();
      var regex = /\b[a-zA-Z]{3}\d{3}\b/; // 3 letters, 3 digits
      if (regex.test(searchText)){
        params.p_unit_cd = searchText;
      } else {
        params.p_unit_description = searchText;
      }

      window.open(baseURL + $.param(params), "_blank");
    */
        getClassesLocation();
    }
  });


  /**Mitch Added Code here **/
//TODO make these not public variable

    //TODO I have broken the String search that was going on (i.e can search for "databases" rather than CAB230)
  var requests_made = 0;
    var total_requests = 50;
    var locations = [];

    function getClassesLocation() {
        var advSearch = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.show_search_adv";
//reset the location array
        requests_made = 0;
        locations = [];

        // Attempt cross-site GET
        $.get(advSearch, function (data) {
            // Extract the dropdown from the data
            var select = $(data).find("select[name='p_time_period_id']")[0];

            //save the length of it to a public variable
          //  total_requests = data.length;
            // Add each option to our own dropdown
            // TODO Store these results in localStorage for offline use
            $.each(select.options, function () {
                // Remove the date ranges from the text
                var regex = /.+(?:GP|KG|CB)/;
                var text = regex.exec(this.text);
                //Run the checking script for each location
                checkCampus(this.value, $('#unit-search').val(), text[0]);
            })
        })
    }


    /**Check if the campus id has the course the user wants and add it to an array if it is available**/
  function checkCampus(campusId, courseId, campus) {
      var search_url = 'https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.process_search?p_time_period_id=' + campusId + '&p_unit_cd=' + courseId;
      $.get(search_url, function (data) {
          // TODO Need to change this logic as it is currently relying on no error text
          var noResultRegex = /No results matched your search criteria. Please return to the/;
          var match = noResultRegex.exec(data);
          if (match == null || match.length <= 0) {
              locations.push({'campusId': campusId, "campusText": campus})
          }
          requests_made++;
          allPlacesSearched();
      })
  }

  /**Gets run after each place is searched as I couldn't think of a better way
   * of doing asynchronously and waiting till all are complete**/
  function allPlacesSearched() {
    if (requests_made >= total_requests) {
        console.log("Locations")
        console.log((locations));
      if (locations.length == 1) {//there is only one place
        console.log("Just load it");
      } else if (locations == null || locations.length == 0) { //There is no place
        console.log("error was made");
      }
      else {
        var bodyText = "Please Select a Teaching Period<br><select id = 'timePeriod'>";
        for (var x = 0; x < locations.length; x++) {
          bodyText += "<option value='" + locations[x].campusId + "'>" + locations[x].campusText + "</option>";
        }
        bodyText += "</select>";
          console.log(bodyText)
        $.confirm({
          title: 'Select an Option!',
          content: bodyText,
          confirm: function () {
            var userSelect = $('#timePeriod').val();
            console.log(userSelect)
            unitSearch(userSelect, $('#unit-search').val());
          },
          cancel: function () {
          }
        });
      }
    }
    else {
      console.log("Still waiting");
    }
  }

  /**Actually open up the new page with the provided values **/
  function unitSearch(campusId, courseCode){
    var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.process_search?";
    var params = {
      p_time_period_id: campusId
    };

    // Determine if search is a unit code or unit description
    var searchText = courseCode
    var regex = /\b[a-zA-Z]{3}\d{3}\b/; // 3 letters, 3 digits
    if (regex.test(searchText)){
      params.p_unit_cd = searchText;
    } else {
      params.p_unit_description = searchText;
    }
    window.open(baseURL + $.param(params), "_blank");
  }







  /**
   * Show or hide the classes for an imported subject
   */
  $(document).on("click", ".class_list a", function() {
    var currentList = $(this).next(".classes");

    // Determine if the current list is showing
    if (currentList.css("display") == "none") {
      var allLists = $(this).parent().parent().find(".classes");
      var allVisible = $(this).parent().parent().find(".classes:visible");

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
   * Create a unique identifier for classes on the calendar, following the
   * format: unitID_classType_locCampus_locRoom_timeDay_timeStart_timeEnd
   */
  function getClassID(classData) {
    var idData = [
      classData.attr("unitID"),
      classData.attr("className").replace(" ", "_"),
      classData.attr("classType"),
      classData.attr("location").replace(" ", "_"),
      classData.attr("day"),
      classData.attr("start"),
      classData.attr("end")
    ];
    return idData.join("_");
  }

  /**
   * Create a human-readable description of the class to be used in the calendar
   */
  function getClassText(classData) {
    return classData.attr("unitID") + "\n" +
           classData.attr("classType") + " " +
           classData.attr("location") + "\n\n" +
           classData.attr("unitName");
  }

  /**
   * Add a new class to the calendar
   */
  function addClass(classData) {
    cal.fullCalendar("renderEvent" , {
      id: getClassID(classData),
      title: getClassText(classData),
      start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
      end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
      className: classData.attr("classType").toLowerCase()
    });
  }

  /**
   * Add a class preview to the calendar
   */
  function previewClass(classData) {
    // Only continue if class is not selected
    if (classData.attr("selected") != "selected") {
      // Add the event details to the calendar
      cal.fullCalendar("renderEvent", {
        id: "preview",
        title: getClassText(classData),
        start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
        end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
        className: "preview " + classData.attr("classType").toLowerCase()
      });
    }
  }

  /**
   * Preview all same-type classes when the user hovers over a class-type heading
   */
  $(document).on("mouseover", ".classes b", function() {
    if (!hasError) {
      $(this).nextAll(".class").each(function() {
        previewClass($(this));
      });
    }
  });

  /**
   * Preview a class on the calendar when the user hovers over it in the sidebar
   */
  $(document).on("mouseover", ".class", function(){
    if (!hasError) {
      previewClass($(this));
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
      addClass($(this));

      // Add the class as selected
      $(this).attr("selected", "true");
      $(this).append(crel("div", {"class": "remove_class"}, "x"));
      generateClassOutput();

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
