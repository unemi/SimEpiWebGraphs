The following text explains how to use the collection of files
contained by the folder containing this file.

by Tatsuo Unemi, Soka University, Nov. 2022.
Contacts: unemi@soka.ac.jp / tatsuounemi@gmail.com

1. Viewing the graph and its animation.
Open "index.html" by a web browser on your PC.
It doesn't assume viewing by mobile phone.
It referes the following files of javascript.
	Tics.js
	Vax3TrsEn.js
	prefInfo.js
	ptnPref.js
	vaxPref.js

2. Revising the statistic data.
Run "update.sh."
It downloads two data files
	confirmed_cases_cumulative_daily.csv and
	prefecture.ndjson
from the governmental open data sites if they are newer than the local files.
Then transform them to javascript files
	ptnPref.js and
	vaxPref.js.

3. Setting up on your web server.
If you want to set up this serveice on your own web server,
copy all of the files to the appropriate folder in your server.
If the server is a type of unix OS, Linux, macOS etc.,
it might be useful to set "update.sh" to run once in a day regularly,
using "cron" service.
In case you want to revise contents of a file, please contact the author
to inform of the revision and URL of your server.
----- 