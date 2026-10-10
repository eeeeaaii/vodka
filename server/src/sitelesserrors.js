/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/

import { showNoticeToast } from './toast.js'

/*
Errors with nowhere to stand.

The ordinary case is an error that replaces something: you evaluate a command,
it fails, and the error stands where the result would have. Some failures have
no such site. Shift-enter keeps the code and replaces nothing. A deferred value
nobody is holding comes back with an error long after the code that started it
has gone.

Those used to be put at the top of the document. It was the one position that
was the same every time, which made it findable -- and it meant every failure
left a nex in the document to be deleted by hand afterwards, which is a worse
problem than the one it solved.

They are shown over the document now instead. See toast.js, which is where
everything about how that looks and behaves lives.

Nothing is answered, because nothing is put anywhere: a caller that was
detaching the error from whatever held it, on the grounds that the document had
taken it, now correctly finds that it has not.

(comment by Claude)
*/
function reportSitelessError(notice) {
	showNoticeToast(notice);
	return null;
}

export { reportSitelessError }
