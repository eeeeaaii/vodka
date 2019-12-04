#pragma once

namespace whelk {
	class Code {
	private:
		int id;
		static int nextID;			
	public:
		Code();
		int getID();
	};
};