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
    var output = '<div id="' + $(this).text() + '"> \
        <h3>' + $(this).text() + '</h3> \
        <div class="selected_classes"></div> \
      </div>';

    $("#output").append(output);
  });

  // Add the classes into the selected classes section we created before
  $('div[selected]').each(function(index) {
    var selected_classes_html = $(this).attr('activity') + " " +
                                $(this).attr('day') + " " +
                                $(this).attr('start') + " - " + $(this).attr('end') + " " +
                                $(this).attr('location') + "<br />";

    // The div is given the ID of the unit code. Select that and append the updates
    $("#" + $(this).parent().parent().parent().find('a').text() + ">.selected_classes").append(selected_classes_html);
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
  /* initialize the calendar
  -----------------------------------------------------------------*/

  var cal = $('#calendar').fullCalendar({
    header: false,
    allDaySlot: false,
        minTime: '07:00:00',
        maxTime: '22:00:00',
    height: 'auto',
    columnFormat: { week: 'ddd' },
    slotEventOverlap: false,
    weekends: false,
    editable: false,
    droppable: false, // this allows things to be dropped onto the calendar !!!
    /*drop: function(date, allDay) { // this function is called when something is dropped

      // retrieve the dropped element's stored Event Object
      var originalEventObject = $(this).data('eventObject');

      // we need to copy it, so that multiple events don't have a reference to the same object
      var copiedEventObject = $.extend({}, originalEventObject);

      // assign it the date that was reported
      copiedEventObject.start = date;
      copiedEventObject.allDay = allDay;

      // render the event on the calendar
      // the last `true` argument determines if the event "sticks" (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
      $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);

      // is the "remove after drop" checkbox checked?
      if ($('#drop-remove').is(':checked')) {
        // if so, remove the element from the "Draggable Events" list
        $(this).remove();
      }

    }*/
  });

  // Just want to see the week view for our timetable planner
  cal.fullCalendar( 'changeView', 'agendaWeek');

  $('#unit-search').keyup(function(event) {
    var baseURL = "https://qutvirtual3.qut.edu.au/qv/ttab_unit_search_p.process_search?"
    var params = {
      p_time_period_id: 2655,
    };

    var regex = /\b[a-zA-Z]{3}\d{3}\b/;
    if (regex.test($(this).val())){
      params['p_unit_cd'] = $(this).val();
    } else {
      params['p_unit_description'] = $(this).val();
    }

    if (event.keyCode == 13) {
        window.open(baseURL + $.param(params), '_blank');
     }
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

  /***
   * When the user hovers over the unit code, preview all the times
   */
  /*$(document).on('mouseover','.class_list a', function(){

    // Get the div that contains each of the classes
    $($(this).parent().find('.class')).each(function( index ) {

      // if the selected attribute is set, then the class is already on the timetable. So do nothing
      if (typeof $(this).attr('selected') != typeof undefined) {
        return;
      }

      // Preview what the class times available are
      cal.fullCalendar( 'renderEvent' , {
        id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"),
        title: $(this).attr('text'),
        start:  Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
        end:  Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
        allDay: false,
        className: 'preview '+$(this).attr('activity').toLowerCase()
      });

    });

  });*/

  /***
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
        start:  Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
        end:  Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
        allDay: false,
        className: 'preview '+$(this).attr('activity').toLowerCase()
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
      start:  Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
      end:  Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
      allDay: false,
      className: 'preview '+$(this).attr('activity').toLowerCase()
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
      start:  Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
      end:  Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
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
      if(event.id == classEl.attr('day') + '_' + classEl.attr('location').replace(" ", "_")) {
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
    var unitElement = $(this).parent();

    // Remove all classes from this subject
    $(this).parent().find('.class').each(function() {
      cal.fullCalendar('removeEvents', function(event) {
        if(event.id == $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_")) {
          return true;
        }
      });
    });

    // Get rid of the close "button"
    unitElement.remove();
    $(window).trigger('resize');

    // Track this with GA
    var GAlabel = "["+classEl.attr('activity')+"] " + classEl.attr('day') + ' ('+classEl.attr('start')+'-'+classEl.attr('end')+') ' + ' @ ' + classEl.attr('location');
    _gaq.push(['_trackEvent', classEl.attr('subject'), 'unenrol', GAlabel]);

    // Update the text output
    generateClassOutput();

    return false;
  });

  // Reload the imported subjects from previous instance
  var classLists = localStorage.getItem('classLists');
    if (classLists !== null) {
    $('.class_container').append(classLists);
  }

  // Add the selected units to the calendar
  $('.class[selected="selected"]').each(function() {
    cal.fullCalendar( 'renderEvent' , {
      id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"),
      title: $(this).attr('text'),
      start:  Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
      end:  Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
      allDay: false,
      className: $(this).attr('activity').toLowerCase()
    });
  });
  generateClassOutput();

});
