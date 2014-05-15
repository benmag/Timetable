
var class_info;

/**
 * Open up the timetabler application or if it's already open,  
 * bring the user to it 
 */
function openOrFocusOptionsPage() {
   var optionsUrl = chrome.extension.getURL('timetabler.html'); 
   chrome.tabs.query({}, function(extensionTabs) {
      var found = false;
      for (var i=0; i < extensionTabs.length; i++) {
         if (optionsUrl == extensionTabs[i].url) {
            found = true;
            console.log("tab id: " + extensionTabs[i].id);
            chrome.tabs.update(extensionTabs[i].id, {"selected": true});
         }
      }
      if (found == false) {
          chrome.tabs.create({url: "timetabler.html"});
      }
   });
}

/** 
 * Called when the user clicks on the browser action icon.
 */
chrome.browserAction.onClicked.addListener(function(tab) {
   openOrFocusOptionsPage();
});


/** 
 * Triggers a chrome notification so the user can see
 * that their class times have been imported. Clicking the
 * notification will open up the timetabler 
 */
function notify(unit) {
    var havePermission = window.webkitNotifications.checkPermission();
    
    if (havePermission == 0) {
        // 0 is PERMISSION_ALLOWED
        
        var notification = window.webkitNotifications.createNotification(
            'http://i.stack.imgur.com/dmHl0.png',
            'Class times for '+unit+' imported!',
            'Click here to start planning.'
        );
        
        notification.onclick = function () {
            openOrFocusOptionsPage();
            //window.open(chrome.extension.getURL('timetabler.html'));
            //notification.close();
        }
        
        notification.show();
    } else {
        window.webkitNotifications.requestPermission();
    }
}  


/** 
 * Update the subject times on the timetabler page. 
 * NOTE: It would be nice if this was done automatically
 */
function importUnit() { 
	
	var unit = class_info.unit;
	var subject = class_info.subject;
	var times = class_info.times;
	var timeEl = "";
	
	// Convert the times into a bunch of elements
	for(time in times) {
		
		timeEl = timeEl + '<div class="class '+times[time].activity.toLowerCase()+' ui-draggable" activity="activity" day="'+times[time].day+'" start="10:00" end="12:00" location="" style="position: relative;">';
		timeEl = timeEl + '<b>['+times[time].activity+'] '+times[time].day+' @ </b><br>'+times[time].time;
		timeEl = timeEl + '</div>';
			
	}
	
	// Create a new subject element
	el = '<div class="class_list"><h4>'+unit+'</h4><div class="classes">'+timeEl+'</div></div>';
	
	// Add the element to the class list in the sidebar
	$('.class_container').append(el);
	
	renderEvents();

}



// Listen for 'importComplete' message (triggered when classes are imported)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.type == "importComplete"){
		
		// Update the global class_info var to hold this subject now
		class_info = JSON.parse(request.class_info);
		
		// Notify the user that their times have been imported
		notify(request.unit);
		
		// Update timetable options
		importUnit();
		
        return true;
    }
});


$(function() {

	$( "#updateTimes" ).click(function() {
		importUnit();
	});

});
