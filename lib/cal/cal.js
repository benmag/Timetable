		function renderEvents() {
			
			$('.class_list div.class').each(function() {
		
				// create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
				// it doesn't need to have a start or end
				var eventObject = {
					title: $.trim($(this).text()) // use the element's text as the event title
				};
				
				// store the Event Object in the DOM element so we can get to it later
				$(this).data('eventObject', eventObject);
				
				// make the event draggable using jQuery UI
				$(this).draggable({
					zIndex: 999,
					revert: true,      // will cause the event to go back to its
					revertDuration: 0  //  original position after the drag
				});
				
			});
		}
		
	$(document).ready(function() {
	
	
		/* initialize the external events
		-----------------------------------------------------------------*/
		renderEvents();
	
		/* initialize the calendar
		-----------------------------------------------------------------*/
		
		$('#calendar').fullCalendar({
            header: {left: false, center:false, right:  false },
            height:550,
            allDaySlot: false,
            columnFormat: { week: 'ddd' },
			editable: true,
			droppable: true, // this allows things to be dropped onto the calendar !!!
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
		
		
        $("#calendar").fullCalendar( 'changeView', 'agendaWeek');

        
        
        /* show/hide subjects
        --------------------------------------------------*/
        $(document).on('click', '.class_list h4', function() {
            console.log($(this).parent().find('.classes').html());
            $('.classes').hide('slow');
           $(this).parent().find('.classes').toggle( "slow", function() {  });
        });
        
        
        /* show/hide subject positions
        -----------------------------------------------*/
		$(document).on('mouseover','.classes',function(){
			
			// This should dynamically load
            $("#calendar").fullCalendar( 'renderEvent' , {
                id: 'test',
                title: 'test',
                start: Math.round(+new Date()/1000),
                end: Math.round(+new Date()/1000+8000),
                allDay: false,
                className: 'test',
                
            });
            ////////////////////////////////
			
		});


		$(document).on('mouseout','.classes',function(){
            $("#calendar").fullCalendar('removeEvents', 'test');
		});

        
        /* add subject to timetable
        --------------------------------------------------*/
        $(document).on('click', '.class', function() {
		//$( ".class" ).click(function() {
            alert("Add class to timetable");
            $("#calendar").fullCalendar( 'renderEvent' , {
                id: 'foo',
                className: 'lec',
                title: 'test',
                start: Math.round(+new Date()/1000),
                end: Math.round(+new Date()/1000+8000),
                allDay: false,
                
            });
        });
        
	});
