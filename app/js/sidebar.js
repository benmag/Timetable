/**
 * Toggle the visibility of the sidebar
 */
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});

/**
 * Set an appropriate max-height for the current class list and show it
 */
function slideDownCurrentList(currentList, allLists) {
  // TODO Replace jQuery functions with vanilla Javascript to boost performance
  currentList.removeAttribute("max-height");
  $(currentList).slideDown();

  var underOffset = 0;
  if (allLists.length > 1) {
    var listsUnderCurrent = allLists.length - $(currentList).index(".classes") - 1;
    underOffset = listsUnderCurrent * $(currentList).prev(".unit-name").height();
  }

  maxHeight = Math.max(window.innerHeight - currentList.offsetTop - underOffset, 150);
  currentList.style.maxHeight = maxHeight + "px";
}

/**
 * Handle sidebar height adjustments when the window is resized
 */
$(window).resize(function() {
  var currentList = $("#class-container").find(".classes:visible");
  if (currentList.length === 1) {
    var allLists = $("#class-container").find(".classes");
    slideDownCurrentList(currentList[0], allLists);
  }
});

/**
 * Trigger a search when the user presses the Enter key in the search bar
 */
$("#unit-search").keyup(function(e) {
  if (e.keyCode === ENTER_KEY) {
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
$(document).on("click", ".unit-name", function() {
  var currentList = this.nextSibling;

  // Determine if the current list is showing
  if (currentList.style.display == "none") {
    var allLists = $(this.parentNode.parentNode).find(".classes");
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
    $(currentList).slideUp();
  }
});

/**
 * Preview all same-type classes when the user hovers over a class-type heading
 */
$(document).on("mouseover", ".class-type", function() {
  var classes = $(this.parentNode).find(".class").not(":selected");
  Class.previewAll(cal, classes);
});

/**
 * Preview a class on the calendar when the user hovers over it in the sidebar
 */
$(document).on("mouseover", ".class", function() {
  Class.preview(cal, this);
});

/**
 * Remove higlight once user stops hovering over a selected class
 */
$(document).on("mouseout", ".class:selected", function() {
  Class.removePreview(cal, this);
  removeClassPreview(cal, this);
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
$(document).on("click", ".class-text", function() {
  // If the class is selected, it is already on the calendar
  var classElement = this.parentNode;
  if (!classElement.selected) {
    Class.add(classElement);
    generateClassOutput();
  }
});

/**
 * Remove a selected class from the calendar and its 'remove-class' button
 */
$(document).on("click", ".remove-class", function() {
  var classElement = this.parentNode;
  Class.remove(classElement);
  generateClassOutput();
});

/**
 * Remove a unit from the list of imported units in the sidebar
 */
$(document).on("click", ".remove-unit", function() {
  var unitHeader = $(this).parent();

  // Remove all classes from this unit
  var subjectCode = unitHeader.find(".unit-name").text();
  cal.fullCalendar("removeEvents", function(event) {
    return (event.id.indexOf(subjectCode) > -1);
  });

  // Remove the unit listing
  unitHeader.remove();
  Class.removeUnit(subjectCode);
  generateClassOutput();

  // Trigger a resize event to resize the sidebar
  $(window).trigger("resize");
});

/**
 * Save the current campus so we don't have to keep changing the dropdown
 */
$(document).on("change", "#campus-selector", function() {
  localStorage.setItem("currentCampus", this.value);
});
