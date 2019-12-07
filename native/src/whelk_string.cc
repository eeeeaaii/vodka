// Copyright 2003-2005, 2008, Jason Scherer
// Copyright 2019 Google, Inc.
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

#include "whelk_string.h"
#include "storage_allocator.h"
#include "for_debugging.h"
#include <sstream>
#include <string>

using namespace whelk;
using namespace std;

//extern StorageManager GSM;

/*
mytext contains the text with the " in it, escape characters, etc.

the "value" char* should contain the text without all that -- it should
contain the exact string.  For example (delimited by > and <):

mytext:
---->"hello\nthere"<----

value:
---->hello
there<----


*/

String::String(void)
{
	// value automatically set by its own constructor
	type = XT_STRING;
	mytext = string("\"\"");
}

String::String(string s, bool dec)
{
	setStringRep(s, dec);
	type = XT_STRING;
}

String::~String(void)
{
}

sPointer<Expression> String::newobj() {
	return GSA.createExp(new String());
}


string String::decode(string instr)
{
	ostringstream out;
	istringstream in(instr);
	in.unsetf(ios_base::skipws);
	char c;
	bool done = false;
	in >> c;
	assert(c == '"');
	while(in >> c) {
		if (done) {
			// if you get in here it means that the user typed
			// some characters after the closing quotation mark.
			assert(false);
		}
		switch (c) {
		case '\\':
			in >> c;
			switch (c) {
			case 'n':
				out << '\n';
				break;
			case 't':
				out << '\t';
				break;
			case '"': 
				out << '"'; // making this explicit for clarity
				break;
			case '\\': 
				out << '\\'; // making this explicit for clarity
				break;
			default:
				out << c;
			}
			break;
		case '"':
			done = true;
			break;
		default:
			out << c;
			break;
		}
	}
	return out.str();
}

int String::getLength()
{
	return value.size();
}

string String::encode(string instr)
{
	ostringstream out;
	istringstream in(instr);
	in.unsetf(ios_base::skipws);
	out << '"';
	char c;
	while(in >> c) {
		switch (c) {
			case '\n':
				out << "\\n";
				break;
			case '\t':
				out << "\\t";
				break;
			case '"':
				out << "\\\"";
				break;
			case '\\':
				out << "\\";
				break;
			default:
				out << c;
				break;
		}
	}
	out << '"';
	return out.str();
}

string String::getStringRep()
{
	dbg.trace(value);
	return value;
}

void String::setStringRep(string s, bool dec)
{
	string encoded;
	string decoded;
	if (dec) {
		encoded = s;
		decoded = decode(s);
	} else {
		encoded = encode(s);
		decoded = s;
	}
	value = decoded;
	mytext = encoded;
}
