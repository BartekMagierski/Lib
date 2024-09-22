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

var findAttr, makeToken, rand;

rand = function() {
  return Math.random().toString(36).substring(2);
};

makeToken = function() {
  return rand() + rand();
};

findAttr = function(attr, node, arg) {
  var attribute, item, items, key, obj, ref, results, rmoAttr, tmp, x;
  if (!attr || !node || typeof attr !== "string" || !node instanceof Element) {
    console.info(`Function 'findAttr' accepts 3 argumets: name, node/s to search and ?options(Object)
Argument 'arrt' might be an array of strings
options:
  - ?clean   (Bool)   -> remove atribute from node
  - ?cleanFor(String) -> remove just specific attribute, might be an array `);
    throw "Mising parameter";
  }
  tmp = new WeakMap();
  items = {};
  if (!Array.isArray(attr)) {
    attr = [attr];
  }
// find
  for (attribute of attr) {
    tmp.get(items)[attribute] = node.querySelector(attribute);
  }
  // clean if required
  if (arg && arg.clean || arg.cleanFor) {
    ref = Object.entries(tmp.get(items));
    results = [];
    for (x of ref) {
      [key, obj] = x;
      results.push((function() {
        var results1;
        results1 = [];
        for (item of obj) {
          if (arg.clean) {
            results1.push(obj.removeAttribute(key));
          } else {
            results1.push((function() {
              var ref1, results2;
              ref1 = arg.cleanFor;
              results2 = [];
              for (rmoAttr of ref1) {
                if (obj.hasAttribute(rmoAttr)) {
                  results2.push(obj.removeAttribute(rmoAttr));
                } else {
                  results2.push(void 0);
                }
              }
              return results2;
            })());
          }
        }
        return results1;
      })());
    }
    return results;
  } else {
    
    // return
    if (Object.values(tmp.get(items)).length === 1) {
      return tmp.get(items)[attr[0]];
    } else {
      return tmp.get(items);
    }
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
            throw "Missing target container";
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
    var self, setup, template, wrapper;
    template = document.createElement("template");
    template.innerHTML = `<div role="button">
  <button ref="btn">Browse</button>
  <input  ref="inpt" type="file" hidden />
</div>`;
    wrapper = template.content.firstElementChild;
    setup = this.setupNode.bind(this);
    self = (what, state) => {
      if (what === "resolve") {
        this.success = state;
      }
      if (what === "reject") {
        this.failure = state;
      }
      if (what === "fileReadMethod") {
        this.fileReadMethod = state;
      }
      if (what === "readerEncoding") {
        return this.readerEncoding = state;
      }
    };
    Object.defineProperty(this, "export", {
      value: {
        wrapper: wrapper,
        button: wrapper.querySelector("[ref=btn]"),
        input: wrapper.querySelector("[ref=inpt]"),
        files: []
      }
    });
    Object.defineProperty(this.export, "wasInput", {
      get() {
        return new Promise ((resolve, reject) => {
          setup();
          self("resolve", resolve);
          self("reject", reject);
        })
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
    });
    return Object.defineProperty(this.export, "encodingFormat", {
      set(type) {

        const valid = ["US-ASCII","ISO_8859-1:1987","ISO_8859-2:1987","ISO_8859-3:1988","ISO_8859-4:1988","ISO_8859-5:1988","ISO_8859-6:1987","ISO_8859-7:1987","ISO_8859-8:1988","ISO_8859-9:1989","ISO-8859-10","ISO_6937-2-add","JIS_X0201","JIS_Encoding","Shift_JIS","Extended_UNIX_Code_Packed_Format_for_Japanese","Extended_UNIX_Code_Fixed_Width_for_Japanese","BS_4730","SEN_850200_C","IT","ES","DIN_66003","NS_4551-1","NF_Z_62-010","ISO-10646-UTF-1","ISO_646.basic:1983","INVARIANT","ISO_646.irv:1983","NATS-SEFI","NATS-SEFI-ADD","NATS-DANO","NATS-DANO-ADD","SEN_850200_B","KS_C_5601-1987","ISO-2022-KR","EUC-KR","ISO-2022-JP","ISO-2022-JP-2","JIS_C6220-1969-jp","JIS_C6220-1969-ro","PT","greek7-old","latin-greek","NF_Z_62-010_(1973)","Latin-greek-1","ISO_5427","JIS_C6226-1978","BS_viewdata","INIS","INIS-8","INIS-cyrillic","ISO_5427:1981","ISO_5428:1980","GB_1988-80","GB_2312-80","NS_4551-2","videotex-suppl","PT2","ES2","MSZ_7795.3","JIS_C6226-1983","greek7","ASMO_449","iso-ir-90","JIS_C6229-1984-a","JIS_C6229-1984-b","JIS_C6229-1984-b-add","JIS_C6229-1984-hand","JIS_C6229-1984-hand-add","JIS_C6229-1984-kana","ISO_2033-1983","ANSI_X3.110-1983","T.61-7bit","T.61-8bit","ECMA-cyrillic","CSA_Z243.4-1985-1","CSA_Z243.4-1985-2","CSA_Z243.4-1985-gr","ISO_8859-6-E","ISO_8859-6-I","T.101-G2","ISO_8859-8-E","ISO_8859-8-I","CSN_369103","JUS_I.B1.002","IEC_P27-1","JUS_I.B1.003-serb","JUS_I.B1.003-mac","greek-ccitt","NC_NC00-10:81","ISO_6937-2-25","GOST_19768-74","ISO_8859-supp","ISO_10367-box","latin-lap","JIS_X0212-1990","DS_2089","us-dk","dk-us","KSC5636","UNICODE-1-1-UTF-7","ISO-2022-CN","ISO-2022-CN-EXT","UTF-8","ISO-8859-13","ISO-8859-14","ISO-8859-15","ISO-8859-16","GBK","GB18030","OSD_EBCDIC_DF04_15","OSD_EBCDIC_DF03_IRV","OSD_EBCDIC_DF04_1","ISO-11548-1","KZ-1048","ISO-10646-UCS-2","ISO-10646-UCS-4","ISO-10646-UCS-Basic","ISO-10646-Unicode-Latin1","ISO-10646-J-1","ISO-Unicode-IBM-1261","ISO-Unicode-IBM-1268","ISO-Unicode-IBM-1276","ISO-Unicode-IBM-1264","ISO-Unicode-IBM-1265","UNICODE-1-1","SCSU","UTF-7","UTF-16BE","UTF-16LE","UTF-16","CESU-8","UTF-32","UTF-32BE","UTF-32LE","BOCU-1","UTF-7-IMAP","ISO-8859-1-Windows-3.0-Latin-1","ISO-8859-1-Windows-3.1-Latin-1","ISO-8859-2-Windows-Latin-2","ISO-8859-9-Windows-Latin-5","hp-roman8","Adobe-Standard-Encoding","Ventura-US","Ventura-International","DEC-MCS","IBM850","PC8-Danish-Norwegian","IBM862","PC8-Turkish","IBM-Symbols","IBM-Thai","HP-Legal","HP-Pi-font","HP-Math8","Adobe-Symbol-Encoding","HP-DeskTop","Ventura-Math","Microsoft-Publishing","Windows-31J","GB2312","Big5","macintosh","IBM037","IBM038","IBM273","IBM274","IBM275","IBM277","IBM278","IBM280","IBM281","IBM284","IBM285","IBM290","IBM297","IBM420","IBM423","IBM424","IBM437","IBM500","IBM851","IBM852","IBM855","IBM857","IBM860","IBM861","IBM863","IBM864","IBM865","IBM868","IBM869","IBM870","IBM871","IBM880","IBM891","IBM903","IBM904","IBM905","IBM918","IBM1026","EBCDIC-AT-DE","EBCDIC-AT-DE-A","EBCDIC-CA-FR","EBCDIC-DK-NO","EBCDIC-DK-NO-A","EBCDIC-FI-SE","EBCDIC-FI-SE-A","EBCDIC-FR","EBCDIC-IT","EBCDIC-PT","EBCDIC-ES","EBCDIC-ES-A","EBCDIC-ES-S","EBCDIC-UK","EBCDIC-US","UNKNOWN-8BIT","MNEMONIC","MNEM","VISCII","VIQR","KOI8-R","HZ-GB-2312","IBM866","IBM775","KOI8-U","IBM00858","IBM00924","IBM01140","IBM01141","IBM01142","IBM01143","IBM01144","IBM01145","IBM01146","IBM01147","IBM01148","IBM01149","Big5-HKSCS","IBM1047","PTCP154","Amiga-1251","KOI7-switched","BRF","TSCII","CP51932","windows-874","windows-1250","windows-1251","windows-1252","windows-1253","windows-1254","windows-1255","windows-1256","windows-1257","windows-1258","TIS-620","CP50220"]
          .some(function(method) {
            return method === type;
        });

        if(!valid) {
          console.group("%cUpload button", "color:orange");
          console.warn("Unknown encoding format");
          console.info("Using default (utf-8)");
          console.groupEnd();
          self("readerEncoding", "utf-8");
        } else self("readerEncoding", type);

      }
    });
  }

  setupNode() {
    this.export.button.addEventListener("click", () => {
      return this.export.input.click();
    });
    return this.export.input.addEventListener("input", (event) => {
      var reader;
      reader = new FileReader();
      return Array.from(event.target.files).forEach((file) => {
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
              reader.readAsDataURL(file);
            }
            break;
          default:
            throw new Error("Wrong file read method");
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
        reader.onerror = () => {
          console.error(reader.error);
          return this.failure("Upload error, client side");
        };
        return reader.onload = () => {
          this.export.files.push({
            name: file.name,
            size: file.size,
            type: file.type,
            src: reader.result
          });
          return this.success(this.export.files);
        };
      });
    });
  }

};
