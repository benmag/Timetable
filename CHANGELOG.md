# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Changed
- Scrolling in a class section in the sidebar will no longer scroll the whole page

## [2.0.1] - 2016-03-25
### Fixed
- Google Analytics reenabled

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
