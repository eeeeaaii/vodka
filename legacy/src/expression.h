// Copyright 2003-2005, 2008, 2019 Jason Scherer
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
#include "p_exp.h"
#include "graphics_context.h"

//#include "event_handler.h"
#include "bitmap.h"
#include "environment.h"
#include "code.h"

namespace whelk {

	class Expression : public Code
	{
	private:
				void 	initialize();
		static 	sPointer<Expression> 	getList(istream& s, Direction dir, bool& end_of_file);
		static 	bool 	isWhitespace(char c);
		static 	bool 	isLeftParen(char c);
		static 	bool 	isRightParen(char c);


	protected:
		bool selected;
		bool isTop;
		int type;
		int dirtyness;
		int cached_width;
		int cached_height;
		string mytext;
		Environment *env;



	public:

		int	getType();  // why can't I make this protected?

		sPointer<Expression> getParent();

		Expression();
		Expression(string mt);
		virtual ~Expression();

				int 	countSiblings();
		virtual Delta 	draw(GraphicsContext *gc);
				void 	dumpTree(int level);
		virtual sPointer<Expression> 	dupe();
				sPointer<Expression> 	findSelectedChild();
				sPointer<Expression> 	lastSibling();
				void 	pushEnvironment();
		virtual string 	toString(bool isFirst = false);

		virtual sPointer<Expression> 	copystate(sPointer<Expression> n);
		virtual sPointer<Expression> 	newobj();

				bool 	isType(int);

				int 	getDirtyness();
				Environment *getEnvironment();
		virtual int 	getHeight(GraphicsContext *grcon);
				bool 	getIsTop();
				string 	getMytext();
				string  getDisplayMytext();
				bool 	getSelected();
		virtual int 	getWidth(GraphicsContext *grcon);

				void 	setDirtyness(int b);
				void 	setEnvironment(Environment *newenv);
				void 	setIsTop(bool nt);
				void 	setMytext(string m);
				void 	setSelected(bool ns);
				void 	setType(int);

				void 	resetType();

		static 	sPointer<Expression> 	parseFromStream(istream& s, bool& end_of_file);
		static	bool	isType(int testtype, int desiredtype);
	};
}



