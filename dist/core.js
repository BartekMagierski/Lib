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

var findAttr, isArray, isObject, makeToken, rand, till;

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

// Await 
till = function(durr) {
  if (!durr || typeof durr !== "number") {
    return;
  }
  return new Promise(function(resolve) {
    return setTimeout(function() {
      return resolve();
    }, durr);
  });
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
        if (!this.locker[id]) {
          // Inform that modal wasn't preserved
          if (this.history.includes(id)) {
            console.info("Modal instance was removed from register\nUse |preserve = true| if you wish to reuse modal after \"hide\" event");
          }
          return false;
        } else {
          return true;
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
        if (!id || !this.has(id)) {
          return null;
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
    var modalObject, prototype, sym;
    if (!name) {
      throw "Missing prototype id";
    }
    sym = Symbol(name);
    modalObject = {};
    prototype = this.register.fetch(name);
    if (!prototype) {
      throw "No such prototype";
    }
    Object.defineProperties(modalObject, {
      name: {
        value: prototype.name,
        writable: false,
        configurable: false
      },
      node: {
        value: prototype.template.content.firstElementChild.cloneNode(true),
        writable: false,
        configurable: false
      },
      sym: {
        value: sym,
        writable: false,
        configurable: false
      },
      remove: {
        value: this.register.remove.bind(this.register),
        writable: false,
        configurable: false
      },
      onshow: {
        value: prototype.onshow,
        writable: false,
        configurable: false
      },
      onhide: {
        value: prototype.onhide,
        writable: false,
        configurable: false
      },
      clean: {
        value: prototype.clean,
        writable: false,
        configurable: false
      },
      isPreserved: {
        value: true,
        writable: true,
        configurable: false
      },
      preserve: {
        set: function(state) {
          return this.isPreserved = state ? true : false;
        }
      },
      // SHOW
      show: {
        value: function(container) {
          if (!container || !container instanceof Element) {
            container = document.body;
          }
          this.container = container;
          // Hook "before node was inserted in to DOM"
          if (this.onshow) {
            this.onshow(modalObject);
            container.appendChild(this.node);
          } else {
            container.appendChild(this.node);
          }
          
          // Leave information that currently node is in DOM
          return this.onDisplay = true;
        },
        writable: false,
        configurable: false
      },
      // HIDE
      hide: {
        value: async function() {
          // Hook "Before node will be removed from DOM 
          if (this.onhide) {
            await this.onhide(modalObject);
            this.container.removeChild(this.node);
          } else {
            this.container.removeChild(this.node);
          }
          if (!this.isPreserved) {
            
            // Remove from register
            this.remove(this.sym);
            // Hook after instance was removed
            if (this.clean) {
              this.clean();
            }
          } else {
            this.noDisplay = false;
          }
          // When "clean" hook was used, but modal is preserved, notify about that it wont work
          if (this.clean && this.isPreserved) {
            return console.info("\"clean\" hook won't work if modal is preserved ");
          }
        },
        writable: false,
        configurable: false
      }
    });
    if (!!prototype.beforeRegister) {
      
      // Hook "before modal was registered"
      prototype.beforeRegister(modalObject);
    }
    this.register.add(sym, modalObject);
    this.register.history.push(sym);
    return sym;
  }

  find(sym) {
    var e, obj;
    try {
      obj = this.register.fetch(sym);
      if (obj === null) {
        throw "Instance does not exist";
      } else {
        return obj;
      }
    } catch (error) {
      e = error;
      if (e instanceof Error) {
        return console.error(e);
      } else {
        throw e;
      }
    }
  }

};

var ModalDefaults;

ModalDefaults = class ModalDefaults extends Modal {
  constructor(args1 = {}) {
    console.info("Modal defaults requires Bootstrap 5.3.3+, use \"loadBootstrap()\" if necessary");
    super();
    this.args = args1;
    this.localStorage = {
      target: null,
      type: {
        items: [],
        has: function(id) {
          return this.items.includes(id != null ? id : false);
        },
        add: function(id) {
          if (!this.has(id)) {
            return this.items.push(id);
          } else {
            throw "Type exist";
          }
        },
        list: function() {
          return this.items;
        }
      }
    };
    // Load animations
    if (this.args.loadBootstrap) {
      this.loadBootstrap();
    }
    if (this.args["animation"]) {
      this.animations = true;
      Object.defineProperties(this, {
        animationDurration: {
          get: function() {
            if (this.args.animation["durration"]) {
              return this.args.animation.durration;
            } else {
              return 300;
            }
          }
        }
      });
      this.loadAnimations();
    }
    // target container
    if (this.args.target) {
      this.localStorage.target = this.args.target;
    }
    this.make();
  }

  throwMsg(args) {
    var e, instance, ref, sym;
    try {
      if (!this.localStorage.type.has(args.type)) {
        console.group("Modal defaults");
        console.info(`Available defaults`);
        console.log(this.localStorage.type.list());
        console.groupEnd();
        throw `Modal default type: "${args.type}" unavailable`;
      }
      // Instance
      sym = this.register.fetch(args.type);
      instance = this.register.fetch(sym);
      // Text
      if (args.text) {
        instance.setText = args.text;
      } else {
        console.warn("Nothing to show");
      }
      // Render
      return instance.show((ref = this.localStorage.target) != null ? ref : document.body);
    } catch (error) {
      e = error;
      if (e instanceof Error) {
        return console.error(e);
      } else {
        throw e;
      }
    }
  }

  make() {
    var animations, func, templates;
    templates = this.templates();
    animations = this.animations;
    func = {
      beforeRegister: function(i) {
        Object.defineProperties(i, {
          refs: {
            value: findAttr("ref", i.node),
            writable: false,
            configurable: false,
            enumerable: false
          },
          setText: {
            set: function(arg) {
              var ref, ref1, ref2;
              this.refs.title.innerHTML = (ref = arg.title) != null ? ref : "";
              this.refs.msg.innerHTML = (ref1 = arg.message) != null ? ref1 : "";
              return this.refs.btn.textContent = (ref2 = arg.button) != null ? ref2 : "";
            }
          }
        });
        return i.refs.btn.addEventListener("click", function() {
          return i.hide();
        });
      },
      onshow: async(i) => {
        if (this.animations) {
          if (i.isPreserved) {
            i.node.classList.remove("hideDefaultModalBox");
          }
          await till(this.animationDurration);
          i.refs.btn.disabled = false;
        }
      },
      onhide: (i) => {
        if (this.animations) {
          i.node.classList.add("hideDefaultModalBox");
          i.refs.btn.disabled = true;
          return till(this.animationDurration);
        }
      }
    };
    [
      {
        id: "error",
        name: "errorBox",
        html: templates.errorBox,
        handler: {
          beforeRegister: function(i) {
            return func.beforeRegister(i);
          },
          onshow: function(i) {
            return func.onshow(i);
          },
          onhide: function(i) {
            return func.onhide(i);
          }
        }
      },
      {
        id: "success",
        name: "successBox",
        html: templates.successBox,
        handler: {
          beforeRegister: function(i) {
            return func.beforeRegister(i);
          },
          onshow: function(i) {
            return func.onshow(i);
          },
          onhide: function(i) {
            return func.onhide(i);
          }
        }
      },
      {
        id: "info",
        name: "infoBox",
        html: templates.infoBox,
        handler: {
          beforeRegister: function(i) {
            return func.beforeRegister(i);
          },
          onshow: function(i) {
            return func.onshow(i);
          },
          onhide: function(i) {
            return func.onhide(i);
          }
        }
      },
      {
        id: "text",
        name: "textBox",
        html: templates.textBox,
        handler: {
          beforeRegister: function(i) {
            return func.beforeRegister(i);
          },
          onshow: function(i) {
            return func.onshow(i);
          },
          onhide: function(i) {
            return func.onhide(i);
          }
        }
      }
    ].forEach((obj) => {
      this.add(obj);
      this.register.add(obj.id, this.prepare(obj.name));
      this.localStorage.type.add(obj.id);
    });
  }

  templates() {
    return {
      errorBox: `<div class="modalBox error">
  <div class="wrapper w-100 h-100 fixed-top container-fluid d-flex justify-content-center align-items-center">
    <div class="wrapper-inner border border-2 rounded border-danger p-2" style="max-width:75%;min-width:400px">
      <!-- Title -->
      <div class="title">
        <h2 class="text-danger" ref="title"></h2>
      </div>
      <!-- Message -->
      <div class="message p-2">
        <p ref="msg"></p>
      </div>
      <!-- Button -->
      <div class="close-btn text-end">
        <button class="btn btn-danger" ref="btn"></button>
      </div>
    </div>
  </div>
</div>`,
      successBox: `<div class="modalBox success">
  <div class="wrapper w-100 h-100 fixed-top container-fluid d-flex justify-content-center align-items-center">
    <div class="wrapper-inner border border-2 rounded border-success p-2" style="max-width:75%;min-width:400px">
      <!-- Title -->
      <div class="title">
        <h2 class="text-success" ref="title"></h2>
      </div>
      <!-- Message -->
      <div class="message p-2">
        <p ref="msg"></p>
      </div>
      <!-- Button -->
      <div class="button text-end">
        <button class="btn btn-success" ref="btn"></button>
      </div>
    </div>
  </div>
</div>`,
      infoBox: `<div class="modalBox info">
  <div class="wrapper w-100 h-100 fixed-top container-fluid d-flex justify-content-center align-items-center">
    <div class="wrapper-inner border border-2 rounded border-primary p-2" style="max-width:75%;min-width:400px">
      <!-- Title -->
      <div class="title">
        <h2 class="text-primary" ref="title"></h2>
      </div>
      <!-- Message -->
      <div class="message p-2">
        <p ref="msg"></p>
      </div>
      <!-- Button -->
      <div class="button text-end">
        <button class="btn btn-primary" ref="btn"></button>
      </div>
    </div>
  </div>
</div>`,
      textBox: `<div class="modalBox text">
  <div class="wrapper w-100 h-100 fixed-top container-fluid d-flex justify-content-center align-items-center">
    <div class="wapper-inner border border-2 rounded border-secondary p-2" style="max-width:75%;min-width:400px">
      <!-- Title -->
      <div class="title">
        <h2 class="text-secondary" ref="title"></h2>
      </div>
      <!-- Message -->
      <div class="message p-2">
        <p ref="msg"></p>
      </div>
      <!-- Button -->
      <div class="button text-end">
        <button class="btn btn-secondary" ref="btn"></button>
      </div>
    </div>
  </div>
</div>`
    };
  }

  loadAnimations() {
    var animationsCSS, css;
    animationsCSS = document.createElement("style");
    animationsCSS.type = 'text/css';
    css = `@keyframes showDefaultModal {
  from {opacity: 0;}
  to {opacity: 1;}
}
@keyframes hideDefaultModal {
  from {opacity: 1;}
  to {opacity: 0;}
}
.modalBox {
  opacity: 0;
  animation-name: showDefaultModal;
  animation-duration: ${this.animationDurration}ms;
  animation-fill-mode: forwards;
}
.hideDefaultModalBox {
  opacity: 1;
  animation-name: hideDefaultModal;
}`;
    animationsCSS.appendChild(document.createTextNode(css));
    document.head.prepend(animationsCSS);
    console.info("Animations was loaded");
  }

  loadBootstrap() {
    var bootstrapCSS;
    bootstrapCSS = document.createElement("link");
    bootstrapCSS.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
    bootstrapCSS.integrity = "sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH";
    bootstrapCSS.rel = "stylesheet";
    bootstrapCSS.crossOrigin = "anonymous";
    bootstrapCSS.title = "Bootstrap_css";
    document.head.prepend(bootstrapCSS);
    console.info("Bootstrap 5.3.3.min was loaded");
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

        if(!Array.isArray(this.args.data) ) {
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
        } else if(this.args.method === "PUT") {
            this.data = this.args.data;
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
