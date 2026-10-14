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
		AnnotatedTextEdit: () => AnnotatedTextEdit$1,
		ChangeAnnotation: () => ChangeAnnotation$1,
		ChangeAnnotationIdentifier: () => ChangeAnnotationIdentifier$1,
		CodeAction: () => CodeAction$1,
		CodeActionContext: () => CodeActionContext$1,
		CodeActionKind: () => CodeActionKind$1,
		CodeActionTriggerKind: () => CodeActionTriggerKind$1,
		CodeDescription: () => CodeDescription$1,
		CodeLens: () => CodeLens$1,
		Color: () => Color$1,
		ColorInformation: () => ColorInformation$1,
		ColorPresentation: () => ColorPresentation$1,
		Command: () => Command$1,
		CompletionItem: () => CompletionItem$1,
		CompletionItemKind: () => CompletionItemKind$3,
		CompletionItemLabelDetails: () => CompletionItemLabelDetails$1,
		CompletionItemTag: () => CompletionItemTag$1,
		CompletionList: () => CompletionList$1,
		CreateFile: () => CreateFile$1,
		DeleteFile: () => DeleteFile$1,
		Diagnostic: () => Diagnostic$1,
		DiagnosticRelatedInformation: () => DiagnosticRelatedInformation$1,
		DiagnosticSeverity: () => DiagnosticSeverity$2,
		DiagnosticTag: () => DiagnosticTag$1,
		DocumentHighlight: () => DocumentHighlight$1,
		DocumentHighlightKind: () => DocumentHighlightKind$1,
		DocumentLink: () => DocumentLink$1,
		DocumentSymbol: () => DocumentSymbol$1,
		DocumentUri: () => DocumentUri$1,
		EOL: () => EOL,
		FoldingRange: () => FoldingRange$1,
		FoldingRangeKind: () => FoldingRangeKind$1,
		FormattingOptions: () => FormattingOptions$1,
		Hover: () => Hover$1,
		InlayHint: () => InlayHint$1,
		InlayHintKind: () => InlayHintKind$1,
		InlayHintLabelPart: () => InlayHintLabelPart$1,
		InlineCompletionContext: () => InlineCompletionContext$1,
		InlineCompletionItem: () => InlineCompletionItem$1,
		InlineCompletionList: () => InlineCompletionList$1,
		InlineCompletionTriggerKind: () => InlineCompletionTriggerKind$1,
		InlineValueContext: () => InlineValueContext$1,
		InlineValueEvaluatableExpression: () => InlineValueEvaluatableExpression$1,
		InlineValueText: () => InlineValueText$1,
		InlineValueVariableLookup: () => InlineValueVariableLookup$1,
		InsertReplaceEdit: () => InsertReplaceEdit$1,
		InsertTextFormat: () => InsertTextFormat$2,
		InsertTextMode: () => InsertTextMode$1,
		Location: () => Location$1,
		LocationLink: () => LocationLink$1,
		MarkedString: () => MarkedString$2,
		MarkupContent: () => MarkupContent$2,
		MarkupKind: () => MarkupKind$1,
		OptionalVersionedTextDocumentIdentifier: () => OptionalVersionedTextDocumentIdentifier$1,
		ParameterInformation: () => ParameterInformation$1,
		Position: () => Position$1,
		Range: () => Range$1,
		RenameFile: () => RenameFile$1,
		SelectedCompletionInfo: () => SelectedCompletionInfo$1,
		SelectionRange: () => SelectionRange$1,
		SemanticTokenModifiers: () => SemanticTokenModifiers$1,
		SemanticTokenTypes: () => SemanticTokenTypes$1,
		SemanticTokens: () => SemanticTokens$1,
		SignatureInformation: () => SignatureInformation$1,
		StringValue: () => StringValue$1,
		SymbolInformation: () => SymbolInformation$1,
		SymbolKind: () => SymbolKind$1,
		SymbolTag: () => SymbolTag$1,
		TextDocument: () => TextDocument$2,
		TextDocumentEdit: () => TextDocumentEdit$1,
		TextDocumentIdentifier: () => TextDocumentIdentifier$1,
		TextDocumentItem: () => TextDocumentItem$1,
		TextEdit: () => TextEdit$1,
		URI: () => URI$1,
		VersionedTextDocumentIdentifier: () => VersionedTextDocumentIdentifier$1,
		WorkspaceChange: () => WorkspaceChange,
		WorkspaceEdit: () => WorkspaceEdit$1,
		WorkspaceFolder: () => WorkspaceFolder$1,
		WorkspaceSymbol: () => WorkspaceSymbol$1,
		integer: () => integer$1,
		uinteger: () => uinteger$1
	});
	var DocumentUri$1, URI$1, integer$1, uinteger$1, Position$1, Range$1, Location$1, LocationLink$1, Color$1, ColorInformation$1, ColorPresentation$1, FoldingRangeKind$1, FoldingRange$1, DiagnosticRelatedInformation$1, DiagnosticSeverity$2, DiagnosticTag$1, CodeDescription$1, Diagnostic$1, Command$1, TextEdit$1, ChangeAnnotation$1, ChangeAnnotationIdentifier$1, AnnotatedTextEdit$1, TextDocumentEdit$1, CreateFile$1, RenameFile$1, DeleteFile$1, WorkspaceEdit$1, TextEditChangeImpl, ChangeAnnotations, WorkspaceChange, TextDocumentIdentifier$1, VersionedTextDocumentIdentifier$1, OptionalVersionedTextDocumentIdentifier$1, TextDocumentItem$1, MarkupKind$1, MarkupContent$2, CompletionItemKind$3, InsertTextFormat$2, CompletionItemTag$1, InsertReplaceEdit$1, InsertTextMode$1, CompletionItemLabelDetails$1, CompletionItem$1, CompletionList$1, MarkedString$2, Hover$1, ParameterInformation$1, SignatureInformation$1, DocumentHighlightKind$1, DocumentHighlight$1, SymbolKind$1, SymbolTag$1, SymbolInformation$1, WorkspaceSymbol$1, DocumentSymbol$1, CodeActionKind$1, CodeActionTriggerKind$1, CodeActionContext$1, CodeAction$1, CodeLens$1, FormattingOptions$1, DocumentLink$1, SelectionRange$1, SemanticTokenTypes$1, SemanticTokenModifiers$1, SemanticTokens$1, InlineValueText$1, InlineValueVariableLookup$1, InlineValueEvaluatableExpression$1, InlineValueContext$1, InlayHintKind$1, InlayHintLabelPart$1, InlayHint$1, StringValue$1, InlineCompletionItem$1, InlineCompletionList$1, InlineCompletionTriggerKind$1, SelectedCompletionInfo$1, InlineCompletionContext$1, WorkspaceFolder$1, EOL, TextDocument$2, FullTextDocument$2, Is$1;
	var init_main = __esmMin((() => {
		(function(DocumentUri) {
			function is(value) {
				return typeof value === "string";
			}
			DocumentUri.is = is;
		})(DocumentUri$1 || (DocumentUri$1 = {}));
		(function(URI) {
			function is(value) {
				return typeof value === "string";
			}
			URI.is = is;
		})(URI$1 || (URI$1 = {}));
		(function(integer) {
			integer.MIN_VALUE = -2147483648;
			integer.MAX_VALUE = 2147483647;
			function is(value) {
				return typeof value === "number" && integer.MIN_VALUE <= value && value <= integer.MAX_VALUE;
			}
			integer.is = is;
		})(integer$1 || (integer$1 = {}));
		(function(uinteger) {
			uinteger.MIN_VALUE = 0;
			uinteger.MAX_VALUE = 2147483647;
			function is(value) {
				return typeof value === "number" && uinteger.MIN_VALUE <= value && value <= uinteger.MAX_VALUE;
			}
			uinteger.is = is;
		})(uinteger$1 || (uinteger$1 = {}));
		(function(Position) {
			/**
			* Creates a new Position literal from the given line and character.
			* @param line The position's line.
			* @param character The position's character.
			*/
			function create(line, character) {
				if (line === Number.MAX_VALUE) line = uinteger$1.MAX_VALUE;
				if (character === Number.MAX_VALUE) character = uinteger$1.MAX_VALUE;
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
				return Is$1.objectLiteral(candidate) && Is$1.uinteger(candidate.line) && Is$1.uinteger(candidate.character);
			}
			Position.is = is;
		})(Position$1 || (Position$1 = {}));
		(function(Range) {
			function create(one, two, three, four) {
				if (Is$1.uinteger(one) && Is$1.uinteger(two) && Is$1.uinteger(three) && Is$1.uinteger(four)) return {
					start: Position$1.create(one, two),
					end: Position$1.create(three, four)
				};
				else if (Position$1.is(one) && Position$1.is(two)) return {
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
				return Is$1.objectLiteral(candidate) && Position$1.is(candidate.start) && Position$1.is(candidate.end);
			}
			Range.is = is;
		})(Range$1 || (Range$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Range$1.is(candidate.range) && (Is$1.string(candidate.uri) || Is$1.undefined(candidate.uri));
			}
			Location.is = is;
		})(Location$1 || (Location$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Range$1.is(candidate.targetRange) && Is$1.string(candidate.targetUri) && Range$1.is(candidate.targetSelectionRange) && (Range$1.is(candidate.originSelectionRange) || Is$1.undefined(candidate.originSelectionRange));
			}
			LocationLink.is = is;
		})(LocationLink$1 || (LocationLink$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Is$1.numberRange(candidate.red, 0, 1) && Is$1.numberRange(candidate.green, 0, 1) && Is$1.numberRange(candidate.blue, 0, 1) && Is$1.numberRange(candidate.alpha, 0, 1);
			}
			Color.is = is;
		})(Color$1 || (Color$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Range$1.is(candidate.range) && Color$1.is(candidate.color);
			}
			ColorInformation.is = is;
		})(ColorInformation$1 || (ColorInformation$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Is$1.string(candidate.label) && (Is$1.undefined(candidate.textEdit) || TextEdit$1.is(candidate)) && (Is$1.undefined(candidate.additionalTextEdits) || Is$1.typedArray(candidate.additionalTextEdits, TextEdit$1.is));
			}
			ColorPresentation.is = is;
		})(ColorPresentation$1 || (ColorPresentation$1 = {}));
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
		})(FoldingRangeKind$1 || (FoldingRangeKind$1 = {}));
		(function(FoldingRange) {
			/**
			* Creates a new FoldingRange literal.
			*/
			function create(startLine, endLine, startCharacter, endCharacter, kind, collapsedText) {
				const result = {
					startLine,
					endLine
				};
				if (Is$1.defined(startCharacter)) result.startCharacter = startCharacter;
				if (Is$1.defined(endCharacter)) result.endCharacter = endCharacter;
				if (Is$1.defined(kind)) result.kind = kind;
				if (Is$1.defined(collapsedText)) result.collapsedText = collapsedText;
				return result;
			}
			FoldingRange.create = create;
			/**
			* Checks whether the given literal conforms to the {@link FoldingRange} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is$1.objectLiteral(candidate) && Is$1.uinteger(candidate.startLine) && Is$1.uinteger(candidate.startLine) && (Is$1.undefined(candidate.startCharacter) || Is$1.uinteger(candidate.startCharacter)) && (Is$1.undefined(candidate.endCharacter) || Is$1.uinteger(candidate.endCharacter)) && (Is$1.undefined(candidate.kind) || Is$1.string(candidate.kind));
			}
			FoldingRange.is = is;
		})(FoldingRange$1 || (FoldingRange$1 = {}));
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
				return Is$1.defined(candidate) && Location$1.is(candidate.location) && Is$1.string(candidate.message);
			}
			DiagnosticRelatedInformation.is = is;
		})(DiagnosticRelatedInformation$1 || (DiagnosticRelatedInformation$1 = {}));
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
		})(DiagnosticSeverity$2 || (DiagnosticSeverity$2 = {}));
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
		})(DiagnosticTag$1 || (DiagnosticTag$1 = {}));
		(function(CodeDescription) {
			function is(value) {
				const candidate = value;
				return Is$1.objectLiteral(candidate) && Is$1.string(candidate.href);
			}
			CodeDescription.is = is;
		})(CodeDescription$1 || (CodeDescription$1 = {}));
		(function(Diagnostic) {
			/**
			* Creates a new Diagnostic literal.
			*/
			function create(range, message, severity, code, source, relatedInformation) {
				let result = {
					range,
					message
				};
				if (Is$1.defined(severity)) result.severity = severity;
				if (Is$1.defined(code)) result.code = code;
				if (Is$1.defined(source)) result.source = source;
				if (Is$1.defined(relatedInformation)) result.relatedInformation = relatedInformation;
				return result;
			}
			Diagnostic.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Diagnostic} interface.
			*/
			function is(value) {
				var _a;
				let candidate = value;
				return Is$1.defined(candidate) && Range$1.is(candidate.range) && Is$1.string(candidate.message) && (Is$1.number(candidate.severity) || Is$1.undefined(candidate.severity)) && (Is$1.integer(candidate.code) || Is$1.string(candidate.code) || Is$1.undefined(candidate.code)) && (Is$1.undefined(candidate.codeDescription) || Is$1.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)) && (Is$1.string(candidate.source) || Is$1.undefined(candidate.source)) && (Is$1.undefined(candidate.relatedInformation) || Is$1.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation$1.is));
			}
			Diagnostic.is = is;
		})(Diagnostic$1 || (Diagnostic$1 = {}));
		(function(Command) {
			/**
			* Creates a new Command literal.
			*/
			function create(title, command, ...args) {
				let result = {
					title,
					command
				};
				if (Is$1.defined(args) && args.length > 0) result.arguments = args;
				return result;
			}
			Command.create = create;
			/**
			* Checks whether the given literal conforms to the {@link Command} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is$1.defined(candidate) && Is$1.string(candidate.title) && Is$1.string(candidate.command);
			}
			Command.is = is;
		})(Command$1 || (Command$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Is$1.string(candidate.newText) && Range$1.is(candidate.range);
			}
			TextEdit.is = is;
		})(TextEdit$1 || (TextEdit$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Is$1.string(candidate.label) && (Is$1.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === void 0) && (Is$1.string(candidate.description) || candidate.description === void 0);
			}
			ChangeAnnotation.is = is;
		})(ChangeAnnotation$1 || (ChangeAnnotation$1 = {}));
		(function(ChangeAnnotationIdentifier) {
			function is(value) {
				const candidate = value;
				return Is$1.string(candidate);
			}
			ChangeAnnotationIdentifier.is = is;
		})(ChangeAnnotationIdentifier$1 || (ChangeAnnotationIdentifier$1 = {}));
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
				return TextEdit$1.is(candidate) && (ChangeAnnotation$1.is(candidate.annotationId) || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
			}
			AnnotatedTextEdit.is = is;
		})(AnnotatedTextEdit$1 || (AnnotatedTextEdit$1 = {}));
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
				return Is$1.defined(candidate) && OptionalVersionedTextDocumentIdentifier$1.is(candidate.textDocument) && Array.isArray(candidate.edits);
			}
			TextDocumentEdit.is = is;
		})(TextDocumentEdit$1 || (TextDocumentEdit$1 = {}));
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
				return candidate && candidate.kind === "create" && Is$1.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is$1.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is$1.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
			}
			CreateFile.is = is;
		})(CreateFile$1 || (CreateFile$1 = {}));
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
				return candidate && candidate.kind === "rename" && Is$1.string(candidate.oldUri) && Is$1.string(candidate.newUri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is$1.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is$1.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
			}
			RenameFile.is = is;
		})(RenameFile$1 || (RenameFile$1 = {}));
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
				return candidate && candidate.kind === "delete" && Is$1.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.recursive === void 0 || Is$1.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === void 0 || Is$1.boolean(candidate.options.ignoreIfNotExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
			}
			DeleteFile.is = is;
		})(DeleteFile$1 || (DeleteFile$1 = {}));
		(function(WorkspaceEdit) {
			function is(value) {
				let candidate = value;
				return candidate && (candidate.changes !== void 0 || candidate.documentChanges !== void 0) && (candidate.documentChanges === void 0 || candidate.documentChanges.every((change) => {
					if (Is$1.string(change.kind)) return CreateFile$1.is(change) || RenameFile$1.is(change) || DeleteFile$1.is(change);
					else return TextDocumentEdit$1.is(change);
				}));
			}
			WorkspaceEdit.is = is;
		})(WorkspaceEdit$1 || (WorkspaceEdit$1 = {}));
		TextEditChangeImpl = class {
			constructor(edits, changeAnnotations) {
				this.edits = edits;
				this.changeAnnotations = changeAnnotations;
			}
			insert(position, newText, annotation) {
				let edit;
				let id;
				if (annotation === void 0) edit = TextEdit$1.insert(position, newText);
				else if (ChangeAnnotationIdentifier$1.is(annotation)) {
					id = annotation;
					edit = AnnotatedTextEdit$1.insert(position, newText, annotation);
				} else {
					this.assertChangeAnnotations(this.changeAnnotations);
					id = this.changeAnnotations.manage(annotation);
					edit = AnnotatedTextEdit$1.insert(position, newText, id);
				}
				this.edits.push(edit);
				if (id !== void 0) return id;
			}
			replace(range, newText, annotation) {
				let edit;
				let id;
				if (annotation === void 0) edit = TextEdit$1.replace(range, newText);
				else if (ChangeAnnotationIdentifier$1.is(annotation)) {
					id = annotation;
					edit = AnnotatedTextEdit$1.replace(range, newText, annotation);
				} else {
					this.assertChangeAnnotations(this.changeAnnotations);
					id = this.changeAnnotations.manage(annotation);
					edit = AnnotatedTextEdit$1.replace(range, newText, id);
				}
				this.edits.push(edit);
				if (id !== void 0) return id;
			}
			delete(range, annotation) {
				let edit;
				let id;
				if (annotation === void 0) edit = TextEdit$1.del(range);
				else if (ChangeAnnotationIdentifier$1.is(annotation)) {
					id = annotation;
					edit = AnnotatedTextEdit$1.del(range, annotation);
				} else {
					this.assertChangeAnnotations(this.changeAnnotations);
					id = this.changeAnnotations.manage(annotation);
					edit = AnnotatedTextEdit$1.del(range, id);
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
				if (ChangeAnnotationIdentifier$1.is(idOrAnnotation)) id = idOrAnnotation;
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
							if (TextDocumentEdit$1.is(change)) {
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
				if (OptionalVersionedTextDocumentIdentifier$1.is(key)) {
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
				if (ChangeAnnotation$1.is(optionsOrAnnotation) || ChangeAnnotationIdentifier$1.is(optionsOrAnnotation)) annotation = optionsOrAnnotation;
				else options = optionsOrAnnotation;
				let operation;
				let id;
				if (annotation === void 0) operation = CreateFile$1.create(uri, options);
				else {
					id = ChangeAnnotationIdentifier$1.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
					operation = CreateFile$1.create(uri, options, id);
				}
				this._workspaceEdit.documentChanges.push(operation);
				if (id !== void 0) return id;
			}
			renameFile(oldUri, newUri, optionsOrAnnotation, options) {
				this.initDocumentChanges();
				if (this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
				let annotation;
				if (ChangeAnnotation$1.is(optionsOrAnnotation) || ChangeAnnotationIdentifier$1.is(optionsOrAnnotation)) annotation = optionsOrAnnotation;
				else options = optionsOrAnnotation;
				let operation;
				let id;
				if (annotation === void 0) operation = RenameFile$1.create(oldUri, newUri, options);
				else {
					id = ChangeAnnotationIdentifier$1.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
					operation = RenameFile$1.create(oldUri, newUri, options, id);
				}
				this._workspaceEdit.documentChanges.push(operation);
				if (id !== void 0) return id;
			}
			deleteFile(uri, optionsOrAnnotation, options) {
				this.initDocumentChanges();
				if (this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
				let annotation;
				if (ChangeAnnotation$1.is(optionsOrAnnotation) || ChangeAnnotationIdentifier$1.is(optionsOrAnnotation)) annotation = optionsOrAnnotation;
				else options = optionsOrAnnotation;
				let operation;
				let id;
				if (annotation === void 0) operation = DeleteFile$1.create(uri, options);
				else {
					id = ChangeAnnotationIdentifier$1.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
					operation = DeleteFile$1.create(uri, options, id);
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
				return Is$1.defined(candidate) && Is$1.string(candidate.uri);
			}
			TextDocumentIdentifier.is = is;
		})(TextDocumentIdentifier$1 || (TextDocumentIdentifier$1 = {}));
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
				return Is$1.defined(candidate) && Is$1.string(candidate.uri) && Is$1.integer(candidate.version);
			}
			VersionedTextDocumentIdentifier.is = is;
		})(VersionedTextDocumentIdentifier$1 || (VersionedTextDocumentIdentifier$1 = {}));
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
				return Is$1.defined(candidate) && Is$1.string(candidate.uri) && (candidate.version === null || Is$1.integer(candidate.version));
			}
			OptionalVersionedTextDocumentIdentifier.is = is;
		})(OptionalVersionedTextDocumentIdentifier$1 || (OptionalVersionedTextDocumentIdentifier$1 = {}));
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
				return Is$1.defined(candidate) && Is$1.string(candidate.uri) && Is$1.string(candidate.languageId) && Is$1.integer(candidate.version) && Is$1.string(candidate.text);
			}
			TextDocumentItem.is = is;
		})(TextDocumentItem$1 || (TextDocumentItem$1 = {}));
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
		})(MarkupKind$1 || (MarkupKind$1 = {}));
		(function(MarkupContent) {
			/**
			* Checks whether the given value conforms to the {@link MarkupContent} interface.
			*/
			function is(value) {
				const candidate = value;
				return Is$1.objectLiteral(value) && MarkupKind$1.is(candidate.kind) && Is$1.string(candidate.value);
			}
			MarkupContent.is = is;
		})(MarkupContent$2 || (MarkupContent$2 = {}));
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
		})(CompletionItemKind$3 || (CompletionItemKind$3 = {}));
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
		})(InsertTextFormat$2 || (InsertTextFormat$2 = {}));
		(function(CompletionItemTag) {
			/**
			* Render a completion as obsolete, usually using a strike-out.
			*/
			CompletionItemTag.Deprecated = 1;
		})(CompletionItemTag$1 || (CompletionItemTag$1 = {}));
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
				return candidate && Is$1.string(candidate.newText) && Range$1.is(candidate.insert) && Range$1.is(candidate.replace);
			}
			InsertReplaceEdit.is = is;
		})(InsertReplaceEdit$1 || (InsertReplaceEdit$1 = {}));
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
		})(InsertTextMode$1 || (InsertTextMode$1 = {}));
		(function(CompletionItemLabelDetails) {
			function is(value) {
				const candidate = value;
				return candidate && (Is$1.string(candidate.detail) || candidate.detail === void 0) && (Is$1.string(candidate.description) || candidate.description === void 0);
			}
			CompletionItemLabelDetails.is = is;
		})(CompletionItemLabelDetails$1 || (CompletionItemLabelDetails$1 = {}));
		(function(CompletionItem) {
			/**
			* Create a completion item and seed it with a label.
			* @param label The completion item's label
			*/
			function create(label) {
				return { label };
			}
			CompletionItem.create = create;
		})(CompletionItem$1 || (CompletionItem$1 = {}));
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
		})(CompletionList$1 || (CompletionList$1 = {}));
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
				return Is$1.string(candidate) || Is$1.objectLiteral(candidate) && Is$1.string(candidate.language) && Is$1.string(candidate.value);
			}
			MarkedString.is = is;
		})(MarkedString$2 || (MarkedString$2 = {}));
		(function(Hover) {
			/**
			* Checks whether the given value conforms to the {@link Hover} interface.
			*/
			function is(value) {
				let candidate = value;
				return !!candidate && Is$1.objectLiteral(candidate) && (MarkupContent$2.is(candidate.contents) || MarkedString$2.is(candidate.contents) || Is$1.typedArray(candidate.contents, MarkedString$2.is)) && (value.range === void 0 || Range$1.is(value.range));
			}
			Hover.is = is;
		})(Hover$1 || (Hover$1 = {}));
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
		})(ParameterInformation$1 || (ParameterInformation$1 = {}));
		(function(SignatureInformation) {
			function create(label, documentation, ...parameters) {
				let result = { label };
				if (Is$1.defined(documentation)) result.documentation = documentation;
				if (Is$1.defined(parameters)) result.parameters = parameters;
				else result.parameters = [];
				return result;
			}
			SignatureInformation.create = create;
		})(SignatureInformation$1 || (SignatureInformation$1 = {}));
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
		})(DocumentHighlightKind$1 || (DocumentHighlightKind$1 = {}));
		(function(DocumentHighlight) {
			/**
			* Create a DocumentHighlight object.
			* @param range The range the highlight applies to.
			* @param kind The highlight kind
			*/
			function create(range, kind) {
				let result = { range };
				if (Is$1.number(kind)) result.kind = kind;
				return result;
			}
			DocumentHighlight.create = create;
		})(DocumentHighlight$1 || (DocumentHighlight$1 = {}));
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
		})(SymbolKind$1 || (SymbolKind$1 = {}));
		(function(SymbolTag) {
			/**
			* Render a symbol as obsolete, usually using a strike-out.
			*/
			SymbolTag.Deprecated = 1;
		})(SymbolTag$1 || (SymbolTag$1 = {}));
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
		})(SymbolInformation$1 || (SymbolInformation$1 = {}));
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
		})(WorkspaceSymbol$1 || (WorkspaceSymbol$1 = {}));
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
				return candidate && Is$1.string(candidate.name) && Is$1.number(candidate.kind) && Range$1.is(candidate.range) && Range$1.is(candidate.selectionRange) && (candidate.detail === void 0 || Is$1.string(candidate.detail)) && (candidate.deprecated === void 0 || Is$1.boolean(candidate.deprecated)) && (candidate.children === void 0 || Array.isArray(candidate.children)) && (candidate.tags === void 0 || Array.isArray(candidate.tags));
			}
			DocumentSymbol.is = is;
		})(DocumentSymbol$1 || (DocumentSymbol$1 = {}));
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
		})(CodeActionKind$1 || (CodeActionKind$1 = {}));
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
		})(CodeActionTriggerKind$1 || (CodeActionTriggerKind$1 = {}));
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
				return Is$1.defined(candidate) && Is$1.typedArray(candidate.diagnostics, Diagnostic$1.is) && (candidate.only === void 0 || Is$1.typedArray(candidate.only, Is$1.string)) && (candidate.triggerKind === void 0 || candidate.triggerKind === CodeActionTriggerKind$1.Invoked || candidate.triggerKind === CodeActionTriggerKind$1.Automatic);
			}
			CodeActionContext.is = is;
		})(CodeActionContext$1 || (CodeActionContext$1 = {}));
		(function(CodeAction) {
			function create(title, kindOrCommandOrEdit, kind) {
				let result = { title };
				let checkKind = true;
				if (typeof kindOrCommandOrEdit === "string") {
					checkKind = false;
					result.kind = kindOrCommandOrEdit;
				} else if (Command$1.is(kindOrCommandOrEdit)) result.command = kindOrCommandOrEdit;
				else result.edit = kindOrCommandOrEdit;
				if (checkKind && kind !== void 0) result.kind = kind;
				return result;
			}
			CodeAction.create = create;
			function is(value) {
				let candidate = value;
				return candidate && Is$1.string(candidate.title) && (candidate.diagnostics === void 0 || Is$1.typedArray(candidate.diagnostics, Diagnostic$1.is)) && (candidate.kind === void 0 || Is$1.string(candidate.kind)) && (candidate.edit !== void 0 || candidate.command !== void 0) && (candidate.command === void 0 || Command$1.is(candidate.command)) && (candidate.isPreferred === void 0 || Is$1.boolean(candidate.isPreferred)) && (candidate.edit === void 0 || WorkspaceEdit$1.is(candidate.edit));
			}
			CodeAction.is = is;
		})(CodeAction$1 || (CodeAction$1 = {}));
		(function(CodeLens) {
			/**
			* Creates a new CodeLens literal.
			*/
			function create(range, data) {
				let result = { range };
				if (Is$1.defined(data)) result.data = data;
				return result;
			}
			CodeLens.create = create;
			/**
			* Checks whether the given literal conforms to the {@link CodeLens} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is$1.defined(candidate) && Range$1.is(candidate.range) && (Is$1.undefined(candidate.command) || Command$1.is(candidate.command));
			}
			CodeLens.is = is;
		})(CodeLens$1 || (CodeLens$1 = {}));
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
				return Is$1.defined(candidate) && Is$1.uinteger(candidate.tabSize) && Is$1.boolean(candidate.insertSpaces);
			}
			FormattingOptions.is = is;
		})(FormattingOptions$1 || (FormattingOptions$1 = {}));
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
				return Is$1.defined(candidate) && Range$1.is(candidate.range) && (Is$1.undefined(candidate.target) || Is$1.string(candidate.target));
			}
			DocumentLink.is = is;
		})(DocumentLink$1 || (DocumentLink$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Range$1.is(candidate.range) && (candidate.parent === void 0 || SelectionRange.is(candidate.parent));
			}
			SelectionRange.is = is;
		})(SelectionRange$1 || (SelectionRange$1 = {}));
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
		})(SemanticTokenTypes$1 || (SemanticTokenTypes$1 = {}));
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
		})(SemanticTokenModifiers$1 || (SemanticTokenModifiers$1 = {}));
		(function(SemanticTokens) {
			function is(value) {
				const candidate = value;
				return Is$1.objectLiteral(candidate) && (candidate.resultId === void 0 || typeof candidate.resultId === "string") && Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === "number");
			}
			SemanticTokens.is = is;
		})(SemanticTokens$1 || (SemanticTokens$1 = {}));
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
				return candidate !== void 0 && candidate !== null && Range$1.is(candidate.range) && Is$1.string(candidate.text);
			}
			InlineValueText.is = is;
		})(InlineValueText$1 || (InlineValueText$1 = {}));
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
				return candidate !== void 0 && candidate !== null && Range$1.is(candidate.range) && Is$1.boolean(candidate.caseSensitiveLookup) && (Is$1.string(candidate.variableName) || candidate.variableName === void 0);
			}
			InlineValueVariableLookup.is = is;
		})(InlineValueVariableLookup$1 || (InlineValueVariableLookup$1 = {}));
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
				return candidate !== void 0 && candidate !== null && Range$1.is(candidate.range) && (Is$1.string(candidate.expression) || candidate.expression === void 0);
			}
			InlineValueEvaluatableExpression.is = is;
		})(InlineValueEvaluatableExpression$1 || (InlineValueEvaluatableExpression$1 = {}));
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
				return Is$1.defined(candidate) && Range$1.is(value.stoppedLocation);
			}
			InlineValueContext.is = is;
		})(InlineValueContext$1 || (InlineValueContext$1 = {}));
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
		})(InlayHintKind$1 || (InlayHintKind$1 = {}));
		(function(InlayHintLabelPart) {
			function create(value) {
				return { value };
			}
			InlayHintLabelPart.create = create;
			function is(value) {
				const candidate = value;
				return Is$1.objectLiteral(candidate) && (candidate.tooltip === void 0 || Is$1.string(candidate.tooltip) || MarkupContent$2.is(candidate.tooltip)) && (candidate.location === void 0 || Location$1.is(candidate.location)) && (candidate.command === void 0 || Command$1.is(candidate.command));
			}
			InlayHintLabelPart.is = is;
		})(InlayHintLabelPart$1 || (InlayHintLabelPart$1 = {}));
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
				return Is$1.objectLiteral(candidate) && Position$1.is(candidate.position) && (Is$1.string(candidate.label) || Is$1.typedArray(candidate.label, InlayHintLabelPart$1.is)) && (candidate.kind === void 0 || InlayHintKind$1.is(candidate.kind)) && candidate.textEdits === void 0 || Is$1.typedArray(candidate.textEdits, TextEdit$1.is) && (candidate.tooltip === void 0 || Is$1.string(candidate.tooltip) || MarkupContent$2.is(candidate.tooltip)) && (candidate.paddingLeft === void 0 || Is$1.boolean(candidate.paddingLeft)) && (candidate.paddingRight === void 0 || Is$1.boolean(candidate.paddingRight));
			}
			InlayHint.is = is;
		})(InlayHint$1 || (InlayHint$1 = {}));
		(function(StringValue) {
			function createSnippet(value) {
				return {
					kind: "snippet",
					value
				};
			}
			StringValue.createSnippet = createSnippet;
		})(StringValue$1 || (StringValue$1 = {}));
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
		})(InlineCompletionItem$1 || (InlineCompletionItem$1 = {}));
		(function(InlineCompletionList) {
			function create(items) {
				return { items };
			}
			InlineCompletionList.create = create;
		})(InlineCompletionList$1 || (InlineCompletionList$1 = {}));
		(function(InlineCompletionTriggerKind) {
			/**
			* Completion was triggered explicitly by a user gesture.
			*/
			InlineCompletionTriggerKind.Invoked = 0;
			/**
			* Completion was triggered automatically while editing.
			*/
			InlineCompletionTriggerKind.Automatic = 1;
		})(InlineCompletionTriggerKind$1 || (InlineCompletionTriggerKind$1 = {}));
		(function(SelectedCompletionInfo) {
			function create(range, text) {
				return {
					range,
					text
				};
			}
			SelectedCompletionInfo.create = create;
		})(SelectedCompletionInfo$1 || (SelectedCompletionInfo$1 = {}));
		(function(InlineCompletionContext) {
			function create(triggerKind, selectedCompletionInfo) {
				return {
					triggerKind,
					selectedCompletionInfo
				};
			}
			InlineCompletionContext.create = create;
		})(InlineCompletionContext$1 || (InlineCompletionContext$1 = {}));
		(function(WorkspaceFolder) {
			function is(value) {
				const candidate = value;
				return Is$1.objectLiteral(candidate) && URI$1.is(candidate.uri) && Is$1.string(candidate.name);
			}
			WorkspaceFolder.is = is;
		})(WorkspaceFolder$1 || (WorkspaceFolder$1 = {}));
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
				return new FullTextDocument$2(uri, languageId, version, content);
			}
			TextDocument.create = create;
			/**
			* Checks whether the given literal conforms to the {@link ITextDocument} interface.
			*/
			function is(value) {
				let candidate = value;
				return Is$1.defined(candidate) && Is$1.string(candidate.uri) && (Is$1.undefined(candidate.languageId) || Is$1.string(candidate.languageId)) && Is$1.uinteger(candidate.lineCount) && Is$1.func(candidate.getText) && Is$1.func(candidate.positionAt) && Is$1.func(candidate.offsetAt) ? true : false;
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
		})(TextDocument$2 || (TextDocument$2 = {}));
		FullTextDocument$2 = class {
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
				if (high === 0) return Position$1.create(0, offset);
				while (low < high) {
					let mid = Math.floor((low + high) / 2);
					if (lineOffsets[mid] > offset) high = mid;
					else low = mid + 1;
				}
				let line = low - 1;
				return Position$1.create(line, offset - lineOffsets[line]);
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
		})(Is$1 || (Is$1 = {}));
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
	var t$1 = { 975(t) {
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
		return t$1[n](o, o.exports, r), o.exports;
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
	var a$1 = "";
	var c = "/";
	var f$1 = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
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
			"object" == typeof t ? (this.scheme = t.scheme || a$1, this.authority = t.authority || a$1, this.path = t.path || a$1, this.query = t.query || a$1, this.fragment = t.fragment || a$1) : (this.scheme = function(t, e) {
				return t || e ? t : "file";
			}(t, o), this.authority = e || a$1, this.path = function(t, e) {
				switch (t) {
					case "https":
					case "http":
					case "file": e ? e[0] !== c && (e = c + e) : e = c;
				}
				return e;
			}(this.scheme, r || a$1), this.query = n || a$1, this.fragment = i || a$1, s(this, o));
		}
		get fsPath() {
			return y(this, !1);
		}
		with(t) {
			if (!t) return this;
			let { scheme: e, authority: r, path: n, query: i, fragment: o } = t;
			return void 0 === e ? e = this.scheme : null === e && (e = a$1), void 0 === r ? r = this.authority : null === r && (r = a$1), void 0 === n ? n = this.path : null === n && (n = a$1), void 0 === i ? i = this.query : null === i && (i = a$1), void 0 === o ? o = this.fragment : null === o && (o = a$1), e === this.scheme && r === this.authority && n === this.path && i === this.query && o === this.fragment ? this : new g(e, r, n, i, o);
		}
		static parse(t, e = !1) {
			const r = f$1.exec(t);
			return r ? new g(r[2] || a$1, A$1(r[4] || a$1), A$1(r[5] || a$1), A$1(r[7] || a$1), A$1(r[9] || a$1), e) : new g(a$1, a$1, a$1, a$1, a$1);
		}
		static file(t) {
			let e = a$1;
			if (n && (t = t.replace(/\\/g, c)), t[0] === c && t[1] === c) {
				const r = t.indexOf(c, 2);
				-1 === r ? (e = t.substring(2), t = c) : (e = t.substring(2, r), t = t.substring(r) || c);
			}
			return new g("file", e, t, a$1, a$1);
		}
		static from(t) {
			const e = new g(t.scheme, t.authority, t.path, t.query, t.fragment);
			return s(e, !0), e;
		}
		toString(t = !1) {
			return v(this, t);
		}
		toJSON() {
			return this;
		}
		static revive(t) {
			if (t) {
				if (t instanceof u) return t;
				{
					const e = new g(t);
					return e._formatted = t.external, e._fsPath = t._sep === l ? t.fsPath : null, e;
				}
			}
			return t;
		}
	};
	var l = n ? 1 : void 0;
	var g = class extends u {
		_formatted = null;
		_fsPath = null;
		get fsPath() {
			return this._fsPath || (this._fsPath = y(this, !1)), this._fsPath;
		}
		toString(t = !1) {
			return t ? v(this, !0) : (this._formatted || (this._formatted = v(this, !1)), this._formatted);
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
	function d(t, e, r) {
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
	function m(t) {
		let e;
		for (let r = 0; r < t.length; r++) {
			const n = t.charCodeAt(r);
			35 === n || 63 === n ? (void 0 === e && (e = t.substr(0, r)), e += p[n]) : void 0 !== e && (e += t[r]);
		}
		return void 0 !== e ? e : t;
	}
	function y(t, e) {
		let r;
		return r = t.authority && t.path.length > 1 && "file" === t.scheme ? `//${t.authority}${t.path}` : 47 === t.path.charCodeAt(0) && (t.path.charCodeAt(1) >= 65 && t.path.charCodeAt(1) <= 90 || t.path.charCodeAt(1) >= 97 && t.path.charCodeAt(1) <= 122) && 58 === t.path.charCodeAt(2) ? e ? t.path.substr(1) : t.path[1].toLowerCase() + t.path.substr(2) : t.path, n && (r = r.replace(/\//g, "\\")), r;
	}
	function v(t, e) {
		const r = e ? m : d;
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
		return s && (n += "?", n += r(s, !1, !1)), a && (n += "#", n += e ? a : d(a, !1, !1)), n;
	}
	function b(t) {
		try {
			return decodeURIComponent(t);
		} catch {
			return t.length > 3 ? t.substr(0, 3) + b(t.substr(3)) : t;
		}
	}
	var C = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
	function A$1(t) {
		return t.match(C) ? t.replace(C, (t) => b(t)) : t;
	}
	var w = r(975);
	var x = w.posix || w;
	var P = "/";
	var _;
	(function(t) {
		t.joinPath = function(t, ...e) {
			return t.with({ path: x.join(t.path, ...e) });
		}, t.resolvePath = function(t, ...e) {
			let r = t.path, n = !1;
			r[0] !== P && (r = P + r, n = !0);
			let i = x.resolve(r, ...e);
			return n && i[0] === P && !t.authority && (i = i.substring(1)), t.with({ path: i });
		}, t.dirname = function(t) {
			if (0 === t.path.length || t.path === P) return t;
			let e = x.dirname(t.path);
			return 1 === e.length && 46 === e.charCodeAt(0) && (e = ""), t.with({ path: e });
		}, t.basename = function(t) {
			return x.basename(t.path);
		}, t.extname = function(t) {
			return x.extname(t.path);
		};
	})(_ || (_ = {}));
	//#endregion
	//#region src/utils.ts
	function mergeObjects(obj1, obj2, excludeUndefined = false) {
		if (!obj1) return obj2;
		if (!obj2) return obj1;
		if (excludeUndefined) {
			obj1 = excludeUndefinedValues(obj1);
			obj2 = excludeUndefinedValues(obj2);
		}
		const mergedObjects = {
			...obj2,
			...obj1
		};
		for (const key of Object.keys(mergedObjects)) if (obj1[key] && obj2[key]) {
			if (Array.isArray(obj1[key])) mergedObjects[key] = obj1[key].concat(obj2[key]);
			else if (Array.isArray(obj2[key])) mergedObjects[key] = obj2[key].concat(obj1[key]);
			else if (typeof obj1[key] === "object" && typeof obj2[key] === "object") mergedObjects[key] = mergeObjects(obj1[key], obj2[key]);
		}
		return mergedObjects;
	}
	function excludeUndefinedValues(obj) {
		const filteredEntries = Object.entries(obj).filter(([_, value]) => value !== void 0);
		return Object.fromEntries(filteredEntries);
	}
	function checkValueAgainstRegexpArray(value, regexpArray) {
		if (!regexpArray) return false;
		for (let i = 0; i < regexpArray.length; i++) if (regexpArray[i].test(value)) return true;
		return false;
	}
	//#endregion
	//#region ../../node_modules/vscode-languageserver-textdocument/lib/esm/main.js
	var FullTextDocument$1 = class FullTextDocument$1 {
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
				const start = this.offsetAt(range.start);
				const end = this.offsetAt(range.end);
				return this._content.substring(start, end);
			}
			return this._content;
		}
		update(changes, version) {
			for (const change of changes) if (FullTextDocument$1.isIncremental(change)) {
				const range = getWellformedRange(change.range);
				const startOffset = this.offsetAt(range.start);
				const endOffset = this.offsetAt(range.end);
				this._content = this._content.substring(0, startOffset) + change.text + this._content.substring(endOffset, this._content.length);
				const startLine = Math.max(range.start.line, 0);
				const endLine = Math.max(range.end.line, 0);
				let lineOffsets = this._lineOffsets;
				const addedLineOffsets = computeLineOffsets(change.text, false, startOffset);
				if (endLine - startLine === addedLineOffsets.length) for (let i = 0, len = addedLineOffsets.length; i < len; i++) lineOffsets[i + startLine + 1] = addedLineOffsets[i];
				else if (addedLineOffsets.length < 1e4) lineOffsets.splice(startLine + 1, endLine - startLine, ...addedLineOffsets);
				else this._lineOffsets = lineOffsets = lineOffsets.slice(0, startLine + 1).concat(addedLineOffsets, lineOffsets.slice(endLine + 1));
				const diff = change.text.length - (endOffset - startOffset);
				if (diff !== 0) for (let i = startLine + 1 + addedLineOffsets.length, len = lineOffsets.length; i < len; i++) lineOffsets[i] = lineOffsets[i] + diff;
			} else if (FullTextDocument$1.isFull(change)) {
				this._content = change.text;
				this._lineOffsets = void 0;
			} else throw new Error("Unknown change event received");
			this._version = version;
		}
		getLineOffsets() {
			if (this._lineOffsets === void 0) this._lineOffsets = computeLineOffsets(this._content, true);
			return this._lineOffsets;
		}
		positionAt(offset) {
			offset = Math.max(Math.min(offset, this._content.length), 0);
			const lineOffsets = this.getLineOffsets();
			let low = 0, high = lineOffsets.length;
			if (high === 0) return {
				line: 0,
				character: offset
			};
			while (low < high) {
				const mid = Math.floor((low + high) / 2);
				if (lineOffsets[mid] > offset) high = mid;
				else low = mid + 1;
			}
			const line = low - 1;
			offset = this.ensureBeforeEOL(offset, lineOffsets[line]);
			return {
				line,
				character: offset - lineOffsets[line]
			};
		}
		offsetAt(position) {
			const lineOffsets = this.getLineOffsets();
			if (position.line >= lineOffsets.length) return this._content.length;
			else if (position.line < 0) return 0;
			const lineOffset = lineOffsets[position.line];
			if (position.character <= 0) return lineOffset;
			const nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
			const offset = Math.min(lineOffset + position.character, nextLineOffset);
			return this.ensureBeforeEOL(offset, lineOffset);
		}
		getLineRange(line) {
			const lineOffsets = this.getLineOffsets();
			if (line >= lineOffsets.length) {
				const lastLine = lineOffsets.length - 1;
				return {
					start: {
						line: lastLine,
						character: 0
					},
					end: {
						line: lastLine,
						character: this._content.length - lineOffsets[lastLine]
					}
				};
			} else if (line < 0) return {
				start: {
					line: 0,
					character: 0
				},
				end: {
					line: 0,
					character: 0
				}
			};
			const startOffset = lineOffsets[line];
			const nextLineOffset = line + 1 < lineOffsets.length ? lineOffsets[line + 1] : this._content.length;
			const endOffset = this.ensureBeforeEOL(nextLineOffset, startOffset);
			return {
				start: {
					line,
					character: 0
				},
				end: {
					line,
					character: endOffset - startOffset
				}
			};
		}
		getEOLCharacters(line) {
			const lineOffsets = this.getLineOffsets();
			if (line >= lineOffsets.length) return "";
			else if (line < 0) return "";
			const nextLineOffset = line + 1 < lineOffsets.length ? lineOffsets[line + 1] : this._content.length;
			const eolOffset = this.ensureBeforeEOL(nextLineOffset, lineOffsets[line]);
			return this._content.substring(eolOffset, nextLineOffset);
		}
		ensureBeforeEOL(offset, lineOffset) {
			while (offset > lineOffset && isEOL$1(this._content.charCodeAt(offset - 1))) offset--;
			return offset;
		}
		get lineCount() {
			return this.getLineOffsets().length;
		}
		static isIncremental(event) {
			const candidate = event;
			return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range !== void 0 && (candidate.rangeLength === void 0 || typeof candidate.rangeLength === "number");
		}
		static isFull(event) {
			const candidate = event;
			return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range === void 0 && candidate.rangeLength === void 0;
		}
	};
	var TextDocument$1;
	(function(TextDocument) {
		/**
		* Creates a new text document.
		*
		* @param uri The document's uri.
		* @param languageId  The document's language Id.
		* @param version The document's initial version number.
		* @param content The document's content.
		*/
		function create(uri, languageId, version, content) {
			return new FullTextDocument$1(uri, languageId, version, content);
		}
		TextDocument.create = create;
		/**
		* Updates a TextDocument by modifying its content.
		*
		* @param document the document to update. Only documents created by TextDocument.create are valid inputs.
		* @param changes the changes to apply to the document.
		* @param version the changes version for the document.
		* @returns The updated TextDocument. Note: That's the same document instance passed in as first parameter.
		*
		*/
		function update(document, changes, version) {
			if (document instanceof FullTextDocument$1) {
				document.update(changes, version);
				return document;
			} else throw new Error("TextDocument.update: document must be created by TextDocument.create");
		}
		TextDocument.update = update;
		function applyEdits(document, edits) {
			const text = document.getText();
			const sortedEdits = mergeSort(edits.map(getWellformedEdit), (a, b) => {
				const diff = a.range.start.line - b.range.start.line;
				if (diff === 0) return a.range.start.character - b.range.start.character;
				return diff;
			});
			let lastModifiedOffset = 0;
			const spans = [];
			for (const e of sortedEdits) {
				const startOffset = document.offsetAt(e.range.start);
				if (startOffset < lastModifiedOffset) throw new Error("Overlapping edit");
				else if (startOffset > lastModifiedOffset) spans.push(text.substring(lastModifiedOffset, startOffset));
				if (e.newText.length) spans.push(e.newText);
				lastModifiedOffset = document.offsetAt(e.range.end);
			}
			spans.push(text.substr(lastModifiedOffset));
			return spans.join("");
		}
		TextDocument.applyEdits = applyEdits;
	})(TextDocument$1 || (TextDocument$1 = {}));
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
	function computeLineOffsets(text, isAtLineStart, textOffset = 0) {
		const result = isAtLineStart ? [textOffset] : [];
		for (let i = 0; i < text.length; i++) {
			const ch = text.charCodeAt(i);
			if (isEOL$1(ch)) {
				if (ch === 13 && i + 1 < text.length && text.charCodeAt(i + 1) === 10) i++;
				result.push(textOffset + i + 1);
			}
		}
		return result;
	}
	function isEOL$1(char) {
		return char === 13 || char === 10;
	}
	function getWellformedRange(range) {
		const start = range.start;
		const end = range.end;
		if (start.line > end.line || start.line === end.line && start.character > end.character) return {
			start: end,
			end: start
		};
		return range;
	}
	function getWellformedEdit(textEdit) {
		const range = getWellformedRange(textEdit.range);
		if (range !== textEdit.range) return {
			newText: textEdit.newText,
			range
		};
		return textEdit;
	}
	//#endregion
	//#region src/services/base-service.ts
	var BaseService = class {
		constructor(mode, workspaceUri) {
			this.documents = {};
			this.options = {};
			this.globalOptions = {};
			this.serviceCapabilities = {};
			this.clientCapabilities = {
				textDocument: {
					publishDiagnostics: {
						relatedInformation: true,
						versionSupport: false,
						dataSupport: true,
						tagSupport: { valueSet: [import_main.DiagnosticTag.Unnecessary, import_main.DiagnosticTag.Deprecated] }
					},
					hover: {
						dynamicRegistration: true,
						contentFormat: ["markdown", "plaintext"]
					},
					synchronization: {
						dynamicRegistration: false,
						willSave: false,
						didSave: false,
						willSaveWaitUntil: false
					},
					formatting: { dynamicRegistration: true },
					completion: {
						dynamicRegistration: true,
						completionItem: {
							snippetSupport: true,
							commitCharactersSupport: false,
							documentationFormat: ["markdown", "plaintext"],
							deprecatedSupport: false,
							preselectSupport: false
						},
						contextSupport: false
					},
					signatureHelp: {
						dynamicRegistration: true,
						signatureInformation: {
							documentationFormat: ["markdown", "plaintext"],
							activeParameterSupport: true
						}
					},
					documentHighlight: { dynamicRegistration: true },
					semanticTokens: {
						dynamicRegistration: true,
						multilineTokenSupport: false,
						overlappingTokenSupport: false,
						tokenTypes: [],
						tokenModifiers: [],
						formats: ["relative"],
						requests: {
							full: { delta: false },
							range: true
						},
						augmentsSyntaxTokens: true
					},
					codeAction: { dynamicRegistration: true },
					inlineCompletion: { dynamicRegistration: true }
				},
				window: { showDocument: { support: true } },
				workspace: {
					didChangeConfiguration: { dynamicRegistration: false },
					executeCommand: { dynamicRegistration: true },
					applyEdit: true,
					workspaceEdit: {
						failureHandling: "abort",
						normalizesLineEndings: false,
						documentChanges: false
					}
				}
			};
			this.mode = mode;
			this.workspaceUri = workspaceUri;
			this.serviceName = "BaseService";
			this.serviceData = {
				className: "BaseService",
				modes: "",
				module: () => {}
			};
		}
		addDocument(document) {
			this.documents[document.uri] = TextDocument$1.create(document.uri, document.languageId, document.version, document.text);
		}
		getDocument(uri) {
			return this.documents[uri];
		}
		removeDocument(document) {
			delete this.documents[document.uri];
			if (this.options[document.uri]) delete this.options[document.uri];
		}
		renameDocument(document, newDocumentUri) {
			const previousDocument = this.getDocument(document.uri);
			this.addDocument({
				uri: newDocumentUri,
				version: previousDocument.version,
				languageId: previousDocument.languageId,
				text: previousDocument.getText()
			});
			this.options[newDocumentUri] = this.options[document.uri];
			this.removeDocument(document);
		}
		getDocumentValue(uri) {
			return this.getDocument(uri)?.getText();
		}
		setValue(identifier, value) {
			let document = this.getDocument(identifier.uri);
			if (document) {
				document = TextDocument$1.create(document.uri, document.languageId, document.version, value);
				this.documents[document.uri] = document;
			}
		}
		setGlobalOptions(options) {
			this.globalOptions = options ?? {};
		}
		setWorkspace(workspaceUri) {
			this.workspaceUri = workspaceUri;
		}
		setOptions(documentUri, options, merge = false) {
			this.options[documentUri] = merge ? mergeObjects(options, this.options[documentUri]) : options;
		}
		getOption(documentUri, optionName) {
			if (this.options[documentUri] && this.options[documentUri][optionName]) return this.options[documentUri][optionName];
			else return this.globalOptions[optionName];
		}
		applyDeltas(identifier, deltas) {
			let document = this.getDocument(identifier.uri);
			if (document) TextDocument$1.update(document, deltas, identifier.version);
		}
		async doComplete(document, position) {
			return null;
		}
		async doInlineComplete(document, position) {
			return null;
		}
		async doHover(document, position) {
			return null;
		}
		async doResolve(item) {
			return null;
		}
		async doValidation(document) {
			return [];
		}
		format(document, range, options) {
			return Promise.resolve([]);
		}
		async provideSignatureHelp(document, position) {
			return null;
		}
		async findDocumentHighlights(document, position) {
			return [];
		}
		get optionsToFilterDiagnostics() {
			return {
				errorCodesToIgnore: this.globalOptions.errorCodesToIgnore ?? [],
				errorCodesToTreatAsWarning: this.globalOptions.errorCodesToTreatAsWarning ?? [],
				errorCodesToTreatAsInfo: this.globalOptions.errorCodesToTreatAsInfo ?? [],
				errorMessagesToIgnore: this.globalOptions.errorMessagesToIgnore ?? [],
				errorMessagesToTreatAsWarning: this.globalOptions.errorMessagesToTreatAsWarning ?? [],
				errorMessagesToTreatAsInfo: this.globalOptions.errorMessagesToTreatAsInfo ?? []
			};
		}
		getSemanticTokens(document, range) {
			return Promise.resolve(null);
		}
		dispose() {
			return Promise.resolve();
		}
		closeConnection() {
			return Promise.resolve();
		}
		getCodeActions(document, range, context) {
			return Promise.resolve(null);
		}
		executeCommand(command, args) {
			return Promise.resolve(null);
		}
		sendAppliedResult(result, callbackId) {}
		sendRequest(name, args) {
			return Promise.resolve(null);
		}
		sendResponse(callbackId, args) {}
	};
	//#endregion
	//#region node_modules/jsonc-parser/lib/esm/impl/scanner.js
	/**
	* Creates a JSON scanner on the given text.
	* If ignoreTrivia is set, whitespaces or comments are ignored.
	*/
	function createScanner$1(text, ignoreTrivia = false) {
		const len = text.length;
		let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
		function scanHexDigits(count, exact) {
			let digits = 0;
			let value = 0;
			while (digits < count || !exact) {
				let ch = text.charCodeAt(pos);
				if (ch >= 48 && ch <= 57) value = value * 16 + ch - 48;
				else if (ch >= 65 && ch <= 70) value = value * 16 + ch - 65 + 10;
				else if (ch >= 97 && ch <= 102) value = value * 16 + ch - 97 + 10;
				else break;
				pos++;
				digits++;
			}
			if (digits < count) value = -1;
			return value;
		}
		function setPosition(newPosition) {
			pos = newPosition;
			value = "";
			tokenOffset = 0;
			token = 16;
			scanError = 0;
		}
		function scanNumber() {
			let start = pos;
			if (text.charCodeAt(pos) === 48) pos++;
			else {
				pos++;
				while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
			}
			if (pos < text.length && text.charCodeAt(pos) === 46) {
				pos++;
				if (pos < text.length && isDigit(text.charCodeAt(pos))) {
					pos++;
					while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
				} else {
					scanError = 3;
					return text.substring(start, pos);
				}
			}
			let end = pos;
			if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
				pos++;
				if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) pos++;
				if (pos < text.length && isDigit(text.charCodeAt(pos))) {
					pos++;
					while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
					end = pos;
				} else scanError = 3;
			}
			return text.substring(start, end);
		}
		function scanString() {
			let result = "", start = pos;
			while (true) {
				if (pos >= len) {
					result += text.substring(start, pos);
					scanError = 2;
					break;
				}
				const ch = text.charCodeAt(pos);
				if (ch === 34) {
					result += text.substring(start, pos);
					pos++;
					break;
				}
				if (ch === 92) {
					result += text.substring(start, pos);
					pos++;
					if (pos >= len) {
						scanError = 2;
						break;
					}
					switch (text.charCodeAt(pos++)) {
						case 34:
							result += "\"";
							break;
						case 92:
							result += "\\";
							break;
						case 47:
							result += "/";
							break;
						case 98:
							result += "\b";
							break;
						case 102:
							result += "\f";
							break;
						case 110:
							result += "\n";
							break;
						case 114:
							result += "\r";
							break;
						case 116:
							result += "	";
							break;
						case 117:
							{
								const ch3 = scanHexDigits(4, true);
								if (ch3 >= 0) result += String.fromCharCode(ch3);
								else scanError = 4;
							}
							break;
						default: scanError = 5;
					}
					start = pos;
					continue;
				}
				if (ch >= 0 && ch <= 31) if (isLineBreak(ch)) {
					result += text.substring(start, pos);
					scanError = 2;
					break;
				} else scanError = 6;
				pos++;
			}
			return result;
		}
		function scanNext() {
			value = "";
			scanError = 0;
			tokenOffset = pos;
			lineStartOffset = lineNumber;
			prevTokenLineStartOffset = tokenLineStartOffset;
			if (pos >= len) {
				tokenOffset = len;
				return token = 17;
			}
			let code = text.charCodeAt(pos);
			if (isWhiteSpace(code)) {
				do {
					pos++;
					value += String.fromCharCode(code);
					code = text.charCodeAt(pos);
				} while (isWhiteSpace(code));
				return token = 15;
			}
			if (isLineBreak(code)) {
				pos++;
				value += String.fromCharCode(code);
				if (code === 13 && text.charCodeAt(pos) === 10) {
					pos++;
					value += "\n";
				}
				lineNumber++;
				tokenLineStartOffset = pos;
				return token = 14;
			}
			switch (code) {
				case 123:
					pos++;
					return token = 1;
				case 125:
					pos++;
					return token = 2;
				case 91:
					pos++;
					return token = 3;
				case 93:
					pos++;
					return token = 4;
				case 58:
					pos++;
					return token = 6;
				case 44:
					pos++;
					return token = 5;
				case 34:
					pos++;
					value = scanString();
					return token = 10;
				case 47: {
					const start = pos - 1;
					if (text.charCodeAt(pos + 1) === 47) {
						pos += 2;
						while (pos < len) {
							if (isLineBreak(text.charCodeAt(pos))) break;
							pos++;
						}
						value = text.substring(start, pos);
						return token = 12;
					}
					if (text.charCodeAt(pos + 1) === 42) {
						pos += 2;
						const safeLength = len - 1;
						let commentClosed = false;
						while (pos < safeLength) {
							const ch = text.charCodeAt(pos);
							if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
								pos += 2;
								commentClosed = true;
								break;
							}
							pos++;
							if (isLineBreak(ch)) {
								if (ch === 13 && text.charCodeAt(pos) === 10) pos++;
								lineNumber++;
								tokenLineStartOffset = pos;
							}
						}
						if (!commentClosed) {
							pos++;
							scanError = 1;
						}
						value = text.substring(start, pos);
						return token = 13;
					}
					value += String.fromCharCode(code);
					pos++;
					return token = 16;
				}
				case 45:
					value += String.fromCharCode(code);
					pos++;
					if (pos === len || !isDigit(text.charCodeAt(pos))) return token = 16;
				case 48:
				case 49:
				case 50:
				case 51:
				case 52:
				case 53:
				case 54:
				case 55:
				case 56:
				case 57:
					value += scanNumber();
					return token = 11;
				default:
					while (pos < len && isUnknownContentCharacter(code)) {
						pos++;
						code = text.charCodeAt(pos);
					}
					if (tokenOffset !== pos) {
						value = text.substring(tokenOffset, pos);
						switch (value) {
							case "true": return token = 8;
							case "false": return token = 9;
							case "null": return token = 7;
						}
						return token = 16;
					}
					value += String.fromCharCode(code);
					pos++;
					return token = 16;
			}
		}
		function isUnknownContentCharacter(code) {
			if (isWhiteSpace(code) || isLineBreak(code)) return false;
			switch (code) {
				case 125:
				case 93:
				case 123:
				case 91:
				case 34:
				case 58:
				case 44:
				case 47: return false;
			}
			return true;
		}
		function scanNextNonTrivia() {
			let result;
			do
				result = scanNext();
			while (result >= 12 && result <= 15);
			return result;
		}
		return {
			setPosition,
			getPosition: () => pos,
			scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
			getToken: () => token,
			getTokenValue: () => value,
			getTokenOffset: () => tokenOffset,
			getTokenLength: () => pos - tokenOffset,
			getTokenStartLine: () => lineStartOffset,
			getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
			getTokenError: () => scanError
		};
	}
	function isWhiteSpace(ch) {
		return ch === 32 || ch === 9;
	}
	function isLineBreak(ch) {
		return ch === 10 || ch === 13;
	}
	function isDigit(ch) {
		return ch >= 48 && ch <= 57;
	}
	var CharacterCodes;
	(function(CharacterCodes) {
		CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
		CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
		CharacterCodes[CharacterCodes["space"] = 32] = "space";
		CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
		CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
		CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
		CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
		CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
		CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
		CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
		CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
		CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
		CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
		CharacterCodes[CharacterCodes["a"] = 97] = "a";
		CharacterCodes[CharacterCodes["b"] = 98] = "b";
		CharacterCodes[CharacterCodes["c"] = 99] = "c";
		CharacterCodes[CharacterCodes["d"] = 100] = "d";
		CharacterCodes[CharacterCodes["e"] = 101] = "e";
		CharacterCodes[CharacterCodes["f"] = 102] = "f";
		CharacterCodes[CharacterCodes["g"] = 103] = "g";
		CharacterCodes[CharacterCodes["h"] = 104] = "h";
		CharacterCodes[CharacterCodes["i"] = 105] = "i";
		CharacterCodes[CharacterCodes["j"] = 106] = "j";
		CharacterCodes[CharacterCodes["k"] = 107] = "k";
		CharacterCodes[CharacterCodes["l"] = 108] = "l";
		CharacterCodes[CharacterCodes["m"] = 109] = "m";
		CharacterCodes[CharacterCodes["n"] = 110] = "n";
		CharacterCodes[CharacterCodes["o"] = 111] = "o";
		CharacterCodes[CharacterCodes["p"] = 112] = "p";
		CharacterCodes[CharacterCodes["q"] = 113] = "q";
		CharacterCodes[CharacterCodes["r"] = 114] = "r";
		CharacterCodes[CharacterCodes["s"] = 115] = "s";
		CharacterCodes[CharacterCodes["t"] = 116] = "t";
		CharacterCodes[CharacterCodes["u"] = 117] = "u";
		CharacterCodes[CharacterCodes["v"] = 118] = "v";
		CharacterCodes[CharacterCodes["w"] = 119] = "w";
		CharacterCodes[CharacterCodes["x"] = 120] = "x";
		CharacterCodes[CharacterCodes["y"] = 121] = "y";
		CharacterCodes[CharacterCodes["z"] = 122] = "z";
		CharacterCodes[CharacterCodes["A"] = 65] = "A";
		CharacterCodes[CharacterCodes["B"] = 66] = "B";
		CharacterCodes[CharacterCodes["C"] = 67] = "C";
		CharacterCodes[CharacterCodes["D"] = 68] = "D";
		CharacterCodes[CharacterCodes["E"] = 69] = "E";
		CharacterCodes[CharacterCodes["F"] = 70] = "F";
		CharacterCodes[CharacterCodes["G"] = 71] = "G";
		CharacterCodes[CharacterCodes["H"] = 72] = "H";
		CharacterCodes[CharacterCodes["I"] = 73] = "I";
		CharacterCodes[CharacterCodes["J"] = 74] = "J";
		CharacterCodes[CharacterCodes["K"] = 75] = "K";
		CharacterCodes[CharacterCodes["L"] = 76] = "L";
		CharacterCodes[CharacterCodes["M"] = 77] = "M";
		CharacterCodes[CharacterCodes["N"] = 78] = "N";
		CharacterCodes[CharacterCodes["O"] = 79] = "O";
		CharacterCodes[CharacterCodes["P"] = 80] = "P";
		CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
		CharacterCodes[CharacterCodes["R"] = 82] = "R";
		CharacterCodes[CharacterCodes["S"] = 83] = "S";
		CharacterCodes[CharacterCodes["T"] = 84] = "T";
		CharacterCodes[CharacterCodes["U"] = 85] = "U";
		CharacterCodes[CharacterCodes["V"] = 86] = "V";
		CharacterCodes[CharacterCodes["W"] = 87] = "W";
		CharacterCodes[CharacterCodes["X"] = 88] = "X";
		CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
		CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
		CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
		CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
		CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
		CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
		CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
		CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
		CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
		CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
		CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
		CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
		CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
		CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
		CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
		CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
		CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
	})(CharacterCodes || (CharacterCodes = {}));
	//#endregion
	//#region node_modules/jsonc-parser/lib/esm/impl/string-intern.js
	var cachedSpaces = new Array(20).fill(0).map((_, index) => {
		return " ".repeat(index);
	});
	var maxCachedValues = 200;
	var cachedBreakLinesWithSpaces = {
		" ": {
			"\n": new Array(maxCachedValues).fill(0).map((_, index) => {
				return "\n" + " ".repeat(index);
			}),
			"\r": new Array(maxCachedValues).fill(0).map((_, index) => {
				return "\r" + " ".repeat(index);
			}),
			"\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
				return "\r\n" + " ".repeat(index);
			})
		},
		"	": {
			"\n": new Array(maxCachedValues).fill(0).map((_, index) => {
				return "\n" + "	".repeat(index);
			}),
			"\r": new Array(maxCachedValues).fill(0).map((_, index) => {
				return "\r" + "	".repeat(index);
			}),
			"\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
				return "\r\n" + "	".repeat(index);
			})
		}
	};
	var supportedEols = [
		"\n",
		"\r",
		"\r\n"
	];
	//#endregion
	//#region node_modules/jsonc-parser/lib/esm/impl/format.js
	function format$3(documentText, range, options) {
		let initialIndentLevel;
		let formatText;
		let formatTextStart;
		let rangeStart;
		let rangeEnd;
		if (range) {
			rangeStart = range.offset;
			rangeEnd = rangeStart + range.length;
			formatTextStart = rangeStart;
			while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) formatTextStart--;
			let endOffset = rangeEnd;
			while (endOffset < documentText.length && !isEOL(documentText, endOffset)) endOffset++;
			formatText = documentText.substring(formatTextStart, endOffset);
			initialIndentLevel = computeIndentLevel(formatText, options);
		} else {
			formatText = documentText;
			initialIndentLevel = 0;
			formatTextStart = 0;
			rangeStart = 0;
			rangeEnd = documentText.length;
		}
		const eol = getEOL(options, documentText);
		const eolFastPathSupported = supportedEols.includes(eol);
		let numberLineBreaks = 0;
		let indentLevel = 0;
		let indentValue;
		if (options.insertSpaces) indentValue = cachedSpaces[options.tabSize || 4] ?? repeat(cachedSpaces[1], options.tabSize || 4);
		else indentValue = "	";
		const indentType = indentValue === "	" ? "	" : " ";
		let scanner = createScanner$1(formatText, false);
		let hasError = false;
		function newLinesAndIndent() {
			if (numberLineBreaks > 1) return repeat(eol, numberLineBreaks) + repeat(indentValue, initialIndentLevel + indentLevel);
			const amountOfSpaces = indentValue.length * (initialIndentLevel + indentLevel);
			if (!eolFastPathSupported || amountOfSpaces > cachedBreakLinesWithSpaces[indentType][eol].length) return eol + repeat(indentValue, initialIndentLevel + indentLevel);
			if (amountOfSpaces <= 0) return eol;
			return cachedBreakLinesWithSpaces[indentType][eol][amountOfSpaces];
		}
		function scanNext() {
			let token = scanner.scan();
			numberLineBreaks = 0;
			while (token === 15 || token === 14) {
				if (token === 14 && options.keepLines) numberLineBreaks += 1;
				else if (token === 14) numberLineBreaks = 1;
				token = scanner.scan();
			}
			hasError = token === 16 || scanner.getTokenError() !== 0;
			return token;
		}
		const editOperations = [];
		function addEdit(text, startOffset, endOffset) {
			if (!hasError && (!range || startOffset < rangeEnd && endOffset > rangeStart) && documentText.substring(startOffset, endOffset) !== text) editOperations.push({
				offset: startOffset,
				length: endOffset - startOffset,
				content: text
			});
		}
		let firstToken = scanNext();
		if (options.keepLines && numberLineBreaks > 0) addEdit(repeat(eol, numberLineBreaks), 0, 0);
		if (firstToken !== 17) {
			let firstTokenStart = scanner.getTokenOffset() + formatTextStart;
			addEdit(indentValue.length * initialIndentLevel < 20 && options.insertSpaces ? cachedSpaces[indentValue.length * initialIndentLevel] : repeat(indentValue, initialIndentLevel), formatTextStart, firstTokenStart);
		}
		while (firstToken !== 17) {
			let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
			let secondToken = scanNext();
			let replaceContent = "";
			let needsLineBreak = false;
			while (numberLineBreaks === 0 && (secondToken === 12 || secondToken === 13)) {
				let commentTokenStart = scanner.getTokenOffset() + formatTextStart;
				addEdit(cachedSpaces[1], firstTokenEnd, commentTokenStart);
				firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
				needsLineBreak = secondToken === 12;
				replaceContent = needsLineBreak ? newLinesAndIndent() : "";
				secondToken = scanNext();
			}
			if (secondToken === 2) {
				if (firstToken !== 1) indentLevel--;
				if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 1) replaceContent = newLinesAndIndent();
				else if (options.keepLines) replaceContent = cachedSpaces[1];
			} else if (secondToken === 4) {
				if (firstToken !== 3) indentLevel--;
				if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 3) replaceContent = newLinesAndIndent();
				else if (options.keepLines) replaceContent = cachedSpaces[1];
			} else {
				switch (firstToken) {
					case 3:
					case 1:
						indentLevel++;
						if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) replaceContent = newLinesAndIndent();
						else replaceContent = cachedSpaces[1];
						break;
					case 5:
						if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) replaceContent = newLinesAndIndent();
						else replaceContent = cachedSpaces[1];
						break;
					case 12:
						replaceContent = newLinesAndIndent();
						break;
					case 13:
						if (numberLineBreaks > 0) replaceContent = newLinesAndIndent();
						else if (!needsLineBreak) replaceContent = cachedSpaces[1];
						break;
					case 6:
						if (options.keepLines && numberLineBreaks > 0) replaceContent = newLinesAndIndent();
						else if (!needsLineBreak) replaceContent = cachedSpaces[1];
						break;
					case 10:
						if (options.keepLines && numberLineBreaks > 0) replaceContent = newLinesAndIndent();
						else if (secondToken === 6 && !needsLineBreak) replaceContent = "";
						break;
					case 7:
					case 8:
					case 9:
					case 11:
					case 2:
					case 4:
						if (options.keepLines && numberLineBreaks > 0) replaceContent = newLinesAndIndent();
						else if ((secondToken === 12 || secondToken === 13) && !needsLineBreak) replaceContent = cachedSpaces[1];
						else if (secondToken !== 5 && secondToken !== 17) hasError = true;
						break;
					case 16:
						hasError = true;
						break;
				}
				if (numberLineBreaks > 0 && (secondToken === 12 || secondToken === 13)) replaceContent = newLinesAndIndent();
			}
			if (secondToken === 17) if (options.keepLines && numberLineBreaks > 0) replaceContent = newLinesAndIndent();
			else replaceContent = options.insertFinalNewline ? eol : "";
			const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
			addEdit(replaceContent, firstTokenEnd, secondTokenStart);
			firstToken = secondToken;
		}
		return editOperations;
	}
	function repeat(s, count) {
		let result = "";
		for (let i = 0; i < count; i++) result += s;
		return result;
	}
	function computeIndentLevel(content, options) {
		let i = 0;
		let nChars = 0;
		const tabSize = options.tabSize || 4;
		while (i < content.length) {
			let ch = content.charAt(i);
			if (ch === cachedSpaces[1]) nChars++;
			else if (ch === "	") nChars += tabSize;
			else break;
			i++;
		}
		return Math.floor(nChars / tabSize);
	}
	function getEOL(options, text) {
		for (let i = 0; i < text.length; i++) {
			const ch = text.charAt(i);
			if (ch === "\r") {
				if (i + 1 < text.length && text.charAt(i + 1) === "\n") return "\r\n";
				return "\r";
			} else if (ch === "\n") return "\n";
		}
		return options && options.eol || "\n";
	}
	function isEOL(text, offset) {
		return "\r\n".indexOf(text.charAt(offset)) !== -1;
	}
	//#endregion
	//#region node_modules/jsonc-parser/lib/esm/impl/parser.js
	var ParseOptionsConfigs;
	(function(ParseOptionsConfigs) {
		ParseOptionsConfigs.DEFAULT = { allowTrailingComma: false };
	})(ParseOptionsConfigs || (ParseOptionsConfigs = {}));
	/**
	* Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
	* Therefore always check the errors list to find out if the input was valid.
	*/
	function parse$2(text, errors = [], options = ParseOptionsConfigs.DEFAULT) {
		let currentProperty = null;
		let currentParent = [];
		const previousParents = [];
		function onValue(value) {
			if (Array.isArray(currentParent)) currentParent.push(value);
			else if (currentProperty !== null) currentParent[currentProperty] = value;
		}
		visit(text, {
			onObjectBegin: () => {
				const object = {};
				onValue(object);
				previousParents.push(currentParent);
				currentParent = object;
				currentProperty = null;
			},
			onObjectProperty: (name) => {
				currentProperty = name;
			},
			onObjectEnd: () => {
				currentParent = previousParents.pop();
			},
			onArrayBegin: () => {
				const array = [];
				onValue(array);
				previousParents.push(currentParent);
				currentParent = array;
				currentProperty = null;
			},
			onArrayEnd: () => {
				currentParent = previousParents.pop();
			},
			onLiteralValue: onValue,
			onError: (error, offset, length, startLine, startCharacter) => {
				errors.push({
					error,
					offset,
					length,
					startLine,
					startCharacter
				});
			}
		}, options);
		return currentParent[0];
	}
	/**
	* Gets the JSON path of the given JSON DOM node
	*/
	function getNodePath$2(node) {
		if (!node.parent || !node.parent.children) return [];
		const path = getNodePath$2(node.parent);
		if (node.parent.type === "property") {
			const key = node.parent.children[0].value;
			path.push(key);
		} else if (node.parent.type === "array") {
			const index = node.parent.children.indexOf(node);
			if (index !== -1) path.push(index);
		}
		return path;
	}
	/**
	* Evaluates the JavaScript object of the given JSON DOM node
	*/
	function getNodeValue$2(node) {
		switch (node.type) {
			case "array": return node.children.map(getNodeValue$2);
			case "object": {
				const obj = Object.create(null);
				for (let prop of node.children) {
					const valueNode = prop.children[1];
					if (valueNode) obj[prop.children[0].value] = getNodeValue$2(valueNode);
				}
				return obj;
			}
			case "null":
			case "string":
			case "number":
			case "boolean": return node.value;
			default: return;
		}
	}
	function contains$1(node, offset, includeRightBound = false) {
		return offset >= node.offset && offset < node.offset + node.length || includeRightBound && offset === node.offset + node.length;
	}
	/**
	* Finds the most inner node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
	*/
	function findNodeAtOffset$1(node, offset, includeRightBound = false) {
		if (contains$1(node, offset, includeRightBound)) {
			const children = node.children;
			if (Array.isArray(children)) for (let i = 0; i < children.length && children[i].offset <= offset; i++) {
				const item = findNodeAtOffset$1(children[i], offset, includeRightBound);
				if (item) return item;
			}
			return node;
		}
	}
	/**
	* Parses the given text and invokes the visitor functions for each object, array and literal reached.
	*/
	function visit(text, visitor, options = ParseOptionsConfigs.DEFAULT) {
		const _scanner = createScanner$1(text, false);
		const _jsonPath = [];
		let suppressedCallbacks = 0;
		function toNoArgVisit(visitFunction) {
			return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
		}
		function toOneArgVisit(visitFunction) {
			return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
		}
		function toOneArgVisitWithPath(visitFunction) {
			return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
		}
		function toBeginVisit(visitFunction) {
			return visitFunction ? () => {
				if (suppressedCallbacks > 0) suppressedCallbacks++;
				else if (visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) === false) suppressedCallbacks = 1;
			} : () => true;
		}
		function toEndVisit(visitFunction) {
			return visitFunction ? () => {
				if (suppressedCallbacks > 0) suppressedCallbacks--;
				if (suppressedCallbacks === 0) visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
			} : () => true;
		}
		const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
		const disallowComments = options && options.disallowComments;
		const allowTrailingComma = options && options.allowTrailingComma;
		function scanNext() {
			while (true) {
				const token = _scanner.scan();
				switch (_scanner.getTokenError()) {
					case 4:
						handleError(14);
						break;
					case 5:
						handleError(15);
						break;
					case 3:
						handleError(13);
						break;
					case 1:
						if (!disallowComments) handleError(11);
						break;
					case 2:
						handleError(12);
						break;
					case 6:
						handleError(16);
						break;
				}
				switch (token) {
					case 12:
					case 13:
						if (disallowComments) handleError(10);
						else onComment();
						break;
					case 16:
						handleError(1);
						break;
					case 15:
					case 14: break;
					default: return token;
				}
			}
		}
		function handleError(error, skipUntilAfter = [], skipUntil = []) {
			onError(error);
			if (skipUntilAfter.length + skipUntil.length > 0) {
				let token = _scanner.getToken();
				while (token !== 17) {
					if (skipUntilAfter.indexOf(token) !== -1) {
						scanNext();
						break;
					} else if (skipUntil.indexOf(token) !== -1) break;
					token = scanNext();
				}
			}
		}
		function parseString(isValue) {
			const value = _scanner.getTokenValue();
			if (isValue) onLiteralValue(value);
			else {
				onObjectProperty(value);
				_jsonPath.push(value);
			}
			scanNext();
			return true;
		}
		function parseLiteral() {
			switch (_scanner.getToken()) {
				case 11:
					{
						const tokenValue = _scanner.getTokenValue();
						let value = Number(tokenValue);
						if (isNaN(value)) {
							handleError(2);
							value = 0;
						}
						onLiteralValue(value);
					}
					break;
				case 7:
					onLiteralValue(null);
					break;
				case 8:
					onLiteralValue(true);
					break;
				case 9:
					onLiteralValue(false);
					break;
				default: return false;
			}
			scanNext();
			return true;
		}
		function parseProperty() {
			if (_scanner.getToken() !== 10) {
				handleError(3, [], [2, 5]);
				return false;
			}
			parseString(false);
			if (_scanner.getToken() === 6) {
				onSeparator(":");
				scanNext();
				if (!parseValue()) handleError(4, [], [2, 5]);
			} else handleError(5, [], [2, 5]);
			_jsonPath.pop();
			return true;
		}
		function parseObject() {
			onObjectBegin();
			scanNext();
			let needsComma = false;
			while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
				if (_scanner.getToken() === 5) {
					if (!needsComma) handleError(4, [], []);
					onSeparator(",");
					scanNext();
					if (_scanner.getToken() === 2 && allowTrailingComma) break;
				} else if (needsComma) handleError(6, [], []);
				if (!parseProperty()) handleError(4, [], [2, 5]);
				needsComma = true;
			}
			onObjectEnd();
			if (_scanner.getToken() !== 2) handleError(7, [2], []);
			else scanNext();
			return true;
		}
		function parseArray() {
			onArrayBegin();
			scanNext();
			let isFirstElement = true;
			let needsComma = false;
			while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
				if (_scanner.getToken() === 5) {
					if (!needsComma) handleError(4, [], []);
					onSeparator(",");
					scanNext();
					if (_scanner.getToken() === 4 && allowTrailingComma) break;
				} else if (needsComma) handleError(6, [], []);
				if (isFirstElement) {
					_jsonPath.push(0);
					isFirstElement = false;
				} else _jsonPath[_jsonPath.length - 1]++;
				if (!parseValue()) handleError(4, [], [4, 5]);
				needsComma = true;
			}
			onArrayEnd();
			if (!isFirstElement) _jsonPath.pop();
			if (_scanner.getToken() !== 4) handleError(8, [4], []);
			else scanNext();
			return true;
		}
		function parseValue() {
			switch (_scanner.getToken()) {
				case 3: return parseArray();
				case 1: return parseObject();
				case 10: return parseString(true);
				default: return parseLiteral();
			}
		}
		scanNext();
		if (_scanner.getToken() === 17) {
			if (options.allowEmptyContent) return true;
			handleError(4, [], []);
			return false;
		}
		if (!parseValue()) {
			handleError(4, [], []);
			return false;
		}
		if (_scanner.getToken() !== 17) handleError(9, [], []);
		return true;
	}
	//#endregion
	//#region node_modules/jsonc-parser/lib/esm/main.js
	/**
	* Creates a JSON scanner on the given text.
	* If ignoreTrivia is set, whitespaces or comments are ignored.
	*/
	var createScanner = createScanner$1;
	var ScanError;
	(function(ScanError) {
		ScanError[ScanError["None"] = 0] = "None";
		ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
		ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
		ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
		ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
		ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
		ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
	})(ScanError || (ScanError = {}));
	var SyntaxKind;
	(function(SyntaxKind) {
		SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
		SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
		SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
		SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
		SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
		SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
		SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
		SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
		SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
		SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
		SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
		SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
		SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
		SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
		SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
		SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
		SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
	})(SyntaxKind || (SyntaxKind = {}));
	/**
	* Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
	* Therefore, always check the errors list to find out if the input was valid.
	*/
	var parse$1 = parse$2;
	/**
	* Finds the innermost node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
	*/
	var findNodeAtOffset = findNodeAtOffset$1;
	/**
	* Gets the JSON path of the given JSON DOM node
	*/
	var getNodePath$1 = getNodePath$2;
	/**
	* Evaluates the JavaScript object of the given JSON DOM node
	*/
	var getNodeValue$1 = getNodeValue$2;
	var ParseErrorCode;
	(function(ParseErrorCode) {
		ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
		ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
		ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
		ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
		ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
		ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
		ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
		ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
		ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
		ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
		ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
		ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
		ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
		ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
		ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
		ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
	})(ParseErrorCode || (ParseErrorCode = {}));
	/**
	* Computes the edit operations needed to format a JSON document.
	*
	* @param documentText The input text
	* @param range The range to format or `undefined` to format the full content
	* @param options The formatting options
	* @returns The edit operations describing the formatting changes to the original document following the format described in {@linkcode EditResult}.
	* To apply the edit operations to the input, use {@linkcode applyEdits}.
	*/
	function format$2(documentText, range, options) {
		return format$3(documentText, range, options);
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/node_modules/vscode-languageserver-types/lib/esm/main.js
	var DocumentUri;
	(function(DocumentUri) {
		function is(value) {
			return typeof value === "string";
		}
		DocumentUri.is = is;
	})(DocumentUri || (DocumentUri = {}));
	var URI;
	(function(URI) {
		function is(value) {
			return typeof value === "string";
		}
		URI.is = is;
	})(URI || (URI = {}));
	var integer;
	(function(integer) {
		integer.MIN_VALUE = -2147483648;
		integer.MAX_VALUE = 2147483647;
		function is(value) {
			return typeof value === "number" && integer.MIN_VALUE <= value && value <= integer.MAX_VALUE;
		}
		integer.is = is;
	})(integer || (integer = {}));
	var uinteger;
	(function(uinteger) {
		uinteger.MIN_VALUE = 0;
		uinteger.MAX_VALUE = 2147483647;
		function is(value) {
			return typeof value === "number" && uinteger.MIN_VALUE <= value && value <= uinteger.MAX_VALUE;
		}
		uinteger.is = is;
	})(uinteger || (uinteger = {}));
	/**
	* The Position namespace provides helper functions to work with
	* {@link Position} literals.
	*/
	var Position;
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
			const candidate = value;
			return Is.objectLiteral(candidate) && Is.uinteger(candidate.line) && Is.uinteger(candidate.character);
		}
		Position.is = is;
	})(Position || (Position = {}));
	/**
	* The Range namespace provides helper functions to work with
	* {@link Range} literals.
	*/
	var Range;
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
			const candidate = value;
			return Is.objectLiteral(candidate) && Position.is(candidate.start) && Position.is(candidate.end);
		}
		Range.is = is;
	})(Range || (Range = {}));
	/**
	* The Location namespace provides helper functions to work with
	* {@link Location} literals.
	*/
	var Location;
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
			const candidate = value;
			return Is.objectLiteral(candidate) && Range.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
		}
		Location.is = is;
	})(Location || (Location = {}));
	/**
	* The LocationLink namespace provides helper functions to work with
	* {@link LocationLink} literals.
	*/
	var LocationLink;
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
			const candidate = value;
			return Is.objectLiteral(candidate) && Range.is(candidate.targetRange) && Is.string(candidate.targetUri) && Range.is(candidate.targetSelectionRange) && (Range.is(candidate.originSelectionRange) || Is.undefined(candidate.originSelectionRange));
		}
		LocationLink.is = is;
	})(LocationLink || (LocationLink = {}));
	/**
	* The Color namespace provides helper functions to work with
	* {@link Color} literals.
	*/
	var Color;
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
	/**
	* The ColorInformation namespace provides helper functions to work with
	* {@link ColorInformation} literals.
	*/
	var ColorInformation;
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
	/**
	* The Color namespace provides helper functions to work with
	* {@link ColorPresentation} literals.
	*/
	var ColorPresentation;
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
	/**
	* A set of predefined range kinds.
	*/
	var FoldingRangeKind;
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
	/**
	* The folding range namespace provides helper functions to work with
	* {@link FoldingRange} literals.
	*/
	var FoldingRange;
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
	/**
	* The DiagnosticRelatedInformation namespace provides helper functions to work with
	* {@link DiagnosticRelatedInformation} literals.
	*/
	var DiagnosticRelatedInformation;
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
			const candidate = value;
			return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
		}
		DiagnosticRelatedInformation.is = is;
	})(DiagnosticRelatedInformation || (DiagnosticRelatedInformation = {}));
	/**
	* The diagnostic's severity.
	*/
	var DiagnosticSeverity$1;
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
	/**
	* The diagnostic tags.
	*
	* @since 3.15.0
	*/
	var DiagnosticTag;
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
	/**
	* The CodeDescription namespace provides functions to deal with descriptions for diagnostic codes.
	*
	* @since 3.16.0
	*/
	var CodeDescription;
	(function(CodeDescription) {
		function is(value) {
			const candidate = value;
			return Is.objectLiteral(candidate) && Is.string(candidate.href);
		}
		CodeDescription.is = is;
	})(CodeDescription || (CodeDescription = {}));
	/**
	* The Diagnostic namespace provides helper functions to work with
	* {@link Diagnostic} literals.
	*/
	var Diagnostic;
	(function(Diagnostic) {
		/**
		* Creates a new Diagnostic literal.
		*/
		function create(range, message, severity, code, source, relatedInformation) {
			const result = {
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
			const candidate = value;
			return Is.defined(candidate) && Range.is(candidate.range) && (Is.string(candidate.message) || MarkupContent$1.is(candidate.message)) && (Is.number(candidate.severity) || Is.undefined(candidate.severity)) && (Is.integer(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code)) && (Is.undefined(candidate.codeDescription) || Is.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)) && (Is.string(candidate.source) || Is.undefined(candidate.source)) && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
		}
		Diagnostic.is = is;
		/**
		* Checks whether the given diagnostic's message conforms to the 3.17.0
		* version of the protocol where the message is a string.
		*
		* @param value the diagnostic
		* @returns true if the diagnostic's message is a string, false otherwise.
		*/
		function is3_17(value) {
			return Is.string(value.message);
		}
		Diagnostic.is3_17 = is3_17;
		/**
		* Gets the message string of a diagnostic. If the message is already a
		* string, it is returned as is. If the message is a MarkupContent,
		* the value of the MarkupContent is returned. Otherwise an error is thrown.
		*
		* @param diagnostic the diagnostic to get the message string from.
		* @returns the message string of the given diagnostic.
		*/
		function getMessageString(diagnostic) {
			if (Is.string(diagnostic.message)) return diagnostic.message;
			else if (MarkupContent$1.is(diagnostic.message)) return diagnostic.message.value;
			else throw new Error(`Unknown message type ${typeof diagnostic.message}`);
		}
		Diagnostic.getMessageString = getMessageString;
	})(Diagnostic || (Diagnostic = {}));
	/**
	* The Command namespace provides helper functions to work with
	* {@link Command} literals.
	*/
	var Command;
	(function(Command) {
		/**
		* Creates a new Command literal.
		*/
		function create(title, command, ...args) {
			const result = {
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
			const candidate = value;
			return Is.defined(candidate) && Is.string(candidate.title) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip)) && Is.string(candidate.command);
		}
		Command.is = is;
	})(Command || (Command = {}));
	/**
	* The TextEdit namespace provides helper function to create replace,
	* insert and delete edits more easily.
	*/
	var TextEdit;
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
	var ChangeAnnotation;
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
	var ChangeAnnotationIdentifier;
	(function(ChangeAnnotationIdentifier) {
		function is(value) {
			const candidate = value;
			return Is.string(candidate);
		}
		ChangeAnnotationIdentifier.is = is;
	})(ChangeAnnotationIdentifier || (ChangeAnnotationIdentifier = {}));
	var AnnotatedTextEdit;
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
	/**
	* The TextDocumentEdit namespace provides helper function to create
	* an edit that manipulates a text document.
	*/
	var TextDocumentEdit;
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
			const candidate = value;
			return Is.defined(candidate) && OptionalVersionedTextDocumentIdentifier.is(candidate.textDocument) && Array.isArray(candidate.edits);
		}
		TextDocumentEdit.is = is;
	})(TextDocumentEdit || (TextDocumentEdit = {}));
	var CreateFile;
	(function(CreateFile) {
		function create(uri, options, annotation) {
			const result = {
				kind: "create",
				uri
			};
			if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) result.options = options;
			if (annotation !== void 0) result.annotationId = annotation;
			return result;
		}
		CreateFile.create = create;
		function is(value) {
			const candidate = value;
			return candidate && candidate.kind === "create" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
		}
		CreateFile.is = is;
	})(CreateFile || (CreateFile = {}));
	var RenameFile;
	(function(RenameFile) {
		function create(oldUri, newUri, options, annotation) {
			const result = {
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
			const candidate = value;
			return candidate && candidate.kind === "rename" && Is.string(candidate.oldUri) && Is.string(candidate.newUri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
		}
		RenameFile.is = is;
	})(RenameFile || (RenameFile = {}));
	var DeleteFile;
	(function(DeleteFile) {
		function create(uri, options, annotation) {
			const result = {
				kind: "delete",
				uri
			};
			if (options !== void 0 && (options.recursive !== void 0 || options.ignoreIfNotExists !== void 0)) result.options = options;
			if (annotation !== void 0) result.annotationId = annotation;
			return result;
		}
		DeleteFile.create = create;
		function is(value) {
			const candidate = value;
			return candidate && candidate.kind === "delete" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.recursive === void 0 || Is.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === void 0 || Is.boolean(candidate.options.ignoreIfNotExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
		}
		DeleteFile.is = is;
	})(DeleteFile || (DeleteFile = {}));
	var WorkspaceEdit;
	(function(WorkspaceEdit) {
		function is(value) {
			const candidate = value;
			return candidate && (candidate.changes !== void 0 || candidate.documentChanges !== void 0) && (candidate.documentChanges === void 0 || candidate.documentChanges.every((change) => {
				if (Is.string(change.kind)) return CreateFile.is(change) || RenameFile.is(change) || DeleteFile.is(change);
				else return TextDocumentEdit.is(change);
			}));
		}
		WorkspaceEdit.is = is;
	})(WorkspaceEdit || (WorkspaceEdit = {}));
	var SnippetTextEdit;
	(function(SnippetTextEdit) {
		function is(value) {
			const candidate = value;
			return Is.objectLiteral(candidate) && Range.is(candidate.range) && StringValue.isSnippet(candidate.snippet) && (candidate.annotationId === void 0 || ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId));
		}
		SnippetTextEdit.is = is;
	})(SnippetTextEdit || (SnippetTextEdit = {}));
	/**
	* The TextDocumentIdentifier namespace provides helper functions to work with
	* {@link TextDocumentIdentifier} literals.
	*/
	var TextDocumentIdentifier;
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
			const candidate = value;
			return Is.defined(candidate) && Is.string(candidate.uri);
		}
		TextDocumentIdentifier.is = is;
	})(TextDocumentIdentifier || (TextDocumentIdentifier = {}));
	/**
	* The VersionedTextDocumentIdentifier namespace provides helper functions to work with
	* {@link VersionedTextDocumentIdentifier} literals.
	*/
	var VersionedTextDocumentIdentifier;
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
			const candidate = value;
			return Is.defined(candidate) && Is.string(candidate.uri) && Is.integer(candidate.version);
		}
		VersionedTextDocumentIdentifier.is = is;
	})(VersionedTextDocumentIdentifier || (VersionedTextDocumentIdentifier = {}));
	/**
	* The OptionalVersionedTextDocumentIdentifier namespace provides helper functions to work with
	* {@link OptionalVersionedTextDocumentIdentifier} literals.
	*/
	var OptionalVersionedTextDocumentIdentifier;
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
			const candidate = value;
			return Is.defined(candidate) && Is.string(candidate.uri) && (candidate.version === null || Is.integer(candidate.version));
		}
		OptionalVersionedTextDocumentIdentifier.is = is;
	})(OptionalVersionedTextDocumentIdentifier || (OptionalVersionedTextDocumentIdentifier = {}));
	/**
	* Predefined Language kinds
	* @since 3.18.0
	*/
	var LanguageKind;
	(function(LanguageKind) {
		LanguageKind.ABAP = "abap";
		LanguageKind.WindowsBat = "bat";
		LanguageKind.BibTeX = "bibtex";
		LanguageKind.Clojure = "clojure";
		LanguageKind.Coffeescript = "coffeescript";
		LanguageKind.C = "c";
		LanguageKind.CPP = "cpp";
		LanguageKind.CSharp = "csharp";
		LanguageKind.CSS = "css";
		/**
		* @since 3.18.0
		*/
		LanguageKind.D = "d";
		/**
		* @since 3.18.0
		*/
		LanguageKind.Delphi = "pascal";
		LanguageKind.Diff = "diff";
		LanguageKind.Dart = "dart";
		LanguageKind.Dockerfile = "dockerfile";
		LanguageKind.Elixir = "elixir";
		LanguageKind.Erlang = "erlang";
		LanguageKind.FSharp = "fsharp";
		LanguageKind.GitCommit = "git-commit";
		LanguageKind.GitRebase = "git-rebase";
		LanguageKind.Go = "go";
		LanguageKind.Groovy = "groovy";
		LanguageKind.Handlebars = "handlebars";
		LanguageKind.Haskell = "haskell";
		LanguageKind.HTML = "html";
		LanguageKind.Ini = "ini";
		LanguageKind.Java = "java";
		LanguageKind.JavaScript = "javascript";
		LanguageKind.JavaScriptReact = "javascriptreact";
		LanguageKind.JSON = "json";
		LanguageKind.LaTeX = "latex";
		LanguageKind.Less = "less";
		LanguageKind.Lua = "lua";
		LanguageKind.Makefile = "makefile";
		LanguageKind.Markdown = "markdown";
		LanguageKind.ObjectiveC = "objective-c";
		LanguageKind.ObjectiveCPP = "objective-cpp";
		/**
		* @since 3.18.0
		*/
		LanguageKind.Pascal = "pascal";
		LanguageKind.Perl = "perl";
		LanguageKind.Perl6 = "perl6";
		LanguageKind.PHP = "php";
		LanguageKind.Plaintext = "plaintext";
		LanguageKind.Powershell = "powershell";
		LanguageKind.Pug = "jade";
		LanguageKind.Python = "python";
		LanguageKind.R = "r";
		LanguageKind.Razor = "razor";
		LanguageKind.Ruby = "ruby";
		LanguageKind.Rust = "rust";
		LanguageKind.SCSS = "scss";
		LanguageKind.SASS = "sass";
		LanguageKind.Scala = "scala";
		LanguageKind.ShaderLab = "shaderlab";
		LanguageKind.ShellScript = "shellscript";
		LanguageKind.SQL = "sql";
		LanguageKind.Swift = "swift";
		LanguageKind.TypeScript = "typescript";
		LanguageKind.TypeScriptReact = "typescriptreact";
		LanguageKind.TeX = "tex";
		LanguageKind.VisualBasic = "vb";
		LanguageKind.XML = "xml";
		LanguageKind.XSL = "xsl";
		LanguageKind.YAML = "yaml";
	})(LanguageKind || (LanguageKind = {}));
	/**
	* The TextDocumentItem namespace provides helper functions to work with
	* {@link TextDocumentItem} literals.
	*/
	var TextDocumentItem;
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
			const candidate = value;
			return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.integer(candidate.version) && Is.string(candidate.text);
		}
		TextDocumentItem.is = is;
	})(TextDocumentItem || (TextDocumentItem = {}));
	/**
	* Describes the content type that a client supports in various
	* result literals like `Hover`, `ParameterInfo` or `CompletionItem`.
	*
	* Please note that `MarkupKinds` must not start with a `$`. This kinds
	* are reserved for internal usage.
	*/
	var MarkupKind;
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
	var MarkupContent$1;
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
	/**
	* The kind of a completion entry.
	*/
	var CompletionItemKind$2;
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
	/**
	* Defines whether the insert text in a completion item should be interpreted as
	* plain text or a snippet.
	*/
	var InsertTextFormat$1;
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
	/**
	* Completion item tags are extra annotations that tweak the rendering of a completion
	* item.
	*
	* @since 3.15.0
	*/
	var CompletionItemTag;
	(function(CompletionItemTag) {
		/**
		* Render a completion as obsolete, usually using a strike-out.
		*/
		CompletionItemTag.Deprecated = 1;
	})(CompletionItemTag || (CompletionItemTag = {}));
	/**
	* The InsertReplaceEdit namespace provides functions to deal with insert / replace edits.
	*
	* @since 3.16.0
	*/
	var InsertReplaceEdit;
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
	/**
	* How whitespace and indentation is handled during completion
	* item insertion.
	*
	* @since 3.16.0
	*/
	var InsertTextMode;
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
	/**
	* Defines how values from a set of defaults and an individual item will be
	* merged.
	*
	* @since 3.18.0
	*/
	var ApplyKind;
	(function(ApplyKind) {
		/**
		* The value from the individual item (if provided and not `null`) will be
		* used instead of the default.
		*/
		ApplyKind.Replace = 1;
		/**
		* The value from the item will be merged with the default.
		*
		* The specific rules for mergeing values are defined against each field
		* that supports merging.
		*/
		ApplyKind.Merge = 2;
	})(ApplyKind || (ApplyKind = {}));
	var CompletionItemLabelDetails;
	(function(CompletionItemLabelDetails) {
		function is(value) {
			const candidate = value;
			return candidate && (Is.string(candidate.detail) || candidate.detail === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
		}
		CompletionItemLabelDetails.is = is;
	})(CompletionItemLabelDetails || (CompletionItemLabelDetails = {}));
	/**
	* The CompletionItem namespace provides functions to deal with
	* completion items.
	*/
	var CompletionItem;
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
	/**
	* The CompletionList namespace provides functions to deal with
	* completion lists.
	*/
	var CompletionList;
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
	var MarkedString$1;
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
	var Hover;
	(function(Hover) {
		/**
		* Checks whether the given value conforms to the {@link Hover} interface.
		*/
		function is(value) {
			const candidate = value;
			return !!candidate && Is.objectLiteral(candidate) && (MarkupContent$1.is(candidate.contents) || MarkedString$1.is(candidate.contents) || Is.typedArray(candidate.contents, MarkedString$1.is)) && (value.range === void 0 || Range.is(value.range));
		}
		Hover.is = is;
	})(Hover || (Hover = {}));
	/**
	* The ParameterInformation namespace provides helper functions to work with
	* {@link ParameterInformation} literals.
	*/
	var ParameterInformation;
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
	/**
	* The SignatureInformation namespace provides helper functions to work with
	* {@link SignatureInformation} literals.
	*/
	var SignatureInformation;
	(function(SignatureInformation) {
		function create(label, documentation, ...parameters) {
			const result = { label };
			if (Is.defined(documentation)) result.documentation = documentation;
			if (Is.defined(parameters)) result.parameters = parameters;
			else result.parameters = [];
			return result;
		}
		SignatureInformation.create = create;
	})(SignatureInformation || (SignatureInformation = {}));
	/**
	* A document highlight kind.
	*/
	var DocumentHighlightKind;
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
	/**
	* DocumentHighlight namespace to provide helper functions to work with
	* {@link DocumentHighlight} literals.
	*/
	var DocumentHighlight;
	(function(DocumentHighlight) {
		/**
		* Create a DocumentHighlight object.
		* @param range The range the highlight applies to.
		* @param kind The highlight kind
		*/
		function create(range, kind) {
			const result = { range };
			if (Is.number(kind)) result.kind = kind;
			return result;
		}
		DocumentHighlight.create = create;
	})(DocumentHighlight || (DocumentHighlight = {}));
	/**
	* A symbol kind.
	*/
	var SymbolKind;
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
	/**
	* Symbol tags are extra annotations that tweak the rendering of a symbol.
	*
	* @since 3.16
	*/
	var SymbolTag;
	(function(SymbolTag) {
		/**
		* Render a symbol as obsolete, usually using a strike-out.
		*/
		SymbolTag.Deprecated = 1;
	})(SymbolTag || (SymbolTag = {}));
	var SymbolInformation;
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
			const result = {
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
	var WorkspaceSymbol;
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
	var DocumentSymbol;
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
			const result = {
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
			const candidate = value;
			return candidate && Is.string(candidate.name) && Is.number(candidate.kind) && Range.is(candidate.range) && Range.is(candidate.selectionRange) && (candidate.detail === void 0 || Is.string(candidate.detail)) && (candidate.deprecated === void 0 || Is.boolean(candidate.deprecated)) && (candidate.children === void 0 || Array.isArray(candidate.children)) && (candidate.tags === void 0 || Array.isArray(candidate.tags));
		}
		DocumentSymbol.is = is;
	})(DocumentSymbol || (DocumentSymbol = {}));
	/**
	* A set of predefined code action kinds
	*/
	var CodeActionKind;
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
		* Base kind for refactoring move actions: `refactor.move`
		*
		* Example move actions:
		*
		* - Move a function to a new file
		* - Move a property between classes
		* - Move method to base class
		* - ...
		*
		* @since 3.18.0
		*/
		CodeActionKind.RefactorMove = "refactor.move";
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
		/**
		* Base kind for all code actions applying to the entire notebook's scope. CodeActionKinds using
		* this should always begin with `notebook.`
		*
		* @since 3.18.0
		*/
		CodeActionKind.Notebook = "notebook";
	})(CodeActionKind || (CodeActionKind = {}));
	/**
	* The reason why code actions were requested.
	*
	* @since 3.17.0
	*/
	var CodeActionTriggerKind;
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
	/**
	* The CodeActionContext namespace provides helper functions to work with
	* {@link CodeActionContext} literals.
	*/
	var CodeActionContext;
	(function(CodeActionContext) {
		/**
		* Creates a new CodeActionContext literal.
		*/
		function create(diagnostics, only, triggerKind) {
			const result = { diagnostics };
			if (only !== void 0 && only !== null) result.only = only;
			if (triggerKind !== void 0 && triggerKind !== null) result.triggerKind = triggerKind;
			return result;
		}
		CodeActionContext.create = create;
		/**
		* Checks whether the given literal conforms to the {@link CodeActionContext} interface.
		*/
		function is(value) {
			const candidate = value;
			return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is) && (candidate.only === void 0 || Is.typedArray(candidate.only, Is.string)) && (candidate.triggerKind === void 0 || candidate.triggerKind === CodeActionTriggerKind.Invoked || candidate.triggerKind === CodeActionTriggerKind.Automatic);
		}
		CodeActionContext.is = is;
	})(CodeActionContext || (CodeActionContext = {}));
	/**
	* Code action tags are extra annotations that tweak the behavior of a code action.
	*
	* @since 3.18.0
	*/
	var CodeActionTag;
	(function(CodeActionTag) {
		/**
		* Marks the code action as LLM-generated.
		*/
		CodeActionTag.LLMGenerated = 1;
		/**
		* Checks whether the given literal conforms to the {@link CodeActionTag} interface.
		*/
		function is(value) {
			return Is.defined(value) && value === CodeActionTag.LLMGenerated;
		}
		CodeActionTag.is = is;
	})(CodeActionTag || (CodeActionTag = {}));
	var CodeAction;
	(function(CodeAction) {
		function create(title, kindOrCommandOrEdit, kind) {
			const result = { title };
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
			const candidate = value;
			return candidate && Is.string(candidate.title) && (candidate.diagnostics === void 0 || Is.typedArray(candidate.diagnostics, Diagnostic.is)) && (candidate.kind === void 0 || Is.string(candidate.kind)) && (candidate.edit !== void 0 || candidate.command !== void 0) && (candidate.command === void 0 || Command.is(candidate.command)) && (candidate.isPreferred === void 0 || Is.boolean(candidate.isPreferred)) && (candidate.edit === void 0 || WorkspaceEdit.is(candidate.edit)) && (candidate.tags === void 0 || Is.typedArray(candidate.tags, CodeActionTag.is));
		}
		CodeAction.is = is;
	})(CodeAction || (CodeAction = {}));
	/**
	* The CodeLens namespace provides helper functions to work with
	* {@link CodeLens} literals.
	*/
	var CodeLens;
	(function(CodeLens) {
		/**
		* Creates a new CodeLens literal.
		*/
		function create(range, data) {
			const result = { range };
			if (Is.defined(data)) result.data = data;
			return result;
		}
		CodeLens.create = create;
		/**
		* Checks whether the given literal conforms to the {@link CodeLens} interface.
		*/
		function is(value) {
			const candidate = value;
			return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
		}
		CodeLens.is = is;
	})(CodeLens || (CodeLens = {}));
	/**
	* The FormattingOptions namespace provides helper functions to work with
	* {@link FormattingOptions} literals.
	*/
	var FormattingOptions;
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
			const candidate = value;
			return Is.defined(candidate) && Is.uinteger(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
		}
		FormattingOptions.is = is;
	})(FormattingOptions || (FormattingOptions = {}));
	/**
	* The DocumentLink namespace provides helper functions to work with
	* {@link DocumentLink} literals.
	*/
	var DocumentLink;
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
			const candidate = value;
			return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
		}
		DocumentLink.is = is;
	})(DocumentLink || (DocumentLink = {}));
	/**
	* The SelectionRange namespace provides helper function to work with
	* SelectionRange literals.
	*/
	var SelectionRange;
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
			const candidate = value;
			return Is.objectLiteral(candidate) && Range.is(candidate.range) && (candidate.parent === void 0 || SelectionRange.is(candidate.parent));
		}
		SelectionRange.is = is;
	})(SelectionRange || (SelectionRange = {}));
	/**
	* A set of predefined token types. This set is not fixed
	* an clients can specify additional token types via the
	* corresponding client capabilities.
	*
	* @since 3.16.0
	*/
	var SemanticTokenTypes;
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
		/**
		* @since 3.18.0
		*/
		SemanticTokenTypes["label"] = "label";
	})(SemanticTokenTypes || (SemanticTokenTypes = {}));
	/**
	* A set of predefined token modifiers. This set is not fixed
	* an clients can specify additional token types via the
	* corresponding client capabilities.
	*
	* @since 3.16.0
	*/
	var SemanticTokenModifiers;
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
	/**
	* @since 3.16.0
	*/
	var SemanticTokens;
	(function(SemanticTokens) {
		function is(value) {
			const candidate = value;
			return Is.objectLiteral(candidate) && (candidate.resultId === void 0 || typeof candidate.resultId === "string") && Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === "number");
		}
		SemanticTokens.is = is;
	})(SemanticTokens || (SemanticTokens = {}));
	/**
	* The InlineValueText namespace provides functions to deal with InlineValueTexts.
	*
	* @since 3.17.0
	*/
	var InlineValueText;
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
	/**
	* The InlineValueVariableLookup namespace provides functions to
	* deal with InlineValueVariableLookups.
	*
	* @since 3.17.0
	*/
	var InlineValueVariableLookup;
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
	/**
	* The InlineValueEvaluatableExpression namespace provides functions to deal with InlineValueEvaluatableExpression.
	*
	* @since 3.17.0
	*/
	var InlineValueEvaluatableExpression;
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
	/**
	* The InlineValueContext namespace provides helper functions to work with
	* {@link InlineValueContext} literals.
	*
	* @since 3.17.0
	*/
	var InlineValueContext;
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
	/**
	* Inlay hint kinds.
	*
	* @since 3.17.0
	*/
	var InlayHintKind;
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
	var InlayHintLabelPart;
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
	var InlayHint;
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
	var StringValue;
	(function(StringValue) {
		function createSnippet(value) {
			return {
				kind: "snippet",
				value
			};
		}
		StringValue.createSnippet = createSnippet;
		function isSnippet(value) {
			const candidate = value;
			return Is.objectLiteral(candidate) && candidate.kind === "snippet" && Is.string(candidate.value);
		}
		StringValue.isSnippet = isSnippet;
	})(StringValue || (StringValue = {}));
	var InlineCompletionItem;
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
	var InlineCompletionList;
	(function(InlineCompletionList) {
		function create(items) {
			return { items };
		}
		InlineCompletionList.create = create;
	})(InlineCompletionList || (InlineCompletionList = {}));
	/**
	* Describes how an {@link InlineCompletionItemProvider inline completion provider} was triggered.
	*
	* @since 3.18.0
	*/
	var InlineCompletionTriggerKind;
	(function(InlineCompletionTriggerKind) {
		/**
		* Completion was triggered explicitly by a user gesture.
		*/
		InlineCompletionTriggerKind.Invoked = 1;
		/**
		* Completion was triggered automatically while editing.
		*/
		InlineCompletionTriggerKind.Automatic = 2;
	})(InlineCompletionTriggerKind || (InlineCompletionTriggerKind = {}));
	var SelectedCompletionInfo;
	(function(SelectedCompletionInfo) {
		function create(range, text) {
			return {
				range,
				text
			};
		}
		SelectedCompletionInfo.create = create;
	})(SelectedCompletionInfo || (SelectedCompletionInfo = {}));
	var InlineCompletionContext;
	(function(InlineCompletionContext) {
		function create(triggerKind, selectedCompletionInfo) {
			return {
				triggerKind,
				selectedCompletionInfo
			};
		}
		InlineCompletionContext.create = create;
	})(InlineCompletionContext || (InlineCompletionContext = {}));
	var WorkspaceFolder;
	(function(WorkspaceFolder) {
		function is(value) {
			const candidate = value;
			return Is.objectLiteral(candidate) && URI.is(candidate.uri) && Is.string(candidate.name);
		}
		WorkspaceFolder.is = is;
	})(WorkspaceFolder || (WorkspaceFolder = {}));
	/**
	* @deprecated Use the text document from the new vscode-languageserver-textdocument package.
	*/
	var TextDocument;
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
			const candidate = value;
			return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.uinteger(candidate.lineCount) && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
		}
		TextDocument.is = is;
		function applyEdits(document, edits) {
			let text = document.getText();
			const sortedEdits = mergeSort(edits, (a, b) => {
				const diff = a.range.start.line - b.range.start.line;
				if (diff === 0) return a.range.start.character - b.range.start.character;
				return diff;
			});
			let lastModifiedOffset = text.length;
			for (let i = sortedEdits.length - 1; i >= 0; i--) {
				const e = sortedEdits[i];
				const startOffset = document.offsetAt(e.range.start);
				const endOffset = document.offsetAt(e.range.end);
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
	/**
	* @deprecated Use the text document from the new vscode-languageserver-textdocument package.
	*/
	var FullTextDocument = class {
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
				const start = this.offsetAt(range.start);
				const end = this.offsetAt(range.end);
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
				const lineOffsets = [];
				const text = this._content;
				let isLineStart = true;
				for (let i = 0; i < text.length; i++) {
					if (isLineStart) {
						lineOffsets.push(i);
						isLineStart = false;
					}
					const ch = text.charAt(i);
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
			const lineOffsets = this.getLineOffsets();
			let low = 0, high = lineOffsets.length;
			if (high === 0) return Position.create(0, offset);
			while (low < high) {
				const mid = Math.floor((low + high) / 2);
				if (lineOffsets[mid] > offset) high = mid;
				else low = mid + 1;
			}
			const line = low - 1;
			return Position.create(line, offset - lineOffsets[line]);
		}
		offsetAt(position) {
			const lineOffsets = this.getLineOffsets();
			if (position.line >= lineOffsets.length) return this._content.length;
			else if (position.line < 0) return 0;
			const lineOffset = lineOffsets[position.line];
			const nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
			return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
		}
		get lineCount() {
			return this.getLineOffsets().length;
		}
	};
	var Is;
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
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/jsonLanguageTypes.js
	/**
	* Error codes used by diagnostics
	*/
	var ErrorCode;
	(function(ErrorCode) {
		ErrorCode[ErrorCode["Undefined"] = 0] = "Undefined";
		ErrorCode[ErrorCode["EnumValueMismatch"] = 1] = "EnumValueMismatch";
		ErrorCode[ErrorCode["Deprecated"] = 2] = "Deprecated";
		ErrorCode[ErrorCode["UnexpectedEndOfComment"] = 257] = "UnexpectedEndOfComment";
		ErrorCode[ErrorCode["UnexpectedEndOfString"] = 258] = "UnexpectedEndOfString";
		ErrorCode[ErrorCode["UnexpectedEndOfNumber"] = 259] = "UnexpectedEndOfNumber";
		ErrorCode[ErrorCode["InvalidUnicode"] = 260] = "InvalidUnicode";
		ErrorCode[ErrorCode["InvalidEscapeCharacter"] = 261] = "InvalidEscapeCharacter";
		ErrorCode[ErrorCode["InvalidCharacter"] = 262] = "InvalidCharacter";
		ErrorCode[ErrorCode["PropertyExpected"] = 513] = "PropertyExpected";
		ErrorCode[ErrorCode["CommaExpected"] = 514] = "CommaExpected";
		ErrorCode[ErrorCode["ColonExpected"] = 515] = "ColonExpected";
		ErrorCode[ErrorCode["ValueExpected"] = 516] = "ValueExpected";
		ErrorCode[ErrorCode["CommaOrCloseBacketExpected"] = 517] = "CommaOrCloseBacketExpected";
		ErrorCode[ErrorCode["CommaOrCloseBraceExpected"] = 518] = "CommaOrCloseBraceExpected";
		ErrorCode[ErrorCode["TrailingComma"] = 519] = "TrailingComma";
		ErrorCode[ErrorCode["DuplicateKey"] = 520] = "DuplicateKey";
		ErrorCode[ErrorCode["CommentNotPermitted"] = 521] = "CommentNotPermitted";
		ErrorCode[ErrorCode["PropertyKeysMustBeDoublequoted"] = 528] = "PropertyKeysMustBeDoublequoted";
		ErrorCode[ErrorCode["SchemaUnsupportedFeature"] = 769] = "SchemaUnsupportedFeature";
		ErrorCode[ErrorCode["SchemaResolveError"] = 65536] = "SchemaResolveError";
	})(ErrorCode || (ErrorCode = {}));
	var SchemaDraft;
	(function(SchemaDraft) {
		SchemaDraft[SchemaDraft["v3"] = 3] = "v3";
		SchemaDraft[SchemaDraft["v4"] = 4] = "v4";
		SchemaDraft[SchemaDraft["v6"] = 6] = "v6";
		SchemaDraft[SchemaDraft["v7"] = 7] = "v7";
		SchemaDraft[SchemaDraft["v2019_09"] = 19] = "v2019_09";
		SchemaDraft[SchemaDraft["v2020_12"] = 20] = "v2020_12";
	})(SchemaDraft || (SchemaDraft = {}));
	var ClientCapabilities;
	(function(ClientCapabilities) {
		ClientCapabilities.LATEST = { textDocument: { completion: { completionItem: {
			documentationFormat: [MarkupKind.Markdown, MarkupKind.PlainText],
			commitCharactersSupport: true,
			labelDetailsSupport: true
		} } } };
	})(ClientCapabilities || (ClientCapabilities = {}));
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/objects.js
	function equals(one, other) {
		if (one === other) return true;
		if (one === null || one === void 0 || other === null || other === void 0) return false;
		if (typeof one !== typeof other) return false;
		if (typeof one !== "object") return false;
		if (Array.isArray(one) !== Array.isArray(other)) return false;
		let i, key;
		if (Array.isArray(one)) {
			if (one.length !== other.length) return false;
			for (i = 0; i < one.length; i++) if (!equals(one[i], other[i])) return false;
		} else {
			const oneKeys = [];
			for (key in one) oneKeys.push(key);
			oneKeys.sort();
			const otherKeys = [];
			for (key in other) otherKeys.push(key);
			otherKeys.sort();
			if (!equals(oneKeys, otherKeys)) return false;
			for (i = 0; i < oneKeys.length; i++) if (!equals(one[oneKeys[i]], other[oneKeys[i]])) return false;
		}
		return true;
	}
	function isNumber(val) {
		return typeof val === "number";
	}
	function isDefined(val) {
		return typeof val !== "undefined";
	}
	function isBoolean(val) {
		return typeof val === "boolean";
	}
	function isString(val) {
		return typeof val === "string";
	}
	function isObject(val) {
		return typeof val === "object" && val !== null && !Array.isArray(val);
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/parser/schemaCompatibility.js
	/**
	* A cheap necessary-condition check, not a validator. Only exclude alternatives
	* whose type or present primitive values contradict the schema. In particular,
	* unknown constraints, absent properties and cyclic references remain candidates.
	* Never walk instance containers: that would repeat the recursive validation we
	* are trying to avoid. Look through schema unions to find wrapped discriminators.
	*/
	var canMatchSchema = (node, schema, schemaDraft, enabled, include = (_node) => true, seen = /* @__PURE__ */ new Set()) => {
		if (!include(node) || typeof schema === "boolean" || seen.has(schema)) return true;
		if (schema.$ref || schema.$recursiveRef || schema.$dynamicRef) return true;
		seen.add(schema);
		try {
			const matchesType = (type) => node.type === type || type === "integer" && node.type === "number" && node.isInteger;
			if (schema.type && enabled("type") && !(Array.isArray(schema.type) ? schema.type.some(matchesType) : matchesType(schema.type))) return false;
			if (isPrimitive(node)) {
				if (isDefined(schema.const) && enabled("const") && !equals(node.value, schema.const)) return false;
				if (Array.isArray(schema.enum) && enabled("enum") && !schema.enum.some((value) => equals(node.value, value))) return false;
			} else if (node.type === "object" && schema.properties && enabled("properties")) {
				const keys = /* @__PURE__ */ new Set();
				for (let i = node.properties.length - 1; i >= 0; i--) {
					const property = node.properties[i];
					const key = property.keyNode.value;
					if (keys.has(key)) continue;
					keys.add(key);
					const child = property.valueNode;
					const propertySchema = Object.prototype.hasOwnProperty.call(schema.properties, key) ? schema.properties[key] : void 0;
					if (child && isPrimitive(child) && propertySchema !== void 0 && !canMatchSchema(child, propertySchema, schemaDraft, enabled, include, seen)) return false;
				}
			} else if (node.type === "array") {
				const tuple = schemaDraft >= SchemaDraft.v2020_12 ? enabled("prefixItems") ? schema.prefixItems : void 0 : enabled("items") && Array.isArray(schema.items) ? schema.items : void 0;
				if (tuple) for (let i = 0; i < Math.min(tuple.length, node.items.length); i++) {
					const child = node.items[i];
					if (isPrimitive(child) && !canMatchSchema(child, tuple[i], schemaDraft, enabled, include, seen)) return false;
				}
			}
			for (const keyword of ["anyOf", "oneOf"]) {
				const alternatives = schema[keyword];
				if (alternatives && enabled(keyword) && !alternatives.some((alternative) => canMatchSchema(node, alternative, schemaDraft, enabled, include, seen))) return false;
			}
			if (schema.allOf && enabled("allOf") && !schema.allOf.every((alternative) => canMatchSchema(node, alternative, schemaDraft, enabled, include, seen))) return false;
			return true;
		} finally {
			seen.delete(schema);
		}
	};
	var isPrimitive = (node) => {
		return node.type === "string" || node.type === "number" || node.type === "boolean" || node.type === "null";
	};
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/strings.js
	function startsWith(haystack, needle) {
		if (haystack.length < needle.length) return false;
		for (let i = 0; i < needle.length; i++) if (haystack[i] !== needle[i]) return false;
		return true;
	}
	/**
	* Determines if haystack ends with needle.
	*/
	function endsWith(haystack, needle) {
		const diff = haystack.length - needle.length;
		if (diff > 0) return haystack.lastIndexOf(needle) === diff;
		else if (diff === 0) return haystack === needle;
		else return false;
	}
	function extendedRegExp(pattern) {
		let flags = "";
		if (startsWith(pattern, "(?i)")) {
			pattern = pattern.substring(4);
			flags = "i";
		}
		try {
			return new RegExp(pattern, flags + "u");
		} catch (e) {
			try {
				return new RegExp(pattern, flags);
			} catch (e) {
				return;
			}
		}
	}
	function stringLength(str) {
		let count = 0;
		for (let i = 0; i < str.length; i++) {
			count++;
			const code = str.charCodeAt(i);
			if (55296 <= code && code <= 56319) i++;
		}
		return count;
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/vocabularies.js
	var CORE_201909 = "https://json-schema.org/draft/2019-09/vocab/core";
	var CORE_202012 = "https://json-schema.org/draft/2020-12/vocab/core";
	var vocabularyKeywords = {
		[CORE_201909]: [
			"$id",
			"$schema",
			"$ref",
			"$anchor",
			"$recursiveRef",
			"$recursiveAnchor",
			"$defs",
			"$comment",
			"$vocabulary"
		],
		"https://json-schema.org/draft/2019-09/vocab/applicator": [
			"prefixItems",
			"items",
			"contains",
			"additionalProperties",
			"properties",
			"patternProperties",
			"dependentSchemas",
			"propertyNames",
			"if",
			"then",
			"else",
			"allOf",
			"anyOf",
			"oneOf",
			"not"
		],
		"https://json-schema.org/draft/2019-09/vocab/validation": [
			"type",
			"enum",
			"const",
			"multipleOf",
			"maximum",
			"exclusiveMaximum",
			"minimum",
			"exclusiveMinimum",
			"maxLength",
			"minLength",
			"pattern",
			"maxItems",
			"minItems",
			"uniqueItems",
			"maxContains",
			"minContains",
			"maxProperties",
			"minProperties",
			"required",
			"dependentRequired"
		],
		"https://json-schema.org/draft/2019-09/vocab/meta-data": [
			"title",
			"description",
			"default",
			"deprecated",
			"readOnly",
			"writeOnly",
			"examples"
		],
		"https://json-schema.org/draft/2019-09/vocab/format": ["format"],
		"https://json-schema.org/draft/2019-09/vocab/content": [
			"contentEncoding",
			"contentMediaType",
			"contentSchema"
		],
		[CORE_202012]: [
			"$id",
			"$schema",
			"$ref",
			"$anchor",
			"$dynamicRef",
			"$dynamicAnchor",
			"$defs",
			"$comment",
			"$vocabulary"
		],
		"https://json-schema.org/draft/2020-12/vocab/applicator": [
			"prefixItems",
			"items",
			"contains",
			"additionalProperties",
			"properties",
			"patternProperties",
			"dependentSchemas",
			"propertyNames",
			"if",
			"then",
			"else",
			"allOf",
			"anyOf",
			"oneOf",
			"not"
		],
		"https://json-schema.org/draft/2020-12/vocab/unevaluated": ["unevaluatedItems", "unevaluatedProperties"],
		"https://json-schema.org/draft/2020-12/vocab/validation": [
			"type",
			"enum",
			"const",
			"multipleOf",
			"maximum",
			"exclusiveMaximum",
			"minimum",
			"exclusiveMinimum",
			"maxLength",
			"minLength",
			"pattern",
			"maxItems",
			"minItems",
			"uniqueItems",
			"maxContains",
			"minContains",
			"maxProperties",
			"minProperties",
			"required",
			"dependentRequired"
		],
		"https://json-schema.org/draft/2020-12/vocab/meta-data": [
			"title",
			"description",
			"default",
			"deprecated",
			"readOnly",
			"writeOnly",
			"examples"
		],
		"https://json-schema.org/draft/2020-12/vocab/format-annotation": ["format"],
		"https://json-schema.org/draft/2020-12/vocab/format-assertion": ["format"],
		"https://json-schema.org/draft/2020-12/vocab/content": [
			"contentEncoding",
			"contentMediaType",
			"contentSchema"
		]
	};
	function isKeywordEnabled(keyword, activeVocabularies) {
		if (!activeVocabularies) return true;
		for (const [vocabUri, keywords] of Object.entries(vocabularyKeywords)) if (keywords.includes(keyword) && activeVocabularies.has(vocabUri)) return true;
		if (vocabularyKeywords[CORE_201909].includes(keyword) || vocabularyKeywords[CORE_202012].includes(keyword)) return true;
		return false;
	}
	function isFormatAssertionEnabled(activeVocabularies, schemaDraft) {
		if (activeVocabularies && activeVocabularies.size > 0) {
			if (activeVocabularies.has("https://json-schema.org/draft/2020-12/vocab/format-assertion")) return true;
			const format201909 = activeVocabularies.get("https://json-schema.org/draft/2019-09/vocab/format");
			if (format201909 !== void 0) return format201909;
			if (activeVocabularies.has("https://json-schema.org/draft/2020-12/vocab/format-annotation")) return false;
			return false;
		}
		if (schemaDraft !== void 0 && schemaDraft >= SchemaDraft.v2019_09) return false;
		return true;
	}
	//#endregion
	//#region ../../node_modules/@vscode/l10n/dist/browser.js
	var bundle;
	function t(...args) {
		const firstArg = args[0];
		let key;
		let message;
		let formatArgs;
		if (typeof firstArg === "string") {
			key = firstArg;
			message = firstArg;
			args.splice(0, 1);
			formatArgs = !args || typeof args[0] !== "object" ? args : args[0];
		} else if (firstArg instanceof Array) {
			const replacements = args.slice(1);
			if (firstArg.length !== replacements.length + 1) throw new Error("expected a string as the first argument to l10n.t");
			let str = firstArg[0];
			for (let i = 1; i < firstArg.length; i++) str += `{${i - 1}}` + firstArg[i];
			return t(str, ...replacements);
		} else {
			message = firstArg.message;
			key = message;
			if (firstArg.comment && firstArg.comment.length > 0) key += `/${Array.isArray(firstArg.comment) ? firstArg.comment.join("") : firstArg.comment}`;
			formatArgs = firstArg.args ?? {};
		}
		const messageFromBundle = bundle?.[key];
		if (!messageFromBundle) return format$1(message, formatArgs);
		if (typeof messageFromBundle === "string") return format$1(messageFromBundle, formatArgs);
		if (messageFromBundle.comment) return format$1(messageFromBundle.message, formatArgs);
		return format$1(message, formatArgs);
	}
	var _format2Regexp = /{([^}]+)}/g;
	function format$1(template, values) {
		if (Object.keys(values).length === 0) return template;
		return template.replace(_format2Regexp, (match, group) => values[group] ?? match);
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/parser/jsonParser.js
	var formats = {
		"color-hex": {
			errorMessage: t("Invalid color format. Use #RGB, #RGBA, #RRGGBB or #RRGGBBAA."),
			pattern: /^#([0-9A-Fa-f]{3,4}|([0-9A-Fa-f]{2}){3,4})$/
		},
		"date-time": {
			errorMessage: t("String is not a RFC3339 date-time."),
			pattern: /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/i
		},
		"date": {
			errorMessage: t("String is not a RFC3339 date."),
			pattern: /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/i
		},
		"time": {
			errorMessage: t("String is not a RFC3339 time."),
			pattern: /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/i
		},
		"duration": {
			errorMessage: t("String is not an ISO 8601 duration."),
			pattern: /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/
		},
		"uuid": {
			errorMessage: t("String is not a valid UUID."),
			pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
		},
		"email": {
			errorMessage: t("String is not an e-mail address."),
			pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/
		},
		"hostname": {
			errorMessage: t("String is not a hostname."),
			pattern: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i
		},
		"ipv4": {
			errorMessage: t("String is not an IPv4 address."),
			pattern: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
		},
		"ipv6": {
			errorMessage: t("String is not an IPv6 address."),
			pattern: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i
		}
	};
	var ASTNodeImpl = class {
		constructor(parent, offset, length = 0) {
			this.offset = offset;
			this.length = length;
			this.parent = parent;
		}
		get children() {
			return [];
		}
		toString() {
			return "type: " + this.type + " (" + this.offset + "/" + this.length + ")" + (this.parent ? " parent: {" + this.parent.toString() + "}" : "");
		}
	};
	var NullASTNodeImpl = class extends ASTNodeImpl {
		constructor(parent, offset) {
			super(parent, offset);
			this.type = "null";
			this.value = null;
		}
	};
	var BooleanASTNodeImpl = class extends ASTNodeImpl {
		constructor(parent, boolValue, offset) {
			super(parent, offset);
			this.type = "boolean";
			this.value = boolValue;
		}
	};
	var ArrayASTNodeImpl = class extends ASTNodeImpl {
		constructor(parent, offset) {
			super(parent, offset);
			this.type = "array";
			this.items = [];
		}
		get children() {
			return this.items;
		}
	};
	var NumberASTNodeImpl = class extends ASTNodeImpl {
		constructor(parent, offset) {
			super(parent, offset);
			this.type = "number";
			this.isInteger = true;
			this.value = NaN;
		}
	};
	var StringASTNodeImpl = class extends ASTNodeImpl {
		constructor(parent, offset, length) {
			super(parent, offset, length);
			this.type = "string";
			this.value = "";
		}
	};
	var PropertyASTNodeImpl = class extends ASTNodeImpl {
		constructor(parent, offset, keyNode) {
			super(parent, offset);
			this.type = "property";
			this.colonOffset = -1;
			this.keyNode = keyNode;
		}
		get children() {
			return this.valueNode ? [this.keyNode, this.valueNode] : [this.keyNode];
		}
	};
	var ObjectASTNodeImpl = class extends ASTNodeImpl {
		constructor(parent, offset) {
			super(parent, offset);
			this.type = "object";
			this.properties = [];
		}
		get children() {
			return this.properties;
		}
	};
	function asSchema(schema) {
		if (isBoolean(schema)) return schema ? {} : { "not": {} };
		return schema;
	}
	var EnumMatch;
	(function(EnumMatch) {
		EnumMatch[EnumMatch["Key"] = 0] = "Key";
		EnumMatch[EnumMatch["Enum"] = 1] = "Enum";
	})(EnumMatch || (EnumMatch = {}));
	var httpPrefix = `http://json-schema.org/`;
	var httpsPrefix = `https://json-schema.org/`;
	function normalizeId(id) {
		if (id.startsWith(httpPrefix)) id = httpsPrefix + id.substring(httpPrefix.length);
		try {
			return u.parse(id).toString(true);
		} catch (e) {
			return id;
		}
	}
	function getSchemaDraftFromId(schemaId) {
		return schemaDraftFromId[normalizeId(schemaId)] ?? void 0;
	}
	var schemaDraftFromId = {
		"https://json-schema.org/draft-03/schema": SchemaDraft.v3,
		"https://json-schema.org/draft-04/schema": SchemaDraft.v4,
		"https://json-schema.org/draft-06/schema": SchemaDraft.v6,
		"https://json-schema.org/draft-07/schema": SchemaDraft.v7,
		"https://json-schema.org/draft/2019-09/schema": SchemaDraft.v2019_09,
		"https://json-schema.org/draft/2020-12/schema": SchemaDraft.v2020_12
	};
	var EvaluationContext = class {
		constructor(schemaDraft, activeVocabularies, explicitSchemaDraft) {
			this.schemaDraft = schemaDraft;
			this.activeVocabularies = activeVocabularies;
			this.explicitSchemaDraft = explicitSchemaDraft;
		}
	};
	var SchemaCollector = class SchemaCollector {
		constructor(focusOffset = -1, exclude) {
			this.focusOffset = focusOffset;
			this.exclude = exclude;
			this.schemas = [];
		}
		add(schema) {
			this.schemas.push(schema);
		}
		merge(other) {
			Array.prototype.push.apply(this.schemas, other.schemas);
		}
		include(node) {
			return (this.focusOffset === -1 || contains(node, this.focusOffset)) && node !== this.exclude;
		}
		newSub() {
			return new SchemaCollector(-1, this.exclude);
		}
	};
	var NoOpSchemaCollector = class {
		constructor() {}
		get schemas() {
			return [];
		}
		add(_schema) {}
		merge(_other) {}
		include(_node) {
			return true;
		}
		newSub() {
			return this;
		}
	};
	NoOpSchemaCollector.instance = new NoOpSchemaCollector();
	var ValidationResult = class {
		constructor() {
			this.problems = [];
			this.propertiesMatches = 0;
			this.processedProperties = /* @__PURE__ */ new Set();
			this.propertiesValueMatches = 0;
			this.primaryValueMatches = 0;
			this.enumValueMatch = false;
			this.enumValues = void 0;
		}
		hasProblems() {
			return this.problems.some((p) => p.code !== ErrorCode.Deprecated);
		}
		merge(validationResult) {
			this.problems = this.problems.concat(validationResult.problems);
			this.propertiesMatches += validationResult.propertiesMatches;
			this.propertiesValueMatches += validationResult.propertiesValueMatches;
			this.mergeProcessedProperties(validationResult);
		}
		mergeEnumValues(validationResult) {
			if (!this.enumValueMatch && !validationResult.enumValueMatch && this.enumValues && validationResult.enumValues) this.enumValues = this.enumValues.concat(validationResult.enumValues);
		}
		updateEnumMismatchProblemMessages() {
			if (!this.enumValueMatch && this.enumValues) {
				for (const error of this.problems) if (error.code === ErrorCode.EnumValueMismatch) error.message = t("Value is not accepted. Valid values: {0}.", this.enumValues.map((v) => JSON.stringify(v)).join(", "));
			}
		}
		mergePropertyMatch(propertyValidationResult) {
			this.problems = this.problems.concat(propertyValidationResult.problems);
			this.propertiesMatches++;
			if (propertyValidationResult.enumValueMatch || !propertyValidationResult.hasProblems() && propertyValidationResult.propertiesMatches) this.propertiesValueMatches++;
			if (propertyValidationResult.enumValueMatch && propertyValidationResult.enumValues && propertyValidationResult.enumValues.length === 1) this.primaryValueMatches++;
		}
		mergeProcessedProperties(validationResult) {
			validationResult.processedProperties.forEach((p) => this.processedProperties.add(p));
		}
		compare(other) {
			const hasProblems = this.hasProblems();
			if (hasProblems !== other.hasProblems()) return hasProblems ? -1 : 1;
			if (this.enumValueMatch !== other.enumValueMatch) return other.enumValueMatch ? -1 : 1;
			if (this.primaryValueMatches !== other.primaryValueMatches) return this.primaryValueMatches - other.primaryValueMatches;
			if (this.propertiesValueMatches !== other.propertiesValueMatches) return this.propertiesValueMatches - other.propertiesValueMatches;
			return this.propertiesMatches - other.propertiesMatches;
		}
	};
	function newJSONDocument(root, diagnostics = [], comments = []) {
		return new JSONDocument(root, diagnostics, comments);
	}
	function getNodeValue(node) {
		return getNodeValue$1(node);
	}
	function getNodePath(node) {
		return getNodePath$1(node);
	}
	function contains(node, offset, includeRightBound = false) {
		return offset >= node.offset && offset < node.offset + node.length || includeRightBound && offset === node.offset + node.length;
	}
	var JSONDocument = class {
		constructor(root, syntaxErrors = [], comments = []) {
			this.root = root;
			this.syntaxErrors = syntaxErrors;
			this.comments = comments;
		}
		getNodeFromOffset(offset, includeRightBound = false) {
			if (this.root) return findNodeAtOffset(this.root, offset, includeRightBound);
		}
		visit(visitor) {
			if (this.root) {
				const doVisit = (node) => {
					let ctn = visitor(node);
					const children = node.children;
					if (Array.isArray(children)) for (let i = 0; i < children.length && ctn; i++) ctn = doVisit(children[i]);
					return ctn;
				};
				doVisit(this.root);
			}
		}
		validate(textDocument, schema, severity = DiagnosticSeverity$1.Warning, schemaDraft, activeVocabularies) {
			if (this.root && schema) {
				const validationResult = new ValidationResult();
				const { explicitDraft, effectiveDraft } = resolveDrafts(schema, schemaDraft);
				const context = new EvaluationContext(effectiveDraft, activeVocabularies, explicitDraft);
				const schemaStack = [];
				const schemaRoots = [schema];
				validate(this.root, schema, validationResult, NoOpSchemaCollector.instance, context, schemaStack, schemaRoots);
				return validationResult.problems.map((p) => {
					const range = Range.create(textDocument.positionAt(p.location.offset), textDocument.positionAt(p.location.offset + p.location.length));
					return Diagnostic.create(range, p.message, p.severity ?? severity, p.code);
				});
			}
		}
		getMatchingSchemas(schema, focusOffset = -1, exclude, activeVocabularies) {
			if (this.root && schema) {
				const matchingSchemas = new SchemaCollector(focusOffset, exclude);
				const { explicitDraft, effectiveDraft } = resolveDrafts(schema);
				const context = new EvaluationContext(effectiveDraft, activeVocabularies, explicitDraft);
				const schemaStack = [];
				const schemaRoots = [schema];
				validate(this.root, schema, new ValidationResult(), matchingSchemas, context, schemaStack, schemaRoots);
				return matchingSchemas.schemas;
			}
			return [];
		}
	};
	function resolveDrafts(schema, schemaDraftOverride) {
		const explicitDraft = schemaDraftOverride ?? (schema.$schema ? getSchemaDraftFromId(schema.$schema) : void 0);
		return {
			explicitDraft,
			effectiveDraft: explicitDraft ?? SchemaDraft.v2020_12
		};
	}
	var keywords201909 = /* @__PURE__ */ new Set([
		"dependentRequired",
		"dependentSchemas",
		"unevaluatedProperties",
		"unevaluatedItems",
		"minContains",
		"maxContains"
	]);
	function validate(n, schema, validationResult, matchingSchemas, context, schemaStack, schemaRoots) {
		if (!n || !matchingSchemas.include(n)) return;
		if (n.type === "property") return validate(n.valueNode, schema, validationResult, matchingSchemas, context, schemaStack, schemaRoots);
		const node = n;
		if (schema.$recursiveRef) {
			const hasRecursiveAnchor = (s) => s.$recursiveAnchor === true;
			const isSchemaRoot = (s) => s.$id || s.id || s.$originalId;
			const currentResourceRoot = schemaStack.slice().reverse().find(isSchemaRoot);
			const targetSchema = currentResourceRoot && hasRecursiveAnchor(currentResourceRoot) ? schemaStack.find(hasRecursiveAnchor) : currentResourceRoot ?? schemaRoots[0];
			if (targetSchema && targetSchema !== schema) validate(node, targetSchema, validationResult, matchingSchemas, context, schemaStack, schemaRoots);
		}
		const isNewRoot = (schema.$id || schema.id || schema.$originalId) && !schemaRoots.includes(schema);
		if (isNewRoot) schemaRoots.push(schema);
		schemaStack.push(schema);
		const dynamicRefInfo = schema.$dynamicRefInfo;
		const dynamicRefTarget = dynamicRefInfo?.target;
		if (dynamicRefTarget !== void 0) {
			let targetSchema = dynamicRefTarget;
			const dynamicName = dynamicRefInfo?.name;
			if (dynamicName !== void 0 && dynamicRefTarget.$dynamicAnchor === dynamicName) for (const root of schemaRoots) {
				const candidate = root.$anchorMaps?.dynamic.get(dynamicName);
				if (candidate) {
					targetSchema = candidate;
					break;
				}
			}
			if (targetSchema && targetSchema !== schema) validate(node, targetSchema, validationResult, matchingSchemas, context, schemaStack, schemaRoots);
		}
		const enabled = (keyword) => {
			if (keyword === "dependencies") return context.schemaDraft <= SchemaDraft.v7;
			if (keywords201909.has(keyword)) return context.schemaDraft >= SchemaDraft.v2019_09;
			if (keyword === "prefixItems") return context.schemaDraft >= SchemaDraft.v2020_12;
			if (context.schemaDraft >= SchemaDraft.v2019_09 && context.activeVocabularies) return isKeywordEnabled(keyword, context.activeVocabularies);
			return true;
		};
		_validateNode();
		switch (node.type) {
			case "object":
				_validateObjectNode(node);
				break;
			case "array":
				_validateArrayNode(node);
				break;
			case "string":
				_validateStringNode(node);
				break;
			case "number":
				_validateNumberNode(node);
				break;
		}
		matchingSchemas.add({
			node,
			schema
		});
		schemaStack.pop();
		if (isNewRoot) schemaRoots.pop();
		function _validateNode() {
			function matchesType(type) {
				return node.type === type || type === "integer" && node.type === "number" && node.isInteger;
			}
			if (Array.isArray(schema.type) && enabled("type")) {
				if (!schema.type.some(matchesType)) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: schema.errorMessage || t("Incorrect type. Expected one of {0}.", schema.type.join(", "))
				});
			} else if (schema.type && !Array.isArray(schema.type) && enabled("type")) {
				if (!matchesType(schema.type)) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: schema.errorMessage || t("Incorrect type. Expected \"{0}\".", schema.type)
				});
			}
			if (Array.isArray(schema.allOf) && enabled("allOf")) for (const subSchemaRef of schema.allOf) {
				const subValidationResult = new ValidationResult();
				const subMatchingSchemas = matchingSchemas.newSub();
				validate(node, asSchema(subSchemaRef), subValidationResult, subMatchingSchemas, context, schemaStack, schemaRoots);
				validationResult.merge(subValidationResult);
				matchingSchemas.merge(subMatchingSchemas);
			}
			const notSchema = asSchema(schema.not);
			if (notSchema && enabled("not")) {
				const subValidationResult = new ValidationResult();
				const subMatchingSchemas = matchingSchemas.newSub();
				validate(node, notSchema, subValidationResult, subMatchingSchemas, context, schemaStack, schemaRoots);
				if (!subValidationResult.hasProblems()) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: schema.errorMessage || t("Matches a schema that is not allowed.")
				});
				for (const ms of subMatchingSchemas.schemas) {
					ms.inverted = !ms.inverted;
					matchingSchemas.add(ms);
				}
			}
			const testAlternatives = (alternatives, maxOneMatch) => {
				const matches = [];
				const testAlternative = (subSchemaRef) => {
					const subSchema = asSchema(subSchemaRef);
					const subValidationResult = new ValidationResult();
					const subMatchingSchemas = matchingSchemas.newSub();
					validate(node, subSchema, subValidationResult, subMatchingSchemas, context, schemaStack, schemaRoots);
					return {
						schema: subSchema,
						validationResult: subValidationResult,
						matchingSchemas: subMatchingSchemas
					};
				};
				const compatibilitySchemas = matchingSchemas.newSub();
				const include = (child) => compatibilitySchemas.include(child);
				const results = alternatives.map((alternative) => canMatchSchema(node, alternative, context.schemaDraft, enabled, include) ? testAlternative(alternative) : void 0);
				if (!results.some((result) => result && !result.validationResult.hasProblems())) {
					const fallback = _tryDiscriminatorOptimization(alternatives) ?? alternatives;
					for (let i = 0; i < alternatives.length; i++) results[i] = fallback.includes(alternatives[i]) ? results[i] ?? testAlternative(alternatives[i]) : void 0;
				}
				let bestMatch = void 0;
				for (const result of results) {
					if (!result) continue;
					const { schema: subSchema, validationResult: subValidationResult, matchingSchemas: subMatchingSchemas } = result;
					if (!subValidationResult.hasProblems()) matches.push(subSchema);
					if (!bestMatch) bestMatch = {
						schema: subSchema,
						validationResult: subValidationResult,
						matchingSchemas: subMatchingSchemas
					};
					else if (!maxOneMatch && !subValidationResult.hasProblems() && !bestMatch.validationResult.hasProblems()) {
						bestMatch.matchingSchemas.merge(subMatchingSchemas);
						bestMatch.validationResult.propertiesMatches += subValidationResult.propertiesMatches;
						bestMatch.validationResult.propertiesValueMatches += subValidationResult.propertiesValueMatches;
						bestMatch.validationResult.mergeProcessedProperties(subValidationResult);
					} else {
						const compareResult = subValidationResult.compare(bestMatch.validationResult);
						if (compareResult > 0) bestMatch = {
							schema: subSchema,
							validationResult: subValidationResult,
							matchingSchemas: subMatchingSchemas
						};
						else if (compareResult === 0) {
							bestMatch.matchingSchemas.merge(subMatchingSchemas);
							bestMatch.validationResult.mergeEnumValues(subValidationResult);
						}
					}
				}
				if (matches.length > 1 && maxOneMatch) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: 1
					},
					message: t("Matches multiple schemas when only one must validate.")
				});
				if (bestMatch) {
					bestMatch.validationResult.updateEnumMismatchProblemMessages();
					validationResult.merge(bestMatch.validationResult);
					matchingSchemas.merge(bestMatch.matchingSchemas);
				}
				return matches.length;
			};
			if (Array.isArray(schema.anyOf) && enabled("anyOf")) testAlternatives(schema.anyOf, false);
			if (Array.isArray(schema.oneOf) && enabled("oneOf")) testAlternatives(schema.oneOf, true);
			const testBranch = (schema) => {
				const subValidationResult = new ValidationResult();
				const subMatchingSchemas = matchingSchemas.newSub();
				validate(node, asSchema(schema), subValidationResult, subMatchingSchemas, context, schemaStack, schemaRoots);
				validationResult.merge(subValidationResult);
				matchingSchemas.merge(subMatchingSchemas);
			};
			const testCondition = (ifSchema, thenSchema, elseSchema) => {
				const subSchema = asSchema(ifSchema);
				const subValidationResult = new ValidationResult();
				const subMatchingSchemas = matchingSchemas.newSub();
				validate(node, subSchema, subValidationResult, subMatchingSchemas, context, schemaStack, schemaRoots);
				matchingSchemas.merge(subMatchingSchemas);
				if (!subValidationResult.hasProblems()) {
					validationResult.mergeProcessedProperties(subValidationResult);
					if (thenSchema) testBranch(thenSchema);
				} else if (elseSchema) testBranch(elseSchema);
			};
			const ifSchema = asSchema(schema.if);
			if (ifSchema && enabled("if")) testCondition(ifSchema, asSchema(schema.then), asSchema(schema.else));
			if (Array.isArray(schema.enum) && enabled("enum")) {
				const val = getNodeValue(node);
				let enumValueMatch = false;
				for (const e of schema.enum) if (equals(val, e)) {
					enumValueMatch = true;
					break;
				}
				validationResult.enumValues = schema.enum;
				validationResult.enumValueMatch = enumValueMatch;
				if (!enumValueMatch) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					code: ErrorCode.EnumValueMismatch,
					message: schema.errorMessage || t("Value is not accepted. Valid values: {0}.", schema.enum.map((v) => JSON.stringify(v)).join(", "))
				});
			}
			if (isDefined(schema.const) && enabled("const")) {
				if (!equals(getNodeValue(node), schema.const)) {
					validationResult.problems.push({
						location: {
							offset: node.offset,
							length: node.length
						},
						code: ErrorCode.EnumValueMismatch,
						message: schema.errorMessage || t("Value must be {0}.", JSON.stringify(schema.const))
					});
					validationResult.enumValueMatch = false;
				} else validationResult.enumValueMatch = true;
				validationResult.enumValues = [schema.const];
			}
			let deprecationMessage = schema.deprecationMessage;
			if (deprecationMessage || schema.deprecated) {
				deprecationMessage = deprecationMessage || t("Value is deprecated");
				let targetNode = node.parent?.type === "property" ? node.parent : node;
				validationResult.problems.push({
					location: {
						offset: targetNode.offset,
						length: targetNode.length
					},
					severity: DiagnosticSeverity$1.Warning,
					message: deprecationMessage,
					code: ErrorCode.Deprecated
				});
			}
		}
		function _tryDiscriminatorOptimization(alternatives) {
			if (alternatives.length < 2) return;
			const buildConstMap = (getSchemas) => {
				const constMap = /* @__PURE__ */ new Map();
				for (let i = 0; i < alternatives.length; i++) {
					const schemas = getSchemas(asSchema(alternatives[i]), i);
					if (!schemas) return;
					schemas.forEach(([key, schema]) => {
						if (schema.const !== void 0) {
							if (!constMap.has(key)) constMap.set(key, /* @__PURE__ */ new Map());
							const valueMap = constMap.get(key);
							if (!valueMap.has(schema.const)) valueMap.set(schema.const, []);
							valueMap.get(schema.const).push(i);
						} else if (schema.enum && Array.isArray(schema.enum)) for (const enumValue of schema.enum) {
							if (!constMap.has(key)) constMap.set(key, /* @__PURE__ */ new Map());
							const valueMap = constMap.get(key);
							if (!valueMap.has(enumValue)) valueMap.set(enumValue, []);
							valueMap.get(enumValue).push(i);
						}
					});
				}
				return constMap;
			};
			const findDiscriminator = (constMap, getValue) => {
				for (const [key, valueMap] of constMap) {
					const coveredAlts = /* @__PURE__ */ new Set();
					valueMap.forEach((indices) => indices.forEach((idx) => coveredAlts.add(idx)));
					if (coveredAlts.size === alternatives.length) {
						const discriminatorValue = getValue(key);
						const matchingIndices = valueMap.get(discriminatorValue);
						if (matchingIndices?.length) return matchingIndices.map((idx) => alternatives[idx]);
						break;
					}
				}
			};
			if (node.type === "object" && node.properties?.length) {
				const constMap = buildConstMap((schema) => schema.properties ? Object.entries(schema.properties).map(([k, v]) => [k, asSchema(v)]) : void 0);
				if (constMap) return findDiscriminator(constMap, (propName) => {
					const prop = node.properties.find((p) => p.keyNode.value === propName);
					return prop?.valueNode?.type === "string" ? prop.valueNode.value : void 0;
				});
			} else if (node.type === "array" && node.items?.length) {
				const constMap = buildConstMap((schema) => {
					const itemSchemas = schema.prefixItems || (Array.isArray(schema.items) ? schema.items : void 0);
					return itemSchemas ? itemSchemas.map((item, idx) => [idx, asSchema(item)]) : void 0;
				});
				if (constMap) return findDiscriminator(constMap, (itemIndex) => {
					const item = node.items[itemIndex];
					return item?.type === "string" ? item.value : void 0;
				});
			}
		}
		function _validateNumberNode(node) {
			const val = node.value;
			function normalizeFloats(float) {
				const parts = /^(-?\d+)(?:\.(\d+))?(?:e([-+]\d+))?$/.exec(float.toString());
				return parts && {
					value: Number(parts[1] + (parts[2] || "")),
					multiplier: (parts[2]?.length || 0) - (parseInt(parts[3]) || 0)
				};
			}
			if (isNumber(schema.multipleOf) && enabled("multipleOf")) {
				let remainder = -1;
				if (Number.isInteger(schema.multipleOf)) remainder = val % schema.multipleOf;
				else {
					let normMultipleOf = normalizeFloats(schema.multipleOf);
					let normValue = normalizeFloats(val);
					if (normMultipleOf && normValue) {
						const multiplier = 10 ** Math.abs(normValue.multiplier - normMultipleOf.multiplier);
						if (normValue.multiplier < normMultipleOf.multiplier) normValue.value *= multiplier;
						else normMultipleOf.value *= multiplier;
						remainder = normValue.value % normMultipleOf.value;
					}
				}
				if (remainder !== 0) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Value is not divisible by {0}.", schema.multipleOf)
				});
			}
			function getExclusiveLimit(limit, exclusive) {
				if (isNumber(exclusive)) return exclusive;
				if (isBoolean(exclusive) && exclusive) return limit;
			}
			function getLimit(limit, exclusive) {
				if (!isBoolean(exclusive) || !exclusive) return limit;
			}
			const exclusiveMinimum = getExclusiveLimit(schema.minimum, schema.exclusiveMinimum);
			if (isNumber(exclusiveMinimum) && val <= exclusiveMinimum && enabled("exclusiveMinimum")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("Value is below the exclusive minimum of {0}.", exclusiveMinimum)
			});
			const exclusiveMaximum = getExclusiveLimit(schema.maximum, schema.exclusiveMaximum);
			if (isNumber(exclusiveMaximum) && val >= exclusiveMaximum && enabled("exclusiveMaximum")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("Value is above the exclusive maximum of {0}.", exclusiveMaximum)
			});
			const minimum = getLimit(schema.minimum, schema.exclusiveMinimum);
			if (isNumber(minimum) && val < minimum && enabled("minimum")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("Value is below the minimum of {0}.", minimum)
			});
			const maximum = getLimit(schema.maximum, schema.exclusiveMaximum);
			if (isNumber(maximum) && val > maximum && enabled("maximum")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("Value is above the maximum of {0}.", maximum)
			});
		}
		function _validateStringNode(node) {
			if (isNumber(schema.minLength) && stringLength(node.value) < schema.minLength && enabled("minLength")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("String is shorter than the minimum length of {0}.", schema.minLength)
			});
			if (isNumber(schema.maxLength) && stringLength(node.value) > schema.maxLength && enabled("maxLength")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("String is longer than the maximum length of {0}.", schema.maxLength)
			});
			if (isString(schema.pattern) && enabled("pattern")) {
				const regex = extendedRegExp(schema.pattern);
				if (regex && !regex.test(node.value)) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: schema.patternErrorMessage || schema.errorMessage || t("String does not match the pattern of \"{0}\".", schema.pattern)
				});
			}
			if (schema.format && enabled("format") && isFormatAssertionEnabled(context.activeVocabularies, context.explicitSchemaDraft)) switch (schema.format) {
				case "uri":
				case "uri-reference":
					{
						let errorMessage;
						if (!node.value) errorMessage = t("URI expected.");
						else {
							const match = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(node.value);
							if (!match) errorMessage = t("URI is expected.");
							else if (!match[2] && schema.format === "uri") errorMessage = t("URI with a scheme is expected.");
						}
						if (errorMessage) validationResult.problems.push({
							location: {
								offset: node.offset,
								length: node.length
							},
							message: schema.patternErrorMessage || schema.errorMessage || t("String is not a URI: {0}", errorMessage)
						});
					}
					break;
				case "color-hex":
				case "date-time":
				case "date":
				case "time":
				case "duration":
				case "uuid":
				case "email":
				case "hostname":
				case "ipv4":
				case "ipv6":
					const format = formats[schema.format];
					if (!node.value || !format.pattern.exec(node.value)) validationResult.problems.push({
						location: {
							offset: node.offset,
							length: node.length
						},
						message: schema.patternErrorMessage || schema.errorMessage || format.errorMessage
					});
				default:
			}
		}
		function _validateArrayNode(node) {
			let prefixItemsSchemas;
			let additionalItemSchema;
			if (context.schemaDraft >= SchemaDraft.v2020_12) {
				prefixItemsSchemas = schema.prefixItems;
				additionalItemSchema = !Array.isArray(schema.items) ? schema.items : void 0;
			} else {
				prefixItemsSchemas = Array.isArray(schema.items) ? schema.items : void 0;
				additionalItemSchema = !Array.isArray(schema.items) ? schema.items : schema.additionalItems;
			}
			let index = 0;
			if (prefixItemsSchemas !== void 0) {
				const max = Math.min(prefixItemsSchemas.length, node.items.length);
				for (; index < max; index++) {
					const subSchemaRef = prefixItemsSchemas[index];
					const subSchema = asSchema(subSchemaRef);
					const itemValidationResult = new ValidationResult();
					const item = node.items[index];
					if (item) {
						validate(item, subSchema, itemValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
						validationResult.mergePropertyMatch(itemValidationResult);
					}
					validationResult.processedProperties.add(String(index));
				}
			}
			if (additionalItemSchema !== void 0 && index < node.items.length) if (typeof additionalItemSchema === "boolean") {
				if (additionalItemSchema === false) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Array has too many items according to schema. Expected {0} or fewer.", index)
				});
				for (; index < node.items.length; index++) {
					validationResult.processedProperties.add(String(index));
					validationResult.propertiesValueMatches++;
				}
			} else for (; index < node.items.length; index++) {
				const itemValidationResult = new ValidationResult();
				validate(node.items[index], additionalItemSchema, itemValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
				validationResult.mergePropertyMatch(itemValidationResult);
				validationResult.processedProperties.add(String(index));
			}
			const containsSchema = asSchema(schema.contains);
			if (containsSchema && enabled("contains")) {
				let containsCount = 0;
				for (let index = 0; index < node.items.length; index++) {
					const item = node.items[index];
					const itemValidationResult = new ValidationResult();
					validate(item, containsSchema, itemValidationResult, NoOpSchemaCollector.instance, context, schemaStack, schemaRoots);
					if (!itemValidationResult.hasProblems()) {
						containsCount++;
						if (context.schemaDraft >= SchemaDraft.v2020_12) validationResult.processedProperties.add(String(index));
					}
				}
				if (containsCount === 0 && !isNumber(schema.minContains)) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: schema.errorMessage || t("Array does not contain required item.")
				});
				if (isNumber(schema.minContains) && containsCount < schema.minContains && enabled("minContains")) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: schema.errorMessage || t("Array has too few items that match the contains contraint. Expected {0} or more.", schema.minContains)
				});
				if (isNumber(schema.maxContains) && containsCount > schema.maxContains && enabled("maxContains")) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: schema.errorMessage || t("Array has too many items that match the contains contraint. Expected {0} or less.", schema.maxContains)
				});
			}
			const unevaluatedItems = schema.unevaluatedItems;
			if (unevaluatedItems !== void 0 && enabled("unevaluatedItems")) for (let i = 0; i < node.items.length; i++) {
				if (!validationResult.processedProperties.has(String(i))) if (unevaluatedItems === false) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Item does not match any validation rule from the array.")
				});
				else {
					const itemValidationResult = new ValidationResult();
					validate(node.items[i], schema.unevaluatedItems, itemValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
					validationResult.mergePropertyMatch(itemValidationResult);
				}
				validationResult.processedProperties.add(String(i));
				validationResult.propertiesValueMatches++;
			}
			if (isNumber(schema.minItems) && node.items.length < schema.minItems && enabled("minItems")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("Array has too few items. Expected {0} or more.", schema.minItems)
			});
			if (isNumber(schema.maxItems) && node.items.length > schema.maxItems && enabled("maxItems")) validationResult.problems.push({
				location: {
					offset: node.offset,
					length: node.length
				},
				message: t("Array has too many items. Expected {0} or fewer.", schema.maxItems)
			});
			if (schema.uniqueItems === true && enabled("uniqueItems")) {
				const values = getNodeValue(node);
				function hasDuplicates() {
					for (let i = 0; i < values.length - 1; i++) {
						const value = values[i];
						for (let j = i + 1; j < values.length; j++) if (equals(value, values[j])) return true;
					}
					return false;
				}
				if (hasDuplicates()) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Array has duplicate items.")
				});
			}
		}
		function _validateObjectNode(node) {
			const seenKeys = Object.create(null);
			const unprocessedProperties = /* @__PURE__ */ new Set();
			for (const propertyNode of node.properties) {
				const key = propertyNode.keyNode.value;
				seenKeys[key] = propertyNode.valueNode;
				unprocessedProperties.add(key);
			}
			if (Array.isArray(schema.required) && enabled("required")) {
				for (const propertyName of schema.required) if (!seenKeys[propertyName]) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Missing property \"{0}\".", propertyName)
				});
			}
			const propertyProcessed = (prop) => {
				unprocessedProperties.delete(prop);
				validationResult.processedProperties.add(prop);
			};
			if (schema.properties && enabled("properties")) for (const propertyName of Object.keys(schema.properties)) {
				propertyProcessed(propertyName);
				const propertySchema = schema.properties[propertyName];
				const child = seenKeys[propertyName];
				if (child) if (isBoolean(propertySchema)) if (!propertySchema) {
					const propertyNode = child.parent;
					validationResult.problems.push({
						location: {
							offset: propertyNode.keyNode.offset,
							length: propertyNode.keyNode.length
						},
						message: schema.errorMessage || t("Property {0} is not allowed.", propertyName)
					});
				} else {
					validationResult.propertiesMatches++;
					validationResult.propertiesValueMatches++;
				}
				else {
					const propertyValidationResult = new ValidationResult();
					validate(child, propertySchema, propertyValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
					validationResult.mergePropertyMatch(propertyValidationResult);
				}
			}
			if (schema.patternProperties && enabled("patternProperties")) {
				const allPropertyNames = Object.keys(seenKeys);
				const patternPropertyMatches = /* @__PURE__ */ new Set();
				for (const propertyPattern of Object.keys(schema.patternProperties)) {
					const regex = extendedRegExp(propertyPattern);
					if (regex) {
						for (const propertyName of allPropertyNames) if (regex.test(propertyName)) {
							if (unprocessedProperties.has(propertyName)) patternPropertyMatches.add(propertyName);
							const child = seenKeys[propertyName];
							if (child) {
								const propertySchema = schema.patternProperties[propertyPattern];
								if (isBoolean(propertySchema)) if (!propertySchema) {
									const propertyNode = child.parent;
									validationResult.problems.push({
										location: {
											offset: propertyNode.keyNode.offset,
											length: propertyNode.keyNode.length
										},
										message: schema.errorMessage || t("Property {0} is not allowed.", propertyName)
									});
								} else {
									validationResult.propertiesMatches++;
									validationResult.propertiesValueMatches++;
								}
								else {
									const propertyValidationResult = new ValidationResult();
									validate(child, propertySchema, propertyValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
									validationResult.mergePropertyMatch(propertyValidationResult);
								}
							}
						}
					}
				}
				patternPropertyMatches.forEach(propertyProcessed);
			}
			const additionalProperties = schema.additionalProperties;
			if (additionalProperties !== void 0 && enabled("additionalProperties")) for (const propertyName of unprocessedProperties) {
				propertyProcessed(propertyName);
				const child = seenKeys[propertyName];
				if (child) {
					if (additionalProperties === false) {
						const propertyNode = child.parent;
						validationResult.problems.push({
							location: {
								offset: propertyNode.keyNode.offset,
								length: propertyNode.keyNode.length
							},
							message: schema.errorMessage || t("Property {0} is not allowed.", propertyName)
						});
					} else if (additionalProperties !== true) {
						const propertyValidationResult = new ValidationResult();
						validate(child, additionalProperties, propertyValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
						validationResult.mergePropertyMatch(propertyValidationResult);
					}
				}
			}
			if (schema.dependentRequired && enabled("dependentRequired")) for (const key in schema.dependentRequired) {
				const prop = seenKeys[key];
				const propertyDeps = schema.dependentRequired[key];
				if (prop && Array.isArray(propertyDeps)) _validatePropertyDependencies(key, propertyDeps);
			}
			if (schema.dependentSchemas && enabled("dependentSchemas")) for (const key in schema.dependentSchemas) {
				const prop = seenKeys[key];
				const propertyDeps = schema.dependentSchemas[key];
				if (prop) _validatePropertyDependencies(key, propertyDeps);
			}
			const unevaluatedProperties = schema.unevaluatedProperties;
			if (unevaluatedProperties !== void 0 && enabled("unevaluatedProperties")) {
				const processed = [];
				for (const propertyName of unprocessedProperties) if (!validationResult.processedProperties.has(propertyName)) {
					processed.push(propertyName);
					const child = seenKeys[propertyName];
					if (child) {
						if (unevaluatedProperties === false) {
							const propertyNode = child.parent;
							validationResult.problems.push({
								location: {
									offset: propertyNode.keyNode.offset,
									length: propertyNode.keyNode.length
								},
								message: schema.errorMessage || t("Property {0} is not allowed.", propertyName)
							});
						} else if (unevaluatedProperties !== true) {
							const propertyValidationResult = new ValidationResult();
							validate(child, unevaluatedProperties, propertyValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
							validationResult.mergePropertyMatch(propertyValidationResult);
						}
					}
				}
				processed.forEach(propertyProcessed);
			}
			if (isNumber(schema.maxProperties) && enabled("maxProperties")) {
				if (node.properties.length > schema.maxProperties) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Object has more properties than limit of {0}.", schema.maxProperties)
				});
			}
			if (isNumber(schema.minProperties) && enabled("minProperties")) {
				if (node.properties.length < schema.minProperties) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Object has fewer properties than the required number of {0}", schema.minProperties)
				});
			}
			if (schema.dependencies && enabled("dependencies")) {
				for (const key in schema.dependencies) if (seenKeys[key]) _validatePropertyDependencies(key, schema.dependencies[key]);
			}
			const propertyNames = asSchema(schema.propertyNames);
			if (propertyNames && enabled("propertyNames")) for (const f of node.properties) {
				const key = f.keyNode;
				if (key) validate(key, propertyNames, validationResult, matchingSchemas, context, schemaStack, schemaRoots);
			}
			function _validatePropertyDependencies(key, propertyDep) {
				if (Array.isArray(propertyDep)) for (const requiredProp of propertyDep) if (!seenKeys[requiredProp]) validationResult.problems.push({
					location: {
						offset: node.offset,
						length: node.length
					},
					message: t("Object is missing property {0} required by property {1}.", requiredProp, key)
				});
				else validationResult.propertiesValueMatches++;
				else {
					const propertySchema = asSchema(propertyDep);
					if (propertySchema) {
						const propertyValidationResult = new ValidationResult();
						validate(node, propertySchema, propertyValidationResult, matchingSchemas, context, schemaStack, schemaRoots);
						validationResult.mergePropertyMatch(propertyValidationResult);
						validationResult.mergeProcessedProperties(propertyValidationResult);
					}
				}
			}
		}
	}
	function parse(textDocument, config) {
		const problems = [];
		let lastProblemOffset = -1;
		const text = textDocument.getText();
		const scanner = createScanner(text, false);
		const commentRanges = config && config.collectComments ? [] : void 0;
		function _scanNext() {
			while (true) {
				const token = scanner.scan();
				_checkScanError();
				switch (token) {
					case 12:
					case 13:
						if (Array.isArray(commentRanges)) commentRanges.push(Range.create(textDocument.positionAt(scanner.getTokenOffset()), textDocument.positionAt(scanner.getTokenOffset() + scanner.getTokenLength())));
						break;
					case 15:
					case 14: break;
					default: return token;
				}
			}
		}
		function _errorAtRange(message, code, startOffset, endOffset, severity = DiagnosticSeverity$1.Error) {
			if (problems.length === 0 || startOffset !== lastProblemOffset) {
				const range = Range.create(textDocument.positionAt(startOffset), textDocument.positionAt(endOffset));
				problems.push(Diagnostic.create(range, message, severity, code, textDocument.languageId));
				lastProblemOffset = startOffset;
			}
		}
		function _error(message, code, node = void 0, skipUntilAfter = [], skipUntil = []) {
			let start = scanner.getTokenOffset();
			let end = scanner.getTokenOffset() + scanner.getTokenLength();
			if (start === end && start > 0) {
				start--;
				while (start > 0 && /\s/.test(text.charAt(start))) start--;
				end = start + 1;
			}
			_errorAtRange(message, code, start, end);
			if (node) _finalize(node, false);
			if (skipUntilAfter.length + skipUntil.length > 0) {
				let token = scanner.getToken();
				while (token !== 17) {
					if (skipUntilAfter.indexOf(token) !== -1) {
						_scanNext();
						break;
					} else if (skipUntil.indexOf(token) !== -1) break;
					token = _scanNext();
				}
			}
			return node;
		}
		function _checkScanError() {
			switch (scanner.getTokenError()) {
				case 4:
					_error(t("Invalid unicode sequence in string."), ErrorCode.InvalidUnicode);
					return true;
				case 5:
					_error(t("Invalid escape character in string."), ErrorCode.InvalidEscapeCharacter);
					return true;
				case 3:
					_error(t("Unexpected end of number."), ErrorCode.UnexpectedEndOfNumber);
					return true;
				case 1:
					_error(t("Unexpected end of comment."), ErrorCode.UnexpectedEndOfComment);
					return true;
				case 2:
					_error(t("Unexpected end of string."), ErrorCode.UnexpectedEndOfString);
					return true;
				case 6:
					_error(t("Invalid characters in string. Control characters must be escaped."), ErrorCode.InvalidCharacter);
					return true;
			}
			return false;
		}
		function _finalize(node, scanNext) {
			node.length = scanner.getTokenOffset() + scanner.getTokenLength() - node.offset;
			if (scanNext) _scanNext();
			return node;
		}
		function _parseArray(parent) {
			if (scanner.getToken() !== 3) return;
			const node = new ArrayASTNodeImpl(parent, scanner.getTokenOffset());
			_scanNext();
			let needsComma = false;
			while (scanner.getToken() !== 4 && scanner.getToken() !== 17) {
				if (scanner.getToken() === 5) {
					if (!needsComma) _error(t("Value expected"), ErrorCode.ValueExpected);
					const commaOffset = scanner.getTokenOffset();
					_scanNext();
					if (scanner.getToken() === 4) {
						if (needsComma) _errorAtRange(t("Trailing comma"), ErrorCode.TrailingComma, commaOffset, commaOffset + 1);
						continue;
					}
				} else if (needsComma) _error(t("Expected comma"), ErrorCode.CommaExpected);
				const item = _parseValue(node);
				if (!item) _error(t("Value expected"), ErrorCode.ValueExpected, void 0, [], [4, 5]);
				else node.items.push(item);
				needsComma = true;
			}
			if (scanner.getToken() !== 4) return _error(t("Expected comma or closing bracket"), ErrorCode.CommaOrCloseBacketExpected, node);
			return _finalize(node, true);
		}
		const keyPlaceholder = new StringASTNodeImpl(void 0, 0, 0);
		function _parseProperty(parent, keysSeen) {
			const node = new PropertyASTNodeImpl(parent, scanner.getTokenOffset(), keyPlaceholder);
			let key = _parseString(node);
			if (!key) if (scanner.getToken() === 16) {
				_error(t("Property keys must be doublequoted"), ErrorCode.PropertyKeysMustBeDoublequoted);
				const keyNode = new StringASTNodeImpl(node, scanner.getTokenOffset(), scanner.getTokenLength());
				keyNode.value = scanner.getTokenValue();
				key = keyNode;
				_scanNext();
			} else return;
			node.keyNode = key;
			if (key.value !== "//") {
				const seen = keysSeen[key.value];
				if (seen) {
					_errorAtRange(t("Duplicate object key"), ErrorCode.DuplicateKey, node.keyNode.offset, node.keyNode.offset + node.keyNode.length, DiagnosticSeverity$1.Warning);
					if (isObject(seen)) _errorAtRange(t("Duplicate object key"), ErrorCode.DuplicateKey, seen.keyNode.offset, seen.keyNode.offset + seen.keyNode.length, DiagnosticSeverity$1.Warning);
					keysSeen[key.value] = true;
				} else keysSeen[key.value] = node;
			}
			if (scanner.getToken() === 6) {
				node.colonOffset = scanner.getTokenOffset();
				_scanNext();
			} else {
				_error(t("Colon expected"), ErrorCode.ColonExpected);
				if (scanner.getToken() === 10 && textDocument.positionAt(key.offset + key.length).line < textDocument.positionAt(scanner.getTokenOffset()).line) {
					node.length = key.length;
					return node;
				}
			}
			const value = _parseValue(node);
			if (!value) return _error(t("Value expected"), ErrorCode.ValueExpected, node, [], [2, 5]);
			node.valueNode = value;
			node.length = value.offset + value.length - node.offset;
			return node;
		}
		function _parseObject(parent) {
			if (scanner.getToken() !== 1) return;
			const node = new ObjectASTNodeImpl(parent, scanner.getTokenOffset());
			const keysSeen = Object.create(null);
			_scanNext();
			let needsComma = false;
			while (scanner.getToken() !== 2 && scanner.getToken() !== 17) {
				if (scanner.getToken() === 5) {
					if (!needsComma) _error(t("Property expected"), ErrorCode.PropertyExpected);
					const commaOffset = scanner.getTokenOffset();
					_scanNext();
					if (scanner.getToken() === 2) {
						if (needsComma) _errorAtRange(t("Trailing comma"), ErrorCode.TrailingComma, commaOffset, commaOffset + 1);
						continue;
					}
				} else if (needsComma) _error(t("Expected comma"), ErrorCode.CommaExpected);
				const property = _parseProperty(node, keysSeen);
				if (!property) _error(t("Property expected"), ErrorCode.PropertyExpected, void 0, [], [2, 5]);
				else node.properties.push(property);
				needsComma = true;
			}
			if (scanner.getToken() !== 2) return _error(t("Expected comma or closing brace"), ErrorCode.CommaOrCloseBraceExpected, node);
			return _finalize(node, true);
		}
		function _parseString(parent) {
			if (scanner.getToken() !== 10) return;
			const node = new StringASTNodeImpl(parent, scanner.getTokenOffset());
			node.value = scanner.getTokenValue();
			return _finalize(node, true);
		}
		function _parseNumber(parent) {
			if (scanner.getToken() !== 11) return;
			const node = new NumberASTNodeImpl(parent, scanner.getTokenOffset());
			if (scanner.getTokenError() === 0) {
				const tokenValue = scanner.getTokenValue();
				try {
					const numberValue = JSON.parse(tokenValue);
					if (!isNumber(numberValue)) return _error(t("Invalid number format."), ErrorCode.Undefined, node);
					node.value = numberValue;
				} catch (e) {
					return _error(t("Invalid number format."), ErrorCode.Undefined, node);
				}
				node.isInteger = tokenValue.indexOf(".") === -1;
			}
			return _finalize(node, true);
		}
		function _parseLiteral(parent) {
			switch (scanner.getToken()) {
				case 7: return _finalize(new NullASTNodeImpl(parent, scanner.getTokenOffset()), true);
				case 8: return _finalize(new BooleanASTNodeImpl(parent, true, scanner.getTokenOffset()), true);
				case 9: return _finalize(new BooleanASTNodeImpl(parent, false, scanner.getTokenOffset()), true);
				default: return;
			}
		}
		function _parseValue(parent) {
			return _parseArray(parent) || _parseObject(parent) || _parseString(parent) || _parseNumber(parent) || _parseLiteral(parent);
		}
		let _root = void 0;
		if (_scanNext() !== 17) {
			_root = _parseValue(_root);
			if (!_root) _error(t("Expected a JSON object, array or literal."), ErrorCode.Undefined);
			else if (scanner.getToken() !== 17) _error(t("End of file expected."), ErrorCode.Undefined);
		}
		return new JSONDocument(_root, problems, commentRanges);
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/json.js
	function stringifyObject(obj, indent, stringifyLiteral) {
		if (obj !== null && typeof obj === "object") {
			const newIndent = indent + "	";
			if (Array.isArray(obj)) {
				if (obj.length === 0) return "[]";
				let result = "[\n";
				for (let i = 0; i < obj.length; i++) {
					result += newIndent + stringifyObject(obj[i], newIndent, stringifyLiteral);
					if (i < obj.length - 1) result += ",";
					result += "\n";
				}
				result += indent + "]";
				return result;
			} else {
				const keys = Object.keys(obj);
				if (keys.length === 0) return "{}";
				let result = "{\n";
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					result += newIndent + JSON.stringify(key) + ": " + stringifyObject(obj[key], newIndent, stringifyLiteral);
					if (i < keys.length - 1) result += ",";
					result += "\n";
				}
				result += indent + "}";
				return result;
			}
		}
		return stringifyLiteral(obj);
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonCompletion.js
	var JSONCompletion = class {
		constructor(schemaService, contributions = [], promiseConstructor = Promise, clientCapabilities = {}) {
			this.schemaService = schemaService;
			this.contributions = contributions;
			this.promiseConstructor = promiseConstructor;
			this.clientCapabilities = clientCapabilities;
		}
		doResolve(item) {
			for (let i = this.contributions.length - 1; i >= 0; i--) {
				const resolveCompletion = this.contributions[i].resolveCompletion;
				if (resolveCompletion) {
					const resolver = resolveCompletion(item);
					if (resolver) return resolver;
				}
			}
			return this.promiseConstructor.resolve(item);
		}
		doComplete(document, position, doc) {
			const result = {
				items: [],
				isIncomplete: false
			};
			const text = document.getText();
			const offset = document.offsetAt(position);
			let node = doc.getNodeFromOffset(offset, true);
			if (this.isInComment(document, node ? node.offset : 0, offset)) return Promise.resolve(result);
			if (node && offset === node.offset + node.length && offset > 0) {
				const ch = text[offset - 1];
				if (node.type === "object" && ch === "}" || node.type === "array" && ch === "]") node = node.parent;
			}
			const currentWord = this.getCurrentWord(document, offset);
			let overwriteRange;
			if (node && (node.type === "string" || node.type === "number" || node.type === "boolean" || node.type === "null")) overwriteRange = Range.create(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
			else {
				let overwriteStart = offset - currentWord.length;
				if (overwriteStart > 0 && text[overwriteStart - 1] === "\"") overwriteStart--;
				overwriteRange = Range.create(document.positionAt(overwriteStart), position);
			}
			const proposed = /* @__PURE__ */ new Map();
			const collector = {
				add: (suggestion) => {
					let label = suggestion.label;
					const existing = proposed.get(label);
					if (!existing) {
						label = label.replace(/[\n]/g, "↵");
						if (label.length > 60) {
							const shortendedLabel = label.substr(0, 57).trim() + "...";
							if (!proposed.has(shortendedLabel)) label = shortendedLabel;
						}
						suggestion.textEdit = TextEdit.replace(overwriteRange, suggestion.insertText);
						suggestion.label = label;
						proposed.set(label, suggestion);
						result.items.push(suggestion);
					} else {
						if (!existing.documentation) existing.documentation = suggestion.documentation;
						if (!existing.detail) existing.detail = suggestion.detail;
						if (!existing.labelDetails) existing.labelDetails = suggestion.labelDetails;
					}
				},
				setAsIncomplete: () => {
					result.isIncomplete = true;
				},
				error: (message) => {
					console.error(message);
				},
				getNumberOfProposals: () => {
					return result.items.length;
				}
			};
			return this.schemaService.getSchemaForResource(document.uri, doc).then((schema) => {
				const collectionPromises = [];
				let addValue = true;
				let currentKey = "";
				let currentProperty = void 0;
				if (node) {
					if (node.type === "string") {
						const parent = node.parent;
						if (parent && parent.type === "property" && parent.keyNode === node) {
							addValue = !parent.valueNode;
							currentProperty = parent;
							currentKey = text.substr(node.offset + 1, node.length - 2);
							if (parent) node = parent.parent;
						}
					}
				}
				if (node && node.type === "object") {
					if (node.offset === offset) return result;
					node.properties.forEach((p) => {
						if (!currentProperty || currentProperty !== p) proposed.set(p.keyNode.value, CompletionItem.create("__"));
					});
					let separatorAfter = "";
					if (addValue) separatorAfter = this.evaluateSeparatorAfter(document, document.offsetAt(overwriteRange.end));
					if (schema) this.getPropertyCompletions(schema, doc, node, addValue, separatorAfter, collector);
					else this.getSchemaLessPropertyCompletions(doc, node, currentKey, collector);
					const location = getNodePath(node);
					this.contributions.forEach((contribution) => {
						const collectPromise = contribution.collectPropertyCompletions(document.uri, location, currentWord, addValue, separatorAfter === "", collector);
						if (collectPromise) collectionPromises.push(collectPromise);
					});
					if (!schema && currentWord.length > 0 && text.charAt(offset - currentWord.length - 1) !== "\"") {
						collector.add({
							kind: CompletionItemKind$2.Property,
							label: this.getLabelForValue(currentWord),
							insertText: this.getInsertTextForProperty(currentWord, void 0, false, separatorAfter),
							insertTextFormat: InsertTextFormat$1.Snippet,
							documentation: ""
						});
						collector.setAsIncomplete();
					}
				}
				const types = {};
				if (schema) this.getValueCompletions(schema, doc, node, offset, document, collector, types);
				else this.getSchemaLessValueCompletions(doc, node, offset, document, collector);
				if (this.contributions.length > 0) this.getContributedValueCompletions(doc, node, offset, document, collector, collectionPromises);
				return this.promiseConstructor.all(collectionPromises).then(() => {
					if (collector.getNumberOfProposals() === 0) {
						let offsetForSeparator = offset;
						if (node && (node.type === "string" || node.type === "number" || node.type === "boolean" || node.type === "null")) offsetForSeparator = node.offset + node.length;
						const separatorAfter = this.evaluateSeparatorAfter(document, offsetForSeparator);
						this.addFillerValueCompletions(types, separatorAfter, collector);
					}
					return result;
				});
			});
		}
		getPropertyCompletions(schema, doc, node, addValue, separatorAfter, collector) {
			doc.getMatchingSchemas(schema.schema, node.offset, void 0, schema.activeVocabularies).forEach((s) => {
				if (s.node === node && !s.inverted) {
					const schemaProperties = s.schema.properties;
					if (schemaProperties) Object.keys(schemaProperties).forEach((key) => {
						const propertySchema = schemaProperties[key];
						if (typeof propertySchema === "object" && !propertySchema.deprecationMessage && !propertySchema.doNotSuggest) {
							const proposal = {
								kind: CompletionItemKind$2.Property,
								label: key,
								insertText: this.getInsertTextForProperty(key, propertySchema, addValue, separatorAfter),
								insertTextFormat: InsertTextFormat$1.Snippet,
								filterText: this.getFilterTextForValue(key),
								documentation: this.fromMarkup(propertySchema.markdownDescription) || propertySchema.description || ""
							};
							if (propertySchema.completionDetail !== void 0) proposal.detail = propertySchema.completionDetail;
							if (propertySchema.suggestSortText !== void 0) proposal.sortText = propertySchema.suggestSortText;
							if (proposal.insertText && endsWith(proposal.insertText, `$1${separatorAfter}`)) proposal.command = {
								title: "Suggest",
								command: "editor.action.triggerSuggest"
							};
							collector.add(proposal);
						}
					});
					const schemaPropertyNames = s.schema.propertyNames;
					if (typeof schemaPropertyNames === "object" && !schemaPropertyNames.deprecationMessage && !schemaPropertyNames.doNotSuggest) {
						const propertyNameCompletionItem = (name, documentation, detail, sortText) => {
							const proposal = {
								kind: CompletionItemKind$2.Property,
								label: name,
								insertText: this.getInsertTextForProperty(name, void 0, addValue, separatorAfter),
								insertTextFormat: InsertTextFormat$1.Snippet,
								filterText: this.getFilterTextForValue(name),
								documentation: documentation || this.fromMarkup(schemaPropertyNames.markdownDescription) || schemaPropertyNames.description || "",
								sortText,
								detail
							};
							if (proposal.insertText && endsWith(proposal.insertText, `$1${separatorAfter}`)) proposal.command = {
								title: "Suggest",
								command: "editor.action.triggerSuggest"
							};
							collector.add(proposal);
						};
						if (schemaPropertyNames.enum) for (let i = 0; i < schemaPropertyNames.enum.length; i++) {
							let enumDescription = void 0;
							if (schemaPropertyNames.markdownEnumDescriptions && i < schemaPropertyNames.markdownEnumDescriptions.length) enumDescription = this.fromMarkup(schemaPropertyNames.markdownEnumDescriptions[i]);
							else if (schemaPropertyNames.enumDescriptions && i < schemaPropertyNames.enumDescriptions.length) enumDescription = schemaPropertyNames.enumDescriptions[i];
							const enumSortText = schemaPropertyNames.enumSortTexts?.[i];
							const enumDetails = schemaPropertyNames.enumDetails?.[i];
							propertyNameCompletionItem(schemaPropertyNames.enum[i], enumDescription, enumDetails, enumSortText);
						}
						if (schemaPropertyNames.examples) for (let i = 0; i < schemaPropertyNames.examples.length; i++) propertyNameCompletionItem(schemaPropertyNames.examples[i], void 0, void 0, void 0);
						if (schemaPropertyNames.const) propertyNameCompletionItem(schemaPropertyNames.const, void 0, schemaPropertyNames.completionDetail, schemaPropertyNames.suggestSortText);
					}
				}
			});
		}
		getSchemaLessPropertyCompletions(doc, node, currentKey, collector) {
			const collectCompletionsForSimilarObject = (obj) => {
				obj.properties.forEach((p) => {
					const key = p.keyNode.value;
					collector.add({
						kind: CompletionItemKind$2.Property,
						label: key,
						insertText: this.getInsertTextForValue(key, ""),
						insertTextFormat: InsertTextFormat$1.Snippet,
						filterText: this.getFilterTextForValue(key),
						documentation: ""
					});
				});
			};
			if (node.parent) {
				if (node.parent.type === "property") {
					const parentKey = node.parent.keyNode.value;
					doc.visit((n) => {
						if (n.type === "property" && n !== node.parent && n.keyNode.value === parentKey && n.valueNode && n.valueNode.type === "object") collectCompletionsForSimilarObject(n.valueNode);
						return true;
					});
				} else if (node.parent.type === "array") node.parent.items.forEach((n) => {
					if (n.type === "object" && n !== node) collectCompletionsForSimilarObject(n);
				});
			} else if (node.type === "object") collector.add({
				kind: CompletionItemKind$2.Property,
				label: "$schema",
				insertText: this.getInsertTextForProperty("$schema", void 0, true, ""),
				insertTextFormat: InsertTextFormat$1.Snippet,
				documentation: "",
				filterText: this.getFilterTextForValue("$schema")
			});
		}
		getSchemaLessValueCompletions(doc, node, offset, document, collector) {
			let offsetForSeparator = offset;
			if (node && (node.type === "string" || node.type === "number" || node.type === "boolean" || node.type === "null")) {
				offsetForSeparator = node.offset + node.length;
				node = node.parent;
			}
			if (!node) {
				collector.add({
					kind: this.getSuggestionKind("object"),
					label: "Empty object",
					insertText: this.getInsertTextForValue({}, ""),
					insertTextFormat: InsertTextFormat$1.Snippet,
					documentation: ""
				});
				collector.add({
					kind: this.getSuggestionKind("array"),
					label: "Empty array",
					insertText: this.getInsertTextForValue([], ""),
					insertTextFormat: InsertTextFormat$1.Snippet,
					documentation: ""
				});
				return;
			}
			const separatorAfter = this.evaluateSeparatorAfter(document, offsetForSeparator);
			const collectSuggestionsForValues = (value) => {
				if (value.parent && !contains(value.parent, offset, true)) collector.add({
					kind: this.getSuggestionKind(value.type),
					label: this.getLabelTextForMatchingNode(value, document),
					insertText: this.getInsertTextForMatchingNode(value, document, separatorAfter),
					insertTextFormat: InsertTextFormat$1.Snippet,
					documentation: ""
				});
				if (value.type === "boolean") this.addBooleanValueCompletion(!value.value, separatorAfter, collector);
			};
			if (node.type === "property") {
				if (offset > (node.colonOffset || 0)) {
					const valueNode = node.valueNode;
					if (valueNode && (offset > valueNode.offset + valueNode.length || valueNode.type === "object" || valueNode.type === "array")) return;
					const parentKey = node.keyNode.value;
					doc.visit((n) => {
						if (n.type === "property" && n.keyNode.value === parentKey && n.valueNode) collectSuggestionsForValues(n.valueNode);
						return true;
					});
					if (parentKey === "$schema" && node.parent && !node.parent.parent) this.addDollarSchemaCompletions(separatorAfter, collector);
				}
			}
			if (node.type === "array") if (node.parent && node.parent.type === "property") {
				const parentKey = node.parent.keyNode.value;
				doc.visit((n) => {
					if (n.type === "property" && n.keyNode.value === parentKey && n.valueNode && n.valueNode.type === "array") n.valueNode.items.forEach(collectSuggestionsForValues);
					return true;
				});
			} else node.items.forEach(collectSuggestionsForValues);
		}
		getValueCompletions(schema, doc, node, offset, document, collector, types) {
			let offsetForSeparator = offset;
			let parentKey = void 0;
			let valueNode = void 0;
			if (node && (node.type === "string" || node.type === "number" || node.type === "boolean" || node.type === "null")) {
				offsetForSeparator = node.offset + node.length;
				valueNode = node;
				node = node.parent;
			}
			if (!node) {
				this.addSchemaValueCompletions(schema.schema, "", collector, types);
				return;
			}
			if (node.type === "property" && offset > (node.colonOffset || 0)) {
				const valueNode = node.valueNode;
				if (valueNode && offset > valueNode.offset + valueNode.length) return;
				parentKey = node.keyNode.value;
				node = node.parent;
			}
			if (node && (parentKey !== void 0 || node.type === "array")) {
				const separatorAfter = this.evaluateSeparatorAfter(document, offsetForSeparator);
				const matchingSchemas = doc.getMatchingSchemas(schema.schema, node.offset, valueNode, schema.activeVocabularies);
				for (const s of matchingSchemas) if (s.node === node && !s.inverted && s.schema) {
					if (node.type === "array" && s.schema.items) {
						let c = collector;
						if (s.schema.uniqueItems) {
							const existingValues = /* @__PURE__ */ new Set();
							node.children.forEach((n) => {
								if (n.type !== "array" && n.type !== "object") existingValues.add(this.getLabelForValue(getNodeValue(n)));
							});
							c = {
								...collector,
								add(suggestion) {
									if (!existingValues.has(suggestion.label)) collector.add(suggestion);
								}
							};
						}
						if (Array.isArray(s.schema.items)) {
							const index = this.findItemAtOffset(node, document, offset);
							if (index < s.schema.items.length) this.addSchemaValueCompletions(s.schema.items[index], separatorAfter, c, types);
						} else this.addSchemaValueCompletions(s.schema.items, separatorAfter, c, types);
					}
					if (parentKey !== void 0) {
						let propertyMatched = false;
						if (s.schema.properties) {
							const propertySchema = s.schema.properties[parentKey];
							if (propertySchema) {
								propertyMatched = true;
								this.addSchemaValueCompletions(propertySchema, separatorAfter, collector, types);
							}
						}
						if (s.schema.patternProperties && !propertyMatched) {
							for (const pattern of Object.keys(s.schema.patternProperties)) if (extendedRegExp(pattern)?.test(parentKey)) {
								propertyMatched = true;
								const propertySchema = s.schema.patternProperties[pattern];
								this.addSchemaValueCompletions(propertySchema, separatorAfter, collector, types);
							}
						}
						if (s.schema.additionalProperties && !propertyMatched) {
							const propertySchema = s.schema.additionalProperties;
							this.addSchemaValueCompletions(propertySchema, separatorAfter, collector, types);
						}
					}
				}
				if (parentKey === "$schema" && !node.parent) this.addDollarSchemaCompletions(separatorAfter, collector);
				if (types["boolean"]) {
					this.addBooleanValueCompletion(true, separatorAfter, collector);
					this.addBooleanValueCompletion(false, separatorAfter, collector);
				}
				if (types["null"]) this.addNullValueCompletion(separatorAfter, collector);
			}
		}
		getContributedValueCompletions(doc, node, offset, document, collector, collectionPromises) {
			if (!node) this.contributions.forEach((contribution) => {
				const collectPromise = contribution.collectDefaultCompletions(document.uri, collector);
				if (collectPromise) collectionPromises.push(collectPromise);
			});
			else {
				if (node.type === "string" || node.type === "number" || node.type === "boolean" || node.type === "null") node = node.parent;
				if (node && node.type === "property" && offset > (node.colonOffset || 0)) {
					const parentKey = node.keyNode.value;
					const valueNode = node.valueNode;
					if ((!valueNode || offset <= valueNode.offset + valueNode.length) && node.parent) {
						const location = getNodePath(node.parent);
						this.contributions.forEach((contribution) => {
							const collectPromise = contribution.collectValueCompletions(document.uri, location, parentKey, collector);
							if (collectPromise) collectionPromises.push(collectPromise);
						});
					}
				}
			}
		}
		addSchemaValueCompletions(schema, separatorAfter, collector, types) {
			if (typeof schema === "object") {
				this.addEnumValueCompletions(schema, separatorAfter, collector);
				this.addDefaultValueCompletions(schema, separatorAfter, collector);
				this.collectTypes(schema, types);
				if (Array.isArray(schema.allOf)) schema.allOf.forEach((s) => this.addSchemaValueCompletions(s, separatorAfter, collector, types));
				if (Array.isArray(schema.anyOf)) schema.anyOf.forEach((s) => this.addSchemaValueCompletions(s, separatorAfter, collector, types));
				if (Array.isArray(schema.oneOf)) schema.oneOf.forEach((s) => this.addSchemaValueCompletions(s, separatorAfter, collector, types));
			}
		}
		addDefaultValueCompletions(schema, separatorAfter, collector, arrayDepth = 0) {
			let hasProposals = false;
			if (isDefined(schema.default)) {
				let type = schema.type;
				let value = schema.default;
				for (let i = arrayDepth; i > 0; i--) {
					value = [value];
					type = "array";
				}
				const completionItem = {
					kind: this.getSuggestionKind(type),
					label: this.getLabelForValue(value),
					insertText: this.getInsertTextForValue(value, separatorAfter),
					insertTextFormat: InsertTextFormat$1.Snippet
				};
				if (this.doesSupportsLabelDetails()) completionItem.labelDetails = { description: t("Default value") };
				else completionItem.detail = t("Default value");
				collector.add(completionItem);
				hasProposals = true;
			}
			if (Array.isArray(schema.examples)) schema.examples.forEach((example) => {
				let type = schema.type;
				let value = example;
				for (let i = arrayDepth; i > 0; i--) {
					value = [value];
					type = "array";
				}
				collector.add({
					kind: this.getSuggestionKind(type),
					label: this.getLabelForValue(value),
					insertText: this.getInsertTextForValue(value, separatorAfter),
					insertTextFormat: InsertTextFormat$1.Snippet
				});
				hasProposals = true;
			});
			if (Array.isArray(schema.defaultSnippets)) schema.defaultSnippets.forEach((s) => {
				let type = schema.type;
				let value = s.body;
				let label = s.label;
				let insertText;
				let filterText;
				if (isDefined(value)) {
					schema.type;
					for (let i = arrayDepth; i > 0; i--) value = [value];
					insertText = this.getInsertTextForSnippetValue(value, separatorAfter);
					filterText = this.getFilterTextForSnippetValue(value);
					label = label || this.getLabelForSnippetValue(value);
				} else if (typeof s.bodyText === "string") {
					let prefix = "", suffix = "", indent = "";
					for (let i = arrayDepth; i > 0; i--) {
						prefix = prefix + indent + "[\n";
						suffix = suffix + "\n" + indent + "]";
						indent += "	";
						type = "array";
					}
					insertText = prefix + indent + s.bodyText.split("\n").join("\n" + indent) + suffix + separatorAfter;
					label = label || insertText, filterText = insertText.replace(/[\n]/g, "");
				} else return;
				collector.add({
					kind: this.getSuggestionKind(type),
					label,
					documentation: this.fromMarkup(s.markdownDescription) || s.description,
					insertText,
					insertTextFormat: InsertTextFormat$1.Snippet,
					filterText
				});
				hasProposals = true;
			});
			if (!hasProposals && typeof schema.items === "object" && !Array.isArray(schema.items) && arrayDepth < 5) this.addDefaultValueCompletions(schema.items, separatorAfter, collector, arrayDepth + 1);
		}
		addEnumValueCompletions(schema, separatorAfter, collector) {
			if (isDefined(schema.const)) collector.add({
				kind: this.getSuggestionKind(schema.type),
				label: this.getLabelForValue(schema.const),
				insertText: this.getInsertTextForValue(schema.const, separatorAfter),
				insertTextFormat: InsertTextFormat$1.Snippet,
				documentation: this.fromMarkup(schema.markdownDescription) || schema.description
			});
			if (Array.isArray(schema.enum)) for (let i = 0, length = schema.enum.length; i < length; i++) {
				const enm = schema.enum[i];
				let documentation = this.fromMarkup(schema.markdownDescription) || schema.description;
				if (schema.markdownEnumDescriptions && i < schema.markdownEnumDescriptions.length && this.doesSupportMarkdown()) documentation = this.fromMarkup(schema.markdownEnumDescriptions[i]);
				else if (schema.enumDescriptions && i < schema.enumDescriptions.length) documentation = schema.enumDescriptions[i];
				collector.add({
					kind: this.getSuggestionKind(schema.type),
					label: this.getLabelForValue(enm),
					insertText: this.getInsertTextForValue(enm, separatorAfter),
					insertTextFormat: InsertTextFormat$1.Snippet,
					sortText: schema.enumSortTexts?.[i],
					detail: schema.enumDetails?.[i],
					documentation
				});
			}
		}
		collectTypes(schema, types) {
			if (Array.isArray(schema.enum) || isDefined(schema.const)) return;
			const type = schema.type;
			if (Array.isArray(type)) type.forEach((t) => types[t] = true);
			else if (type) types[type] = true;
		}
		addFillerValueCompletions(types, separatorAfter, collector) {
			if (types["object"]) collector.add({
				kind: this.getSuggestionKind("object"),
				label: "{}",
				insertText: this.getInsertTextForGuessedValue({}, separatorAfter),
				insertTextFormat: InsertTextFormat$1.Snippet,
				detail: t("New object"),
				documentation: ""
			});
			if (types["array"]) collector.add({
				kind: this.getSuggestionKind("array"),
				label: "[]",
				insertText: this.getInsertTextForGuessedValue([], separatorAfter),
				insertTextFormat: InsertTextFormat$1.Snippet,
				detail: t("New array"),
				documentation: ""
			});
		}
		addBooleanValueCompletion(value, separatorAfter, collector) {
			collector.add({
				kind: this.getSuggestionKind("boolean"),
				label: value ? "true" : "false",
				insertText: this.getInsertTextForValue(value, separatorAfter),
				insertTextFormat: InsertTextFormat$1.Snippet,
				documentation: ""
			});
		}
		addNullValueCompletion(separatorAfter, collector) {
			collector.add({
				kind: this.getSuggestionKind("null"),
				label: "null",
				insertText: "null" + separatorAfter,
				insertTextFormat: InsertTextFormat$1.Snippet,
				documentation: ""
			});
		}
		addDollarSchemaCompletions(separatorAfter, collector) {
			this.schemaService.getRegisteredSchemaIds((schema) => schema === "http" || schema === "https").forEach((schemaId) => {
				if (schemaId.startsWith("https://json-schema.org/draft-")) schemaId = schemaId + "#";
				collector.add({
					kind: CompletionItemKind$2.Module,
					label: this.getLabelForValue(schemaId),
					filterText: this.getFilterTextForValue(schemaId),
					insertText: this.getInsertTextForValue(schemaId, separatorAfter),
					insertTextFormat: InsertTextFormat$1.Snippet,
					documentation: ""
				});
			});
		}
		getLabelForValue(value) {
			return JSON.stringify(value);
		}
		getValueFromLabel(value) {
			return JSON.parse(value);
		}
		getFilterTextForValue(value) {
			return JSON.stringify(value);
		}
		getFilterTextForSnippetValue(value) {
			return JSON.stringify(value).replace(/\$\{\d+:([^}]+)\}|\$\d+/g, "$1");
		}
		getLabelForSnippetValue(value) {
			return JSON.stringify(value).replace(/\$\{\d+:([^}]+)\}|\$\d+/g, "$1");
		}
		getInsertTextForPlainText(text) {
			return text.replace(/[\\\$\}]/g, "\\$&");
		}
		getInsertTextForValue(value, separatorAfter) {
			const text = JSON.stringify(value, null, "	");
			if (text === "{}") return "{$1}" + separatorAfter;
			else if (text === "[]") return "[$1]" + separatorAfter;
			return this.getInsertTextForPlainText(text + separatorAfter);
		}
		getInsertTextForSnippetValue(value, separatorAfter) {
			const replacer = (value) => {
				if (typeof value === "string") {
					if (value[0] === "^") return value.substr(1);
				}
				return JSON.stringify(value);
			};
			return stringifyObject(value, "", replacer) + separatorAfter;
		}
		getInsertTextForGuessedValue(value, separatorAfter) {
			switch (typeof value) {
				case "object":
					if (value === null) return "${1:null}" + separatorAfter;
					return this.getInsertTextForValue(value, separatorAfter);
				case "string":
					let snippetValue = JSON.stringify(value);
					snippetValue = snippetValue.substr(1, snippetValue.length - 2);
					snippetValue = this.getInsertTextForPlainText(snippetValue);
					return "\"${1:" + snippetValue + "}\"" + separatorAfter;
				case "number":
				case "boolean": return "${1:" + JSON.stringify(value) + "}" + separatorAfter;
			}
			return this.getInsertTextForValue(value, separatorAfter);
		}
		getSuggestionKind(type) {
			if (Array.isArray(type)) {
				const array = type;
				type = array.length > 0 ? array[0] : void 0;
			}
			if (!type) return CompletionItemKind$2.Value;
			switch (type) {
				case "string": return CompletionItemKind$2.Value;
				case "object": return CompletionItemKind$2.Module;
				case "property": return CompletionItemKind$2.Property;
				default: return CompletionItemKind$2.Value;
			}
		}
		getLabelTextForMatchingNode(node, document) {
			switch (node.type) {
				case "array": return "[]";
				case "object": return "{}";
				default: return document.getText().substr(node.offset, node.length);
			}
		}
		getInsertTextForMatchingNode(node, document, separatorAfter) {
			switch (node.type) {
				case "array": return this.getInsertTextForValue([], separatorAfter);
				case "object": return this.getInsertTextForValue({}, separatorAfter);
				default:
					const content = document.getText().substr(node.offset, node.length) + separatorAfter;
					return this.getInsertTextForPlainText(content);
			}
		}
		getInsertTextForProperty(key, propertySchema, addValue, separatorAfter) {
			const propertyText = this.getInsertTextForValue(key, "");
			if (!addValue) return propertyText;
			const resultText = propertyText + ": ";
			let value;
			let nValueProposals = 0;
			if (propertySchema) {
				if (Array.isArray(propertySchema.defaultSnippets)) {
					if (propertySchema.defaultSnippets.length === 1) {
						const body = propertySchema.defaultSnippets[0].body;
						if (isDefined(body)) value = this.getInsertTextForSnippetValue(body, "");
					}
					nValueProposals += propertySchema.defaultSnippets.length;
				}
				if (propertySchema.enum) {
					if (!value && propertySchema.enum.length === 1) value = this.getInsertTextForGuessedValue(propertySchema.enum[0], "");
					nValueProposals += propertySchema.enum.length;
				}
				if (isDefined(propertySchema.const)) {
					if (!value) value = this.getInsertTextForGuessedValue(propertySchema.const, "");
					nValueProposals++;
				}
				if (isDefined(propertySchema.default)) {
					if (!value) value = this.getInsertTextForGuessedValue(propertySchema.default, "");
					nValueProposals++;
				}
				if (Array.isArray(propertySchema.examples) && propertySchema.examples.length) {
					if (!value) value = this.getInsertTextForGuessedValue(propertySchema.examples[0], "");
					nValueProposals += propertySchema.examples.length;
				}
				if (nValueProposals === 0) {
					let type = Array.isArray(propertySchema.type) ? propertySchema.type[0] : propertySchema.type;
					if (!type) {
						if (propertySchema.properties) type = "object";
						else if (propertySchema.items) type = "array";
					}
					switch (type) {
						case "boolean":
							value = "$1";
							break;
						case "string":
							value = "\"$1\"";
							break;
						case "object":
							value = "{$1}";
							break;
						case "array":
							value = "[$1]";
							break;
						case "number":
						case "integer":
							value = "${1:0}";
							break;
						case "null":
							value = "${1:null}";
							break;
						default:
							if (Array.isArray(propertySchema.oneOf) && propertySchema.oneOf.length > 0) {
								value = "$1";
								break;
							}
							return propertyText;
					}
				}
			}
			if (!value || nValueProposals > 1) value = "$1";
			return resultText + value + separatorAfter;
		}
		getCurrentWord(document, offset) {
			let i = offset - 1;
			const text = document.getText();
			while (i >= 0 && " 	\n\r\v\":{[,]}".indexOf(text.charAt(i)) === -1) i--;
			return text.substring(i + 1, offset);
		}
		evaluateSeparatorAfter(document, offset) {
			const scanner = createScanner(document.getText(), true);
			scanner.setPosition(offset);
			switch (scanner.scan()) {
				case 5:
				case 2:
				case 4:
				case 17: return "";
				default: return ",";
			}
		}
		findItemAtOffset(node, document, offset) {
			const scanner = createScanner(document.getText(), true);
			const children = node.items;
			for (let i = children.length - 1; i >= 0; i--) {
				const child = children[i];
				if (offset > child.offset + child.length) {
					scanner.setPosition(child.offset + child.length);
					if (scanner.scan() === 5 && offset >= scanner.getTokenOffset() + scanner.getTokenLength()) return i + 1;
					return i;
				} else if (offset >= child.offset) return i;
			}
			return 0;
		}
		isInComment(document, start, offset) {
			const scanner = createScanner(document.getText(), false);
			scanner.setPosition(start);
			let token = scanner.scan();
			while (token !== 17 && scanner.getTokenOffset() + scanner.getTokenLength() < offset) token = scanner.scan();
			return (token === 12 || token === 13) && scanner.getTokenOffset() <= offset;
		}
		fromMarkup(markupString) {
			if (markupString && this.doesSupportMarkdown()) return {
				kind: MarkupKind.Markdown,
				value: markupString
			};
		}
		doesSupportMarkdown() {
			if (!isDefined(this.supportsMarkdown)) {
				const documentationFormat = this.clientCapabilities.textDocument?.completion?.completionItem?.documentationFormat;
				this.supportsMarkdown = Array.isArray(documentationFormat) && documentationFormat.indexOf(MarkupKind.Markdown) !== -1;
			}
			return this.supportsMarkdown;
		}
		doesSupportsCommitCharacters() {
			if (!isDefined(this.supportsCommitCharacters)) this.labelDetailsSupport = this.clientCapabilities.textDocument?.completion?.completionItem?.commitCharactersSupport;
			return this.supportsCommitCharacters;
		}
		doesSupportsLabelDetails() {
			if (!isDefined(this.labelDetailsSupport)) this.labelDetailsSupport = this.clientCapabilities.textDocument?.completion?.completionItem?.labelDetailsSupport;
			return this.labelDetailsSupport;
		}
	};
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonHover.js
	var JSONHover = class {
		constructor(schemaService, contributions = [], promiseConstructor) {
			this.schemaService = schemaService;
			this.contributions = contributions;
			this.promise = promiseConstructor || Promise;
		}
		doHover(document, position, doc) {
			const offset = document.offsetAt(position);
			let node = doc.getNodeFromOffset(offset);
			if (!node || (node.type === "object" || node.type === "array") && offset > node.offset + 1 && offset < node.offset + node.length - 1) return this.promise.resolve(null);
			const hoverRangeNode = node;
			if (node.type === "string") {
				const parent = node.parent;
				if (parent && parent.type === "property" && parent.keyNode === node) {
					node = parent.valueNode;
					if (!node) return this.promise.resolve(null);
				}
			}
			const hoverRange = Range.create(document.positionAt(hoverRangeNode.offset), document.positionAt(hoverRangeNode.offset + hoverRangeNode.length));
			const createHover = (contents) => {
				return {
					contents,
					range: hoverRange
				};
			};
			const location = getNodePath(node);
			for (let i = this.contributions.length - 1; i >= 0; i--) {
				const promise = this.contributions[i].getInfoContribution(document.uri, location);
				if (promise) return promise.then((htmlContent) => createHover(htmlContent));
			}
			return this.schemaService.getSchemaForResource(document.uri, doc).then((schema) => {
				if (!schema) return null;
				let title = void 0;
				let markdownDescription = void 0;
				let markdownEnumValueDescription = void 0, enumValue = void 0;
				const matchingSchemas = doc.getMatchingSchemas(schema.schema, node.offset, void 0, schema.activeVocabularies).filter((s) => s.node === node && !s.inverted).map((s) => s.schema);
				for (const schema of matchingSchemas) {
					title = title || schema.title;
					markdownDescription = markdownDescription || schema.markdownDescription || toMarkdown(schema.description);
					if (schema.enum) {
						const idx = schema.enum.indexOf(getNodeValue(node));
						if (schema.markdownEnumDescriptions) markdownEnumValueDescription = schema.markdownEnumDescriptions[idx];
						else if (schema.enumDescriptions) markdownEnumValueDescription = toMarkdown(schema.enumDescriptions[idx]);
						if (markdownEnumValueDescription) {
							enumValue = schema.enum[idx];
							if (typeof enumValue !== "string") enumValue = JSON.stringify(enumValue);
						}
					}
				}
				let result = "";
				if (title) result = toMarkdown(title);
				if (markdownDescription) {
					if (result.length > 0) result += "\n\n";
					result += markdownDescription;
				}
				if (markdownEnumValueDescription) {
					if (result.length > 0) result += "\n\n";
					result += `\`${toMarkdownCodeBlock(enumValue)}\`: ${markdownEnumValueDescription}`;
				}
				return createHover([result]);
			});
		}
	};
	function toMarkdown(plain) {
		if (plain) return plain.trim().replace(/[\\`*_{}[\]()<>#+\-.!]/g, "\\$&").replace(/(^ +)/gm, (_match, g1) => "&nbsp;".repeat(g1.length)).replace(/( {2,})/g, (_match, g1) => " " + "&nbsp;".repeat(g1.length - 1)).replace(/(\t+)/g, (_match, g1) => "&nbsp;".repeat(g1.length * 4)).replace(/\n/g, "\\\n");
	}
	function toMarkdownCodeBlock(content) {
		if (content.indexOf("`") !== -1) return "`` " + content + " ``";
		return content;
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonValidation.js
	var JSONValidation = class {
		constructor(jsonSchemaService, promiseConstructor) {
			this.jsonSchemaService = jsonSchemaService;
			this.promise = promiseConstructor;
			this.validationEnabled = true;
		}
		configure(raw) {
			if (raw) {
				this.validationEnabled = raw.validate !== false;
				this.commentSeverity = raw.allowComments ? void 0 : DiagnosticSeverity$1.Error;
			}
		}
		doValidation(textDocument, jsonDocument, documentSettings, schema) {
			if (!this.validationEnabled) return this.promise.resolve([]);
			const diagnostics = [];
			const added = {};
			const addProblem = (problem) => {
				const signature = problem.range.start.line + " " + problem.range.start.character + " " + problem.message;
				if (!added[signature]) {
					added[signature] = true;
					diagnostics.push(problem);
				}
			};
			const getDiagnostics = (schema) => {
				let trailingCommaSeverity = documentSettings?.trailingCommas ? toDiagnosticSeverity(documentSettings.trailingCommas) : DiagnosticSeverity$1.Error;
				let commentSeverity = documentSettings?.comments ? toDiagnosticSeverity(documentSettings.comments) : this.commentSeverity;
				let schemaValidation = documentSettings?.schemaValidation ? toDiagnosticSeverity(documentSettings.schemaValidation) : DiagnosticSeverity$1.Warning;
				let schemaRequest = documentSettings?.schemaRequest ? toDiagnosticSeverity(documentSettings.schemaRequest) : DiagnosticSeverity$1.Warning;
				if (schema) {
					const addSchemaProblem = (errorMessage, errorCode, relatedInformation) => {
						if (jsonDocument.root && schemaRequest) {
							const astRoot = jsonDocument.root;
							const property = astRoot.type === "object" ? astRoot.properties[0] : void 0;
							if (property && property.keyNode.value === "$schema") {
								const node = property.valueNode || property;
								const range = Range.create(textDocument.positionAt(node.offset), textDocument.positionAt(node.offset + node.length));
								addProblem(Diagnostic.create(range, errorMessage, schemaRequest, errorCode, "json", relatedInformation));
							} else {
								const range = Range.create(textDocument.positionAt(astRoot.offset), textDocument.positionAt(astRoot.offset + 1));
								addProblem(Diagnostic.create(range, errorMessage, schemaRequest, errorCode, "json", relatedInformation));
							}
						}
					};
					if (schema.errors.length) {
						const error = schema.errors[0];
						addSchemaProblem(error.message, error.code, error.relatedInformation);
					} else if (schemaValidation) {
						for (const warning of schema.warnings) addSchemaProblem(warning.message, warning.code, warning.relatedInformation);
						const semanticErrors = jsonDocument.validate(textDocument, schema.schema, schemaValidation, documentSettings?.schemaDraft, schema.activeVocabularies);
						if (semanticErrors) semanticErrors.forEach(addProblem);
					}
					if (schemaAllowsComments(schema.schema)) commentSeverity = void 0;
					if (schemaAllowsTrailingCommas(schema.schema)) trailingCommaSeverity = void 0;
				}
				for (const p of jsonDocument.syntaxErrors) {
					if (p.code === ErrorCode.TrailingComma) {
						if (typeof trailingCommaSeverity !== "number") continue;
						p.severity = trailingCommaSeverity;
					}
					addProblem(p);
				}
				if (typeof commentSeverity === "number") {
					const message = t("Comments are not permitted in JSON.");
					jsonDocument.comments.forEach((c) => {
						addProblem(Diagnostic.create(c, message, commentSeverity, ErrorCode.CommentNotPermitted));
					});
				}
				return diagnostics;
			};
			if (schema) {
				const uri = schema.$id || schema.id || "schemaservice://untitled/" + idCounter$1++;
				return this.jsonSchemaService.registerExternalSchema({
					uri,
					schema
				}).getResolvedSchema().then((resolvedSchema) => {
					return getDiagnostics(resolvedSchema);
				});
			}
			return this.jsonSchemaService.getSchemaForResource(textDocument.uri, jsonDocument).then((schema) => {
				return getDiagnostics(schema);
			});
		}
		getLanguageStatus(textDocument, jsonDocument) {
			return { schemas: this.jsonSchemaService.getSchemaURIsForResource(textDocument.uri, jsonDocument) };
		}
	};
	var idCounter$1 = 0;
	function schemaAllowsComments(schemaRef) {
		if (schemaRef && typeof schemaRef === "object") {
			if (isBoolean(schemaRef.allowComments)) return schemaRef.allowComments;
			if (schemaRef.allOf) for (const schema of schemaRef.allOf) {
				const allow = schemaAllowsComments(schema);
				if (isBoolean(allow)) return allow;
			}
		}
	}
	function schemaAllowsTrailingCommas(schemaRef) {
		if (schemaRef && typeof schemaRef === "object") {
			if (isBoolean(schemaRef.allowTrailingCommas)) return schemaRef.allowTrailingCommas;
			const deprSchemaRef = schemaRef;
			if (isBoolean(deprSchemaRef["allowsTrailingCommas"])) return deprSchemaRef["allowsTrailingCommas"];
			if (schemaRef.allOf) for (const schema of schemaRef.allOf) {
				const allow = schemaAllowsTrailingCommas(schema);
				if (isBoolean(allow)) return allow;
			}
		}
	}
	function toDiagnosticSeverity(severityLevel) {
		switch (severityLevel) {
			case "error": return DiagnosticSeverity$1.Error;
			case "warning": return DiagnosticSeverity$1.Warning;
			case "ignore": return;
		}
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/colors.js
	var Digit0 = 48;
	var Digit9 = 57;
	var A = 65;
	var a = 97;
	var f = 102;
	function hexDigit(charCode) {
		if (charCode < Digit0) return 0;
		if (charCode <= Digit9) return charCode - Digit0;
		if (charCode < a) charCode += a - A;
		if (charCode >= a && charCode <= f) return charCode - a + 10;
		return 0;
	}
	function colorFromHex(text) {
		if (text[0] !== "#") return;
		switch (text.length) {
			case 4: return {
				red: hexDigit(text.charCodeAt(1)) * 17 / 255,
				green: hexDigit(text.charCodeAt(2)) * 17 / 255,
				blue: hexDigit(text.charCodeAt(3)) * 17 / 255,
				alpha: 1
			};
			case 5: return {
				red: hexDigit(text.charCodeAt(1)) * 17 / 255,
				green: hexDigit(text.charCodeAt(2)) * 17 / 255,
				blue: hexDigit(text.charCodeAt(3)) * 17 / 255,
				alpha: hexDigit(text.charCodeAt(4)) * 17 / 255
			};
			case 7: return {
				red: (hexDigit(text.charCodeAt(1)) * 16 + hexDigit(text.charCodeAt(2))) / 255,
				green: (hexDigit(text.charCodeAt(3)) * 16 + hexDigit(text.charCodeAt(4))) / 255,
				blue: (hexDigit(text.charCodeAt(5)) * 16 + hexDigit(text.charCodeAt(6))) / 255,
				alpha: 1
			};
			case 9: return {
				red: (hexDigit(text.charCodeAt(1)) * 16 + hexDigit(text.charCodeAt(2))) / 255,
				green: (hexDigit(text.charCodeAt(3)) * 16 + hexDigit(text.charCodeAt(4))) / 255,
				blue: (hexDigit(text.charCodeAt(5)) * 16 + hexDigit(text.charCodeAt(6))) / 255,
				alpha: (hexDigit(text.charCodeAt(7)) * 16 + hexDigit(text.charCodeAt(8))) / 255
			};
		}
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonDocumentSymbols.js
	var JSONDocumentSymbols = class {
		constructor(schemaService) {
			this.schemaService = schemaService;
		}
		findDocumentSymbols(document, doc, context = { resultLimit: Number.MAX_VALUE }) {
			const root = doc.root;
			if (!root) return [];
			let limit = context.resultLimit || Number.MAX_VALUE;
			const resourceString = document.uri;
			if (resourceString === "vscode://defaultsettings/keybindings.json" || endsWith(resourceString.toLowerCase(), "/user/keybindings.json")) {
				if (root.type === "array") {
					const result = [];
					for (const item of root.items) if (item.type === "object") {
						for (const property of item.properties) if (property.keyNode.value === "key" && property.valueNode) {
							const location = Location.create(document.uri, getRange(document, item));
							result.push({
								name: getName(property.valueNode),
								kind: SymbolKind.Function,
								location
							});
							limit--;
							if (limit <= 0) {
								if (context && context.onResultLimitExceeded) context.onResultLimitExceeded(resourceString);
								return result;
							}
						}
					}
					return result;
				}
			}
			const toVisit = [{
				node: root,
				containerName: ""
			}];
			let nextToVisit = 0;
			let limitExceeded = false;
			const result = [];
			const collectOutlineEntries = (node, containerName) => {
				if (node.type === "array") node.items.forEach((node) => {
					if (node) toVisit.push({
						node,
						containerName
					});
				});
				else if (node.type === "object") node.properties.forEach((property) => {
					const valueNode = property.valueNode;
					if (valueNode) if (limit > 0) {
						limit--;
						const location = Location.create(document.uri, getRange(document, property));
						const childContainerName = containerName ? containerName + "." + property.keyNode.value : property.keyNode.value;
						result.push({
							name: this.getKeyLabel(property),
							kind: this.getSymbolKind(valueNode.type),
							location,
							containerName
						});
						toVisit.push({
							node: valueNode,
							containerName: childContainerName
						});
					} else limitExceeded = true;
				});
			};
			while (nextToVisit < toVisit.length) {
				const next = toVisit[nextToVisit++];
				collectOutlineEntries(next.node, next.containerName);
			}
			if (limitExceeded && context && context.onResultLimitExceeded) context.onResultLimitExceeded(resourceString);
			return result;
		}
		findDocumentSymbols2(document, doc, context = { resultLimit: Number.MAX_VALUE }) {
			const root = doc.root;
			if (!root) return [];
			let limit = context.resultLimit || Number.MAX_VALUE;
			const resourceString = document.uri;
			if (resourceString === "vscode://defaultsettings/keybindings.json" || endsWith(resourceString.toLowerCase(), "/user/keybindings.json")) {
				if (root.type === "array") {
					const result = [];
					for (const item of root.items) if (item.type === "object") {
						for (const property of item.properties) if (property.keyNode.value === "key" && property.valueNode) {
							const range = getRange(document, item);
							const selectionRange = getRange(document, property.keyNode);
							result.push({
								name: getName(property.valueNode),
								kind: SymbolKind.Function,
								range,
								selectionRange
							});
							limit--;
							if (limit <= 0) {
								if (context && context.onResultLimitExceeded) context.onResultLimitExceeded(resourceString);
								return result;
							}
						}
					}
					return result;
				}
			}
			const result = [];
			const toVisit = [{
				node: root,
				result
			}];
			let nextToVisit = 0;
			let limitExceeded = false;
			const collectOutlineEntries = (node, result) => {
				if (node.type === "array") node.items.forEach((node, index) => {
					if (node) if (limit > 0) {
						limit--;
						const range = getRange(document, node);
						const selectionRange = range;
						const symbol = {
							name: String(index),
							kind: this.getSymbolKind(node.type),
							range,
							selectionRange,
							children: []
						};
						result.push(symbol);
						toVisit.push({
							result: symbol.children,
							node
						});
					} else limitExceeded = true;
				});
				else if (node.type === "object") node.properties.forEach((property) => {
					const valueNode = property.valueNode;
					if (valueNode) if (limit > 0) {
						limit--;
						const range = getRange(document, property);
						const selectionRange = getRange(document, property.keyNode);
						const children = [];
						const symbol = {
							name: this.getKeyLabel(property),
							kind: this.getSymbolKind(valueNode.type),
							range,
							selectionRange,
							children,
							detail: this.getDetail(valueNode)
						};
						result.push(symbol);
						toVisit.push({
							result: children,
							node: valueNode
						});
					} else limitExceeded = true;
				});
			};
			while (nextToVisit < toVisit.length) {
				const next = toVisit[nextToVisit++];
				collectOutlineEntries(next.node, next.result);
			}
			if (limitExceeded && context && context.onResultLimitExceeded) context.onResultLimitExceeded(resourceString);
			return result;
		}
		getSymbolKind(nodeType) {
			switch (nodeType) {
				case "object": return SymbolKind.Module;
				case "string": return SymbolKind.String;
				case "number": return SymbolKind.Number;
				case "array": return SymbolKind.Array;
				case "boolean": return SymbolKind.Boolean;
				default: return SymbolKind.Variable;
			}
		}
		getKeyLabel(property) {
			let name = property.keyNode.value;
			if (name) name = name.replace(/[\n]/g, "↵");
			if (name && name.trim()) return name;
			return `"${name}"`;
		}
		getDetail(node) {
			if (!node) return;
			if (node.type === "boolean" || node.type === "number" || node.type === "null" || node.type === "string") return String(node.value);
			else if (node.type === "array") return node.children.length ? void 0 : "[]";
			else if (node.type === "object") return node.children.length ? void 0 : "{}";
		}
		findDocumentColors(document, doc, context) {
			return this.schemaService.getSchemaForResource(document.uri, doc).then((schema) => {
				const result = [];
				if (schema) {
					let limit = context && typeof context.resultLimit === "number" ? context.resultLimit : Number.MAX_VALUE;
					const matchingSchemas = doc.getMatchingSchemas(schema.schema, void 0, void 0, schema.activeVocabularies);
					const visitedNode = {};
					for (const s of matchingSchemas) if (!s.inverted && s.schema && (s.schema.format === "color" || s.schema.format === "color-hex") && s.node && s.node.type === "string") {
						const nodeId = String(s.node.offset);
						if (!visitedNode[nodeId]) {
							const color = colorFromHex(getNodeValue(s.node));
							if (color) {
								const range = getRange(document, s.node);
								result.push({
									color,
									range
								});
							}
							visitedNode[nodeId] = true;
							limit--;
							if (limit <= 0) {
								if (context && context.onResultLimitExceeded) context.onResultLimitExceeded(document.uri);
								return result;
							}
						}
					}
				}
				return result;
			});
		}
		getColorPresentations(document, doc, color, range) {
			const result = [];
			const red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255);
			function toTwoDigitHex(n) {
				const r = n.toString(16);
				return r.length !== 2 ? "0" + r : r;
			}
			let label;
			if (color.alpha === 1) label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`;
			else label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`;
			result.push({
				label,
				textEdit: TextEdit.replace(range, JSON.stringify(label))
			});
			return result;
		}
	};
	function getRange(document, node) {
		return Range.create(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
	}
	function getName(node) {
		return getNodeValue(node) || t("<empty>");
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/configuration.js
	var schemaContributions = {
		schemaAssociations: [],
		schemas: {
			"https://json-schema.org/draft-04/schema": {
				"definitions": {
					"schemaArray": {
						"type": "array",
						"minItems": 1,
						"items": { "$ref": "#" }
					},
					"positiveInteger": {
						"type": "integer",
						"minimum": 0
					},
					"positiveIntegerDefault0": { "allOf": [{ "$ref": "#/definitions/positiveInteger" }, { "default": 0 }] },
					"simpleTypes": {
						"type": "string",
						"enum": [
							"array",
							"boolean",
							"integer",
							"null",
							"number",
							"object",
							"string"
						]
					},
					"stringArray": {
						"type": "array",
						"items": { "type": "string" },
						"minItems": 1,
						"uniqueItems": true
					}
				},
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"format": "uri"
					},
					"$schema": {
						"type": "string",
						"format": "uri"
					},
					"title": { "type": "string" },
					"description": { "type": "string" },
					"default": {},
					"multipleOf": {
						"type": "number",
						"minimum": 0,
						"exclusiveMinimum": true
					},
					"maximum": { "type": "number" },
					"exclusiveMaximum": {
						"type": "boolean",
						"default": false
					},
					"minimum": { "type": "number" },
					"exclusiveMinimum": {
						"type": "boolean",
						"default": false
					},
					"maxLength": { "allOf": [{ "$ref": "#/definitions/positiveInteger" }] },
					"minLength": { "allOf": [{ "$ref": "#/definitions/positiveIntegerDefault0" }] },
					"pattern": {
						"type": "string",
						"format": "regex"
					},
					"additionalItems": {
						"anyOf": [{ "type": "boolean" }, { "$ref": "#" }],
						"default": {}
					},
					"items": {
						"anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/schemaArray" }],
						"default": {}
					},
					"maxItems": { "allOf": [{ "$ref": "#/definitions/positiveInteger" }] },
					"minItems": { "allOf": [{ "$ref": "#/definitions/positiveIntegerDefault0" }] },
					"uniqueItems": {
						"type": "boolean",
						"default": false
					},
					"maxProperties": { "allOf": [{ "$ref": "#/definitions/positiveInteger" }] },
					"minProperties": { "allOf": [{ "$ref": "#/definitions/positiveIntegerDefault0" }] },
					"required": { "allOf": [{ "$ref": "#/definitions/stringArray" }] },
					"additionalProperties": {
						"anyOf": [{ "type": "boolean" }, { "$ref": "#" }],
						"default": {}
					},
					"definitions": {
						"type": "object",
						"additionalProperties": { "$ref": "#" },
						"default": {}
					},
					"properties": {
						"type": "object",
						"additionalProperties": { "$ref": "#" },
						"default": {}
					},
					"patternProperties": {
						"type": "object",
						"additionalProperties": { "$ref": "#" },
						"default": {}
					},
					"dependencies": {
						"type": "object",
						"additionalProperties": { "anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/stringArray" }] }
					},
					"enum": {
						"type": "array",
						"minItems": 1,
						"uniqueItems": true
					},
					"type": { "anyOf": [{ "$ref": "#/definitions/simpleTypes" }, {
						"type": "array",
						"items": { "$ref": "#/definitions/simpleTypes" },
						"minItems": 1,
						"uniqueItems": true
					}] },
					"format": { "anyOf": [{
						"type": "string",
						"enum": [
							"date-time",
							"uri",
							"email",
							"hostname",
							"ipv4",
							"ipv6",
							"regex"
						]
					}, { "type": "string" }] },
					"allOf": { "allOf": [{ "$ref": "#/definitions/schemaArray" }] },
					"anyOf": { "allOf": [{ "$ref": "#/definitions/schemaArray" }] },
					"oneOf": { "allOf": [{ "$ref": "#/definitions/schemaArray" }] },
					"not": { "allOf": [{ "$ref": "#" }] }
				},
				"dependencies": {
					"exclusiveMaximum": ["maximum"],
					"exclusiveMinimum": ["minimum"]
				},
				"default": {}
			},
			"https://json-schema.org/draft-07/schema": {
				"definitions": {
					"schemaArray": {
						"type": "array",
						"minItems": 1,
						"items": { "$ref": "#" }
					},
					"nonNegativeInteger": {
						"type": "integer",
						"minimum": 0
					},
					"nonNegativeIntegerDefault0": { "allOf": [{ "$ref": "#/definitions/nonNegativeInteger" }, { "default": 0 }] },
					"simpleTypes": { "enum": [
						"array",
						"boolean",
						"integer",
						"null",
						"number",
						"object",
						"string"
					] },
					"stringArray": {
						"type": "array",
						"items": { "type": "string" },
						"uniqueItems": true,
						"default": []
					}
				},
				"type": ["object", "boolean"],
				"properties": {
					"$id": {
						"type": "string",
						"format": "uri-reference"
					},
					"$schema": {
						"type": "string",
						"format": "uri"
					},
					"$ref": {
						"type": "string",
						"format": "uri-reference"
					},
					"$comment": { "type": "string" },
					"title": { "type": "string" },
					"description": { "type": "string" },
					"default": true,
					"readOnly": {
						"type": "boolean",
						"default": false
					},
					"examples": {
						"type": "array",
						"items": true
					},
					"multipleOf": {
						"type": "number",
						"exclusiveMinimum": 0
					},
					"maximum": { "type": "number" },
					"exclusiveMaximum": { "type": "number" },
					"minimum": { "type": "number" },
					"exclusiveMinimum": { "type": "number" },
					"maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
					"minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
					"pattern": {
						"type": "string",
						"format": "regex"
					},
					"additionalItems": { "$ref": "#" },
					"items": {
						"anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/schemaArray" }],
						"default": true
					},
					"maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
					"minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
					"uniqueItems": {
						"type": "boolean",
						"default": false
					},
					"contains": { "$ref": "#" },
					"maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
					"minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
					"required": { "$ref": "#/definitions/stringArray" },
					"additionalProperties": { "$ref": "#" },
					"definitions": {
						"type": "object",
						"additionalProperties": { "$ref": "#" },
						"default": {}
					},
					"properties": {
						"type": "object",
						"additionalProperties": { "$ref": "#" },
						"default": {}
					},
					"patternProperties": {
						"type": "object",
						"additionalProperties": { "$ref": "#" },
						"propertyNames": { "format": "regex" },
						"default": {}
					},
					"dependencies": {
						"type": "object",
						"additionalProperties": { "anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/stringArray" }] }
					},
					"propertyNames": { "$ref": "#" },
					"const": true,
					"enum": {
						"type": "array",
						"items": true,
						"minItems": 1,
						"uniqueItems": true
					},
					"type": { "anyOf": [{ "$ref": "#/definitions/simpleTypes" }, {
						"type": "array",
						"items": { "$ref": "#/definitions/simpleTypes" },
						"minItems": 1,
						"uniqueItems": true
					}] },
					"format": { "type": "string" },
					"contentMediaType": { "type": "string" },
					"contentEncoding": { "type": "string" },
					"if": { "$ref": "#" },
					"then": { "$ref": "#" },
					"else": { "$ref": "#" },
					"allOf": { "$ref": "#/definitions/schemaArray" },
					"anyOf": { "$ref": "#/definitions/schemaArray" },
					"oneOf": { "$ref": "#/definitions/schemaArray" },
					"not": { "$ref": "#" }
				},
				"default": true
			},
			"https://json-schema.org/draft/2020-12/schema": {
				$id: "https://json-schema.org/draft/2020-12/schema",
				$schema: "https://json-schema.org/draft/2020-12/schema",
				title: "(Flattened static) Core and Validation specifications meta-schema",
				type: ["object", "boolean"],
				properties: {
					definitions: {
						$comment: "While no longer an official keyword as it is replaced by $defs, this keyword is retained in the meta-schema to prevent incompatible extensions as it remains in common use.",
						type: "object",
						additionalProperties: { $ref: "#" },
						default: {}
					},
					dependencies: {
						$comment: "\"dependencies\" is no longer a keyword, but schema authors should avoid redefining it to facilitate a smooth transition to \"dependentSchemas\" and \"dependentRequired\"",
						type: "object",
						additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/$defs/stringArray" }] }
					},
					$id: {
						type: "string",
						format: "uri-reference",
						$comment: "Non-empty fragments not allowed.",
						pattern: "^[^#]*#?$"
					},
					$schema: {
						type: "string",
						format: "uri"
					},
					$anchor: {
						type: "string",
						pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
					},
					$ref: {
						type: "string",
						format: "uri-reference"
					},
					$dynamicRef: {
						type: "string",
						format: "uri-reference"
					},
					$vocabulary: {
						type: "object",
						propertyNames: {
							type: "string",
							format: "uri"
						},
						additionalProperties: { type: "boolean" }
					},
					$comment: { type: "string" },
					$defs: {
						type: "object",
						additionalProperties: { $ref: "#" },
						default: {}
					},
					prefixItems: { $ref: "#/$defs/schemaArray" },
					items: { $ref: "#" },
					contains: { $ref: "#" },
					additionalProperties: { $ref: "#" },
					properties: {
						type: "object",
						additionalProperties: { $ref: "#" },
						default: {}
					},
					patternProperties: {
						type: "object",
						additionalProperties: { $ref: "#" },
						propertyNames: { format: "regex" },
						default: {}
					},
					dependentSchemas: {
						type: "object",
						additionalProperties: { $ref: "#" }
					},
					propertyNames: { $ref: "#" },
					if: { $ref: "#" },
					then: { $ref: "#" },
					else: { $ref: "#" },
					allOf: { $ref: "#/$defs/schemaArray" },
					anyOf: { $ref: "#/$defs/schemaArray" },
					oneOf: { $ref: "#/$defs/schemaArray" },
					not: { $ref: "#" },
					unevaluatedItems: { $ref: "#" },
					unevaluatedProperties: { $ref: "#" },
					multipleOf: {
						type: "number",
						exclusiveMinimum: 0
					},
					maximum: { type: "number" },
					exclusiveMaximum: { type: "number" },
					minimum: { type: "number" },
					exclusiveMinimum: { type: "number" },
					maxLength: { $ref: "#/$defs/nonNegativeInteger" },
					minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
					pattern: {
						type: "string",
						format: "regex"
					},
					maxItems: { $ref: "#/$defs/nonNegativeInteger" },
					minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
					uniqueItems: {
						type: "boolean",
						default: false
					},
					maxContains: { $ref: "#/$defs/nonNegativeInteger" },
					minContains: {
						$ref: "#/$defs/nonNegativeInteger",
						default: 1
					},
					maxProperties: { $ref: "#/$defs/nonNegativeInteger" },
					minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
					required: { $ref: "#/$defs/stringArray" },
					dependentRequired: {
						type: "object",
						additionalProperties: { $ref: "#/$defs/stringArray" }
					},
					const: true,
					enum: {
						type: "array",
						items: true
					},
					type: { anyOf: [{ $ref: "#/$defs/simpleTypes" }, {
						type: "array",
						items: { $ref: "#/$defs/simpleTypes" },
						minItems: 1,
						uniqueItems: true
					}] },
					title: { type: "string" },
					description: { type: "string" },
					default: true,
					deprecated: {
						type: "boolean",
						default: false
					},
					readOnly: {
						type: "boolean",
						default: false
					},
					writeOnly: {
						type: "boolean",
						default: false
					},
					examples: {
						type: "array",
						items: true
					},
					format: { type: "string" },
					contentMediaType: { type: "string" },
					contentEncoding: { type: "string" },
					contentSchema: { $ref: "#" }
				},
				$defs: {
					schemaArray: {
						type: "array",
						minItems: 1,
						items: { $ref: "#" }
					},
					nonNegativeInteger: {
						type: "integer",
						minimum: 0
					},
					nonNegativeIntegerDefault0: {
						$ref: "#/$defs/nonNegativeInteger",
						default: 0
					},
					simpleTypes: { enum: [
						"array",
						"boolean",
						"integer",
						"null",
						"number",
						"object",
						"string"
					] },
					stringArray: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
						default: []
					}
				}
			},
			"https://json-schema.org/draft/2019-09/schema": {
				$id: "https://json-schema.org/draft/2019-09/schema",
				$schema: "https://json-schema.org/draft/2019-09/schema",
				title: "(Flattened static) Core and Validation specifications meta-schema",
				type: ["object", "boolean"],
				properties: {
					definitions: {
						$comment: "While no longer an official keyword as it is replaced by $defs, this keyword is retained in the meta-schema to prevent incompatible extensions as it remains in common use.",
						type: "object",
						additionalProperties: { $ref: "#" },
						default: {}
					},
					dependencies: {
						$comment: "\"dependencies\" is no longer a keyword, but schema authors should avoid redefining it to facilitate a smooth transition to \"dependentSchemas\" and \"dependentRequired\"",
						type: "object",
						additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/$defs/stringArray" }] }
					},
					$id: {
						type: "string",
						format: "uri-reference",
						$comment: "Non-empty fragments not allowed.",
						pattern: "^[^#]*#?$"
					},
					$schema: {
						type: "string",
						format: "uri"
					},
					$anchor: {
						type: "string",
						pattern: "^[A-Za-z][-A-Za-z0-9.:_]*$"
					},
					$ref: {
						type: "string",
						format: "uri-reference"
					},
					$recursiveAnchor: {
						type: "boolean",
						default: false
					},
					$vocabulary: {
						type: "object",
						propertyNames: {
							type: "string",
							format: "uri"
						},
						additionalProperties: { type: "boolean" }
					},
					$comment: { type: "string" },
					$defs: {
						type: "object",
						additionalProperties: { $ref: "#" },
						default: {}
					},
					additionalItems: { $ref: "#" },
					unevaluatedItems: { $ref: "#" },
					items: { anyOf: [{ $ref: "#" }, { $ref: "#/$defs/schemaArray" }] },
					contains: { $ref: "#" },
					additionalProperties: { $ref: "#" },
					unevaluatedProperties: { $ref: "#" },
					properties: {
						type: "object",
						additionalProperties: { $ref: "#" },
						default: {}
					},
					patternProperties: {
						type: "object",
						additionalProperties: { $ref: "#" },
						propertyNames: { format: "regex" },
						default: {}
					},
					dependentSchemas: {
						type: "object",
						additionalProperties: { $ref: "#" }
					},
					propertyNames: { $ref: "#" },
					if: { $ref: "#" },
					then: { $ref: "#" },
					else: { $ref: "#" },
					allOf: { $ref: "#/$defs/schemaArray" },
					anyOf: { $ref: "#/$defs/schemaArray" },
					oneOf: { $ref: "#/$defs/schemaArray" },
					not: { $ref: "#" },
					multipleOf: {
						type: "number",
						exclusiveMinimum: 0
					},
					maximum: { type: "number" },
					exclusiveMaximum: { type: "number" },
					minimum: { type: "number" },
					exclusiveMinimum: { type: "number" },
					maxLength: { $ref: "#/$defs/nonNegativeInteger" },
					minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
					pattern: {
						type: "string",
						format: "regex"
					},
					maxItems: { $ref: "#/$defs/nonNegativeInteger" },
					minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
					uniqueItems: {
						type: "boolean",
						default: false
					},
					maxContains: { $ref: "#/$defs/nonNegativeInteger" },
					minContains: {
						$ref: "#/$defs/nonNegativeInteger",
						default: 1
					},
					maxProperties: { $ref: "#/$defs/nonNegativeInteger" },
					minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
					required: { $ref: "#/$defs/stringArray" },
					dependentRequired: {
						type: "object",
						additionalProperties: { $ref: "#/$defs/stringArray" }
					},
					const: true,
					enum: {
						type: "array",
						items: true
					},
					type: { anyOf: [{ $ref: "#/$defs/simpleTypes" }, {
						type: "array",
						items: { $ref: "#/$defs/simpleTypes" },
						minItems: 1,
						uniqueItems: true
					}] },
					title: { type: "string" },
					description: { type: "string" },
					default: true,
					deprecated: {
						type: "boolean",
						default: false
					},
					readOnly: {
						type: "boolean",
						default: false
					},
					writeOnly: {
						type: "boolean",
						default: false
					},
					examples: {
						type: "array",
						items: true
					},
					format: { type: "string" },
					contentMediaType: { type: "string" },
					contentEncoding: { type: "string" },
					contentSchema: { $ref: "#" }
				},
				$defs: {
					schemaArray: {
						type: "array",
						minItems: 1,
						items: { $ref: "#" }
					},
					nonNegativeInteger: {
						type: "integer",
						minimum: 0
					},
					nonNegativeIntegerDefault0: {
						$ref: "#/$defs/nonNegativeInteger",
						default: 0
					},
					simpleTypes: { enum: [
						"array",
						"boolean",
						"integer",
						"null",
						"number",
						"object",
						"string"
					] },
					stringArray: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
						default: []
					}
				}
			}
		}
	};
	var descriptions = {
		id: t("A unique identifier for the schema."),
		$schema: t("The schema to verify this document against."),
		title: t("A descriptive title of the schema."),
		description: t("A long description of the schema. Used in hover menus and suggestions."),
		default: t("A default value. Used by suggestions."),
		multipleOf: t("A number that should cleanly divide the current value (i.e. have no remainder)."),
		maximum: t("The maximum numerical value, inclusive by default."),
		exclusiveMaximum: t("Makes the maximum property exclusive."),
		minimum: t("The minimum numerical value, inclusive by default."),
		exclusiveMinimum: t("Makes the minimum property exclusive."),
		maxLength: t("The maximum length of a string."),
		minLength: t("The minimum length of a string."),
		pattern: t("A regular expression to match the string against. It is not implicitly anchored."),
		additionalItems: t("For arrays, only when items is set as an array. If items are a schema, this schema validates items after the ones specified by the items schema. If false, additional items will cause validation to fail."),
		items: t("For arrays. Can either be a schema to validate every element against or an array of schemas to validate each item against in order (the first schema will validate the first element, the second schema will validate the second element, and so on."),
		maxItems: t("The maximum number of items that can be inside an array. Inclusive."),
		minItems: t("The minimum number of items that can be inside an array. Inclusive."),
		uniqueItems: t("If all of the items in the array must be unique. Defaults to false."),
		maxProperties: t("The maximum number of properties an object can have. Inclusive."),
		minProperties: t("The minimum number of properties an object can have. Inclusive."),
		required: t("An array of strings that lists the names of all properties required on this object."),
		additionalProperties: t("Either a schema or a boolean. If a schema, used to validate all properties not matched by 'properties', 'propertyNames', or 'patternProperties'. If false, any properties not defined by the adjacent keywords will cause this schema to fail."),
		definitions: t("Not used for validation. Place subschemas here that you wish to reference inline with $ref."),
		properties: t("A map of property names to schemas for each property."),
		patternProperties: t("A map of regular expressions on property names to schemas for matching properties."),
		dependencies: t("A map of property names to either an array of property names or a schema. An array of property names means the property named in the key depends on the properties in the array being present in the object in order to be valid. If the value is a schema, then the schema is only applied to the object if the property in the key exists on the object."),
		enum: t("The set of literal values that are valid."),
		type: t("Either a string of one of the basic schema types (number, integer, null, array, object, boolean, string) or an array of strings specifying a subset of those types."),
		format: t("Describes the format expected for the value. By default, not used for validation"),
		allOf: t("An array of schemas, all of which must match."),
		anyOf: t("An array of schemas, where at least one must match."),
		oneOf: t("An array of schemas, exactly one of which must match."),
		not: t("A schema which must not match."),
		$id: t("A unique identifier for the schema."),
		$ref: t("Reference a definition hosted on any location."),
		$comment: t("Comments from schema authors to readers or maintainers of the schema."),
		readOnly: t("Indicates that the value of the instance is managed exclusively by the owning authority."),
		examples: t("Sample JSON values associated with a particular schema, for the purpose of illustrating usage."),
		contains: t("An array instance is valid against \"contains\" if at least one of its elements is valid against the given schema."),
		propertyNames: t("If the instance is an object, this keyword validates if every property name in the instance validates against the provided schema."),
		const: t("An instance validates successfully against this keyword if its value is equal to the value of the keyword."),
		contentMediaType: t("Describes the media type of a string property."),
		contentEncoding: t("Describes the content encoding of a string property."),
		if: t("The validation outcome of the \"if\" subschema controls which of the \"then\" or \"else\" keywords are evaluated."),
		then: t("The \"then\" subschema is used for validation when the \"if\" subschema succeeds."),
		else: t("The \"else\" subschema is used for validation when the \"if\" subschema fails.")
	};
	for (const schemaName in schemaContributions.schemas) {
		const schema = schemaContributions.schemas[schemaName];
		for (const property in schema.properties) {
			let propertyObject = schema.properties[property];
			if (typeof propertyObject === "boolean") propertyObject = schema.properties[property] = {};
			const description = descriptions[property];
			if (description) propertyObject["description"] = description;
		}
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/glob.js
	function createRegex(glob, opts) {
		if (typeof glob !== "string") throw new TypeError("Expected a string");
		const str = String(glob);
		let reStr = "";
		const extended = opts ? !!opts.extended : false;
		const globstar = opts ? !!opts.globstar : false;
		let inGroup = false;
		const flags = opts && typeof opts.flags === "string" ? opts.flags : "";
		let c;
		for (let i = 0, len = str.length; i < len; i++) {
			c = str[i];
			switch (c) {
				case "/":
				case "$":
				case "^":
				case "+":
				case ".":
				case "(":
				case ")":
				case "=":
				case "!":
				case "|":
					reStr += "\\" + c;
					break;
				case "?": if (extended) {
					reStr += ".";
					break;
				}
				case "[":
				case "]": if (extended) {
					reStr += c;
					break;
				}
				case "{": if (extended) {
					inGroup = true;
					reStr += "(";
					break;
				}
				case "}": if (extended) {
					inGroup = false;
					reStr += ")";
					break;
				}
				case ",":
					if (inGroup) {
						reStr += "|";
						break;
					}
					reStr += "\\" + c;
					break;
				case "*":
					const prevChar = str[i - 1];
					let starCount = 1;
					while (str[i + 1] === "*") {
						starCount++;
						i++;
					}
					const nextChar = str[i + 1];
					if (!globstar) reStr += ".*";
					else if (starCount > 1 && (prevChar === "/" || prevChar === void 0 || prevChar === "{" || prevChar === ",") && (nextChar === "/" || nextChar === void 0 || nextChar === "," || nextChar === "}")) {
						if (nextChar === "/") i++;
						else if (prevChar === "/" && reStr.endsWith("\\/")) reStr = reStr.substr(0, reStr.length - 2);
						reStr += "((?:[^/]*(?:/|$))*)";
					} else reStr += "([^/]*)";
					break;
				default: reStr += c;
			}
		}
		if (!flags || !~flags.indexOf("g")) reStr = "^" + reStr + "$";
		return new RegExp(reStr, flags);
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonSchemaService.js
	var hasSchemePattern = /^[A-Za-z][A-Za-z0-9+\-.+]*:\/.*/.source;
	var hasSchemeRegex = new RegExp(hasSchemePattern);
	var BANG = "!";
	var PATH_SEP = "/";
	var FilePatternAssociation = class {
		constructor(pattern, folderUri, uris) {
			this.folderUri = folderUri;
			this.uris = uris;
			this.globWrappers = [];
			try {
				for (let patternString of pattern) {
					const include = patternString[0] !== BANG;
					if (!include) patternString = patternString.substring(1);
					if (patternString.length > 0) {
						if (patternString[0] === PATH_SEP) patternString = patternString.substring(1);
						this.globWrappers.push({
							regexp: createRegex("**/" + patternString, {
								extended: true,
								globstar: true
							}),
							include
						});
					}
				}
				if (folderUri) {
					folderUri = normalizeResourceForMatching(folderUri);
					if (!folderUri.endsWith("/")) folderUri = folderUri + "/";
					this.folderUri = folderUri;
				}
			} catch (e) {
				this.globWrappers.length = 0;
				this.uris = [];
			}
		}
		matchesPattern(fileName) {
			if (this.folderUri && !fileName.startsWith(this.folderUri)) return false;
			let match = false;
			for (const { regexp, include } of this.globWrappers) if (regexp.test(fileName)) match = include;
			return match;
		}
		getURIs() {
			return this.uris;
		}
	};
	var SchemaHandle = class {
		constructor(service, uri, unresolvedSchemaContent) {
			this.service = service;
			this.uri = uri;
			this.dependencies = /* @__PURE__ */ new Set();
			this.anchors = void 0;
			if (unresolvedSchemaContent) this.unresolvedSchema = this.service.promise.resolve(new UnresolvedSchema(unresolvedSchemaContent));
		}
		getUnresolvedSchema() {
			if (!this.unresolvedSchema) this.unresolvedSchema = this.service.loadSchema(this.uri);
			return this.unresolvedSchema;
		}
		getResolvedSchema() {
			if (!this.resolvedSchema) this.resolvedSchema = this.getUnresolvedSchema().then((unresolved) => {
				return this.service.resolveSchemaContent(unresolved, this);
			});
			return this.resolvedSchema;
		}
		clearSchema() {
			const hasChanges = !!this.unresolvedSchema;
			this.resolvedSchema = void 0;
			this.unresolvedSchema = void 0;
			this.dependencies.clear();
			this.anchors = void 0;
			return hasChanges;
		}
		setSchemaContent(schemaContent) {
			this.unresolvedSchema = this.service.promise.resolve(new UnresolvedSchema(schemaContent));
			this.resolvedSchema = void 0;
			this.anchors = void 0;
		}
	};
	var UnresolvedSchema = class {
		constructor(schema, errors = []) {
			this.schema = schema;
			this.errors = errors;
		}
	};
	function toDiagnostic(message, code, relatedURL) {
		return {
			message,
			code,
			relatedInformation: relatedURL ? [{
				location: {
					uri: relatedURL,
					range: Range.create(0, 0, 0, 0)
				},
				message
			}] : void 0
		};
	}
	var ResolvedSchema = class {
		constructor(schema, errors = [], warnings = [], schemaDraft, activeVocabularies) {
			this.schema = schema;
			this.errors = errors;
			this.warnings = warnings;
			this.schemaDraft = schemaDraft;
			this.activeVocabularies = activeVocabularies;
		}
		getSection(path) {
			const schemaRef = this.getSectionRecursive(path, this.schema);
			if (schemaRef) return asSchema(schemaRef);
		}
		getSectionRecursive(path, schema) {
			if (!schema || typeof schema === "boolean" || path.length === 0) return schema;
			const next = path.shift();
			if (schema.properties && typeof schema.properties[next]) return this.getSectionRecursive(path, schema.properties[next]);
			else if (schema.patternProperties) {
				for (const pattern of Object.keys(schema.patternProperties)) if (extendedRegExp(pattern)?.test(next)) return this.getSectionRecursive(path, schema.patternProperties[pattern]);
			} else if (typeof schema.additionalProperties === "object") return this.getSectionRecursive(path, schema.additionalProperties);
			else if (next.match("[0-9]+")) {
				if (Array.isArray(schema.items)) {
					const index = parseInt(next, 10);
					if (!isNaN(index) && schema.items[index]) return this.getSectionRecursive(path, schema.items[index]);
				} else if (schema.items) return this.getSectionRecursive(path, schema.items);
			}
		}
	};
	var JSONSchemaService = class JSONSchemaService {
		static traverseSchemaProperties(node, callback) {
			const schemaMapProps = [
				"definitions",
				"$defs",
				"properties",
				"patternProperties",
				"dependencies",
				"dependentSchemas"
			];
			const singleSchemaProps = [
				"additionalItems",
				"additionalProperties",
				"not",
				"contains",
				"propertyNames",
				"if",
				"then",
				"else",
				"unevaluatedItems",
				"unevaluatedProperties",
				"items"
			];
			const schemaArrayProps = [
				"anyOf",
				"allOf",
				"oneOf",
				"prefixItems"
			];
			const visitValue = (value) => {
				if (value) {
					if (Array.isArray(value)) value.forEach((item) => visitValue(item));
					else if (typeof value === "object") callback(value);
				}
			};
			for (const prop of schemaMapProps) {
				const map = node[prop];
				if (map && typeof map === "object") Object.values(map).forEach(visitValue);
			}
			for (const prop of singleSchemaProps) {
				const propValue = node[prop];
				if (propValue) visitValue(propValue);
			}
			for (const prop of schemaArrayProps) {
				const propValue = node[prop];
				if (propValue) visitValue(propValue);
			}
		}
		constructor(requestService, contextService, promiseConstructor, fallbackSchemaProvider) {
			this.contextService = contextService;
			this.requestService = requestService;
			this.promiseConstructor = promiseConstructor || Promise;
			this.fallbackSchemaProvider = fallbackSchemaProvider;
			this.callOnDispose = [];
			this.contributionSchemas = {};
			this.contributionAssociations = [];
			this.schemasById = {};
			this.filePatternAssociations = [];
			this.registeredSchemasIds = {};
		}
		getRegisteredSchemaIds(filter) {
			return Object.keys(this.registeredSchemasIds).filter((id) => {
				const scheme = u.parse(id).scheme;
				return scheme !== "schemaservice" && (!filter || filter(scheme));
			});
		}
		get promise() {
			return this.promiseConstructor;
		}
		dispose() {
			while (this.callOnDispose.length > 0) this.callOnDispose.pop()();
		}
		onResourceChange(uri) {
			this.cachedSchemaForResource = void 0;
			let hasChanges = false;
			uri = normalizeId(uri);
			const toWalk = [uri];
			const all = Object.keys(this.schemasById).map((key) => this.schemasById[key]);
			while (toWalk.length) {
				const curr = toWalk.pop();
				for (let i = 0; i < all.length; i++) {
					const handle = all[i];
					if (handle && (handle.uri === curr || handle.dependencies.has(curr))) {
						if (handle.uri !== curr) toWalk.push(handle.uri);
						if (handle.clearSchema()) hasChanges = true;
						all[i] = void 0;
					}
				}
			}
			return hasChanges;
		}
		setSchemaContributions(schemaContributions) {
			if (schemaContributions.schemas) {
				const schemas = schemaContributions.schemas;
				for (const id in schemas) {
					const normalizedId = normalizeId(id);
					this.contributionSchemas[normalizedId] = this.addSchemaHandle(normalizedId, schemas[id]);
				}
			}
			if (Array.isArray(schemaContributions.schemaAssociations)) {
				const schemaAssociations = schemaContributions.schemaAssociations;
				for (let schemaAssociation of schemaAssociations) {
					const uris = schemaAssociation.uris.map(normalizeId);
					const association = this.addFilePatternAssociation(schemaAssociation.pattern, schemaAssociation.folderUri, uris);
					this.contributionAssociations.push(association);
				}
			}
		}
		addSchemaHandle(id, unresolvedSchemaContent) {
			const schemaHandle = new SchemaHandle(this, id, unresolvedSchemaContent);
			this.schemasById[id] = schemaHandle;
			return schemaHandle;
		}
		getOrAddSchemaHandle(id, unresolvedSchemaContent) {
			return this.schemasById[id] || this.addSchemaHandle(id, unresolvedSchemaContent);
		}
		addFilePatternAssociation(pattern, folderUri, uris) {
			const fpa = new FilePatternAssociation(pattern, folderUri, uris);
			this.filePatternAssociations.push(fpa);
			return fpa;
		}
		registerExternalSchema(config) {
			const id = normalizeId(config.uri);
			this.registeredSchemasIds[id] = true;
			this.cachedSchemaForResource = void 0;
			if (config.fileMatch && config.fileMatch.length) this.addFilePatternAssociation(config.fileMatch, config.folderUri, [id]);
			return config.schema ? this.addSchemaHandle(id, config.schema) : this.getOrAddSchemaHandle(id);
		}
		clearExternalSchemas() {
			this.schemasById = {};
			this.filePatternAssociations = [];
			this.registeredSchemasIds = {};
			this.cachedSchemaForResource = void 0;
			for (const id in this.contributionSchemas) {
				this.schemasById[id] = this.contributionSchemas[id];
				this.registeredSchemasIds[id] = true;
			}
			for (const contributionAssociation of this.contributionAssociations) this.filePatternAssociations.push(contributionAssociation);
		}
		getResolvedSchema(schemaId) {
			const id = normalizeId(schemaId);
			const schemaHandle = this.schemasById[id];
			if (schemaHandle) return schemaHandle.getResolvedSchema();
			return this.promise.resolve(void 0);
		}
		loadSchema(url) {
			if (!this.requestService) {
				const errorMessage = t("Unable to load schema from '{0}'. No schema request service available", toDisplayString(url));
				return this.promise.resolve(new UnresolvedSchema({}, [toDiagnostic(errorMessage, ErrorCode.SchemaResolveError, url)]));
			}
			return this.requestService(url).then((content) => {
				if (!content) return new UnresolvedSchema({}, [toDiagnostic(t("Unable to load schema from '{0}': No content.", toDisplayString(url)), ErrorCode.SchemaResolveError, url)]);
				const errors = [];
				if (content.charCodeAt(0) === 65279) {
					errors.push(toDiagnostic(t("Problem reading content from '{0}': UTF-8 with BOM detected, only UTF 8 is allowed.", toDisplayString(url)), ErrorCode.SchemaResolveError, url));
					content = content.trimStart();
				}
				let schemaContent = {};
				const jsonErrors = [];
				schemaContent = parse$1(content, jsonErrors);
				if (jsonErrors.length) errors.push(toDiagnostic(t("Unable to parse content from '{0}': Parse error at offset {1}.", toDisplayString(url), jsonErrors[0].offset), ErrorCode.SchemaResolveError, url));
				return new UnresolvedSchema(schemaContent, errors);
			}, (error) => {
				let { message, code } = error;
				if (typeof message !== "string") {
					let errorMessage = error.toString();
					const errorSplit = error.toString().split("Error: ");
					if (errorSplit.length > 1) errorMessage = errorSplit[1];
					if (endsWith(errorMessage, ".")) errorMessage = errorMessage.substr(0, errorMessage.length - 1);
					message = errorMessage;
				}
				let errorCode = ErrorCode.SchemaResolveError;
				if (typeof code === "number" && code < 65536) errorCode += code;
				return new UnresolvedSchema({}, [toDiagnostic(t("Unable to load schema from '{0}': {1}.", toDisplayString(url), message), errorCode, url)]);
			});
		}
		resolveSchemaContent(schemaToResolve, handle) {
			const resolveErrors = schemaToResolve.errors.slice(0);
			const schema = schemaToResolve.schema;
			const embeddedRegisteredFor = /* @__PURE__ */ new Set();
			const embeddedSchemaUris = /* @__PURE__ */ new Set();
			const referenceScopes = /* @__PURE__ */ new WeakMap();
			const completedSchemas = /* @__PURE__ */ new WeakMap();
			const isCompleted = (node, base, baseHandle) => completedSchemas.get(node)?.get(base)?.has(baseHandle) === true;
			const markCompleted = (node, base, baseHandle) => {
				let scopes = completedSchemas.get(node);
				if (!scopes) completedSchemas.set(node, scopes = /* @__PURE__ */ new Map());
				let handles = scopes.get(base);
				if (!handles) scopes.set(base, handles = /* @__PURE__ */ new Set());
				handles.add(baseHandle);
			};
			const schemaDraft = schema.$schema ? getSchemaDraftFromId(schema.$schema) : void 0;
			if (schemaDraft === SchemaDraft.v3) return this.promise.resolve(new ResolvedSchema({}, [toDiagnostic(t("Draft-03 schemas are not supported."), ErrorCode.SchemaUnsupportedFeature)], [], schemaDraft, void 0));
			let activeVocabularies = void 0;
			const extractVocabularies = (metaschema) => {
				if (!metaschema.$vocabulary || typeof metaschema.$vocabulary !== "object") return;
				const vocabs = /* @__PURE__ */ new Map();
				for (const [uri, required] of Object.entries(metaschema.$vocabulary)) vocabs.set(uri, required === true);
				return vocabs.size > 0 ? vocabs : void 0;
			};
			const contextService = this.contextService;
			const setHidden = (obj, key, value) => {
				Object.defineProperty(obj, key, {
					value,
					enumerable: false,
					writable: true,
					configurable: true
				});
			};
			const dynamicRefInfoOf = (node) => {
				let info = node.$dynamicRefInfo;
				if (!info) {
					info = {};
					setHidden(node, "$dynamicRefInfo", info);
				}
				return info;
			};
			const findSectionAndBase = (schema, path, baseHandle) => {
				path = decodeURIComponent(path);
				let current = schema;
				let currentBaseSchema = schema;
				let currentBaseHandle = baseHandle;
				if (path[0] === "/") path = path.substring(1);
				path.split("/").some((part) => {
					part = part.replace(/~1/g, "/").replace(/~0/g, "~");
					current = current[part];
					if (current === void 0 || current === null) return true;
					const id = getSchemaId(current);
					if (isString(id) && id.charAt(0) !== "#") {
						let resolvedUri = id;
						if (contextService && !hasSchemeRegex.test(id)) resolvedUri = contextService.resolveRelativePath(id, currentBaseHandle.uri);
						resolvedUri = normalizeId(resolvedUri);
						currentBaseSchema = current;
						currentBaseHandle = this.getOrAddSchemaHandle(resolvedUri);
					}
					return false;
				});
				return {
					section: current,
					baseSchema: currentBaseSchema,
					baseHandle: currentBaseHandle
				};
			};
			const findSchemaById = (schema, handle, id) => {
				if (!handle.anchors) handle.anchors = collectAnchors(schema);
				return handle.anchors.get(id);
			};
			const getSchemaId = (schema) => schema.$id || schema.id || schema.$originalId;
			const unionAnchorMaps = (target, srcMaps) => {
				if (srcMaps === void 0) return;
				let maps = target.$anchorMaps;
				if (maps === void 0) {
					maps = {
						dynamic: /* @__PURE__ */ new Map(),
						local: /* @__PURE__ */ new Map()
					};
					setHidden(target, "$anchorMaps", maps);
				}
				for (const [name, node] of srcMaps.dynamic) if (!maps.dynamic.has(name)) maps.dynamic.set(name, node);
			};
			const merge = (target, section) => {
				const targetHasSiblingKeywords = hasRefSiblingKeywords(target);
				const sectionScope = referenceScopes.get(section);
				if (sectionScope && !targetHasSiblingKeywords) referenceScopes.set(target, sectionScope);
				for (const key in section) {
					if (!section.hasOwnProperty(key) || key === "id" || key === "$id") continue;
					target[key] = (key === "properties" || key === "patternProperties") && typeof section[key] === "object" && section[key] !== null && typeof target[key] === "object" && target[key] !== null ? {
						...target[key],
						...section[key]
					} : section[key];
				}
				const id = getSchemaId(section);
				if (id && !getSchemaId(target) && !targetHasSiblingKeywords) setHidden(target, "$originalId", id);
				const src = section;
				const dst = target;
				if (src.$dynamicRefInfo !== void 0 && dst.$dynamicRefInfo === void 0) setHidden(target, "$dynamicRefInfo", src.$dynamicRefInfo);
				unionAnchorMaps(dst, src.$anchorMaps);
			};
			const hasKeyword = (schema, keyword) => schema[keyword] !== void 0;
			const hasAnyKeyword = (schema, keywords) => keywords.some((keyword) => hasKeyword(schema, keyword));
			const objectPropertyKeywords = ["properties", "patternProperties"];
			const ignoredRefSiblingKeywords = /* @__PURE__ */ new Set([
				"$ref",
				"$schema",
				"$id",
				"id",
				"$comment"
			]);
			const hasRefSiblingKeywords = (schema) => Object.keys(schema).some((key) => !ignoredRefSiblingKeywords.has(key));
			const objectEvaluatorKeywords = [
				...objectPropertyKeywords,
				"additionalProperties",
				"dependentSchemas",
				"allOf",
				"anyOf",
				"oneOf",
				"if",
				"then",
				"else"
			];
			const arrayEvaluatorKeywords = [
				"items",
				"additionalItems",
				"prefixItems",
				"allOf",
				"anyOf",
				"oneOf",
				"if",
				"then",
				"else"
			];
			const containsBoundKeywords = ["minContains", "maxContains"];
			const conditionalBranchKeywords = ["then", "else"];
			const arrayApplicatorKeywords = [
				"items",
				"prefixItems",
				"additionalItems"
			];
			const uses2020_12ArrayAnnotations = schemaDraft === void 0 || schemaDraft >= SchemaDraft.v2020_12;
			const needsScopeIsolation = (referencedSchema, referencingSchema) => {
				const hasSiblingObjectProperties = hasAnyKeyword(referencingSchema, objectPropertyKeywords);
				if (hasKeyword(referencedSchema, "additionalProperties") && hasSiblingObjectProperties) return true;
				if (hasKeyword(referencedSchema, "additionalItems") && Array.isArray(referencingSchema.items)) return true;
				const hasSiblingObjectEvaluators = hasAnyKeyword(referencingSchema, objectEvaluatorKeywords);
				if (hasKeyword(referencedSchema, "unevaluatedProperties") && hasSiblingObjectEvaluators) return true;
				const hasSiblingArrayEvaluators = hasAnyKeyword(referencingSchema, arrayEvaluatorKeywords) || uses2020_12ArrayAnnotations && hasKeyword(referencingSchema, "contains");
				if (hasKeyword(referencedSchema, "unevaluatedItems") && hasSiblingArrayEvaluators) return true;
				if (hasKeyword(referencingSchema, "unevaluatedItems") && hasAnyKeyword(referencedSchema, arrayApplicatorKeywords)) return true;
				if (hasKeyword(referencedSchema, "contains") && hasAnyKeyword(referencingSchema, containsBoundKeywords)) return true;
				if (Array.isArray(referencedSchema.items) && Array.isArray(referencingSchema.items)) return true;
				if (hasAnyKeyword(referencedSchema, containsBoundKeywords) && hasKeyword(referencingSchema, "contains")) return true;
				if (hasKeyword(referencedSchema, "if") && hasAnyKeyword(referencingSchema, conditionalBranchKeywords)) return true;
				if (hasAnyKeyword(referencedSchema, conditionalBranchKeywords) && hasKeyword(referencingSchema, "if")) return true;
				return uses2020_12ArrayAnnotations && hasKeyword(referencedSchema, "items") && hasKeyword(referencingSchema, "prefixItems");
			};
			const mergeRef = (target, sourceRoot, sourceHandle, refSegment, isolateExternalResource = false) => {
				let section;
				let sectionBaseSchema = sourceRoot;
				let sectionBaseHandle = sourceHandle;
				if (refSegment === void 0 || refSegment.length === 0) section = sourceRoot;
				else if (refSegment.charAt(0) === "/") ({section, baseSchema: sectionBaseSchema, baseHandle: sectionBaseHandle} = findSectionAndBase(sourceRoot, refSegment, sourceHandle));
				else section = findSchemaById(sourceRoot, sourceHandle, refSegment);
				if (typeof section === "boolean") section = section ? {} : { not: {} };
				if (section) {
					const sectionScope = referenceScopes.get(section) ?? {
						schema: sectionBaseSchema,
						handle: sectionBaseHandle
					};
					referenceScopes.set(section, sectionScope);
					if (section.$ref && (sectionBaseHandle !== sourceHandle || hasRefSiblingKeywords(target))) {
						const innerSegments = section.$ref.split("#", 2);
						if (innerSegments[0].length > 0 && contextService && !hasSchemeRegex.test(innerSegments[0])) {
							section = {
								...section,
								$ref: contextService.resolveRelativePath(innerSegments[0], sectionBaseHandle.uri) + (innerSegments[1] !== void 0 ? "#" + innerSegments[1] : "")
							};
							referenceScopes.set(section, sectionScope);
						}
					}
					const reservedKeys = /* @__PURE__ */ new Set([
						"$ref",
						"$defs",
						"definitions",
						"$schema",
						"$id",
						"id"
					]);
					const keepOnWrapperKeys = /* @__PURE__ */ new Set([
						"$recursiveAnchor",
						"$dynamicAnchor",
						"unevaluatedItems",
						"unevaluatedProperties"
					]);
					if (schemaDraft !== void 0 && schemaDraft < SchemaDraft.v2019_09) {
						for (const key in target) if (target.hasOwnProperty(key) && !reservedKeys.has(key)) delete target[key];
						merge(target, section);
					} else if (isolateExternalResource || needsScopeIsolation(section, target)) {
						const siblingSchema = {};
						const refSchema = { ...section };
						if (isolateExternalResource) {
							delete refSchema.$id;
							delete refSchema.id;
							setHidden(refSchema, "$originalId", sectionScope.handle.uri);
						}
						referenceScopes.set(refSchema, sectionScope);
						const targetScope = referenceScopes.get(target);
						if (targetScope) referenceScopes.set(siblingSchema, targetScope);
						for (const key in target) if (target.hasOwnProperty(key) && !reservedKeys.has(key) && !keepOnWrapperKeys.has(key)) {
							const k = key;
							siblingSchema[k] = target[k];
							delete target[k];
						}
						target.allOf = [refSchema, siblingSchema];
					} else merge(target, section);
				} else {
					const message = t("$ref '{0}' in '{1}' can not be resolved.", refSegment || "", sourceHandle.uri);
					resolveErrors.push(toDiagnostic(message, ErrorCode.SchemaResolveError));
				}
			};
			const getExternalSchemaHandle = (uri, parentHandle) => {
				if (contextService && !hasSchemeRegex.test(uri)) uri = contextService.resolveRelativePath(uri, parentHandle.uri);
				uri = normalizeId(uri);
				return this.getOrAddSchemaHandle(uri);
			};
			const resolveExternalLink = (node, uri, refSegment, parentHandle, continuationBase, continuationHandle, followedRedirects = /* @__PURE__ */ new Set()) => {
				const referencedHandle = getExternalSchemaHandle(uri, parentHandle);
				uri = referencedHandle.uri;
				return referencedHandle.getUnresolvedSchema().then((unresolvedSchema) => {
					parentHandle.dependencies.add(uri);
					const rootRef = unresolvedSchema.schema.$ref;
					const alreadyFollowed = followedRedirects.has(uri);
					followedRedirects.add(uri);
					if (!alreadyFollowed && refSegment !== void 0 && isString(rootRef) && Object.keys(unresolvedSchema.schema).every((key) => key === "$ref")) {
						const rootRefSegments = rootRef.split("#", 2);
						if (rootRefSegments[0].length > 0 && rootRefSegments[1] === void 0) return resolveExternalLink(node, rootRefSegments[0], refSegment, referencedHandle, continuationBase, continuationHandle, followedRedirects);
					}
					if (unresolvedSchema.errors.length) {
						const error = unresolvedSchema.errors[0];
						refSegment && uri + "" + refSegment;
						const errorMessage = refSegment ? t("Problems loading reference '{0}': {1}", refSegment, error.message) : error.message;
						resolveErrors.push(toDiagnostic(errorMessage, error.code, uri));
					}
					if (!embeddedRegisteredFor.has(uri)) {
						embeddedRegisteredFor.add(uri);
						registerEmbeddedSchemas(unresolvedSchema.schema, uri);
					}
					if (unresolvedSchema.schema.$anchorMaps === void 0) collectDynamicAnchors(unresolvedSchema.schema);
					mergeRef(node, unresolvedSchema.schema, referencedHandle, refSegment, continuationBase !== void 0 && !embeddedSchemaUris.has(referencedHandle.uri));
					unionAnchorMaps(node, unresolvedSchema.schema.$anchorMaps);
					return resolveRefs(node, continuationBase ?? unresolvedSchema.schema, continuationHandle ?? referencedHandle);
				});
			};
			const resolveDynamicRef = (schema, newBase, newBaseHandle, currentBaseHandle) => {
				const info = dynamicRefInfoOf(schema);
				const segments = schema.$dynamicRef.split("#", 2);
				delete schema.$dynamicRef;
				const fragment = segments[1];
				const dynamicName = isString(fragment) && fragment.length > 0 && fragment.charAt(0) !== "/" ? fragment : void 0;
				if (dynamicName !== void 0) info.name = dynamicName;
				if (segments[0].length > 0) {
					const target = {};
					info.target = target;
					const refBase = referenceScopes.has(schema) ? newBaseHandle : newBase === schema ? currentBaseHandle : newBaseHandle;
					return resolveExternalLink(target, segments[0], segments[1], refBase);
				}
				let target;
				if (dynamicName !== void 0 && info.scope?.$anchorMaps) target = info.scope.$anchorMaps.local.get(dynamicName);
				if (target === void 0) {
					const container = {};
					mergeRef(container, newBase, newBaseHandle, segments[1]);
					target = container;
				}
				info.target = target;
			};
			const resolveRefs = (node, parentSchema, parentHandle) => {
				const prefetchExternalSchema = (uri, parentHandle) => {
					getExternalSchemaHandle(uri, parentHandle).getUnresolvedSchema();
				};
				const prefetchExternalRefs = (schema, currentBase, currentBaseHandle, seen) => {
					if (!schema || typeof schema !== "object" || seen.has(schema)) return;
					seen.add(schema);
					const id = getSchemaId(schema);
					const referenceScope = referenceScopes.get(schema);
					let newBase = referenceScope?.schema ?? currentBase;
					let newBaseHandle = referenceScope?.handle ?? currentBaseHandle;
					if (!referenceScope && isString(id) && id.charAt(0) !== "#") {
						let resolvedUri = id;
						if (contextService && !hasSchemeRegex.test(id)) resolvedUri = contextService.resolveRelativePath(id, currentBaseHandle.uri);
						newBase = schema;
						newBaseHandle = this.getOrAddSchemaHandle(normalizeId(resolvedUri));
					}
					if (isCompleted(schema, newBase, newBaseHandle)) return;
					const refBase = referenceScope ? newBaseHandle : newBase === schema ? currentBaseHandle : newBaseHandle;
					if (schema.$ref) {
						const segments = schema.$ref.split("#", 2);
						if (segments[0].length > 0) prefetchExternalSchema(segments[0], refBase);
						if (schemaDraft !== void 0 && schemaDraft < SchemaDraft.v2019_09) return;
					}
					if (schema.$dynamicRef && (schemaDraft === void 0 || schemaDraft >= SchemaDraft.v2020_12)) {
						const segments = schema.$dynamicRef.split("#", 2);
						if (segments[0].length > 0) prefetchExternalSchema(segments[0], refBase);
					}
					JSONSchemaService.traverseSchemaProperties(schema, (childSchema) => {
						prefetchExternalRefs(childSchema, newBase, newBaseHandle, seen);
					});
				};
				prefetchExternalRefs(node, parentSchema, parentHandle, /* @__PURE__ */ new Set());
				const traverseWithBaseTracking = (schema, currentBase, currentBaseHandle, isRoot, seen) => {
					if (!schema || typeof schema !== "object" || seen.has(schema)) return this.promise.resolve(void 0);
					seen.add(schema);
					const id = getSchemaId(schema);
					const referenceScope = referenceScopes.get(schema);
					let newBase = referenceScope?.schema ?? currentBase;
					let newBaseHandle = referenceScope?.handle ?? currentBaseHandle;
					if (!referenceScope && isString(id) && id.charAt(0) !== "#") {
						let resolvedUri = id;
						if (contextService && !hasSchemeRegex.test(id)) resolvedUri = contextService.resolveRelativePath(id, currentBaseHandle.uri);
						resolvedUri = normalizeId(resolvedUri);
						newBase = schema;
						newBaseHandle = this.getOrAddSchemaHandle(resolvedUri);
						if (!this.schemasById[resolvedUri]) this.addSchemaHandle(resolvedUri, schema);
					}
					if (isCompleted(schema, newBase, newBaseHandle)) return this.promise.resolve(void 0);
					const complete = (result) => result.then(() => {
						const scope = referenceScopes.get(schema);
						markCompleted(schema, scope?.schema ?? newBase, scope?.handle ?? newBaseHandle);
					});
					const seenRefs = /* @__PURE__ */ new Set();
					while (schema.$ref) {
						const ref = schema.$ref;
						const segments = ref.split("#", 2);
						const isPreDraft201909 = schemaDraft !== void 0 && schemaDraft < SchemaDraft.v2019_09;
						const preservesOwnBase = !isPreDraft201909 && hasRefSiblingKeywords(schema) && (newBase === schema || schemaDraft !== void 0);
						delete schema.$ref;
						if (segments[0].length > 0) {
							const refBaseHandle = isPreDraft201909 && newBase === schema ? currentBaseHandle : newBaseHandle;
							const continuationHandle = newBase === schema ? currentBaseHandle : newBaseHandle;
							return complete(resolveExternalLink(schema, segments[0], segments[1], refBaseHandle, preservesOwnBase ? newBase : void 0, preservesOwnBase ? continuationHandle : void 0).then(() => void 0));
						} else if (!seenRefs.has(ref)) {
							const refId = segments[1];
							mergeRef(schema, newBase, newBaseHandle, refId);
							seenRefs.add(ref);
						}
					}
					const traverseChildren = () => {
						let result = this.promise.resolve(void 0);
						JSONSchemaService.traverseSchemaProperties(schema, (childSchema) => {
							result = result.then(() => traverseWithBaseTracking(childSchema, newBase, newBaseHandle, false, seen));
						});
						return result;
					};
					if (schema.$dynamicRef && (schemaDraft === void 0 || schemaDraft >= SchemaDraft.v2020_12)) {
						const dynamicRefPromise = resolveDynamicRef(schema, newBase, newBaseHandle, currentBaseHandle);
						if (dynamicRefPromise) return complete(dynamicRefPromise.then(() => traverseChildren()));
					}
					return complete(traverseChildren());
				};
				return traverseWithBaseTracking(node, parentSchema, parentHandle, true, /* @__PURE__ */ new Set());
			};
			const collectAnchors = (root) => {
				const result = /* @__PURE__ */ new Map();
				const seen = /* @__PURE__ */ new Set();
				const draft = root.$schema ? getSchemaDraftFromId(root.$schema) : schemaDraft;
				const traverseForAnchors = (node, isRoot) => {
					if (!node || typeof node !== "object" || seen.has(node)) return;
					seen.add(node);
					const id = getSchemaId(node);
					if (!isRoot && isString(id) && id.charAt(0) !== "#") return;
					const fragmentAnchor = (draft === void 0 || draft < SchemaDraft.v2019_09) && isString(id) && id.charAt(0) === "#" ? id.substring(1) : void 0;
					const dollarAnchor = draft === void 0 || draft >= SchemaDraft.v2019_09 ? node.$anchor : void 0;
					const dynamicAnchor = draft === void 0 || draft >= SchemaDraft.v2020_12 ? node.$dynamicAnchor : void 0;
					const registerAnchor = (anchor) => {
						if (!anchor) return;
						if (result.has(anchor) && result.get(anchor) !== node) resolveErrors.push(toDiagnostic(t("Duplicate anchor declaration: '{0}'", anchor), ErrorCode.SchemaResolveError));
						else result.set(anchor, node);
					};
					registerAnchor(fragmentAnchor ?? dollarAnchor);
					registerAnchor(dynamicAnchor);
					JSONSchemaService.traverseSchemaProperties(node, (childSchema) => {
						traverseForAnchors(childSchema, false);
					});
				};
				traverseForAnchors(root, true);
				return result;
			};
			const collectDynamicAnchors = (root) => {
				const draft = root && typeof root === "object" && root.$schema ? getSchemaDraftFromId(root.$schema) : schemaDraft;
				if (!(draft === void 0 || draft >= SchemaDraft.v2020_12)) return;
				const seen = /* @__PURE__ */ new Set();
				const visit = (node, resourceRoot) => {
					if (!node || typeof node !== "object" || seen.has(node)) return;
					seen.add(node);
					let currentRoot = resourceRoot;
					const id = getSchemaId(node);
					if (node === root || isString(id) && id.charAt(0) !== "#") {
						currentRoot = node;
						if (!currentRoot.$anchorMaps) setHidden(currentRoot, "$anchorMaps", {
							dynamic: /* @__PURE__ */ new Map(),
							local: /* @__PURE__ */ new Map()
						});
					}
					const maps = currentRoot.$anchorMaps;
					if (isString(node.$dynamicAnchor)) {
						if (!maps.dynamic.has(node.$dynamicAnchor)) maps.dynamic.set(node.$dynamicAnchor, node);
						if (!maps.local.has(node.$dynamicAnchor)) maps.local.set(node.$dynamicAnchor, node);
					}
					if (isString(node.$anchor) && !maps.local.has(node.$anchor)) maps.local.set(node.$anchor, node);
					if (isString(node.$dynamicRef)) dynamicRefInfoOf(node).scope = currentRoot;
					JSONSchemaService.traverseSchemaProperties(node, (childSchema) => {
						visit(childSchema, currentRoot);
					});
				};
				visit(root, root);
			};
			const registerEmbeddedSchemas = (root, baseUri) => {
				const seen = /* @__PURE__ */ new Set();
				const resolveId = (id, currentBaseUri) => {
					if (contextService && !hasSchemeRegex.test(id)) return normalizeId(contextService.resolveRelativePath(id, currentBaseUri));
					return normalizeId(id);
				};
				const visit = (node, currentBaseUri, currentBaseSchema, isDocumentRoot) => {
					if (!node || typeof node !== "object" || seen.has(node) || referenceScopes.has(node)) return;
					seen.add(node);
					const id = node.$id || node.id;
					let newBaseUri = currentBaseUri;
					let newBaseSchema = currentBaseSchema;
					if (isString(id) && id.charAt(0) !== "#") {
						const resolvedUri = resolveId(id, currentBaseUri);
						if (!isDocumentRoot) embeddedSchemaUris.add(resolvedUri);
						const existingHandle = this.schemasById[resolvedUri];
						if (!existingHandle) this.addSchemaHandle(resolvedUri, node);
						else if (existingHandle !== handle) existingHandle.setSchemaContent(node);
						newBaseUri = resolvedUri;
						newBaseSchema = node;
					}
					referenceScopes.set(node, {
						schema: newBaseSchema,
						handle: this.getOrAddSchemaHandle(newBaseUri)
					});
					JSONSchemaService.traverseSchemaProperties(node, (childSchema) => {
						visit(childSchema, newBaseUri, newBaseSchema, false);
					});
				};
				visit(root, baseUri, root, true);
			};
			registerEmbeddedSchemas(schema, handle.uri);
			handle.anchors = collectAnchors(schema);
			collectDynamicAnchors(schema);
			const resolveMetaschemaVocabularies = () => {
				if (!schema.$schema || typeof schema.$schema !== "string") return this.promise.resolve(void 0);
				let metaschemaUri = schema.$schema;
				if (contextService && !hasSchemeRegex.test(metaschemaUri)) metaschemaUri = contextService.resolveRelativePath(metaschemaUri, handle.uri);
				const normalizedMetaschemaUri = normalizeId(metaschemaUri);
				return this.getOrAddSchemaHandle(normalizedMetaschemaUri).getUnresolvedSchema().then((unresolvedMetaschema) => {
					const metaschemaDraft = unresolvedMetaschema.schema.$schema ? getSchemaDraftFromId(unresolvedMetaschema.schema.$schema) : void 0;
					const isDraft2019OrLater = metaschemaDraft && metaschemaDraft >= SchemaDraft.v2019_09;
					if (unresolvedMetaschema.schema.$vocabulary && typeof unresolvedMetaschema.schema.$vocabulary === "object" || isDraft2019OrLater) activeVocabularies = extractVocabularies(unresolvedMetaschema.schema);
				}, () => {});
			};
			return resolveMetaschemaVocabularies().then(() => {
				return resolveRefs(schema, schema, handle).then((_) => {
					return new ResolvedSchema(schema, resolveErrors, [], schemaDraft, activeVocabularies);
				});
			});
		}
		getSchemaFromProperty(resource, document) {
			if (document.root?.type === "object") {
				for (const p of document.root.properties) if (p.keyNode.value === "$schema" && p.valueNode?.type === "string") {
					let schemaId = p.valueNode.value;
					if (this.contextService && !/^\w[\w\d+.-]*:/.test(schemaId)) schemaId = this.contextService.resolveRelativePath(schemaId, resource);
					return schemaId;
				}
			}
		}
		getAssociatedSchemas(resource) {
			const seen = Object.create(null);
			const schemas = [];
			const normalizedResource = normalizeResourceForMatching(resource);
			for (const entry of this.filePatternAssociations) if (entry.matchesPattern(normalizedResource)) {
				for (const schemaId of entry.getURIs()) if (!seen[schemaId]) {
					schemas.push(schemaId);
					seen[schemaId] = true;
				}
			}
			return schemas;
		}
		getSchemaURIsForResourceImpl(resource) {
			const schemas = this.getAssociatedSchemas(resource);
			if (schemas.length === 0) {
				const fallbackSchemas = this.fallbackSchemaProvider?.(resource);
				if (fallbackSchemas) schemas.push(...fallbackSchemas.map(normalizeId));
			}
			return schemas;
		}
		getSchemaURIsForResource(resource, document) {
			let schemeId = document && this.getSchemaFromProperty(resource, document);
			if (schemeId) return [schemeId];
			return this.getSchemaURIsForResourceImpl(resource);
		}
		getSchemaForResource(resource, document) {
			if (document) {
				let schemeId = this.getSchemaFromProperty(resource, document);
				if (schemeId) {
					const id = normalizeId(schemeId);
					return this.getOrAddSchemaHandle(id).getResolvedSchema();
				}
			}
			if (this.cachedSchemaForResource && this.cachedSchemaForResource.resource === resource) return this.cachedSchemaForResource.resolvedSchema;
			const schemas = this.getSchemaURIsForResourceImpl(resource);
			const resolvedSchema = schemas.length > 0 ? this.createCombinedSchema(resource, schemas).getResolvedSchema() : this.promise.resolve(void 0);
			this.cachedSchemaForResource = {
				resource,
				resolvedSchema
			};
			return resolvedSchema;
		}
		createCombinedSchema(resource, schemaIds) {
			if (schemaIds.length === 1) return this.getOrAddSchemaHandle(schemaIds[0]);
			else {
				const combinedSchemaId = "schemaservice://combinedSchema/" + encodeURIComponent(resource);
				const combinedSchema = { allOf: schemaIds.map((schemaId) => ({ $ref: schemaId })) };
				return this.addSchemaHandle(combinedSchemaId, combinedSchema);
			}
		}
		getMatchingSchemas(document, jsonDocument, schema) {
			if (schema) {
				const id = schema.id || "schemaservice://untitled/matchingSchemas/" + idCounter++;
				return this.addSchemaHandle(id, schema).getResolvedSchema().then((resolvedSchema) => {
					return jsonDocument.getMatchingSchemas(resolvedSchema.schema).filter((s) => !s.inverted);
				});
			}
			return this.getSchemaForResource(document.uri, jsonDocument).then((schema) => {
				if (schema) return jsonDocument.getMatchingSchemas(schema.schema).filter((s) => !s.inverted);
				return [];
			});
		}
	};
	var idCounter = 0;
	function normalizeResourceForMatching(resource) {
		try {
			return u.parse(resource).with({
				fragment: null,
				query: null
			}).toString(true);
		} catch (e) {
			return resource;
		}
	}
	function toDisplayString(url) {
		try {
			const uri = u.parse(url);
			if (uri.scheme === "file") return uri.fsPath;
		} catch (e) {}
		return url;
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonFolding.js
	function getFoldingRanges(document, context) {
		const ranges = [];
		const nestingLevels = [];
		const stack = [];
		let prevStart = -1;
		const scanner = createScanner(document.getText(), false);
		let token = scanner.scan();
		function addRange(range) {
			ranges.push(range);
			nestingLevels.push(stack.length);
		}
		while (token !== 17) {
			switch (token) {
				case 1:
				case 3: {
					const startLine = document.positionAt(scanner.getTokenOffset()).line;
					const range = {
						startLine,
						endLine: startLine,
						kind: token === 1 ? "object" : "array"
					};
					stack.push(range);
					break;
				}
				case 2:
				case 4: {
					const kind = token === 2 ? "object" : "array";
					if (stack.length > 0 && stack[stack.length - 1].kind === kind) {
						const range = stack.pop();
						const line = document.positionAt(scanner.getTokenOffset()).line;
						if (range && line > range.startLine + 1 && prevStart !== range.startLine) {
							range.endLine = line - 1;
							addRange(range);
							prevStart = range.startLine;
						}
					}
					break;
				}
				case 13: {
					const startLine = document.positionAt(scanner.getTokenOffset()).line;
					const endLine = document.positionAt(scanner.getTokenOffset() + scanner.getTokenLength()).line;
					if (scanner.getTokenError() === 1 && startLine + 1 < document.lineCount) scanner.setPosition(document.offsetAt(Position.create(startLine + 1, 0)));
					else if (startLine < endLine) {
						addRange({
							startLine,
							endLine,
							kind: FoldingRangeKind.Comment
						});
						prevStart = startLine;
					}
					break;
				}
				case 12: {
					const m = document.getText().substr(scanner.getTokenOffset(), scanner.getTokenLength()).match(/^\/\/\s*#(region\b)|(endregion\b)/);
					if (m) {
						const line = document.positionAt(scanner.getTokenOffset()).line;
						if (m[1]) {
							const range = {
								startLine: line,
								endLine: line,
								kind: FoldingRangeKind.Region
							};
							stack.push(range);
						} else {
							let i = stack.length - 1;
							while (i >= 0 && stack[i].kind !== FoldingRangeKind.Region) i--;
							if (i >= 0) {
								const range = stack[i];
								stack.length = i;
								if (line > range.startLine && prevStart !== range.startLine) {
									range.endLine = line;
									addRange(range);
									prevStart = range.startLine;
								}
							}
						}
					}
					break;
				}
			}
			token = scanner.scan();
		}
		const rangeLimit = context && context.rangeLimit;
		if (typeof rangeLimit !== "number" || ranges.length <= rangeLimit) return ranges;
		if (context && context.onRangeLimitExceeded) context.onRangeLimitExceeded(document.uri);
		const counts = [];
		for (let level of nestingLevels) if (level < 30) counts[level] = (counts[level] || 0) + 1;
		let entries = 0;
		let maxLevel = 0;
		for (let i = 0; i < counts.length; i++) {
			const n = counts[i];
			if (n) {
				if (n + entries > rangeLimit) {
					maxLevel = i;
					break;
				}
				entries += n;
			}
		}
		const result = [];
		for (let i = 0; i < ranges.length; i++) {
			const level = nestingLevels[i];
			if (typeof level === "number") {
				if (level < maxLevel || level === maxLevel && entries++ < rangeLimit) result.push(ranges[i]);
			}
		}
		return result;
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonSelectionRanges.js
	function getSelectionRanges(document, positions, doc) {
		function getSelectionRange(position) {
			let offset = document.offsetAt(position);
			let node = doc.getNodeFromOffset(offset, true);
			const result = [];
			while (node) {
				switch (node.type) {
					case "string":
					case "object":
					case "array":
						const cStart = node.offset + 1, cEnd = node.offset + node.length - 1;
						if (cStart < cEnd && offset >= cStart && offset <= cEnd) result.push(newRange(cStart, cEnd));
						result.push(newRange(node.offset, node.offset + node.length));
						break;
					case "number":
					case "boolean":
					case "null":
					case "property":
						result.push(newRange(node.offset, node.offset + node.length));
						break;
				}
				if (node.type === "property" || node.parent && node.parent.type === "array") {
					const afterCommaOffset = getOffsetAfterNextToken(node.offset + node.length, 5);
					if (afterCommaOffset !== -1) result.push(newRange(node.offset, afterCommaOffset));
				}
				node = node.parent;
			}
			let current = void 0;
			for (let index = result.length - 1; index >= 0; index--) current = SelectionRange.create(result[index], current);
			if (!current) current = SelectionRange.create(Range.create(position, position));
			return current;
		}
		function newRange(start, end) {
			return Range.create(document.positionAt(start), document.positionAt(end));
		}
		const scanner = createScanner(document.getText(), true);
		function getOffsetAfterNextToken(offset, expectedToken) {
			scanner.setPosition(offset);
			if (scanner.scan() === expectedToken) return scanner.getTokenOffset() + scanner.getTokenLength();
			return -1;
		}
		return positions.map(getSelectionRange);
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/format.js
	function format(documentToFormat, formattingOptions, formattingRange) {
		let range = void 0;
		if (formattingRange) {
			const offset = documentToFormat.offsetAt(formattingRange.start);
			range = {
				offset,
				length: documentToFormat.offsetAt(formattingRange.end) - offset
			};
		}
		const options = {
			tabSize: formattingOptions ? formattingOptions.tabSize : 4,
			insertSpaces: formattingOptions?.insertSpaces === true,
			insertFinalNewline: formattingOptions?.insertFinalNewline === true,
			eol: "\n",
			keepLines: formattingOptions?.keepLines === true
		};
		return format$2(documentToFormat.getText(), range, options).map((edit) => {
			return TextEdit.replace(Range.create(documentToFormat.positionAt(edit.offset), documentToFormat.positionAt(edit.offset + edit.length)), edit.content);
		});
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/propertyTree.js
	var Container;
	(function(Container) {
		Container[Container["Object"] = 0] = "Object";
		Container[Container["Array"] = 1] = "Array";
	})(Container || (Container = {}));
	var PropertyTree = class {
		constructor(propertyName, beginningLineNumber) {
			this.propertyName = propertyName ?? "";
			this.beginningLineNumber = beginningLineNumber;
			this.childrenProperties = [];
			this.lastProperty = false;
			this.noKeyName = false;
		}
		addChildProperty(childProperty) {
			childProperty.parent = this;
			if (this.childrenProperties.length > 0) {
				let insertionIndex = 0;
				if (childProperty.noKeyName) insertionIndex = this.childrenProperties.length;
				else insertionIndex = binarySearchOnPropertyArray(this.childrenProperties, childProperty, compareProperties);
				if (insertionIndex < 0) insertionIndex = insertionIndex * -1 - 1;
				this.childrenProperties.splice(insertionIndex, 0, childProperty);
			} else this.childrenProperties.push(childProperty);
			return childProperty;
		}
	};
	function compareProperties(propertyTree1, propertyTree2) {
		const propertyName1 = propertyTree1.propertyName.toLowerCase();
		const propertyName2 = propertyTree2.propertyName.toLowerCase();
		if (propertyName1 < propertyName2) return -1;
		else if (propertyName1 > propertyName2) return 1;
		return 0;
	}
	function binarySearchOnPropertyArray(propertyTreeArray, propertyTree, compare_fn) {
		const propertyName = propertyTree.propertyName.toLowerCase();
		const firstPropertyInArrayName = propertyTreeArray[0].propertyName.toLowerCase();
		const lastPropertyInArrayName = propertyTreeArray[propertyTreeArray.length - 1].propertyName.toLowerCase();
		if (propertyName < firstPropertyInArrayName) return 0;
		if (propertyName > lastPropertyInArrayName) return propertyTreeArray.length;
		let m = 0;
		let n = propertyTreeArray.length - 1;
		while (m <= n) {
			let k = n + m >> 1;
			let cmp = compare_fn(propertyTree, propertyTreeArray[k]);
			if (cmp > 0) m = k + 1;
			else if (cmp < 0) n = k - 1;
			else return k;
		}
		return -m - 1;
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/utils/sort.js
	function sort(documentToSort, formattingOptions) {
		const options = {
			...formattingOptions,
			keepLines: false
		};
		const formattedJsonString = TextDocument$1.applyEdits(documentToSort, format(documentToSort, options, void 0));
		const formattedJsonDocument = TextDocument$1.create("test://test.json", "json", 0, formattedJsonString);
		const sortedJsonDocument = sortJsoncDocument(formattedJsonDocument, findJsoncPropertyTree(formattedJsonDocument));
		const edits = format(sortedJsonDocument, options, void 0);
		const sortedAndFormattedJsonDocument = TextDocument$1.applyEdits(sortedJsonDocument, edits);
		return [TextEdit.replace(Range.create(Position.create(0, 0), documentToSort.positionAt(documentToSort.getText().length)), sortedAndFormattedJsonDocument)];
	}
	function findJsoncPropertyTree(formattedDocument) {
		const scanner = createScanner(formattedDocument.getText(), false);
		let rootTree = new PropertyTree();
		let currentTree = rootTree;
		let currentProperty = rootTree;
		let lastProperty = rootTree;
		let token = void 0;
		let lastTokenLine = 0;
		let numberOfCharactersOnPreviousLines = 0;
		let lastNonTriviaNonCommentToken = void 0;
		let secondToLastNonTriviaNonCommentToken = void 0;
		let lineOfLastNonTriviaNonCommentToken = -1;
		let endIndexOfLastNonTriviaNonCommentToken = -1;
		let beginningLineNumber = 0;
		let endLineNumber = 0;
		let currentContainerStack = [];
		let updateLastPropertyEndLineNumber = false;
		let updateBeginningLineNumber = false;
		while ((token = scanner.scan()) !== 17) {
			if (updateLastPropertyEndLineNumber === true && token !== 14 && token !== 15 && token !== 12 && token !== 13 && currentProperty.endLineNumber === void 0) {
				let endLineNumber = scanner.getTokenStartLine();
				if (secondToLastNonTriviaNonCommentToken === 2 || secondToLastNonTriviaNonCommentToken === 4) lastProperty.endLineNumber = endLineNumber - 1;
				else currentProperty.endLineNumber = endLineNumber - 1;
				beginningLineNumber = endLineNumber;
				updateLastPropertyEndLineNumber = false;
			}
			if (updateBeginningLineNumber === true && token !== 14 && token !== 15 && token !== 12 && token !== 13) {
				beginningLineNumber = scanner.getTokenStartLine();
				updateBeginningLineNumber = false;
			}
			if (scanner.getTokenStartLine() !== lastTokenLine) {
				for (let i = lastTokenLine; i < scanner.getTokenStartLine(); i++) {
					const lengthOfLine = formattedDocument.getText(Range.create(Position.create(i, 0), Position.create(i + 1, 0))).length;
					numberOfCharactersOnPreviousLines = numberOfCharactersOnPreviousLines + lengthOfLine;
				}
				lastTokenLine = scanner.getTokenStartLine();
			}
			switch (token) {
				case 10:
					if (lastNonTriviaNonCommentToken === void 0 || lastNonTriviaNonCommentToken === 1 || lastNonTriviaNonCommentToken === 5 && currentContainerStack[currentContainerStack.length - 1] === Container.Object) {
						const childProperty = new PropertyTree(scanner.getTokenValue(), beginningLineNumber);
						lastProperty = currentProperty;
						currentProperty = currentTree.addChildProperty(childProperty);
					}
					break;
				case 3:
					if (rootTree.beginningLineNumber === void 0) rootTree.beginningLineNumber = scanner.getTokenStartLine();
					if (currentContainerStack[currentContainerStack.length - 1] === Container.Object) currentTree = currentProperty;
					else if (currentContainerStack[currentContainerStack.length - 1] === Container.Array) {
						const childProperty = new PropertyTree(scanner.getTokenValue(), beginningLineNumber);
						childProperty.noKeyName = true;
						lastProperty = currentProperty;
						currentProperty = currentTree.addChildProperty(childProperty);
						currentTree = currentProperty;
					}
					currentContainerStack.push(Container.Array);
					currentProperty.type = Container.Array;
					beginningLineNumber = scanner.getTokenStartLine();
					beginningLineNumber++;
					break;
				case 1:
					if (rootTree.beginningLineNumber === void 0) rootTree.beginningLineNumber = scanner.getTokenStartLine();
					else if (currentContainerStack[currentContainerStack.length - 1] === Container.Array) {
						const childProperty = new PropertyTree(scanner.getTokenValue(), beginningLineNumber);
						childProperty.noKeyName = true;
						lastProperty = currentProperty;
						currentProperty = currentTree.addChildProperty(childProperty);
					}
					currentProperty.type = Container.Object;
					currentContainerStack.push(Container.Object);
					currentTree = currentProperty;
					beginningLineNumber = scanner.getTokenStartLine();
					beginningLineNumber++;
					break;
				case 4:
					endLineNumber = scanner.getTokenStartLine();
					currentContainerStack.pop();
					if (currentProperty.endLineNumber === void 0 && (lastNonTriviaNonCommentToken === 2 || lastNonTriviaNonCommentToken === 4)) {
						currentProperty.endLineNumber = endLineNumber - 1;
						currentProperty.lastProperty = true;
						currentProperty.lineWhereToAddComma = lineOfLastNonTriviaNonCommentToken;
						currentProperty.indexWhereToAddComa = endIndexOfLastNonTriviaNonCommentToken;
						lastProperty = currentProperty;
						currentProperty = currentProperty ? currentProperty.parent : void 0;
						currentTree = currentProperty;
					}
					rootTree.endLineNumber = endLineNumber;
					beginningLineNumber = endLineNumber + 1;
					break;
				case 2:
					endLineNumber = scanner.getTokenStartLine();
					currentContainerStack.pop();
					if (lastNonTriviaNonCommentToken !== 1) {
						if (currentProperty.endLineNumber === void 0) {
							currentProperty.endLineNumber = endLineNumber - 1;
							currentProperty.lastProperty = true;
							currentProperty.lineWhereToAddComma = lineOfLastNonTriviaNonCommentToken;
							currentProperty.indexWhereToAddComa = endIndexOfLastNonTriviaNonCommentToken;
						}
						lastProperty = currentProperty;
						currentProperty = currentProperty ? currentProperty.parent : void 0;
						currentTree = currentProperty;
					}
					rootTree.endLineNumber = scanner.getTokenStartLine();
					beginningLineNumber = endLineNumber + 1;
					break;
				case 5:
					endLineNumber = scanner.getTokenStartLine();
					if (currentProperty.endLineNumber === void 0 && (currentContainerStack[currentContainerStack.length - 1] === Container.Object || currentContainerStack[currentContainerStack.length - 1] === Container.Array && (lastNonTriviaNonCommentToken === 2 || lastNonTriviaNonCommentToken === 4))) {
						currentProperty.endLineNumber = endLineNumber;
						currentProperty.commaIndex = scanner.getTokenOffset() - numberOfCharactersOnPreviousLines;
						currentProperty.commaLine = endLineNumber;
					}
					if (lastNonTriviaNonCommentToken === 2 || lastNonTriviaNonCommentToken === 4) {
						lastProperty = currentProperty;
						currentProperty = currentProperty ? currentProperty.parent : void 0;
						currentTree = currentProperty;
					}
					beginningLineNumber = endLineNumber + 1;
					break;
				case 13:
					if (lastNonTriviaNonCommentToken === 5 && lineOfLastNonTriviaNonCommentToken === scanner.getTokenStartLine() && (currentContainerStack[currentContainerStack.length - 1] === Container.Array && (secondToLastNonTriviaNonCommentToken === 2 || secondToLastNonTriviaNonCommentToken === 4) || currentContainerStack[currentContainerStack.length - 1] === Container.Object)) {
						if (currentContainerStack[currentContainerStack.length - 1] === Container.Array && (secondToLastNonTriviaNonCommentToken === 2 || secondToLastNonTriviaNonCommentToken === 4) || currentContainerStack[currentContainerStack.length - 1] === Container.Object) {
							currentProperty.endLineNumber = void 0;
							updateLastPropertyEndLineNumber = true;
						}
					}
					if ((lastNonTriviaNonCommentToken === 1 || lastNonTriviaNonCommentToken === 3) && lineOfLastNonTriviaNonCommentToken === scanner.getTokenStartLine()) updateBeginningLineNumber = true;
					break;
			}
			if (token !== 14 && token !== 13 && token !== 12 && token !== 15) {
				secondToLastNonTriviaNonCommentToken = lastNonTriviaNonCommentToken;
				lastNonTriviaNonCommentToken = token;
				lineOfLastNonTriviaNonCommentToken = scanner.getTokenStartLine();
				endIndexOfLastNonTriviaNonCommentToken = scanner.getTokenOffset() + scanner.getTokenLength() - numberOfCharactersOnPreviousLines;
			}
		}
		return rootTree;
	}
	function sortJsoncDocument(jsonDocument, propertyTree) {
		if (propertyTree.childrenProperties.length === 0) return jsonDocument;
		const sortedJsonDocument = TextDocument$1.create("test://test.json", "json", 0, jsonDocument.getText());
		const queueToSort = [];
		updateSortingQueue(queueToSort, propertyTree, propertyTree.beginningLineNumber);
		while (queueToSort.length > 0) {
			const dataToSort = queueToSort.shift();
			const propertyTreeArray = dataToSort.propertyTreeArray;
			let beginningLineNumber = dataToSort.beginningLineNumber;
			for (let i = 0; i < propertyTreeArray.length; i++) {
				const propertyTree = propertyTreeArray[i];
				const range = Range.create(Position.create(propertyTree.beginningLineNumber, 0), Position.create(propertyTree.endLineNumber + 1, 0));
				const jsonContentToReplace = jsonDocument.getText(range);
				const jsonDocumentToReplace = TextDocument$1.create("test://test.json", "json", 0, jsonContentToReplace);
				if (propertyTree.lastProperty === true && i !== propertyTreeArray.length - 1) {
					const lineWhereToAddComma = propertyTree.lineWhereToAddComma - propertyTree.beginningLineNumber;
					const indexWhereToAddComma = propertyTree.indexWhereToAddComa;
					const edit = {
						range: Range.create(Position.create(lineWhereToAddComma, indexWhereToAddComma), Position.create(lineWhereToAddComma, indexWhereToAddComma)),
						text: ","
					};
					TextDocument$1.update(jsonDocumentToReplace, [edit], 1);
				} else if (propertyTree.lastProperty === false && i === propertyTreeArray.length - 1) {
					const commaIndex = propertyTree.commaIndex;
					const lineWhereToRemoveComma = propertyTree.commaLine - propertyTree.beginningLineNumber;
					const edit = {
						range: Range.create(Position.create(lineWhereToRemoveComma, commaIndex), Position.create(lineWhereToRemoveComma, commaIndex + 1)),
						text: ""
					};
					TextDocument$1.update(jsonDocumentToReplace, [edit], 1);
				}
				const length = propertyTree.endLineNumber - propertyTree.beginningLineNumber + 1;
				const edit = {
					range: Range.create(Position.create(beginningLineNumber, 0), Position.create(beginningLineNumber + length, 0)),
					text: jsonDocumentToReplace.getText()
				};
				TextDocument$1.update(sortedJsonDocument, [edit], 1);
				updateSortingQueue(queueToSort, propertyTree, beginningLineNumber);
				beginningLineNumber = beginningLineNumber + length;
			}
		}
		return sortedJsonDocument;
	}
	function sortProperties(properties) {
		properties.sort((a, b) => a.propertyName.localeCompare(b.propertyName));
	}
	function updateSortingQueue(queue, propertyTree, beginningLineNumber) {
		if (propertyTree.childrenProperties.length === 0) return;
		if (propertyTree.type === Container.Object) {
			let minimumBeginningLineNumber = Infinity;
			for (const childProperty of propertyTree.childrenProperties) if (childProperty.beginningLineNumber < minimumBeginningLineNumber) minimumBeginningLineNumber = childProperty.beginningLineNumber;
			const diff = minimumBeginningLineNumber - propertyTree.beginningLineNumber;
			beginningLineNumber = beginningLineNumber + diff;
			sortProperties(propertyTree.childrenProperties);
			queue.push(new SortingRange(beginningLineNumber, propertyTree.childrenProperties));
		} else if (propertyTree.type === Container.Array) updateSortingQueueForArrayProperties(queue, propertyTree, beginningLineNumber);
	}
	function updateSortingQueueForArrayProperties(queue, propertyTree, beginningLineNumber) {
		for (const subObject of propertyTree.childrenProperties) {
			if (subObject.type === Container.Object) {
				let minimumBeginningLineNumber = Infinity;
				for (const childProperty of subObject.childrenProperties) if (childProperty.beginningLineNumber < minimumBeginningLineNumber) minimumBeginningLineNumber = childProperty.beginningLineNumber;
				const diff = minimumBeginningLineNumber - subObject.beginningLineNumber;
				queue.push(new SortingRange(beginningLineNumber + subObject.beginningLineNumber - propertyTree.beginningLineNumber + diff, subObject.childrenProperties));
			}
			if (subObject.type === Container.Array) updateSortingQueueForArrayProperties(queue, subObject, beginningLineNumber + subObject.beginningLineNumber - propertyTree.beginningLineNumber);
		}
	}
	var SortingRange = class {
		constructor(beginningLineNumber, propertyTreeArray) {
			this.beginningLineNumber = beginningLineNumber;
			this.propertyTreeArray = propertyTreeArray;
		}
	};
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/services/jsonLinks.js
	function findLinks(document, doc) {
		const links = [];
		doc.visit((node) => {
			if (node.type === "property" && node.keyNode.value === "$ref" && node.valueNode?.type === "string") {
				const path = node.valueNode.value;
				const targetNode = findTargetNode(doc, path);
				if (targetNode) {
					const targetPos = document.positionAt(targetNode.offset);
					links.push({
						target: `${document.uri}#${targetPos.line + 1},${targetPos.character + 1}`,
						range: createRange(document, node.valueNode)
					});
				}
			}
			return true;
		});
		return Promise.resolve(links);
	}
	function createRange(document, node) {
		return Range.create(document.positionAt(node.offset + 1), document.positionAt(node.offset + node.length - 1));
	}
	function findTargetNode(doc, path) {
		const tokens = parseJSONPointer(path);
		if (tokens) return findNode(tokens, doc.root);
		if (path.charAt(0) === "#") {
			const anchor = path.substring(1);
			if (anchor.length > 0) return findAnchorNode(doc, anchor);
			return null;
		}
		const hashIndex = path.indexOf("#");
		const uri = hashIndex >= 0 ? path.substring(0, hashIndex) : path;
		const fragment = hashIndex >= 0 ? path.substring(hashIndex + 1) : void 0;
		if (uri.length > 0) {
			const embeddedNode = findEmbeddedSchemaNode(doc, uri);
			if (embeddedNode) {
				if (!fragment || fragment.length === 0) return embeddedNode;
				if (fragment.charAt(0) === "/") return findNode(fragment.substring(1).split(/\//).map(unescape), embeddedNode);
				return findAnchorInSubtree(embeddedNode, fragment);
			}
		}
		return null;
	}
	function findNode(pointer, node) {
		if (!node) return null;
		if (pointer.length === 0) return node;
		const token = pointer.shift();
		if (node && node.type === "object") {
			const propertyNode = node.properties.find((propertyNode) => propertyNode.keyNode.value === token);
			if (!propertyNode) return null;
			return findNode(pointer, propertyNode.valueNode);
		} else if (node && node.type === "array") {
			if (token.match(/^(0|[1-9][0-9]*)$/)) {
				const index = Number.parseInt(token);
				const arrayItem = node.items[index];
				if (!arrayItem) return null;
				return findNode(pointer, arrayItem);
			}
		}
		return null;
	}
	function findAnchorNode(doc, anchor) {
		return findAnchorInSubtree(doc.root, anchor);
	}
	function findAnchorInSubtree(root, anchor) {
		if (!root) return null;
		let result = null;
		const visit = (node) => {
			if (node.type === "object") for (const prop of node.properties) {
				if (prop.keyNode.value === "$anchor" && prop.valueNode?.type === "string" && prop.valueNode.value === anchor) {
					result = node;
					return false;
				}
				if (prop.keyNode.value === "$id" && prop.valueNode?.type === "string" && prop.valueNode.value === "#" + anchor) {
					result = node;
					return false;
				}
			}
			const children = node.children;
			if (children) {
				for (const child of children) if (!visit(child)) return false;
			}
			return true;
		};
		visit(root);
		return result;
	}
	function findEmbeddedSchemaNode(doc, uri) {
		if (!doc.root) return null;
		let result = null;
		const visit = (node, isRoot) => {
			if (node.type === "object" && !isRoot) {
				for (const prop of node.properties) if ((prop.keyNode.value === "$id" || prop.keyNode.value === "id") && prop.valueNode?.type === "string" && prop.valueNode.value === uri) {
					result = node;
					return false;
				}
			}
			const children = node.children;
			if (children) {
				for (const child of children) if (!visit(child, false)) return false;
			}
			return true;
		};
		visit(doc.root, true);
		return result;
	}
	function parseJSONPointer(path) {
		if (path === "#") return [];
		if (path[0] !== "#" || path[1] !== "/") return null;
		return path.substring(2).split(/\//).map(unescape);
	}
	function unescape(str) {
		return str.replace(/~1/g, "/").replace(/~0/g, "~");
	}
	//#endregion
	//#region node_modules/vscode-json-languageservice/lib/esm/jsonLanguageService.js
	function getLanguageService(params) {
		const promise = params.promiseConstructor || Promise;
		const jsonSchemaService = new JSONSchemaService(params.schemaRequestService, params.workspaceContext, promise, params.fallbackSchemaProvider);
		jsonSchemaService.setSchemaContributions(schemaContributions);
		const jsonCompletion = new JSONCompletion(jsonSchemaService, params.contributions, promise, params.clientCapabilities);
		const jsonHover = new JSONHover(jsonSchemaService, params.contributions, promise);
		const jsonDocumentSymbols = new JSONDocumentSymbols(jsonSchemaService);
		const jsonValidation = new JSONValidation(jsonSchemaService, promise);
		return {
			configure: (settings) => {
				jsonSchemaService.clearExternalSchemas();
				settings.schemas?.forEach(jsonSchemaService.registerExternalSchema.bind(jsonSchemaService));
				jsonValidation.configure(settings);
			},
			resetSchema: (uri) => jsonSchemaService.onResourceChange(uri),
			doValidation: jsonValidation.doValidation.bind(jsonValidation),
			getLanguageStatus: jsonValidation.getLanguageStatus.bind(jsonValidation),
			parseJSONDocument: (document) => parse(document, { collectComments: true }),
			newJSONDocument: (root, diagnostics, comments) => newJSONDocument(root, diagnostics, comments),
			getMatchingSchemas: jsonSchemaService.getMatchingSchemas.bind(jsonSchemaService),
			doResolve: jsonCompletion.doResolve.bind(jsonCompletion),
			doComplete: jsonCompletion.doComplete.bind(jsonCompletion),
			findDocumentSymbols: jsonDocumentSymbols.findDocumentSymbols.bind(jsonDocumentSymbols),
			findDocumentSymbols2: jsonDocumentSymbols.findDocumentSymbols2.bind(jsonDocumentSymbols),
			findDocumentColors: jsonDocumentSymbols.findDocumentColors.bind(jsonDocumentSymbols),
			getColorPresentations: jsonDocumentSymbols.getColorPresentations.bind(jsonDocumentSymbols),
			doHover: jsonHover.doHover.bind(jsonHover),
			getFoldingRanges,
			getSelectionRanges,
			findDefinition: () => Promise.resolve([]),
			findLinks,
			format: (document, range, options) => format(document, options, range),
			sort: (document, options) => sort(document, options)
		};
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
	//#region src/type-converters/lsp/lsp-converters.ts
	function filterDiagnostics(diagnostics, filterErrors) {
		return CommonConverter.excludeByErrorMessage(diagnostics, filterErrors.errorMessagesToIgnore).map((el) => {
			if (checkValueAgainstRegexpArray(el.message, filterErrors.errorMessagesToTreatAsWarning)) el.severity = import_main.DiagnosticSeverity.Warning;
			else if (checkValueAgainstRegexpArray(el.message, filterErrors.errorMessagesToTreatAsInfo)) el.severity = import_main.DiagnosticSeverity.Information;
			return el;
		});
	}
	//#endregion
	//#region src/services/json/json-service.ts
	var JsonService = class extends BaseService {
		constructor(mode) {
			super(mode);
			this.schemas = {};
			this.serviceCapabilities = {
				completionProvider: {
					triggerCharacters: ["\"", ":"],
					resolveProvider: true
				},
				diagnosticProvider: {
					interFileDependencies: true,
					workspaceDiagnostics: true
				},
				documentRangeFormattingProvider: true,
				documentFormattingProvider: true,
				hoverProvider: true
			};
			this.$service = getLanguageService({
				schemaRequestService: (uri) => {
					uri = uri.replace("file:///", "");
					let jsonSchema = this.schemas[uri];
					if (jsonSchema) return Promise.resolve(jsonSchema);
					if (typeof fetch !== "undefined" && /^https?:\/\//.test(uri)) return fetch(uri).then((response) => response.text());
					return Promise.reject(`Unable to load schema at ${uri}`);
				},
				workspaceContext: { resolveRelativePath: (relativePath, resource) => {
					const base = resource.substr(0, resource.lastIndexOf("/") + 1);
					return _.resolvePath(u.parse(base), relativePath).toString();
				} }
			});
		}
		$getJsonSchemaUri(documentUri) {
			return this.getOption(documentUri, "schemaUri");
		}
		addDocument(document) {
			super.addDocument(document);
			this.$configureService(document.uri);
		}
		getSchemaOption(documentUri) {
			return this.getOption(documentUri ?? "", "schemas");
		}
		$configureService(documentUri) {
			let schemas = this.getSchemaOption(documentUri);
			let sessionIDs = documentUri ? [] : Object.keys(this.documents);
			schemas?.forEach((el) => {
				if (documentUri) {
					if (this.$getJsonSchemaUri(documentUri) == el.uri) {
						el.fileMatch ??= [];
						el.fileMatch.push(documentUri);
					}
				} else el.fileMatch = sessionIDs.filter((documentUri) => this.$getJsonSchemaUri(documentUri) == el.uri);
				let schema = el.schema ?? this.schemas[el.uri];
				if (schema) this.schemas[el.uri] = schema;
				this.$service.resetSchema(el.uri);
				el.schema = void 0;
			});
			this.$configureJsonService(schemas);
		}
		$configureJsonService(schemas) {
			this.$service.configure({
				schemas,
				allowComments: this.globalOptions.allowComments,
				validate: true
			});
		}
		removeDocument(document) {
			super.removeDocument(document);
			let schemas = this.getOption(document.uri, "schemas");
			schemas?.forEach((el) => {
				if (el.uri === this.$getJsonSchemaUri(document.uri)) el.fileMatch = el.fileMatch?.filter((pattern) => pattern != document.uri);
			});
			this.$configureJsonService(schemas);
		}
		setOptions(documentUri, options, merge = false) {
			super.setOptions(documentUri, options, merge);
			this.$configureService(documentUri);
		}
		setGlobalOptions(options) {
			super.setGlobalOptions(options);
			this.$configureService();
		}
		format(document, range, options) {
			let fullDocument = this.getDocument(document.uri);
			if (!fullDocument) return Promise.resolve([]);
			return Promise.resolve(this.$service.format(fullDocument, range, options));
		}
		async doHover(document, position) {
			let fullDocument = this.getDocument(document.uri);
			if (!fullDocument) return null;
			let jsonDocument = this.$service.parseJSONDocument(fullDocument);
			return this.$service.doHover(fullDocument, position, jsonDocument);
		}
		async doValidation(document) {
			let fullDocument = this.getDocument(document.uri);
			if (!fullDocument) return [];
			let jsonDocument = this.$service.parseJSONDocument(fullDocument);
			return filterDiagnostics((await this.$service.doValidation(fullDocument, jsonDocument, { trailingCommas: this.globalOptions.trailingCommas ? "ignore" : "error" })).map((diagnostic) => ({
				...diagnostic,
				message: typeof diagnostic.message === "string" ? diagnostic.message : diagnostic.message.value
			})), this.optionsToFilterDiagnostics);
		}
		async doComplete(document, position) {
			let fullDocument = this.getDocument(document.uri);
			if (!fullDocument) return null;
			let jsonDocument = this.$service.parseJSONDocument(fullDocument);
			return await this.$service.doComplete(fullDocument, position, jsonDocument);
		}
		async doResolve(item) {
			return this.$service.doResolve(item);
		}
	};
	//#endregion
	exports.JsonService = JsonService;
});
