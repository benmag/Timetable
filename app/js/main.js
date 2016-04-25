const BrowserWindow = require('electron').remote.BrowserWindow;

$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});

/**
 * Generate a nice little output of the classes the person has selected
 * so they can be ready for registration day
 */
function generateClassOutput() {
  $("#output").html(""); // clear what was there before

  // Loop through all the units add their title and a section for selected classes
  $('.class_list a').each(function(index) {
    var output = crel("div", {"id": $(this).text()},
      crel("h3", $(this).text()),
      crel("div", {"class": "selected_classes"})
    );

    $("#output").append(output);
  });

  // Add the classes into the selected classes section we created before
  $('div[selected]').each(function(index) {
    var class_html = $(this).attr('activity') + " " +
                     $(this).attr('day') + " " +
                     $(this).attr('start') + " - " + $(this).attr('end') + " " +
                     $(this).attr('location') + "<br />";

    // The div is given the ID of the unit code. Select that and append the updates
    $("#" + $(this).parent().parent().parent().find('a').text() + ">.selected_classes").append(class_html);
  });
}

function slideDownCurrentList(currentList, allLists) {
  currentList.slideDown();
  distFromTop = currentList.offset().top - $(window).scrollTop();
  listsUnderCurrent = allLists.length - currentList.index('.classes') - 1;
  underOffset = listsUnderCurrent * (currentList.parent().height() - 1);

  // Set max height
  currentList.css('max-height', Math.max($(window).height() - distFromTop - underOffset, 250));
}

$(window).on('resize', function(){
  var allLists = $('.classes');
  var allVisible = $('.classes:visible');
  if (allVisible.length != 0) {
    distFromTop = allVisible.offset().top - $(window).scrollTop();
    listsUnderCurrent = allLists.length - allVisible.index('.classes') - 1;
    underOffset = listsUnderCurrent * ($(allVisible).parent().next().height());

    // Set max height
    allVisible.css('max-height', Math.max($(window).height() - distFromTop - underOffset, 250));
  }
}).resize()

// Save the current units so we don't have to reload them every time we refresh the page
$( window ).unload(function() {
  var data = ""
  $('.class_list').each(function() {
    data += $(this).get(0).outerHTML;
  });
  localStorage.setItem('classLists', data);
  // Alternatively you could use sessionStorage for temporary data
});

$(document).ready(function() {
  // Initialize the calendar
  var cal = $('#calendar').fullCalendar({
    header: false,
    allDaySlot: false,
    defaultView: 'agendaWeek',
    minTime: '07:00:00',
    maxTime: '22:00:00',
    height: 'auto',
    columnFormat: { week: 'ddd' },
    slotEventOverlap: false,
    weekends: false,
    editable: false,
    droppable: false
  });

  // Reload the imported subjects from previous instance
  var classLists = localStorage.getItem('classLists');
    if (classLists !== null) {
    $('.class_container').append(classLists);
    $(".classes").scrollLock();
  }

  // Add the selected units to the calendar
  $('.class[selected="selected"]').each(function() {
    cal.fullCalendar( 'renderEvent' , {
      id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"),
      title: $(this).attr('text'),
      start: Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
      end: Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
      allDay: false,
      className: $(this).attr('activity').toLowerCase()
    });
  });
  generateClassOutput();

  $('#unit-search').keyup(function(event) {
    if (event.keyCode == 13) {
      var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.process_search?"
      var params = {
        p_time_period_id: 2655, //Semester 1, 2016
      };

      var regex = /\b[a-zA-Z]{3}\d{3}\b/;
      if (regex.test($(this).val())){
        params['p_unit_cd'] = $(this).val();
      } else {
        params['p_unit_description'] = $(this).val();
      }

      var win = new BrowserWindow({ width: 800, height: 600, show: false });
      win.webContents.on('did-finish-load', function() {
        //Send IPC with URL parameters
        win.webContents.send('url', baseURL + $.param(params));
      });
      win.webContents.on('ipc-message', function(event, arg) {
        if(arg[0] == 'unit') {
          // Update the global class_info var to hold this subject now
          class_info = JSON.parse(arg[1]);
          // Update timetable options
          updateClassTimesList();
        }
      });
      win.on('closed', function() {
        win = null;
      });

      //win.loadURL(baseURL + $.param(params));
      win.loadURL('file://' + __dirname + '/search-container.html');
      win.show();
    }
  });

  require('electron').ipcRenderer.on('unit', function(event, arg) {
      // Update the global class_info var to hold this subject now
      class_info = JSON.parse(arg);
      // Update timetable options
      updateClassTimesList();
  });

  /**
   * Show/hide the classes for an imported subject
   */
  $(document).on('click', '.class_list a', function() {
    var currentList = $(this).parent().find('.classes');

    /* Hide all other classes */
    if (currentList.css('display') == 'none') {
      var allLists = $(this).parent().parent().find('.classes');
      var allVisible = $(this).parent().parent().find('.classes:visible');

      if (allVisible.length != 0) {
        allVisible.slideUp(function() {
          slideDownCurrentList(currentList, allLists);
        });
      } else { // Do not wait for slideUp
        slideDownCurrentList(currentList, allLists);
      }
    } else { /* Hide current class */
      currentList.slideUp();
    }
  });

  /**
   * When the user hovers over the class type, preview all the times for that subject's class type
   */
  $(document).on('mouseover','.class_list b', function(){
    // Get the div that contains each of the classes
    $($(this).parent().find('.class' + '.' + this.className)).each(function( index ) {
      // if the selected attribute is set, then the class is already on the timetable. So do nothing
      if (typeof $(this).attr('selected') != typeof undefined) {
        return;
      }

      // Preview what the class times available are
      cal.fullCalendar( 'renderEvent' , {
        id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"),
        title: $(this).attr('text'),
        start: Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
        end: Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
        allDay: false,
        className: 'preview ' + $(this).attr('activity').toLowerCase()
      });
    });
  });

  /**
   * Once the user stops hovering over a unit code, remove all of the preview class times
   */
  $(document).on('mouseout','.class_list a',function(){
    cal.fullCalendar('removeEvents', function(event) {
      if(event.className.indexOf("preview") > -1) {
        return true;
      }
    });
  });

  /**
   * When the user hovers over a specific class we also want that to be previewed too
   */
  $(document).on('mouseover', '.class', function(){
    // if the selected attribute is set, then the class is already on the timetable. So do nothing
    if (typeof $(this).attr('selected') != typeof undefined) {
      return;
    }

    // Render the preview
    cal.fullCalendar( 'renderEvent' , {
      id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"),
      title: $(this).attr('text'),
      start: Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
      end: Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
      allDay: false,
      className: 'preview ' + $(this).attr('activity').toLowerCase()
    });
  });

  /**
   * Remove the preview for a specific class when the user moves their mouse away
   */
  $(document).on('mouseout','.classes',function(){
    cal.fullCalendar('removeEvents', function(event) {
      if(event.className.indexOf("preview") > -1) {
        return true;
      }
    });
  });

  /**
   * When a user clicks on a class element, they've selected that class add it to the timetable
   */
  $(document).on('click', '.class', function() {
    // if the selected attribute is set, then the class is already on the timetable. So do nothing
    if (typeof $(this).attr('selected') != typeof undefined) {
      return;
    }

    // Remove the class preview
    cal.fullCalendar('removeEvents', function(event) {
      if(event.className.indexOf("preview") > -1) {
        return true;
      }
    });

    // Add event to the calendar
    cal.fullCalendar( 'renderEvent' , {
      id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"),
      title: $(this).attr('text'),
      start: Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
      end: Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
      allDay: false,
      className: $(this).attr('activity').toLowerCase()
    });

    // Mark it as selected
    $(this).attr('selected', 'true');

    // We want to add a "remove" button on the div
    $(this).append('<div class="close_btn" style="display: inline-block;">x</div>');

    // Track this with GA
     var GAlabel = "["+$(this).attr('activity')+"] " + $(this).attr('day') + ' ('+$(this).attr('start')+'-'+$(this).attr('end')+') ' + ' @ ' + $(this).attr('location');
    _gaq.push(['_trackEvent', $(this).attr('subject'), 'enrol', GAlabel]);

    // Update the text output area
    generateClassOutput();
  });

  /**
   * Allows the user to deselect a class time they no longer like
   */
  $(document).on('click', '.close_btn', function() {
    var classEl = $(this).parent();

    // Only remove that class, nothing else.
    cal.fullCalendar('removeEvents', function(event) {
      if(event.title == classEl.attr('text')) {
        return true;
      }
    });

    // Get rid of the close "button"
    $(this).remove();

    // Remove the selected attribute
    classEl.removeAttr('selected');

    // Track this with GA
    var GAlabel = "["+classEl.attr('activity')+"] " + classEl.attr('day') + ' ('+classEl.attr('start')+'-'+classEl.attr('end')+') ' + ' @ ' + classEl.attr('location');
    _gaq.push(['_trackEvent', classEl.attr('subject'), 'unenrol', GAlabel]);

    // Update the text output
    generateClassOutput();

    return false;
  });

  /**
   * Allows the user to deselect a class time they no longer like
   */
  $(document).on('click', '.remove_unit', function() {
    var unitHeader = $(this).parent();
    var subjectCode = unitHeader.find('a').text();

    // Remove all classes from this subject
    cal.fullCalendar('removeEvents', function(event) {
      if (event.title.indexOf(subjectCode) > -1) {
        return true;
      }
    });

    // Get rid of the close "button"
    unitHeader.remove();

    //Trigger a resize event to resize the sidebar
    $(window).trigger('resize');

    // Track this with GA
    _gaq.push(['_trackEvent', subjectCode, 'unenrol', subjectCode]);

    // Update the text output
    generateClassOutput();

    return false;
  });

});

//From launch.js

var class_info;

/**
 * Adds the subject and class elements into the list on the left hand side of the timetabler page.
 */
function updateClassTimesList() {
  var unit = class_info.unit;
  var subject = class_info.subject;
  var times = class_info.times;

  // Check if the class is already imported
  if ($('.class_container').find('a:contains(' + unit + ')').length > 0) {
    return;
  }

  // Check if the max units has been reached
  if ($('.class_container').find('.class_list').length >= 10) {
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
      times[time].day + ': ' +
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
}
