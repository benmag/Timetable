
	/**
	 * Generate a nice little output of the classes the person has selected
	 * so they can be ready for registration day
	 */
	function generateClassOutput() {

		$("#output").html(""); // clear what was there before

		// Loop through all the units add their title and a section for selected classes
		$('.class_list h4').each(function(index) {
			
			var output = '<div id="' + $(this).text() + '"> \
							<h3>' + $(this).text() + '</h3> \
							<div class="selected_classes"></div> \
							</div>';

			$("#output").append(output);

		});

		// Add the classes into the selected classes section we created before 
		$('div[selected]').each(function(index) {
				var selected_classes_html = $(this).attr('activity') + " \
										" + $(this).attr('day') + "  \
										" + $(this).attr('start') + " - " + $(this).attr('end') + " \
										 " + $(this).attr('location') + "<br />";
			
			// The div is given the ID of the unit code. Select that and append the updates
			$("#"+$(this).parent().parent().find('h4').text()).append(selected_classes_html)
		
		});
			
	}


	$(document).ready(function() {
		
		/* initialize the calendar
		-----------------------------------------------------------------*/
		
		var cal = $('#calendar').fullCalendar({
            header: {left: false, center:false, right:  false },
            height:550,
            allDaySlot: false,
            firstHour: 8, 
            minTime: 7,
            maxTime: 22,
            columnFormat: { week: 'ddd' },
			editable: false,
			droppable: false, // this allows things to be dropped onto the calendar !!!
			drop: function(date, allDay) { // this function is called when something is dropped
			
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
				
			}
		});
		
		
		// Just want to see the week view for our timetable planner
        cal.fullCalendar( 'changeView', 'agendaWeek');

        
        
        /** 
         * Show/hide the classes for an imported subject
		 */
        $(document).on('click', '.class_list h4', function() {
           	$(this).parent().find('.classes').toggle( "slow", function() {  });
        });
        
        
        /*** 
         * When the user hovers over the unit code, preview all the times
         */
		$(document).on('mouseover','.class_list h4', function(){

			// Get the div that contains each of the classes 
			$($(this).parent().find('.class')).each(function( index ) {
				
				// Preview what the class times available are
				cal.fullCalendar( 'renderEvent' , {
	                id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"), 
	                title: $(this).attr('title'),
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
		$(document).on('mouseout','.class_list h4',function(){
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
			
			// Render the preview 
			cal.fullCalendar( 'renderEvent' , {
                id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"), 
                title: $(this).attr('title'),
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
         * When a user clicks on a class element, they've selected that class
         * add it to the timetable
         */
        $(document).on('click', '.class', function() {

        	// Add event to the calendar
			cal.fullCalendar( 'renderEvent' , {
				id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"), 
                title: $(this).attr('title'),
                start:  Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
                end:  Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
                allDay: false,
                className: $(this).attr('activity').toLowerCase()
            });

			// Mark it as selected
        	$(this).attr('selected', 'true');

			// We want to add a "remove" button on the div
			$(this).append('<div class="close_btn">x</div>');

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
        
	});

