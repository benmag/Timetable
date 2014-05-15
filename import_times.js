
$(function() {
       
	var shit;  // hold all of the times imported in the session
	
    function showImportButton() {
        $('.qv_table').append('<button class="importButton">Classes Found. Import?</button>');    
    }
    
    function importClasses(table) {
        
        // Get the unit ID from above the table
        var unit = $.trim($(table).prev().prev().find('strong').html()).split(' ')[0];
        
        // Create a new array for the unit
		shit = { 'unit': unit, 'subject': $.trim($(table).prev().prev().find('strong').html()) };
		shit['times'] = [];
		
		// Loop through table and get times
        $(table).find('tr:not(:first-child)').each(function (index, element) {
            
            // Construct an object containing the row information
            var rows = {
                'class': $(this).children('td').eq(0).html(),
                'activity': $(this).children('td').eq(1).html(),
                'day': $(this).children('td').eq(2).html(),
                'time':  $(this).children('td').eq(3).html(),
                'location': $(this).children('td').eq(4).html(),
                'teaching_staff': $(this).children('td').eq(5).html()
            }
            
            // Push it in
			shit['times'].push(rows);
			
			
			
        });        
		
        fireCompletionMessage(unit);
    }

    function fireCompletionMessage(unit) {
	
        chrome.runtime.sendMessage({type: "importComplete", unit: unit, class_info: JSON.stringify(shit)}, function(response) {
          console.log(response)
        });
    }
    
    
    // Add the import button to the table
    showImportButton();
    
    // Add an event listener for the import button
    $('button.importButton').bind('click', function() {
        importClasses($(this).parent());
    });
    
    
});