


CC = g++
CFLAGS = -g -c
#LDFLAGS = -llzma

SRC_FILES=$(wildcard *.cc)
OBJ_FILES=$(patsubst %.cc,%.o,$(SRC_FILES))

all: whelk

whelk: $(OBJ_FILES)

.o: .cc

.cc:
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

clean:
	rm -f *.o
	rm -f *.gch
	rm -f whelk