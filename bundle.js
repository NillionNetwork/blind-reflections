(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod2) => function __require() {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  };
  var __export = (target, all) => {
    for (var name2 in all)
      __defProp(target, name2, { get: all[name2], enumerable: true });
  };
  var __copyProps = (to, from3, except, desc) => {
    if (from3 && typeof from3 === "object" || typeof from3 === "function") {
      for (let key of __getOwnPropNames(from3))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from3[key], enumerable: !(desc = __getOwnPropDesc(from3, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
    mod2
  ));

  // node_modules/base64-js/index.js
  var require_base64_js = __commonJS({
    "node_modules/base64-js/index.js"(exports) {
      "use strict";
      exports.byteLength = byteLength;
      exports.toByteArray = toByteArray;
      exports.fromByteArray = fromByteArray;
      var lookup = [];
      var revLookup = [];
      var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      var code2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (i = 0, len = code2.length; i < len; ++i) {
        lookup[i] = code2[i];
        revLookup[code2.charCodeAt(i)] = i;
      }
      var i;
      var len;
      revLookup["-".charCodeAt(0)] = 62;
      revLookup["_".charCodeAt(0)] = 63;
      function getLens(b64) {
        var len2 = b64.length;
        if (len2 % 4 > 0) {
          throw new Error("Invalid string. Length must be a multiple of 4");
        }
        var validLen = b64.indexOf("=");
        if (validLen === -1) validLen = len2;
        var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
        return [validLen, placeHoldersLen];
      }
      function byteLength(b64) {
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function _byteLength(b64, validLen, placeHoldersLen) {
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function toByteArray(b64) {
        var tmp;
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
        var curByte = 0;
        var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
        var i2;
        for (i2 = 0; i2 < len2; i2 += 4) {
          tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
          arr[curByte++] = tmp >> 16 & 255;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 2) {
          tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 1) {
          tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        return arr;
      }
      function tripletToBase64(num) {
        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
      }
      function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];
        for (var i2 = start; i2 < end; i2 += 3) {
          tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
          output.push(tripletToBase64(tmp));
        }
        return output.join("");
      }
      function fromByteArray(uint8) {
        var tmp;
        var len2 = uint8.length;
        var extraBytes = len2 % 3;
        var parts = [];
        var maxChunkLength = 16383;
        for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
          parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
        }
        if (extraBytes === 1) {
          tmp = uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
          );
        } else if (extraBytes === 2) {
          tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
          );
        }
        return parts.join("");
      }
    }
  });

  // node_modules/ieee754/index.js
  var require_ieee754 = __commonJS({
    "node_modules/ieee754/index.js"(exports) {
      exports.read = function(buffer, offset, isLE2, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE2 ? nBytes - 1 : 0;
        var d = isLE2 ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };
      exports.write = function(buffer, value, offset, isLE2, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE2 ? 0 : nBytes - 1;
        var d = isLE2 ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
        }
        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
        }
        buffer[offset + i - d] |= s * 128;
      };
    }
  });

  // node_modules/buffer/index.js
  var require_buffer = __commonJS({
    "node_modules/buffer/index.js"(exports) {
      "use strict";
      var base642 = require_base64_js();
      var ieee754 = require_ieee754();
      var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
      exports.Buffer = Buffer3;
      exports.SlowBuffer = SlowBuffer;
      exports.INSPECT_MAX_BYTES = 50;
      var K_MAX_LENGTH = 2147483647;
      exports.kMaxLength = K_MAX_LENGTH;
      Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
      if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
        );
      }
      function typedArraySupport() {
        try {
          const arr = new Uint8Array(1);
          const proto = { foo: function() {
            return 42;
          } };
          Object.setPrototypeOf(proto, Uint8Array.prototype);
          Object.setPrototypeOf(arr, proto);
          return arr.foo() === 42;
        } catch (e) {
          return false;
        }
      }
      Object.defineProperty(Buffer3.prototype, "parent", {
        enumerable: true,
        get: function() {
          if (!Buffer3.isBuffer(this)) return void 0;
          return this.buffer;
        }
      });
      Object.defineProperty(Buffer3.prototype, "offset", {
        enumerable: true,
        get: function() {
          if (!Buffer3.isBuffer(this)) return void 0;
          return this.byteOffset;
        }
      });
      function createBuffer(length2) {
        if (length2 > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length2 + '" is invalid for option "size"');
        }
        const buf = new Uint8Array(length2);
        Object.setPrototypeOf(buf, Buffer3.prototype);
        return buf;
      }
      function Buffer3(arg, encodingOrOffset, length2) {
        if (typeof arg === "number") {
          if (typeof encodingOrOffset === "string") {
            throw new TypeError(
              'The "string" argument must be of type string. Received type number'
            );
          }
          return allocUnsafe2(arg);
        }
        return from3(arg, encodingOrOffset, length2);
      }
      Buffer3.poolSize = 8192;
      function from3(value, encodingOrOffset, length2) {
        if (typeof value === "string") {
          return fromString3(value, encodingOrOffset);
        }
        if (ArrayBuffer.isView(value)) {
          return fromArrayView(value);
        }
        if (value == null) {
          throw new TypeError(
            "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
          );
        }
        if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
          return fromArrayBuffer(value, encodingOrOffset, length2);
        }
        if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length2);
        }
        if (typeof value === "number") {
          throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
          );
        }
        const valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value) {
          return Buffer3.from(valueOf, encodingOrOffset, length2);
        }
        const b = fromObject(value);
        if (b) return b;
        if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
          return Buffer3.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length2);
        }
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      Buffer3.from = function(value, encodingOrOffset, length2) {
        return from3(value, encodingOrOffset, length2);
      };
      Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
      Object.setPrototypeOf(Buffer3, Uint8Array);
      function assertSize(size) {
        if (typeof size !== "number") {
          throw new TypeError('"size" argument must be of type number');
        } else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
      }
      function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
          return createBuffer(size);
        }
        if (fill !== void 0) {
          return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
        }
        return createBuffer(size);
      }
      Buffer3.alloc = function(size, fill, encoding) {
        return alloc(size, fill, encoding);
      };
      function allocUnsafe2(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
      }
      Buffer3.allocUnsafe = function(size) {
        return allocUnsafe2(size);
      };
      Buffer3.allocUnsafeSlow = function(size) {
        return allocUnsafe2(size);
      };
      function fromString3(string2, encoding) {
        if (typeof encoding !== "string" || encoding === "") {
          encoding = "utf8";
        }
        if (!Buffer3.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        const length2 = byteLength(string2, encoding) | 0;
        let buf = createBuffer(length2);
        const actual = buf.write(string2, encoding);
        if (actual !== length2) {
          buf = buf.slice(0, actual);
        }
        return buf;
      }
      function fromArrayLike(array) {
        const length2 = array.length < 0 ? 0 : checked(array.length) | 0;
        const buf = createBuffer(length2);
        for (let i = 0; i < length2; i += 1) {
          buf[i] = array[i] & 255;
        }
        return buf;
      }
      function fromArrayView(arrayView) {
        if (isInstance(arrayView, Uint8Array)) {
          const copy = new Uint8Array(arrayView);
          return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
        }
        return fromArrayLike(arrayView);
      }
      function fromArrayBuffer(array, byteOffset, length2) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds');
        }
        if (array.byteLength < byteOffset + (length2 || 0)) {
          throw new RangeError('"length" is outside of buffer bounds');
        }
        let buf;
        if (byteOffset === void 0 && length2 === void 0) {
          buf = new Uint8Array(array);
        } else if (length2 === void 0) {
          buf = new Uint8Array(array, byteOffset);
        } else {
          buf = new Uint8Array(array, byteOffset, length2);
        }
        Object.setPrototypeOf(buf, Buffer3.prototype);
        return buf;
      }
      function fromObject(obj) {
        if (Buffer3.isBuffer(obj)) {
          const len = checked(obj.length) | 0;
          const buf = createBuffer(len);
          if (buf.length === 0) {
            return buf;
          }
          obj.copy(buf, 0, 0, len);
          return buf;
        }
        if (obj.length !== void 0) {
          if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
            return createBuffer(0);
          }
          return fromArrayLike(obj);
        }
        if (obj.type === "Buffer" && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data);
        }
      }
      function checked(length2) {
        if (length2 >= K_MAX_LENGTH) {
          throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        }
        return length2 | 0;
      }
      function SlowBuffer(length2) {
        if (+length2 != length2) {
          length2 = 0;
        }
        return Buffer3.alloc(+length2);
      }
      Buffer3.isBuffer = function isBuffer(b) {
        return b != null && b._isBuffer === true && b !== Buffer3.prototype;
      };
      Buffer3.compare = function compare2(a, b) {
        if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
        if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
        if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) {
          throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
          );
        }
        if (a === b) return 0;
        let x = a.length;
        let y = b.length;
        for (let i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      Buffer3.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "latin1":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return true;
          default:
            return false;
        }
      };
      Buffer3.concat = function concat2(list, length2) {
        if (!Array.isArray(list)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        }
        if (list.length === 0) {
          return Buffer3.alloc(0);
        }
        let i;
        if (length2 === void 0) {
          length2 = 0;
          for (i = 0; i < list.length; ++i) {
            length2 += list[i].length;
          }
        }
        const buffer = Buffer3.allocUnsafe(length2);
        let pos = 0;
        for (i = 0; i < list.length; ++i) {
          let buf = list[i];
          if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
              if (!Buffer3.isBuffer(buf)) buf = Buffer3.from(buf);
              buf.copy(buffer, pos);
            } else {
              Uint8Array.prototype.set.call(
                buffer,
                buf,
                pos
              );
            }
          } else if (!Buffer3.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
          } else {
            buf.copy(buffer, pos);
          }
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string2, encoding) {
        if (Buffer3.isBuffer(string2)) {
          return string2.length;
        }
        if (ArrayBuffer.isView(string2) || isInstance(string2, ArrayBuffer)) {
          return string2.byteLength;
        }
        if (typeof string2 !== "string") {
          throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string2
          );
        }
        const len = string2.length;
        const mustMatch = arguments.length > 2 && arguments[2] === true;
        if (!mustMatch && len === 0) return 0;
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "ascii":
            case "latin1":
            case "binary":
              return len;
            case "utf8":
            case "utf-8":
              return utf8ToBytes2(string2).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return len * 2;
            case "hex":
              return len >>> 1;
            case "base64":
              return base64ToBytes2(string2).length;
            default:
              if (loweredCase) {
                return mustMatch ? -1 : utf8ToBytes2(string2).length;
              }
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer3.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        let loweredCase = false;
        if (start === void 0 || start < 0) {
          start = 0;
        }
        if (start > this.length) {
          return "";
        }
        if (end === void 0 || end > this.length) {
          end = this.length;
        }
        if (end <= 0) {
          return "";
        }
        end >>>= 0;
        start >>>= 0;
        if (end <= start) {
          return "";
        }
        if (!encoding) encoding = "utf8";
        while (true) {
          switch (encoding) {
            case "hex":
              return hexSlice(this, start, end);
            case "utf8":
            case "utf-8":
              return utf8Slice(this, start, end);
            case "ascii":
              return asciiSlice(this, start, end);
            case "latin1":
            case "binary":
              return latin1Slice(this, start, end);
            case "base64":
              return base64Slice(this, start, end);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return utf16leSlice(this, start, end);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = (encoding + "").toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer3.prototype._isBuffer = true;
      function swap(b, n, m) {
        const i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer3.prototype.swap16 = function swap16() {
        const len = this.length;
        if (len % 2 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 16-bits");
        }
        for (let i = 0; i < len; i += 2) {
          swap(this, i, i + 1);
        }
        return this;
      };
      Buffer3.prototype.swap32 = function swap32() {
        const len = this.length;
        if (len % 4 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 32-bits");
        }
        for (let i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer3.prototype.swap64 = function swap64() {
        const len = this.length;
        if (len % 8 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 64-bits");
        }
        for (let i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer3.prototype.toString = function toString3() {
        const length2 = this.length;
        if (length2 === 0) return "";
        if (arguments.length === 0) return utf8Slice(this, 0, length2);
        return slowToString.apply(this, arguments);
      };
      Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
      Buffer3.prototype.equals = function equals4(b) {
        if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return Buffer3.compare(this, b) === 0;
      };
      Buffer3.prototype.inspect = function inspect() {
        let str = "";
        const max = exports.INSPECT_MAX_BYTES;
        str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
        if (this.length > max) str += " ... ";
        return "<Buffer " + str + ">";
      };
      if (customInspectSymbol) {
        Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
      }
      Buffer3.prototype.compare = function compare2(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer3.from(target, target.offset, target.byteLength);
        }
        if (!Buffer3.isBuffer(target)) {
          throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
          );
        }
        if (start === void 0) {
          start = 0;
        }
        if (end === void 0) {
          end = target ? target.length : 0;
        }
        if (thisStart === void 0) {
          thisStart = 0;
        }
        if (thisEnd === void 0) {
          thisEnd = this.length;
        }
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError("out of range index");
        }
        if (thisStart >= thisEnd && start >= end) {
          return 0;
        }
        if (thisStart >= thisEnd) {
          return -1;
        }
        if (start >= end) {
          return 1;
        }
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target) return 0;
        let x = thisEnd - thisStart;
        let y = end - start;
        const len = Math.min(x, y);
        const thisCopy = this.slice(thisStart, thisEnd);
        const targetCopy = target.slice(start, end);
        for (let i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (buffer.length === 0) return -1;
        if (typeof byteOffset === "string") {
          encoding = byteOffset;
          byteOffset = 0;
        } else if (byteOffset > 2147483647) {
          byteOffset = 2147483647;
        } else if (byteOffset < -2147483648) {
          byteOffset = -2147483648;
        }
        byteOffset = +byteOffset;
        if (numberIsNaN(byteOffset)) {
          byteOffset = dir ? 0 : buffer.length - 1;
        }
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
          if (dir) return -1;
          else byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (dir) byteOffset = 0;
          else return -1;
        }
        if (typeof val === "string") {
          val = Buffer3.from(val, encoding);
        }
        if (Buffer3.isBuffer(val)) {
          if (val.length === 0) {
            return -1;
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        } else if (typeof val === "number") {
          val = val & 255;
          if (typeof Uint8Array.prototype.indexOf === "function") {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
          }
          return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        let indexSize = 1;
        let arrLength = arr.length;
        let valLength = val.length;
        if (encoding !== void 0) {
          encoding = String(encoding).toLowerCase();
          if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
            if (arr.length < 2 || val.length < 2) {
              return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read2(buf, i2) {
          if (indexSize === 1) {
            return buf[i2];
          } else {
            return buf.readUInt16BE(i2 * indexSize);
          }
        }
        let i;
        if (dir) {
          let foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) {
            if (read2(arr, i) === read2(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1) foundIndex = i;
              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
              if (foundIndex !== -1) i -= i - foundIndex;
              foundIndex = -1;
            }
          }
        } else {
          if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
          for (i = byteOffset; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < valLength; j++) {
              if (read2(arr, i + j) !== read2(val, j)) {
                found = false;
                break;
              }
            }
            if (found) return i;
          }
        }
        return -1;
      }
      Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string2, offset, length2) {
        offset = Number(offset) || 0;
        const remaining = buf.length - offset;
        if (!length2) {
          length2 = remaining;
        } else {
          length2 = Number(length2);
          if (length2 > remaining) {
            length2 = remaining;
          }
        }
        const strLen = string2.length;
        if (length2 > strLen / 2) {
          length2 = strLen / 2;
        }
        let i;
        for (i = 0; i < length2; ++i) {
          const parsed = parseInt(string2.substr(i * 2, 2), 16);
          if (numberIsNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string2, offset, length2) {
        return blitBuffer(utf8ToBytes2(string2, buf.length - offset), buf, offset, length2);
      }
      function asciiWrite(buf, string2, offset, length2) {
        return blitBuffer(asciiToBytes(string2), buf, offset, length2);
      }
      function base64Write(buf, string2, offset, length2) {
        return blitBuffer(base64ToBytes2(string2), buf, offset, length2);
      }
      function ucs2Write(buf, string2, offset, length2) {
        return blitBuffer(utf16leToBytes(string2, buf.length - offset), buf, offset, length2);
      }
      Buffer3.prototype.write = function write(string2, offset, length2, encoding) {
        if (offset === void 0) {
          encoding = "utf8";
          length2 = this.length;
          offset = 0;
        } else if (length2 === void 0 && typeof offset === "string") {
          encoding = offset;
          length2 = this.length;
          offset = 0;
        } else if (isFinite(offset)) {
          offset = offset >>> 0;
          if (isFinite(length2)) {
            length2 = length2 >>> 0;
            if (encoding === void 0) encoding = "utf8";
          } else {
            encoding = length2;
            length2 = void 0;
          }
        } else {
          throw new Error(
            "Buffer.write(string, encoding, offset[, length]) is no longer supported"
          );
        }
        const remaining = this.length - offset;
        if (length2 === void 0 || length2 > remaining) length2 = remaining;
        if (string2.length > 0 && (length2 < 0 || offset < 0) || offset > this.length) {
          throw new RangeError("Attempt to write outside buffer bounds");
        }
        if (!encoding) encoding = "utf8";
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "hex":
              return hexWrite(this, string2, offset, length2);
            case "utf8":
            case "utf-8":
              return utf8Write(this, string2, offset, length2);
            case "ascii":
            case "latin1":
            case "binary":
              return asciiWrite(this, string2, offset, length2);
            case "base64":
              return base64Write(this, string2, offset, length2);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return ucs2Write(this, string2, offset, length2);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      };
      Buffer3.prototype.toJSON = function toJSON() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
          return base642.fromByteArray(buf);
        } else {
          return base642.fromByteArray(buf.slice(start, end));
        }
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        const res = [];
        let i = start;
        while (i < end) {
          const firstByte = buf[i];
          let codePoint = null;
          let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 128) {
                  codePoint = firstByte;
                }
                break;
              case 2:
                secondByte = buf[i + 1];
                if ((secondByte & 192) === 128) {
                  tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                  if (tempCodePoint > 127) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 3:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 4:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                fourthByte = buf[i + 3];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                    codePoint = tempCodePoint;
                  }
                }
            }
          }
          if (codePoint === null) {
            codePoint = 65533;
            bytesPerSequence = 1;
          } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | codePoint & 1023;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
      var MAX_ARGUMENTS_LENGTH = 4096;
      function decodeCodePointsArray(codePoints) {
        const len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints);
        }
        let res = "";
        let i = 0;
        while (i < len) {
          res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
          );
        }
        return res;
      }
      function asciiSlice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 127);
        }
        return ret;
      }
      function latin1Slice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i]);
        }
        return ret;
      }
      function hexSlice(buf, start, end) {
        const len = buf.length;
        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;
        let out = "";
        for (let i = start; i < end; ++i) {
          out += hexSliceLookupTable[buf[i]];
        }
        return out;
      }
      function utf16leSlice(buf, start, end) {
        const bytes = buf.slice(start, end);
        let res = "";
        for (let i = 0; i < bytes.length - 1; i += 2) {
          res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
        }
        return res;
      }
      Buffer3.prototype.slice = function slice(start, end) {
        const len = this.length;
        start = ~~start;
        end = end === void 0 ? len : ~~end;
        if (start < 0) {
          start += len;
          if (start < 0) start = 0;
        } else if (start > len) {
          start = len;
        }
        if (end < 0) {
          end += len;
          if (end < 0) end = 0;
        } else if (end > len) {
          end = len;
        }
        if (end < start) end = start;
        const newBuf = this.subarray(start, end);
        Object.setPrototypeOf(newBuf, Buffer3.prototype);
        return newBuf;
      };
      function checkOffset(offset, ext, length2) {
        if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length2) throw new RangeError("Trying to access beyond buffer length");
      }
      Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        return val;
      };
      Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          checkOffset(offset, byteLength2, this.length);
        }
        let val = this[offset + --byteLength2];
        let mul = 1;
        while (byteLength2 > 0 && (mul *= 256)) {
          val += this[offset + --byteLength2] * mul;
        }
        return val;
      };
      Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | this[offset + 1] << 8;
      };
      Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] << 8 | this[offset + 1];
      };
      Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
      };
      Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      };
      Buffer3.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
        const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
        return BigInt(lo) + (BigInt(hi) << BigInt(32));
      });
      Buffer3.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
        return (BigInt(hi) << BigInt(32)) + BigInt(lo);
      });
      Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let i = byteLength2;
        let mul = 1;
        let val = this[offset + --i];
        while (i > 0 && (mul *= 256)) {
          val += this[offset + --i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        if (!(this[offset] & 128)) return this[offset];
        return (255 - this[offset] + 1) * -1;
      };
      Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset] | this[offset + 1] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset + 1] | this[offset] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      };
      Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      };
      Buffer3.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
        return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
      });
      Buffer3.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = (first << 24) + // Overflow
        this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
      });
      Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer3.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let mul = 1;
        let i = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset + 3] = value >>> 24;
        this[offset + 2] = value >>> 16;
        this[offset + 1] = value >>> 8;
        this[offset] = value & 255;
        return offset + 4;
      };
      Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      function wrtBigUInt64LE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        return offset;
      }
      function wrtBigUInt64BE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset + 7] = lo;
        lo = lo >> 8;
        buf[offset + 6] = lo;
        lo = lo >> 8;
        buf[offset + 5] = lo;
        lo = lo >> 8;
        buf[offset + 4] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset + 3] = hi;
        hi = hi >> 8;
        buf[offset + 2] = hi;
        hi = hi >> 8;
        buf[offset + 1] = hi;
        hi = hi >> 8;
        buf[offset] = hi;
        return offset + 8;
      }
      Buffer3.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer3.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = 0;
        let mul = 1;
        let sub = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        let sub = 0;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
        if (value < 0) value = 255 + value + 1;
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        this[offset + 2] = value >>> 16;
        this[offset + 3] = value >>> 24;
        return offset + 4;
      };
      Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        if (value < 0) value = 4294967295 + value + 1;
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      Buffer3.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      Buffer3.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
        if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
        if (!start) start = 0;
        if (!end && end !== 0) end = this.length;
        if (targetStart >= target.length) targetStart = target.length;
        if (!targetStart) targetStart = 0;
        if (end > 0 && end < start) end = start;
        if (end === start) return 0;
        if (target.length === 0 || this.length === 0) return 0;
        if (targetStart < 0) {
          throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start;
        }
        const len = end - start;
        if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
          this.copyWithin(targetStart, start, end);
        } else {
          Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
          );
        }
        return len;
      };
      Buffer3.prototype.fill = function fill(val, start, end, encoding) {
        if (typeof val === "string") {
          if (typeof start === "string") {
            encoding = start;
            start = 0;
            end = this.length;
          } else if (typeof end === "string") {
            encoding = end;
            end = this.length;
          }
          if (encoding !== void 0 && typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
          }
          if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
            throw new TypeError("Unknown encoding: " + encoding);
          }
          if (val.length === 1) {
            const code2 = val.charCodeAt(0);
            if (encoding === "utf8" && code2 < 128 || encoding === "latin1") {
              val = code2;
            }
          }
        } else if (typeof val === "number") {
          val = val & 255;
        } else if (typeof val === "boolean") {
          val = Number(val);
        }
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError("Out of range index");
        }
        if (end <= start) {
          return this;
        }
        start = start >>> 0;
        end = end === void 0 ? this.length : end >>> 0;
        if (!val) val = 0;
        let i;
        if (typeof val === "number") {
          for (i = start; i < end; ++i) {
            this[i] = val;
          }
        } else {
          const bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
          const len = bytes.length;
          if (len === 0) {
            throw new TypeError('The value "' + val + '" is invalid for argument "value"');
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
          }
        }
        return this;
      };
      var errors = {};
      function E(sym, getMessage, Base) {
        errors[sym] = class NodeError extends Base {
          constructor() {
            super();
            Object.defineProperty(this, "message", {
              value: getMessage.apply(this, arguments),
              writable: true,
              configurable: true
            });
            this.name = `${this.name} [${sym}]`;
            this.stack;
            delete this.name;
          }
          get code() {
            return sym;
          }
          set code(value) {
            Object.defineProperty(this, "code", {
              configurable: true,
              enumerable: true,
              value,
              writable: true
            });
          }
          toString() {
            return `${this.name} [${sym}]: ${this.message}`;
          }
        };
      }
      E(
        "ERR_BUFFER_OUT_OF_BOUNDS",
        function(name2) {
          if (name2) {
            return `${name2} is outside of buffer bounds`;
          }
          return "Attempt to access memory outside buffer bounds";
        },
        RangeError
      );
      E(
        "ERR_INVALID_ARG_TYPE",
        function(name2, actual) {
          return `The "${name2}" argument must be of type number. Received type ${typeof actual}`;
        },
        TypeError
      );
      E(
        "ERR_OUT_OF_RANGE",
        function(str, range, input) {
          let msg = `The value of "${str}" is out of range.`;
          let received = input;
          if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
          } else if (typeof input === "bigint") {
            received = String(input);
            if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
              received = addNumericalSeparator(received);
            }
            received += "n";
          }
          msg += ` It must be ${range}. Received ${received}`;
          return msg;
        },
        RangeError
      );
      function addNumericalSeparator(val) {
        let res = "";
        let i = val.length;
        const start = val[0] === "-" ? 1 : 0;
        for (; i >= start + 4; i -= 3) {
          res = `_${val.slice(i - 3, i)}${res}`;
        }
        return `${val.slice(0, i)}${res}`;
      }
      function checkBounds(buf, offset, byteLength2) {
        validateNumber(offset, "offset");
        if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
          boundsError(offset, buf.length - (byteLength2 + 1));
        }
      }
      function checkIntBI(value, min, max, buf, offset, byteLength2) {
        if (value > max || value < min) {
          const n = typeof min === "bigint" ? "n" : "";
          let range;
          if (byteLength2 > 3) {
            if (min === 0 || min === BigInt(0)) {
              range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
            } else {
              range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
            }
          } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
          }
          throw new errors.ERR_OUT_OF_RANGE("value", range, value);
        }
        checkBounds(buf, offset, byteLength2);
      }
      function validateNumber(value, name2) {
        if (typeof value !== "number") {
          throw new errors.ERR_INVALID_ARG_TYPE(name2, "number", value);
        }
      }
      function boundsError(value, length2, type) {
        if (Math.floor(value) !== value) {
          validateNumber(value, type);
          throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
        }
        if (length2 < 0) {
          throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
        }
        throw new errors.ERR_OUT_OF_RANGE(
          type || "offset",
          `>= ${type ? 1 : 0} and <= ${length2}`,
          value
        );
      }
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function base64clean(str) {
        str = str.split("=")[0];
        str = str.trim().replace(INVALID_BASE64_RE, "");
        if (str.length < 2) return "";
        while (str.length % 4 !== 0) {
          str = str + "=";
        }
        return str;
      }
      function utf8ToBytes2(string2, units) {
        units = units || Infinity;
        let codePoint;
        const length2 = string2.length;
        let leadSurrogate = null;
        const bytes = [];
        for (let i = 0; i < length2; ++i) {
          codePoint = string2.charCodeAt(i);
          if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              } else if (i + 1 === length2) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              leadSurrogate = codePoint;
              continue;
            }
            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
          } else if (leadSurrogate) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
          }
          leadSurrogate = null;
          if (codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(
              codePoint >> 6 | 192,
              codePoint & 63 | 128
            );
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(
              codePoint >> 12 | 224,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else if (codePoint < 1114112) {
            if ((units -= 4) < 0) break;
            bytes.push(
              codePoint >> 18 | 240,
              codePoint >> 12 & 63 | 128,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else {
            throw new Error("Invalid code point");
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          byteArray.push(str.charCodeAt(i) & 255);
        }
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        let c, hi, lo;
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes2(str) {
        return base642.toByteArray(base64clean(str));
      }
      function blitBuffer(src2, dst, offset, length2) {
        let i;
        for (i = 0; i < length2; ++i) {
          if (i + offset >= dst.length || i >= src2.length) break;
          dst[i + offset] = src2[i];
        }
        return i;
      }
      function isInstance(obj, type) {
        return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
      }
      function numberIsNaN(obj) {
        return obj !== obj;
      }
      var hexSliceLookupTable = function() {
        const alphabet3 = "0123456789abcdef";
        const table = new Array(256);
        for (let i = 0; i < 16; ++i) {
          const i16 = i * 16;
          for (let j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet3[i] + alphabet3[j];
          }
        }
        return table;
      }();
      function defineBigIntMethod(fn) {
        return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
      }
      function BufferBigIntNotDefined() {
        throw new Error("BigInt not supported");
      }
    }
  });

  // node_modules/@multiformats/base-x/src/index.js
  var require_src = __commonJS({
    "node_modules/@multiformats/base-x/src/index.js"(exports, module) {
      "use strict";
      function base3(ALPHABET) {
        if (ALPHABET.length >= 255) {
          throw new TypeError("Alphabet too long");
        }
        var BASE_MAP = new Uint8Array(256);
        for (var j = 0; j < BASE_MAP.length; j++) {
          BASE_MAP[j] = 255;
        }
        for (var i = 0; i < ALPHABET.length; i++) {
          var x = ALPHABET.charAt(i);
          var xc = x.charCodeAt(0);
          if (BASE_MAP[xc] !== 255) {
            throw new TypeError(x + " is ambiguous");
          }
          BASE_MAP[xc] = i;
        }
        var BASE = ALPHABET.length;
        var LEADER = ALPHABET.charAt(0);
        var FACTOR = Math.log(BASE) / Math.log(256);
        var iFACTOR = Math.log(256) / Math.log(BASE);
        function encode6(source) {
          if (source instanceof Uint8Array) {
          } else if (ArrayBuffer.isView(source)) {
            source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
          } else if (Array.isArray(source)) {
            source = Uint8Array.from(source);
          }
          if (!(source instanceof Uint8Array)) {
            throw new TypeError("Expected Uint8Array");
          }
          if (source.length === 0) {
            return "";
          }
          var zeroes = 0;
          var length2 = 0;
          var pbegin = 0;
          var pend = source.length;
          while (pbegin !== pend && source[pbegin] === 0) {
            pbegin++;
            zeroes++;
          }
          var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
          var b58 = new Uint8Array(size);
          while (pbegin !== pend) {
            var carry = source[pbegin];
            var i2 = 0;
            for (var it1 = size - 1; (carry !== 0 || i2 < length2) && it1 !== -1; it1--, i2++) {
              carry += 256 * b58[it1] >>> 0;
              b58[it1] = carry % BASE >>> 0;
              carry = carry / BASE >>> 0;
            }
            if (carry !== 0) {
              throw new Error("Non-zero carry");
            }
            length2 = i2;
            pbegin++;
          }
          var it2 = size - length2;
          while (it2 !== size && b58[it2] === 0) {
            it2++;
          }
          var str = LEADER.repeat(zeroes);
          for (; it2 < size; ++it2) {
            str += ALPHABET.charAt(b58[it2]);
          }
          return str;
        }
        function decodeUnsafe(source) {
          if (typeof source !== "string") {
            throw new TypeError("Expected String");
          }
          if (source.length === 0) {
            return new Uint8Array();
          }
          var psz = 0;
          if (source[psz] === " ") {
            return;
          }
          var zeroes = 0;
          var length2 = 0;
          while (source[psz] === LEADER) {
            zeroes++;
            psz++;
          }
          var size = (source.length - psz) * FACTOR + 1 >>> 0;
          var b256 = new Uint8Array(size);
          while (source[psz]) {
            var carry = BASE_MAP[source.charCodeAt(psz)];
            if (carry === 255) {
              return;
            }
            var i2 = 0;
            for (var it3 = size - 1; (carry !== 0 || i2 < length2) && it3 !== -1; it3--, i2++) {
              carry += BASE * b256[it3] >>> 0;
              b256[it3] = carry % 256 >>> 0;
              carry = carry / 256 >>> 0;
            }
            if (carry !== 0) {
              throw new Error("Non-zero carry");
            }
            length2 = i2;
            psz++;
          }
          if (source[psz] === " ") {
            return;
          }
          var it4 = size - length2;
          while (it4 !== size && b256[it4] === 0) {
            it4++;
          }
          var vch = new Uint8Array(zeroes + (size - it4));
          var j2 = zeroes;
          while (it4 !== size) {
            vch[j2++] = b256[it4++];
          }
          return vch;
        }
        function decode7(string2) {
          var buffer = decodeUnsafe(string2);
          if (buffer) {
            return buffer;
          }
          throw new Error("Non-base" + BASE + " character");
        }
        return {
          encode: encode6,
          decodeUnsafe,
          decode: decode7
        };
      }
      module.exports = base3;
    }
  });

  // node_modules/multibase/src/util.js
  var require_util = __commonJS({
    "node_modules/multibase/src/util.js"(exports, module) {
      "use strict";
      var textDecoder2 = new TextDecoder();
      var decodeText = (bytes) => textDecoder2.decode(bytes);
      var textEncoder2 = new TextEncoder();
      var encodeText = (text) => textEncoder2.encode(text);
      function concat2(arrs, length2) {
        const output = new Uint8Array(length2);
        let offset = 0;
        for (const arr of arrs) {
          output.set(arr, offset);
          offset += arr.length;
        }
        return output;
      }
      module.exports = { decodeText, encodeText, concat: concat2 };
    }
  });

  // node_modules/multibase/src/base.js
  var require_base = __commonJS({
    "node_modules/multibase/src/base.js"(exports, module) {
      "use strict";
      var { encodeText } = require_util();
      var Base = class {
        /**
         * @param {BaseName} name
         * @param {BaseCode} code
         * @param {CodecFactory} factory
         * @param {string} alphabet
         */
        constructor(name2, code2, factory, alphabet3) {
          this.name = name2;
          this.code = code2;
          this.codeBuf = encodeText(this.code);
          this.alphabet = alphabet3;
          this.codec = factory(alphabet3);
        }
        /**
         * @param {Uint8Array} buf
         * @returns {string}
         */
        encode(buf) {
          return this.codec.encode(buf);
        }
        /**
         * @param {string} string
         * @returns {Uint8Array}
         */
        decode(string2) {
          for (const char of string2) {
            if (this.alphabet && this.alphabet.indexOf(char) < 0) {
              throw new Error(`invalid character '${char}' in '${string2}'`);
            }
          }
          return this.codec.decode(string2);
        }
      };
      module.exports = Base;
    }
  });

  // node_modules/multibase/src/rfc4648.js
  var require_rfc4648 = __commonJS({
    "node_modules/multibase/src/rfc4648.js"(exports, module) {
      "use strict";
      var decode7 = (string2, alphabet3, bitsPerChar) => {
        const codes = {};
        for (let i = 0; i < alphabet3.length; ++i) {
          codes[alphabet3[i]] = i;
        }
        let end = string2.length;
        while (string2[end - 1] === "=") {
          --end;
        }
        const out = new Uint8Array(end * bitsPerChar / 8 | 0);
        let bits = 0;
        let buffer = 0;
        let written = 0;
        for (let i = 0; i < end; ++i) {
          const value = codes[string2[i]];
          if (value === void 0) {
            throw new SyntaxError("Invalid character " + string2[i]);
          }
          buffer = buffer << bitsPerChar | value;
          bits += bitsPerChar;
          if (bits >= 8) {
            bits -= 8;
            out[written++] = 255 & buffer >> bits;
          }
        }
        if (bits >= bitsPerChar || 255 & buffer << 8 - bits) {
          throw new SyntaxError("Unexpected end of data");
        }
        return out;
      };
      var encode6 = (data, alphabet3, bitsPerChar) => {
        const pad = alphabet3[alphabet3.length - 1] === "=";
        const mask = (1 << bitsPerChar) - 1;
        let out = "";
        let bits = 0;
        let buffer = 0;
        for (let i = 0; i < data.length; ++i) {
          buffer = buffer << 8 | data[i];
          bits += 8;
          while (bits > bitsPerChar) {
            bits -= bitsPerChar;
            out += alphabet3[mask & buffer >> bits];
          }
        }
        if (bits) {
          out += alphabet3[mask & buffer << bitsPerChar - bits];
        }
        if (pad) {
          while (out.length * bitsPerChar & 7) {
            out += "=";
          }
        }
        return out;
      };
      var rfc46482 = (bitsPerChar) => (alphabet3) => {
        return {
          /**
           * @param {Uint8Array} input
           * @returns {string}
           */
          encode(input) {
            return encode6(input, alphabet3, bitsPerChar);
          },
          /**
           * @param {string} input
           * @returns {Uint8Array}
           */
          decode(input) {
            return decode7(input, alphabet3, bitsPerChar);
          }
        };
      };
      module.exports = { rfc4648: rfc46482 };
    }
  });

  // node_modules/multibase/src/constants.js
  var require_constants = __commonJS({
    "node_modules/multibase/src/constants.js"(exports, module) {
      "use strict";
      var baseX2 = require_src();
      var Base = require_base();
      var { rfc4648: rfc46482 } = require_rfc4648();
      var { decodeText, encodeText } = require_util();
      var identity3 = () => {
        return {
          encode: decodeText,
          decode: encodeText
        };
      };
      var constants = [
        ["identity", "\0", identity3, ""],
        ["base2", "0", rfc46482(1), "01"],
        ["base8", "7", rfc46482(3), "01234567"],
        ["base10", "9", baseX2, "0123456789"],
        ["base16", "f", rfc46482(4), "0123456789abcdef"],
        ["base16upper", "F", rfc46482(4), "0123456789ABCDEF"],
        ["base32hex", "v", rfc46482(5), "0123456789abcdefghijklmnopqrstuv"],
        ["base32hexupper", "V", rfc46482(5), "0123456789ABCDEFGHIJKLMNOPQRSTUV"],
        ["base32hexpad", "t", rfc46482(5), "0123456789abcdefghijklmnopqrstuv="],
        ["base32hexpadupper", "T", rfc46482(5), "0123456789ABCDEFGHIJKLMNOPQRSTUV="],
        ["base32", "b", rfc46482(5), "abcdefghijklmnopqrstuvwxyz234567"],
        ["base32upper", "B", rfc46482(5), "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"],
        ["base32pad", "c", rfc46482(5), "abcdefghijklmnopqrstuvwxyz234567="],
        ["base32padupper", "C", rfc46482(5), "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567="],
        ["base32z", "h", rfc46482(5), "ybndrfg8ejkmcpqxot1uwisza345h769"],
        ["base36", "k", baseX2, "0123456789abcdefghijklmnopqrstuvwxyz"],
        ["base36upper", "K", baseX2, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
        ["base58btc", "z", baseX2, "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"],
        ["base58flickr", "Z", baseX2, "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"],
        ["base64", "m", rfc46482(6), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"],
        ["base64pad", "M", rfc46482(6), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="],
        ["base64url", "u", rfc46482(6), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"],
        ["base64urlpad", "U", rfc46482(6), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_="]
      ];
      var names = constants.reduce(
        (prev, tupple) => {
          prev[tupple[0]] = new Base(tupple[0], tupple[1], tupple[2], tupple[3]);
          return prev;
        },
        /** @type {Record<BaseName,Base>} */
        {}
      );
      var codes = constants.reduce(
        (prev, tupple) => {
          prev[tupple[1]] = names[tupple[0]];
          return prev;
        },
        /** @type {Record<BaseCode,Base>} */
        {}
      );
      module.exports = {
        names,
        codes
      };
    }
  });

  // node_modules/multibase/src/index.js
  var require_src2 = __commonJS({
    "node_modules/multibase/src/index.js"(exports, module) {
      "use strict";
      var constants = require_constants();
      var { encodeText, decodeText, concat: concat2 } = require_util();
      function multibase(nameOrCode, buf) {
        if (!buf) {
          throw new Error("requires an encoded Uint8Array");
        }
        const { name: name2, codeBuf } = encoding(nameOrCode);
        validEncode(name2, buf);
        return concat2([codeBuf, buf], codeBuf.length + buf.length);
      }
      function encode6(nameOrCode, buf) {
        const enc = encoding(nameOrCode);
        const data = encodeText(enc.encode(buf));
        return concat2([enc.codeBuf, data], enc.codeBuf.length + data.length);
      }
      function decode7(data) {
        if (data instanceof Uint8Array) {
          data = decodeText(data);
        }
        const prefix = data[0];
        if (["f", "F", "v", "V", "t", "T", "b", "B", "c", "C", "h", "k", "K"].includes(prefix)) {
          data = data.toLowerCase();
        }
        const enc = encoding(
          /** @type {BaseCode} */
          data[0]
        );
        return enc.decode(data.substring(1));
      }
      function isEncoded(data) {
        if (data instanceof Uint8Array) {
          data = decodeText(data);
        }
        if (Object.prototype.toString.call(data) !== "[object String]") {
          return false;
        }
        try {
          const enc = encoding(
            /** @type {BaseCode} */
            data[0]
          );
          return enc.name;
        } catch (err) {
          return false;
        }
      }
      function validEncode(name2, buf) {
        const enc = encoding(name2);
        enc.decode(decodeText(buf));
      }
      function encoding(nameOrCode) {
        if (Object.prototype.hasOwnProperty.call(
          constants.names,
          /** @type {BaseName} */
          nameOrCode
        )) {
          return constants.names[
            /** @type {BaseName} */
            nameOrCode
          ];
        } else if (Object.prototype.hasOwnProperty.call(
          constants.codes,
          /** @type {BaseCode} */
          nameOrCode
        )) {
          return constants.codes[
            /** @type {BaseCode} */
            nameOrCode
          ];
        } else {
          throw new Error(`Unsupported encoding: ${nameOrCode}`);
        }
      }
      function encodingFromData(data) {
        if (data instanceof Uint8Array) {
          data = decodeText(data);
        }
        return encoding(
          /** @type {BaseCode} */
          data[0]
        );
      }
      exports = module.exports = multibase;
      exports.encode = encode6;
      exports.decode = decode7;
      exports.isEncoded = isEncoded;
      exports.encoding = encoding;
      exports.encodingFromData = encodingFromData;
      var names = Object.freeze(constants.names);
      var codes = Object.freeze(constants.codes);
      exports.names = names;
      exports.codes = codes;
    }
  });

  // node_modules/canonicalize/lib/canonicalize.js
  var require_canonicalize = __commonJS({
    "node_modules/canonicalize/lib/canonicalize.js"(exports, module) {
      "use strict";
      module.exports = function serialize(object) {
        if (typeof object === "number" && isNaN(object)) {
          throw new Error("NaN is not allowed");
        }
        if (typeof object === "number" && !isFinite(object)) {
          throw new Error("Infinity is not allowed");
        }
        if (object === null || typeof object !== "object") {
          return JSON.stringify(object);
        }
        if (object.toJSON instanceof Function) {
          return serialize(object.toJSON());
        }
        if (Array.isArray(object)) {
          const values2 = object.reduce((t, cv, ci) => {
            const comma = ci === 0 ? "" : ",";
            const value = cv === void 0 || typeof cv === "symbol" ? null : cv;
            return `${t}${comma}${serialize(value)}`;
          }, "");
          return `[${values2}]`;
        }
        const values = Object.keys(object).sort().reduce((t, cv) => {
          if (object[cv] === void 0 || typeof object[cv] === "symbol") {
            return t;
          }
          const comma = t.length === 0 ? "" : ",";
          return `${t}${comma}${serialize(cv)}:${serialize(object[cv])}`;
        }, "");
        return `{${values}}`;
      };
    }
  });

  // index.js
  var import_buffer = __toESM(require_buffer());

  // node_modules/uuid/dist/esm-browser/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  }

  // node_modules/uuid/dist/esm-browser/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      if (typeof crypto === "undefined" || !crypto.getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
      getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
  }

  // node_modules/uuid/dist/esm-browser/native.js
  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native_default = { randomUUID };

  // node_modules/uuid/dist/esm-browser/v4.js
  function v4(options, buf, offset) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
      throw new Error("Random bytes length must be >= 16");
    }
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      if (offset < 0 || offset + 16 > buf.length) {
        throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
      }
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  var v4_default = v4;

  // node_modules/uint8arrays/esm/src/util/as-uint8array.js
  function asUint8Array(buf) {
    if (globalThis.Buffer != null) {
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    return buf;
  }

  // node_modules/uint8arrays/esm/src/alloc.js
  function allocUnsafe(size = 0) {
    if (globalThis.Buffer != null && globalThis.Buffer.allocUnsafe != null) {
      return asUint8Array(globalThis.Buffer.allocUnsafe(size));
    }
    return new Uint8Array(size);
  }

  // node_modules/uint8arrays/esm/src/concat.js
  function concat(arrays, length2) {
    if (!length2) {
      length2 = arrays.reduce((acc, curr) => acc + curr.length, 0);
    }
    const output = allocUnsafe(length2);
    let offset = 0;
    for (const arr of arrays) {
      output.set(arr, offset);
      offset += arr.length;
    }
    return asUint8Array(output);
  }

  // node_modules/multiformats/esm/src/bases/identity.js
  var identity_exports = {};
  __export(identity_exports, {
    identity: () => identity
  });

  // node_modules/multiformats/esm/vendor/base-x.js
  function base(ALPHABET, name2) {
    if (ALPHABET.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0; j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i = 0; i < ALPHABET.length; i++) {
      var x = ALPHABET.charAt(i);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i;
    }
    var BASE = ALPHABET.length;
    var LEADER = ALPHABET.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode6(source) {
      if (source instanceof Uint8Array) ;
      else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length2 = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i2 = 0;
        for (var it1 = size - 1; (carry !== 0 || i2 < length2) && it1 !== -1; it1--, i2++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length2 = i2;
        pbegin++;
      }
      var it2 = size - length2;
      while (it2 !== size && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (; it2 < size; ++it2) {
        str += ALPHABET.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array();
      }
      var psz = 0;
      if (source[psz] === " ") {
        return;
      }
      var zeroes = 0;
      var length2 = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size);
      while (source[psz]) {
        var carry = BASE_MAP[source.charCodeAt(psz)];
        if (carry === 255) {
          return;
        }
        var i2 = 0;
        for (var it3 = size - 1; (carry !== 0 || i2 < length2) && it3 !== -1; it3--, i2++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length2 = i2;
        psz++;
      }
      if (source[psz] === " ") {
        return;
      }
      var it4 = size - length2;
      while (it4 !== size && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size - it4));
      var j2 = zeroes;
      while (it4 !== size) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode7(string2) {
      var buffer = decodeUnsafe(string2);
      if (buffer) {
        return buffer;
      }
      throw new Error(`Non-${name2} character`);
    }
    return {
      encode: encode6,
      decodeUnsafe,
      decode: decode7
    };
  }
  var src = base;
  var _brrp__multiformats_scope_baseX = src;
  var base_x_default = _brrp__multiformats_scope_baseX;

  // node_modules/multiformats/esm/src/bytes.js
  var empty = new Uint8Array(0);
  var equals = (aa, bb) => {
    if (aa === bb)
      return true;
    if (aa.byteLength !== bb.byteLength) {
      return false;
    }
    for (let ii = 0; ii < aa.byteLength; ii++) {
      if (aa[ii] !== bb[ii]) {
        return false;
      }
    }
    return true;
  };
  var coerce = (o) => {
    if (o instanceof Uint8Array && o.constructor.name === "Uint8Array")
      return o;
    if (o instanceof ArrayBuffer)
      return new Uint8Array(o);
    if (ArrayBuffer.isView(o)) {
      return new Uint8Array(o.buffer, o.byteOffset, o.byteLength);
    }
    throw new Error("Unknown type, must be binary type");
  };
  var fromString = (str) => new TextEncoder().encode(str);
  var toString = (b) => new TextDecoder().decode(b);

  // node_modules/multiformats/esm/src/bases/base.js
  var Encoder = class {
    constructor(name2, prefix, baseEncode) {
      this.name = name2;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
    }
    encode(bytes) {
      if (bytes instanceof Uint8Array) {
        return `${this.prefix}${this.baseEncode(bytes)}`;
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };
  var Decoder = class {
    constructor(name2, prefix, baseDecode) {
      this.name = name2;
      this.prefix = prefix;
      if (prefix.codePointAt(0) === void 0) {
        throw new Error("Invalid prefix character");
      }
      this.prefixCodePoint = prefix.codePointAt(0);
      this.baseDecode = baseDecode;
    }
    decode(text) {
      if (typeof text === "string") {
        if (text.codePointAt(0) !== this.prefixCodePoint) {
          throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
        }
        return this.baseDecode(text.slice(this.prefix.length));
      } else {
        throw Error("Can only multibase decode strings");
      }
    }
    or(decoder) {
      return or(this, decoder);
    }
  };
  var ComposedDecoder = class {
    constructor(decoders) {
      this.decoders = decoders;
    }
    or(decoder) {
      return or(this, decoder);
    }
    decode(input) {
      const prefix = input[0];
      const decoder = this.decoders[prefix];
      if (decoder) {
        return decoder.decode(input);
      } else {
        throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
      }
    }
  };
  var or = (left, right) => new ComposedDecoder({
    ...left.decoders || { [left.prefix]: left },
    ...right.decoders || { [right.prefix]: right }
  });
  var Codec = class {
    constructor(name2, prefix, baseEncode, baseDecode) {
      this.name = name2;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
      this.baseDecode = baseDecode;
      this.encoder = new Encoder(name2, prefix, baseEncode);
      this.decoder = new Decoder(name2, prefix, baseDecode);
    }
    encode(input) {
      return this.encoder.encode(input);
    }
    decode(input) {
      return this.decoder.decode(input);
    }
  };
  var from = ({ name: name2, prefix, encode: encode6, decode: decode7 }) => new Codec(name2, prefix, encode6, decode7);
  var baseX = ({ prefix, name: name2, alphabet: alphabet3 }) => {
    const { encode: encode6, decode: decode7 } = base_x_default(alphabet3, name2);
    return from({
      prefix,
      name: name2,
      encode: encode6,
      decode: (text) => coerce(decode7(text))
    });
  };
  var decode = (string2, alphabet3, bitsPerChar, name2) => {
    const codes = {};
    for (let i = 0; i < alphabet3.length; ++i) {
      codes[alphabet3[i]] = i;
    }
    let end = string2.length;
    while (string2[end - 1] === "=") {
      --end;
    }
    const out = new Uint8Array(end * bitsPerChar / 8 | 0);
    let bits = 0;
    let buffer = 0;
    let written = 0;
    for (let i = 0; i < end; ++i) {
      const value = codes[string2[i]];
      if (value === void 0) {
        throw new SyntaxError(`Non-${name2} character`);
      }
      buffer = buffer << bitsPerChar | value;
      bits += bitsPerChar;
      if (bits >= 8) {
        bits -= 8;
        out[written++] = 255 & buffer >> bits;
      }
    }
    if (bits >= bitsPerChar || 255 & buffer << 8 - bits) {
      throw new SyntaxError("Unexpected end of data");
    }
    return out;
  };
  var encode = (data, alphabet3, bitsPerChar) => {
    const pad = alphabet3[alphabet3.length - 1] === "=";
    const mask = (1 << bitsPerChar) - 1;
    let out = "";
    let bits = 0;
    let buffer = 0;
    for (let i = 0; i < data.length; ++i) {
      buffer = buffer << 8 | data[i];
      bits += 8;
      while (bits > bitsPerChar) {
        bits -= bitsPerChar;
        out += alphabet3[mask & buffer >> bits];
      }
    }
    if (bits) {
      out += alphabet3[mask & buffer << bitsPerChar - bits];
    }
    if (pad) {
      while (out.length * bitsPerChar & 7) {
        out += "=";
      }
    }
    return out;
  };
  var rfc4648 = ({ name: name2, prefix, bitsPerChar, alphabet: alphabet3 }) => {
    return from({
      prefix,
      name: name2,
      encode(input) {
        return encode(input, alphabet3, bitsPerChar);
      },
      decode(input) {
        return decode(input, alphabet3, bitsPerChar, name2);
      }
    });
  };

  // node_modules/multiformats/esm/src/bases/identity.js
  var identity = from({
    prefix: "\0",
    name: "identity",
    encode: (buf) => toString(buf),
    decode: (str) => fromString(str)
  });

  // node_modules/multiformats/esm/src/bases/base2.js
  var base2_exports = {};
  __export(base2_exports, {
    base2: () => base2
  });
  var base2 = rfc4648({
    prefix: "0",
    name: "base2",
    alphabet: "01",
    bitsPerChar: 1
  });

  // node_modules/multiformats/esm/src/bases/base8.js
  var base8_exports = {};
  __export(base8_exports, {
    base8: () => base8
  });
  var base8 = rfc4648({
    prefix: "7",
    name: "base8",
    alphabet: "01234567",
    bitsPerChar: 3
  });

  // node_modules/multiformats/esm/src/bases/base10.js
  var base10_exports = {};
  __export(base10_exports, {
    base10: () => base10
  });
  var base10 = baseX({
    prefix: "9",
    name: "base10",
    alphabet: "0123456789"
  });

  // node_modules/multiformats/esm/src/bases/base16.js
  var base16_exports = {};
  __export(base16_exports, {
    base16: () => base16,
    base16upper: () => base16upper
  });
  var base16 = rfc4648({
    prefix: "f",
    name: "base16",
    alphabet: "0123456789abcdef",
    bitsPerChar: 4
  });
  var base16upper = rfc4648({
    prefix: "F",
    name: "base16upper",
    alphabet: "0123456789ABCDEF",
    bitsPerChar: 4
  });

  // node_modules/multiformats/esm/src/bases/base32.js
  var base32_exports = {};
  __export(base32_exports, {
    base32: () => base32,
    base32hex: () => base32hex,
    base32hexpad: () => base32hexpad,
    base32hexpadupper: () => base32hexpadupper,
    base32hexupper: () => base32hexupper,
    base32pad: () => base32pad,
    base32padupper: () => base32padupper,
    base32upper: () => base32upper,
    base32z: () => base32z
  });
  var base32 = rfc4648({
    prefix: "b",
    name: "base32",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567",
    bitsPerChar: 5
  });
  var base32upper = rfc4648({
    prefix: "B",
    name: "base32upper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    bitsPerChar: 5
  });
  var base32pad = rfc4648({
    prefix: "c",
    name: "base32pad",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567=",
    bitsPerChar: 5
  });
  var base32padupper = rfc4648({
    prefix: "C",
    name: "base32padupper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=",
    bitsPerChar: 5
  });
  var base32hex = rfc4648({
    prefix: "v",
    name: "base32hex",
    alphabet: "0123456789abcdefghijklmnopqrstuv",
    bitsPerChar: 5
  });
  var base32hexupper = rfc4648({
    prefix: "V",
    name: "base32hexupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
    bitsPerChar: 5
  });
  var base32hexpad = rfc4648({
    prefix: "t",
    name: "base32hexpad",
    alphabet: "0123456789abcdefghijklmnopqrstuv=",
    bitsPerChar: 5
  });
  var base32hexpadupper = rfc4648({
    prefix: "T",
    name: "base32hexpadupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=",
    bitsPerChar: 5
  });
  var base32z = rfc4648({
    prefix: "h",
    name: "base32z",
    alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769",
    bitsPerChar: 5
  });

  // node_modules/multiformats/esm/src/bases/base36.js
  var base36_exports = {};
  __export(base36_exports, {
    base36: () => base36,
    base36upper: () => base36upper
  });
  var base36 = baseX({
    prefix: "k",
    name: "base36",
    alphabet: "0123456789abcdefghijklmnopqrstuvwxyz"
  });
  var base36upper = baseX({
    prefix: "K",
    name: "base36upper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  });

  // node_modules/multiformats/esm/src/bases/base58.js
  var base58_exports = {};
  __export(base58_exports, {
    base58btc: () => base58btc,
    base58flickr: () => base58flickr
  });
  var base58btc = baseX({
    name: "base58btc",
    prefix: "z",
    alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  });
  var base58flickr = baseX({
    name: "base58flickr",
    prefix: "Z",
    alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
  });

  // node_modules/multiformats/esm/src/bases/base64.js
  var base64_exports = {};
  __export(base64_exports, {
    base64: () => base64,
    base64pad: () => base64pad,
    base64url: () => base64url,
    base64urlpad: () => base64urlpad
  });
  var base64 = rfc4648({
    prefix: "m",
    name: "base64",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    bitsPerChar: 6
  });
  var base64pad = rfc4648({
    prefix: "M",
    name: "base64pad",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    bitsPerChar: 6
  });
  var base64url = rfc4648({
    prefix: "u",
    name: "base64url",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    bitsPerChar: 6
  });
  var base64urlpad = rfc4648({
    prefix: "U",
    name: "base64urlpad",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=",
    bitsPerChar: 6
  });

  // node_modules/multiformats/esm/src/bases/base256emoji.js
  var base256emoji_exports = {};
  __export(base256emoji_exports, {
    base256emoji: () => base256emoji
  });
  var alphabet = Array.from("\u{1F680}\u{1FA90}\u2604\u{1F6F0}\u{1F30C}\u{1F311}\u{1F312}\u{1F313}\u{1F314}\u{1F315}\u{1F316}\u{1F317}\u{1F318}\u{1F30D}\u{1F30F}\u{1F30E}\u{1F409}\u2600\u{1F4BB}\u{1F5A5}\u{1F4BE}\u{1F4BF}\u{1F602}\u2764\u{1F60D}\u{1F923}\u{1F60A}\u{1F64F}\u{1F495}\u{1F62D}\u{1F618}\u{1F44D}\u{1F605}\u{1F44F}\u{1F601}\u{1F525}\u{1F970}\u{1F494}\u{1F496}\u{1F499}\u{1F622}\u{1F914}\u{1F606}\u{1F644}\u{1F4AA}\u{1F609}\u263A\u{1F44C}\u{1F917}\u{1F49C}\u{1F614}\u{1F60E}\u{1F607}\u{1F339}\u{1F926}\u{1F389}\u{1F49E}\u270C\u2728\u{1F937}\u{1F631}\u{1F60C}\u{1F338}\u{1F64C}\u{1F60B}\u{1F497}\u{1F49A}\u{1F60F}\u{1F49B}\u{1F642}\u{1F493}\u{1F929}\u{1F604}\u{1F600}\u{1F5A4}\u{1F603}\u{1F4AF}\u{1F648}\u{1F447}\u{1F3B6}\u{1F612}\u{1F92D}\u2763\u{1F61C}\u{1F48B}\u{1F440}\u{1F62A}\u{1F611}\u{1F4A5}\u{1F64B}\u{1F61E}\u{1F629}\u{1F621}\u{1F92A}\u{1F44A}\u{1F973}\u{1F625}\u{1F924}\u{1F449}\u{1F483}\u{1F633}\u270B\u{1F61A}\u{1F61D}\u{1F634}\u{1F31F}\u{1F62C}\u{1F643}\u{1F340}\u{1F337}\u{1F63B}\u{1F613}\u2B50\u2705\u{1F97A}\u{1F308}\u{1F608}\u{1F918}\u{1F4A6}\u2714\u{1F623}\u{1F3C3}\u{1F490}\u2639\u{1F38A}\u{1F498}\u{1F620}\u261D\u{1F615}\u{1F33A}\u{1F382}\u{1F33B}\u{1F610}\u{1F595}\u{1F49D}\u{1F64A}\u{1F639}\u{1F5E3}\u{1F4AB}\u{1F480}\u{1F451}\u{1F3B5}\u{1F91E}\u{1F61B}\u{1F534}\u{1F624}\u{1F33C}\u{1F62B}\u26BD\u{1F919}\u2615\u{1F3C6}\u{1F92B}\u{1F448}\u{1F62E}\u{1F646}\u{1F37B}\u{1F343}\u{1F436}\u{1F481}\u{1F632}\u{1F33F}\u{1F9E1}\u{1F381}\u26A1\u{1F31E}\u{1F388}\u274C\u270A\u{1F44B}\u{1F630}\u{1F928}\u{1F636}\u{1F91D}\u{1F6B6}\u{1F4B0}\u{1F353}\u{1F4A2}\u{1F91F}\u{1F641}\u{1F6A8}\u{1F4A8}\u{1F92C}\u2708\u{1F380}\u{1F37A}\u{1F913}\u{1F619}\u{1F49F}\u{1F331}\u{1F616}\u{1F476}\u{1F974}\u25B6\u27A1\u2753\u{1F48E}\u{1F4B8}\u2B07\u{1F628}\u{1F31A}\u{1F98B}\u{1F637}\u{1F57A}\u26A0\u{1F645}\u{1F61F}\u{1F635}\u{1F44E}\u{1F932}\u{1F920}\u{1F927}\u{1F4CC}\u{1F535}\u{1F485}\u{1F9D0}\u{1F43E}\u{1F352}\u{1F617}\u{1F911}\u{1F30A}\u{1F92F}\u{1F437}\u260E\u{1F4A7}\u{1F62F}\u{1F486}\u{1F446}\u{1F3A4}\u{1F647}\u{1F351}\u2744\u{1F334}\u{1F4A3}\u{1F438}\u{1F48C}\u{1F4CD}\u{1F940}\u{1F922}\u{1F445}\u{1F4A1}\u{1F4A9}\u{1F450}\u{1F4F8}\u{1F47B}\u{1F910}\u{1F92E}\u{1F3BC}\u{1F975}\u{1F6A9}\u{1F34E}\u{1F34A}\u{1F47C}\u{1F48D}\u{1F4E3}\u{1F942}");
  var alphabetBytesToChars = alphabet.reduce((p, c, i) => {
    p[i] = c;
    return p;
  }, []);
  var alphabetCharsToBytes = alphabet.reduce((p, c, i) => {
    p[c.codePointAt(0)] = i;
    return p;
  }, []);
  function encode2(data) {
    return data.reduce((p, c) => {
      p += alphabetBytesToChars[c];
      return p;
    }, "");
  }
  function decode2(str) {
    const byts = [];
    for (const char of str) {
      const byt = alphabetCharsToBytes[char.codePointAt(0)];
      if (byt === void 0) {
        throw new Error(`Non-base256emoji character: ${char}`);
      }
      byts.push(byt);
    }
    return new Uint8Array(byts);
  }
  var base256emoji = from({
    prefix: "\u{1F680}",
    name: "base256emoji",
    encode: encode2,
    decode: decode2
  });

  // node_modules/multiformats/esm/src/hashes/sha2-browser.js
  var sha2_browser_exports = {};
  __export(sha2_browser_exports, {
    sha256: () => sha256,
    sha512: () => sha512
  });

  // node_modules/multiformats/esm/src/varint.js
  var varint_exports = {};
  __export(varint_exports, {
    decode: () => decode4,
    encodeTo: () => encodeTo,
    encodingLength: () => encodingLength
  });

  // node_modules/multiformats/esm/vendor/varint.js
  var encode_1 = encode3;
  var MSB = 128;
  var REST = 127;
  var MSBALL = ~REST;
  var INT = Math.pow(2, 31);
  function encode3(num, out, offset) {
    out = out || [];
    offset = offset || 0;
    var oldOffset = offset;
    while (num >= INT) {
      out[offset++] = num & 255 | MSB;
      num /= 128;
    }
    while (num & MSBALL) {
      out[offset++] = num & 255 | MSB;
      num >>>= 7;
    }
    out[offset] = num | 0;
    encode3.bytes = offset - oldOffset + 1;
    return out;
  }
  var decode3 = read;
  var MSB$1 = 128;
  var REST$1 = 127;
  function read(buf, offset) {
    var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
    do {
      if (counter >= l) {
        read.bytes = 0;
        throw new RangeError("Could not decode varint");
      }
      b = buf[counter++];
      res += shift < 28 ? (b & REST$1) << shift : (b & REST$1) * Math.pow(2, shift);
      shift += 7;
    } while (b >= MSB$1);
    read.bytes = counter - offset;
    return res;
  }
  var N1 = Math.pow(2, 7);
  var N2 = Math.pow(2, 14);
  var N3 = Math.pow(2, 21);
  var N4 = Math.pow(2, 28);
  var N5 = Math.pow(2, 35);
  var N6 = Math.pow(2, 42);
  var N7 = Math.pow(2, 49);
  var N8 = Math.pow(2, 56);
  var N9 = Math.pow(2, 63);
  var length = function(value) {
    return value < N1 ? 1 : value < N2 ? 2 : value < N3 ? 3 : value < N4 ? 4 : value < N5 ? 5 : value < N6 ? 6 : value < N7 ? 7 : value < N8 ? 8 : value < N9 ? 9 : 10;
  };
  var varint = {
    encode: encode_1,
    decode: decode3,
    encodingLength: length
  };
  var _brrp_varint = varint;
  var varint_default = _brrp_varint;

  // node_modules/multiformats/esm/src/varint.js
  var decode4 = (data, offset = 0) => {
    const code2 = varint_default.decode(data, offset);
    return [
      code2,
      varint_default.decode.bytes
    ];
  };
  var encodeTo = (int, target, offset = 0) => {
    varint_default.encode(int, target, offset);
    return target;
  };
  var encodingLength = (int) => {
    return varint_default.encodingLength(int);
  };

  // node_modules/multiformats/esm/src/hashes/digest.js
  var create = (code2, digest2) => {
    const size = digest2.byteLength;
    const sizeOffset = encodingLength(code2);
    const digestOffset = sizeOffset + encodingLength(size);
    const bytes = new Uint8Array(digestOffset + size);
    encodeTo(code2, bytes, 0);
    encodeTo(size, bytes, sizeOffset);
    bytes.set(digest2, digestOffset);
    return new Digest(code2, size, digest2, bytes);
  };
  var decode5 = (multihash) => {
    const bytes = coerce(multihash);
    const [code2, sizeOffset] = decode4(bytes);
    const [size, digestOffset] = decode4(bytes.subarray(sizeOffset));
    const digest2 = bytes.subarray(sizeOffset + digestOffset);
    if (digest2.byteLength !== size) {
      throw new Error("Incorrect length");
    }
    return new Digest(code2, size, digest2, bytes);
  };
  var equals2 = (a, b) => {
    if (a === b) {
      return true;
    } else {
      return a.code === b.code && a.size === b.size && equals(a.bytes, b.bytes);
    }
  };
  var Digest = class {
    constructor(code2, size, digest2, bytes) {
      this.code = code2;
      this.size = size;
      this.digest = digest2;
      this.bytes = bytes;
    }
  };

  // node_modules/multiformats/esm/src/hashes/hasher.js
  var from2 = ({ name: name2, code: code2, encode: encode6 }) => new Hasher(name2, code2, encode6);
  var Hasher = class {
    constructor(name2, code2, encode6) {
      this.name = name2;
      this.code = code2;
      this.encode = encode6;
    }
    digest(input) {
      if (input instanceof Uint8Array) {
        const result = this.encode(input);
        return result instanceof Uint8Array ? create(this.code, result) : result.then((digest2) => create(this.code, digest2));
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };

  // node_modules/multiformats/esm/src/hashes/sha2-browser.js
  var sha = (name2) => async (data) => new Uint8Array(await crypto.subtle.digest(name2, data));
  var sha256 = from2({
    name: "sha2-256",
    code: 18,
    encode: sha("SHA-256")
  });
  var sha512 = from2({
    name: "sha2-512",
    code: 19,
    encode: sha("SHA-512")
  });

  // node_modules/multiformats/esm/src/hashes/identity.js
  var identity_exports2 = {};
  __export(identity_exports2, {
    identity: () => identity2
  });
  var code = 0;
  var name = "identity";
  var encode4 = coerce;
  var digest = (input) => create(code, encode4(input));
  var identity2 = {
    code,
    name,
    encode: encode4,
    digest
  };

  // node_modules/multiformats/esm/src/codecs/json.js
  var textEncoder = new TextEncoder();
  var textDecoder = new TextDecoder();

  // node_modules/multiformats/esm/src/cid.js
  var CID = class _CID {
    constructor(version2, code2, multihash, bytes) {
      this.code = code2;
      this.version = version2;
      this.multihash = multihash;
      this.bytes = bytes;
      this.byteOffset = bytes.byteOffset;
      this.byteLength = bytes.byteLength;
      this.asCID = this;
      this._baseCache = /* @__PURE__ */ new Map();
      Object.defineProperties(this, {
        byteOffset: hidden,
        byteLength: hidden,
        code: readonly,
        version: readonly,
        multihash: readonly,
        bytes: readonly,
        _baseCache: hidden,
        asCID: hidden
      });
    }
    toV0() {
      switch (this.version) {
        case 0: {
          return this;
        }
        default: {
          const { code: code2, multihash } = this;
          if (code2 !== DAG_PB_CODE) {
            throw new Error("Cannot convert a non dag-pb CID to CIDv0");
          }
          if (multihash.code !== SHA_256_CODE) {
            throw new Error("Cannot convert non sha2-256 multihash CID to CIDv0");
          }
          return _CID.createV0(multihash);
        }
      }
    }
    toV1() {
      switch (this.version) {
        case 0: {
          const { code: code2, digest: digest2 } = this.multihash;
          const multihash = create(code2, digest2);
          return _CID.createV1(this.code, multihash);
        }
        case 1: {
          return this;
        }
        default: {
          throw Error(`Can not convert CID version ${this.version} to version 0. This is a bug please report`);
        }
      }
    }
    equals(other) {
      return other && this.code === other.code && this.version === other.version && equals2(this.multihash, other.multihash);
    }
    toString(base3) {
      const { bytes, version: version2, _baseCache } = this;
      switch (version2) {
        case 0:
          return toStringV0(bytes, _baseCache, base3 || base58btc.encoder);
        default:
          return toStringV1(bytes, _baseCache, base3 || base32.encoder);
      }
    }
    toJSON() {
      return {
        code: this.code,
        version: this.version,
        hash: this.multihash.bytes
      };
    }
    get [Symbol.toStringTag]() {
      return "CID";
    }
    [Symbol.for("nodejs.util.inspect.custom")]() {
      return "CID(" + this.toString() + ")";
    }
    static isCID(value) {
      deprecate(/^0\.0/, IS_CID_DEPRECATION);
      return !!(value && (value[cidSymbol] || value.asCID === value));
    }
    get toBaseEncodedString() {
      throw new Error("Deprecated, use .toString()");
    }
    get codec() {
      throw new Error('"codec" property is deprecated, use integer "code" property instead');
    }
    get buffer() {
      throw new Error("Deprecated .buffer property, use .bytes to get Uint8Array instead");
    }
    get multibaseName() {
      throw new Error('"multibaseName" property is deprecated');
    }
    get prefix() {
      throw new Error('"prefix" property is deprecated');
    }
    static asCID(value) {
      if (value instanceof _CID) {
        return value;
      } else if (value != null && value.asCID === value) {
        const { version: version2, code: code2, multihash, bytes } = value;
        return new _CID(version2, code2, multihash, bytes || encodeCID(version2, code2, multihash.bytes));
      } else if (value != null && value[cidSymbol] === true) {
        const { version: version2, multihash, code: code2 } = value;
        const digest2 = decode5(multihash);
        return _CID.create(version2, code2, digest2);
      } else {
        return null;
      }
    }
    static create(version2, code2, digest2) {
      if (typeof code2 !== "number") {
        throw new Error("String codecs are no longer supported");
      }
      switch (version2) {
        case 0: {
          if (code2 !== DAG_PB_CODE) {
            throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE}) block encoding`);
          } else {
            return new _CID(version2, code2, digest2, digest2.bytes);
          }
        }
        case 1: {
          const bytes = encodeCID(version2, code2, digest2.bytes);
          return new _CID(version2, code2, digest2, bytes);
        }
        default: {
          throw new Error("Invalid version");
        }
      }
    }
    static createV0(digest2) {
      return _CID.create(0, DAG_PB_CODE, digest2);
    }
    static createV1(code2, digest2) {
      return _CID.create(1, code2, digest2);
    }
    static decode(bytes) {
      const [cid, remainder] = _CID.decodeFirst(bytes);
      if (remainder.length) {
        throw new Error("Incorrect length");
      }
      return cid;
    }
    static decodeFirst(bytes) {
      const specs = _CID.inspectBytes(bytes);
      const prefixSize = specs.size - specs.multihashSize;
      const multihashBytes = coerce(bytes.subarray(prefixSize, prefixSize + specs.multihashSize));
      if (multihashBytes.byteLength !== specs.multihashSize) {
        throw new Error("Incorrect length");
      }
      const digestBytes = multihashBytes.subarray(specs.multihashSize - specs.digestSize);
      const digest2 = new Digest(specs.multihashCode, specs.digestSize, digestBytes, multihashBytes);
      const cid = specs.version === 0 ? _CID.createV0(digest2) : _CID.createV1(specs.codec, digest2);
      return [
        cid,
        bytes.subarray(specs.size)
      ];
    }
    static inspectBytes(initialBytes) {
      let offset = 0;
      const next = () => {
        const [i, length2] = decode4(initialBytes.subarray(offset));
        offset += length2;
        return i;
      };
      let version2 = next();
      let codec = DAG_PB_CODE;
      if (version2 === 18) {
        version2 = 0;
        offset = 0;
      } else if (version2 === 1) {
        codec = next();
      }
      if (version2 !== 0 && version2 !== 1) {
        throw new RangeError(`Invalid CID version ${version2}`);
      }
      const prefixSize = offset;
      const multihashCode = next();
      const digestSize = next();
      const size = offset + digestSize;
      const multihashSize = size - prefixSize;
      return {
        version: version2,
        codec,
        multihashCode,
        digestSize,
        multihashSize,
        size
      };
    }
    static parse(source, base3) {
      const [prefix, bytes] = parseCIDtoBytes(source, base3);
      const cid = _CID.decode(bytes);
      cid._baseCache.set(prefix, source);
      return cid;
    }
  };
  var parseCIDtoBytes = (source, base3) => {
    switch (source[0]) {
      case "Q": {
        const decoder = base3 || base58btc;
        return [
          base58btc.prefix,
          decoder.decode(`${base58btc.prefix}${source}`)
        ];
      }
      case base58btc.prefix: {
        const decoder = base3 || base58btc;
        return [
          base58btc.prefix,
          decoder.decode(source)
        ];
      }
      case base32.prefix: {
        const decoder = base3 || base32;
        return [
          base32.prefix,
          decoder.decode(source)
        ];
      }
      default: {
        if (base3 == null) {
          throw Error("To parse non base32 or base58btc encoded CID multibase decoder must be provided");
        }
        return [
          source[0],
          base3.decode(source)
        ];
      }
    }
  };
  var toStringV0 = (bytes, cache, base3) => {
    const { prefix } = base3;
    if (prefix !== base58btc.prefix) {
      throw Error(`Cannot string encode V0 in ${base3.name} encoding`);
    }
    const cid = cache.get(prefix);
    if (cid == null) {
      const cid2 = base3.encode(bytes).slice(1);
      cache.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  };
  var toStringV1 = (bytes, cache, base3) => {
    const { prefix } = base3;
    const cid = cache.get(prefix);
    if (cid == null) {
      const cid2 = base3.encode(bytes);
      cache.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  };
  var DAG_PB_CODE = 112;
  var SHA_256_CODE = 18;
  var encodeCID = (version2, code2, multihash) => {
    const codeOffset = encodingLength(version2);
    const hashOffset = codeOffset + encodingLength(code2);
    const bytes = new Uint8Array(hashOffset + multihash.byteLength);
    encodeTo(version2, bytes, 0);
    encodeTo(code2, bytes, codeOffset);
    bytes.set(multihash, hashOffset);
    return bytes;
  };
  var cidSymbol = Symbol.for("@ipld/js-cid/CID");
  var readonly = {
    writable: false,
    configurable: false,
    enumerable: true
  };
  var hidden = {
    writable: false,
    enumerable: false,
    configurable: false
  };
  var version = "0.0.0-dev";
  var deprecate = (range, message) => {
    if (range.test(version)) {
      console.warn(message);
    } else {
      throw new Error(message);
    }
  };
  var IS_CID_DEPRECATION = `CID.isCID(v) is deprecated and will be removed in the next major release.
Following code pattern:

if (CID.isCID(value)) {
  doSomethingWithCID(value)
}

Is replaced with:

const cid = CID.asCID(value)
if (cid) {
  // Make sure to use cid instead of value
  doSomethingWithCID(cid)
}
`;

  // node_modules/multiformats/esm/src/basics.js
  var bases = {
    ...identity_exports,
    ...base2_exports,
    ...base8_exports,
    ...base10_exports,
    ...base16_exports,
    ...base32_exports,
    ...base36_exports,
    ...base58_exports,
    ...base64_exports,
    ...base256emoji_exports
  };
  var hashes = {
    ...sha2_browser_exports,
    ...identity_exports2
  };

  // node_modules/uint8arrays/esm/src/util/bases.js
  function createCodec(name2, prefix, encode6, decode7) {
    return {
      name: name2,
      prefix,
      encoder: {
        name: name2,
        prefix,
        encode: encode6
      },
      decoder: { decode: decode7 }
    };
  }
  var string = createCodec("utf8", "u", (buf) => {
    const decoder = new TextDecoder("utf8");
    return "u" + decoder.decode(buf);
  }, (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str.substring(1));
  });
  var ascii = createCodec("ascii", "a", (buf) => {
    let string2 = "a";
    for (let i = 0; i < buf.length; i++) {
      string2 += String.fromCharCode(buf[i]);
    }
    return string2;
  }, (str) => {
    str = str.substring(1);
    const buf = allocUnsafe(str.length);
    for (let i = 0; i < str.length; i++) {
      buf[i] = str.charCodeAt(i);
    }
    return buf;
  });
  var BASES = {
    utf8: string,
    "utf-8": string,
    hex: bases.base16,
    latin1: ascii,
    ascii,
    binary: ascii,
    ...bases
  };
  var bases_default = BASES;

  // node_modules/uint8arrays/esm/src/from-string.js
  function fromString2(string2, encoding = "utf8") {
    const base3 = bases_default[encoding];
    if (!base3) {
      throw new Error(`Unsupported encoding "${encoding}"`);
    }
    if ((encoding === "utf8" || encoding === "utf-8") && globalThis.Buffer != null && globalThis.Buffer.from != null) {
      return asUint8Array(globalThis.Buffer.from(string2, "utf-8"));
    }
    return base3.decoder.decode(`${base3.prefix}${string2}`);
  }

  // node_modules/uint8arrays/esm/src/to-string.js
  function toString2(array, encoding = "utf8") {
    const base3 = bases_default[encoding];
    if (!base3) {
      throw new Error(`Unsupported encoding "${encoding}"`);
    }
    if ((encoding === "utf8" || encoding === "utf-8") && globalThis.Buffer != null && globalThis.Buffer.from != null) {
      return globalThis.Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString("utf8");
    }
    return base3.encoder.encode(array).substring(1);
  }

  // node_modules/@noble/hashes/esm/crypto.js
  var crypto2 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

  // node_modules/@noble/hashes/esm/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function anumber(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error("positive integer expected, got " + n);
  }
  function abytes(b, ...lengths) {
    if (!isBytes(b))
      throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length))
      throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
  }
  function ahash(h) {
    if (typeof h !== "function" || typeof h.create !== "function")
      throw new Error("Hash should be wrapped by utils.createHasher");
    anumber(h.outputLen);
    anumber(h.blockLen);
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error("digestInto() expects output buffer of length at least " + min);
    }
  }
  function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  function rotl(word, shift) {
    return word << shift | word >>> 32 - shift >>> 0;
  }
  var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
  function byteSwap(word) {
    return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
  }
  function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = byteSwap(arr[i]);
    }
    return arr;
  }
  var swap32IfBE = isLE ? (u) => u : byteSwap32;
  function utf8ToBytes(str) {
    if (typeof str !== "string")
      throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function toBytes(data) {
    if (typeof data === "string")
      data = utf8ToBytes(data);
    abytes(data);
    return data;
  }
  function concatBytes(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      abytes(a);
      sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad);
      pad += a.length;
    }
    return res;
  }
  var Hash = class {
  };
  function createHasher(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
  }
  function randomBytes(bytesLength = 32) {
    if (crypto2 && typeof crypto2.getRandomValues === "function") {
      return crypto2.getRandomValues(new Uint8Array(bytesLength));
    }
    if (crypto2 && typeof crypto2.randomBytes === "function") {
      return Uint8Array.from(crypto2.randomBytes(bytesLength));
    }
    throw new Error("crypto.getRandomValues must be defined");
  }

  // node_modules/@noble/hashes/esm/_md.js
  function setBigUint64(view, byteOffset, value, isLE2) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE2);
    const _32n2 = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n2 & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE2 ? 4 : 0;
    const l = isLE2 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE2);
    view.setUint32(byteOffset + l, wl, isLE2);
  }
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD = class extends Hash {
    constructor(blockLen, outputLen, padOffset, isLE2) {
      super();
      this.finished = false;
      this.length = 0;
      this.pos = 0;
      this.destroyed = false;
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE2;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      aexists(this);
      data = toBytes(data);
      abytes(data);
      const { view, buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE: isLE2 } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      clean(this.buffer.subarray(pos));
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
      this.process(view, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen should be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE2);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length: length2, finished, destroyed, pos } = this;
      to.destroyed = destroyed;
      to.finished = finished;
      to.length = length2;
      to.pos = pos;
      if (length2 % blockLen)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  };
  var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  var SHA384_IV = /* @__PURE__ */ Uint32Array.from([
    3418070365,
    3238371032,
    1654270250,
    914150663,
    2438529370,
    812702999,
    355462360,
    4144912697,
    1731405415,
    4290775857,
    2394180231,
    1750603025,
    3675008525,
    1694076839,
    1203062813,
    3204075428
  ]);
  var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    4089235720,
    3144134277,
    2227873595,
    1013904242,
    4271175723,
    2773480762,
    1595750129,
    1359893119,
    2917565137,
    2600822924,
    725511199,
    528734635,
    4215389547,
    1541459225,
    327033209
  ]);

  // node_modules/@noble/hashes/esm/_u64.js
  var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
  var _32n = /* @__PURE__ */ BigInt(32);
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var shrSH = (h, _l, s) => h >>> s;
  var shrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
  var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
  var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
  var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
  var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
  var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
  var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
  }
  var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
  var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
  var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
  var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
  var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
  var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

  // node_modules/@noble/hashes/esm/sha2.js
  var SHA256_K = /* @__PURE__ */ Uint32Array.from([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  var SHA256 = class extends HashMD {
    constructor(outputLen = 32) {
      super(64, outputLen, 8, false);
      this.A = SHA256_IV[0] | 0;
      this.B = SHA256_IV[1] | 0;
      this.C = SHA256_IV[2] | 0;
      this.D = SHA256_IV[3] | 0;
      this.E = SHA256_IV[4] | 0;
      this.F = SHA256_IV[5] | 0;
      this.G = SHA256_IV[6] | 0;
      this.H = SHA256_IV[7] | 0;
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      clean(SHA256_W);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      clean(this.buffer);
    }
  };
  var K512 = /* @__PURE__ */ (() => split([
    "0x428a2f98d728ae22",
    "0x7137449123ef65cd",
    "0xb5c0fbcfec4d3b2f",
    "0xe9b5dba58189dbbc",
    "0x3956c25bf348b538",
    "0x59f111f1b605d019",
    "0x923f82a4af194f9b",
    "0xab1c5ed5da6d8118",
    "0xd807aa98a3030242",
    "0x12835b0145706fbe",
    "0x243185be4ee4b28c",
    "0x550c7dc3d5ffb4e2",
    "0x72be5d74f27b896f",
    "0x80deb1fe3b1696b1",
    "0x9bdc06a725c71235",
    "0xc19bf174cf692694",
    "0xe49b69c19ef14ad2",
    "0xefbe4786384f25e3",
    "0x0fc19dc68b8cd5b5",
    "0x240ca1cc77ac9c65",
    "0x2de92c6f592b0275",
    "0x4a7484aa6ea6e483",
    "0x5cb0a9dcbd41fbd4",
    "0x76f988da831153b5",
    "0x983e5152ee66dfab",
    "0xa831c66d2db43210",
    "0xb00327c898fb213f",
    "0xbf597fc7beef0ee4",
    "0xc6e00bf33da88fc2",
    "0xd5a79147930aa725",
    "0x06ca6351e003826f",
    "0x142929670a0e6e70",
    "0x27b70a8546d22ffc",
    "0x2e1b21385c26c926",
    "0x4d2c6dfc5ac42aed",
    "0x53380d139d95b3df",
    "0x650a73548baf63de",
    "0x766a0abb3c77b2a8",
    "0x81c2c92e47edaee6",
    "0x92722c851482353b",
    "0xa2bfe8a14cf10364",
    "0xa81a664bbc423001",
    "0xc24b8b70d0f89791",
    "0xc76c51a30654be30",
    "0xd192e819d6ef5218",
    "0xd69906245565a910",
    "0xf40e35855771202a",
    "0x106aa07032bbd1b8",
    "0x19a4c116b8d2d0c8",
    "0x1e376c085141ab53",
    "0x2748774cdf8eeb99",
    "0x34b0bcb5e19b48a8",
    "0x391c0cb3c5c95a63",
    "0x4ed8aa4ae3418acb",
    "0x5b9cca4f7763e373",
    "0x682e6ff3d6b2b8a3",
    "0x748f82ee5defb2fc",
    "0x78a5636f43172f60",
    "0x84c87814a1f0ab72",
    "0x8cc702081a6439ec",
    "0x90befffa23631e28",
    "0xa4506cebde82bde9",
    "0xbef9a3f7b2c67915",
    "0xc67178f2e372532b",
    "0xca273eceea26619c",
    "0xd186b8c721c0c207",
    "0xeada7dd6cde0eb1e",
    "0xf57d4f7fee6ed178",
    "0x06f067aa72176fba",
    "0x0a637dc5a2c898a6",
    "0x113f9804bef90dae",
    "0x1b710b35131c471b",
    "0x28db77f523047d84",
    "0x32caab7b40c72493",
    "0x3c9ebe0a15c9bebc",
    "0x431d67c49c100d4c",
    "0x4cc5d4becb3e42b6",
    "0x597f299cfc657e2a",
    "0x5fcb6fab3ad6faec",
    "0x6c44198c4a475817"
  ].map((n) => BigInt(n))))();
  var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
  var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
  var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
  var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
  var SHA512 = class extends HashMD {
    constructor(outputLen = 64) {
      super(128, outputLen, 16, false);
      this.Ah = SHA512_IV[0] | 0;
      this.Al = SHA512_IV[1] | 0;
      this.Bh = SHA512_IV[2] | 0;
      this.Bl = SHA512_IV[3] | 0;
      this.Ch = SHA512_IV[4] | 0;
      this.Cl = SHA512_IV[5] | 0;
      this.Dh = SHA512_IV[6] | 0;
      this.Dl = SHA512_IV[7] | 0;
      this.Eh = SHA512_IV[8] | 0;
      this.El = SHA512_IV[9] | 0;
      this.Fh = SHA512_IV[10] | 0;
      this.Fl = SHA512_IV[11] | 0;
      this.Gh = SHA512_IV[12] | 0;
      this.Gl = SHA512_IV[13] | 0;
      this.Hh = SHA512_IV[14] | 0;
      this.Hl = SHA512_IV[15] | 0;
    }
    // prettier-ignore
    get() {
      const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
      this.Ah = Ah | 0;
      this.Al = Al | 0;
      this.Bh = Bh | 0;
      this.Bl = Bl | 0;
      this.Ch = Ch | 0;
      this.Cl = Cl | 0;
      this.Dh = Dh | 0;
      this.Dl = Dl | 0;
      this.Eh = Eh | 0;
      this.El = El | 0;
      this.Fh = Fh | 0;
      this.Fl = Fl | 0;
      this.Gh = Gh | 0;
      this.Gl = Gl | 0;
      this.Hh = Hh | 0;
      this.Hl = Hl | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4) {
        SHA512_W_H[i] = view.getUint32(offset);
        SHA512_W_L[i] = view.getUint32(offset += 4);
      }
      for (let i = 16; i < 80; i++) {
        const W15h = SHA512_W_H[i - 15] | 0;
        const W15l = SHA512_W_L[i - 15] | 0;
        const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
        const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
        const W2h = SHA512_W_H[i - 2] | 0;
        const W2l = SHA512_W_L[i - 2] | 0;
        const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
        const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
        const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
        const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
        SHA512_W_H[i] = SUMh | 0;
        SHA512_W_L[i] = SUMl | 0;
      }
      let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      for (let i = 0; i < 80; i++) {
        const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
        const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
        const CHIh = Eh & Fh ^ ~Eh & Gh;
        const CHIl = El & Fl ^ ~El & Gl;
        const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
        const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
        const T1l = T1ll | 0;
        const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
        const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
        const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
        const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
        Hh = Gh | 0;
        Hl = Gl | 0;
        Gh = Fh | 0;
        Gl = Fl | 0;
        Fh = Eh | 0;
        Fl = El | 0;
        ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
        Dh = Ch | 0;
        Dl = Cl | 0;
        Ch = Bh | 0;
        Cl = Bl | 0;
        Bh = Ah | 0;
        Bl = Al | 0;
        const All = add3L(T1l, sigma0l, MAJl);
        Ah = add3H(All, T1h, sigma0h, MAJh);
        Al = All | 0;
      }
      ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
      ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
      ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
      ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
      ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
      ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
      ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
      ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
      this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
      clean(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
      clean(this.buffer);
      this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  };
  var SHA384 = class extends SHA512 {
    constructor() {
      super(48);
      this.Ah = SHA384_IV[0] | 0;
      this.Al = SHA384_IV[1] | 0;
      this.Bh = SHA384_IV[2] | 0;
      this.Bl = SHA384_IV[3] | 0;
      this.Ch = SHA384_IV[4] | 0;
      this.Cl = SHA384_IV[5] | 0;
      this.Dh = SHA384_IV[6] | 0;
      this.Dl = SHA384_IV[7] | 0;
      this.Eh = SHA384_IV[8] | 0;
      this.El = SHA384_IV[9] | 0;
      this.Fh = SHA384_IV[10] | 0;
      this.Fl = SHA384_IV[11] | 0;
      this.Gh = SHA384_IV[12] | 0;
      this.Gl = SHA384_IV[13] | 0;
      this.Hh = SHA384_IV[14] | 0;
      this.Hl = SHA384_IV[15] | 0;
    }
  };
  var sha2562 = /* @__PURE__ */ createHasher(() => new SHA256());
  var sha5122 = /* @__PURE__ */ createHasher(() => new SHA512());
  var sha384 = /* @__PURE__ */ createHasher(() => new SHA384());

  // node_modules/@noble/curves/esm/abstract/utils.js
  var _0n = /* @__PURE__ */ BigInt(0);
  var _1n = /* @__PURE__ */ BigInt(1);
  function isBytes2(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function abytes2(item) {
    if (!isBytes2(item))
      throw new Error("Uint8Array expected");
  }
  function abool(title, value) {
    if (typeof value !== "boolean")
      throw new Error(title + " boolean expected, got " + value);
  }
  function numberToHexUnpadded(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? "0" + hex : hex;
  }
  function hexToNumber(hex) {
    if (typeof hex !== "string")
      throw new Error("hex string expected, got " + typeof hex);
    return hex === "" ? _0n : BigInt("0x" + hex);
  }
  var hasHexBuiltin = (
    // @ts-ignore
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
  );
  var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex(bytes) {
    abytes2(bytes);
    if (hasHexBuiltin)
      return bytes.toHex();
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += hexes[bytes[i]];
    }
    return hex;
  }
  var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
  function asciiToBase16(ch) {
    if (ch >= asciis._0 && ch <= asciis._9)
      return ch - asciis._0;
    if (ch >= asciis.A && ch <= asciis.F)
      return ch - (asciis.A - 10);
    if (ch >= asciis.a && ch <= asciis.f)
      return ch - (asciis.a - 10);
    return;
  }
  function hexToBytes(hex) {
    if (typeof hex !== "string")
      throw new Error("hex string expected, got " + typeof hex);
    if (hasHexBuiltin)
      return Uint8Array.fromHex(hex);
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
      throw new Error("hex string expected, got unpadded hex of length " + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
      const n1 = asciiToBase16(hex.charCodeAt(hi));
      const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
      if (n1 === void 0 || n2 === void 0) {
        const char = hex[hi] + hex[hi + 1];
        throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
      }
      array[ai] = n1 * 16 + n2;
    }
    return array;
  }
  function bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
  }
  function bytesToNumberLE(bytes) {
    abytes2(bytes);
    return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
  }
  function numberToBytesBE(n, len) {
    return hexToBytes(n.toString(16).padStart(len * 2, "0"));
  }
  function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
  }
  function ensureBytes(title, hex, expectedLength) {
    let res;
    if (typeof hex === "string") {
      try {
        res = hexToBytes(hex);
      } catch (e) {
        throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
      }
    } else if (isBytes2(hex)) {
      res = Uint8Array.from(hex);
    } else {
      throw new Error(title + " must be hex string or Uint8Array");
    }
    const len = res.length;
    if (typeof expectedLength === "number" && len !== expectedLength)
      throw new Error(title + " of length " + expectedLength + " expected, got " + len);
    return res;
  }
  function concatBytes2(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      abytes2(a);
      sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad);
      pad += a.length;
    }
    return res;
  }
  var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
  function inRange(n, min, max) {
    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
  }
  function aInRange(title, n, min, max) {
    if (!inRange(n, min, max))
      throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
  }
  function bitLen(n) {
    let len;
    for (len = 0; n > _0n; n >>= _1n, len += 1)
      ;
    return len;
  }
  var bitMask = (n) => (_1n << BigInt(n)) - _1n;
  var u8n = (len) => new Uint8Array(len);
  var u8fr = (arr) => Uint8Array.from(arr);
  function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    if (typeof hashLen !== "number" || hashLen < 2)
      throw new Error("hashLen must be a number");
    if (typeof qByteLen !== "number" || qByteLen < 2)
      throw new Error("qByteLen must be a number");
    if (typeof hmacFn !== "function")
      throw new Error("hmacFn must be a function");
    let v = u8n(hashLen);
    let k = u8n(hashLen);
    let i = 0;
    const reset = () => {
      v.fill(1);
      k.fill(0);
      i = 0;
    };
    const h = (...b) => hmacFn(k, v, ...b);
    const reseed = (seed = u8n(0)) => {
      k = h(u8fr([0]), seed);
      v = h();
      if (seed.length === 0)
        return;
      k = h(u8fr([1]), seed);
      v = h();
    };
    const gen2 = () => {
      if (i++ >= 1e3)
        throw new Error("drbg: tried 1000 values");
      let len = 0;
      const out = [];
      while (len < qByteLen) {
        v = h();
        const sl = v.slice();
        out.push(sl);
        len += v.length;
      }
      return concatBytes2(...out);
    };
    const genUntil = (seed, pred) => {
      reset();
      reseed(seed);
      let res = void 0;
      while (!(res = pred(gen2())))
        reseed();
      reset();
      return res;
    };
    return genUntil;
  }
  var validatorFns = {
    bigint: (val) => typeof val === "bigint",
    function: (val) => typeof val === "function",
    boolean: (val) => typeof val === "boolean",
    string: (val) => typeof val === "string",
    stringOrUint8Array: (val) => typeof val === "string" || isBytes2(val),
    isSafeInteger: (val) => Number.isSafeInteger(val),
    array: (val) => Array.isArray(val),
    field: (val, object) => object.Fp.isValid(val),
    hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
  };
  function validateObject(object, validators, optValidators = {}) {
    const checkField = (fieldName, type, isOptional) => {
      const checkVal = validatorFns[type];
      if (typeof checkVal !== "function")
        throw new Error("invalid validator function");
      const val = object[fieldName];
      if (isOptional && val === void 0)
        return;
      if (!checkVal(val, object)) {
        throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
      }
    };
    for (const [fieldName, type] of Object.entries(validators))
      checkField(fieldName, type, false);
    for (const [fieldName, type] of Object.entries(optValidators))
      checkField(fieldName, type, true);
    return object;
  }
  function memoized(fn) {
    const map = /* @__PURE__ */ new WeakMap();
    return (arg, ...args) => {
      const val = map.get(arg);
      if (val !== void 0)
        return val;
      const computed = fn(arg, ...args);
      map.set(arg, computed);
      return computed;
    };
  }

  // node_modules/@noble/curves/esm/abstract/modular.js
  var _0n2 = BigInt(0);
  var _1n2 = BigInt(1);
  var _2n = /* @__PURE__ */ BigInt(2);
  var _3n = /* @__PURE__ */ BigInt(3);
  var _4n = /* @__PURE__ */ BigInt(4);
  var _5n = /* @__PURE__ */ BigInt(5);
  var _8n = /* @__PURE__ */ BigInt(8);
  var _9n = /* @__PURE__ */ BigInt(9);
  var _16n = /* @__PURE__ */ BigInt(16);
  function mod(a, b) {
    const result = a % b;
    return result >= _0n2 ? result : b + result;
  }
  function pow2(x, power, modulo) {
    let res = x;
    while (power-- > _0n2) {
      res *= res;
      res %= modulo;
    }
    return res;
  }
  function invert(number, modulo) {
    if (number === _0n2)
      throw new Error("invert: expected non-zero number");
    if (modulo <= _0n2)
      throw new Error("invert: expected positive modulus, got " + modulo);
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
    while (a !== _0n2) {
      const q = b / a;
      const r = b % a;
      const m = x - u * q;
      const n = y - v * q;
      b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd2 = b;
    if (gcd2 !== _1n2)
      throw new Error("invert: does not exist");
    return mod(x, modulo);
  }
  function tonelliShanks(P) {
    let Q = P - _1n2;
    let S = 0;
    while (Q % _2n === _0n2) {
      Q /= _2n;
      S++;
    }
    let Z = _2n;
    const _Fp = Field(P);
    while (Z < P && FpIsSquare(_Fp, Z)) {
      if (Z++ > 1e3)
        throw new Error("Cannot find square root: probably non-prime P");
    }
    if (S === 1) {
      const p1div4 = (P + _1n2) / _4n;
      return function tonelliFast(Fp2, n) {
        const root = Fp2.pow(n, p1div4);
        if (!Fp2.eql(Fp2.sqr(root), n))
          throw new Error("Cannot find square root");
        return root;
      };
    }
    const Q1div2 = (Q + _1n2) / _2n;
    return function tonelliSlow(Fp2, n) {
      if (!FpIsSquare(Fp2, n))
        throw new Error("Cannot find square root");
      let r = S;
      let g = Fp2.pow(Fp2.mul(Fp2.ONE, Z), Q);
      let x = Fp2.pow(n, Q1div2);
      let b = Fp2.pow(n, Q);
      while (!Fp2.eql(b, Fp2.ONE)) {
        if (Fp2.eql(b, Fp2.ZERO))
          return Fp2.ZERO;
        let m = 1;
        for (let t2 = Fp2.sqr(b); m < r; m++) {
          if (Fp2.eql(t2, Fp2.ONE))
            break;
          t2 = Fp2.sqr(t2);
        }
        const ge = Fp2.pow(g, _1n2 << BigInt(r - m - 1));
        g = Fp2.sqr(ge);
        x = Fp2.mul(x, ge);
        b = Fp2.mul(b, g);
        r = m;
      }
      return x;
    };
  }
  function FpSqrt(P) {
    if (P % _4n === _3n) {
      return function sqrt3mod4(Fp2, n) {
        const p1div4 = (P + _1n2) / _4n;
        const root = Fp2.pow(n, p1div4);
        if (!Fp2.eql(Fp2.sqr(root), n))
          throw new Error("Cannot find square root");
        return root;
      };
    }
    if (P % _8n === _5n) {
      return function sqrt5mod8(Fp2, n) {
        const n2 = Fp2.mul(n, _2n);
        const c1 = (P - _5n) / _8n;
        const v = Fp2.pow(n2, c1);
        const nv = Fp2.mul(n, v);
        const i = Fp2.mul(Fp2.mul(nv, _2n), v);
        const root = Fp2.mul(nv, Fp2.sub(i, Fp2.ONE));
        if (!Fp2.eql(Fp2.sqr(root), n))
          throw new Error("Cannot find square root");
        return root;
      };
    }
    if (P % _16n === _9n) {
    }
    return tonelliShanks(P);
  }
  var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
  var FIELD_FIELDS = [
    "create",
    "isValid",
    "is0",
    "neg",
    "inv",
    "sqrt",
    "sqr",
    "eql",
    "add",
    "sub",
    "mul",
    "pow",
    "div",
    "addN",
    "subN",
    "mulN",
    "sqrN"
  ];
  function validateField(field) {
    const initial = {
      ORDER: "bigint",
      MASK: "bigint",
      BYTES: "isSafeInteger",
      BITS: "isSafeInteger"
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
      map[val] = "function";
      return map;
    }, initial);
    return validateObject(field, opts);
  }
  function FpPow(Fp2, num, power) {
    if (power < _0n2)
      throw new Error("invalid exponent, negatives unsupported");
    if (power === _0n2)
      return Fp2.ONE;
    if (power === _1n2)
      return num;
    let p = Fp2.ONE;
    let d = num;
    while (power > _0n2) {
      if (power & _1n2)
        p = Fp2.mul(p, d);
      d = Fp2.sqr(d);
      power >>= _1n2;
    }
    return p;
  }
  function FpInvertBatch(Fp2, nums, passZero = false) {
    const inverted = new Array(nums.length).fill(passZero ? Fp2.ZERO : void 0);
    const multipliedAcc = nums.reduce((acc, num, i) => {
      if (Fp2.is0(num))
        return acc;
      inverted[i] = acc;
      return Fp2.mul(acc, num);
    }, Fp2.ONE);
    const invertedAcc = Fp2.inv(multipliedAcc);
    nums.reduceRight((acc, num, i) => {
      if (Fp2.is0(num))
        return acc;
      inverted[i] = Fp2.mul(acc, inverted[i]);
      return Fp2.mul(acc, num);
    }, invertedAcc);
    return inverted;
  }
  function FpLegendre(Fp2, n) {
    const legc = (Fp2.ORDER - _1n2) / _2n;
    const powered = Fp2.pow(n, legc);
    const yes = Fp2.eql(powered, Fp2.ONE);
    const zero = Fp2.eql(powered, Fp2.ZERO);
    const no = Fp2.eql(powered, Fp2.neg(Fp2.ONE));
    if (!yes && !zero && !no)
      throw new Error("Cannot find square root: probably non-prime P");
    return yes ? 1 : zero ? 0 : -1;
  }
  function FpIsSquare(Fp2, n) {
    const l = FpLegendre(Fp2, n);
    return l === 0 || l === 1;
  }
  function nLength(n, nBitLength) {
    if (nBitLength !== void 0)
      anumber(nBitLength);
    const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
  }
  function Field(ORDER, bitLen2, isLE2 = false, redef = {}) {
    if (ORDER <= _0n2)
      throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
    const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen2);
    if (BYTES > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    let sqrtP;
    const f = Object.freeze({
      ORDER,
      isLE: isLE2,
      BITS,
      BYTES,
      MASK: bitMask(BITS),
      ZERO: _0n2,
      ONE: _1n2,
      create: (num) => mod(num, ORDER),
      isValid: (num) => {
        if (typeof num !== "bigint")
          throw new Error("invalid field element: expected bigint, got " + typeof num);
        return _0n2 <= num && num < ORDER;
      },
      is0: (num) => num === _0n2,
      isOdd: (num) => (num & _1n2) === _1n2,
      neg: (num) => mod(-num, ORDER),
      eql: (lhs, rhs) => lhs === rhs,
      sqr: (num) => mod(num * num, ORDER),
      add: (lhs, rhs) => mod(lhs + rhs, ORDER),
      sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
      mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
      pow: (num, power) => FpPow(f, num, power),
      div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
      // Same as above, but doesn't normalize
      sqrN: (num) => num * num,
      addN: (lhs, rhs) => lhs + rhs,
      subN: (lhs, rhs) => lhs - rhs,
      mulN: (lhs, rhs) => lhs * rhs,
      inv: (num) => invert(num, ORDER),
      sqrt: redef.sqrt || ((n) => {
        if (!sqrtP)
          sqrtP = FpSqrt(ORDER);
        return sqrtP(f, n);
      }),
      toBytes: (num) => isLE2 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
      fromBytes: (bytes) => {
        if (bytes.length !== BYTES)
          throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
        return isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
      },
      // TODO: we don't need it here, move out to separate fn
      invertBatch: (lst) => FpInvertBatch(f, lst),
      // We can't move this out because Fp6, Fp12 implement it
      // and it's unclear what to return in there.
      cmov: (a, b, c) => c ? b : a
    });
    return Object.freeze(f);
  }
  function getFieldBytesLength(fieldOrder) {
    if (typeof fieldOrder !== "bigint")
      throw new Error("field order must be bigint");
    const bitLength = fieldOrder.toString(2).length;
    return Math.ceil(bitLength / 8);
  }
  function getMinHashLength(fieldOrder) {
    const length2 = getFieldBytesLength(fieldOrder);
    return length2 + Math.ceil(length2 / 2);
  }
  function mapHashToField(key, fieldOrder, isLE2 = false) {
    const len = key.length;
    const fieldLen = getFieldBytesLength(fieldOrder);
    const minLen = getMinHashLength(fieldOrder);
    if (len < 16 || len < minLen || len > 1024)
      throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
    const num = isLE2 ? bytesToNumberLE(key) : bytesToNumberBE(key);
    const reduced = mod(num, fieldOrder - _1n2) + _1n2;
    return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
  }

  // node_modules/@noble/curves/esm/abstract/curve.js
  var _0n3 = BigInt(0);
  var _1n3 = BigInt(1);
  function constTimeNegate(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
  }
  function validateW(W, bits) {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
      throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
  }
  function calcWOpts(W, scalarBits) {
    validateW(W, scalarBits);
    const windows = Math.ceil(scalarBits / W) + 1;
    const windowSize = 2 ** (W - 1);
    const maxNumber = 2 ** W;
    const mask = bitMask(W);
    const shiftBy = BigInt(W);
    return { windows, windowSize, mask, maxNumber, shiftBy };
  }
  function calcOffsets(n, window2, wOpts) {
    const { windowSize, mask, maxNumber, shiftBy } = wOpts;
    let wbits = Number(n & mask);
    let nextN = n >> shiftBy;
    if (wbits > windowSize) {
      wbits -= maxNumber;
      nextN += _1n3;
    }
    const offsetStart = window2 * windowSize;
    const offset = offsetStart + Math.abs(wbits) - 1;
    const isZero = wbits === 0;
    const isNeg = wbits < 0;
    const isNegF = window2 % 2 !== 0;
    const offsetF = offsetStart;
    return { nextN, offset, isZero, isNeg, isNegF, offsetF };
  }
  function validateMSMPoints(points, c) {
    if (!Array.isArray(points))
      throw new Error("array expected");
    points.forEach((p, i) => {
      if (!(p instanceof c))
        throw new Error("invalid point at index " + i);
    });
  }
  function validateMSMScalars(scalars, field) {
    if (!Array.isArray(scalars))
      throw new Error("array of scalars expected");
    scalars.forEach((s, i) => {
      if (!field.isValid(s))
        throw new Error("invalid scalar at index " + i);
    });
  }
  var pointPrecomputes = /* @__PURE__ */ new WeakMap();
  var pointWindowSizes = /* @__PURE__ */ new WeakMap();
  function getW(P) {
    return pointWindowSizes.get(P) || 1;
  }
  function wNAF(c, bits) {
    return {
      constTimeNegate,
      hasPrecomputes(elm) {
        return getW(elm) !== 1;
      },
      // non-const time multiplication ladder
      unsafeLadder(elm, n, p = c.ZERO) {
        let d = elm;
        while (n > _0n3) {
          if (n & _1n3)
            p = p.add(d);
          d = d.double();
          n >>= _1n3;
        }
        return p;
      },
      /**
       * Creates a wNAF precomputation window. Used for caching.
       * Default window size is set by `utils.precompute()` and is equal to 8.
       * Number of precomputed points depends on the curve size:
       * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
       * - 𝑊 is the window size
       * - 𝑛 is the bitlength of the curve order.
       * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
       * @param elm Point instance
       * @param W window size
       * @returns precomputed point tables flattened to a single array
       */
      precomputeWindow(elm, W) {
        const { windows, windowSize } = calcWOpts(W, bits);
        const points = [];
        let p = elm;
        let base3 = p;
        for (let window2 = 0; window2 < windows; window2++) {
          base3 = p;
          points.push(base3);
          for (let i = 1; i < windowSize; i++) {
            base3 = base3.add(p);
            points.push(base3);
          }
          p = base3.double();
        }
        return points;
      },
      /**
       * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
       * @param W window size
       * @param precomputes precomputed tables
       * @param n scalar (we don't check here, but should be less than curve order)
       * @returns real and fake (for const-time) points
       */
      wNAF(W, precomputes, n) {
        let p = c.ZERO;
        let f = c.BASE;
        const wo = calcWOpts(W, bits);
        for (let window2 = 0; window2 < wo.windows; window2++) {
          const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
          n = nextN;
          if (isZero) {
            f = f.add(constTimeNegate(isNegF, precomputes[offsetF]));
          } else {
            p = p.add(constTimeNegate(isNeg, precomputes[offset]));
          }
        }
        return { p, f };
      },
      /**
       * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
       * @param W window size
       * @param precomputes precomputed tables
       * @param n scalar (we don't check here, but should be less than curve order)
       * @param acc accumulator point to add result of multiplication
       * @returns point
       */
      wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
        const wo = calcWOpts(W, bits);
        for (let window2 = 0; window2 < wo.windows; window2++) {
          if (n === _0n3)
            break;
          const { nextN, offset, isZero, isNeg } = calcOffsets(n, window2, wo);
          n = nextN;
          if (isZero) {
            continue;
          } else {
            const item = precomputes[offset];
            acc = acc.add(isNeg ? item.negate() : item);
          }
        }
        return acc;
      },
      getPrecomputes(W, P, transform) {
        let comp = pointPrecomputes.get(P);
        if (!comp) {
          comp = this.precomputeWindow(P, W);
          if (W !== 1)
            pointPrecomputes.set(P, transform(comp));
        }
        return comp;
      },
      wNAFCached(P, n, transform) {
        const W = getW(P);
        return this.wNAF(W, this.getPrecomputes(W, P, transform), n);
      },
      wNAFCachedUnsafe(P, n, transform, prev) {
        const W = getW(P);
        if (W === 1)
          return this.unsafeLadder(P, n, prev);
        return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform), n, prev);
      },
      // We calculate precomputes for elliptic curve point multiplication
      // using windowed method. This specifies window size and
      // stores precomputed values. Usually only base point would be precomputed.
      setWindowSize(P, W) {
        validateW(W, bits);
        pointWindowSizes.set(P, W);
        pointPrecomputes.delete(P);
      }
    };
  }
  function pippenger(c, fieldN, points, scalars) {
    validateMSMPoints(points, c);
    validateMSMScalars(scalars, fieldN);
    if (points.length !== scalars.length)
      throw new Error("arrays of points and scalars must have equal length");
    const zero = c.ZERO;
    const wbits = bitLen(BigInt(points.length));
    const windowSize = wbits > 12 ? wbits - 3 : wbits > 4 ? wbits - 2 : wbits ? 2 : 1;
    const MASK = bitMask(windowSize);
    const buckets = new Array(Number(MASK) + 1).fill(zero);
    const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
    let sum = zero;
    for (let i = lastBits; i >= 0; i -= windowSize) {
      buckets.fill(zero);
      for (let j = 0; j < scalars.length; j++) {
        const scalar = scalars[j];
        const wbits2 = Number(scalar >> BigInt(i) & MASK);
        buckets[wbits2] = buckets[wbits2].add(points[j]);
      }
      let resI = zero;
      for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
        sumI = sumI.add(buckets[j]);
        resI = resI.add(sumI);
      }
      sum = sum.add(resI);
      if (i !== 0)
        for (let j = 0; j < windowSize; j++)
          sum = sum.double();
    }
    return sum;
  }
  function validateBasic(curve) {
    validateField(curve.Fp);
    validateObject(curve, {
      n: "bigint",
      h: "bigint",
      Gx: "field",
      Gy: "field"
    }, {
      nBitLength: "isSafeInteger",
      nByteLength: "isSafeInteger"
    });
    return Object.freeze({
      ...nLength(curve.n, curve.nBitLength),
      ...curve,
      ...{ p: curve.Fp.ORDER }
    });
  }

  // node_modules/@noble/curves/esm/abstract/edwards.js
  var _0n4 = BigInt(0);
  var _1n4 = BigInt(1);
  var _2n2 = BigInt(2);
  var _8n2 = BigInt(8);
  var VERIFY_DEFAULT = { zip215: true };
  function validateOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(curve, {
      hash: "function",
      a: "bigint",
      d: "bigint",
      randomBytes: "function"
    }, {
      adjustScalarBytes: "function",
      domain: "function",
      uvRatio: "function",
      mapToCurve: "function"
    });
    return Object.freeze({ ...opts });
  }
  function twistedEdwards(curveDef) {
    const CURVE = validateOpts(curveDef);
    const { Fp: Fp2, n: CURVE_ORDER, prehash, hash: cHash, randomBytes: randomBytes2, nByteLength, h: cofactor } = CURVE;
    const MASK = _2n2 << BigInt(nByteLength * 8) - _1n4;
    const modP = Fp2.create;
    const Fn = Field(CURVE.n, CURVE.nBitLength);
    const uvRatio2 = CURVE.uvRatio || ((u, v) => {
      try {
        return { isValid: true, value: Fp2.sqrt(u * Fp2.inv(v)) };
      } catch (e) {
        return { isValid: false, value: _0n4 };
      }
    });
    const adjustScalarBytes2 = CURVE.adjustScalarBytes || ((bytes) => bytes);
    const domain = CURVE.domain || ((data, ctx, phflag) => {
      abool("phflag", phflag);
      if (ctx.length || phflag)
        throw new Error("Contexts/pre-hash are not supported");
      return data;
    });
    function aCoordinate(title, n, banZero = false) {
      const min = banZero ? _1n4 : _0n4;
      aInRange("coordinate " + title, n, min, MASK);
    }
    function aextpoint(other) {
      if (!(other instanceof Point2))
        throw new Error("ExtendedPoint expected");
    }
    const toAffineMemo = memoized((p, iz) => {
      const { ex: x, ey: y, ez: z } = p;
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? _8n2 : Fp2.inv(z);
      const ax = modP(x * iz);
      const ay = modP(y * iz);
      const zz = modP(z * iz);
      if (is0)
        return { x: _0n4, y: _1n4 };
      if (zz !== _1n4)
        throw new Error("invZ was invalid");
      return { x: ax, y: ay };
    });
    const assertValidMemo = memoized((p) => {
      const { a, d } = CURVE;
      if (p.is0())
        throw new Error("bad point: ZERO");
      const { ex: X, ey: Y, ez: Z, et: T } = p;
      const X2 = modP(X * X);
      const Y2 = modP(Y * Y);
      const Z2 = modP(Z * Z);
      const Z4 = modP(Z2 * Z2);
      const aX2 = modP(X2 * a);
      const left = modP(Z2 * modP(aX2 + Y2));
      const right = modP(Z4 + modP(d * modP(X2 * Y2)));
      if (left !== right)
        throw new Error("bad point: equation left != right (1)");
      const XY = modP(X * Y);
      const ZT = modP(Z * T);
      if (XY !== ZT)
        throw new Error("bad point: equation left != right (2)");
      return true;
    });
    class Point2 {
      constructor(ex, ey, ez, et) {
        aCoordinate("x", ex);
        aCoordinate("y", ey);
        aCoordinate("z", ez, true);
        aCoordinate("t", et);
        this.ex = ex;
        this.ey = ey;
        this.ez = ez;
        this.et = et;
        Object.freeze(this);
      }
      get x() {
        return this.toAffine().x;
      }
      get y() {
        return this.toAffine().y;
      }
      static fromAffine(p) {
        if (p instanceof Point2)
          throw new Error("extended point not allowed");
        const { x, y } = p || {};
        aCoordinate("x", x);
        aCoordinate("y", y);
        return new Point2(x, y, _1n4, modP(x * y));
      }
      static normalizeZ(points) {
        const toInv = FpInvertBatch(Fp2, points.map((p) => p.ez));
        return points.map((p, i) => p.toAffine(toInv[i])).map(Point2.fromAffine);
      }
      // Multiscalar Multiplication
      static msm(points, scalars) {
        return pippenger(Point2, Fn, points, scalars);
      }
      // "Private method", don't use it directly
      _setWindowSize(windowSize) {
        wnaf.setWindowSize(this, windowSize);
      }
      // Not required for fromHex(), which always creates valid points.
      // Could be useful for fromAffine().
      assertValidity() {
        assertValidMemo(this);
      }
      // Compare one point to another.
      equals(other) {
        aextpoint(other);
        const { ex: X1, ey: Y1, ez: Z1 } = this;
        const { ex: X2, ey: Y2, ez: Z2 } = other;
        const X1Z2 = modP(X1 * Z2);
        const X2Z1 = modP(X2 * Z1);
        const Y1Z2 = modP(Y1 * Z2);
        const Y2Z1 = modP(Y2 * Z1);
        return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
      }
      is0() {
        return this.equals(Point2.ZERO);
      }
      negate() {
        return new Point2(modP(-this.ex), this.ey, this.ez, modP(-this.et));
      }
      // Fast algo for doubling Extended Point.
      // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
      // Cost: 4M + 4S + 1*a + 6add + 1*2.
      double() {
        const { a } = CURVE;
        const { ex: X1, ey: Y1, ez: Z1 } = this;
        const A = modP(X1 * X1);
        const B = modP(Y1 * Y1);
        const C = modP(_2n2 * modP(Z1 * Z1));
        const D = modP(a * A);
        const x1y1 = X1 + Y1;
        const E = modP(modP(x1y1 * x1y1) - A - B);
        const G2 = D + B;
        const F = G2 - C;
        const H = D - B;
        const X3 = modP(E * F);
        const Y3 = modP(G2 * H);
        const T3 = modP(E * H);
        const Z3 = modP(F * G2);
        return new Point2(X3, Y3, Z3, T3);
      }
      // Fast algo for adding 2 Extended Points.
      // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
      // Cost: 9M + 1*a + 1*d + 7add.
      add(other) {
        aextpoint(other);
        const { a, d } = CURVE;
        const { ex: X1, ey: Y1, ez: Z1, et: T1 } = this;
        const { ex: X2, ey: Y2, ez: Z2, et: T2 } = other;
        const A = modP(X1 * X2);
        const B = modP(Y1 * Y2);
        const C = modP(T1 * d * T2);
        const D = modP(Z1 * Z2);
        const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
        const F = D - C;
        const G2 = D + C;
        const H = modP(B - a * A);
        const X3 = modP(E * F);
        const Y3 = modP(G2 * H);
        const T3 = modP(E * H);
        const Z3 = modP(F * G2);
        return new Point2(X3, Y3, Z3, T3);
      }
      subtract(other) {
        return this.add(other.negate());
      }
      wNAF(n) {
        return wnaf.wNAFCached(this, n, Point2.normalizeZ);
      }
      // Constant-time multiplication.
      multiply(scalar) {
        const n = scalar;
        aInRange("scalar", n, _1n4, CURVE_ORDER);
        const { p, f } = this.wNAF(n);
        return Point2.normalizeZ([p, f])[0];
      }
      // Non-constant-time multiplication. Uses double-and-add algorithm.
      // It's faster, but should only be used when you don't care about
      // an exposed private key e.g. sig verification.
      // Does NOT allow scalars higher than CURVE.n.
      // Accepts optional accumulator to merge with multiply (important for sparse scalars)
      multiplyUnsafe(scalar, acc = Point2.ZERO) {
        const n = scalar;
        aInRange("scalar", n, _0n4, CURVE_ORDER);
        if (n === _0n4)
          return I;
        if (this.is0() || n === _1n4)
          return this;
        return wnaf.wNAFCachedUnsafe(this, n, Point2.normalizeZ, acc);
      }
      // Checks if point is of small order.
      // If you add something to small order point, you will have "dirty"
      // point with torsion component.
      // Multiplies point by cofactor and checks if the result is 0.
      isSmallOrder() {
        return this.multiplyUnsafe(cofactor).is0();
      }
      // Multiplies point by curve order and checks if the result is 0.
      // Returns `false` is the point is dirty.
      isTorsionFree() {
        return wnaf.unsafeLadder(this, CURVE_ORDER).is0();
      }
      // Converts Extended point to default (x, y) coordinates.
      // Can accept precomputed Z^-1 - for example, from invertBatch.
      toAffine(iz) {
        return toAffineMemo(this, iz);
      }
      clearCofactor() {
        const { h: cofactor2 } = CURVE;
        if (cofactor2 === _1n4)
          return this;
        return this.multiplyUnsafe(cofactor2);
      }
      // Converts hash string or Uint8Array to Point.
      // Uses algo from RFC8032 5.1.3.
      static fromHex(hex, zip215 = false) {
        const { d, a } = CURVE;
        const len = Fp2.BYTES;
        hex = ensureBytes("pointHex", hex, len);
        abool("zip215", zip215);
        const normed = hex.slice();
        const lastByte = hex[len - 1];
        normed[len - 1] = lastByte & ~128;
        const y = bytesToNumberLE(normed);
        const max = zip215 ? MASK : Fp2.ORDER;
        aInRange("pointHex.y", y, _0n4, max);
        const y2 = modP(y * y);
        const u = modP(y2 - _1n4);
        const v = modP(d * y2 - a);
        let { isValid, value: x } = uvRatio2(u, v);
        if (!isValid)
          throw new Error("Point.fromHex: invalid y coordinate");
        const isXOdd = (x & _1n4) === _1n4;
        const isLastByteOdd = (lastByte & 128) !== 0;
        if (!zip215 && x === _0n4 && isLastByteOdd)
          throw new Error("Point.fromHex: x=0 and x_0=1");
        if (isLastByteOdd !== isXOdd)
          x = modP(-x);
        return Point2.fromAffine({ x, y });
      }
      static fromPrivateKey(privKey) {
        const { scalar } = getPrivateScalar(privKey);
        return G.multiply(scalar);
      }
      toRawBytes() {
        const { x, y } = this.toAffine();
        const bytes = numberToBytesLE(y, Fp2.BYTES);
        bytes[bytes.length - 1] |= x & _1n4 ? 128 : 0;
        return bytes;
      }
      toHex() {
        return bytesToHex(this.toRawBytes());
      }
    }
    Point2.BASE = new Point2(CURVE.Gx, CURVE.Gy, _1n4, modP(CURVE.Gx * CURVE.Gy));
    Point2.ZERO = new Point2(_0n4, _1n4, _1n4, _0n4);
    const { BASE: G, ZERO: I } = Point2;
    const wnaf = wNAF(Point2, nByteLength * 8);
    function modN(a) {
      return mod(a, CURVE_ORDER);
    }
    function modN_LE(hash) {
      return modN(bytesToNumberLE(hash));
    }
    function getPrivateScalar(key) {
      const len = Fp2.BYTES;
      key = ensureBytes("private key", key, len);
      const hashed = ensureBytes("hashed private key", cHash(key), 2 * len);
      const head = adjustScalarBytes2(hashed.slice(0, len));
      const prefix = hashed.slice(len, 2 * len);
      const scalar = modN_LE(head);
      return { head, prefix, scalar };
    }
    function getExtendedPublicKey(key) {
      const { head, prefix, scalar } = getPrivateScalar(key);
      const point = G.multiply(scalar);
      const pointBytes = point.toRawBytes();
      return { head, prefix, scalar, point, pointBytes };
    }
    function getPublicKey(privKey) {
      return getExtendedPublicKey(privKey).pointBytes;
    }
    function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
      const msg = concatBytes2(...msgs);
      return modN_LE(cHash(domain(msg, ensureBytes("context", context), !!prehash)));
    }
    function sign(msg, privKey, options = {}) {
      msg = ensureBytes("message", msg);
      if (prehash)
        msg = prehash(msg);
      const { prefix, scalar, pointBytes } = getExtendedPublicKey(privKey);
      const r = hashDomainToScalar(options.context, prefix, msg);
      const R = G.multiply(r).toRawBytes();
      const k = hashDomainToScalar(options.context, R, pointBytes, msg);
      const s = modN(r + k * scalar);
      aInRange("signature.s", s, _0n4, CURVE_ORDER);
      const res = concatBytes2(R, numberToBytesLE(s, Fp2.BYTES));
      return ensureBytes("result", res, Fp2.BYTES * 2);
    }
    const verifyOpts = VERIFY_DEFAULT;
    function verify(sig, msg, publicKey, options = verifyOpts) {
      const { context, zip215 } = options;
      const len = Fp2.BYTES;
      sig = ensureBytes("signature", sig, 2 * len);
      msg = ensureBytes("message", msg);
      publicKey = ensureBytes("publicKey", publicKey, len);
      if (zip215 !== void 0)
        abool("zip215", zip215);
      if (prehash)
        msg = prehash(msg);
      const s = bytesToNumberLE(sig.slice(len, 2 * len));
      let A, R, SB;
      try {
        A = Point2.fromHex(publicKey, zip215);
        R = Point2.fromHex(sig.slice(0, len), zip215);
        SB = G.multiplyUnsafe(s);
      } catch (error) {
        return false;
      }
      if (!zip215 && A.isSmallOrder())
        return false;
      const k = hashDomainToScalar(context, R.toRawBytes(), A.toRawBytes(), msg);
      const RkA = R.add(A.multiplyUnsafe(k));
      return RkA.subtract(SB).clearCofactor().equals(Point2.ZERO);
    }
    G._setWindowSize(8);
    const utils = {
      getExtendedPublicKey,
      /** ed25519 priv keys are uniform 32b. No need to check for modulo bias, like in secp256k1. */
      randomPrivateKey: () => randomBytes2(Fp2.BYTES),
      /**
       * We're doing scalar multiplication (used in getPublicKey etc) with precomputed BASE_POINT
       * values. This slows down first getPublicKey() by milliseconds (see Speed section),
       * but allows to speed-up subsequent getPublicKey() calls up to 20x.
       * @param windowSize 2, 4, 8, 16
       */
      precompute(windowSize = 8, point = Point2.BASE) {
        point._setWindowSize(windowSize);
        point.multiply(BigInt(3));
        return point;
      }
    };
    return {
      CURVE,
      getPublicKey,
      sign,
      verify,
      ExtendedPoint: Point2,
      utils
    };
  }

  // node_modules/@noble/curves/esm/ed25519.js
  var ED25519_P = BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819949");
  var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
  var _0n5 = BigInt(0);
  var _1n5 = BigInt(1);
  var _2n3 = BigInt(2);
  var _3n2 = BigInt(3);
  var _5n2 = BigInt(5);
  var _8n3 = BigInt(8);
  function ed25519_pow_2_252_3(x) {
    const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
    const P = ED25519_P;
    const x2 = x * x % P;
    const b2 = x2 * x % P;
    const b4 = pow2(b2, _2n3, P) * b2 % P;
    const b5 = pow2(b4, _1n5, P) * x % P;
    const b10 = pow2(b5, _5n2, P) * b5 % P;
    const b20 = pow2(b10, _10n, P) * b10 % P;
    const b40 = pow2(b20, _20n, P) * b20 % P;
    const b80 = pow2(b40, _40n, P) * b40 % P;
    const b160 = pow2(b80, _80n, P) * b80 % P;
    const b240 = pow2(b160, _80n, P) * b80 % P;
    const b250 = pow2(b240, _10n, P) * b10 % P;
    const pow_p_5_8 = pow2(b250, _2n3, P) * x % P;
    return { pow_p_5_8, b2 };
  }
  function adjustScalarBytes(bytes) {
    bytes[0] &= 248;
    bytes[31] &= 127;
    bytes[31] |= 64;
    return bytes;
  }
  function uvRatio(u, v) {
    const P = ED25519_P;
    const v3 = mod(v * v * v, P);
    const v7 = mod(v3 * v3 * v, P);
    const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
    let x = mod(u * v3 * pow, P);
    const vx2 = mod(v * x * x, P);
    const root1 = x;
    const root2 = mod(x * ED25519_SQRT_M1, P);
    const useRoot1 = vx2 === u;
    const useRoot2 = vx2 === mod(-u, P);
    const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
    if (useRoot1)
      x = root1;
    if (useRoot2 || noRoot)
      x = root2;
    if (isNegativeLE(x, P))
      x = mod(-x, P);
    return { isValid: useRoot1 || useRoot2, value: x };
  }
  var Fp = /* @__PURE__ */ (() => Field(ED25519_P, void 0, true))();
  var ed25519Defaults = /* @__PURE__ */ (() => ({
    // Removing Fp.create() will still work, and is 10% faster on sign
    a: Fp.create(BigInt(-1)),
    // d is -121665/121666 a.k.a. Fp.neg(121665 * Fp.inv(121666))
    d: BigInt("37095705934669439343138083508754565189542113879843219016388785533085940283555"),
    // Finite field 2n**255n - 19n
    Fp,
    // Subgroup order 2n**252n + 27742317777372353535851937790883648493n;
    n: BigInt("7237005577332262213973186563042994240857116359379907606001950938285454250989"),
    h: _8n3,
    Gx: BigInt("15112221349535400772501151409588531511454012693041857206046113283949847762202"),
    Gy: BigInt("46316835694926478169428394003475163141307993866256225615783033603165251855960"),
    hash: sha5122,
    randomBytes,
    adjustScalarBytes,
    // dom2
    // Ratio of u to v. Allows us to combine inversion and square root. Uses algo from RFC8032 5.1.3.
    // Constant-time, u/√v
    uvRatio
  }))();
  var ed25519 = /* @__PURE__ */ (() => twistedEdwards(ed25519Defaults))();

  // node_modules/did-jwt/lib/index.module.js
  var import_multibase = __toESM(require_src2(), 1);

  // node_modules/@noble/hashes/esm/hmac.js
  var HMAC = class extends Hash {
    constructor(hash, _key) {
      super();
      this.finished = false;
      this.destroyed = false;
      ahash(hash);
      const key = toBytes(_key);
      this.iHash = hash.create();
      if (typeof this.iHash.update !== "function")
        throw new Error("Expected instance of class which extends utils.Hash");
      this.blockLen = this.iHash.blockLen;
      this.outputLen = this.iHash.outputLen;
      const blockLen = this.blockLen;
      const pad = new Uint8Array(blockLen);
      pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54;
      this.iHash.update(pad);
      this.oHash = hash.create();
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54 ^ 92;
      this.oHash.update(pad);
      clean(pad);
    }
    update(buf) {
      aexists(this);
      this.iHash.update(buf);
      return this;
    }
    digestInto(out) {
      aexists(this);
      abytes(out, this.outputLen);
      this.finished = true;
      this.iHash.digestInto(out);
      this.oHash.update(out);
      this.oHash.digestInto(out);
      this.destroy();
    }
    digest() {
      const out = new Uint8Array(this.oHash.outputLen);
      this.digestInto(out);
      return out;
    }
    _cloneInto(to) {
      to || (to = Object.create(Object.getPrototypeOf(this), {}));
      const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
      to = to;
      to.finished = finished;
      to.destroyed = destroyed;
      to.blockLen = blockLen;
      to.outputLen = outputLen;
      to.oHash = oHash._cloneInto(to.oHash);
      to.iHash = iHash._cloneInto(to.iHash);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
    destroy() {
      this.destroyed = true;
      this.oHash.destroy();
      this.iHash.destroy();
    }
  };
  var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
  hmac.create = (hash, key) => new HMAC(hash, key);

  // node_modules/@noble/curves/esm/abstract/weierstrass.js
  function validateSigVerOpts(opts) {
    if (opts.lowS !== void 0)
      abool("lowS", opts.lowS);
    if (opts.prehash !== void 0)
      abool("prehash", opts.prehash);
  }
  function validatePointOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
      a: "field",
      b: "field"
    }, {
      allowedPrivateKeyLengths: "array",
      wrapPrivateKey: "boolean",
      isTorsionFree: "function",
      clearCofactor: "function",
      allowInfinityPoint: "boolean",
      fromBytes: "function",
      toBytes: "function"
    });
    const { endo, Fp: Fp2, a } = opts;
    if (endo) {
      if (!Fp2.eql(a, Fp2.ZERO)) {
        throw new Error("invalid endomorphism, can only be defined for Koblitz curves that have a=0");
      }
      if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
        throw new Error("invalid endomorphism, expected beta: bigint and splitScalar: function");
      }
    }
    return Object.freeze({ ...opts });
  }
  var DERErr = class extends Error {
    constructor(m = "") {
      super(m);
    }
  };
  var DER = {
    // asn.1 DER encoding utils
    Err: DERErr,
    // Basic building block is TLV (Tag-Length-Value)
    _tlv: {
      encode: (tag, data) => {
        const { Err: E } = DER;
        if (tag < 0 || tag > 256)
          throw new E("tlv.encode: wrong tag");
        if (data.length & 1)
          throw new E("tlv.encode: unpadded data");
        const dataLen = data.length / 2;
        const len = numberToHexUnpadded(dataLen);
        if (len.length / 2 & 128)
          throw new E("tlv.encode: long form length too big");
        const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
        const t = numberToHexUnpadded(tag);
        return t + lenLen + len + data;
      },
      // v - value, l - left bytes (unparsed)
      decode(tag, data) {
        const { Err: E } = DER;
        let pos = 0;
        if (tag < 0 || tag > 256)
          throw new E("tlv.encode: wrong tag");
        if (data.length < 2 || data[pos++] !== tag)
          throw new E("tlv.decode: wrong tlv");
        const first = data[pos++];
        const isLong = !!(first & 128);
        let length2 = 0;
        if (!isLong)
          length2 = first;
        else {
          const lenLen = first & 127;
          if (!lenLen)
            throw new E("tlv.decode(long): indefinite length not supported");
          if (lenLen > 4)
            throw new E("tlv.decode(long): byte length is too big");
          const lengthBytes = data.subarray(pos, pos + lenLen);
          if (lengthBytes.length !== lenLen)
            throw new E("tlv.decode: length bytes not complete");
          if (lengthBytes[0] === 0)
            throw new E("tlv.decode(long): zero leftmost byte");
          for (const b of lengthBytes)
            length2 = length2 << 8 | b;
          pos += lenLen;
          if (length2 < 128)
            throw new E("tlv.decode(long): not minimal encoding");
        }
        const v = data.subarray(pos, pos + length2);
        if (v.length !== length2)
          throw new E("tlv.decode: wrong value length");
        return { v, l: data.subarray(pos + length2) };
      }
    },
    // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
    // since we always use positive integers here. It must always be empty:
    // - add zero byte if exists
    // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
    _int: {
      encode(num) {
        const { Err: E } = DER;
        if (num < _0n6)
          throw new E("integer: negative integers are not allowed");
        let hex = numberToHexUnpadded(num);
        if (Number.parseInt(hex[0], 16) & 8)
          hex = "00" + hex;
        if (hex.length & 1)
          throw new E("unexpected DER parsing assertion: unpadded hex");
        return hex;
      },
      decode(data) {
        const { Err: E } = DER;
        if (data[0] & 128)
          throw new E("invalid signature integer: negative");
        if (data[0] === 0 && !(data[1] & 128))
          throw new E("invalid signature integer: unnecessary leading zero");
        return bytesToNumberBE(data);
      }
    },
    toSig(hex) {
      const { Err: E, _int: int, _tlv: tlv } = DER;
      const data = ensureBytes("signature", hex);
      const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
      if (seqLeftBytes.length)
        throw new E("invalid signature: left bytes after parsing");
      const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
      const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
      if (sLeftBytes.length)
        throw new E("invalid signature: left bytes after parsing");
      return { r: int.decode(rBytes), s: int.decode(sBytes) };
    },
    hexFromSig(sig) {
      const { _tlv: tlv, _int: int } = DER;
      const rs = tlv.encode(2, int.encode(sig.r));
      const ss = tlv.encode(2, int.encode(sig.s));
      const seq = rs + ss;
      return tlv.encode(48, seq);
    }
  };
  var _0n6 = BigInt(0);
  var _1n6 = BigInt(1);
  var _2n4 = BigInt(2);
  var _3n3 = BigInt(3);
  var _4n2 = BigInt(4);
  function weierstrassPoints(opts) {
    const CURVE = validatePointOpts(opts);
    const { Fp: Fp2 } = CURVE;
    const Fn = Field(CURVE.n, CURVE.nBitLength);
    const toBytes2 = CURVE.toBytes || ((_c, point, _isCompressed) => {
      const a = point.toAffine();
      return concatBytes2(Uint8Array.from([4]), Fp2.toBytes(a.x), Fp2.toBytes(a.y));
    });
    const fromBytes = CURVE.fromBytes || ((bytes) => {
      const tail = bytes.subarray(1);
      const x = Fp2.fromBytes(tail.subarray(0, Fp2.BYTES));
      const y = Fp2.fromBytes(tail.subarray(Fp2.BYTES, 2 * Fp2.BYTES));
      return { x, y };
    });
    function weierstrassEquation(x) {
      const { a, b } = CURVE;
      const x2 = Fp2.sqr(x);
      const x3 = Fp2.mul(x2, x);
      return Fp2.add(Fp2.add(x3, Fp2.mul(x, a)), b);
    }
    if (!Fp2.eql(Fp2.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx)))
      throw new Error("bad generator point: equation left != right");
    function isWithinCurveOrder(num) {
      return inRange(num, _1n6, CURVE.n);
    }
    function normPrivateKeyToScalar(key) {
      const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
      if (lengths && typeof key !== "bigint") {
        if (isBytes2(key))
          key = bytesToHex(key);
        if (typeof key !== "string" || !lengths.includes(key.length))
          throw new Error("invalid private key");
        key = key.padStart(nByteLength * 2, "0");
      }
      let num;
      try {
        num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
      } catch (error) {
        throw new Error("invalid private key, expected hex or " + nByteLength + " bytes, got " + typeof key);
      }
      if (wrapPrivateKey)
        num = mod(num, N);
      aInRange("private key", num, _1n6, N);
      return num;
    }
    function aprjpoint(other) {
      if (!(other instanceof Point2))
        throw new Error("ProjectivePoint expected");
    }
    const toAffineMemo = memoized((p, iz) => {
      const { px: x, py: y, pz: z } = p;
      if (Fp2.eql(z, Fp2.ONE))
        return { x, y };
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? Fp2.ONE : Fp2.inv(z);
      const ax = Fp2.mul(x, iz);
      const ay = Fp2.mul(y, iz);
      const zz = Fp2.mul(z, iz);
      if (is0)
        return { x: Fp2.ZERO, y: Fp2.ZERO };
      if (!Fp2.eql(zz, Fp2.ONE))
        throw new Error("invZ was invalid");
      return { x: ax, y: ay };
    });
    const assertValidMemo = memoized((p) => {
      if (p.is0()) {
        if (CURVE.allowInfinityPoint && !Fp2.is0(p.py))
          return;
        throw new Error("bad point: ZERO");
      }
      const { x, y } = p.toAffine();
      if (!Fp2.isValid(x) || !Fp2.isValid(y))
        throw new Error("bad point: x or y not FE");
      const left = Fp2.sqr(y);
      const right = weierstrassEquation(x);
      if (!Fp2.eql(left, right))
        throw new Error("bad point: equation left != right");
      if (!p.isTorsionFree())
        throw new Error("bad point: not in prime-order subgroup");
      return true;
    });
    class Point2 {
      constructor(px, py, pz) {
        if (px == null || !Fp2.isValid(px))
          throw new Error("x required");
        if (py == null || !Fp2.isValid(py) || Fp2.is0(py))
          throw new Error("y required");
        if (pz == null || !Fp2.isValid(pz))
          throw new Error("z required");
        this.px = px;
        this.py = py;
        this.pz = pz;
        Object.freeze(this);
      }
      // Does not validate if the point is on-curve.
      // Use fromHex instead, or call assertValidity() later.
      static fromAffine(p) {
        const { x, y } = p || {};
        if (!p || !Fp2.isValid(x) || !Fp2.isValid(y))
          throw new Error("invalid affine point");
        if (p instanceof Point2)
          throw new Error("projective point not allowed");
        const is0 = (i) => Fp2.eql(i, Fp2.ZERO);
        if (is0(x) && is0(y))
          return Point2.ZERO;
        return new Point2(x, y, Fp2.ONE);
      }
      get x() {
        return this.toAffine().x;
      }
      get y() {
        return this.toAffine().y;
      }
      /**
       * Takes a bunch of Projective Points but executes only one
       * inversion on all of them. Inversion is very slow operation,
       * so this improves performance massively.
       * Optimization: converts a list of projective points to a list of identical points with Z=1.
       */
      static normalizeZ(points) {
        const toInv = FpInvertBatch(Fp2, points.map((p) => p.pz));
        return points.map((p, i) => p.toAffine(toInv[i])).map(Point2.fromAffine);
      }
      /**
       * Converts hash string or Uint8Array to Point.
       * @param hex short/long ECDSA hex
       */
      static fromHex(hex) {
        const P = Point2.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
        P.assertValidity();
        return P;
      }
      // Multiplies generator point by privateKey.
      static fromPrivateKey(privateKey) {
        return Point2.BASE.multiply(normPrivateKeyToScalar(privateKey));
      }
      // Multiscalar Multiplication
      static msm(points, scalars) {
        return pippenger(Point2, Fn, points, scalars);
      }
      // "Private method", don't use it directly
      _setWindowSize(windowSize) {
        wnaf.setWindowSize(this, windowSize);
      }
      // A point on curve is valid if it conforms to equation.
      assertValidity() {
        assertValidMemo(this);
      }
      hasEvenY() {
        const { y } = this.toAffine();
        if (Fp2.isOdd)
          return !Fp2.isOdd(y);
        throw new Error("Field doesn't support isOdd");
      }
      /**
       * Compare one point to another.
       */
      equals(other) {
        aprjpoint(other);
        const { px: X1, py: Y1, pz: Z1 } = this;
        const { px: X2, py: Y2, pz: Z2 } = other;
        const U1 = Fp2.eql(Fp2.mul(X1, Z2), Fp2.mul(X2, Z1));
        const U2 = Fp2.eql(Fp2.mul(Y1, Z2), Fp2.mul(Y2, Z1));
        return U1 && U2;
      }
      /**
       * Flips point to one corresponding to (x, -y) in Affine coordinates.
       */
      negate() {
        return new Point2(this.px, Fp2.neg(this.py), this.pz);
      }
      // Renes-Costello-Batina exception-free doubling formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 3
      // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
      double() {
        const { a, b } = CURVE;
        const b3 = Fp2.mul(b, _3n3);
        const { px: X1, py: Y1, pz: Z1 } = this;
        let X3 = Fp2.ZERO, Y3 = Fp2.ZERO, Z3 = Fp2.ZERO;
        let t0 = Fp2.mul(X1, X1);
        let t1 = Fp2.mul(Y1, Y1);
        let t2 = Fp2.mul(Z1, Z1);
        let t3 = Fp2.mul(X1, Y1);
        t3 = Fp2.add(t3, t3);
        Z3 = Fp2.mul(X1, Z1);
        Z3 = Fp2.add(Z3, Z3);
        X3 = Fp2.mul(a, Z3);
        Y3 = Fp2.mul(b3, t2);
        Y3 = Fp2.add(X3, Y3);
        X3 = Fp2.sub(t1, Y3);
        Y3 = Fp2.add(t1, Y3);
        Y3 = Fp2.mul(X3, Y3);
        X3 = Fp2.mul(t3, X3);
        Z3 = Fp2.mul(b3, Z3);
        t2 = Fp2.mul(a, t2);
        t3 = Fp2.sub(t0, t2);
        t3 = Fp2.mul(a, t3);
        t3 = Fp2.add(t3, Z3);
        Z3 = Fp2.add(t0, t0);
        t0 = Fp2.add(Z3, t0);
        t0 = Fp2.add(t0, t2);
        t0 = Fp2.mul(t0, t3);
        Y3 = Fp2.add(Y3, t0);
        t2 = Fp2.mul(Y1, Z1);
        t2 = Fp2.add(t2, t2);
        t0 = Fp2.mul(t2, t3);
        X3 = Fp2.sub(X3, t0);
        Z3 = Fp2.mul(t2, t1);
        Z3 = Fp2.add(Z3, Z3);
        Z3 = Fp2.add(Z3, Z3);
        return new Point2(X3, Y3, Z3);
      }
      // Renes-Costello-Batina exception-free addition formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 1
      // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
      add(other) {
        aprjpoint(other);
        const { px: X1, py: Y1, pz: Z1 } = this;
        const { px: X2, py: Y2, pz: Z2 } = other;
        let X3 = Fp2.ZERO, Y3 = Fp2.ZERO, Z3 = Fp2.ZERO;
        const a = CURVE.a;
        const b3 = Fp2.mul(CURVE.b, _3n3);
        let t0 = Fp2.mul(X1, X2);
        let t1 = Fp2.mul(Y1, Y2);
        let t2 = Fp2.mul(Z1, Z2);
        let t3 = Fp2.add(X1, Y1);
        let t4 = Fp2.add(X2, Y2);
        t3 = Fp2.mul(t3, t4);
        t4 = Fp2.add(t0, t1);
        t3 = Fp2.sub(t3, t4);
        t4 = Fp2.add(X1, Z1);
        let t5 = Fp2.add(X2, Z2);
        t4 = Fp2.mul(t4, t5);
        t5 = Fp2.add(t0, t2);
        t4 = Fp2.sub(t4, t5);
        t5 = Fp2.add(Y1, Z1);
        X3 = Fp2.add(Y2, Z2);
        t5 = Fp2.mul(t5, X3);
        X3 = Fp2.add(t1, t2);
        t5 = Fp2.sub(t5, X3);
        Z3 = Fp2.mul(a, t4);
        X3 = Fp2.mul(b3, t2);
        Z3 = Fp2.add(X3, Z3);
        X3 = Fp2.sub(t1, Z3);
        Z3 = Fp2.add(t1, Z3);
        Y3 = Fp2.mul(X3, Z3);
        t1 = Fp2.add(t0, t0);
        t1 = Fp2.add(t1, t0);
        t2 = Fp2.mul(a, t2);
        t4 = Fp2.mul(b3, t4);
        t1 = Fp2.add(t1, t2);
        t2 = Fp2.sub(t0, t2);
        t2 = Fp2.mul(a, t2);
        t4 = Fp2.add(t4, t2);
        t0 = Fp2.mul(t1, t4);
        Y3 = Fp2.add(Y3, t0);
        t0 = Fp2.mul(t5, t4);
        X3 = Fp2.mul(t3, X3);
        X3 = Fp2.sub(X3, t0);
        t0 = Fp2.mul(t3, t1);
        Z3 = Fp2.mul(t5, Z3);
        Z3 = Fp2.add(Z3, t0);
        return new Point2(X3, Y3, Z3);
      }
      subtract(other) {
        return this.add(other.negate());
      }
      is0() {
        return this.equals(Point2.ZERO);
      }
      wNAF(n) {
        return wnaf.wNAFCached(this, n, Point2.normalizeZ);
      }
      /**
       * Non-constant-time multiplication. Uses double-and-add algorithm.
       * It's faster, but should only be used when you don't care about
       * an exposed private key e.g. sig verification, which works over *public* keys.
       */
      multiplyUnsafe(sc) {
        const { endo, n: N } = CURVE;
        aInRange("scalar", sc, _0n6, N);
        const I = Point2.ZERO;
        if (sc === _0n6)
          return I;
        if (this.is0() || sc === _1n6)
          return this;
        if (!endo || wnaf.hasPrecomputes(this))
          return wnaf.wNAFCachedUnsafe(this, sc, Point2.normalizeZ);
        let { k1neg, k1, k2neg, k2 } = endo.splitScalar(sc);
        let k1p = I;
        let k2p = I;
        let d = this;
        while (k1 > _0n6 || k2 > _0n6) {
          if (k1 & _1n6)
            k1p = k1p.add(d);
          if (k2 & _1n6)
            k2p = k2p.add(d);
          d = d.double();
          k1 >>= _1n6;
          k2 >>= _1n6;
        }
        if (k1neg)
          k1p = k1p.negate();
        if (k2neg)
          k2p = k2p.negate();
        k2p = new Point2(Fp2.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
        return k1p.add(k2p);
      }
      /**
       * Constant time multiplication.
       * Uses wNAF method. Windowed method may be 10% faster,
       * but takes 2x longer to generate and consumes 2x memory.
       * Uses precomputes when available.
       * Uses endomorphism for Koblitz curves.
       * @param scalar by which the point would be multiplied
       * @returns New point
       */
      multiply(scalar) {
        const { endo, n: N } = CURVE;
        aInRange("scalar", scalar, _1n6, N);
        let point, fake;
        if (endo) {
          const { k1neg, k1, k2neg, k2 } = endo.splitScalar(scalar);
          let { p: k1p, f: f1p } = this.wNAF(k1);
          let { p: k2p, f: f2p } = this.wNAF(k2);
          k1p = wnaf.constTimeNegate(k1neg, k1p);
          k2p = wnaf.constTimeNegate(k2neg, k2p);
          k2p = new Point2(Fp2.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
          point = k1p.add(k2p);
          fake = f1p.add(f2p);
        } else {
          const { p, f } = this.wNAF(scalar);
          point = p;
          fake = f;
        }
        return Point2.normalizeZ([point, fake])[0];
      }
      /**
       * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
       * Not using Strauss-Shamir trick: precomputation tables are faster.
       * The trick could be useful if both P and Q are not G (not in our case).
       * @returns non-zero affine point
       */
      multiplyAndAddUnsafe(Q, a, b) {
        const G = Point2.BASE;
        const mul = (P, a2) => a2 === _0n6 || a2 === _1n6 || !P.equals(G) ? P.multiplyUnsafe(a2) : P.multiply(a2);
        const sum = mul(this, a).add(mul(Q, b));
        return sum.is0() ? void 0 : sum;
      }
      // Converts Projective point to affine (x, y) coordinates.
      // Can accept precomputed Z^-1 - for example, from invertBatch.
      // (x, y, z) ∋ (x=x/z, y=y/z)
      toAffine(iz) {
        return toAffineMemo(this, iz);
      }
      isTorsionFree() {
        const { h: cofactor, isTorsionFree } = CURVE;
        if (cofactor === _1n6)
          return true;
        if (isTorsionFree)
          return isTorsionFree(Point2, this);
        throw new Error("isTorsionFree() has not been declared for the elliptic curve");
      }
      clearCofactor() {
        const { h: cofactor, clearCofactor } = CURVE;
        if (cofactor === _1n6)
          return this;
        if (clearCofactor)
          return clearCofactor(Point2, this);
        return this.multiplyUnsafe(CURVE.h);
      }
      toRawBytes(isCompressed = true) {
        abool("isCompressed", isCompressed);
        this.assertValidity();
        return toBytes2(Point2, this, isCompressed);
      }
      toHex(isCompressed = true) {
        abool("isCompressed", isCompressed);
        return bytesToHex(this.toRawBytes(isCompressed));
      }
    }
    Point2.BASE = new Point2(CURVE.Gx, CURVE.Gy, Fp2.ONE);
    Point2.ZERO = new Point2(Fp2.ZERO, Fp2.ONE, Fp2.ZERO);
    const _bits = CURVE.nBitLength;
    const wnaf = wNAF(Point2, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
    return {
      CURVE,
      ProjectivePoint: Point2,
      normPrivateKeyToScalar,
      weierstrassEquation,
      isWithinCurveOrder
    };
  }
  function validateOpts2(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
      hash: "hash",
      hmac: "function",
      randomBytes: "function"
    }, {
      bits2int: "function",
      bits2int_modN: "function",
      lowS: "boolean"
    });
    return Object.freeze({ lowS: true, ...opts });
  }
  function weierstrass(curveDef) {
    const CURVE = validateOpts2(curveDef);
    const { Fp: Fp2, n: CURVE_ORDER } = CURVE;
    const compressedLen = Fp2.BYTES + 1;
    const uncompressedLen = 2 * Fp2.BYTES + 1;
    function modN(a) {
      return mod(a, CURVE_ORDER);
    }
    function invN(a) {
      return invert(a, CURVE_ORDER);
    }
    const { ProjectivePoint: Point2, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
      ...CURVE,
      toBytes(_c, point, isCompressed) {
        const a = point.toAffine();
        const x = Fp2.toBytes(a.x);
        const cat = concatBytes2;
        abool("isCompressed", isCompressed);
        if (isCompressed) {
          return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
        } else {
          return cat(Uint8Array.from([4]), x, Fp2.toBytes(a.y));
        }
      },
      fromBytes(bytes) {
        const len = bytes.length;
        const head = bytes[0];
        const tail = bytes.subarray(1);
        if (len === compressedLen && (head === 2 || head === 3)) {
          const x = bytesToNumberBE(tail);
          if (!inRange(x, _1n6, Fp2.ORDER))
            throw new Error("Point is not on curve");
          const y2 = weierstrassEquation(x);
          let y;
          try {
            y = Fp2.sqrt(y2);
          } catch (sqrtError) {
            const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
            throw new Error("Point is not on curve" + suffix);
          }
          const isYOdd = (y & _1n6) === _1n6;
          const isHeadOdd = (head & 1) === 1;
          if (isHeadOdd !== isYOdd)
            y = Fp2.neg(y);
          return { x, y };
        } else if (len === uncompressedLen && head === 4) {
          const x = Fp2.fromBytes(tail.subarray(0, Fp2.BYTES));
          const y = Fp2.fromBytes(tail.subarray(Fp2.BYTES, 2 * Fp2.BYTES));
          return { x, y };
        } else {
          const cl = compressedLen;
          const ul = uncompressedLen;
          throw new Error("invalid Point, expected length of " + cl + ", or uncompressed " + ul + ", got " + len);
        }
      }
    });
    const numToNByteHex = (num) => bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
    function isBiggerThanHalfOrder(number) {
      const HALF = CURVE_ORDER >> _1n6;
      return number > HALF;
    }
    function normalizeS(s) {
      return isBiggerThanHalfOrder(s) ? modN(-s) : s;
    }
    const slcNum = (b, from3, to) => bytesToNumberBE(b.slice(from3, to));
    class Signature {
      constructor(r, s, recovery) {
        aInRange("r", r, _1n6, CURVE_ORDER);
        aInRange("s", s, _1n6, CURVE_ORDER);
        this.r = r;
        this.s = s;
        if (recovery != null)
          this.recovery = recovery;
        Object.freeze(this);
      }
      // pair (bytes of r, bytes of s)
      static fromCompact(hex) {
        const l = CURVE.nByteLength;
        hex = ensureBytes("compactSignature", hex, l * 2);
        return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
      }
      // DER encoded ECDSA signature
      // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
      static fromDER(hex) {
        const { r, s } = DER.toSig(ensureBytes("DER", hex));
        return new Signature(r, s);
      }
      /**
       * @todo remove
       * @deprecated
       */
      assertValidity() {
      }
      addRecoveryBit(recovery) {
        return new Signature(this.r, this.s, recovery);
      }
      recoverPublicKey(msgHash) {
        const { r, s, recovery: rec } = this;
        const h = bits2int_modN(ensureBytes("msgHash", msgHash));
        if (rec == null || ![0, 1, 2, 3].includes(rec))
          throw new Error("recovery id invalid");
        const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
        if (radj >= Fp2.ORDER)
          throw new Error("recovery id 2 or 3 invalid");
        const prefix = (rec & 1) === 0 ? "02" : "03";
        const R = Point2.fromHex(prefix + numToNByteHex(radj));
        const ir = invN(radj);
        const u1 = modN(-h * ir);
        const u2 = modN(s * ir);
        const Q = Point2.BASE.multiplyAndAddUnsafe(R, u1, u2);
        if (!Q)
          throw new Error("point at infinify");
        Q.assertValidity();
        return Q;
      }
      // Signatures should be low-s, to prevent malleability.
      hasHighS() {
        return isBiggerThanHalfOrder(this.s);
      }
      normalizeS() {
        return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
      }
      // DER-encoded
      toDERRawBytes() {
        return hexToBytes(this.toDERHex());
      }
      toDERHex() {
        return DER.hexFromSig(this);
      }
      // padded bytes of r, then padded bytes of s
      toCompactRawBytes() {
        return hexToBytes(this.toCompactHex());
      }
      toCompactHex() {
        return numToNByteHex(this.r) + numToNByteHex(this.s);
      }
    }
    const utils = {
      isValidPrivateKey(privateKey) {
        try {
          normPrivateKeyToScalar(privateKey);
          return true;
        } catch (error) {
          return false;
        }
      },
      normPrivateKeyToScalar,
      /**
       * Produces cryptographically secure private key from random of size
       * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
       */
      randomPrivateKey: () => {
        const length2 = getMinHashLength(CURVE.n);
        return mapHashToField(CURVE.randomBytes(length2), CURVE.n);
      },
      /**
       * Creates precompute table for an arbitrary EC point. Makes point "cached".
       * Allows to massively speed-up `point.multiply(scalar)`.
       * @returns cached point
       * @example
       * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
       * fast.multiply(privKey); // much faster ECDH now
       */
      precompute(windowSize = 8, point = Point2.BASE) {
        point._setWindowSize(windowSize);
        point.multiply(BigInt(3));
        return point;
      }
    };
    function getPublicKey(privateKey, isCompressed = true) {
      return Point2.fromPrivateKey(privateKey).toRawBytes(isCompressed);
    }
    function isProbPub(item) {
      const arr = isBytes2(item);
      const str = typeof item === "string";
      const len = (arr || str) && item.length;
      if (arr)
        return len === compressedLen || len === uncompressedLen;
      if (str)
        return len === 2 * compressedLen || len === 2 * uncompressedLen;
      if (item instanceof Point2)
        return true;
      return false;
    }
    function getSharedSecret(privateA, publicB, isCompressed = true) {
      if (isProbPub(privateA))
        throw new Error("first arg must be private key");
      if (!isProbPub(publicB))
        throw new Error("second arg must be public key");
      const b = Point2.fromHex(publicB);
      return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
    }
    const bits2int = CURVE.bits2int || function(bytes) {
      if (bytes.length > 8192)
        throw new Error("input is too large");
      const num = bytesToNumberBE(bytes);
      const delta = bytes.length * 8 - CURVE.nBitLength;
      return delta > 0 ? num >> BigInt(delta) : num;
    };
    const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
      return modN(bits2int(bytes));
    };
    const ORDER_MASK = bitMask(CURVE.nBitLength);
    function int2octets(num) {
      aInRange("num < 2^" + CURVE.nBitLength, num, _0n6, ORDER_MASK);
      return numberToBytesBE(num, CURVE.nByteLength);
    }
    function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
      if (["recovered", "canonical"].some((k) => k in opts))
        throw new Error("sign() legacy options not supported");
      const { hash, randomBytes: randomBytes2 } = CURVE;
      let { lowS, prehash, extraEntropy: ent } = opts;
      if (lowS == null)
        lowS = true;
      msgHash = ensureBytes("msgHash", msgHash);
      validateSigVerOpts(opts);
      if (prehash)
        msgHash = ensureBytes("prehashed msgHash", hash(msgHash));
      const h1int = bits2int_modN(msgHash);
      const d = normPrivateKeyToScalar(privateKey);
      const seedArgs = [int2octets(d), int2octets(h1int)];
      if (ent != null && ent !== false) {
        const e = ent === true ? randomBytes2(Fp2.BYTES) : ent;
        seedArgs.push(ensureBytes("extraEntropy", e));
      }
      const seed = concatBytes2(...seedArgs);
      const m = h1int;
      function k2sig(kBytes) {
        const k = bits2int(kBytes);
        if (!isWithinCurveOrder(k))
          return;
        const ik = invN(k);
        const q = Point2.BASE.multiply(k).toAffine();
        const r = modN(q.x);
        if (r === _0n6)
          return;
        const s = modN(ik * modN(m + r * d));
        if (s === _0n6)
          return;
        let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n6);
        let normS = s;
        if (lowS && isBiggerThanHalfOrder(s)) {
          normS = normalizeS(s);
          recovery ^= 1;
        }
        return new Signature(r, normS, recovery);
      }
      return { seed, k2sig };
    }
    const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
    const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
    function sign(msgHash, privKey, opts = defaultSigOpts) {
      const { seed, k2sig } = prepSig(msgHash, privKey, opts);
      const C = CURVE;
      const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
      return drbg(seed, k2sig);
    }
    Point2.BASE._setWindowSize(8);
    function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
      const sg = signature;
      msgHash = ensureBytes("msgHash", msgHash);
      publicKey = ensureBytes("publicKey", publicKey);
      const { lowS, prehash, format } = opts;
      validateSigVerOpts(opts);
      if ("strict" in opts)
        throw new Error("options.strict was renamed to lowS");
      if (format !== void 0 && format !== "compact" && format !== "der")
        throw new Error("format must be compact or der");
      const isHex = typeof sg === "string" || isBytes2(sg);
      const isObj = !isHex && !format && typeof sg === "object" && sg !== null && typeof sg.r === "bigint" && typeof sg.s === "bigint";
      if (!isHex && !isObj)
        throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
      let _sig = void 0;
      let P;
      try {
        if (isObj)
          _sig = new Signature(sg.r, sg.s);
        if (isHex) {
          try {
            if (format !== "compact")
              _sig = Signature.fromDER(sg);
          } catch (derError) {
            if (!(derError instanceof DER.Err))
              throw derError;
          }
          if (!_sig && format !== "der")
            _sig = Signature.fromCompact(sg);
        }
        P = Point2.fromHex(publicKey);
      } catch (error) {
        return false;
      }
      if (!_sig)
        return false;
      if (lowS && _sig.hasHighS())
        return false;
      if (prehash)
        msgHash = CURVE.hash(msgHash);
      const { r, s } = _sig;
      const h = bits2int_modN(msgHash);
      const is = invN(s);
      const u1 = modN(h * is);
      const u2 = modN(r * is);
      const R = Point2.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
      if (!R)
        return false;
      const v = modN(R.x);
      return v === r;
    }
    return {
      CURVE,
      getPublicKey,
      getSharedSecret,
      sign,
      verify,
      ProjectivePoint: Point2,
      Signature,
      utils
    };
  }

  // node_modules/@noble/curves/esm/_shortw_utils.js
  function getHash(hash) {
    return {
      hash,
      hmac: (key, ...msgs) => hmac(hash, key, concatBytes(...msgs)),
      randomBytes
    };
  }
  function createCurve(curveDef, defHash) {
    const create2 = (hash) => weierstrass({ ...curveDef, ...getHash(hash) });
    return { ...create2(defHash), create: create2 };
  }

  // node_modules/@noble/curves/esm/secp256k1.js
  var secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
  var secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
  var _1n7 = BigInt(1);
  var _2n5 = BigInt(2);
  var divNearest = (a, b) => (a + b / _2n5) / b;
  function sqrtMod(y) {
    const P = secp256k1P;
    const _3n4 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
    const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
    const b2 = y * y * y % P;
    const b3 = b2 * b2 * y % P;
    const b6 = pow2(b3, _3n4, P) * b3 % P;
    const b9 = pow2(b6, _3n4, P) * b3 % P;
    const b11 = pow2(b9, _2n5, P) * b2 % P;
    const b22 = pow2(b11, _11n, P) * b11 % P;
    const b44 = pow2(b22, _22n, P) * b22 % P;
    const b88 = pow2(b44, _44n, P) * b44 % P;
    const b176 = pow2(b88, _88n, P) * b88 % P;
    const b220 = pow2(b176, _44n, P) * b44 % P;
    const b223 = pow2(b220, _3n4, P) * b3 % P;
    const t1 = pow2(b223, _23n, P) * b22 % P;
    const t2 = pow2(t1, _6n, P) * b2 % P;
    const root = pow2(t2, _2n5, P);
    if (!Fpk1.eql(Fpk1.sqr(root), y))
      throw new Error("Cannot find square root");
    return root;
  }
  var Fpk1 = Field(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
  var secp256k1 = createCurve({
    a: BigInt(0),
    b: BigInt(7),
    Fp: Fpk1,
    n: secp256k1N,
    Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
    Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
    h: BigInt(1),
    lowS: true,
    // Allow only low-S signatures by default in sign() and verify()
    endo: {
      // Endomorphism, see above
      beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
      splitScalar: (k) => {
        const n = secp256k1N;
        const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
        const b1 = -_1n7 * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
        const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
        const b2 = a1;
        const POW_2_128 = BigInt("0x100000000000000000000000000000000");
        const c1 = divNearest(b2 * k, n);
        const c2 = divNearest(-b1 * k, n);
        let k1 = mod(k - c1 * a1 - c2 * a2, n);
        let k2 = mod(-c1 * b1 - c2 * b2, n);
        const k1neg = k1 > POW_2_128;
        const k2neg = k2 > POW_2_128;
        if (k1neg)
          k1 = n - k1;
        if (k2neg)
          k2 = n - k2;
        if (k1 > POW_2_128 || k2 > POW_2_128) {
          throw new Error("splitScalar: Endomorphism failed, k=" + k);
        }
        return { k1neg, k1, k2neg, k2 };
      }
    }
  }, sha2562);
  var _0n7 = BigInt(0);
  var Point = secp256k1.ProjectivePoint;

  // node_modules/@noble/curves/esm/nist.js
  var Fp256 = Field(BigInt("0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"));
  var p256_a = Fp256.create(BigInt("-3"));
  var p256_b = BigInt("0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b");
  var p256 = createCurve({
    a: p256_a,
    b: p256_b,
    Fp: Fp256,
    n: BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"),
    Gx: BigInt("0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"),
    Gy: BigInt("0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"),
    h: BigInt(1),
    lowS: false
  }, sha2562);
  var Fp384 = Field(BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff"));
  var p384_a = Fp384.create(BigInt("-3"));
  var p384_b = BigInt("0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef");
  var p384 = createCurve({
    a: p384_a,
    b: p384_b,
    Fp: Fp384,
    n: BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973"),
    Gx: BigInt("0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"),
    Gy: BigInt("0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"),
    h: BigInt(1),
    lowS: false
  }, sha384);
  var Fp521 = Field(BigInt("0x1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
  var p521_a = Fp521.create(BigInt("-3"));
  var p521_b = BigInt("0x0051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00");
  var p521 = createCurve({
    a: p521_a,
    b: p521_b,
    Fp: Fp521,
    n: BigInt("0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409"),
    Gx: BigInt("0x00c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66"),
    Gy: BigInt("0x011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650"),
    h: BigInt(1),
    lowS: false,
    allowedPrivateKeyLengths: [130, 131, 132]
    // P521 keys are variable-length. Normalize to 132b
  }, sha5122);

  // node_modules/@noble/curves/esm/p256.js
  var p2562 = p256;

  // node_modules/@noble/hashes/esm/sha256.js
  var sha2563 = sha2562;

  // node_modules/@noble/hashes/esm/legacy.js
  var Rho160 = /* @__PURE__ */ Uint8Array.from([
    7,
    4,
    13,
    1,
    10,
    6,
    15,
    3,
    12,
    0,
    9,
    5,
    2,
    14,
    11,
    8
  ]);
  var Id160 = /* @__PURE__ */ (() => Uint8Array.from(new Array(16).fill(0).map((_, i) => i)))();
  var Pi160 = /* @__PURE__ */ (() => Id160.map((i) => (9 * i + 5) % 16))();
  var idxLR = /* @__PURE__ */ (() => {
    const L = [Id160];
    const R = [Pi160];
    const res = [L, R];
    for (let i = 0; i < 4; i++)
      for (let j of res)
        j.push(j[i].map((k) => Rho160[k]));
    return res;
  })();
  var idxL = /* @__PURE__ */ (() => idxLR[0])();
  var idxR = /* @__PURE__ */ (() => idxLR[1])();
  var shifts160 = /* @__PURE__ */ [
    [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
    [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
    [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
    [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
    [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
  ].map((i) => Uint8Array.from(i));
  var shiftsL160 = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts160[i][j]));
  var shiftsR160 = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts160[i][j]));
  var Kl160 = /* @__PURE__ */ Uint32Array.from([
    0,
    1518500249,
    1859775393,
    2400959708,
    2840853838
  ]);
  var Kr160 = /* @__PURE__ */ Uint32Array.from([
    1352829926,
    1548603684,
    1836072691,
    2053994217,
    0
  ]);
  function ripemd_f(group, x, y, z) {
    if (group === 0)
      return x ^ y ^ z;
    if (group === 1)
      return x & y | ~x & z;
    if (group === 2)
      return (x | ~y) ^ z;
    if (group === 3)
      return x & z | y & ~z;
    return x ^ (y | ~z);
  }
  var BUF_160 = /* @__PURE__ */ new Uint32Array(16);
  var RIPEMD160 = class extends HashMD {
    constructor() {
      super(64, 20, 8, true);
      this.h0 = 1732584193 | 0;
      this.h1 = 4023233417 | 0;
      this.h2 = 2562383102 | 0;
      this.h3 = 271733878 | 0;
      this.h4 = 3285377520 | 0;
    }
    get() {
      const { h0, h1, h2, h3, h4 } = this;
      return [h0, h1, h2, h3, h4];
    }
    set(h0, h1, h2, h3, h4) {
      this.h0 = h0 | 0;
      this.h1 = h1 | 0;
      this.h2 = h2 | 0;
      this.h3 = h3 | 0;
      this.h4 = h4 | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        BUF_160[i] = view.getUint32(offset, true);
      let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
      for (let group = 0; group < 5; group++) {
        const rGroup = 4 - group;
        const hbl = Kl160[group], hbr = Kr160[group];
        const rl = idxL[group], rr = idxR[group];
        const sl = shiftsL160[group], sr = shiftsR160[group];
        for (let i = 0; i < 16; i++) {
          const tl = rotl(al + ripemd_f(group, bl, cl, dl) + BUF_160[rl[i]] + hbl, sl[i]) + el | 0;
          al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
        }
        for (let i = 0; i < 16; i++) {
          const tr = rotl(ar + ripemd_f(rGroup, br, cr, dr) + BUF_160[rr[i]] + hbr, sr[i]) + er | 0;
          ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
        }
      }
      this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
    }
    roundClean() {
      clean(BUF_160);
    }
    destroy() {
      this.destroyed = true;
      clean(this.buffer);
      this.set(0, 0, 0, 0, 0);
    }
  };
  var ripemd160 = /* @__PURE__ */ createHasher(() => new RIPEMD160());

  // node_modules/@noble/hashes/esm/ripemd160.js
  var ripemd1602 = ripemd160;

  // node_modules/@noble/hashes/esm/sha3.js
  var _0n8 = BigInt(0);
  var _1n8 = BigInt(1);
  var _2n6 = BigInt(2);
  var _7n = BigInt(7);
  var _256n = BigInt(256);
  var _0x71n = BigInt(113);
  var SHA3_PI = [];
  var SHA3_ROTL = [];
  var _SHA3_IOTA = [];
  for (let round = 0, R = _1n8, x = 1, y = 0; round < 24; round++) {
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
    let t = _0n8;
    for (let j = 0; j < 7; j++) {
      R = (R << _1n8 ^ (R >> _7n) * _0x71n) % _256n;
      if (R & _2n6)
        t ^= _1n8 << (_1n8 << /* @__PURE__ */ BigInt(j)) - _1n8;
    }
    _SHA3_IOTA.push(t);
  }
  var IOTAS = split(_SHA3_IOTA, true);
  var SHA3_IOTA_H = IOTAS[0];
  var SHA3_IOTA_L = IOTAS[1];
  var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
  var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
  function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    for (let round = 24 - rounds; round < 24; round++) {
      for (let x = 0; x < 10; x++)
        B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      for (let x = 0; x < 10; x += 2) {
        const idx1 = (x + 8) % 10;
        const idx0 = (x + 2) % 10;
        const B0 = B[idx0];
        const B1 = B[idx0 + 1];
        const Th = rotlH(B0, B1, 1) ^ B[idx1];
        const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
        for (let y = 0; y < 50; y += 10) {
          s[x + y] ^= Th;
          s[x + y + 1] ^= Tl;
        }
      }
      let curH = s[2];
      let curL = s[3];
      for (let t = 0; t < 24; t++) {
        const shift = SHA3_ROTL[t];
        const Th = rotlH(curH, curL, shift);
        const Tl = rotlL(curH, curL, shift);
        const PI = SHA3_PI[t];
        curH = s[PI];
        curL = s[PI + 1];
        s[PI] = Th;
        s[PI + 1] = Tl;
      }
      for (let y = 0; y < 50; y += 10) {
        for (let x = 0; x < 10; x++)
          B[x] = s[y + x];
        for (let x = 0; x < 10; x++)
          s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
      }
      s[0] ^= SHA3_IOTA_H[round];
      s[1] ^= SHA3_IOTA_L[round];
    }
    clean(B);
  }
  var Keccak = class _Keccak extends Hash {
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
      super();
      this.pos = 0;
      this.posOut = 0;
      this.finished = false;
      this.destroyed = false;
      this.enableXOF = false;
      this.blockLen = blockLen;
      this.suffix = suffix;
      this.outputLen = outputLen;
      this.enableXOF = enableXOF;
      this.rounds = rounds;
      anumber(outputLen);
      if (!(0 < blockLen && blockLen < 200))
        throw new Error("only keccak-f1600 function is supported");
      this.state = new Uint8Array(200);
      this.state32 = u32(this.state);
    }
    clone() {
      return this._cloneInto();
    }
    keccak() {
      swap32IfBE(this.state32);
      keccakP(this.state32, this.rounds);
      swap32IfBE(this.state32);
      this.posOut = 0;
      this.pos = 0;
    }
    update(data) {
      aexists(this);
      data = toBytes(data);
      abytes(data);
      const { blockLen, state } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        for (let i = 0; i < take; i++)
          state[this.pos++] ^= data[pos++];
        if (this.pos === blockLen)
          this.keccak();
      }
      return this;
    }
    finish() {
      if (this.finished)
        return;
      this.finished = true;
      const { state, suffix, pos, blockLen } = this;
      state[pos] ^= suffix;
      if ((suffix & 128) !== 0 && pos === blockLen - 1)
        this.keccak();
      state[blockLen - 1] ^= 128;
      this.keccak();
    }
    writeInto(out) {
      aexists(this, false);
      abytes(out);
      this.finish();
      const bufferOut = this.state;
      const { blockLen } = this;
      for (let pos = 0, len = out.length; pos < len; ) {
        if (this.posOut >= blockLen)
          this.keccak();
        const take = Math.min(blockLen - this.posOut, len - pos);
        out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
        this.posOut += take;
        pos += take;
      }
      return out;
    }
    xofInto(out) {
      if (!this.enableXOF)
        throw new Error("XOF is not possible for this instance");
      return this.writeInto(out);
    }
    xof(bytes) {
      anumber(bytes);
      return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
      aoutput(out, this);
      if (this.finished)
        throw new Error("digest() was already called");
      this.writeInto(out);
      this.destroy();
      return out;
    }
    digest() {
      return this.digestInto(new Uint8Array(this.outputLen));
    }
    destroy() {
      this.destroyed = true;
      clean(this.state);
    }
    _cloneInto(to) {
      const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
      to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
      to.state32.set(this.state32);
      to.pos = this.pos;
      to.posOut = this.posOut;
      to.finished = this.finished;
      to.rounds = rounds;
      to.suffix = suffix;
      to.outputLen = outputLen;
      to.enableXOF = enableXOF;
      to.destroyed = this.destroyed;
      return to;
    }
  };
  var gen = (suffix, blockLen, outputLen) => createHasher(() => new Keccak(blockLen, suffix, outputLen));
  var keccak_256 = /* @__PURE__ */ (() => gen(1, 136, 256 / 8))();

  // node_modules/did-jwt/lib/index.module.js
  var import_canonicalize = __toESM(require_canonicalize(), 1);

  // node_modules/@scure/base/lib/esm/index.js
  function isBytes3(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function isArrayOf(isString, arr) {
    if (!Array.isArray(arr))
      return false;
    if (arr.length === 0)
      return true;
    if (isString) {
      return arr.every((item) => typeof item === "string");
    } else {
      return arr.every((item) => Number.isSafeInteger(item));
    }
  }
  function afn(input) {
    if (typeof input !== "function")
      throw new Error("function expected");
    return true;
  }
  function astr(label, input) {
    if (typeof input !== "string")
      throw new Error(`${label}: string expected`);
    return true;
  }
  function anumber2(n) {
    if (!Number.isSafeInteger(n))
      throw new Error(`invalid integer: ${n}`);
  }
  function aArr(input) {
    if (!Array.isArray(input))
      throw new Error("array expected");
  }
  function astrArr(label, input) {
    if (!isArrayOf(true, input))
      throw new Error(`${label}: array of strings expected`);
  }
  function anumArr(label, input) {
    if (!isArrayOf(false, input))
      throw new Error(`${label}: array of numbers expected`);
  }
  // @__NO_SIDE_EFFECTS__
  function chain(...args) {
    const id = (a) => a;
    const wrap = (a, b) => (c) => a(b(c));
    const encode6 = args.map((x) => x.encode).reduceRight(wrap, id);
    const decode7 = args.map((x) => x.decode).reduce(wrap, id);
    return { encode: encode6, decode: decode7 };
  }
  // @__NO_SIDE_EFFECTS__
  function alphabet2(letters) {
    const lettersA = typeof letters === "string" ? letters.split("") : letters;
    const len = lettersA.length;
    astrArr("alphabet", lettersA);
    const indexes = new Map(lettersA.map((l, i) => [l, i]));
    return {
      encode: (digits) => {
        aArr(digits);
        return digits.map((i) => {
          if (!Number.isSafeInteger(i) || i < 0 || i >= len)
            throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
          return lettersA[i];
        });
      },
      decode: (input) => {
        aArr(input);
        return input.map((letter) => {
          astr("alphabet.decode", letter);
          const i = indexes.get(letter);
          if (i === void 0)
            throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
          return i;
        });
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function join(separator = "") {
    astr("join", separator);
    return {
      encode: (from3) => {
        astrArr("join.decode", from3);
        return from3.join(separator);
      },
      decode: (to) => {
        astr("join.decode", to);
        return to.split(separator);
      }
    };
  }
  var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from3, to) => from3 + (to - gcd(from3, to));
  var powers = /* @__PURE__ */ (() => {
    let res = [];
    for (let i = 0; i < 40; i++)
      res.push(2 ** i);
    return res;
  })();
  function convertRadix2(data, from3, to, padding) {
    aArr(data);
    if (from3 <= 0 || from3 > 32)
      throw new Error(`convertRadix2: wrong from=${from3}`);
    if (to <= 0 || to > 32)
      throw new Error(`convertRadix2: wrong to=${to}`);
    if (/* @__PURE__ */ radix2carry(from3, to) > 32) {
      throw new Error(`convertRadix2: carry overflow from=${from3} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from3, to)}`);
    }
    let carry = 0;
    let pos = 0;
    const max = powers[from3];
    const mask = powers[to] - 1;
    const res = [];
    for (const n of data) {
      anumber2(n);
      if (n >= max)
        throw new Error(`convertRadix2: invalid data word=${n} from=${from3}`);
      carry = carry << from3 | n;
      if (pos + from3 > 32)
        throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from3}`);
      pos += from3;
      for (; pos >= to; pos -= to)
        res.push((carry >> pos - to & mask) >>> 0);
      const pow = powers[pos];
      if (pow === void 0)
        throw new Error("invalid carry");
      carry &= pow - 1;
    }
    carry = carry << to - pos & mask;
    if (!padding && pos >= from3)
      throw new Error("Excess padding");
    if (!padding && carry > 0)
      throw new Error(`Non-zero padding: ${carry}`);
    if (padding && pos > 0)
      res.push(carry >>> 0);
    return res;
  }
  // @__NO_SIDE_EFFECTS__
  function radix2(bits, revPadding = false) {
    anumber2(bits);
    if (bits <= 0 || bits > 32)
      throw new Error("radix2: bits should be in (0..32]");
    if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
      throw new Error("radix2: carry overflow");
    return {
      encode: (bytes) => {
        if (!isBytes3(bytes))
          throw new Error("radix2.encode input should be Uint8Array");
        return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
      },
      decode: (digits) => {
        anumArr("radix2.decode", digits);
        return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
      }
    };
  }
  function unsafeWrapper(fn) {
    afn(fn);
    return function(...args) {
      try {
        return fn.apply(null, args);
      } catch (e) {
      }
    };
  }
  var BECH_ALPHABET = /* @__PURE__ */ chain(/* @__PURE__ */ alphabet2("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ join(""));
  var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
  function bech32Polymod(pre) {
    const b = pre >> 25;
    let chk = (pre & 33554431) << 5;
    for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
      if ((b >> i & 1) === 1)
        chk ^= POLYMOD_GENERATORS[i];
    }
    return chk;
  }
  function bechChecksum(prefix, words, encodingConst = 1) {
    const len = prefix.length;
    let chk = 1;
    for (let i = 0; i < len; i++) {
      const c = prefix.charCodeAt(i);
      if (c < 33 || c > 126)
        throw new Error(`Invalid prefix (${prefix})`);
      chk = bech32Polymod(chk) ^ c >> 5;
    }
    chk = bech32Polymod(chk);
    for (let i = 0; i < len; i++)
      chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 31;
    for (let v of words)
      chk = bech32Polymod(chk) ^ v;
    for (let i = 0; i < 6; i++)
      chk = bech32Polymod(chk);
    chk ^= encodingConst;
    return BECH_ALPHABET.encode(convertRadix2([chk % powers[30]], 30, 5, false));
  }
  // @__NO_SIDE_EFFECTS__
  function genBech32(encoding) {
    const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
    const _words = /* @__PURE__ */ radix2(5);
    const fromWords = _words.decode;
    const toWords = _words.encode;
    const fromWordsUnsafe = unsafeWrapper(fromWords);
    function encode6(prefix, words, limit = 90) {
      astr("bech32.encode prefix", prefix);
      if (isBytes3(words))
        words = Array.from(words);
      anumArr("bech32.encode", words);
      const plen = prefix.length;
      if (plen === 0)
        throw new TypeError(`Invalid prefix length ${plen}`);
      const actualLength = plen + 7 + words.length;
      if (limit !== false && actualLength > limit)
        throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
      const lowered = prefix.toLowerCase();
      const sum = bechChecksum(lowered, words, ENCODING_CONST);
      return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
    }
    function decode7(str, limit = 90) {
      astr("bech32.decode input", str);
      const slen = str.length;
      if (slen < 8 || limit !== false && slen > limit)
        throw new TypeError(`invalid string length: ${slen} (${str}). Expected (8..${limit})`);
      const lowered = str.toLowerCase();
      if (str !== lowered && str !== str.toUpperCase())
        throw new Error(`String must be lowercase or uppercase`);
      const sepIndex = lowered.lastIndexOf("1");
      if (sepIndex === 0 || sepIndex === -1)
        throw new Error(`Letter "1" must be present between prefix and data only`);
      const prefix = lowered.slice(0, sepIndex);
      const data = lowered.slice(sepIndex + 1);
      if (data.length < 6)
        throw new Error("Data must be at least 6 characters long");
      const words = BECH_ALPHABET.decode(data).slice(0, -6);
      const sum = bechChecksum(prefix, words, ENCODING_CONST);
      if (!data.endsWith(sum))
        throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
      return { prefix, words };
    }
    const decodeUnsafe = unsafeWrapper(decode7);
    function decodeToBytes(str) {
      const { prefix, words } = decode7(str, false);
      return { prefix, words, bytes: fromWords(words) };
    }
    function encodeFromBytes(prefix, bytes) {
      return encode6(prefix, toWords(bytes));
    }
    return {
      encode: encode6,
      decode: decode7,
      encodeFromBytes,
      decodeToBytes,
      decodeUnsafe,
      fromWords,
      fromWordsUnsafe,
      toWords
    };
  }
  var bech32 = /* @__PURE__ */ genBech32("bech32");

  // node_modules/did-jwt/lib/index.module.js
  var u8a = {
    toString: toString2,
    fromString: fromString2,
    concat
  };
  function bytesToBase64url(b) {
    return u8a.toString(b, "base64url");
  }
  function base64ToBytes(s) {
    const inputBase64Url = s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    return u8a.fromString(inputBase64Url, "base64url");
  }
  function base58ToBytes(s) {
    return u8a.fromString(s, "base58btc");
  }
  function bytesToBase58(b) {
    return u8a.toString(b, "base58btc");
  }
  var VM_TO_KEY_TYPE = {
    Secp256k1SignatureVerificationKey2018: "Secp256k1",
    Secp256k1VerificationKey2018: "Secp256k1",
    EcdsaSecp256k1VerificationKey2019: "Secp256k1",
    EcdsaPublicKeySecp256k1: "Secp256k1",
    EcdsaSecp256k1RecoveryMethod2020: "Secp256k1",
    EcdsaSecp256r1VerificationKey2019: "P-256",
    Ed25519VerificationKey2018: "Ed25519",
    Ed25519VerificationKey2020: "Ed25519",
    ED25519SignatureVerification: "Ed25519",
    X25519KeyAgreementKey2019: "X25519",
    X25519KeyAgreementKey2020: "X25519",
    ConditionalProof2022: void 0,
    JsonWebKey2020: void 0,
    // key type must be specified in the JWK
    Multikey: void 0
    // key type must be extracted from the multicodec
  };
  var supportedCodecs = {
    "ed25519-pub": 237,
    "x25519-pub": 236,
    "secp256k1-pub": 231,
    "bls12_381-g1-pub": 234,
    "bls12_381-g2-pub": 235,
    "p256-pub": 4608
  };
  var CODEC_TO_KEY_TYPE = {
    "bls12_381-g1-pub": "Bls12381G1",
    "bls12_381-g2-pub": "Bls12381G2",
    "ed25519-pub": "Ed25519",
    "p256-pub": "P-256",
    "secp256k1-pub": "Secp256k1",
    "x25519-pub": "X25519"
  };
  function extractPublicKeyBytes(pk) {
    if (pk.publicKeyBase58) {
      return {
        keyBytes: base58ToBytes(pk.publicKeyBase58),
        keyType: VM_TO_KEY_TYPE[pk.type]
      };
    } else if (pk.publicKeyBase64) {
      return {
        keyBytes: base64ToBytes(pk.publicKeyBase64),
        keyType: VM_TO_KEY_TYPE[pk.type]
      };
    } else if (pk.publicKeyHex) {
      return {
        keyBytes: hexToBytes2(pk.publicKeyHex),
        keyType: VM_TO_KEY_TYPE[pk.type]
      };
    } else if (pk.publicKeyJwk && pk.publicKeyJwk.crv === "secp256k1" && pk.publicKeyJwk.x && pk.publicKeyJwk.y) {
      return {
        keyBytes: secp256k1.ProjectivePoint.fromAffine({
          x: bytesToBigInt(base64ToBytes(pk.publicKeyJwk.x)),
          y: bytesToBigInt(base64ToBytes(pk.publicKeyJwk.y))
        }).toRawBytes(false),
        keyType: "Secp256k1"
      };
    } else if (pk.publicKeyJwk && pk.publicKeyJwk.crv === "P-256" && pk.publicKeyJwk.x && pk.publicKeyJwk.y) {
      return {
        keyBytes: p2562.ProjectivePoint.fromAffine({
          x: bytesToBigInt(base64ToBytes(pk.publicKeyJwk.x)),
          y: bytesToBigInt(base64ToBytes(pk.publicKeyJwk.y))
        }).toRawBytes(false),
        keyType: "P-256"
      };
    } else if (pk.publicKeyJwk && pk.publicKeyJwk.kty === "OKP" && ["Ed25519", "X25519"].includes(pk.publicKeyJwk.crv ?? "") && pk.publicKeyJwk.x) {
      return {
        keyBytes: base64ToBytes(pk.publicKeyJwk.x),
        keyType: pk.publicKeyJwk.crv
      };
    } else if (pk.publicKeyMultibase) {
      const {
        keyBytes,
        keyType
      } = multibaseToBytes(pk.publicKeyMultibase);
      return {
        keyBytes,
        keyType: keyType ?? VM_TO_KEY_TYPE[pk.type]
      };
    }
    return {
      keyBytes: new Uint8Array()
    };
  }
  function multibaseToBytes(s) {
    const bytes = (0, import_multibase.decode)(s);
    if ([32, 33, 48, 64, 65, 96].includes(bytes.length)) {
      return {
        keyBytes: bytes
      };
    }
    try {
      const [codec, length2] = varint_exports.decode(bytes);
      const possibleCodec = Object.entries(supportedCodecs).filter(([, code2]) => code2 === codec)?.[0][0] ?? "";
      return {
        keyBytes: bytes.slice(length2),
        keyType: CODEC_TO_KEY_TYPE[possibleCodec]
      };
    } catch (e) {
      return {
        keyBytes: bytes
      };
    }
  }
  function hexToBytes2(s, minLength) {
    let input = s.startsWith("0x") ? s.substring(2) : s;
    if (input.length % 2 !== 0) {
      input = `0${input}`;
    }
    if (minLength) {
      const paddedLength = Math.max(input.length, minLength * 2);
      input = input.padStart(paddedLength, "00");
    }
    return u8a.fromString(input.toLowerCase(), "base16");
  }
  function encodeBase64url(s) {
    return bytesToBase64url(u8a.fromString(s));
  }
  function bytesToHex2(b) {
    return u8a.toString(b, "base16");
  }
  function bytesToBigInt(b) {
    return BigInt(`0x` + u8a.toString(b, "base16"));
  }
  function stringToBytes(s) {
    return u8a.fromString(s, "utf-8");
  }
  function toJose({
    r,
    s,
    recoveryParam
  }, recoverable) {
    const jose = new Uint8Array(recoverable ? 65 : 64);
    jose.set(u8a.fromString(r, "base16"), 0);
    jose.set(u8a.fromString(s, "base16"), 32);
    if (recoverable) {
      if (typeof recoveryParam === "undefined") {
        throw new Error("Signer did not return a recoveryParam");
      }
      jose[64] = recoveryParam;
    }
    return bytesToBase64url(jose);
  }
  function fromJose(signature) {
    const signatureBytes = base64ToBytes(signature);
    if (signatureBytes.length < 64 || signatureBytes.length > 65) {
      throw new TypeError(`Wrong size for signature. Expected 64 or 65 bytes, but got ${signatureBytes.length}`);
    }
    const r = bytesToHex2(signatureBytes.slice(0, 32));
    const s = bytesToHex2(signatureBytes.slice(32, 64));
    const recoveryParam = signatureBytes.length === 65 ? signatureBytes[64] : void 0;
    return {
      r,
      s,
      recoveryParam
    };
  }
  function leftpad(data, size = 64) {
    if (data.length === size) return data;
    return "0".repeat(size - data.length) + data;
  }
  function sha2564(payload) {
    const data = typeof payload === "string" ? fromString2(payload) : payload;
    return sha2563(data);
  }
  var keccak = keccak_256;
  function toEthereumAddress(hexPublicKey) {
    const hashInput = fromString2(hexPublicKey.slice(2), "base16");
    return `0x${toString2(keccak(hashInput).slice(-20), "base16")}`;
  }
  function ES256KSigner(privateKey, recoverable = false) {
    const privateKeyBytes = privateKey;
    if (privateKeyBytes.length !== 32) {
      throw new Error(`bad_key: Invalid private key format. Expecting 32 bytes, but got ${privateKeyBytes.length}`);
    }
    return function(data) {
      try {
        const signature = secp256k1.sign(sha2564(data), privateKeyBytes);
        return Promise.resolve(toJose({
          r: leftpad(signature.r.toString(16)),
          s: leftpad(signature.s.toString(16)),
          recoveryParam: signature.recovery
        }, recoverable));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
  function instanceOfEcdsaSignature(object) {
    return typeof object === "object" && "r" in object && "s" in object;
  }
  function ES256SignerAlg() {
    return function sign(payload, signer) {
      try {
        return Promise.resolve(signer(payload)).then(function(signature) {
          if (instanceOfEcdsaSignature(signature)) {
            return toJose(signature);
          } else {
            return signature;
          }
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
  function ES256KSignerAlg(recoverable) {
    return function sign(payload, signer) {
      try {
        return Promise.resolve(signer(payload)).then(function(signature) {
          if (instanceOfEcdsaSignature(signature)) {
            return toJose(signature, recoverable);
          } else {
            if (recoverable && typeof fromJose(signature).recoveryParam === "undefined") {
              throw new Error(`not_supported: ES256K-R not supported when signer doesn't provide a recovery param`);
            }
            return signature;
          }
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
  function Ed25519SignerAlg() {
    return function sign(payload, signer) {
      try {
        return Promise.resolve(signer(payload)).then(function(signature) {
          if (!instanceOfEcdsaSignature(signature)) {
            return signature;
          } else {
            throw new Error("invalid_config: expected a signer function that returns a string instead of signature object");
          }
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
  var algorithms$1 = {
    ES256: ES256SignerAlg(),
    ES256K: ES256KSignerAlg(),
    // This is a non-standard algorithm but retained for backwards compatibility
    // see https://github.com/decentralized-identity/did-jwt/issues/146
    "ES256K-R": ES256KSignerAlg(true),
    // This is actually incorrect but retained for backwards compatibility
    // see https://github.com/decentralized-identity/did-jwt/issues/130
    Ed25519: Ed25519SignerAlg(),
    EdDSA: Ed25519SignerAlg()
  };
  function SignerAlg(alg) {
    const impl = algorithms$1[alg];
    if (!impl) throw new Error(`not_supported: Unsupported algorithm ${alg}`);
    return impl;
  }
  function publicKeyToAddress$1(publicKey, otherAddress) {
    const version2 = bytesToHex2(base58ToBytes(otherAddress).slice(0, 1));
    const publicKeyBuffer = hexToBytes2(publicKey);
    const publicKeyHash = ripemd1602(sha2564(publicKeyBuffer));
    const step1 = version2 + bytesToHex2(publicKeyHash);
    const step2 = sha2564(hexToBytes2(step1));
    const step3 = sha2564(step2);
    const checksum = bytesToHex2(step3).substring(0, 8);
    const step4 = step1 + checksum;
    return bytesToBase58(hexToBytes2(step4));
  }
  function publicKeyToAddress(publicKey, prefix) {
    const publicKeyBuffer = secp256k1.ProjectivePoint.fromHex(publicKey).toRawBytes();
    const hash = ripemd1602(sha2564(publicKeyBuffer));
    const words = bech32.toWords(hash);
    return bech32.encode(prefix, words).replace(prefix, "");
  }
  function verifyBlockchainAccountId(publicKey, blockchainAccountId) {
    if (blockchainAccountId) {
      const chain2 = blockchainAccountId.split(":");
      switch (chain2[0]) {
        case "bip122":
          chain2[chain2.length - 1] = publicKeyToAddress$1(publicKey, chain2[chain2.length - 1]);
          break;
        case "cosmos":
          chain2[chain2.length - 1] = publicKeyToAddress(publicKey, chain2[1]);
          break;
        case "eip155":
          chain2[chain2.length - 1] = toEthereumAddress(publicKey);
          break;
        default:
          return false;
      }
      return chain2.join(":").toLowerCase() === blockchainAccountId.toLowerCase();
    }
    return false;
  }
  function toSignatureObject(signature, recoverable = false) {
    const rawSig = base64ToBytes(signature);
    if (rawSig.length !== (recoverable ? 65 : 64)) {
      throw new Error("wrong signature length");
    }
    const r = bytesToHex2(rawSig.slice(0, 32));
    const s = bytesToHex2(rawSig.slice(32, 64));
    const sigObj = {
      r,
      s
    };
    if (recoverable) {
      sigObj.recoveryParam = rawSig[64];
    }
    return sigObj;
  }
  function toSignatureObject2(signature, recoverable = false) {
    const bytes = base64ToBytes(signature);
    if (bytes.length !== (recoverable ? 65 : 64)) {
      throw new Error("wrong signature length");
    }
    return {
      compact: bytes.slice(0, 64),
      recovery: bytes[64]
    };
  }
  function verifyES256(data, signature, authenticators) {
    const hash = sha2564(data);
    const sig = p2562.Signature.fromCompact(toSignatureObject2(signature).compact);
    const fullPublicKeys = authenticators.filter((a) => !a.ethereumAddress && !a.blockchainAccountId);
    const signer = fullPublicKeys.find((pk) => {
      try {
        const {
          keyBytes
        } = extractPublicKeyBytes(pk);
        return p2562.verify(sig, hash, keyBytes);
      } catch (err) {
        return false;
      }
    });
    if (!signer) throw new Error("invalid_signature: Signature invalid for JWT");
    return signer;
  }
  function verifyES256K(data, signature, authenticators) {
    const hash = sha2564(data);
    const signatureNormalized = secp256k1.Signature.fromCompact(base64ToBytes(signature)).normalizeS();
    const fullPublicKeys = authenticators.filter((a) => {
      return !a.ethereumAddress && !a.blockchainAccountId;
    });
    const blockchainAddressKeys = authenticators.filter((a) => {
      return a.ethereumAddress || a.blockchainAccountId;
    });
    let signer = fullPublicKeys.find((pk) => {
      try {
        const {
          keyBytes
        } = extractPublicKeyBytes(pk);
        return secp256k1.verify(signatureNormalized, hash, keyBytes);
      } catch (err) {
        return false;
      }
    });
    if (!signer && blockchainAddressKeys.length > 0) {
      signer = verifyRecoverableES256K(data, signature, blockchainAddressKeys);
    }
    if (!signer) throw new Error("invalid_signature: Signature invalid for JWT");
    return signer;
  }
  function verifyRecoverableES256K(data, signature, authenticators) {
    const signatures = [];
    if (signature.length > 86) {
      signatures.push(toSignatureObject2(signature, true));
    } else {
      const so = toSignatureObject2(signature, false);
      signatures.push({
        ...so,
        recovery: 0
      });
      signatures.push({
        ...so,
        recovery: 1
      });
    }
    const hash = sha2564(data);
    const checkSignatureAgainstSigner = (sigObj) => {
      const signature2 = secp256k1.Signature.fromCompact(sigObj.compact).addRecoveryBit(sigObj.recovery || 0);
      const recoveredPublicKey = signature2.recoverPublicKey(hash);
      const recoveredAddress = toEthereumAddress(recoveredPublicKey.toHex(false)).toLowerCase();
      const recoveredPublicKeyHex = recoveredPublicKey.toHex(false);
      const recoveredCompressedPublicKeyHex = recoveredPublicKey.toHex(true);
      return authenticators.find((a) => {
        const {
          keyBytes
        } = extractPublicKeyBytes(a);
        const keyHex = bytesToHex2(keyBytes);
        return keyHex === recoveredPublicKeyHex || keyHex === recoveredCompressedPublicKeyHex || a.ethereumAddress?.toLowerCase() === recoveredAddress || a.blockchainAccountId?.split("@eip155")?.[0].toLowerCase() === recoveredAddress || // CAIP-2
        verifyBlockchainAccountId(recoveredPublicKeyHex, a.blockchainAccountId);
      });
    };
    for (const signature2 of signatures) {
      const verificationMethod = checkSignatureAgainstSigner(signature2);
      if (verificationMethod) return verificationMethod;
    }
    throw new Error("invalid_signature: Signature invalid for JWT");
  }
  function verifyEd25519(data, signature, authenticators) {
    const clear = stringToBytes(data);
    const signatureBytes = base64ToBytes(signature);
    const signer = authenticators.find((a) => {
      const {
        keyBytes,
        keyType
      } = extractPublicKeyBytes(a);
      if (keyType === "Ed25519") {
        return ed25519.verify(signatureBytes, clear, keyBytes);
      } else {
        return false;
      }
    });
    if (!signer) throw new Error("invalid_signature: Signature invalid for JWT");
    return signer;
  }
  var algorithms = {
    ES256: verifyES256,
    ES256K: verifyES256K,
    // This is a non-standard algorithm but retained for backwards compatibility
    // see https://github.com/decentralized-identity/did-jwt/issues/146
    "ES256K-R": verifyRecoverableES256K,
    // This is actually incorrect but retained for backwards compatibility
    // see https://github.com/decentralized-identity/did-jwt/issues/130
    Ed25519: verifyEd25519,
    EdDSA: verifyEd25519
  };
  function VerifierAlgorithm(alg) {
    const impl = algorithms[alg];
    if (!impl) throw new Error(`not_supported: Unsupported algorithm ${alg}`);
    return impl;
  }
  VerifierAlgorithm.toSignatureObject = toSignatureObject;
  var _iteratorSymbol$1 = typeof Symbol !== "undefined" ? Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator")) : "@@iterator";
  var createJWT = function(payload, {
    issuer,
    signer,
    alg,
    expiresIn,
    canonicalize
  }, header = {}) {
    try {
      if (!signer) throw new Error("missing_signer: No Signer functionality has been configured");
      if (!issuer) throw new Error("missing_issuer: No issuing DID has been configured");
      if (!header.typ) header.typ = "JWT";
      if (!header.alg) header.alg = alg;
      const timestamps = {
        iat: Math.floor(Date.now() / 1e3),
        exp: void 0
      };
      if (expiresIn) {
        if (typeof expiresIn === "number") {
          timestamps.exp = (payload.nbf || timestamps.iat) + Math.floor(expiresIn);
        } else {
          throw new Error("invalid_argument: JWT expiresIn is not a number");
        }
      }
      const fullPayload = {
        ...timestamps,
        ...payload,
        iss: issuer
      };
      return createJWS(fullPayload, signer, header, {
        canonicalize
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };
  var createJWS = function(payload, signer, header = {}, options = {}) {
    try {
      if (!header.alg) header.alg = defaultAlg;
      const encodedPayload = typeof payload === "string" ? payload : encodeSection(payload, options.canonicalize);
      const signingInput = [encodeSection(header, options.canonicalize), encodedPayload].join(".");
      const jwtSigner = SignerAlg(header.alg);
      return Promise.resolve(jwtSigner(signingInput, signer)).then(function(signature) {
        return [signingInput, signature].join(".");
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };
  var defaultAlg = "ES256K";
  function encodeSection(data, shouldCanonicalize = false) {
    if (shouldCanonicalize) {
      return encodeBase64url((0, import_canonicalize.default)(data));
    } else {
      return encodeBase64url(JSON.stringify(data));
    }
  }
  var _iteratorSymbol = typeof Symbol !== "undefined" ? Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator")) : "@@iterator";

  // index.js
  window.Buffer = import_buffer.Buffer;
  var appState = {
    collection: null
    // Holds the SecretVaultWrapper instance
  };
  var NILDB = {
    orgCredentials: {
      secretKey: "71c918306c9ca544e824363bdfcca57ff56a1e086020b36dfc70705637c348da",
      orgDid: "did:nil:testnet:nillion1z4c6ntjf7vcpytfesew6dplek3v3rnkaxntmt6"
    },
    nodes: [
      {
        url: "https://nildb-nx8v.nillion.network",
        did: "did:nil:testnet:nillion1qfrl8nje3nvwh6cryj63mz2y6gsdptvn07nx8v"
      },
      {
        url: "https://nildb-p3mx.nillion.network",
        did: "did:nil:testnet:nillion1uak7fgsp69kzfhdd6lfqv69fnzh3lprg2mp3mx"
      },
      {
        url: "https://nildb-rugk.nillion.network",
        did: "did:nil:testnet:nillion1kfremrp2mryxrynx66etjl8s7wazxc3rssrugk"
      }
    ]
  };
  var SCHEMA = "fa800faa-c7ec-4a09-bf76-6ec768ee6299";
  var AGGREGATION = "87b54dc5-4229-455f-9d60-2c6cf315a74a";
  var SecretVaultWrapper = class {
    constructor(nodes, credentials, schemaId = null, operation = "store", tokenExpirySeconds = 36e6) {
      this.nodes = nodes;
      this.nodesJwt = null;
      this.credentials = credentials;
      this.schemaId = schemaId;
      this.operation = operation;
      this.tokenExpirySeconds = tokenExpirySeconds;
    }
    async init() {
      const nodeConfigs = await Promise.all(
        this.nodes.map(async (node) => ({
          url: node.url,
          jwt: await this.generateNodeToken(node.did)
        }))
      );
      this.nodesJwt = nodeConfigs;
    }
    setSchemaId(schemaId, operation = this.operation) {
      this.schemaId = schemaId;
      this.operation = operation;
    }
    async generateNodeToken(nodeDid) {
      const signer = ES256KSigner(import_buffer.Buffer.from(this.credentials.secretKey, "hex"));
      const payload = {
        iss: this.credentials.orgDid,
        aud: nodeDid,
        exp: Math.floor(Date.now() / 1e3) + this.tokenExpirySeconds
      };
      return await createJWT(payload, {
        issuer: this.credentials.orgDid,
        signer
      });
    }
    async generateTokensForAllNodes() {
      const tokens = await Promise.all(
        this.nodes.map(async (node) => {
          const token = await this.generateNodeToken(node.did);
          return { node: node.url, token };
        })
      );
      return tokens;
    }
    async makeRequest(nodeUrl, endpoint, token, payload, method = "POST") {
      try {
        const response = await fetch(`${nodeUrl}/api/v1/${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: method === "GET" ? null : JSON.stringify(payload)
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${text}`
          );
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          return {
            status: response.status,
            ...data
          };
        }
        return {
          status: response.status
        };
      } catch (error) {
        console.error(
          `\u274C Failed to ${method} ${endpoint} from ${nodeUrl}:`,
          error.message
        );
        const statusMatch = error.message.match(/status: (\d+)/);
        const bodyMatch = error.message.match(/body: ({.*})/);
        const errorJson = {
          status: statusMatch ? parseInt(statusMatch[1]) : null,
          error: bodyMatch ? JSON.parse(bodyMatch[1]) : { errors: [error] }
        };
        return errorJson;
      }
    }
    async flushData() {
      const results = [];
      for (const node of this.nodes) {
        const jwt = await this.generateNodeToken(node.did);
        const payload = { schema: this.schemaId };
        const result = await this.makeRequest(
          node.url,
          "data/flush",
          jwt,
          payload
        );
        results.push({ ...result, node });
      }
      return results;
    }
    async getSchemas() {
      const results = [];
      for (const node of this.nodes) {
        const jwt = await this.generateNodeToken(node.did);
        try {
          const result = await this.makeRequest(
            node.url,
            "schemas",
            jwt,
            {},
            "GET"
          );
          results.push({ ...result, node });
        } catch (error) {
          console.error(
            `\u274C Failed to get schemas from ${node.url}:`,
            error.message
          );
          results.push({ error, node });
        }
      }
      return results;
    }
    async createSchema(schema, schemaName, schemaId = null) {
      if (!schemaId) {
        schemaId = v4_default();
      }
      const schemaPayload = {
        _id: schemaId,
        name: schemaName,
        schema
      };
      const results = [];
      for (const node of this.nodes) {
        const jwt = await this.generateNodeToken(node.did);
        try {
          const result = await this.makeRequest(
            node.url,
            "schemas",
            jwt,
            schemaPayload
          );
          results.push({
            ...result,
            node,
            schemaId,
            name: schemaName
          });
        } catch (error) {
          console.error(
            `\u274C Error while creating schema on ${node.url}:`,
            error.message
          );
          results.push({ error, node });
        }
      }
      return results;
    }
    async writeToNodes(data) {
      const idData = data.map((record) => {
        if (!record._id) {
          return { ...record, _id: v4_default() };
        }
        return record;
      });
      const results = [];
      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        try {
          const jwt = await this.generateNodeToken(node.did);
          const payload = {
            schema: this.schemaId,
            data: idData
          };
          const result = await this.makeRequest(
            node.url,
            "data/create",
            jwt,
            payload
          );
          results.push({
            ...result,
            node,
            schemaId: this.schemaId
          });
        } catch (error) {
          console.error(`\u274C Failed to write to ${node.url}:`, error.message);
          results.push({ node, error });
        }
      }
      return results;
    }
    async readFromNodes(filter = {}) {
      const results = [];
      for (const node of this.nodes) {
        try {
          const jwt = await this.generateNodeToken(node.did);
          const payload = { schema: this.schemaId, filter };
          const result = await this.makeRequest(
            node.url,
            "data/read",
            jwt,
            payload
          );
          results.push({ ...result, node });
        } catch (error) {
          console.error(`\u274C Failed to read from ${node.url}:`, error.message);
          results.push({ error, node });
        }
      }
      const recordGroups = results.reduce((acc, nodeResult) => {
        nodeResult.data.forEach((record) => {
          const existingGroup = acc.find(
            (group) => group.shares.some((share) => share._id === record._id)
          );
          if (existingGroup) {
            existingGroup.shares.push(record);
          } else {
            acc.push({ shares: [record], recordIndex: record._id });
          }
        });
        return acc;
      }, []);
      const recombinedRecords = await Promise.all(
        recordGroups.map(async (record) => {
          const recombined = record.shares;
          return recombined;
        })
      );
      return recombinedRecords;
    }
    async deleteDataFromNodes(filter = {}) {
      const results = [];
      for (const node of this.nodes) {
        try {
          const jwt = await this.generateNodeToken(node.did);
          const payload = { schema: this.schemaId, filter };
          const result = await this.makeRequest(
            node.url,
            "data/delete",
            jwt,
            payload
          );
          results.push({ ...result, node });
        } catch (error) {
          console.error(`\u274C Failed to delete from ${node.url}:`, error.message);
          results.push({ error, node });
        }
      }
      return results;
    }
    /**
     * Executes a query on a single node and returns the results.
     *
     * @param {object} node - The target node object (should contain 'url' and 'did').
     * @param {object} queryPayload - The query payload to execute.
     * @returns {Promise<object>} - A promise resolving to the query response from the node.
     */
    async executeQueryOnSingleNode(node, queryPayload) {
      if (!node || !node.url || !node.did) {
        console.error("\u274C Invalid node object provided:", node);
        return { node: node?.url || "unknown", error: "Invalid node object" };
      }
      if (!queryPayload) {
        console.error("\u274C Query payload cannot be empty");
        return { node: node.url, error: "Query payload cannot be empty" };
      }
      try {
        const jwt = await this.generateNodeToken(node.did);
        const result = await this.makeRequest(
          node.url,
          "queries/execute",
          // Endpoint for query execution
          jwt,
          queryPayload
        );
        if (result && result.error) {
          console.error(`\u274C Query execution failed on ${node.url} with status ${result.status}:`, result.error);
          return {
            node: node.url,
            status: result.status,
            error: result.error
          };
        }
        return {
          node: node.url,
          status: result.status,
          data: result.data || []
          // Use the 'data' field from makeRequest result
        };
      } catch (error) {
        console.error(`\u274C Failed to execute query on ${node.url}:`, error.message);
        return {
          node: node.url,
          status: error.status || null,
          // Include status if available on error object
          error: error.message || "An unknown error occurred"
        };
      }
    }
  };
  function showWarningModal(message) {
    const template = document.getElementById("warning-modal-template");
    if (!template) {
      console.error("Warning modal template not found!");
      alert(message);
      return;
    }
    const clone = template.content.cloneNode(true);
    const modalElement = clone.querySelector(".modal");
    const messageElement = clone.querySelector(".warning-message");
    if (!modalElement || !messageElement) {
      console.error("Essential elements missing in warning modal template!");
      return;
    }
    messageElement.textContent = message;
    document.body.appendChild(modalElement);
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
    modalElement.addEventListener("hidden.bs.modal", () => {
      modalElement.remove();
    });
  }
  function showLLMResponseModal(responseContent) {
    const template = document.getElementById("llm-response-modal-template");
    if (!template) {
      console.error("LLM response modal template not found!");
      alert("Error displaying response.");
      return;
    }
    const clone = template.content.cloneNode(true);
    const modalElement = clone.querySelector(".modal");
    const responseContentElement = clone.querySelector(".response-content");
    const copyButton = clone.querySelector(".copy-response-btn");
    if (!modalElement || !responseContentElement || !copyButton) {
      console.error("Essential elements missing in LLM response modal template!");
      return;
    }
    responseContentElement.textContent = responseContent;
    document.body.appendChild(modalElement);
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(responseContent).then(() => {
        copyButton.textContent = "Copied!";
        copyButton.disabled = true;
        setTimeout(() => {
          copyButton.textContent = "Copy Response";
          copyButton.disabled = false;
        }, 1500);
      }).catch((err) => {
        console.error("Failed to copy text:", err);
      });
    });
    modalElement.addEventListener("hidden.bs.modal", () => {
      modalElement.remove();
    });
  }
  function initializeReflectionsApp() {
    let currentSelectedDate = null;
    let calendar;
    const STORAGE_KEY = "blind_reflections_data";
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    try {
      const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const htmlElement = document.getElementById("html-element");
      const themeToggleBtn = document.getElementById("theme-toggle-btn");
      const themeIcon = document.getElementById("theme-icon");
      if (htmlElement && themeToggleBtn && themeIcon) {
        let updateThemeIcon = function(theme) {
          if (theme === "dark") {
            themeIcon.className = "fas fa-sun";
          } else {
            themeIcon.className = "fas fa-moon";
          }
        };
        if (localStorage.getItem("theme")) {
          htmlElement.setAttribute("data-bs-theme", localStorage.getItem("theme"));
          updateThemeIcon(localStorage.getItem("theme"));
        } else {
          const initialTheme = prefersDarkScheme ? "dark" : "light";
          htmlElement.setAttribute("data-bs-theme", initialTheme);
          updateThemeIcon(initialTheme);
        }
        themeToggleBtn.addEventListener("click", function() {
          const currentTheme = htmlElement.getAttribute("data-bs-theme");
          const newTheme = currentTheme === "dark" ? "light" : "dark";
          htmlElement.setAttribute("data-bs-theme", newTheme);
          localStorage.setItem("theme", newTheme);
          updateThemeIcon(newTheme);
        });
      }
    } catch (e) {
      console.error("Error initializing theme:", e);
    }
    const todayDateElement = document.getElementById("today-date");
    const today = /* @__PURE__ */ new Date();
    todayDateElement.textContent = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    function loadData() {
      const authData = JSON.parse(sessionStorage.getItem("blind_reflections_auth"));
      const uuid = authData?.uuid;
      if (!uuid) {
        console.error("No UUID found. Cannot load data.");
        return {};
      }
      const data = localStorage.getItem(`${STORAGE_KEY}_${uuid}`);
      return data ? JSON.parse(data) : {};
    }
    function saveData(data) {
      const authData = JSON.parse(sessionStorage.getItem("blind_reflections_auth"));
      const uuid = authData?.uuid;
      if (!uuid) {
        console.error("No UUID found. Cannot save data.");
        return;
      }
      localStorage.setItem(`${STORAGE_KEY}_${uuid}`, JSON.stringify(data));
    }
    async function saveEntry() {
      if (!currentSelectedDate) return;
      const authData = JSON.parse(sessionStorage.getItem("blind_reflections_auth"));
      const uuid = authData?.uuid;
      if (!uuid) {
        const authModal = new bootstrap.Modal(document.getElementById("authModal"));
        showWarningModal("You must be logged in to save a memory.");
        if (authModal) authModal.show();
        return;
      }
      const entryTextArea2 = document.getElementById("entry-text");
      const entryText = entryTextArea2.value.trim();
      if (!entryText) {
        showWarningModal("Please enter some text for your reflection.");
        return;
      }
      const MAX_CHARS = 25e3;
      if (entryText.length > MAX_CHARS) {
        showWarningModal(`Your entry is too long. Please limit your reflection to approximately 5000 words (${MAX_CHARS} characters).`);
        return;
      }
      const message_for_nildb = {
        uuid,
        date: currentSelectedDate,
        entry: entryText
      };
      showLoadingAnimation("Saving your memory...");
      try {
        if (!appState.collection) {
          throw new Error("Collection not initialized. Please log in.");
        }
        const dataWritten = await appState.collection.writeToNodes([message_for_nildb]);
        console.log("Data written to nilDB:", dataWritten);
        const recordId = dataWritten[0]?.data?.created?.[0];
        const data = loadData();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        if (!data[currentSelectedDate]) {
          data[currentSelectedDate] = [];
        }
        data[currentSelectedDate].push({ text: entryText, id: recordId, timestamp });
        saveData(data);
        entryTextArea2.value = "";
        displayEntries(data[currentSelectedDate]);
        markDateWithEntriesHelper(currentSelectedDate);
        const entriesList = document.getElementById("entries-list");
        if (entriesList) {
          entriesList.scrollTop = 0;
        }
        runAndLogInitialQuery();
      } catch (error) {
        console.error("Failed to write data to nilDB:", error);
        showWarningModal(`Failed to save memory: ${error.message}`);
      } finally {
        hideLoadingAnimation();
      }
    }
    function markDatesWithEntries() {
      const data = loadData();
      Object.keys(data).forEach((dateStr) => {
        markDateWithEntriesHelper(dateStr);
      });
    }
    function markDateWithEntriesHelper(dateStr) {
      if (!calendar) return;
      const dateEl = calendar.el.querySelector(`.fc-day[data-date="${dateStr}"]`);
      if (dateEl) {
        dateEl.classList.add("fc-day-has-entries");
      }
    }
    function formatDisplayDate(dateStr) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    async function selectDate(dateStr) {
      if (!calendar) return;
      if (currentSelectedDate) {
        const prevEl = calendar.el.querySelector(`.fc-day[data-date="${currentSelectedDate}"]`);
        if (prevEl) prevEl.classList.remove("fc-day-selected");
      }
      const dateEl = calendar.el.querySelector(`.fc-day[data-date="${dateStr}"]`);
      if (dateEl) dateEl.classList.add("fc-day-selected");
      currentSelectedDate = dateStr;
      document.getElementById("selected-date-header").textContent = formatDisplayDate(dateStr);
      document.getElementById("entry-form-container").style.display = "block";
      document.getElementById("no-date-message").style.display = "none";
      showLoadingAnimation("Fetching memories...");
      try {
        const authData = JSON.parse(sessionStorage.getItem("blind_reflections_auth"));
        const uuid = authData?.uuid;
        if (!uuid) {
          showWarningModal("You must be logged in to view memories.");
          return;
        }
        if (!appState.collection) {
          throw new Error("Collection not initialized. Please log in.");
        }
        const dataReadFromNilDB = await appState.collection.readFromNodes({ uuid, date: dateStr });
        console.log("Data read from nilDB:", dataReadFromNilDB);
        const entries = dataReadFromNilDB.flatMap((nodeArray) => {
          if (Array.isArray(nodeArray)) {
            return nodeArray.map((entry) => ({
              id: entry._id,
              timestamp: entry._created,
              text: entry.entry
            }));
          }
          return [];
        });
        console.log("Processed entries:", entries);
        const data = loadData();
        data[dateStr] = entries;
        saveData(data);
        displayEntries(data[dateStr]);
      } catch (error) {
        console.error("Failed to read data from nilDB:", error);
        showWarningModal(`Failed to fetch memories: ${error.message}`);
      } finally {
        hideLoadingAnimation();
      }
    }
    const memoryQueue = [];
    function displayEntries(entries) {
      const entriesListEl = document.getElementById("entries-list");
      const noEntriesMessageEl = document.getElementById("no-entries-message");
      const memoryDisplayBox = document.getElementById("memory-display-box");
      entriesListEl.innerHTML = "";
      if (!entries || entries.length === 0) {
        noEntriesMessageEl.style.display = "block";
        return;
      }
      noEntriesMessageEl.style.display = "none";
      entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      entries.forEach((entry) => {
        const entryCard = document.createElement("div");
        entryCard.className = "card entry-card mb-3";
        entryCard.style.cursor = "pointer";
        entryCard.setAttribute("data-entry-id", entry.id);
        const timestamp = new Date(entry.timestamp);
        const formattedTime = timestamp.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit"
        });
        const formattedDate = timestamp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        entryCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="entry-timestamp">${formattedDate} at ${formattedTime}</span>
                    </div>
                    <p class="card-text entry-text">${entry.text}</p>
                </div>
            `;
        entryCard.addEventListener("click", () => {
          const memoryText = entry.text;
          const memoryDate = currentSelectedDate;
          const alreadyExists = memoryQueue.some((item) => item.id === entry.id);
          if (alreadyExists) return;
          const memoryData = { id: entry.id, date: memoryDate, text: memoryText };
          memoryQueue.push(memoryData);
          if (memoryQueue.length > 5) {
            memoryQueue.shift();
          }
          renderMemoryDisplayBox();
        });
        entriesListEl.appendChild(entryCard);
      });
    }
    function renderMemoryDisplayBox() {
      const memoryDisplayBox = document.getElementById("memory-display-box");
      memoryDisplayBox.innerHTML = "";
      if (memoryQueue.length === 0) {
        memoryDisplayBox.style.display = "none";
        return;
      }
      memoryDisplayBox.style.display = "block";
      memoryQueue.forEach((itemData) => {
        const memoryCard = document.createElement("div");
        memoryCard.className = "card memory-card mb-2";
        memoryCard.innerHTML = `
                <div class="card-body d-flex align-items-start">
                    <span class="memory-date me-3">${itemData.date}</span>
                    <p class="card-text entry-text memory-text mb-0">${itemData.text}</p>
                </div>
            `;
        memoryDisplayBox.appendChild(memoryCard);
      });
    }
    document.getElementById("ask-secret-llm-btn").addEventListener("click", async () => {
      const privateReflectionInput = document.getElementById("private-reflection-input");
      if (!privateReflectionInput.value.trim() && memoryQueue.length === 0) {
        showWarningModal("Please provide a prompt and select at least one memory.");
        return;
      } else if (!privateReflectionInput.value.trim()) {
        showWarningModal("Please provide a prompt.");
        return;
      } else if (memoryQueue.length === 0) {
        showWarningModal("Please select at least one memory.");
        return;
      }
      const messages = [];
      if (privateReflectionInput.value.trim()) {
        messages.push({
          role: "user",
          content: privateReflectionInput.value.trim()
        });
      }
      if (memoryQueue.length > 0) {
        const memoryContext = memoryQueue.map((item) => {
          return `Memory from ${item.date}: ${item.text}`;
        }).join("\n\n");
        messages.push({
          role: "system",
          content: `Context based on selected memories:
${memoryContext}`
        });
      } else {
        console.warn("No memories selected.");
      }
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Accept", "application/json");
      myHeaders.append("Authorization", "Bearer Nillion2025");
      console.log("Messages for API:", messages);
      const raw = JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        // TODO: Move to config
        messages,
        temperature: 0.2,
        top_p: 0.95,
        max_tokens: 2048,
        stream: false,
        nilrag: {}
        // TODO: Understand what this does or remove if unnecessary
      });
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
      showLoadingAnimation("Waiting for SecretLLM...");
      try {
        const response = await fetch("https://nilai-a779.nillion.network/v1/chat/completions", requestOptions);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        const result = await response.json();
        console.log("API Response:", result);
        if (result.choices && result.choices[0] && result.choices[0].message) {
          showLLMResponseModal(result.choices[0].message.content);
        } else {
          throw new Error("Invalid response structure from API");
        }
      } catch (error) {
        console.error("Error calling the API:", error);
        showWarningModal(`Failed to process request: ${error.message}`);
      } finally {
        hideLoadingAnimation();
      }
      memoryQueue.length = 0;
      privateReflectionInput.value = "";
      privateReflectionInput.setAttribute("placeholder", "Let's do some private reflections...");
      renderMemoryDisplayBox();
    });
    function showLoadingAnimation(message = "Loading...") {
      hideLoadingAnimation();
      const template = document.getElementById("loading-animation-template");
      if (!template) {
        console.error("Loading animation template not found!");
        return;
      }
      const clone = template.content.cloneNode(true);
      const loaderElement = clone.querySelector(".custom-loader-overlay");
      const messageElement = clone.querySelector(".loading-message");
      if (!loaderElement || !messageElement) {
        console.error("Essential elements missing in loading template!");
        return;
      }
      messageElement.textContent = message;
      loaderElement.id = "active-loader-overlay";
      document.body.appendChild(loaderElement);
    }
    function hideLoadingAnimation() {
      const loaderOverlay = document.getElementById("active-loader-overlay");
      if (loaderOverlay) {
        loaderOverlay.remove();
      }
    }
    const calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: ""
        // Removed the 'dayGridMonth' button
      },
      selectable: true,
      dateClick: function(info) {
        selectDate(info.dateStr);
      },
      datesSet: function() {
        markDatesWithEntries();
      },
      contentHeight: "auto",
      // Ensure no vertical scrolling
      height: "auto"
      // Automatically adjust height to remove scrollbar
    });
    calendar.render();
    markDatesWithEntries();
    document.getElementById("save-entry-btn").addEventListener("click", saveEntry);
    document.getElementById("entry-text").addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        saveEntry();
      }
    });
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micButton = document.getElementById("mic-button");
    const micIcon = document.getElementById("mic-icon");
    const reflectionInput = document.getElementById("private-reflection-input");
    const speechStatus = document.getElementById("speech-status");
    let recognition;
    let isRecording = false;
    if (SpeechRecognition && micButton && reflectionInput && speechStatus && micIcon) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      micButton.addEventListener("click", () => {
        if (isRecording) {
          recognition.stop();
        } else {
          try {
            recognition.start();
          } catch (error) {
            console.error("Error starting speech recognition:", error);
            showWarningModal("Could not start dictation. Please check microphone permissions or try again.");
            isRecording = false;
            micIcon.className = "fas fa-microphone";
            speechStatus.style.display = "none";
          }
        }
      });
      recognition.onstart = () => {
        console.log("Speech recognition started");
        isRecording = true;
        micIcon.className = "fas fa-stop-circle text-danger";
        speechStatus.textContent = "Listening...";
        speechStatus.style.display = "inline";
      };
      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const currentText = reflectionInput.value;
          const separator = currentText.length > 0 && !/\s$/.test(currentText) ? " " : "";
          reflectionInput.value += separator + finalTranscript.trim() + " ";
          speechStatus.textContent = 'Added: "' + finalTranscript.trim() + '" ';
          setTimeout(() => {
            if (isRecording) speechStatus.textContent = "Listening...";
          }, 1500);
        }
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        let errorMessage = "An unknown error occurred during dictation.";
        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech was detected. Microphone might be muted or setup incorrectly.";
            break;
          case "audio-capture":
            errorMessage = "Microphone not available. Check if it's connected and enabled.";
            break;
          case "not-allowed":
            errorMessage = "Microphone permission denied. Please allow access in browser settings.";
            break;
          case "network":
            errorMessage = "Network error during speech recognition. Check connection.";
            break;
        }
        showWarningModal(errorMessage);
        isRecording = false;
        micIcon.className = "fas fa-microphone";
        speechStatus.style.display = "none";
      };
      recognition.onend = () => {
        console.log("Speech recognition ended");
        isRecording = false;
        micIcon.className = "fas fa-microphone";
        speechStatus.style.display = "none";
      };
    } else {
      if (micButton) micButton.style.display = "none";
      console.warn("Web Speech API not supported or mic elements missing.");
    }
    const entryMicButton = document.getElementById("entry-mic-button");
    const entryMicIcon = document.getElementById("entry-mic-icon");
    const entryTextArea = document.getElementById("entry-text");
    const entrySpeechStatus = document.getElementById("entry-speech-status");
    let entryRecognition;
    let isEntryRecording = false;
    if (SpeechRecognition && entryMicButton && entryTextArea && entrySpeechStatus && entryMicIcon) {
      entryRecognition = new SpeechRecognition();
      entryRecognition.continuous = true;
      entryRecognition.interimResults = true;
      entryMicButton.addEventListener("click", () => {
        if (isEntryRecording) {
          entryRecognition.stop();
        } else {
          try {
            entryRecognition.start();
          } catch (error) {
            console.error("Error starting entry speech recognition:", error);
            showWarningModal("Could not start dictation for entry. Please check microphone permissions or try again.");
            isEntryRecording = false;
            entryMicIcon.className = "fas fa-microphone";
            entrySpeechStatus.style.display = "none";
          }
        }
      });
      entryRecognition.onstart = () => {
        console.log("Entry speech recognition started");
        isEntryRecording = true;
        entryMicIcon.className = "fas fa-stop-circle text-danger";
        entrySpeechStatus.textContent = "Listening...";
        entrySpeechStatus.style.display = "inline";
      };
      entryRecognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const currentText = entryTextArea.value;
          const separator = currentText.length > 0 && !/\s$/.test(currentText) ? " " : "";
          entryTextArea.value += separator + finalTranscript.trim() + " ";
          entrySpeechStatus.textContent = 'Added: "' + finalTranscript.trim() + '" ';
          setTimeout(() => {
            if (isEntryRecording) entrySpeechStatus.textContent = "Listening...";
          }, 1500);
        }
      };
      entryRecognition.onerror = (event) => {
        console.error("Entry speech recognition error:", event.error);
        let errorMessage = "An unknown error occurred during entry dictation.";
        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech was detected. Microphone might be muted or setup incorrectly.";
            break;
          case "audio-capture":
            errorMessage = "Microphone not available. Check if it's connected and enabled.";
            break;
          case "not-allowed":
            errorMessage = "Microphone permission denied. Please allow access in browser settings.";
            break;
          case "network":
            errorMessage = "Network error during speech recognition. Check connection.";
            break;
        }
        showWarningModal(errorMessage);
        isEntryRecording = false;
        entryMicIcon.className = "fas fa-microphone";
        entrySpeechStatus.style.display = "none";
      };
      entryRecognition.onend = () => {
        console.log("Entry speech recognition ended");
        isEntryRecording = false;
        entryMicIcon.className = "fas fa-microphone";
        entrySpeechStatus.style.display = "none";
      };
    } else {
      if (entryMicButton) entryMicButton.style.display = "none";
      console.warn("Web Speech API not supported or entry mic elements missing.");
    }
  }
  function ensureHistogramElements() {
    let section = document.getElementById("histogram-section");
    if (!section) {
      section = document.createElement("div");
      section.id = "histogram-section";
      section.className = "mt-3";
      section.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">Top Reflection Days</h6>
                    <div id="histogram-container" class="histogram-container">
                        <p id="histogram-loading" class="text-muted small">Loading histogram data...</p>
                    </div>
                </div>
            </div>
        `;
      document.querySelector(".container").appendChild(section);
    }
    if (!section.querySelector("#histogram-container")) {
      section.querySelector(".card-body").insertAdjacentHTML(
        "beforeend",
        `<div id="histogram-container" class="histogram-container">
                <p id="histogram-loading" class="text-muted small">Loading histogram data...</p>
            </div>`
      );
    }
    if (!section.querySelector("#histogram-loading")) {
      section.querySelector("#histogram-container").innerHTML = `<p id="histogram-loading" class="text-muted small">Loading histogram data...</p>`;
    }
    return section;
  }
  function renderHistogram(data) {
    const section = ensureHistogramElements();
    const container = section.querySelector("#histogram-container");
    const loadingMsg = section.querySelector("#histogram-loading");
    section.style.display = "block";
    container.innerHTML = "";
    if (loadingMsg) loadingMsg.style.display = "none";
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p class="text-muted small text-center w-100">No reflection data to display.</p>';
      return;
    }
    const maxCount = Math.max(...data.map((item) => Number(item.reflections_count) || 0));
    data.forEach((item) => {
      const count = Number(item.reflections_count) || 0;
      const barHeight = maxCount > 0 ? count / maxCount * 100 : 0;
      const bar = document.createElement("div");
      bar.className = "histogram-bar";
      bar.style.height = `${barHeight}%`;
      bar.title = `${item.date}: ${count} reflections`;
      const valueLabel = document.createElement("span");
      valueLabel.className = "bar-value";
      valueLabel.textContent = count;
      const dateLabel = document.createElement("span");
      dateLabel.className = "bar-label";
      dateLabel.textContent = item.date;
      bar.appendChild(valueLabel);
      bar.appendChild(dateLabel);
      container.appendChild(bar);
    });
  }
  var TOP_K_RESULTS = 5;
  async function runAndLogInitialQuery() {
    if (!appState.collection) {
      console.log("Skipping initial query: Collection not initialized.");
      renderHistogram([]);
      return;
    }
    if (!NILDB.nodes || NILDB.nodes.length === 0) {
      console.error("Skipping initial query: No nodes configured.");
      renderHistogram([]);
      return;
    }
    const authData = JSON.parse(sessionStorage.getItem("blind_reflections_auth"));
    const currentUserUuid = authData?.uuid;
    if (!currentUserUuid) {
      console.error("Skipping initial query: User UUID not found in session storage.");
      renderHistogram([]);
      return;
    }
    const targetNode = NILDB.nodes[0];
    const queryPayload = {
      id: AGGREGATION,
      // Use the AGGREGATION constant as the query ID
      variables: {
        uuid: currentUserUuid
        // Provide the required uuid variable
      }
    };
    console.log(`\u{1F680} Running initial query execution (ID: ${queryPayload.id}, UUID: ${currentUserUuid}) on node: ${targetNode.url}`);
    try {
      const result = await appState.collection.executeQueryOnSingleNode(targetNode, queryPayload);
      if (result.error) {
        console.error(`\u274C Initial query execution failed (Node: ${result.node}, Status: ${result.status}):`, result.error);
        renderHistogram([]);
      } else {
        console.log(`\u2705 Initial query execution successful (Node: ${result.node}, Status: ${result.status}). Raw data:`, result.data);
        if (Array.isArray(result.data)) {
          const sortedData = [...result.data].sort((a, b) => {
            const countA = Number(a.reflections_count) || 0;
            const countB = Number(b.reflections_count) || 0;
            return countB - countA;
          });
          const topK = sortedData.slice(0, TOP_K_RESULTS);
          console.log(`\u{1F4CA} Top ${TOP_K_RESULTS} reflection counts:`, topK);
          renderHistogram(topK);
        } else {
          console.log("\u2139\uFE0F Data returned from query is not an array.");
          renderHistogram([]);
        }
      }
    } catch (e) {
      console.error(`\u274C Unexpected error during initial query execution:`, e);
      renderHistogram([]);
    }
  }
  function initializeAuth() {
    const SESSION_UUID_KEY = "blind_reflections_uuid";
    const SESSION_AUTH_KEY = "blind_reflections_auth";
    const uuidSpan = document.getElementById("register-uuid");
    const registerTabLink = document.querySelector("a#register-tab");
    const authModal = document.getElementById("authModal");
    const authModalElement = authModal ? new bootstrap.Modal(authModal) : null;
    const signUpLoginButton = document.getElementById("sign-up-login-button");
    const userDisplaySpan = document.getElementById("user-display") || createUserDisplayElement();
    const registerButton = document.getElementById("register-button");
    const loginButton = document.getElementById("login-button");
    const connectWalletButtons = document.querySelectorAll("#connect-metamask-btn");
    const loginUsernameInput = document.getElementById("login-username");
    const loginPasswordInput = document.getElementById("login-password");
    const loginTabLink = document.getElementById("login-tab");
    function createUserDisplayElement() {
      const span = document.createElement("span");
      span.id = "user-display";
      span.className = "ms-2 d-none";
      span.style.fontFamily = "monospace";
      span.style.fontSize = "0.9rem";
      if (signUpLoginButton && signUpLoginButton.parentNode) {
        if (signUpLoginButton.nextSibling) {
          signUpLoginButton.parentNode.insertBefore(span, signUpLoginButton.nextSibling);
        } else {
          signUpLoginButton.parentNode.appendChild(span);
        }
      }
      return span;
    }
    function setUuid() {
      try {
        if (uuidSpan) {
          const newUuid = v4_default();
          uuidSpan.textContent = newUuid;
          console.log("UUID generated successfully");
        }
      } catch (error) {
        console.error("Error generating UUID:", error);
        if (uuidSpan) {
          uuidSpan.textContent = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
            return v.toString(16);
          });
        }
      }
    }
    function saveAuthData(uuid, password) {
      const authData = { uuid, password, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      sessionStorage.setItem(SESSION_UUID_KEY, uuid);
      sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(authData));
    }
    async function initializeCollection(uuid) {
      if (appState.collection && appState.collection.credentials.orgDid === NILDB.orgCredentials.orgDid) {
        console.log(`Collection already initialized for UUID: ${uuid}`);
        return;
      }
      try {
        appState.collection = new SecretVaultWrapper(NILDB.nodes, NILDB.orgCredentials, SCHEMA);
        await appState.collection.init();
        console.log(`Collection initialized for UUID: ${uuid}`);
      } catch (error) {
        console.error("Failed to initialize collection:", error);
        showWarningModal(`Error initializing connection: ${error.message}`);
        sessionStorage.removeItem(SESSION_UUID_KEY);
        sessionStorage.removeItem(SESSION_AUTH_KEY);
        appState.collection = null;
        location.reload();
      }
    }
    function displayLoggedInUser(identifier) {
      if (userDisplaySpan && identifier) {
        let displayIdentifier = identifier;
        if (identifier.startsWith("0x") && identifier.length === 42) {
          displayIdentifier = `${identifier.substring(0, 6)}...${identifier.substring(identifier.length - 4)}`;
          userDisplaySpan.title = `Logged in as: ${identifier}`;
        } else {
          userDisplaySpan.title = `Your unique identifier`;
        }
        userDisplaySpan.textContent = displayIdentifier;
        userDisplaySpan.classList.remove("d-none");
        const existingCopyBtn = document.getElementById("header-copy-uuid-btn");
        if (!existingCopyBtn) {
          const copyBtn2 = document.createElement("button");
          copyBtn2.id = "header-copy-uuid-btn";
          copyBtn2.className = "btn btn-sm btn-outline-secondary ms-1";
          copyBtn2.title = "Copy full identifier to clipboard";
          copyBtn2.innerHTML = '<i class="fas fa-copy"></i>';
          copyBtn2.addEventListener("click", function() {
            navigator.clipboard.writeText(identifier).then(function() {
              copyBtn2.innerHTML = '<i class="fas fa-check"></i>';
              copyBtn2.classList.add("btn-success");
              copyBtn2.classList.remove("btn-outline-secondary");
              copyBtn2.disabled = true;
              setTimeout(() => {
                copyBtn2.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn2.classList.remove("btn-success");
                copyBtn2.classList.add("btn-outline-secondary");
                copyBtn2.disabled = false;
              }, 1200);
            }).catch(function(err) {
              console.error("Could not copy text: ", err);
              showWarningModal("Failed to copy to clipboard");
            });
          });
          if (userDisplaySpan.parentNode) {
            userDisplaySpan.parentNode.insertBefore(copyBtn2, userDisplaySpan.nextSibling);
          }
        }
        if (signUpLoginButton) {
          signUpLoginButton.textContent = "Logout";
          signUpLoginButton.removeAttribute("data-bs-toggle");
          signUpLoginButton.removeAttribute("data-bs-target");
          const newButton = signUpLoginButton.cloneNode(true);
          signUpLoginButton.parentNode.replaceChild(newButton, signUpLoginButton);
          newButton.addEventListener("click", function logoutHandler() {
            const copyBtn2 = document.getElementById("header-copy-uuid-btn");
            if (copyBtn2) copyBtn2.remove();
            sessionStorage.removeItem(SESSION_UUID_KEY);
            sessionStorage.removeItem(SESSION_AUTH_KEY);
            appState.collection = null;
            location.reload();
          });
        }
      }
    }
    if (registerButton) {
      registerButton.addEventListener("click", async function() {
        const uuid = uuidSpan.textContent;
        const passwordInput = document.getElementById("register-password");
        const password = passwordInput.value;
        if (!uuid || uuid === "UUID generation failed" || !password) {
          showWarningModal("Please generate a valid UUID and provide a password");
          return;
        }
        if (password.length < 8) {
          showWarningModal("Password must be at least 8 characters long.");
          return;
        }
        saveAuthData(uuid, password);
        await initializeCollection(uuid);
        const authModalInstance = bootstrap.Modal.getInstance(authModal);
        if (authModalInstance) {
          authModalInstance.hide();
        }
        displayLoggedInUser(uuid);
        runAndLogInitialQuery();
      });
    }
    if (loginButton) {
      loginButton.addEventListener("click", async function() {
        const uuidInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");
        const uuid = uuidInput.value;
        const password = passwordInput.value;
        if (!uuid || !password) {
          showWarningModal("Please provide both Unique Identifier and password");
          return;
        }
        saveAuthData(uuid, password);
        await initializeCollection(uuid);
        if (appState.collection) {
          if (authModalElement) {
            authModalElement.hide();
          }
          displayLoggedInUser(uuid);
          runAndLogInitialQuery();
        } else {
          passwordInput.value = "";
        }
      });
    }
    async function handleWalletConnect() {
      if (typeof window.ethereum === "undefined") {
        showWarningModal("No Ethereum wallet detected! Please install a browser extension like MetaMask.");
        return;
      }
      if (!loginUsernameInput || !loginPasswordInput || !loginTabLink) {
        console.error("Login form elements not found, cannot pre-fill.");
        showWarningModal("Internal error: Cannot access login form elements.");
        return;
      }
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          showWarningModal("Could not retrieve account from wallet.");
          return;
        }
        const address = accounts[0];
        console.log(`Wallet Connect: Fetched address=${address}`);
        loginUsernameInput.value = address;
        const loginTab = new bootstrap.Tab(loginTabLink);
        loginTab.show();
        loginPasswordInput.focus();
      } catch (error) {
        console.error("Error connecting wallet:", error);
        let userMessage = "Failed to connect wallet.";
        if (error.code === 4001) {
          userMessage = "Wallet connection request rejected.";
        }
        showWarningModal(userMessage);
      }
    }
    if (connectWalletButtons.length > 0) {
      connectWalletButtons.forEach((button) => {
        button.addEventListener("click", handleWalletConnect);
      });
    }
    if (registerTabLink && uuidSpan) {
      registerTabLink.addEventListener("shown.bs.tab", setUuid);
    }
    if (authModal && uuidSpan) {
      authModal.addEventListener("show.bs.modal", () => {
        if (!uuidSpan.textContent || uuidSpan.textContent === "UUID generation failed") {
          setUuid();
        }
      });
    }
    if (uuidSpan && (!uuidSpan.textContent || uuidSpan.textContent === "UUID generation failed")) {
      setUuid();
    }
    const copyBtn = document.getElementById("copy-uuid-btn");
    if (copyBtn && uuidSpan) {
      copyBtn.addEventListener("click", function() {
        const uuidText = uuidSpan.textContent;
        if (uuidText && uuidText !== "UUID generation failed") {
          navigator.clipboard.writeText(uuidText).then(function() {
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.add("btn-success");
            copyBtn.classList.remove("btn-outline-secondary");
            copyBtn.disabled = true;
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
              copyBtn.classList.remove("btn-success");
              copyBtn.classList.add("btn-outline-secondary");
              copyBtn.disabled = false;
            }, 1200);
          }).catch(function(err) {
            console.error("Could not copy text: ", err);
            showWarningModal("Failed to copy to clipboard");
          });
        } else {
          showWarningModal("No valid UUID to copy");
        }
      });
    }
    const savedUuid = sessionStorage.getItem(SESSION_UUID_KEY);
    if (savedUuid) {
      (async () => {
        displayLoggedInUser(savedUuid);
        await initializeCollection(savedUuid);
        runAndLogInitialQuery();
      })();
    }
  }
  document.addEventListener("DOMContentLoaded", function() {
    initializeReflectionsApp();
    initializeAuth();
  });
})();
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/utils.js:
@noble/curves/esm/abstract/modular.js:
@noble/curves/esm/abstract/curve.js:
@noble/curves/esm/abstract/edwards.js:
@noble/curves/esm/ed25519.js:
@noble/curves/esm/abstract/weierstrass.js:
@noble/curves/esm/_shortw_utils.js:
@noble/curves/esm/secp256k1.js:
@noble/curves/esm/nist.js:
@noble/curves/esm/p256.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/base/lib/esm/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
