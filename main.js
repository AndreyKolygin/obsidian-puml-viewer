"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/plantuml-encoder/dist/plantuml-encoder.js
var require_plantuml_encoder = __commonJS({
  "node_modules/plantuml-encoder/dist/plantuml-encoder.js"(exports, module2) {
    (function(f) {
      if (typeof exports === "object" && typeof module2 !== "undefined") {
        module2.exports = f();
      } else if (typeof define === "function" && define.amd) {
        define([], f);
      } else {
        var g;
        if (typeof window !== "undefined") {
          g = window;
        } else if (typeof global !== "undefined") {
          g = global;
        } else if (typeof self !== "undefined") {
          g = self;
        } else {
          g = this;
        }
        g.plantumlEncoder = f();
      }
    })(function() {
      var define2, module3, exports2;
      return (/* @__PURE__ */ (function() {
        function r(e, n, t) {
          function o(i2, f) {
            if (!n[i2]) {
              if (!e[i2]) {
                var c = "function" == typeof require && require;
                if (!f && c) return c(i2, true);
                if (u) return u(i2, true);
                var a = new Error("Cannot find module '" + i2 + "'");
                throw a.code = "MODULE_NOT_FOUND", a;
              }
              var p = n[i2] = { exports: {} };
              e[i2][0].call(p.exports, function(r2) {
                var n2 = e[i2][1][r2];
                return o(n2 || r2);
              }, p, p.exports, r, e, n, t);
            }
            return n[i2].exports;
          }
          for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
          return o;
        }
        return r;
      })())({ 1: [function(require2, module4, exports3) {
        "use strict";
        var pako = require2("pako/lib/deflate.js");
        module4.exports = function(data) {
          return pako.deflateRaw(data, { level: 9, to: "string" });
        };
      }, { "pako/lib/deflate.js": 4 }], 2: [function(require2, module4, exports3) {
        "use strict";
        function encode6bit(b) {
          if (b < 10) {
            return String.fromCharCode(48 + b);
          }
          b -= 10;
          if (b < 26) {
            return String.fromCharCode(65 + b);
          }
          b -= 26;
          if (b < 26) {
            return String.fromCharCode(97 + b);
          }
          b -= 26;
          if (b === 0) {
            return "-";
          }
          if (b === 1) {
            return "_";
          }
          return "?";
        }
        function append3bytes(b1, b2, b3) {
          var c1 = b1 >> 2;
          var c2 = (b1 & 3) << 4 | b2 >> 4;
          var c3 = (b2 & 15) << 2 | b3 >> 6;
          var c4 = b3 & 63;
          var r = "";
          r += encode6bit(c1 & 63);
          r += encode6bit(c2 & 63);
          r += encode6bit(c3 & 63);
          r += encode6bit(c4 & 63);
          return r;
        }
        module4.exports = function(data) {
          var r = "";
          for (var i = 0; i < data.length; i += 3) {
            if (i + 2 === data.length) {
              r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
            } else if (i + 1 === data.length) {
              r += append3bytes(data.charCodeAt(i), 0, 0);
            } else {
              r += append3bytes(
                data.charCodeAt(i),
                data.charCodeAt(i + 1),
                data.charCodeAt(i + 2)
              );
            }
          }
          return r;
        };
      }, {}], 3: [function(require2, module4, exports3) {
        "use strict";
        var deflate = require2("./deflate");
        var encode64 = require2("./encode64");
        module4.exports.encode = function(puml) {
          var deflated = deflate(puml);
          return encode64(deflated);
        };
      }, { "./deflate": 1, "./encode64": 2 }], 4: [function(require2, module4, exports3) {
        "use strict";
        var zlib_deflate = require2("./zlib/deflate");
        var utils = require2("./utils/common");
        var strings = require2("./utils/strings");
        var msg = require2("./zlib/messages");
        var ZStream = require2("./zlib/zstream");
        var toString = Object.prototype.toString;
        var Z_NO_FLUSH = 0;
        var Z_FINISH = 4;
        var Z_OK = 0;
        var Z_STREAM_END = 1;
        var Z_SYNC_FLUSH = 2;
        var Z_DEFAULT_COMPRESSION = -1;
        var Z_DEFAULT_STRATEGY = 0;
        var Z_DEFLATED = 8;
        function Deflate(options) {
          if (!(this instanceof Deflate)) return new Deflate(options);
          this.options = utils.assign({
            level: Z_DEFAULT_COMPRESSION,
            method: Z_DEFLATED,
            chunkSize: 16384,
            windowBits: 15,
            memLevel: 8,
            strategy: Z_DEFAULT_STRATEGY,
            to: ""
          }, options || {});
          var opt = this.options;
          if (opt.raw && opt.windowBits > 0) {
            opt.windowBits = -opt.windowBits;
          } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
            opt.windowBits += 16;
          }
          this.err = 0;
          this.msg = "";
          this.ended = false;
          this.chunks = [];
          this.strm = new ZStream();
          this.strm.avail_out = 0;
          var status = zlib_deflate.deflateInit2(
            this.strm,
            opt.level,
            opt.method,
            opt.windowBits,
            opt.memLevel,
            opt.strategy
          );
          if (status !== Z_OK) {
            throw new Error(msg[status]);
          }
          if (opt.header) {
            zlib_deflate.deflateSetHeader(this.strm, opt.header);
          }
          if (opt.dictionary) {
            var dict;
            if (typeof opt.dictionary === "string") {
              dict = strings.string2buf(opt.dictionary);
            } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
              dict = new Uint8Array(opt.dictionary);
            } else {
              dict = opt.dictionary;
            }
            status = zlib_deflate.deflateSetDictionary(this.strm, dict);
            if (status !== Z_OK) {
              throw new Error(msg[status]);
            }
            this._dict_set = true;
          }
        }
        Deflate.prototype.push = function(data, mode) {
          var strm = this.strm;
          var chunkSize = this.options.chunkSize;
          var status, _mode;
          if (this.ended) {
            return false;
          }
          _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
          if (typeof data === "string") {
            strm.input = strings.string2buf(data);
          } else if (toString.call(data) === "[object ArrayBuffer]") {
            strm.input = new Uint8Array(data);
          } else {
            strm.input = data;
          }
          strm.next_in = 0;
          strm.avail_in = strm.input.length;
          do {
            if (strm.avail_out === 0) {
              strm.output = new utils.Buf8(chunkSize);
              strm.next_out = 0;
              strm.avail_out = chunkSize;
            }
            status = zlib_deflate.deflate(strm, _mode);
            if (status !== Z_STREAM_END && status !== Z_OK) {
              this.onEnd(status);
              this.ended = true;
              return false;
            }
            if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
              if (this.options.to === "string") {
                this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
              } else {
                this.onData(utils.shrinkBuf(strm.output, strm.next_out));
              }
            }
          } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
          if (_mode === Z_FINISH) {
            status = zlib_deflate.deflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === Z_OK;
          }
          if (_mode === Z_SYNC_FLUSH) {
            this.onEnd(Z_OK);
            strm.avail_out = 0;
            return true;
          }
          return true;
        };
        Deflate.prototype.onData = function(chunk) {
          this.chunks.push(chunk);
        };
        Deflate.prototype.onEnd = function(status) {
          if (status === Z_OK) {
            if (this.options.to === "string") {
              this.result = this.chunks.join("");
            } else {
              this.result = utils.flattenChunks(this.chunks);
            }
          }
          this.chunks = [];
          this.err = status;
          this.msg = this.strm.msg;
        };
        function deflate(input, options) {
          var deflator = new Deflate(options);
          deflator.push(input, true);
          if (deflator.err) {
            throw deflator.msg || msg[deflator.err];
          }
          return deflator.result;
        }
        function deflateRaw(input, options) {
          options = options || {};
          options.raw = true;
          return deflate(input, options);
        }
        function gzip(input, options) {
          options = options || {};
          options.gzip = true;
          return deflate(input, options);
        }
        exports3.Deflate = Deflate;
        exports3.deflate = deflate;
        exports3.deflateRaw = deflateRaw;
        exports3.gzip = gzip;
      }, { "./utils/common": 5, "./utils/strings": 6, "./zlib/deflate": 9, "./zlib/messages": 10, "./zlib/zstream": 12 }], 5: [function(require2, module4, exports3) {
        "use strict";
        var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
        function _has(obj, key) {
          return Object.prototype.hasOwnProperty.call(obj, key);
        }
        exports3.assign = function(obj) {
          var sources = Array.prototype.slice.call(arguments, 1);
          while (sources.length) {
            var source = sources.shift();
            if (!source) {
              continue;
            }
            if (typeof source !== "object") {
              throw new TypeError(source + "must be non-object");
            }
            for (var p in source) {
              if (_has(source, p)) {
                obj[p] = source[p];
              }
            }
          }
          return obj;
        };
        exports3.shrinkBuf = function(buf, size) {
          if (buf.length === size) {
            return buf;
          }
          if (buf.subarray) {
            return buf.subarray(0, size);
          }
          buf.length = size;
          return buf;
        };
        var fnTyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            if (src.subarray && dest.subarray) {
              dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
              return;
            }
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          // Join array of chunks to single array.
          flattenChunks: function(chunks) {
            var i, l, len, pos, chunk, result;
            len = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              len += chunks[i].length;
            }
            result = new Uint8Array(len);
            pos = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              chunk = chunks[i];
              result.set(chunk, pos);
              pos += chunk.length;
            }
            return result;
          }
        };
        var fnUntyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          // Join array of chunks to single array.
          flattenChunks: function(chunks) {
            return [].concat.apply([], chunks);
          }
        };
        exports3.setTyped = function(on) {
          if (on) {
            exports3.Buf8 = Uint8Array;
            exports3.Buf16 = Uint16Array;
            exports3.Buf32 = Int32Array;
            exports3.assign(exports3, fnTyped);
          } else {
            exports3.Buf8 = Array;
            exports3.Buf16 = Array;
            exports3.Buf32 = Array;
            exports3.assign(exports3, fnUntyped);
          }
        };
        exports3.setTyped(TYPED_OK);
      }, {}], 6: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("./common");
        var STR_APPLY_OK = true;
        var STR_APPLY_UIA_OK = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (__) {
          STR_APPLY_OK = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (__) {
          STR_APPLY_UIA_OK = false;
        }
        var _utf8len = new utils.Buf8(256);
        for (var q = 0; q < 256; q++) {
          _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
        }
        _utf8len[254] = _utf8len[254] = 1;
        exports3.string2buf = function(str) {
          var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
          for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
          }
          buf = new utils.Buf8(buf_len);
          for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            if (c < 128) {
              buf[i++] = c;
            } else if (c < 2048) {
              buf[i++] = 192 | c >>> 6;
              buf[i++] = 128 | c & 63;
            } else if (c < 65536) {
              buf[i++] = 224 | c >>> 12;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            } else {
              buf[i++] = 240 | c >>> 18;
              buf[i++] = 128 | c >>> 12 & 63;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            }
          }
          return buf;
        };
        function buf2binstring(buf, len) {
          if (len < 65534) {
            if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
              return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
            }
          }
          var result = "";
          for (var i = 0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
          }
          return result;
        }
        exports3.buf2binstring = function(buf) {
          return buf2binstring(buf, buf.length);
        };
        exports3.binstring2buf = function(str) {
          var buf = new utils.Buf8(str.length);
          for (var i = 0, len = buf.length; i < len; i++) {
            buf[i] = str.charCodeAt(i);
          }
          return buf;
        };
        exports3.buf2string = function(buf, max) {
          var i, out, c, c_len;
          var len = max || buf.length;
          var utf16buf = new Array(len * 2);
          for (out = 0, i = 0; i < len; ) {
            c = buf[i++];
            if (c < 128) {
              utf16buf[out++] = c;
              continue;
            }
            c_len = _utf8len[c];
            if (c_len > 4) {
              utf16buf[out++] = 65533;
              i += c_len - 1;
              continue;
            }
            c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
            while (c_len > 1 && i < len) {
              c = c << 6 | buf[i++] & 63;
              c_len--;
            }
            if (c_len > 1) {
              utf16buf[out++] = 65533;
              continue;
            }
            if (c < 65536) {
              utf16buf[out++] = c;
            } else {
              c -= 65536;
              utf16buf[out++] = 55296 | c >> 10 & 1023;
              utf16buf[out++] = 56320 | c & 1023;
            }
          }
          return buf2binstring(utf16buf, out);
        };
        exports3.utf8border = function(buf, max) {
          var pos;
          max = max || buf.length;
          if (max > buf.length) {
            max = buf.length;
          }
          pos = max - 1;
          while (pos >= 0 && (buf[pos] & 192) === 128) {
            pos--;
          }
          if (pos < 0) {
            return max;
          }
          if (pos === 0) {
            return max;
          }
          return pos + _utf8len[buf[pos]] > max ? pos : max;
        };
      }, { "./common": 5 }], 7: [function(require2, module4, exports3) {
        "use strict";
        function adler32(adler, buf, len, pos) {
          var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
          while (len !== 0) {
            n = len > 2e3 ? 2e3 : len;
            len -= n;
            do {
              s1 = s1 + buf[pos++] | 0;
              s2 = s2 + s1 | 0;
            } while (--n);
            s1 %= 65521;
            s2 %= 65521;
          }
          return s1 | s2 << 16 | 0;
        }
        module4.exports = adler32;
      }, {}], 8: [function(require2, module4, exports3) {
        "use strict";
        function makeTable() {
          var c, table = [];
          for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
              c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
          }
          return table;
        }
        var crcTable = makeTable();
        function crc32(crc, buf, len, pos) {
          var t = crcTable, end = pos + len;
          crc ^= -1;
          for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
          }
          return crc ^ -1;
        }
        module4.exports = crc32;
      }, {}], 9: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var trees = require2("./trees");
        var adler32 = require2("./adler32");
        var crc32 = require2("./crc32");
        var msg = require2("./messages");
        var Z_NO_FLUSH = 0;
        var Z_PARTIAL_FLUSH = 1;
        var Z_FULL_FLUSH = 3;
        var Z_FINISH = 4;
        var Z_BLOCK = 5;
        var Z_OK = 0;
        var Z_STREAM_END = 1;
        var Z_STREAM_ERROR = -2;
        var Z_DATA_ERROR = -3;
        var Z_BUF_ERROR = -5;
        var Z_DEFAULT_COMPRESSION = -1;
        var Z_FILTERED = 1;
        var Z_HUFFMAN_ONLY = 2;
        var Z_RLE = 3;
        var Z_FIXED = 4;
        var Z_DEFAULT_STRATEGY = 0;
        var Z_UNKNOWN = 2;
        var Z_DEFLATED = 8;
        var MAX_MEM_LEVEL = 9;
        var MAX_WBITS = 15;
        var DEF_MEM_LEVEL = 8;
        var LENGTH_CODES = 29;
        var LITERALS = 256;
        var L_CODES = LITERALS + 1 + LENGTH_CODES;
        var D_CODES = 30;
        var BL_CODES = 19;
        var HEAP_SIZE = 2 * L_CODES + 1;
        var MAX_BITS = 15;
        var MIN_MATCH = 3;
        var MAX_MATCH = 258;
        var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
        var PRESET_DICT = 32;
        var INIT_STATE = 42;
        var EXTRA_STATE = 69;
        var NAME_STATE = 73;
        var COMMENT_STATE = 91;
        var HCRC_STATE = 103;
        var BUSY_STATE = 113;
        var FINISH_STATE = 666;
        var BS_NEED_MORE = 1;
        var BS_BLOCK_DONE = 2;
        var BS_FINISH_STARTED = 3;
        var BS_FINISH_DONE = 4;
        var OS_CODE = 3;
        function err(strm, errorCode) {
          strm.msg = msg[errorCode];
          return errorCode;
        }
        function rank(f) {
          return (f << 1) - (f > 4 ? 9 : 0);
        }
        function zero(buf) {
          var len = buf.length;
          while (--len >= 0) {
            buf[len] = 0;
          }
        }
        function flush_pending(strm) {
          var s = strm.state;
          var len = s.pending;
          if (len > strm.avail_out) {
            len = strm.avail_out;
          }
          if (len === 0) {
            return;
          }
          utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
          strm.next_out += len;
          s.pending_out += len;
          strm.total_out += len;
          strm.avail_out -= len;
          s.pending -= len;
          if (s.pending === 0) {
            s.pending_out = 0;
          }
        }
        function flush_block_only(s, last) {
          trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
          s.block_start = s.strstart;
          flush_pending(s.strm);
        }
        function put_byte(s, b) {
          s.pending_buf[s.pending++] = b;
        }
        function putShortMSB(s, b) {
          s.pending_buf[s.pending++] = b >>> 8 & 255;
          s.pending_buf[s.pending++] = b & 255;
        }
        function read_buf(strm, buf, start, size) {
          var len = strm.avail_in;
          if (len > size) {
            len = size;
          }
          if (len === 0) {
            return 0;
          }
          strm.avail_in -= len;
          utils.arraySet(buf, strm.input, strm.next_in, len, start);
          if (strm.state.wrap === 1) {
            strm.adler = adler32(strm.adler, buf, len, start);
          } else if (strm.state.wrap === 2) {
            strm.adler = crc32(strm.adler, buf, len, start);
          }
          strm.next_in += len;
          strm.total_in += len;
          return len;
        }
        function longest_match(s, cur_match) {
          var chain_length = s.max_chain_length;
          var scan = s.strstart;
          var match;
          var len;
          var best_len = s.prev_length;
          var nice_match = s.nice_match;
          var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
          var _win = s.window;
          var wmask = s.w_mask;
          var prev = s.prev;
          var strend = s.strstart + MAX_MATCH;
          var scan_end1 = _win[scan + best_len - 1];
          var scan_end = _win[scan + best_len];
          if (s.prev_length >= s.good_match) {
            chain_length >>= 2;
          }
          if (nice_match > s.lookahead) {
            nice_match = s.lookahead;
          }
          do {
            match = cur_match;
            if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
              continue;
            }
            scan += 2;
            match++;
            do {
            } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
            len = MAX_MATCH - (strend - scan);
            scan = strend - MAX_MATCH;
            if (len > best_len) {
              s.match_start = cur_match;
              best_len = len;
              if (len >= nice_match) {
                break;
              }
              scan_end1 = _win[scan + best_len - 1];
              scan_end = _win[scan + best_len];
            }
          } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
          if (best_len <= s.lookahead) {
            return best_len;
          }
          return s.lookahead;
        }
        function fill_window(s) {
          var _w_size = s.w_size;
          var p, n, m, more, str;
          do {
            more = s.window_size - s.lookahead - s.strstart;
            if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
              utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
              s.match_start -= _w_size;
              s.strstart -= _w_size;
              s.block_start -= _w_size;
              n = s.hash_size;
              p = n;
              do {
                m = s.head[--p];
                s.head[p] = m >= _w_size ? m - _w_size : 0;
              } while (--n);
              n = _w_size;
              p = n;
              do {
                m = s.prev[--p];
                s.prev[p] = m >= _w_size ? m - _w_size : 0;
              } while (--n);
              more += _w_size;
            }
            if (s.strm.avail_in === 0) {
              break;
            }
            n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
            s.lookahead += n;
            if (s.lookahead + s.insert >= MIN_MATCH) {
              str = s.strstart - s.insert;
              s.ins_h = s.window[str];
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
              while (s.insert) {
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
                s.prev[str & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = str;
                str++;
                s.insert--;
                if (s.lookahead + s.insert < MIN_MATCH) {
                  break;
                }
              }
            }
          } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
        }
        function deflate_stored(s, flush) {
          var max_block_size = 65535;
          if (max_block_size > s.pending_buf_size - 5) {
            max_block_size = s.pending_buf_size - 5;
          }
          for (; ; ) {
            if (s.lookahead <= 1) {
              fill_window(s);
              if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            s.strstart += s.lookahead;
            s.lookahead = 0;
            var max_start = s.block_start + max_block_size;
            if (s.strstart === 0 || s.strstart >= max_start) {
              s.lookahead = s.strstart - max_start;
              s.strstart = max_start;
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
            if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = 0;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.strstart > s.block_start) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_NEED_MORE;
        }
        function deflate_fast(s, flush) {
          var hash_head;
          var bflush;
          for (; ; ) {
            if (s.lookahead < MIN_LOOKAHEAD) {
              fill_window(s);
              if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            hash_head = 0;
            if (s.lookahead >= MIN_MATCH) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            }
            if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
              s.match_length = longest_match(s, hash_head);
            }
            if (s.match_length >= MIN_MATCH) {
              bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
              s.lookahead -= s.match_length;
              if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
                s.match_length--;
                do {
                  s.strstart++;
                  s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                  s.head[s.ins_h] = s.strstart;
                } while (--s.match_length !== 0);
                s.strstart++;
              } else {
                s.strstart += s.match_length;
                s.match_length = 0;
                s.ins_h = s.window[s.strstart];
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
              }
            } else {
              bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
              s.lookahead--;
              s.strstart++;
            }
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function deflate_slow(s, flush) {
          var hash_head;
          var bflush;
          var max_insert;
          for (; ; ) {
            if (s.lookahead < MIN_LOOKAHEAD) {
              fill_window(s);
              if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            hash_head = 0;
            if (s.lookahead >= MIN_MATCH) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            }
            s.prev_length = s.match_length;
            s.prev_match = s.match_start;
            s.match_length = MIN_MATCH - 1;
            if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
              s.match_length = longest_match(s, hash_head);
              if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
                s.match_length = MIN_MATCH - 1;
              }
            }
            if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
              max_insert = s.strstart + s.lookahead - MIN_MATCH;
              bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
              s.lookahead -= s.prev_length - 1;
              s.prev_length -= 2;
              do {
                if (++s.strstart <= max_insert) {
                  s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                  s.head[s.ins_h] = s.strstart;
                }
              } while (--s.prev_length !== 0);
              s.match_available = 0;
              s.match_length = MIN_MATCH - 1;
              s.strstart++;
              if (bflush) {
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                  return BS_NEED_MORE;
                }
              }
            } else if (s.match_available) {
              bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
              if (bflush) {
                flush_block_only(s, false);
              }
              s.strstart++;
              s.lookahead--;
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            } else {
              s.match_available = 1;
              s.strstart++;
              s.lookahead--;
            }
          }
          if (s.match_available) {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
            s.match_available = 0;
          }
          s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function deflate_rle(s, flush) {
          var bflush;
          var prev;
          var scan, strend;
          var _win = s.window;
          for (; ; ) {
            if (s.lookahead <= MAX_MATCH) {
              fill_window(s);
              if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            s.match_length = 0;
            if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
              scan = s.strstart - 1;
              prev = _win[scan];
              if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
                strend = s.strstart + MAX_MATCH;
                do {
                } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
                s.match_length = MAX_MATCH - (strend - scan);
                if (s.match_length > s.lookahead) {
                  s.match_length = s.lookahead;
                }
              }
            }
            if (s.match_length >= MIN_MATCH) {
              bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
              s.lookahead -= s.match_length;
              s.strstart += s.match_length;
              s.match_length = 0;
            } else {
              bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
              s.lookahead--;
              s.strstart++;
            }
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = 0;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function deflate_huff(s, flush) {
          var bflush;
          for (; ; ) {
            if (s.lookahead === 0) {
              fill_window(s);
              if (s.lookahead === 0) {
                if (flush === Z_NO_FLUSH) {
                  return BS_NEED_MORE;
                }
                break;
              }
            }
            s.match_length = 0;
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = 0;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function Config(good_length, max_lazy, nice_length, max_chain, func) {
          this.good_length = good_length;
          this.max_lazy = max_lazy;
          this.nice_length = nice_length;
          this.max_chain = max_chain;
          this.func = func;
        }
        var configuration_table;
        configuration_table = [
          /*      good lazy nice chain */
          new Config(0, 0, 0, 0, deflate_stored),
          /* 0 store only */
          new Config(4, 4, 8, 4, deflate_fast),
          /* 1 max speed, no lazy matches */
          new Config(4, 5, 16, 8, deflate_fast),
          /* 2 */
          new Config(4, 6, 32, 32, deflate_fast),
          /* 3 */
          new Config(4, 4, 16, 16, deflate_slow),
          /* 4 lazy matches */
          new Config(8, 16, 32, 32, deflate_slow),
          /* 5 */
          new Config(8, 16, 128, 128, deflate_slow),
          /* 6 */
          new Config(8, 32, 128, 256, deflate_slow),
          /* 7 */
          new Config(32, 128, 258, 1024, deflate_slow),
          /* 8 */
          new Config(32, 258, 258, 4096, deflate_slow)
          /* 9 max compression */
        ];
        function lm_init(s) {
          s.window_size = 2 * s.w_size;
          zero(s.head);
          s.max_lazy_match = configuration_table[s.level].max_lazy;
          s.good_match = configuration_table[s.level].good_length;
          s.nice_match = configuration_table[s.level].nice_length;
          s.max_chain_length = configuration_table[s.level].max_chain;
          s.strstart = 0;
          s.block_start = 0;
          s.lookahead = 0;
          s.insert = 0;
          s.match_length = s.prev_length = MIN_MATCH - 1;
          s.match_available = 0;
          s.ins_h = 0;
        }
        function DeflateState() {
          this.strm = null;
          this.status = 0;
          this.pending_buf = null;
          this.pending_buf_size = 0;
          this.pending_out = 0;
          this.pending = 0;
          this.wrap = 0;
          this.gzhead = null;
          this.gzindex = 0;
          this.method = Z_DEFLATED;
          this.last_flush = -1;
          this.w_size = 0;
          this.w_bits = 0;
          this.w_mask = 0;
          this.window = null;
          this.window_size = 0;
          this.prev = null;
          this.head = null;
          this.ins_h = 0;
          this.hash_size = 0;
          this.hash_bits = 0;
          this.hash_mask = 0;
          this.hash_shift = 0;
          this.block_start = 0;
          this.match_length = 0;
          this.prev_match = 0;
          this.match_available = 0;
          this.strstart = 0;
          this.match_start = 0;
          this.lookahead = 0;
          this.prev_length = 0;
          this.max_chain_length = 0;
          this.max_lazy_match = 0;
          this.level = 0;
          this.strategy = 0;
          this.good_match = 0;
          this.nice_match = 0;
          this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
          this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
          this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
          zero(this.dyn_ltree);
          zero(this.dyn_dtree);
          zero(this.bl_tree);
          this.l_desc = null;
          this.d_desc = null;
          this.bl_desc = null;
          this.bl_count = new utils.Buf16(MAX_BITS + 1);
          this.heap = new utils.Buf16(2 * L_CODES + 1);
          zero(this.heap);
          this.heap_len = 0;
          this.heap_max = 0;
          this.depth = new utils.Buf16(2 * L_CODES + 1);
          zero(this.depth);
          this.l_buf = 0;
          this.lit_bufsize = 0;
          this.last_lit = 0;
          this.d_buf = 0;
          this.opt_len = 0;
          this.static_len = 0;
          this.matches = 0;
          this.insert = 0;
          this.bi_buf = 0;
          this.bi_valid = 0;
        }
        function deflateResetKeep(strm) {
          var s;
          if (!strm || !strm.state) {
            return err(strm, Z_STREAM_ERROR);
          }
          strm.total_in = strm.total_out = 0;
          strm.data_type = Z_UNKNOWN;
          s = strm.state;
          s.pending = 0;
          s.pending_out = 0;
          if (s.wrap < 0) {
            s.wrap = -s.wrap;
          }
          s.status = s.wrap ? INIT_STATE : BUSY_STATE;
          strm.adler = s.wrap === 2 ? 0 : 1;
          s.last_flush = Z_NO_FLUSH;
          trees._tr_init(s);
          return Z_OK;
        }
        function deflateReset(strm) {
          var ret = deflateResetKeep(strm);
          if (ret === Z_OK) {
            lm_init(strm.state);
          }
          return ret;
        }
        function deflateSetHeader(strm, head) {
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          if (strm.state.wrap !== 2) {
            return Z_STREAM_ERROR;
          }
          strm.state.gzhead = head;
          return Z_OK;
        }
        function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
          if (!strm) {
            return Z_STREAM_ERROR;
          }
          var wrap = 1;
          if (level === Z_DEFAULT_COMPRESSION) {
            level = 6;
          }
          if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
          } else if (windowBits > 15) {
            wrap = 2;
            windowBits -= 16;
          }
          if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
            return err(strm, Z_STREAM_ERROR);
          }
          if (windowBits === 8) {
            windowBits = 9;
          }
          var s = new DeflateState();
          strm.state = s;
          s.strm = strm;
          s.wrap = wrap;
          s.gzhead = null;
          s.w_bits = windowBits;
          s.w_size = 1 << s.w_bits;
          s.w_mask = s.w_size - 1;
          s.hash_bits = memLevel + 7;
          s.hash_size = 1 << s.hash_bits;
          s.hash_mask = s.hash_size - 1;
          s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
          s.window = new utils.Buf8(s.w_size * 2);
          s.head = new utils.Buf16(s.hash_size);
          s.prev = new utils.Buf16(s.w_size);
          s.lit_bufsize = 1 << memLevel + 6;
          s.pending_buf_size = s.lit_bufsize * 4;
          s.pending_buf = new utils.Buf8(s.pending_buf_size);
          s.d_buf = 1 * s.lit_bufsize;
          s.l_buf = (1 + 2) * s.lit_bufsize;
          s.level = level;
          s.strategy = strategy;
          s.method = method;
          return deflateReset(strm);
        }
        function deflateInit(strm, level) {
          return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
        }
        function deflate(strm, flush) {
          var old_flush, s;
          var beg, val;
          if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
            return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
          }
          s = strm.state;
          if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
            return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
          }
          s.strm = strm;
          old_flush = s.last_flush;
          s.last_flush = flush;
          if (s.status === INIT_STATE) {
            if (s.wrap === 2) {
              strm.adler = 0;
              put_byte(s, 31);
              put_byte(s, 139);
              put_byte(s, 8);
              if (!s.gzhead) {
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
                put_byte(s, OS_CODE);
                s.status = BUSY_STATE;
              } else {
                put_byte(
                  s,
                  (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
                );
                put_byte(s, s.gzhead.time & 255);
                put_byte(s, s.gzhead.time >> 8 & 255);
                put_byte(s, s.gzhead.time >> 16 & 255);
                put_byte(s, s.gzhead.time >> 24 & 255);
                put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
                put_byte(s, s.gzhead.os & 255);
                if (s.gzhead.extra && s.gzhead.extra.length) {
                  put_byte(s, s.gzhead.extra.length & 255);
                  put_byte(s, s.gzhead.extra.length >> 8 & 255);
                }
                if (s.gzhead.hcrc) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
                }
                s.gzindex = 0;
                s.status = EXTRA_STATE;
              }
            } else {
              var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
              var level_flags = -1;
              if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
                level_flags = 0;
              } else if (s.level < 6) {
                level_flags = 1;
              } else if (s.level === 6) {
                level_flags = 2;
              } else {
                level_flags = 3;
              }
              header |= level_flags << 6;
              if (s.strstart !== 0) {
                header |= PRESET_DICT;
              }
              header += 31 - header % 31;
              s.status = BUSY_STATE;
              putShortMSB(s, header);
              if (s.strstart !== 0) {
                putShortMSB(s, strm.adler >>> 16);
                putShortMSB(s, strm.adler & 65535);
              }
              strm.adler = 1;
            }
          }
          if (s.status === EXTRA_STATE) {
            if (s.gzhead.extra) {
              beg = s.pending;
              while (s.gzindex < (s.gzhead.extra.length & 65535)) {
                if (s.pending === s.pending_buf_size) {
                  if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                  }
                  flush_pending(strm);
                  beg = s.pending;
                  if (s.pending === s.pending_buf_size) {
                    break;
                  }
                }
                put_byte(s, s.gzhead.extra[s.gzindex] & 255);
                s.gzindex++;
              }
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              if (s.gzindex === s.gzhead.extra.length) {
                s.gzindex = 0;
                s.status = NAME_STATE;
              }
            } else {
              s.status = NAME_STATE;
            }
          }
          if (s.status === NAME_STATE) {
            if (s.gzhead.name) {
              beg = s.pending;
              do {
                if (s.pending === s.pending_buf_size) {
                  if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                  }
                  flush_pending(strm);
                  beg = s.pending;
                  if (s.pending === s.pending_buf_size) {
                    val = 1;
                    break;
                  }
                }
                if (s.gzindex < s.gzhead.name.length) {
                  val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
                } else {
                  val = 0;
                }
                put_byte(s, val);
              } while (val !== 0);
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              if (val === 0) {
                s.gzindex = 0;
                s.status = COMMENT_STATE;
              }
            } else {
              s.status = COMMENT_STATE;
            }
          }
          if (s.status === COMMENT_STATE) {
            if (s.gzhead.comment) {
              beg = s.pending;
              do {
                if (s.pending === s.pending_buf_size) {
                  if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                  }
                  flush_pending(strm);
                  beg = s.pending;
                  if (s.pending === s.pending_buf_size) {
                    val = 1;
                    break;
                  }
                }
                if (s.gzindex < s.gzhead.comment.length) {
                  val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
                } else {
                  val = 0;
                }
                put_byte(s, val);
              } while (val !== 0);
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              if (val === 0) {
                s.status = HCRC_STATE;
              }
            } else {
              s.status = HCRC_STATE;
            }
          }
          if (s.status === HCRC_STATE) {
            if (s.gzhead.hcrc) {
              if (s.pending + 2 > s.pending_buf_size) {
                flush_pending(strm);
              }
              if (s.pending + 2 <= s.pending_buf_size) {
                put_byte(s, strm.adler & 255);
                put_byte(s, strm.adler >> 8 & 255);
                strm.adler = 0;
                s.status = BUSY_STATE;
              }
            } else {
              s.status = BUSY_STATE;
            }
          }
          if (s.pending !== 0) {
            flush_pending(strm);
            if (strm.avail_out === 0) {
              s.last_flush = -1;
              return Z_OK;
            }
          } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
            return err(strm, Z_BUF_ERROR);
          }
          if (s.status === FINISH_STATE && strm.avail_in !== 0) {
            return err(strm, Z_BUF_ERROR);
          }
          if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
            var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
            if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
              s.status = FINISH_STATE;
            }
            if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
              if (strm.avail_out === 0) {
                s.last_flush = -1;
              }
              return Z_OK;
            }
            if (bstate === BS_BLOCK_DONE) {
              if (flush === Z_PARTIAL_FLUSH) {
                trees._tr_align(s);
              } else if (flush !== Z_BLOCK) {
                trees._tr_stored_block(s, 0, 0, false);
                if (flush === Z_FULL_FLUSH) {
                  zero(s.head);
                  if (s.lookahead === 0) {
                    s.strstart = 0;
                    s.block_start = 0;
                    s.insert = 0;
                  }
                }
              }
              flush_pending(strm);
              if (strm.avail_out === 0) {
                s.last_flush = -1;
                return Z_OK;
              }
            }
          }
          if (flush !== Z_FINISH) {
            return Z_OK;
          }
          if (s.wrap <= 0) {
            return Z_STREAM_END;
          }
          if (s.wrap === 2) {
            put_byte(s, strm.adler & 255);
            put_byte(s, strm.adler >> 8 & 255);
            put_byte(s, strm.adler >> 16 & 255);
            put_byte(s, strm.adler >> 24 & 255);
            put_byte(s, strm.total_in & 255);
            put_byte(s, strm.total_in >> 8 & 255);
            put_byte(s, strm.total_in >> 16 & 255);
            put_byte(s, strm.total_in >> 24 & 255);
          } else {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 65535);
          }
          flush_pending(strm);
          if (s.wrap > 0) {
            s.wrap = -s.wrap;
          }
          return s.pending !== 0 ? Z_OK : Z_STREAM_END;
        }
        function deflateEnd(strm) {
          var status;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          status = strm.state.status;
          if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
            return err(strm, Z_STREAM_ERROR);
          }
          strm.state = null;
          return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
        }
        function deflateSetDictionary(strm, dictionary) {
          var dictLength = dictionary.length;
          var s;
          var str, n;
          var wrap;
          var avail;
          var next;
          var input;
          var tmpDict;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          s = strm.state;
          wrap = s.wrap;
          if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
            return Z_STREAM_ERROR;
          }
          if (wrap === 1) {
            strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
          }
          s.wrap = 0;
          if (dictLength >= s.w_size) {
            if (wrap === 0) {
              zero(s.head);
              s.strstart = 0;
              s.block_start = 0;
              s.insert = 0;
            }
            tmpDict = new utils.Buf8(s.w_size);
            utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
            dictionary = tmpDict;
            dictLength = s.w_size;
          }
          avail = strm.avail_in;
          next = strm.next_in;
          input = strm.input;
          strm.avail_in = dictLength;
          strm.next_in = 0;
          strm.input = dictionary;
          fill_window(s);
          while (s.lookahead >= MIN_MATCH) {
            str = s.strstart;
            n = s.lookahead - (MIN_MATCH - 1);
            do {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
              s.prev[str & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = str;
              str++;
            } while (--n);
            s.strstart = str;
            s.lookahead = MIN_MATCH - 1;
            fill_window(s);
          }
          s.strstart += s.lookahead;
          s.block_start = s.strstart;
          s.insert = s.lookahead;
          s.lookahead = 0;
          s.match_length = s.prev_length = MIN_MATCH - 1;
          s.match_available = 0;
          strm.next_in = next;
          strm.input = input;
          strm.avail_in = avail;
          s.wrap = wrap;
          return Z_OK;
        }
        exports3.deflateInit = deflateInit;
        exports3.deflateInit2 = deflateInit2;
        exports3.deflateReset = deflateReset;
        exports3.deflateResetKeep = deflateResetKeep;
        exports3.deflateSetHeader = deflateSetHeader;
        exports3.deflate = deflate;
        exports3.deflateEnd = deflateEnd;
        exports3.deflateSetDictionary = deflateSetDictionary;
        exports3.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 5, "./adler32": 7, "./crc32": 8, "./messages": 10, "./trees": 11 }], 10: [function(require2, module4, exports3) {
        "use strict";
        module4.exports = {
          2: "need dictionary",
          /* Z_NEED_DICT       2  */
          1: "stream end",
          /* Z_STREAM_END      1  */
          0: "",
          /* Z_OK              0  */
          "-1": "file error",
          /* Z_ERRNO         (-1) */
          "-2": "stream error",
          /* Z_STREAM_ERROR  (-2) */
          "-3": "data error",
          /* Z_DATA_ERROR    (-3) */
          "-4": "insufficient memory",
          /* Z_MEM_ERROR     (-4) */
          "-5": "buffer error",
          /* Z_BUF_ERROR     (-5) */
          "-6": "incompatible version"
          /* Z_VERSION_ERROR (-6) */
        };
      }, {}], 11: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var Z_FIXED = 4;
        var Z_BINARY = 0;
        var Z_TEXT = 1;
        var Z_UNKNOWN = 2;
        function zero(buf) {
          var len = buf.length;
          while (--len >= 0) {
            buf[len] = 0;
          }
        }
        var STORED_BLOCK = 0;
        var STATIC_TREES = 1;
        var DYN_TREES = 2;
        var MIN_MATCH = 3;
        var MAX_MATCH = 258;
        var LENGTH_CODES = 29;
        var LITERALS = 256;
        var L_CODES = LITERALS + 1 + LENGTH_CODES;
        var D_CODES = 30;
        var BL_CODES = 19;
        var HEAP_SIZE = 2 * L_CODES + 1;
        var MAX_BITS = 15;
        var Buf_size = 16;
        var MAX_BL_BITS = 7;
        var END_BLOCK = 256;
        var REP_3_6 = 16;
        var REPZ_3_10 = 17;
        var REPZ_11_138 = 18;
        var extra_lbits = (
          /* extra bits for each length code */
          [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
        );
        var extra_dbits = (
          /* extra bits for each distance code */
          [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
        );
        var extra_blbits = (
          /* extra bits for each bit length code */
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
        );
        var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        var DIST_CODE_LEN = 512;
        var static_ltree = new Array((L_CODES + 2) * 2);
        zero(static_ltree);
        var static_dtree = new Array(D_CODES * 2);
        zero(static_dtree);
        var _dist_code = new Array(DIST_CODE_LEN);
        zero(_dist_code);
        var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
        zero(_length_code);
        var base_length = new Array(LENGTH_CODES);
        zero(base_length);
        var base_dist = new Array(D_CODES);
        zero(base_dist);
        function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
          this.static_tree = static_tree;
          this.extra_bits = extra_bits;
          this.extra_base = extra_base;
          this.elems = elems;
          this.max_length = max_length;
          this.has_stree = static_tree && static_tree.length;
        }
        var static_l_desc;
        var static_d_desc;
        var static_bl_desc;
        function TreeDesc(dyn_tree, stat_desc) {
          this.dyn_tree = dyn_tree;
          this.max_code = 0;
          this.stat_desc = stat_desc;
        }
        function d_code(dist) {
          return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
        }
        function put_short(s, w) {
          s.pending_buf[s.pending++] = w & 255;
          s.pending_buf[s.pending++] = w >>> 8 & 255;
        }
        function send_bits(s, value, length) {
          if (s.bi_valid > Buf_size - length) {
            s.bi_buf |= value << s.bi_valid & 65535;
            put_short(s, s.bi_buf);
            s.bi_buf = value >> Buf_size - s.bi_valid;
            s.bi_valid += length - Buf_size;
          } else {
            s.bi_buf |= value << s.bi_valid & 65535;
            s.bi_valid += length;
          }
        }
        function send_code(s, c, tree) {
          send_bits(
            s,
            tree[c * 2],
            tree[c * 2 + 1]
            /*.Len*/
          );
        }
        function bi_reverse(code, len) {
          var res = 0;
          do {
            res |= code & 1;
            code >>>= 1;
            res <<= 1;
          } while (--len > 0);
          return res >>> 1;
        }
        function bi_flush(s) {
          if (s.bi_valid === 16) {
            put_short(s, s.bi_buf);
            s.bi_buf = 0;
            s.bi_valid = 0;
          } else if (s.bi_valid >= 8) {
            s.pending_buf[s.pending++] = s.bi_buf & 255;
            s.bi_buf >>= 8;
            s.bi_valid -= 8;
          }
        }
        function gen_bitlen(s, desc) {
          var tree = desc.dyn_tree;
          var max_code = desc.max_code;
          var stree = desc.stat_desc.static_tree;
          var has_stree = desc.stat_desc.has_stree;
          var extra = desc.stat_desc.extra_bits;
          var base = desc.stat_desc.extra_base;
          var max_length = desc.stat_desc.max_length;
          var h;
          var n, m;
          var bits;
          var xbits;
          var f;
          var overflow = 0;
          for (bits = 0; bits <= MAX_BITS; bits++) {
            s.bl_count[bits] = 0;
          }
          tree[s.heap[s.heap_max] * 2 + 1] = 0;
          for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
            n = s.heap[h];
            bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
            if (bits > max_length) {
              bits = max_length;
              overflow++;
            }
            tree[n * 2 + 1] = bits;
            if (n > max_code) {
              continue;
            }
            s.bl_count[bits]++;
            xbits = 0;
            if (n >= base) {
              xbits = extra[n - base];
            }
            f = tree[n * 2];
            s.opt_len += f * (bits + xbits);
            if (has_stree) {
              s.static_len += f * (stree[n * 2 + 1] + xbits);
            }
          }
          if (overflow === 0) {
            return;
          }
          do {
            bits = max_length - 1;
            while (s.bl_count[bits] === 0) {
              bits--;
            }
            s.bl_count[bits]--;
            s.bl_count[bits + 1] += 2;
            s.bl_count[max_length]--;
            overflow -= 2;
          } while (overflow > 0);
          for (bits = max_length; bits !== 0; bits--) {
            n = s.bl_count[bits];
            while (n !== 0) {
              m = s.heap[--h];
              if (m > max_code) {
                continue;
              }
              if (tree[m * 2 + 1] !== bits) {
                s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
                tree[m * 2 + 1] = bits;
              }
              n--;
            }
          }
        }
        function gen_codes(tree, max_code, bl_count) {
          var next_code = new Array(MAX_BITS + 1);
          var code = 0;
          var bits;
          var n;
          for (bits = 1; bits <= MAX_BITS; bits++) {
            next_code[bits] = code = code + bl_count[bits - 1] << 1;
          }
          for (n = 0; n <= max_code; n++) {
            var len = tree[n * 2 + 1];
            if (len === 0) {
              continue;
            }
            tree[n * 2] = bi_reverse(next_code[len]++, len);
          }
        }
        function tr_static_init() {
          var n;
          var bits;
          var length;
          var code;
          var dist;
          var bl_count = new Array(MAX_BITS + 1);
          length = 0;
          for (code = 0; code < LENGTH_CODES - 1; code++) {
            base_length[code] = length;
            for (n = 0; n < 1 << extra_lbits[code]; n++) {
              _length_code[length++] = code;
            }
          }
          _length_code[length - 1] = code;
          dist = 0;
          for (code = 0; code < 16; code++) {
            base_dist[code] = dist;
            for (n = 0; n < 1 << extra_dbits[code]; n++) {
              _dist_code[dist++] = code;
            }
          }
          dist >>= 7;
          for (; code < D_CODES; code++) {
            base_dist[code] = dist << 7;
            for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
              _dist_code[256 + dist++] = code;
            }
          }
          for (bits = 0; bits <= MAX_BITS; bits++) {
            bl_count[bits] = 0;
          }
          n = 0;
          while (n <= 143) {
            static_ltree[n * 2 + 1] = 8;
            n++;
            bl_count[8]++;
          }
          while (n <= 255) {
            static_ltree[n * 2 + 1] = 9;
            n++;
            bl_count[9]++;
          }
          while (n <= 279) {
            static_ltree[n * 2 + 1] = 7;
            n++;
            bl_count[7]++;
          }
          while (n <= 287) {
            static_ltree[n * 2 + 1] = 8;
            n++;
            bl_count[8]++;
          }
          gen_codes(static_ltree, L_CODES + 1, bl_count);
          for (n = 0; n < D_CODES; n++) {
            static_dtree[n * 2 + 1] = 5;
            static_dtree[n * 2] = bi_reverse(n, 5);
          }
          static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
          static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
          static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
        }
        function init_block(s) {
          var n;
          for (n = 0; n < L_CODES; n++) {
            s.dyn_ltree[n * 2] = 0;
          }
          for (n = 0; n < D_CODES; n++) {
            s.dyn_dtree[n * 2] = 0;
          }
          for (n = 0; n < BL_CODES; n++) {
            s.bl_tree[n * 2] = 0;
          }
          s.dyn_ltree[END_BLOCK * 2] = 1;
          s.opt_len = s.static_len = 0;
          s.last_lit = s.matches = 0;
        }
        function bi_windup(s) {
          if (s.bi_valid > 8) {
            put_short(s, s.bi_buf);
          } else if (s.bi_valid > 0) {
            s.pending_buf[s.pending++] = s.bi_buf;
          }
          s.bi_buf = 0;
          s.bi_valid = 0;
        }
        function copy_block(s, buf, len, header) {
          bi_windup(s);
          if (header) {
            put_short(s, len);
            put_short(s, ~len);
          }
          utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
          s.pending += len;
        }
        function smaller(tree, n, m, depth) {
          var _n2 = n * 2;
          var _m2 = m * 2;
          return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
        }
        function pqdownheap(s, tree, k) {
          var v = s.heap[k];
          var j = k << 1;
          while (j <= s.heap_len) {
            if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
              j++;
            }
            if (smaller(tree, v, s.heap[j], s.depth)) {
              break;
            }
            s.heap[k] = s.heap[j];
            k = j;
            j <<= 1;
          }
          s.heap[k] = v;
        }
        function compress_block(s, ltree, dtree) {
          var dist;
          var lc;
          var lx = 0;
          var code;
          var extra;
          if (s.last_lit !== 0) {
            do {
              dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
              lc = s.pending_buf[s.l_buf + lx];
              lx++;
              if (dist === 0) {
                send_code(s, lc, ltree);
              } else {
                code = _length_code[lc];
                send_code(s, code + LITERALS + 1, ltree);
                extra = extra_lbits[code];
                if (extra !== 0) {
                  lc -= base_length[code];
                  send_bits(s, lc, extra);
                }
                dist--;
                code = d_code(dist);
                send_code(s, code, dtree);
                extra = extra_dbits[code];
                if (extra !== 0) {
                  dist -= base_dist[code];
                  send_bits(s, dist, extra);
                }
              }
            } while (lx < s.last_lit);
          }
          send_code(s, END_BLOCK, ltree);
        }
        function build_tree(s, desc) {
          var tree = desc.dyn_tree;
          var stree = desc.stat_desc.static_tree;
          var has_stree = desc.stat_desc.has_stree;
          var elems = desc.stat_desc.elems;
          var n, m;
          var max_code = -1;
          var node;
          s.heap_len = 0;
          s.heap_max = HEAP_SIZE;
          for (n = 0; n < elems; n++) {
            if (tree[n * 2] !== 0) {
              s.heap[++s.heap_len] = max_code = n;
              s.depth[n] = 0;
            } else {
              tree[n * 2 + 1] = 0;
            }
          }
          while (s.heap_len < 2) {
            node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
            tree[node * 2] = 1;
            s.depth[node] = 0;
            s.opt_len--;
            if (has_stree) {
              s.static_len -= stree[node * 2 + 1];
            }
          }
          desc.max_code = max_code;
          for (n = s.heap_len >> 1; n >= 1; n--) {
            pqdownheap(s, tree, n);
          }
          node = elems;
          do {
            n = s.heap[
              1
              /*SMALLEST*/
            ];
            s.heap[
              1
              /*SMALLEST*/
            ] = s.heap[s.heap_len--];
            pqdownheap(
              s,
              tree,
              1
              /*SMALLEST*/
            );
            m = s.heap[
              1
              /*SMALLEST*/
            ];
            s.heap[--s.heap_max] = n;
            s.heap[--s.heap_max] = m;
            tree[node * 2] = tree[n * 2] + tree[m * 2];
            s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
            tree[n * 2 + 1] = tree[m * 2 + 1] = node;
            s.heap[
              1
              /*SMALLEST*/
            ] = node++;
            pqdownheap(
              s,
              tree,
              1
              /*SMALLEST*/
            );
          } while (s.heap_len >= 2);
          s.heap[--s.heap_max] = s.heap[
            1
            /*SMALLEST*/
          ];
          gen_bitlen(s, desc);
          gen_codes(tree, max_code, s.bl_count);
        }
        function scan_tree(s, tree, max_code) {
          var n;
          var prevlen = -1;
          var curlen;
          var nextlen = tree[0 * 2 + 1];
          var count = 0;
          var max_count = 7;
          var min_count = 4;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          }
          tree[(max_code + 1) * 2 + 1] = 65535;
          for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[(n + 1) * 2 + 1];
            if (++count < max_count && curlen === nextlen) {
              continue;
            } else if (count < min_count) {
              s.bl_tree[curlen * 2] += count;
            } else if (curlen !== 0) {
              if (curlen !== prevlen) {
                s.bl_tree[curlen * 2]++;
              }
              s.bl_tree[REP_3_6 * 2]++;
            } else if (count <= 10) {
              s.bl_tree[REPZ_3_10 * 2]++;
            } else {
              s.bl_tree[REPZ_11_138 * 2]++;
            }
            count = 0;
            prevlen = curlen;
            if (nextlen === 0) {
              max_count = 138;
              min_count = 3;
            } else if (curlen === nextlen) {
              max_count = 6;
              min_count = 3;
            } else {
              max_count = 7;
              min_count = 4;
            }
          }
        }
        function send_tree(s, tree, max_code) {
          var n;
          var prevlen = -1;
          var curlen;
          var nextlen = tree[0 * 2 + 1];
          var count = 0;
          var max_count = 7;
          var min_count = 4;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          }
          for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[(n + 1) * 2 + 1];
            if (++count < max_count && curlen === nextlen) {
              continue;
            } else if (count < min_count) {
              do {
                send_code(s, curlen, s.bl_tree);
              } while (--count !== 0);
            } else if (curlen !== 0) {
              if (curlen !== prevlen) {
                send_code(s, curlen, s.bl_tree);
                count--;
              }
              send_code(s, REP_3_6, s.bl_tree);
              send_bits(s, count - 3, 2);
            } else if (count <= 10) {
              send_code(s, REPZ_3_10, s.bl_tree);
              send_bits(s, count - 3, 3);
            } else {
              send_code(s, REPZ_11_138, s.bl_tree);
              send_bits(s, count - 11, 7);
            }
            count = 0;
            prevlen = curlen;
            if (nextlen === 0) {
              max_count = 138;
              min_count = 3;
            } else if (curlen === nextlen) {
              max_count = 6;
              min_count = 3;
            } else {
              max_count = 7;
              min_count = 4;
            }
          }
        }
        function build_bl_tree(s) {
          var max_blindex;
          scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
          scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
          build_tree(s, s.bl_desc);
          for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
            if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
              break;
            }
          }
          s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
          return max_blindex;
        }
        function send_all_trees(s, lcodes, dcodes, blcodes) {
          var rank;
          send_bits(s, lcodes - 257, 5);
          send_bits(s, dcodes - 1, 5);
          send_bits(s, blcodes - 4, 4);
          for (rank = 0; rank < blcodes; rank++) {
            send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
          }
          send_tree(s, s.dyn_ltree, lcodes - 1);
          send_tree(s, s.dyn_dtree, dcodes - 1);
        }
        function detect_data_type(s) {
          var black_mask = 4093624447;
          var n;
          for (n = 0; n <= 31; n++, black_mask >>>= 1) {
            if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
              return Z_BINARY;
            }
          }
          if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
            return Z_TEXT;
          }
          for (n = 32; n < LITERALS; n++) {
            if (s.dyn_ltree[n * 2] !== 0) {
              return Z_TEXT;
            }
          }
          return Z_BINARY;
        }
        var static_init_done = false;
        function _tr_init(s) {
          if (!static_init_done) {
            tr_static_init();
            static_init_done = true;
          }
          s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
          s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
          s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
          s.bi_buf = 0;
          s.bi_valid = 0;
          init_block(s);
        }
        function _tr_stored_block(s, buf, stored_len, last) {
          send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
          copy_block(s, buf, stored_len, true);
        }
        function _tr_align(s) {
          send_bits(s, STATIC_TREES << 1, 3);
          send_code(s, END_BLOCK, static_ltree);
          bi_flush(s);
        }
        function _tr_flush_block(s, buf, stored_len, last) {
          var opt_lenb, static_lenb;
          var max_blindex = 0;
          if (s.level > 0) {
            if (s.strm.data_type === Z_UNKNOWN) {
              s.strm.data_type = detect_data_type(s);
            }
            build_tree(s, s.l_desc);
            build_tree(s, s.d_desc);
            max_blindex = build_bl_tree(s);
            opt_lenb = s.opt_len + 3 + 7 >>> 3;
            static_lenb = s.static_len + 3 + 7 >>> 3;
            if (static_lenb <= opt_lenb) {
              opt_lenb = static_lenb;
            }
          } else {
            opt_lenb = static_lenb = stored_len + 5;
          }
          if (stored_len + 4 <= opt_lenb && buf !== -1) {
            _tr_stored_block(s, buf, stored_len, last);
          } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
            send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
            compress_block(s, static_ltree, static_dtree);
          } else {
            send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
            send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
            compress_block(s, s.dyn_ltree, s.dyn_dtree);
          }
          init_block(s);
          if (last) {
            bi_windup(s);
          }
        }
        function _tr_tally(s, dist, lc) {
          s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
          s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
          s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
          s.last_lit++;
          if (dist === 0) {
            s.dyn_ltree[lc * 2]++;
          } else {
            s.matches++;
            dist--;
            s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
            s.dyn_dtree[d_code(dist) * 2]++;
          }
          return s.last_lit === s.lit_bufsize - 1;
        }
        exports3._tr_init = _tr_init;
        exports3._tr_stored_block = _tr_stored_block;
        exports3._tr_flush_block = _tr_flush_block;
        exports3._tr_tally = _tr_tally;
        exports3._tr_align = _tr_align;
      }, { "../utils/common": 5 }], 12: [function(require2, module4, exports3) {
        "use strict";
        function ZStream() {
          this.input = null;
          this.next_in = 0;
          this.avail_in = 0;
          this.total_in = 0;
          this.output = null;
          this.next_out = 0;
          this.avail_out = 0;
          this.total_out = 0;
          this.msg = "";
          this.state = null;
          this.data_type = 2;
          this.adler = 0;
        }
        module4.exports = ZStream;
      }, {}] }, {}, [3])(3);
    });
  }
});

// node_modules/plantuml-encoder/dist/plantuml-decoder.js
var require_plantuml_decoder = __commonJS({
  "node_modules/plantuml-encoder/dist/plantuml-decoder.js"(exports, module2) {
    (function(f) {
      if (typeof exports === "object" && typeof module2 !== "undefined") {
        module2.exports = f();
      } else if (typeof define === "function" && define.amd) {
        define([], f);
      } else {
        var g;
        if (typeof window !== "undefined") {
          g = window;
        } else if (typeof global !== "undefined") {
          g = global;
        } else if (typeof self !== "undefined") {
          g = self;
        } else {
          g = this;
        }
        g.plantumlEncoder = f();
      }
    })(function() {
      var define2, module3, exports2;
      return (/* @__PURE__ */ (function() {
        function r(e, n, t) {
          function o(i2, f) {
            if (!n[i2]) {
              if (!e[i2]) {
                var c = "function" == typeof require && require;
                if (!f && c) return c(i2, true);
                if (u) return u(i2, true);
                var a = new Error("Cannot find module '" + i2 + "'");
                throw a.code = "MODULE_NOT_FOUND", a;
              }
              var p = n[i2] = { exports: {} };
              e[i2][0].call(p.exports, function(r2) {
                var n2 = e[i2][1][r2];
                return o(n2 || r2);
              }, p, p.exports, r, e, n, t);
            }
            return n[i2].exports;
          }
          for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
          return o;
        }
        return r;
      })())({ 1: [function(require2, module4, exports3) {
        "use strict";
        var pako = require2("pako/lib/inflate.js");
        module4.exports = function(data) {
          return pako.inflateRaw(data, { to: "string" });
        };
      }, { "pako/lib/inflate.js": 4 }], 2: [function(require2, module4, exports3) {
        "use strict";
        function decode6bit(cc) {
          var c = cc.charCodeAt(0);
          if (cc === "_") return 63;
          if (cc === "-") return 62;
          if (c >= 97) return c - 61;
          if (c >= 65) return c - 55;
          if (c >= 48) return c - 48;
          return "?";
        }
        function extract3bytes(data) {
          var c1 = decode6bit(data[0]);
          var c2 = decode6bit(data[1]);
          var c3 = decode6bit(data[2]);
          var c4 = decode6bit(data[3]);
          var b1 = c1 << 2 | c2 >> 4 & 63;
          var b2 = c2 << 4 & 240 | c3 >> 2 & 15;
          var b3 = c3 << 6 & 192 | c4 & 63;
          return [b1, b2, b3];
        }
        module4.exports = function(data) {
          var r = "";
          var i = 0;
          for (i = 0; i < data.length; i += 4) {
            var t = extract3bytes(data.substring(i, i + 4));
            r = r + String.fromCharCode(t[0]);
            r = r + String.fromCharCode(t[1]);
            r = r + String.fromCharCode(t[2]);
          }
          return r;
        };
      }, {}], 3: [function(require2, module4, exports3) {
        "use strict";
        var inflate = require2("./inflate");
        var decode64 = require2("./decode64");
        module4.exports.decode = function(encoded) {
          var deflated = decode64(encoded);
          return inflate(deflated);
        };
      }, { "./decode64": 2, "./inflate": 1 }], 4: [function(require2, module4, exports3) {
        "use strict";
        var zlib_inflate = require2("./zlib/inflate");
        var utils = require2("./utils/common");
        var strings = require2("./utils/strings");
        var c = require2("./zlib/constants");
        var msg = require2("./zlib/messages");
        var ZStream = require2("./zlib/zstream");
        var GZheader = require2("./zlib/gzheader");
        var toString = Object.prototype.toString;
        function Inflate(options) {
          if (!(this instanceof Inflate)) return new Inflate(options);
          this.options = utils.assign({
            chunkSize: 16384,
            windowBits: 0,
            to: ""
          }, options || {});
          var opt = this.options;
          if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
            opt.windowBits = -opt.windowBits;
            if (opt.windowBits === 0) {
              opt.windowBits = -15;
            }
          }
          if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
            opt.windowBits += 32;
          }
          if (opt.windowBits > 15 && opt.windowBits < 48) {
            if ((opt.windowBits & 15) === 0) {
              opt.windowBits |= 15;
            }
          }
          this.err = 0;
          this.msg = "";
          this.ended = false;
          this.chunks = [];
          this.strm = new ZStream();
          this.strm.avail_out = 0;
          var status = zlib_inflate.inflateInit2(
            this.strm,
            opt.windowBits
          );
          if (status !== c.Z_OK) {
            throw new Error(msg[status]);
          }
          this.header = new GZheader();
          zlib_inflate.inflateGetHeader(this.strm, this.header);
          if (opt.dictionary) {
            if (typeof opt.dictionary === "string") {
              opt.dictionary = strings.string2buf(opt.dictionary);
            } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
              opt.dictionary = new Uint8Array(opt.dictionary);
            }
            if (opt.raw) {
              status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
              if (status !== c.Z_OK) {
                throw new Error(msg[status]);
              }
            }
          }
        }
        Inflate.prototype.push = function(data, mode) {
          var strm = this.strm;
          var chunkSize = this.options.chunkSize;
          var dictionary = this.options.dictionary;
          var status, _mode;
          var next_out_utf8, tail, utf8str;
          var allowBufError = false;
          if (this.ended) {
            return false;
          }
          _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
          if (typeof data === "string") {
            strm.input = strings.binstring2buf(data);
          } else if (toString.call(data) === "[object ArrayBuffer]") {
            strm.input = new Uint8Array(data);
          } else {
            strm.input = data;
          }
          strm.next_in = 0;
          strm.avail_in = strm.input.length;
          do {
            if (strm.avail_out === 0) {
              strm.output = new utils.Buf8(chunkSize);
              strm.next_out = 0;
              strm.avail_out = chunkSize;
            }
            status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
            if (status === c.Z_NEED_DICT && dictionary) {
              status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
            }
            if (status === c.Z_BUF_ERROR && allowBufError === true) {
              status = c.Z_OK;
              allowBufError = false;
            }
            if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
              this.onEnd(status);
              this.ended = true;
              return false;
            }
            if (strm.next_out) {
              if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
                if (this.options.to === "string") {
                  next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
                  tail = strm.next_out - next_out_utf8;
                  utf8str = strings.buf2string(strm.output, next_out_utf8);
                  strm.next_out = tail;
                  strm.avail_out = chunkSize - tail;
                  if (tail) {
                    utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
                  }
                  this.onData(utf8str);
                } else {
                  this.onData(utils.shrinkBuf(strm.output, strm.next_out));
                }
              }
            }
            if (strm.avail_in === 0 && strm.avail_out === 0) {
              allowBufError = true;
            }
          } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
          if (status === c.Z_STREAM_END) {
            _mode = c.Z_FINISH;
          }
          if (_mode === c.Z_FINISH) {
            status = zlib_inflate.inflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === c.Z_OK;
          }
          if (_mode === c.Z_SYNC_FLUSH) {
            this.onEnd(c.Z_OK);
            strm.avail_out = 0;
            return true;
          }
          return true;
        };
        Inflate.prototype.onData = function(chunk) {
          this.chunks.push(chunk);
        };
        Inflate.prototype.onEnd = function(status) {
          if (status === c.Z_OK) {
            if (this.options.to === "string") {
              this.result = this.chunks.join("");
            } else {
              this.result = utils.flattenChunks(this.chunks);
            }
          }
          this.chunks = [];
          this.err = status;
          this.msg = this.strm.msg;
        };
        function inflate(input, options) {
          var inflator = new Inflate(options);
          inflator.push(input, true);
          if (inflator.err) {
            throw inflator.msg || msg[inflator.err];
          }
          return inflator.result;
        }
        function inflateRaw(input, options) {
          options = options || {};
          options.raw = true;
          return inflate(input, options);
        }
        exports3.Inflate = Inflate;
        exports3.inflate = inflate;
        exports3.inflateRaw = inflateRaw;
        exports3.ungzip = inflate;
      }, { "./utils/common": 5, "./utils/strings": 6, "./zlib/constants": 8, "./zlib/gzheader": 10, "./zlib/inflate": 12, "./zlib/messages": 14, "./zlib/zstream": 15 }], 5: [function(require2, module4, exports3) {
        "use strict";
        var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
        function _has(obj, key) {
          return Object.prototype.hasOwnProperty.call(obj, key);
        }
        exports3.assign = function(obj) {
          var sources = Array.prototype.slice.call(arguments, 1);
          while (sources.length) {
            var source = sources.shift();
            if (!source) {
              continue;
            }
            if (typeof source !== "object") {
              throw new TypeError(source + "must be non-object");
            }
            for (var p in source) {
              if (_has(source, p)) {
                obj[p] = source[p];
              }
            }
          }
          return obj;
        };
        exports3.shrinkBuf = function(buf, size) {
          if (buf.length === size) {
            return buf;
          }
          if (buf.subarray) {
            return buf.subarray(0, size);
          }
          buf.length = size;
          return buf;
        };
        var fnTyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            if (src.subarray && dest.subarray) {
              dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
              return;
            }
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          // Join array of chunks to single array.
          flattenChunks: function(chunks) {
            var i, l, len, pos, chunk, result;
            len = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              len += chunks[i].length;
            }
            result = new Uint8Array(len);
            pos = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              chunk = chunks[i];
              result.set(chunk, pos);
              pos += chunk.length;
            }
            return result;
          }
        };
        var fnUntyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          // Join array of chunks to single array.
          flattenChunks: function(chunks) {
            return [].concat.apply([], chunks);
          }
        };
        exports3.setTyped = function(on) {
          if (on) {
            exports3.Buf8 = Uint8Array;
            exports3.Buf16 = Uint16Array;
            exports3.Buf32 = Int32Array;
            exports3.assign(exports3, fnTyped);
          } else {
            exports3.Buf8 = Array;
            exports3.Buf16 = Array;
            exports3.Buf32 = Array;
            exports3.assign(exports3, fnUntyped);
          }
        };
        exports3.setTyped(TYPED_OK);
      }, {}], 6: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("./common");
        var STR_APPLY_OK = true;
        var STR_APPLY_UIA_OK = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (__) {
          STR_APPLY_OK = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (__) {
          STR_APPLY_UIA_OK = false;
        }
        var _utf8len = new utils.Buf8(256);
        for (var q = 0; q < 256; q++) {
          _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
        }
        _utf8len[254] = _utf8len[254] = 1;
        exports3.string2buf = function(str) {
          var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
          for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
          }
          buf = new utils.Buf8(buf_len);
          for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            if (c < 128) {
              buf[i++] = c;
            } else if (c < 2048) {
              buf[i++] = 192 | c >>> 6;
              buf[i++] = 128 | c & 63;
            } else if (c < 65536) {
              buf[i++] = 224 | c >>> 12;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            } else {
              buf[i++] = 240 | c >>> 18;
              buf[i++] = 128 | c >>> 12 & 63;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            }
          }
          return buf;
        };
        function buf2binstring(buf, len) {
          if (len < 65534) {
            if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
              return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
            }
          }
          var result = "";
          for (var i = 0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
          }
          return result;
        }
        exports3.buf2binstring = function(buf) {
          return buf2binstring(buf, buf.length);
        };
        exports3.binstring2buf = function(str) {
          var buf = new utils.Buf8(str.length);
          for (var i = 0, len = buf.length; i < len; i++) {
            buf[i] = str.charCodeAt(i);
          }
          return buf;
        };
        exports3.buf2string = function(buf, max) {
          var i, out, c, c_len;
          var len = max || buf.length;
          var utf16buf = new Array(len * 2);
          for (out = 0, i = 0; i < len; ) {
            c = buf[i++];
            if (c < 128) {
              utf16buf[out++] = c;
              continue;
            }
            c_len = _utf8len[c];
            if (c_len > 4) {
              utf16buf[out++] = 65533;
              i += c_len - 1;
              continue;
            }
            c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
            while (c_len > 1 && i < len) {
              c = c << 6 | buf[i++] & 63;
              c_len--;
            }
            if (c_len > 1) {
              utf16buf[out++] = 65533;
              continue;
            }
            if (c < 65536) {
              utf16buf[out++] = c;
            } else {
              c -= 65536;
              utf16buf[out++] = 55296 | c >> 10 & 1023;
              utf16buf[out++] = 56320 | c & 1023;
            }
          }
          return buf2binstring(utf16buf, out);
        };
        exports3.utf8border = function(buf, max) {
          var pos;
          max = max || buf.length;
          if (max > buf.length) {
            max = buf.length;
          }
          pos = max - 1;
          while (pos >= 0 && (buf[pos] & 192) === 128) {
            pos--;
          }
          if (pos < 0) {
            return max;
          }
          if (pos === 0) {
            return max;
          }
          return pos + _utf8len[buf[pos]] > max ? pos : max;
        };
      }, { "./common": 5 }], 7: [function(require2, module4, exports3) {
        "use strict";
        function adler32(adler, buf, len, pos) {
          var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
          while (len !== 0) {
            n = len > 2e3 ? 2e3 : len;
            len -= n;
            do {
              s1 = s1 + buf[pos++] | 0;
              s2 = s2 + s1 | 0;
            } while (--n);
            s1 %= 65521;
            s2 %= 65521;
          }
          return s1 | s2 << 16 | 0;
        }
        module4.exports = adler32;
      }, {}], 8: [function(require2, module4, exports3) {
        "use strict";
        module4.exports = {
          /* Allowed flush values; see deflate() and inflate() below for details */
          Z_NO_FLUSH: 0,
          Z_PARTIAL_FLUSH: 1,
          Z_SYNC_FLUSH: 2,
          Z_FULL_FLUSH: 3,
          Z_FINISH: 4,
          Z_BLOCK: 5,
          Z_TREES: 6,
          /* Return codes for the compression/decompression functions. Negative values
          * are errors, positive values are used for special but normal events.
          */
          Z_OK: 0,
          Z_STREAM_END: 1,
          Z_NEED_DICT: 2,
          Z_ERRNO: -1,
          Z_STREAM_ERROR: -2,
          Z_DATA_ERROR: -3,
          //Z_MEM_ERROR:     -4,
          Z_BUF_ERROR: -5,
          //Z_VERSION_ERROR: -6,
          /* compression levels */
          Z_NO_COMPRESSION: 0,
          Z_BEST_SPEED: 1,
          Z_BEST_COMPRESSION: 9,
          Z_DEFAULT_COMPRESSION: -1,
          Z_FILTERED: 1,
          Z_HUFFMAN_ONLY: 2,
          Z_RLE: 3,
          Z_FIXED: 4,
          Z_DEFAULT_STRATEGY: 0,
          /* Possible values of the data_type field (though see inflate()) */
          Z_BINARY: 0,
          Z_TEXT: 1,
          //Z_ASCII:                1, // = Z_TEXT (deprecated)
          Z_UNKNOWN: 2,
          /* The deflate compression method */
          Z_DEFLATED: 8
          //Z_NULL:                 null // Use -1 or null inline, depending on var type
        };
      }, {}], 9: [function(require2, module4, exports3) {
        "use strict";
        function makeTable() {
          var c, table = [];
          for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
              c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
          }
          return table;
        }
        var crcTable = makeTable();
        function crc32(crc, buf, len, pos) {
          var t = crcTable, end = pos + len;
          crc ^= -1;
          for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
          }
          return crc ^ -1;
        }
        module4.exports = crc32;
      }, {}], 10: [function(require2, module4, exports3) {
        "use strict";
        function GZheader() {
          this.text = 0;
          this.time = 0;
          this.xflags = 0;
          this.os = 0;
          this.extra = null;
          this.extra_len = 0;
          this.name = "";
          this.comment = "";
          this.hcrc = 0;
          this.done = false;
        }
        module4.exports = GZheader;
      }, {}], 11: [function(require2, module4, exports3) {
        "use strict";
        var BAD = 30;
        var TYPE = 12;
        module4.exports = function inflate_fast(strm, start) {
          var state;
          var _in;
          var last;
          var _out;
          var beg;
          var end;
          var dmax;
          var wsize;
          var whave;
          var wnext;
          var s_window;
          var hold;
          var bits;
          var lcode;
          var dcode;
          var lmask;
          var dmask;
          var here;
          var op;
          var len;
          var dist;
          var from;
          var from_source;
          var input, output;
          state = strm.state;
          _in = strm.next_in;
          input = strm.input;
          last = _in + (strm.avail_in - 5);
          _out = strm.next_out;
          output = strm.output;
          beg = _out - (start - strm.avail_out);
          end = _out + (strm.avail_out - 257);
          dmax = state.dmax;
          wsize = state.wsize;
          whave = state.whave;
          wnext = state.wnext;
          s_window = state.window;
          hold = state.hold;
          bits = state.bits;
          lcode = state.lencode;
          dcode = state.distcode;
          lmask = (1 << state.lenbits) - 1;
          dmask = (1 << state.distbits) - 1;
          top:
            do {
              if (bits < 15) {
                hold += input[_in++] << bits;
                bits += 8;
                hold += input[_in++] << bits;
                bits += 8;
              }
              here = lcode[hold & lmask];
              dolen:
                for (; ; ) {
                  op = here >>> 24;
                  hold >>>= op;
                  bits -= op;
                  op = here >>> 16 & 255;
                  if (op === 0) {
                    output[_out++] = here & 65535;
                  } else if (op & 16) {
                    len = here & 65535;
                    op &= 15;
                    if (op) {
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                      }
                      len += hold & (1 << op) - 1;
                      hold >>>= op;
                      bits -= op;
                    }
                    if (bits < 15) {
                      hold += input[_in++] << bits;
                      bits += 8;
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                    here = dcode[hold & dmask];
                    dodist:
                      for (; ; ) {
                        op = here >>> 24;
                        hold >>>= op;
                        bits -= op;
                        op = here >>> 16 & 255;
                        if (op & 16) {
                          dist = here & 65535;
                          op &= 15;
                          if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                            if (bits < op) {
                              hold += input[_in++] << bits;
                              bits += 8;
                            }
                          }
                          dist += hold & (1 << op) - 1;
                          if (dist > dmax) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                          }
                          hold >>>= op;
                          bits -= op;
                          op = _out - beg;
                          if (dist > op) {
                            op = dist - op;
                            if (op > whave) {
                              if (state.sane) {
                                strm.msg = "invalid distance too far back";
                                state.mode = BAD;
                                break top;
                              }
                            }
                            from = 0;
                            from_source = s_window;
                            if (wnext === 0) {
                              from += wsize - op;
                              if (op < len) {
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            } else if (wnext < op) {
                              from += wsize + wnext - op;
                              op -= wnext;
                              if (op < len) {
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = 0;
                                if (wnext < len) {
                                  op = wnext;
                                  len -= op;
                                  do {
                                    output[_out++] = s_window[from++];
                                  } while (--op);
                                  from = _out - dist;
                                  from_source = output;
                                }
                              }
                            } else {
                              from += wnext - op;
                              if (op < len) {
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            }
                            while (len > 2) {
                              output[_out++] = from_source[from++];
                              output[_out++] = from_source[from++];
                              output[_out++] = from_source[from++];
                              len -= 3;
                            }
                            if (len) {
                              output[_out++] = from_source[from++];
                              if (len > 1) {
                                output[_out++] = from_source[from++];
                              }
                            }
                          } else {
                            from = _out - dist;
                            do {
                              output[_out++] = output[from++];
                              output[_out++] = output[from++];
                              output[_out++] = output[from++];
                              len -= 3;
                            } while (len > 2);
                            if (len) {
                              output[_out++] = output[from++];
                              if (len > 1) {
                                output[_out++] = output[from++];
                              }
                            }
                          }
                        } else if ((op & 64) === 0) {
                          here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                          continue dodist;
                        } else {
                          strm.msg = "invalid distance code";
                          state.mode = BAD;
                          break top;
                        }
                        break;
                      }
                  } else if ((op & 64) === 0) {
                    here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                    continue dolen;
                  } else if (op & 32) {
                    state.mode = TYPE;
                    break top;
                  } else {
                    strm.msg = "invalid literal/length code";
                    state.mode = BAD;
                    break top;
                  }
                  break;
                }
            } while (_in < last && _out < end);
          len = bits >> 3;
          _in -= len;
          bits -= len << 3;
          hold &= (1 << bits) - 1;
          strm.next_in = _in;
          strm.next_out = _out;
          strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
          strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
          state.hold = hold;
          state.bits = bits;
          return;
        };
      }, {}], 12: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var adler32 = require2("./adler32");
        var crc32 = require2("./crc32");
        var inflate_fast = require2("./inffast");
        var inflate_table = require2("./inftrees");
        var CODES = 0;
        var LENS = 1;
        var DISTS = 2;
        var Z_FINISH = 4;
        var Z_BLOCK = 5;
        var Z_TREES = 6;
        var Z_OK = 0;
        var Z_STREAM_END = 1;
        var Z_NEED_DICT = 2;
        var Z_STREAM_ERROR = -2;
        var Z_DATA_ERROR = -3;
        var Z_MEM_ERROR = -4;
        var Z_BUF_ERROR = -5;
        var Z_DEFLATED = 8;
        var HEAD = 1;
        var FLAGS = 2;
        var TIME = 3;
        var OS = 4;
        var EXLEN = 5;
        var EXTRA = 6;
        var NAME = 7;
        var COMMENT = 8;
        var HCRC = 9;
        var DICTID = 10;
        var DICT = 11;
        var TYPE = 12;
        var TYPEDO = 13;
        var STORED = 14;
        var COPY_ = 15;
        var COPY = 16;
        var TABLE = 17;
        var LENLENS = 18;
        var CODELENS = 19;
        var LEN_ = 20;
        var LEN = 21;
        var LENEXT = 22;
        var DIST = 23;
        var DISTEXT = 24;
        var MATCH = 25;
        var LIT = 26;
        var CHECK = 27;
        var LENGTH = 28;
        var DONE = 29;
        var BAD = 30;
        var MEM = 31;
        var SYNC = 32;
        var ENOUGH_LENS = 852;
        var ENOUGH_DISTS = 592;
        var MAX_WBITS = 15;
        var DEF_WBITS = MAX_WBITS;
        function zswap32(q) {
          return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
        }
        function InflateState() {
          this.mode = 0;
          this.last = false;
          this.wrap = 0;
          this.havedict = false;
          this.flags = 0;
          this.dmax = 0;
          this.check = 0;
          this.total = 0;
          this.head = null;
          this.wbits = 0;
          this.wsize = 0;
          this.whave = 0;
          this.wnext = 0;
          this.window = null;
          this.hold = 0;
          this.bits = 0;
          this.length = 0;
          this.offset = 0;
          this.extra = 0;
          this.lencode = null;
          this.distcode = null;
          this.lenbits = 0;
          this.distbits = 0;
          this.ncode = 0;
          this.nlen = 0;
          this.ndist = 0;
          this.have = 0;
          this.next = null;
          this.lens = new utils.Buf16(320);
          this.work = new utils.Buf16(288);
          this.lendyn = null;
          this.distdyn = null;
          this.sane = 0;
          this.back = 0;
          this.was = 0;
        }
        function inflateResetKeep(strm) {
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          strm.total_in = strm.total_out = state.total = 0;
          strm.msg = "";
          if (state.wrap) {
            strm.adler = state.wrap & 1;
          }
          state.mode = HEAD;
          state.last = 0;
          state.havedict = 0;
          state.dmax = 32768;
          state.head = null;
          state.hold = 0;
          state.bits = 0;
          state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
          state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
          state.sane = 1;
          state.back = -1;
          return Z_OK;
        }
        function inflateReset(strm) {
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          state.wsize = 0;
          state.whave = 0;
          state.wnext = 0;
          return inflateResetKeep(strm);
        }
        function inflateReset2(strm, windowBits) {
          var wrap;
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
          } else {
            wrap = (windowBits >> 4) + 1;
            if (windowBits < 48) {
              windowBits &= 15;
            }
          }
          if (windowBits && (windowBits < 8 || windowBits > 15)) {
            return Z_STREAM_ERROR;
          }
          if (state.window !== null && state.wbits !== windowBits) {
            state.window = null;
          }
          state.wrap = wrap;
          state.wbits = windowBits;
          return inflateReset(strm);
        }
        function inflateInit2(strm, windowBits) {
          var ret;
          var state;
          if (!strm) {
            return Z_STREAM_ERROR;
          }
          state = new InflateState();
          strm.state = state;
          state.window = null;
          ret = inflateReset2(strm, windowBits);
          if (ret !== Z_OK) {
            strm.state = null;
          }
          return ret;
        }
        function inflateInit(strm) {
          return inflateInit2(strm, DEF_WBITS);
        }
        var virgin = true;
        var lenfix, distfix;
        function fixedtables(state) {
          if (virgin) {
            var sym;
            lenfix = new utils.Buf32(512);
            distfix = new utils.Buf32(32);
            sym = 0;
            while (sym < 144) {
              state.lens[sym++] = 8;
            }
            while (sym < 256) {
              state.lens[sym++] = 9;
            }
            while (sym < 280) {
              state.lens[sym++] = 7;
            }
            while (sym < 288) {
              state.lens[sym++] = 8;
            }
            inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
            sym = 0;
            while (sym < 32) {
              state.lens[sym++] = 5;
            }
            inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
            virgin = false;
          }
          state.lencode = lenfix;
          state.lenbits = 9;
          state.distcode = distfix;
          state.distbits = 5;
        }
        function updatewindow(strm, src, end, copy) {
          var dist;
          var state = strm.state;
          if (state.window === null) {
            state.wsize = 1 << state.wbits;
            state.wnext = 0;
            state.whave = 0;
            state.window = new utils.Buf8(state.wsize);
          }
          if (copy >= state.wsize) {
            utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
            state.wnext = 0;
            state.whave = state.wsize;
          } else {
            dist = state.wsize - state.wnext;
            if (dist > copy) {
              dist = copy;
            }
            utils.arraySet(state.window, src, end - copy, dist, state.wnext);
            copy -= dist;
            if (copy) {
              utils.arraySet(state.window, src, end - copy, copy, 0);
              state.wnext = copy;
              state.whave = state.wsize;
            } else {
              state.wnext += dist;
              if (state.wnext === state.wsize) {
                state.wnext = 0;
              }
              if (state.whave < state.wsize) {
                state.whave += dist;
              }
            }
          }
          return 0;
        }
        function inflate(strm, flush) {
          var state;
          var input, output;
          var next;
          var put;
          var have, left;
          var hold;
          var bits;
          var _in, _out;
          var copy;
          var from;
          var from_source;
          var here = 0;
          var here_bits, here_op, here_val;
          var last_bits, last_op, last_val;
          var len;
          var ret;
          var hbuf = new utils.Buf8(4);
          var opts;
          var n;
          var order = (
            /* permutation of code lengths */
            [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
          );
          if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if (state.mode === TYPE) {
            state.mode = TYPEDO;
          }
          put = strm.next_out;
          output = strm.output;
          left = strm.avail_out;
          next = strm.next_in;
          input = strm.input;
          have = strm.avail_in;
          hold = state.hold;
          bits = state.bits;
          _in = have;
          _out = left;
          ret = Z_OK;
          inf_leave:
            for (; ; ) {
              switch (state.mode) {
                case HEAD:
                  if (state.wrap === 0) {
                    state.mode = TYPEDO;
                    break;
                  }
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.wrap & 2 && hold === 35615) {
                    state.check = 0;
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                    hold = 0;
                    bits = 0;
                    state.mode = FLAGS;
                    break;
                  }
                  state.flags = 0;
                  if (state.head) {
                    state.head.done = false;
                  }
                  if (!(state.wrap & 1) || /* check if zlib header allowed */
                  (((hold & 255) << 8) + (hold >> 8)) % 31) {
                    strm.msg = "incorrect header check";
                    state.mode = BAD;
                    break;
                  }
                  if ((hold & 15) !== Z_DEFLATED) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD;
                    break;
                  }
                  hold >>>= 4;
                  bits -= 4;
                  len = (hold & 15) + 8;
                  if (state.wbits === 0) {
                    state.wbits = len;
                  } else if (len > state.wbits) {
                    strm.msg = "invalid window size";
                    state.mode = BAD;
                    break;
                  }
                  state.dmax = 1 << len;
                  strm.adler = state.check = 1;
                  state.mode = hold & 512 ? DICTID : TYPE;
                  hold = 0;
                  bits = 0;
                  break;
                case FLAGS:
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.flags = hold;
                  if ((state.flags & 255) !== Z_DEFLATED) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD;
                    break;
                  }
                  if (state.flags & 57344) {
                    strm.msg = "unknown header flags set";
                    state.mode = BAD;
                    break;
                  }
                  if (state.head) {
                    state.head.text = hold >> 8 & 1;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                  state.mode = TIME;
                /* falls through */
                case TIME:
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.head) {
                    state.head.time = hold;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    hbuf[2] = hold >>> 16 & 255;
                    hbuf[3] = hold >>> 24 & 255;
                    state.check = crc32(state.check, hbuf, 4, 0);
                  }
                  hold = 0;
                  bits = 0;
                  state.mode = OS;
                /* falls through */
                case OS:
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.head) {
                    state.head.xflags = hold & 255;
                    state.head.os = hold >> 8;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                  state.mode = EXLEN;
                /* falls through */
                case EXLEN:
                  if (state.flags & 1024) {
                    while (bits < 16) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.length = hold;
                    if (state.head) {
                      state.head.extra_len = hold;
                    }
                    if (state.flags & 512) {
                      hbuf[0] = hold & 255;
                      hbuf[1] = hold >>> 8 & 255;
                      state.check = crc32(state.check, hbuf, 2, 0);
                    }
                    hold = 0;
                    bits = 0;
                  } else if (state.head) {
                    state.head.extra = null;
                  }
                  state.mode = EXTRA;
                /* falls through */
                case EXTRA:
                  if (state.flags & 1024) {
                    copy = state.length;
                    if (copy > have) {
                      copy = have;
                    }
                    if (copy) {
                      if (state.head) {
                        len = state.head.extra_len - state.length;
                        if (!state.head.extra) {
                          state.head.extra = new Array(state.head.extra_len);
                        }
                        utils.arraySet(
                          state.head.extra,
                          input,
                          next,
                          // extra field is limited to 65536 bytes
                          // - no need for additional size check
                          copy,
                          /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                          len
                        );
                      }
                      if (state.flags & 512) {
                        state.check = crc32(state.check, input, copy, next);
                      }
                      have -= copy;
                      next += copy;
                      state.length -= copy;
                    }
                    if (state.length) {
                      break inf_leave;
                    }
                  }
                  state.length = 0;
                  state.mode = NAME;
                /* falls through */
                case NAME:
                  if (state.flags & 2048) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    copy = 0;
                    do {
                      len = input[next + copy++];
                      if (state.head && len && state.length < 65536) {
                        state.head.name += String.fromCharCode(len);
                      }
                    } while (len && copy < have);
                    if (state.flags & 512) {
                      state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) {
                      break inf_leave;
                    }
                  } else if (state.head) {
                    state.head.name = null;
                  }
                  state.length = 0;
                  state.mode = COMMENT;
                /* falls through */
                case COMMENT:
                  if (state.flags & 4096) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    copy = 0;
                    do {
                      len = input[next + copy++];
                      if (state.head && len && state.length < 65536) {
                        state.head.comment += String.fromCharCode(len);
                      }
                    } while (len && copy < have);
                    if (state.flags & 512) {
                      state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) {
                      break inf_leave;
                    }
                  } else if (state.head) {
                    state.head.comment = null;
                  }
                  state.mode = HCRC;
                /* falls through */
                case HCRC:
                  if (state.flags & 512) {
                    while (bits < 16) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    if (hold !== (state.check & 65535)) {
                      strm.msg = "header crc mismatch";
                      state.mode = BAD;
                      break;
                    }
                    hold = 0;
                    bits = 0;
                  }
                  if (state.head) {
                    state.head.hcrc = state.flags >> 9 & 1;
                    state.head.done = true;
                  }
                  strm.adler = state.check = 0;
                  state.mode = TYPE;
                  break;
                case DICTID:
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  strm.adler = state.check = zswap32(hold);
                  hold = 0;
                  bits = 0;
                  state.mode = DICT;
                /* falls through */
                case DICT:
                  if (state.havedict === 0) {
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    return Z_NEED_DICT;
                  }
                  strm.adler = state.check = 1;
                  state.mode = TYPE;
                /* falls through */
                case TYPE:
                  if (flush === Z_BLOCK || flush === Z_TREES) {
                    break inf_leave;
                  }
                /* falls through */
                case TYPEDO:
                  if (state.last) {
                    hold >>>= bits & 7;
                    bits -= bits & 7;
                    state.mode = CHECK;
                    break;
                  }
                  while (bits < 3) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.last = hold & 1;
                  hold >>>= 1;
                  bits -= 1;
                  switch (hold & 3) {
                    case 0:
                      state.mode = STORED;
                      break;
                    case 1:
                      fixedtables(state);
                      state.mode = LEN_;
                      if (flush === Z_TREES) {
                        hold >>>= 2;
                        bits -= 2;
                        break inf_leave;
                      }
                      break;
                    case 2:
                      state.mode = TABLE;
                      break;
                    case 3:
                      strm.msg = "invalid block type";
                      state.mode = BAD;
                  }
                  hold >>>= 2;
                  bits -= 2;
                  break;
                case STORED:
                  hold >>>= bits & 7;
                  bits -= bits & 7;
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                    strm.msg = "invalid stored block lengths";
                    state.mode = BAD;
                    break;
                  }
                  state.length = hold & 65535;
                  hold = 0;
                  bits = 0;
                  state.mode = COPY_;
                  if (flush === Z_TREES) {
                    break inf_leave;
                  }
                /* falls through */
                case COPY_:
                  state.mode = COPY;
                /* falls through */
                case COPY:
                  copy = state.length;
                  if (copy) {
                    if (copy > have) {
                      copy = have;
                    }
                    if (copy > left) {
                      copy = left;
                    }
                    if (copy === 0) {
                      break inf_leave;
                    }
                    utils.arraySet(output, input, next, copy, put);
                    have -= copy;
                    next += copy;
                    left -= copy;
                    put += copy;
                    state.length -= copy;
                    break;
                  }
                  state.mode = TYPE;
                  break;
                case TABLE:
                  while (bits < 14) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.nlen = (hold & 31) + 257;
                  hold >>>= 5;
                  bits -= 5;
                  state.ndist = (hold & 31) + 1;
                  hold >>>= 5;
                  bits -= 5;
                  state.ncode = (hold & 15) + 4;
                  hold >>>= 4;
                  bits -= 4;
                  if (state.nlen > 286 || state.ndist > 30) {
                    strm.msg = "too many length or distance symbols";
                    state.mode = BAD;
                    break;
                  }
                  state.have = 0;
                  state.mode = LENLENS;
                /* falls through */
                case LENLENS:
                  while (state.have < state.ncode) {
                    while (bits < 3) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.lens[order[state.have++]] = hold & 7;
                    hold >>>= 3;
                    bits -= 3;
                  }
                  while (state.have < 19) {
                    state.lens[order[state.have++]] = 0;
                  }
                  state.lencode = state.lendyn;
                  state.lenbits = 7;
                  opts = { bits: state.lenbits };
                  ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                  state.lenbits = opts.bits;
                  if (ret) {
                    strm.msg = "invalid code lengths set";
                    state.mode = BAD;
                    break;
                  }
                  state.have = 0;
                  state.mode = CODELENS;
                /* falls through */
                case CODELENS:
                  while (state.have < state.nlen + state.ndist) {
                    for (; ; ) {
                      here = state.lencode[hold & (1 << state.lenbits) - 1];
                      here_bits = here >>> 24;
                      here_op = here >>> 16 & 255;
                      here_val = here & 65535;
                      if (here_bits <= bits) {
                        break;
                      }
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    if (here_val < 16) {
                      hold >>>= here_bits;
                      bits -= here_bits;
                      state.lens[state.have++] = here_val;
                    } else {
                      if (here_val === 16) {
                        n = here_bits + 2;
                        while (bits < n) {
                          if (have === 0) {
                            break inf_leave;
                          }
                          have--;
                          hold += input[next++] << bits;
                          bits += 8;
                        }
                        hold >>>= here_bits;
                        bits -= here_bits;
                        if (state.have === 0) {
                          strm.msg = "invalid bit length repeat";
                          state.mode = BAD;
                          break;
                        }
                        len = state.lens[state.have - 1];
                        copy = 3 + (hold & 3);
                        hold >>>= 2;
                        bits -= 2;
                      } else if (here_val === 17) {
                        n = here_bits + 3;
                        while (bits < n) {
                          if (have === 0) {
                            break inf_leave;
                          }
                          have--;
                          hold += input[next++] << bits;
                          bits += 8;
                        }
                        hold >>>= here_bits;
                        bits -= here_bits;
                        len = 0;
                        copy = 3 + (hold & 7);
                        hold >>>= 3;
                        bits -= 3;
                      } else {
                        n = here_bits + 7;
                        while (bits < n) {
                          if (have === 0) {
                            break inf_leave;
                          }
                          have--;
                          hold += input[next++] << bits;
                          bits += 8;
                        }
                        hold >>>= here_bits;
                        bits -= here_bits;
                        len = 0;
                        copy = 11 + (hold & 127);
                        hold >>>= 7;
                        bits -= 7;
                      }
                      if (state.have + copy > state.nlen + state.ndist) {
                        strm.msg = "invalid bit length repeat";
                        state.mode = BAD;
                        break;
                      }
                      while (copy--) {
                        state.lens[state.have++] = len;
                      }
                    }
                  }
                  if (state.mode === BAD) {
                    break;
                  }
                  if (state.lens[256] === 0) {
                    strm.msg = "invalid code -- missing end-of-block";
                    state.mode = BAD;
                    break;
                  }
                  state.lenbits = 9;
                  opts = { bits: state.lenbits };
                  ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                  state.lenbits = opts.bits;
                  if (ret) {
                    strm.msg = "invalid literal/lengths set";
                    state.mode = BAD;
                    break;
                  }
                  state.distbits = 6;
                  state.distcode = state.distdyn;
                  opts = { bits: state.distbits };
                  ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                  state.distbits = opts.bits;
                  if (ret) {
                    strm.msg = "invalid distances set";
                    state.mode = BAD;
                    break;
                  }
                  state.mode = LEN_;
                  if (flush === Z_TREES) {
                    break inf_leave;
                  }
                /* falls through */
                case LEN_:
                  state.mode = LEN;
                /* falls through */
                case LEN:
                  if (have >= 6 && left >= 258) {
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    inflate_fast(strm, _out);
                    put = strm.next_out;
                    output = strm.output;
                    left = strm.avail_out;
                    next = strm.next_in;
                    input = strm.input;
                    have = strm.avail_in;
                    hold = state.hold;
                    bits = state.bits;
                    if (state.mode === TYPE) {
                      state.back = -1;
                    }
                    break;
                  }
                  state.back = 0;
                  for (; ; ) {
                    here = state.lencode[hold & (1 << state.lenbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (here_op && (here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for (; ; ) {
                      here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                      here_bits = here >>> 24;
                      here_op = here >>> 16 & 255;
                      here_val = here & 65535;
                      if (last_bits + here_bits <= bits) {
                        break;
                      }
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= last_bits;
                    bits -= last_bits;
                    state.back += last_bits;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.back += here_bits;
                  state.length = here_val;
                  if (here_op === 0) {
                    state.mode = LIT;
                    break;
                  }
                  if (here_op & 32) {
                    state.back = -1;
                    state.mode = TYPE;
                    break;
                  }
                  if (here_op & 64) {
                    strm.msg = "invalid literal/length code";
                    state.mode = BAD;
                    break;
                  }
                  state.extra = here_op & 15;
                  state.mode = LENEXT;
                /* falls through */
                case LENEXT:
                  if (state.extra) {
                    n = state.extra;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.length += hold & (1 << state.extra) - 1;
                    hold >>>= state.extra;
                    bits -= state.extra;
                    state.back += state.extra;
                  }
                  state.was = state.length;
                  state.mode = DIST;
                /* falls through */
                case DIST:
                  for (; ; ) {
                    here = state.distcode[hold & (1 << state.distbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if ((here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for (; ; ) {
                      here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                      here_bits = here >>> 24;
                      here_op = here >>> 16 & 255;
                      here_val = here & 65535;
                      if (last_bits + here_bits <= bits) {
                        break;
                      }
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= last_bits;
                    bits -= last_bits;
                    state.back += last_bits;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.back += here_bits;
                  if (here_op & 64) {
                    strm.msg = "invalid distance code";
                    state.mode = BAD;
                    break;
                  }
                  state.offset = here_val;
                  state.extra = here_op & 15;
                  state.mode = DISTEXT;
                /* falls through */
                case DISTEXT:
                  if (state.extra) {
                    n = state.extra;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.offset += hold & (1 << state.extra) - 1;
                    hold >>>= state.extra;
                    bits -= state.extra;
                    state.back += state.extra;
                  }
                  if (state.offset > state.dmax) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                  }
                  state.mode = MATCH;
                /* falls through */
                case MATCH:
                  if (left === 0) {
                    break inf_leave;
                  }
                  copy = _out - left;
                  if (state.offset > copy) {
                    copy = state.offset - copy;
                    if (copy > state.whave) {
                      if (state.sane) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD;
                        break;
                      }
                    }
                    if (copy > state.wnext) {
                      copy -= state.wnext;
                      from = state.wsize - copy;
                    } else {
                      from = state.wnext - copy;
                    }
                    if (copy > state.length) {
                      copy = state.length;
                    }
                    from_source = state.window;
                  } else {
                    from_source = output;
                    from = put - state.offset;
                    copy = state.length;
                  }
                  if (copy > left) {
                    copy = left;
                  }
                  left -= copy;
                  state.length -= copy;
                  do {
                    output[put++] = from_source[from++];
                  } while (--copy);
                  if (state.length === 0) {
                    state.mode = LEN;
                  }
                  break;
                case LIT:
                  if (left === 0) {
                    break inf_leave;
                  }
                  output[put++] = state.length;
                  left--;
                  state.mode = LEN;
                  break;
                case CHECK:
                  if (state.wrap) {
                    while (bits < 32) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold |= input[next++] << bits;
                      bits += 8;
                    }
                    _out -= left;
                    strm.total_out += _out;
                    state.total += _out;
                    if (_out) {
                      strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
                      state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                    }
                    _out = left;
                    if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                      strm.msg = "incorrect data check";
                      state.mode = BAD;
                      break;
                    }
                    hold = 0;
                    bits = 0;
                  }
                  state.mode = LENGTH;
                /* falls through */
                case LENGTH:
                  if (state.wrap && state.flags) {
                    while (bits < 32) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    if (hold !== (state.total & 4294967295)) {
                      strm.msg = "incorrect length check";
                      state.mode = BAD;
                      break;
                    }
                    hold = 0;
                    bits = 0;
                  }
                  state.mode = DONE;
                /* falls through */
                case DONE:
                  ret = Z_STREAM_END;
                  break inf_leave;
                case BAD:
                  ret = Z_DATA_ERROR;
                  break inf_leave;
                case MEM:
                  return Z_MEM_ERROR;
                case SYNC:
                /* falls through */
                default:
                  return Z_STREAM_ERROR;
              }
            }
          strm.next_out = put;
          strm.avail_out = left;
          strm.next_in = next;
          strm.avail_in = have;
          state.hold = hold;
          state.bits = bits;
          if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
            if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
              state.mode = MEM;
              return Z_MEM_ERROR;
            }
          }
          _in -= strm.avail_in;
          _out -= strm.avail_out;
          strm.total_in += _in;
          strm.total_out += _out;
          state.total += _out;
          if (state.wrap && _out) {
            strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
            state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
          }
          strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
          if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
            ret = Z_BUF_ERROR;
          }
          return ret;
        }
        function inflateEnd(strm) {
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          var state = strm.state;
          if (state.window) {
            state.window = null;
          }
          strm.state = null;
          return Z_OK;
        }
        function inflateGetHeader(strm, head) {
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if ((state.wrap & 2) === 0) {
            return Z_STREAM_ERROR;
          }
          state.head = head;
          head.done = false;
          return Z_OK;
        }
        function inflateSetDictionary(strm, dictionary) {
          var dictLength = dictionary.length;
          var state;
          var dictid;
          var ret;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if (state.wrap !== 0 && state.mode !== DICT) {
            return Z_STREAM_ERROR;
          }
          if (state.mode === DICT) {
            dictid = 1;
            dictid = adler32(dictid, dictionary, dictLength, 0);
            if (dictid !== state.check) {
              return Z_DATA_ERROR;
            }
          }
          ret = updatewindow(strm, dictionary, dictLength, dictLength);
          if (ret) {
            state.mode = MEM;
            return Z_MEM_ERROR;
          }
          state.havedict = 1;
          return Z_OK;
        }
        exports3.inflateReset = inflateReset;
        exports3.inflateReset2 = inflateReset2;
        exports3.inflateResetKeep = inflateResetKeep;
        exports3.inflateInit = inflateInit;
        exports3.inflateInit2 = inflateInit2;
        exports3.inflate = inflate;
        exports3.inflateEnd = inflateEnd;
        exports3.inflateGetHeader = inflateGetHeader;
        exports3.inflateSetDictionary = inflateSetDictionary;
        exports3.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 5, "./adler32": 7, "./crc32": 9, "./inffast": 11, "./inftrees": 13 }], 13: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var MAXBITS = 15;
        var ENOUGH_LENS = 852;
        var ENOUGH_DISTS = 592;
        var CODES = 0;
        var LENS = 1;
        var DISTS = 2;
        var lbase = [
          /* Length codes 257..285 base */
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          13,
          15,
          17,
          19,
          23,
          27,
          31,
          35,
          43,
          51,
          59,
          67,
          83,
          99,
          115,
          131,
          163,
          195,
          227,
          258,
          0,
          0
        ];
        var lext = [
          /* Length codes 257..285 extra */
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          17,
          17,
          17,
          17,
          18,
          18,
          18,
          18,
          19,
          19,
          19,
          19,
          20,
          20,
          20,
          20,
          21,
          21,
          21,
          21,
          16,
          72,
          78
        ];
        var dbase = [
          /* Distance codes 0..29 base */
          1,
          2,
          3,
          4,
          5,
          7,
          9,
          13,
          17,
          25,
          33,
          49,
          65,
          97,
          129,
          193,
          257,
          385,
          513,
          769,
          1025,
          1537,
          2049,
          3073,
          4097,
          6145,
          8193,
          12289,
          16385,
          24577,
          0,
          0
        ];
        var dext = [
          /* Distance codes 0..29 extra */
          16,
          16,
          16,
          16,
          17,
          17,
          18,
          18,
          19,
          19,
          20,
          20,
          21,
          21,
          22,
          22,
          23,
          23,
          24,
          24,
          25,
          25,
          26,
          26,
          27,
          27,
          28,
          28,
          29,
          29,
          64,
          64
        ];
        module4.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
          var bits = opts.bits;
          var len = 0;
          var sym = 0;
          var min = 0, max = 0;
          var root = 0;
          var curr = 0;
          var drop = 0;
          var left = 0;
          var used = 0;
          var huff = 0;
          var incr;
          var fill;
          var low;
          var mask;
          var next;
          var base = null;
          var base_index = 0;
          var end;
          var count = new utils.Buf16(MAXBITS + 1);
          var offs = new utils.Buf16(MAXBITS + 1);
          var extra = null;
          var extra_index = 0;
          var here_bits, here_op, here_val;
          for (len = 0; len <= MAXBITS; len++) {
            count[len] = 0;
          }
          for (sym = 0; sym < codes; sym++) {
            count[lens[lens_index + sym]]++;
          }
          root = bits;
          for (max = MAXBITS; max >= 1; max--) {
            if (count[max] !== 0) {
              break;
            }
          }
          if (root > max) {
            root = max;
          }
          if (max === 0) {
            table[table_index++] = 1 << 24 | 64 << 16 | 0;
            table[table_index++] = 1 << 24 | 64 << 16 | 0;
            opts.bits = 1;
            return 0;
          }
          for (min = 1; min < max; min++) {
            if (count[min] !== 0) {
              break;
            }
          }
          if (root < min) {
            root = min;
          }
          left = 1;
          for (len = 1; len <= MAXBITS; len++) {
            left <<= 1;
            left -= count[len];
            if (left < 0) {
              return -1;
            }
          }
          if (left > 0 && (type === CODES || max !== 1)) {
            return -1;
          }
          offs[1] = 0;
          for (len = 1; len < MAXBITS; len++) {
            offs[len + 1] = offs[len] + count[len];
          }
          for (sym = 0; sym < codes; sym++) {
            if (lens[lens_index + sym] !== 0) {
              work[offs[lens[lens_index + sym]]++] = sym;
            }
          }
          if (type === CODES) {
            base = extra = work;
            end = 19;
          } else if (type === LENS) {
            base = lbase;
            base_index -= 257;
            extra = lext;
            extra_index -= 257;
            end = 256;
          } else {
            base = dbase;
            extra = dext;
            end = -1;
          }
          huff = 0;
          sym = 0;
          len = min;
          next = table_index;
          curr = root;
          drop = 0;
          low = -1;
          used = 1 << root;
          mask = used - 1;
          if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
            return 1;
          }
          for (; ; ) {
            here_bits = len - drop;
            if (work[sym] < end) {
              here_op = 0;
              here_val = work[sym];
            } else if (work[sym] > end) {
              here_op = extra[extra_index + work[sym]];
              here_val = base[base_index + work[sym]];
            } else {
              here_op = 32 + 64;
              here_val = 0;
            }
            incr = 1 << len - drop;
            fill = 1 << curr;
            min = fill;
            do {
              fill -= incr;
              table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
            } while (fill !== 0);
            incr = 1 << len - 1;
            while (huff & incr) {
              incr >>= 1;
            }
            if (incr !== 0) {
              huff &= incr - 1;
              huff += incr;
            } else {
              huff = 0;
            }
            sym++;
            if (--count[len] === 0) {
              if (len === max) {
                break;
              }
              len = lens[lens_index + work[sym]];
            }
            if (len > root && (huff & mask) !== low) {
              if (drop === 0) {
                drop = root;
              }
              next += min;
              curr = len - drop;
              left = 1 << curr;
              while (curr + drop < max) {
                left -= count[curr + drop];
                if (left <= 0) {
                  break;
                }
                curr++;
                left <<= 1;
              }
              used += 1 << curr;
              if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
                return 1;
              }
              low = huff & mask;
              table[low] = root << 24 | curr << 16 | next - table_index | 0;
            }
          }
          if (huff !== 0) {
            table[next + huff] = len - drop << 24 | 64 << 16 | 0;
          }
          opts.bits = root;
          return 0;
        };
      }, { "../utils/common": 5 }], 14: [function(require2, module4, exports3) {
        "use strict";
        module4.exports = {
          2: "need dictionary",
          /* Z_NEED_DICT       2  */
          1: "stream end",
          /* Z_STREAM_END      1  */
          0: "",
          /* Z_OK              0  */
          "-1": "file error",
          /* Z_ERRNO         (-1) */
          "-2": "stream error",
          /* Z_STREAM_ERROR  (-2) */
          "-3": "data error",
          /* Z_DATA_ERROR    (-3) */
          "-4": "insufficient memory",
          /* Z_MEM_ERROR     (-4) */
          "-5": "buffer error",
          /* Z_BUF_ERROR     (-5) */
          "-6": "incompatible version"
          /* Z_VERSION_ERROR (-6) */
        };
      }, {}], 15: [function(require2, module4, exports3) {
        "use strict";
        function ZStream() {
          this.input = null;
          this.next_in = 0;
          this.avail_in = 0;
          this.total_in = 0;
          this.output = null;
          this.next_out = 0;
          this.avail_out = 0;
          this.total_out = 0;
          this.msg = "";
          this.state = null;
          this.data_type = 2;
          this.adler = 0;
        }
        module4.exports = ZStream;
      }, {}] }, {}, [3])(3);
    });
  }
});

// node_modules/plantuml-encoder/browser-index.js
var require_browser_index = __commonJS({
  "node_modules/plantuml-encoder/browser-index.js"(exports, module2) {
    module2.exports = {
      encode: require_plantuml_encoder().encode,
      decode: require_plantuml_decoder().decode
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PUMLViewerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_plantuml_encoder = __toESM(require_browser_index());
var VIEW_TYPE_PUML = "puml-viewer";
var DEFAULT_SETTINGS = {
  serverType: "plantuml",
  plantumlServerUrl: "https://www.plantuml.com/plantuml",
  krokiServerUrl: "https://kroki.io",
  localServerUrl: "http://localhost:8000",
  imageFormat: "svg",
  autoRefresh: true,
  lastOpenedPumlPath: "",
  embeddedDefaultView: "diagram",
  embeddedDiagramAlign: "center"
};
var ICONS = {
  code: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7 4 12l4.5 5M15.5 7 20 12l-4.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  diagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="6" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="5" width="6" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><rect x="9" y="15" width="6" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 9v3h10V9M12 12v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  zoom: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  save: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10M8 10l4 4 4-4M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="5" y="5" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  exportPng: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.3" fill="currentColor"/><path d="m6.5 16 3.5-3.5 2.4 2.4 2.3-2.3L18 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  exportSvg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16c2.2 0 2.2-8 4.4-8s2.2 8 4.4 8 2.2-8 4.4-8 2.2 8 2.8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="16" r="1.5" fill="currentColor"/><circle cx="8.4" cy="8" r="1.5" fill="currentColor"/><circle cx="12.8" cy="16" r="1.5" fill="currentColor"/><circle cx="17.2" cy="8" r="1.5" fill="currentColor"/></svg>`,
  exportAscii: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 6.5 19M12 5 17.5 19M8.4 14.5h7.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};
function parseSvgMarkup(svgMarkup) {
  const parsed = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
  if (parsed.querySelector("parsererror")) return null;
  const svgEl = parsed.querySelector("svg");
  if (!svgEl) return null;
  const imported = document.importNode(svgEl, true);
  return imported instanceof SVGSVGElement ? imported : null;
}
function setElementSvgIcon(element, svgMarkup) {
  const svgEl = parseSvgMarkup(svgMarkup);
  element.empty();
  if (!svgEl) return;
  element.appendChild(svgEl);
}
var PUMLViewerPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_PUML, (leaf) => new PUMLViewerView(leaf, this));
    this.registerExtensions(["puml"], VIEW_TYPE_PUML);
    this.addCommand({
      id: "open-current-puml-in-viewer",
      name: "Open current plantuml file in viewer",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const canOpen = !!file && file.extension === "puml";
        if (canOpen && !checking && file) {
          void this.activatePUMLView(file);
        }
        return canOpen;
      }
    });
    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.extension !== "puml") return;
      const activeLeaf = this.app.workspace.getMostRecentLeaf();
      if (activeLeaf?.view.getViewType() === VIEW_TYPE_PUML) return;
      void this.activatePUMLView(activeFile);
    });
    for (const lang of ["plantuml"]) {
      this.registerMarkdownCodeBlockProcessor(lang, async (source, el, ctx) => {
        const fenceWidthHintPx = this.extractFenceWidthHint(
          ctx.getSectionInfo(el)?.text ?? "",
          source
        );
        await this.renderEmbeddedDiagramBlock(source, el, fenceWidthHintPx);
      });
    }
    this.addSettingTab(new PUMLViewerSettingTab(this.app, this));
  }
  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_PUML).forEach((leaf) => leaf.detach());
  }
  async loadSettings() {
    const loaded = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (loaded.serverUrl) {
      if (loaded.serverType === "kroki") {
        loaded.krokiServerUrl = loaded.serverUrl;
      } else if (loaded.serverType === "local") {
        loaded.localServerUrl = loaded.serverUrl;
      } else {
        loaded.plantumlServerUrl = loaded.serverUrl;
      }
    }
    this.settings = loaded;
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  rerenderMarkdownPreviews() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof import_obsidian.MarkdownView) {
        view.previewMode.rerender(true);
      }
    }
  }
  async rememberLastPuml(path) {
    if (!path || this.settings.lastOpenedPumlPath === path) return;
    this.settings.lastOpenedPumlPath = path;
    await this.saveSettings();
  }
  async activatePUMLView(file) {
    const leaf = this.app.workspace.getMostRecentLeaf() ?? this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: VIEW_TYPE_PUML,
      active: true,
      state: { file: file.path }
    });
    await this.app.workspace.revealLeaf(leaf);
  }
  buildRenderUrl(source) {
    const normalizedBase = this.getActiveServerUrl().replace(/\/+$/, "");
    const encoded = (0, import_plantuml_encoder.encode)(source);
    const format = this.settings.imageFormat;
    if (this.settings.serverType === "kroki") {
      return `${normalizedBase}/plantuml/${format}/${encoded}`;
    }
    return `${normalizedBase}/${format}/${encoded}`;
  }
  normalizedServerBase() {
    let base = this.getActiveServerUrl().replace(/\/+$/, "");
    if (this.settings.serverType === "kroki") {
      base = base.replace(/\/plantuml$/i, "");
    }
    return base;
  }
  getActiveServerUrl() {
    if (this.settings.serverType === "kroki") {
      return this.settings.krokiServerUrl;
    }
    if (this.settings.serverType === "local") {
      return this.settings.localServerUrl;
    }
    return this.settings.plantumlServerUrl;
  }
  responseContentType(response) {
    const headers = response.headers ?? {};
    return headers["content-type"] ?? headers["Content-Type"] ?? "";
  }
  async requestDiagram(source, format) {
    const normalizedBase = this.normalizedServerBase();
    if (this.settings.serverType === "kroki") {
      const accept = format === "svg" ? "image/svg+xml" : format === "png" ? "image/png" : "text/plain";
      return (0, import_obsidian.requestUrl)({
        url: `${normalizedBase}/plantuml/${format}`,
        method: "POST",
        body: source,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          Accept: accept
        },
        throw: false
      });
    }
    const encoded = (0, import_plantuml_encoder.encode)(source);
    return (0, import_obsidian.requestUrl)({
      url: `${normalizedBase}/${format}/${encoded}`,
      method: "GET",
      throw: false
    });
  }
  async fetchPngObjectUrl(source) {
    const response = await this.requestDiagram(source, "png");
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = this.responseContentType(response);
    if (contentType && !contentType.includes("image/png")) {
      throw new Error(
        `Expected PNG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`
      );
    }
    if (!response.arrayBuffer) {
      throw new Error("No PNG payload returned by render server");
    }
    const blob = new Blob([response.arrayBuffer], { type: "image/png" });
    return URL.createObjectURL(blob);
  }
  async downloadDiagramAs(source, format, baseName = "diagram") {
    const response = await this.requestDiagram(source, format);
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    let blob;
    if (format === "svg") {
      const contentType = this.responseContentType(response);
      if (contentType && !contentType.includes("image/svg")) {
        throw new Error(
          `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`
        );
      }
      if (!response.text.includes("<svg")) {
        throw new Error("Response is not SVG content.");
      }
      blob = new Blob([response.text], { type: "image/svg+xml" });
    } else {
      const contentType = this.responseContentType(response);
      if (contentType && !contentType.includes("image/png")) {
        throw new Error(
          `Expected PNG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`
        );
      }
      if (!response.arrayBuffer) {
        throw new Error("No PNG payload returned by render server");
      }
      blob = new Blob([response.arrayBuffer], { type: "image/png" });
    }
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${baseName}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
  async downloadDiagram(source, baseName = "diagram") {
    await this.downloadDiagramAs(source, this.settings.imageFormat, baseName);
  }
  async renderEmbeddedDiagramBlock(source, el, fenceWidthHintPx) {
    const { renderSource, widthHintPx } = this.extractEmbeddedWidthHint(source, fenceWidthHintPx);
    const container = el.createDiv({ cls: "puml-embed-block" });
    const actionsEl = container.createDiv({ cls: "puml-embed-actions" });
    const toggleBtn = actionsEl.createEl("button", { cls: "puml-embed-toggle" });
    const zoomBtn = actionsEl.createEl("button", { cls: "puml-embed-zoom-btn" });
    const saveBtn = actionsEl.createEl("button", { cls: "puml-embed-save-btn" });
    const copyBtn = actionsEl.createEl("button", { cls: "puml-embed-copy-btn" });
    setElementSvgIcon(zoomBtn, ICONS.zoom);
    setElementSvgIcon(saveBtn, ICONS.save);
    setElementSvgIcon(copyBtn, ICONS.copy);
    toggleBtn.setAttr("title", "Toggle code/diagram");
    toggleBtn.setAttr("aria-label", "Toggle code/diagram");
    zoomBtn.setAttr("title", "Zoom overlay");
    zoomBtn.setAttr("aria-label", "Zoom overlay");
    saveBtn.setAttr("title", "Save image");
    saveBtn.setAttr("aria-label", "Save image");
    copyBtn.setAttr("title", "Copy code");
    copyBtn.setAttr("aria-label", "Copy code");
    const diagramPane = container.createDiv({ cls: "puml-embed-diagram" });
    if (widthHintPx) {
      const align = this.settings.embeddedDiagramAlign === "left" ? { "margin-left": "0", "margin-right": "auto" } : this.settings.embeddedDiagramAlign === "right" ? { "margin-left": "auto", "margin-right": "0" } : { "margin-left": "auto", "margin-right": "auto" };
      diagramPane.setCssProps({
        "max-width": `${widthHintPx}px`,
        ...align
      });
    }
    const codePane = container.createEl("pre", { cls: "puml-embed-code" });
    const codeEl = codePane.createEl("code", { cls: "puml-embed-code-content" });
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      const lineEl = codeEl.createEl("span", { cls: "puml-embed-code-line" });
      this.renderPlantUmlHighlightedLine(lineEl, line);
      if (index < lines.length - 1) {
        lineEl.appendText("\n");
      }
    });
    codePane.hide();
    let showCode = this.settings.embeddedDefaultView === "code";
    const applyToggleState = () => {
      if (showCode) {
        diagramPane.hide();
        codePane.show();
        setElementSvgIcon(toggleBtn, ICONS.diagram);
        toggleBtn.setAttr("title", "Show diagram");
        toggleBtn.setAttr("aria-label", "Show diagram");
        zoomBtn.addClass("is-hidden");
        saveBtn.addClass("is-hidden");
        copyBtn.removeClass("is-hidden");
      } else {
        codePane.hide();
        diagramPane.show();
        setElementSvgIcon(toggleBtn, ICONS.code);
        toggleBtn.setAttr("title", "Show code");
        toggleBtn.setAttr("aria-label", "Show code");
        zoomBtn.removeClass("is-hidden");
        saveBtn.removeClass("is-hidden");
        copyBtn.addClass("is-hidden");
      }
    };
    toggleBtn.addEventListener("click", () => {
      showCode = !showCode;
      applyToggleState();
    });
    applyToggleState();
    if (!renderSource.trim()) {
      diagramPane.createDiv({ cls: "puml-embed-error", text: "PlantUML block is empty." });
      return;
    }
    const openZoomOverlay = async () => {
      const overlayEl = document.createElement("div");
      overlayEl.className = "puml-zoom-overlay";
      const panelEl = document.createElement("div");
      panelEl.className = "puml-zoom-panel";
      overlayEl.appendChild(panelEl);
      const headerEl = document.createElement("div");
      headerEl.className = "puml-zoom-header";
      panelEl.appendChild(headerEl);
      const headerSpacerEl = document.createElement("div");
      headerEl.appendChild(headerSpacerEl);
      const controlsEl = document.createElement("div");
      controlsEl.className = "puml-zoom-controls";
      headerEl.appendChild(controlsEl);
      const zoomOutBtn = document.createElement("button");
      zoomOutBtn.textContent = "-";
      controlsEl.appendChild(zoomOutBtn);
      const zoomResetBtn = document.createElement("button");
      zoomResetBtn.textContent = "100%";
      controlsEl.appendChild(zoomResetBtn);
      const zoomInBtn = document.createElement("button");
      zoomInBtn.textContent = "+";
      controlsEl.appendChild(zoomInBtn);
      const closeBtn = document.createElement("button");
      closeBtn.className = "puml-zoom-close";
      closeBtn.textContent = "Close";
      headerEl.appendChild(closeBtn);
      const contentEl = document.createElement("div");
      contentEl.className = "puml-zoom-content";
      panelEl.appendChild(contentEl);
      const canvasEl = document.createElement("div");
      canvasEl.className = "puml-zoom-canvas";
      contentEl.appendChild(canvasEl);
      const loadingEl2 = document.createElement("div");
      loadingEl2.className = "puml-loading";
      loadingEl2.textContent = "Generating diagram...";
      canvasEl.appendChild(loadingEl2);
      let zoom = 1;
      let renderedEl = null;
      let baseWidth = 0;
      let centeredInitially = false;
      let isPanning = false;
      let panStartX = 0;
      let panStartY = 0;
      let panScrollLeft = 0;
      let panScrollTop = 0;
      const clampZoom = (value) => Math.min(8, Math.max(0.1, Math.round(value * 100) / 100));
      const applyZoom = () => {
        if (!renderedEl || baseWidth <= 0) return;
        renderedEl.setCssProps({
          "max-width": "none",
          width: `${Math.max(1, Math.round(baseWidth * zoom))}px`,
          height: "auto"
        });
      };
      const setZoom = (value) => {
        zoom = clampZoom(value);
        zoomResetBtn.textContent = `${Math.round(zoom * 100)}%`;
        applyZoom();
      };
      const fitToViewport = () => {
        if (!renderedEl || baseWidth <= 0) return;
        const available = Math.max(1, contentEl.clientWidth - 12);
        setZoom(Math.min(1, available / baseWidth));
      };
      const centerViewport = () => {
        if (!renderedEl) return;
        contentEl.scrollLeft = Math.max(0, (contentEl.scrollWidth - contentEl.clientWidth) / 2);
        contentEl.scrollTop = 0;
      };
      const centerViewportOnce = () => {
        if (centeredInitially) return;
        centeredInitially = true;
        requestAnimationFrame(() => {
          centerViewport();
        });
      };
      zoomOutBtn.addEventListener("click", () => {
        setZoom(zoom - 0.1);
      });
      zoomResetBtn.addEventListener("click", () => {
        setZoom(1);
      });
      zoomInBtn.addEventListener("click", () => {
        setZoom(zoom + 0.1);
      });
      const onPanMouseMove = (event) => {
        if (!isPanning) return;
        const dx = event.clientX - panStartX;
        const dy = event.clientY - panStartY;
        contentEl.scrollLeft = panScrollLeft - dx;
        contentEl.scrollTop = panScrollTop - dy;
      };
      const stopPan = () => {
        if (!isPanning) return;
        isPanning = false;
        contentEl.classList.remove("is-panning");
      };
      const onPanMouseUp = () => {
        stopPan();
      };
      contentEl.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        if (!renderedEl) return;
        isPanning = true;
        panStartX = event.clientX;
        panStartY = event.clientY;
        panScrollLeft = contentEl.scrollLeft;
        panScrollTop = contentEl.scrollTop;
        contentEl.classList.add("is-panning");
        event.preventDefault();
      });
      contentEl.addEventListener("mouseleave", onPanMouseUp);
      window.addEventListener("mousemove", onPanMouseMove);
      window.addEventListener("mouseup", onPanMouseUp);
      const closeOverlay = () => {
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("resize", fitToViewport);
        window.removeEventListener("mousemove", onPanMouseMove);
        window.removeEventListener("mouseup", onPanMouseUp);
        overlayEl.remove();
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          closeOverlay();
        }
      };
      overlayEl.addEventListener("click", (event) => {
        if (event.target === overlayEl) {
          closeOverlay();
        }
      });
      closeBtn.addEventListener("click", closeOverlay);
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("resize", fitToViewport);
      document.body.appendChild(overlayEl);
      try {
        if (this.settings.imageFormat === "svg") {
          const response = await this.requestDiagram(renderSource, "svg");
          if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
          }
          const contentType = this.responseContentType(response);
          if (contentType && !contentType.includes("image/svg")) {
            throw new Error(
              `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`
            );
          }
          if (!response.text.includes("<svg")) {
            throw new Error("Response is not SVG content.");
          }
          loadingEl2.remove();
          const svgHost = document.createElement("div");
          const svgEl = parseSvgMarkup(response.text);
          if (svgEl) {
            svgEl.setCssProps({ display: "block" });
            let baseSvgWidth = 0;
            try {
              const bbox = svgEl.getBBox();
              if (bbox.width > 0 && bbox.height > 0) {
                svgEl.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                baseSvgWidth = bbox.width;
              }
            } catch (error) {
              console.debug("Failed to crop SVG by bbox", error);
            }
            renderedEl = svgEl;
            const viewBoxWidth = baseSvgWidth || (svgEl.viewBox?.baseVal?.width ?? 0);
            const widthAttr = Number.parseFloat(svgEl.getAttribute("width") ?? "0");
            const measuredWidth = svgEl.getBoundingClientRect().width;
            baseWidth = viewBoxWidth || widthAttr || measuredWidth || 1e3;
            fitToViewport();
            centerViewportOnce();
            svgHost.appendChild(svgEl);
          } else {
            throw new Error("Response is not valid SVG content.");
          }
          canvasEl.appendChild(svgHost);
        } else {
          const img = document.createElement("img");
          img.className = "puml-zoom-image";
          img.alt = "PlantUML diagram";
          img.setCssProps({ display: "none" });
          const objectUrl = await this.fetchPngObjectUrl(renderSource);
          img.src = objectUrl;
          canvasEl.appendChild(img);
          img.addEventListener(
            "load",
            () => {
              loadingEl2.remove();
              renderedEl = img;
              baseWidth = img.naturalWidth || img.getBoundingClientRect().width || 1e3;
              fitToViewport();
              img.setCssProps({ display: "block" });
              centerViewportOnce();
              URL.revokeObjectURL(objectUrl);
            },
            { once: true }
          );
          img.addEventListener(
            "error",
            () => {
              loadingEl2.remove();
              URL.revokeObjectURL(objectUrl);
              const errorEl = document.createElement("div");
              errorEl.className = "puml-embed-error";
              errorEl.textContent = "Failed to load PNG diagram.";
              canvasEl.appendChild(errorEl);
            },
            { once: true }
          );
        }
      } catch (error) {
        loadingEl2.remove();
        const errorEl = document.createElement("div");
        errorEl.className = "puml-embed-error";
        errorEl.textContent = `Failed to render diagram: ${error instanceof Error ? error.message : String(error)}`;
        canvasEl.appendChild(errorEl);
      }
    };
    zoomBtn.addEventListener("click", () => {
      void openZoomOverlay();
    });
    saveBtn.addEventListener("click", (event) => {
      const menu = new import_obsidian.Menu();
      menu.addItem(
        (item) => item.setTitle("Save as PNG").onClick(async () => {
          try {
            await this.downloadDiagramAs(renderSource, "png", "plantuml-diagram");
            new import_obsidian.Notice("Diagram saved as PNG");
          } catch (error) {
            new import_obsidian.Notice(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        })
      );
      menu.addItem(
        (item) => item.setTitle("Save as SVG").onClick(async () => {
          try {
            await this.downloadDiagramAs(renderSource, "svg", "plantuml-diagram");
            new import_obsidian.Notice("Diagram saved as SVG");
          } catch (error) {
            new import_obsidian.Notice(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        })
      );
      menu.showAtMouseEvent(event);
    });
    copyBtn.addEventListener("click", () => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(renderSource);
          new import_obsidian.Notice("Plantuml code copied.");
        } catch (error) {
          new import_obsidian.Notice(`Copy failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      })();
    });
    const loadingEl = diagramPane.createDiv({ cls: "puml-loading", text: "Generating diagram..." });
    try {
      if (this.settings.imageFormat === "svg") {
        const response = await this.requestDiagram(renderSource, "svg");
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = this.responseContentType(response);
        if (contentType && !contentType.includes("image/svg")) {
          throw new Error(
            `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`
          );
        }
        if (!response.text.includes("<svg")) {
          throw new Error("Response is not SVG content.");
        }
        loadingEl.remove();
        const svgHost = diagramPane.createDiv();
        const svgEl = parseSvgMarkup(response.text);
        if (svgEl) {
          svgEl.setCssProps({ width: "100%", height: "auto", display: "block" });
          svgHost.appendChild(svgEl);
        } else {
          throw new Error("Response is not valid SVG content.");
        }
      } else {
        const img = diagramPane.createEl("img", { cls: "puml-embed-image" });
        img.setCssProps({ display: "none" });
        const objectUrl = await this.fetchPngObjectUrl(renderSource);
        img.src = objectUrl;
        img.alt = "PlantUML diagram";
        img.addEventListener(
          "load",
          () => {
            loadingEl.remove();
            img.setCssProps({ display: "block" });
            URL.revokeObjectURL(objectUrl);
          },
          { once: true }
        );
        img.addEventListener(
          "error",
          () => {
            loadingEl.remove();
            URL.revokeObjectURL(objectUrl);
            diagramPane.createDiv({ cls: "puml-embed-error", text: "Failed to load PNG diagram." });
          },
          { once: true }
        );
      }
    } catch (error) {
      diagramPane.empty();
      diagramPane.createDiv({
        cls: "puml-embed-error",
        text: `Failed to render diagram: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  extractEmbeddedWidthHint(source, fenceWidthHintPx) {
    if (fenceWidthHintPx) {
      return { renderSource: source, widthHintPx: fenceWidthHintPx };
    }
    const lines = source.split("\n");
    const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
    if (firstNonEmpty === -1) {
      return { renderSource: source, widthHintPx: null };
    }
    const match = lines[firstNonEmpty].trim().match(/^\|(\d{2,4})$/);
    if (!match) {
      return { renderSource: source, widthHintPx: null };
    }
    const widthHintPx = Math.min(6e3, Math.max(120, Number(match[1])));
    lines.splice(firstNonEmpty, 1);
    return { renderSource: lines.join("\n"), widthHintPx };
  }
  extractFenceWidthHint(sectionText, source) {
    const regex = /`{3,}\s*plantuml(?:\s+\|(\d{2,4}))?\s*\n([\s\S]*?)`{3,}/gi;
    let match = regex.exec(sectionText);
    while (match) {
      const widthRaw = match[1];
      const blockSource = match[2] ?? "";
      if (blockSource.trim() === source.trim() && widthRaw) {
        return Math.min(6e3, Math.max(120, Number(widthRaw)));
      }
      match = regex.exec(sectionText);
    }
    return null;
  }
  renderPlantUmlHighlightedLine(target, line) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("'") || trimmed.startsWith("//")) {
      target.createSpan({ cls: "puml-code-comment", text: line });
      return;
    }
    const tokenRegex = /(![A-Za-z_]\w*|@[A-Za-z_]\w*|\b(?:actor|participant|boundary|control|entity|database|collections|queue|title|autonumber|skinparam|hide|show|note|left|right|of|as|alt|else|opt|loop|par|break|critical|group|end|if|then|start|stop|emit|endwhile|while|is|endif)\b|"[^"]*"|'[^']*')/gi;
    let lastIndex = 0;
    let match = tokenRegex.exec(line);
    while (match) {
      const start = match.index;
      const token = match[0];
      if (start > lastIndex) {
        target.appendText(line.slice(lastIndex, start));
      }
      let cls = "puml-code-keyword";
      if (token.startsWith("!") || token.startsWith("@")) {
        cls = "puml-code-directive";
      } else if (token.startsWith('"') || token.startsWith("'")) {
        cls = "puml-code-string";
      }
      target.createSpan({ cls, text: token });
      lastIndex = start + token.length;
      match = tokenRegex.exec(line);
    }
    if (lastIndex < line.length) {
      target.appendText(line.slice(lastIndex));
    }
  }
};
var PUMLViewerView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.currentFile = null;
    this.mode = "view";
    this.zoom = 1;
    this.editorGutterEl = null;
    this.editorEl = null;
    this.editorDraft = null;
    this.draftFilePath = null;
    this.isDirty = false;
    this.isMainPanning = false;
    this.mainPanStartX = 0;
    this.mainPanStartY = 0;
    this.mainPanScrollLeft = 0;
    this.mainPanScrollTop = 0;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_PUML;
  }
  getDisplayText() {
    return this.currentFile ? `PUML: ${this.currentFile.name}` : "PUML Viewer";
  }
  getIcon() {
    return "git-branch-plus";
  }
  async onOpen() {
    const viewContainer = this.containerEl.children[1];
    viewContainer.empty();
    viewContainer.addClass("puml-viewer-container");
    const toolbar = viewContainer.createDiv({ cls: "puml-viewer-toolbar" });
    this.viewModeBtn = toolbar.createEl("button", { text: "View" });
    this.viewModeBtn.addEventListener("click", () => {
      void this.switchMode("view");
    });
    this.editModeBtn = toolbar.createEl("button", { text: "Edit" });
    this.editModeBtn.addEventListener("click", () => {
      void this.switchMode("edit");
    });
    this.saveBtn = toolbar.createEl("button", { text: "Save" });
    this.saveBtn.addEventListener("click", () => {
      void this.saveEditor();
    });
    this.zoomOutBtn = toolbar.createEl("button", { text: "-" });
    this.zoomOutBtn.addEventListener("click", () => {
      this.setZoom(this.zoom - 0.1);
    });
    this.zoomResetBtn = toolbar.createEl("button", { text: "100%" });
    this.zoomResetBtn.addEventListener("click", () => {
      this.setZoom(1);
    });
    this.zoomInBtn = toolbar.createEl("button", { text: "+" });
    this.zoomInBtn.addEventListener("click", () => {
      this.setZoom(this.zoom + 0.1);
    });
    const refreshBtn = toolbar.createEl("button", { text: "Refresh" });
    refreshBtn.addEventListener("click", () => {
      if (this.mode === "view") {
        void this.renderDiagram();
      } else {
        void this.reloadEditorFromFile();
      }
    });
    this.exportPngBtn = toolbar.createEl("button", { cls: "puml-toolbar-icon-btn" });
    setElementSvgIcon(this.exportPngBtn, ICONS.exportPng);
    this.exportPngBtn.setAttr("title", "Save PNG image");
    this.exportPngBtn.setAttr("aria-label", "Save PNG image");
    this.exportPngBtn.addEventListener("click", () => {
      void this.exportDiagram("png");
    });
    this.exportSvgBtn = toolbar.createEl("button", { cls: "puml-toolbar-icon-btn" });
    setElementSvgIcon(this.exportSvgBtn, ICONS.exportSvg);
    this.exportSvgBtn.setAttr("title", "Save SVG image");
    this.exportSvgBtn.setAttr("aria-label", "Save SVG image");
    this.exportSvgBtn.addEventListener("click", () => {
      void this.exportDiagram("svg");
    });
    this.exportAsciiBtn = toolbar.createEl("button", { cls: "puml-toolbar-icon-btn" });
    setElementSvgIcon(this.exportAsciiBtn, ICONS.exportAscii);
    this.exportAsciiBtn.setAttr("title", "Save ASCII art");
    this.exportAsciiBtn.setAttr("aria-label", "Save ASCII art");
    this.exportAsciiBtn.addEventListener("click", () => {
      void this.exportDiagram("txt");
    });
    this.statusEl = toolbar.createDiv({ cls: "puml-viewer-status" });
    this.statusEl.setText("Waiting for file...");
    this.zoomValueEl = toolbar.createDiv({ cls: "puml-viewer-status" });
    this.imageWrapEl = viewContainer.createDiv({ cls: "puml-viewer-image-wrap" });
    this.contentHostEl = this.imageWrapEl.createDiv({ cls: "puml-viewer-content-host" });
    this.bindMainViewPanning();
    this.updateToolbarState();
    await this.loadFileFromState();
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (!this.currentFile || file.path !== this.currentFile.path) return;
        if (this.mode === "view") {
          if (this.plugin.settings.autoRefresh) {
            await this.renderDiagram();
          }
          return;
        }
        if (!this.isDirty) {
          await this.reloadEditorFromFile();
          this.statusEl.setText(`Updated from disk: ${this.currentFile.name}`);
        } else {
          this.statusEl.setText("File changed on disk. Unsaved editor changes are kept.");
        }
      })
    );
  }
  async setState(state, result) {
    await super.setState(state, result);
    if (state.mode) {
      this.mode = state.mode;
      this.updateToolbarState();
    }
    if (!state.file) return;
    const file = this.app.vault.getAbstractFileByPath(state.file);
    if (file instanceof import_obsidian.TFile) {
      this.currentFile = file;
      void this.plugin.rememberLastPuml(file.path);
      this.resetDraftIfFileChanged();
      this.updateToolbarState();
      await this.renderActiveMode();
    }
  }
  getState() {
    return { file: this.currentFile?.path, mode: this.mode };
  }
  async loadFileFromState() {
    const state = this.leaf.getViewState().state;
    if (state.mode) {
      this.mode = state.mode;
      this.updateToolbarState();
    }
    const candidates = [];
    if (state?.file) candidates.push(state.file);
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.extension === "puml") candidates.push(activeFile.path);
    if (this.plugin.settings.lastOpenedPumlPath) {
      candidates.push(this.plugin.settings.lastOpenedPumlPath);
    }
    const workspaceAny = this.app.workspace;
    const lastOpenFiles = workspaceAny.getLastOpenFiles?.() ?? [];
    for (const path of lastOpenFiles) {
      if (path.endsWith(".puml")) candidates.push(path);
    }
    const tried = /* @__PURE__ */ new Set();
    for (const path of candidates) {
      if (!path || tried.has(path)) continue;
      tried.add(path);
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian.TFile && file.extension === "puml") {
        this.currentFile = file;
        void this.plugin.rememberLastPuml(file.path);
        this.resetDraftIfFileChanged();
        this.updateToolbarState();
        await this.renderActiveMode();
        return;
      }
    }
    await this.renderActiveMode();
  }
  async switchMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.updateToolbarState();
    await this.renderActiveMode();
  }
  async renderActiveMode() {
    if (!this.contentHostEl) return;
    if (this.mode === "edit") {
      await this.renderEditor();
      return;
    }
    await this.renderDiagram();
  }
  updateToolbarState() {
    if (!this.viewModeBtn || !this.editModeBtn || !this.saveBtn || !this.zoomOutBtn || !this.zoomResetBtn || !this.zoomInBtn || !this.exportPngBtn || !this.exportSvgBtn || !this.exportAsciiBtn)
      return;
    this.viewModeBtn.toggleClass("is-active", this.mode === "view");
    this.editModeBtn.toggleClass("is-active", this.mode === "edit");
    this.saveBtn.disabled = this.mode !== "edit";
    const zoomDisabled = this.mode !== "view";
    this.zoomOutBtn.disabled = zoomDisabled;
    this.zoomResetBtn.disabled = zoomDisabled;
    this.zoomInBtn.disabled = zoomDisabled;
    const exportDisabled = zoomDisabled || !this.currentFile;
    this.exportPngBtn.disabled = exportDisabled;
    this.exportSvgBtn.disabled = exportDisabled;
    this.exportAsciiBtn.disabled = exportDisabled;
    this.updateZoomLabel();
  }
  resetDraftIfFileChanged() {
    const filePath = this.currentFile?.path ?? null;
    if (filePath && this.draftFilePath !== filePath) {
      this.editorDraft = null;
      this.isDirty = false;
      this.draftFilePath = filePath;
    }
  }
  async renderEditor() {
    this.contentHostEl.empty();
    this.contentHostEl.addClass("puml-viewer-content-host--editor");
    this.contentHostEl.removeClass("puml-viewer-content-host--view");
    this.imageWrapEl.removeClass("puml-viewer-image-wrap--view");
    this.imageWrapEl.removeClass("is-pan-enabled");
    this.imageWrapEl.removeClass("is-panning");
    this.isMainPanning = false;
    if (!this.currentFile) {
      this.statusEl.setText("No .puml file selected.");
      return;
    }
    try {
      const initialText = this.draftFilePath === this.currentFile.path && this.editorDraft !== null ? this.editorDraft : await this.app.vault.read(this.currentFile);
      this.editorDraft = initialText;
      this.draftFilePath = this.currentFile.path;
      const editorShell = this.contentHostEl.createDiv({ cls: "puml-viewer-editor-shell" });
      this.editorGutterEl = editorShell.createDiv({ cls: "puml-viewer-editor-gutter" });
      this.editorEl = editorShell.createEl("textarea", { cls: "puml-viewer-editor" });
      this.editorEl.value = initialText;
      this.updateEditorLineNumbers(initialText);
      this.editorEl.addEventListener("input", () => {
        if (!this.editorEl) return;
        this.editorDraft = this.editorEl.value;
        this.isDirty = true;
        this.updateEditorLineNumbers(this.editorEl.value);
        this.statusEl.setText(`Editing: ${this.currentFile?.name ?? ""} (unsaved)`);
      });
      this.editorEl.addEventListener("scroll", () => {
        if (!this.editorEl || !this.editorGutterEl) return;
        this.editorGutterEl.scrollTop = this.editorEl.scrollTop;
      });
      this.editorEl.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          void this.saveEditor();
        }
      });
      this.statusEl.setText(`Editing: ${this.currentFile.name}`);
    } catch (error) {
      console.error(error);
      this.statusEl.setText("Failed to open editor.");
      const errorEl = this.contentHostEl.createDiv({ cls: "puml-viewer-error" });
      errorEl.setText(
        `Failed to load source text.

${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  async reloadEditorFromFile() {
    if (!this.currentFile || !this.editorEl) return;
    try {
      const source = await this.app.vault.read(this.currentFile);
      this.editorDraft = source;
      this.draftFilePath = this.currentFile.path;
      this.editorEl.value = source;
      this.updateEditorLineNumbers(source);
      this.isDirty = false;
    } catch (error) {
      console.error(error);
      this.statusEl.setText("Failed to reload source.");
    }
  }
  async saveEditor() {
    if (!this.currentFile || !this.editorEl || this.mode !== "edit") return;
    try {
      const text = this.editorEl.value;
      await this.app.vault.modify(this.currentFile, text);
      this.editorDraft = text;
      this.draftFilePath = this.currentFile.path;
      this.isDirty = false;
      this.statusEl.setText(`Saved: ${this.currentFile.name}`);
      new import_obsidian.Notice("Plantuml source saved.");
    } catch (error) {
      console.error(error);
      this.statusEl.setText("Save failed.");
      new import_obsidian.Notice("Failed to save plantuml source.");
    }
  }
  async exportDiagram(format) {
    if (this.mode !== "view" || !this.currentFile) return;
    try {
      const source = await this.app.vault.read(this.currentFile);
      if (!source.trim()) {
        new import_obsidian.Notice("Plantuml file is empty.");
        return;
      }
      const outputPath = (0, import_obsidian.normalizePath)(
        this.currentFile.path.replace(/\.puml$/i, `.${format}`)
      );
      const response = await this.plugin.requestDiagram(source, format);
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      const existing = this.app.vault.getAbstractFileByPath(outputPath);
      if (format === "svg") {
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes("image/svg")) {
          throw new Error(`Expected SVG but got "${contentType}"`);
        }
        if (existing instanceof import_obsidian.TFile) {
          await this.app.vault.modify(existing, response.text);
        } else {
          await this.app.vault.create(outputPath, response.text);
        }
      } else if (format === "png") {
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes("image/png")) {
          throw new Error(`Expected PNG but got "${contentType}"`);
        }
        if (!response.arrayBuffer) {
          throw new Error("No PNG payload returned by render server");
        }
        if (existing instanceof import_obsidian.TFile) {
          await this.app.vault.modifyBinary(existing, response.arrayBuffer);
        } else {
          await this.app.vault.createBinary(outputPath, response.arrayBuffer);
        }
      } else {
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes("text/plain")) {
          throw new Error(`Expected text/plain but got "${contentType}"`);
        }
        if (existing instanceof import_obsidian.TFile) {
          await this.app.vault.modify(existing, response.text);
        } else {
          await this.app.vault.create(outputPath, response.text);
        }
      }
      this.statusEl.setText(`Exported: ${outputPath}`);
      new import_obsidian.Notice(`Diagram exported: ${outputPath}`);
    } catch (error) {
      console.error(error);
      this.statusEl.setText("Export failed.");
      new import_obsidian.Notice(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async renderDiagram() {
    this.contentHostEl.empty();
    this.contentHostEl.removeClass("puml-viewer-content-host--editor");
    this.contentHostEl.addClass("puml-viewer-content-host--view");
    this.imageWrapEl.addClass("puml-viewer-image-wrap--view");
    this.editorGutterEl = null;
    this.editorEl = null;
    if (!this.currentFile) {
      this.statusEl.setText("No .puml file selected.");
      return;
    }
    try {
      const source = await this.app.vault.read(this.currentFile);
      if (!source.trim()) {
        this.statusEl.setText("File is empty.");
        return;
      }
      this.statusEl.setText(`Rendering: ${this.currentFile.name}`);
      const renderRoot = this.contentHostEl.createDiv({ cls: "puml-viewer-render-root" });
      const loadingEl = renderRoot.createDiv({ cls: "puml-loading", text: "Generating diagram..." });
      if (this.plugin.settings.imageFormat === "svg") {
        const response = await this.plugin.requestDiagram(source, "svg");
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = this.plugin.responseContentType(response);
        if (contentType && !contentType.includes("image/svg")) {
          throw new Error(
            `Expected SVG but got "${contentType}". Check Server type/URL (for Kroki use https://kroki.io).`
          );
        }
        if (!response.text.includes("<svg")) {
          throw new Error("Response is not SVG content.");
        }
        loadingEl.remove();
        const svgHost = renderRoot.createDiv();
        const svgEl = parseSvgMarkup(response.text);
        if (!svgEl) {
          throw new Error("Response is not valid SVG content.");
        }
        svgHost.appendChild(svgEl);
      } else {
        const img = renderRoot.createEl("img", {
          cls: "puml-viewer-image"
        });
        img.setCssProps({ display: "none" });
        const objectUrl = await this.plugin.fetchPngObjectUrl(source);
        img.src = objectUrl;
        img.alt = this.currentFile.name;
        img.addEventListener(
          "load",
          () => {
            loadingEl.remove();
            img.setCssProps({ display: "block" });
            this.statusEl.setText(`Rendered: ${this.currentFile?.name ?? ""}`);
            URL.revokeObjectURL(objectUrl);
          },
          { once: true }
        );
        img.addEventListener(
          "error",
          () => {
            loadingEl.remove();
            this.statusEl.setText("Render failed.");
            const errorEl = renderRoot.createDiv({ cls: "puml-viewer-error" });
            errorEl.setText("Failed to load PNG diagram.");
            URL.revokeObjectURL(objectUrl);
          },
          { once: true }
        );
      }
      this.fitToWidth();
      this.refreshMainPanAvailability();
      if (this.plugin.settings.imageFormat === "svg") {
        this.statusEl.setText(`Rendered: ${this.currentFile.name}`);
      }
    } catch (error) {
      console.error(error);
      this.statusEl.setText("Render failed.");
      const errorEl = this.contentHostEl.createDiv({ cls: "puml-viewer-error" });
      errorEl.setText(
        `Failed to render diagram.

${error instanceof Error ? error.message : String(error)}`
      );
      new import_obsidian.Notice("Plantuml render failed.");
    }
  }
  setZoom(value) {
    const nextZoom = Math.min(4, Math.max(0.25, Math.round(value * 100) / 100));
    this.zoom = nextZoom;
    this.applyZoom();
    this.refreshMainPanAvailability();
    this.updateZoomLabel();
  }
  fitToWidth() {
    const renderRoot = this.contentHostEl?.querySelector(".puml-viewer-render-root");
    if (!renderRoot || !this.imageWrapEl) return;
    const imageEl = renderRoot.querySelector(".puml-viewer-image");
    if (imageEl) {
      const baseWidth2 = this.getImageBaseWidth(imageEl);
      if (!(baseWidth2 > 0)) {
        imageEl.addEventListener(
          "load",
          () => {
            this.fitToWidth();
          },
          { once: true }
        );
        return;
      }
      const availableWidth2 = Math.max(1, this.imageWrapEl.clientWidth - 24);
      this.setZoom(Math.min(1, availableWidth2 / baseWidth2));
      return;
    }
    const svgEl = renderRoot.querySelector("svg");
    if (!svgEl) return;
    const baseWidth = this.getSvgBaseWidth(svgEl);
    if (!(baseWidth > 0)) return;
    const availableWidth = Math.max(1, this.imageWrapEl.clientWidth - 24);
    this.setZoom(Math.min(1, availableWidth / baseWidth));
  }
  updateZoomLabel() {
    if (!this.zoomValueEl) return;
    this.zoomValueEl.setText(`Zoom: ${Math.round(this.zoom * 100)}%`);
  }
  applyZoom() {
    const renderRoot = this.contentHostEl?.querySelector(".puml-viewer-render-root");
    if (!renderRoot) return;
    const imageEl = renderRoot.querySelector(".puml-viewer-image");
    if (imageEl) {
      const baseWidth2 = this.getImageBaseWidth(imageEl);
      if (baseWidth2 > 0) {
        imageEl.setCssProps({
          "max-width": "none",
          width: `${Math.max(1, Math.round(baseWidth2 * this.zoom))}px`,
          height: "auto"
        });
      } else {
        imageEl.addEventListener(
          "load",
          () => {
            this.applyZoom();
          },
          { once: true }
        );
      }
      return;
    }
    const svgEl = renderRoot.querySelector("svg");
    if (!svgEl) return;
    const baseWidth = this.getSvgBaseWidth(svgEl);
    if (!(baseWidth > 0)) return;
    svgEl.setCssProps({
      "max-width": "none",
      width: `${Math.max(1, Math.round(baseWidth * this.zoom))}px`,
      height: "auto"
    });
  }
  bindMainViewPanning() {
    this.registerDomEvent(this.imageWrapEl, "mousedown", (event) => {
      if (event.button !== 0) return;
      if (this.mode !== "view") return;
      if (!this.canMainPan()) return;
      this.isMainPanning = true;
      this.mainPanStartX = event.clientX;
      this.mainPanStartY = event.clientY;
      this.mainPanScrollLeft = this.imageWrapEl.scrollLeft;
      this.mainPanScrollTop = this.imageWrapEl.scrollTop;
      this.imageWrapEl.addClass("is-panning");
      event.preventDefault();
    });
    this.registerDomEvent(window, "mousemove", (event) => {
      if (!this.isMainPanning) return;
      const dx = event.clientX - this.mainPanStartX;
      const dy = event.clientY - this.mainPanStartY;
      this.imageWrapEl.scrollLeft = this.mainPanScrollLeft - dx;
      this.imageWrapEl.scrollTop = this.mainPanScrollTop - dy;
      event.preventDefault();
    });
    const stopPanning = () => {
      if (!this.isMainPanning) return;
      this.isMainPanning = false;
      this.imageWrapEl.removeClass("is-panning");
    };
    this.registerDomEvent(window, "mouseup", stopPanning);
    this.registerDomEvent(this.imageWrapEl, "mouseleave", stopPanning);
  }
  canMainPan() {
    const hasHorizontal = this.imageWrapEl.scrollWidth > this.imageWrapEl.clientWidth + 1;
    const hasVertical = this.imageWrapEl.scrollHeight > this.imageWrapEl.clientHeight + 1;
    return hasHorizontal || hasVertical;
  }
  refreshMainPanAvailability() {
    if (this.mode !== "view") {
      this.imageWrapEl.removeClass("is-pan-enabled");
      return;
    }
    this.imageWrapEl.toggleClass("is-pan-enabled", this.canMainPan());
  }
  getImageBaseWidth(imageEl) {
    const storedBaseWidth = Number(imageEl.dataset.baseWidth ?? 0);
    const measuredWidth = imageEl.naturalWidth || imageEl.clientWidth || imageEl.getBoundingClientRect().width;
    const baseWidth = storedBaseWidth > 0 ? storedBaseWidth : measuredWidth;
    if (baseWidth > 0) {
      imageEl.dataset.baseWidth = String(baseWidth);
    }
    return baseWidth;
  }
  getSvgBaseWidth(svgEl) {
    const storedBaseWidth = Number(svgEl.dataset.baseWidth ?? 0);
    let baseWidth = storedBaseWidth;
    if (!(baseWidth > 0)) {
      const viewBoxWidth = svgEl.viewBox?.baseVal?.width ?? 0;
      const widthAttr = Number.parseFloat(svgEl.getAttribute("width") ?? "0");
      const measuredWidth = svgEl.getBoundingClientRect().width;
      baseWidth = viewBoxWidth || widthAttr || measuredWidth;
    }
    if (baseWidth > 0) {
      svgEl.dataset.baseWidth = String(baseWidth);
    }
    return baseWidth;
  }
  updateEditorLineNumbers(text) {
    if (!this.editorGutterEl) return;
    this.editorGutterEl.empty();
    const lineCount = Math.max(1, text.split("\n").length);
    for (let i = 1; i <= lineCount; i++) {
      this.editorGutterEl.createDiv({ cls: "puml-viewer-editor-line", text: String(i) });
    }
  }
};
var PUMLViewerSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Plantuml viewer").setHeading();
    new import_obsidian.Setting(containerEl).setName("Server type").setDesc("Choose which server URL to use for rendering.").addDropdown(
      (dropdown) => dropdown.addOption("plantuml", "Plantuml").addOption("kroki", "Kroki").addOption("local", "Local").setValue(this.plugin.settings.serverType).onChange(async (value) => {
        this.plugin.settings.serverType = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Plantuml url").setDesc("Example: https://www.plantuml.com/plantuml").addText(
      (text) => text.setPlaceholder("https://www.plantuml.com/plantuml").setValue(this.plugin.settings.plantumlServerUrl).onChange(async (value) => {
        this.plugin.settings.plantumlServerUrl = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Kroki URL").setDesc("Example: https://kroki.io").addText(
      (text) => text.setPlaceholder("https://kroki.io").setValue(this.plugin.settings.krokiServerUrl).onChange(async (value) => {
        this.plugin.settings.krokiServerUrl = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Local URL").setDesc("For example: http://localhost:8000.").addText(
      (text) => text.setPlaceholder("For example: http://localhost:8000").setValue(this.plugin.settings.localServerUrl).onChange(async (value) => {
        this.plugin.settings.localServerUrl = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Image format").setDesc("SVG is recommended.").addDropdown(
      (dropdown) => dropdown.addOption("svg", "SVG").addOption("png", "PNG").setValue(this.plugin.settings.imageFormat).onChange(async (value) => {
        this.plugin.settings.imageFormat = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Auto refresh").setDesc("Automatically re-render diagram when the .puml file changes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoRefresh).onChange(async (value) => {
        this.plugin.settings.autoRefresh = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Embedded block default view").setDesc("Choose what to show first in markdown plantuml blocks.").addDropdown(
      (dropdown) => dropdown.addOption("diagram", "Diagram").addOption("code", "Code").setValue(this.plugin.settings.embeddedDefaultView).onChange(async (value) => {
        this.plugin.settings.embeddedDefaultView = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Embedded diagram alignment").setDesc("Default alignment for diagram in a markdown plantuml block.").addDropdown(
      (dropdown) => dropdown.addOption("left", "Left").addOption("center", "Center").addOption("right", "Right").setValue(this.plugin.settings.embeddedDiagramAlign).onChange(async (value) => {
        this.plugin.settings.embeddedDiagramAlign = value;
        await this.plugin.saveSettings();
        this.plugin.rerenderMarkdownPreviews();
      })
    );
  }
};
