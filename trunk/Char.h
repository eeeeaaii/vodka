#pragma once
#include "Carin.h"
#include "Expression.h"

namespace carin {
	/*
	 * Char class
	 * Encapsulates logic specific to chars.
	 * includes two multimaps for mapping
	 * char codes to actual chars, and vice
	 * versa
	 * "c2cc" means "char to char code"
	 * "cc2c" means "char code to char"
	 */
	class Char :
		public Expression
	{
	private:
		char value;

		char 		ccodeToChar(string ccode);
		string 		charToCCode(char c);

		static 		multimap<char, string> c2cc;
		static 		multimap<string, char> cc2c;
		static bool initialized;
		static void initMap();
		static void initPair(char, string);

	public:
		Char(void);
		Char(char c);
		Char(string ccode);
		virtual ~Char(void);

		string 			getCharRep();
		char 			getCharCode();
		virtual sPtr 	newobj();
		virtual sPtr 	copystate(sPtr n);

		static bool isValidCharCode(string code);
	};

	typedef pair<char, string> c2ccpair;
	typedef pair<string, char> cc2cpair;
};
