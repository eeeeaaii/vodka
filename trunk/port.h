#pragma once
#include "Expression.h"
#include <string>
#include <iostream>
#include <fstream>

namespace carin {

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
		virtual char readChar() = 0;
		virtual char peekChar() = 0;
		virtual bool isEof() = 0;
		InputPort(void);
		virtual ~InputPort(void);
	};

	///--------------------------------------

	class OutputPort:
		public Port
	{
	public:
		virtual void writeChar(char) = 0;
		OutputPort(void);
		virtual ~OutputPort(void);
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
		void writeChar(char);
		virtual ~FileOutputPort(void);
		virtual sPtr newobj() { return GSM.createExp(new FileOutputPort()); }
		virtual sPtr copystate(sPtr n) {
			assert(false);
		}
	};

	///--------------------------------------

	class FileInputPort:
		public InputPort
	{
	protected:
		ifstream *in;
	public:
		char readChar();
		char peekChar();
		bool isEof();
		FileInputPort(void);
		FileInputPort(string filename);
		virtual ~FileInputPort(void);
		virtual sPtr newobj() { return GSM.createExp(new FileInputPort()); }
		virtual sPtr copystate(sPtr n) {
			assert(false);
		}
	};

};

