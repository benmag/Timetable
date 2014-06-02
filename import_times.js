
$(function() {
       
	var subject;  // hold all the imported times
	
    /**
     * Shows a 'Launch Timetabler' and adds the import button for later use
     */
    function showImportButton() {
        $('.qv_table').append('<button class="launchButton">Launch Timetabler</button>');
        $('.qv_table').append('<button style="display:none;" class="importButton">Classes Found. Import?</button>');    
    }
    

    /** 
     * Handles the importing of class times. Grabs the data from the table and sends
     * it to the timetabler page
     */
    function importClasses(table) {
        
        // Get the unit ID from above the table
        var unit = $.trim($(table).prev().prev().find('strong').html()).split(' ')[0];
        
        // Create a new array for the unit
		subject = { 'unit': unit, 'subject': $.trim($(table).prev().prev().find('strong').html()) };
		subject['times'] = [];
		
		// Loop through table and get times
        $(table).find('tr:not(:first-child)').each(function (index, element) {
            
            // Construct an object containing the row information
            var rows = {
                'subject_name': subject.subject,
                'subject_code': subject.unit,
                'class': $(this).children('td').eq(0).html(),
                'activity': $(this).children('td').eq(1).html(),
                'day': $(this).children('td').eq(2).html(),
                'time':  {
                    'raw' : $(this).children('td').eq(3).html(),
                    'start' : $(this).children('td').eq(3).html().split("-")[0],
                    'end' : $(this).children('td').eq(3).html().split("-")[1],
                },
                'location': $.trim($(this).children('td').eq(4).text()),
                'teaching_staff': $(this).children('td').eq(5).html()
            }

            // Push it in
			subject['times'].push(rows);
			
        });        
		
        fireCompletionMessage(unit);
    }

    function fireCompletionMessage(unit) {
	   
        // Trigger import complete method in timetable_launcher.js
        chrome.runtime.sendMessage({type: "importComplete", unit: unit, class_info: JSON.stringify(subject)}, function(response) {
          console.log(response)
        });

    }
    
    
    // Add the import button to the table
    showImportButton();
    
    // Add an event listener for the import button
    $('button.importButton').bind('click', function() {
        importClasses($(this).parent());
    });
    
    // Add an event listener for the launch timetabler button
    $('button.launchButton').bind('click', function() {
        
        // Initialize the timetabler 
        chrome.runtime.sendMessage({type: "init"}, function(response) {
          console.log(response)
        });


        // No need for the launch button anymore
        $('.launchButton').hide();

        // They're ready to start importing class times
        $('.importButton').show();

    });
    
});