
	function renderEvents() {
		
		$('.class_list div.class').each(function() {
	
			// create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
			// it doesn't need to have a start or end
			var eventObject = {
				title: $.trim($(this).text()) // use the element's text as the event title
			};
			
			// store the Event Object in the DOM element so we can get to it later
			$(this).data('eventObject', eventObject);

			
		});
	}


	function generateClassOutput() {

		$("#output").html("");

		// Get all the units
		$('.class_list h4').each(function(index) {
			
			var output = '<div id="' + $(this).text() + '"> \
							<h3>' + $(this).text() + '</h3> \
							<div class="selected_classes"></div> \
							</div>';

			$("#output").append(output);

		});

		// Add in all the classes 
		$('div[selected]').each(function(index) {
				var selected_classes_html = $(this).attr('activity') + " \
										" + $(this).attr('day') + "  \
										" + $(this).attr('start') + " - " + $(this).attr('end') + " \
										 " + $(this).attr('location') + "<br />";
			
			$("#"+$(this).parent().parent().find('h4').text()).append(selected_classes_html)
		
		});
			
	}


	$(document).ready(function() {
	
	
		/* initialize the external events
		-----------------------------------------------------------------*/
		renderEvents();
	
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
		
		
        cal.fullCalendar( 'changeView', 'agendaWeek');

        
        
        /* show/hide subjects
        --------------------------------------------------*/
        $(document).on('click', '.class_list h4', function() {
            //$('.classes').hide('slow');
           	$(this).parent().find('.classes').toggle( "slow", function() {  });
        });
        
        
        /* show/hide subject all positions
        -----------------------------------------------*/
		$(document).on('mouseover','.class_list h4', function(){

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

		
		$(document).on('mouseout','.class_list h4',function(){
            cal.fullCalendar('removeEvents', function(event) {
            	if(event.className.indexOf("preview") > -1) {
            		return true;
            	} 
		    });
		});




        /* show/hide specific subject position
        -----------------------------------------------*/
        /** 
		 * When the user hovers over a specific class/subject we want it to suggest
		 * to highlight that more than the rest of the previewed class times
		 */
		$(document).on('mouseover', '.class', function(){
			
			cal.fullCalendar( 'renderEvent' , {
                id: $(this).attr('day') + '_' + $(this).attr('location').replace(" ", "_"), 
                title: $(this).attr('title'),
                start:  Date.parse($(this).attr('day') + ' ' + $(this).attr('start')),
                end:  Date.parse($(this).attr('day') + ' ' + $(this).attr('end')),
                allDay: false,
                className: 'preview '+$(this).attr('activity').toLowerCase()
            });

		});


		$(document).on('mouseout','.classes',function(){
            cal.fullCalendar('removeEvents', function(event) {
            	if(event.className.indexOf("preview") > -1) {
            		return true;
            	} 
		    });
		});

        
        /* add subject to timetable
        --------------------------------------------------*/
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

			
			generateClassOutput();

        });


        $(document).on('click', '.close_btn', function() {

        	var classEl = $(this).parent();

            //console.log(classEl.attr('day') + '_' + classEl.attr('location').replace(" ", "_"));
            cal.fullCalendar('removeEvents', function(event) {
            	if(event.id == classEl.attr('day') + '_' + classEl.attr('location').replace(" ", "_")) {
            		return true;
            	} 
		    });

            // Get rid of the close "button"
            $(this).remove();

            // Remove the selected attribute 
        	classEl.removeAttr('selected');

        	// Update the output
        	generateClassOutput();

		    return false;

        })
        
	});

