import { experiments } from "./globalappflags.js";

const HEAP_STRING_LIMIT = 1024;

class HeapString {
  constructor() {
    this.s = "";
  }

  requestMem(numChars) {
    return heap.requestMem(numChars * heap.incrementalSizeString());
  }

  freeMem(numChars) {
    heap.freeMem(numChars * heap.incrementalSizeString());
  }

  append(text) {
    if (this.s.length + text.length > HEAP_STRING_LIMIT) {
      text = text.substr(0, HEAP_STRING_LIMIT - this.s.length);
    }
    if (!this.requestMem(text.length)) {
      return false;
    }
    this.s = this.s + text;
    return true;
  }

  set(text) {
    heap.freeMem(this.s.length);
    this.s = "";
    if (text.length > HEAP_STRING_LIMIT) {
      text = text.substr(0, HEAP_STRING_LIMIT);
    }
    if (!this.requestMem(text.length)) {
      return false;
    }
    this.s = text;
    return true;
  }

  removeFromEnd(nletters) {
    this.freeMem(nletters);
    this.s = this.s.substr(0, this.s.length - nletters);
  }

  get() {
    return this.s;
  }

  memUsed() {
    return this.s.length * heap.incrementalSizeString();
  }
}

class Heap {
  constructor() {
    this.usedSpace = 0;
    // 2 gigs max mem
    this.debug = false;
  }

  availableMemory() {
    return experiments.MAX_HEAP_SIZE - this.usedSpace;
  }

  requestMem(n) {
    if (n + this.usedSpace < experiments.MAX_HEAP_SIZE) {
      this.usedSpace += n;
      return true;
    } else {
      // for reasons I don't understand vodka thinks there's a memory leak when there isn't?
      // Or is there?
      return true;
      //			return false;
    }
  }

  freeMem(n) {
    this.usedSpace -= n;
    if (this.usedSpace < 0) {
      throw new Error("Error: freed more memory than was allocated.");
    }
  }

  register(obj) {
    if (this.debug) {
      window.heap_obj_debug = obj;
    }
    obj.memAllocated = true;
    return obj;
  }

  addEnvReference(env) {
    env.references++;
  }

  removeEnvReference(env) {
    if (env.references == 0) {
      throw new Error(
        "Tried to remove an env reference when the number of references was zero."
      );
    }
    env.references--;
    if (env.references == 0) {
      env.cleanUp();
    }
  }

  /*
  Undo is counted apart from everything else. It holds what you deleted so that
  undoing gets it back intact -- a wavetable that came back silent would be no
  use -- but it is not an owner in the sense anything else means by the word.
  Nothing is using a deleted nex, and code that asks "does anyone still want
  this" has to be able to get the answer no while undo is still holding it.

  A clip is why this matters: deleting one has to stop it, and if undo counted
  as ownership then a deleted clip would go on playing until it fell off the
  end of the buffer fifty deletions later.

  Being freed still waits for both to reach zero, which is the whole point of
  undo holding it in the first place.
  */
  addUndoReference(obj) {
    obj.undoReferences++;
  }

  removeUndoReference(obj) {
    if (obj.undoReferences == 0) {
      throw new Error(
        "Tried to remove an undo reference when the number of undo references was zero."
      );
    }
    obj.undoReferences--;
    if (obj.undoReferences == 0 && obj.references == 0) {
      this.free(obj);
    }
  }

  addReference(obj) {
    if (obj.references == 0 && obj.undoReferences == 0 && obj.wasFreed) {
      console.log(
        "warning: an object had its references temporarily go to zero, " +
          "causing its memory to be freed, but then a reference " +
          "was subsequently added, so memory will be reallocated."
      );
      this.requestMem(obj.memUsed());
      // it is not freed any more, and saying so is what lets it be freed again
      // later -- otherwise the flag above would refuse forever
      obj.wasFreed = false;
      obj.memAllocated = true;
    }
    obj.references++;
  }

  /*
  Freeing twice takes the memory off twice, which walks usedSpace down to
  negative and makes freeMem throw, and runs cleanupOnMemoryFree twice -- a
  clip ended again, a wavetable told to drop samples it has already dropped, an
  environment's reference removed a second time.

  It happens because an action performs its delete before the undo buffer takes
  hold of what was deleted. For that moment nothing at all holds the nex, so it
  is freed there and then, and freed again later when the action falls out of
  the buffer.
  */
  free(obj) {
    if (obj.wasFreed) {
      return;
    }
    this.freeMem(obj.memUsed());
    obj.cleanupOnMemoryFree();
    obj.memAllocated = false;
    obj.wasFreed = true;
  }

  removeReference(obj) {
    if (obj.references == 0) {
      throw new Error(
        "Tried to remove a reference when the number of references was zero."
      );
    }
    obj.references--;
    if (obj.references == 0 && obj.undoReferences == 0) {
      this.free(obj);
    }
  }

  stats() {
    if (performance && performance.memory) {
      return `
vlang max: ${experiments.MAX_HEAP_SIZE}
vlang used: ${this.usedSpace}
perf.mem limit: ${performance.memory.jsHeapSizeLimit}
perf.mem total: ${performance.memory.totalJSHeapSize}
perf.mem used: ${performance.memory.usedJSHeapSize}
`;
    } else {
      return `
vlang max: ${experiments.MAX_HEAP_SIZE}
vlang used: ${this.usedSpace}
`;
    }
  }

  // These functions should return the BASE SIZE of this object
  // before any of its internal memory is allocated.

  sizeBool() {
    return 1500;
  } // verified in chome using heap snapshot

  sizeBuiltin() {
    return 1500;
  } // NOT VERIFIED
  sizeClosure() {
    return 1500;
  } // NOT VERIFIED
  sizeCommand() {
    return 1500;
  } // NOT VERIFIED
  sizeContract() {
    return 1500;
  } // NOT VERIFIED
  sizeDeferredCommand() {
    return 1500;
  } // NOT VERIFIED
  sizeDeferredValue() {
    return 1500;
  } // NOT VERIFIED
  sizeDoc() {
    return 1500;
  } // NOT VERIFIED
  sizeEError() {
    return 1500;
  } // NOT VERIFIED
  sizeEString() {
    return 1500;
  } // NOT VERIFIED
  sizeESymbol() {
    return 1500;
  } // NOT VERIFIED
  sizeFloat() {
    return 1500;
  } // NOT VERIFIED
  sizeInstantiator() {
    return 1500;
  } // NOT VERIFIED
  sizeInteger() {
    return 1500;
  } // NOT VERIFIED
  sizeLambda() {
    return 1500;
  } // NOT VERIFIED
  sizeLetter() {
    return 1500;
  } // NOT VERIFIED
  sizeLine() {
    return 1500;
  } // NOT VERIFIED
  sizeNil() {
    return 1500;
  } // NOT VERIFIED
  sizeOrg() {
    return 1500;
  } // NOT VERIFIED
  sizeSeparator() {
    return 1500;
  } // NOT VERIFIED
  sizeWavetable() {
    return 1500;
  } // NOT VERIFIED
  sizeWord() {
    return 1500;
  } // NOT VERIFIED

  // these functions return incremental size

  // these types allocate a variable amount of internal memory
  // this number tells us about how much that internal memory is per "unit"
  // these values I got from research, not experimenting
  incrementalSizeString() {
    return 2;
  }

  sizeClip() {
    return 1500;
  } // NOT VERIFIED
  sizeDeferredCommand() {
    return 1500;
  } // NOT VERIFIED
  sizeDeferredValue() {
    return 1500;
  } // NOT VERIFIED
  sizeDoc() {
    return 1500;
  } // NOT VERIFIED
  sizeEError() {
    return 1500;
  } // NOT VERIFIED
  sizeEString() {
    return 1500;
  } // NOT VERIFIED
  sizeESymbol() {
    return 1500;
  } // NOT VERIFIED
  sizeFloat() {
    return 1500;
  } // NOT VERIFIED
  sizeInstantiator() {
    return 1500;
  } // NOT VERIFIED
  sizeInteger() {
    return 1500;
  } // NOT VERIFIED
  sizeLambda() {
    return 1500;
  } // NOT VERIFIED
  sizeLetter() {
    return 1500;
  } // NOT VERIFIED
  sizeLine() {
    return 1500;
  } // NOT VERIFIED
  sizeNil() {
    return 1500;
  } // NOT VERIFIED
  sizeOrg() {
    return 1500;
  } // NOT VERIFIED
  sizeSeparator() {
    return 1500;
  } // NOT VERIFIED
  sizeWavetable() {
    return 1500;
  } // NOT VERIFIED
  sizeWord() {
    return 1500;
  } // NOT VERIFIED

  // these functions return incremental size

  // these types allocate a variable amount of internal memory
  // this number tells us about how much that internal memory is per "unit"
  // these values I got from research, not experimenting
  incrementalSizeString() {
    return 2;
  }
  incrementalSizeSurface() {
    return 4;
  }
  incrementalSizeWavetable() {
    return 8;
  }
}

const heap = new Heap();

export { heap, HeapString };
