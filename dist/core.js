var Reg_;

Reg_ = class Reg_ {
  constructor() {
    this.locker = {};
    this.map = {};
    Object.defineProperty(this, "list", {
      get: function() {
        return this.export();
      }
    });
  }

  has(id) {
    var sym;
    if (!(id && typeof id === 'string' || id instanceof Symbol)) {
      return null;
    }
    if (id instanceof Symbol) {
      if (this.locker[id]) {
        return true;
      } else {
        return false;
      }
    } else if (typeof id === "string") {
      // First search for symbol in map, then for value in locker
      if (this.map[id]) {
        sym = this.map[id];
        if (this.locker[sym]) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  save(id, value, arg) {
    var sym;
    if (this.has(id)) {
      new Error("That id already taken");
    }
    value = arg && arg.deep && arg.mime ? new Blob([value], {
      type: arg.mime
    }) : value;
    if (typeof id === "string") {
      sym = Symbol(id);
      this.map[id] = sym;
      return this.locker[sym] = value;
    } else if (id instanceof Symbol) {
      return this.locker[id] = value;
    }
  }

  fetch(id) {
    var res, sym, tmp;
    if (!this.has(id)) {
      return null;
    }
    tmp = new WeakMap();
    res = {};
    if (typeof id === "string") {
      sym = this.map[id];
      tmp.set(res, this.locker[sym]);
    } else if (id instanceof Symbol) {
      tmp.set(res, this.locker[id]);
    }
    if (tmp.get(res) instanceof Blob) {
      return this.fetchDeep(res);
    } else {
      return tmp.get(res);
    }
  }

  async fetchDeep(res) {
    return (await tmp.get(res).text());
  }

  remove(id) {
    var k, ref, results, sym, v, x;
    if (!this.has(id)) {
      return null;
    }
    if (typeof id === "string") {
      sym = this.map[id];
      delete this.locker[sym];
      return delete this.map[id];
    } else if (id instanceof Symbol) {
      delete this.locker[id];
      ref = Object.entries(this.map);
      // Check whether id exists in map
      results = [];
      for (x of ref) {
        [k, v] = x;
        if (v === id) {
          results.push(delete this.map[k]);
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  }

  export() {
    var key, list, ref, sym, tmp;
    // When register is empty return Null
    if (Object.keys(this.map).length === 0 && Object.keys(this.locker).length === 0) {
      return null;
    }
    tmp = new WeakMap();
    list = {};
    tmp.set(list, {});
    ref = Object.keys(this.map);
    for (key of ref) {
      sym = this.map[key];
      if (this.locker[sym]) {
        Object.defineProperty(tmp.get(list), key, {
          value: this.locker[sym]
        });
      } else {
        throw new Error("Register's integrity is corrupt");
      }
    }
    return tmp.get(list);
  }

};

var findAttr, isArray, isObject, makeToken, rand;

rand = function() {
  return Math.random().toString(36).substring(2);
};

makeToken = function() {
  return rand() + rand();
};

isArray = function(x) {
  return Array.isArray(x);
};

isObject = function(x) {
  return x instanceof Object;
};

findAttr = function(attr, node, arg = {}) {
  var attrId, attribute, item, items, ref, ref1, ref2, ref3, refGrp, refID, tmp, y;
  if (!attr || !node || typeof attr !== "string" && !isArray(attr) || !node instanceof Element) {
    console.info(`findAttr = (attr, node, arg = {}) ->
 attr (String || [String]) -> node's attribute , 
 node (Element)            ->  haystack 
 ?options (Object)
   - ?clean (Mixed) -> 
     (bool)               remove all searched attributes from the node
     (String || [String]) remove just specific attribute from the node
 returns (Object)`);
    throw new Error("incorrect function call");
  }
  tmp = new WeakMap();
  items = {};
  if (!isArray(attr)) {
    attr = [attr];
  }
  if (!(!arg.clean || isArray(arg.clean))) {
    arg.clean = [arg.clean];
  }
  tmp.set(items, {});
  for (attribute of attr) {
    // prepare locker
    tmp.get(items)[attribute] = {};
    ref = Array.from(node.querySelectorAll(`[${attribute}]`));
    // insert ref in to locker
    for (item of ref) {
      refID = item.getAttribute(attribute);
      tmp.get(items)[attribute][refID] = item;
    }
  }
  
  // remove ref(attribute) from node
  if (arg.clean) {
    ref1 = Object.entries(tmp.get(items));
    for (y of ref1) {
      [attrId, refGrp] = y;
      if (arg.clean === true) {
        ref2 = Object.values(refGrp);
        for (item of ref2) {
          item.removeAttribute(attrId);
        }
      } else {
        ref3 = Object.values(refGrp);
        for (item of ref3) {
          if (arg.clean.includes(attrId)) {
            item.removeAttribute(attrId);
          }
        }
      }
    }
  }
  
  // if only one ref group was requested, return just that group not all object
  if (attr.length === 1) {
    return tmp.get(items)[attr[0]];
  } else {
    return tmp.get(items);
  }
};

var Modal;

Modal = class Modal {
  constructor() {
    this.register = {
      reg: new Reg_(),
      locker: {},
      history: [],
      has: function(id) {
        if (this.locker[id]) {
          return true;
        } else {
          return false;
        }
      },
      add: function(id, value) {
        var token;
        if (this.has(id)) {
          throw new Error("Id already been used");
        }
        token = makeToken();
        this.locker[id] = token;
        return this.reg.save(token, value);
      },
      fetch: function(id) {
        var token;
        if (!id) {
          return null;
        }
        if (!this.has(id)) {
          if (this.history.includes(id)) {
            return console.info("Modal instance was removed from register\nUse |preserve = true| if you wish to reuse modal after hide event");
          } else {
            throw "No such modal";
          }
        }
        token = this.locker[id];
        return this.reg.fetch(token);
      },
      remove: function(id) {
        var token;
        if (!this.has(id)) {
          return true;
        }
        token = this.locker[id];
        this.reg.remove(token);
        delete this.locker[id];
        return true;
      }
    };
  }

  add(args) {
    var e, handler, html, name, template;
    try {
      if (!args || !args instanceof Object) {
        throw "Missing parameter";
      }
      [!args["name"] || typeof args["name"] !== "string", !args["html"] || typeof args["html"] !== "string", args["handler"] !== null && !args["handler"] || !args["handler"] instanceof Object].some(function(param) {
        if (param === true) {
          console.info("The 'Modal().add()' function requires object as argument\nProperty 'name' must be a string\nProperty 'html' must be a html string\nProperty 'handler' ether null or object containing hook functions");
          throw new Error("Corrupt parameter structure");
        }
      });
      ({name, html, handler} = args);
      template = document.createElement("template");
      template.innerHTML = handler && handler.beforeCreated ? handler.beforeCreated(html) : html;
      if (handler) {
        return this.register.add(name, {
          name: name,
          template: template,
          beforeRegister: handler.beforeRegister,
          onshow: handler.onshow,
          onhide: handler.onhide,
          clean: handler.clean
        });
      } else {
        return this.register.add(name, {
          name: name,
          template: template
        });
      }
    } catch (error) {
      e = error;
      throw `Modal... prototype wasn't created\n${e}`;
    }
  }

  prepare(name) {
    var e, modalObject, prototype, sym;
    try {
      if (!name) {
        throw "Missing name";
      }
      sym = Symbol(name);
      modalObject = {};
      prototype = this.register.fetch(name);
      Object.defineProperty(modalObject, "name", {
        value: prototype.name,
        writable: false
      });
      Object.defineProperty(modalObject, "node", {
        value: prototype.template.content.firstElementChild,
        writable: false
      });
      Object.defineProperty(modalObject, "sym", {
        value: sym,
        writable: false
      });
      Object.defineProperty(modalObject, "remove", {
        value: this.register.remove.bind(this.register),
        writable: false
      });
      Object.defineProperty(modalObject, "preserve", {
        set: function(state) {
          return this.isPreserved = state ? "true" : false;
        }
      });
      Object.defineProperty(modalObject, "onshow", {
        value: prototype.onshow,
        writable: false
      });
      Object.defineProperty(modalObject, "onhide", {
        value: prototype.onhide,
        writable: false
      });
      Object.defineProperty(modalObject, "clean", {
        value: prototype.clean,
        writable: false
      });
      
      // SHOW
      Object.defineProperty(modalObject, "show", {
        value: function(container) {
          if (!container || !container instanceof Element) {
            throw container = document.body;
          }
          this.container = container;
          // Hook before node was inserted in to DOM
          if (this.onshow) {
            this.onshow();
          }
          // Insert node in to DOM
          container.appendChild(this.node);
          // Leave information that currently node is in DOM
          return this.onDisplay = true;
        },
        writable: false,
        configurable: false
      });
      // HIDE
      Object.defineProperty(modalObject, "hide", {
        value: function() {
          if (!!this.wasRemoved) {
            return this.wasRemoved();
          }
          // Hook before node was hidden 
          if (this.onhide) {
            this.onhide();
          }
          // Remove node from DOM
          this.container.removeChild(this.node);
          if (!this.isPreserved) {
            
            // Remove from register
            this.remove(this.sym);
            // Hook after instance was removed
            if (this.clean) {
              this.clean();
            }
            // When "clean" hook was defined, but modal is preserved, notify about that fact
            if (this.clean && !this.isPreserved) {
              return console.info("\"clean\" hook won't work if modal is preserved ");
            }
          } else {
            // When "isPreserved" just leave information that currently node isn't in DOM 
            return this.onDisplay = false;
          }
        },
        writable: false,
        configurable: false
      });
      if (!!prototype.beforeRegister) {
        
        // Hook before modal was registered
        prototype.beforeRegister(modalObject);
      }
      this.register.add(sym, modalObject);
      this.register.history.push(sym);
      return sym;
    } catch (error) {
      e = error;
      throw `Modal preparation failed\n${e}`;
    }
  }

  find(sym) {
    if (!sym || !sym instanceof Symbol) {
      return null;
    }
    if (this.register.has(sym)) {
      return this.register.fetch(sym);
    } else {
      return null;
    }
  }

};

class requestFunctions {
  constructor() {

  }

  validateArgs() {

    try {

      if(!this.args || !this.args.path || !this.args.method) {
        throw "Missing property,\n either path or method, others are optional";
      } 

      if( this.args.method !== "GET" && this.args.method !== "POST" && this.args.method !== "PUT") {
        throw "Unsupported method";
      }

      if(this.args.headers && this.args.headers !== "auto" ) {

        if( !Array.isArray(this.args.headers) ) {
          throw "Wrong property instance. The 'headers' property, should be an array instance";
        }

        if( this.args.headers.length === 0 ) {
          throw "If there is no headers in request, the 'headers' property should be defined as 'auto' ";
        }

        let isHeaderValid;
        this.args.headers.forEach( function(header, index) {
          if( Array.isArray(header) ) {
            if( header.length === 2 ) {
              if( typeof header[0] === "string" && typeof header[1] === "string" ) {
                isHeaderValid = isHeaderValid === false ? false : true;
                return;
              }
            }
          }
          console.log(`Header index: ${index}`)
          console.log("Header:");
          console.log(header);
          isHeaderValid = false;

        });

        if(!isHeaderValid)
          throw "Corrupted headers structure, all parameters should be an instance of an array, have two indexes, and they should be strings";

      }

      if(this.args.data) {

        if( !Array.isArray(this.args.data) ) {
          throw "Wrong property instance. The 'data' property, should be an array instance";
        }

        if( this.args.data.length === 0 ) {
          throw "If there is no parameters in request data, the 'data' property should be defined as null";
        }

        let isDataVaild;
        this.args.data.forEach( function(parameter, index) {
          if( parameter instanceof Object) {
            if("name" in parameter && "value" in parameter) {
              if(typeof parameter.name === "string") {
                isDataVaild = isDataVaild === false ? false : true;
                return;
              }
            }
          }
          console.log(`Parameter index: ${index}`)
          console.log("Parameter:");
          console.log(parameter);
          isDataVaild = false;

        });
        
        if(!isDataVaild)
          throw "Corrupted data structure, all parameters should be an instance of an object, have name and value properties, name schoud be a string";
      
      }

      return true;

    } catch(e) {

        if(e instanceof Error) {
          console.error(e);
          throw "Syntax error";
        } else {
            console.trace();
            throw `Provided arguments are invalid\n\r${e}`;
        }
       
    }
  }

  prepareRequest() {

    try {

      this.path    = this.args.path; 
      this.method  = this.args.method;
      this.headers = this.args.headers === "auto" ? null : this.args.headers;

      if(this.args.data) {
        if(this.args.method === "GET") {
          let route;
          route = "?time=" + encodeURIComponent(new Date().toString());
          this.args.data.forEach(function(arg) {
            route += `&${arg.name}=${ encodeURIComponent(arg.value) }`;
          });
          this.path = this.path + route;
        } else if(this.args.method === "POST") {
            const data = new FormData();
            data.append("time", new Date().toString());
            this.args.data.forEach(function(arg) {
              data.append(arg.name, arg.value);
            });
            this.data = data;
        }
      }

    } catch(e) {

        if(e instanceof Error) {
          console.error(e);
          throw "Syntax error";
        } else {
            console.trace();
            throw "While preparing request\n" + e;

        }

    }

    return;

  }


}

class XHRRequest extends requestFunctions {
  constructor(args) {
    super();
    this.args = args;
    return this.init();
  }

  
  init() {

    try {

      console.group(`%cXHRRequest => ${this.args.info ? this.args.info : ""}`, "color:orange");
      this.validateArgs();
      this.prepareRequest();
      console.info("%cXHR was send", "color:green");
      return this.call();

    } catch(e) {

        console.error(e);
        return false;

      
    } finally {
      
        console.groupEnd();
    
    }

  }

  call() {

    return new Promise( (res, rej) => {

      const req = new XMLHttpRequest();

      if(this.args.progress) {
        req.upload.addEventListener("progress", this.args.progress);
      }
    
      req.addEventListener("error", (event) => {
        if(this.args.error) {
          this.args.error(event);
        }
        rej(event);
      });

      req.addEventListener("abort", (event) => {
        if(this.args.abort) {
          this.args.abort(event);
        }
        rej(event);
      });
    
     
      req.addEventListener("load", (event) => {
        if(this.args.load) {
          this.args.load(event);
        }
        res(JSON.parse( event.target.response ));
      });
      
    

      req.open(this.method, this.path, true);

      if(this.headers) {
        this.headers.forEach(function(header) {
          req.setRequestHeader(header[0], header[1]);
        })
      }

      req.send(this.data ? this.data : null );
      

    });
  }
}
var UploadButton;

UploadButton = class UploadButton {
  constructor() {
    this.prepareNode();
    return this.export;
  }

  prepareNode() {
    var self, setupEvent, template, wrapper;
    template = document.createElement("template");
    template.innerHTML = `<div role="button">
  <button ref="btn" onclick="this.nextElementSibling.click()" >Browse</button>
  <input  ref="inpt" type="file" hidden />
</div>`;
    setupEvent = this.setup.bind(this);
    self = (what, state) => {
      if (what === "fileReadMethod") {
        this.fileReadMethod = state;
      }
      if (what === "readerEncoding") {
        return this.readerEncoding = state;
      }
    };
    
    // Return form class
    wrapper = template.content.firstElementChild;
    Object.defineProperty(this, "export", {
      value: {
        wrapper: wrapper,
        button: wrapper.querySelector("[ref=btn]"),
        input: wrapper.querySelector("[ref=inpt]"),
        files: [],
        swapWith: function(btn) {
          if (!btn || !btn instanceof Element || btn.localName !== 'button') {
            console.info("Missing button parameter or isn't instnce of Element");
            throw new Error("The button wasn't swapped");
          }
          // Assign event
          btn.addEventListener("click", () => {
            return this.input.click();
          });
          // Swap
          btn.parentNode.replaceChild(this.wrapper, btn); // swap orginal button node witch (whole) generic wrapper Element
          this.wrapper.replaceChild(btn, this.button); // inside wrapper Element, swap generic button node witch original one
          return this.button = btn; // inside export object, swap generic button Element which original button node, 
        },
        // Initiate upload events
        setup: function() {
          return setupEvent();
        }
      }
    });
    Object.defineProperty(this.export, "returnFormat", {
      set(type) {

        const valid = ["readAsArrayBuffer", "readAsDataURL", "readAsText"]
          .some(function(method) {
            return method === type;
        });

        if(!valid) {
          console.group("%cUpload button", "color:orange");
          console.warn("No such read format");
          console.info("Using default (readAsDataURL)");
          console.groupEnd();
          self("fileReadMethod", "readAsDataURL");
        } else self("fileReadMethod", type);

      }
      
    // Read method 
    });
    Object.defineProperty(this.export, "encodingFormat", {
      set(type) {
        self("readerEncoding", type);
      }
      // File encoding format ( only for read as text )
    });
    return Object.defineProperty(this.export, "allowMultiple", {
      set(val) {
        val 
          ? this.input.setAttribute("multiple", "multiple")
          : this.input.removeAttribute("multiple", "multiple")
      }
      // Allow multiple files input
    });
  }

  setup() {
    return this.export.input.addEventListener("input", (event) => {
      // event.target.files because, when adding more than one file
      return Array.from(event.target.files).forEach((file) => {
        var reader;
        reader = new FileReader();
        switch (this.fileReadMethod) {
          case "readAsArrayBuffer":
            reader.readAsArrayBuffer(file);
            break;
          case "readAsDataURL":
            reader.readAsDataURL(file);
            break;
          case "readAsText":
            if (this.readerEncoding) {
              reader.readAsDataURL(file, this.readerEncoding);
            } else {
              console.group("%cUpload button", "color:orange");
              console.warn("readAsText, encoding wasn't defined");
              console.info("Using default (utf-8)");
              console.groupEnd();
              reader.readAsDataURL(file, "utf-8");
            }
            break;
          default:
            throw new Error("Wrong read method");
        }
        if (this.export.loadstart) {
          reader.onloadstart = (event) => {
            return this.export.loadstart(event);
          };
        }
        if (this.export.progress) {
          reader.onprogress = (event) => {
            return this.export.progress(event);
          };
        }
        if (this.export.abort) {
          reader.onabort = (event) => {
            return this.export.abort(event);
          };
        }
        if (this.export.loadend) {
          reader.onloadend = (event) => {
            return this.export.loadend(event);
          };
        }
        if (this.export.onerror) {
          reader.onerror = (event) => {
            return this.export.onerror(event);
          };
        }
        return reader.onload = (event) => {
          return this.export.onload({
            name: file.name,
            size: file.size,
            type: file.type,
            src: reader.result
          });
        };
      });
    });
  }

};
