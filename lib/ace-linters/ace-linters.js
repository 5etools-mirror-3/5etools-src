(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global));
})(this, function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __esmMin = (fn, res, err) => () => {
		if (err) throw err[0];
		try {
			return fn && (res = fn(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/is.js
	var require_is$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.stringArray = exports.array = exports.func = exports.error = exports.number = exports.string = exports.boolean = void 0;
		function boolean(value) {
			return value === true || value === false;
		}
		exports.boolean = boolean;
		function string(value) {
			return typeof value === "string" || value instanceof String;
		}
		exports.string = string;
		function number(value) {
			return typeof value === "number" || value instanceof Number;
		}
		exports.number = number;
		function error(value) {
			return value instanceof Error;
		}
		exports.error = error;
		function func(value) {
			return typeof value === "function";
		}
		exports.func = func;
		function array(value) {
			return Array.isArray(value);
		}
		exports.array = array;
		function stringArray(value) {
			return array(value) && value.every((elem) => string(elem));
		}
		exports.stringArray = stringArray;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/messages.js
	var require_messages$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.Message = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType = exports.RequestType0 = exports.AbstractMessageSignature = exports.ParameterStructures = exports.ResponseError = exports.ErrorCodes = void 0;
		var is = require_is$1();
		/**
		* Predefined error codes.
		*/
		var ErrorCodes;
		(function(ErrorCodes) {
			ErrorCodes.ParseError = -32700;
			ErrorCodes.InvalidRequest = -32600;
			ErrorCodes.MethodNotFound = -32601;
			ErrorCodes.InvalidParams = -32602;
			ErrorCodes.InternalError = -32603;
			/**
			* This is the start range of JSON RPC reserved error codes.
			* It doesn't denote a real error code. No application error codes should
			* be defined between the start and end range. For backwards
			* compatibility the `ServerNotInitialized` and the `UnknownErrorCode`
			* are left in the range.
			*
			* @since 3.16.0
			*/
			ErrorCodes.jsonrpcReservedErrorRangeStart = -32099;
			/** @deprecated use  jsonrpcReservedErrorRangeStart */
			ErrorCodes.serverErrorStart = -32099;
			/**
			* An error occurred when write a message to the transport layer.
			*/
			ErrorCodes.MessageWriteError = -32099;
			/**
			* An error occurred when reading a message from the transport layer.
			*/
			ErrorCodes.MessageReadError = -32098;
			/**
			* The connection got disposed or lost and all pending responses got
			* rejected.
			*/
			ErrorCodes.PendingResponseRejected = -32097;
			/**
			* The connection is inactive and a use of it failed.
			*/
			ErrorCodes.ConnectionInactive = -32096;
			/**
			* Error code indicating that a server received a notification or
			* request before the server has received the `initialize` request.
			*/
			ErrorCodes.ServerNotInitialized = -32002;
			ErrorCodes.UnknownErrorCode = -32001;
			/**
			* This is the end range of JSON RPC reserved error codes.
			* It doesn't denote a real error code.
			*
			* @since 3.16.0
			*/
			ErrorCodes.jsonrpcReservedErrorRangeEnd = -32e3;
			/** @deprecated use  jsonrpcReservedErrorRangeEnd */
			ErrorCodes.serverErrorEnd = -32e3;
		})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
		exports.ResponseError = class ResponseError extends Error {
			constructor(code, message, data) {
				super(message);
				this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
				this.data = data;
				Object.setPrototypeOf(this, ResponseError.prototype);
			}
			toJson() {
				const result = {
					code: this.code,
					message: this.message
				};
				if (this.data !== void 0) result.data = this.data;
				return result;
			}
		};
		var ParameterStructures = class ParameterStructures {
			constructor(kind) {
				this.kind = kind;
			}
			static is(value) {
				return value === ParameterStructures.auto || value === ParameterStructures.byName || value === ParameterStructures.byPosition;
			}
			toString() {
				return this.kind;
			}
		};
		exports.ParameterStructures = ParameterStructures;
		/**
		* The parameter structure is automatically inferred on the number of parameters
		* and the parameter type in case of a single param.
		*/
		ParameterStructures.auto = new ParameterStructures("auto");
		/**
		* Forces `byPosition` parameter structure. This is useful if you have a single
		* parameter which has a literal type.
		*/
		ParameterStructures.byPosition = new ParameterStructures("byPosition");
		/**
		* Forces `byName` parameter structure. This is only useful when having a single
		* parameter. The library will report errors if used with a different number of
		* parameters.
		*/
		ParameterStructures.byName = new ParameterStructures("byName");
		/**
		* An abstract implementation of a MessageType.
		*/
		var AbstractMessageSignature = class {
			constructor(method, numberOfParams) {
				this.method = method;
				this.numberOfParams = numberOfParams;
			}
			get parameterStructures() {
				return ParameterStructures.auto;
			}
		};
		exports.AbstractMessageSignature = AbstractMessageSignature;
		/**
		* Classes to type request response pairs
		*/
		var RequestType0 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 0);
			}
		};
		exports.RequestType0 = RequestType0;
		var RequestType = class extends AbstractMessageSignature {
			constructor(method, _parameterStructures = ParameterStructures.auto) {
				super(method, 1);
				this._parameterStructures = _parameterStructures;
			}
			get parameterStructures() {
				return this._parameterStructures;
			}
		};
		exports.RequestType = RequestType;
		var RequestType1 = class extends AbstractMessageSignature {
			constructor(method, _parameterStructures = ParameterStructures.auto) {
				super(method, 1);
				this._parameterStructures = _parameterStructures;
			}
			get parameterStructures() {
				return this._parameterStructures;
			}
		};
		exports.RequestType1 = RequestType1;
		var RequestType2 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 2);
			}
		};
		exports.RequestType2 = RequestType2;
		var RequestType3 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 3);
			}
		};
		exports.RequestType3 = RequestType3;
		var RequestType4 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 4);
			}
		};
		exports.RequestType4 = RequestType4;
		var RequestType5 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 5);
			}
		};
		exports.RequestType5 = RequestType5;
		var RequestType6 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 6);
			}
		};
		exports.RequestType6 = RequestType6;
		var RequestType7 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 7);
			}
		};
		exports.RequestType7 = RequestType7;
		var RequestType8 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 8);
			}
		};
		exports.RequestType8 = RequestType8;
		var RequestType9 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 9);
			}
		};
		exports.RequestType9 = RequestType9;
		var NotificationType = class extends AbstractMessageSignature {
			constructor(method, _parameterStructures = ParameterStructures.auto) {
				super(method, 1);
				this._parameterStructures = _parameterStructures;
			}
			get parameterStructures() {
				return this._parameterStructures;
			}
		};
		exports.NotificationType = NotificationType;
		var NotificationType0 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 0);
			}
		};
		exports.NotificationType0 = NotificationType0;
		var NotificationType1 = class extends AbstractMessageSignature {
			constructor(method, _parameterStructures = ParameterStructures.auto) {
				super(method, 1);
				this._parameterStructures = _parameterStructures;
			}
			get parameterStructures() {
				return this._parameterStructures;
			}
		};
		exports.NotificationType1 = NotificationType1;
		var NotificationType2 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 2);
			}
		};
		exports.NotificationType2 = NotificationType2;
		var NotificationType3 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 3);
			}
		};
		exports.NotificationType3 = NotificationType3;
		var NotificationType4 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 4);
			}
		};
		exports.NotificationType4 = NotificationType4;
		var NotificationType5 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 5);
			}
		};
		exports.NotificationType5 = NotificationType5;
		var NotificationType6 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 6);
			}
		};
		exports.NotificationType6 = NotificationType6;
		var NotificationType7 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 7);
			}
		};
		exports.NotificationType7 = NotificationType7;
		var NotificationType8 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 8);
			}
		};
		exports.NotificationType8 = NotificationType8;
		var NotificationType9 = class extends AbstractMessageSignature {
			constructor(method) {
				super(method, 9);
			}
		};
		exports.NotificationType9 = NotificationType9;
		var Message;
		(function(Message) {
			/**
			* Tests if the given message is a request message
			*/
			function isRequest(message) {
				const candidate = message;
				return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
			}
			Message.isRequest = isRequest;
			/**
			* Tests if the given message is a notification message
			*/
			function isNotification(message) {
				const candidate = message;
				return candidate && is.string(candidate.method) && message.id === void 0;
			}
			Message.isNotification = isNotification;
			/**
			* Tests if the given message is a response message
			*/
			function isResponse(message) {
				const candidate = message;
				return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
			}
			Message.isResponse = isResponse;
		})(Message || (exports.Message = Message = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/linkedMap.js
	var require_linkedMap = /* @__PURE__ */ __commonJSMin(((exports) => {
		var _a;
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.LRUCache = exports.LinkedMap = exports.Touch = void 0;
		var Touch;
		(function(Touch) {
			Touch.None = 0;
			Touch.First = 1;
			Touch.AsOld = Touch.First;
			Touch.Last = 2;
			Touch.AsNew = Touch.Last;
		})(Touch || (exports.Touch = Touch = {}));
		var LinkedMap = class {
			constructor() {
				this[_a] = "LinkedMap";
				this._map = /* @__PURE__ */ new Map();
				this._head = void 0;
				this._tail = void 0;
				this._size = 0;
				this._state = 0;
			}
			clear() {
				this._map.clear();
				this._head = void 0;
				this._tail = void 0;
				this._size = 0;
				this._state++;
			}
			isEmpty() {
				return !this._head && !this._tail;
			}
			get size() {
				return this._size;
			}
			get first() {
				return this._head?.value;
			}
			get last() {
				return this._tail?.value;
			}
			has(key) {
				return this._map.has(key);
			}
			get(key, touch = Touch.None) {
				const item = this._map.get(key);
				if (!item) return;
				if (touch !== Touch.None) this.touch(item, touch);
				return item.value;
			}
			set(key, value, touch = Touch.None) {
				let item = this._map.get(key);
				if (item) {
					item.value = value;
					if (touch !== Touch.None) this.touch(item, touch);
				} else {
					item = {
						key,
						value,
						next: void 0,
						previous: void 0
					};
					switch (touch) {
						case Touch.None:
							this.addItemLast(item);
							break;
						case Touch.First:
							this.addItemFirst(item);
							break;
						case Touch.Last:
							this.addItemLast(item);
							break;
						default:
							this.addItemLast(item);
							break;
					}
					this._map.set(key, item);
					this._size++;
				}
				return this;
			}
			delete(key) {
				return !!this.remove(key);
			}
			remove(key) {
				const item = this._map.get(key);
				if (!item) return;
				this._map.delete(key);
				this.removeItem(item);
				this._size--;
				return item.value;
			}
			shift() {
				if (!this._head && !this._tail) return;
				if (!this._head || !this._tail) throw new Error("Invalid list");
				const item = this._head;
				this._map.delete(item.key);
				this.removeItem(item);
				this._size--;
				return item.value;
			}
			forEach(callbackfn, thisArg) {
				const state = this._state;
				let current = this._head;
				while (current) {
					if (thisArg) callbackfn.bind(thisArg)(current.value, current.key, this);
					else callbackfn(current.value, current.key, this);
					if (this._state !== state) throw new Error(`LinkedMap got modified during iteration.`);
					current = current.next;
				}
			}
			keys() {
				const state = this._state;
				let current = this._head;
				const iterator = {
					[Symbol.iterator]: () => {
						return iterator;
					},
					next: () => {
						if (this._state !== state) throw new Error(`LinkedMap got modified during iteration.`);
						if (current) {
							const result = {
								value: current.key,
								done: false
							};
							current = current.next;
							return result;
						} else return {
							value: void 0,
							done: true
						};
					}
				};
				return iterator;
			}
			values() {
				const state = this._state;
				let current = this._head;
				const iterator = {
					[Symbol.iterator]: () => {
						return iterator;
					},
					next: () => {
						if (this._state !== state) throw new Error(`LinkedMap got modified during iteration.`);
						if (current) {
							const result = {
								value: current.value,
								done: false
							};
							current = current.next;
							return result;
						} else return {
							value: void 0,
							done: true
						};
					}
				};
				return iterator;
			}
			entries() {
				const state = this._state;
				let current = this._head;
				const iterator = {
					[Symbol.iterator]: () => {
						return iterator;
					},
					next: () => {
						if (this._state !== state) throw new Error(`LinkedMap got modified during iteration.`);
						if (current) {
							const result = {
								value: [current.key, current.value],
								done: false
							};
							current = current.next;
							return result;
						} else return {
							value: void 0,
							done: true
						};
					}
				};
				return iterator;
			}
			[(_a = Symbol.toStringTag, Symbol.iterator)]() {
				return this.entries();
			}
			trimOld(newSize) {
				if (newSize >= this.size) return;
				if (newSize === 0) {
					this.clear();
					return;
				}
				let current = this._head;
				let currentSize = this.size;
				while (current && currentSize > newSize) {
					this._map.delete(current.key);
					current = current.next;
					currentSize--;
				}
				this._head = current;
				this._size = currentSize;
				if (current) current.previous = void 0;
				this._state++;
			}
			addItemFirst(item) {
				if (!this._head && !this._tail) this._tail = item;
				else if (!this._head) throw new Error("Invalid list");
				else {
					item.next = this._head;
					this._head.previous = item;
				}
				this._head = item;
				this._state++;
			}
			addItemLast(item) {
				if (!this._head && !this._tail) this._head = item;
				else if (!this._tail) throw new Error("Invalid list");
				else {
					item.previous = this._tail;
					this._tail.next = item;
				}
				this._tail = item;
				this._state++;
			}
			removeItem(item) {
				if (item === this._head && item === this._tail) {
					this._head = void 0;
					this._tail = void 0;
				} else if (item === this._head) {
					if (!item.next) throw new Error("Invalid list");
					item.next.previous = void 0;
					this._head = item.next;
				} else if (item === this._tail) {
					if (!item.previous) throw new Error("Invalid list");
					item.previous.next = void 0;
					this._tail = item.previous;
				} else {
					const next = item.next;
					const previous = item.previous;
					if (!next || !previous) throw new Error("Invalid list");
					next.previous = previous;
					previous.next = next;
				}
				item.next = void 0;
				item.previous = void 0;
				this._state++;
			}
			touch(item, touch) {
				if (!this._head || !this._tail) throw new Error("Invalid list");
				if (touch !== Touch.First && touch !== Touch.Last) return;
				if (touch === Touch.First) {
					if (item === this._head) return;
					const next = item.next;
					const previous = item.previous;
					if (item === this._tail) {
						previous.next = void 0;
						this._tail = previous;
					} else {
						next.previous = previous;
						previous.next = next;
					}
					item.previous = void 0;
					item.next = this._head;
					this._head.previous = item;
					this._head = item;
					this._state++;
				} else if (touch === Touch.Last) {
					if (item === this._tail) return;
					const next = item.next;
					const previous = item.previous;
					if (item === this._head) {
						next.previous = void 0;
						this._head = next;
					} else {
						next.previous = previous;
						previous.next = next;
					}
					item.next = void 0;
					item.previous = this._tail;
					this._tail.next = item;
					this._tail = item;
					this._state++;
				}
			}
			toJSON() {
				const data = [];
				this.forEach((value, key) => {
					data.push([key, value]);
				});
				return data;
			}
			fromJSON(data) {
				this.clear();
				for (const [key, value] of data) this.set(key, value);
			}
		};
		exports.LinkedMap = LinkedMap;
		var LRUCache = class extends LinkedMap {
			constructor(limit, ratio = 1) {
				super();
				this._limit = limit;
				this._ratio = Math.min(Math.max(0, ratio), 1);
			}
			get limit() {
				return this._limit;
			}
			set limit(limit) {
				this._limit = limit;
				this.checkTrim();
			}
			get ratio() {
				return this._ratio;
			}
			set ratio(ratio) {
				this._ratio = Math.min(Math.max(0, ratio), 1);
				this.checkTrim();
			}
			get(key, touch = Touch.AsNew) {
				return super.get(key, touch);
			}
			peek(key) {
				return super.get(key, Touch.None);
			}
			set(key, value) {
				super.set(key, value, Touch.Last);
				this.checkTrim();
				return this;
			}
			checkTrim() {
				if (this.size > this._limit) this.trimOld(Math.round(this._limit * this._ratio));
			}
		};
		exports.LRUCache = LRUCache;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/disposable.js
	var require_disposable = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.Disposable = void 0;
		var Disposable;
		(function(Disposable) {
			function create(func) {
				return { dispose: func };
			}
			Disposable.create = create;
		})(Disposable || (exports.Disposable = Disposable = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/ral.js
	var require_ral = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		var _ral;
		function RAL() {
			if (_ral === void 0) throw new Error(`No runtime abstraction layer installed`);
			return _ral;
		}
		(function(RAL) {
			function install(ral) {
				if (ral === void 0) throw new Error(`No runtime abstraction layer provided`);
				_ral = ral;
			}
			RAL.install = install;
		})(RAL || (RAL = {}));
		exports.default = RAL;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/events.js
	var require_events = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.Emitter = exports.Event = void 0;
		var ral_1 = require_ral();
		var Event;
		(function(Event) {
			const _disposable = { dispose() {} };
			Event.None = function() {
				return _disposable;
			};
		})(Event || (exports.Event = Event = {}));
		var CallbackList = class {
			add(callback, context = null, bucket) {
				if (!this._callbacks) {
					this._callbacks = [];
					this._contexts = [];
				}
				this._callbacks.push(callback);
				this._contexts.push(context);
				if (Array.isArray(bucket)) bucket.push({ dispose: () => this.remove(callback, context) });
			}
			remove(callback, context = null) {
				if (!this._callbacks) return;
				let foundCallbackWithDifferentContext = false;
				for (let i = 0, len = this._callbacks.length; i < len; i++) if (this._callbacks[i] === callback) if (this._contexts[i] === context) {
					this._callbacks.splice(i, 1);
					this._contexts.splice(i, 1);
					return;
				} else foundCallbackWithDifferentContext = true;
				if (foundCallbackWithDifferentContext) throw new Error("When adding a listener with a context, you should remove it with the same context");
			}
			invoke(...args) {
				if (!this._callbacks) return [];
				const ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
				for (let i = 0, len = callbacks.length; i < len; i++) try {
					ret.push(callbacks[i].apply(contexts[i], args));
				} catch (e) {
					(0, ral_1.default)().console.error(e);
				}
				return ret;
			}
			isEmpty() {
				return !this._callbacks || this._callbacks.length === 0;
			}
			dispose() {
				this._callbacks = void 0;
				this._contexts = void 0;
			}
		};
		var Emitter = class Emitter {
			constructor(_options) {
				this._options = _options;
			}
			/**
			* For the public to allow to subscribe
			* to events from this Emitter
			*/
			get event() {
				if (!this._event) this._event = (listener, thisArgs, disposables) => {
					if (!this._callbacks) this._callbacks = new CallbackList();
					if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) this._options.onFirstListenerAdd(this);
					this._callbacks.add(listener, thisArgs);
					const result = { dispose: () => {
						if (!this._callbacks) return;
						this._callbacks.remove(listener, thisArgs);
						result.dispose = Emitter._noop;
						if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) this._options.onLastListenerRemove(this);
					} };
					if (Array.isArray(disposables)) disposables.push(result);
					return result;
				};
				return this._event;
			}
			/**
			* To be kept private to fire an event to
			* subscribers
			*/
			fire(event) {
				if (this._callbacks) this._callbacks.invoke.call(this._callbacks, event);
			}
			dispose() {
				if (this._callbacks) {
					this._callbacks.dispose();
					this._callbacks = void 0;
				}
			}
		};
		exports.Emitter = Emitter;
		Emitter._noop = function() {};
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/cancellation.js
	var require_cancellation = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.CancellationTokenSource = exports.CancellationToken = void 0;
		var ral_1 = require_ral();
		var Is = require_is$1();
		var events_1 = require_events();
		var CancellationToken;
		(function(CancellationToken) {
			CancellationToken.None = Object.freeze({
				isCancellationRequested: false,
				onCancellationRequested: events_1.Event.None
			});
			CancellationToken.Cancelled = Object.freeze({
				isCancellationRequested: true,
				onCancellationRequested: events_1.Event.None
			});
			function is(value) {
				const candidate = value;
				return candidate && (candidate === CancellationToken.None || candidate === CancellationToken.Cancelled || Is.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested);
			}
			CancellationToken.is = is;
		})(CancellationToken || (exports.CancellationToken = CancellationToken = {}));
		var shortcutEvent = Object.freeze(function(callback, context) {
			const handle = (0, ral_1.default)().timer.setTimeout(callback.bind(context), 0);
			return { dispose() {
				handle.dispose();
			} };
		});
		var MutableToken = class {
			constructor() {
				this._isCancelled = false;
			}
			cancel() {
				if (!this._isCancelled) {
					this._isCancelled = true;
					if (this._emitter) {
						this._emitter.fire(void 0);
						this.dispose();
					}
				}
			}
			get isCancellationRequested() {
				return this._isCancelled;
			}
			get onCancellationRequested() {
				if (this._isCancelled) return shortcutEvent;
				if (!this._emitter) this._emitter = new events_1.Emitter();
				return this._emitter.event;
			}
			dispose() {
				if (this._emitter) {
					this._emitter.dispose();
					this._emitter = void 0;
				}
			}
		};
		var CancellationTokenSource = class {
			get token() {
				if (!this._token) this._token = new MutableToken();
				return this._token;
			}
			cancel() {
				if (!this._token) this._token = CancellationToken.Cancelled;
				else this._token.cancel();
			}
			dispose() {
				if (!this._token) this._token = CancellationToken.None;
				else if (this._token instanceof MutableToken) this._token.dispose();
			}
		};
		exports.CancellationTokenSource = CancellationTokenSource;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/sharedArrayCancellation.js
	var require_sharedArrayCancellation = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.SharedArrayReceiverStrategy = exports.SharedArraySenderStrategy = void 0;
		var cancellation_1 = require_cancellation();
		var CancellationState;
		(function(CancellationState) {
			CancellationState.Continue = 0;
			CancellationState.Cancelled = 1;
		})(CancellationState || (CancellationState = {}));
		var SharedArraySenderStrategy = class {
			constructor() {
				this.buffers = /* @__PURE__ */ new Map();
			}
			enableCancellation(request) {
				if (request.id === null) return;
				const buffer = new SharedArrayBuffer(4);
				const data = new Int32Array(buffer, 0, 1);
				data[0] = CancellationState.Continue;
				this.buffers.set(request.id, buffer);
				request.$cancellationData = buffer;
			}
			async sendCancellation(_conn, id) {
				const buffer = this.buffers.get(id);
				if (buffer === void 0) return;
				const data = new Int32Array(buffer, 0, 1);
				Atomics.store(data, 0, CancellationState.Cancelled);
			}
			cleanup(id) {
				this.buffers.delete(id);
			}
			dispose() {
				this.buffers.clear();
			}
		};
		exports.SharedArraySenderStrategy = SharedArraySenderStrategy;
		var SharedArrayBufferCancellationToken = class {
			constructor(buffer) {
				this.data = new Int32Array(buffer, 0, 1);
			}
			get isCancellationRequested() {
				return Atomics.load(this.data, 0) === CancellationState.Cancelled;
			}
			get onCancellationRequested() {
				throw new Error(`Cancellation over SharedArrayBuffer doesn't support cancellation events`);
			}
		};
		var SharedArrayBufferCancellationTokenSource = class {
			constructor(buffer) {
				this.token = new SharedArrayBufferCancellationToken(buffer);
			}
			cancel() {}
			dispose() {}
		};
		var SharedArrayReceiverStrategy = class {
			constructor() {
				this.kind = "request";
			}
			createCancellationTokenSource(request) {
				const buffer = request.$cancellationData;
				if (buffer === void 0) return new cancellation_1.CancellationTokenSource();
				return new SharedArrayBufferCancellationTokenSource(buffer);
			}
		};
		exports.SharedArrayReceiverStrategy = SharedArrayReceiverStrategy;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/semaphore.js
	var require_semaphore = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.Semaphore = void 0;
		var ral_1 = require_ral();
		var Semaphore = class {
			constructor(capacity = 1) {
				if (capacity <= 0) throw new Error("Capacity must be greater than 0");
				this._capacity = capacity;
				this._active = 0;
				this._waiting = [];
			}
			lock(thunk) {
				return new Promise((resolve, reject) => {
					this._waiting.push({
						thunk,
						resolve,
						reject
					});
					this.runNext();
				});
			}
			get active() {
				return this._active;
			}
			runNext() {
				if (this._waiting.length === 0 || this._active === this._capacity) return;
				(0, ral_1.default)().timer.setImmediate(() => this.doRunNext());
			}
			doRunNext() {
				if (this._waiting.length === 0 || this._active === this._capacity) return;
				const next = this._waiting.shift();
				this._active++;
				if (this._active > this._capacity) throw new Error(`To many thunks active`);
				try {
					const result = next.thunk();
					if (result instanceof Promise) result.then((value) => {
						this._active--;
						next.resolve(value);
						this.runNext();
					}, (err) => {
						this._active--;
						next.reject(err);
						this.runNext();
					});
					else {
						this._active--;
						next.resolve(result);
						this.runNext();
					}
				} catch (err) {
					this._active--;
					next.reject(err);
					this.runNext();
				}
			}
		};
		exports.Semaphore = Semaphore;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/messageReader.js
	var require_messageReader = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = void 0;
		var ral_1 = require_ral();
		var Is = require_is$1();
		var events_1 = require_events();
		var semaphore_1 = require_semaphore();
		var MessageReader;
		(function(MessageReader) {
			function is(value) {
				let candidate = value;
				return candidate && Is.func(candidate.listen) && Is.func(candidate.dispose) && Is.func(candidate.onError) && Is.func(candidate.onClose) && Is.func(candidate.onPartialMessage);
			}
			MessageReader.is = is;
		})(MessageReader || (exports.MessageReader = MessageReader = {}));
		var AbstractMessageReader = class {
			constructor() {
				this.errorEmitter = new events_1.Emitter();
				this.closeEmitter = new events_1.Emitter();
				this.partialMessageEmitter = new events_1.Emitter();
			}
			dispose() {
				this.errorEmitter.dispose();
				this.closeEmitter.dispose();
			}
			get onError() {
				return this.errorEmitter.event;
			}
			fireError(error) {
				this.errorEmitter.fire(this.asError(error));
			}
			get onClose() {
				return this.closeEmitter.event;
			}
			fireClose() {
				this.closeEmitter.fire(void 0);
			}
			get onPartialMessage() {
				return this.partialMessageEmitter.event;
			}
			firePartialMessage(info) {
				this.partialMessageEmitter.fire(info);
			}
			asError(error) {
				if (error instanceof Error) return error;
				else return /* @__PURE__ */ new Error(`Reader received error. Reason: ${Is.string(error.message) ? error.message : "unknown"}`);
			}
		};
		exports.AbstractMessageReader = AbstractMessageReader;
		var ResolvedMessageReaderOptions;
		(function(ResolvedMessageReaderOptions) {
			function fromOptions(options) {
				let charset;
				let contentDecoder;
				const contentDecoders = /* @__PURE__ */ new Map();
				let contentTypeDecoder;
				const contentTypeDecoders = /* @__PURE__ */ new Map();
				if (options === void 0 || typeof options === "string") charset = options ?? "utf-8";
				else {
					charset = options.charset ?? "utf-8";
					if (options.contentDecoder !== void 0) {
						contentDecoder = options.contentDecoder;
						contentDecoders.set(contentDecoder.name, contentDecoder);
					}
					if (options.contentDecoders !== void 0) for (const decoder of options.contentDecoders) contentDecoders.set(decoder.name, decoder);
					if (options.contentTypeDecoder !== void 0) {
						contentTypeDecoder = options.contentTypeDecoder;
						contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
					}
					if (options.contentTypeDecoders !== void 0) for (const decoder of options.contentTypeDecoders) contentTypeDecoders.set(decoder.name, decoder);
				}
				if (contentTypeDecoder === void 0) {
					contentTypeDecoder = (0, ral_1.default)().applicationJson.decoder;
					contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
				}
				return {
					charset,
					contentDecoder,
					contentDecoders,
					contentTypeDecoder,
					contentTypeDecoders
				};
			}
			ResolvedMessageReaderOptions.fromOptions = fromOptions;
		})(ResolvedMessageReaderOptions || (ResolvedMessageReaderOptions = {}));
		var ReadableStreamMessageReader = class extends AbstractMessageReader {
			constructor(readable, options) {
				super();
				this.readable = readable;
				this.options = ResolvedMessageReaderOptions.fromOptions(options);
				this.buffer = (0, ral_1.default)().messageBuffer.create(this.options.charset);
				this._partialMessageTimeout = 1e4;
				this.nextMessageLength = -1;
				this.messageToken = 0;
				this.readSemaphore = new semaphore_1.Semaphore(1);
			}
			set partialMessageTimeout(timeout) {
				this._partialMessageTimeout = timeout;
			}
			get partialMessageTimeout() {
				return this._partialMessageTimeout;
			}
			listen(callback) {
				this.nextMessageLength = -1;
				this.messageToken = 0;
				this.partialMessageTimer = void 0;
				this.callback = callback;
				const result = this.readable.onData((data) => {
					this.onData(data);
				});
				this.readable.onError((error) => this.fireError(error));
				this.readable.onClose(() => this.fireClose());
				return result;
			}
			onData(data) {
				try {
					this.buffer.append(data);
					while (true) {
						if (this.nextMessageLength === -1) {
							const headers = this.buffer.tryReadHeaders(true);
							if (!headers) return;
							const contentLength = headers.get("content-length");
							if (!contentLength) {
								this.fireError(/* @__PURE__ */ new Error(`Header must provide a Content-Length property.\n${JSON.stringify(Object.fromEntries(headers))}`));
								return;
							}
							const length = parseInt(contentLength);
							if (isNaN(length)) {
								this.fireError(/* @__PURE__ */ new Error(`Content-Length value must be a number. Got ${contentLength}`));
								return;
							}
							this.nextMessageLength = length;
						}
						const body = this.buffer.tryReadBody(this.nextMessageLength);
						if (body === void 0) {
							/** We haven't received the full message yet. */
							this.setPartialMessageTimer();
							return;
						}
						this.clearPartialMessageTimer();
						this.nextMessageLength = -1;
						this.readSemaphore.lock(async () => {
							const bytes = this.options.contentDecoder !== void 0 ? await this.options.contentDecoder.decode(body) : body;
							const message = await this.options.contentTypeDecoder.decode(bytes, this.options);
							this.callback(message);
						}).catch((error) => {
							this.fireError(error);
						});
					}
				} catch (error) {
					this.fireError(error);
				}
			}
			clearPartialMessageTimer() {
				if (this.partialMessageTimer) {
					this.partialMessageTimer.dispose();
					this.partialMessageTimer = void 0;
				}
			}
			setPartialMessageTimer() {
				this.clearPartialMessageTimer();
				if (this._partialMessageTimeout <= 0) return;
				this.partialMessageTimer = (0, ral_1.default)().timer.setTimeout((token, timeout) => {
					this.partialMessageTimer = void 0;
					if (token === this.messageToken) {
						this.firePartialMessage({
							messageToken: token,
							waitingTime: timeout
						});
						this.setPartialMessageTimer();
					}
				}, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
			}
		};
		exports.ReadableStreamMessageReader = ReadableStreamMessageReader;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/messageWriter.js
	var require_messageWriter = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = void 0;
		var ral_1 = require_ral();
		var Is = require_is$1();
		var semaphore_1 = require_semaphore();
		var events_1 = require_events();
		var ContentLength = "Content-Length: ";
		var CRLF = "\r\n";
		var MessageWriter;
		(function(MessageWriter) {
			function is(value) {
				let candidate = value;
				return candidate && Is.func(candidate.dispose) && Is.func(candidate.onClose) && Is.func(candidate.onError) && Is.func(candidate.write);
			}
			MessageWriter.is = is;
		})(MessageWriter || (exports.MessageWriter = MessageWriter = {}));
		var AbstractMessageWriter = class {
			constructor() {
				this.errorEmitter = new events_1.Emitter();
				this.closeEmitter = new events_1.Emitter();
			}
			dispose() {
				this.errorEmitter.dispose();
				this.closeEmitter.dispose();
			}
			get onError() {
				return this.errorEmitter.event;
			}
			fireError(error, message, count) {
				this.errorEmitter.fire([
					this.asError(error),
					message,
					count
				]);
			}
			get onClose() {
				return this.closeEmitter.event;
			}
			fireClose() {
				this.closeEmitter.fire(void 0);
			}
			asError(error) {
				if (error instanceof Error) return error;
				else return /* @__PURE__ */ new Error(`Writer received error. Reason: ${Is.string(error.message) ? error.message : "unknown"}`);
			}
		};
		exports.AbstractMessageWriter = AbstractMessageWriter;
		var ResolvedMessageWriterOptions;
		(function(ResolvedMessageWriterOptions) {
			function fromOptions(options) {
				if (options === void 0 || typeof options === "string") return {
					charset: options ?? "utf-8",
					contentTypeEncoder: (0, ral_1.default)().applicationJson.encoder
				};
				else return {
					charset: options.charset ?? "utf-8",
					contentEncoder: options.contentEncoder,
					contentTypeEncoder: options.contentTypeEncoder ?? (0, ral_1.default)().applicationJson.encoder
				};
			}
			ResolvedMessageWriterOptions.fromOptions = fromOptions;
		})(ResolvedMessageWriterOptions || (ResolvedMessageWriterOptions = {}));
		var WriteableStreamMessageWriter = class extends AbstractMessageWriter {
			constructor(writable, options) {
				super();
				this.writable = writable;
				this.options = ResolvedMessageWriterOptions.fromOptions(options);
				this.errorCount = 0;
				this.writeSemaphore = new semaphore_1.Semaphore(1);
				this.writable.onError((error) => this.fireError(error));
				this.writable.onClose(() => this.fireClose());
			}
			async write(msg) {
				return this.writeSemaphore.lock(async () => {
					return this.options.contentTypeEncoder.encode(msg, this.options).then((buffer) => {
						if (this.options.contentEncoder !== void 0) return this.options.contentEncoder.encode(buffer);
						else return buffer;
					}).then((buffer) => {
						const headers = [];
						headers.push(ContentLength, buffer.byteLength.toString(), CRLF);
						headers.push(CRLF);
						return this.doWrite(msg, headers, buffer);
					}, (error) => {
						this.fireError(error);
						throw error;
					});
				});
			}
			async doWrite(msg, headers, data) {
				try {
					await this.writable.write(headers.join(""), "ascii");
					return this.writable.write(data);
				} catch (error) {
					this.handleError(error, msg);
					return Promise.reject(error);
				}
			}
			handleError(error, msg) {
				this.errorCount++;
				this.fireError(error, msg, this.errorCount);
			}
			end() {
				this.writable.end();
			}
		};
		exports.WriteableStreamMessageWriter = WriteableStreamMessageWriter;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/messageBuffer.js
	var require_messageBuffer = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.AbstractMessageBuffer = void 0;
		var CR = 13;
		var LF = 10;
		var CRLF = "\r\n";
		var AbstractMessageBuffer = class {
			constructor(encoding = "utf-8") {
				this._encoding = encoding;
				this._chunks = [];
				this._totalLength = 0;
			}
			get encoding() {
				return this._encoding;
			}
			append(chunk) {
				const toAppend = typeof chunk === "string" ? this.fromString(chunk, this._encoding) : chunk;
				this._chunks.push(toAppend);
				this._totalLength += toAppend.byteLength;
			}
			tryReadHeaders(lowerCaseKeys = false) {
				if (this._chunks.length === 0) return;
				let state = 0;
				let chunkIndex = 0;
				let offset = 0;
				let chunkBytesRead = 0;
				row: while (chunkIndex < this._chunks.length) {
					const chunk = this._chunks[chunkIndex];
					offset = 0;
					column: while (offset < chunk.length) {
						switch (chunk[offset]) {
							case CR:
								switch (state) {
									case 0:
										state = 1;
										break;
									case 2:
										state = 3;
										break;
									default: state = 0;
								}
								break;
							case LF:
								switch (state) {
									case 1:
										state = 2;
										break;
									case 3:
										state = 4;
										offset++;
										break row;
									default: state = 0;
								}
								break;
							default: state = 0;
						}
						offset++;
					}
					chunkBytesRead += chunk.byteLength;
					chunkIndex++;
				}
				if (state !== 4) return;
				const buffer = this._read(chunkBytesRead + offset);
				const result = /* @__PURE__ */ new Map();
				const headers = this.toString(buffer, "ascii").split(CRLF);
				if (headers.length < 2) return result;
				for (let i = 0; i < headers.length - 2; i++) {
					const header = headers[i];
					const index = header.indexOf(":");
					if (index === -1) throw new Error(`Message header must separate key and value using ':'\n${header}`);
					const key = header.substr(0, index);
					const value = header.substr(index + 1).trim();
					result.set(lowerCaseKeys ? key.toLowerCase() : key, value);
				}
				return result;
			}
			tryReadBody(length) {
				if (this._totalLength < length) return;
				return this._read(length);
			}
			get numberOfBytes() {
				return this._totalLength;
			}
			_read(byteCount) {
				if (byteCount === 0) return this.emptyBuffer();
				if (byteCount > this._totalLength) throw new Error(`Cannot read so many bytes!`);
				if (this._chunks[0].byteLength === byteCount) {
					const chunk = this._chunks[0];
					this._chunks.shift();
					this._totalLength -= byteCount;
					return this.asNative(chunk);
				}
				if (this._chunks[0].byteLength > byteCount) {
					const chunk = this._chunks[0];
					const result = this.asNative(chunk, byteCount);
					this._chunks[0] = chunk.slice(byteCount);
					this._totalLength -= byteCount;
					return result;
				}
				const result = this.allocNative(byteCount);
				let resultOffset = 0;
				let chunkIndex = 0;
				while (byteCount > 0) {
					const chunk = this._chunks[chunkIndex];
					if (chunk.byteLength > byteCount) {
						const chunkPart = chunk.slice(0, byteCount);
						result.set(chunkPart, resultOffset);
						resultOffset += byteCount;
						this._chunks[chunkIndex] = chunk.slice(byteCount);
						this._totalLength -= byteCount;
						byteCount -= byteCount;
					} else {
						result.set(chunk, resultOffset);
						resultOffset += chunk.byteLength;
						this._chunks.shift();
						this._totalLength -= chunk.byteLength;
						byteCount -= chunk.byteLength;
					}
				}
				return result;
			}
		};
		exports.AbstractMessageBuffer = AbstractMessageBuffer;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/connection.js
	var require_connection$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.createMessageConnection = exports.ConnectionOptions = exports.MessageStrategy = exports.CancellationStrategy = exports.CancellationSenderStrategy = exports.CancellationReceiverStrategy = exports.RequestCancellationReceiverStrategy = exports.IdCancellationReceiverStrategy = exports.ConnectionStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.TraceValues = exports.Trace = exports.NullLogger = exports.ProgressType = exports.ProgressToken = void 0;
		var ral_1 = require_ral();
		var Is = require_is$1();
		var messages_1 = require_messages$1();
		var linkedMap_1 = require_linkedMap();
		var events_1 = require_events();
		var cancellation_1 = require_cancellation();
		var CancelNotification;
		(function(CancelNotification) {
			CancelNotification.type = new messages_1.NotificationType("$/cancelRequest");
		})(CancelNotification || (CancelNotification = {}));
		var ProgressToken;
		(function(ProgressToken) {
			function is(value) {
				return typeof value === "string" || typeof value === "number";
			}
			ProgressToken.is = is;
		})(ProgressToken || (exports.ProgressToken = ProgressToken = {}));
		var ProgressNotification;
		(function(ProgressNotification) {
			ProgressNotification.type = new messages_1.NotificationType("$/progress");
		})(ProgressNotification || (ProgressNotification = {}));
		var ProgressType = class {
			constructor() {}
		};
		exports.ProgressType = ProgressType;
		var StarRequestHandler;
		(function(StarRequestHandler) {
			function is(value) {
				return Is.func(value);
			}
			StarRequestHandler.is = is;
		})(StarRequestHandler || (StarRequestHandler = {}));
		exports.NullLogger = Object.freeze({
			error: () => {},
			warn: () => {},
			info: () => {},
			log: () => {}
		});
		var Trace;
		(function(Trace) {
			Trace[Trace["Off"] = 0] = "Off";
			Trace[Trace["Messages"] = 1] = "Messages";
			Trace[Trace["Compact"] = 2] = "Compact";
			Trace[Trace["Verbose"] = 3] = "Verbose";
		})(Trace || (exports.Trace = Trace = {}));
		var TraceValues;
		(function(TraceValues) {
			/**
			* Turn tracing off.
			*/
			TraceValues.Off = "off";
			/**
			* Trace messages only.
			*/
			TraceValues.Messages = "messages";
			/**
			* Compact message tracing.
			*/
			TraceValues.Compact = "compact";
			/**
			* Verbose message tracing.
			*/
			TraceValues.Verbose = "verbose";
		})(TraceValues || (exports.TraceValues = TraceValues = {}));
		(function(Trace) {
			function fromString(value) {
				if (!Is.string(value)) return Trace.Off;
				value = value.toLowerCase();
				switch (value) {
					case "off": return Trace.Off;
					case "messages": return Trace.Messages;
					case "compact": return Trace.Compact;
					case "verbose": return Trace.Verbose;
					default: return Trace.Off;
				}
			}
			Trace.fromString = fromString;
			function toString(value) {
				switch (value) {
					case Trace.Off: return "off";
					case Trace.Messages: return "messages";
					case Trace.Compact: return "compact";
					case Trace.Verbose: return "verbose";
					default: return "off";
				}
			}
			Trace.toString = toString;
		})(Trace || (exports.Trace = Trace = {}));
		var TraceFormat;
		(function(TraceFormat) {
			TraceFormat["Text"] = "text";
			TraceFormat["JSON"] = "json";
		})(TraceFormat || (exports.TraceFormat = TraceFormat = {}));
		(function(TraceFormat) {
			function fromString(value) {
				if (!Is.string(value)) return TraceFormat.Text;
				value = value.toLowerCase();
				if (value === "json") return TraceFormat.JSON;
				else return TraceFormat.Text;
			}
			TraceFormat.fromString = fromString;
		})(TraceFormat || (exports.TraceFormat = TraceFormat = {}));
		var SetTraceNotification;
		(function(SetTraceNotification) {
			SetTraceNotification.type = new messages_1.NotificationType("$/setTrace");
		})(SetTraceNotification || (exports.SetTraceNotification = SetTraceNotification = {}));
		var LogTraceNotification;
		(function(LogTraceNotification) {
			LogTraceNotification.type = new messages_1.NotificationType("$/logTrace");
		})(LogTraceNotification || (exports.LogTraceNotification = LogTraceNotification = {}));
		var ConnectionErrors;
		(function(ConnectionErrors) {
			/**
			* The connection is closed.
			*/
			ConnectionErrors[ConnectionErrors["Closed"] = 1] = "Closed";
			/**
			* The connection got disposed.
			*/
			ConnectionErrors[ConnectionErrors["Disposed"] = 2] = "Disposed";
			/**
			* The connection is already in listening mode.
			*/
			ConnectionErrors[ConnectionErrors["AlreadyListening"] = 3] = "AlreadyListening";
		})(ConnectionErrors || (exports.ConnectionErrors = ConnectionErrors = {}));
		var ConnectionError = class ConnectionError extends Error {
			constructor(code, message) {
				super(message);
				this.code = code;
				Object.setPrototypeOf(this, ConnectionError.prototype);
			}
		};
		exports.ConnectionError = ConnectionError;
		var ConnectionStrategy;
		(function(ConnectionStrategy) {
			function is(value) {
				const candidate = value;
				return candidate && Is.func(candidate.cancelUndispatched);
			}
			ConnectionStrategy.is = is;
		})(ConnectionStrategy || (exports.ConnectionStrategy = ConnectionStrategy = {}));
		var IdCancellationReceiverStrategy;
		(function(IdCancellationReceiverStrategy) {
			function is(value) {
				const candidate = value;
				return candidate && (candidate.kind === void 0 || candidate.kind === "id") && Is.func(candidate.createCancellationTokenSource) && (candidate.dispose === void 0 || Is.func(candidate.dispose));
			}
			IdCancellationReceiverStrategy.is = is;
		})(IdCancellationReceiverStrategy || (exports.IdCancellationReceiverStrategy = IdCancellationReceiverStrategy = {}));
		var RequestCancellationReceiverStrategy;
		(function(RequestCancellationReceiverStrategy) {
			function is(value) {
				const candidate = value;
				return candidate && candidate.kind === "request" && Is.func(candidate.createCancellationTokenSource) && (candidate.dispose === void 0 || Is.func(candidate.dispose));
			}
			RequestCancellationReceiverStrategy.is = is;
		})(RequestCancellationReceiverStrategy || (exports.RequestCancellationReceiverStrategy = RequestCancellationReceiverStrategy = {}));
		var CancellationReceiverStrategy;
		(function(CancellationReceiverStrategy) {
			CancellationReceiverStrategy.Message = Object.freeze({ createCancellationTokenSource(_) {
				return new cancellation_1.CancellationTokenSource();
			} });
			function is(value) {
				return IdCancellationReceiverStrategy.is(value) || RequestCancellationReceiverStrategy.is(value);
			}
			CancellationReceiverStrategy.is = is;
		})(CancellationReceiverStrategy || (exports.CancellationReceiverStrategy = CancellationReceiverStrategy = {}));
		var CancellationSenderStrategy;
		(function(CancellationSenderStrategy) {
			CancellationSenderStrategy.Message = Object.freeze({
				sendCancellation(conn, id) {
					return conn.sendNotification(CancelNotification.type, { id });
				},
				cleanup(_) {}
			});
			function is(value) {
				const candidate = value;
				return candidate && Is.func(candidate.sendCancellation) && Is.func(candidate.cleanup);
			}
			CancellationSenderStrategy.is = is;
		})(CancellationSenderStrategy || (exports.CancellationSenderStrategy = CancellationSenderStrategy = {}));
		var CancellationStrategy;
		(function(CancellationStrategy) {
			CancellationStrategy.Message = Object.freeze({
				receiver: CancellationReceiverStrategy.Message,
				sender: CancellationSenderStrategy.Message
			});
			function is(value) {
				const candidate = value;
				return candidate && CancellationReceiverStrategy.is(candidate.receiver) && CancellationSenderStrategy.is(candidate.sender);
			}
			CancellationStrategy.is = is;
		})(CancellationStrategy || (exports.CancellationStrategy = CancellationStrategy = {}));
		var MessageStrategy;
		(function(MessageStrategy) {
			function is(value) {
				const candidate = value;
				return candidate && Is.func(candidate.handleMessage);
			}
			MessageStrategy.is = is;
		})(MessageStrategy || (exports.MessageStrategy = MessageStrategy = {}));
		var ConnectionOptions;
		(function(ConnectionOptions) {
			function is(value) {
				const candidate = value;
				return candidate && (CancellationStrategy.is(candidate.cancellationStrategy) || ConnectionStrategy.is(candidate.connectionStrategy) || MessageStrategy.is(candidate.messageStrategy));
			}
			ConnectionOptions.is = is;
		})(ConnectionOptions || (exports.ConnectionOptions = ConnectionOptions = {}));
		var ConnectionState;
		(function(ConnectionState) {
			ConnectionState[ConnectionState["New"] = 1] = "New";
			ConnectionState[ConnectionState["Listening"] = 2] = "Listening";
			ConnectionState[ConnectionState["Closed"] = 3] = "Closed";
			ConnectionState[ConnectionState["Disposed"] = 4] = "Disposed";
		})(ConnectionState || (ConnectionState = {}));
		function createMessageConnection(messageReader, messageWriter, _logger, options) {
			const logger = _logger !== void 0 ? _logger : exports.NullLogger;
			let sequenceNumber = 0;
			let notificationSequenceNumber = 0;
			let unknownResponseSequenceNumber = 0;
			const version = "2.0";
			let starRequestHandler = void 0;
			const requestHandlers = /* @__PURE__ */ new Map();
			let starNotificationHandler = void 0;
			const notificationHandlers = /* @__PURE__ */ new Map();
			const progressHandlers = /* @__PURE__ */ new Map();
			let timer;
			let messageQueue = new linkedMap_1.LinkedMap();
			let responsePromises = /* @__PURE__ */ new Map();
			let knownCanceledRequests = /* @__PURE__ */ new Set();
			let requestTokens = /* @__PURE__ */ new Map();
			let trace = Trace.Off;
			let traceFormat = TraceFormat.Text;
			let tracer;
			let state = ConnectionState.New;
			const errorEmitter = new events_1.Emitter();
			const closeEmitter = new events_1.Emitter();
			const unhandledNotificationEmitter = new events_1.Emitter();
			const unhandledProgressEmitter = new events_1.Emitter();
			const disposeEmitter = new events_1.Emitter();
			const cancellationStrategy = options && options.cancellationStrategy ? options.cancellationStrategy : CancellationStrategy.Message;
			function createRequestQueueKey(id) {
				if (id === null) throw new Error(`Can't send requests with id null since the response can't be correlated.`);
				return "req-" + id.toString();
			}
			function createResponseQueueKey(id) {
				if (id === null) return "res-unknown-" + (++unknownResponseSequenceNumber).toString();
				else return "res-" + id.toString();
			}
			function createNotificationQueueKey() {
				return "not-" + (++notificationSequenceNumber).toString();
			}
			function addMessageToQueue(queue, message) {
				if (messages_1.Message.isRequest(message)) queue.set(createRequestQueueKey(message.id), message);
				else if (messages_1.Message.isResponse(message)) queue.set(createResponseQueueKey(message.id), message);
				else queue.set(createNotificationQueueKey(), message);
			}
			function cancelUndispatched(_message) {}
			function isListening() {
				return state === ConnectionState.Listening;
			}
			function isClosed() {
				return state === ConnectionState.Closed;
			}
			function isDisposed() {
				return state === ConnectionState.Disposed;
			}
			function closeHandler() {
				if (state === ConnectionState.New || state === ConnectionState.Listening) {
					state = ConnectionState.Closed;
					closeEmitter.fire(void 0);
				}
			}
			function readErrorHandler(error) {
				errorEmitter.fire([
					error,
					void 0,
					void 0
				]);
			}
			function writeErrorHandler(data) {
				errorEmitter.fire(data);
			}
			messageReader.onClose(closeHandler);
			messageReader.onError(readErrorHandler);
			messageWriter.onClose(closeHandler);
			messageWriter.onError(writeErrorHandler);
			function triggerMessageQueue() {
				if (timer || messageQueue.size === 0) return;
				timer = (0, ral_1.default)().timer.setImmediate(() => {
					timer = void 0;
					processMessageQueue();
				});
			}
			function handleMessage(message) {
				if (messages_1.Message.isRequest(message)) handleRequest(message);
				else if (messages_1.Message.isNotification(message)) handleNotification(message);
				else if (messages_1.Message.isResponse(message)) handleResponse(message);
				else handleInvalidMessage(message);
			}
			function processMessageQueue() {
				if (messageQueue.size === 0) return;
				const message = messageQueue.shift();
				try {
					const messageStrategy = options?.messageStrategy;
					if (MessageStrategy.is(messageStrategy)) messageStrategy.handleMessage(message, handleMessage);
					else handleMessage(message);
				} finally {
					triggerMessageQueue();
				}
			}
			const callback = (message) => {
				try {
					if (messages_1.Message.isNotification(message) && message.method === CancelNotification.type.method) {
						const cancelId = message.params.id;
						const key = createRequestQueueKey(cancelId);
						const toCancel = messageQueue.get(key);
						if (messages_1.Message.isRequest(toCancel)) {
							const strategy = options?.connectionStrategy;
							const response = strategy && strategy.cancelUndispatched ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : void 0;
							if (response && (response.error !== void 0 || response.result !== void 0)) {
								messageQueue.delete(key);
								requestTokens.delete(cancelId);
								response.id = toCancel.id;
								traceSendingResponse(response, message.method, Date.now());
								messageWriter.write(response).catch(() => logger.error(`Sending response for canceled message failed.`));
								return;
							}
						}
						const cancellationToken = requestTokens.get(cancelId);
						if (cancellationToken !== void 0) {
							cancellationToken.cancel();
							traceReceivedNotification(message);
							return;
						} else knownCanceledRequests.add(cancelId);
					}
					addMessageToQueue(messageQueue, message);
				} finally {
					triggerMessageQueue();
				}
			};
			function handleRequest(requestMessage) {
				if (isDisposed()) return;
				function reply(resultOrError, method, startTime) {
					const message = {
						jsonrpc: version,
						id: requestMessage.id
					};
					if (resultOrError instanceof messages_1.ResponseError) message.error = resultOrError.toJson();
					else message.result = resultOrError === void 0 ? null : resultOrError;
					traceSendingResponse(message, method, startTime);
					messageWriter.write(message).catch(() => logger.error(`Sending response failed.`));
				}
				function replyError(error, method, startTime) {
					const message = {
						jsonrpc: version,
						id: requestMessage.id,
						error: error.toJson()
					};
					traceSendingResponse(message, method, startTime);
					messageWriter.write(message).catch(() => logger.error(`Sending response failed.`));
				}
				function replySuccess(result, method, startTime) {
					if (result === void 0) result = null;
					const message = {
						jsonrpc: version,
						id: requestMessage.id,
						result
					};
					traceSendingResponse(message, method, startTime);
					messageWriter.write(message).catch(() => logger.error(`Sending response failed.`));
				}
				traceReceivedRequest(requestMessage);
				const element = requestHandlers.get(requestMessage.method);
				let type;
				let requestHandler;
				if (element) {
					type = element.type;
					requestHandler = element.handler;
				}
				const startTime = Date.now();
				if (requestHandler || starRequestHandler) {
					const tokenKey = requestMessage.id ?? String(Date.now());
					const cancellationSource = IdCancellationReceiverStrategy.is(cancellationStrategy.receiver) ? cancellationStrategy.receiver.createCancellationTokenSource(tokenKey) : cancellationStrategy.receiver.createCancellationTokenSource(requestMessage);
					if (requestMessage.id !== null && knownCanceledRequests.has(requestMessage.id)) cancellationSource.cancel();
					if (requestMessage.id !== null) requestTokens.set(tokenKey, cancellationSource);
					try {
						let handlerResult;
						if (requestHandler) if (requestMessage.params === void 0) {
							if (type !== void 0 && type.numberOfParams !== 0) {
								replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines ${type.numberOfParams} params but received none.`), requestMessage.method, startTime);
								return;
							}
							handlerResult = requestHandler(cancellationSource.token);
						} else if (Array.isArray(requestMessage.params)) {
							if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byName) {
								replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by name but received parameters by position`), requestMessage.method, startTime);
								return;
							}
							handlerResult = requestHandler(...requestMessage.params, cancellationSource.token);
						} else {
							if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
								replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by position but received parameters by name`), requestMessage.method, startTime);
								return;
							}
							handlerResult = requestHandler(requestMessage.params, cancellationSource.token);
						}
						else if (starRequestHandler) handlerResult = starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
						const promise = handlerResult;
						if (!handlerResult) {
							requestTokens.delete(tokenKey);
							replySuccess(handlerResult, requestMessage.method, startTime);
						} else if (promise.then) promise.then((resultOrError) => {
							requestTokens.delete(tokenKey);
							reply(resultOrError, requestMessage.method, startTime);
						}, (error) => {
							requestTokens.delete(tokenKey);
							if (error instanceof messages_1.ResponseError) replyError(error, requestMessage.method, startTime);
							else if (error && Is.string(error.message)) replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
							else replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
						});
						else {
							requestTokens.delete(tokenKey);
							reply(handlerResult, requestMessage.method, startTime);
						}
					} catch (error) {
						requestTokens.delete(tokenKey);
						if (error instanceof messages_1.ResponseError) reply(error, requestMessage.method, startTime);
						else if (error && Is.string(error.message)) replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
						else replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
					}
				} else replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, `Unhandled method ${requestMessage.method}`), requestMessage.method, startTime);
			}
			function handleResponse(responseMessage) {
				if (isDisposed()) return;
				if (responseMessage.id === null) if (responseMessage.error) logger.error(`Received response message without id: Error is: \n${JSON.stringify(responseMessage.error, void 0, 4)}`);
				else logger.error(`Received response message without id. No further error information provided.`);
				else {
					const key = responseMessage.id;
					const responsePromise = responsePromises.get(key);
					traceReceivedResponse(responseMessage, responsePromise);
					if (responsePromise !== void 0) {
						responsePromises.delete(key);
						try {
							if (responseMessage.error) {
								const error = responseMessage.error;
								responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
							} else if (responseMessage.result !== void 0) responsePromise.resolve(responseMessage.result);
							else throw new Error("Should never happen.");
						} catch (error) {
							if (error.message) logger.error(`Response handler '${responsePromise.method}' failed with message: ${error.message}`);
							else logger.error(`Response handler '${responsePromise.method}' failed unexpectedly.`);
						}
					}
				}
			}
			function handleNotification(message) {
				if (isDisposed()) return;
				let type = void 0;
				let notificationHandler;
				if (message.method === CancelNotification.type.method) {
					const cancelId = message.params.id;
					knownCanceledRequests.delete(cancelId);
					traceReceivedNotification(message);
					return;
				} else {
					const element = notificationHandlers.get(message.method);
					if (element) {
						notificationHandler = element.handler;
						type = element.type;
					}
				}
				if (notificationHandler || starNotificationHandler) try {
					traceReceivedNotification(message);
					if (notificationHandler) if (message.params === void 0) {
						if (type !== void 0) {
							if (type.numberOfParams !== 0 && type.parameterStructures !== messages_1.ParameterStructures.byName) logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received none.`);
						}
						notificationHandler();
					} else if (Array.isArray(message.params)) {
						const params = message.params;
						if (message.method === ProgressNotification.type.method && params.length === 2 && ProgressToken.is(params[0])) notificationHandler({
							token: params[0],
							value: params[1]
						});
						else {
							if (type !== void 0) {
								if (type.parameterStructures === messages_1.ParameterStructures.byName) logger.error(`Notification ${message.method} defines parameters by name but received parameters by position`);
								if (type.numberOfParams !== message.params.length) logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received ${params.length} arguments`);
							}
							notificationHandler(...params);
						}
					} else {
						if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) logger.error(`Notification ${message.method} defines parameters by position but received parameters by name`);
						notificationHandler(message.params);
					}
					else if (starNotificationHandler) starNotificationHandler(message.method, message.params);
				} catch (error) {
					if (error.message) logger.error(`Notification handler '${message.method}' failed with message: ${error.message}`);
					else logger.error(`Notification handler '${message.method}' failed unexpectedly.`);
				}
				else unhandledNotificationEmitter.fire(message);
			}
			function handleInvalidMessage(message) {
				if (!message) {
					logger.error("Received empty message.");
					return;
				}
				logger.error(`Received message which is neither a response nor a notification message:\n${JSON.stringify(message, null, 4)}`);
				const responseMessage = message;
				if (Is.string(responseMessage.id) || Is.number(responseMessage.id)) {
					const key = responseMessage.id;
					const responseHandler = responsePromises.get(key);
					if (responseHandler) responseHandler.reject(/* @__PURE__ */ new Error("The received response has neither a result nor an error property."));
				}
			}
			function stringifyTrace(params) {
				if (params === void 0 || params === null) return;
				switch (trace) {
					case Trace.Verbose: return JSON.stringify(params, null, 4);
					case Trace.Compact: return JSON.stringify(params);
					default: return;
				}
			}
			function traceSendingRequest(message) {
				if (trace === Trace.Off || !tracer) return;
				if (traceFormat === TraceFormat.Text) {
					let data = void 0;
					if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) data = `Params: ${stringifyTrace(message.params)}\n\n`;
					tracer.log(`Sending request '${message.method} - (${message.id})'.`, data);
				} else logLSPMessage("send-request", message);
			}
			function traceSendingNotification(message) {
				if (trace === Trace.Off || !tracer) return;
				if (traceFormat === TraceFormat.Text) {
					let data = void 0;
					if (trace === Trace.Verbose || trace === Trace.Compact) if (message.params) data = `Params: ${stringifyTrace(message.params)}\n\n`;
					else data = "No parameters provided.\n\n";
					tracer.log(`Sending notification '${message.method}'.`, data);
				} else logLSPMessage("send-notification", message);
			}
			function traceSendingResponse(message, method, startTime) {
				if (trace === Trace.Off || !tracer) return;
				if (traceFormat === TraceFormat.Text) {
					let data = void 0;
					if (trace === Trace.Verbose || trace === Trace.Compact) {
						if (message.error && message.error.data) data = `Error data: ${stringifyTrace(message.error.data)}\n\n`;
						else if (message.result) data = `Result: ${stringifyTrace(message.result)}\n\n`;
						else if (message.error === void 0) data = "No result returned.\n\n";
					}
					tracer.log(`Sending response '${method} - (${message.id})'. Processing request took ${Date.now() - startTime}ms`, data);
				} else logLSPMessage("send-response", message);
			}
			function traceReceivedRequest(message) {
				if (trace === Trace.Off || !tracer) return;
				if (traceFormat === TraceFormat.Text) {
					let data = void 0;
					if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) data = `Params: ${stringifyTrace(message.params)}\n\n`;
					tracer.log(`Received request '${message.method} - (${message.id})'.`, data);
				} else logLSPMessage("receive-request", message);
			}
			function traceReceivedNotification(message) {
				if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) return;
				if (traceFormat === TraceFormat.Text) {
					let data = void 0;
					if (trace === Trace.Verbose || trace === Trace.Compact) if (message.params) data = `Params: ${stringifyTrace(message.params)}\n\n`;
					else data = "No parameters provided.\n\n";
					tracer.log(`Received notification '${message.method}'.`, data);
				} else logLSPMessage("receive-notification", message);
			}
			function traceReceivedResponse(message, responsePromise) {
				if (trace === Trace.Off || !tracer) return;
				if (traceFormat === TraceFormat.Text) {
					let data = void 0;
					if (trace === Trace.Verbose || trace === Trace.Compact) {
						if (message.error && message.error.data) data = `Error data: ${stringifyTrace(message.error.data)}\n\n`;
						else if (message.result) data = `Result: ${stringifyTrace(message.result)}\n\n`;
						else if (message.error === void 0) data = "No result returned.\n\n";
					}
					if (responsePromise) {
						const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : "";
						tracer.log(`Received response '${responsePromise.method} - (${message.id})' in ${Date.now() - responsePromise.timerStart}ms.${error}`, data);
					} else tracer.log(`Received response ${message.id} without active response promise.`, data);
				} else logLSPMessage("receive-response", message);
			}
			function logLSPMessage(type, message) {
				if (!tracer || trace === Trace.Off) return;
				const lspMessage = {
					isLSPMessage: true,
					type,
					message,
					timestamp: Date.now()
				};
				tracer.log(lspMessage);
			}
			function throwIfClosedOrDisposed() {
				if (isClosed()) throw new ConnectionError(ConnectionErrors.Closed, "Connection is closed.");
				if (isDisposed()) throw new ConnectionError(ConnectionErrors.Disposed, "Connection is disposed.");
			}
			function throwIfListening() {
				if (isListening()) throw new ConnectionError(ConnectionErrors.AlreadyListening, "Connection is already listening");
			}
			function throwIfNotListening() {
				if (!isListening()) throw new Error("Call listen() first.");
			}
			function undefinedToNull(param) {
				if (param === void 0) return null;
				else return param;
			}
			function nullToUndefined(param) {
				if (param === null) return;
				else return param;
			}
			function isNamedParam(param) {
				return param !== void 0 && param !== null && !Array.isArray(param) && typeof param === "object";
			}
			function computeSingleParam(parameterStructures, param) {
				switch (parameterStructures) {
					case messages_1.ParameterStructures.auto: if (isNamedParam(param)) return nullToUndefined(param);
					else return [undefinedToNull(param)];
					case messages_1.ParameterStructures.byName:
						if (!isNamedParam(param)) throw new Error(`Received parameters by name but param is not an object literal.`);
						return nullToUndefined(param);
					case messages_1.ParameterStructures.byPosition: return [undefinedToNull(param)];
					default: throw new Error(`Unknown parameter structure ${parameterStructures.toString()}`);
				}
			}
			function computeMessageParams(type, params) {
				let result;
				const numberOfParams = type.numberOfParams;
				switch (numberOfParams) {
					case 0:
						result = void 0;
						break;
					case 1:
						result = computeSingleParam(type.parameterStructures, params[0]);
						break;
					default:
						result = [];
						for (let i = 0; i < params.length && i < numberOfParams; i++) result.push(undefinedToNull(params[i]));
						if (params.length < numberOfParams) for (let i = params.length; i < numberOfParams; i++) result.push(null);
						break;
				}
				return result;
			}
			const connection = {
				sendNotification: (type, ...args) => {
					throwIfClosedOrDisposed();
					let method;
					let messageParams;
					if (Is.string(type)) {
						method = type;
						const first = args[0];
						let paramStart = 0;
						let parameterStructures = messages_1.ParameterStructures.auto;
						if (messages_1.ParameterStructures.is(first)) {
							paramStart = 1;
							parameterStructures = first;
						}
						let paramEnd = args.length;
						const numberOfParams = paramEnd - paramStart;
						switch (numberOfParams) {
							case 0:
								messageParams = void 0;
								break;
							case 1:
								messageParams = computeSingleParam(parameterStructures, args[paramStart]);
								break;
							default:
								if (parameterStructures === messages_1.ParameterStructures.byName) throw new Error(`Received ${numberOfParams} parameters for 'by Name' notification parameter structure.`);
								messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
								break;
						}
					} else {
						const params = args;
						method = type.method;
						messageParams = computeMessageParams(type, params);
					}
					const notificationMessage = {
						jsonrpc: version,
						method,
						params: messageParams
					};
					traceSendingNotification(notificationMessage);
					return messageWriter.write(notificationMessage).catch((error) => {
						logger.error(`Sending notification failed.`);
						throw error;
					});
				},
				onNotification: (type, handler) => {
					throwIfClosedOrDisposed();
					let method;
					if (Is.func(type)) starNotificationHandler = type;
					else if (handler) if (Is.string(type)) {
						method = type;
						notificationHandlers.set(type, {
							type: void 0,
							handler
						});
					} else {
						method = type.method;
						notificationHandlers.set(type.method, {
							type,
							handler
						});
					}
					return { dispose: () => {
						if (method !== void 0) notificationHandlers.delete(method);
						else starNotificationHandler = void 0;
					} };
				},
				onProgress: (_type, token, handler) => {
					if (progressHandlers.has(token)) throw new Error(`Progress handler for token ${token} already registered`);
					progressHandlers.set(token, handler);
					return { dispose: () => {
						progressHandlers.delete(token);
					} };
				},
				sendProgress: (_type, token, value) => {
					return connection.sendNotification(ProgressNotification.type, {
						token,
						value
					});
				},
				onUnhandledProgress: unhandledProgressEmitter.event,
				sendRequest: (type, ...args) => {
					throwIfClosedOrDisposed();
					throwIfNotListening();
					let method;
					let messageParams;
					let token = void 0;
					if (Is.string(type)) {
						method = type;
						const first = args[0];
						const last = args[args.length - 1];
						let paramStart = 0;
						let parameterStructures = messages_1.ParameterStructures.auto;
						if (messages_1.ParameterStructures.is(first)) {
							paramStart = 1;
							parameterStructures = first;
						}
						let paramEnd = args.length;
						if (cancellation_1.CancellationToken.is(last)) {
							paramEnd = paramEnd - 1;
							token = last;
						}
						const numberOfParams = paramEnd - paramStart;
						switch (numberOfParams) {
							case 0:
								messageParams = void 0;
								break;
							case 1:
								messageParams = computeSingleParam(parameterStructures, args[paramStart]);
								break;
							default:
								if (parameterStructures === messages_1.ParameterStructures.byName) throw new Error(`Received ${numberOfParams} parameters for 'by Name' request parameter structure.`);
								messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
								break;
						}
					} else {
						const params = args;
						method = type.method;
						messageParams = computeMessageParams(type, params);
						const numberOfParams = type.numberOfParams;
						token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : void 0;
					}
					const id = sequenceNumber++;
					let disposable;
					if (token) disposable = token.onCancellationRequested(() => {
						const p = cancellationStrategy.sender.sendCancellation(connection, id);
						if (p === void 0) {
							logger.log(`Received no promise from cancellation strategy when cancelling id ${id}`);
							return Promise.resolve();
						} else return p.catch(() => {
							logger.log(`Sending cancellation messages for id ${id} failed`);
						});
					});
					const requestMessage = {
						jsonrpc: version,
						id,
						method,
						params: messageParams
					};
					traceSendingRequest(requestMessage);
					if (typeof cancellationStrategy.sender.enableCancellation === "function") cancellationStrategy.sender.enableCancellation(requestMessage);
					return new Promise(async (resolve, reject) => {
						const resolveWithCleanup = (r) => {
							resolve(r);
							cancellationStrategy.sender.cleanup(id);
							disposable?.dispose();
						};
						const rejectWithCleanup = (r) => {
							reject(r);
							cancellationStrategy.sender.cleanup(id);
							disposable?.dispose();
						};
						const responsePromise = {
							method,
							timerStart: Date.now(),
							resolve: resolveWithCleanup,
							reject: rejectWithCleanup
						};
						try {
							await messageWriter.write(requestMessage);
							responsePromises.set(id, responsePromise);
						} catch (error) {
							logger.error(`Sending request failed.`);
							responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, error.message ? error.message : "Unknown reason"));
							throw error;
						}
					});
				},
				onRequest: (type, handler) => {
					throwIfClosedOrDisposed();
					let method = null;
					if (StarRequestHandler.is(type)) {
						method = void 0;
						starRequestHandler = type;
					} else if (Is.string(type)) {
						method = null;
						if (handler !== void 0) {
							method = type;
							requestHandlers.set(type, {
								handler,
								type: void 0
							});
						}
					} else if (handler !== void 0) {
						method = type.method;
						requestHandlers.set(type.method, {
							type,
							handler
						});
					}
					return { dispose: () => {
						if (method === null) return;
						if (method !== void 0) requestHandlers.delete(method);
						else starRequestHandler = void 0;
					} };
				},
				hasPendingResponse: () => {
					return responsePromises.size > 0;
				},
				trace: async (_value, _tracer, sendNotificationOrTraceOptions) => {
					let _sendNotification = false;
					let _traceFormat = TraceFormat.Text;
					if (sendNotificationOrTraceOptions !== void 0) if (Is.boolean(sendNotificationOrTraceOptions)) _sendNotification = sendNotificationOrTraceOptions;
					else {
						_sendNotification = sendNotificationOrTraceOptions.sendNotification || false;
						_traceFormat = sendNotificationOrTraceOptions.traceFormat || TraceFormat.Text;
					}
					trace = _value;
					traceFormat = _traceFormat;
					if (trace === Trace.Off) tracer = void 0;
					else tracer = _tracer;
					if (_sendNotification && !isClosed() && !isDisposed()) await connection.sendNotification(SetTraceNotification.type, { value: Trace.toString(_value) });
				},
				onError: errorEmitter.event,
				onClose: closeEmitter.event,
				onUnhandledNotification: unhandledNotificationEmitter.event,
				onDispose: disposeEmitter.event,
				end: () => {
					messageWriter.end();
				},
				dispose: () => {
					if (isDisposed()) return;
					state = ConnectionState.Disposed;
					disposeEmitter.fire(void 0);
					const error = new messages_1.ResponseError(messages_1.ErrorCodes.PendingResponseRejected, "Pending response rejected since connection got disposed");
					for (const promise of responsePromises.values()) promise.reject(error);
					responsePromises = /* @__PURE__ */ new Map();
					requestTokens = /* @__PURE__ */ new Map();
					knownCanceledRequests = /* @__PURE__ */ new Set();
					messageQueue = new linkedMap_1.LinkedMap();
					if (Is.func(messageWriter.dispose)) messageWriter.dispose();
					if (Is.func(messageReader.dispose)) messageReader.dispose();
				},
				listen: () => {
					throwIfClosedOrDisposed();
					throwIfListening();
					state = ConnectionState.Listening;
					messageReader.listen(callback);
				},
				inspect: () => {
					(0, ral_1.default)().console.log("inspect");
				}
			};
			connection.onNotification(LogTraceNotification.type, (params) => {
				if (trace === Trace.Off || !tracer) return;
				const verbose = trace === Trace.Verbose || trace === Trace.Compact;
				tracer.log(params.message, verbose ? params.verbose : void 0);
			});
			connection.onNotification(ProgressNotification.type, (params) => {
				const handler = progressHandlers.get(params.token);
				if (handler) handler(params.value);
				else unhandledProgressEmitter.fire(params);
			});
			return connection;
		}
		exports.createMessageConnection = createMessageConnection;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/common/api.js
	var require_api$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ProgressType = exports.ProgressToken = exports.createMessageConnection = exports.NullLogger = exports.ConnectionOptions = exports.ConnectionStrategy = exports.AbstractMessageBuffer = exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = exports.SharedArrayReceiverStrategy = exports.SharedArraySenderStrategy = exports.CancellationToken = exports.CancellationTokenSource = exports.Emitter = exports.Event = exports.Disposable = exports.LRUCache = exports.Touch = exports.LinkedMap = exports.ParameterStructures = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.ErrorCodes = exports.ResponseError = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType0 = exports.RequestType = exports.Message = exports.RAL = void 0;
		exports.MessageStrategy = exports.CancellationStrategy = exports.CancellationSenderStrategy = exports.CancellationReceiverStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.TraceValues = exports.Trace = void 0;
		var messages_1 = require_messages$1();
		Object.defineProperty(exports, "Message", {
			enumerable: true,
			get: function() {
				return messages_1.Message;
			}
		});
		Object.defineProperty(exports, "RequestType", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType;
			}
		});
		Object.defineProperty(exports, "RequestType0", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType0;
			}
		});
		Object.defineProperty(exports, "RequestType1", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType1;
			}
		});
		Object.defineProperty(exports, "RequestType2", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType2;
			}
		});
		Object.defineProperty(exports, "RequestType3", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType3;
			}
		});
		Object.defineProperty(exports, "RequestType4", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType4;
			}
		});
		Object.defineProperty(exports, "RequestType5", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType5;
			}
		});
		Object.defineProperty(exports, "RequestType6", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType6;
			}
		});
		Object.defineProperty(exports, "RequestType7", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType7;
			}
		});
		Object.defineProperty(exports, "RequestType8", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType8;
			}
		});
		Object.defineProperty(exports, "RequestType9", {
			enumerable: true,
			get: function() {
				return messages_1.RequestType9;
			}
		});
		Object.defineProperty(exports, "ResponseError", {
			enumerable: true,
			get: function() {
				return messages_1.ResponseError;
			}
		});
		Object.defineProperty(exports, "ErrorCodes", {
			enumerable: true,
			get: function() {
				return messages_1.ErrorCodes;
			}
		});
		Object.defineProperty(exports, "NotificationType", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType;
			}
		});
		Object.defineProperty(exports, "NotificationType0", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType0;
			}
		});
		Object.defineProperty(exports, "NotificationType1", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType1;
			}
		});
		Object.defineProperty(exports, "NotificationType2", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType2;
			}
		});
		Object.defineProperty(exports, "NotificationType3", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType3;
			}
		});
		Object.defineProperty(exports, "NotificationType4", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType4;
			}
		});
		Object.defineProperty(exports, "NotificationType5", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType5;
			}
		});
		Object.defineProperty(exports, "NotificationType6", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType6;
			}
		});
		Object.defineProperty(exports, "NotificationType7", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType7;
			}
		});
		Object.defineProperty(exports, "NotificationType8", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType8;
			}
		});
		Object.defineProperty(exports, "NotificationType9", {
			enumerable: true,
			get: function() {
				return messages_1.NotificationType9;
			}
		});
		Object.defineProperty(exports, "ParameterStructures", {
			enumerable: true,
			get: function() {
				return messages_1.ParameterStructures;
			}
		});
		var linkedMap_1 = require_linkedMap();
		Object.defineProperty(exports, "LinkedMap", {
			enumerable: true,
			get: function() {
				return linkedMap_1.LinkedMap;
			}
		});
		Object.defineProperty(exports, "LRUCache", {
			enumerable: true,
			get: function() {
				return linkedMap_1.LRUCache;
			}
		});
		Object.defineProperty(exports, "Touch", {
			enumerable: true,
			get: function() {
				return linkedMap_1.Touch;
			}
		});
		var disposable_1 = require_disposable();
		Object.defineProperty(exports, "Disposable", {
			enumerable: true,
			get: function() {
				return disposable_1.Disposable;
			}
		});
		var events_1 = require_events();
		Object.defineProperty(exports, "Event", {
			enumerable: true,
			get: function() {
				return events_1.Event;
			}
		});
		Object.defineProperty(exports, "Emitter", {
			enumerable: true,
			get: function() {
				return events_1.Emitter;
			}
		});
		var cancellation_1 = require_cancellation();
		Object.defineProperty(exports, "CancellationTokenSource", {
			enumerable: true,
			get: function() {
				return cancellation_1.CancellationTokenSource;
			}
		});
		Object.defineProperty(exports, "CancellationToken", {
			enumerable: true,
			get: function() {
				return cancellation_1.CancellationToken;
			}
		});
		var sharedArrayCancellation_1 = require_sharedArrayCancellation();
		Object.defineProperty(exports, "SharedArraySenderStrategy", {
			enumerable: true,
			get: function() {
				return sharedArrayCancellation_1.SharedArraySenderStrategy;
			}
		});
		Object.defineProperty(exports, "SharedArrayReceiverStrategy", {
			enumerable: true,
			get: function() {
				return sharedArrayCancellation_1.SharedArrayReceiverStrategy;
			}
		});
		var messageReader_1 = require_messageReader();
		Object.defineProperty(exports, "MessageReader", {
			enumerable: true,
			get: function() {
				return messageReader_1.MessageReader;
			}
		});
		Object.defineProperty(exports, "AbstractMessageReader", {
			enumerable: true,
			get: function() {
				return messageReader_1.AbstractMessageReader;
			}
		});
		Object.defineProperty(exports, "ReadableStreamMessageReader", {
			enumerable: true,
			get: function() {
				return messageReader_1.ReadableStreamMessageReader;
			}
		});
		var messageWriter_1 = require_messageWriter();
		Object.defineProperty(exports, "MessageWriter", {
			enumerable: true,
			get: function() {
				return messageWriter_1.MessageWriter;
			}
		});
		Object.defineProperty(exports, "AbstractMessageWriter", {
			enumerable: true,
			get: function() {
				return messageWriter_1.AbstractMessageWriter;
			}
		});
		Object.defineProperty(exports, "WriteableStreamMessageWriter", {
			enumerable: true,
			get: function() {
				return messageWriter_1.WriteableStreamMessageWriter;
			}
		});
		var messageBuffer_1 = require_messageBuffer();
		Object.defineProperty(exports, "AbstractMessageBuffer", {
			enumerable: true,
			get: function() {
				return messageBuffer_1.AbstractMessageBuffer;
			}
		});
		var connection_1 = require_connection$1();
		Object.defineProperty(exports, "ConnectionStrategy", {
			enumerable: true,
			get: function() {
				return connection_1.ConnectionStrategy;
			}
		});
		Object.defineProperty(exports, "ConnectionOptions", {
			enumerable: true,
			get: function() {
				return connection_1.ConnectionOptions;
			}
		});
		Object.defineProperty(exports, "NullLogger", {
			enumerable: true,
			get: function() {
				return connection_1.NullLogger;
			}
		});
		Object.defineProperty(exports, "createMessageConnection", {
			enumerable: true,
			get: function() {
				return connection_1.createMessageConnection;
			}
		});
		Object.defineProperty(exports, "ProgressToken", {
			enumerable: true,
			get: function() {
				return connection_1.ProgressToken;
			}
		});
		Object.defineProperty(exports, "ProgressType", {
			enumerable: true,
			get: function() {
				return connection_1.ProgressType;
			}
		});
		Object.defineProperty(exports, "Trace", {
			enumerable: true,
			get: function() {
				return connection_1.Trace;
			}
		});
		Object.defineProperty(exports, "TraceValues", {
			enumerable: true,
			get: function() {
				return connection_1.TraceValues;
			}
		});
		Object.defineProperty(exports, "TraceFormat", {
			enumerable: true,
			get: function() {
				return connection_1.TraceFormat;
			}
		});
		Object.defineProperty(exports, "SetTraceNotification", {
			enumerable: true,
			get: function() {
				return connection_1.SetTraceNotification;
			}
		});
		Object.defineProperty(exports, "LogTraceNotification", {
			enumerable: true,
			get: function() {
				return connection_1.LogTraceNotification;
			}
		});
		Object.defineProperty(exports, "ConnectionErrors", {
			enumerable: true,
			get: function() {
				return connection_1.ConnectionErrors;
			}
		});
		Object.defineProperty(exports, "ConnectionError", {
			enumerable: true,
			get: function() {
				return connection_1.ConnectionError;
			}
		});
		Object.defineProperty(exports, "CancellationReceiverStrategy", {
			enumerable: true,
			get: function() {
				return connection_1.CancellationReceiverStrategy;
			}
		});
		Object.defineProperty(exports, "CancellationSenderStrategy", {
			enumerable: true,
			get: function() {
				return connection_1.CancellationSenderStrategy;
			}
		});
		Object.defineProperty(exports, "CancellationStrategy", {
			enumerable: true,
			get: function() {
				return connection_1.CancellationStrategy;
			}
		});
		Object.defineProperty(exports, "MessageStrategy", {
			enumerable: true,
			get: function() {
				return connection_1.MessageStrategy;
			}
		});
		exports.RAL = require_ral().default;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/browser/ril.js
	var require_ril = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		var api_1 = require_api$1();
		var MessageBuffer = class MessageBuffer extends api_1.AbstractMessageBuffer {
			constructor(encoding = "utf-8") {
				super(encoding);
				this.asciiDecoder = new TextDecoder("ascii");
			}
			emptyBuffer() {
				return MessageBuffer.emptyBuffer;
			}
			fromString(value, _encoding) {
				return new TextEncoder().encode(value);
			}
			toString(value, encoding) {
				if (encoding === "ascii") return this.asciiDecoder.decode(value);
				else return new TextDecoder(encoding).decode(value);
			}
			asNative(buffer, length) {
				if (length === void 0) return buffer;
				else return buffer.slice(0, length);
			}
			allocNative(length) {
				return new Uint8Array(length);
			}
		};
		MessageBuffer.emptyBuffer = /* @__PURE__ */ new Uint8Array(0);
		var ReadableStreamWrapper = class {
			constructor(socket) {
				this.socket = socket;
				this._onData = new api_1.Emitter();
				this._messageListener = (event) => {
					event.data.arrayBuffer().then((buffer) => {
						this._onData.fire(new Uint8Array(buffer));
					}, () => {
						(0, api_1.RAL)().console.error(`Converting blob to array buffer failed.`);
					});
				};
				this.socket.addEventListener("message", this._messageListener);
			}
			onClose(listener) {
				this.socket.addEventListener("close", listener);
				return api_1.Disposable.create(() => this.socket.removeEventListener("close", listener));
			}
			onError(listener) {
				this.socket.addEventListener("error", listener);
				return api_1.Disposable.create(() => this.socket.removeEventListener("error", listener));
			}
			onEnd(listener) {
				this.socket.addEventListener("end", listener);
				return api_1.Disposable.create(() => this.socket.removeEventListener("end", listener));
			}
			onData(listener) {
				return this._onData.event(listener);
			}
		};
		var WritableStreamWrapper = class {
			constructor(socket) {
				this.socket = socket;
			}
			onClose(listener) {
				this.socket.addEventListener("close", listener);
				return api_1.Disposable.create(() => this.socket.removeEventListener("close", listener));
			}
			onError(listener) {
				this.socket.addEventListener("error", listener);
				return api_1.Disposable.create(() => this.socket.removeEventListener("error", listener));
			}
			onEnd(listener) {
				this.socket.addEventListener("end", listener);
				return api_1.Disposable.create(() => this.socket.removeEventListener("end", listener));
			}
			write(data, encoding) {
				if (typeof data === "string") {
					if (encoding !== void 0 && encoding !== "utf-8") throw new Error(`In a Browser environments only utf-8 text encoding is supported. But got encoding: ${encoding}`);
					this.socket.send(data);
				} else this.socket.send(data);
				return Promise.resolve();
			}
			end() {
				this.socket.close();
			}
		};
		var _textEncoder = new TextEncoder();
		var _ril = Object.freeze({
			messageBuffer: Object.freeze({ create: (encoding) => new MessageBuffer(encoding) }),
			applicationJson: Object.freeze({
				encoder: Object.freeze({
					name: "application/json",
					encode: (msg, options) => {
						if (options.charset !== "utf-8") throw new Error(`In a Browser environments only utf-8 text encoding is supported. But got encoding: ${options.charset}`);
						return Promise.resolve(_textEncoder.encode(JSON.stringify(msg, void 0, 0)));
					}
				}),
				decoder: Object.freeze({
					name: "application/json",
					decode: (buffer, options) => {
						if (!(buffer instanceof Uint8Array)) throw new Error(`In a Browser environments only Uint8Arrays are supported.`);
						return Promise.resolve(JSON.parse(new TextDecoder(options.charset).decode(buffer)));
					}
				})
			}),
			stream: Object.freeze({
				asReadableStream: (socket) => new ReadableStreamWrapper(socket),
				asWritableStream: (socket) => new WritableStreamWrapper(socket)
			}),
			console,
			timer: Object.freeze({
				setTimeout(callback, ms, ...args) {
					const handle = setTimeout(callback, ms, ...args);
					return { dispose: () => clearTimeout(handle) };
				},
				setImmediate(callback, ...args) {
					const handle = setTimeout(callback, 0, ...args);
					return { dispose: () => clearTimeout(handle) };
				},
				setInterval(callback, ms, ...args) {
					const handle = setInterval(callback, ms, ...args);
					return { dispose: () => clearInterval(handle) };
				}
			})
		});
		function RIL() {
			return _ril;
		}
		(function(RIL) {
			function install() {
				api_1.RAL.install(_ril);
			}
			RIL.install = install;
		})(RIL || (RIL = {}));
		exports.default = RIL;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/browser/main.js
	var require_main$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
		var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			var desc = Object.getOwnPropertyDescriptor(m, k);
			if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
				enumerable: true,
				get: function() {
					return m[k];
				}
			};
			Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			o[k2] = m[k];
		}));
		var __exportStar = exports && exports.__exportStar || function(m, exports$3) {
			for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$3, p)) __createBinding(exports$3, m, p);
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.createMessageConnection = exports.BrowserMessageWriter = exports.BrowserMessageReader = void 0;
		require_ril().default.install();
		var api_1 = require_api$1();
		__exportStar(require_api$1(), exports);
		var BrowserMessageReader = class extends api_1.AbstractMessageReader {
			constructor(port) {
				super();
				this._onData = new api_1.Emitter();
				this._messageListener = (event) => {
					this._onData.fire(event.data);
				};
				port.addEventListener("error", (event) => this.fireError(event));
				port.onmessage = this._messageListener;
			}
			listen(callback) {
				return this._onData.event(callback);
			}
		};
		exports.BrowserMessageReader = BrowserMessageReader;
		var BrowserMessageWriter = class extends api_1.AbstractMessageWriter {
			constructor(port) {
				super();
				this.port = port;
				this.errorCount = 0;
				port.addEventListener("error", (event) => this.fireError(event));
			}
			write(msg) {
				try {
					this.port.postMessage(msg);
					return Promise.resolve();
				} catch (error) {
					this.handleError(error, msg);
					return Promise.reject(error);
				}
			}
			handleError(error, msg) {
				this.errorCount++;
				this.fireError(error, msg, this.errorCount);
			}
			end() {}
		};
		exports.BrowserMessageWriter = BrowserMessageWriter;
		function createMessageConnection(reader, writer, logger, options) {
			if (logger === void 0) logger = api_1.NullLogger;
			if (api_1.ConnectionStrategy.is(options)) options = { connectionStrategy: options };
			return (0, api_1.createMessageConnection)(reader, writer, logger, options);
		}
		exports.createMessageConnection = createMessageConnection;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/browser.js
	var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		module.exports = require_main$1();
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-types/lib/esm/main.js
	var main_exports = /* @__PURE__ */ __exportAll({
		AnnotatedTextEdit: () => AnnotatedTextEdit,
		ChangeAnnotation: () => ChangeAnnotation,
		ChangeAnnotationIdentifier: () => ChangeAnnotationIdentifier,
		CodeAction: () => CodeAction,
		CodeActionContext: () => CodeActionContext,
		CodeActionKind: () => CodeActionKind,
		CodeActionTriggerKind: () => CodeActionTriggerKind,
		CodeDescription: () => CodeDescription,
		CodeLens: () => CodeLens,
		Color: () => Color,
		ColorInformation: () => ColorInformation,
		ColorPresentation: () => ColorPresentation,
		Command: () => Command,
		CompletionItem: () => CompletionItem,
		CompletionItemKind: () => CompletionItemKind$2,
		CompletionItemLabelDetails: () => CompletionItemLabelDetails,
		CompletionItemTag: () => CompletionItemTag,
		CompletionList: () => CompletionList,
		CreateFile: () => CreateFile,
		DeleteFile: () => DeleteFile,
		Diagnostic: () => Diagnostic,
		DiagnosticRelatedInformation: () => DiagnosticRelatedInformation,
		DiagnosticSeverity: () => DiagnosticSeverity$1,
		DiagnosticTag: () => DiagnosticTag,
		DocumentHighlight: () => DocumentHighlight,
		DocumentHighlightKind: () => DocumentHighlightKind,
		DocumentLink: () => DocumentLink,
		DocumentSymbol: () => DocumentSymbol,
		DocumentUri: () => DocumentUri,
		EOL: () => EOL,
		FoldingRange: () => FoldingRange,
		FoldingRangeKind: () => FoldingRangeKind,
		FormattingOptions: () => FormattingOptions,
		Hover: () => Hover,
		InlayHint: () => InlayHint,
		InlayHintKind: () => InlayHintKind,
		InlayHintLabelPart: () => InlayHintLabelPart,
		InlineCompletionContext: () => InlineCompletionContext,
		InlineCompletionItem: () => InlineCompletionItem,
		InlineCompletionList: () => InlineCompletionList,
		InlineCompletionTriggerKind: () => InlineCompletionTriggerKind,
		InlineValueContext: () => InlineValueContext,
		InlineValueEvaluatableExpression: () => InlineValueEvaluatableExpression,
		InlineValueText: () => InlineValueText,
		InlineValueVariableLookup: () => InlineValueVariableLookup,
		InsertReplaceEdit: () => InsertReplaceEdit,
		InsertTextFormat: () => InsertTextFormat$1,
		InsertTextMode: () => InsertTextMode,
		Location: () => Location,
		LocationLink: () => LocationLink,
		MarkedString: () => MarkedString$1,
		MarkupContent: () => MarkupContent$1,
		MarkupKind: () => MarkupKind,
		OptionalVersionedTextDocumentIdentifier: () => OptionalVersionedTextDocumentIdentifier,
		ParameterInformation: () => ParameterInformation,
		Position: () => Position,
		Range: () => Range,
		RenameFile: () => RenameFile,
		SelectedCompletionInfo: () => SelectedCompletionInfo,
		SelectionRange: () => SelectionRange,
		SemanticTokenModifiers: () => SemanticTokenModifiers,
		SemanticTokenTypes: () => SemanticTokenTypes,
		SemanticTokens: () => SemanticTokens,
		SignatureInformation: () => SignatureInformation,
		StringValue: () => StringValue,
		SymbolInformation: () => SymbolInformation,
		SymbolKind: () => SymbolKind,
		SymbolTag: () => SymbolTag,
		TextDocument: () => TextDocument,
		TextDocumentEdit: () => TextDocumentEdit,
		TextDocumentIdentifier: () => TextDocumentIdentifier,
		TextDocumentItem: () => TextDocumentItem,
		TextEdit: () => TextEdit,
		URI: () => URI,
		VersionedTextDocumentIdentifier: () => VersionedTextDocumentIdentifier,
		WorkspaceChange: () => WorkspaceChange,
		WorkspaceEdit: () => WorkspaceEdit,
		WorkspaceFolder: () => WorkspaceFolder,
		WorkspaceSymbol: () => WorkspaceSymbol,
		integer: () => integer,
		uinteger: () => uinteger
	});
	var DocumentUri, URI, integer, uinteger, Position, Range, Location, LocationLink, Color, ColorInformation, ColorPresentation, FoldingRangeKind, FoldingRange, DiagnosticRelatedInformation, DiagnosticSeverity$1, DiagnosticTag, CodeDescription, Diagnostic, Command, TextEdit, ChangeAnnotation, ChangeAnnotationIdentifier, AnnotatedTextEdit, TextDocumentEdit, CreateFile, RenameFile, DeleteFile, WorkspaceEdit, TextEditChangeImpl, ChangeAnnotations, WorkspaceChange, TextDocumentIdentifier, VersionedTextDocumentIdentifier, OptionalVersionedTextDocumentIdentifier, TextDocumentItem, MarkupKind, MarkupContent$1, CompletionItemKind$2, InsertTextFormat$1, CompletionItemTag, InsertReplaceEdit, InsertTextMode, CompletionItemLabelDetails, CompletionItem, CompletionList, MarkedString$1, Hover, ParameterInformation, SignatureInformation, DocumentHighlightKind, DocumentHighlight, SymbolKind, SymbolTag, SymbolInformation, WorkspaceSymbol, DocumentSymbol, CodeActionKind, CodeActionTriggerKind, CodeActionContext, CodeAction, CodeLens, FormattingOptions, DocumentLink, SelectionRange, SemanticTokenTypes, SemanticTokenModifiers, SemanticTokens, InlineValueText, InlineValueVariableLookup, InlineValueEvaluatableExpression, InlineValueContext, InlayHintKind, InlayHintLabelPart, InlayHint, StringValue, InlineCompletionItem, InlineCompletionList, InlineCompletionTriggerKind, SelectedCompletionInfo, InlineCompletionContext, WorkspaceFolder, EOL, TextDocument, FullTextDocument, Is;
	var init_main = __esmMin((() => {
		(function(DocumentUri) {
			function is(value) {
				return typeof value === "string";
			}
			DocumentUri.is = is;
		})(DocumentUri || (DocumentUri = {}));
		(function(URI) {
			function is(value) {
				return typeof value === "string";
			}
			URI.is = is;
		})(URI || (URI = {}));
		(function(integer) {
			integer.MIN_VALUE = -2147483648;
			integer.MAX_VALUE = 2147483647;
			function is(value) {
				return typeof value === "number" && integer.MIN_VALUE <= value && value <= integer.MAX_VALUE;
			}
			integer.is = is;
		})(integer || (integer = {}));
		(function(uinteger) {
			uinteger.MIN_VALUE = 0;
			uinteger.MAX_VALUE = 2147483647;
			function is(value) {
				return typeof value === "number" && uinteger.MIN_VALUE <= value && value <= uinteger.MAX_VALUE;
			}
			uinteger.is = is;
		})(uinteger || (uinteger = {}));
		(function(Position) {
			/**
			* Creates a new Position literal from the given line and character.
			* @param line The position's line.
			* @param character The position's character.
			*/
			function create(line, character) {
				if (line === Number.MAX_VALUE) line = uinteger.MAX_VALUE;
				if (character === Number.MAX_VALUE) character = uinteger.MAX_VALUE;
				return {
					line,
					character
				};
			}
			Position.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Position} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.objectLiteral(candidate) && Is.uinteger(candidate.line) && Is.uinteger(candidate.character);
			}
			Position.is = is;
		})(Position || (Position = {}));
		(function(Range) {
			function create(one, two, three, four) {
				if (Is.uinteger(one) && Is.uinteger(two) && Is.uinteger(three) && Is.uinteger(four)) return {
					start: Position.create(one, two),
					end: Position.create(three, four)
				};
				else if (Position.is(one) && Position.is(two)) return {
					start: one,
					end: two
				};
				else throw new Error(`Range#create called with invalid arguments[${one}, ${two}, ${three}, ${four}]`);
			}
			Range.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Range} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.objectLiteral(candidate) && Position.is(candidate.start) && Position.is(candidate.end);
			}
			Range.is = is;
		})(Range || (Range = {}));
		(function(Location) {
			/**
			* Creates a Location literal.
			* @param uri The location's uri.
			* @param range The location's range.
			*/
			function create(uri, range) {
				return {
					uri,
					range
				};
			}
			Location.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Location} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.objectLiteral(candidate) && Range.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
			}
			Location.is = is;
		})(Location || (Location = {}));
		(function(LocationLink) {
			/**
			* Creates a LocationLink literal.
			* @param targetUri The definition's uri.
			* @param targetRange The full range of the definition.
			* @param targetSelectionRange The span of the symbol definition at the target.
			* @param originSelectionRange The span of the symbol being defined in the originating source file.
			*/
			function create(targetUri, targetRange, targetSelectionRange, originSelectionRange) {
				return {
					targetUri,
					targetRange,
					targetSelectionRange,
					originSelectionRange
				};
			}
			LocationLink.create = create;
			/**
			* Checks whether the given literal conforms to the {@link LocationLink} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.objectLiteral(candidate) && Range.is(candidate.targetRange) && Is.string(candidate.targetUri) && Range.is(candidate.targetSelectionRange) && (Range.is(candidate.originSelectionRange) || Is.undefined(candidate.originSelectionRange));
			}
			LocationLink.is = is;
		})(LocationLink || (LocationLink = {}));
		(function(Color) {
			/**
			* Creates a new Color literal.
			*/
			function create(red, green, blue, alpha) {
				return {
					red,
					green,
					blue,
					alpha
				};
			}
			Color.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Color} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Is.numberRange(candidate.red, 0, 1) && Is.numberRange(candidate.green, 0, 1) && Is.numberRange(candidate.blue, 0, 1) && Is.numberRange(candidate.alpha, 0, 1);
			}
			Color.is = is;
		})(Color || (Color = {}));
		(function(ColorInformation) {
			/**
			* Creates a new ColorInformation literal.
			*/
			function create(range, color) {
				return {
					range,
					color
				};
			}
			ColorInformation.create = create;
			/**
			* Checks whether the given literal conforms to the {@link ColorInformation} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Range.is(candidate.range) && Color.is(candidate.color);
			}
			ColorInformation.is = is;
		})(ColorInformation || (ColorInformation = {}));
		(function(ColorPresentation) {
			/**
			* Creates a new ColorInformation literal.
			*/
			function create(label, textEdit, additionalTextEdits) {
				return {
					label,
					textEdit,
					additionalTextEdits
				};
			}
			ColorPresentation.create = create;
			/**
			* Checks whether the given literal conforms to the {@link ColorInformation} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.undefined(candidate.textEdit) || TextEdit.is(candidate)) && (Is.undefined(candidate.additionalTextEdits) || Is.typedArray(candidate.additionalTextEdits, TextEdit.is));
			}
			ColorPresentation.is = is;
		})(ColorPresentation || (ColorPresentation = {}));
		(function(FoldingRangeKind) {
			/**
			* Folding range for a comment
			*/
			FoldingRangeKind.Comment = "comment";
			/**
			* Folding range for an import or include
			*/
			FoldingRangeKind.Imports = "imports";
			/**
			* Folding range for a region (e.g. `#region`)
			*/
			FoldingRangeKind.Region = "region";
		})(FoldingRangeKind || (FoldingRangeKind = {}));
		(function(FoldingRange) {
			/**
			* Creates a new FoldingRange literal.
			*/
			function create(startLine, endLine, startCharacter, endCharacter, kind, collapsedText) {
				const result = {
					startLine,
					endLine
				};
				if (Is.defined(startCharacter)) result.startCharacter = startCharacter;
				if (Is.defined(endCharacter)) result.endCharacter = endCharacter;
				if (Is.defined(kind)) result.kind = kind;
				if (Is.defined(collapsedText)) result.collapsedText = collapsedText;
				return result;
			}
			FoldingRange.create = create;
			/**
			* Checks whether the given literal conforms to the {@link FoldingRange} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Is.uinteger(candidate.startLine) && Is.uinteger(candidate.startLine) && (Is.undefined(candidate.startCharacter) || Is.uinteger(candidate.startCharacter)) && (Is.undefined(candidate.endCharacter) || Is.uinteger(candidate.endCharacter)) && (Is.undefined(candidate.kind) || Is.string(candidate.kind));
			}
			FoldingRange.is = is;
		})(FoldingRange || (FoldingRange = {}));
		(function(DiagnosticRelatedInformation) {
			/**
			* Creates a new DiagnosticRelatedInformation literal.
			*/
			function create(location, message) {
				return {
					location,
					message
				};
			}
			DiagnosticRelatedInformation.create = create;
			/**
			* Checks whether the given literal conforms to the {@link DiagnosticRelatedInformation} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
			}
			DiagnosticRelatedInformation.is = is;
		})(DiagnosticRelatedInformation || (DiagnosticRelatedInformation = {}));
		(function(DiagnosticSeverity) {
			/**
			* Reports an error.
			*/
			DiagnosticSeverity.Error = 1;
			/**
			* Reports a warning.
			*/
			DiagnosticSeverity.Warning = 2;
			/**
			* Reports an information.
			*/
			DiagnosticSeverity.Information = 3;
			/**
			* Reports a hint.
			*/
			DiagnosticSeverity.Hint = 4;
		})(DiagnosticSeverity$1 || (DiagnosticSeverity$1 = {}));
		(function(DiagnosticTag) {
			/**
			* Unused or unnecessary code.
			*
			* Clients are allowed to render diagnostics with this tag faded out instead of having
			* an error squiggle.
			*/
			DiagnosticTag.Unnecessary = 1;
			/**
			* Deprecated or obsolete code.
			*
			* Clients are allowed to rendered diagnostics with this tag strike through.
			*/
			DiagnosticTag.Deprecated = 2;
		})(DiagnosticTag || (DiagnosticTag = {}));
		(function(CodeDescription) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Is.string(candidate.href);
			}
			CodeDescription.is = is;
		})(CodeDescription || (CodeDescription = {}));
		(function(Diagnostic) {
			/**
			* Creates a new Diagnostic literal.
			*/
			function create(range, message, severity, code, source, relatedInformation) {
				let result = {
					range,
					message
				};
				if (Is.defined(severity)) result.severity = severity;
				if (Is.defined(code)) result.code = code;
				if (Is.defined(source)) result.source = source;
				if (Is.defined(relatedInformation)) result.relatedInformation = relatedInformation;
				return result;
			}
			Diagnostic.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Diagnostic} interface.
			*/
			function is(value) {
				var _a;
				let candidate = value;
				return Is.defined(candidate) && Range.is(candidate.range) && Is.string(candidate.message) && (Is.number(candidate.severity) || Is.undefined(candidate.severity)) && (Is.integer(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code)) && (Is.undefined(candidate.codeDescription) || Is.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)) && (Is.string(candidate.source) || Is.undefined(candidate.source)) && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
			}
			Diagnostic.is = is;
		})(Diagnostic || (Diagnostic = {}));
		(function(Command) {
			/**
			* Creates a new Command literal.
			*/
			function create(title, command, ...args) {
				let result = {
					title,
					command
				};
				if (Is.defined(args) && args.length > 0) result.arguments = args;
				return result;
			}
			Command.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Command} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.string(candidate.title) && Is.string(candidate.command);
			}
			Command.is = is;
		})(Command || (Command = {}));
		(function(TextEdit) {
			/**
			* Creates a replace text edit.
			* @param range The range of text to be replaced.
			* @param newText The new text.
			*/
			function replace(range, newText) {
				return {
					range,
					newText
				};
			}
			TextEdit.replace = replace;
			/**
			* Creates an insert text edit.
			* @param position The position to insert the text at.
			* @param newText The text to be inserted.
			*/
			function insert(position, newText) {
				return {
					range: {
						start: position,
						end: position
					},
					newText
				};
			}
			TextEdit.insert = insert;
			/**
			* Creates a delete text edit.
			* @param range The range of text to be deleted.
			*/
			function del(range) {
				return {
					range,
					newText: ""
				};
			}
			TextEdit.del = del;
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Is.string(candidate.newText) && Range.is(candidate.range);
			}
			TextEdit.is = is;
		})(TextEdit || (TextEdit = {}));
		(function(ChangeAnnotation) {
			function create(label, needsConfirmation, description) {
				const result = { label };
				if (needsConfirmation !== void 0) result.needsConfirmation = needsConfirmation;
				if (description !== void 0) result.description = description;
				return result;
			}
			ChangeAnnotation.create = create;
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
			}
			ChangeAnnotation.is = is;
		})(ChangeAnnotation || (ChangeAnnotation = {}));
		(function(ChangeAnnotationIdentifier) {
			function is(value) {
				const candidate = value;
				return Is.string(candidate);
			}
			ChangeAnnotationIdentifier.is = is;
		})(ChangeAnnotationIdentifier || (ChangeAnnotationIdentifier = {}));
		(function(AnnotatedTextEdit) {
			/**
			* Creates an annotated replace text edit.
			*
			* @param range The range of text to be replaced.
			* @param newText The new text.
			* @param annotation The annotation.
			*/
			function replace(range, newText, annotation) {
				return {
					range,
					newText,
					annotationId: annotation
				};
			}
			AnnotatedTextEdit.replace = replace;
			/**
			* Creates an annotated insert text edit.
			*
			* @param position The position to insert the text at.
			* @param newText The text to be inserted.
			* @param annotation The annotation.
			*/
			function insert(position, newText, annotation) {
				return {
					range: {
						start: position,
						end: position
					},
					newText,
					annotationId: annotation
				};
			}
			AnnotatedTextEdit.insert = insert;
			/**
			* Creates an annotated delete text edit.
			*
			* @param range The range of text to be deleted.
			* @param annotation The annotation.
			*/
			function del(range, annotation) {
				return {
					range,
					newText: "",
					annotationId: annotation
				};
			}
			AnnotatedTextEdit.del = del;
			function is(value) {
				const candidate = value;
				return TextEdit.is(candidate) && (ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId));
			}
			AnnotatedTextEdit.is = is;
		})(AnnotatedTextEdit || (AnnotatedTextEdit = {}));
		(function(TextDocumentEdit) {
			/**
			* Creates a new `TextDocumentEdit`
			*/
			function create(textDocument, edits) {
				return {
					textDocument,
					edits
				};
			}
			TextDocumentEdit.create = create;
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && OptionalVersionedTextDocumentIdentifier.is(candidate.textDocument) && Array.isArray(candidate.edits);
			}
			TextDocumentEdit.is = is;
		})(TextDocumentEdit || (TextDocumentEdit = {}));
		(function(CreateFile) {
			function create(uri, options, annotation) {
				let result = {
					kind: "create",
					uri
				};
				if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) result.options = options;
				if (annotation !== void 0) result.annotationId = annotation;
				return result;
			}
			CreateFile.create = create;
			function is(value) {
				let candidate = value;
				return candidate && candidate.kind === "create" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
			}
			CreateFile.is = is;
		})(CreateFile || (CreateFile = {}));
		(function(RenameFile) {
			function create(oldUri, newUri, options, annotation) {
				let result = {
					kind: "rename",
					oldUri,
					newUri
				};
				if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) result.options = options;
				if (annotation !== void 0) result.annotationId = annotation;
				return result;
			}
			RenameFile.create = create;
			function is(value) {
				let candidate = value;
				return candidate && candidate.kind === "rename" && Is.string(candidate.oldUri) && Is.string(candidate.newUri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
			}
			RenameFile.is = is;
		})(RenameFile || (RenameFile = {}));
		(function(DeleteFile) {
			function create(uri, options, annotation) {
				let result = {
					kind: "delete",
					uri
				};
				if (options !== void 0 && (options.recursive !== void 0 || options.ignoreIfNotExists !== void 0)) result.options = options;
				if (annotation !== void 0) result.annotationId = annotation;
				return result;
			}
			DeleteFile.create = create;
			function is(value) {
				let candidate = value;
				return candidate && candidate.kind === "delete" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.recursive === void 0 || Is.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === void 0 || Is.boolean(candidate.options.ignoreIfNotExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
			}
			DeleteFile.is = is;
		})(DeleteFile || (DeleteFile = {}));
		(function(WorkspaceEdit) {
			function is(value) {
				let candidate = value;
				return candidate && (candidate.changes !== void 0 || candidate.documentChanges !== void 0) && (candidate.documentChanges === void 0 || candidate.documentChanges.every((change) => {
					if (Is.string(change.kind)) return CreateFile.is(change) || RenameFile.is(change) || DeleteFile.is(change);
					else return TextDocumentEdit.is(change);
				}));
			}
			WorkspaceEdit.is = is;
		})(WorkspaceEdit || (WorkspaceEdit = {}));
		TextEditChangeImpl = class {
			constructor(edits, changeAnnotations) {
				this.edits = edits;
				this.changeAnnotations = changeAnnotations;
			}
			insert(position, newText, annotation) {
				let edit;
				let id;
				if (annotation === void 0) edit = TextEdit.insert(position, newText);
				else if (ChangeAnnotationIdentifier.is(annotation)) {
					id = annotation;
					edit = AnnotatedTextEdit.insert(position, newText, annotation);
				} else {
					this.assertChangeAnnotations(this.changeAnnotations);
					id = this.changeAnnotations.manage(annotation);
					edit = AnnotatedTextEdit.insert(position, newText, id);
				}
				this.edits.push(edit);
				if (id !== void 0) return id;
			}
			replace(range, newText, annotation) {
				let edit;
				let id;
				if (annotation === void 0) edit = TextEdit.replace(range, newText);
				else if (ChangeAnnotationIdentifier.is(annotation)) {
					id = annotation;
					edit = AnnotatedTextEdit.replace(range, newText, annotation);
				} else {
					this.assertChangeAnnotations(this.changeAnnotations);
					id = this.changeAnnotations.manage(annotation);
					edit = AnnotatedTextEdit.replace(range, newText, id);
				}
				this.edits.push(edit);
				if (id !== void 0) return id;
			}
			delete(range, annotation) {
				let edit;
				let id;
				if (annotation === void 0) edit = TextEdit.del(range);
				else if (ChangeAnnotationIdentifier.is(annotation)) {
					id = annotation;
					edit = AnnotatedTextEdit.del(range, annotation);
				} else {
					this.assertChangeAnnotations(this.changeAnnotations);
					id = this.changeAnnotations.manage(annotation);
					edit = AnnotatedTextEdit.del(range, id);
				}
				this.edits.push(edit);
				if (id !== void 0) return id;
			}
			add(edit) {
				this.edits.push(edit);
			}
			all() {
				return this.edits;
			}
			clear() {
				this.edits.splice(0, this.edits.length);
			}
			assertChangeAnnotations(value) {
				if (value === void 0) throw new Error(`Text edit change is not configured to manage change annotations.`);
			}
		};
		ChangeAnnotations = class {
			constructor(annotations) {
				this._annotations = annotations === void 0 ? Object.create(null) : annotations;
				this._counter = 0;
				this._size = 0;
			}
			all() {
				return this._annotations;
			}
			get size() {
				return this._size;
			}
			manage(idOrAnnotation, annotation) {
				let id;
				if (ChangeAnnotationIdentifier.is(idOrAnnotation)) id = idOrAnnotation;
				else {
					id = this.nextId();
					annotation = idOrAnnotation;
				}
				if (this._annotations[id] !== void 0) throw new Error(`Id ${id} is already in use.`);
				if (annotation === void 0) throw new Error(`No annotation provided for id ${id}`);
				this._annotations[id] = annotation;
				this._size++;
				return id;
			}
			nextId() {
				this._counter++;
				return this._counter.toString();
			}
		};
		WorkspaceChange = class {
			constructor(workspaceEdit) {
				this._textEditChanges = Object.create(null);
				if (workspaceEdit !== void 0) {
					this._workspaceEdit = workspaceEdit;
					if (workspaceEdit.documentChanges) {
						this._changeAnnotations = new ChangeAnnotations(workspaceEdit.changeAnnotations);
						workspaceEdit.changeAnnotations = this._changeAnnotations.all();
						workspaceEdit.documentChanges.forEach((change) => {
							if (TextDocumentEdit.is(change)) {
								const textEditChange = new TextEditChangeImpl(change.edits, this._changeAnnotations);
								this._textEditChanges[change.textDocument.uri] = textEditChange;
							}
						});
					} else if (workspaceEdit.changes) Object.keys(workspaceEdit.changes).forEach((key) => {
						const textEditChange = new TextEditChangeImpl(workspaceEdit.changes[key]);
						this._textEditChanges[key] = textEditChange;
					});
				} else this._workspaceEdit = {};
			}
			/**
			* Returns the underlying {@link WorkspaceEdit} literal
			* use to be returned from a workspace edit operation like rename.
			*/
			get edit() {
				this.initDocumentChanges();
				if (this._changeAnnotations !== void 0) if (this._changeAnnotations.size === 0) this._workspaceEdit.changeAnnotations = void 0;
				else this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
				return this._workspaceEdit;
			}
			getTextEditChange(key) {
				if (OptionalVersionedTextDocumentIdentifier.is(key)) {
					this.initDocumentChanges();
					if (this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
					const textDocument = {
						uri: key.uri,
						version: key.version
					};
					let result = this._textEditChanges[textDocument.uri];
					if (!result) {
						const edits = [];
						const textDocumentEdit = {
							textDocument,
							edits
						};
						this._workspaceEdit.documentChanges.push(textDocumentEdit);
						result = new TextEditChangeImpl(edits, this._changeAnnotations);
						this._textEditChanges[textDocument.uri] = result;
					}
					return result;
				} else {
					this.initChanges();
					if (this._workspaceEdit.changes === void 0) throw new Error("Workspace edit is not configured for normal text edit changes.");
					let result = this._textEditChanges[key];
					if (!result) {
						let edits = [];
						this._workspaceEdit.changes[key] = edits;
						result = new TextEditChangeImpl(edits);
						this._textEditChanges[key] = result;
					}
					return result;
				}
			}
			initDocumentChanges() {
				if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
					this._changeAnnotations = new ChangeAnnotations();
					this._workspaceEdit.documentChanges = [];
					this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
				}
			}
			initChanges() {
				if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) this._workspaceEdit.changes = Object.create(null);
			}
			createFile(uri, optionsOrAnnotation, options) {
				this.initDocumentChanges();
				if (this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
				let annotation;
				if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) annotation = optionsOrAnnotation;
				else options = optionsOrAnnotation;
				let operation;
				let id;
				if (annotation === void 0) operation = CreateFile.create(uri, options);
				else {
					id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
					operation = CreateFile.create(uri, options, id);
				}
				this._workspaceEdit.documentChanges.push(operation);
				if (id !== void 0) return id;
			}
			renameFile(oldUri, newUri, optionsOrAnnotation, options) {
				this.initDocumentChanges();
				if (this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
				let annotation;
				if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) annotation = optionsOrAnnotation;
				else options = optionsOrAnnotation;
				let operation;
				let id;
				if (annotation === void 0) operation = RenameFile.create(oldUri, newUri, options);
				else {
					id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
					operation = RenameFile.create(oldUri, newUri, options, id);
				}
				this._workspaceEdit.documentChanges.push(operation);
				if (id !== void 0) return id;
			}
			deleteFile(uri, optionsOrAnnotation, options) {
				this.initDocumentChanges();
				if (this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
				let annotation;
				if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) annotation = optionsOrAnnotation;
				else options = optionsOrAnnotation;
				let operation;
				let id;
				if (annotation === void 0) operation = DeleteFile.create(uri, options);
				else {
					id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
					operation = DeleteFile.create(uri, options, id);
				}
				this._workspaceEdit.documentChanges.push(operation);
				if (id !== void 0) return id;
			}
		};
		(function(TextDocumentIdentifier) {
			/**
			* Creates a new TextDocumentIdentifier literal.
			* @param uri The document's uri.
			*/
			function create(uri) {
				return { uri };
			}
			TextDocumentIdentifier.create = create;
			/**
			* Checks whether the given literal conforms to the {@link TextDocumentIdentifier} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.string(candidate.uri);
			}
			TextDocumentIdentifier.is = is;
		})(TextDocumentIdentifier || (TextDocumentIdentifier = {}));
		(function(VersionedTextDocumentIdentifier) {
			/**
			* Creates a new VersionedTextDocumentIdentifier literal.
			* @param uri The document's uri.
			* @param version The document's version.
			*/
			function create(uri, version) {
				return {
					uri,
					version
				};
			}
			VersionedTextDocumentIdentifier.create = create;
			/**
			* Checks whether the given literal conforms to the {@link VersionedTextDocumentIdentifier} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.string(candidate.uri) && Is.integer(candidate.version);
			}
			VersionedTextDocumentIdentifier.is = is;
		})(VersionedTextDocumentIdentifier || (VersionedTextDocumentIdentifier = {}));
		(function(OptionalVersionedTextDocumentIdentifier) {
			/**
			* Creates a new OptionalVersionedTextDocumentIdentifier literal.
			* @param uri The document's uri.
			* @param version The document's version.
			*/
			function create(uri, version) {
				return {
					uri,
					version
				};
			}
			OptionalVersionedTextDocumentIdentifier.create = create;
			/**
			* Checks whether the given literal conforms to the {@link OptionalVersionedTextDocumentIdentifier} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.string(candidate.uri) && (candidate.version === null || Is.integer(candidate.version));
			}
			OptionalVersionedTextDocumentIdentifier.is = is;
		})(OptionalVersionedTextDocumentIdentifier || (OptionalVersionedTextDocumentIdentifier = {}));
		(function(TextDocumentItem) {
			/**
			* Creates a new TextDocumentItem literal.
			* @param uri The document's uri.
			* @param languageId The document's language identifier.
			* @param version The document's version number.
			* @param text The document's text.
			*/
			function create(uri, languageId, version, text) {
				return {
					uri,
					languageId,
					version,
					text
				};
			}
			TextDocumentItem.create = create;
			/**
			* Checks whether the given literal conforms to the {@link TextDocumentItem} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.integer(candidate.version) && Is.string(candidate.text);
			}
			TextDocumentItem.is = is;
		})(TextDocumentItem || (TextDocumentItem = {}));
		(function(MarkupKind) {
			/**
			* Plain text is supported as a content format
			*/
			MarkupKind.PlainText = "plaintext";
			/**
			* Markdown is supported as a content format
			*/
			MarkupKind.Markdown = "markdown";
			/**
			* Checks whether the given value is a value of the {@link MarkupKind} type.
			*/
			function is(value) {
				const candidate = value;
				return candidate === MarkupKind.PlainText || candidate === MarkupKind.Markdown;
			}
			MarkupKind.is = is;
		})(MarkupKind || (MarkupKind = {}));
		(function(MarkupContent) {
			/**
			* Checks whether the given value conforms to the {@link MarkupContent} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(value) && MarkupKind.is(candidate.kind) && Is.string(candidate.value);
			}
			MarkupContent.is = is;
		})(MarkupContent$1 || (MarkupContent$1 = {}));
		(function(CompletionItemKind) {
			CompletionItemKind.Text = 1;
			CompletionItemKind.Method = 2;
			CompletionItemKind.Function = 3;
			CompletionItemKind.Constructor = 4;
			CompletionItemKind.Field = 5;
			CompletionItemKind.Variable = 6;
			CompletionItemKind.Class = 7;
			CompletionItemKind.Interface = 8;
			CompletionItemKind.Module = 9;
			CompletionItemKind.Property = 10;
			CompletionItemKind.Unit = 11;
			CompletionItemKind.Value = 12;
			CompletionItemKind.Enum = 13;
			CompletionItemKind.Keyword = 14;
			CompletionItemKind.Snippet = 15;
			CompletionItemKind.Color = 16;
			CompletionItemKind.File = 17;
			CompletionItemKind.Reference = 18;
			CompletionItemKind.Folder = 19;
			CompletionItemKind.EnumMember = 20;
			CompletionItemKind.Constant = 21;
			CompletionItemKind.Struct = 22;
			CompletionItemKind.Event = 23;
			CompletionItemKind.Operator = 24;
			CompletionItemKind.TypeParameter = 25;
		})(CompletionItemKind$2 || (CompletionItemKind$2 = {}));
		(function(InsertTextFormat) {
			/**
			* The primary text to be inserted is treated as a plain string.
			*/
			InsertTextFormat.PlainText = 1;
			/**
			* The primary text to be inserted is treated as a snippet.
			*
			* A snippet can define tab stops and placeholders with `$1`, `$2`
			* and `${3:foo}`. `$0` defines the final tab stop, it defaults to
			* the end of the snippet. Placeholders with equal identifiers are linked,
			* that is typing in one will update others too.
			*
			* See also: https://microsoft.github.io/language-server-protocol/specifications/specification-current/#snippet_syntax
			*/
			InsertTextFormat.Snippet = 2;
		})(InsertTextFormat$1 || (InsertTextFormat$1 = {}));
		(function(CompletionItemTag) {
			/**
			* Render a completion as obsolete, usually using a strike-out.
			*/
			CompletionItemTag.Deprecated = 1;
		})(CompletionItemTag || (CompletionItemTag = {}));
		(function(InsertReplaceEdit) {
			/**
			* Creates a new insert / replace edit
			*/
			function create(newText, insert, replace) {
				return {
					newText,
					insert,
					replace
				};
			}
			InsertReplaceEdit.create = create;
			/**
			* Checks whether the given literal conforms to the {@link InsertReplaceEdit} interface.
			*/
			function is(value) {
				const candidate = value;
				return candidate && Is.string(candidate.newText) && Range.is(candidate.insert) && Range.is(candidate.replace);
			}
			InsertReplaceEdit.is = is;
		})(InsertReplaceEdit || (InsertReplaceEdit = {}));
		(function(InsertTextMode) {
			/**
			* The insertion or replace strings is taken as it is. If the
			* value is multi line the lines below the cursor will be
			* inserted using the indentation defined in the string value.
			* The client will not apply any kind of adjustments to the
			* string.
			*/
			InsertTextMode.asIs = 1;
			/**
			* The editor adjusts leading whitespace of new lines so that
			* they match the indentation up to the cursor of the line for
			* which the item is accepted.
			*
			* Consider a line like this: <2tabs><cursor><3tabs>foo. Accepting a
			* multi line completion item is indented using 2 tabs and all
			* following lines inserted will be indented using 2 tabs as well.
			*/
			InsertTextMode.adjustIndentation = 2;
		})(InsertTextMode || (InsertTextMode = {}));
		(function(CompletionItemLabelDetails) {
			function is(value) {
				const candidate = value;
				return candidate && (Is.string(candidate.detail) || candidate.detail === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
			}
			CompletionItemLabelDetails.is = is;
		})(CompletionItemLabelDetails || (CompletionItemLabelDetails = {}));
		(function(CompletionItem) {
			/**
			* Create a completion item and seed it with a label.
			* @param label The completion item's label
			*/
			function create(label) {
				return { label };
			}
			CompletionItem.create = create;
		})(CompletionItem || (CompletionItem = {}));
		(function(CompletionList) {
			/**
			* Creates a new completion list.
			*
			* @param items The completion items.
			* @param isIncomplete The list is not complete.
			*/
			function create(items, isIncomplete) {
				return {
					items: items ? items : [],
					isIncomplete: !!isIncomplete
				};
			}
			CompletionList.create = create;
		})(CompletionList || (CompletionList = {}));
		(function(MarkedString) {
			/**
			* Creates a marked string from plain text.
			*
			* @param plainText The plain text.
			*/
			function fromPlainText(plainText) {
				return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
			}
			MarkedString.fromPlainText = fromPlainText;
			/**
			* Checks whether the given value conforms to the {@link MarkedString} type.
			*/
			function is(value) {
				const candidate = value;
				return Is.string(candidate) || Is.objectLiteral(candidate) && Is.string(candidate.language) && Is.string(candidate.value);
			}
			MarkedString.is = is;
		})(MarkedString$1 || (MarkedString$1 = {}));
		(function(Hover) {
			/**
			* Checks whether the given value conforms to the {@link Hover} interface.
			*/
			function is(value) {
				let candidate = value;
				return !!candidate && Is.objectLiteral(candidate) && (MarkupContent$1.is(candidate.contents) || MarkedString$1.is(candidate.contents) || Is.typedArray(candidate.contents, MarkedString$1.is)) && (value.range === void 0 || Range.is(value.range));
			}
			Hover.is = is;
		})(Hover || (Hover = {}));
		(function(ParameterInformation) {
			/**
			* Creates a new parameter information literal.
			*
			* @param label A label string.
			* @param documentation A doc string.
			*/
			function create(label, documentation) {
				return documentation ? {
					label,
					documentation
				} : { label };
			}
			ParameterInformation.create = create;
		})(ParameterInformation || (ParameterInformation = {}));
		(function(SignatureInformation) {
			function create(label, documentation, ...parameters) {
				let result = { label };
				if (Is.defined(documentation)) result.documentation = documentation;
				if (Is.defined(parameters)) result.parameters = parameters;
				else result.parameters = [];
				return result;
			}
			SignatureInformation.create = create;
		})(SignatureInformation || (SignatureInformation = {}));
		(function(DocumentHighlightKind) {
			/**
			* A textual occurrence.
			*/
			DocumentHighlightKind.Text = 1;
			/**
			* Read-access of a symbol, like reading a variable.
			*/
			DocumentHighlightKind.Read = 2;
			/**
			* Write-access of a symbol, like writing to a variable.
			*/
			DocumentHighlightKind.Write = 3;
		})(DocumentHighlightKind || (DocumentHighlightKind = {}));
		(function(DocumentHighlight) {
			/**
			* Create a DocumentHighlight object.
			* @param range The range the highlight applies to.
			* @param kind The highlight kind
			*/
			function create(range, kind) {
				let result = { range };
				if (Is.number(kind)) result.kind = kind;
				return result;
			}
			DocumentHighlight.create = create;
		})(DocumentHighlight || (DocumentHighlight = {}));
		(function(SymbolKind) {
			SymbolKind.File = 1;
			SymbolKind.Module = 2;
			SymbolKind.Namespace = 3;
			SymbolKind.Package = 4;
			SymbolKind.Class = 5;
			SymbolKind.Method = 6;
			SymbolKind.Property = 7;
			SymbolKind.Field = 8;
			SymbolKind.Constructor = 9;
			SymbolKind.Enum = 10;
			SymbolKind.Interface = 11;
			SymbolKind.Function = 12;
			SymbolKind.Variable = 13;
			SymbolKind.Constant = 14;
			SymbolKind.String = 15;
			SymbolKind.Number = 16;
			SymbolKind.Boolean = 17;
			SymbolKind.Array = 18;
			SymbolKind.Object = 19;
			SymbolKind.Key = 20;
			SymbolKind.Null = 21;
			SymbolKind.EnumMember = 22;
			SymbolKind.Struct = 23;
			SymbolKind.Event = 24;
			SymbolKind.Operator = 25;
			SymbolKind.TypeParameter = 26;
		})(SymbolKind || (SymbolKind = {}));
		(function(SymbolTag) {
			/**
			* Render a symbol as obsolete, usually using a strike-out.
			*/
			SymbolTag.Deprecated = 1;
		})(SymbolTag || (SymbolTag = {}));
		(function(SymbolInformation) {
			/**
			* Creates a new symbol information literal.
			*
			* @param name The name of the symbol.
			* @param kind The kind of the symbol.
			* @param range The range of the location of the symbol.
			* @param uri The resource of the location of symbol.
			* @param containerName The name of the symbol containing the symbol.
			*/
			function create(name, kind, range, uri, containerName) {
				let result = {
					name,
					kind,
					location: {
						uri,
						range
					}
				};
				if (containerName) result.containerName = containerName;
				return result;
			}
			SymbolInformation.create = create;
		})(SymbolInformation || (SymbolInformation = {}));
		(function(WorkspaceSymbol) {
			/**
			* Create a new workspace symbol.
			*
			* @param name The name of the symbol.
			* @param kind The kind of the symbol.
			* @param uri The resource of the location of the symbol.
			* @param range An options range of the location.
			* @returns A WorkspaceSymbol.
			*/
			function create(name, kind, uri, range) {
				return range !== void 0 ? {
					name,
					kind,
					location: {
						uri,
						range
					}
				} : {
					name,
					kind,
					location: { uri }
				};
			}
			WorkspaceSymbol.create = create;
		})(WorkspaceSymbol || (WorkspaceSymbol = {}));
		(function(DocumentSymbol) {
			/**
			* Creates a new symbol information literal.
			*
			* @param name The name of the symbol.
			* @param detail The detail of the symbol.
			* @param kind The kind of the symbol.
			* @param range The range of the symbol.
			* @param selectionRange The selectionRange of the symbol.
			* @param children Children of the symbol.
			*/
			function create(name, detail, kind, range, selectionRange, children) {
				let result = {
					name,
					detail,
					kind,
					range,
					selectionRange
				};
				if (children !== void 0) result.children = children;
				return result;
			}
			DocumentSymbol.create = create;
			/**
			* Checks whether the given literal conforms to the {@link DocumentSymbol} interface.
			*/
			function is(value) {
				let candidate = value;
				return candidate && Is.string(candidate.name) && Is.number(candidate.kind) && Range.is(candidate.range) && Range.is(candidate.selectionRange) && (candidate.detail === void 0 || Is.string(candidate.detail)) && (candidate.deprecated === void 0 || Is.boolean(candidate.deprecated)) && (candidate.children === void 0 || Array.isArray(candidate.children)) && (candidate.tags === void 0 || Array.isArray(candidate.tags));
			}
			DocumentSymbol.is = is;
		})(DocumentSymbol || (DocumentSymbol = {}));
		(function(CodeActionKind) {
			/**
			* Empty kind.
			*/
			CodeActionKind.Empty = "";
			/**
			* Base kind for quickfix actions: 'quickfix'
			*/
			CodeActionKind.QuickFix = "quickfix";
			/**
			* Base kind for refactoring actions: 'refactor'
			*/
			CodeActionKind.Refactor = "refactor";
			/**
			* Base kind for refactoring extraction actions: 'refactor.extract'
			*
			* Example extract actions:
			*
			* - Extract method
			* - Extract function
			* - Extract variable
			* - Extract interface from class
			* - ...
			*/
			CodeActionKind.RefactorExtract = "refactor.extract";
			/**
			* Base kind for refactoring inline actions: 'refactor.inline'
			*
			* Example inline actions:
			*
			* - Inline function
			* - Inline variable
			* - Inline constant
			* - ...
			*/
			CodeActionKind.RefactorInline = "refactor.inline";
			/**
			* Base kind for refactoring rewrite actions: 'refactor.rewrite'
			*
			* Example rewrite actions:
			*
			* - Convert JavaScript function to class
			* - Add or remove parameter
			* - Encapsulate field
			* - Make method static
			* - Move method to base class
			* - ...
			*/
			CodeActionKind.RefactorRewrite = "refactor.rewrite";
			/**
			* Base kind for source actions: `source`
			*
			* Source code actions apply to the entire file.
			*/
			CodeActionKind.Source = "source";
			/**
			* Base kind for an organize imports source action: `source.organizeImports`
			*/
			CodeActionKind.SourceOrganizeImports = "source.organizeImports";
			/**
			* Base kind for auto-fix source actions: `source.fixAll`.
			*
			* Fix all actions automatically fix errors that have a clear fix that do not require user input.
			* They should not suppress errors or perform unsafe fixes such as generating new types or classes.
			*
			* @since 3.15.0
			*/
			CodeActionKind.SourceFixAll = "source.fixAll";
		})(CodeActionKind || (CodeActionKind = {}));
		(function(CodeActionTriggerKind) {
			/**
			* Code actions were explicitly requested by the user or by an extension.
			*/
			CodeActionTriggerKind.Invoked = 1;
			/**
			* Code actions were requested automatically.
			*
			* This typically happens when current selection in a file changes, but can
			* also be triggered when file content changes.
			*/
			CodeActionTriggerKind.Automatic = 2;
		})(CodeActionTriggerKind || (CodeActionTriggerKind = {}));
		(function(CodeActionContext) {
			/**
			* Creates a new CodeActionContext literal.
			*/
			function create(diagnostics, only, triggerKind) {
				let result = { diagnostics };
				if (only !== void 0 && only !== null) result.only = only;
				if (triggerKind !== void 0 && triggerKind !== null) result.triggerKind = triggerKind;
				return result;
			}
			CodeActionContext.create = create;
			/**
			* Checks whether the given literal conforms to the {@link CodeActionContext} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is) && (candidate.only === void 0 || Is.typedArray(candidate.only, Is.string)) && (candidate.triggerKind === void 0 || candidate.triggerKind === CodeActionTriggerKind.Invoked || candidate.triggerKind === CodeActionTriggerKind.Automatic);
			}
			CodeActionContext.is = is;
		})(CodeActionContext || (CodeActionContext = {}));
		(function(CodeAction) {
			function create(title, kindOrCommandOrEdit, kind) {
				let result = { title };
				let checkKind = true;
				if (typeof kindOrCommandOrEdit === "string") {
					checkKind = false;
					result.kind = kindOrCommandOrEdit;
				} else if (Command.is(kindOrCommandOrEdit)) result.command = kindOrCommandOrEdit;
				else result.edit = kindOrCommandOrEdit;
				if (checkKind && kind !== void 0) result.kind = kind;
				return result;
			}
			CodeAction.create = create;
			function is(value) {
				let candidate = value;
				return candidate && Is.string(candidate.title) && (candidate.diagnostics === void 0 || Is.typedArray(candidate.diagnostics, Diagnostic.is)) && (candidate.kind === void 0 || Is.string(candidate.kind)) && (candidate.edit !== void 0 || candidate.command !== void 0) && (candidate.command === void 0 || Command.is(candidate.command)) && (candidate.isPreferred === void 0 || Is.boolean(candidate.isPreferred)) && (candidate.edit === void 0 || WorkspaceEdit.is(candidate.edit));
			}
			CodeAction.is = is;
		})(CodeAction || (CodeAction = {}));
		(function(CodeLens) {
			/**
			* Creates a new CodeLens literal.
			*/
			function create(range, data) {
				let result = { range };
				if (Is.defined(data)) result.data = data;
				return result;
			}
			CodeLens.create = create;
			/**
			* Checks whether the given literal conforms to the {@link CodeLens} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
			}
			CodeLens.is = is;
		})(CodeLens || (CodeLens = {}));
		(function(FormattingOptions) {
			/**
			* Creates a new FormattingOptions literal.
			*/
			function create(tabSize, insertSpaces) {
				return {
					tabSize,
					insertSpaces
				};
			}
			FormattingOptions.create = create;
			/**
			* Checks whether the given literal conforms to the {@link FormattingOptions} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.uinteger(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
			}
			FormattingOptions.is = is;
		})(FormattingOptions || (FormattingOptions = {}));
		(function(DocumentLink) {
			/**
			* Creates a new DocumentLink literal.
			*/
			function create(range, target, data) {
				return {
					range,
					target,
					data
				};
			}
			DocumentLink.create = create;
			/**
			* Checks whether the given literal conforms to the {@link DocumentLink} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
			}
			DocumentLink.is = is;
		})(DocumentLink || (DocumentLink = {}));
		(function(SelectionRange) {
			/**
			* Creates a new SelectionRange
			* @param range the range.
			* @param parent an optional parent.
			*/
			function create(range, parent) {
				return {
					range,
					parent
				};
			}
			SelectionRange.create = create;
			function is(value) {
				let candidate = value;
				return Is.objectLiteral(candidate) && Range.is(candidate.range) && (candidate.parent === void 0 || SelectionRange.is(candidate.parent));
			}
			SelectionRange.is = is;
		})(SelectionRange || (SelectionRange = {}));
		(function(SemanticTokenTypes) {
			SemanticTokenTypes["namespace"] = "namespace";
			/**
			* Represents a generic type. Acts as a fallback for types which can't be mapped to
			* a specific type like class or enum.
			*/
			SemanticTokenTypes["type"] = "type";
			SemanticTokenTypes["class"] = "class";
			SemanticTokenTypes["enum"] = "enum";
			SemanticTokenTypes["interface"] = "interface";
			SemanticTokenTypes["struct"] = "struct";
			SemanticTokenTypes["typeParameter"] = "typeParameter";
			SemanticTokenTypes["parameter"] = "parameter";
			SemanticTokenTypes["variable"] = "variable";
			SemanticTokenTypes["property"] = "property";
			SemanticTokenTypes["enumMember"] = "enumMember";
			SemanticTokenTypes["event"] = "event";
			SemanticTokenTypes["function"] = "function";
			SemanticTokenTypes["method"] = "method";
			SemanticTokenTypes["macro"] = "macro";
			SemanticTokenTypes["keyword"] = "keyword";
			SemanticTokenTypes["modifier"] = "modifier";
			SemanticTokenTypes["comment"] = "comment";
			SemanticTokenTypes["string"] = "string";
			SemanticTokenTypes["number"] = "number";
			SemanticTokenTypes["regexp"] = "regexp";
			SemanticTokenTypes["operator"] = "operator";
			/**
			* @since 3.17.0
			*/
			SemanticTokenTypes["decorator"] = "decorator";
		})(SemanticTokenTypes || (SemanticTokenTypes = {}));
		(function(SemanticTokenModifiers) {
			SemanticTokenModifiers["declaration"] = "declaration";
			SemanticTokenModifiers["definition"] = "definition";
			SemanticTokenModifiers["readonly"] = "readonly";
			SemanticTokenModifiers["static"] = "static";
			SemanticTokenModifiers["deprecated"] = "deprecated";
			SemanticTokenModifiers["abstract"] = "abstract";
			SemanticTokenModifiers["async"] = "async";
			SemanticTokenModifiers["modification"] = "modification";
			SemanticTokenModifiers["documentation"] = "documentation";
			SemanticTokenModifiers["defaultLibrary"] = "defaultLibrary";
		})(SemanticTokenModifiers || (SemanticTokenModifiers = {}));
		(function(SemanticTokens) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && (candidate.resultId === void 0 || typeof candidate.resultId === "string") && Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === "number");
			}
			SemanticTokens.is = is;
		})(SemanticTokens || (SemanticTokens = {}));
		(function(InlineValueText) {
			/**
			* Creates a new InlineValueText literal.
			*/
			function create(range, text) {
				return {
					range,
					text
				};
			}
			InlineValueText.create = create;
			function is(value) {
				const candidate = value;
				return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && Is.string(candidate.text);
			}
			InlineValueText.is = is;
		})(InlineValueText || (InlineValueText = {}));
		(function(InlineValueVariableLookup) {
			/**
			* Creates a new InlineValueText literal.
			*/
			function create(range, variableName, caseSensitiveLookup) {
				return {
					range,
					variableName,
					caseSensitiveLookup
				};
			}
			InlineValueVariableLookup.create = create;
			function is(value) {
				const candidate = value;
				return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && Is.boolean(candidate.caseSensitiveLookup) && (Is.string(candidate.variableName) || candidate.variableName === void 0);
			}
			InlineValueVariableLookup.is = is;
		})(InlineValueVariableLookup || (InlineValueVariableLookup = {}));
		(function(InlineValueEvaluatableExpression) {
			/**
			* Creates a new InlineValueEvaluatableExpression literal.
			*/
			function create(range, expression) {
				return {
					range,
					expression
				};
			}
			InlineValueEvaluatableExpression.create = create;
			function is(value) {
				const candidate = value;
				return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && (Is.string(candidate.expression) || candidate.expression === void 0);
			}
			InlineValueEvaluatableExpression.is = is;
		})(InlineValueEvaluatableExpression || (InlineValueEvaluatableExpression = {}));
		(function(InlineValueContext) {
			/**
			* Creates a new InlineValueContext literal.
			*/
			function create(frameId, stoppedLocation) {
				return {
					frameId,
					stoppedLocation
				};
			}
			InlineValueContext.create = create;
			/**
			* Checks whether the given literal conforms to the {@link InlineValueContext} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is.defined(candidate) && Range.is(value.stoppedLocation);
			}
			InlineValueContext.is = is;
		})(InlineValueContext || (InlineValueContext = {}));
		(function(InlayHintKind) {
			/**
			* An inlay hint that for a type annotation.
			*/
			InlayHintKind.Type = 1;
			/**
			* An inlay hint that is for a parameter.
			*/
			InlayHintKind.Parameter = 2;
			function is(value) {
				return value === 1 || value === 2;
			}
			InlayHintKind.is = is;
		})(InlayHintKind || (InlayHintKind = {}));
		(function(InlayHintLabelPart) {
			function create(value) {
				return { value };
			}
			InlayHintLabelPart.create = create;
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip) || MarkupContent$1.is(candidate.tooltip)) && (candidate.location === void 0 || Location.is(candidate.location)) && (candidate.command === void 0 || Command.is(candidate.command));
			}
			InlayHintLabelPart.is = is;
		})(InlayHintLabelPart || (InlayHintLabelPart = {}));
		(function(InlayHint) {
			function create(position, label, kind) {
				const result = {
					position,
					label
				};
				if (kind !== void 0) result.kind = kind;
				return result;
			}
			InlayHint.create = create;
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Position.is(candidate.position) && (Is.string(candidate.label) || Is.typedArray(candidate.label, InlayHintLabelPart.is)) && (candidate.kind === void 0 || InlayHintKind.is(candidate.kind)) && candidate.textEdits === void 0 || Is.typedArray(candidate.textEdits, TextEdit.is) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip) || MarkupContent$1.is(candidate.tooltip)) && (candidate.paddingLeft === void 0 || Is.boolean(candidate.paddingLeft)) && (candidate.paddingRight === void 0 || Is.boolean(candidate.paddingRight));
			}
			InlayHint.is = is;
		})(InlayHint || (InlayHint = {}));
		(function(StringValue) {
			function createSnippet(value) {
				return {
					kind: "snippet",
					value
				};
			}
			StringValue.createSnippet = createSnippet;
		})(StringValue || (StringValue = {}));
		(function(InlineCompletionItem) {
			function create(insertText, filterText, range, command) {
				return {
					insertText,
					filterText,
					range,
					command
				};
			}
			InlineCompletionItem.create = create;
		})(InlineCompletionItem || (InlineCompletionItem = {}));
		(function(InlineCompletionList) {
			function create(items) {
				return { items };
			}
			InlineCompletionList.create = create;
		})(InlineCompletionList || (InlineCompletionList = {}));
		(function(InlineCompletionTriggerKind) {
			/**
			* Completion was triggered explicitly by a user gesture.
			*/
			InlineCompletionTriggerKind.Invoked = 0;
			/**
			* Completion was triggered automatically while editing.
			*/
			InlineCompletionTriggerKind.Automatic = 1;
		})(InlineCompletionTriggerKind || (InlineCompletionTriggerKind = {}));
		(function(SelectedCompletionInfo) {
			function create(range, text) {
				return {
					range,
					text
				};
			}
			SelectedCompletionInfo.create = create;
		})(SelectedCompletionInfo || (SelectedCompletionInfo = {}));
		(function(InlineCompletionContext) {
			function create(triggerKind, selectedCompletionInfo) {
				return {
					triggerKind,
					selectedCompletionInfo
				};
			}
			InlineCompletionContext.create = create;
		})(InlineCompletionContext || (InlineCompletionContext = {}));
		(function(WorkspaceFolder) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && URI.is(candidate.uri) && Is.string(candidate.name);
			}
			WorkspaceFolder.is = is;
		})(WorkspaceFolder || (WorkspaceFolder = {}));
		EOL = [
			"\n",
			"\r\n",
			"\r"
		];
		(function(TextDocument) {
			/**
			* Creates a new ITextDocument literal from the given uri and content.
			* @param uri The document's uri.
			* @param languageId The document's language Id.
			* @param version The document's version.
			* @param content The document's content.
			*/
			function create(uri, languageId, version, content) {
				return new FullTextDocument(uri, languageId, version, content);
			}
			TextDocument.create = create;
			/**
			* Checks whether the given literal conforms to the {@link ITextDocument} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.uinteger(candidate.lineCount) && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
			}
			TextDocument.is = is;
			function applyEdits(document, edits) {
				let text = document.getText();
				let sortedEdits = mergeSort(edits, (a, b) => {
					let diff = a.range.start.line - b.range.start.line;
					if (diff === 0) return a.range.start.character - b.range.start.character;
					return diff;
				});
				let lastModifiedOffset = text.length;
				for (let i = sortedEdits.length - 1; i >= 0; i--) {
					let e = sortedEdits[i];
					let startOffset = document.offsetAt(e.range.start);
					let endOffset = document.offsetAt(e.range.end);
					if (endOffset <= lastModifiedOffset) text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
					else throw new Error("Overlapping edit");
					lastModifiedOffset = startOffset;
				}
				return text;
			}
			TextDocument.applyEdits = applyEdits;
			function mergeSort(data, compare) {
				if (data.length <= 1) return data;
				const p = data.length / 2 | 0;
				const left = data.slice(0, p);
				const right = data.slice(p);
				mergeSort(left, compare);
				mergeSort(right, compare);
				let leftIdx = 0;
				let rightIdx = 0;
				let i = 0;
				while (leftIdx < left.length && rightIdx < right.length) if (compare(left[leftIdx], right[rightIdx]) <= 0) data[i++] = left[leftIdx++];
				else data[i++] = right[rightIdx++];
				while (leftIdx < left.length) data[i++] = left[leftIdx++];
				while (rightIdx < right.length) data[i++] = right[rightIdx++];
				return data;
			}
		})(TextDocument || (TextDocument = {}));
		FullTextDocument = class {
			constructor(uri, languageId, version, content) {
				this._uri = uri;
				this._languageId = languageId;
				this._version = version;
				this._content = content;
				this._lineOffsets = void 0;
			}
			get uri() {
				return this._uri;
			}
			get languageId() {
				return this._languageId;
			}
			get version() {
				return this._version;
			}
			getText(range) {
				if (range) {
					let start = this.offsetAt(range.start);
					let end = this.offsetAt(range.end);
					return this._content.substring(start, end);
				}
				return this._content;
			}
			update(event, version) {
				this._content = event.text;
				this._version = version;
				this._lineOffsets = void 0;
			}
			getLineOffsets() {
				if (this._lineOffsets === void 0) {
					let lineOffsets = [];
					let text = this._content;
					let isLineStart = true;
					for (let i = 0; i < text.length; i++) {
						if (isLineStart) {
							lineOffsets.push(i);
							isLineStart = false;
						}
						let ch = text.charAt(i);
						isLineStart = ch === "\r" || ch === "\n";
						if (ch === "\r" && i + 1 < text.length && text.charAt(i + 1) === "\n") i++;
					}
					if (isLineStart && text.length > 0) lineOffsets.push(text.length);
					this._lineOffsets = lineOffsets;
				}
				return this._lineOffsets;
			}
			positionAt(offset) {
				offset = Math.max(Math.min(offset, this._content.length), 0);
				let lineOffsets = this.getLineOffsets();
				let low = 0, high = lineOffsets.length;
				if (high === 0) return Position.create(0, offset);
				while (low < high) {
					let mid = Math.floor((low + high) / 2);
					if (lineOffsets[mid] > offset) high = mid;
					else low = mid + 1;
				}
				let line = low - 1;
				return Position.create(line, offset - lineOffsets[line]);
			}
			offsetAt(position) {
				let lineOffsets = this.getLineOffsets();
				if (position.line >= lineOffsets.length) return this._content.length;
				else if (position.line < 0) return 0;
				let lineOffset = lineOffsets[position.line];
				let nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
				return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
			}
			get lineCount() {
				return this.getLineOffsets().length;
			}
		};
		(function(Is) {
			const toString = Object.prototype.toString;
			function defined(value) {
				return typeof value !== "undefined";
			}
			Is.defined = defined;
			function undefined(value) {
				return typeof value === "undefined";
			}
			Is.undefined = undefined;
			function boolean(value) {
				return value === true || value === false;
			}
			Is.boolean = boolean;
			function string(value) {
				return toString.call(value) === "[object String]";
			}
			Is.string = string;
			function number(value) {
				return toString.call(value) === "[object Number]";
			}
			Is.number = number;
			function numberRange(value, min, max) {
				return toString.call(value) === "[object Number]" && min <= value && value <= max;
			}
			Is.numberRange = numberRange;
			function integer(value) {
				return toString.call(value) === "[object Number]" && -2147483648 <= value && value <= 2147483647;
			}
			Is.integer = integer;
			function uinteger(value) {
				return toString.call(value) === "[object Number]" && 0 <= value && value <= 2147483647;
			}
			Is.uinteger = uinteger;
			function func(value) {
				return toString.call(value) === "[object Function]";
			}
			Is.func = func;
			function objectLiteral(value) {
				return value !== null && typeof value === "object";
			}
			Is.objectLiteral = objectLiteral;
			function typedArray(value, check) {
				return Array.isArray(value) && value.every(check);
			}
			Is.typedArray = typedArray;
		})(Is || (Is = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/messages.js
	var require_messages = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ProtocolNotificationType = exports.ProtocolNotificationType0 = exports.ProtocolRequestType = exports.ProtocolRequestType0 = exports.RegistrationType = exports.MessageDirection = void 0;
		var vscode_jsonrpc_1 = require_main$1();
		var MessageDirection;
		(function(MessageDirection) {
			MessageDirection["clientToServer"] = "clientToServer";
			MessageDirection["serverToClient"] = "serverToClient";
			MessageDirection["both"] = "both";
		})(MessageDirection || (exports.MessageDirection = MessageDirection = {}));
		var RegistrationType = class {
			constructor(method) {
				this.method = method;
			}
		};
		exports.RegistrationType = RegistrationType;
		var ProtocolRequestType0 = class extends vscode_jsonrpc_1.RequestType0 {
			constructor(method) {
				super(method);
			}
		};
		exports.ProtocolRequestType0 = ProtocolRequestType0;
		var ProtocolRequestType = class extends vscode_jsonrpc_1.RequestType {
			constructor(method) {
				super(method, vscode_jsonrpc_1.ParameterStructures.byName);
			}
		};
		exports.ProtocolRequestType = ProtocolRequestType;
		var ProtocolNotificationType0 = class extends vscode_jsonrpc_1.NotificationType0 {
			constructor(method) {
				super(method);
			}
		};
		exports.ProtocolNotificationType0 = ProtocolNotificationType0;
		var ProtocolNotificationType = class extends vscode_jsonrpc_1.NotificationType {
			constructor(method) {
				super(method, vscode_jsonrpc_1.ParameterStructures.byName);
			}
		};
		exports.ProtocolNotificationType = ProtocolNotificationType;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/utils/is.js
	var require_is = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.objectLiteral = exports.typedArray = exports.stringArray = exports.array = exports.func = exports.error = exports.number = exports.string = exports.boolean = void 0;
		function boolean(value) {
			return value === true || value === false;
		}
		exports.boolean = boolean;
		function string(value) {
			return typeof value === "string" || value instanceof String;
		}
		exports.string = string;
		function number(value) {
			return typeof value === "number" || value instanceof Number;
		}
		exports.number = number;
		function error(value) {
			return value instanceof Error;
		}
		exports.error = error;
		function func(value) {
			return typeof value === "function";
		}
		exports.func = func;
		function array(value) {
			return Array.isArray(value);
		}
		exports.array = array;
		function stringArray(value) {
			return array(value) && value.every((elem) => string(elem));
		}
		exports.stringArray = stringArray;
		function typedArray(value, check) {
			return Array.isArray(value) && value.every(check);
		}
		exports.typedArray = typedArray;
		function objectLiteral(value) {
			return value !== null && typeof value === "object";
		}
		exports.objectLiteral = objectLiteral;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.implementation.js
	var require_protocol_implementation = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ImplementationRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to resolve the implementation locations of a symbol at a given text
		* document position. The request's parameter is of type {@link TextDocumentPositionParams}
		* the response is of type {@link Definition} or a Thenable that resolves to such.
		*/
		var ImplementationRequest;
		(function(ImplementationRequest) {
			ImplementationRequest.method = "textDocument/implementation";
			ImplementationRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			ImplementationRequest.type = new messages_1.ProtocolRequestType(ImplementationRequest.method);
		})(ImplementationRequest || (exports.ImplementationRequest = ImplementationRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.typeDefinition.js
	var require_protocol_typeDefinition = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.TypeDefinitionRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to resolve the type definition locations of a symbol at a given text
		* document position. The request's parameter is of type {@link TextDocumentPositionParams}
		* the response is of type {@link Definition} or a Thenable that resolves to such.
		*/
		var TypeDefinitionRequest;
		(function(TypeDefinitionRequest) {
			TypeDefinitionRequest.method = "textDocument/typeDefinition";
			TypeDefinitionRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			TypeDefinitionRequest.type = new messages_1.ProtocolRequestType(TypeDefinitionRequest.method);
		})(TypeDefinitionRequest || (exports.TypeDefinitionRequest = TypeDefinitionRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.workspaceFolder.js
	var require_protocol_workspaceFolder = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.DidChangeWorkspaceFoldersNotification = exports.WorkspaceFoldersRequest = void 0;
		var messages_1 = require_messages();
		/**
		* The `workspace/workspaceFolders` is sent from the server to the client to fetch the open workspace folders.
		*/
		var WorkspaceFoldersRequest;
		(function(WorkspaceFoldersRequest) {
			WorkspaceFoldersRequest.method = "workspace/workspaceFolders";
			WorkspaceFoldersRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			WorkspaceFoldersRequest.type = new messages_1.ProtocolRequestType0(WorkspaceFoldersRequest.method);
		})(WorkspaceFoldersRequest || (exports.WorkspaceFoldersRequest = WorkspaceFoldersRequest = {}));
		/**
		* The `workspace/didChangeWorkspaceFolders` notification is sent from the client to the server when the workspace
		* folder configuration changes.
		*/
		var DidChangeWorkspaceFoldersNotification;
		(function(DidChangeWorkspaceFoldersNotification) {
			DidChangeWorkspaceFoldersNotification.method = "workspace/didChangeWorkspaceFolders";
			DidChangeWorkspaceFoldersNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidChangeWorkspaceFoldersNotification.type = new messages_1.ProtocolNotificationType(DidChangeWorkspaceFoldersNotification.method);
		})(DidChangeWorkspaceFoldersNotification || (exports.DidChangeWorkspaceFoldersNotification = DidChangeWorkspaceFoldersNotification = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.configuration.js
	var require_protocol_configuration = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ConfigurationRequest = void 0;
		var messages_1 = require_messages();
		/**
		* The 'workspace/configuration' request is sent from the server to the client to fetch a certain
		* configuration setting.
		*
		* This pull model replaces the old push model were the client signaled configuration change via an
		* event. If the server still needs to react to configuration changes (since the server caches the
		* result of `workspace/configuration` requests) the server should register for an empty configuration
		* change event and empty the cache if such an event is received.
		*/
		var ConfigurationRequest;
		(function(ConfigurationRequest) {
			ConfigurationRequest.method = "workspace/configuration";
			ConfigurationRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			ConfigurationRequest.type = new messages_1.ProtocolRequestType(ConfigurationRequest.method);
		})(ConfigurationRequest || (exports.ConfigurationRequest = ConfigurationRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.colorProvider.js
	var require_protocol_colorProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ColorPresentationRequest = exports.DocumentColorRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to list all color symbols found in a given text document. The request's
		* parameter is of type {@link DocumentColorParams} the
		* response is of type {@link ColorInformation ColorInformation[]} or a Thenable
		* that resolves to such.
		*/
		var DocumentColorRequest;
		(function(DocumentColorRequest) {
			DocumentColorRequest.method = "textDocument/documentColor";
			DocumentColorRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentColorRequest.type = new messages_1.ProtocolRequestType(DocumentColorRequest.method);
		})(DocumentColorRequest || (exports.DocumentColorRequest = DocumentColorRequest = {}));
		/**
		* A request to list all presentation for a color. The request's
		* parameter is of type {@link ColorPresentationParams} the
		* response is of type {@link ColorInformation ColorInformation[]} or a Thenable
		* that resolves to such.
		*/
		var ColorPresentationRequest;
		(function(ColorPresentationRequest) {
			ColorPresentationRequest.method = "textDocument/colorPresentation";
			ColorPresentationRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			ColorPresentationRequest.type = new messages_1.ProtocolRequestType(ColorPresentationRequest.method);
		})(ColorPresentationRequest || (exports.ColorPresentationRequest = ColorPresentationRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.foldingRange.js
	var require_protocol_foldingRange = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.FoldingRangeRefreshRequest = exports.FoldingRangeRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to provide folding ranges in a document. The request's
		* parameter is of type {@link FoldingRangeParams}, the
		* response is of type {@link FoldingRangeList} or a Thenable
		* that resolves to such.
		*/
		var FoldingRangeRequest;
		(function(FoldingRangeRequest) {
			FoldingRangeRequest.method = "textDocument/foldingRange";
			FoldingRangeRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			FoldingRangeRequest.type = new messages_1.ProtocolRequestType(FoldingRangeRequest.method);
		})(FoldingRangeRequest || (exports.FoldingRangeRequest = FoldingRangeRequest = {}));
		/**
		* @since 3.18.0
		* @proposed
		*/
		var FoldingRangeRefreshRequest;
		(function(FoldingRangeRefreshRequest) {
			FoldingRangeRefreshRequest.method = `workspace/foldingRange/refresh`;
			FoldingRangeRefreshRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			FoldingRangeRefreshRequest.type = new messages_1.ProtocolRequestType0(FoldingRangeRefreshRequest.method);
		})(FoldingRangeRefreshRequest || (exports.FoldingRangeRefreshRequest = FoldingRangeRefreshRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.declaration.js
	var require_protocol_declaration = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.DeclarationRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to resolve the type definition locations of a symbol at a given text
		* document position. The request's parameter is of type {@link TextDocumentPositionParams}
		* the response is of type {@link Declaration} or a typed array of {@link DeclarationLink}
		* or a Thenable that resolves to such.
		*/
		var DeclarationRequest;
		(function(DeclarationRequest) {
			DeclarationRequest.method = "textDocument/declaration";
			DeclarationRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DeclarationRequest.type = new messages_1.ProtocolRequestType(DeclarationRequest.method);
		})(DeclarationRequest || (exports.DeclarationRequest = DeclarationRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.selectionRange.js
	var require_protocol_selectionRange = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.SelectionRangeRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to provide selection ranges in a document. The request's
		* parameter is of type {@link SelectionRangeParams}, the
		* response is of type {@link SelectionRange SelectionRange[]} or a Thenable
		* that resolves to such.
		*/
		var SelectionRangeRequest;
		(function(SelectionRangeRequest) {
			SelectionRangeRequest.method = "textDocument/selectionRange";
			SelectionRangeRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			SelectionRangeRequest.type = new messages_1.ProtocolRequestType(SelectionRangeRequest.method);
		})(SelectionRangeRequest || (exports.SelectionRangeRequest = SelectionRangeRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.progress.js
	var require_protocol_progress = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.WorkDoneProgressCancelNotification = exports.WorkDoneProgressCreateRequest = exports.WorkDoneProgress = void 0;
		var vscode_jsonrpc_1 = require_main$1();
		var messages_1 = require_messages();
		var WorkDoneProgress;
		(function(WorkDoneProgress) {
			WorkDoneProgress.type = new vscode_jsonrpc_1.ProgressType();
			function is(value) {
				return value === WorkDoneProgress.type;
			}
			WorkDoneProgress.is = is;
		})(WorkDoneProgress || (exports.WorkDoneProgress = WorkDoneProgress = {}));
		/**
		* The `window/workDoneProgress/create` request is sent from the server to the client to initiate progress
		* reporting from the server.
		*/
		var WorkDoneProgressCreateRequest;
		(function(WorkDoneProgressCreateRequest) {
			WorkDoneProgressCreateRequest.method = "window/workDoneProgress/create";
			WorkDoneProgressCreateRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			WorkDoneProgressCreateRequest.type = new messages_1.ProtocolRequestType(WorkDoneProgressCreateRequest.method);
		})(WorkDoneProgressCreateRequest || (exports.WorkDoneProgressCreateRequest = WorkDoneProgressCreateRequest = {}));
		/**
		* The `window/workDoneProgress/cancel` notification is sent from  the client to the server to cancel a progress
		* initiated on the server side.
		*/
		var WorkDoneProgressCancelNotification;
		(function(WorkDoneProgressCancelNotification) {
			WorkDoneProgressCancelNotification.method = "window/workDoneProgress/cancel";
			WorkDoneProgressCancelNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			WorkDoneProgressCancelNotification.type = new messages_1.ProtocolNotificationType(WorkDoneProgressCancelNotification.method);
		})(WorkDoneProgressCancelNotification || (exports.WorkDoneProgressCancelNotification = WorkDoneProgressCancelNotification = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.callHierarchy.js
	var require_protocol_callHierarchy = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.CallHierarchyOutgoingCallsRequest = exports.CallHierarchyIncomingCallsRequest = exports.CallHierarchyPrepareRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to result a `CallHierarchyItem` in a document at a given position.
		* Can be used as an input to an incoming or outgoing call hierarchy.
		*
		* @since 3.16.0
		*/
		var CallHierarchyPrepareRequest;
		(function(CallHierarchyPrepareRequest) {
			CallHierarchyPrepareRequest.method = "textDocument/prepareCallHierarchy";
			CallHierarchyPrepareRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CallHierarchyPrepareRequest.type = new messages_1.ProtocolRequestType(CallHierarchyPrepareRequest.method);
		})(CallHierarchyPrepareRequest || (exports.CallHierarchyPrepareRequest = CallHierarchyPrepareRequest = {}));
		/**
		* A request to resolve the incoming calls for a given `CallHierarchyItem`.
		*
		* @since 3.16.0
		*/
		var CallHierarchyIncomingCallsRequest;
		(function(CallHierarchyIncomingCallsRequest) {
			CallHierarchyIncomingCallsRequest.method = "callHierarchy/incomingCalls";
			CallHierarchyIncomingCallsRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CallHierarchyIncomingCallsRequest.type = new messages_1.ProtocolRequestType(CallHierarchyIncomingCallsRequest.method);
		})(CallHierarchyIncomingCallsRequest || (exports.CallHierarchyIncomingCallsRequest = CallHierarchyIncomingCallsRequest = {}));
		/**
		* A request to resolve the outgoing calls for a given `CallHierarchyItem`.
		*
		* @since 3.16.0
		*/
		var CallHierarchyOutgoingCallsRequest;
		(function(CallHierarchyOutgoingCallsRequest) {
			CallHierarchyOutgoingCallsRequest.method = "callHierarchy/outgoingCalls";
			CallHierarchyOutgoingCallsRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CallHierarchyOutgoingCallsRequest.type = new messages_1.ProtocolRequestType(CallHierarchyOutgoingCallsRequest.method);
		})(CallHierarchyOutgoingCallsRequest || (exports.CallHierarchyOutgoingCallsRequest = CallHierarchyOutgoingCallsRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.semanticTokens.js
	var require_protocol_semanticTokens = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.SemanticTokensRefreshRequest = exports.SemanticTokensRangeRequest = exports.SemanticTokensDeltaRequest = exports.SemanticTokensRequest = exports.SemanticTokensRegistrationType = exports.TokenFormat = void 0;
		var messages_1 = require_messages();
		var TokenFormat;
		(function(TokenFormat) {
			TokenFormat.Relative = "relative";
		})(TokenFormat || (exports.TokenFormat = TokenFormat = {}));
		var SemanticTokensRegistrationType;
		(function(SemanticTokensRegistrationType) {
			SemanticTokensRegistrationType.method = "textDocument/semanticTokens";
			SemanticTokensRegistrationType.type = new messages_1.RegistrationType(SemanticTokensRegistrationType.method);
		})(SemanticTokensRegistrationType || (exports.SemanticTokensRegistrationType = SemanticTokensRegistrationType = {}));
		/**
		* @since 3.16.0
		*/
		var SemanticTokensRequest;
		(function(SemanticTokensRequest) {
			SemanticTokensRequest.method = "textDocument/semanticTokens/full";
			SemanticTokensRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			SemanticTokensRequest.type = new messages_1.ProtocolRequestType(SemanticTokensRequest.method);
			SemanticTokensRequest.registrationMethod = SemanticTokensRegistrationType.method;
		})(SemanticTokensRequest || (exports.SemanticTokensRequest = SemanticTokensRequest = {}));
		/**
		* @since 3.16.0
		*/
		var SemanticTokensDeltaRequest;
		(function(SemanticTokensDeltaRequest) {
			SemanticTokensDeltaRequest.method = "textDocument/semanticTokens/full/delta";
			SemanticTokensDeltaRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			SemanticTokensDeltaRequest.type = new messages_1.ProtocolRequestType(SemanticTokensDeltaRequest.method);
			SemanticTokensDeltaRequest.registrationMethod = SemanticTokensRegistrationType.method;
		})(SemanticTokensDeltaRequest || (exports.SemanticTokensDeltaRequest = SemanticTokensDeltaRequest = {}));
		/**
		* @since 3.16.0
		*/
		var SemanticTokensRangeRequest;
		(function(SemanticTokensRangeRequest) {
			SemanticTokensRangeRequest.method = "textDocument/semanticTokens/range";
			SemanticTokensRangeRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			SemanticTokensRangeRequest.type = new messages_1.ProtocolRequestType(SemanticTokensRangeRequest.method);
			SemanticTokensRangeRequest.registrationMethod = SemanticTokensRegistrationType.method;
		})(SemanticTokensRangeRequest || (exports.SemanticTokensRangeRequest = SemanticTokensRangeRequest = {}));
		/**
		* @since 3.16.0
		*/
		var SemanticTokensRefreshRequest;
		(function(SemanticTokensRefreshRequest) {
			SemanticTokensRefreshRequest.method = `workspace/semanticTokens/refresh`;
			SemanticTokensRefreshRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			SemanticTokensRefreshRequest.type = new messages_1.ProtocolRequestType0(SemanticTokensRefreshRequest.method);
		})(SemanticTokensRefreshRequest || (exports.SemanticTokensRefreshRequest = SemanticTokensRefreshRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.showDocument.js
	var require_protocol_showDocument = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ShowDocumentRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to show a document. This request might open an
		* external program depending on the value of the URI to open.
		* For example a request to open `https://code.visualstudio.com/`
		* will very likely open the URI in a WEB browser.
		*
		* @since 3.16.0
		*/
		var ShowDocumentRequest;
		(function(ShowDocumentRequest) {
			ShowDocumentRequest.method = "window/showDocument";
			ShowDocumentRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			ShowDocumentRequest.type = new messages_1.ProtocolRequestType(ShowDocumentRequest.method);
		})(ShowDocumentRequest || (exports.ShowDocumentRequest = ShowDocumentRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.linkedEditingRange.js
	var require_protocol_linkedEditingRange = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.LinkedEditingRangeRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to provide ranges that can be edited together.
		*
		* @since 3.16.0
		*/
		var LinkedEditingRangeRequest;
		(function(LinkedEditingRangeRequest) {
			LinkedEditingRangeRequest.method = "textDocument/linkedEditingRange";
			LinkedEditingRangeRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			LinkedEditingRangeRequest.type = new messages_1.ProtocolRequestType(LinkedEditingRangeRequest.method);
		})(LinkedEditingRangeRequest || (exports.LinkedEditingRangeRequest = LinkedEditingRangeRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.fileOperations.js
	var require_protocol_fileOperations = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.WillDeleteFilesRequest = exports.DidDeleteFilesNotification = exports.DidRenameFilesNotification = exports.WillRenameFilesRequest = exports.DidCreateFilesNotification = exports.WillCreateFilesRequest = exports.FileOperationPatternKind = void 0;
		var messages_1 = require_messages();
		/**
		* A pattern kind describing if a glob pattern matches a file a folder or
		* both.
		*
		* @since 3.16.0
		*/
		var FileOperationPatternKind;
		(function(FileOperationPatternKind) {
			/**
			* The pattern matches a file only.
			*/
			FileOperationPatternKind.file = "file";
			/**
			* The pattern matches a folder only.
			*/
			FileOperationPatternKind.folder = "folder";
		})(FileOperationPatternKind || (exports.FileOperationPatternKind = FileOperationPatternKind = {}));
		/**
		* The will create files request is sent from the client to the server before files are actually
		* created as long as the creation is triggered from within the client.
		*
		* The request can return a `WorkspaceEdit` which will be applied to workspace before the
		* files are created. Hence the `WorkspaceEdit` can not manipulate the content of the file
		* to be created.
		*
		* @since 3.16.0
		*/
		var WillCreateFilesRequest;
		(function(WillCreateFilesRequest) {
			WillCreateFilesRequest.method = "workspace/willCreateFiles";
			WillCreateFilesRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			WillCreateFilesRequest.type = new messages_1.ProtocolRequestType(WillCreateFilesRequest.method);
		})(WillCreateFilesRequest || (exports.WillCreateFilesRequest = WillCreateFilesRequest = {}));
		/**
		* The did create files notification is sent from the client to the server when
		* files were created from within the client.
		*
		* @since 3.16.0
		*/
		var DidCreateFilesNotification;
		(function(DidCreateFilesNotification) {
			DidCreateFilesNotification.method = "workspace/didCreateFiles";
			DidCreateFilesNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidCreateFilesNotification.type = new messages_1.ProtocolNotificationType(DidCreateFilesNotification.method);
		})(DidCreateFilesNotification || (exports.DidCreateFilesNotification = DidCreateFilesNotification = {}));
		/**
		* The will rename files request is sent from the client to the server before files are actually
		* renamed as long as the rename is triggered from within the client.
		*
		* @since 3.16.0
		*/
		var WillRenameFilesRequest;
		(function(WillRenameFilesRequest) {
			WillRenameFilesRequest.method = "workspace/willRenameFiles";
			WillRenameFilesRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			WillRenameFilesRequest.type = new messages_1.ProtocolRequestType(WillRenameFilesRequest.method);
		})(WillRenameFilesRequest || (exports.WillRenameFilesRequest = WillRenameFilesRequest = {}));
		/**
		* The did rename files notification is sent from the client to the server when
		* files were renamed from within the client.
		*
		* @since 3.16.0
		*/
		var DidRenameFilesNotification;
		(function(DidRenameFilesNotification) {
			DidRenameFilesNotification.method = "workspace/didRenameFiles";
			DidRenameFilesNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidRenameFilesNotification.type = new messages_1.ProtocolNotificationType(DidRenameFilesNotification.method);
		})(DidRenameFilesNotification || (exports.DidRenameFilesNotification = DidRenameFilesNotification = {}));
		/**
		* The will delete files request is sent from the client to the server before files are actually
		* deleted as long as the deletion is triggered from within the client.
		*
		* @since 3.16.0
		*/
		var DidDeleteFilesNotification;
		(function(DidDeleteFilesNotification) {
			DidDeleteFilesNotification.method = "workspace/didDeleteFiles";
			DidDeleteFilesNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidDeleteFilesNotification.type = new messages_1.ProtocolNotificationType(DidDeleteFilesNotification.method);
		})(DidDeleteFilesNotification || (exports.DidDeleteFilesNotification = DidDeleteFilesNotification = {}));
		/**
		* The did delete files notification is sent from the client to the server when
		* files were deleted from within the client.
		*
		* @since 3.16.0
		*/
		var WillDeleteFilesRequest;
		(function(WillDeleteFilesRequest) {
			WillDeleteFilesRequest.method = "workspace/willDeleteFiles";
			WillDeleteFilesRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			WillDeleteFilesRequest.type = new messages_1.ProtocolRequestType(WillDeleteFilesRequest.method);
		})(WillDeleteFilesRequest || (exports.WillDeleteFilesRequest = WillDeleteFilesRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.moniker.js
	var require_protocol_moniker = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.MonikerRequest = exports.MonikerKind = exports.UniquenessLevel = void 0;
		var messages_1 = require_messages();
		/**
		* Moniker uniqueness level to define scope of the moniker.
		*
		* @since 3.16.0
		*/
		var UniquenessLevel;
		(function(UniquenessLevel) {
			/**
			* The moniker is only unique inside a document
			*/
			UniquenessLevel.document = "document";
			/**
			* The moniker is unique inside a project for which a dump got created
			*/
			UniquenessLevel.project = "project";
			/**
			* The moniker is unique inside the group to which a project belongs
			*/
			UniquenessLevel.group = "group";
			/**
			* The moniker is unique inside the moniker scheme.
			*/
			UniquenessLevel.scheme = "scheme";
			/**
			* The moniker is globally unique
			*/
			UniquenessLevel.global = "global";
		})(UniquenessLevel || (exports.UniquenessLevel = UniquenessLevel = {}));
		/**
		* The moniker kind.
		*
		* @since 3.16.0
		*/
		var MonikerKind;
		(function(MonikerKind) {
			/**
			* The moniker represent a symbol that is imported into a project
			*/
			MonikerKind.$import = "import";
			/**
			* The moniker represents a symbol that is exported from a project
			*/
			MonikerKind.$export = "export";
			/**
			* The moniker represents a symbol that is local to a project (e.g. a local
			* variable of a function, a class not visible outside the project, ...)
			*/
			MonikerKind.local = "local";
		})(MonikerKind || (exports.MonikerKind = MonikerKind = {}));
		/**
		* A request to get the moniker of a symbol at a given text document position.
		* The request parameter is of type {@link TextDocumentPositionParams}.
		* The response is of type {@link Moniker Moniker[]} or `null`.
		*/
		var MonikerRequest;
		(function(MonikerRequest) {
			MonikerRequest.method = "textDocument/moniker";
			MonikerRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			MonikerRequest.type = new messages_1.ProtocolRequestType(MonikerRequest.method);
		})(MonikerRequest || (exports.MonikerRequest = MonikerRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.typeHierarchy.js
	var require_protocol_typeHierarchy = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.TypeHierarchySubtypesRequest = exports.TypeHierarchySupertypesRequest = exports.TypeHierarchyPrepareRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to result a `TypeHierarchyItem` in a document at a given position.
		* Can be used as an input to a subtypes or supertypes type hierarchy.
		*
		* @since 3.17.0
		*/
		var TypeHierarchyPrepareRequest;
		(function(TypeHierarchyPrepareRequest) {
			TypeHierarchyPrepareRequest.method = "textDocument/prepareTypeHierarchy";
			TypeHierarchyPrepareRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			TypeHierarchyPrepareRequest.type = new messages_1.ProtocolRequestType(TypeHierarchyPrepareRequest.method);
		})(TypeHierarchyPrepareRequest || (exports.TypeHierarchyPrepareRequest = TypeHierarchyPrepareRequest = {}));
		/**
		* A request to resolve the supertypes for a given `TypeHierarchyItem`.
		*
		* @since 3.17.0
		*/
		var TypeHierarchySupertypesRequest;
		(function(TypeHierarchySupertypesRequest) {
			TypeHierarchySupertypesRequest.method = "typeHierarchy/supertypes";
			TypeHierarchySupertypesRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			TypeHierarchySupertypesRequest.type = new messages_1.ProtocolRequestType(TypeHierarchySupertypesRequest.method);
		})(TypeHierarchySupertypesRequest || (exports.TypeHierarchySupertypesRequest = TypeHierarchySupertypesRequest = {}));
		/**
		* A request to resolve the subtypes for a given `TypeHierarchyItem`.
		*
		* @since 3.17.0
		*/
		var TypeHierarchySubtypesRequest;
		(function(TypeHierarchySubtypesRequest) {
			TypeHierarchySubtypesRequest.method = "typeHierarchy/subtypes";
			TypeHierarchySubtypesRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			TypeHierarchySubtypesRequest.type = new messages_1.ProtocolRequestType(TypeHierarchySubtypesRequest.method);
		})(TypeHierarchySubtypesRequest || (exports.TypeHierarchySubtypesRequest = TypeHierarchySubtypesRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlineValue.js
	var require_protocol_inlineValue = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.InlineValueRefreshRequest = exports.InlineValueRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to provide inline values in a document. The request's parameter is of
		* type {@link InlineValueParams}, the response is of type
		* {@link InlineValue InlineValue[]} or a Thenable that resolves to such.
		*
		* @since 3.17.0
		*/
		var InlineValueRequest;
		(function(InlineValueRequest) {
			InlineValueRequest.method = "textDocument/inlineValue";
			InlineValueRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			InlineValueRequest.type = new messages_1.ProtocolRequestType(InlineValueRequest.method);
		})(InlineValueRequest || (exports.InlineValueRequest = InlineValueRequest = {}));
		/**
		* @since 3.17.0
		*/
		var InlineValueRefreshRequest;
		(function(InlineValueRefreshRequest) {
			InlineValueRefreshRequest.method = `workspace/inlineValue/refresh`;
			InlineValueRefreshRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			InlineValueRefreshRequest.type = new messages_1.ProtocolRequestType0(InlineValueRefreshRequest.method);
		})(InlineValueRefreshRequest || (exports.InlineValueRefreshRequest = InlineValueRefreshRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlayHint.js
	var require_protocol_inlayHint = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.InlayHintRefreshRequest = exports.InlayHintResolveRequest = exports.InlayHintRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to provide inlay hints in a document. The request's parameter is of
		* type {@link InlayHintsParams}, the response is of type
		* {@link InlayHint InlayHint[]} or a Thenable that resolves to such.
		*
		* @since 3.17.0
		*/
		var InlayHintRequest;
		(function(InlayHintRequest) {
			InlayHintRequest.method = "textDocument/inlayHint";
			InlayHintRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			InlayHintRequest.type = new messages_1.ProtocolRequestType(InlayHintRequest.method);
		})(InlayHintRequest || (exports.InlayHintRequest = InlayHintRequest = {}));
		/**
		* A request to resolve additional properties for an inlay hint.
		* The request's parameter is of type {@link InlayHint}, the response is
		* of type {@link InlayHint} or a Thenable that resolves to such.
		*
		* @since 3.17.0
		*/
		var InlayHintResolveRequest;
		(function(InlayHintResolveRequest) {
			InlayHintResolveRequest.method = "inlayHint/resolve";
			InlayHintResolveRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			InlayHintResolveRequest.type = new messages_1.ProtocolRequestType(InlayHintResolveRequest.method);
		})(InlayHintResolveRequest || (exports.InlayHintResolveRequest = InlayHintResolveRequest = {}));
		/**
		* @since 3.17.0
		*/
		var InlayHintRefreshRequest;
		(function(InlayHintRefreshRequest) {
			InlayHintRefreshRequest.method = `workspace/inlayHint/refresh`;
			InlayHintRefreshRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			InlayHintRefreshRequest.type = new messages_1.ProtocolRequestType0(InlayHintRefreshRequest.method);
		})(InlayHintRefreshRequest || (exports.InlayHintRefreshRequest = InlayHintRefreshRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.diagnostic.js
	var require_protocol_diagnostic = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.DiagnosticRefreshRequest = exports.WorkspaceDiagnosticRequest = exports.DocumentDiagnosticRequest = exports.DocumentDiagnosticReportKind = exports.DiagnosticServerCancellationData = void 0;
		var vscode_jsonrpc_1 = require_main$1();
		var Is = require_is();
		var messages_1 = require_messages();
		/**
		* @since 3.17.0
		*/
		var DiagnosticServerCancellationData;
		(function(DiagnosticServerCancellationData) {
			function is(value) {
				const candidate = value;
				return candidate && Is.boolean(candidate.retriggerRequest);
			}
			DiagnosticServerCancellationData.is = is;
		})(DiagnosticServerCancellationData || (exports.DiagnosticServerCancellationData = DiagnosticServerCancellationData = {}));
		/**
		* The document diagnostic report kinds.
		*
		* @since 3.17.0
		*/
		var DocumentDiagnosticReportKind;
		(function(DocumentDiagnosticReportKind) {
			/**
			* A diagnostic report with a full
			* set of problems.
			*/
			DocumentDiagnosticReportKind.Full = "full";
			/**
			* A report indicating that the last
			* returned report is still accurate.
			*/
			DocumentDiagnosticReportKind.Unchanged = "unchanged";
		})(DocumentDiagnosticReportKind || (exports.DocumentDiagnosticReportKind = DocumentDiagnosticReportKind = {}));
		/**
		* The document diagnostic request definition.
		*
		* @since 3.17.0
		*/
		var DocumentDiagnosticRequest;
		(function(DocumentDiagnosticRequest) {
			DocumentDiagnosticRequest.method = "textDocument/diagnostic";
			DocumentDiagnosticRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentDiagnosticRequest.type = new messages_1.ProtocolRequestType(DocumentDiagnosticRequest.method);
			DocumentDiagnosticRequest.partialResult = new vscode_jsonrpc_1.ProgressType();
		})(DocumentDiagnosticRequest || (exports.DocumentDiagnosticRequest = DocumentDiagnosticRequest = {}));
		/**
		* The workspace diagnostic request definition.
		*
		* @since 3.17.0
		*/
		var WorkspaceDiagnosticRequest;
		(function(WorkspaceDiagnosticRequest) {
			WorkspaceDiagnosticRequest.method = "workspace/diagnostic";
			WorkspaceDiagnosticRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			WorkspaceDiagnosticRequest.type = new messages_1.ProtocolRequestType(WorkspaceDiagnosticRequest.method);
			WorkspaceDiagnosticRequest.partialResult = new vscode_jsonrpc_1.ProgressType();
		})(WorkspaceDiagnosticRequest || (exports.WorkspaceDiagnosticRequest = WorkspaceDiagnosticRequest = {}));
		/**
		* The diagnostic refresh request definition.
		*
		* @since 3.17.0
		*/
		var DiagnosticRefreshRequest;
		(function(DiagnosticRefreshRequest) {
			DiagnosticRefreshRequest.method = `workspace/diagnostic/refresh`;
			DiagnosticRefreshRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			DiagnosticRefreshRequest.type = new messages_1.ProtocolRequestType0(DiagnosticRefreshRequest.method);
		})(DiagnosticRefreshRequest || (exports.DiagnosticRefreshRequest = DiagnosticRefreshRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.notebook.js
	var require_protocol_notebook = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.DidCloseNotebookDocumentNotification = exports.DidSaveNotebookDocumentNotification = exports.DidChangeNotebookDocumentNotification = exports.NotebookCellArrayChange = exports.DidOpenNotebookDocumentNotification = exports.NotebookDocumentSyncRegistrationType = exports.NotebookDocument = exports.NotebookCell = exports.ExecutionSummary = exports.NotebookCellKind = void 0;
		var vscode_languageserver_types_1 = (init_main(), __toCommonJS(main_exports));
		var Is = require_is();
		var messages_1 = require_messages();
		/**
		* A notebook cell kind.
		*
		* @since 3.17.0
		*/
		var NotebookCellKind;
		(function(NotebookCellKind) {
			/**
			* A markup-cell is formatted source that is used for display.
			*/
			NotebookCellKind.Markup = 1;
			/**
			* A code-cell is source code.
			*/
			NotebookCellKind.Code = 2;
			function is(value) {
				return value === 1 || value === 2;
			}
			NotebookCellKind.is = is;
		})(NotebookCellKind || (exports.NotebookCellKind = NotebookCellKind = {}));
		var ExecutionSummary;
		(function(ExecutionSummary) {
			function create(executionOrder, success) {
				const result = { executionOrder };
				if (success === true || success === false) result.success = success;
				return result;
			}
			ExecutionSummary.create = create;
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && vscode_languageserver_types_1.uinteger.is(candidate.executionOrder) && (candidate.success === void 0 || Is.boolean(candidate.success));
			}
			ExecutionSummary.is = is;
			function equals(one, other) {
				if (one === other) return true;
				if (one === null || one === void 0 || other === null || other === void 0) return false;
				return one.executionOrder === other.executionOrder && one.success === other.success;
			}
			ExecutionSummary.equals = equals;
		})(ExecutionSummary || (exports.ExecutionSummary = ExecutionSummary = {}));
		var NotebookCell;
		(function(NotebookCell) {
			function create(kind, document) {
				return {
					kind,
					document
				};
			}
			NotebookCell.create = create;
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && NotebookCellKind.is(candidate.kind) && vscode_languageserver_types_1.DocumentUri.is(candidate.document) && (candidate.metadata === void 0 || Is.objectLiteral(candidate.metadata));
			}
			NotebookCell.is = is;
			function diff(one, two) {
				const result = /* @__PURE__ */ new Set();
				if (one.document !== two.document) result.add("document");
				if (one.kind !== two.kind) result.add("kind");
				if (one.executionSummary !== two.executionSummary) result.add("executionSummary");
				if ((one.metadata !== void 0 || two.metadata !== void 0) && !equalsMetadata(one.metadata, two.metadata)) result.add("metadata");
				if ((one.executionSummary !== void 0 || two.executionSummary !== void 0) && !ExecutionSummary.equals(one.executionSummary, two.executionSummary)) result.add("executionSummary");
				return result;
			}
			NotebookCell.diff = diff;
			function equalsMetadata(one, other) {
				if (one === other) return true;
				if (one === null || one === void 0 || other === null || other === void 0) return false;
				if (typeof one !== typeof other) return false;
				if (typeof one !== "object") return false;
				const oneArray = Array.isArray(one);
				const otherArray = Array.isArray(other);
				if (oneArray !== otherArray) return false;
				if (oneArray && otherArray) {
					if (one.length !== other.length) return false;
					for (let i = 0; i < one.length; i++) if (!equalsMetadata(one[i], other[i])) return false;
				}
				if (Is.objectLiteral(one) && Is.objectLiteral(other)) {
					const oneKeys = Object.keys(one);
					const otherKeys = Object.keys(other);
					if (oneKeys.length !== otherKeys.length) return false;
					oneKeys.sort();
					otherKeys.sort();
					if (!equalsMetadata(oneKeys, otherKeys)) return false;
					for (let i = 0; i < oneKeys.length; i++) {
						const prop = oneKeys[i];
						if (!equalsMetadata(one[prop], other[prop])) return false;
					}
				}
				return true;
			}
		})(NotebookCell || (exports.NotebookCell = NotebookCell = {}));
		var NotebookDocument;
		(function(NotebookDocument) {
			function create(uri, notebookType, version, cells) {
				return {
					uri,
					notebookType,
					version,
					cells
				};
			}
			NotebookDocument.create = create;
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && Is.string(candidate.uri) && vscode_languageserver_types_1.integer.is(candidate.version) && Is.typedArray(candidate.cells, NotebookCell.is);
			}
			NotebookDocument.is = is;
		})(NotebookDocument || (exports.NotebookDocument = NotebookDocument = {}));
		var NotebookDocumentSyncRegistrationType;
		(function(NotebookDocumentSyncRegistrationType) {
			NotebookDocumentSyncRegistrationType.method = "notebookDocument/sync";
			NotebookDocumentSyncRegistrationType.messageDirection = messages_1.MessageDirection.clientToServer;
			NotebookDocumentSyncRegistrationType.type = new messages_1.RegistrationType(NotebookDocumentSyncRegistrationType.method);
		})(NotebookDocumentSyncRegistrationType || (exports.NotebookDocumentSyncRegistrationType = NotebookDocumentSyncRegistrationType = {}));
		/**
		* A notification sent when a notebook opens.
		*
		* @since 3.17.0
		*/
		var DidOpenNotebookDocumentNotification;
		(function(DidOpenNotebookDocumentNotification) {
			DidOpenNotebookDocumentNotification.method = "notebookDocument/didOpen";
			DidOpenNotebookDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidOpenNotebookDocumentNotification.type = new messages_1.ProtocolNotificationType(DidOpenNotebookDocumentNotification.method);
			DidOpenNotebookDocumentNotification.registrationMethod = NotebookDocumentSyncRegistrationType.method;
		})(DidOpenNotebookDocumentNotification || (exports.DidOpenNotebookDocumentNotification = DidOpenNotebookDocumentNotification = {}));
		var NotebookCellArrayChange;
		(function(NotebookCellArrayChange) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && vscode_languageserver_types_1.uinteger.is(candidate.start) && vscode_languageserver_types_1.uinteger.is(candidate.deleteCount) && (candidate.cells === void 0 || Is.typedArray(candidate.cells, NotebookCell.is));
			}
			NotebookCellArrayChange.is = is;
			function create(start, deleteCount, cells) {
				const result = {
					start,
					deleteCount
				};
				if (cells !== void 0) result.cells = cells;
				return result;
			}
			NotebookCellArrayChange.create = create;
		})(NotebookCellArrayChange || (exports.NotebookCellArrayChange = NotebookCellArrayChange = {}));
		var DidChangeNotebookDocumentNotification;
		(function(DidChangeNotebookDocumentNotification) {
			DidChangeNotebookDocumentNotification.method = "notebookDocument/didChange";
			DidChangeNotebookDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidChangeNotebookDocumentNotification.type = new messages_1.ProtocolNotificationType(DidChangeNotebookDocumentNotification.method);
			DidChangeNotebookDocumentNotification.registrationMethod = NotebookDocumentSyncRegistrationType.method;
		})(DidChangeNotebookDocumentNotification || (exports.DidChangeNotebookDocumentNotification = DidChangeNotebookDocumentNotification = {}));
		/**
		* A notification sent when a notebook document is saved.
		*
		* @since 3.17.0
		*/
		var DidSaveNotebookDocumentNotification;
		(function(DidSaveNotebookDocumentNotification) {
			DidSaveNotebookDocumentNotification.method = "notebookDocument/didSave";
			DidSaveNotebookDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidSaveNotebookDocumentNotification.type = new messages_1.ProtocolNotificationType(DidSaveNotebookDocumentNotification.method);
			DidSaveNotebookDocumentNotification.registrationMethod = NotebookDocumentSyncRegistrationType.method;
		})(DidSaveNotebookDocumentNotification || (exports.DidSaveNotebookDocumentNotification = DidSaveNotebookDocumentNotification = {}));
		/**
		* A notification sent when a notebook closes.
		*
		* @since 3.17.0
		*/
		var DidCloseNotebookDocumentNotification;
		(function(DidCloseNotebookDocumentNotification) {
			DidCloseNotebookDocumentNotification.method = "notebookDocument/didClose";
			DidCloseNotebookDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidCloseNotebookDocumentNotification.type = new messages_1.ProtocolNotificationType(DidCloseNotebookDocumentNotification.method);
			DidCloseNotebookDocumentNotification.registrationMethod = NotebookDocumentSyncRegistrationType.method;
		})(DidCloseNotebookDocumentNotification || (exports.DidCloseNotebookDocumentNotification = DidCloseNotebookDocumentNotification = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlineCompletion.js
	var require_protocol_inlineCompletion = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.InlineCompletionRequest = void 0;
		var messages_1 = require_messages();
		/**
		* A request to provide inline completions in a document. The request's parameter is of
		* type {@link InlineCompletionParams}, the response is of type
		* {@link InlineCompletion InlineCompletion[]} or a Thenable that resolves to such.
		*
		* @since 3.18.0
		* @proposed
		*/
		var InlineCompletionRequest;
		(function(InlineCompletionRequest) {
			InlineCompletionRequest.method = "textDocument/inlineCompletion";
			InlineCompletionRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			InlineCompletionRequest.type = new messages_1.ProtocolRequestType(InlineCompletionRequest.method);
		})(InlineCompletionRequest || (exports.InlineCompletionRequest = InlineCompletionRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/protocol.js
	var require_protocol = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.WorkspaceSymbolRequest = exports.CodeActionResolveRequest = exports.CodeActionRequest = exports.DocumentSymbolRequest = exports.DocumentHighlightRequest = exports.ReferencesRequest = exports.DefinitionRequest = exports.SignatureHelpRequest = exports.SignatureHelpTriggerKind = exports.HoverRequest = exports.CompletionResolveRequest = exports.CompletionRequest = exports.CompletionTriggerKind = exports.PublishDiagnosticsNotification = exports.WatchKind = exports.RelativePattern = exports.FileChangeType = exports.DidChangeWatchedFilesNotification = exports.WillSaveTextDocumentWaitUntilRequest = exports.WillSaveTextDocumentNotification = exports.TextDocumentSaveReason = exports.DidSaveTextDocumentNotification = exports.DidCloseTextDocumentNotification = exports.DidChangeTextDocumentNotification = exports.TextDocumentContentChangeEvent = exports.DidOpenTextDocumentNotification = exports.TextDocumentSyncKind = exports.TelemetryEventNotification = exports.LogMessageNotification = exports.ShowMessageRequest = exports.ShowMessageNotification = exports.MessageType = exports.DidChangeConfigurationNotification = exports.ExitNotification = exports.ShutdownRequest = exports.InitializedNotification = exports.InitializeErrorCodes = exports.InitializeRequest = exports.WorkDoneProgressOptions = exports.TextDocumentRegistrationOptions = exports.StaticRegistrationOptions = exports.PositionEncodingKind = exports.FailureHandlingKind = exports.ResourceOperationKind = exports.UnregistrationRequest = exports.RegistrationRequest = exports.DocumentSelector = exports.NotebookCellTextDocumentFilter = exports.NotebookDocumentFilter = exports.TextDocumentFilter = void 0;
		exports.MonikerRequest = exports.MonikerKind = exports.UniquenessLevel = exports.WillDeleteFilesRequest = exports.DidDeleteFilesNotification = exports.WillRenameFilesRequest = exports.DidRenameFilesNotification = exports.WillCreateFilesRequest = exports.DidCreateFilesNotification = exports.FileOperationPatternKind = exports.LinkedEditingRangeRequest = exports.ShowDocumentRequest = exports.SemanticTokensRegistrationType = exports.SemanticTokensRefreshRequest = exports.SemanticTokensRangeRequest = exports.SemanticTokensDeltaRequest = exports.SemanticTokensRequest = exports.TokenFormat = exports.CallHierarchyPrepareRequest = exports.CallHierarchyOutgoingCallsRequest = exports.CallHierarchyIncomingCallsRequest = exports.WorkDoneProgressCancelNotification = exports.WorkDoneProgressCreateRequest = exports.WorkDoneProgress = exports.SelectionRangeRequest = exports.DeclarationRequest = exports.FoldingRangeRefreshRequest = exports.FoldingRangeRequest = exports.ColorPresentationRequest = exports.DocumentColorRequest = exports.ConfigurationRequest = exports.DidChangeWorkspaceFoldersNotification = exports.WorkspaceFoldersRequest = exports.TypeDefinitionRequest = exports.ImplementationRequest = exports.ApplyWorkspaceEditRequest = exports.ExecuteCommandRequest = exports.PrepareRenameRequest = exports.RenameRequest = exports.PrepareSupportDefaultBehavior = exports.DocumentOnTypeFormattingRequest = exports.DocumentRangesFormattingRequest = exports.DocumentRangeFormattingRequest = exports.DocumentFormattingRequest = exports.DocumentLinkResolveRequest = exports.DocumentLinkRequest = exports.CodeLensRefreshRequest = exports.CodeLensResolveRequest = exports.CodeLensRequest = exports.WorkspaceSymbolResolveRequest = void 0;
		exports.InlineCompletionRequest = exports.DidCloseNotebookDocumentNotification = exports.DidSaveNotebookDocumentNotification = exports.DidChangeNotebookDocumentNotification = exports.NotebookCellArrayChange = exports.DidOpenNotebookDocumentNotification = exports.NotebookDocumentSyncRegistrationType = exports.NotebookDocument = exports.NotebookCell = exports.ExecutionSummary = exports.NotebookCellKind = exports.DiagnosticRefreshRequest = exports.WorkspaceDiagnosticRequest = exports.DocumentDiagnosticRequest = exports.DocumentDiagnosticReportKind = exports.DiagnosticServerCancellationData = exports.InlayHintRefreshRequest = exports.InlayHintResolveRequest = exports.InlayHintRequest = exports.InlineValueRefreshRequest = exports.InlineValueRequest = exports.TypeHierarchySupertypesRequest = exports.TypeHierarchySubtypesRequest = exports.TypeHierarchyPrepareRequest = void 0;
		var messages_1 = require_messages();
		var vscode_languageserver_types_1 = (init_main(), __toCommonJS(main_exports));
		var Is = require_is();
		var protocol_implementation_1 = require_protocol_implementation();
		Object.defineProperty(exports, "ImplementationRequest", {
			enumerable: true,
			get: function() {
				return protocol_implementation_1.ImplementationRequest;
			}
		});
		var protocol_typeDefinition_1 = require_protocol_typeDefinition();
		Object.defineProperty(exports, "TypeDefinitionRequest", {
			enumerable: true,
			get: function() {
				return protocol_typeDefinition_1.TypeDefinitionRequest;
			}
		});
		var protocol_workspaceFolder_1 = require_protocol_workspaceFolder();
		Object.defineProperty(exports, "WorkspaceFoldersRequest", {
			enumerable: true,
			get: function() {
				return protocol_workspaceFolder_1.WorkspaceFoldersRequest;
			}
		});
		Object.defineProperty(exports, "DidChangeWorkspaceFoldersNotification", {
			enumerable: true,
			get: function() {
				return protocol_workspaceFolder_1.DidChangeWorkspaceFoldersNotification;
			}
		});
		var protocol_configuration_1 = require_protocol_configuration();
		Object.defineProperty(exports, "ConfigurationRequest", {
			enumerable: true,
			get: function() {
				return protocol_configuration_1.ConfigurationRequest;
			}
		});
		var protocol_colorProvider_1 = require_protocol_colorProvider();
		Object.defineProperty(exports, "DocumentColorRequest", {
			enumerable: true,
			get: function() {
				return protocol_colorProvider_1.DocumentColorRequest;
			}
		});
		Object.defineProperty(exports, "ColorPresentationRequest", {
			enumerable: true,
			get: function() {
				return protocol_colorProvider_1.ColorPresentationRequest;
			}
		});
		var protocol_foldingRange_1 = require_protocol_foldingRange();
		Object.defineProperty(exports, "FoldingRangeRequest", {
			enumerable: true,
			get: function() {
				return protocol_foldingRange_1.FoldingRangeRequest;
			}
		});
		Object.defineProperty(exports, "FoldingRangeRefreshRequest", {
			enumerable: true,
			get: function() {
				return protocol_foldingRange_1.FoldingRangeRefreshRequest;
			}
		});
		var protocol_declaration_1 = require_protocol_declaration();
		Object.defineProperty(exports, "DeclarationRequest", {
			enumerable: true,
			get: function() {
				return protocol_declaration_1.DeclarationRequest;
			}
		});
		var protocol_selectionRange_1 = require_protocol_selectionRange();
		Object.defineProperty(exports, "SelectionRangeRequest", {
			enumerable: true,
			get: function() {
				return protocol_selectionRange_1.SelectionRangeRequest;
			}
		});
		var protocol_progress_1 = require_protocol_progress();
		Object.defineProperty(exports, "WorkDoneProgress", {
			enumerable: true,
			get: function() {
				return protocol_progress_1.WorkDoneProgress;
			}
		});
		Object.defineProperty(exports, "WorkDoneProgressCreateRequest", {
			enumerable: true,
			get: function() {
				return protocol_progress_1.WorkDoneProgressCreateRequest;
			}
		});
		Object.defineProperty(exports, "WorkDoneProgressCancelNotification", {
			enumerable: true,
			get: function() {
				return protocol_progress_1.WorkDoneProgressCancelNotification;
			}
		});
		var protocol_callHierarchy_1 = require_protocol_callHierarchy();
		Object.defineProperty(exports, "CallHierarchyIncomingCallsRequest", {
			enumerable: true,
			get: function() {
				return protocol_callHierarchy_1.CallHierarchyIncomingCallsRequest;
			}
		});
		Object.defineProperty(exports, "CallHierarchyOutgoingCallsRequest", {
			enumerable: true,
			get: function() {
				return protocol_callHierarchy_1.CallHierarchyOutgoingCallsRequest;
			}
		});
		Object.defineProperty(exports, "CallHierarchyPrepareRequest", {
			enumerable: true,
			get: function() {
				return protocol_callHierarchy_1.CallHierarchyPrepareRequest;
			}
		});
		var protocol_semanticTokens_1 = require_protocol_semanticTokens();
		Object.defineProperty(exports, "TokenFormat", {
			enumerable: true,
			get: function() {
				return protocol_semanticTokens_1.TokenFormat;
			}
		});
		Object.defineProperty(exports, "SemanticTokensRequest", {
			enumerable: true,
			get: function() {
				return protocol_semanticTokens_1.SemanticTokensRequest;
			}
		});
		Object.defineProperty(exports, "SemanticTokensDeltaRequest", {
			enumerable: true,
			get: function() {
				return protocol_semanticTokens_1.SemanticTokensDeltaRequest;
			}
		});
		Object.defineProperty(exports, "SemanticTokensRangeRequest", {
			enumerable: true,
			get: function() {
				return protocol_semanticTokens_1.SemanticTokensRangeRequest;
			}
		});
		Object.defineProperty(exports, "SemanticTokensRefreshRequest", {
			enumerable: true,
			get: function() {
				return protocol_semanticTokens_1.SemanticTokensRefreshRequest;
			}
		});
		Object.defineProperty(exports, "SemanticTokensRegistrationType", {
			enumerable: true,
			get: function() {
				return protocol_semanticTokens_1.SemanticTokensRegistrationType;
			}
		});
		var protocol_showDocument_1 = require_protocol_showDocument();
		Object.defineProperty(exports, "ShowDocumentRequest", {
			enumerable: true,
			get: function() {
				return protocol_showDocument_1.ShowDocumentRequest;
			}
		});
		var protocol_linkedEditingRange_1 = require_protocol_linkedEditingRange();
		Object.defineProperty(exports, "LinkedEditingRangeRequest", {
			enumerable: true,
			get: function() {
				return protocol_linkedEditingRange_1.LinkedEditingRangeRequest;
			}
		});
		var protocol_fileOperations_1 = require_protocol_fileOperations();
		Object.defineProperty(exports, "FileOperationPatternKind", {
			enumerable: true,
			get: function() {
				return protocol_fileOperations_1.FileOperationPatternKind;
			}
		});
		Object.defineProperty(exports, "DidCreateFilesNotification", {
			enumerable: true,
			get: function() {
				return protocol_fileOperations_1.DidCreateFilesNotification;
			}
		});
		Object.defineProperty(exports, "WillCreateFilesRequest", {
			enumerable: true,
			get: function() {
				return protocol_fileOperations_1.WillCreateFilesRequest;
			}
		});
		Object.defineProperty(exports, "DidRenameFilesNotification", {
			enumerable: true,
			get: function() {
				return protocol_fileOperations_1.DidRenameFilesNotification;
			}
		});
		Object.defineProperty(exports, "WillRenameFilesRequest", {
			enumerable: true,
			get: function() {
				return protocol_fileOperations_1.WillRenameFilesRequest;
			}
		});
		Object.defineProperty(exports, "DidDeleteFilesNotification", {
			enumerable: true,
			get: function() {
				return protocol_fileOperations_1.DidDeleteFilesNotification;
			}
		});
		Object.defineProperty(exports, "WillDeleteFilesRequest", {
			enumerable: true,
			get: function() {
				return protocol_fileOperations_1.WillDeleteFilesRequest;
			}
		});
		var protocol_moniker_1 = require_protocol_moniker();
		Object.defineProperty(exports, "UniquenessLevel", {
			enumerable: true,
			get: function() {
				return protocol_moniker_1.UniquenessLevel;
			}
		});
		Object.defineProperty(exports, "MonikerKind", {
			enumerable: true,
			get: function() {
				return protocol_moniker_1.MonikerKind;
			}
		});
		Object.defineProperty(exports, "MonikerRequest", {
			enumerable: true,
			get: function() {
				return protocol_moniker_1.MonikerRequest;
			}
		});
		var protocol_typeHierarchy_1 = require_protocol_typeHierarchy();
		Object.defineProperty(exports, "TypeHierarchyPrepareRequest", {
			enumerable: true,
			get: function() {
				return protocol_typeHierarchy_1.TypeHierarchyPrepareRequest;
			}
		});
		Object.defineProperty(exports, "TypeHierarchySubtypesRequest", {
			enumerable: true,
			get: function() {
				return protocol_typeHierarchy_1.TypeHierarchySubtypesRequest;
			}
		});
		Object.defineProperty(exports, "TypeHierarchySupertypesRequest", {
			enumerable: true,
			get: function() {
				return protocol_typeHierarchy_1.TypeHierarchySupertypesRequest;
			}
		});
		var protocol_inlineValue_1 = require_protocol_inlineValue();
		Object.defineProperty(exports, "InlineValueRequest", {
			enumerable: true,
			get: function() {
				return protocol_inlineValue_1.InlineValueRequest;
			}
		});
		Object.defineProperty(exports, "InlineValueRefreshRequest", {
			enumerable: true,
			get: function() {
				return protocol_inlineValue_1.InlineValueRefreshRequest;
			}
		});
		var protocol_inlayHint_1 = require_protocol_inlayHint();
		Object.defineProperty(exports, "InlayHintRequest", {
			enumerable: true,
			get: function() {
				return protocol_inlayHint_1.InlayHintRequest;
			}
		});
		Object.defineProperty(exports, "InlayHintResolveRequest", {
			enumerable: true,
			get: function() {
				return protocol_inlayHint_1.InlayHintResolveRequest;
			}
		});
		Object.defineProperty(exports, "InlayHintRefreshRequest", {
			enumerable: true,
			get: function() {
				return protocol_inlayHint_1.InlayHintRefreshRequest;
			}
		});
		var protocol_diagnostic_1 = require_protocol_diagnostic();
		Object.defineProperty(exports, "DiagnosticServerCancellationData", {
			enumerable: true,
			get: function() {
				return protocol_diagnostic_1.DiagnosticServerCancellationData;
			}
		});
		Object.defineProperty(exports, "DocumentDiagnosticReportKind", {
			enumerable: true,
			get: function() {
				return protocol_diagnostic_1.DocumentDiagnosticReportKind;
			}
		});
		Object.defineProperty(exports, "DocumentDiagnosticRequest", {
			enumerable: true,
			get: function() {
				return protocol_diagnostic_1.DocumentDiagnosticRequest;
			}
		});
		Object.defineProperty(exports, "WorkspaceDiagnosticRequest", {
			enumerable: true,
			get: function() {
				return protocol_diagnostic_1.WorkspaceDiagnosticRequest;
			}
		});
		Object.defineProperty(exports, "DiagnosticRefreshRequest", {
			enumerable: true,
			get: function() {
				return protocol_diagnostic_1.DiagnosticRefreshRequest;
			}
		});
		var protocol_notebook_1 = require_protocol_notebook();
		Object.defineProperty(exports, "NotebookCellKind", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.NotebookCellKind;
			}
		});
		Object.defineProperty(exports, "ExecutionSummary", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.ExecutionSummary;
			}
		});
		Object.defineProperty(exports, "NotebookCell", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.NotebookCell;
			}
		});
		Object.defineProperty(exports, "NotebookDocument", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.NotebookDocument;
			}
		});
		Object.defineProperty(exports, "NotebookDocumentSyncRegistrationType", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.NotebookDocumentSyncRegistrationType;
			}
		});
		Object.defineProperty(exports, "DidOpenNotebookDocumentNotification", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.DidOpenNotebookDocumentNotification;
			}
		});
		Object.defineProperty(exports, "NotebookCellArrayChange", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.NotebookCellArrayChange;
			}
		});
		Object.defineProperty(exports, "DidChangeNotebookDocumentNotification", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.DidChangeNotebookDocumentNotification;
			}
		});
		Object.defineProperty(exports, "DidSaveNotebookDocumentNotification", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.DidSaveNotebookDocumentNotification;
			}
		});
		Object.defineProperty(exports, "DidCloseNotebookDocumentNotification", {
			enumerable: true,
			get: function() {
				return protocol_notebook_1.DidCloseNotebookDocumentNotification;
			}
		});
		var protocol_inlineCompletion_1 = require_protocol_inlineCompletion();
		Object.defineProperty(exports, "InlineCompletionRequest", {
			enumerable: true,
			get: function() {
				return protocol_inlineCompletion_1.InlineCompletionRequest;
			}
		});
		/**
		* The TextDocumentFilter namespace provides helper functions to work with
		* {@link TextDocumentFilter} literals.
		*
		* @since 3.17.0
		*/
		var TextDocumentFilter;
		(function(TextDocumentFilter) {
			function is(value) {
				const candidate = value;
				return Is.string(candidate) || Is.string(candidate.language) || Is.string(candidate.scheme) || Is.string(candidate.pattern);
			}
			TextDocumentFilter.is = is;
		})(TextDocumentFilter || (exports.TextDocumentFilter = TextDocumentFilter = {}));
		/**
		* The NotebookDocumentFilter namespace provides helper functions to work with
		* {@link NotebookDocumentFilter} literals.
		*
		* @since 3.17.0
		*/
		var NotebookDocumentFilter;
		(function(NotebookDocumentFilter) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && (Is.string(candidate.notebookType) || Is.string(candidate.scheme) || Is.string(candidate.pattern));
			}
			NotebookDocumentFilter.is = is;
		})(NotebookDocumentFilter || (exports.NotebookDocumentFilter = NotebookDocumentFilter = {}));
		/**
		* The NotebookCellTextDocumentFilter namespace provides helper functions to work with
		* {@link NotebookCellTextDocumentFilter} literals.
		*
		* @since 3.17.0
		*/
		var NotebookCellTextDocumentFilter;
		(function(NotebookCellTextDocumentFilter) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && (Is.string(candidate.notebook) || NotebookDocumentFilter.is(candidate.notebook)) && (candidate.language === void 0 || Is.string(candidate.language));
			}
			NotebookCellTextDocumentFilter.is = is;
		})(NotebookCellTextDocumentFilter || (exports.NotebookCellTextDocumentFilter = NotebookCellTextDocumentFilter = {}));
		/**
		* The DocumentSelector namespace provides helper functions to work with
		* {@link DocumentSelector}s.
		*/
		var DocumentSelector;
		(function(DocumentSelector) {
			function is(value) {
				if (!Array.isArray(value)) return false;
				for (let elem of value) if (!Is.string(elem) && !TextDocumentFilter.is(elem) && !NotebookCellTextDocumentFilter.is(elem)) return false;
				return true;
			}
			DocumentSelector.is = is;
		})(DocumentSelector || (exports.DocumentSelector = DocumentSelector = {}));
		/**
		* The `client/registerCapability` request is sent from the server to the client to register a new capability
		* handler on the client side.
		*/
		var RegistrationRequest;
		(function(RegistrationRequest) {
			RegistrationRequest.method = "client/registerCapability";
			RegistrationRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			RegistrationRequest.type = new messages_1.ProtocolRequestType(RegistrationRequest.method);
		})(RegistrationRequest || (exports.RegistrationRequest = RegistrationRequest = {}));
		/**
		* The `client/unregisterCapability` request is sent from the server to the client to unregister a previously registered capability
		* handler on the client side.
		*/
		var UnregistrationRequest;
		(function(UnregistrationRequest) {
			UnregistrationRequest.method = "client/unregisterCapability";
			UnregistrationRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			UnregistrationRequest.type = new messages_1.ProtocolRequestType(UnregistrationRequest.method);
		})(UnregistrationRequest || (exports.UnregistrationRequest = UnregistrationRequest = {}));
		var ResourceOperationKind;
		(function(ResourceOperationKind) {
			/**
			* Supports creating new files and folders.
			*/
			ResourceOperationKind.Create = "create";
			/**
			* Supports renaming existing files and folders.
			*/
			ResourceOperationKind.Rename = "rename";
			/**
			* Supports deleting existing files and folders.
			*/
			ResourceOperationKind.Delete = "delete";
		})(ResourceOperationKind || (exports.ResourceOperationKind = ResourceOperationKind = {}));
		var FailureHandlingKind;
		(function(FailureHandlingKind) {
			/**
			* Applying the workspace change is simply aborted if one of the changes provided
			* fails. All operations executed before the failing operation stay executed.
			*/
			FailureHandlingKind.Abort = "abort";
			/**
			* All operations are executed transactional. That means they either all
			* succeed or no changes at all are applied to the workspace.
			*/
			FailureHandlingKind.Transactional = "transactional";
			/**
			* If the workspace edit contains only textual file changes they are executed transactional.
			* If resource changes (create, rename or delete file) are part of the change the failure
			* handling strategy is abort.
			*/
			FailureHandlingKind.TextOnlyTransactional = "textOnlyTransactional";
			/**
			* The client tries to undo the operations already executed. But there is no
			* guarantee that this is succeeding.
			*/
			FailureHandlingKind.Undo = "undo";
		})(FailureHandlingKind || (exports.FailureHandlingKind = FailureHandlingKind = {}));
		/**
		* A set of predefined position encoding kinds.
		*
		* @since 3.17.0
		*/
		var PositionEncodingKind;
		(function(PositionEncodingKind) {
			/**
			* Character offsets count UTF-8 code units (e.g. bytes).
			*/
			PositionEncodingKind.UTF8 = "utf-8";
			/**
			* Character offsets count UTF-16 code units.
			*
			* This is the default and must always be supported
			* by servers
			*/
			PositionEncodingKind.UTF16 = "utf-16";
			/**
			* Character offsets count UTF-32 code units.
			*
			* Implementation note: these are the same as Unicode codepoints,
			* so this `PositionEncodingKind` may also be used for an
			* encoding-agnostic representation of character offsets.
			*/
			PositionEncodingKind.UTF32 = "utf-32";
		})(PositionEncodingKind || (exports.PositionEncodingKind = PositionEncodingKind = {}));
		/**
		* The StaticRegistrationOptions namespace provides helper functions to work with
		* {@link StaticRegistrationOptions} literals.
		*/
		var StaticRegistrationOptions;
		(function(StaticRegistrationOptions) {
			function hasId(value) {
				const candidate = value;
				return candidate && Is.string(candidate.id) && candidate.id.length > 0;
			}
			StaticRegistrationOptions.hasId = hasId;
		})(StaticRegistrationOptions || (exports.StaticRegistrationOptions = StaticRegistrationOptions = {}));
		/**
		* The TextDocumentRegistrationOptions namespace provides helper functions to work with
		* {@link TextDocumentRegistrationOptions} literals.
		*/
		var TextDocumentRegistrationOptions;
		(function(TextDocumentRegistrationOptions) {
			function is(value) {
				const candidate = value;
				return candidate && (candidate.documentSelector === null || DocumentSelector.is(candidate.documentSelector));
			}
			TextDocumentRegistrationOptions.is = is;
		})(TextDocumentRegistrationOptions || (exports.TextDocumentRegistrationOptions = TextDocumentRegistrationOptions = {}));
		/**
		* The WorkDoneProgressOptions namespace provides helper functions to work with
		* {@link WorkDoneProgressOptions} literals.
		*/
		var WorkDoneProgressOptions;
		(function(WorkDoneProgressOptions) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && (candidate.workDoneProgress === void 0 || Is.boolean(candidate.workDoneProgress));
			}
			WorkDoneProgressOptions.is = is;
			function hasWorkDoneProgress(value) {
				const candidate = value;
				return candidate && Is.boolean(candidate.workDoneProgress);
			}
			WorkDoneProgressOptions.hasWorkDoneProgress = hasWorkDoneProgress;
		})(WorkDoneProgressOptions || (exports.WorkDoneProgressOptions = WorkDoneProgressOptions = {}));
		/**
		* The initialize request is sent from the client to the server.
		* It is sent once as the request after starting up the server.
		* The requests parameter is of type {@link InitializeParams}
		* the response if of type {@link InitializeResult} of a Thenable that
		* resolves to such.
		*/
		var InitializeRequest;
		(function(InitializeRequest) {
			InitializeRequest.method = "initialize";
			InitializeRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			InitializeRequest.type = new messages_1.ProtocolRequestType(InitializeRequest.method);
		})(InitializeRequest || (exports.InitializeRequest = InitializeRequest = {}));
		/**
		* Known error codes for an `InitializeErrorCodes`;
		*/
		var InitializeErrorCodes;
		(function(InitializeErrorCodes) {
			/**
			* If the protocol version provided by the client can't be handled by the server.
			*
			* @deprecated This initialize error got replaced by client capabilities. There is
			* no version handshake in version 3.0x
			*/
			InitializeErrorCodes.unknownProtocolVersion = 1;
		})(InitializeErrorCodes || (exports.InitializeErrorCodes = InitializeErrorCodes = {}));
		/**
		* The initialized notification is sent from the client to the
		* server after the client is fully initialized and the server
		* is allowed to send requests from the server to the client.
		*/
		var InitializedNotification;
		(function(InitializedNotification) {
			InitializedNotification.method = "initialized";
			InitializedNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			InitializedNotification.type = new messages_1.ProtocolNotificationType(InitializedNotification.method);
		})(InitializedNotification || (exports.InitializedNotification = InitializedNotification = {}));
		/**
		* A shutdown request is sent from the client to the server.
		* It is sent once when the client decides to shutdown the
		* server. The only notification that is sent after a shutdown request
		* is the exit event.
		*/
		var ShutdownRequest;
		(function(ShutdownRequest) {
			ShutdownRequest.method = "shutdown";
			ShutdownRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			ShutdownRequest.type = new messages_1.ProtocolRequestType0(ShutdownRequest.method);
		})(ShutdownRequest || (exports.ShutdownRequest = ShutdownRequest = {}));
		/**
		* The exit event is sent from the client to the server to
		* ask the server to exit its process.
		*/
		var ExitNotification;
		(function(ExitNotification) {
			ExitNotification.method = "exit";
			ExitNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			ExitNotification.type = new messages_1.ProtocolNotificationType0(ExitNotification.method);
		})(ExitNotification || (exports.ExitNotification = ExitNotification = {}));
		/**
		* The configuration change notification is sent from the client to the server
		* when the client's configuration has changed. The notification contains
		* the changed configuration as defined by the language client.
		*/
		var DidChangeConfigurationNotification;
		(function(DidChangeConfigurationNotification) {
			DidChangeConfigurationNotification.method = "workspace/didChangeConfiguration";
			DidChangeConfigurationNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidChangeConfigurationNotification.type = new messages_1.ProtocolNotificationType(DidChangeConfigurationNotification.method);
		})(DidChangeConfigurationNotification || (exports.DidChangeConfigurationNotification = DidChangeConfigurationNotification = {}));
		/**
		* The message type
		*/
		var MessageType;
		(function(MessageType) {
			/**
			* An error message.
			*/
			MessageType.Error = 1;
			/**
			* A warning message.
			*/
			MessageType.Warning = 2;
			/**
			* An information message.
			*/
			MessageType.Info = 3;
			/**
			* A log message.
			*/
			MessageType.Log = 4;
			/**
			* A debug message.
			*
			* @since 3.18.0
			*/
			MessageType.Debug = 5;
		})(MessageType || (exports.MessageType = MessageType = {}));
		/**
		* The show message notification is sent from a server to a client to ask
		* the client to display a particular message in the user interface.
		*/
		var ShowMessageNotification;
		(function(ShowMessageNotification) {
			ShowMessageNotification.method = "window/showMessage";
			ShowMessageNotification.messageDirection = messages_1.MessageDirection.serverToClient;
			ShowMessageNotification.type = new messages_1.ProtocolNotificationType(ShowMessageNotification.method);
		})(ShowMessageNotification || (exports.ShowMessageNotification = ShowMessageNotification = {}));
		/**
		* The show message request is sent from the server to the client to show a message
		* and a set of options actions to the user.
		*/
		var ShowMessageRequest;
		(function(ShowMessageRequest) {
			ShowMessageRequest.method = "window/showMessageRequest";
			ShowMessageRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			ShowMessageRequest.type = new messages_1.ProtocolRequestType(ShowMessageRequest.method);
		})(ShowMessageRequest || (exports.ShowMessageRequest = ShowMessageRequest = {}));
		/**
		* The log message notification is sent from the server to the client to ask
		* the client to log a particular message.
		*/
		var LogMessageNotification;
		(function(LogMessageNotification) {
			LogMessageNotification.method = "window/logMessage";
			LogMessageNotification.messageDirection = messages_1.MessageDirection.serverToClient;
			LogMessageNotification.type = new messages_1.ProtocolNotificationType(LogMessageNotification.method);
		})(LogMessageNotification || (exports.LogMessageNotification = LogMessageNotification = {}));
		/**
		* The telemetry event notification is sent from the server to the client to ask
		* the client to log telemetry data.
		*/
		var TelemetryEventNotification;
		(function(TelemetryEventNotification) {
			TelemetryEventNotification.method = "telemetry/event";
			TelemetryEventNotification.messageDirection = messages_1.MessageDirection.serverToClient;
			TelemetryEventNotification.type = new messages_1.ProtocolNotificationType(TelemetryEventNotification.method);
		})(TelemetryEventNotification || (exports.TelemetryEventNotification = TelemetryEventNotification = {}));
		/**
		* Defines how the host (editor) should sync
		* document changes to the language server.
		*/
		var TextDocumentSyncKind;
		(function(TextDocumentSyncKind) {
			/**
			* Documents should not be synced at all.
			*/
			TextDocumentSyncKind.None = 0;
			/**
			* Documents are synced by always sending the full content
			* of the document.
			*/
			TextDocumentSyncKind.Full = 1;
			/**
			* Documents are synced by sending the full content on open.
			* After that only incremental updates to the document are
			* send.
			*/
			TextDocumentSyncKind.Incremental = 2;
		})(TextDocumentSyncKind || (exports.TextDocumentSyncKind = TextDocumentSyncKind = {}));
		/**
		* The document open notification is sent from the client to the server to signal
		* newly opened text documents. The document's truth is now managed by the client
		* and the server must not try to read the document's truth using the document's
		* uri. Open in this sense means it is managed by the client. It doesn't necessarily
		* mean that its content is presented in an editor. An open notification must not
		* be sent more than once without a corresponding close notification send before.
		* This means open and close notification must be balanced and the max open count
		* is one.
		*/
		var DidOpenTextDocumentNotification;
		(function(DidOpenTextDocumentNotification) {
			DidOpenTextDocumentNotification.method = "textDocument/didOpen";
			DidOpenTextDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidOpenTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidOpenTextDocumentNotification.method);
		})(DidOpenTextDocumentNotification || (exports.DidOpenTextDocumentNotification = DidOpenTextDocumentNotification = {}));
		var TextDocumentContentChangeEvent;
		(function(TextDocumentContentChangeEvent) {
			/**
			* Checks whether the information describes a delta event.
			*/
			function isIncremental(event) {
				let candidate = event;
				return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range !== void 0 && (candidate.rangeLength === void 0 || typeof candidate.rangeLength === "number");
			}
			TextDocumentContentChangeEvent.isIncremental = isIncremental;
			/**
			* Checks whether the information describes a full replacement event.
			*/
			function isFull(event) {
				let candidate = event;
				return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range === void 0 && candidate.rangeLength === void 0;
			}
			TextDocumentContentChangeEvent.isFull = isFull;
		})(TextDocumentContentChangeEvent || (exports.TextDocumentContentChangeEvent = TextDocumentContentChangeEvent = {}));
		/**
		* The document change notification is sent from the client to the server to signal
		* changes to a text document.
		*/
		var DidChangeTextDocumentNotification;
		(function(DidChangeTextDocumentNotification) {
			DidChangeTextDocumentNotification.method = "textDocument/didChange";
			DidChangeTextDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidChangeTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidChangeTextDocumentNotification.method);
		})(DidChangeTextDocumentNotification || (exports.DidChangeTextDocumentNotification = DidChangeTextDocumentNotification = {}));
		/**
		* The document close notification is sent from the client to the server when
		* the document got closed in the client. The document's truth now exists where
		* the document's uri points to (e.g. if the document's uri is a file uri the
		* truth now exists on disk). As with the open notification the close notification
		* is about managing the document's content. Receiving a close notification
		* doesn't mean that the document was open in an editor before. A close
		* notification requires a previous open notification to be sent.
		*/
		var DidCloseTextDocumentNotification;
		(function(DidCloseTextDocumentNotification) {
			DidCloseTextDocumentNotification.method = "textDocument/didClose";
			DidCloseTextDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidCloseTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidCloseTextDocumentNotification.method);
		})(DidCloseTextDocumentNotification || (exports.DidCloseTextDocumentNotification = DidCloseTextDocumentNotification = {}));
		/**
		* The document save notification is sent from the client to the server when
		* the document got saved in the client.
		*/
		var DidSaveTextDocumentNotification;
		(function(DidSaveTextDocumentNotification) {
			DidSaveTextDocumentNotification.method = "textDocument/didSave";
			DidSaveTextDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidSaveTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidSaveTextDocumentNotification.method);
		})(DidSaveTextDocumentNotification || (exports.DidSaveTextDocumentNotification = DidSaveTextDocumentNotification = {}));
		/**
		* Represents reasons why a text document is saved.
		*/
		var TextDocumentSaveReason;
		(function(TextDocumentSaveReason) {
			/**
			* Manually triggered, e.g. by the user pressing save, by starting debugging,
			* or by an API call.
			*/
			TextDocumentSaveReason.Manual = 1;
			/**
			* Automatic after a delay.
			*/
			TextDocumentSaveReason.AfterDelay = 2;
			/**
			* When the editor lost focus.
			*/
			TextDocumentSaveReason.FocusOut = 3;
		})(TextDocumentSaveReason || (exports.TextDocumentSaveReason = TextDocumentSaveReason = {}));
		/**
		* A document will save notification is sent from the client to the server before
		* the document is actually saved.
		*/
		var WillSaveTextDocumentNotification;
		(function(WillSaveTextDocumentNotification) {
			WillSaveTextDocumentNotification.method = "textDocument/willSave";
			WillSaveTextDocumentNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			WillSaveTextDocumentNotification.type = new messages_1.ProtocolNotificationType(WillSaveTextDocumentNotification.method);
		})(WillSaveTextDocumentNotification || (exports.WillSaveTextDocumentNotification = WillSaveTextDocumentNotification = {}));
		/**
		* A document will save request is sent from the client to the server before
		* the document is actually saved. The request can return an array of TextEdits
		* which will be applied to the text document before it is saved. Please note that
		* clients might drop results if computing the text edits took too long or if a
		* server constantly fails on this request. This is done to keep the save fast and
		* reliable.
		*/
		var WillSaveTextDocumentWaitUntilRequest;
		(function(WillSaveTextDocumentWaitUntilRequest) {
			WillSaveTextDocumentWaitUntilRequest.method = "textDocument/willSaveWaitUntil";
			WillSaveTextDocumentWaitUntilRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			WillSaveTextDocumentWaitUntilRequest.type = new messages_1.ProtocolRequestType(WillSaveTextDocumentWaitUntilRequest.method);
		})(WillSaveTextDocumentWaitUntilRequest || (exports.WillSaveTextDocumentWaitUntilRequest = WillSaveTextDocumentWaitUntilRequest = {}));
		/**
		* The watched files notification is sent from the client to the server when
		* the client detects changes to file watched by the language client.
		*/
		var DidChangeWatchedFilesNotification;
		(function(DidChangeWatchedFilesNotification) {
			DidChangeWatchedFilesNotification.method = "workspace/didChangeWatchedFiles";
			DidChangeWatchedFilesNotification.messageDirection = messages_1.MessageDirection.clientToServer;
			DidChangeWatchedFilesNotification.type = new messages_1.ProtocolNotificationType(DidChangeWatchedFilesNotification.method);
		})(DidChangeWatchedFilesNotification || (exports.DidChangeWatchedFilesNotification = DidChangeWatchedFilesNotification = {}));
		/**
		* The file event type
		*/
		var FileChangeType;
		(function(FileChangeType) {
			/**
			* The file got created.
			*/
			FileChangeType.Created = 1;
			/**
			* The file got changed.
			*/
			FileChangeType.Changed = 2;
			/**
			* The file got deleted.
			*/
			FileChangeType.Deleted = 3;
		})(FileChangeType || (exports.FileChangeType = FileChangeType = {}));
		var RelativePattern;
		(function(RelativePattern) {
			function is(value) {
				const candidate = value;
				return Is.objectLiteral(candidate) && (vscode_languageserver_types_1.URI.is(candidate.baseUri) || vscode_languageserver_types_1.WorkspaceFolder.is(candidate.baseUri)) && Is.string(candidate.pattern);
			}
			RelativePattern.is = is;
		})(RelativePattern || (exports.RelativePattern = RelativePattern = {}));
		var WatchKind;
		(function(WatchKind) {
			/**
			* Interested in create events.
			*/
			WatchKind.Create = 1;
			/**
			* Interested in change events
			*/
			WatchKind.Change = 2;
			/**
			* Interested in delete events
			*/
			WatchKind.Delete = 4;
		})(WatchKind || (exports.WatchKind = WatchKind = {}));
		/**
		* Diagnostics notification are sent from the server to the client to signal
		* results of validation runs.
		*/
		var PublishDiagnosticsNotification;
		(function(PublishDiagnosticsNotification) {
			PublishDiagnosticsNotification.method = "textDocument/publishDiagnostics";
			PublishDiagnosticsNotification.messageDirection = messages_1.MessageDirection.serverToClient;
			PublishDiagnosticsNotification.type = new messages_1.ProtocolNotificationType(PublishDiagnosticsNotification.method);
		})(PublishDiagnosticsNotification || (exports.PublishDiagnosticsNotification = PublishDiagnosticsNotification = {}));
		/**
		* How a completion was triggered
		*/
		var CompletionTriggerKind;
		(function(CompletionTriggerKind) {
			/**
			* Completion was triggered by typing an identifier (24x7 code
			* complete), manual invocation (e.g Ctrl+Space) or via API.
			*/
			CompletionTriggerKind.Invoked = 1;
			/**
			* Completion was triggered by a trigger character specified by
			* the `triggerCharacters` properties of the `CompletionRegistrationOptions`.
			*/
			CompletionTriggerKind.TriggerCharacter = 2;
			/**
			* Completion was re-triggered as current completion list is incomplete
			*/
			CompletionTriggerKind.TriggerForIncompleteCompletions = 3;
		})(CompletionTriggerKind || (exports.CompletionTriggerKind = CompletionTriggerKind = {}));
		/**
		* Request to request completion at a given text document position. The request's
		* parameter is of type {@link TextDocumentPosition} the response
		* is of type {@link CompletionItem CompletionItem[]} or {@link CompletionList}
		* or a Thenable that resolves to such.
		*
		* The request can delay the computation of the {@link CompletionItem.detail `detail`}
		* and {@link CompletionItem.documentation `documentation`} properties to the `completionItem/resolve`
		* request. However, properties that are needed for the initial sorting and filtering, like `sortText`,
		* `filterText`, `insertText`, and `textEdit`, must not be changed during resolve.
		*/
		var CompletionRequest;
		(function(CompletionRequest) {
			CompletionRequest.method = "textDocument/completion";
			CompletionRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CompletionRequest.type = new messages_1.ProtocolRequestType(CompletionRequest.method);
		})(CompletionRequest || (exports.CompletionRequest = CompletionRequest = {}));
		/**
		* Request to resolve additional information for a given completion item.The request's
		* parameter is of type {@link CompletionItem} the response
		* is of type {@link CompletionItem} or a Thenable that resolves to such.
		*/
		var CompletionResolveRequest;
		(function(CompletionResolveRequest) {
			CompletionResolveRequest.method = "completionItem/resolve";
			CompletionResolveRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CompletionResolveRequest.type = new messages_1.ProtocolRequestType(CompletionResolveRequest.method);
		})(CompletionResolveRequest || (exports.CompletionResolveRequest = CompletionResolveRequest = {}));
		/**
		* Request to request hover information at a given text document position. The request's
		* parameter is of type {@link TextDocumentPosition} the response is of
		* type {@link Hover} or a Thenable that resolves to such.
		*/
		var HoverRequest;
		(function(HoverRequest) {
			HoverRequest.method = "textDocument/hover";
			HoverRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			HoverRequest.type = new messages_1.ProtocolRequestType(HoverRequest.method);
		})(HoverRequest || (exports.HoverRequest = HoverRequest = {}));
		/**
		* How a signature help was triggered.
		*
		* @since 3.15.0
		*/
		var SignatureHelpTriggerKind;
		(function(SignatureHelpTriggerKind) {
			/**
			* Signature help was invoked manually by the user or by a command.
			*/
			SignatureHelpTriggerKind.Invoked = 1;
			/**
			* Signature help was triggered by a trigger character.
			*/
			SignatureHelpTriggerKind.TriggerCharacter = 2;
			/**
			* Signature help was triggered by the cursor moving or by the document content changing.
			*/
			SignatureHelpTriggerKind.ContentChange = 3;
		})(SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = SignatureHelpTriggerKind = {}));
		var SignatureHelpRequest;
		(function(SignatureHelpRequest) {
			SignatureHelpRequest.method = "textDocument/signatureHelp";
			SignatureHelpRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			SignatureHelpRequest.type = new messages_1.ProtocolRequestType(SignatureHelpRequest.method);
		})(SignatureHelpRequest || (exports.SignatureHelpRequest = SignatureHelpRequest = {}));
		/**
		* A request to resolve the definition location of a symbol at a given text
		* document position. The request's parameter is of type {@link TextDocumentPosition}
		* the response is of either type {@link Definition} or a typed array of
		* {@link DefinitionLink} or a Thenable that resolves to such.
		*/
		var DefinitionRequest;
		(function(DefinitionRequest) {
			DefinitionRequest.method = "textDocument/definition";
			DefinitionRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DefinitionRequest.type = new messages_1.ProtocolRequestType(DefinitionRequest.method);
		})(DefinitionRequest || (exports.DefinitionRequest = DefinitionRequest = {}));
		/**
		* A request to resolve project-wide references for the symbol denoted
		* by the given text document position. The request's parameter is of
		* type {@link ReferenceParams} the response is of type
		* {@link Location Location[]} or a Thenable that resolves to such.
		*/
		var ReferencesRequest;
		(function(ReferencesRequest) {
			ReferencesRequest.method = "textDocument/references";
			ReferencesRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			ReferencesRequest.type = new messages_1.ProtocolRequestType(ReferencesRequest.method);
		})(ReferencesRequest || (exports.ReferencesRequest = ReferencesRequest = {}));
		/**
		* Request to resolve a {@link DocumentHighlight} for a given
		* text document position. The request's parameter is of type {@link TextDocumentPosition}
		* the request response is an array of type {@link DocumentHighlight}
		* or a Thenable that resolves to such.
		*/
		var DocumentHighlightRequest;
		(function(DocumentHighlightRequest) {
			DocumentHighlightRequest.method = "textDocument/documentHighlight";
			DocumentHighlightRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentHighlightRequest.type = new messages_1.ProtocolRequestType(DocumentHighlightRequest.method);
		})(DocumentHighlightRequest || (exports.DocumentHighlightRequest = DocumentHighlightRequest = {}));
		/**
		* A request to list all symbols found in a given text document. The request's
		* parameter is of type {@link TextDocumentIdentifier} the
		* response is of type {@link SymbolInformation SymbolInformation[]} or a Thenable
		* that resolves to such.
		*/
		var DocumentSymbolRequest;
		(function(DocumentSymbolRequest) {
			DocumentSymbolRequest.method = "textDocument/documentSymbol";
			DocumentSymbolRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentSymbolRequest.type = new messages_1.ProtocolRequestType(DocumentSymbolRequest.method);
		})(DocumentSymbolRequest || (exports.DocumentSymbolRequest = DocumentSymbolRequest = {}));
		/**
		* A request to provide commands for the given text document and range.
		*/
		var CodeActionRequest;
		(function(CodeActionRequest) {
			CodeActionRequest.method = "textDocument/codeAction";
			CodeActionRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CodeActionRequest.type = new messages_1.ProtocolRequestType(CodeActionRequest.method);
		})(CodeActionRequest || (exports.CodeActionRequest = CodeActionRequest = {}));
		/**
		* Request to resolve additional information for a given code action.The request's
		* parameter is of type {@link CodeAction} the response
		* is of type {@link CodeAction} or a Thenable that resolves to such.
		*/
		var CodeActionResolveRequest;
		(function(CodeActionResolveRequest) {
			CodeActionResolveRequest.method = "codeAction/resolve";
			CodeActionResolveRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CodeActionResolveRequest.type = new messages_1.ProtocolRequestType(CodeActionResolveRequest.method);
		})(CodeActionResolveRequest || (exports.CodeActionResolveRequest = CodeActionResolveRequest = {}));
		/**
		* A request to list project-wide symbols matching the query string given
		* by the {@link WorkspaceSymbolParams}. The response is
		* of type {@link SymbolInformation SymbolInformation[]} or a Thenable that
		* resolves to such.
		*
		* @since 3.17.0 - support for WorkspaceSymbol in the returned data. Clients
		*  need to advertise support for WorkspaceSymbols via the client capability
		*  `workspace.symbol.resolveSupport`.
		*
		*/
		var WorkspaceSymbolRequest;
		(function(WorkspaceSymbolRequest) {
			WorkspaceSymbolRequest.method = "workspace/symbol";
			WorkspaceSymbolRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			WorkspaceSymbolRequest.type = new messages_1.ProtocolRequestType(WorkspaceSymbolRequest.method);
		})(WorkspaceSymbolRequest || (exports.WorkspaceSymbolRequest = WorkspaceSymbolRequest = {}));
		/**
		* A request to resolve the range inside the workspace
		* symbol's location.
		*
		* @since 3.17.0
		*/
		var WorkspaceSymbolResolveRequest;
		(function(WorkspaceSymbolResolveRequest) {
			WorkspaceSymbolResolveRequest.method = "workspaceSymbol/resolve";
			WorkspaceSymbolResolveRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			WorkspaceSymbolResolveRequest.type = new messages_1.ProtocolRequestType(WorkspaceSymbolResolveRequest.method);
		})(WorkspaceSymbolResolveRequest || (exports.WorkspaceSymbolResolveRequest = WorkspaceSymbolResolveRequest = {}));
		/**
		* A request to provide code lens for the given text document.
		*/
		var CodeLensRequest;
		(function(CodeLensRequest) {
			CodeLensRequest.method = "textDocument/codeLens";
			CodeLensRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CodeLensRequest.type = new messages_1.ProtocolRequestType(CodeLensRequest.method);
		})(CodeLensRequest || (exports.CodeLensRequest = CodeLensRequest = {}));
		/**
		* A request to resolve a command for a given code lens.
		*/
		var CodeLensResolveRequest;
		(function(CodeLensResolveRequest) {
			CodeLensResolveRequest.method = "codeLens/resolve";
			CodeLensResolveRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			CodeLensResolveRequest.type = new messages_1.ProtocolRequestType(CodeLensResolveRequest.method);
		})(CodeLensResolveRequest || (exports.CodeLensResolveRequest = CodeLensResolveRequest = {}));
		/**
		* A request to refresh all code actions
		*
		* @since 3.16.0
		*/
		var CodeLensRefreshRequest;
		(function(CodeLensRefreshRequest) {
			CodeLensRefreshRequest.method = `workspace/codeLens/refresh`;
			CodeLensRefreshRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			CodeLensRefreshRequest.type = new messages_1.ProtocolRequestType0(CodeLensRefreshRequest.method);
		})(CodeLensRefreshRequest || (exports.CodeLensRefreshRequest = CodeLensRefreshRequest = {}));
		/**
		* A request to provide document links
		*/
		var DocumentLinkRequest;
		(function(DocumentLinkRequest) {
			DocumentLinkRequest.method = "textDocument/documentLink";
			DocumentLinkRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentLinkRequest.type = new messages_1.ProtocolRequestType(DocumentLinkRequest.method);
		})(DocumentLinkRequest || (exports.DocumentLinkRequest = DocumentLinkRequest = {}));
		/**
		* Request to resolve additional information for a given document link. The request's
		* parameter is of type {@link DocumentLink} the response
		* is of type {@link DocumentLink} or a Thenable that resolves to such.
		*/
		var DocumentLinkResolveRequest;
		(function(DocumentLinkResolveRequest) {
			DocumentLinkResolveRequest.method = "documentLink/resolve";
			DocumentLinkResolveRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentLinkResolveRequest.type = new messages_1.ProtocolRequestType(DocumentLinkResolveRequest.method);
		})(DocumentLinkResolveRequest || (exports.DocumentLinkResolveRequest = DocumentLinkResolveRequest = {}));
		/**
		* A request to format a whole document.
		*/
		var DocumentFormattingRequest;
		(function(DocumentFormattingRequest) {
			DocumentFormattingRequest.method = "textDocument/formatting";
			DocumentFormattingRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentFormattingRequest.type = new messages_1.ProtocolRequestType(DocumentFormattingRequest.method);
		})(DocumentFormattingRequest || (exports.DocumentFormattingRequest = DocumentFormattingRequest = {}));
		/**
		* A request to format a range in a document.
		*/
		var DocumentRangeFormattingRequest;
		(function(DocumentRangeFormattingRequest) {
			DocumentRangeFormattingRequest.method = "textDocument/rangeFormatting";
			DocumentRangeFormattingRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentRangeFormattingRequest.type = new messages_1.ProtocolRequestType(DocumentRangeFormattingRequest.method);
		})(DocumentRangeFormattingRequest || (exports.DocumentRangeFormattingRequest = DocumentRangeFormattingRequest = {}));
		/**
		* A request to format ranges in a document.
		*
		* @since 3.18.0
		* @proposed
		*/
		var DocumentRangesFormattingRequest;
		(function(DocumentRangesFormattingRequest) {
			DocumentRangesFormattingRequest.method = "textDocument/rangesFormatting";
			DocumentRangesFormattingRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentRangesFormattingRequest.type = new messages_1.ProtocolRequestType(DocumentRangesFormattingRequest.method);
		})(DocumentRangesFormattingRequest || (exports.DocumentRangesFormattingRequest = DocumentRangesFormattingRequest = {}));
		/**
		* A request to format a document on type.
		*/
		var DocumentOnTypeFormattingRequest;
		(function(DocumentOnTypeFormattingRequest) {
			DocumentOnTypeFormattingRequest.method = "textDocument/onTypeFormatting";
			DocumentOnTypeFormattingRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			DocumentOnTypeFormattingRequest.type = new messages_1.ProtocolRequestType(DocumentOnTypeFormattingRequest.method);
		})(DocumentOnTypeFormattingRequest || (exports.DocumentOnTypeFormattingRequest = DocumentOnTypeFormattingRequest = {}));
		var PrepareSupportDefaultBehavior;
		(function(PrepareSupportDefaultBehavior) {
			/**
			* The client's default behavior is to select the identifier
			* according the to language's syntax rule.
			*/
			PrepareSupportDefaultBehavior.Identifier = 1;
		})(PrepareSupportDefaultBehavior || (exports.PrepareSupportDefaultBehavior = PrepareSupportDefaultBehavior = {}));
		/**
		* A request to rename a symbol.
		*/
		var RenameRequest;
		(function(RenameRequest) {
			RenameRequest.method = "textDocument/rename";
			RenameRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			RenameRequest.type = new messages_1.ProtocolRequestType(RenameRequest.method);
		})(RenameRequest || (exports.RenameRequest = RenameRequest = {}));
		/**
		* A request to test and perform the setup necessary for a rename.
		*
		* @since 3.16 - support for default behavior
		*/
		var PrepareRenameRequest;
		(function(PrepareRenameRequest) {
			PrepareRenameRequest.method = "textDocument/prepareRename";
			PrepareRenameRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			PrepareRenameRequest.type = new messages_1.ProtocolRequestType(PrepareRenameRequest.method);
		})(PrepareRenameRequest || (exports.PrepareRenameRequest = PrepareRenameRequest = {}));
		/**
		* A request send from the client to the server to execute a command. The request might return
		* a workspace edit which the client will apply to the workspace.
		*/
		var ExecuteCommandRequest;
		(function(ExecuteCommandRequest) {
			ExecuteCommandRequest.method = "workspace/executeCommand";
			ExecuteCommandRequest.messageDirection = messages_1.MessageDirection.clientToServer;
			ExecuteCommandRequest.type = new messages_1.ProtocolRequestType(ExecuteCommandRequest.method);
		})(ExecuteCommandRequest || (exports.ExecuteCommandRequest = ExecuteCommandRequest = {}));
		/**
		* A request sent from the server to the client to modified certain resources.
		*/
		var ApplyWorkspaceEditRequest;
		(function(ApplyWorkspaceEditRequest) {
			ApplyWorkspaceEditRequest.method = "workspace/applyEdit";
			ApplyWorkspaceEditRequest.messageDirection = messages_1.MessageDirection.serverToClient;
			ApplyWorkspaceEditRequest.type = new messages_1.ProtocolRequestType("workspace/applyEdit");
		})(ApplyWorkspaceEditRequest || (exports.ApplyWorkspaceEditRequest = ApplyWorkspaceEditRequest = {}));
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/connection.js
	var require_connection = /* @__PURE__ */ __commonJSMin(((exports) => {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.createProtocolConnection = void 0;
		var vscode_jsonrpc_1 = require_main$1();
		function createProtocolConnection(input, output, logger, options) {
			if (vscode_jsonrpc_1.ConnectionStrategy.is(options)) options = { connectionStrategy: options };
			return (0, vscode_jsonrpc_1.createMessageConnection)(input, output, logger, options);
		}
		exports.createProtocolConnection = createProtocolConnection;
	}));
	//#endregion
	//#region ../../node_modules/vscode-languageserver-protocol/lib/common/api.js
	var require_api = /* @__PURE__ */ __commonJSMin(((exports) => {
		var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			var desc = Object.getOwnPropertyDescriptor(m, k);
			if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
				enumerable: true,
				get: function() {
					return m[k];
				}
			};
			Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			o[k2] = m[k];
		}));
		var __exportStar = exports && exports.__exportStar || function(m, exports$2) {
			for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.LSPErrorCodes = exports.createProtocolConnection = void 0;
		__exportStar(require_main$1(), exports);
		__exportStar((init_main(), __toCommonJS(main_exports)), exports);
		__exportStar(require_messages(), exports);
		__exportStar(require_protocol(), exports);
		var connection_1 = require_connection();
		Object.defineProperty(exports, "createProtocolConnection", {
			enumerable: true,
			get: function() {
				return connection_1.createProtocolConnection;
			}
		});
		var LSPErrorCodes;
		(function(LSPErrorCodes) {
			/**
			* This is the start range of LSP reserved error codes.
			* It doesn't denote a real error code.
			*
			* @since 3.16.0
			*/
			LSPErrorCodes.lspReservedErrorRangeStart = -32899;
			/**
			* A request failed but it was syntactically correct, e.g the
			* method name was known and the parameters were valid. The error
			* message should contain human readable information about why
			* the request failed.
			*
			* @since 3.17.0
			*/
			LSPErrorCodes.RequestFailed = -32803;
			/**
			* The server cancelled the request. This error code should
			* only be used for requests that explicitly support being
			* server cancellable.
			*
			* @since 3.17.0
			*/
			LSPErrorCodes.ServerCancelled = -32802;
			/**
			* The server detected that the content of a document got
			* modified outside normal conditions. A server should
			* NOT send this error code if it detects a content change
			* in it unprocessed messages. The result even computed
			* on an older state might still be useful for the client.
			*
			* If a client decides that a result is not of any use anymore
			* the client should cancel the request.
			*/
			LSPErrorCodes.ContentModified = -32801;
			/**
			* The client has canceled a request and a server as detected
			* the cancel.
			*/
			LSPErrorCodes.RequestCancelled = -32800;
			/**
			* This is the end range of LSP reserved error codes.
			* It doesn't denote a real error code.
			*
			* @since 3.16.0
			*/
			LSPErrorCodes.lspReservedErrorRangeEnd = -32800;
		})(LSPErrorCodes || (exports.LSPErrorCodes = LSPErrorCodes = {}));
	}));
	//#endregion
	//#region ../../node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js
	var import_main = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
		var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			var desc = Object.getOwnPropertyDescriptor(m, k);
			if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
				enumerable: true,
				get: function() {
					return m[k];
				}
			};
			Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			o[k2] = m[k];
		}));
		var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
			for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.createProtocolConnection = void 0;
		var browser_1 = require_browser();
		__exportStar(require_browser(), exports);
		__exportStar(require_api(), exports);
		function createProtocolConnection(reader, writer, logger, options) {
			return (0, browser_1.createMessageConnection)(reader, writer, logger, options);
		}
		exports.createProtocolConnection = createProtocolConnection;
	})))());
	function getDefaultExportFromCjs(x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
	}
	var browser = { exports: {} };
	var process = browser.exports = {};
	var cachedSetTimeout;
	var cachedClearTimeout;
	function defaultSetTimout() {
		throw new Error("setTimeout has not been defined");
	}
	function defaultClearTimeout() {
		throw new Error("clearTimeout has not been defined");
	}
	(function() {
		try {
			if (typeof setTimeout === "function") cachedSetTimeout = setTimeout;
			else cachedSetTimeout = defaultSetTimout;
		} catch (e) {
			cachedSetTimeout = defaultSetTimout;
		}
		try {
			if (typeof clearTimeout === "function") cachedClearTimeout = clearTimeout;
			else cachedClearTimeout = defaultClearTimeout;
		} catch (e) {
			cachedClearTimeout = defaultClearTimeout;
		}
	})();
	function runTimeout(fun) {
		if (cachedSetTimeout === setTimeout) return setTimeout(fun, 0);
		if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
			cachedSetTimeout = setTimeout;
			return setTimeout(fun, 0);
		}
		try {
			return cachedSetTimeout(fun, 0);
		} catch (e) {
			try {
				return cachedSetTimeout.call(null, fun, 0);
			} catch (e) {
				return cachedSetTimeout.call(this, fun, 0);
			}
		}
	}
	function runClearTimeout(marker) {
		if (cachedClearTimeout === clearTimeout) return clearTimeout(marker);
		if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
			cachedClearTimeout = clearTimeout;
			return clearTimeout(marker);
		}
		try {
			return cachedClearTimeout(marker);
		} catch (e) {
			try {
				return cachedClearTimeout.call(null, marker);
			} catch (e) {
				return cachedClearTimeout.call(this, marker);
			}
		}
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	function cleanUpNextTick() {
		if (!draining || !currentQueue) return;
		draining = false;
		if (currentQueue.length) queue = currentQueue.concat(queue);
		else queueIndex = -1;
		if (queue.length) drainQueue();
	}
	function drainQueue() {
		if (draining) return;
		var timeout = runTimeout(cleanUpNextTick);
		draining = true;
		var len = queue.length;
		while (len) {
			currentQueue = queue;
			queue = [];
			while (++queueIndex < len) if (currentQueue) currentQueue[queueIndex].run();
			queueIndex = -1;
			len = queue.length;
		}
		currentQueue = null;
		draining = false;
		runClearTimeout(timeout);
	}
	process.nextTick = function(fun) {
		var args = new Array(arguments.length - 1);
		if (arguments.length > 1) for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
		queue.push(new Item(fun, args));
		if (queue.length === 1 && !draining) runTimeout(drainQueue);
	};
	function Item(fun, array) {
		this.fun = fun;
		this.array = array;
	}
	Item.prototype.run = function() {
		this.fun.apply(null, this.array);
	};
	process.title = "browser";
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = "";
	process.versions = {};
	function noop() {}
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;
	process.listeners = function(name) {
		return [];
	};
	process.binding = function(name) {
		throw new Error("process.binding is not supported");
	};
	process.cwd = function() {
		return "/";
	};
	process.chdir = function(dir) {
		throw new Error("process.chdir is not supported");
	};
	process.umask = function() {
		return 0;
	};
	var browserExports = browser.exports;
	var process$1 = /*@__PURE__*/ getDefaultExportFromCjs(browserExports);
	//#endregion
	//#region ../../node_modules/vscode-uri/lib/esm/index.mjs
	var t = { 975(t) {
		function e(t) {
			if ("string" != typeof t) throw new TypeError("Path must be a string. Received " + JSON.stringify(t));
		}
		function r(t, e) {
			for (var r, n = "", i = 0, o = -1, h = 0, s = 0; s <= t.length; ++s) {
				if (s < t.length) r = t.charCodeAt(s);
				else {
					if (47 === r) break;
					r = 47;
				}
				if (47 === r) {
					if (o === s - 1 || 1 === h);
					else if (o !== s - 1 && 2 === h) {
						if (n.length < 2 || 2 !== i || 46 !== n.charCodeAt(n.length - 1) || 46 !== n.charCodeAt(n.length - 2)) {
							if (n.length > 2) {
								var a = n.lastIndexOf("/");
								if (a !== n.length - 1) {
									-1 === a ? (n = "", i = 0) : i = (n = n.slice(0, a)).length - 1 - n.lastIndexOf("/"), o = s, h = 0;
									continue;
								}
							} else if (2 === n.length || 1 === n.length) {
								n = "", i = 0, o = s, h = 0;
								continue;
							}
						}
						e && (n.length > 0 ? n += "/.." : n = "..", i = 2);
					} else n.length > 0 ? n += "/" + t.slice(o + 1, s) : n = t.slice(o + 1, s), i = s - o - 1;
					o = s, h = 0;
				} else 46 === r && -1 !== h ? ++h : h = -1;
			}
			return n;
		}
		var n = {
			resolve: function() {
				for (var t, n = "", i = !1, o = arguments.length - 1; o >= -1 && !i; o--) {
					var h;
					o >= 0 ? h = arguments[o] : (void 0 === t && (t = process$1.cwd()), h = t), e(h), 0 !== h.length && (n = h + "/" + n, i = 47 === h.charCodeAt(0));
				}
				return n = r(n, !i), i ? n.length > 0 ? "/" + n : "/" : n.length > 0 ? n : ".";
			},
			normalize: function(t) {
				if (e(t), 0 === t.length) return ".";
				var n = 47 === t.charCodeAt(0), i = 47 === t.charCodeAt(t.length - 1);
				return 0 !== (t = r(t, !n)).length || n || (t = "."), t.length > 0 && i && (t += "/"), n ? "/" + t : t;
			},
			isAbsolute: function(t) {
				return e(t), t.length > 0 && 47 === t.charCodeAt(0);
			},
			join: function() {
				if (0 === arguments.length) return ".";
				for (var t, r = 0; r < arguments.length; ++r) {
					var i = arguments[r];
					e(i), i.length > 0 && (void 0 === t ? t = i : t += "/" + i);
				}
				return void 0 === t ? "." : n.normalize(t);
			},
			relative: function(t, r) {
				if (e(t), e(r), t === r) return "";
				if ((t = n.resolve(t)) === (r = n.resolve(r))) return "";
				for (var i = 1; i < t.length && 47 === t.charCodeAt(i); ++i);
				for (var o = t.length, h = o - i, s = 1; s < r.length && 47 === r.charCodeAt(s); ++s);
				for (var a = r.length - s, c = h < a ? h : a, f = -1, u = 0; u <= c; ++u) {
					if (u === c) {
						if (a > c) {
							if (47 === r.charCodeAt(s + u)) return r.slice(s + u + 1);
							if (0 === u) return r.slice(s + u);
						} else h > c && (47 === t.charCodeAt(i + u) ? f = u : 0 === u && (f = 0));
						break;
					}
					var l = t.charCodeAt(i + u);
					if (l !== r.charCodeAt(s + u)) break;
					47 === l && (f = u);
				}
				var g = "";
				for (u = i + f + 1; u <= o; ++u) u !== o && 47 !== t.charCodeAt(u) || (0 === g.length ? g += ".." : g += "/..");
				return g.length > 0 ? g + r.slice(s + f) : (s += f, 47 === r.charCodeAt(s) && ++s, r.slice(s));
			},
			_makeLong: function(t) {
				return t;
			},
			dirname: function(t) {
				if (e(t), 0 === t.length) return ".";
				for (var r = t.charCodeAt(0), n = 47 === r, i = -1, o = !0, h = t.length - 1; h >= 1; --h) if (47 === (r = t.charCodeAt(h))) {
					if (!o) {
						i = h;
						break;
					}
				} else o = !1;
				return -1 === i ? n ? "/" : "." : n && 1 === i ? "//" : t.slice(0, i);
			},
			basename: function(t, r) {
				if (void 0 !== r && "string" != typeof r) throw new TypeError("\"ext\" argument must be a string");
				e(t);
				var n, i = 0, o = -1, h = !0;
				if (void 0 !== r && r.length > 0 && r.length <= t.length) {
					if (r.length === t.length && r === t) return "";
					var s = r.length - 1, a = -1;
					for (n = t.length - 1; n >= 0; --n) {
						var c = t.charCodeAt(n);
						if (47 === c) {
							if (!h) {
								i = n + 1;
								break;
							}
						} else -1 === a && (h = !1, a = n + 1), s >= 0 && (c === r.charCodeAt(s) ? -1 === --s && (o = n) : (s = -1, o = a));
					}
					return i === o ? o = a : -1 === o && (o = t.length), t.slice(i, o);
				}
				for (n = t.length - 1; n >= 0; --n) if (47 === t.charCodeAt(n)) {
					if (!h) {
						i = n + 1;
						break;
					}
				} else -1 === o && (h = !1, o = n + 1);
				return -1 === o ? "" : t.slice(i, o);
			},
			extname: function(t) {
				e(t);
				for (var r = -1, n = 0, i = -1, o = !0, h = 0, s = t.length - 1; s >= 0; --s) {
					var a = t.charCodeAt(s);
					if (47 !== a) -1 === i && (o = !1, i = s + 1), 46 === a ? -1 === r ? r = s : 1 !== h && (h = 1) : -1 !== r && (h = -1);
					else if (!o) {
						n = s + 1;
						break;
					}
				}
				return -1 === r || -1 === i || 0 === h || 1 === h && r === i - 1 && r === n + 1 ? "" : t.slice(r, i);
			},
			format: function(t) {
				if (null === t || "object" != typeof t) throw new TypeError("The \"pathObject\" argument must be of type Object. Received type " + typeof t);
				return function(t, e) {
					var r = e.dir || e.root, n = e.base || (e.name || "") + (e.ext || "");
					return r ? r === e.root ? r + n : r + "/" + n : n;
				}(0, t);
			},
			parse: function(t) {
				e(t);
				var r = {
					root: "",
					dir: "",
					base: "",
					ext: "",
					name: ""
				};
				if (0 === t.length) return r;
				var n, i = t.charCodeAt(0), o = 47 === i;
				o ? (r.root = "/", n = 1) : n = 0;
				for (var h = -1, s = 0, a = -1, c = !0, f = t.length - 1, u = 0; f >= n; --f) if (47 !== (i = t.charCodeAt(f))) -1 === a && (c = !1, a = f + 1), 46 === i ? -1 === h ? h = f : 1 !== u && (u = 1) : -1 !== h && (u = -1);
				else if (!c) {
					s = f + 1;
					break;
				}
				return -1 === h || -1 === a || 0 === u || 1 === u && h === a - 1 && h === s + 1 ? -1 !== a && (r.base = r.name = 0 === s && o ? t.slice(1, a) : t.slice(s, a)) : (0 === s && o ? (r.name = t.slice(1, h), r.base = t.slice(1, a)) : (r.name = t.slice(s, h), r.base = t.slice(s, a)), r.ext = t.slice(h, a)), s > 0 ? r.dir = t.slice(0, s - 1) : o && (r.dir = "/"), r;
			},
			sep: "/",
			delimiter: ":",
			win32: null,
			posix: null
		};
		n.posix = n, t.exports = n;
	} };
	var e = {};
	function r(n) {
		var i = e[n];
		if (void 0 !== i) return i.exports;
		var o = e[n] = { exports: {} };
		return t[n](o, o.exports, r), o.exports;
	}
	var n;
	if (r.d = (t, e) => {
		for (var n in e) r.o(e, n) && !r.o(t, n) && Object.defineProperty(t, n, {
			enumerable: !0,
			get: e[n]
		});
	}, r.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e), "object" == typeof process$1) n = "win32" === process$1.platform;
	else if ("object" == typeof navigator) n = navigator.userAgent.indexOf("Windows") >= 0;
	var i = /^\w[\w\d+.-]*$/;
	var o = /^\//;
	var h = /^\/\//;
	function s(t, e) {
		if (!t.scheme && e) throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${t.authority}", path: "${t.path}", query: "${t.query}", fragment: "${t.fragment}"}`);
		if (t.scheme && !i.test(t.scheme)) throw new Error("[UriError]: Scheme contains illegal characters.");
		if (t.path) {
			if (t.authority) {
				if (!o.test(t.path)) throw new Error("[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash (\"/\") character");
			} else if (h.test(t.path)) throw new Error("[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters (\"//\")");
		}
	}
	var a = "";
	var c = "/";
	var f = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
	var u = class u {
		static isUri(t) {
			return t instanceof u || !!t && "string" == typeof t.authority && "string" == typeof t.fragment && "string" == typeof t.path && "string" == typeof t.query && "string" == typeof t.scheme && "string" == typeof t.fsPath && "function" == typeof t.with && "function" == typeof t.toString;
		}
		scheme;
		authority;
		path;
		query;
		fragment;
		constructor(t, e, r, n, i, o = !1) {
			"object" == typeof t ? (this.scheme = t.scheme || a, this.authority = t.authority || a, this.path = t.path || a, this.query = t.query || a, this.fragment = t.fragment || a) : (this.scheme = function(t, e) {
				return t || e ? t : "file";
			}(t, o), this.authority = e || a, this.path = function(t, e) {
				switch (t) {
					case "https":
					case "http":
					case "file": e ? e[0] !== c && (e = c + e) : e = c;
				}
				return e;
			}(this.scheme, r || a), this.query = n || a, this.fragment = i || a, s(this, o));
		}
		get fsPath() {
			return y$1(this, !1);
		}
		with(t) {
			if (!t) return this;
			let { scheme: e, authority: r, path: n, query: i, fragment: o } = t;
			return void 0 === e ? e = this.scheme : null === e && (e = a), void 0 === r ? r = this.authority : null === r && (r = a), void 0 === n ? n = this.path : null === n && (n = a), void 0 === i ? i = this.query : null === i && (i = a), void 0 === o ? o = this.fragment : null === o && (o = a), e === this.scheme && r === this.authority && n === this.path && i === this.query && o === this.fragment ? this : new g$1(e, r, n, i, o);
		}
		static parse(t, e = !1) {
			const r = f.exec(t);
			return r ? new g$1(r[2] || a, A$1(r[4] || a), A$1(r[5] || a), A$1(r[7] || a), A$1(r[9] || a), e) : new g$1(a, a, a, a, a);
		}
		static file(t) {
			let e = a;
			if (n && (t = t.replace(/\\/g, c)), t[0] === c && t[1] === c) {
				const r = t.indexOf(c, 2);
				-1 === r ? (e = t.substring(2), t = c) : (e = t.substring(2, r), t = t.substring(r) || c);
			}
			return new g$1("file", e, t, a, a);
		}
		static from(t) {
			const e = new g$1(t.scheme, t.authority, t.path, t.query, t.fragment);
			return s(e, !0), e;
		}
		toString(t = !1) {
			return v$1(this, t);
		}
		toJSON() {
			return this;
		}
		static revive(t) {
			if (t) {
				if (t instanceof u) return t;
				{
					const e = new g$1(t);
					return e._formatted = t.external, e._fsPath = t._sep === l ? t.fsPath : null, e;
				}
			}
			return t;
		}
	};
	var l = n ? 1 : void 0;
	var g$1 = class extends u {
		_formatted = null;
		_fsPath = null;
		get fsPath() {
			return this._fsPath || (this._fsPath = y$1(this, !1)), this._fsPath;
		}
		toString(t = !1) {
			return t ? v$1(this, !0) : (this._formatted || (this._formatted = v$1(this, !1)), this._formatted);
		}
		toJSON() {
			const t = { $mid: 1 };
			return this._fsPath && (t.fsPath = this._fsPath, t._sep = l), this._formatted && (t.external = this._formatted), this.path && (t.path = this.path), this.scheme && (t.scheme = this.scheme), this.authority && (t.authority = this.authority), this.query && (t.query = this.query), this.fragment && (t.fragment = this.fragment), t;
		}
	};
	var p = {
		58: "%3A",
		47: "%2F",
		63: "%3F",
		35: "%23",
		91: "%5B",
		93: "%5D",
		64: "%40",
		33: "%21",
		36: "%24",
		38: "%26",
		39: "%27",
		40: "%28",
		41: "%29",
		42: "%2A",
		43: "%2B",
		44: "%2C",
		59: "%3B",
		61: "%3D",
		32: "%20"
	};
	function d$1(t, e, r) {
		let n, i = -1;
		for (let o = 0; o < t.length; o++) {
			const h = t.charCodeAt(o);
			if (h >= 97 && h <= 122 || h >= 65 && h <= 90 || h >= 48 && h <= 57 || 45 === h || 46 === h || 95 === h || 126 === h || e && 47 === h || r && 91 === h || r && 93 === h || r && 58 === h) -1 !== i && (n += encodeURIComponent(t.substring(i, o)), i = -1), void 0 !== n && (n += t.charAt(o));
			else {
				void 0 === n && (n = t.substr(0, o));
				const e = p[h];
				void 0 !== e ? (-1 !== i && (n += encodeURIComponent(t.substring(i, o)), i = -1), n += e) : -1 === i && (i = o);
			}
		}
		return -1 !== i && (n += encodeURIComponent(t.substring(i))), void 0 !== n ? n : t;
	}
	function m$1(t) {
		let e;
		for (let r = 0; r < t.length; r++) {
			const n = t.charCodeAt(r);
			35 === n || 63 === n ? (void 0 === e && (e = t.substr(0, r)), e += p[n]) : void 0 !== e && (e += t[r]);
		}
		return void 0 !== e ? e : t;
	}
	function y$1(t, e) {
		let r;
		return r = t.authority && t.path.length > 1 && "file" === t.scheme ? `//${t.authority}${t.path}` : 47 === t.path.charCodeAt(0) && (t.path.charCodeAt(1) >= 65 && t.path.charCodeAt(1) <= 90 || t.path.charCodeAt(1) >= 97 && t.path.charCodeAt(1) <= 122) && 58 === t.path.charCodeAt(2) ? e ? t.path.substr(1) : t.path[1].toLowerCase() + t.path.substr(2) : t.path, n && (r = r.replace(/\//g, "\\")), r;
	}
	function v$1(t, e) {
		const r = e ? m$1 : d$1;
		let n = "", { scheme: i, authority: o, path: h, query: s, fragment: a } = t;
		if (i && (n += i, n += ":"), (o || "file" === i) && (n += c, n += c), o) {
			let t = o.indexOf("@");
			if (-1 !== t) {
				const e = o.substr(0, t);
				o = o.substr(t + 1), t = e.lastIndexOf(":"), -1 === t ? n += r(e, !1, !1) : (n += r(e.substr(0, t), !1, !1), n += ":", n += r(e.substr(t + 1), !1, !0)), n += "@";
			}
			o = o.toLowerCase(), t = o.lastIndexOf(":"), -1 === t ? n += r(o, !1, !0) : (n += r(o.substr(0, t), !1, !0), n += o.substr(t));
		}
		if (h) {
			if (h.length >= 3 && 47 === h.charCodeAt(0) && 58 === h.charCodeAt(2)) {
				const t = h.charCodeAt(1);
				t >= 65 && t <= 90 && (h = `/${String.fromCharCode(t + 32)}:${h.substr(3)}`);
			} else if (h.length >= 2 && 58 === h.charCodeAt(1)) {
				const t = h.charCodeAt(0);
				t >= 65 && t <= 90 && (h = `${String.fromCharCode(t + 32)}:${h.substr(2)}`);
			}
			n += r(h, !0, !1);
		}
		return s && (n += "?", n += r(s, !1, !1)), a && (n += "#", n += e ? a : d$1(a, !1, !1)), n;
	}
	function b$1(t) {
		try {
			return decodeURIComponent(t);
		} catch {
			return t.length > 3 ? t.substr(0, 3) + b$1(t.substr(3)) : t;
		}
	}
	var C = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
	function A$1(t) {
		return t.match(C) ? t.replace(C, (t) => b$1(t)) : t;
	}
	var w$1 = r(975);
	var x$1 = w$1.posix || w$1;
	var P$1 = "/";
	var _$1;
	(function(t) {
		t.joinPath = function(t, ...e) {
			return t.with({ path: x$1.join(t.path, ...e) });
		}, t.resolvePath = function(t, ...e) {
			let r = t.path, n = !1;
			r[0] !== P$1 && (r = P$1 + r, n = !0);
			let i = x$1.resolve(r, ...e);
			return n && i[0] === P$1 && !t.authority && (i = i.substring(1)), t.with({ path: i });
		}, t.dirname = function(t) {
			if (0 === t.path.length || t.path === P$1) return t;
			let e = x$1.dirname(t.path);
			return 1 === e.length && 46 === e.charCodeAt(0) && (e = ""), t.with({ path: e });
		}, t.basename = function(t) {
			return x$1.basename(t.path);
		}, t.extname = function(t) {
			return x$1.extname(t.path);
		};
	})(_$1 || (_$1 = {}));
	//#endregion
	//#region src/utils.ts
	function notEmpty(value) {
		return value !== null && value !== void 0;
	}
	function isEmptyRange(range) {
		return range.start.row === range.end.row && range.start.column === range.end.column;
	}
	function mergeRanges(ranges) {
		var list = ranges;
		list = list.sort(function(a, b) {
			return comparePoints(a.start, b.start);
		});
		var next = list[0], range;
		for (var i = 1; i < list.length; i++) {
			range = next;
			next = list[i];
			var cmp = comparePoints(range.end, next.start);
			if (cmp < 0) continue;
			if (cmp == 0 && !isEmptyRange(range) && !isEmptyRange(next)) continue;
			if (comparePoints(range.end, next.end) < 0) {
				range.end.row = next.end.row;
				range.end.column = next.end.column;
			}
			list.splice(i, 1);
			next = range;
			i--;
		}
		return list;
	}
	function comparePoints(p1, p2) {
		return p1.row - p2.row || p1.column - p2.column;
	}
	function checkValueAgainstRegexpArray(value, regexpArray) {
		if (!regexpArray) return false;
		for (let i = 0; i < regexpArray.length; i++) if (regexpArray[i].test(value)) return true;
		return false;
	}
	/**
	* Converts a given file path to a URI format. If the given file path is already a URI,
	* it normalizes and optionally resolves the path against a workspace URI.
	*
	* @param filePath - The file path to convert to a URI. Can be an absolute path or an existing file URI.
	* @param [joinWorkspaceURI] - Optional flag to determine if the converted URI should be joined with given URI
	* @param [workspaceUri] - The base workspace URI to resolve against if `joinWorkspaceURI` is true. Required if resolution is needed.
	* @return {string} - The resulting URI
	*/
	function convertToUri(filePath, joinWorkspaceURI = false, workspaceUri) {
		const isFullUri = filePath.startsWith("file://");
		const normalizedPath = filePath.replace(/\\/g, "/");
		let uri;
		if (isFullUri) uri = u.parse(normalizedPath);
		else uri = u.file(normalizedPath);
		if (joinWorkspaceURI && workspaceUri) {
			if (!workspaceUri.startsWith("file://")) throw new Error("workspaceUri must be a file:// URI");
			const workspaceUriParsed = u.parse(workspaceUri);
			uri = _$1.joinPath(workspaceUriParsed, uri.path);
		}
		return uri.toString();
	}
	//#endregion
	//#region src/ace/range-singleton.ts
	var AceRange = class AceRange {
		static getConstructor(editor) {
			if (!AceRange._instance && editor) AceRange._instance = editor.getSelectionRange().constructor;
			return AceRange._instance;
		}
	};
	//#endregion
	//#region src/type-converters/common-converters.ts
	var CommonConverter;
	(function(_CommonConverter) {
		function normalizeRanges(completions) {
			return completions && completions.map((el) => {
				if (el["range"]) el["range"] = toRange(el["range"]);
				return el;
			});
		}
		_CommonConverter.normalizeRanges = normalizeRanges;
		function cleanHtml(html) {
			return html.replace(/<a\s/, "<a target='_blank' ");
		}
		_CommonConverter.cleanHtml = cleanHtml;
		function toRange(range) {
			if (!range || !range.start || !range.end) return;
			return AceRange.getConstructor().fromPoints(range.start, range.end);
		}
		_CommonConverter.toRange = toRange;
		function convertKind(kind) {
			switch (kind) {
				case "primitiveType":
				case "keyword": return import_main.CompletionItemKind.Keyword;
				case "variable":
				case "localVariable": return import_main.CompletionItemKind.Variable;
				case "memberVariable":
				case "memberGetAccessor":
				case "memberSetAccessor": return import_main.CompletionItemKind.Field;
				case "function":
				case "memberFunction":
				case "constructSignature":
				case "callSignature":
				case "indexSignature": return import_main.CompletionItemKind.Function;
				case "enum": return import_main.CompletionItemKind.Enum;
				case "module": return import_main.CompletionItemKind.Module;
				case "class": return import_main.CompletionItemKind.Class;
				case "interface": return import_main.CompletionItemKind.Interface;
				case "warning": return import_main.CompletionItemKind.File;
			}
			return import_main.CompletionItemKind.Property;
		}
		_CommonConverter.convertKind = convertKind;
		function excludeByErrorMessage(diagnostics, errorMessagesToIgnore, fieldName = "message") {
			if (!errorMessagesToIgnore) return diagnostics;
			return diagnostics.filter((el) => !checkValueAgainstRegexpArray(el[fieldName], errorMessagesToIgnore));
		}
		_CommonConverter.excludeByErrorMessage = excludeByErrorMessage;
	})(CommonConverter || (CommonConverter = {}));
	//#endregion
	//#region src/message-types.ts
	var BaseMessage = class {
		constructor(documentIdentifier, callbackId) {
			this.sessionId = documentIdentifier.sessionId;
			this.documentUri = documentIdentifier.documentUri;
			this.callbackId = callbackId;
		}
	};
	var InitMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value, version, mode, options) {
			super(documentIdentifier, callbackId);
			this.type = 0;
			this.version = version;
			this.options = options;
			this.mode = mode;
			this.value = value;
		}
	};
	var FormatMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value, format) {
			super(documentIdentifier, callbackId);
			this.type = 1;
			this.value = value;
			this.format = format;
		}
	};
	var CompleteMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value) {
			super(documentIdentifier, callbackId);
			this.type = 2;
			this.value = value;
		}
	};
	var InlineCompleteMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value) {
			super(documentIdentifier, callbackId);
			this.type = 27;
			this.value = value;
		}
	};
	var ResolveCompletionMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value) {
			super(documentIdentifier, callbackId);
			this.type = 3;
			this.value = value;
		}
	};
	var HoverMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value) {
			super(documentIdentifier, callbackId);
			this.type = 5;
			this.value = value;
		}
	};
	var ValidateMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId) {
			super(documentIdentifier, callbackId);
			this.type = 6;
		}
	};
	var ChangeMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value, version) {
			super(documentIdentifier, callbackId);
			this.type = 4;
			this.value = value;
			this.version = version;
		}
	};
	var DeltasMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value, version) {
			super(documentIdentifier, callbackId);
			this.type = 7;
			this.value = value;
			this.version = version;
		}
	};
	var ChangeModeMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value, version, mode) {
			super(documentIdentifier, callbackId);
			this.type = 8;
			this.value = value;
			this.mode = mode;
			this.version = version;
		}
	};
	var ChangeOptionsMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, options, merge = false) {
			super(documentIdentifier, callbackId);
			this.type = 9;
			this.options = options;
			this.merge = merge;
		}
	};
	var CloseDocumentMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId) {
			super(documentIdentifier, callbackId);
			this.type = 10;
		}
	};
	var CloseConnectionMessage = class {
		constructor(callbackId) {
			this.type = 15;
			this.callbackId = callbackId;
		}
	};
	var GlobalOptionsMessage = class {
		constructor(serviceName, options, merge) {
			this.type = 11;
			this.serviceName = serviceName;
			this.options = options;
			this.merge = merge;
		}
	};
	var ConfigureFeaturesMessage = class {
		constructor(serviceName, options) {
			this.type = 12;
			this.serviceName = serviceName;
			this.options = options;
		}
	};
	var SignatureHelpMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value) {
			super(documentIdentifier, callbackId);
			this.type = 13;
			this.value = value;
		}
	};
	var DocumentHighlightMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value) {
			super(documentIdentifier, callbackId);
			this.type = 14;
			this.value = value;
		}
	};
	var GetSemanticTokensMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value) {
			super(documentIdentifier, callbackId);
			this.type = 17;
			this.value = value;
		}
	};
	var GetCodeActionsMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value, context) {
			super(documentIdentifier, callbackId);
			this.type = 18;
			this.value = value;
			this.context = context;
		}
	};
	var SetWorkspaceMessage = class {
		constructor(value) {
			this.type = 22;
			this.value = value;
		}
	};
	var ExecuteCommandMessage = class {
		constructor(serviceName, callbackId, command, args) {
			this.type = 19;
			this.serviceName = serviceName;
			this.callbackId = callbackId;
			this.value = command;
			this.args = args;
		}
	};
	var AppliedEditMessage = class {
		constructor(value, serviceName, callbackId) {
			this.type = 21;
			this.serviceName = serviceName;
			this.callbackId = callbackId;
			this.value = value;
		}
	};
	var RenameDocumentMessage = class extends BaseMessage {
		constructor(documentIdentifier, callbackId, value, version) {
			super(documentIdentifier, callbackId);
			this.type = 23;
			this.value = value;
			this.version = version;
		}
	};
	var SendRequestMessage = class {
		constructor(serviceName, callbackId, requestName, args) {
			this.type = 24;
			this.serviceName = serviceName;
			this.callbackId = callbackId;
			this.value = requestName;
			this.args = args;
		}
	};
	var SendResponseMessage = class {
		constructor(serviceName, callbackId, args) {
			this.type = 26;
			this.serviceName = serviceName;
			this.callbackId = callbackId;
			this.args = args;
		}
	};
	var MessageType = /* @__PURE__ */ function(MessageType) {
		MessageType[MessageType["init"] = 0] = "init";
		MessageType[MessageType["format"] = 1] = "format";
		MessageType[MessageType["complete"] = 2] = "complete";
		MessageType[MessageType["resolveCompletion"] = 3] = "resolveCompletion";
		MessageType[MessageType["change"] = 4] = "change";
		MessageType[MessageType["hover"] = 5] = "hover";
		MessageType[MessageType["validate"] = 6] = "validate";
		MessageType[MessageType["applyDelta"] = 7] = "applyDelta";
		MessageType[MessageType["changeMode"] = 8] = "changeMode";
		MessageType[MessageType["changeOptions"] = 9] = "changeOptions";
		MessageType[MessageType["closeDocument"] = 10] = "closeDocument";
		MessageType[MessageType["globalOptions"] = 11] = "globalOptions";
		MessageType[MessageType["configureFeatures"] = 12] = "configureFeatures";
		MessageType[MessageType["signatureHelp"] = 13] = "signatureHelp";
		MessageType[MessageType["documentHighlight"] = 14] = "documentHighlight";
		MessageType[MessageType["closeConnection"] = 15] = "closeConnection";
		MessageType[MessageType["capabilitiesChange"] = 16] = "capabilitiesChange";
		MessageType[MessageType["getSemanticTokens"] = 17] = "getSemanticTokens";
		MessageType[MessageType["getCodeActions"] = 18] = "getCodeActions";
		MessageType[MessageType["executeCommand"] = 19] = "executeCommand";
		MessageType[MessageType["applyEdit"] = 20] = "applyEdit";
		MessageType[MessageType["appliedEdit"] = 21] = "appliedEdit";
		MessageType[MessageType["setWorkspace"] = 22] = "setWorkspace";
		MessageType[MessageType["renameDocument"] = 23] = "renameDocument";
		MessageType[MessageType["sendRequest"] = 24] = "sendRequest";
		MessageType[MessageType["showDocument"] = 25] = "showDocument";
		MessageType[MessageType["sendResponse"] = 26] = "sendResponse";
		MessageType[MessageType["inlineComplete"] = 27] = "inlineComplete";
		return MessageType;
	}({});
	//#endregion
	//#region src/message-controller.ts
	var MessageController = class {
		constructor(worker, provider) {
			this.callbacks = {};
			this.callbackId = 1;
			this.$worker = worker;
			this.provider = provider;
			this.$worker.addEventListener("message", (e) => {
				const message = e.data;
				const callbackId = message.callbackId;
				switch (message.type) {
					case MessageType.validate:
					case MessageType.capabilitiesChange:
						const sessionId = this.getSessionIdByUri(message.documentUri);
						if (!sessionId) return;
						if (message.type === MessageType.validate) this.provider.$sessionLanguageProviders[sessionId]?.$showAnnotations(message.value);
						else this.provider.$sessionLanguageProviders[sessionId]?.setServerCapabilities(message.value);
						break;
					case MessageType.applyEdit:
						const applied = (result, serviceName) => {
							this.$worker.postMessage(new AppliedEditMessage(result, serviceName, message.callbackId));
						};
						this.provider.applyEdit(message.value, message.serviceName, applied);
						break;
					case MessageType.showDocument:
						const sendResponse = (result, serviceName) => {
							this.$worker.postMessage(new SendResponseMessage(serviceName, message.callbackId, result));
						};
						this.provider.showDocument(message, message.serviceName, sendResponse);
						break;
					default:
						if (this.callbacks[callbackId]) {
							this.callbacks[callbackId](message.value);
							delete this.callbacks[callbackId];
						}
						break;
				}
			});
		}
		getSessionIdByUri(documentUri) {
			if (!documentUri) return;
			return this.provider.$urisToSessionsIds[documentUri] || this.provider.$urisToSessionsIds[convertToUri(documentUri)];
		}
		init(documentIdentifier, document, mode, options, initCallback) {
			this.postMessage(new InitMessage(documentIdentifier, this.callbackId++, document.getValue(), document["version"], mode, options), initCallback);
		}
		doValidation(documentIdentifier, callback) {
			this.postMessage(new ValidateMessage(documentIdentifier, this.callbackId++), callback);
		}
		doComplete(documentIdentifier, position, callback) {
			this.postMessage(new CompleteMessage(documentIdentifier, this.callbackId++, position), callback);
		}
		doInlineComplete(documentIdentifier, position, callback) {
			this.postMessage(new InlineCompleteMessage(documentIdentifier, this.callbackId++, position), callback);
		}
		doResolve(documentIdentifier, completion, callback) {
			this.postMessage(new ResolveCompletionMessage(documentIdentifier, this.callbackId++, completion), callback);
		}
		format(documentIdentifier, range, format, callback) {
			this.postMessage(new FormatMessage(documentIdentifier, this.callbackId++, range, format), callback);
		}
		doHover(documentIdentifier, position, callback) {
			this.postMessage(new HoverMessage(documentIdentifier, this.callbackId++, position), callback);
		}
		change(documentIdentifier, deltas, document, callback) {
			let message;
			if (deltas.length > 50 && deltas.length > document.getLength() >> 1) message = new ChangeMessage(documentIdentifier, this.callbackId++, document.getValue(), document.version);
			else message = new DeltasMessage(documentIdentifier, this.callbackId++, deltas, document.version);
			this.postMessage(message, callback);
		}
		changeMode(documentIdentifier, value, version, mode, callback) {
			this.postMessage(new ChangeModeMessage(documentIdentifier, this.callbackId++, value, version, mode), callback);
		}
		changeOptions(documentIdentifier, options, callback, merge = false) {
			this.postMessage(new ChangeOptionsMessage(documentIdentifier, this.callbackId++, options, merge), callback);
		}
		closeDocument(documentIdentifier, callback) {
			this.postMessage(new CloseDocumentMessage(documentIdentifier, this.callbackId++), callback);
		}
		closeConnection(callback) {
			this.postMessage(new CloseConnectionMessage(this.callbackId++), callback);
		}
		setGlobalOptions(serviceName, options, merge = false) {
			this.$worker.postMessage(new GlobalOptionsMessage(serviceName, options, merge));
		}
		provideSignatureHelp(documentIdentifier, position, callback) {
			this.postMessage(new SignatureHelpMessage(documentIdentifier, this.callbackId++, position), callback);
		}
		findDocumentHighlights(documentIdentifier, position, callback) {
			this.postMessage(new DocumentHighlightMessage(documentIdentifier, this.callbackId++, position), callback);
		}
		configureFeatures(serviceName, features) {
			this.$worker.postMessage(new ConfigureFeaturesMessage(serviceName, features));
		}
		getSemanticTokens(documentIdentifier, range, callback) {
			this.postMessage(new GetSemanticTokensMessage(documentIdentifier, this.callbackId++, range), callback);
		}
		getCodeActions(documentIdentifier, range, context, callback) {
			this.postMessage(new GetCodeActionsMessage(documentIdentifier, this.callbackId++, range, context), callback);
		}
		executeCommand(serviceName, command, args, callback) {
			this.postMessage(new ExecuteCommandMessage(serviceName, this.callbackId++, command, args), callback);
		}
		setWorkspace(workspaceUri, callback) {
			this.$worker.postMessage(new SetWorkspaceMessage(workspaceUri));
		}
		renameDocument(documentIdentifier, newDocumentUri, version) {
			this.$worker.postMessage(new RenameDocumentMessage(documentIdentifier, this.callbackId++, newDocumentUri, version));
		}
		sendRequest(serviceName, requestName, args, callback) {
			this.postMessage(new SendRequestMessage(serviceName, this.callbackId++, requestName, args), callback);
		}
		postMessage(message, callback) {
			if (callback) this.callbacks[message.callbackId] = callback;
			this.$worker.postMessage(message);
		}
	};
	//#endregion
	//#region src/type-converters/lsp/lsp-converters.ts
	function fromRange(range) {
		return {
			start: {
				line: range.start.row,
				character: range.start.column
			},
			end: {
				line: range.end.row,
				character: range.end.column
			}
		};
	}
	function rangeFromPositions(start, end) {
		return {
			start,
			end
		};
	}
	function toRange(range) {
		return {
			start: {
				row: range.start.line,
				column: range.start.character
			},
			end: {
				row: range.end.line,
				column: range.end.character
			}
		};
	}
	function fromPoint(point) {
		return {
			line: point.row,
			character: point.column
		};
	}
	function toAnnotations(diagnostics) {
		return diagnostics?.map((el) => {
			return {
				row: el.range.start.line,
				column: el.range.start.character,
				text: el.message,
				type: el.severity === 1 ? "error" : el.severity === 2 ? "warning" : "info",
				code: el.code,
				data: el.data
			};
		});
	}
	function fromAnnotations(annotations) {
		return annotations?.map((el) => {
			return {
				range: {
					start: {
						line: el.row,
						character: el.column
					},
					end: {
						line: el.row,
						character: el.column
					}
				},
				message: el.text,
				severity: el.type === "error" ? 1 : el.type === "warning" ? 2 : 3,
				code: el["code"],
				data: el["data"]
			};
		});
	}
	function toCompletion(item) {
		let itemKind = item.kind;
		let kind = itemKind ? Object.keys(import_main.CompletionItemKind)[Object.values(import_main.CompletionItemKind).indexOf(itemKind)] : void 0;
		let text = item.textEdit?.newText ?? item.insertText ?? item.label;
		let filterText;
		if (item.filterText) {
			const firstWordMatch = item.filterText.match(/\w+/);
			const firstWord = firstWordMatch ? firstWordMatch[0] : null;
			if (firstWord) {
				if (!new RegExp(`\\b${firstWord}\\b`, "i").test(text)) {
					text = `${item.filterText} ${text}`;
					filterText = item.filterText;
				}
			} else if (!text.includes(item.filterText)) {
				text = `${item.filterText} ${text}`;
				filterText = item.filterText;
			}
		}
		let command = item.command?.command == "editor.action.triggerSuggest" ? "startAutocomplete" : void 0;
		let range = item.textEdit ? getTextEditRange(item.textEdit, filterText) : void 0;
		let completion = {
			meta: kind,
			caption: item.label,
			score: void 0
		};
		completion["command"] = command;
		completion["range"] = range;
		completion["item"] = item;
		if (item.insertTextFormat == import_main.InsertTextFormat.Snippet) completion["snippet"] = text;
		else completion["value"] = text ?? "";
		completion["documentation"] = item.documentation;
		completion["position"] = item["position"];
		completion["service"] = item["service"];
		return completion;
	}
	function toCompletions(completions) {
		if (completions.length > 0) return getCompletionItems(completions).map((item) => toCompletion(item));
		return [];
	}
	function getCompletionItems(completions) {
		return completions.map((el) => {
			if (!el.completions) return [];
			let allCompletions;
			if (Array.isArray(el.completions)) allCompletions = el.completions;
			else allCompletions = el.completions.items;
			return allCompletions.map((item) => {
				item["service"] = el.service;
				return item;
			});
		}).flat();
	}
	function toInlineCompletion(item) {
		let text = typeof item.insertText === "string" ? item.insertText : item.insertText.value;
		let filterText;
		if (item.filterText) {
			const firstWordMatch = item.filterText.match(/\w+/);
			const firstWord = firstWordMatch ? firstWordMatch[0] : null;
			if (firstWord) {
				if (!new RegExp(`\\b${firstWord}\\b`, "i").test(text)) {
					text = `${item.filterText} ${text}`;
					filterText = item.filterText;
				}
			} else if (!text.includes(item.filterText)) {
				text = `${item.filterText} ${text}`;
				filterText = item.filterText;
			}
		}
		let command = item.command?.command == "editor.action.triggerSuggest" ? "startAutocomplete" : void 0;
		let range = item.range ? getInlineCompletionRange(item.range, filterText) : void 0;
		let completion = {};
		completion["command"] = command;
		completion["range"] = range;
		completion["item"] = item;
		if (typeof item.insertText !== "string") completion["snippet"] = text;
		else completion["value"] = text ?? "";
		completion["position"] = item["position"];
		completion["service"] = item["service"];
		return completion;
	}
	function toInlineCompletions(completions) {
		if (completions.length > 0) return getCompletionItems(completions).map((item) => toInlineCompletion(item));
		return [];
	}
	function toResolvedCompletion(completion, item) {
		completion["docMarkdown"] = fromMarkupContent(item.documentation);
		return completion;
	}
	function toCompletionItem(completion) {
		let command;
		if (completion["command"]) command = {
			title: "triggerSuggest",
			command: completion["command"]
		};
		let completionItem = {
			label: completion.caption ?? "",
			kind: CommonConverter.convertKind(completion.meta),
			command,
			insertTextFormat: completion["snippet"] ? import_main.InsertTextFormat.Snippet : import_main.InsertTextFormat.PlainText,
			documentation: completion["documentation"]
		};
		if (completion["range"]) completionItem.textEdit = {
			range: fromRange(completion["range"]),
			newText: completion["snippet"] ?? completion["value"]
		};
		else completionItem.insertText = completion["snippet"] ?? completion["value"];
		completionItem["fileName"] = completion["fileName"];
		completionItem["position"] = completion["position"];
		completionItem["item"] = completion["item"];
		completionItem["service"] = completion["service"];
		return completionItem;
	}
	function getTextEditRange(textEdit, filterText) {
		const filterLength = filterText ? filterText.length : 0;
		if ("insert" in textEdit && "replace" in textEdit) return mergeRanges([toRange(textEdit.insert), toRange(textEdit.replace)])[0];
		else {
			textEdit.range.start.character -= filterLength;
			return toRange(textEdit.range);
		}
	}
	function getInlineCompletionRange(range, filterText) {
		const filterLength = filterText ? filterText.length : 0;
		range.start.character -= filterLength;
		return toRange(range);
	}
	function toTooltip(hover) {
		if (!hover) return;
		let content = hover.map((el) => {
			if (!el || !el.contents) return;
			if (import_main.MarkupContent.is(el.contents)) return fromMarkupContent(el.contents);
			else if (import_main.MarkedString.is(el.contents)) {
				if (typeof el.contents === "string") return el.contents;
				return "```" + el.contents.value + "```";
			} else return el.contents.map((el) => {
				if (typeof el !== "string") return `\`\`\`${el.value}\`\`\``;
				else return el;
			}).join("\n\n");
		}).filter(notEmpty);
		if (content.length === 0) return;
		let lspRange = hover.find((el) => el?.range)?.range;
		let range;
		if (lspRange) range = toRange(lspRange);
		return {
			content: {
				type: "markdown",
				text: content.join("\n\n")
			},
			range
		};
	}
	function fromSignatureHelp(signatureHelp) {
		if (!signatureHelp) return;
		let content = signatureHelp.map((el) => {
			if (!el) return;
			let signatureIndex = el?.activeSignature || 0;
			let activeSignature = el.signatures[signatureIndex];
			if (!activeSignature) return;
			let activeParam = el?.activeParameter;
			let contents = activeSignature.label;
			if (activeParam != void 0 && activeSignature.parameters && activeSignature.parameters[activeParam]) {
				let param = activeSignature.parameters[activeParam].label;
				if (typeof param == "string") contents = contents.replace(param, `**${param}**`);
			}
			if (activeSignature.documentation) if (import_main.MarkupContent.is(activeSignature.documentation)) return contents + "\n\n" + fromMarkupContent(activeSignature.documentation);
			else {
				contents += "\n\n" + activeSignature.documentation;
				return contents;
			}
			else return contents;
		}).filter(notEmpty);
		if (content.length === 0) return;
		return { content: {
			type: "markdown",
			text: content.join("\n\n")
		} };
	}
	function fromMarkupContent(content) {
		if (!content) return;
		if (typeof content === "string") return content;
		else return content.value;
	}
	function fromAceDelta(delta, eol) {
		const text = delta.lines.length > 1 ? delta.lines.join(eol) : delta.lines[0];
		return {
			range: delta.action === "insert" ? rangeFromPositions(fromPoint(delta.start), fromPoint(delta.start)) : rangeFromPositions(fromPoint(delta.start), fromPoint(delta.end)),
			text: delta.action === "insert" ? text : ""
		};
	}
	function fromDocumentHighlights(documentHighlights) {
		return documentHighlights.map(function(el) {
			let className = el.kind == 2 ? "language_highlight_read" : el.kind == 3 ? "language_highlight_write" : "language_highlight_text";
			return toMarkerGroupItem(CommonConverter.toRange(toRange(el.range)), className);
		});
	}
	function mapSeverityToClassName(severity) {
		if (!severity) return "language_highlight_info";
		switch (severity) {
			case 1: return "language_highlight_error";
			case 2: return "language_highlight_warning";
			case 3:
			case 4: return "language_highlight_info";
		}
	}
	function toMarkerGroupItem(range, className, tooltipText) {
		let markerGroupItem = {
			range,
			className
		};
		if (tooltipText) markerGroupItem["tooltipText"] = tooltipText;
		return markerGroupItem;
	}
	//#endregion
	//#region src/cdn-worker.ts
	function createWorkerBlob(cdnUrl, services) {
		return new Blob([`
        importScripts("${cdnUrl}/service-manager.js");
        const manager = new ServiceManager(self);

        ${services.map((service) => `
            manager.registerService("${service.name}", {
                module: () => {
                    importScripts("${service.cdnUrl ?? cdnUrl}/${service.script}");
                    return {${service.className}};
                },
                className: "${service.className}",
                modes: "${service.modes}",
                cdnUrl: "${service.cdnUrl ?? cdnUrl}"
            });
        `).join("\n")}
    `], { type: "application/javascript" });
	}
	function createWorker(source, includeLinters) {
		if (includeLinters === void 0) includeLinters = true;
		if (typeof Worker == "undefined") return {
			postMessage: function() {},
			terminate: function() {}
		};
		let blob;
		if (typeof source === "string") blob = createWorkerBlob(source, getServices(includeLinters));
		else {
			const allServices = [...source.services, ...getServices(includeLinters)];
			const cdnUrl = source.serviceManagerCdn;
			blob = createWorkerBlob(cdnUrl, allServices);
		}
		var blobURL = (window.URL || window.webkitURL).createObjectURL(blob);
		return new Worker(blobURL);
	}
	function getServices(includeLinters) {
		const allServices = [
			{
				name: "json",
				script: "json-service.js",
				className: "JsonService",
				modes: "json"
			},
			{
				name: "html",
				script: "html-service.js",
				className: "HtmlService",
				modes: "html"
			},
			{
				name: "css",
				script: "css-service.js",
				className: "CssService",
				modes: "css"
			},
			{
				name: "less",
				script: "css-service.js",
				className: "CssService",
				modes: "less"
			},
			{
				name: "scss",
				script: "css-service.js",
				className: "CssService",
				modes: "scss"
			},
			{
				name: "typescript",
				script: "typescript-service.js",
				className: "TypescriptService",
				modes: "typescript|tsx|javascript|jsx"
			},
			{
				name: "lua",
				script: "lua-service.js",
				className: "LuaService",
				modes: "lua"
			},
			{
				name: "yaml",
				script: "yaml-service.js",
				className: "YamlService",
				modes: "yaml"
			},
			{
				name: "xml",
				script: "xml-service.js",
				className: "XmlService",
				modes: "xml"
			},
			{
				name: "php",
				script: "php-service.js",
				className: "PhpService",
				modes: "php"
			},
			{
				name: "eslint",
				script: "javascript-service.js",
				className: "JavascriptService",
				modes: "javascript"
			},
			{
				name: "python",
				script: "python-service.js",
				className: "PythonService",
				modes: "python",
				cdnUrl: "https://www.unpkg.com/ace-python-ruff-linter/build"
			}
		];
		if (includeLinters === true || includeLinters === void 0) return allServices;
		else if (includeLinters === false) return [];
		if (includeLinters.javascript) {
			includeLinters.eslint = includeLinters.javascript;
			delete includeLinters.javascript;
		}
		return allServices.filter((service) => {
			return includeLinters[service.name];
		});
	}
	//#endregion
	//#region src/ace/tooltip.ts
	var CLASSNAME = "ace_tooltip";
	var Tooltip = class {
		/**
		* @param {Element} parentNode
		**/
		constructor(parentNode) {
			this.isOpen = false;
			this.$element = null;
			this.$parentNode = parentNode;
		}
		$init() {
			this.$element = document.createElement("div");
			this.$element.className = CLASSNAME;
			this.$element.style.display = "none";
			this.$parentNode.appendChild(this.$element);
			return this.$element;
		}
		/**
		* @returns {HTMLElement}
		**/
		getElement() {
			return this.$element || this.$init();
		}
		/**
		* @param {String} text
		**/
		setText(text) {
			this.getElement().textContent = text;
		}
		/**
		* @param {String} html
		**/
		setHtml(html) {
			this.getElement().innerHTML = html;
		}
		/**
		* @param {Number} x
		* @param {Number} y
		**/
		setPosition(x, y) {
			this.getElement().style.left = x + "px";
			this.getElement().style.top = y + "px";
		}
		/**
		* @param {String} className
		**/
		setClassName(className) {
			this.getElement().className += " " + className;
		}
		setTheme(theme) {
			this.getElement().className = "ace_tooltip " + (theme.isDark ? "ace_dark " : "") + (theme.cssClass || "");
		}
		/**
		* @param {String} text
		* @param {Number} x
		* @param {Number} y
		**/
		show(text, x, y) {
			if (text != null) this.setText(text);
			if (x != null && y != null) this.setPosition(x, y);
			if (!this.isOpen) {
				this.getElement().style.display = "block";
				this.isOpen = true;
			}
		}
		hide() {
			if (this.isOpen) {
				this.getElement().style.display = "none";
				this.getElement().className = CLASSNAME;
				this.isOpen = false;
			}
		}
		/**
		* @returns {Number}
		**/
		getHeight() {
			return this.getElement().offsetHeight;
		}
		/**
		* @returns {Number}
		**/
		getWidth() {
			return this.getElement().offsetWidth;
		}
		destroy() {
			this.isOpen = false;
			if (this.$element && this.$element.parentNode) this.$element.parentNode.removeChild(this.$element);
		}
	};
	//#endregion
	//#region src/ace/popupManager.ts
	var PopupManager = class {
		constructor() {
			this.popups = /* @__PURE__ */ new Set();
			this.acePopups = /* @__PURE__ */ new Set();
			this.updateScheduled = false;
		}
		addPopup(popup) {
			if (!popup || typeof popup.getElement !== "function") {
				console.warn("Invalid popup object provided to addPopup");
				return;
			}
			this.popups.add(popup);
			this.scheduleUpdate();
		}
		addAcePopup(popup) {
			if (!popup) {
				console.warn("Invalid popup object provided to addAcePopup");
				return;
			}
			this.acePopups.add(popup);
			this.scheduleUpdate();
		}
		removePopup(popup) {
			if (this.popups.has(popup)) {
				this.popups.delete(popup);
				this.scheduleUpdate();
			}
		}
		removeAcePopup(popup) {
			if (this.acePopups.has(popup)) {
				this.acePopups.delete(popup);
				this.scheduleUpdate();
			}
		}
		scheduleUpdate() {
			if (this.updateScheduled) return;
			this.updateScheduled = true;
			requestAnimationFrame(() => {
				this.updateScheduled = false;
				this.updatePopups();
			});
		}
		cleanupStalePopups() {
			for (const popup of this.popups) if (!this.isPopupValid(popup)) this.popups.delete(popup);
			for (const popup of this.acePopups) if (!this.isPopupValid(popup)) this.acePopups.delete(popup);
		}
		isPopupValid(popup) {
			try {
				const element = typeof popup.getElement === "function" ? popup.getElement() : popup.container;
				return element && element.isConnected;
			} catch (e) {
				return false;
			}
		}
		updatePopups() {
			try {
				this.cleanupStalePopups();
				const pupups = Array.from(this.popups).sort((a, b) => (b.priority || 0) - (a.priority || 0));
				const sortedPopups = [...this.acePopups, ...pupups];
				const visiblePopups = [];
				for (const popup of sortedPopups) if (!this.shouldDisplayPopup(popup, visiblePopups)) this.safeHidePopup(popup);
				else visiblePopups.push(popup);
			} catch (error) {
				console.error("Error updating popups:", error);
			}
		}
		shouldDisplayPopup(popup, visiblePopups) {
			try {
				if (!this.isPopupValid(popup)) return false;
				for (const visiblePopup of visiblePopups) if (this.doPopupsOverlap(visiblePopup, popup)) return false;
				return true;
			} catch (error) {
				console.error("Error checking popup display:", error);
				return false;
			}
		}
		safeHidePopup(popup) {
			try {
				if (popup && typeof popup.hide === "function") popup.hide();
			} catch (error) {
				console.error("Error hiding popup:", error);
			}
		}
		doPopupsOverlap(popupA, popupB) {
			try {
				const elemA = typeof popupA.getElement === "function" ? popupA.getElement() : popupA.container;
				const elemB = typeof popupB.getElement === "function" ? popupB.getElement() : popupB.container;
				if (!elemA || !elemB || !elemA.isConnected || !elemB.isConnected) return false;
				const rectA = elemA.getBoundingClientRect();
				const rectB = elemB.getBoundingClientRect();
				return rectA.left < rectB.right && rectA.right > rectB.left && rectA.top < rectB.bottom && rectA.bottom > rectB.top;
			} catch (error) {
				console.error("Error checking popup overlap:", error);
				return false;
			}
		}
	};
	var popupManager = new PopupManager();
	//#endregion
	//#region src/components/base-tooltip.ts
	var BaseTooltip = class extends Tooltip {
		constructor(provider) {
			super(document.body);
			this.$show = () => {
				if (!this.$activeEditor) return;
				let editor = this.$activeEditor;
				var MARGIN = 10;
				var renderer = editor.renderer;
				if (!this.isOpen) {
					this.$registerEditorEvents();
					this.setTheme(renderer.theme);
					this.isOpen = true;
				}
				let position = renderer.textToScreenCoordinates(this.row, this.column);
				var rect = renderer.scroller.getBoundingClientRect();
				if (position.pageX < rect.left) position.pageX = rect.left;
				var element = this.getElement();
				element.style.maxHeight = "";
				element.style.display = "block";
				var labelHeight = element.clientHeight;
				var labelWidth = element.clientWidth;
				var spaceBelow = window.innerHeight - position.pageY - renderer.lineHeight;
				let isAbove = true;
				if (position.pageY - labelHeight < 0 && position.pageY < spaceBelow) isAbove = false;
				element.style.maxHeight = (isAbove ? position.pageY : spaceBelow) - MARGIN + "px";
				element.style.top = isAbove ? "" : position.pageY + renderer.lineHeight + "px";
				element.style.bottom = isAbove ? window.innerHeight - position.pageY + "px" : "";
				element.style.left = Math.min(position.pageX, window.innerWidth - labelWidth - MARGIN) + "px";
				popupManager.addPopup(this);
			};
			this.$hide = () => {
				if (this.timeout) {
					clearTimeout(this.timeout);
					this.timeout = null;
				}
				this.lastEvent = null;
				if (this.isOpen) {
					this.$removeEditorEvents();
					this.hide();
				}
				this.$inactivateEditor();
			};
			this.provider = provider;
			try {
				Tooltip.call(this, document.body);
			} catch (e) {}
			this.timeout = void 0;
			this.lastT = 0;
			this.idleTime = 500;
			var el = this.getElement();
			el.style.whiteSpace = "pre-wrap";
			el.style.pointerEvents = "auto";
		}
		hide() {
			super.hide();
			popupManager.removePopup(this);
		}
		show(param, pageX, pageY) {
			super.show(param, pageX, pageY);
			this.$registerEditorEvents();
		}
		setHtml(descriptionText) {
			super.setHtml(descriptionText);
		}
		$inactivateEditor() {
			this.$activeEditor = void 0;
		}
		$activateEditor(editor) {
			if (this.$activeEditor == editor) return;
			this.$activeEditor = editor;
		}
		destroy() {
			this.$hide();
		}
		$registerEditorEvents() {}
		$removeEditorEvents() {}
	};
	//#endregion
	//#region src/components/signature-tooltip.ts
	var SignatureTooltip = class extends BaseTooltip {
		constructor(..._args) {
			super(..._args);
			this.editorHandlers = /* @__PURE__ */ new Map();
			this.escCommand = {
				exec: this.$hide,
				bindKey: "Esc"
			};
			this.onChangeSelection = (editor) => {
				if (!this.provider.options.functionality.signatureHelp) return;
				this.$activateEditor(editor);
				if (this.isOpen) setTimeout(this.provideSignatureHelp, 0);
				else {
					this.lastT = Date.now();
					this.timeout = setTimeout(this.waitForSignature, this.idleTime);
				}
			};
			this.waitForSignature = () => {
				if (this.timeout) clearTimeout(this.timeout);
				var dt = Date.now() - this.lastT;
				if (this.idleTime - dt > 10) {
					this.timeout = setTimeout(this.waitForSignature, this.idleTime - dt);
					return;
				}
				this.timeout = void 0;
				this.provideSignatureHelp();
			};
			this.provideSignatureHelp = () => {
				if (!this.$activeEditor) return;
				let cursor = this.$activeEditor.getCursorPosition();
				let session = this.$activeEditor.session;
				let docPos = session.screenToDocumentPosition(cursor.row, cursor.column);
				this.provider.provideSignatureHelp(session, docPos, (tooltip) => {
					let descriptionText = tooltip ? this.provider.getTooltipText(tooltip) : null;
					if (!tooltip || !descriptionText) {
						this.hide();
						return;
					}
					let token = session.getTokenAt(docPos.row, docPos.column);
					let row = tooltip.range?.start.row ?? docPos.row;
					let column = tooltip.range?.start.column ?? token?.start ?? 0;
					if (this.descriptionText != descriptionText) {
						this.hide();
						this.setHtml(descriptionText);
						this.descriptionText = descriptionText;
					} else if (this.row == row && this.column == column && this.isOpen) return;
					this.row = row;
					this.column = column;
					this.$show();
				});
			};
			this.$onAfterRender = (e) => {
				if (!this.isOpen) return;
				setTimeout(() => {
					if (!this.$activeEditor?.isRowVisible(this.row)) this.$hide();
					else this.$show();
				}, 0);
			};
			this.$onBlur = (e) => {
				const relatedTarget = e.relatedTarget;
				if (relatedTarget instanceof Node && this.getElement().contains(relatedTarget)) return;
				this.$hide();
			};
		}
		registerEditor(editor) {
			const handler = () => this.onChangeSelection(editor);
			this.editorHandlers.set(editor, handler);
			editor.on("changeSelection", handler);
			editor.commands.addCommand(this.escCommand);
		}
		unregisterEditor(editor) {
			const handler = this.editorHandlers.get(editor);
			if (handler) {
				editor.off("changeSelection", handler);
				this.editorHandlers.delete(editor);
			}
			if (this.$activeEditor === editor) this.$inactivateEditor();
			editor.commands.removeCommand(this.escCommand);
		}
		$registerEditorEvents() {
			this.$activeEditor.renderer.on("afterRender", this.$onAfterRender);
			this.$activeEditor.on("blur", this.$onBlur);
		}
		$removeEditorEvents() {
			this.$activeEditor.renderer.off("afterRender", this.$onAfterRender);
			this.$activeEditor.off("blur", this.$onBlur);
		}
	};
	//#endregion
	//#region src/ace/hover-tooltip.ts
	function preventParentScroll(event) {
		event.stopPropagation();
		var target = event.currentTarget;
		if (!(target.scrollHeight > target.clientHeight)) event.preventDefault();
	}
	var HoverTooltip = class extends Tooltip {
		constructor(parentNode = document.body) {
			super(parentNode);
			/**@type{ReturnType<typeof setTimeout> | undefined}*/
			this.timeout = void 0;
			this.mouseOutHideTimer = null;
			this.mouseMoveHideTimer = null;
			this.$fromKeyboard = false;
			this.lastT = 0;
			this.idleTime = 350;
			this.lastEvent = void 0;
			this.onMouseOut = this.onMouseOut.bind(this);
			this.onMouseMove = this.onMouseMove.bind(this);
			this.waitForHover = this.waitForHover.bind(this);
			this.hide = this.hide.bind(this);
			var el = this.getElement();
			el.style.whiteSpace = "pre-wrap";
			el.style.pointerEvents = "auto";
			el.addEventListener("mouseout", this.onMouseOut);
			el.tabIndex = -1;
			el.addEventListener("blur", function() {
				if (!el.contains(document.activeElement)) this.hide();
			}.bind(this));
			el.addEventListener("wheel", preventParentScroll);
		}
		/**
		* @param {Editor} editor
		*/
		addToEditor(editor) {
			editor.on("mousemove", this.onMouseMove);
			editor.on("mousedown", this.hide);
			var target = editor.renderer.getMouseEventTarget();
			if (target && typeof target.removeEventListener === "function") target.addEventListener("mouseout", this.onMouseOut, true);
		}
		/**
		* @param {Editor} editor
		*/
		removeFromEditor(editor) {
			editor.off("mousemove", this.onMouseMove);
			editor.off("mousedown", this.hide);
			var target = editor.renderer.getMouseEventTarget();
			if (target && typeof target.removeEventListener === "function") target.removeEventListener("mouseout", this.onMouseOut, true);
			if (this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			if (this.mouseOutHideTimer !== null) {
				clearTimeout(this.mouseOutHideTimer);
				this.mouseOutHideTimer = null;
			}
			if (this.mouseMoveHideTimer !== null) {
				clearTimeout(this.mouseMoveHideTimer);
				this.mouseMoveHideTimer = null;
			}
		}
		/**
		* @param {MouseEvent} e
		* @param {Editor} editor
		* @internal
		*/
		onMouseMove(e, editor) {
			this.lastEvent = e;
			this.lastT = Date.now();
			var isMousePressed = editor["$mouseHandler"].isMousePressed;
			if (this.isOpen) {
				var pos = this.lastEvent && this.lastEvent.getDocumentPosition();
				if (!this.range || !this.range.contains(pos.row, pos.column) || isMousePressed || this.isOutsideOfText(this.lastEvent)) this.deferHideFromMouseMove();
				else if (this.mouseMoveHideTimer !== null) {
					clearTimeout(this.mouseMoveHideTimer);
					this.mouseMoveHideTimer = null;
				}
			}
			if (this.timeout || isMousePressed) return;
			this.lastEvent = e;
			this.timeout = setTimeout(this.waitForHover, this.idleTime);
		}
		waitForHover() {
			if (this.timeout) clearTimeout(this.timeout);
			var dt = Date.now() - this.lastT;
			if (this.idleTime - dt > 10) {
				this.timeout = setTimeout(this.waitForHover, this.idleTime - dt);
				return;
			}
			this.timeout = null;
			if (this.lastEvent && !this.isOutsideOfText(this.lastEvent)) this.$gatherData(this.lastEvent, this.lastEvent.editor);
		}
		/**
		* @param {MouseEvent} e
		*/
		isOutsideOfText(e) {
			var editor = e.editor;
			var docPos = e.getDocumentPosition();
			var line = editor.session.getLine(docPos.row);
			if (docPos.column == line.length) {
				var screenPos = editor.renderer.pixelToScreenCoordinates(e.clientX, e.clientY);
				var clippedPos = editor.session.documentToScreenPosition(docPos.row, docPos.column);
				if (clippedPos.column != screenPos.column || clippedPos.row != screenPos.row) return true;
			}
			return false;
		}
		/**
		* @param {(event: MouseEvent, editor: Editor) => void} value
		*/
		setDataProvider(value) {
			this.$gatherData = value;
		}
		showForRange(editor, range, domNode, startingEvent) {
			if (startingEvent && startingEvent != this.lastEvent) return;
			if (this.isOpen && document.activeElement == this.getElement()) return;
			var renderer = editor.renderer;
			if (!this.isOpen) {
				this.$registerCloseEvents();
				this.setTheme(renderer.theme);
			}
			this.isOpen = true;
			const Range = editor.getSelectionRange().constructor;
			this.range = Range.fromPoints(range.start, range.end);
			var position = renderer.textToScreenCoordinates(range.start.row, range.start.column);
			var rect = renderer.scroller.getBoundingClientRect();
			if (position.pageX < rect.left) position.pageX = rect.left;
			var element = this.getElement();
			element.innerHTML = "";
			element.appendChild(domNode);
			element.style.maxHeight = "";
			element.style.display = "block";
			this.$setPosition(editor, position, true, range);
			if (editor.renderer["$textLayer"].dom.$fixPositionBug) editor.renderer["$textLayer"].dom.$fixPositionBug(element);
			popupManager.addPopup(this);
		}
		/**
		* @param {Editor} editor
		* @param {{pageX: number;pageY: number;}} position
		* @param {boolean} withMarker
		* @param {Range} [range]
		*/
		$setPosition(editor, position, withMarker, range) {
			var MARGIN = 10;
			withMarker && this.addMarker(range, editor.session);
			var renderer = editor.renderer;
			var element = this.getElement();
			var labelHeight = element.offsetHeight;
			var labelWidth = element.offsetWidth;
			var anchorTop = position.pageY;
			var anchorLeft = position.pageX;
			var spaceBelow = window.innerHeight - anchorTop - renderer.lineHeight;
			var isAbove = this.$shouldPlaceAbove(labelHeight, anchorTop, spaceBelow - MARGIN);
			element.style.maxHeight = (isAbove ? anchorTop : spaceBelow) - MARGIN + "px";
			element.style.top = isAbove ? "" : anchorTop + renderer.lineHeight + "px";
			element.style.bottom = isAbove ? window.innerHeight - anchorTop + "px" : "";
			element.style.left = Math.min(anchorLeft, window.innerWidth - labelWidth - MARGIN) + "px";
		}
		/**
		* @param {number} labelHeight
		* @param {number} anchorTop
		* @param {number} spaceBelow
		*/
		$shouldPlaceAbove(labelHeight, anchorTop, spaceBelow) {
			return !(anchorTop - labelHeight < 0 && anchorTop < spaceBelow);
		}
		addMarker(range, session) {
			if (this.marker) this.$markerSession.removeMarker(this.marker);
			this.$markerSession = session;
			this.marker = session && range ? session.addMarker(range, "ace_highlight-marker", "text") : null;
		}
		hide(e) {
			if (e && this.$fromKeyboard && e.type == "keydown") {
				if (e.code == "Escape") return;
			}
			if (!e && document.activeElement == this.getElement()) return;
			if (e && e.target && (e.type != "keydown" || e.ctrlKey || e.metaKey) && this.$element?.contains(e.target)) return;
			this.lastEvent = null;
			if (this.timeout) clearTimeout(this.timeout);
			this.timeout = null;
			if (this.mouseOutHideTimer !== null) {
				clearTimeout(this.mouseOutHideTimer);
				this.mouseOutHideTimer = null;
			}
			if (this.mouseMoveHideTimer !== null) {
				clearTimeout(this.mouseMoveHideTimer);
				this.mouseMoveHideTimer = null;
			}
			this.addMarker(null);
			if (this.isOpen) {
				this.$fromKeyboard = false;
				this.$removeCloseEvents();
				this.getElement().style.display = "none";
				this.isOpen = false;
				popupManager.removePopup(this);
			}
		}
		$registerCloseEvents() {
			window.addEventListener("keydown", this.hide, true);
			window.addEventListener("wheel", this.hide, true);
			window.addEventListener("mousedown", this.hide, true);
		}
		$removeCloseEvents() {
			window.removeEventListener("keydown", this.hide, true);
			window.removeEventListener("wheel", this.hide, true);
			window.removeEventListener("mousedown", this.hide, true);
		}
		/**
		* @internal
		*/
		onMouseOut(e) {
			if (this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			if (this.mouseOutHideTimer !== null) {
				clearTimeout(this.mouseOutHideTimer);
				this.mouseOutHideTimer = null;
			}
			if (this.mouseMoveHideTimer !== null) {
				clearTimeout(this.mouseMoveHideTimer);
				this.mouseMoveHideTimer = null;
			}
			this.lastEvent = null;
			if (!this.isOpen) return;
			const tooltipEl = this.getElement();
			if (!e.relatedTarget || tooltipEl.contains(e.relatedTarget)) return;
			if (e && e.currentTarget.contains(e.relatedTarget)) return;
			if (this.isPointerInsideTooltipBounds(e, tooltipEl)) return;
			if (e.relatedTarget.classList.contains("ace_content")) return;
			this.mouseOutHideTimer = window.setTimeout(() => {
				this.mouseOutHideTimer = null;
				if (!this.isOpen) return;
				if (tooltipEl.matches(":hover")) return;
				if (document.activeElement && tooltipEl.contains(document.activeElement)) return;
				this.hide();
			}, 0);
		}
		deferHideFromMouseMove() {
			if (this.mouseMoveHideTimer !== null) {
				clearTimeout(this.mouseMoveHideTimer);
				this.mouseMoveHideTimer = null;
			}
			const tooltipEl = this.getElement();
			if (tooltipEl.matches(":hover")) return;
			this.mouseMoveHideTimer = window.setTimeout(() => {
				this.mouseMoveHideTimer = null;
				if (!this.isOpen) return;
				if (tooltipEl.matches(":hover")) return;
				if (document.activeElement && tooltipEl.contains(document.activeElement)) return;
				this.hide();
			}, 50);
		}
		isPointerInsideTooltipBounds(e, tooltipEl) {
			if (typeof e.clientX !== "number" || typeof e.clientY !== "number") return false;
			const rect = tooltipEl.getBoundingClientRect();
			return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
		}
	};
	//#endregion
	//#region src/ace/renderer-singleton.ts
	var AceVirtualRenderer = class AceVirtualRenderer {
		static getConstructor(editor) {
			if (!AceVirtualRenderer._instance && editor) AceVirtualRenderer._instance = editor.renderer.constructor;
			return AceVirtualRenderer._instance;
		}
	};
	//#endregion
	//#region src/ace/editor-singleton.ts
	var AceEditor = class AceEditor {
		static getConstructor(editor) {
			if (!AceEditor._instance && editor) AceEditor._instance = editor.constructor;
			return AceEditor._instance;
		}
	};
	//#endregion
	//#region src/ace/acePopup.ts
	var getAriaId = function(index) {
		return `suggest-aria-id:${index}`;
	};
	var ua = (typeof navigator == "object" ? navigator : { userAgent: "" }).userAgent || "";
	var isSafari = parseFloat(ua.split(" Safari/")[1]) || void 0;
	var popupAriaRole = isSafari ? "menu" : "listbox";
	var optionAriaRole = isSafari ? "menuitem" : "option";
	var ariaActiveState = isSafari ? "aria-current" : "aria-selected";
	/**
	*
	* @param {HTMLElement} [el]
	* @return {Editor}
	*/
	var $singleLineEditor = function(el) {
		var Renderer = AceVirtualRenderer.getConstructor();
		var Editor = AceEditor.getConstructor();
		var renderer = new Renderer(el);
		renderer.$maxLines = 4;
		var editor = new Editor(renderer);
		editor.setHighlightActiveLine(false);
		editor.setShowPrintMargin(false);
		editor.renderer.setShowGutter(false);
		editor.renderer.setHighlightGutterLine(false);
		editor.$mouseHandler.$focusTimeout = 0;
		editor.$highlightTagPending = true;
		return editor;
	};
	/**
	* This object is used in some places where needed to show popups - like prompt; autocomplete etc.
	*/
	var AcePopup = class {
		/**
		* Creates and renders single line editor in popup window. If `parentNode` param is isset, then attaching it to this element.
		* @param {Element} [parentNode]
		* @return {Ace.AcePopup}
		*/
		constructor(parentNode) {
			var el = document.createElement("div");
			var popup = $singleLineEditor(el);
			var Range = AceRange.getConstructor();
			if (parentNode) parentNode.appendChild(el);
			el.style.display = "none";
			popup.renderer.content.style.cursor = "default";
			popup.renderer.setStyle("ace_autocomplete");
			popup.renderer["$textLayer"].element.setAttribute("role", popupAriaRole);
			popup.renderer["textarea"].setAttribute("aria-hidden", "true");
			popup.setOption("displayIndentGuides", false);
			popup.setOption("dragDelay", 150);
			var noop = function() {};
			popup.focus = noop;
			popup.$isFocused = true;
			popup.renderer["$cursorLayer"].restartTimer = noop;
			popup.renderer["$cursorLayer"].element.style.opacity = "0";
			popup.renderer["$maxLines"] = 8;
			popup.renderer["$keepTextAreaAtCursor"] = false;
			popup.setHighlightActiveLine(false);
			popup.session.highlight("");
			popup.session["$searchHighlight"].clazz = "ace_highlight-marker";
			popup.on("mousedown", function(e) {
				var pos = e.getDocumentPosition();
				popup.selection.moveToPosition(pos);
				selectionMarker.start.row = selectionMarker.end.row = pos.row;
				e.stop();
			});
			var lastMouseEvent;
			var hoverMarker = new Range(-1, 0, -1, Infinity);
			var selectionMarker = new Range(-1, 0, -1, Infinity);
			selectionMarker.id = popup.session.addMarker(selectionMarker, "ace_active-line", "fullLine");
			popup.setSelectOnHover = function(val) {
				if (!val) hoverMarker.id = popup.session.addMarker(hoverMarker, "ace_line-hover", "fullLine");
				else if (hoverMarker.id) {
					popup.session.removeMarker(hoverMarker.id);
					hoverMarker.id = void 0;
				}
			};
			popup.setSelectOnHover(false);
			popup.on("mousemove", function(e) {
				if (!lastMouseEvent) {
					lastMouseEvent = e;
					return;
				}
				if (lastMouseEvent.x == e.x && lastMouseEvent.y == e.y) return;
				lastMouseEvent = e;
				lastMouseEvent.scrollTop = popup.renderer.scrollTop;
				popup.isMouseOver = true;
				var row = lastMouseEvent.getDocumentPosition().row;
				if (hoverMarker.start.row != row) {
					if (!hoverMarker.id) popup.setRow(row);
					setHoverMarker(row);
				}
			});
			popup.renderer.on("beforeRender", function() {
				if (lastMouseEvent && hoverMarker.start.row != -1) {
					lastMouseEvent.$pos = null;
					var row = lastMouseEvent.getDocumentPosition().row;
					if (!hoverMarker.id) popup.setRow(row);
					setHoverMarker(row, true);
				}
			});
			popup.renderer.on("afterRender", function() {
				var row = popup.getRow();
				var t = popup.renderer["$textLayer"];
				var selected = t.element.childNodes[row - t.config.firstRow];
				var el = document.activeElement;
				if (selected !== popup.selectedNode && popup.selectedNode) {
					popup.renderer["$textLayer"].dom.removeCssClass(popup.selectedNode, "ace_selected");
					el?.removeAttribute("aria-activedescendant");
					popup.selectedNode.removeAttribute(ariaActiveState);
					popup.selectedNode.removeAttribute("id");
				}
				popup.selectedNode = selected;
				if (selected) {
					popup.renderer["$textLayer"].dom.addCssClass(selected, "ace_selected");
					var ariaId = getAriaId(row);
					selected.id = ariaId;
					t.element.setAttribute("aria-activedescendant", ariaId);
					el?.setAttribute("aria-activedescendant", ariaId);
					selected.setAttribute("role", optionAriaRole);
					selected.setAttribute("aria-label", popup.getData(row).caption || popup.getData(row).value);
					selected.setAttribute("aria-setsize", popup.data.length);
					selected.setAttribute("aria-posinset", row + 1);
					selected.setAttribute("aria-describedby", "doc-tooltip");
					selected.setAttribute(ariaActiveState, "true");
				}
			});
			var hideHoverMarker = function() {
				setHoverMarker(-1);
			};
			var setHoverMarker = function(row, suppressRedraw) {
				if (row !== hoverMarker.start.row) {
					hoverMarker.start.row = hoverMarker.end.row = row;
					if (!suppressRedraw) popup.session._emit("changeBackMarker");
					popup._emit("changeHoverMarker");
				}
			};
			popup.getHoveredRow = function() {
				return hoverMarker.start.row;
			};
			popup.container.addEventListener("mouseout", function() {
				popup.isMouseOver = false;
				hideHoverMarker();
			});
			popup.on("hide", hideHoverMarker);
			popup.on("changeSelection", hideHoverMarker);
			popup.session.doc.getLength = function() {
				return popup.data.length;
			};
			popup.session.doc.getLine = function(i) {
				var data = popup.data[i];
				if (typeof data == "string") return data;
				return data && data.value || "";
			};
			var bgTokenizer = popup.session.bgTokenizer;
			bgTokenizer.$tokenizeRow = function(row) {
				/**@type {import("../../ace-internal").Ace.Completion &{name?, className?, matchMask?, message?}}*/
				var data = popup.data[row];
				var tokens = [];
				if (!data) return tokens;
				if (typeof data == "string") data = { value: data };
				var caption = data.caption || data.value || data.name;
				function addToken(value, className) {
					value && tokens.push({
						type: (data.className || "") + (className || ""),
						value
					});
				}
				var lower = caption.toLowerCase();
				var filterText = (popup.filterText || "").toLowerCase();
				var lastIndex = 0;
				var lastI = 0;
				for (var i = 0; i <= filterText.length; i++) if (i != lastI && (data.matchMask & 1 << i || i == filterText.length)) {
					var sub = filterText.slice(lastI, i);
					lastI = i;
					var index = lower.indexOf(sub, lastIndex);
					if (index == -1) continue;
					addToken(caption.slice(lastIndex, index), "");
					lastIndex = index + sub.length;
					addToken(caption.slice(index, lastIndex), "completion-highlight");
				}
				addToken(caption.slice(lastIndex, caption.length), "");
				tokens.push({
					type: "completion-spacer",
					value: " "
				});
				if (data.meta) tokens.push({
					type: "completion-meta",
					value: data.meta
				});
				if (data.message) tokens.push({
					type: "completion-message",
					value: data.message
				});
				return tokens;
			};
			bgTokenizer.$updateOnChange = noop;
			bgTokenizer.start = noop;
			popup.session["$computeWidth"] = function() {
				return this.screenWidth = 0;
			};
			popup.isOpen = false;
			popup.isTopdown = false;
			popup.autoSelect = true;
			popup.filterText = "";
			popup.isMouseOver = false;
			popup.data = [];
			popup.setData = function(list, filterText) {
				popup.filterText = filterText || "";
				popup.setValue("\n".repeat(list.length), -1);
				popup.data = list || [];
				popup.setRow(0);
			};
			popup.getData = function(row) {
				return popup.data[row];
			};
			popup.getRow = function() {
				return selectionMarker.start.row;
			};
			popup.setRow = function(line) {
				line = Math.max(this.autoSelect ? 0 : -1, Math.min(this.data.length - 1, line));
				if (selectionMarker.start.row != line) {
					popup.selection.clearSelection();
					selectionMarker.start.row = selectionMarker.end.row = line || 0;
					popup.session._emit("changeBackMarker");
					popup.moveCursorTo(line || 0, 0);
					if (popup.isOpen) popup._signal("select");
				}
			};
			popup.on("changeSelection", function() {
				if (popup.isOpen) popup.setRow(popup.selection.lead.row);
				popup.renderer.scrollCursorIntoView();
			});
			popup.hide = function() {
				this.container.style.display = "none";
				popup.anchorPos = null;
				popup.anchor = null;
				if (popup.isOpen) {
					popup.isOpen = false;
					this._signal("hide");
				}
			};
			/**
			* Tries to show the popup anchored to the given position and anchors.
			* If the anchor is not specified it tries to align to bottom and right as much as possible.
			* If the popup does not have enough space to be rendered with the given anchors, it returns false without rendering the popup.
			* The forceShow flag can be used to render the popup in these cases, which slides the popup so it entirely fits on the screen.
			* @param {{top: number, left: number}} pos
			* @param {number} lineHeight
			* @param {"top" | "bottom" | undefined} anchor
			* @param {boolean} forceShow
			* @returns {boolean}
			*/
			popup.tryShow = function(pos, lineHeight, anchor, forceShow) {
				if (!forceShow && popup.isOpen && popup.anchorPos && popup.anchor && popup.anchorPos.top === pos.top && popup.anchorPos.left === pos.left && popup.anchor === anchor) return true;
				var el = this.container;
				var screenHeight = window.innerHeight;
				var screenWidth = window.innerWidth;
				var renderer = this.renderer;
				var maxH = renderer.$maxLines * lineHeight * 1.4;
				var dims = {
					top: 0,
					bottom: 0,
					left: 0
				};
				var spaceBelow = screenHeight - pos.top - 3 * this.$borderSize - lineHeight;
				var spaceAbove = pos.top - 3 * this.$borderSize;
				if (!anchor) if (spaceAbove <= spaceBelow || spaceBelow >= maxH) anchor = "bottom";
				else anchor = "top";
				if (anchor === "top") {
					dims.bottom = pos.top - this.$borderSize;
					dims.top = dims.bottom - maxH;
				} else if (anchor === "bottom") {
					dims.top = pos.top + lineHeight + this.$borderSize;
					dims.bottom = dims.top + maxH;
				}
				var fitsX = dims.top >= 0 && dims.bottom <= screenHeight;
				if (!forceShow && !fitsX) return false;
				if (!fitsX) if (anchor === "top") renderer.$maxPixelHeight = spaceAbove;
				else renderer.$maxPixelHeight = spaceBelow;
				else renderer.$maxPixelHeight = null;
				if (anchor === "top") {
					el.style.top = "";
					el.style.bottom = screenHeight - dims.bottom + "px";
					popup.isTopdown = false;
				} else {
					el.style.top = dims.top + "px";
					el.style.bottom = "";
					popup.isTopdown = true;
				}
				el.style.display = "";
				var left = pos.left;
				if (left + el.offsetWidth > screenWidth) left = screenWidth - el.offsetWidth;
				el.style.left = left + "px";
				el.style.right = "";
				if (!popup.isOpen) {
					popup.isOpen = true;
					this._signal("show");
					lastMouseEvent = null;
				}
				popup.anchorPos = pos;
				popup.anchor = anchor;
				return true;
			};
			popup.show = function(pos, lineHeight, topdownOnly) {
				this.tryShow(pos, lineHeight, topdownOnly ? "bottom" : void 0, true);
			};
			popup.goTo = function(where) {
				var row = this.getRow();
				var max = this.session.getLength() - 1;
				switch (where) {
					case "up":
						row = row <= 0 ? max : row - 1;
						break;
					case "down":
						row = row >= max ? -1 : row + 1;
						break;
					case "start":
						row = 0;
						break;
					case "end":
						row = max;
						break;
				}
				this.setRow(row);
			};
			popup.getTextLeftOffset = function() {
				return this.$borderSize + this.renderer.$padding + this.$imageSize;
			};
			popup.$imageSize = 0;
			popup.$borderSize = 1;
			return popup;
		}
	};
	//#endregion
	//#region src/components/action-menu-popup.ts
	var ActionMenuPopup = class {
		constructor(parentNode, onSelect, options) {
			this.onSelect = onSelect;
			this.items = [];
			this.isOpenState = false;
			this.anchorEl = null;
			this.hide = () => {
				if (!this.isOpenState) return;
				this.popup.hide();
				this.popupManagerRef.removeAcePopup(this.popup);
				this.isOpenState = false;
				this.anchorEl = null;
				window.removeEventListener("mousedown", this.onWindowMouseDown, true);
				window.removeEventListener("keydown", this.onWindowKeyDown, true);
				window.removeEventListener("wheel", this.onWindowScrollOrResize, true);
				window.removeEventListener("resize", this.onWindowScrollOrResize, true);
			};
			this.onWindowMouseDown = (event) => {
				const target = event.target;
				if (target && this.popup.container.contains(target)) return;
				if (target && this.anchorEl && this.anchorEl.contains(target)) return;
				this.hide();
			};
			this.onWindowKeyDown = (event) => {
				if (event.key === "Escape") this.hide();
			};
			this.onWindowScrollOrResize = () => {
				this.hide();
			};
			this.popup = options?.popupFactory ? options.popupFactory(parentNode) : new AcePopup(parentNode);
			this.lineHeight = options?.lineHeight ?? 12;
			this.popupManagerRef = options?.popupManager ?? popupManager;
			this.popup.on("click", (e) => {
				const selected = this.popup.getData(this.popup.getRow());
				if (selected?.menuValue !== void 0) this.onSelect(selected.menuValue);
				this.hide();
				e.stop();
			});
		}
		get isOpen() {
			return this.isOpenState;
		}
		setItems(items) {
			this.items = items;
			const popupItems = items.map((item) => ({
				value: item.label,
				meta: item.meta,
				menuValue: item.value
			}));
			this.popup.setData(popupItems, "");
		}
		showAt(x, y, topdownOnly = false, anchor) {
			if (!this.items.length) return;
			this.anchorEl = anchor ?? null;
			this.popup.show({
				top: y,
				left: x
			}, this.lineHeight, topdownOnly);
			this.popupManagerRef.addAcePopup(this.popup);
			this.isOpenState = true;
			window.addEventListener("mousedown", this.onWindowMouseDown, true);
			window.addEventListener("keydown", this.onWindowKeyDown, true);
			window.addEventListener("wheel", this.onWindowScrollOrResize, true);
			window.addEventListener("resize", this.onWindowScrollOrResize, true);
		}
		showBelowAnchor(anchor, offsetY = 4) {
			const rect = anchor.getBoundingClientRect();
			this.showAt(rect.right, rect.bottom + offsetY, false, anchor);
		}
		destroy() {
			this.hide();
			this.popup.destroy();
		}
	};
	//#endregion
	//#region src/components/lightbulb.ts
	var LightbulbWidget = class {
		constructor(editor, executeActionCallback) {
			this.lightBulbWidth = 10;
			this.lightBulbHeight = 16;
			this.hideAll = () => {
				this.hideLightbulb();
				this.menuPopup.hide();
			};
			this.setPosition = () => {
				const position = this.calculatePosition();
				this.lightbulb.style.left = `${position.x}px`;
				this.lightbulb.style.top = `${position.y}px`;
			};
			this.editor = editor;
			this.codeActions = [];
			this.executeActionCallback = executeActionCallback;
			this.menuPopup = new ActionMenuPopup(editor.container || document.body || document.documentElement, ({ action, serviceName }) => {
				this.executeAction(action, serviceName);
			}, { lineHeight: 12 });
			this.setEditorListeners(editor);
			this.createLightbulb();
		}
		setEditorListeners(editor) {
			editor.on("changeSelection", this.hideAll);
			editor.on("focus", this.hideAll);
			editor.renderer.on("afterRender", this.setPosition);
		}
		removeListeners() {
			this.editor.off("changeSelection", this.hideAll);
			this.editor.off("focus", this.hideAll);
			this.editor.renderer.off("afterRender", this.setPosition);
			this.editor.session.off("changeScrollTop", this.setPosition);
			this.editor.session.off("changeScrollLeft", this.setPosition);
		}
		setExecuteActionCallback(callback) {
			this.executeActionCallback = callback;
		}
		createLightbulb() {
			this.lightbulb = document.createElement("div");
			this.lightbulb.id = "lightbulb";
			this.lightbulb.style.display = "none";
			this.lightbulb.style.position = "absolute";
			this.lightbulb.style.width = this.lightBulbWidth + "px";
			this.lightbulb.style.height = this.lightBulbHeight + "px";
			this.lightbulb.style.zIndex = "999";
			this.lightbulb.style.background = "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmlld0JveD0iNi4yMTM2IDIuMjk4MSAxMi42OTI0IDE4LjYzMjgiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPHBhdGggZD0iTSAxNi43ODEgNC4wOCBDIDE1LjQzMyAyLjc1MiAxMy42MiAyLjA5OCAxMS44MSAyLjM1MiBDIDguOTUyIDIuNzU0IDYuNjY4IDUuMjE0IDYuMjc4IDguMzA4IEMgNS45ODYgMTAuNjE2IDYuNjk2IDEyLjg0NSA4LjIyNyAxNC40MjQgQyA5LjE4NyAxNS40MTUgOS43MzkgMTYuNzgzIDkuNzM5IDE4LjE3NSBMIDE1LjM5NiAxOC4xODkgQyAxNS4zOTYgMTYuODc2IDE1LjkxMSAxNS40MTggMTYuODc1IDE0LjQzNSBDIDE4LjE2NSAxMy4xMTYgMTguOTA2IDExLjI0OSAxOC45MDYgOS4zMTQgQyAxOC45MDYgNy4zMTcgMTguMTMzIDUuNDEgMTYuNzgxIDQuMDggWiIgc3R5bGU9ImZpbGw6IHJnYigyNTIsIDE5NSwgODcpOyIgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgMCwgLTEuNDIxMDg1NDcxNTIwMjAwNGUtMTQpIi8+DQogIDxyZWN0IHg9IjguMzgiIHk9IjIzMy42NzkiIHdpZHRoPSI0LjMxMyIgaGVpZ2h0PSIwLjAxMSIgc3R5bGU9ImZpbGw6IHJnYigyMTYsIDIxNiwgMjE2KTsgc3Ryb2tlOiByZ2IoMCwgMCwgMCk7IiB0cmFuc2Zvcm09Im1hdHJpeCgxLCAwLCAwLCAtMSwgMi4wNzg5ODQxMDcxNjIxODUsIDI1Mi45MzUzNDM1OTU5NDE5NikiLz4NCiAgPHJlY3QgeD0iLTExLjY2NSIgeT0iLTIzLjU5NSIgd2lkdGg9IjMuMDk4IiBzdHlsZT0iZmlsbDogcmdiKDIxNiwgMjE2LCAyMTYpOyBzdHJva2U6IHJnYigwLCAwLCAwKTsiIHRyYW5zZm9ybT0ibWF0cml4KDAuOTk5OTgxOTk5Mzk3Mjc3OSwgLTAuMDA2MDUyOTk5NzU3MjMwMjgxLCAwLCAxLjAwMDAxODAwMDYwMjcyMjIsIDIyLjcyOTA4NDk0NDQxNjMwNywgNDQuNDQ0NjczNDQ4NDU5MDg1KSIgaGVpZ2h0PSIwLjAxMSIvPg0KPC9zdmc+) no-repeat center center";
			this.lightbulb.style.cursor = "pointer";
			this.lightbulb.setAttribute("role", "button");
			this.lightbulb.setAttribute("aria-label", "Show code actions");
			this.editor.container.appendChild(this.lightbulb);
			this.lightbulb.addEventListener("click", (event) => {
				this.showMenu(event.clientX, event.clientY);
			});
		}
		setCodeActions(actions) {
			this.codeActions = actions;
		}
		showMenu(x, y) {
			if (this.codeActions.length === 0) return;
			this.menuPopup.setItems(this.getPopupItems());
			this.menuPopup.showAt(x, y, false);
		}
		isEmpty() {
			if (this.codeActions.length === 0) return true;
			for (let actionsByService of this.codeActions) if (actionsByService.codeActions && actionsByService.codeActions.length > 0) return false;
			return true;
		}
		getPopupItems() {
			let codeActions = [];
			this.codeActions.forEach((codeActionsByService) => {
				codeActionsByService.codeActions?.forEach((action) => {
					codeActions.push({
						label: action.title,
						value: {
							action,
							serviceName: codeActionsByService.service
						}
					});
				});
			});
			return codeActions;
		}
		executeAction(action, serviceName) {
			this.executeActionCallback && this.executeActionCallback(action, serviceName);
			this.hideLightbulb();
		}
		showLightbulb() {
			if (this.isEmpty()) return;
			this.setPosition();
			this.lightbulb.style.display = "block";
		}
		hideLightbulb() {
			this.lightbulb.style.display = "none";
		}
		calculatePosition() {
			const gutterCenter = Math.round(this.editor.renderer["gutterWidth"] / 2 - this.lightBulbWidth);
			const firstRow = this.editor.renderer.getFirstVisibleRow();
			const cursor = this.editor.getCursorPosition();
			const lineHeight = this.editor.renderer.lineHeight;
			return {
				x: gutterCenter,
				y: (cursor.row - firstRow) * lineHeight
			};
		}
		dispose() {
			this.removeListeners();
			if (this.lightbulb && this.lightbulb.parentNode) this.lightbulb.parentNode.removeChild(this.lightbulb);
			this.menuPopup.destroy();
		}
	};
	//#endregion
	//#region src/misc/styles.ts
	function setStyles(editor) {
		editor.renderer["$textLayer"].dom.importCssString(`.ace_tooltip * {
    margin: 0;
    font-size: 12px;
}

.ace_tooltip code {
    font-style: italic;
    font-size: 11px;
}

.language_highlight_error {
    position: absolute;
    border-bottom: dotted 1px #e00404;
    z-index: 2000;
    border-radius: 0;
}

.language_highlight_warning {
    position: absolute;
    border-bottom: solid 1px #DDC50F;
    z-index: 2000;
    border-radius: 0;
}

.language_highlight_info {
    position: absolute;
    border-bottom: dotted 1px #999;
    z-index: 2000;
    border-radius: 0;
}

.language_highlight_text, .language_highlight_read, .language_highlight_write {
    position: absolute;
    box-sizing: border-box;
    border: solid 1px #888;
    z-index: 2000;
}

.language_highlight_write {
    border: solid 1px #F88;
}

.ace_highlight_unnecessary {
    opacity: 0.5;
}

.ace_highlight_deprecated {
    text-decoration: line-through;
}

.ace_lsp_hover_quickfixes {
    margin-top: 8px;
    border-top: 1px solid rgba(127,127,127,0.35);
}

.ace_lsp_hover_quickfixes_title {
    font-weight: 600;
    margin-bottom: 6px;
}

.ace_lsp_hover_quickfixes_controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ace_lsp_hover_quickfixes_link {
    cursor: pointer;
    text-decoration: underline;
    color: var(--ace-link-color, #2563eb);
    font-weight: 500;
}

.ace_lsp_hover_quickfixes_primary {
    flex: 1;
}

.ace_lsp_hover_quickfixes_more {
    white-space: nowrap;
}`, "linters.css");
		editor.renderer["$textLayer"].dom.importCssString(`
.ace_editor.ace_autocomplete .ace_marker-layer .ace_active-line {
    background-color: #CAD6FA;
    z-index: 1;
}
.ace_dark.ace_editor.ace_autocomplete .ace_marker-layer .ace_active-line {
    background-color: #3a674e;
}
.ace_editor.ace_autocomplete .ace_line-hover {
    border: 1px solid #abbffe;
    margin-top: -1px;
    background: rgba(233,233,253,0.4);
    position: absolute;
    z-index: 2;
}
.ace_dark.ace_editor.ace_autocomplete .ace_line-hover {
    border: 1px solid rgba(109, 150, 13, 0.8);
    background: rgba(58, 103, 78, 0.62);
}
.ace_completion-meta {
    opacity: 0.5;
    margin-left: 0.9em;
}
.ace_completion-message {
    margin-left: 0.9em;
    color: blue;
}
.ace_editor.ace_autocomplete .ace_completion-highlight{
    color: #2d69c7;
}
.ace_dark.ace_editor.ace_autocomplete .ace_completion-highlight{
    color: #93ca12;
}
.ace_editor.ace_autocomplete {
    width: 300px;
    z-index: 200000;
    border: 1px lightgray solid;
    position: fixed;
    box-shadow: 2px 3px 5px rgba(0,0,0,.2);
    line-height: 1.4;
    background: #fefefe;
    color: #111;
}
.ace_dark.ace_editor.ace_autocomplete {
    border: 1px #484747 solid;
    box-shadow: 2px 3px 5px rgba(0, 0, 0, 0.51);
    line-height: 1.4;
    background: #25282c;
    color: #c1c1c1;
}
.ace_autocomplete .ace_text-layer  {
    width: calc(100% - 8px);
}
.ace_autocomplete .ace_line {
    display: flex;
    align-items: center;
}
.ace_autocomplete .ace_line > * {
    min-width: 0;
    flex: 0 0 auto;
}
.ace_autocomplete .ace_line .ace_ {
    flex: 0 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
}
.ace_autocomplete .ace_completion-spacer {
    flex: 1;
}
.ace_autocomplete.ace_loading:after  {
    content: "";
    position: absolute;
    top: 0px;
    height: 2px;
    width: 8%;
    background: blue;
    z-index: 100;
    animation: ace_progress 3s infinite linear;
    animation-delay: 300ms;
    transform: translateX(-100%) scaleX(1);
}
@keyframes ace_progress {
    0% { transform: translateX(-100%) scaleX(1) }
    50% { transform: translateX(625%) scaleX(2) } 
    100% { transform: translateX(1500%) scaleX(3) } 
}
@media (prefers-reduced-motion) {
    .ace_autocomplete.ace_loading:after {
        transform: translateX(625%) scaleX(2);
        animation: none;
     }
}
`, "autocompletion.css", false);
	}
	//#endregion
	//#region src/ace/inline-completer-adapter/prototype-validation.ts
	function validateAcePrototypes(InlineAutocomplete, CommandBarTooltip, CompletionProvider) {
		const proto = InlineAutocomplete.prototype;
		for (const method of [
			"detach",
			"destroy",
			"show",
			"getCompletionProvider",
			"getInlineTooltip"
		]) if (typeof proto[method] !== "function") throw new Error(`InlineAutocomplete.prototype missing method: ${method}`);
		const cbProto = CommandBarTooltip.prototype;
		[
			"registerCommand",
			"setAlwaysShow",
			"getAlwaysShow"
		].forEach((method) => {
			if (typeof cbProto[method] !== "function") throw new Error(`CommandBarTooltip.prototype missing method: ${method}`);
		});
		if (typeof CompletionProvider.prototype.gatherCompletions !== "function") throw new Error("CompletionProvider.prototype missing method: gatherCompletions");
	}
	//#endregion
	//#region src/ace/inline_autocomplete.ts
	function createInlineCompleterAdapter(OriginalInlineAutocomplete, OriginalCommandBarTooltip, OriginalCompletionProvider) {
		validateAcePrototypes(OriginalInlineAutocomplete, OriginalCommandBarTooltip, OriginalCompletionProvider);
		var destroyCompleter = function(e, editor) {
			editor.inlineCompleter && editor.inlineCompleter.destroy();
		};
		class InlineCompletionProvider extends OriginalCompletionProvider {
			gatherCompletions(editor, callback) {
				var session = editor.getSession();
				var pos = editor.getCursorPosition();
				var prefix = getCompletionPrefix(editor);
				var matches = [];
				this.completers = editor.inlineCompleters;
				var total = editor.inlineCompleters.length;
				editor.inlineCompleters.forEach(function(completer, i) {
					completer.getCompletions(editor, session, pos, prefix, function(err, results) {
						if (completer.hideInlinePreview) results = results.map((result) => {
							return Object.assign(result, { hideInlinePreview: completer.hideInlinePreview });
						});
						if (!err && results) matches = matches.concat(results);
						callback(null, {
							prefix: getCompletionPrefix(editor),
							matches,
							finished: --total === 0
						});
					});
				});
				return true;
			}
		}
		class InlineCompleter extends OriginalInlineAutocomplete {
			getCompletionProvider(initialPosition) {
				if (!this.completionProvider) this.completionProvider = new InlineCompletionProvider(initialPosition);
				return this.completionProvider;
			}
			show(options) {
				this.activated = true;
				if (this.editor.inlineCompleter !== this) {
					if (this.editor.inlineCompleter) this.editor.inlineCompleter.detach();
					this.editor.inlineCompleter = this;
				}
				this.editor.on("changeSelection", this.changeListener);
				this.editor.on("blur", this.blurListener);
				this.updateCompletions(options);
			}
			destroy() {
				this.detach();
				if (this.inlineRenderer) this.inlineRenderer.destroy();
				if (this.inlineTooltip) this.inlineTooltip.destroy();
				if (this.editor && this.editor.inlineCompleter == this) {
					this.editor.off("destroy", destroyCompleter);
					this.editor.inlineCompleter = null;
				}
				this.inlineTooltip = this.editor = this.inlineRenderer = null;
			}
			static for(editor) {
				if (editor.inlineCompleter instanceof InlineCompleter) return editor.inlineCompleter;
				if (editor.inlineCompleter) {
					editor.inlineCompleter.destroy();
					editor.inlineCompleter = null;
				}
				editor.inlineCompleter = new InlineCompleter(editor);
				editor.once("destroy", destroyCompleter);
				return editor.inlineCompleter;
			}
			getInlineTooltip() {
				if (!this.inlineTooltip) this.inlineTooltip = InlineCompleter.createInlineTooltip(document.body || document.documentElement);
				return this.inlineTooltip;
			}
			static createInlineTooltip(parentEl) {
				var inlineTooltip = new OriginalCommandBarTooltip(parentEl);
				inlineTooltip.registerCommand("Previous", Object.assign({}, OriginalInlineAutocomplete.prototype.commands["Previous"], {
					enabled: true,
					type: "button",
					iconCssClass: "ace_arrow_rotated"
				}));
				inlineTooltip.registerCommand("Position", {
					enabled: false,
					getValue: function(editor) {
						return editor ? [editor.inlineCompleter.getIndex() + 1, editor.inlineCompleter.getLength()].join("/") : "";
					},
					type: "text",
					cssClass: "completion_position"
				});
				inlineTooltip.registerCommand("Next", Object.assign({}, OriginalInlineAutocomplete.prototype.commands["Next"], {
					enabled: true,
					type: "button",
					iconCssClass: "ace_arrow"
				}));
				inlineTooltip.registerCommand("Accept", Object.assign({}, OriginalInlineAutocomplete.prototype.commands["Accept"], {
					enabled: function(editor) {
						return !!editor && editor.inlineCompleter.getIndex() >= 0;
					},
					type: "button"
				}));
				inlineTooltip.registerCommand("ShowTooltip", {
					name: "Always Show Tooltip",
					exec: function() {
						inlineTooltip.setAlwaysShow(!inlineTooltip.getAlwaysShow());
					},
					enabled: true,
					getValue: function() {
						return inlineTooltip.getAlwaysShow();
					},
					type: "checkbox"
				});
				return inlineTooltip;
			}
			updateCompletions(options) {
				if (options && options.matches) {
					var pos = this.editor.getSelectionRange().start;
					this.base = this.editor.session.doc.createAnchor(pos.row, pos.column);
					this.base["$insertRight"] = true;
					this.completions = new FilteredList(options.matches);
					return this.$open(this.editor, "");
				}
				if (this.base && this.completions) this.$updatePrefix();
				var session = this.editor.getSession();
				var pos = this.editor.getCursorPosition();
				var prefix = getCompletionPrefix(this.editor);
				this.base = session.doc.createAnchor(pos.row, pos.column - prefix.length);
				this.base.$insertRight = true;
				var options = {
					exactMatch: true,
					ignoreCaption: true
				};
				this.getCompletionProvider({
					prefix,
					base: this.base,
					pos
				}).provideCompletions(
					this.editor,
					options,
					/**
					* @this {InlineAutocomplete}
					*/
					function(err, completions, finished) {
						var filtered = completions.filtered;
						var prefix = getCompletionPrefix(this.editor);
						if (finished) {
							if (!filtered.length) return this.detach();
							if (filtered.length == 1 && filtered[0].value == prefix && !filtered[0].snippet) return this.detach();
						}
						this.completions = completions;
						this.$open(this.editor, prefix);
					}.bind(this)
				);
			}
		}
		OriginalInlineAutocomplete.prototype.commands["Previous"].exec = (editor) => {
			editor.inlineCompleter.goTo("prev");
		};
		OriginalInlineAutocomplete.prototype.commands["Next"].exec = (editor) => {
			editor.inlineCompleter.goTo("next");
		};
		OriginalInlineAutocomplete.prototype.commands["Accept"].exec = (editor) => {
			return editor.inlineCompleter.insertMatch();
		};
		OriginalInlineAutocomplete.prototype.commands["Close"].exec = (editor) => {
			editor.inlineCompleter.detach();
		};
		var doLiveAutocomplete = function(e) {
			var editor = e.editor;
			var hasCompleter = editor.inlineCompleter && editor.inlineCompleter.activated;
			if (e.command.name === "backspace") {
				if (hasCompleter && !getCompletionPrefix(editor)) editor.inlineCompleter.detach();
			} else if (e.command.name === "insertstring" && !hasCompleter) {
				lastExecEvent = e;
				var delay = e.editor.$liveAutocompletionDelay;
				if (delay) liveAutocompleteTimer.delay(delay);
				else showLiveAutocomplete(e);
			}
		};
		var lastExecEvent;
		var liveAutocompleteTimer = new DelayedCall(function() {
			showLiveAutocomplete(lastExecEvent);
		}, 0);
		var showLiveAutocomplete = (e) => {
			var editor = e.editor;
			var prefix = getCompletionPrefix(editor);
			var previousChar = e.args;
			var triggerAutocomplete = triggerAutocompleteFunc(editor, previousChar);
			if (prefix && prefix.length >= editor.$liveAutocompletionThreshold || triggerAutocomplete) InlineCompleter.for(editor).show({
				exactMatch: false,
				ignoreCaption: false
			});
		};
		const validateAceInlineCompleterWithEditor = (editor) => {
			let completer;
			try {
				completer = InlineCompleter.for(editor);
				completer.show({});
				if (typeof completer.activated !== "boolean") throw new Error("activated property missing or not boolean");
				completer.destroy();
			} catch (e) {
				throw new Error(`InlineAutocomplete runtime validation failed: ${e.message}`);
			}
			try {
				if (typeof new InlineCompletionProvider().gatherCompletions !== "function") throw new Error("gatherCompletions missing");
			} catch (e) {
				throw new Error(`CompletionProvider runtime validation failed: ${e.message}`);
			}
		};
		return {
			InlineCompleter,
			doLiveAutocomplete,
			validateAceInlineCompleterWithEditor
		};
	}
	function getCompletionPrefix(editor) {
		var pos = editor.getCursorPosition();
		var line = editor.session.getLine(pos.row);
		var prefix;
		if (!editor.inlineCompleters) return "";
		editor.inlineCompleters.forEach(function(completer) {
			if (completer.identifierRegexps) completer.identifierRegexps.forEach(function(identifierRegex) {
				if (!prefix && identifierRegex) prefix = retrievePrecedingIdentifier(line, pos.column, identifierRegex);
			}.bind(this));
		}.bind(this));
		return prefix || retrievePrecedingIdentifier(line, pos.column);
	}
	var ID_REGEX = /[a-zA-Z_0-9\$\-\u00A2-\u2000\u2070-\uFFFF]/;
	function retrievePrecedingIdentifier(text, pos, regex) {
		regex = regex || ID_REGEX;
		var buf = [];
		for (var i = pos - 1; i >= 0; i--) if (regex.test(text[i])) buf.push(text[i]);
		else break;
		return buf.reverse().join("");
	}
	function triggerAutocompleteFunc(editor, previousChar) {
		var previousChar = previousChar == null ? editor.session.getPrecedingCharacter() : previousChar;
		return editor.inlineCompleters.some((completer) => {
			if (completer.triggerCharacters && Array.isArray(completer.triggerCharacters)) return completer.triggerCharacters.includes(previousChar);
		});
	}
	var DelayedCall = class {
		constructor(fcn, defaultTimeout) {
			this.timer = null;
			this.fcn = fcn;
			this.defaultTimeout = defaultTimeout;
			this.callback = () => {
				this.timer = null;
				this.fcn();
			};
		}
		schedule(timeout) {
			if (this.timer == null) this.timer = setTimeout(this.callback, timeout || this.defaultTimeout);
		}
		delay(timeout) {
			this.timer && clearTimeout(this.timer);
			this.timer = setTimeout(this.callback, timeout || this.defaultTimeout);
		}
		call() {
			this.cancel();
			this.fcn();
		}
		cancel() {
			this.timer && clearTimeout(this.timer);
			this.timer = null;
		}
		isPending() {
			return this.timer;
		}
	};
	var FilteredList = class {
		constructor(array, filterText) {
			this.all = array;
			this.filtered = array;
			this.filterText = filterText || "";
			this.exactMatch = false;
			this.ignoreCaption = false;
		}
		setFilter(str) {
			if (str.length > this.filterText && str.lastIndexOf(this.filterText, 0) === 0) var matches = this.filtered;
			else var matches = this.all;
			this.filterText = str;
			matches = this.filterCompletions(matches, this.filterText);
			matches = matches.sort(function(a, b) {
				return b.exactMatch - a.exactMatch || b.$score - a.$score || (a.caption || a.value).localeCompare(b.caption || b.value);
			});
			var prev = null;
			matches = matches.filter(function(item) {
				var caption = item.snippet || item.caption || item.value;
				if (caption === prev) return false;
				prev = caption;
				return true;
			});
			this.filtered = matches;
		}
		filterCompletions(items, needle) {
			var results = [];
			var upper = needle.toUpperCase();
			var lower = needle.toLowerCase();
			loop: for (var i = 0, item; item = items[i]; i++) {
				if (item.skipFilter) {
					item.$score = item.score;
					results.push(item);
					continue;
				}
				var caption = !this.ignoreCaption && item.caption || item.value || item.snippet;
				if (!caption) continue;
				var lastIndex = -1;
				var matchMask = 0;
				var penalty = 0;
				var index, distance;
				if (this.exactMatch) {
					if (needle !== caption.substr(0, needle.length)) continue loop;
				} else {
					/**
					* It is for situation then, for example, we find some like 'tab' in item.value="Check the table"
					* and want to see "Check the TABle" but see "Check The tABle".
					*/
					var fullMatchIndex = caption.toLowerCase().indexOf(lower);
					if (fullMatchIndex > -1) penalty = fullMatchIndex;
					else for (var j = 0; j < needle.length; j++) {
						var i1 = caption.indexOf(lower[j], lastIndex + 1);
						var i2 = caption.indexOf(upper[j], lastIndex + 1);
						index = i1 >= 0 ? i2 < 0 || i1 < i2 ? i1 : i2 : i2;
						if (index < 0) continue loop;
						distance = index - lastIndex - 1;
						if (distance > 0) {
							if (lastIndex === -1) penalty += 10;
							penalty += distance;
							matchMask = matchMask | 1 << j;
						}
						lastIndex = index;
					}
				}
				item.matchMask = matchMask;
				item.exactMatch = penalty ? 0 : 1;
				item.$score = (item.score || 0) - penalty;
				results.push(item);
			}
			return results;
		}
	};
	//#endregion
	//#region src/ace/text_markers.ts
	function stringRepeat(text, count) {
		return new Array(count + 1).join(text);
	}
	function getClassNames(className) {
		return className.split(/\s+/).filter(Boolean);
	}
	function addClassNames(element, className) {
		const addedClasses = element["$aceLspTextMarkerAddedClasses"] || /* @__PURE__ */ new Set();
		getClassNames(className).forEach((singleClassName) => {
			if (!element.classList.contains(singleClassName)) {
				element.classList.add(singleClassName);
				addedClasses.add(singleClassName);
			}
		});
		if (addedClasses.size > 0) {
			element["$aceLspTextMarkerAddedClasses"] = addedClasses;
			element.setAttribute("data-ace-lsp-text-marker", "true");
		}
	}
	function removeClassNames(element, className) {
		const addedClasses = element["$aceLspTextMarkerAddedClasses"];
		if (!addedClasses) return;
		getClassNames(className).forEach((singleClassName) => {
			if (addedClasses.has(singleClassName)) {
				element.classList.remove(singleClassName);
				addedClasses.delete(singleClassName);
			}
		});
		if (addedClasses.size === 0) {
			delete element["$aceLspTextMarkerAddedClasses"];
			element.removeAttribute("data-ace-lsp-text-marker");
		}
	}
	var textMarkerMixin = {
		$removeClass(className) {
			if (!this.element || !className) return;
			var selectedElements = this.element.querySelectorAll("[data-ace-lsp-text-marker]");
			for (let i = 0; i < selectedElements.length; i++) {
				var element = selectedElements[i];
				removeClassNames(element, className);
				if (element.hasAttribute("data-whitespace")) {
					var originalWhitespace = element.getAttribute("data-whitespace") || "";
					var textNode = this.dom.createTextNode(originalWhitespace, this.element);
					textNode["charCount"] = element["charCount"];
					element.parentNode?.replaceChild(textNode, element);
				}
			}
		},
		$applyTextMarkers() {
			const textLayer = this;
			const session = this.session;
			if (session.$scheduleForRemove) {
				session.$scheduleForRemove.forEach((className) => {
					textLayer.$removeClass(className);
				});
				session.$scheduleForRemove = /* @__PURE__ */ new Set();
			}
			var textMarkers = session.getTextMarkers ? session.getTextMarkers() : [];
			if (textMarkers.length === 0) return;
			var classNameGroups = /* @__PURE__ */ new Set();
			textMarkers.forEach((marker) => {
				if (marker) classNameGroups.add(marker.className);
			});
			classNameGroups.forEach((className) => {
				textLayer.$removeClass(className);
			});
			textMarkers.forEach((marker) => {
				if (!marker) return;
				for (let row = marker.range.start.row; row <= marker.range.end.row; row++) {
					var cell = this.$lines.cells.find((el) => el.row === row);
					if (cell) textLayer.$modifyDomForMarkers(cell.element, row, marker);
				}
			});
		},
		$modifyDomForMarkers(lineElement, row, marker) {
			var lineLength = this.session.getLine(row).length;
			let startCol = row > marker.range.start.row ? 0 : marker.range.start.column;
			let endCol = row < marker.range.end.row ? lineLength : marker.range.end.column;
			if (startCol === endCol) return;
			var lineElements = [];
			if (lineElement.classList.contains("ace_line_group")) lineElements = Array.from(lineElement.childNodes);
			else lineElements = [lineElement];
			var currentColumn = 0;
			lineElements.forEach((lineElement) => {
				var childNodes = Array.from(lineElement.childNodes);
				for (let i = 0; i < childNodes.length; i++) {
					let subChildNodes = [childNodes[i]];
					let parentNode = lineElement;
					if (childNodes[i].childNodes && childNodes[i].childNodes.length > 0) {
						subChildNodes = Array.from(childNodes[i].childNodes);
						parentNode = childNodes[i];
					}
					for (let j = 0; j < subChildNodes.length; j++) {
						var node = subChildNodes[j];
						var nodeText = node.textContent || "";
						const nodeParent = node.parentNode;
						if (nodeParent?.["charCount"]) node["charCount"] = nodeParent["charCount"];
						var contentLength = node["charCount"] || nodeText.length;
						var nodeStart = currentColumn;
						var nodeEnd = currentColumn + contentLength;
						if (node["charCount"] === 0 || contentLength === 0) continue;
						if (nodeStart < endCol && nodeEnd > startCol) {
							var beforeSelection = Math.max(0, startCol - nodeStart);
							var afterSelection = Math.max(0, nodeEnd - endCol);
							var selectionLength = contentLength - beforeSelection - afterSelection;
							if (marker.type === "invisible") this.$processInvisibleMarker(node, parentNode, {
								beforeSelection,
								selectionLength,
								afterSelection
							}, marker);
							else this.$processRegularMarker(node, parentNode, {
								beforeSelection,
								selectionLength,
								afterSelection
							}, marker, nodeStart, startCol, endCol);
						}
						currentColumn = nodeEnd;
					}
				}
			});
		},
		$processInvisibleMarker(node, parentNode, selectionSegment, marker) {
			var nodeText = node.textContent || "";
			if (node.nodeType === 3) {
				var fragment = this.dom.createFragment(this.element);
				if (selectionSegment.beforeSelection > 0) fragment.appendChild(this.dom.createTextNode(nodeText.substring(0, selectionSegment.beforeSelection), this.element));
				if (selectionSegment.selectionLength > 0) {
					var segments = (selectionSegment.beforeSelection === 0 && selectionSegment.afterSelection === 0 ? nodeText : nodeText.substring(selectionSegment.beforeSelection, selectionSegment.beforeSelection + selectionSegment.selectionLength)).match(/\s+|[^\s]+/g) || [];
					for (let k = 0; k < segments.length; k++) {
						var segment = segments[k];
						let span;
						if (/^\s+$/.test(segment)) {
							span = this.dom.createElement("span");
							addClassNames(span, marker.className);
							var symbol = node["charCount"] ? this.TAB_CHAR : this.SPACE_CHAR;
							span.textContent = stringRepeat(symbol, segment.length);
							span.setAttribute("data-whitespace", segment);
						} else {
							span = this.dom.createElement("span");
							span.textContent = segment;
						}
						if (node["charCount"] && segments.length === 1) span["charCount"] = node["charCount"];
						fragment.appendChild(span);
					}
				}
				if (selectionSegment.afterSelection > 0) fragment.appendChild(this.dom.createTextNode(nodeText.substring(selectionSegment.beforeSelection + selectionSegment.selectionLength), this.element));
				parentNode.replaceChild(fragment, node);
			}
		},
		$processRegularMarker(node, parentNode, selectionSegment, marker, nodeStart, startCol, endCol) {
			var nodeText = node.textContent || "";
			if (node.nodeType === 3) if (selectionSegment.beforeSelection > 0 || selectionSegment.afterSelection > 0) {
				var fragment = this.dom.createFragment(this.element);
				if (selectionSegment.beforeSelection > 0) fragment.appendChild(this.dom.createTextNode(nodeText.substring(0, selectionSegment.beforeSelection), this.element));
				if (selectionSegment.selectionLength > 0) {
					var selectedSpan = this.dom.createElement("span");
					addClassNames(selectedSpan, marker.className);
					selectedSpan.textContent = nodeText.substring(selectionSegment.beforeSelection, selectionSegment.beforeSelection + selectionSegment.selectionLength);
					fragment.appendChild(selectedSpan);
				}
				if (selectionSegment.afterSelection > 0) fragment.appendChild(this.dom.createTextNode(nodeText.substring(selectionSegment.beforeSelection + selectionSegment.selectionLength), this.element));
				parentNode.replaceChild(fragment, node);
			} else {
				var selectedSpan = this.dom.createElement("span");
				addClassNames(selectedSpan, marker.className);
				selectedSpan.textContent = nodeText;
				selectedSpan["charCount"] = node["charCount"];
				parentNode.replaceChild(selectedSpan, node);
			}
			else if (node.nodeType === 1) {
				const element = node;
				if (nodeStart >= startCol && nodeStart + (nodeText.length || 0) <= endCol) addClassNames(element, marker.className);
				else if (selectionSegment.beforeSelection > 0 || selectionSegment.afterSelection > 0) {
					var nodeClasses = element.className;
					var fragment = this.dom.createFragment(this.element);
					if (selectionSegment.beforeSelection > 0) {
						var beforeSpan = this.dom.createElement("span");
						beforeSpan.className = nodeClasses;
						beforeSpan.textContent = nodeText.substring(0, selectionSegment.beforeSelection);
						fragment.appendChild(beforeSpan);
					}
					if (selectionSegment.selectionLength > 0) {
						var selectedSpan = this.dom.createElement("span");
						selectedSpan.className = nodeClasses;
						addClassNames(selectedSpan, marker.className);
						selectedSpan.textContent = nodeText.substring(selectionSegment.beforeSelection, selectionSegment.beforeSelection + selectionSegment.selectionLength);
						fragment.appendChild(selectedSpan);
					}
					if (selectionSegment.afterSelection > 0) {
						var afterSpan = this.dom.createElement("span");
						afterSpan.className = nodeClasses;
						afterSpan.textContent = nodeText.substring(selectionSegment.beforeSelection + selectionSegment.selectionLength);
						fragment.appendChild(afterSpan);
					}
					parentNode.replaceChild(fragment, node);
				}
			}
		}
	};
	var editSessionTextMarkerMixin = {
		addTextMarker(range, className, type) {
			this.$textMarkerId = this.$textMarkerId || 0;
			this.$textMarkerId++;
			var marker = {
				range,
				id: this.$textMarkerId,
				className,
				type
			};
			if (!this.$textMarkers) this.$textMarkers = [];
			this.$textMarkers[marker.id] = marker;
			return marker.id;
		},
		removeTextMarker(markerId) {
			if (!this.$textMarkers) return;
			var marker = this.$textMarkers[markerId];
			if (!marker) return;
			if (!this.$scheduleForRemove) this.$scheduleForRemove = /* @__PURE__ */ new Set();
			this.$scheduleForRemove.add(marker.className);
			delete this.$textMarkers[markerId];
		},
		getTextMarkers() {
			return this.$textMarkers || [];
		}
	};
	function patchPrototype(target, mixin, flagName) {
		if (!target) return;
		const prototype = Object.getPrototypeOf(target);
		if (!prototype || prototype[flagName]) return;
		Object.assign(prototype, mixin);
		prototype[flagName] = true;
	}
	function createTextMarkerAdapter() {
		const onAfterRender = (_e, renderer) => {
			renderer["$textLayer"]?.$applyTextMarkers?.();
		};
		function installTextMarkerSupport(editor) {
			patchPrototype(editor.renderer?.["$textLayer"], textMarkerMixin, "$aceLintersTextMarkerMixin");
			patchPrototype(editor.session, editSessionTextMarkerMixin, "$aceLintersTextMarkerSessionMixin");
		}
		function enableTextMarkers(editor) {
			installTextMarkerSupport(editor);
			if (!editor.$textMarkersAfterRender) {
				editor.$textMarkersAfterRender = onAfterRender;
				editor.renderer.on("afterRender", editor.$textMarkersAfterRender);
			}
		}
		function disableTextMarkers(editor) {
			if (editor.$textMarkersAfterRender) {
				editor.renderer.off("afterRender", editor.$textMarkersAfterRender);
				delete editor.$textMarkersAfterRender;
			}
		}
		return {
			enableTextMarkers,
			disableTextMarkers
		};
	}
	//#endregion
	//#region src/ace/marker_group.ts
	var MarkerGroup = class {
		constructor(session) {
			this.MAX_MARKERS = 1e4;
			this.markers = [];
			this.session = session;
			session.addDynamicMarker(this);
		}
		/**
		* Finds the first marker containing pos
		* @param {Position} pos
		* @returns Ace.MarkerGroupItem
		*/
		getMarkerAtPosition(pos) {
			return this.markers.find(function(marker) {
				return marker.range.contains(pos.row, pos.column);
			});
		}
		/**
		* Finds all markers that contain the given position.
		* @param {Position} pos - The position to search for.
		* @returns {Ace.MarkerGroupItem[]} - An array of all markers that contain the given position.
		*/
		getMarkersAtPosition(pos) {
			return this.markers.filter(function(marker) {
				return marker.range.contains(pos.row, pos.column);
			});
		}
		/**
		* Comparator for Array.sort function, which sorts marker definitions by their positions
		*
		* @param {Ace.MarkerGroupItem} a first marker.
		* @param {Ace.MarkerGroupItem} b second marker.
		* @returns {number} negative number if a should be before b, positive number if b should be before a, 0 otherwise.
		*/
		markersComparator(a, b) {
			return a.range.start.row - b.range.start.row;
		}
		/**
		* Sets marker definitions to be rendered. Limits the number of markers at MAX_MARKERS.
		* @param {Ace.MarkerGroupItem[]} markers an array of marker definitions.
		*/
		setMarkers(markers) {
			this.markers = markers.sort(this.markersComparator).slice(0, this.MAX_MARKERS);
			this.session._signal("changeBackMarker");
		}
		update(html, markerLayer, session, config) {
			if (!this.markers || !this.markers.length) return;
			var visibleRangeStartRow = config.firstRow, visibleRangeEndRow = config.lastRow;
			var foldLine;
			var markersOnOneLine = 0;
			var lastRow = 0;
			for (var i = 0; i < this.markers.length; i++) {
				var marker = this.markers[i];
				if (marker.range.end.row < visibleRangeStartRow) continue;
				if (marker.range.start.row > visibleRangeEndRow) continue;
				if (marker.range.start.row === lastRow) markersOnOneLine++;
				else {
					lastRow = marker.range.start.row;
					markersOnOneLine = 0;
				}
				if (markersOnOneLine > 200) continue;
				var markerVisibleRange = marker.range.clipRows(visibleRangeStartRow, visibleRangeEndRow);
				if (markerVisibleRange.start.row === markerVisibleRange.end.row && markerVisibleRange.start.column === markerVisibleRange.end.column) continue;
				var screenRange = markerVisibleRange.toScreenRange(session);
				if (screenRange.isEmpty()) {
					foldLine = session.getNextFoldLine(markerVisibleRange.end.row, foldLine);
					if (foldLine && foldLine.end.row > markerVisibleRange.end.row) visibleRangeStartRow = foldLine.end.row;
					continue;
				}
				if (screenRange.isMultiLine()) markerLayer.drawTextMarker(html, screenRange, marker.className, config);
				else markerLayer.drawSingleLineMarker(html, screenRange, marker.className, config);
			}
		}
	};
	//#endregion
	//#region src/type-converters/lsp/semantic-tokens.ts
	function decodeModifiers(modifierFlag, tokenModifiersLegend) {
		const modifiers = [];
		for (let i = 0; i < tokenModifiersLegend.length; i++) if (modifierFlag & 1 << i) modifiers.push(tokenModifiersLegend[i]);
		return modifiers;
	}
	function parseSemanticTokens(originalTokens, additionalTokens) {
		const hasValidTokens = originalTokens?.tokens && originalTokens.tokens.length % 5 === 0;
		const hasAdditionalTokens = additionalTokens && additionalTokens.length > 0;
		if (!hasValidTokens && !hasAdditionalTokens) return;
		const decodedTokens = additionalTokens ?? [];
		if (originalTokens) {
			const { tokens, tokenTypes, tokenModifiersLegend } = originalTokens;
			let line = 0;
			let startColumn = 0;
			for (let i = 0; i < tokens.length; i += 5) {
				line += tokens[i];
				if (tokens[i] === 0) startColumn += tokens[i + 1];
				else startColumn = tokens[i + 1];
				const length = tokens[i + 2];
				const tokenTypeIndex = tokens[i + 3];
				const tokenModifierFlag = tokens[i + 4];
				const tokenType = tokenTypes[tokenTypeIndex];
				const tokenModifiers = decodeModifiers(tokenModifierFlag, tokenModifiersLegend);
				decodedTokens.push({
					row: line,
					startColumn,
					length,
					type: toAceTokenType(tokenType, tokenModifiers)
				});
			}
		}
		return new DecodedSemanticTokens(decodedTokens);
	}
	function toAceTokenType(tokenType, tokenModifiers) {
		let modifiers = "";
		let type = tokenType;
		if (tokenModifiers.length > 0) modifiers = "." + tokenModifiers.join(".");
		switch (tokenType) {
			case "class":
				type = "entity.name.type.class";
				break;
			case "struct":
				type = "storage.type.struct";
				break;
			case "enum":
				type = "entity.name.type.enum";
				break;
			case "interface":
				type = "entity.name.type.interface";
				break;
			case "namespace":
				type = "entity.name.namespace";
				break;
			case "typeParameter": break;
			case "type":
				type = "entity.name.type";
				break;
			case "parameter":
				type = "variable.parameter";
				break;
			case "variable":
				type = "entity.name.variable";
				break;
			case "enumMember":
				type = "variable.other.enummember";
				break;
			case "property":
				type = "variable.other.property";
				break;
			case "function":
				type = "entity.name.function";
				break;
			case "method":
				type = "entity.name.function.member";
				break;
			case "event":
				type = "variable.other.event";
				break;
			case "highlight_unnecessary": type = "highlight_unnecessary";
		}
		return type + modifiers;
	}
	var DecodedSemanticTokens = class {
		constructor(tokens) {
			this.tokens = this.sortTokens(tokens);
			this.normalize();
		}
		normalize() {
			const tokenMap = /* @__PURE__ */ new Map();
			this.tokens.forEach((token) => {
				const key = `${token.row}:${token.startColumn}:${token.length}`;
				const existing = tokenMap.get(key);
				if (existing) existing.type = `${existing.type}.${token.type}`;
				else tokenMap.set(key, { ...token });
			});
			this.tokens = Array.from(tokenMap.values());
		}
		getByRow(row) {
			return this.tokens.filter((token) => token.row === row);
		}
		sortTokens(tokens) {
			return tokens.sort((a, b) => {
				if (a.row === b.row) return a.startColumn - b.startColumn;
				return a.row - b.row;
			});
		}
	};
	//#endregion
	//#region src/session-language-provider.ts
	var SessionLanguageProvider = class {
		/**
		* Constructs a new instance of the `SessionLanguageProvider` class.
		*
		* @param provider - The `LanguageProvider` instance.
		* @param session - The Ace editor session.
		* @param editor - The Ace editor instance.
		* @param messageController - The `IMessageController` instance for handling messages.
		* @param config
		*/
		constructor(provider, session, editor, messageController, config) {
			this.$isConnected = false;
			this.$requestsQueue = [];
			this.state = {
				occurrenceMarkers: null,
				diagnosticMarkers: null
			};
			this.extensions = {
				"typescript": "ts",
				"javascript": "js"
			};
			this.$semanticTextMarkerIds = [];
			this.$diagnosticTextMarkerIds = [];
			this.$connected = (capabilities) => {
				this.$isConnected = true;
				this.setServerCapabilities(capabilities);
				this.$requestsQueue.forEach((requestCallback) => requestCallback());
				this.$requestsQueue = [];
				if (this.$deltaQueue) this.$sendDeltaQueue();
				if (this.$options) this.setOptions(this.$options);
			};
			this.$changeMode = () => {
				this.enqueueIfNotConnected(() => {
					this.$deltaQueue = null;
					this.session.clearAnnotations();
					if (this.state.diagnosticMarkers) this.state.diagnosticMarkers.setMarkers([]);
					this.clearSemanticTokenMarkers();
					this.clearDiagnosticTextMarkers();
					let newVersion = this.session.doc.version++;
					this.$messageController.changeMode(this.comboDocumentIdentifier, this.session.getValue(), newVersion, this.$mode, this.setServerCapabilities);
				});
			};
			this.setServerCapabilities = (capabilities) => {
				if (!capabilities) return;
				this.$servicesCapabilities = { ...capabilities };
				if (Object.values(capabilities).some((capability) => capability?.completionProvider?.triggerCharacters) || this.$provider.options.functionality?.completion && this.$provider.options.functionality?.completion.lspCompleterOptions?.triggerCharacters) {
					let completer = this.editor.completers.find((completer) => completer.id === "lspCompleters");
					if (completer) {
						let allTriggerCharacters = [];
						Object.values(capabilities).forEach((capability) => {
							if (capability?.completionProvider?.triggerCharacters) allTriggerCharacters.push(...capability.completionProvider.triggerCharacters);
						});
						allTriggerCharacters = [...new Set(allTriggerCharacters)];
						const triggerCharacterOptions = typeof this.$provider.options.functionality?.completion == "object" ? this.$provider.options.functionality.completion.lspCompleterOptions?.triggerCharacters : void 0;
						if (triggerCharacterOptions) {
							const removeChars = Array.isArray(triggerCharacterOptions.remove) ? triggerCharacterOptions.remove : [];
							const addChars = Array.isArray(triggerCharacterOptions.add) ? triggerCharacterOptions.add : [];
							completer.triggerCharacters = allTriggerCharacters.filter((char) => !removeChars.includes(char));
							addChars.forEach((char) => {
								if (!completer.triggerCharacters.includes(char)) completer.triggerCharacters.push(char);
							});
						} else completer.triggerCharacters = allTriggerCharacters;
					}
				}
				if (Object.values(capabilities).some((capability) => {
					if (capability?.semanticTokensProvider) {
						this.semanticTokensLegend = capability.semanticTokensProvider.legend;
						return true;
					}
				})) this.getSemanticTokens();
			};
			this.$changeListener = (delta) => {
				this.session.doc.version++;
				if (!this.$deltaQueue) {
					this.$deltaQueue = [];
					setTimeout(() => this.$sendDeltaQueue(() => {
						this.getSemanticTokens();
					}), 0);
				}
				this.$deltaQueue.push(delta);
			};
			this.$sendDeltaQueue = (callback) => {
				let deltas = this.$deltaQueue;
				if (!deltas) return callback && callback();
				this.$deltaQueue = null;
				if (deltas.length) this.$messageController.change(this.comboDocumentIdentifier, deltas.map((delta) => fromAceDelta(delta, this.session.doc.getNewLineCharacter())), this.session.doc, callback);
			};
			this.$showAnnotations = (diagnostics) => {
				if (!diagnostics) return;
				const filteredDiagnostics = diagnostics.filter((el) => !el?.data?.ignore);
				let annotations = toAnnotations(filteredDiagnostics);
				this.session.clearAnnotations();
				if (annotations && annotations.length > 0) this.session.setAnnotations(annotations);
				if (!this.state.diagnosticMarkers) this.state.diagnosticMarkers = new MarkerGroup(this.session);
				if (this.$provider.options.functionality.showUnusedDeclarations) this.setDiagnosticTextMarkers(diagnostics);
				else if (this.$diagnosticTextMarkerIds.length > 0) this.clearDiagnosticTextMarkers();
				this.state.diagnosticMarkers.setMarkers(filteredDiagnostics?.map((el) => toMarkerGroupItem(CommonConverter.toRange(toRange(el.range)), mapSeverityToClassName(el.severity), el.message)).filter(Boolean));
			};
			this.validate = () => {
				this.$messageController.doValidation(this.comboDocumentIdentifier, this.$showAnnotations);
			};
			this.format = () => {
				let selectionRanges = this.session.getSelection().getAllRanges();
				let $format = this.$format;
				let aceRangeDatas = selectionRanges;
				if (!selectionRanges || selectionRanges[0].isEmpty()) {
					let row = this.session.getLength();
					aceRangeDatas = [{
						start: {
							row: 0,
							column: 0
						},
						end: {
							row,
							column: this.session.getLine(row).length - 1
						}
					}];
				}
				for (let range of aceRangeDatas) this.$messageController.format(this.comboDocumentIdentifier, fromRange(range), $format, this.applyEdits);
			};
			this.applyEdits = (edits) => {
				edits ??= [];
				for (let edit of edits.reverse()) this.session.replace(toRange(edit.range), edit.newText);
			};
			this.$applySemanticTokens = (tokens) => {
				if (!tokens) {
					this.session.setSemanticTokens(void 0);
					return;
				}
				let originalTokens;
				if (tokens) originalTokens = {
					tokens: tokens.data,
					tokenTypes: this.semanticTokensLegend.tokenTypes,
					tokenModifiersLegend: this.semanticTokensLegend.tokenModifiers
				};
				let decodedTokens = parseSemanticTokens(originalTokens);
				this.session.setSemanticTokens(decodedTokens);
			};
			this.$applyDocumentHighlight = (documentHighlights) => {
				if (!this.state.occurrenceMarkers) this.state.occurrenceMarkers = new MarkerGroup(this.session);
				if (documentHighlights) this.state.occurrenceMarkers.setMarkers(fromDocumentHighlights(documentHighlights));
			};
			this.$provider = provider;
			this.$messageController = messageController;
			this.session = session;
			this.editor = editor;
			session.doc.version = 1;
			session.doc.on("change", this.$changeListener, true);
			session.setSemanticTokens = (tokens) => {
				this.setSemanticTokenMarkers(tokens);
			};
			session.on("changeMode", this.$changeMode);
			if (this.$provider.options.functionality.semanticTokens) {
				this.$changeScrollTopHandler = () => this.getSemanticTokens();
				session.on("changeScrollTop", this.$changeScrollTopHandler);
			}
			session.setUseWorker(false);
			this.$init(config);
		}
		enqueueIfNotConnected(callback) {
			if (!this.$isConnected) this.$requestsQueue.push(callback);
			else callback();
		}
		get comboDocumentIdentifier() {
			return {
				documentUri: this.documentUri,
				sessionId: this.session["id"]
			};
		}
		/**
		* Sets the file path for the current document and optionally joins it with the workspace URI.
		* Increments the document version and updates the internal document URI and identifier.
		*
		* @param {string} filePath - The new file path for the document.
		* @param {boolean} [joinWorkspaceURI] - when true the given path is treated as relative and will be joined with
		* the workspace’s root URI to form the final canonical URI. When false (or omitted) filePath is just transformed to
		* URI.
		*/
		setFilePath(filePath, joinWorkspaceURI) {
			this.enqueueIfNotConnected(() => {
				this.session.doc.version++;
				this.$filePath = filePath;
				const previousComboId = this.comboDocumentIdentifier;
				this.initDocumentUri(true, joinWorkspaceURI);
				if (previousComboId.documentUri === this.comboDocumentIdentifier.documentUri) return;
				this.$messageController.renameDocument(previousComboId, this.comboDocumentIdentifier.documentUri, this.session.doc.version);
			});
		}
		$init(config) {
			if (config?.filePath) this.$filePath = config.filePath;
			this.initDocumentUri(false, config?.joinWorkspaceURI);
			this.$messageController.init(this.comboDocumentIdentifier, this.session.doc, this.$mode, this.$options, this.$connected);
		}
		initDocumentUri(isRename = false, joinWorkspaceURI = false) {
			let filePath = this.$filePath ?? this.session["id"] + "." + this.$extension;
			if (isRename) delete this.$provider.$urisToSessionsIds[this.documentUri];
			this.documentUri = convertToUri(filePath, joinWorkspaceURI, this.$provider.workspaceUri);
			this.$provider.$urisToSessionsIds[this.documentUri] = this.session["id"];
		}
		get $extension() {
			let mode = this.$mode.replace("ace/mode/", "");
			return this.extensions[mode] ?? mode;
		}
		get $mode() {
			return this.session["$modeId"];
		}
		get $format() {
			return {
				tabSize: this.session.getTabSize(),
				insertSpaces: this.session.getUseSoftTabs()
			};
		}
		setOptions(options) {
			if (!this.$isConnected) {
				this.$options = options;
				return;
			}
			this.$messageController.changeOptions(this.comboDocumentIdentifier, options);
		}
		getSemanticTokens() {
			if (!this.$provider.options.functionality.semanticTokens) return;
			let lastRow = this.editor.renderer.getLastVisibleRow();
			let visibleRange = {
				start: {
					row: this.editor.renderer.getFirstVisibleRow(),
					column: 0
				},
				end: {
					row: lastRow + 1,
					column: this.session.getLine(lastRow).length
				}
			};
			this.$messageController.getSemanticTokens(this.comboDocumentIdentifier, fromRange(visibleRange), this.$applySemanticTokens);
		}
		setSemanticTokenMarkers(tokens) {
			this.clearSemanticTokenMarkers(false);
			if (!tokens) {
				this.applyTextMarkersToRenderedRows();
				return;
			}
			tokens.tokens.forEach((token) => {
				const markerId = this.session.addTextMarker({
					start: {
						row: token.row,
						column: token.startColumn
					},
					end: {
						row: token.row,
						column: token.startColumn + token.length
					}
				}, this.toAceTokenClassName(token.type));
				this.$semanticTextMarkerIds.push(markerId);
			});
			this.applyTextMarkersToRenderedRows();
		}
		setDiagnosticTextMarkers(diagnostics) {
			this.clearDiagnosticTextMarkers(false);
			if (!this.session.addTextMarker) {
				this.applyTextMarkersToRenderedRows();
				return;
			}
			diagnostics.forEach((diagnostic) => {
				if (!diagnostic.tags?.length) return;
				const tokenType = diagnostic.tags.includes(import_main.DiagnosticTag.Deprecated) ? "highlight_deprecated" : "highlight_unnecessary";
				const markerId = this.session.addTextMarker({
					start: {
						row: diagnostic.range.start.line,
						column: diagnostic.range.start.character
					},
					end: {
						row: diagnostic.range.end.line,
						column: diagnostic.range.end.character
					}
				}, this.toAceTokenClassName(tokenType));
				this.$diagnosticTextMarkerIds.push(markerId);
			});
			this.applyTextMarkersToRenderedRows();
		}
		clearSemanticTokenMarkers(render = true) {
			this.clearTextMarkers(this.$semanticTextMarkerIds);
			this.$semanticTextMarkerIds = [];
			if (render) this.applyTextMarkersToRenderedRows();
		}
		clearDiagnosticTextMarkers(render = true) {
			this.clearTextMarkers(this.$diagnosticTextMarkerIds);
			this.$diagnosticTextMarkerIds = [];
			if (render) this.applyTextMarkersToRenderedRows();
		}
		clearTextMarkers(markerIds) {
			if (!this.session.removeTextMarker) return;
			markerIds.forEach((markerId) => this.session.removeTextMarker(markerId));
		}
		toAceTokenClassName(tokenType) {
			return "ace_" + tokenType.replace(/\./g, " ace_");
		}
		applyTextMarkersToRenderedRows() {
			this.editor.renderer["$textLayer"]?.$applyTextMarkers?.();
		}
		/**
		* Disposes of the SessionLanguageProvider, cleaning up all event listeners,
		* marker groups, and notifying the server to close the document.
		* This method should be called when the session is no longer needed.
		*
		* @param callback - Optional callback to execute after the document is closed
		*/
		dispose(callback) {
			this.session.doc.off("change", this.$changeListener);
			this.session.off("changeMode", this.$changeMode);
			if (this.$changeScrollTopHandler) {
				this.session.off("changeScrollTop", this.$changeScrollTopHandler);
				this.$changeScrollTopHandler = void 0;
			}
			if (this.state.occurrenceMarkers) {
				this.state.occurrenceMarkers.setMarkers([]);
				this.state.occurrenceMarkers = null;
			}
			if (this.state.diagnosticMarkers) {
				this.state.diagnosticMarkers.setMarkers([]);
				this.state.diagnosticMarkers = null;
			}
			this.session.clearAnnotations();
			this.clearSemanticTokenMarkers(false);
			this.clearDiagnosticTextMarkers(false);
			this.applyTextMarkersToRenderedRows();
			this.$deltaQueue = null;
			this.$requestsQueue = [];
			if (this.documentUri) delete this.$provider.$urisToSessionsIds[this.documentUri];
			this.$isConnected = false;
			this.session.setUseWorker(true);
			this.closeDocument(callback);
		}
		closeDocument(callback) {
			this.$messageController.closeDocument(this.comboDocumentIdentifier, callback);
		}
	};
	//#endregion
	//#region src/types/diagnostic-data.ts
	function isDiagnosticCodeActionData(value) {
		if (!value || typeof value !== "object") return false;
		const candidate = value;
		return candidate.v === 1 && typeof candidate.provider === "string" && typeof candidate.issueId === "string";
	}
	//#endregion
	//#region src/components/hover/hover-quick-fixes.ts
	function extractDiagnosticQuickFixesAtPosition(annotations, position) {
		const fixes = [];
		const seen = /* @__PURE__ */ new Set();
		for (const annotation of annotations) {
			const data = annotation.data;
			if (!isDiagnosticCodeActionData(data)) continue;
			for (const fix of data.fixes || []) {
				if (!isPositionInLspRange(position, fix.range)) continue;
				const key = [
					data.provider,
					data.issueId,
					fix.title,
					fix.newText,
					fix.range.start.line,
					fix.range.start.character,
					fix.range.end.line,
					fix.range.end.character
				].join("|");
				if (seen.has(key)) continue;
				seen.add(key);
				fixes.push({
					provider: data.provider,
					issueId: data.issueId,
					fix
				});
			}
		}
		return fixes;
	}
	function createHoverQuickFixNode(fixes, onApplyFix) {
		if (!fixes.length) return null;
		const wrapper = document.createElement("div");
		wrapper.className = "ace_lsp_hover_quickfixes";
		const title = document.createElement("div");
		title.className = "ace_lsp_hover_quickfixes_title";
		wrapper.appendChild(title);
		const controls = document.createElement("div");
		controls.className = "ace_lsp_hover_quickfixes_controls";
		wrapper.appendChild(controls);
		const primaryLink = createActionLink(fixes[0].fix.title);
		primaryLink.classList.add("ace_lsp_hover_quickfixes_primary");
		primaryLink.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			onApplyFix(fixes[0]);
		});
		controls.appendChild(primaryLink);
		let menuPopup = null;
		if (fixes.length > 1) {
			const moreLink = createActionLink("More actions...");
			moreLink.classList.add("ace_lsp_hover_quickfixes_more");
			controls.appendChild(moreLink);
			moreLink.addEventListener("click", (event) => {
				event.preventDefault();
				event.stopPropagation();
				if (menuPopup) {
					menuPopup.destroy();
					menuPopup = null;
					return;
				}
				menuPopup = new ActionMenuPopup(document.body || document.documentElement, (entry) => {
					onApplyFix(entry);
					menuPopup?.destroy();
					menuPopup = null;
				}, { lineHeight: 12 });
				menuPopup.setItems(fixes.slice(1).map((entry) => ({
					label: entry.fix.title,
					value: entry
				})));
				const menuPosition = getHoverMenuPosition(moreLink);
				menuPopup.showAt(menuPosition.x, menuPosition.y, false, moreLink);
			});
		}
		return wrapper;
	}
	function createActionLink(text) {
		const link = document.createElement("a");
		link.href = "#";
		link.textContent = text;
		link.className = "ace_lsp_hover_quickfixes_link";
		return link;
	}
	function getHoverMenuPosition(anchor) {
		const gap = 2;
		const estimatedMenuWidth = 260;
		const estimatedMenuHeight = 220;
		const anchorRect = anchor.getBoundingClientRect();
		const tooltip = anchor.closest(".ace_tooltip");
		if (!tooltip) return {
			x: anchorRect.right,
			y: anchorRect.bottom + 4
		};
		const tooltipRect = tooltip.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const rightX = tooltipRect.right + gap;
		if (rightX + estimatedMenuWidth <= viewportWidth - gap) return {
			x: rightX,
			y: Math.max(gap, anchorRect.top - 12)
		};
		const bottomY = tooltipRect.bottom + gap;
		if (bottomY + estimatedMenuHeight <= viewportHeight - gap) return {
			x: Math.max(gap, Math.min(anchorRect.right, viewportWidth - estimatedMenuWidth - gap)),
			y: bottomY
		};
		return {
			x: Math.max(gap, tooltipRect.left - estimatedMenuWidth - gap),
			y: Math.max(gap, anchorRect.top - 12)
		};
	}
	function isPositionInLspRange(position, range) {
		const line = position.row;
		const character = position.column;
		if (line < range.start.line || line > range.end.line) return false;
		if (line === range.start.line && character < range.start.character) return false;
		if (line === range.end.line && character > range.end.character) return false;
		return true;
	}
	//#endregion
	//#region src/components/hover/hover-data-resolver.ts
	function resolveHoverModel(context) {
		const { hover, errorMarkers, quickFixes } = context;
		const hoverHtml = hover?.content ? context.getHoverHtml(hover) : void 0;
		const errorText = buildErrorText(errorMarkers);
		if (!hoverHtml && !errorText && quickFixes.length === 0) return null;
		const actionRange = quickFixes[0]?.fix.range ? context.lspRangeToAceRange(quickFixes[0].fix.range) : void 0;
		const baseRange = hover?.range ?? errorMarkers[0]?.range ?? actionRange;
		return {
			range: baseRange ? context.rangeFromPoints(baseRange.start, baseRange.end) : context.getWordRange(context.docPos.row, context.docPos.column),
			errorText,
			hoverHtml,
			quickFixes
		};
	}
	function buildErrorText(errorMarkers) {
		return errorMarkers.map((marker) => marker.tooltipText?.trim()).filter((value) => Boolean(value)).join("\n") || void 0;
	}
	//#endregion
	//#region src/components/hover/hover-view.ts
	function createHoverViewNode(model, onApplyFix) {
		const domNode = document.createElement("div");
		const errorNode = createErrorNode(model.errorText);
		if (errorNode) domNode.appendChild(errorNode);
		const hoverNode = createHoverNode(model.hoverHtml);
		if (hoverNode) domNode.appendChild(hoverNode);
		const quickFixNode = createHoverQuickFixNode(model.quickFixes, onApplyFix);
		if (quickFixNode) domNode.appendChild(quickFixNode);
		return domNode;
	}
	function createHoverNode(hoverHtml) {
		if (!hoverHtml) return null;
		const hoverNode = document.createElement("div");
		hoverNode.innerHTML = hoverHtml;
		return hoverNode;
	}
	function createErrorNode(errorText) {
		if (!errorText) return null;
		const errorNode = document.createElement("div");
		errorNode.textContent = errorText;
		return errorNode;
	}
	//#endregion
	//#region ../../node_modules/marked/lib/marked.esm.js
	/**
	* marked v18.0.6 - a markdown parser
	* Copyright (c) 2018-2026, MarkedJS. (MIT License)
	* Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)
	* https://github.com/markedjs/marked
	*/
	/**
	* DO NOT EDIT THIS FILE
	* The code in this file is generated from files in ./src/
	*/
	function M() {
		return {
			async: !1,
			breaks: !1,
			extensions: null,
			gfm: !0,
			hooks: null,
			pedantic: !1,
			renderer: null,
			silent: !1,
			tokenizer: null,
			walkTokens: null
		};
	}
	var T = M();
	function N(l) {
		T = l;
	}
	var _ = { exec: () => null };
	function E(l) {
		let e = [];
		return (t) => {
			let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
			return s || (s = l(n), e[n] = s), s;
		};
	}
	function d(l, e = "") {
		let t = typeof l == "string" ? l : l.source, n = {
			replace: (s, r) => {
				let i = typeof r == "string" ? r : r.source;
				return i = i.replace(m.caret, "$1"), t = t.replace(s, i), n;
			},
			getRegex: () => new RegExp(t, e)
		};
		return n;
	}
	var Te = ((l = "") => {
		try {
			return !!new RegExp("(?<=1)(?<!1)" + l);
		} catch {
			return !1;
		}
	})();
	var m = {
		codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
		outputLinkReplace: /\\([\[\]])/g,
		indentCodeCompensation: /^(\s+)(?:```)/,
		beginningSpace: /^\s+/,
		endingHash: /#$/,
		startingSpaceChar: /^ /,
		endingSpaceChar: / $/,
		nonSpaceChar: /[^ ]/,
		newLineCharGlobal: /\n/g,
		tabCharGlobal: /\t/g,
		multipleSpaceGlobal: /\s+/g,
		blankLine: /^[ \t]*$/,
		doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
		blockquoteStart: /^ {0,3}>/,
		blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
		blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
		listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
		listIsTask: /^\[[ xX]\] +\S/,
		listReplaceTask: /^\[[ xX]\] +/,
		listTaskCheckbox: /\[[ xX]\]/,
		anyLine: /\n.*\n/,
		hrefBrackets: /^<(.*)>$/,
		tableDelimiter: /[:|]/,
		tableAlignChars: /^\||\| *$/g,
		tableRowBlankLine: /\n[ \t]*$/,
		tableAlignRight: /^ *-+: *$/,
		tableAlignCenter: /^ *:-+: *$/,
		tableAlignLeft: /^ *:-+ *$/,
		startATag: /^<a /i,
		endATag: /^<\/a>/i,
		startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
		endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
		startAngleBracket: /^</,
		endAngleBracket: />$/,
		pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
		unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
		escapeTest: /[&<>"']/,
		escapeReplace: /[&<>"']/g,
		escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
		escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
		caret: /(^|[^\[])\^/g,
		percentDecode: /%25/g,
		findPipe: /\|/g,
		splitPipe: / \|/,
		slashPipe: /\\\|/g,
		carriageReturn: /\r\n|\r/g,
		spaceLine: /^ +$/gm,
		notSpaceStart: /^\S*/,
		endingNewline: /\n$/,
		listItemRegex: (l) => new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`),
		nextBulletRegex: E((l) => new RegExp(`^ {0,${l}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),
		hrRegex: E((l) => new RegExp(`^ {0,${l}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),
		fencesBeginRegex: E((l) => new RegExp(`^ {0,${l}}(?:\`\`\`|~~~)`)),
		headingBeginRegex: E((l) => new RegExp(`^ {0,${l}}#`)),
		htmlBeginRegex: E((l) => new RegExp(`^ {0,${l}}<(?:[a-z].*>|!--)`, "i")),
		blockquoteBeginRegex: E((l) => new RegExp(`^ {0,${l}}>`))
	};
	var Oe = /^(?:[ \t]*(?:\n|$))+/;
	var we = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
	var ye = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
	var B = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
	var Pe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
	var j = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
	var oe = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
	var ae = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
	var Se = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
	var F = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
	var $e = /^[^\n]+/;
	var U = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
	var Le = d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", U).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
	var _e = d(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, j).getRegex();
	var H = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
	var K = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
	var ze = d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n+|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n+|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n+|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", K).replace("tag", H).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
	var le = (l) => d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", l).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex();
	var Me = le(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/);
	var Ee = le(/ {0,3}(?:[*+-]|\d{1,9}[.)])[ \t]+[^ \t\n]/);
	var W = {
		blockquote: d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ee).getRegex(),
		code: we,
		def: Le,
		fences: ye,
		heading: Pe,
		hr: B,
		html: ze,
		lheading: ae,
		list: _e,
		newline: Oe,
		paragraph: Me,
		table: _,
		text: $e
	};
	var se = d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex();
	var Ae = {
		...W,
		lheading: Se,
		table: se,
		paragraph: d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", se).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex()
	};
	var Ce = {
		...W,
		html: d(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", K).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
		def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
		heading: /^(#{1,6})(.*)(?:\n+|$)/,
		fences: _,
		lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
		paragraph: d(F).replace("hr", B).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ae).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
	};
	var Be = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
	var qe = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
	var ue = /^( {2,}|\\)\n(?!\s*$)/;
	var De = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
	var I = /[\p{P}\p{S}]/u;
	var Z = /[\s\p{P}\p{S}]/u;
	var X = /[^\s\p{P}\p{S}]/u;
	var ve = d(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Z).getRegex();
	var pe = /(?!~)[\p{P}\p{S}]/u;
	var He = /(?!~)[\s\p{P}\p{S}]/u;
	var Ze = /(?:[^\s\p{P}\p{S}]|~)/u;
	var Ge = d(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Te ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
	var ce = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
	var Ne = d(ce, "u").replace(/punct/g, I).getRegex();
	var Qe = d(ce, "u").replace(/punct/g, pe).getRegex();
	var he = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
	var je = d(he, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex();
	var Fe = d(he, "gu").replace(/notPunctSpace/g, Ze).replace(/punctSpace/g, He).replace(/punct/g, pe).getRegex();
	var Ue = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex();
	var Ke = d(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, I).getRegex();
	var Xe = d("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex();
	var Je = d(/\\(punct)/, "gu").replace(/punct/g, I).getRegex();
	var Ve = d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
	var Ye = d(K).replace("(?:-->|$)", "-->").getRegex();
	var et = d("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ye).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
	var v = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
	var tt = d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", v).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
	var ke = d(/^!?\[(label)\]\[(ref)\]/).replace("label", v).replace("ref", U).getRegex();
	var de = d(/^!?\[(ref)\](?:\[\])?/).replace("ref", U).getRegex();
	var nt = d("reflink|nolink(?!\\()", "g").replace("reflink", ke).replace("nolink", de).getRegex();
	var ie = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
	var J = {
		_backpedal: _,
		anyPunctuation: Je,
		autolink: Ve,
		blockSkip: Ge,
		br: ue,
		code: qe,
		del: _,
		delLDelim: _,
		delRDelim: _,
		emStrongLDelim: Ne,
		emStrongRDelimAst: je,
		emStrongRDelimUnd: Ue,
		escape: Be,
		link: tt,
		nolink: de,
		punctuation: ve,
		reflink: ke,
		reflinkSearch: nt,
		tag: et,
		text: De,
		url: _
	};
	var rt = {
		...J,
		link: d(/^!?\[(label)\]\((.*?)\)/).replace("label", v).getRegex(),
		reflink: d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", v).getRegex()
	};
	var Q = {
		...J,
		emStrongRDelimAst: Fe,
		emStrongLDelim: Qe,
		delLDelim: Ke,
		delRDelim: Xe,
		url: d(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ie).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
		_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
		del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
		text: d(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ie).getRegex()
	};
	var st = {
		...Q,
		br: d(ue).replace("{2,}", "*").getRegex(),
		text: d(Q.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
	};
	var q = {
		normal: W,
		gfm: Ae,
		pedantic: Ce
	};
	var A = {
		normal: J,
		gfm: Q,
		breaks: st,
		pedantic: rt
	};
	var it = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	};
	var ge = (l) => it[l];
	function O(l, e) {
		if (e) {
			if (m.escapeTest.test(l)) return l.replace(m.escapeReplace, ge);
		} else if (m.escapeTestNoEncode.test(l)) return l.replace(m.escapeReplaceNoEncode, ge);
		return l;
	}
	function V(l) {
		try {
			l = encodeURI(l).replace(m.percentDecode, "%");
		} catch {
			return null;
		}
		return l;
	}
	function Y(l, e) {
		let n = l.replace(m.findPipe, (r, i, o) => {
			let u = !1, a = i;
			for (; --a >= 0 && o[a] === "\\";) u = !u;
			return u ? "|" : " |";
		}).split(m.splitPipe), s = 0;
		if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
		else for (; n.length < e;) n.push("");
		for (; s < n.length; s++) n[s] = n[s].trim().replace(m.slashPipe, "|");
		return n;
	}
	function $(l, e, t) {
		let n = l.length;
		if (n === 0) return "";
		let s = 0;
		for (; s < n;) {
			let r = l.charAt(n - s - 1);
			if (r === e && !t) s++;
			else if (r !== e && t) s++;
			else break;
		}
		return l.slice(0, n - s);
	}
	function ee(l) {
		let e = l.split(`
`), t = e.length - 1;
		for (; t >= 0 && m.blankLine.test(e[t]);) t--;
		return e.length - t <= 2 ? l : e.slice(0, t + 1).join(`
`);
	}
	function fe(l, e) {
		if (l.indexOf(e[1]) === -1) return -1;
		let t = 0;
		for (let n = 0; n < l.length; n++) if (l[n] === "\\") n++;
		else if (l[n] === e[0]) t++;
		else if (l[n] === e[1] && (t--, t < 0)) return n;
		return t > 0 ? -2 : -1;
	}
	function me(l, e = 0) {
		let t = e, n = "";
		for (let s of l) if (s === "	") {
			let r = 4 - t % 4;
			n += " ".repeat(r), t += r;
		} else n += s, t++;
		return n;
	}
	function xe(l, e, t, n, s) {
		let r = e.href, i = e.title || null, o = l[1].replace(s.other.outputLinkReplace, "$1");
		n.state.inLink = !0;
		let u = {
			type: l[0].charAt(0) === "!" ? "image" : "link",
			raw: t,
			href: r,
			title: i,
			text: o,
			tokens: n.inlineTokens(o)
		};
		return n.state.inLink = !1, u;
	}
	function ot(l, e, t) {
		let n = l.match(t.other.indentCodeCompensation);
		if (n === null) return e;
		let s = n[1];
		return e.split(`
`).map((r) => {
			let i = r.match(t.other.beginningSpace);
			if (i === null) return r;
			let [o] = i;
			return o.length >= s.length ? r.slice(s.length) : r;
		}).join(`
`);
	}
	var w = class {
		options;
		rules;
		lexer;
		constructor(e) {
			this.options = e || T;
		}
		space(e) {
			let t = this.rules.block.newline.exec(e);
			if (t && t[0].length > 0) return {
				type: "space",
				raw: t[0]
			};
		}
		code(e) {
			let t = this.rules.block.code.exec(e);
			if (t) {
				let n = this.options.pedantic ? t[0] : ee(t[0]);
				return {
					type: "code",
					raw: n,
					codeBlockStyle: "indented",
					text: n.replace(this.rules.other.codeRemoveIndent, "")
				};
			}
		}
		fences(e) {
			let t = this.rules.block.fences.exec(e);
			if (t) {
				let n = t[0], s = ot(n, t[3] || "", this.rules);
				return {
					type: "code",
					raw: n,
					lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
					text: s
				};
			}
		}
		heading(e) {
			let t = this.rules.block.heading.exec(e);
			if (t) {
				let n = t[2].trim();
				if (this.rules.other.endingHash.test(n)) {
					let s = $(n, "#");
					(this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
				}
				return {
					type: "heading",
					raw: $(t[0], `
`),
					depth: t[1].length,
					text: n,
					tokens: this.lexer.inline(n)
				};
			}
		}
		hr(e) {
			let t = this.rules.block.hr.exec(e);
			if (t) return {
				type: "hr",
				raw: $(t[0], `
`)
			};
		}
		blockquote(e) {
			let t = this.rules.block.blockquote.exec(e);
			if (t) {
				let n = $(t[0], `
`).split(`
`), s = "", r = "", i = [];
				for (; n.length > 0;) {
					let o = !1, u = [], a;
					for (a = 0; a < n.length; a++) if (this.rules.other.blockquoteStart.test(n[a])) u.push(n[a]), o = !0;
					else if (!o) u.push(n[a]);
					else break;
					n = n.slice(a);
					let c = u.join(`
`), p = c.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
					s = s ? `${s}
${c}` : c, r = r ? `${r}
${p}` : p;
					let k = this.lexer.state.top;
					if (this.lexer.state.top = !0, this.lexer.blockTokens(p, i, !0), this.lexer.state.top = k, n.length === 0) break;
					let h = i.at(-1);
					if (h?.type === "code") break;
					if (h?.type === "blockquote") {
						let R = h, f = R.raw + `
` + n.join(`
`), S = this.blockquote(f);
						i[i.length - 1] = S, s = s.substring(0, s.length - R.raw.length) + S.raw, r = r.substring(0, r.length - R.text.length) + S.text;
						break;
					} else if (h?.type === "list") {
						let R = h, f = R.raw + `
` + n.join(`
`), S = this.list(f);
						i[i.length - 1] = S, s = s.substring(0, s.length - h.raw.length) + S.raw, r = r.substring(0, r.length - R.raw.length) + S.raw, n = f.substring(i.at(-1).raw.length).split(`
`);
						continue;
					}
				}
				return {
					type: "blockquote",
					raw: s,
					tokens: i,
					text: r
				};
			}
		}
		list(e) {
			let t = this.rules.block.list.exec(e);
			if (t) {
				let n = t[1].trim(), s = n.length > 1, r = {
					type: "list",
					raw: "",
					ordered: s,
					start: s ? +n.slice(0, -1) : "",
					loose: !1,
					items: []
				};
				n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
				let i = this.rules.other.listItemRegex(n), o = !1;
				for (; e;) {
					let a = !1, c = "", p = "";
					if (!(t = i.exec(e)) || this.rules.block.hr.test(e)) break;
					c = t[0], e = e.substring(c.length);
					let k = me(t[2].split(`
`, 1)[0], t[1].length), h = e.split(`
`, 1)[0], R = !k.trim(), f = 0;
					if (this.options.pedantic ? (f = 2, p = k.trimStart()) : R ? f = t[1].length + 1 : (f = k.search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, p = k.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h) && (c += h + `
`, e = e.substring(h.length + 1), a = !0), !a) {
						let S = this.rules.other.nextBulletRegex(f), te = this.rules.other.hrRegex(f), ne = this.rules.other.fencesBeginRegex(f), re = this.rules.other.headingBeginRegex(f), be = this.rules.other.htmlBeginRegex(f), Re = this.rules.other.blockquoteBeginRegex(f);
						for (; e;) {
							let G = e.split(`
`, 1)[0], C;
							if (h = G, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), C = h) : C = h.replace(this.rules.other.tabCharGlobal, "    "), ne.test(h) || re.test(h) || be.test(h) || Re.test(h) || S.test(h) || te.test(h)) break;
							if (C.search(this.rules.other.nonSpaceChar) >= f || !h.trim()) p += `
` + C.slice(f);
							else {
								if (R || k.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ne.test(k) || re.test(k) || te.test(k)) break;
								p += `
` + h;
							}
							R = !h.trim(), c += G + `
`, e = e.substring(G.length + 1), k = C.slice(f);
						}
					}
					r.loose || (o ? r.loose = !0 : this.rules.other.doubleBlankLine.test(c) && (o = !0)), r.items.push({
						type: "list_item",
						raw: c,
						task: !!this.options.gfm && this.rules.other.listIsTask.test(p),
						loose: !1,
						text: p,
						tokens: []
					}), r.raw += c;
				}
				let u = r.items.at(-1);
				if (u) u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
				else return;
				r.raw = r.raw.trimEnd();
				for (let a of r.items) {
					this.lexer.state.top = !1, a.tokens = this.lexer.blockTokens(a.text, []);
					let c = a.tokens[0];
					if (a.task && (c?.type === "text" || c?.type === "paragraph")) {
						a.text = a.text.replace(this.rules.other.listReplaceTask, ""), c.raw = c.raw.replace(this.rules.other.listReplaceTask, ""), c.text = c.text.replace(this.rules.other.listReplaceTask, "");
						for (let k = this.lexer.inlineQueue.length - 1; k >= 0; k--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[k].src)) {
							this.lexer.inlineQueue[k].src = this.lexer.inlineQueue[k].src.replace(this.rules.other.listReplaceTask, "");
							break;
						}
						let p = this.rules.other.listTaskCheckbox.exec(a.raw);
						if (p) {
							let k = {
								type: "checkbox",
								raw: p[0] + " ",
								checked: p[0] !== "[ ]"
							};
							a.checked = k.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = k.raw + a.tokens[0].raw, a.tokens[0].text = k.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(k)) : a.tokens.unshift({
								type: "paragraph",
								raw: k.raw,
								text: k.raw,
								tokens: [k]
							}) : a.tokens.unshift(k);
						}
					} else a.task && (a.task = !1);
					if (!r.loose) {
						let p = a.tokens.filter((h) => h.type === "space");
						r.loose = p.length > 0 && p.some((h) => this.rules.other.anyLine.test(h.raw));
					}
				}
				if (r.loose) for (let a of r.items) {
					a.loose = !0;
					for (let c of a.tokens) c.type === "text" && (c.type = "paragraph");
				}
				return r;
			}
		}
		html(e) {
			let t = this.rules.block.html.exec(e);
			if (t) {
				let n = ee(t[0]);
				return {
					type: "html",
					block: !0,
					raw: n,
					pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
					text: n
				};
			}
		}
		def(e) {
			let t = this.rules.block.def.exec(e);
			if (t) {
				let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
				return {
					type: "def",
					tag: n,
					raw: $(t[0], `
`),
					href: s,
					title: r
				};
			}
		}
		table(e) {
			let t = this.rules.block.table.exec(e);
			if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
			let n = Y(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = {
				type: "table",
				raw: $(t[0], `
`),
				header: [],
				align: [],
				rows: []
			};
			if (n.length === s.length) {
				for (let o of s) this.rules.other.tableAlignRight.test(o) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? i.align.push("left") : i.align.push(null);
				for (let o = 0; o < n.length; o++) i.header.push({
					text: n[o],
					tokens: this.lexer.inline(n[o]),
					header: !0,
					align: i.align[o]
				});
				for (let o of r) i.rows.push(Y(o, i.header.length).map((u, a) => ({
					text: u,
					tokens: this.lexer.inline(u),
					header: !1,
					align: i.align[a]
				})));
				return i;
			}
		}
		lheading(e) {
			let t = this.rules.block.lheading.exec(e);
			if (t) {
				let n = t[1].trim();
				return {
					type: "heading",
					raw: $(t[0], `
`),
					depth: t[2].charAt(0) === "=" ? 1 : 2,
					text: n,
					tokens: this.lexer.inline(n)
				};
			}
		}
		paragraph(e) {
			let t = this.rules.block.paragraph.exec(e);
			if (t) {
				let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
				return {
					type: "paragraph",
					raw: t[0],
					text: n,
					tokens: this.lexer.inline(n)
				};
			}
		}
		text(e) {
			let t = this.rules.block.text.exec(e);
			if (t) return {
				type: "text",
				raw: t[0],
				text: t[0],
				tokens: this.lexer.inline(t[0])
			};
		}
		escape(e) {
			let t = this.rules.inline.escape.exec(e);
			if (t) return {
				type: "escape",
				raw: t[0],
				text: t[1]
			};
		}
		tag(e) {
			let t = this.rules.inline.tag.exec(e);
			if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
				type: "html",
				raw: t[0],
				inLink: this.lexer.state.inLink,
				inRawBlock: this.lexer.state.inRawBlock,
				block: !1,
				text: t[0]
			};
		}
		link(e) {
			let t = this.rules.inline.link.exec(e);
			if (t) {
				let n = t[2].trim();
				if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
					if (!this.rules.other.endAngleBracket.test(n)) return;
					let i = $(n.slice(0, -1), "\\");
					if ((n.length - i.length) % 2 === 0) return;
				} else {
					let i = fe(t[2], "()");
					if (i === -2) return;
					if (i > -1) {
						let u = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
						t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, u).trim(), t[3] = "";
					}
				}
				let s = t[2], r = "";
				if (this.options.pedantic) {
					let i = this.rules.other.pedanticHrefTitle.exec(s);
					i && (s = i[1], r = i[3]);
				} else r = t[3] ? t[3].slice(1, -1) : "";
				return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), xe(t, {
					href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
					title: r && r.replace(this.rules.inline.anyPunctuation, "$1")
				}, t[0], this.lexer, this.rules);
			}
		}
		reflink(e, t) {
			let n;
			if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
				let r = t[(n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
				if (!r) {
					let i = n[0].charAt(0);
					return {
						type: "text",
						raw: i,
						text: i
					};
				}
				return xe(n, r, n[0], this.lexer, this.rules);
			}
		}
		emStrong(e, t, n = "") {
			let s = this.rules.inline.emStrongLDelim.exec(e);
			if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
			if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
				let i = [...s[0]].length - 1, o, u, a = i, c = 0, p = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
				for (p.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = p.exec(t)) !== null;) {
					if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
					if (u = [...o].length, s[3] || s[4]) {
						a += u;
						continue;
					} else if ((s[5] || s[6]) && i % 3 && !((i + u) % 3)) {
						c += u;
						continue;
					}
					if (a -= u, a > 0) continue;
					u = Math.min(u, u + a + c);
					let k = [...s[0]][0].length, h = e.slice(0, i + s.index + k + u);
					if (Math.min(i, u) % 2) {
						let f = h.slice(1, -1);
						return {
							type: "em",
							raw: h,
							text: f,
							tokens: this.lexer.inlineTokens(f)
						};
					}
					let R = h.slice(2, -2);
					return {
						type: "strong",
						raw: h,
						text: R,
						tokens: this.lexer.inlineTokens(R)
					};
				}
			}
		}
		codespan(e) {
			let t = this.rules.inline.code.exec(e);
			if (t) {
				let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
				return s && r && (n = n.substring(1, n.length - 1)), {
					type: "codespan",
					raw: t[0],
					text: n
				};
			}
		}
		br(e) {
			let t = this.rules.inline.br.exec(e);
			if (t) return {
				type: "br",
				raw: t[0]
			};
		}
		del(e, t, n = "") {
			let s = this.rules.inline.delLDelim.exec(e);
			if (!s) return;
			if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
				let i = [...s[0]].length - 1, o, u, a = i, c = this.rules.inline.delRDelim;
				for (c.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = c.exec(t)) !== null;) {
					if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o || (u = [...o].length, u !== i)) continue;
					if (s[3] || s[4]) {
						a += u;
						continue;
					}
					if (a -= u, a > 0) continue;
					u = Math.min(u, u + a);
					let p = [...s[0]][0].length, k = e.slice(0, i + s.index + p + u), h = k.slice(i, -i);
					return {
						type: "del",
						raw: k,
						text: h,
						tokens: this.lexer.inlineTokens(h)
					};
				}
			}
		}
		autolink(e) {
			let t = this.rules.inline.autolink.exec(e);
			if (t) {
				let n, s;
				return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), {
					type: "link",
					raw: t[0],
					text: n,
					href: s,
					tokens: [{
						type: "text",
						raw: n,
						text: n
					}]
				};
			}
		}
		url(e) {
			let t;
			if (t = this.rules.inline.url.exec(e)) {
				let n, s;
				if (t[2] === "@") n = t[0], s = "mailto:" + n;
				else {
					let r;
					do
						r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
					while (r !== t[0]);
					n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
				}
				return {
					type: "link",
					raw: t[0],
					text: n,
					href: s,
					tokens: [{
						type: "text",
						raw: n,
						text: n
					}]
				};
			}
		}
		inlineText(e) {
			let t = this.rules.inline.text.exec(e);
			if (t) {
				let n = this.lexer.state.inRawBlock;
				return {
					type: "text",
					raw: t[0],
					text: t[0],
					escaped: n
				};
			}
		}
	};
	var x = class l {
		tokens;
		options;
		state;
		inlineQueue;
		tokenizer;
		constructor(e) {
			this.tokens = [], this.tokens.links = Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new w(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
				inLink: !1,
				inRawBlock: !1,
				top: !0
			};
			let t = {
				other: m,
				block: q.normal,
				inline: A.normal
			};
			this.options.pedantic ? (t.block = q.pedantic, t.inline = A.pedantic) : this.options.gfm && (t.block = q.gfm, this.options.breaks ? t.inline = A.breaks : t.inline = A.gfm), this.tokenizer.rules = t;
		}
		static get rules() {
			return {
				block: q,
				inline: A
			};
		}
		static lex(e, t) {
			return new l(t).lex(e);
		}
		static lexInline(e, t) {
			return new l(t).inlineTokens(e);
		}
		lex(e) {
			e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
			for (let t = 0; t < this.inlineQueue.length; t++) {
				let n = this.inlineQueue[t];
				this.inlineTokens(n.src, n.tokens);
			}
			return this.inlineQueue = [], this.tokens;
		}
		blockTokens(e, t = [], n = !1) {
			this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));
			let s = Infinity;
			for (; e;) {
				if (e.length < s) s = e.length;
				else {
					this.infiniteLoopError(e.charCodeAt(0));
					break;
				}
				let r;
				if (this.options.extensions?.block?.some((o) => (r = o.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
				if (r = this.tokenizer.space(e)) {
					e = e.substring(r.raw.length);
					let o = t.at(-1);
					r.raw.length === 1 && o !== void 0 ? o.raw += `
` : t.push(r);
					continue;
				}
				if (r = this.tokenizer.code(e)) {
					e = e.substring(r.raw.length);
					let o = t.at(-1);
					o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.at(-1).src = o.text) : t.push(r);
					continue;
				}
				if (r = this.tokenizer.fences(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				if (r = this.tokenizer.heading(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				if (r = this.tokenizer.hr(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				if (r = this.tokenizer.blockquote(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				if (r = this.tokenizer.list(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				if (r = this.tokenizer.html(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				if (r = this.tokenizer.def(e)) {
					e = e.substring(r.raw.length);
					let o = t.at(-1);
					o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
						href: r.href,
						title: r.title
					}, t.push(r));
					continue;
				}
				if (r = this.tokenizer.table(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				if (r = this.tokenizer.lheading(e)) {
					e = e.substring(r.raw.length), t.push(r);
					continue;
				}
				let i = e;
				if (this.options.extensions?.startBlock) {
					let o = Infinity, u = e.slice(1), a;
					this.options.extensions.startBlock.forEach((c) => {
						a = c.call({ lexer: this }, u), typeof a == "number" && a >= 0 && (o = Math.min(o, a));
					}), o < Infinity && o >= 0 && (i = e.substring(0, o + 1));
				}
				if (this.state.top && (r = this.tokenizer.paragraph(i))) {
					let o = t.at(-1);
					n && o?.type === "paragraph" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
					continue;
				}
				if (r = this.tokenizer.text(e)) {
					e = e.substring(r.raw.length);
					let o = t.at(-1);
					o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r);
					continue;
				}
				if (e) {
					this.infiniteLoopError(e.charCodeAt(0));
					break;
				}
			}
			return this.state.top = !0, t;
		}
		inline(e, t = []) {
			return this.inlineQueue.push({
				src: e,
				tokens: t
			}), t;
		}
		inlineTokens(e, t = []) {
			this.tokenizer.lexer = this;
			let n = e, s = null;
			if (this.tokens.links) {
				let a = Object.keys(this.tokens.links);
				if (a.length > 0) for (; (s = this.tokenizer.rules.inline.reflinkSearch.exec(n)) !== null;) a.includes(s[0].slice(s[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, s.index) + "[" + "a".repeat(s[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
			}
			for (; (s = this.tokenizer.rules.inline.anyPunctuation.exec(n)) !== null;) n = n.slice(0, s.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
			let r;
			for (; (s = this.tokenizer.rules.inline.blockSkip.exec(n)) !== null;) r = s[2] ? s[2].length : 0, n = n.slice(0, s.index + r) + "[" + "a".repeat(s[0].length - r - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
			n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
			let i = !1, o = "", u = Infinity;
			for (; e;) {
				if (e.length < u) u = e.length;
				else {
					this.infiniteLoopError(e.charCodeAt(0));
					break;
				}
				i || (o = ""), i = !1;
				let a;
				if (this.options.extensions?.inline?.some((p) => (a = p.call({ lexer: this }, e, t)) ? (e = e.substring(a.raw.length), t.push(a), !0) : !1)) continue;
				if (a = this.tokenizer.escape(e)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (a = this.tokenizer.tag(e)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (a = this.tokenizer.link(e)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (a = this.tokenizer.reflink(e, this.tokens.links)) {
					e = e.substring(a.raw.length);
					let p = t.at(-1);
					a.type === "text" && p?.type === "text" ? (p.raw += a.raw, p.text += a.text) : t.push(a);
					continue;
				}
				if (a = this.tokenizer.emStrong(e, n, o)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (a = this.tokenizer.codespan(e)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (a = this.tokenizer.br(e)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (a = this.tokenizer.del(e, n, o)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (a = this.tokenizer.autolink(e)) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				if (!this.state.inLink && (a = this.tokenizer.url(e))) {
					e = e.substring(a.raw.length), t.push(a);
					continue;
				}
				let c = e;
				if (this.options.extensions?.startInline) {
					let p = Infinity, k = e.slice(1), h;
					this.options.extensions.startInline.forEach((R) => {
						h = R.call({ lexer: this }, k), typeof h == "number" && h >= 0 && (p = Math.min(p, h));
					}), p < Infinity && p >= 0 && (c = e.substring(0, p + 1));
				}
				if (a = this.tokenizer.inlineText(c)) {
					e = e.substring(a.raw.length), a.raw.slice(-1) !== "_" && (o = a.raw.slice(-1)), i = !0;
					let p = t.at(-1);
					p?.type === "text" ? (p.raw += a.raw, p.text += a.text) : t.push(a);
					continue;
				}
				if (e) {
					this.infiniteLoopError(e.charCodeAt(0));
					break;
				}
			}
			return t;
		}
		infiniteLoopError(e) {
			let t = "Infinite loop on byte: " + e;
			if (this.options.silent) console.error(t);
			else throw new Error(t);
		}
	};
	var y = class {
		options;
		parser;
		constructor(e) {
			this.options = e || T;
		}
		space(e) {
			return "";
		}
		code({ text: e, lang: t, escaped: n }) {
			let s = (t || "").match(m.notSpaceStart)?.[0], r = e.replace(m.endingNewline, "") + `
`;
			return s ? "<pre><code class=\"language-" + O(s) + "\">" + (n ? r : O(r, !0)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, !0)) + `</code></pre>
`;
		}
		blockquote({ tokens: e }) {
			return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
		}
		html({ text: e }) {
			return e;
		}
		def(e) {
			return "";
		}
		heading({ tokens: e, depth: t }) {
			return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
		}
		hr(e) {
			return `<hr>
`;
		}
		list(e) {
			let t = e.ordered, n = e.start, s = "";
			for (let o = 0; o < e.items.length; o++) {
				let u = e.items[o];
				s += this.listitem(u);
			}
			let r = t ? "ol" : "ul", i = t && n !== 1 ? " start=\"" + n + "\"" : "";
			return "<" + r + i + `>
` + s + "</" + r + `>
`;
		}
		listitem(e) {
			return `<li>${this.parser.parse(e.tokens)}</li>
`;
		}
		checkbox({ checked: e }) {
			return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\"> ";
		}
		paragraph({ tokens: e }) {
			return `<p>${this.parser.parseInline(e)}</p>
`;
		}
		table(e) {
			let t = "", n = "";
			for (let r = 0; r < e.header.length; r++) n += this.tablecell(e.header[r]);
			t += this.tablerow({ text: n });
			let s = "";
			for (let r = 0; r < e.rows.length; r++) {
				let i = e.rows[r];
				n = "";
				for (let o = 0; o < i.length; o++) n += this.tablecell(i[o]);
				s += this.tablerow({ text: n });
			}
			return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
		}
		tablerow({ text: e }) {
			return `<tr>
${e}</tr>
`;
		}
		tablecell(e) {
			let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
			return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
		}
		strong({ tokens: e }) {
			return `<strong>${this.parser.parseInline(e)}</strong>`;
		}
		em({ tokens: e }) {
			return `<em>${this.parser.parseInline(e)}</em>`;
		}
		codespan({ text: e }) {
			return `<code>${O(e, !0)}</code>`;
		}
		br(e) {
			return "<br>";
		}
		del({ tokens: e }) {
			return `<del>${this.parser.parseInline(e)}</del>`;
		}
		link({ href: e, title: t, tokens: n }) {
			let s = this.parser.parseInline(n), r = V(e);
			if (r === null) return s;
			e = r;
			let i = "<a href=\"" + e + "\"";
			return t && (i += " title=\"" + O(t) + "\""), i += ">" + s + "</a>", i;
		}
		image({ href: e, title: t, text: n, tokens: s }) {
			s && (n = this.parser.parseInline(s, this.parser.textRenderer));
			let r = V(e);
			if (r === null) return O(n);
			e = r;
			let i = `<img src="${e}" alt="${O(n)}"`;
			return t && (i += ` title="${O(t)}"`), i += ">", i;
		}
		text(e) {
			return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
		}
	};
	var L = class {
		strong({ text: e }) {
			return e;
		}
		em({ text: e }) {
			return e;
		}
		codespan({ text: e }) {
			return e;
		}
		del({ text: e }) {
			return e;
		}
		html({ text: e }) {
			return e;
		}
		text({ text: e }) {
			return e;
		}
		link({ text: e }) {
			return "" + e;
		}
		image({ text: e }) {
			return "" + e;
		}
		br() {
			return "";
		}
		checkbox({ raw: e }) {
			return e;
		}
	};
	var b = class l {
		options;
		renderer;
		textRenderer;
		constructor(e) {
			this.options = e || T, this.options.renderer = this.options.renderer || new y(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new L();
		}
		static parse(e, t) {
			return new l(t).parse(e);
		}
		static parseInline(e, t) {
			return new l(t).parseInline(e);
		}
		parse(e) {
			this.renderer.parser = this;
			let t = "";
			for (let n = 0; n < e.length; n++) {
				let s = e[n];
				if (this.options.extensions?.renderers?.[s.type]) {
					let i = s, o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
					if (o !== !1 || ![
						"space",
						"hr",
						"heading",
						"code",
						"table",
						"blockquote",
						"list",
						"html",
						"def",
						"paragraph",
						"text"
					].includes(i.type)) {
						t += o || "";
						continue;
					}
				}
				let r = s;
				switch (r.type) {
					case "space":
						t += this.renderer.space(r);
						break;
					case "hr":
						t += this.renderer.hr(r);
						break;
					case "heading":
						t += this.renderer.heading(r);
						break;
					case "code":
						t += this.renderer.code(r);
						break;
					case "table":
						t += this.renderer.table(r);
						break;
					case "blockquote":
						t += this.renderer.blockquote(r);
						break;
					case "list":
						t += this.renderer.list(r);
						break;
					case "checkbox":
						t += this.renderer.checkbox(r);
						break;
					case "html":
						t += this.renderer.html(r);
						break;
					case "def":
						t += this.renderer.def(r);
						break;
					case "paragraph":
						t += this.renderer.paragraph(r);
						break;
					case "text":
						t += this.renderer.text(r);
						break;
					default: {
						let i = "Token with \"" + r.type + "\" type was not found.";
						if (this.options.silent) return console.error(i), "";
						throw new Error(i);
					}
				}
			}
			return t;
		}
		parseInline(e, t = this.renderer) {
			this.renderer.parser = this;
			let n = "";
			for (let s = 0; s < e.length; s++) {
				let r = e[s];
				if (this.options.extensions?.renderers?.[r.type]) {
					let o = this.options.extensions.renderers[r.type].call({ parser: this }, r);
					if (o !== !1 || ![
						"escape",
						"html",
						"link",
						"image",
						"strong",
						"em",
						"codespan",
						"br",
						"del",
						"text"
					].includes(r.type)) {
						n += o || "";
						continue;
					}
				}
				let i = r;
				switch (i.type) {
					case "escape":
						n += t.text(i);
						break;
					case "html":
						n += t.html(i);
						break;
					case "link":
						n += t.link(i);
						break;
					case "image":
						n += t.image(i);
						break;
					case "checkbox":
						n += t.checkbox(i);
						break;
					case "strong":
						n += t.strong(i);
						break;
					case "em":
						n += t.em(i);
						break;
					case "codespan":
						n += t.codespan(i);
						break;
					case "br":
						n += t.br(i);
						break;
					case "del":
						n += t.del(i);
						break;
					case "text":
						n += t.text(i);
						break;
					default: {
						let o = "Token with \"" + i.type + "\" type was not found.";
						if (this.options.silent) return console.error(o), "";
						throw new Error(o);
					}
				}
			}
			return n;
		}
	};
	var P = class {
		options;
		block;
		constructor(e) {
			this.options = e || T;
		}
		static passThroughHooks = /* @__PURE__ */ new Set([
			"preprocess",
			"postprocess",
			"processAllTokens",
			"emStrongMask"
		]);
		static passThroughHooksRespectAsync = /* @__PURE__ */ new Set([
			"preprocess",
			"postprocess",
			"processAllTokens"
		]);
		preprocess(e) {
			return e;
		}
		postprocess(e) {
			return e;
		}
		processAllTokens(e) {
			return e;
		}
		emStrongMask(e) {
			return e;
		}
		provideLexer(e = this.block) {
			return e ? x.lex : x.lexInline;
		}
		provideParser(e = this.block) {
			return e ? b.parse : b.parseInline;
		}
	};
	var D = class {
		defaults = M();
		options = this.setOptions;
		parse = this.parseMarkdown(!0);
		parseInline = this.parseMarkdown(!1);
		Parser = b;
		Renderer = y;
		TextRenderer = L;
		Lexer = x;
		Tokenizer = w;
		Hooks = P;
		constructor(...e) {
			this.use(...e);
		}
		walkTokens(e, t) {
			let n = [];
			for (let s of e) switch (n = n.concat(t.call(this, s)), s.type) {
				case "table": {
					let r = s;
					for (let i of r.header) n = n.concat(this.walkTokens(i.tokens, t));
					for (let i of r.rows) for (let o of i) n = n.concat(this.walkTokens(o.tokens, t));
					break;
				}
				case "list": {
					let r = s;
					n = n.concat(this.walkTokens(r.items, t));
					break;
				}
				default: {
					let r = s;
					this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((i) => {
						let o = r[i].flat(Infinity);
						n = n.concat(this.walkTokens(o, t));
					}) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
				}
			}
			return n;
		}
		use(...e) {
			let t = this.defaults.extensions || {
				renderers: {},
				childTokens: {}
			};
			return e.forEach((n) => {
				let s = { ...n };
				if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((r) => {
					if (!r.name) throw new Error("extension name required");
					if ("renderer" in r) {
						let i = t.renderers[r.name];
						i ? t.renderers[r.name] = function(...o) {
							let u = r.renderer.apply(this, o);
							return u === !1 && (u = i.apply(this, o)), u;
						} : t.renderers[r.name] = r.renderer;
					}
					if ("tokenizer" in r) {
						if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
						let i = t[r.level];
						i ? i.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
					}
					"childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
				}), s.extensions = t), n.renderer) {
					let r = this.defaults.renderer || new y(this.defaults);
					for (let i in n.renderer) {
						if (!(i in r)) throw new Error(`renderer '${i}' does not exist`);
						if (["options", "parser"].includes(i)) continue;
						let o = i, u = n.renderer[o], a = r[o];
						r[o] = (...c) => {
							let p = u.apply(r, c);
							return p === !1 && (p = a.apply(r, c)), p || "";
						};
					}
					s.renderer = r;
				}
				if (n.tokenizer) {
					let r = this.defaults.tokenizer || new w(this.defaults);
					for (let i in n.tokenizer) {
						if (!(i in r)) throw new Error(`tokenizer '${i}' does not exist`);
						if ([
							"options",
							"rules",
							"lexer"
						].includes(i)) continue;
						let o = i, u = n.tokenizer[o], a = r[o];
						r[o] = (...c) => {
							let p = u.apply(r, c);
							return p === !1 && (p = a.apply(r, c)), p;
						};
					}
					s.tokenizer = r;
				}
				if (n.hooks) {
					let r = this.defaults.hooks || new P();
					for (let i in n.hooks) {
						if (!(i in r)) throw new Error(`hook '${i}' does not exist`);
						if (["options", "block"].includes(i)) continue;
						let o = i, u = n.hooks[o], a = r[o];
						P.passThroughHooks.has(i) ? r[o] = (c) => {
							if (this.defaults.async && P.passThroughHooksRespectAsync.has(i)) return (async () => {
								let k = await u.call(r, c);
								return a.call(r, k);
							})();
							let p = u.call(r, c);
							return a.call(r, p);
						} : r[o] = (...c) => {
							if (this.defaults.async) return (async () => {
								let k = await u.apply(r, c);
								return k === !1 && (k = await a.apply(r, c)), k;
							})();
							let p = u.apply(r, c);
							return p === !1 && (p = a.apply(r, c)), p;
						};
					}
					s.hooks = r;
				}
				if (n.walkTokens) {
					let r = this.defaults.walkTokens, i = n.walkTokens;
					s.walkTokens = function(o) {
						let u = [];
						return u.push(i.call(this, o)), r && (u = u.concat(r.call(this, o))), u;
					};
				}
				this.defaults = {
					...this.defaults,
					...s
				};
			}), this;
		}
		setOptions(e) {
			return this.defaults = {
				...this.defaults,
				...e
			}, this;
		}
		lexer(e, t) {
			return x.lex(e, t ?? this.defaults);
		}
		parser(e, t) {
			return b.parse(e, t ?? this.defaults);
		}
		parseMarkdown(e) {
			return (n, s) => {
				let r = { ...s }, i = {
					...this.defaults,
					...r
				}, o = this.onError(!!i.silent, !!i.async);
				if (this.defaults.async === !0 && r.async === !1) return o(/* @__PURE__ */ new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
				if (typeof n > "u" || n === null) return o(/* @__PURE__ */ new Error("marked(): input parameter is undefined or null"));
				if (typeof n != "string") return o(/* @__PURE__ */ new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
				if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
					let u = i.hooks ? await i.hooks.preprocess(n) : n, c = await (i.hooks ? await i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(u, i), p = i.hooks ? await i.hooks.processAllTokens(c) : c;
					i.walkTokens && await Promise.all(this.walkTokens(p, i.walkTokens));
					let h = await (i.hooks ? await i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(p, i);
					return i.hooks ? await i.hooks.postprocess(h) : h;
				})().catch(o);
				try {
					i.hooks && (n = i.hooks.preprocess(n));
					let a = (i.hooks ? i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, i);
					i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
					let p = (i.hooks ? i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(a, i);
					return i.hooks && (p = i.hooks.postprocess(p)), p;
				} catch (u) {
					return o(u);
				}
			};
		}
		onError(e, t) {
			return (n) => {
				if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
					let s = "<p>An error occurred:</p><pre>" + O(n.message + "", !0) + "</pre>";
					return t ? Promise.resolve(s) : s;
				}
				if (t) return Promise.reject(n);
				throw n;
			};
		}
	};
	var z = new D();
	function g(l, e) {
		return z.parse(l, e);
	}
	g.options = g.setOptions = function(l) {
		return z.setOptions(l), g.defaults = z.defaults, N(g.defaults), g;
	};
	g.getDefaults = M;
	g.defaults = T;
	g.use = function(...l) {
		return z.use(...l), g.defaults = z.defaults, N(g.defaults), g;
	};
	g.walkTokens = function(l, e) {
		return z.walkTokens(l, e);
	};
	g.parseInline = z.parseInline;
	g.Parser = b;
	g.parser = b.parse;
	g.Renderer = y;
	g.TextRenderer = L;
	g.Lexer = x;
	g.lexer = x.lex;
	g.Tokenizer = w;
	g.Hooks = P;
	g.parse = g;
	g.options;
	g.setOptions;
	g.use;
	g.walkTokens;
	g.parseInline;
	b.parse;
	x.lex;
	//#endregion
	//#region ../../node_modules/dompurify/dist/purify.es.mjs
	/*! @license DOMPurify 3.4.0 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.0/LICENSE */
	var { entries, setPrototypeOf, isFrozen, getPrototypeOf, getOwnPropertyDescriptor } = Object;
	var { freeze, seal, create } = Object;
	var { apply, construct } = typeof Reflect !== "undefined" && Reflect;
	if (!freeze) freeze = function freeze(x) {
		return x;
	};
	if (!seal) seal = function seal(x) {
		return x;
	};
	if (!apply) apply = function apply(func, thisArg) {
		for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
		return func.apply(thisArg, args);
	};
	if (!construct) construct = function construct(Func) {
		for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
		return new Func(...args);
	};
	var arrayForEach = unapply(Array.prototype.forEach);
	var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
	var arrayPop = unapply(Array.prototype.pop);
	var arrayPush = unapply(Array.prototype.push);
	var arraySplice = unapply(Array.prototype.splice);
	var stringToLowerCase = unapply(String.prototype.toLowerCase);
	var stringToString = unapply(String.prototype.toString);
	var stringMatch = unapply(String.prototype.match);
	var stringReplace = unapply(String.prototype.replace);
	var stringIndexOf = unapply(String.prototype.indexOf);
	var stringTrim = unapply(String.prototype.trim);
	var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
	var regExpTest = unapply(RegExp.prototype.test);
	var typeErrorCreate = unconstruct(TypeError);
	/**
	* Creates a new function that calls the given function with a specified thisArg and arguments.
	*
	* @param func - The function to be wrapped and called.
	* @returns A new function that calls the given function with a specified thisArg and arguments.
	*/
	function unapply(func) {
		return function(thisArg) {
			if (thisArg instanceof RegExp) thisArg.lastIndex = 0;
			for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
			return apply(func, thisArg, args);
		};
	}
	/**
	* Creates a new function that constructs an instance of the given constructor function with the provided arguments.
	*
	* @param func - The constructor function to be wrapped and called.
	* @returns A new function that constructs an instance of the given constructor function with the provided arguments.
	*/
	function unconstruct(Func) {
		return function() {
			for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
			return construct(Func, args);
		};
	}
	/**
	* Add properties to a lookup table
	*
	* @param set - The set to which elements will be added.
	* @param array - The array containing elements to be added to the set.
	* @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
	* @returns The modified set with added elements.
	*/
	function addToSet(set, array) {
		let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
		if (setPrototypeOf) setPrototypeOf(set, null);
		let l = array.length;
		while (l--) {
			let element = array[l];
			if (typeof element === "string") {
				const lcElement = transformCaseFunc(element);
				if (lcElement !== element) {
					if (!isFrozen(array)) array[l] = lcElement;
					element = lcElement;
				}
			}
			set[element] = true;
		}
		return set;
	}
	/**
	* Clean up an array to harden against CSPP
	*
	* @param array - The array to be cleaned.
	* @returns The cleaned version of the array
	*/
	function cleanArray(array) {
		for (let index = 0; index < array.length; index++) if (!objectHasOwnProperty(array, index)) array[index] = null;
		return array;
	}
	/**
	* Shallow clone an object
	*
	* @param object - The object to be cloned.
	* @returns A new object that copies the original.
	*/
	function clone(object) {
		const newObject = create(null);
		for (const [property, value] of entries(object)) if (objectHasOwnProperty(object, property)) if (Array.isArray(value)) newObject[property] = cleanArray(value);
		else if (value && typeof value === "object" && value.constructor === Object) newObject[property] = clone(value);
		else newObject[property] = value;
		return newObject;
	}
	/**
	* This method automatically checks if the prop is function or getter and behaves accordingly.
	*
	* @param object - The object to look up the getter function in its prototype chain.
	* @param prop - The property name for which to find the getter function.
	* @returns The getter function found in the prototype chain or a fallback function.
	*/
	function lookupGetter(object, prop) {
		while (object !== null) {
			const desc = getOwnPropertyDescriptor(object, prop);
			if (desc) {
				if (desc.get) return unapply(desc.get);
				if (typeof desc.value === "function") return unapply(desc.value);
			}
			object = getPrototypeOf(object);
		}
		function fallbackValue() {
			return null;
		}
		return fallbackValue;
	}
	var html$1 = freeze([
		"a",
		"abbr",
		"acronym",
		"address",
		"area",
		"article",
		"aside",
		"audio",
		"b",
		"bdi",
		"bdo",
		"big",
		"blink",
		"blockquote",
		"body",
		"br",
		"button",
		"canvas",
		"caption",
		"center",
		"cite",
		"code",
		"col",
		"colgroup",
		"content",
		"data",
		"datalist",
		"dd",
		"decorator",
		"del",
		"details",
		"dfn",
		"dialog",
		"dir",
		"div",
		"dl",
		"dt",
		"element",
		"em",
		"fieldset",
		"figcaption",
		"figure",
		"font",
		"footer",
		"form",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"head",
		"header",
		"hgroup",
		"hr",
		"html",
		"i",
		"img",
		"input",
		"ins",
		"kbd",
		"label",
		"legend",
		"li",
		"main",
		"map",
		"mark",
		"marquee",
		"menu",
		"menuitem",
		"meter",
		"nav",
		"nobr",
		"ol",
		"optgroup",
		"option",
		"output",
		"p",
		"picture",
		"pre",
		"progress",
		"q",
		"rp",
		"rt",
		"ruby",
		"s",
		"samp",
		"search",
		"section",
		"select",
		"shadow",
		"slot",
		"small",
		"source",
		"spacer",
		"span",
		"strike",
		"strong",
		"style",
		"sub",
		"summary",
		"sup",
		"table",
		"tbody",
		"td",
		"template",
		"textarea",
		"tfoot",
		"th",
		"thead",
		"time",
		"tr",
		"track",
		"tt",
		"u",
		"ul",
		"var",
		"video",
		"wbr"
	]);
	var svg$1 = freeze([
		"svg",
		"a",
		"altglyph",
		"altglyphdef",
		"altglyphitem",
		"animatecolor",
		"animatemotion",
		"animatetransform",
		"circle",
		"clippath",
		"defs",
		"desc",
		"ellipse",
		"enterkeyhint",
		"exportparts",
		"filter",
		"font",
		"g",
		"glyph",
		"glyphref",
		"hkern",
		"image",
		"inputmode",
		"line",
		"lineargradient",
		"marker",
		"mask",
		"metadata",
		"mpath",
		"part",
		"path",
		"pattern",
		"polygon",
		"polyline",
		"radialgradient",
		"rect",
		"stop",
		"style",
		"switch",
		"symbol",
		"text",
		"textpath",
		"title",
		"tref",
		"tspan",
		"view",
		"vkern"
	]);
	var svgFilters = freeze([
		"feBlend",
		"feColorMatrix",
		"feComponentTransfer",
		"feComposite",
		"feConvolveMatrix",
		"feDiffuseLighting",
		"feDisplacementMap",
		"feDistantLight",
		"feDropShadow",
		"feFlood",
		"feFuncA",
		"feFuncB",
		"feFuncG",
		"feFuncR",
		"feGaussianBlur",
		"feImage",
		"feMerge",
		"feMergeNode",
		"feMorphology",
		"feOffset",
		"fePointLight",
		"feSpecularLighting",
		"feSpotLight",
		"feTile",
		"feTurbulence"
	]);
	var svgDisallowed = freeze([
		"animate",
		"color-profile",
		"cursor",
		"discard",
		"font-face",
		"font-face-format",
		"font-face-name",
		"font-face-src",
		"font-face-uri",
		"foreignobject",
		"hatch",
		"hatchpath",
		"mesh",
		"meshgradient",
		"meshpatch",
		"meshrow",
		"missing-glyph",
		"script",
		"set",
		"solidcolor",
		"unknown",
		"use"
	]);
	var mathMl$1 = freeze([
		"math",
		"menclose",
		"merror",
		"mfenced",
		"mfrac",
		"mglyph",
		"mi",
		"mlabeledtr",
		"mmultiscripts",
		"mn",
		"mo",
		"mover",
		"mpadded",
		"mphantom",
		"mroot",
		"mrow",
		"ms",
		"mspace",
		"msqrt",
		"mstyle",
		"msub",
		"msup",
		"msubsup",
		"mtable",
		"mtd",
		"mtext",
		"mtr",
		"munder",
		"munderover",
		"mprescripts"
	]);
	var mathMlDisallowed = freeze([
		"maction",
		"maligngroup",
		"malignmark",
		"mlongdiv",
		"mscarries",
		"mscarry",
		"msgroup",
		"mstack",
		"msline",
		"msrow",
		"semantics",
		"annotation",
		"annotation-xml",
		"mprescripts",
		"none"
	]);
	var text = freeze(["#text"]);
	var html = freeze([
		"accept",
		"action",
		"align",
		"alt",
		"autocapitalize",
		"autocomplete",
		"autopictureinpicture",
		"autoplay",
		"background",
		"bgcolor",
		"border",
		"capture",
		"cellpadding",
		"cellspacing",
		"checked",
		"cite",
		"class",
		"clear",
		"color",
		"cols",
		"colspan",
		"controls",
		"controlslist",
		"coords",
		"crossorigin",
		"datetime",
		"decoding",
		"default",
		"dir",
		"disabled",
		"disablepictureinpicture",
		"disableremoteplayback",
		"download",
		"draggable",
		"enctype",
		"enterkeyhint",
		"exportparts",
		"face",
		"for",
		"headers",
		"height",
		"hidden",
		"high",
		"href",
		"hreflang",
		"id",
		"inert",
		"inputmode",
		"integrity",
		"ismap",
		"kind",
		"label",
		"lang",
		"list",
		"loading",
		"loop",
		"low",
		"max",
		"maxlength",
		"media",
		"method",
		"min",
		"minlength",
		"multiple",
		"muted",
		"name",
		"nonce",
		"noshade",
		"novalidate",
		"nowrap",
		"open",
		"optimum",
		"part",
		"pattern",
		"placeholder",
		"playsinline",
		"popover",
		"popovertarget",
		"popovertargetaction",
		"poster",
		"preload",
		"pubdate",
		"radiogroup",
		"readonly",
		"rel",
		"required",
		"rev",
		"reversed",
		"role",
		"rows",
		"rowspan",
		"spellcheck",
		"scope",
		"selected",
		"shape",
		"size",
		"sizes",
		"slot",
		"span",
		"srclang",
		"start",
		"src",
		"srcset",
		"step",
		"style",
		"summary",
		"tabindex",
		"title",
		"translate",
		"type",
		"usemap",
		"valign",
		"value",
		"width",
		"wrap",
		"xmlns",
		"slot"
	]);
	var svg = freeze([
		"accent-height",
		"accumulate",
		"additive",
		"alignment-baseline",
		"amplitude",
		"ascent",
		"attributename",
		"attributetype",
		"azimuth",
		"basefrequency",
		"baseline-shift",
		"begin",
		"bias",
		"by",
		"class",
		"clip",
		"clippathunits",
		"clip-path",
		"clip-rule",
		"color",
		"color-interpolation",
		"color-interpolation-filters",
		"color-profile",
		"color-rendering",
		"cx",
		"cy",
		"d",
		"dx",
		"dy",
		"diffuseconstant",
		"direction",
		"display",
		"divisor",
		"dur",
		"edgemode",
		"elevation",
		"end",
		"exponent",
		"fill",
		"fill-opacity",
		"fill-rule",
		"filter",
		"filterunits",
		"flood-color",
		"flood-opacity",
		"font-family",
		"font-size",
		"font-size-adjust",
		"font-stretch",
		"font-style",
		"font-variant",
		"font-weight",
		"fx",
		"fy",
		"g1",
		"g2",
		"glyph-name",
		"glyphref",
		"gradientunits",
		"gradienttransform",
		"height",
		"href",
		"id",
		"image-rendering",
		"in",
		"in2",
		"intercept",
		"k",
		"k1",
		"k2",
		"k3",
		"k4",
		"kerning",
		"keypoints",
		"keysplines",
		"keytimes",
		"lang",
		"lengthadjust",
		"letter-spacing",
		"kernelmatrix",
		"kernelunitlength",
		"lighting-color",
		"local",
		"marker-end",
		"marker-mid",
		"marker-start",
		"markerheight",
		"markerunits",
		"markerwidth",
		"maskcontentunits",
		"maskunits",
		"max",
		"mask",
		"mask-type",
		"media",
		"method",
		"mode",
		"min",
		"name",
		"numoctaves",
		"offset",
		"operator",
		"opacity",
		"order",
		"orient",
		"orientation",
		"origin",
		"overflow",
		"paint-order",
		"path",
		"pathlength",
		"patterncontentunits",
		"patterntransform",
		"patternunits",
		"points",
		"preservealpha",
		"preserveaspectratio",
		"primitiveunits",
		"r",
		"rx",
		"ry",
		"radius",
		"refx",
		"refy",
		"repeatcount",
		"repeatdur",
		"restart",
		"result",
		"rotate",
		"scale",
		"seed",
		"shape-rendering",
		"slope",
		"specularconstant",
		"specularexponent",
		"spreadmethod",
		"startoffset",
		"stddeviation",
		"stitchtiles",
		"stop-color",
		"stop-opacity",
		"stroke-dasharray",
		"stroke-dashoffset",
		"stroke-linecap",
		"stroke-linejoin",
		"stroke-miterlimit",
		"stroke-opacity",
		"stroke",
		"stroke-width",
		"style",
		"surfacescale",
		"systemlanguage",
		"tabindex",
		"tablevalues",
		"targetx",
		"targety",
		"transform",
		"transform-origin",
		"text-anchor",
		"text-decoration",
		"text-rendering",
		"textlength",
		"type",
		"u1",
		"u2",
		"unicode",
		"values",
		"viewbox",
		"visibility",
		"version",
		"vert-adv-y",
		"vert-origin-x",
		"vert-origin-y",
		"width",
		"word-spacing",
		"wrap",
		"writing-mode",
		"xchannelselector",
		"ychannelselector",
		"x",
		"x1",
		"x2",
		"xmlns",
		"y",
		"y1",
		"y2",
		"z",
		"zoomandpan"
	]);
	var mathMl = freeze([
		"accent",
		"accentunder",
		"align",
		"bevelled",
		"close",
		"columnalign",
		"columnlines",
		"columnspacing",
		"columnspan",
		"denomalign",
		"depth",
		"dir",
		"display",
		"displaystyle",
		"encoding",
		"fence",
		"frame",
		"height",
		"href",
		"id",
		"largeop",
		"length",
		"linethickness",
		"lquote",
		"lspace",
		"mathbackground",
		"mathcolor",
		"mathsize",
		"mathvariant",
		"maxsize",
		"minsize",
		"movablelimits",
		"notation",
		"numalign",
		"open",
		"rowalign",
		"rowlines",
		"rowspacing",
		"rowspan",
		"rspace",
		"rquote",
		"scriptlevel",
		"scriptminsize",
		"scriptsizemultiplier",
		"selection",
		"separator",
		"separators",
		"stretchy",
		"subscriptshift",
		"supscriptshift",
		"symmetric",
		"voffset",
		"width",
		"xmlns"
	]);
	var xml = freeze([
		"xlink:href",
		"xml:id",
		"xlink:title",
		"xml:space",
		"xmlns:xlink"
	]);
	var MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
	var ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
	var TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
	var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
	var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
	var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i);
	var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
	var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g);
	var DOCTYPE_NAME = seal(/^html$/i);
	var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
	var EXPRESSIONS = /*#__PURE__*/ Object.freeze({
		__proto__: null,
		ARIA_ATTR,
		ATTR_WHITESPACE,
		CUSTOM_ELEMENT,
		DATA_ATTR,
		DOCTYPE_NAME,
		ERB_EXPR,
		IS_ALLOWED_URI,
		IS_SCRIPT_OR_DATA,
		MUSTACHE_EXPR,
		TMPLIT_EXPR
	});
	var NODE_TYPE = {
		element: 1,
		text: 3,
		progressingInstruction: 7,
		comment: 8,
		document: 9
	};
	var getGlobal = function getGlobal() {
		return typeof window === "undefined" ? null : window;
	};
	/**
	* Creates a no-op policy for internal use only.
	* Don't export this function outside this module!
	* @param trustedTypes The policy factory.
	* @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
	* @return The policy created (or null, if Trusted Types
	* are not supported or creating the policy failed).
	*/
	var _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
		if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") return null;
		let suffix = null;
		const ATTR_NAME = "data-tt-policy-suffix";
		if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) suffix = purifyHostElement.getAttribute(ATTR_NAME);
		const policyName = "dompurify" + (suffix ? "#" + suffix : "");
		try {
			return trustedTypes.createPolicy(policyName, {
				createHTML(html) {
					return html;
				},
				createScriptURL(scriptUrl) {
					return scriptUrl;
				}
			});
		} catch (_) {
			console.warn("TrustedTypes policy " + policyName + " could not be created.");
			return null;
		}
	};
	var _createHooksMap = function _createHooksMap() {
		return {
			afterSanitizeAttributes: [],
			afterSanitizeElements: [],
			afterSanitizeShadowDOM: [],
			beforeSanitizeAttributes: [],
			beforeSanitizeElements: [],
			beforeSanitizeShadowDOM: [],
			uponSanitizeAttribute: [],
			uponSanitizeElement: [],
			uponSanitizeShadowNode: []
		};
	};
	function createDOMPurify() {
		let window = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
		const DOMPurify = (root) => createDOMPurify(root);
		DOMPurify.version = "3.4.0";
		DOMPurify.removed = [];
		if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
			DOMPurify.isSupported = false;
			return DOMPurify;
		}
		let { document } = window;
		const originalDocument = document;
		const currentScript = originalDocument.currentScript;
		const { DocumentFragment, HTMLTemplateElement, Node, Element, NodeFilter, NamedNodeMap = window.NamedNodeMap || window.MozNamedAttrMap, HTMLFormElement, DOMParser, trustedTypes } = window;
		const ElementPrototype = Element.prototype;
		const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
		const remove = lookupGetter(ElementPrototype, "remove");
		const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
		const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
		const getParentNode = lookupGetter(ElementPrototype, "parentNode");
		if (typeof HTMLTemplateElement === "function") {
			const template = document.createElement("template");
			if (template.content && template.content.ownerDocument) document = template.content.ownerDocument;
		}
		let trustedTypesPolicy;
		let emptyHTML = "";
		const { implementation, createNodeIterator, createDocumentFragment, getElementsByTagName } = document;
		const { importNode } = originalDocument;
		let hooks = _createHooksMap();
		/**
		* Expose whether this browser supports running the full DOMPurify.
		*/
		DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
		const { MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR, DATA_ATTR, ARIA_ATTR, IS_SCRIPT_OR_DATA, ATTR_WHITESPACE, CUSTOM_ELEMENT } = EXPRESSIONS;
		let { IS_ALLOWED_URI: IS_ALLOWED_URI$1 } = EXPRESSIONS;
		/**
		* We consider the elements and attributes below to be safe. Ideally
		* don't add any new ones but feel free to remove unwanted ones.
		*/
		let ALLOWED_TAGS = null;
		const DEFAULT_ALLOWED_TAGS = addToSet({}, [
			...html$1,
			...svg$1,
			...svgFilters,
			...mathMl$1,
			...text
		]);
		let ALLOWED_ATTR = null;
		const DEFAULT_ALLOWED_ATTR = addToSet({}, [
			...html,
			...svg,
			...mathMl,
			...xml
		]);
		let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
			tagNameCheck: {
				writable: true,
				configurable: false,
				enumerable: true,
				value: null
			},
			attributeNameCheck: {
				writable: true,
				configurable: false,
				enumerable: true,
				value: null
			},
			allowCustomizedBuiltInElements: {
				writable: true,
				configurable: false,
				enumerable: true,
				value: false
			}
		}));
		let FORBID_TAGS = null;
		let FORBID_ATTR = null;
		const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
			tagCheck: {
				writable: true,
				configurable: false,
				enumerable: true,
				value: null
			},
			attributeCheck: {
				writable: true,
				configurable: false,
				enumerable: true,
				value: null
			}
		}));
		let ALLOW_ARIA_ATTR = true;
		let ALLOW_DATA_ATTR = true;
		let ALLOW_UNKNOWN_PROTOCOLS = false;
		let ALLOW_SELF_CLOSE_IN_ATTR = true;
		let SAFE_FOR_TEMPLATES = false;
		let SAFE_FOR_XML = true;
		let WHOLE_DOCUMENT = false;
		let SET_CONFIG = false;
		let FORCE_BODY = false;
		let RETURN_DOM = false;
		let RETURN_DOM_FRAGMENT = false;
		let RETURN_TRUSTED_TYPE = false;
		let SANITIZE_DOM = true;
		let SANITIZE_NAMED_PROPS = false;
		const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
		let KEEP_CONTENT = true;
		let IN_PLACE = false;
		let USE_PROFILES = {};
		let FORBID_CONTENTS = null;
		const DEFAULT_FORBID_CONTENTS = addToSet({}, [
			"annotation-xml",
			"audio",
			"colgroup",
			"desc",
			"foreignobject",
			"head",
			"iframe",
			"math",
			"mi",
			"mn",
			"mo",
			"ms",
			"mtext",
			"noembed",
			"noframes",
			"noscript",
			"plaintext",
			"script",
			"style",
			"svg",
			"template",
			"thead",
			"title",
			"video",
			"xmp"
		]);
		let DATA_URI_TAGS = null;
		const DEFAULT_DATA_URI_TAGS = addToSet({}, [
			"audio",
			"video",
			"img",
			"source",
			"image",
			"track"
		]);
		let URI_SAFE_ATTRIBUTES = null;
		const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
			"alt",
			"class",
			"for",
			"id",
			"label",
			"name",
			"pattern",
			"placeholder",
			"role",
			"summary",
			"title",
			"value",
			"style",
			"xmlns"
		]);
		const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
		const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
		const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
		let NAMESPACE = HTML_NAMESPACE;
		let IS_EMPTY_INPUT = false;
		let ALLOWED_NAMESPACES = null;
		const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [
			MATHML_NAMESPACE,
			SVG_NAMESPACE,
			HTML_NAMESPACE
		], stringToString);
		let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, [
			"mi",
			"mo",
			"mn",
			"ms",
			"mtext"
		]);
		let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
		const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, [
			"title",
			"style",
			"font",
			"a",
			"script"
		]);
		let PARSER_MEDIA_TYPE = null;
		const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
		const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
		let transformCaseFunc = null;
		let CONFIG = null;
		const formElement = document.createElement("form");
		const isRegexOrFunction = function isRegexOrFunction(testValue) {
			return testValue instanceof RegExp || testValue instanceof Function;
		};
		/**
		* _parseConfig
		*
		* @param cfg optional config literal
		*/
		const _parseConfig = function _parseConfig() {
			let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
			if (CONFIG && CONFIG === cfg) return;
			if (!cfg || typeof cfg !== "object") cfg = {};
			cfg = clone(cfg);
			PARSER_MEDIA_TYPE = SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
			transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
			ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
			ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
			ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
			URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
			DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
			FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
			FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS") ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
			FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
			USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES : false;
			ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
			ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
			ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
			ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
			SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
			SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
			WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
			RETURN_DOM = cfg.RETURN_DOM || false;
			RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
			RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
			FORCE_BODY = cfg.FORCE_BODY || false;
			SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
			SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
			KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
			IN_PLACE = cfg.IN_PLACE || false;
			IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
			NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
			MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
			HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
			CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || create(null);
			if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
			if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
			if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean") CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
			if (SAFE_FOR_TEMPLATES) ALLOW_DATA_ATTR = false;
			if (RETURN_DOM_FRAGMENT) RETURN_DOM = true;
			if (USE_PROFILES) {
				ALLOWED_TAGS = addToSet({}, text);
				ALLOWED_ATTR = create(null);
				if (USE_PROFILES.html === true) {
					addToSet(ALLOWED_TAGS, html$1);
					addToSet(ALLOWED_ATTR, html);
				}
				if (USE_PROFILES.svg === true) {
					addToSet(ALLOWED_TAGS, svg$1);
					addToSet(ALLOWED_ATTR, svg);
					addToSet(ALLOWED_ATTR, xml);
				}
				if (USE_PROFILES.svgFilters === true) {
					addToSet(ALLOWED_TAGS, svgFilters);
					addToSet(ALLOWED_ATTR, svg);
					addToSet(ALLOWED_ATTR, xml);
				}
				if (USE_PROFILES.mathMl === true) {
					addToSet(ALLOWED_TAGS, mathMl$1);
					addToSet(ALLOWED_ATTR, mathMl);
					addToSet(ALLOWED_ATTR, xml);
				}
			}
			EXTRA_ELEMENT_HANDLING.tagCheck = null;
			EXTRA_ELEMENT_HANDLING.attributeCheck = null;
			if (cfg.ADD_TAGS) if (typeof cfg.ADD_TAGS === "function") EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
			else {
				if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) ALLOWED_TAGS = clone(ALLOWED_TAGS);
				addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
			}
			if (cfg.ADD_ATTR) if (typeof cfg.ADD_ATTR === "function") EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
			else {
				if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) ALLOWED_ATTR = clone(ALLOWED_ATTR);
				addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
			}
			if (cfg.ADD_URI_SAFE_ATTR) addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
			if (cfg.FORBID_CONTENTS) {
				if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
				addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
			}
			if (cfg.ADD_FORBID_CONTENTS) {
				if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
				addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
			}
			if (KEEP_CONTENT) ALLOWED_TAGS["#text"] = true;
			if (WHOLE_DOCUMENT) addToSet(ALLOWED_TAGS, [
				"html",
				"head",
				"body"
			]);
			if (ALLOWED_TAGS.table) {
				addToSet(ALLOWED_TAGS, ["tbody"]);
				delete FORBID_TAGS.tbody;
			}
			if (cfg.TRUSTED_TYPES_POLICY) {
				if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
				if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
				trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
				emptyHTML = trustedTypesPolicy.createHTML("");
			} else {
				if (trustedTypesPolicy === void 0) trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
				if (trustedTypesPolicy !== null && typeof emptyHTML === "string") emptyHTML = trustedTypesPolicy.createHTML("");
			}
			if (freeze) freeze(cfg);
			CONFIG = cfg;
		};
		const ALL_SVG_TAGS = addToSet({}, [
			...svg$1,
			...svgFilters,
			...svgDisallowed
		]);
		const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
		/**
		* @param element a DOM element whose namespace is being checked
		* @returns Return false if the element has a
		*  namespace that a spec-compliant parser would never
		*  return. Return true otherwise.
		*/
		const _checkValidNamespace = function _checkValidNamespace(element) {
			let parent = getParentNode(element);
			if (!parent || !parent.tagName) parent = {
				namespaceURI: NAMESPACE,
				tagName: "template"
			};
			const tagName = stringToLowerCase(element.tagName);
			const parentTagName = stringToLowerCase(parent.tagName);
			if (!ALLOWED_NAMESPACES[element.namespaceURI]) return false;
			if (element.namespaceURI === SVG_NAMESPACE) {
				if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "svg";
				if (parent.namespaceURI === MATHML_NAMESPACE) return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
				return Boolean(ALL_SVG_TAGS[tagName]);
			}
			if (element.namespaceURI === MATHML_NAMESPACE) {
				if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "math";
				if (parent.namespaceURI === SVG_NAMESPACE) return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
				return Boolean(ALL_MATHML_TAGS[tagName]);
			}
			if (element.namespaceURI === HTML_NAMESPACE) {
				if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) return false;
				if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) return false;
				return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
			}
			if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) return true;
			return false;
		};
		/**
		* _forceRemove
		*
		* @param node a DOM node
		*/
		const _forceRemove = function _forceRemove(node) {
			arrayPush(DOMPurify.removed, { element: node });
			try {
				getParentNode(node).removeChild(node);
			} catch (_) {
				remove(node);
			}
		};
		/**
		* _removeAttribute
		*
		* @param name an Attribute name
		* @param element a DOM node
		*/
		const _removeAttribute = function _removeAttribute(name, element) {
			try {
				arrayPush(DOMPurify.removed, {
					attribute: element.getAttributeNode(name),
					from: element
				});
			} catch (_) {
				arrayPush(DOMPurify.removed, {
					attribute: null,
					from: element
				});
			}
			element.removeAttribute(name);
			if (name === "is") if (RETURN_DOM || RETURN_DOM_FRAGMENT) try {
				_forceRemove(element);
			} catch (_) {}
			else try {
				element.setAttribute(name, "");
			} catch (_) {}
		};
		/**
		* _initDocument
		*
		* @param dirty - a string of dirty markup
		* @return a DOM, filled with the dirty markup
		*/
		const _initDocument = function _initDocument(dirty) {
			let doc = null;
			let leadingWhitespace = null;
			if (FORCE_BODY) dirty = "<remove></remove>" + dirty;
			else {
				const matches = stringMatch(dirty, /^[\r\n\t ]+/);
				leadingWhitespace = matches && matches[0];
			}
			if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) dirty = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + dirty + "</body></html>";
			const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
			if (NAMESPACE === HTML_NAMESPACE) try {
				doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
			} catch (_) {}
			if (!doc || !doc.documentElement) {
				doc = implementation.createDocument(NAMESPACE, "template", null);
				try {
					doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
				} catch (_) {}
			}
			const body = doc.body || doc.documentElement;
			if (dirty && leadingWhitespace) body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
			if (NAMESPACE === HTML_NAMESPACE) return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
			return WHOLE_DOCUMENT ? doc.documentElement : body;
		};
		/**
		* Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
		*
		* @param root The root element or node to start traversing on.
		* @return The created NodeIterator
		*/
		const _createNodeIterator = function _createNodeIterator(root) {
			return createNodeIterator.call(root.ownerDocument || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
		};
		/**
		* _isClobbered
		*
		* @param element element to check for clobbering attacks
		* @return true if clobbered, false if safe
		*/
		const _isClobbered = function _isClobbered(element) {
			return element instanceof HTMLFormElement && (typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function");
		};
		/**
		* Checks whether the given object is a DOM node.
		*
		* @param value object to check whether it's a DOM node
		* @return true is object is a DOM node
		*/
		const _isNode = function _isNode(value) {
			return typeof Node === "function" && value instanceof Node;
		};
		function _executeHooks(hooks, currentNode, data) {
			arrayForEach(hooks, (hook) => {
				hook.call(DOMPurify, currentNode, data, CONFIG);
			});
		}
		/**
		* _sanitizeElements
		*
		* @protect nodeName
		* @protect textContent
		* @protect removeChild
		* @param currentNode to check for permission to exist
		* @return true if node was killed, false if left alive
		*/
		const _sanitizeElements = function _sanitizeElements(currentNode) {
			let content = null;
			_executeHooks(hooks.beforeSanitizeElements, currentNode, null);
			if (_isClobbered(currentNode)) {
				_forceRemove(currentNode);
				return true;
			}
			const tagName = transformCaseFunc(currentNode.nodeName);
			_executeHooks(hooks.uponSanitizeElement, currentNode, {
				tagName,
				allowedTags: ALLOWED_TAGS
			});
			if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
				_forceRemove(currentNode);
				return true;
			}
			if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === "style" && _isNode(currentNode.firstElementChild)) {
				_forceRemove(currentNode);
				return true;
			}
			if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
				_forceRemove(currentNode);
				return true;
			}
			if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
				_forceRemove(currentNode);
				return true;
			}
			if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
				if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
					if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) return false;
					if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) return false;
				}
				if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
					const parentNode = getParentNode(currentNode) || currentNode.parentNode;
					const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
					if (childNodes && parentNode) {
						const childCount = childNodes.length;
						for (let i = childCount - 1; i >= 0; --i) {
							const childClone = cloneNode(childNodes[i], true);
							childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
							parentNode.insertBefore(childClone, getNextSibling(currentNode));
						}
					}
				}
				_forceRemove(currentNode);
				return true;
			}
			if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
				_forceRemove(currentNode);
				return true;
			}
			if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
				_forceRemove(currentNode);
				return true;
			}
			if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
				content = currentNode.textContent;
				arrayForEach([
					MUSTACHE_EXPR,
					ERB_EXPR,
					TMPLIT_EXPR
				], (expr) => {
					content = stringReplace(content, expr, " ");
				});
				if (currentNode.textContent !== content) {
					arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
					currentNode.textContent = content;
				}
			}
			_executeHooks(hooks.afterSanitizeElements, currentNode, null);
			return false;
		};
		/**
		* _isValidAttribute
		*
		* @param lcTag Lowercase tag name of containing element.
		* @param lcName Lowercase attribute name.
		* @param value Attribute value.
		* @return Returns true if `value` is valid, otherwise false.
		*/
		const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
			if (FORBID_ATTR[lcName]) return false;
			if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document || value in formElement)) return false;
			if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR, lcName));
			else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR, lcName));
			else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag));
			else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) if (_isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value)));
			else return false;
			else if (URI_SAFE_ATTRIBUTES[lcName]);
			else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE, "")));
			else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]);
			else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA, stringReplace(value, ATTR_WHITESPACE, "")));
			else if (value) return false;
			return true;
		};
		/**
		* _isBasicCustomElement
		* checks if at least one dash is included in tagName, and it's not the first char
		* for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
		*
		* @param tagName name of the tag of the node to sanitize
		* @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
		*/
		const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
			return tagName !== "annotation-xml" && stringMatch(tagName, CUSTOM_ELEMENT);
		};
		/**
		* _sanitizeAttributes
		*
		* @protect attributes
		* @protect nodeName
		* @protect removeAttribute
		* @protect setAttribute
		*
		* @param currentNode to sanitize
		*/
		const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
			_executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
			const { attributes } = currentNode;
			if (!attributes || _isClobbered(currentNode)) return;
			const hookEvent = {
				attrName: "",
				attrValue: "",
				keepAttr: true,
				allowedAttributes: ALLOWED_ATTR,
				forceKeepAttr: void 0
			};
			let l = attributes.length;
			while (l--) {
				const { name, namespaceURI, value: attrValue } = attributes[l];
				const lcName = transformCaseFunc(name);
				const initValue = attrValue;
				let value = name === "value" ? initValue : stringTrim(initValue);
				hookEvent.attrName = lcName;
				hookEvent.attrValue = value;
				hookEvent.keepAttr = true;
				hookEvent.forceKeepAttr = void 0;
				_executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
				value = hookEvent.attrValue;
				if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
					_removeAttribute(name, currentNode);
					value = SANITIZE_NAMED_PROPS_PREFIX + value;
				}
				if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
					_removeAttribute(name, currentNode);
					continue;
				}
				if (lcName === "attributename" && stringMatch(value, "href")) {
					_removeAttribute(name, currentNode);
					continue;
				}
				if (hookEvent.forceKeepAttr) continue;
				if (!hookEvent.keepAttr) {
					_removeAttribute(name, currentNode);
					continue;
				}
				if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
					_removeAttribute(name, currentNode);
					continue;
				}
				if (SAFE_FOR_TEMPLATES) arrayForEach([
					MUSTACHE_EXPR,
					ERB_EXPR,
					TMPLIT_EXPR
				], (expr) => {
					value = stringReplace(value, expr, " ");
				});
				const lcTag = transformCaseFunc(currentNode.nodeName);
				if (!_isValidAttribute(lcTag, lcName, value)) {
					_removeAttribute(name, currentNode);
					continue;
				}
				if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") if (namespaceURI);
				else switch (trustedTypes.getAttributeType(lcTag, lcName)) {
					case "TrustedHTML":
						value = trustedTypesPolicy.createHTML(value);
						break;
					case "TrustedScriptURL":
						value = trustedTypesPolicy.createScriptURL(value);
						break;
				}
				if (value !== initValue) try {
					if (namespaceURI) currentNode.setAttributeNS(namespaceURI, name, value);
					else currentNode.setAttribute(name, value);
					if (_isClobbered(currentNode)) _forceRemove(currentNode);
					else arrayPop(DOMPurify.removed);
				} catch (_) {
					_removeAttribute(name, currentNode);
				}
			}
			_executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
		};
		/**
		* _sanitizeShadowDOM
		*
		* @param fragment to iterate over recursively
		*/
		const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
			let shadowNode = null;
			const shadowIterator = _createNodeIterator(fragment);
			_executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
			while (shadowNode = shadowIterator.nextNode()) {
				_executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
				_sanitizeElements(shadowNode);
				_sanitizeAttributes(shadowNode);
				if (shadowNode.content instanceof DocumentFragment) _sanitizeShadowDOM2(shadowNode.content);
			}
			_executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
		};
		DOMPurify.sanitize = function(dirty) {
			let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
			let body = null;
			let importedNode = null;
			let currentNode = null;
			let returnNode = null;
			IS_EMPTY_INPUT = !dirty;
			if (IS_EMPTY_INPUT) dirty = "<!-->";
			if (typeof dirty !== "string" && !_isNode(dirty)) if (typeof dirty.toString === "function") {
				dirty = dirty.toString();
				if (typeof dirty !== "string") throw typeErrorCreate("dirty is not a string, aborting");
			} else throw typeErrorCreate("toString is not a function");
			if (!DOMPurify.isSupported) return dirty;
			if (!SET_CONFIG) _parseConfig(cfg);
			DOMPurify.removed = [];
			if (typeof dirty === "string") IN_PLACE = false;
			if (IN_PLACE) {
				if (dirty.nodeName) {
					const tagName = transformCaseFunc(dirty.nodeName);
					if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
				}
			} else if (dirty instanceof Node) {
				body = _initDocument("<!---->");
				importedNode = body.ownerDocument.importNode(dirty, true);
				if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") body = importedNode;
				else if (importedNode.nodeName === "HTML") body = importedNode;
				else body.appendChild(importedNode);
			} else {
				if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && dirty.indexOf("<") === -1) return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
				body = _initDocument(dirty);
				if (!body) return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
			}
			if (body && FORCE_BODY) _forceRemove(body.firstChild);
			const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
			while (currentNode = nodeIterator.nextNode()) {
				_sanitizeElements(currentNode);
				_sanitizeAttributes(currentNode);
				if (currentNode.content instanceof DocumentFragment) _sanitizeShadowDOM2(currentNode.content);
			}
			if (IN_PLACE) return dirty;
			if (RETURN_DOM) {
				if (SAFE_FOR_TEMPLATES) {
					body.normalize();
					let html = body.innerHTML;
					arrayForEach([
						MUSTACHE_EXPR,
						ERB_EXPR,
						TMPLIT_EXPR
					], (expr) => {
						html = stringReplace(html, expr, " ");
					});
					body.innerHTML = html;
				}
				if (RETURN_DOM_FRAGMENT) {
					returnNode = createDocumentFragment.call(body.ownerDocument);
					while (body.firstChild) returnNode.appendChild(body.firstChild);
				} else returnNode = body;
				if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) returnNode = importNode.call(originalDocument, returnNode, true);
				return returnNode;
			}
			let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
			if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
			if (SAFE_FOR_TEMPLATES) arrayForEach([
				MUSTACHE_EXPR,
				ERB_EXPR,
				TMPLIT_EXPR
			], (expr) => {
				serializedHTML = stringReplace(serializedHTML, expr, " ");
			});
			return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
		};
		DOMPurify.setConfig = function() {
			let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
			_parseConfig(cfg);
			SET_CONFIG = true;
		};
		DOMPurify.clearConfig = function() {
			CONFIG = null;
			SET_CONFIG = false;
		};
		DOMPurify.isValidAttribute = function(tag, attr, value) {
			if (!CONFIG) _parseConfig({});
			const lcTag = transformCaseFunc(tag);
			const lcName = transformCaseFunc(attr);
			return _isValidAttribute(lcTag, lcName, value);
		};
		DOMPurify.addHook = function(entryPoint, hookFunction) {
			if (typeof hookFunction !== "function") return;
			arrayPush(hooks[entryPoint], hookFunction);
		};
		DOMPurify.removeHook = function(entryPoint, hookFunction) {
			if (hookFunction !== void 0) {
				const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
				return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
			}
			return arrayPop(hooks[entryPoint]);
		};
		DOMPurify.removeHooks = function(entryPoint) {
			hooks[entryPoint] = [];
		};
		DOMPurify.removeAllHooks = function() {
			hooks = _createHooksMap();
		};
		return DOMPurify;
	}
	var purify = createDOMPurify();
	//#endregion
	//#region src/components/markdownConverter.ts
	var defaultMarkdownConverter = { makeHtml(markdownText) {
		return purify.sanitize(g.parse(markdownText, { async: false }));
	} };
	//#endregion
	exports.LanguageProvider = class LanguageProvider {
		constructor(worker, options) {
			this.$sessionLanguageProviders = {};
			this.editors = [];
			this.$urisToSessionsIds = {};
			this.$lightBulbWidgets = {};
			this.textMarkerAdapter = createTextMarkerAdapter();
			this.$editorEventHandlers = {};
			this.$editorOriginalState = {};
			this.registerSession = (session, editor, config) => {
				if (!this.$sessionLanguageProviders[session["id"]]) this.$sessionLanguageProviders[session["id"]] = new SessionLanguageProvider(this, session, editor, this.$messageController, config);
				if (config) this.$sessionLanguageProviders[session["id"]].setFilePath(config.filePath, config.joinWorkspaceURI);
			};
			this.format = () => {
				if (!this.options.functionality.format) return;
				if (this.activeEditor) {
					let sessionLanguageProvider = this.$getSessionLanguageProvider(this.activeEditor.session);
					sessionLanguageProvider.$sendDeltaQueue(sessionLanguageProvider.format);
				}
			};
			this.$messageController = new MessageController(worker, this);
			this.setProviderOptions(options);
			this.$signatureTooltip = new SignatureTooltip(this);
		}
		/**
		*  Creates LanguageProvider using our transport protocol with the ability to register different services on the same
		*  webworker
		* @param {Worker} worker
		* @param {ProviderOptions} options
		*/
		static create(worker, options) {
			return new LanguageProvider(worker, options);
		}
		static fromCdn(source, options, includeDefaultLinters) {
			let worker;
			if (typeof source === "string") {
				if (source == "" || !/^http(s)?:/.test(source)) throw "Url is not valid";
				if (source[source.length - 1] == "/") source = source.substring(0, source.length - 1);
				worker = createWorker(source, includeDefaultLinters);
			} else {
				if (source.includeDefaultLinters == void 0) source.includeDefaultLinters = true;
				worker = createWorker({
					services: source.services,
					serviceManagerCdn: source.serviceManagerCdn
				}, source.includeDefaultLinters ?? includeDefaultLinters);
			}
			return new LanguageProvider(worker, options);
		}
		setProviderOptions(options) {
			const defaultFunctionalities = {
				hover: true,
				completion: { overwriteCompleters: true },
				completionResolve: true,
				format: true,
				documentHighlights: true,
				signatureHelp: true,
				semanticTokens: false,
				codeActions: true,
				inlineCompletion: false,
				showUnusedDeclarations: true
			};
			this.options = options ?? {};
			this.options.functionality = typeof this.options.functionality === "object" ? this.options.functionality : {};
			Object.entries(defaultFunctionalities).forEach(([key, value]) => {
				if (this.options.functionality[key] === void 0) this.options.functionality[key] = value;
			});
			this.options.markdownConverter ||= defaultMarkdownConverter;
			if (options?.workspacePath) this.workspaceUri = convertToUri(options.workspacePath);
			if (this.options.functionality.inlineCompletion) this.checkInlineCompletionAdapter(() => {
				if (!this.options.aceComponents?.InlineAutocomplete || !this.options.aceComponents?.CommandBarTooltip || !this.options.aceComponents?.CompletionProvider) throw new Error("Inline completion requires the InlineAutocomplete, CompletionProvider and CommandBarTooltip to be defined");
				this.completerAdapter = createInlineCompleterAdapter(this.options.aceComponents.InlineAutocomplete, this.options.aceComponents.CommandBarTooltip, this.options.aceComponents.CompletionProvider);
			});
		}
		checkInlineCompletionAdapter(method) {
			try {
				method();
			} catch (e) {
				console.error(`Inline completion disabled: Incompatible Ace implementation: ${e.message}`);
				if (this.options?.functionality) this.options.functionality.inlineCompletion = false;
			}
		}
		/**
		* Sets the file path for the given Ace edit session. Optionally allows the file path to
		* be joined with the workspace URI.
		*
		* @param session The Ace edit session to update with the file path.
		* @param config config to set
		*/
		setSessionFilePath(session, config) {
			this.$getSessionLanguageProvider(session)?.setFilePath(config.filePath, config.joinWorkspaceURI);
		}
		/**
		* Sets the Language Server Protocol (LSP) configuration for the given session.
		*
		* @param session - The editor session to which the LSP configuration will be applied.
		* @param config - The LSP configuration to set for the session.
		* @return The updated editor session with the applied LSP configuration.
		*/
		setSessionLspConfig(session, config) {
			session.lspConfig = config;
			return session;
		}
		$getSessionLanguageProvider(session) {
			return this.$sessionLanguageProviders[session["id"]];
		}
		$getFileName(session) {
			return this.$getSessionLanguageProvider(session).comboDocumentIdentifier;
		}
		/**
		* Registers an Ace editor instance along with the session's configuration settings.
		*
		* @param editor - The Ace editor instance to be registered.
		* @param [config] - Configuration options for the session.
		*/
		registerEditor(editor, config) {
			if (!this.editors.includes(editor)) this.$registerEditor(editor);
			config = config ?? editor.session.lspConfig;
			this.registerSession(editor.session, editor, config);
		}
		/**
		* Unregisters an Ace editor instance, removing all event listeners, completers, tooltips,
		* and cleaning up associated resources. This is the counterpart to registerEditor.
		*
		* @param editor - The Ace editor instance to be unregistered.
		* @param cleanupSession - Optional flag to also dispose the current session. When true,
		*                         calls closeDocument on the editor's session, cleaning up all
		*                         session-related resources. Default: false.
		*/
		unregisterEditor(editor, cleanupSession = false) {
			if (this.editors.includes(editor)) this.$unregisterEditor(editor, cleanupSession);
		}
		/**
		* Sets a callback function that will be triggered with an array of code actions grouped by service.
		*
		* @param {function} callback - A function that receives an array of code actions, categorized by service, as its argument.
		*/
		setCodeActionCallback(callback) {
			this.codeActionCallback = callback;
		}
		executeCommand(command, serviceName, args, callback) {
			this.$messageController.executeCommand(serviceName, command, args, callback);
		}
		applyEdit(workspaceEdit, serviceName, callback) {
			if (workspaceEdit.changes) {
				for (let uri in workspaceEdit.changes) if (!this.$urisToSessionsIds[uri]) {
					callback && callback({
						applied: false,
						failureReason: "No session found for uri " + uri
					}, serviceName);
					return;
				}
				for (let uri in workspaceEdit.changes) {
					let sessionId = this.$urisToSessionsIds[uri];
					this.$sessionLanguageProviders[sessionId].applyEdits(workspaceEdit.changes[uri]);
				}
				callback && callback({ applied: true }, serviceName);
			}
			if (workspaceEdit.documentChanges) {
				for (let change of workspaceEdit.documentChanges) {
					if ("kind" in change) return;
					if ("textDocument" in change) {
						let uri = change.textDocument.uri;
						if (!this.$urisToSessionsIds[uri]) {
							callback && callback({
								applied: false,
								failureReason: "No session found for uri " + uri
							}, serviceName);
							return;
						}
					}
				}
				for (let change of workspaceEdit.documentChanges) if ("textDocument" in change) {
					let sessionId = this.$urisToSessionsIds[change.textDocument.uri];
					this.$sessionLanguageProviders[sessionId].applyEdits(change.edits);
				}
				callback && callback({ applied: true }, serviceName);
			}
		}
		$registerEditor(editor) {
			this.editors.push(editor);
			AceRange.getConstructor(editor);
			AceVirtualRenderer.getConstructor(editor);
			AceEditor.getConstructor(editor);
			editor.setOption("useWorker", false);
			this.$editorEventHandlers[editor.id] = {};
			if (!this.options.manualSessionControl) {
				const changeSessionHandler = ({ session }) => this.registerSession(session, editor, session.lspConfig);
				this.$editorEventHandlers[editor.id].changeSession = changeSessionHandler;
				editor.on("changeSession", changeSessionHandler);
			}
			if (this.options.functionality.completion || this.options.functionality.inlineCompletion) this.$registerCompleters(editor);
			if (this.options.functionality.semanticTokens || this.options.functionality.showUnusedDeclarations) this.textMarkerAdapter.enableTextMarkers(editor);
			this.activeEditor ??= editor;
			const focusHandler = () => {
				this.activeEditor = editor;
			};
			this.$editorEventHandlers[editor.id].focus = focusHandler;
			editor.on("focus", focusHandler);
			if (this.options.functionality.documentHighlights) {
				var $timer;
				const changeSelectionForHighlights = () => {
					if (!$timer) $timer = setTimeout(() => {
						let sessionLanguageProvider = this.$getSessionLanguageProvider(editor.session);
						if (!sessionLanguageProvider) {
							$timer = void 0;
							return;
						}
						let cursor = editor.getCursorPosition();
						this.$messageController.findDocumentHighlights(this.$getFileName(editor.session), fromPoint(cursor), sessionLanguageProvider.$applyDocumentHighlight);
						$timer = void 0;
					}, 50);
				};
				this.$editorEventHandlers[editor.id].changeSelectionForHighlights = changeSelectionForHighlights;
				editor.on("changeSelection", changeSelectionForHighlights);
			}
			if (this.options.functionality.codeActions) this.$provideCodeActions(editor);
			if (this.options.functionality.hover) {
				if (!this.$hoverTooltip) this.$hoverTooltip = new HoverTooltip();
				this.$initHoverTooltip(editor);
			}
			if (this.options.functionality.signatureHelp) this.$signatureTooltip.registerEditor(editor);
			this.setStyles(editor);
		}
		$unregisterEditor(editor, cleanupSession = false) {
			const editorIndex = this.editors.indexOf(editor);
			if (editorIndex > -1) this.editors.splice(editorIndex, 1);
			const handlers = this.$editorEventHandlers[editor.id];
			if (handlers) {
				if (handlers.changeSession) editor.off("changeSession", handlers.changeSession);
				if (handlers.focus) editor.off("focus", handlers.focus);
				if (handlers.changeSelectionForHighlights) editor.off("changeSelection", handlers.changeSelectionForHighlights);
				if (handlers.changeSelectionForCodeActions) editor.off("changeSelection", handlers.changeSelectionForCodeActions);
				if (handlers.afterExec) editor.commands.off("afterExec", handlers.afterExec);
				delete this.$editorEventHandlers[editor.id];
			}
			const originalState = this.$editorOriginalState[editor.id];
			if (originalState) {
				if (this.options.functionality?.completion && originalState.completers !== void 0) editor.completers = originalState.completers;
				if (this.options.functionality?.inlineCompletion && originalState.inlineCompleters !== void 0) editor.inlineCompleters = originalState.inlineCompleters;
				if (this.options.functionality?.inlineCompletion) if (originalState.inlineAutocompleteCommand) editor.commands.addCommand(originalState.inlineAutocompleteCommand);
				else try {
					editor.commands.removeCommand("startInlineAutocomplete");
				} catch (e) {}
				delete this.$editorOriginalState[editor.id];
			}
			if (this.options.functionality?.signatureHelp) this.$signatureTooltip.unregisterEditor(editor);
			if (this.options.functionality?.hover && this.$hoverTooltip) this.$hoverTooltip.removeFromEditor(editor);
			if (this.options.functionality?.codeActions) {
				const lightBulb = this.$lightBulbWidgets[editor.id];
				if (lightBulb) {
					lightBulb.dispose();
					delete this.$lightBulbWidgets[editor.id];
				}
			}
			if (this.options.functionality?.semanticTokens || this.options.functionality?.showUnusedDeclarations) this.textMarkerAdapter.disableTextMarkers(editor);
			editor.setOption("useWorker", true);
			if (this.activeEditor === editor) this.activeEditor = this.editors.length > 0 ? this.editors[0] : null;
			if (cleanupSession && editor.session) this.closeDocument(editor.session);
		}
		$provideCodeActions(editor) {
			const lightBulb = new LightbulbWidget(editor);
			this.$lightBulbWidgets[editor.id] = lightBulb;
			lightBulb.setExecuteActionCallback((action, serviceName) => {
				for (let id in this.$lightBulbWidgets) this.$lightBulbWidgets[id].hideAll();
				if (typeof action.command === "string") this.executeCommand(action.command, serviceName, action["arguments"]);
				else if (action.command) this.executeCommand(action.command.command, serviceName, action.command.arguments);
				else if ("edit" in action) this.applyEdit(action.edit, serviceName);
			});
			var actionTimer;
			const changeSelectionForCodeActions = () => {
				if (!actionTimer) actionTimer = setTimeout(() => {
					if (!this.$getSessionLanguageProvider(editor.session)) {
						actionTimer = void 0;
						return;
					}
					let selection = editor.getSelection().getRange();
					let cursor = editor.getCursorPosition();
					let diagnostics = fromAnnotations(editor.session.getAnnotations().filter((el) => el.row === cursor.row));
					this.$messageController.getCodeActions(this.$getFileName(editor.session), fromRange(selection), { diagnostics }, (codeActions) => {
						lightBulb.setCodeActions(codeActions);
						lightBulb.showLightbulb();
					});
					actionTimer = void 0;
				}, 500);
			};
			this.$editorEventHandlers[editor.id].changeSelectionForCodeActions = changeSelectionForCodeActions;
			editor.on("changeSelection", changeSelectionForCodeActions);
		}
		$initHoverTooltip(editor) {
			const Range = editor.getSelectionRange().constructor;
			this.$hoverTooltip.setDataProvider((e, editor) => {
				const session = editor.session;
				const docPos = e.getDocumentPosition();
				const annotations = session.getAnnotations() || [];
				const quickFixes = this.options.functionality?.codeActions ? extractDiagnosticQuickFixesAtPosition(annotations, docPos) : [];
				this.doHover(session, docPos, (hover) => {
					const hoverModel = resolveHoverModel({
						hover,
						errorMarkers: this.$getSessionLanguageProvider(session).state?.diagnosticMarkers?.getMarkersAtPosition(docPos) ?? [],
						quickFixes,
						docPos,
						rangeFromPoints: (start, end) => Range.fromPoints(start, end),
						getWordRange: (row, column) => session.getWordRange(row, column),
						lspRangeToAceRange: (range) => ({
							start: {
								row: range.start.line,
								column: range.start.character
							},
							end: {
								row: range.end.line,
								column: range.end.character
							}
						}),
						getHoverHtml: (hover) => this.getTooltipText(hover)
					});
					if (!hoverModel) return;
					const domNode = createHoverViewNode(hoverModel, (entry) => {
						const documentUri = this.$getFileName(session).documentUri;
						this.applyEdit({ changes: { [documentUri]: [{
							range: entry.fix.range,
							newText: entry.fix.newText
						}] } }, entry.provider);
						this.$hoverTooltip.hide();
					});
					this.$hoverTooltip.showForRange(editor, hoverModel.range, domNode, e);
				});
			});
			this.$hoverTooltip.addToEditor(editor);
		}
		setStyles(editor) {
			if (!this.stylesEmbedded) {
				setStyles(editor);
				this.stylesEmbedded = true;
			}
		}
		/**
		* Configures global options that apply to all documents handled by the specified language service.
		*
		* Global options serve as default settings for all documents processed by a service when no
		* document-specific options are provided. These options affect language service behavior across
		* the entire workspace, including validation rules, formatting preferences, completion settings,
		* and service-specific configurations.
		*
		* @param serviceName - The identifier of the language service to configure. Must be a valid
		*                      service name from the supported services (e.g., 'typescript', 'json', 'html').
		* @param options - The global configuration options specific to the language service. The structure
		*                  varies by service type.
		* @param {boolean} [merge=false] - Indicates whether to merge the provided options with the existing options.
		*                  Defaults to false.
		*/
		setGlobalOptions(serviceName, options, merge = false) {
			this.$messageController.setGlobalOptions(serviceName, options, merge);
		}
		/**
		* Sets the workspace URI for the language provider.
		*
		* If the provided URI is the same as the current workspace URI, no action is taken.
		* Otherwise, the workspace URI is updated and the message controller is notified.
		*
		* Not all servers support changing of workspace URI.
		*
		* @param workspaceUri - The new workspace URI. Could be simple path, not URI itself.
		*/
		changeWorkspaceFolder(workspaceUri) {
			if (workspaceUri === this.workspaceUri) return;
			this.workspaceUri = convertToUri(workspaceUri);
			this.$messageController.setWorkspace(this.workspaceUri);
		}
		/**
		* Sets the options for a specified editor session.
		*
		* @param session - The Ace editor session to configure.
		* @param options - The configuration options to be applied to the session.
		* @deprecated Use `setDocumentOptions` instead. This method will be removed in the future.
		*/
		setSessionOptions(session, options) {
			this.$getSessionLanguageProvider(session).setOptions(options);
		}
		/**
		* Sets configuration options for a document associated with the specified editor session.
		*
		* @param session - The Ace editor session representing the document to configure.
		* @param options - The service options to apply. The exact shape depends on the language services
		*                  active for this session (e.g. JSON schema settings).
		*/
		setDocumentOptions(session, options) {
			this.$getSessionLanguageProvider(session).setOptions(options);
		}
		/**
		* Configures the specified features for a given service.
		*
		* @param {SupportedServices} serviceName - The name of the service for which features are being configured.
		* @param {ServiceFeatures} features - The features to be configured for the given service.
		* @return {void} Does not return a value.
		*/
		configureServiceFeatures(serviceName, features) {
			this.$messageController.configureFeatures(serviceName, features);
		}
		doHover(session, position, callback) {
			this.$messageController.doHover(this.$getFileName(session), fromPoint(position), (hover) => callback && callback(toTooltip(hover)));
		}
		provideSignatureHelp(session, position, callback) {
			if (!this.$getSessionLanguageProvider(session)) return;
			this.$messageController.provideSignatureHelp(this.$getFileName(session), fromPoint(position), (signatureHelp) => callback && callback(fromSignatureHelp(signatureHelp)));
		}
		getTooltipText(hover) {
			return hover.content.type === "markdown" ? CommonConverter.cleanHtml(this.options.markdownConverter.makeHtml(hover.content.text)) : hover.content.text;
		}
		getSemanticTokens() {
			if (!this.options.functionality.semanticTokens) return;
			if (this.activeEditor) this.$getSessionLanguageProvider(this.activeEditor.session).getSemanticTokens();
		}
		doComplete(editor, session, callback) {
			let cursor = editor.getCursorPosition();
			this.$messageController.doComplete(this.$getFileName(session), fromPoint(cursor), (completions) => completions && callback(toCompletions(completions)));
		}
		doInlineComplete(editor, session, callback) {
			let cursor = editor.getCursorPosition();
			this.$messageController.doInlineComplete(this.$getFileName(session), fromPoint(cursor), (completions) => completions && callback(toInlineCompletions(completions)));
		}
		doResolve(item, callback) {
			this.$messageController.doResolve(item["fileName"], toCompletionItem(item), callback);
		}
		$registerCompleters(editor) {
			let completer, inlineCompleter;
			if (!this.options.functionality?.completion && !this.options.functionality?.inlineCompletion) return;
			this.$editorOriginalState[editor.id] = {};
			if (this.options.functionality?.completion) {
				this.$editorOriginalState[editor.id].completers = editor.completers ? [...editor.completers] : [];
				if (this.options.functionality.completion.overwriteCompleters) editor.completers = [];
			}
			if (this.options.functionality?.inlineCompletion) {
				this.$editorOriginalState[editor.id].inlineCompleters = editor.inlineCompleters ? [...editor.inlineCompleters] : [];
				if (this.options.functionality.inlineCompletion.overwriteCompleters) editor.inlineCompleters = [];
			}
			if (this.options.functionality.completion) {
				completer = {
					getCompletions: async (editor, session, pos, prefix, callback) => {
						this.$getSessionLanguageProvider(session).$sendDeltaQueue(() => {
							const completionCallback = (completions) => {
								let popup = (editor?.completer)?.getPopup();
								if (popup) popupManager.addAcePopup(popup);
								let fileName = this.$getFileName(session);
								if (!completions) return;
								completions.forEach((item) => {
									item.completerId = completer.id;
									item["fileName"] = fileName;
								});
								callback(null, CommonConverter.normalizeRanges(completions));
							};
							this.doComplete(editor, session, completionCallback);
						});
					},
					getDocTooltip: (item) => {
						if (this.options.functionality.completionResolve && !item["isResolved"] && item.completerId === completer.id) this.doResolve(item, (completionItem) => {
							item["isResolved"] = true;
							if (!completionItem) return;
							let completion = toResolvedCompletion(item, completionItem);
							item.docText = completion.docText;
							if (completion.docHTML) item.docHTML = completion.docHTML;
							else if (completion["docMarkdown"]) item.docHTML = CommonConverter.cleanHtml(this.options.markdownConverter.makeHtml(completion["docMarkdown"]));
							if (editor["completer"]) editor["completer"].updateDocTooltip();
						});
						return item;
					},
					id: "lspCompleters"
				};
				editor.completers.push(completer);
			}
			if (this.options?.functionality?.inlineCompletion) this.checkInlineCompletionAdapter(() => {
				if (this.completerAdapter) {
					editor.inlineCompleters ??= [];
					this.completerAdapter.validateAceInlineCompleterWithEditor(editor);
					this.inlineCompleter = this.completerAdapter.InlineCompleter;
					this.doLiveAutocomplete = this.completerAdapter.doLiveAutocomplete;
				}
			});
			if (this.options.functionality?.inlineCompletion) {
				const existingCommand = editor.commands.commands["startInlineAutocomplete"];
				this.$editorOriginalState[editor.id].inlineAutocompleteCommand = existingCommand || null;
				editor.commands.addCommand({
					name: "startInlineAutocomplete",
					exec: (editor, options) => {
						(this.inlineCompleter?.for(editor)).show(options);
					},
					bindKey: {
						win: "Alt-C",
						mac: "Option-C"
					}
				});
				this.$editorEventHandlers[editor.id].afterExec = this.doLiveAutocomplete;
				editor.commands.on("afterExec", this.doLiveAutocomplete);
				inlineCompleter = {
					getCompletions: async (editor, session, pos, prefix, callback) => {
						this.$getSessionLanguageProvider(session).$sendDeltaQueue(() => {
							const completionCallback = (completions) => {
								let fileName = this.$getFileName(session);
								if (!completions) return;
								completions.forEach((item) => {
									item.completerId = completer.id;
									item["fileName"] = fileName;
								});
								callback(null, CommonConverter.normalizeRanges(completions));
							};
							this.doInlineComplete(editor, session, completionCallback);
						});
					},
					id: "lspInlineCompleters"
				};
				editor.inlineCompleters.push(inlineCompleter);
			}
		}
		closeConnection() {
			this.$messageController.closeConnection(() => {
				this.$messageController.$worker.terminate();
			});
		}
		/**
		* Removes document from all linked services by session id and cleans up all associated resources.
		* This includes removing event listeners, clearing marker groups, annotations, and notifying the server.
		* @param session - The Ace EditSession to close
		* @param [callback] - Optional callback to execute after the document is closed
		*/
		closeDocument(session, callback) {
			let sessionProvider = this.$getSessionLanguageProvider(session);
			if (sessionProvider) {
				sessionProvider.dispose(callback);
				delete this.$sessionLanguageProviders[session["id"]];
			}
		}
		/**
		* Sends a request to the message controller.
		* @param serviceName - The name of the service/server to send the request to.
		* @param method - The method name for the request.
		* @param params - The parameters for the request.
		* @param callback - An optional callback function that will be called with the result of the request.
		*/
		sendRequest(serviceName, method, params, callback) {
			this.$messageController.sendRequest(serviceName, method, params, callback);
		}
		showDocument(params, serviceName, callback) {
			try {
				window.open(params.uri, "_blank");
				callback && callback({ success: true }, serviceName);
			} catch (e) {
				callback && callback({
					success: false,
					error: e
				}, serviceName);
			}
		}
	};
	exports.MessageController = MessageController;
});
