# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Changed
- Scrolling a class list in the sidebar will no longer scroll the whole page
- Searches are now directed to QUT's public search page to remove login requirements
- Added desktop app for Windows, OS X and Linux based on [Electron](http://electron.atom.io/)
- Added Firefox extension (not published)
- Improved unit and class removal performance
- Units added to the sidebar will now be sorted alphabetically
- Added campus selector to the search bar (requires manual updating of semester IDs)
- Implemented rotating helpful hints underneath the calendar
- Fixed inconsistency with class time formatting
- Reduced the minimum height for class lists to improve readability in small frames
- Changed class type grouping to remove "Other" category
- Fixed issues with importing blank units
- Reduced unit colour intensity
- Moved 'TODO' from README to Github issues page
- Separated launch.js and import.js
- Moved icons to the /img/ folder
- Removed sleep requirement when importing units
- Added dynamic fetching of semester IDs

## [2.0.1] - 2016-03-25
### Fixed
- Google Analytics re-enabled

## [2.0.0] - 2016-03-24
### Added
- Redesign based on Google's 'Material Design'
- Added maximum number of units able to be imported (mostly to prevent the sidebar from becoming too crowded)
- Added an 'Import All' button to add all subjects on a page
- Added unit persistence. Reloading the page will no longer clear imported subjects
- Added calendar persistence. Reloading the page will no longer clear the calendar
- Previews are now shown for specific class types, and not for entire units
- Implemented search via unit code (e.g. IFB101) or description (e.g. "engineering")
- Added a 'Remove Unit' button for any mistaken imports or timetable changes
- Added WebKit scrollbar styling for better spacing in sidebar class lists

### Changed
- Removed the weekend from the calendar
- Made timetabler open next to currently selected tab if triggered by class import
- Removed the 'Launch Timetabler' button. Importing classes can trigger launching
- Updated FullCalendar to version 2.6.1
- Moved and renamed files for consistency and readability
- Updated extension icon
- Updated HTML5shiv
- Implemented .min css and js libraries and removed full versions

### Fixed
- Improved sidebar for better usability and readability
- Fixed duplicate notifications
- Prevented duplicate unit imports
- Prevented class previews being shown on calendar if class is selected
- Fixed event overlap and padding. Classes now accurately resize depending on how many units are in the same time slot
- Fixed calendar stretching when modifying inline element sizing (Seems to be fixed by FullCalendar update)


[Unreleased]: https://github.com/benmag/Timetable/compare/2.0.1
[2.0.1]: https://github.com/benmag/Timetable/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/benmag/Timetable/compare/1.1.1...2.0.0
