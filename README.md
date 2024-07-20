# SudokuPad_Extensions
 A collection of userscripts design to extend features of Sven's SudokuPad

These are designed for use with Tampermonkey, but may work with other userscript extensions

## Extensions

* `SudokuPad Extensions` is currently REQUIRED for any other extension to work. It provides the event hook necessary to load the extension features. This may become redundant in the future if it is promoted to native functionality.

* `SudokuPad Copy Paste` adds basic support for Copy-Pasting parts or all of the grid, currently only respecting big digits. Selected cells will affect what cells are overridden when pasting. Compatible with pasting grids to an external application, where unselected cells will be spaces and selected empty cells are periods.

* `SudokuPad Select All With Digit` changes double-click and adds triple-click such that double-click selects all marks of a similar type and same digit, and triple-click selects all marks of an equal or lower type and the same digit. If a corner-marked cell is selected, other cells are included if any of the marked digits are included. If a center-marked cell is selected, other cells are only included if all of the marked digits are included. Changes colors to select all of the selected on double-click, and moves the any of the selected functionality to triple-click.

* `SudokuPad Restore Given Pencilmark` will restore given pencilmarks whenever cells that had given pencilmarks are cleared (Distinct from removing the last pencilmark).

* `SudokuPad MacOS Redo Binding` adds a keybind such that cmd/ctrl-shift-z executes the regular redo command. In vanilla SudokuPad, only cmd/ctrl-y is respected.

## Installation

Download the scripts corresponding to the features you want, and add them to a userscript client of your choice. Ensure you install the `SudokuPad Extensions` userscript, or else most features provided by the other scripts will be unable to load. Some userscript clients I've used:

* Chrome/Edge: [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* Firefox: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
* Safari: [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) or [Tampermonkey (paid)](https://apps.apple.com/us/app/tampermonkey/id1482490089)

