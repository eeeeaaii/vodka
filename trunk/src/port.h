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

