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

#pragma once
#include "expression.h"
#include <string>
#include <iostream>
#include <fstream>

namespace whelk {

	class Port:
		public Expression

	{
	protected:
		bool open;
	public:
		Port(void);
		virtual ~Port(void);

		virtual void close();
	};

	///--------------------------------------

	class InputPort:
		public Port
	{
	public:
		InputPort(void);
		virtual ~InputPort(void);

		virtual char readChar() = 0;
		virtual char peekChar() = 0;
		virtual bool isEof() = 0;
	};

	///--------------------------------------

	class OutputPort:
		public Port
	{
	public:
		OutputPort(void);
		virtual ~OutputPort(void);

		virtual void writeChar(char) = 0;
	};

	///--------------------------------------

	class FileInputPort:
		public InputPort
	{
	protected:
		ifstream *in;
	public:
		FileInputPort(void);
		FileInputPort(string filename);
		virtual ~FileInputPort(void);

		char readChar();
		char peekChar();
		bool isEof();
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n) {
			assert(false);
		}
	};

	///--------------------------------------

	class FileOutputPort:
		public OutputPort
	{
	protected:
		ofstream *out;
	public:
		FileOutputPort(void);
		FileOutputPort(string filename);
		virtual ~FileOutputPort(void);

		void writeChar(char);
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n) {
			assert(false);
		}
	};
};

