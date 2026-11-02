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
    // see beginWork
    this.workDepth = 0;
    this.zeroSet = new Set();
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
      this.noteZero(obj);
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
      // (comment by Claude)
      obj.wasFreed = false;
      obj.memAllocated = true;
    }
    /*
    Back in the document, so it can be stopped again the next time it leaves.
    Being stopped is not undone here: a recording that was cut short by a
    delete does not resume when you undo the delete, because the seconds it
    would have recorded did not happen. What comes back is what it had.

    (comment by Claude)
    */
    if (obj.references == 0) {
      obj.stoppedFunctioning = false;
    }
    obj.references++;
    // picked up again before the end of the work, so it was only passing
    // through zero
    // (comment by Claude)
    this.zeroSet.delete(obj);
  }

  /*
  A reference count passes through zero all the time without anything being
  let go of. A value handed back out of a function call is the usual case:
  the call's argument slot and scope both let go of it before the caller has
  put it anywhere, so for a moment nothing holds it. A delete is another: the
  nex is out of the document before the undo buffer takes hold of it.

  So reaching zero decides nothing by itself. The nex goes into zeroSet, and
  getting a reference back takes it out again. When the outermost piece of
  work is finished -- one event queue item, or one action -- sweep() looks at
  whatever is still at zero. Those really have nowhere to be: they stop, and
  if undo is not holding them either, they are freed.

  Counted rather than a flag, because actions run inside event queue items.

  (comment by Claude)
  */
  beginWork() {
    this.workDepth++;
  }

  endWork() {
    if (--this.workDepth > 0) {
      return;
    }
    this.sweep();
  }

  noteZero(obj) {
    this.zeroSet.add(obj);
    if (this.workDepth == 0) {
      // Reference counts are only supposed to change inside an event queue
      // item or an action. Something did it outside, so there is no end of
      // work coming to sweep it: do it now, which is what used to happen
      // everywhere.
      // (comment by Claude)
      console.log('vodka: a reference count reached zero outside of any '
          + 'event or action; sweeping immediately\n' + new Error().stack);
      this.sweep();
    }
  }

  sweep() {
    // Stopping and freeing can let go of more things -- freeing a closure
    // releases its environment, which releases what is bound in it -- so the
    // sweep is itself a piece of work, and it goes round until nothing new
    // reached zero.
    // (comment by Claude)
    this.workDepth++;
    try {
      while (this.zeroSet.size > 0) {
        let zeroed = Array.from(this.zeroSet);
        this.zeroSet.clear();
        for (let i = 0; i < zeroed.length; i++) {
          let obj = zeroed[i];
          if (obj.references != 0) {
            continue;
          }
          this.stopFunctioning(obj);
          if (obj.undoReferences == 0) {
            this.free(obj);
          }
        }
      }
    } finally {
      this.workDepth--;
    }
  }

  /*
  The document has let go. Separate from being freed because the two happen at
  different moments and want opposite things: a deleted clip has to stop making
  noise right now, and a deleted wavetable has to keep its samples until undo
  is finished with it.

  Guarded, because the two moments collapse into one whenever nothing was
  holding it for undo, and because an action performs its delete before the
  undo buffer takes hold -- so a nex can be let go of twice in a row.

  (comment by Claude)
  */
  stopFunctioning(obj) {
    if (obj.stoppedFunctioning) {
      return;
    }
    obj.stoppedFunctioning = true;
    obj.stopFunctioning();
  }

  /*
  Freeing twice takes the memory off twice, which walks usedSpace down to
  negative and makes freeMem throw, and runs cleanupOnMemoryFree twice -- a
  wavetable told to drop samples it has already dropped, an environment's
  reference removed a second time.

  It happens because an action performs its delete before the undo buffer takes
  hold of what was deleted. For that moment nothing at all holds the nex, so it
  is freed there and then, and freed again later when the action falls out of
  the buffer.

  (comment by Claude)
  */
  free(obj) {
    if (obj.wasFreed) {
      return;
    }
    // usually already done, by whatever removed the last document reference.
    // Not always: something can be freed having never been in a document.
    // (comment by Claude)
    this.stopFunctioning(obj);
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
    if (obj.references != 0) {
      return;
    }
    // decided at the end of the work, not now -- see beginWork
    // (comment by Claude)
    this.noteZero(obj);
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
  sizeSurface() {
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
  incrementalSizeWavetable() {
    return 8;
  }
}

const heap = new Heap();

export { heap, HeapString };
