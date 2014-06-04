
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
 * Called when the user clicks on the browser action icon (the extension icon in the address bar)
 * NOTE: Might get rid of this... Seems kinda pointless 
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

	// Check their bowser can handle notifications
	if (!('Notification' in window)) { 

		// this browser doesn't support the web notifications API. Just open up the timetabler view for them
		openOrFocusOptionsPage();
	
	} else {
		
		/* NOTE: Too lazy to work this out. It shows duplicate notifications (annoying), likely 
				because this script is loaded within the timetabler & the content script.
				 For now, I'm just making it open up the timetabler. Will fix later. */
		/*title = 'Class times for '+unit+' imported!';
        options = { body: 'Click here to start planning.' };

		notification = Notification.requestPermission(function() {
            var notification = new Notification(title, options);

 			notification.onclick = function() {
 				console.log(class_info);
				openOrFocusOptionsPage();
			};
      	});*/

		openOrFocusOptionsPage();

	}

}  


/** 
 * Adds the subject and class elements into the list on the left hand side of the timetabler page. 
 */
function updateClassTimesList() { 
	
	var unit = class_info.unit;
	var subject = class_info.subject;
	var times = class_info.times;
	var timeEl = "";
	
	// Convert the times into a bunch of elements
	for(time in times) {
		
		timeEl = timeEl + '<div class="class '+times[time].activity.toLowerCase()+' ui-draggable" title="['+times[time].activity+'] '+times[time].subject_name+'" activity="'+times[time].activity+'" day="'+times[time].day+'" start="'+times[time].time.start+'" end="'+times[time].time.end+'" location="'+times[time].location+'" subject="'+subject+'" style="position: relative;">';
		timeEl = timeEl + '<b>['+times[time].activity+'] '+times[time].day+' @ '+times[time].location+ '</b><br>'+times[time].time.raw;
		timeEl = timeEl + '</div>';
			
	}
	
	// Create a new subject element
	el = '<div class="class_list"><h4>'+unit+'</h4><div class="classes">'+timeEl+'</div></div>';
	
	// Add the element to the class list in the sidebar
	$('.class_container').append(el);

	// Notify the user that their times have been imported
	notify(unit);

	// Track this with GA
	_gaq.push(['_trackEvent', subject, 'imported'])

}



// Listen for 'importComplete' message (triggered when classes are imported)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.type == "init") {

		// Open up the timetabler page
    	openOrFocusOptionsPage();
    	
    } else if (request.type == "importComplete"){
		
		// Update the global class_info var to hold this subject now
		class_info = JSON.parse(request.class_info);
		
		// Update timetable options
		updateClassTimesList();
    } 
});



var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-51599319-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
