#pragma once
#include "p_exp.h"
#include "storage_manager.h"
#include "graphics_context.h"

namespace carin {
	class Procedure;
	class Event;
	class EventHandler;
	class Bitmap;
	class Environment;

	class Expression
	{
	private:
				void 	initialize();
		static 	sPtr 	getList(istream& s, Direction dir, bool& end_of_file);
		static 	bool 	isWhitespace(char c);
		static 	bool 	isLeftParen(char c);
		static 	bool 	isRightParen(char c);


	protected:
		bool selected;
		bool isTop;
		int type;
		int id;
		int dirtyness;
		int cached_width;
		int cached_height;
		string mytext;
		Environment *env;
		EventHandler *handlers;

		static int nextID;			


	public:

		int	getType();  // why can't I make this protected?

		sPtr getParent();

		Expression(); Expression(string mt);
		virtual ~Expression();

				int 	countSiblings();
		virtual Delta 	draw(GraphicsContext *gc);
				void 	dumpTree(int level);
		virtual sPtr 	dupe();
				sPtr 	findSelectedChild();
				sPtr 	lastSibling();
				void 	pushEnvironment();
		virtual string 	toString(bool isFirst = false);

		virtual sPtr 	copystate(sPtr n);
		virtual sPtr 	newobj();

				bool 	isType(int);

				int 	getDirtyness();
				Environment *getEnvironment();
		virtual int 	getHeight(GraphicsContext *grcon);
				int 	getID();
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

		static 	sPtr 	parseFromStream(istream& s, bool& end_of_file);
		static	bool	isType(int testtype, int desiredtype);
	};
}



