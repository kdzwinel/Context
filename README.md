Context
======================

Chrome/Chromium extension that allows to sort other extensions into groups and easily switch between them.

Usage
-----

You may install this extension from its google chrome webstore page

https://chrome.google.com/webstore/detail/aalnjolghjkkogicompabhhbbkljnlka

or download it and manually load as an 'Unpacked extension' via chrome extensions page.


Bugs and Features
-----------------

If you found a bug or have a feature request, please create an issue here on GitHub.

https://github.com/kdzwinel/Context/issues

Changelog
---------

### 0.400 ###

New features:
+ syncing configuration via Chrome Sync
+ displaying status of each context in the popup (enabled-green/disabled-red/partial-yellow)
+ displaying status of extensions on the options page (enabled-red/disabled-green)
+ possibility to use extension icon instead of context icon
+ possibility to create new context from 'New extension installed' dialog
+ preserving state of 'highlight ungrouped extensions' checkbox

Bugs fixed:
+ cloned context partially inactive until options page was refreshed

Other:
+ Thanks to Thiago Talma (https://github.com/thiagomt) who contributed huge part of this update.
+ Codebase improved thanks to the WebStorm

### 0.300 ###

New features:
+ importing/exporting configuration
+ highlighting ungrouped extensions on options page
+ new default action for new extensions: 'add to always-enabled'
+ new action in notification window: 'add to always-enabled'

Bugs fixed:
+ notification window showing up when no contexts are available
+ formatting bug in notification window

Other:
+ core functionality was rewritten using OOP (still far from perfect though)

### 0.200 ###

New features:
+ enabling/disabling multiple contexts ("+" and "-" buttons in the popup)
+ possibility to duplicate contexts on options page
+ always enabled extensions

Author
------

**Konrad Dzwinel**

+ https://github.com/kdzwinel
+ http://www.linkedin.com/pub/konrad-dzwinel/53/599/366/en

License
-------

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.