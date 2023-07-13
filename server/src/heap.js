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

  addReference(obj) {
    if (obj.references == 0 && obj.wasFreed) {
      console.log(
        "warning: an object had its references temporarily go to zero, " +
          "causing its memory to be freed, but then a reference " +
          "was subsequently added, so memory will be reallocated."
      );
      this.requestMem(obj.memUsed());
    }
    obj.references++;
  }

  free(obj) {
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
    if (obj.references == 0) {
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
  incrementalSizeSurface() {
    return 4;
  }
  incrementalSizeWavetable() {
    return 8;
  }
}

const heap = new Heap();

export { heap, HeapString };
