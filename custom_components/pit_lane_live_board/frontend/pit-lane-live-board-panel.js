/*! Pit Lane Live Board — Apache-2.0. See LICENSE and NOTICE.
* Includes Lit (https://lit.dev): Copyright 2017 Google LLC, BSD-3-Clause.
* Icons from Material Design Icons (https://pictogrammers.com), Apache-2.0. */
//#region node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, ee = h.trustedTypes, te = ee ? ee.emptyScript : "", ne = h.reactiveElementPolyfillSupport, g = (e, t) => e, re = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? te : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, ie = (e, t) => !l(e, t), ae = {
	attribute: !0,
	type: String,
	converter: re,
	reflect: !1,
	useDefault: !1,
	hasChanged: ie
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var _ = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = ae) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? ae;
	}
	static _$Ei() {
		if (this.hasOwnProperty(g("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(g("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(g("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? re : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? re : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? ie)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
_.elementStyles = [], _.shadowRootOptions = { mode: "open" }, _[g("elementProperties")] = /* @__PURE__ */ new Map(), _[g("finalized")] = /* @__PURE__ */ new Map(), ne?.({ ReactiveElement: _ }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var oe = globalThis, se = (e) => e, v = oe.trustedTypes, ce = v ? v.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, le = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, ue = "?" + y, de = `<${ue}>`, b = document, x = () => b.createComment(""), S = (e) => e === null || typeof e != "object" && typeof e != "function", fe = Array.isArray, pe = (e) => fe(e) || typeof e?.[Symbol.iterator] == "function", me = "[ 	\n\f\r]", C = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, he = /-->/g, ge = />/g, w = RegExp(`>|${me}(?:([^\\s"'>=/]+)(${me}*=${me}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), _e = /'/g, ve = /"/g, ye = /^(?:script|style|textarea|title)$/i, be = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), T = be(1), E = be(2), D = Symbol.for("lit-noChange"), O = Symbol.for("lit-nothing"), xe = /* @__PURE__ */ new WeakMap(), k = b.createTreeWalker(b, 129);
function Se(e, t) {
	if (!fe(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return ce === void 0 ? t : ce.createHTML(t);
}
var Ce = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = C;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === C ? c[1] === "!--" ? o = he : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = w) : (ye.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = w) : o = ge : o === w ? c[0] === ">" ? (o = i ?? C, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? w : c[3] === "\"" ? ve : _e) : o === ve || o === _e ? o = w : o === he || o === ge ? o = C : (o = w, i = void 0);
		let d = o === w && e[t + 1].startsWith("/>") ? " " : "";
		a += o === C ? n + de : l >= 0 ? (r.push(s), n.slice(0, l) + le + n.slice(l) + y + d) : n + y + (l === -2 ? t : d);
	}
	return [Se(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, we = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Ce(t, n);
		if (this.el = e.createElement(l, r), k.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = k.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(le)) {
					let t = u[o++], n = i.getAttribute(e).split(y), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ee : r[1] === "?" ? De : r[1] === "@" ? Oe : M
					}), i.removeAttribute(e);
				} else e.startsWith(y) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ye.test(i.tagName)) {
					let e = i.textContent.split(y), t = e.length - 1;
					if (t > 0) {
						i.textContent = v ? v.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], x()), k.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], x());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ue) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(y, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += y.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = b.createElement("template");
		return n.innerHTML = e, n;
	}
};
function A(e, t, n = e, r) {
	if (t === D) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = S(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = A(e, i._$AS(e, t.values), i, r)), t;
}
var Te = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? b).importNode(t, !0);
		k.currentNode = r;
		let i = k.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new j(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new ke(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = k.nextNode(), a++);
		}
		return k.currentNode = b, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, j = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = O, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = A(this, e, t), S(e) ? e === O || e == null || e === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : e !== this._$AH && e !== D && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? pe(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== O && S(this._$AH) ? this._$AA.nextSibling.data = e : this.T(b.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = we.createElement(Se(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Te(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = xe.get(e.strings);
		return t === void 0 && xe.set(e.strings, t = new we(e)), t;
	}
	k(t) {
		fe(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(x()), this.O(x()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = se(e).nextSibling;
			se(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, M = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = O, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = O;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = A(this, e, t, 0), a = !S(e) || e !== this._$AH && e !== D, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = A(this, r[n + o], t, o), s === D && (s = this._$AH[o]), a ||= !S(s) || s !== this._$AH[o], s === O ? e = O : e !== O && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ee = class extends M {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === O ? void 0 : e;
	}
}, De = class extends M {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== O);
	}
}, Oe = class extends M {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = A(this, e, t, 0) ?? O) === D) return;
		let n = this._$AH, r = e === O && n !== O || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== O && (n === O || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, ke = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		A(this, e);
	}
}, Ae = {
	M: le,
	P: y,
	A: ue,
	C: 1,
	L: Ce,
	R: Te,
	D: pe,
	V: A,
	I: j,
	H: M,
	N: De,
	U: Oe,
	B: Ee,
	F: ke
}, je = oe.litHtmlPolyfillSupport;
je?.(we, j), (oe.litHtmlVersions ??= []).push("3.3.3");
var Me = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new j(t.insertBefore(x(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Ne = globalThis, N = class extends _ {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Me(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return D;
	}
};
N._$litElement$ = !0, N.finalized = !0, Ne.litElementHydrateSupport?.({ LitElement: N });
var Pe = Ne.litElementPolyfillSupport;
Pe?.({ LitElement: N }), (Ne.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/api.ts
var P = "pit_lane_live_board", Fe = 1e4;
async function Ie(e, t, n) {
	let r = e.connection, i, a = !1, o, s = async () => {
		let e = await r.subscribeMessage(n, t, { resubscribe: !1 });
		a ? e() : i = e;
	}, c = () => {
		window.clearTimeout(o), !a && (i = void 0, s().catch(() => {
			a || (o = window.setTimeout(c, Fe));
		}));
	};
	return await s(), r.addEventListener?.("ready", c), () => {
		a = !0, window.clearTimeout(o), r.removeEventListener?.("ready", c);
		try {
			i?.();
		} catch {}
		i = void 0;
	};
}
var F = {
	settings: (e) => e.callWS({ type: `${P}/settings/get` }),
	setSettings: (e, t) => e.callWS({
		type: `${P}/settings/set`,
		...t
	}),
	setToken: (e, t) => e.callWS({
		type: `${P}/f1tv/set`,
		token: t
	}),
	removeToken: (e) => e.callWS({ type: `${P}/f1tv/remove` }),
	setPanel: (e, t) => e.callWS({
		type: `${P}/panel/set`,
		...t
	}),
	setHousehold: (e, t) => e.callWS({
		type: `${P}/settings/set`,
		...t
	}),
	testSummary: (e) => e.callWS({ type: `${P}/summary/test` }),
	entities: (e) => e.callWS({ type: `${P}/entities` }),
	reveal: (e, t) => e.callWS({
		type: `${P}/spoiler/reveal`,
		session: t
	}),
	seasons: (e) => e.callWS({ type: `${P}/seasons` }),
	calendar: (e, t) => e.callWS({
		type: `${P}/calendar/get`,
		season: t
	}),
	rounds: (e, t) => e.callWS({
		type: `${P}/results/season`,
		season: t
	}),
	detail: (e, t, n, r) => e.callWS({
		type: `${P}/results/detail`,
		season: t,
		round: n,
		tab: r
	}),
	standings: (e, t, n, r) => e.callWS({
		type: `${P}/standings/get`,
		season: t,
		round: n,
		kind: r
	}),
	subscribeSettings: (e, t) => Ie(e, { type: `${P}/settings/subscribe` }, t),
	subscribeLive: (e, t) => Ie(e, { type: `${P}/live/subscribe` }, t),
	subscribeMap: (e, t) => Ie(e, { type: `${P}/map/subscribe` }, t)
}, Le = document.querySelector("home-assistant") && !customElements.get("home-assistant") ? customElements.whenDefined("home-assistant") : Promise.resolve();
function I(e, t) {
	Le.then(() => {
		customElements.get(e) || customElements.define(e, t);
	});
}
var Re = {
	tabs: {
		live: "Live",
		calendar: "Calendar",
		results: "Results",
		standings: "Standings"
	},
	delay: {
		title: "TV delay",
		help: "Hold the page, the team radio and your automations back to match your TV or stream. Everyone in the house shares this setting.",
		none: "No delay",
		seconds: "{n} s",
		less: "−1 s",
		more: "+1 s"
	},
	spoiler: {
		on: "No spoilers",
		off: "Spoilers shown",
		help: "Hides the outcome of the latest Grand Prix weekend until you reveal it.",
		reveal: "Reveal this session",
		hidden: "Hidden",
		hiddenRound: "Hidden — no-spoiler mode",
		revealNote: "No-spoiler mode hides this session.",
		standingsCap: "No-spoiler mode: the standings before this weekend."
	},
	common: {
		loading: "Loading…",
		retry: "Try again",
		unavailable: "The data source did not answer. It may be busy or down; try again in a minute.",
		noData: "No data for this yet.",
		season: "Season",
		round: "Round",
		lap: "Lap",
		laps: "Laps",
		driver: "Driver",
		team: "Team",
		pos: "Pos",
		points: "Pts",
		back: "All rounds",
		sprint: "SPRINT",
		disclaimer: "Pit Lane Live Board is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V. Results and standings: Jolpica-F1 (CC BY-NC-SA 4.0). Live data: F1's public live timing.",
		menu: "Menu",
		title: "Live Board"
	},
	sessions: {
		practice_1: "Practice 1",
		practice_2: "Practice 2",
		practice_3: "Practice 3",
		sprint_qualifying: "Sprint Qualifying",
		sprint: "Sprint",
		qualifying: "Qualifying",
		race: "Race",
		practice: "Practice"
	},
	calendar: {
		title: "Calendar",
		next: "NEXT",
		live: "LIVE NOW",
		results: "Results",
		startsIn: "starts in",
		empty: "No calendar for this season yet.",
		round: "R{n}",
		watch: "Watch live"
	},
	results: {
		title: "Results",
		grandPrix: "Grand Prix",
		date: "Date",
		winner: "Winner",
		empty: "No race of this season has results yet.",
		tabs: {
			race: "Race",
			qualifying: "Qualifying",
			sprint: "Sprint",
			lap_chart: "Lap chart",
			strategy: "Tyre strategy",
			lap_times: "Lap times",
			pit_stops: "Pit stops",
			race_control: "Race control",
			weather: "Weather"
		},
		grid: "Grid",
		time: "Time / status",
		fastest: "Fastest lap",
		stop: "Stop",
		duration: "Duration",
		archive: "Detail from F1's session archive: the first opening downloads it once.",
		notArchived: "F1's archive has no detail for this race.",
		chooseDriver: "Driver",
		sectors: "Sectors",
		tyre: "Tyre",
		age: "Age",
		pit: "Pit",
		start: "Start",
		end: "End",
		min: "Min",
		max: "Max",
		rain: "Rain",
		yes: "Yes",
		no: "No",
		air: "Air temperature",
		track: "Track temperature",
		pitIn: "IN",
		pitOut: "OUT",
		gridShort: "G"
	},
	standings: {
		title: "Standings",
		drivers: "Drivers",
		constructors: "Constructors",
		after: "After round {n}",
		wins: "Wins",
		behind: "Behind",
		change: "+/−",
		empty: "No standings for this season yet."
	},
	live: {
		idle: "No session running",
		next: "Next: {meeting} — {session}",
		noNext: "The season is over. See you next year.",
		startsIn: "starts in",
		connecting: "Connecting to F1's live timing…",
		syncing: "Syncing with your TV delay",
		syncingHelp: "The first data is held back {n} s, like everything else.",
		hidden: "No-spoiler mode is on",
		hiddenHelp: "{meeting} — {session} is hidden. Turn the mode off when you have caught up.",
		showAll: "Show everything",
		stale: "Live feed lost — reconnecting. The data is {n} s old.",
		lost: "Live feed lost for over a minute. Nothing here is live.",
		updated: "updated {n} s ago",
		remaining: "remaining",
		gap: "Gap",
		int: "Int",
		last: "Last",
		best: "Best",
		tyre: "Tyre",
		pits: "Pits",
		used: "used",
		out: "OUT",
		pit: "PIT",
		ret: "RET",
		stop: "STOP",
		ko: "KO",
		raceControl: "Race control",
		all: "All",
		flags: "Flags",
		penalties: "Penalties",
		other: "Other",
		radio: "Team radio",
		noRadio: "No team radio published for this session.",
		weather: "Weather",
		air: "Air",
		track: "Track",
		humidity: "Humidity",
		wind: "Wind",
		rain: "Rain",
		wet: "Wet",
		dry: "Dry",
		pressure: "Pressure",
		pitStops: "Pit stops",
		pitLane: "pit lane",
		noPits: "No pit stops yet.",
		map: "Track map",
		mapLocked: "The live map needs an F1TV subscription. An administrator can add a token in this panel's Settings (the gear icon).",
		mapNoData: "No position data from F1 for this session.",
		mapDrawing: "Drawing the circuit from the cars' positions…",
		status: {
			clear: "TRACK CLEAR",
			yellow: "YELLOW FLAG",
			safety_car: "SAFETY CAR",
			virtual_safety_car: "VIRTUAL SAFETY CAR",
			vsc_ending: "VSC ENDING",
			red_flag: "RED FLAG",
			chequered: "CHEQUERED FLAG"
		},
		mapNotEnabled: "The live track map is not enabled in this Home Assistant.",
		mapToken: "F1 did not accept the F1TV token, so there is no map. An administrator can add a new one in this panel's Settings (the gear icon).",
		play: "Play {driver}'s team radio at {time}",
		pause: "Stop {driver}'s team radio",
		windSpeed: "{n} m/s",
		paused: "Live timing is paused",
		pausedShort: "Paused",
		pausedAuto: "Paused · auto",
		autoStart: "It starts by itself at the next session.",
		final: "FINAL",
		ended: "Ended {time} · data frozen",
		nextShort: "Next"
	},
	f1tv: {
		active: "F1TV active",
		expiring: "F1TV renewing",
		expired: "F1TV expired",
		invalid: "F1TV token refused",
		not_configured: "F1TV not set"
	},
	tyres: {
		soft: "Soft",
		medium: "Medium",
		hard: "Hard",
		intermediate: "Intermediate",
		wet: "Wet",
		unknown: "Unknown"
	},
	settings: {
		title: "Settings",
		live: "Live timing",
		on: "On",
		off: "Paused",
		start: "Start live timing",
		pause: "Pause live timing",
		running: "Connected to F1's live timing for the session under way.",
		waiting: "Ready: it connects by itself when a session starts.",
		pausedHelp: "Paused: nothing connects to F1 and nothing live is written to disk.",
		autoStart: "Start automatically at each session",
		autoStartHelp: "Live timing turns itself on when a session is about to start. Pausing it during a session holds until the next one.",
		adminOnly: "administrators only",
		f1tvHelp: "Only the live track map needs F1TV; everything else works without an account.",
		expires: "expires {date}",
		tokenPaste: "Paste the F1TV token",
		tokenReplace: "Paste a new token to replace the current one",
		save: "Save",
		tokenSteps: "Sign in at f1tv.formula1.com, open the browser's developer tools → Application (Storage in Firefox) → Cookies, and copy the value of loginSession. It is renewed automatically; it is never shown again after saving.",
		remove: "Remove the token",
		removeConfirm: "Remove the F1TV token? The live map stops until a new one is added.",
		cancel: "Cancel",
		entities: "Entities",
		entitiesHelp: "Use them in automations and dashboards: flags, safety car, penalties and the stewards' decisions have their own entities. They follow the TV delay and no-spoiler mode.",
		disabled: "disabled",
		errors: {
			token_invalid: "That does not look like an F1TV token. Paste the whole value of the loginSession cookie.",
			token_expired: "This token has expired or expires within minutes. Sign in to F1TV again and copy a fresh one.",
			token_no_subscription: "This F1TV account has no active subscription.",
			token_missing: "Paste a token.",
			remove_failed: "The token could not be removed. Try again in a moment."
		},
		panel: "Panel",
		sidebar: "Show Live Board in the sidebar",
		sidebarHelp: "Off: the panel still opens from the integration's device page, and the cards keep working on dashboards.",
		adminPanel: "Only administrators can open the panel",
		adminPanelHelp: "Off (the default): every user of the house sees Live Board. On: only administrators do. The cards follow the visibility of the dashboard they are on."
	},
	stewards: {
		title: "Flags & stewards",
		track: "Track",
		penalties: "Penalties",
		investigations: "Investigations",
		trackLimits: "Track limits",
		none: "None",
		calm: "No penalties or investigations",
		showAll: "Show {n} more",
		served: "served",
		unserved: "Time penalty not served yet",
		turn: "Turn {n}",
		deleted: "{n} deleted",
		yellow: "Yellow flag",
		double_yellow: "Double yellow flag",
		sc: {
			deployed: "Safety car deployed",
			ending: "Safety car in this lap"
		},
		vsc: {
			deployed: "Virtual safety car deployed",
			ending: "Virtual safety car ending"
		},
		short: {
			drive_through: "DT",
			stop_go: "SG",
			grid: "{n} grid",
			disqualified: "DSQ"
		},
		kind: {
			time_penalty: "Time penalty",
			drive_through: "Drive-through",
			stop_go: "Stop and go",
			grid_penalty: "Grid penalty",
			penalty_served: "Penalty served",
			disqualified: "Disqualified",
			noted: "Noted",
			investigation: "Under investigation",
			investigation_after_race: "After the race",
			no_further_action: "No further action",
			warning: "Warning",
			black_and_white_flag: "Black and white flag",
			lap_deleted: "Lap deleted"
		}
	},
	cards: {
		stale: "DELAYED",
		lost: "NO FEED",
		mapAfter: "The map is live only: it comes back at the next session.",
		mapNeedsF1tv: "The live map needs F1TV: an administrator can add a token in the panel's Settings.",
		tower: {
			title: "Timing",
			name: "Timing tower",
			description: "Positions, gaps, lap times, sectors and tyres; choose the rows and columns."
		},
		map: {
			name: "Track map",
			description: "The cars on the circuit, live (needs F1TV)."
		},
		stewards: {
			name: "Flags & stewards",
			description: "Track status, yellow sectors, safety car, penalties, investigations and track limits."
		},
		radio: {
			name: "Team radio",
			description: "The latest team radio clips, with play."
		},
		race_control: {
			name: "Race control",
			description: "The latest race control messages, filtered by flags or penalties."
		},
		session: {
			name: "Session",
			description: "The session under way, its lap or clock and track status; after it, the next session's countdown."
		},
		weather: {
			name: "Weather",
			description: "Air and track temperature, rain, humidity, wind and pressure at the circuit."
		},
		standings: {
			name: "Championship",
			description: "Drivers' or constructors' standings, top N."
		},
		fields: {
			title: "Title",
			rows: "Rows",
			columns: "Columns",
			highlight: "Driver to highlight (e.g. LEC)",
			count: "How many",
			filter: "Show",
			kind: "Championship",
			show_title: "Show the title"
		}
	},
	time: {
		title: "Times",
		justYou: "just for you",
		home: "As in my Home Assistant profile ({zone})",
		device: "This device's time zone ({zone})",
		circuit: "Local time at the track",
		both: "Show both times",
		bothHelp: "Next to each time, in small, the other one: the track's local time, or yours when you chose the track's.",
		atTrack: "{time} at the track",
		yours: "{time} your time"
	},
	drivers: {
		title: "My drivers",
		help: "Follow up to five drivers: each gets a sensor with position, gap, tyre and pits, and the “My drivers” event fires when they gain or lose a place, take the lead, pit, set the fastest lap, retire or get a penalty. Their rows have a ★ in the timing tower.",
		max: "Up to five drivers.",
		followed: "A driver you follow",
		stint: "Stint",
		laps: "Laps",
		bestInStint: "Best lap",
		lapRange: "{from}–{to}",
		fromLap: "from lap {from}",
		onLap: "lap {lap}",
		rejoin: "Pitting now: back out P{position}",
		behindOf: "behind {driver} (+{gap} s)",
		aheadOf: "ahead of {driver} ({gap} s)",
		lossCircuit: "Estimate: a stop costs about {loss} s at this circuit.",
		lossGeneric: "Estimate: a stop costs about {loss} s (a generic figure).",
		pitting: "{n} cars in the pits: less certain."
	},
	summary: {
		title: "Summary at the end of a session",
		help: "When a session ends: podium, fastest lap, retirements, penalties and your drivers, sent to the notify services you choose. It is also the “Session summary” event, for your own automations.",
		where: "Send to",
		which: "After",
		noServices: "No notify service in this Home Assistant (the mobile app adds one per phone).",
		test: "Send a test",
		testSent: "Sent: the summary of what the Live page shows.",
		testNothing: "Nothing to summarise yet: it needs a session on the Live page.",
		testFailed: "Not sent.",
		spoiler: "With no-spoiler mode on, the summary waits until you reveal the session or turn the mode off.",
		testHidden: "Not sent: no-spoiler mode hides the Live page."
	}
}, ze = {
	en: Re,
	it: {
		tabs: {
			live: "Live",
			calendar: "Calendario",
			results: "Risultati",
			standings: "Classifiche"
		},
		delay: {
			title: "Ritardo TV",
			help: "Trattiene la pagina, i team radio e le tue automazioni per allinearli alla TV o allo streaming. L'impostazione vale per tutta la casa.",
			none: "Nessun ritardo",
			seconds: "{n} s",
			less: "−1 s",
			more: "+1 s"
		},
		spoiler: {
			on: "Senza spoiler",
			off: "Spoiler visibili",
			help: "Nasconde l'esito dell'ultimo weekend di gara finché non lo scopri tu.",
			reveal: "Mostra questa sessione",
			hidden: "Nascosto",
			hiddenRound: "Nascosto — modalità senza spoiler",
			revealNote: "La modalità senza spoiler nasconde questa sessione.",
			standingsCap: "Modalità senza spoiler: la classifica prima di questo weekend."
		},
		common: {
			loading: "Caricamento…",
			retry: "Riprova",
			unavailable: "La fonte dei dati non ha risposto. Potrebbe essere occupata o ferma: riprova tra un minuto.",
			noData: "Ancora nessun dato.",
			season: "Stagione",
			round: "Gara",
			lap: "Giro",
			laps: "Giri",
			driver: "Pilota",
			team: "Squadra",
			pos: "Pos",
			points: "Punti",
			back: "Tutte le gare",
			sprint: "SPRINT",
			disclaimer: "Pit Lane Live Board non è ufficiale e non è in alcun modo associato alle società della Formula 1. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX e i marchi correlati sono marchi di Formula One Licensing B.V. Risultati e classifiche: Jolpica-F1 (CC BY-NC-SA 4.0). Dati live: il live timing pubblico della F1.",
			menu: "Menu",
			title: "Live Board"
		},
		sessions: {
			practice_1: "Prove libere 1",
			practice_2: "Prove libere 2",
			practice_3: "Prove libere 3",
			sprint_qualifying: "Qualifiche sprint",
			sprint: "Sprint",
			qualifying: "Qualifiche",
			race: "Gara",
			practice: "Prove libere"
		},
		calendar: {
			title: "Calendario",
			next: "PROSSIMO",
			live: "IN DIRETTA",
			results: "Risultati",
			startsIn: "inizia tra",
			empty: "Ancora nessun calendario per questa stagione.",
			round: "G{n}",
			watch: "Segui in diretta"
		},
		results: {
			title: "Risultati",
			grandPrix: "Gran Premio",
			date: "Data",
			winner: "Vincitore",
			empty: "Nessuna gara di questa stagione ha ancora risultati.",
			tabs: {
				race: "Gara",
				qualifying: "Qualifiche",
				sprint: "Sprint",
				lap_chart: "Posizioni giro per giro",
				strategy: "Strategia gomme",
				lap_times: "Tempi sul giro",
				pit_stops: "Pit stop",
				race_control: "Direzione gara",
				weather: "Meteo"
			},
			grid: "Griglia",
			time: "Tempo / stato",
			fastest: "Giro veloce",
			stop: "Sosta",
			duration: "Durata",
			archive: "Dettaglio dall'archivio delle sessioni della F1: la prima apertura lo scarica una volta sola.",
			notArchived: "L'archivio della F1 non ha il dettaglio di questa gara.",
			chooseDriver: "Pilota",
			sectors: "Settori",
			tyre: "Gomma",
			age: "Giri",
			pit: "Box",
			start: "Inizio",
			end: "Fine",
			min: "Min",
			max: "Max",
			rain: "Pioggia",
			yes: "Sì",
			no: "No",
			air: "Temperatura dell'aria",
			track: "Temperatura della pista",
			pitIn: "ENTRATA",
			pitOut: "USCITA",
			gridShort: "G"
		},
		standings: {
			title: "Classifiche",
			drivers: "Piloti",
			constructors: "Costruttori",
			after: "Dopo la gara {n}",
			wins: "Vittorie",
			behind: "Distacco",
			change: "+/−",
			empty: "Ancora nessuna classifica per questa stagione."
		},
		live: {
			idle: "Nessuna sessione in corso",
			next: "Prossima: {meeting} — {session}",
			noNext: "La stagione è finita. Ci vediamo l'anno prossimo.",
			startsIn: "inizia tra",
			connecting: "Connessione al live timing della F1…",
			syncing: "Sincronizzazione con il ritardo TV",
			syncingHelp: "Anche i primi dati vengono trattenuti di {n} s, come tutto il resto.",
			hidden: "Modalità senza spoiler attiva",
			hiddenHelp: "{meeting} — {session} è nascosto. Disattiva la modalità quando sei in pari.",
			showAll: "Mostra tutto",
			stale: "Collegamento live perso — riconnessione. I dati hanno {n} s.",
			lost: "Collegamento live perso da oltre un minuto. Niente qui è in diretta.",
			updated: "aggiornato {n} s fa",
			remaining: "rimanenti",
			gap: "Distacco",
			int: "Int",
			last: "Ultimo",
			best: "Migliore",
			tyre: "Gomma",
			pits: "Soste",
			used: "usata",
			out: "USCITA",
			pit: "BOX",
			ret: "RIT",
			stop: "FERMO",
			ko: "FUORI",
			raceControl: "Direzione gara",
			all: "Tutti",
			flags: "Bandiere",
			penalties: "Penalità",
			other: "Altro",
			radio: "Team radio",
			noRadio: "Nessun team radio pubblicato per questa sessione.",
			weather: "Meteo",
			air: "Aria",
			track: "Pista",
			humidity: "Umidità",
			wind: "Vento",
			rain: "Pioggia",
			wet: "Bagnato",
			dry: "Asciutto",
			pressure: "Pressione",
			pitStops: "Pit stop",
			pitLane: "corsia box",
			noPits: "Ancora nessun pit stop.",
			map: "Mappa della pista",
			mapLocked: "La mappa live richiede un abbonamento F1TV. Un amministratore può aggiungere un token nelle Impostazioni di questo pannello (l'icona a ingranaggio).",
			mapNoData: "Nessun dato di posizione dalla F1 per questa sessione.",
			mapDrawing: "Disegno del circuito dalle posizioni delle auto…",
			status: {
				clear: "PISTA LIBERA",
				yellow: "BANDIERA GIALLA",
				safety_car: "SAFETY CAR",
				virtual_safety_car: "VIRTUAL SAFETY CAR",
				vsc_ending: "VSC IN USCITA",
				red_flag: "BANDIERA ROSSA",
				chequered: "BANDIERA A SCACCHI"
			},
			mapNotEnabled: "La mappa live della pista non è attiva in questo Home Assistant.",
			mapToken: "F1 non ha accettato il token F1TV, quindi la mappa non c'è. Un amministratore può aggiungerne uno nuovo nelle Impostazioni di questo pannello (l'icona a ingranaggio).",
			play: "Ascolta il team radio di {driver} delle {time}",
			pause: "Ferma il team radio di {driver}",
			windSpeed: "{n} m/s",
			paused: "I tempi live sono in pausa",
			pausedShort: "In pausa",
			pausedAuto: "In pausa · auto",
			autoStart: "Partono da soli alla prossima sessione.",
			final: "FINALE",
			ended: "Terminata {time} · dati fermi",
			nextShort: "Prossima"
		},
		f1tv: {
			active: "F1TV attivo",
			expiring: "F1TV in rinnovo",
			expired: "F1TV scaduto",
			invalid: "Token F1TV rifiutato",
			not_configured: "F1TV non impostato"
		},
		tyres: {
			soft: "Morbida",
			medium: "Media",
			hard: "Dura",
			intermediate: "Intermedia",
			wet: "Da bagnato",
			unknown: "Sconosciuta"
		},
		settings: {
			title: "Impostazioni",
			live: "Tempi live",
			on: "Attivi",
			off: "In pausa",
			start: "Avvia i tempi live",
			pause: "Metti in pausa i tempi live",
			running: "Collegato ai tempi live di F1 per la sessione in corso.",
			waiting: "Pronto: si collega da solo quando inizia una sessione.",
			pausedHelp: "In pausa: niente si collega a F1 e niente di live viene scritto su disco.",
			autoStart: "Avvia automaticamente a ogni sessione",
			autoStartHelp: "I tempi live si attivano da soli quando sta per iniziare una sessione. Se li metti in pausa durante una sessione, restano in pausa fino alla successiva.",
			adminOnly: "solo amministratori",
			f1tvHelp: "F1TV serve solo per la mappa live del circuito; tutto il resto funziona senza account.",
			expires: "scade il {date}",
			tokenPaste: "Incolla il token F1TV",
			tokenReplace: "Incolla un nuovo token per sostituire quello attuale",
			save: "Salva",
			tokenSteps: "Accedi a f1tv.formula1.com, apri gli strumenti per sviluppatori del browser → Applicazione (Archiviazione in Firefox) → Cookie e copia il valore di loginSession. Viene rinnovato in automatico e dopo il salvataggio non viene più mostrato.",
			remove: "Rimuovi il token",
			removeConfirm: "Rimuovere il token F1TV? La mappa live si ferma finché non ne aggiungi uno nuovo.",
			cancel: "Annulla",
			entities: "Entità",
			entitiesHelp: "Usale in automazioni e dashboard: bandiere, safety car, penalità e decisioni dei commissari hanno le loro entità. Seguono il ritardo TV e la modalità senza spoiler.",
			disabled: "disattivata",
			errors: {
				token_invalid: "Non sembra un token F1TV. Incolla l'intero valore del cookie loginSession.",
				token_expired: "Questo token è scaduto o scade entro pochi minuti. Accedi di nuovo a F1TV e copiane uno nuovo.",
				token_no_subscription: "Questo account F1TV non ha un abbonamento attivo.",
				token_missing: "Incolla un token.",
				remove_failed: "Non è stato possibile rimuovere il token. Riprova tra un momento."
			},
			panel: "Pannello",
			sidebar: "Mostra Live Board nella barra laterale",
			sidebarHelp: "Spento: il pannello si apre comunque dalla pagina del dispositivo dell'integrazione, e le card continuano a funzionare nelle plance.",
			adminPanel: "Solo gli amministratori possono aprire il pannello",
			adminPanelHelp: "Spento (predefinito): tutti gli utenti di casa vedono Live Board. Acceso: solo gli amministratori. Le card seguono la visibilità della plancia in cui si trovano."
		},
		stewards: {
			title: "Bandiere e commissari",
			track: "Pista",
			penalties: "Penalità",
			investigations: "Investigazioni",
			trackLimits: "Limiti della pista",
			none: "Nessuna",
			calm: "Nessuna penalità né investigazione",
			showAll: "Mostra altre {n}",
			served: "scontata",
			unserved: "Penalità in tempo non ancora scontata",
			turn: "Curva {n}",
			deleted: "{n} cancellati",
			yellow: "Bandiera gialla",
			double_yellow: "Doppia bandiera gialla",
			sc: {
				deployed: "Safety car in pista",
				ending: "Safety car rientra in questo giro"
			},
			vsc: {
				deployed: "Virtual safety car attiva",
				ending: "Virtual safety car in chiusura"
			},
			short: {
				drive_through: "DT",
				stop_go: "SG",
				grid: "{n} griglia",
				disqualified: "DSQ"
			},
			kind: {
				time_penalty: "Penalità in tempo",
				drive_through: "Drive-through",
				stop_go: "Stop and go",
				grid_penalty: "Penalità in griglia",
				penalty_served: "Penalità scontata",
				disqualified: "Squalifica",
				noted: "Annotato",
				investigation: "Sotto investigazione",
				investigation_after_race: "Dopo la gara",
				no_further_action: "Nessuna azione",
				warning: "Ammonizione",
				black_and_white_flag: "Bandiera bianconera",
				lap_deleted: "Giro cancellato"
			}
		},
		cards: {
			stale: "IN RITARDO",
			lost: "NESSUN DATO",
			mapAfter: "La mappa è solo dal vivo: torna alla prossima sessione.",
			mapNeedsF1tv: "La mappa live richiede F1TV: un amministratore può aggiungere un token nelle Impostazioni del pannello.",
			tower: {
				title: "Tempi",
				name: "Classifica live",
				description: "Posizioni, distacchi, tempi, settori e gomme; scegli righe e colonne."
			},
			map: {
				name: "Mappa della pista",
				description: "Le auto sul circuito, in diretta (richiede F1TV)."
			},
			stewards: {
				name: "Bandiere e commissari",
				description: "Stato della pista, settori in giallo, safety car, penalità, investigazioni e limiti della pista."
			},
			radio: {
				name: "Team radio",
				description: "Gli ultimi team radio, con play."
			},
			race_control: {
				name: "Direzione gara",
				description: "Gli ultimi messaggi della direzione gara, filtrabili per bandiere o penalità."
			},
			session: {
				name: "Sessione",
				description: "La sessione in corso, il giro o il tempo e lo stato della pista; dopo, il conto alla rovescia per la prossima."
			},
			weather: {
				name: "Meteo",
				description: "Temperatura dell'aria e dell'asfalto, pioggia, umidità, vento e pressione al circuito."
			},
			standings: {
				name: "Campionato",
				description: "Classifica piloti o costruttori, primi N."
			},
			fields: {
				title: "Titolo",
				rows: "Righe",
				columns: "Colonne",
				highlight: "Pilota da evidenziare (es. LEC)",
				count: "Quanti",
				filter: "Mostra",
				kind: "Campionato",
				show_title: "Mostra il titolo"
			}
		},
		time: {
			title: "Orari",
			justYou: "solo per te",
			home: "Come nel mio profilo di Home Assistant ({zone})",
			device: "Fuso orario di questo dispositivo ({zone})",
			circuit: "Ora locale del circuito",
			both: "Mostra entrambi gli orari",
			bothHelp: "Accanto a ogni orario, in piccolo, l'altro: l'ora locale del circuito, o la tua se hai scelto quella del circuito.",
			atTrack: "{time} al circuito",
			yours: "{time} ora tua"
		},
		drivers: {
			title: "I miei piloti",
			help: "Segui fino a cinque piloti: ognuno ha un sensore con posizione, distacco, gomme e soste, e l'evento «I miei piloti» scatta quando guadagna o perde una posizione, passa in testa, si ferma ai box, fa il giro veloce, si ritira o viene penalizzato. Nella classifica le loro righe hanno una ★.",
			max: "Fino a cinque piloti.",
			followed: "Un pilota che segui",
			stint: "Stint",
			laps: "Giri",
			bestInStint: "Giro migliore",
			lapRange: "{from}–{to}",
			fromLap: "dal giro {from}",
			onLap: "giro {lap}",
			rejoin: "Se si ferma ora: rientra P{position}",
			behindOf: "dietro {driver} (+{gap} s)",
			aheadOf: "davanti a {driver} ({gap} s)",
			lossCircuit: "Stima: una sosta costa circa {loss} s su questo circuito.",
			lossGeneric: "Stima: una sosta costa circa {loss} s (valore generico).",
			pitting: "{n} auto ai box: meno certa."
		},
		summary: {
			title: "Riepilogo a fine sessione",
			help: "A fine sessione: podio, giro veloce, ritiri, penalità e i tuoi piloti, inviati ai servizi di notifica che scegli. È anche l'evento «Riepilogo della sessione», per le tue automazioni.",
			where: "Invia a",
			which: "Dopo",
			noServices: "Nessun servizio di notifica in questo Home Assistant (l'app per telefono ne aggiunge uno per telefono).",
			test: "Invia una prova",
			testSent: "Inviato: il riepilogo di ciò che mostra la pagina Live.",
			testNothing: "Ancora niente da riepilogare: serve una sessione nella pagina Live.",
			testFailed: "Non inviato.",
			spoiler: "Con la modalità senza spoiler attiva, il riepilogo aspetta che tu scopra la sessione o spenga la modalità.",
			testHidden: "Non inviato: la modalità senza spoiler nasconde la pagina Live."
		}
	}
};
function Be(e) {
	return (e?.locale?.language ?? e?.language ?? "en").toLowerCase().startsWith("it") ? "it" : "en";
}
function Ve(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n) return;
		n = n[e];
	}
	return typeof n == "string" ? n : void 0;
}
function L(e) {
	let t = ze[Be(e)];
	return (e, n) => {
		let r = Ve(t, e) ?? Ve(Re, e) ?? e;
		for (let [e, t] of Object.entries(n ?? {})) r = r.replaceAll(`{${e}}`, String(t));
		return r;
	};
}
//#endregion
//#region src/icons.ts
var R = {
	clock: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16m0-18a10 10 0 1 1 0 20 10 10 0 0 1 0-20m.5 5v5.25l4.5 2.67-.75 1.23L11 13V7z",
	eyeOff: "M11.83 9 15 12.16V12a3 3 0 0 0-3-3zm-4.3.8 1.55 1.55A3 3 0 0 0 12 15c.22 0 .44-.03.65-.08l1.55 1.55A5 5 0 0 1 7 12c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28.45.45A11.8 11.8 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22 21 20.73 3.27 3zM12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7",
	eye: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6m0 8a5 5 0 1 1 0-10 5 5 0 0 1 0 10m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5",
	play: "M8 5.14v14l11-7z",
	pause: "M14 19h4V5h-4M6 19h4V5H6z",
	lock: "M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3",
	alert: "M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2z",
	timer: "M12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14m7.03-12.61 1.42-1.42c-.45-.51-.9-.97-1.41-1.41L17.62 6c-1.55-1.26-3.5-2-5.62-2a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61M11 14h2V8h-2m4-7H9v2h6z",
	board: "M3 5h2v14H3zM7 5h14v2H7zm0 4h10v2H7zm0 4h14v2H7zm0 4h8v2H7z",
	menu: "M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z",
	back: "M20 11v2H8l5.5 5.5-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5 8 11z",
	cog: "M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.51.51 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64z"
}, z = (e, t = 20) => E`<svg viewBox="0 0 24 24" width=${t} height=${t} fill="currentColor" aria-hidden="true"><path d=${e}></path></svg>`, B = o`
  :host {
    --plb-purple: #a24bdb;
    --plb-green: #1fa855;
    --plb-yellow: #e0b000;
    --plb-soft: #e8333a;
    --plb-medium: #f2c200;
    --plb-hard: #eeeeee;
    --plb-intermediate: #3aa845;
    --plb-wet: #2f7de1;
    --plb-unknown: #8a8a8a;
    --plb-row-alt: color-mix(in srgb, var(--primary-text-color) 3%, transparent);
    --plb-muted: color-mix(in srgb, var(--primary-text-color) 55%, transparent);
    --plb-radius: var(--ha-card-border-radius, 12px);
    --plb-gap: 16px;
    color: var(--primary-text-color);
    font-family: var(--ha-font-family-body, Roboto, "Segoe UI", system-ui, sans-serif);
  }
  .num, .t { font-variant-numeric: tabular-nums; }
  .card {
    background: var(--card-background-color, #fff);
    border-radius: var(--plb-radius);
    box-shadow: var(--ha-card-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06));
    border: var(--ha-card-border-width, 0) solid var(--ha-card-border-color, var(--divider-color));
    overflow: hidden;
  }
  .card-head {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; border-bottom: 1px solid var(--divider-color);
    font-size: 15px; font-weight: 500;
  }
  .card-head .spacer, .spacer { flex: 1; }
  .card-head small { color: var(--secondary-text-color); font-weight: 400; font-size: 12px; }
  .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: var(--plb-gap); }
  .toolbar h1 { margin: 0 8px 0 0; font-size: 22px; font-weight: 500; }
  select {
    height: 36px; border-radius: 8px; border: 1px solid var(--divider-color);
    background: var(--card-background-color); color: var(--primary-text-color);
    padding: 0 10px; font: inherit; font-size: 14px;
  }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 12px; border-radius: 16px;
    border: 1px solid var(--divider-color); background: none;
    color: var(--primary-text-color); font: inherit; font-size: 13px; cursor: pointer; white-space: nowrap;
  }
  .chip.on {
    background: color-mix(in srgb, var(--primary-color) 16%, transparent);
    border-color: transparent; color: var(--primary-color);
  }
  .chip.small { height: 26px; font-size: 12px; padding: 0 10px; }
  .tab {
    border: 0; background: none; color: var(--secondary-text-color);
    font: inherit; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;
    padding: 8px 14px; border-radius: 18px; cursor: pointer; white-space: nowrap;
  }
  .tab.active { color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 14%, transparent); }
  .btn {
    height: 36px; padding: 0 16px; border-radius: 18px; border: 0;
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    font: inherit; font-weight: 500; cursor: pointer;
  }
  .btn.flat { background: none; color: var(--primary-color); border: 1px solid var(--divider-color); }
  .link { border: 0; background: none; color: var(--primary-color); font: inherit; cursor: pointer; padding: 0; }
  .bar { display: inline-block; width: 4px; height: 20px; border-radius: 2px; flex: none; }
  .drv { display: inline-flex; align-items: center; gap: 8px; }
  .tla { font-weight: 600; letter-spacing: 0.03em; }
  .gained { font-size: 11px; font-weight: 600; }
  .up { color: var(--plb-green); }
  .down { color: var(--error-color, #db4437); }
  .t.pb { color: var(--plb-green); font-weight: 600; }
  .t.ob { color: var(--plb-purple); font-weight: 600; }
  .t.prev { color: var(--plb-muted); }
  .tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
  .tbl td, .tbl th { padding: 8px 12px; border-bottom: 1px solid var(--divider-color); text-align: left; white-space: nowrap; }
  .tbl th { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
  .tbl .r { text-align: right; }
  .tbl tr.click { cursor: pointer; }
  .tbl tr.click:hover td { background: var(--plb-row-alt); }
  .scroll { overflow-x: auto; }
  .muted { color: var(--secondary-text-color); }
  .also { display: block; color: var(--secondary-text-color); font-size: 11px; font-weight: 400; }
  .hidden-cell { color: var(--secondary-text-color); font-style: italic; }
  .state {
    display: grid; justify-items: center; gap: 12px; text-align: center;
    padding: 56px 24px; color: var(--secondary-text-color);
  }
  .state h2 { margin: 0; color: var(--primary-text-color); font-weight: 500; font-size: 22px; }
  .state .big { font-size: 44px; font-weight: 300; color: var(--primary-text-color); }
  .state svg { width: 56px; height: 56px; opacity: 0.5; }
  .note { font-size: 12px; color: var(--secondary-text-color); padding: 10px 16px; border-top: 1px solid var(--divider-color); line-height: 1.5; }
  .pill { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 8px; border-radius: 10px; background: var(--secondary-background-color); }
  .pill.sprint { background: #7c4dff; color: #fff; }
  .pill.live { background: var(--error-color, #db4437); color: #fff; }
  .tyre { display: inline-flex; align-items: center; gap: 6px; }
  .tyre-dot {
    width: 22px; height: 22px; border-radius: 50%; display: inline-grid; place-items: center;
    font-size: 11px; font-weight: 700; color: var(--primary-text-color);
    border: 3px solid var(--c); background: var(--card-background-color);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary-text-color) 22%, transparent);
    box-sizing: border-box;
  }
  .tyre small { color: var(--secondary-text-color); font-size: 12px; }
  .tyre .used { font-size: 10px; color: var(--secondary-text-color); }
  .badge {
    display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
    background: var(--secondary-background-color); color: var(--primary-text-color);
  }
  .badge.pit { background: #1e88e5; color: #fff; }
  .badge.out { background: #6d4c41; color: #fff; }
  .badge.ret { background: var(--error-color, #db4437); color: #fff; }
  .badge.ko { color: var(--secondary-text-color); }
  .error { padding: 24px; display: grid; gap: 12px; justify-items: start; color: var(--secondary-text-color); }
  .loading { padding: 32px; color: var(--secondary-text-color); }
  .chart { padding: 12px 8px 16px; overflow-x: auto; }
  .chart svg { display: block; min-width: 640px; width: 100%; height: auto; }
  .chart .axis { stroke: var(--divider-color); }
  .chart text { fill: var(--secondary-text-color); font-size: 11px; }
  @media (max-width: 640px) {
    .tbl td, .tbl th { padding: 8px 8px; }
  }
`, He = {
	soft: "--plb-soft",
	medium: "--plb-medium",
	hard: "--plb-hard",
	intermediate: "--plb-intermediate",
	wet: "--plb-wet",
	unknown: "--plb-unknown"
}, Ue = {
	mercedes: "#27F4D2",
	ferrari: "#E8002D",
	mclaren: "#F47600",
	red_bull: "#3671C6",
	aston_martin: "#229971",
	alpine: "#00A1E8",
	williams: "#1868DB",
	haas: "#B6BABD",
	rb: "#6692FF",
	sauber: "#52E252",
	audi: "#BB0A30",
	cadillac: "#909090"
}, We = [
	"#5c6bc0",
	"#26a69a",
	"#ef6c00",
	"#8e24aa",
	"#43a047",
	"#d81b60",
	"#00897b",
	"#6d4c41",
	"#3949ab",
	"#c0ca33"
];
function Ge(e, t) {
	if (t) return t;
	if (e && Ue[e]) return Ue[e];
	let n = 0;
	for (let t of e ?? "") n = n * 31 + t.charCodeAt(0) >>> 0;
	return We[n % We.length];
}
//#endregion
//#region src/timeprefs.ts
var Ke = "pit_lane_live_board_time", V = "plb-time-prefs", H = {
	zone: "home_assistant",
	both: !1
}, qe;
function Je() {
	return H;
}
function Ye(e) {
	return qe ??= e.callWS({
		type: "frontend/get_user_data",
		key: Ke
	}).then((e) => {
		let t = e?.value ?? {};
		return H = {
			zone: [
				"home_assistant",
				"device",
				"circuit"
			].includes(String(t.zone)) ? t.zone : "home_assistant",
			both: t.both === !0
		}, window.dispatchEvent(new Event(V)), H;
	}).catch(() => H), qe;
}
async function Xe(e, t) {
	let n = H;
	H = t, window.dispatchEvent(new Event(V));
	try {
		await e.callWS({
			type: "frontend/set_user_data",
			key: Ke,
			value: t
		});
	} catch (e) {
		throw H = n, window.dispatchEvent(new Event(V)), e;
	}
}
//#endregion
//#region src/format.ts
function U(e) {
	return Be(e) === "it" ? "it-IT" : "en-GB";
}
var Ze = /* @__PURE__ */ new Map(), Qe = /* @__PURE__ */ new Map();
function W(e, t) {
	let n = `${U(e)}|${JSON.stringify(t)}`, r = Ze.get(n);
	return r || (r = new Intl.DateTimeFormat(U(e), t), Ze.set(n, r)), r;
}
function $e(e, t) {
	let n = `${U(e)}|${t}`, r = Qe.get(n);
	return r || (r = new Intl.NumberFormat(U(e), { maximumFractionDigits: t }), Qe.set(n, r)), r;
}
function et() {
	return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
function tt(e) {
	return e.locale?.time_zone === "local" ? et() : e.config.time_zone;
}
function G(e, t) {
	let n = Je().zone;
	return n === "circuit" && t ? t : n === "device" ? et() : tt(e);
}
function nt(e, t, n, r) {
	return t ? W(e, {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: G(e, r)
	}).format(new Date(t)) : W(e, {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	}).format(/* @__PURE__ */ new Date(`${n}T12:00:00Z`));
}
function rt(e, t, n) {
	if (!t || !n || !Je().both) return null;
	let r = G(e, n), i = r === n ? tt(e) : n;
	if (i === r) return null;
	let a = (n) => W(e, {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: n
	}).format(new Date(t)), o = a(i);
	return o === a(r) ? null : {
		time: o,
		local: i === n
	};
}
function it(e, t) {
	if (!t) return "";
	let n = t.length === 10, r = n ? /* @__PURE__ */ new Date(`${t}T12:00:00Z`) : new Date(t);
	return W(e, {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: n ? "UTC" : G(e)
	}).format(r);
}
function at(e, t, n) {
	let r = W(e, {
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	}), i = /* @__PURE__ */ new Date(`${t}T12:00:00Z`), a = /* @__PURE__ */ new Date(`${n}T12:00:00Z`);
	return i.getUTCMonth() === a.getUTCMonth() ? `${i.getUTCDate()}–${r.format(a)}` : `${r.format(i)} – ${r.format(a)}`;
}
function ot(e) {
	return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(e) ? e : `${e}Z`);
}
function K(e, t) {
	return t ? W(e, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZone: G(e)
	}).format(ot(t)) : "";
}
function st(e, t) {
	return t ? W(e, {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: G(e)
	}).format(ot(t)) : "";
}
function ct(e) {
	let t = Math.max(0, Math.floor(e / 1e3)), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60), a = t % 60, o = (e) => String(e).padStart(2, "0");
	return n ? `${n} d ${o(r)} h ${o(i)} m` : r ? `${r} h ${o(i)} m` : `${o(i)} m ${o(a)} s`;
}
function lt(e) {
	if (e === null) return "";
	let t = Math.max(0, Math.round(e)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = t % 60, a = (e) => String(e).padStart(2, "0");
	return n ? `${n}:${a(r)}:${a(i)}` : `${a(r)}:${a(i)}`;
}
function q(e, t, n = 1) {
	return t == null ? "—" : $e(e, n).format(t);
}
function ut(e, t) {
	return !t || !e || e.language !== t.language || e.locale?.language !== t.locale?.language || e.config?.time_zone !== t.config?.time_zone || e.user?.is_admin !== t.user?.is_admin;
}
//#endregion
//#region src/parts.ts
function dt(e) {
	return e ? `${e.no_spoiler}|${e.revealed.join(",")}` : "";
}
function ft(e) {
	return (t) => {
		(t.key === "Enter" || t.key === " ") && (t.preventDefault(), e());
	};
}
function pt(e, t, n, r) {
	let i = t === "unknown" ? "?" : t[0].toUpperCase();
	return T`<span class="tyre" title=${e(`tyres.${t}`)}>
    <span class="tyre-dot" style="--c:var(${He[t] ?? He.unknown})">${i}</span>
    ${r === null ? O : T`<small class="num">${r}</small>`}
    ${n === !1 ? T`<span class="used">${e("live.used")}</span>` : O}
  </span>`;
}
function mt(e, t = !0) {
	return e == null ? O : e > 0 ? T`<span class="gained up">▲${e}</span>` : e < 0 ? T`<span class="gained down">▼${-e}</span>` : t ? T`<span class="gained muted">–</span>` : O;
}
function J(e, t, n) {
	return T`<span class="drv"
    ><span class="bar" style="background:${Ge(t, n)}"></span>${e ?? "—"}</span
  >`;
}
function ht(e, t, n, r) {
	let i = rt(t, n, r);
	return i ? T`<small class="also">${e(i.local ? "time.atTrack" : "time.yours", { time: i.time })}</small>` : O;
}
function gt(e) {
	return !e?.length || e.every((e) => !e) ? O : T`<span class="seg" aria-hidden="true">${e.map((e) => T`<i class=${e}></i>`)}</span>`;
}
function _t(e) {
	return T`<div class="card loading">${e("common.loading")}</div>`;
}
function Y(e, t) {
	return T`<div class="card error">
    <div>${e("common.unavailable")}</div>
    <button class="btn flat" @click=${t}>${e("common.retry")}</button>
  </div>`;
}
//#endregion
//#region node_modules/lit-html/directive.js
var vt = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, yt = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), bt = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, { I: xt } = Ae, St = (e) => e, Ct = () => document.createComment(""), X = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new xt(r.insertBefore(Ct(), i), r.insertBefore(Ct(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = St(e).nextSibling;
				St(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, Z = (e, t, n = e) => (e._$AI(t, n), e), wt = {}, Tt = (e, t = wt) => e._$AH = t, Et = (e) => e._$AH, Dt = (e) => {
	e._$AR(), e._$AA.remove();
}, Ot = yt(class extends bt {
	constructor() {
		super(...arguments), this.key = O;
	}
	render(e, t) {
		return this.key = e, t;
	}
	update(e, [t, n]) {
		return t !== this.key && (Tt(e), this.key = t), n;
	}
}), kt = class extends N {
	constructor(...e) {
		super(...e), this.to = "", this.now = Date.now();
	}
	static {
		this.properties = {
			to: { type: String },
			now: { state: !0 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.schedule();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearTimeout(this.timer);
	}
	schedule() {
		let e = Date.parse(this.to) - Date.now(), t = Number.isFinite(e) && e < 36e5 ? 1e3 : 3e4;
		this.timer = window.setTimeout(() => {
			this.now = Date.now(), this.schedule();
		}, t);
	}
	render() {
		let e = Date.parse(this.to);
		return Number.isFinite(e) ? ct(e - this.now) : "";
	}
	static {
		this.styles = o`
    :host { font-variant-numeric: tabular-nums; }
  `;
	}
}, At = class extends N {
	constructor(...e) {
		super(...e), this.age = 0, this.at = Date.now(), this.precise = !0, this.now = Date.now();
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: ut
			},
			age: { type: Number },
			at: { type: Number },
			precise: { type: Boolean },
			now: { state: !0 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.timer = window.setInterval(() => this.now = Date.now(), 1e3);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this.timer);
	}
	render() {
		if (!this.hass) return "";
		let e = this.age + Math.max(0, this.now - this.at) / 1e3;
		return L(this.hass)("live.updated", { n: q(this.hass, e, +!!this.precise) });
	}
	static {
		this.styles = o`
    :host { font-variant-numeric: tabular-nums; }
  `;
	}
};
function jt(e, t, n, r) {
	return T`<plb-age .hass=${e} .age=${t} .at=${n} ?precise=${r}></plb-age>`;
}
//#endregion
//#region src/pages/calendar.ts
var Mt = class extends N {
	constructor(...e) {
		super(...e), this.seasons = [], this.failed = !1, this.now = Date.now(), this.request = 0, this.spoilers = "";
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			seasons: { attribute: !1 },
			season: { state: !0 },
			data: { state: !0 },
			failed: { state: !0 },
			now: { state: !0 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.timer = window.setInterval(() => this.now = Date.now(), 3e4);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this.timer);
	}
	willUpdate(e) {
		this.season === void 0 && this.settings && (this.season = this.settings.season);
		let t = dt(this.settings);
		(e.has("season") || t !== this.spoilers) && (this.spoilers = t, this.load());
	}
	async load() {
		if (!this.hass || this.season === void 0) return;
		let e = ++this.request;
		this.failed = !1;
		try {
			let t = await F.calendar(this.hass, this.season);
			e === this.request && (this.data = t);
		} catch {
			e === this.request && (this.failed = !0);
		}
	}
	render() {
		let e = L(this.hass), t = this.seasons.length ? this.seasons : [this.season ?? 0];
		return T`
      <div class="toolbar">
        <h1>${e("calendar.title")}</h1>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.data = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => T`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
      </div>
      ${this.failed ? Y(e, () => this.load()) : !this.data || this.data.season !== this.season ? _t(e) : this.data.meetings.length ? T`<div class="cal">${this.data.meetings.map((e) => this.renderMeeting(e))}</div>` : T`<div class="card state">${e("calendar.empty")}</div>`}
    `;
	}
	go(e) {
		this.dispatchEvent(new CustomEvent("plb-go", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	renderMeeting(e) {
		let t = L(this.hass), n = e.sessions[0]?.date, r = e.sessions[e.sessions.length - 1]?.date, i = e.state === "next" ? e.sessions.find((e) => e.start && Date.parse(e.start) > this.now) : void 0;
		return T`<div class="card meet ${e.state}">
      <div class="meet-head"><span class="round">${t("calendar.round", { n: e.round })}</span><h3>${e.name}</h3></div>
      <div class="where">${[e.locality, e.country].filter(Boolean).join(" · ")}${n && r ? ` · ${at(this.hass, n, r)}` : ""}</div>
      ${e.sprint || e.state === "next" || e.state === "live" ? T`<div class="flagline">
            ${e.sprint ? T`<span class="pill sprint">${t("common.sprint")}</span>` : O}
            ${e.state === "next" ? T`<span class="pill">${t("calendar.next")}</span>` : O}
            ${e.state === "live" ? T`<span class="pill live">${t("calendar.live")}</span>` : O}
          </div>` : O}
      ${e.state === "done" ? T`<div class="podium">
              ${e.podium_hidden ? T`<div class="hidden-cell">${t("spoiler.hiddenRound")}</div>` : (e.podium ?? []).map((e, t) => T`<div><b>${t + 1}</b>${J(e.name, e.team_id)}</div>`)}
            </div>
            <button class="link more" @click=${() => this.go({
			page: "results",
			season: e.season,
			round: e.round
		})}>
              ${t("calendar.results")} →
            </button>` : T`<ul>
            ${e.sessions.map((n) => T`<li><span>${t(`sessions.${n.kind}`)}</span><span class="num">${nt(this.hass, n.start, n.date, e.timezone)}${ht(t, this.hass, n.start, e.timezone)}</span></li>`)}
          </ul>`}
      ${e.state === "live" ? T`<button class="link more" @click=${() => this.go({ page: "live" })}>${t("calendar.watch")} →</button>` : O}
      ${i?.start ? T`<div class="countdown">${t(`sessions.${i.kind}`)} · ${t("calendar.startsIn")}
            <b class="num">${ct(Date.parse(i.start) - this.now)}</b></div>` : O}
    </div>`;
	}
	static {
		this.styles = [B, o`
      :host { display: block; }
      .cal { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--plb-gap); align-items: start; }
      .meet { display: grid; }
      .meet-head { display: flex; align-items: baseline; gap: 10px; padding: 14px 16px 6px; }
      .round { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); letter-spacing: 0.06em; }
      h3 { margin: 0; font-size: 17px; font-weight: 500; }
      .where { padding: 0 16px 10px; color: var(--secondary-text-color); font-size: 13px; }
      .flagline { display: flex; align-items: center; gap: 6px; padding: 0 16px 10px; }
      ul { list-style: none; margin: 0; padding: 0 16px 12px; display: grid; gap: 6px; font-size: 13px; }
      li { display: flex; gap: 10px; }
      li span:first-child { width: 150px; color: var(--secondary-text-color); }
      .meet.done { opacity: 0.8; }
      .meet.next { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .meet.live { outline: 2px solid var(--error-color, #db4437); outline-offset: -2px; }
      .countdown {
        margin: 0 16px 14px; padding: 10px 12px; border-radius: 8px; font-size: 13px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
      }
      .countdown b { font-size: 18px; font-weight: 500; }
      .podium { display: grid; gap: 4px; padding: 0 16px 10px; font-size: 13px; }
      .podium div { display: flex; align-items: center; gap: 8px; }
      .podium b { width: 18px; color: var(--secondary-text-color); font-weight: 500; }
      .more { justify-self: start; margin: 0 16px 14px; font-size: 13px; }
      @media (max-width: 640px) {
        .cal { grid-template-columns: 1fr; }
        li span:first-child { width: 130px; }
      }
    `];
	}
}, Nt = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, Q = yt(class extends bt {
	constructor(e) {
		if (super(e), e.type !== vt.CHILD) throw Error("repeat() can only be used in text expressions");
	}
	dt(e, t, n) {
		let r;
		n === void 0 ? n = t : t !== void 0 && (r = t);
		let i = [], a = [], o = 0;
		for (let t of e) i[o] = r ? r(t, o) : o, a[o] = n(t, o), o++;
		return {
			values: a,
			keys: i
		};
	}
	render(e, t, n) {
		return this.dt(e, t, n).values;
	}
	update(e, [t, n, r]) {
		let i = Et(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = Z(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = Z(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = Z(i[d], a[m]), X(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = Z(i[f], a[p]), X(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = Nt(o, p, m), u = Nt(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = X(e, i[d]);
					Z(t, a[p]), c[p] = t;
				} else c[p] = Z(n, a[p]), X(e, i[d], n), i[t] = null;
				p++;
			} else Dt(i[f]), f--;
		} else Dt(i[d]), d++;
		for (; p <= m;) {
			let t = X(e, c[m + 1]);
			Z(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && Dt(e);
		}
		return this.ut = o, Tt(e, c), D;
	}
}), $ = 4, Pt = {
	clear: "st-clear",
	yellow: "st-yellow",
	safety_car: "st-sc",
	virtual_safety_car: "st-sc",
	vsc_ending: "st-yellow",
	red_flag: "st-red",
	chequered: "st-chequered"
};
function Ft(e) {
	return e ? Pt[e] ?? "" : "";
}
function It(e, t) {
	return (!t || t === "clear" || t === "chequered") && !e.yellow && !e.red_flag && !e.safety_car && !e.virtual_safety_car && !e.penalties.length && !e.investigations.length && !e.track_limits.length;
}
function Lt(e, t) {
	switch (t.kind) {
		case "time_penalty": return `+${t.seconds ?? "?"}s`;
		case "drive_through": return e("stewards.short.drive_through");
		case "stop_go": return t.seconds ? `${e("stewards.short.stop_go")} ${t.seconds}s` : e("stewards.short.stop_go");
		case "grid_penalty": return e("stewards.short.grid", { n: t.places ?? "?" });
		case "disqualified": return e("stewards.short.disqualified");
		default: return e(`stewards.kind.${t.kind}`);
	}
}
function Rt(e) {
	return e.cars.map((e) => e.tla).join(" · ");
}
function zt(e, t, n) {
	return e.length <= $ ? e.map(t) : T`${e.slice(0, $).map(t)}
    <details><summary>${n("stewards.showAll", { n: e.length - $ })}</summary>${e.slice($).map(t)}</details>`;
}
function Bt(e, t) {
	return T`<li class=${t.served ? "served" : ""}>
    <span class="pen">${Lt(e, t)}</span>
    <span class="what"><b>${Rt(t)}</b>${t.reason ? T` <span class="why">${t.reason}</span>` : O}</span>
    <span class="when">${t.served ? T`✓ ${e("stewards.served")}` : t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
  </li>`;
}
function Vt(e, t) {
	return T`<li>
    <span class="tag">${e(`stewards.kind.${t.status ?? t.kind}`)}</span>
    <span class="what"><b>${Rt(t)}</b>${t.reason ? T` <span class="why">${t.reason}</span>` : O}</span>
    <span class="when">${t.turn ? e("stewards.turn", { n: t.turn }) : t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
  </li>`;
}
function Ht(e, t, n) {
	let r = t.safety_car ?? t.virtual_safety_car, i = t.safety_car ? "sc" : "vsc";
	return T`<div class="col">
    <h4>${e("stewards.track")}</h4>
    ${n ? T`<span class="status-pill ${Ft(n)}">${e(`live.status.${n}`)}</span>` : T`<span class="muted">—</span>`}
    ${r ? T`<div class="phase">${e(`stewards.${i}.${r}`)}</div>` : O}
    ${t.yellow_sectors.length ? T`<div class="sectors">${t.yellow_sectors.map((t) => T`<span class="sector-chip ${t.flag}" title=${e(`stewards.${t.flag}`)}
            >S${t.sector}${t.flag === "double_yellow" ? T`<small>×2</small>` : O}</span>`)}</div>` : O}
  </div>`;
}
function Ut(e, t, n, r, i) {
	let a = t.penalties.filter((e) => !e.served).length;
	return T`<button class="compact" @click=${i} aria-expanded=${r ? "true" : "false"}>
    ${n ? T`<span class="status-pill ${Ft(n)}">${e(`live.status.${n}`)}</span>` : O}
    ${t.yellow_sectors.map((e) => T`<span class="sector-chip ${e.flag}">S${e.sector}</span>`)}
    ${t.penalties.length ? T`<span class="count ${a ? "hot" : ""}">${e("stewards.penalties")} ${t.penalties.length}</span>` : O}
    ${t.investigations.length ? T`<span class="count">${e("stewards.investigations")} ${t.investigations.length}</span>` : O}
    ${t.track_limits.length ? T`<span class="count">${e("stewards.trackLimits")} ${t.track_limits.length}</span>` : O}
    <span class="chevron">${r ? "▴" : "▾"}</span>
  </button>`;
}
function Wt(e, t, n, r = !1, i = () => void 0) {
	return t ? It(t, n) ? T`<div class="card stewards calm">
      <span class="status-pill ${Ft(n ?? "clear")}">${e(`live.status.${n ?? "clear"}`)}</span>
      <span class="muted">${e("stewards.calm")}</span>
    </div>` : T`<section class="card stewards ${t.red_flag ? "accent-red" : t.safety_car || t.virtual_safety_car ? "accent-sc" : ""} ${r ? "open" : ""}" aria-label=${e("stewards.title")}>
    <div class="card-head">${e("stewards.title")}</div>
    ${Ut(e, t, n, r, i)}
    <div class="cols">
      ${Ht(e, t, n)}
      <div class="col">
        <h4>${e("stewards.penalties")} <small>${t.penalties.length || ""}</small></h4>
        ${t.penalties.length ? T`<ul>${zt(t.penalties, (t) => Bt(e, t), e)}</ul>` : T`<span class="muted">${e("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${e("stewards.investigations")} <small>${t.investigations.length || ""}</small></h4>
        ${t.investigations.length ? T`<ul>${zt(t.investigations, (t) => Vt(e, t), e)}</ul>` : T`<span class="muted">${e("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${e("stewards.trackLimits")}</h4>
        ${t.track_limits.length ? T`<ul>${zt(t.track_limits, (t) => T`<li><b>${t.tla}</b><span class="what">${e("stewards.deleted", { n: t.deleted })}</span>
                ${t.black_and_white ? T`<span class="bw" title=${e("stewards.kind.black_and_white_flag")}>⚑</span>` : O}</li>`, e)}</ul>` : T`<span class="muted">${e("stewards.none")}</span>`}
      </div>
    </div>
  </section>` : O;
}
var Gt = o`
  /* Sized by its own width, not the window's: the same card sits in the panel
     and, narrower, on a dashboard. */
  .stewards { margin-bottom: var(--plb-gap); container-type: inline-size; }
  .stewards.calm { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 10px 16px; font-size: 13px; }
  .stewards.accent-sc { box-shadow: inset 4px 0 #f2c200, var(--ha-card-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.08)); }
  .stewards.accent-red { box-shadow: inset 4px 0 var(--error-color, #db4437), var(--ha-card-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.08)); }
  .stewards .cols { display: grid; grid-template-columns: minmax(160px, 0.7fr) 1.2fr 1.2fr 0.8fr; }
  .stewards .col { padding: 12px 16px; display: grid; gap: 8px; align-content: start; min-width: 0; }
  .stewards .col + .col { border-left: 1px solid var(--divider-color); }
  .stewards h4 { margin: 0; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color); }
  .stewards ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .stewards li { display: flex; align-items: baseline; gap: 8px; font-size: 13px; min-width: 0; }
  .stewards li.served { color: var(--plb-muted); }
  .stewards .what { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .stewards .why { color: var(--secondary-text-color); font-size: 12px; }
  .stewards .when { color: var(--secondary-text-color); font-size: 11px; white-space: nowrap; }
  .stewards .pen { flex: none; min-width: 36px; text-align: center; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;
    background: var(--error-color, #db4437); color: #fff; font-variant-numeric: tabular-nums; }
  .stewards li.served .pen { background: var(--secondary-background-color); color: var(--plb-muted); }
  .stewards .tag { flex: none; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.03em;
    background: color-mix(in srgb, var(--warning-color, #ffa600) 20%, transparent); }
  .stewards .col > .status-pill { justify-self: start; }
  .stewards .compact { display: none; width: 100%; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px 12px; border: 0;
    background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
  .stewards .compact .status-pill { padding: 4px 10px; font-size: 12px; }
  .stewards .count { padding: 3px 8px; border-radius: 10px; font-size: 12px; background: var(--secondary-background-color); }
  .stewards .count.hot { background: var(--error-color, #db4437); color: #fff; }
  .stewards .chevron { margin-left: auto; color: var(--secondary-text-color); }
  .stewards .phase { font-size: 12px; color: var(--secondary-text-color); }
  .stewards .sectors { display: flex; flex-wrap: wrap; gap: 6px; }
  .sector-chip { display: inline-flex; align-items: baseline; gap: 2px; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 700;
    background: #f2c200; color: #1a1a1a; }
  .sector-chip.double_yellow { outline: 2px solid #f2c200; outline-offset: 1px; }
  .sector-chip small { font-size: 10px; }
  .stewards .bw { font-size: 14px; }
  .stewards details summary { cursor: pointer; font-size: 12px; color: var(--primary-color); list-style: none; }
  .stewards details[open] summary { display: none; }
  .stewards details { display: grid; gap: 6px; }
  @container (max-width: 1000px) {
    .stewards .cols { grid-template-columns: 1fr 1fr; }
    .stewards .col:nth-child(3) { border-left: 0; }
    .stewards .col:nth-child(n + 3) { border-top: 1px solid var(--divider-color); }
  }
  @container (max-width: 560px) {
    .stewards .card-head { display: none; }
    .stewards .compact { display: flex; }
    .stewards .cols { grid-template-columns: 1fr; display: none; border-top: 1px solid var(--divider-color); }
    .stewards.open .cols { display: grid; }
    .stewards .col + .col { border-left: 0; border-top: 1px solid var(--divider-color); }
  }
`, Kt = o`
  .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; }
  .status-pill::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
  .st-clear { background: color-mix(in srgb, var(--plb-green) 16%, transparent); color: var(--plb-green); }
  .st-yellow { background: color-mix(in srgb, var(--plb-yellow) 22%, transparent); color: #a07d00; }
  .st-sc { background: #f2c200; color: #1a1a1a; }
  .st-red { background: var(--error-color, #db4437); color: #fff; }
  .st-chequered { background: var(--secondary-background-color); color: var(--primary-text-color); }
  .st-chequered::before { border-radius: 2px; background: repeating-conic-gradient(#222 0 25%, #fff 0 50%) 0 0 / 5px 5px;
  box-shadow: 0 0 0 1px var(--divider-color); }
`, qt = {
	all: null,
	flags: "flag",
	penalties: "penalty",
	other: "other"
}, Jt = /* @__PURE__ */ new Set([
	"live",
	"stale",
	"lost",
	"final"
]), Yt = class extends N {
	constructor(...e) {
		super(...e), this.selected = "", this.filter = "all", this.playing = "", this.failed = !1, this.starting = !1, this.stewardsOpen = !1, this.subscribing = !1, this.receivedAt = Date.now();
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: ut
			},
			settings: { attribute: !1 },
			view: { state: !0 },
			selected: { state: !0 },
			filter: { state: !0 },
			playing: { state: !0 },
			failed: { state: !0 },
			starting: { state: !0 },
			stewardsOpen: { state: !0 }
		};
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearTimeout(this.retry), this.retry = void 0, this.unsubscribe?.(), this.unsubscribe = void 0, this.stopAudio();
	}
	willUpdate() {
		this.hass && !this.unsubscribe && !this.subscribing && this.retry === void 0 && this.subscribe();
	}
	async subscribe() {
		this.subscribing = !0;
		try {
			let e = await F.subscribeLive(this.hass, (e) => this.receive(e));
			if (!this.isConnected) {
				e();
				return;
			}
			this.unsubscribe = e, this.failed = !1;
		} catch {
			if (!this.isConnected) return;
			this.failed = !0, this.retry = window.setTimeout(() => {
				this.retry = void 0, this.requestUpdate();
			}, 1e4);
		} finally {
			this.subscribing = !1;
		}
	}
	receive(e) {
		this.view = e.full || !this.view ? e : {
			...this.view,
			...e
		}, this.receivedAt = Date.now();
	}
	select(e) {
		this.selected = this.selected === e ? "" : e;
	}
	async start() {
		this.starting = !0;
		try {
			await F.setSettings(this.hass, { live: !0 });
		} catch {} finally {
			this.starting = !1;
		}
	}
	play(e) {
		if (this.playing === e) {
			this.stopAudio();
			return;
		}
		this.stopAudio();
		let t = new Audio(e);
		this.audio = t;
		let n = () => {
			this.audio === t && this.stopAudio();
		};
		t.addEventListener("ended", n), t.addEventListener("error", n), t.play().catch(n), this.playing = e;
	}
	stopAudio() {
		let e = this.audio;
		this.audio = void 0, this.playing = "", e && (e.pause(), e.removeAttribute("src"), e.load());
	}
	render() {
		let e = L(this.hass), t = this.view;
		if (!t) return this.failed ? Y(e, () => {
			window.clearTimeout(this.retry), this.retry = void 0, this.subscribe();
		}) : T`<div class="card loading">${e("common.loading")}</div>`;
		if (Jt.has(t.state)) return this.renderBoard(e, t);
		switch (t.state) {
			case "hidden": return T`<div class="card state">${z(R.eyeOff, 56)}<h2>${e("live.hidden")}</h2>
          <div>${e("live.hiddenHelp", {
				meeting: t.header?.meeting ?? "",
				session: t.header?.session ?? ""
			})}</div>
          <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-spoiler-off", {
				bubbles: !0,
				composed: !0
			}))}>${e("live.showAll")}</button></div>`;
			case "syncing": return T`<div class="card state">${z(R.clock, 56)}<h2>${e("live.syncing")}</h2>
          <div>${e("live.syncingHelp", { n: t.delay })}</div></div>`;
			case "connecting": return T`<div class="card state">${z(R.timer, 56)}<h2>${e("live.connecting")}</h2></div>`;
			case "paused": return this.renderPaused(e, t);
			default: return this.renderIdle(e, t);
		}
	}
	nextBlock(e, t) {
		return t ? T`<div>${e("live.next", {
			meeting: t.meeting,
			session: e(`sessions.${t.kind}`)
		})}</div>
      ${t.start ? T`<div class="big num"><plb-countdown .to=${t.start}></plb-countdown></div>
            <div>${e("live.startsIn")} · ${nt(this.hass, t.start, t.date, t.timezone)}
              ${ht(e, this.hass, t.start, t.timezone)}</div>` : O}` : T`<div>${e("live.noNext")}</div>`;
	}
	playButton(e) {
		return T`<button class="btn play-live" ?disabled=${this.starting} @click=${() => this.start()}>
      ${z(R.play, 18)}${e("settings.start")}</button>`;
	}
	renderPaused(e, t) {
		return T`<div class="card state">${z(R.pause, 56)}<h2>${e("live.paused")}</h2>
      <div>${e("settings.pausedHelp")}</div>
      ${this.playButton(e)}
      ${t.auto_start ? T`<div class="muted">${e("live.autoStart")}</div>` : O}
      <div class="next">${this.nextBlock(e, t.next_session)}</div>
    </div>`;
	}
	renderIdle(e, t) {
		return T`<div class="card state">${z(R.timer, 56)}<h2>${e("live.idle")}</h2>
      ${this.nextBlock(e, t.next_session)}
    </div>`;
	}
	stripEnd(e, t) {
		if (t.state !== "final") return T`<span class="age">${jt(this.hass, t.data_age ?? 0, this.receivedAt, t.state === "live")}</span>`;
		let n = t.next_session;
		return n ? T`<div class="next-slot">
      <small>${e("live.nextShort")}</small>
      <b>${n.meeting} · ${e(`sessions.${n.kind}`)}</b>
      ${n.start ? T`<span class="num"><plb-countdown .to=${n.start}></plb-countdown></span>` : O}
    </div>` : O;
	}
	renderBoard(e, t) {
		let n = t.header, r = t.state === "final", i = t.state === "stale" ? T`<div class="banner">${z(R.alert)}${e("live.stale", { n: Math.round(t.data_age ?? 0) })}</div>` : t.state === "lost" ? T`<div class="banner lost">${z(R.alert)}${e("live.lost")}</div>` : O, a = n?.kind === "qualifying" || n?.kind === "sprint_qualifying", o = t.state === "live" || t.state === "stale";
		return T`${i}
      <div class="card strip">
        <div><h1>${n?.meeting ?? ""}</h1><div class="sub">${n?.session ?? ""}${n?.circuit ? ` · ${n.circuit}` : ""}</div></div>
        ${a && n?.part ? T`<div class="laps num">Q${n.part}${!r && n.remaining !== null ? T`<small> · ${lt(n.remaining)} ${e("live.remaining")}</small>` : O}</div>` : n?.lap ? T`<div class="laps num">${e("common.lap")} ${n.lap}${n.total_laps ? T`<small> / ${n.total_laps}</small>` : O}</div>` : !r && n?.remaining !== null && n?.remaining !== void 0 ? T`<div class="laps num">${lt(n.remaining)} <small>${e("live.remaining")}</small></div>` : O}
        ${r ? T`<span class="final-pill">${e("live.final")}</span>
              <span class="sub">${e("live.ended", { time: st(this.hass, t.ended) })}</span>` : O}
        ${r && t.paused ? T`<span class="paused-pill">${e("live.pausedShort")}</span>${this.playButton(e)}` : O}
        <span class="spacer"></span>
        ${this.stripEnd(e, t)}
      </div>
      ${Wt(e, t.stewards, n?.track_status, this.stewardsOpen, () => this.stewardsOpen = !this.stewardsOpen)}
      <div class="grid ${t.state === "lost" ? "dim" : ""}">
        <div class="col">
          <div class="card scroll">${this.renderTower(e, t.tower ?? [], a)}</div>
          <div class="pair">${this.renderWeather(e, t)}${this.renderPits(e, t)}</div>
        </div>
        <div class="col">
          ${r ? O : this.renderMap(e, t, o)}${this.renderRaceControl(e, t.race_control ?? [])}${this.renderRadio(e, t)}
        </div>
      </div>`;
	}
	timed(e, t = "") {
		return e ? T`<span class="t ${e.overall_best ? "ob" : e.personal_best ? "pb" : e.previous ? "prev" : ""} ${t}">${e.time}</span>` : T`<span class="t prev ${t}">—</span>`;
	}
	badge(e, t) {
		return t.status === "retired" ? T`<span class="badge ret">${e("live.ret")}</span>` : t.status === "stopped" ? T`<span class="badge ret">${e("live.stop")}</span>` : t.in_pit ? T`<span class="badge pit">${e("live.pit")}</span>` : t.pit_out ? T`<span class="badge out">${e("live.out")}</span>` : O;
	}
	renderTower(e, t, n) {
		let r = this.view?.header?.part ?? 1, i = n ? t.findIndex((e) => e.qualifying?.cutoff) : -1;
		return T`<table class="tower">
      <thead><tr>
        <th class="pos">${e("common.pos")}</th><th>${e("common.driver")}</th>
        ${n ? T`${[
			1,
			2,
			3
		].map((e) => T`<th class=${e === r ? "" : "col-s"}>Q${e}</th>`)}<th>${e("live.gap")}</th>` : T`<th></th><th>${e("live.gap")}</th><th class="col-int">${e("live.int")}</th><th>${e("live.last")}</th><th class="col-best">${e("live.best")}</th>`}
        <th class="col-s">S1</th><th class="col-s">S2</th><th class="col-s">S3</th>
        <th>${e("live.tyre")}</th>${n ? O : T`<th class="col-pits">${e("live.pits")}</th>`}
      </tr></thead>
      ${Q(t, (e) => e.number, (t, a) => T`<tbody>${this.row(e, t, a, n, r, a === i - 1)}</tbody>`)}
    </table>`;
	}
	row(e, t, n, r, i, a) {
		let o = t.status === "retired" || t.status === "knocked_out", s = t.number === this.selected, c = [
			s ? "sel" : "",
			o ? "out" : "",
			a ? "zone" : "",
			n % 2 ? "" : "alt"
		].join(" "), l = t.qualifying, u = () => this.select(t.number);
		return T`<tr class=${c} tabindex="0" aria-selected=${s ? "true" : "false"}
        @click=${u} @keydown=${ft(u)}>
      <td class="pos num">${t.position ?? "—"}</td>
      <td><div class="drv"><span class="bar" style="background:${t.colour ?? "var(--divider-color)"}"></span>
        ${this.settings?.favourites?.includes(t.tla) ? T`<span class="fav" title=${e("drivers.followed")}>★</span>` : O}
        <span class="tla" title=${t.name ?? ""}>${t.tla}</span><small>${t.number}</small>
        ${t.penalty ? T`<span class="badge pen" title=${e("stewards.unserved")}>+${t.penalty}s</span>` : O}
        ${this.badge(e, t)}
        ${t.status === "knocked_out" ? T`<span class="badge ko">${e("live.ko")}</span>` : O}</div></td>
      ${r && l ? T`${[
			0,
			1,
			2
		].map((e) => T`<td class="t ${e + 1 === i ? "" : "col-s muted"}">${l.part_bests[e] ?? ""}</td>`)}<td class="t">${l.gap ?? ""}</td>` : T`<td>${mt(t.gained)}</td><td class="t">${t.gap ?? ""}</td><td class="t col-int">${t.interval ?? ""}</td>
            <td>${this.timed(t.last_lap)}</td>
            <td class="col-best">${t.best_lap ? T`<span class="t">${t.best_lap.time}</span>` : ""}</td>`}
      ${t.sectors.map((e, n) => T`<td class="col-s">${this.timed(e, "sector")}${gt(t.segments?.[n])}</td>`)}
      <td>${t.tyre ? pt(e, t.tyre.compound, t.tyre.new, t.tyre.age) : ""}</td>
      ${r ? O : T`<td class="num col-pits">${t.pit_stops}</td>`}
    </tr>
    ${s ? this.details(e, t, r ? 10 : 12) : O}`;
	}
	details(e, t, n) {
		let r = t.sectors.map((e, t) => T`<span>S${t + 1} ${this.timed(e)}</span>`), i = t.stints ?? [], a = t.pit_rejoin;
		return T`<tr class="details"><td colspan=${n}>
      <div><b>${t.name ?? t.tla}</b>${t.team ? T` · ${t.team}` : O}</div>
      <div class="facts narrow">
        ${t.interval ? T`<span>${e("live.int")} <span class="t">${t.interval}</span></span>` : O}
        ${t.best_lap ? T`<span>${e("live.best")} <span class="t">${t.best_lap.time}</span></span>` : O}
        ${r}
        <span>${e("live.pits")} ${t.pit_stops}</span>
      </div>
      ${i.length ? T`<table class="stints">
            <tr><th>${e("drivers.stint")}</th><th>${e("live.tyre")}</th><th>${e("drivers.laps")}</th><th>${e("drivers.bestInStint")}</th></tr>
            ${i.map((t, n) => T`<tr>
                <td class="num">${n + 1}</td>
                <td>${pt(e, t.compound, t.new, null)}</td>
                <td class="num">${t.to_lap && t.to_lap !== t.from_lap ? e("drivers.lapRange", {
			from: t.from_lap,
			to: t.to_lap
		}) : e("drivers.fromLap", { from: t.from_lap })}
                  <small class="muted">(${t.laps})</small></td>
                <td>${t.best ? T`<span class="t">${t.best.time}</span>${t.best.lap ? T` <small class="muted">${e("drivers.onLap", { lap: t.best.lap })}</small>` : O}` : "—"}</td>
              </tr>`)}
          </table>` : O}
      ${a ? T`<div class="rejoin">${z(R.timer, 16)}
            <span>${e("drivers.rejoin", { position: a.position })}${a.ahead ? T` · ${e("drivers.behindOf", {
			driver: a.ahead,
			gap: q(this.hass, a.ahead_gap, 1)
		})}` : O}${a.behind ? T` · ${e("drivers.aheadOf", {
			driver: a.behind,
			gap: q(this.hass, a.behind_gap, 1)
		})}` : O}
              <small class="muted">${e(a.known ? "drivers.lossCircuit" : "drivers.lossGeneric", { loss: q(this.hass, a.loss, 1) })}${a.pitting ? ` ${e("drivers.pitting", { n: a.pitting })}` : ""}</small></span>
          </div>` : O}
    </td></tr>`;
	}
	driver(e) {
		return this.view?.tower?.find((t) => t.number === e);
	}
	renderMap(e, t, n) {
		let r = T`<div class="card-head">${e("live.map")}</div>`;
		if (!t.map_available || !n) {
			let n = this.settings?.is_admin, i = t.map_reason ?? "not_configured", a = e(i === "no_data" ? "live.mapNoData" : n ? i === "token_problem" ? "live.mapToken" : "live.mapLocked" : "live.mapNotEnabled");
			return T`<div class="card">${r}<div class="locked">${z(R.lock, 36)}<div>${a}</div></div></div>`;
		}
		return T`<div class="card">${r}
      <plb-live-map .hass=${this.hass} .tower=${t.tower ?? []} .selected=${this.selected}
        @plb-select=${(e) => this.select(e.detail)}></plb-live-map></div>`;
	}
	renderRaceControl(e, t) {
		let n = qt[this.filter], r = t.filter((e) => !n || e.kind === n);
		return T`<div class="card">
      <div class="card-head">${e("live.raceControl")}</div>
      <div class="filters">${Object.keys(qt).map((t) => T`<button class="chip small ${this.filter === t ? "on" : ""}" @click=${() => this.filter = t}>${e(`live.${t}`)}</button>`)}</div>
      <div class="feed">${Q(r, (e) => `${e.utc}|${e.message}`, (t) => T`<div class="msg ${t.kind}"><span class="lap num">${t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
          <span>${t.message}<time>${K(this.hass, t.utc)}</time></span></div>`)}</div>
    </div>`;
	}
	renderRadio(e, t) {
		let n = t.radio ?? [];
		return T`<div class="card">
      <div class="card-head">${e("live.radio")}</div>
      ${n.length ? T`<div class="feed short">${Q(n, (e) => e.url, (t) => {
			let n = this.driver(t.number), r = this.playing === t.url;
			return T`<div class="radio ${t.number === this.selected ? "sel" : ""}">
                <button class="play" @click=${() => this.play(t.url)}
                  aria-label=${e(r ? "live.pause" : "live.play", {
				driver: n?.tla ?? t.number ?? "",
				time: K(this.hass, t.utc)
			})}>${z(r ? R.pause : R.play, 18)}</button>
                <span class="bar" style="background:${n?.colour ?? "var(--divider-color)"}"></span><b>${n?.tla ?? t.number}</b>
                <time>${K(this.hass, t.utc)}</time></div>`;
		})}</div>` : T`<div class="empty">${e("live.noRadio")}</div>`}
    </div>`;
	}
	renderWeather(e, t) {
		let n = t.weather;
		if (!n) return O;
		let r = n.wind_direction === null ? "" : T`<span class="wind" style="transform:rotate(${n.wind_direction + 180}deg)">↑</span>`;
		return T`<div class="card">
      <div class="card-head">${e("live.weather")}</div>
      <div class="weather">
        <div><small>${e("live.air")}</small><b class="num">${q(this.hass, n.air)}°</b></div>
        <div><small>${e("live.track")}</small><b class="num">${q(this.hass, n.track)}°</b></div>
        <div><small>${e("live.rain")}</small><b>${n.rain ? e("live.wet") : e("live.dry")}</b></div>
        <div><small>${e("live.humidity")}</small><b class="num">${q(this.hass, n.humidity, 0)}%</b></div>
        <div><small>${e("live.wind")}</small><b class="num">${e("live.windSpeed", { n: q(this.hass, n.wind_speed) })} ${r}</b></div>
        <div><small>${e("live.pressure")}</small><b class="num">${q(this.hass, n.pressure, 0)}</b></div>
      </div>
    </div>`;
	}
	renderPits(e, t) {
		let n = t.pits ?? [];
		return T`<div class="card">
      <div class="card-head">${e("live.pitStops")}<span class="spacer"></span><small>${e("live.pitLane")}</small></div>
      ${n.length ? T`<div class="feed short pits">${Q(n, (e) => `${e.number}|${e.lap}`, (t) => {
			let n = this.driver(t.number);
			return T`<div><span class="bar" style="background:${n?.colour ?? "var(--divider-color)"}"></span><b>${n?.tla ?? t.number}</b>
                <span>${e("common.lap")} ${t.lap}</span><span class="num end">${e("delay.seconds", { n: t.duration })}</span></div>`;
		})}</div>` : T`<div class="empty">${e("live.noPits")}</div>`}
    </div>`;
	}
	static {
		this.styles = [
			B,
			Kt,
			Gt,
			o`
      :host { display: block; }
      .strip { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 14px 18px; margin-bottom: var(--plb-gap); }
      .strip h1 { margin: 0; font-size: 20px; font-weight: 500; }
      .sub { color: var(--secondary-text-color); font-size: 13px; }
      .laps { font-size: 26px; font-weight: 600; }
      .laps small { font-size: 14px; color: var(--secondary-text-color); font-weight: 400; }
      .age { color: var(--secondary-text-color); font-size: 12px; }
      .next-slot { display: grid; gap: 2px; text-align: right; font-size: 13px; }
      .next-slot small { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
      .next-slot .num { font-size: 18px; font-weight: 500; }
      .final-pill, .paused-pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 8px;
        font-weight: 600; font-size: 12px; letter-spacing: 0.06em; background: var(--secondary-background-color); color: var(--primary-text-color); }
      .final-pill::before { content: ""; width: 12px; height: 12px; border-radius: 2px;
        background: repeating-conic-gradient(#222 0 25%, #fff 0 50%) 0 0 / 6px 6px; box-shadow: 0 0 0 1px var(--divider-color); }
      .paused-pill { background: none; border: 1px dashed var(--divider-color); color: var(--secondary-text-color); }
      .play-live { display: inline-flex; align-items: center; gap: 6px; }
      .state .play-live svg { width: 18px; height: 18px; opacity: 1; }
      .state .next { display: grid; gap: 8px; justify-items: center; margin-top: 12px; }
      .banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: var(--plb-gap); border-radius: 10px; font-size: 14px;
        background: color-mix(in srgb, var(--warning-color, #ffa600) 16%, transparent); }
      .banner.lost { background: color-mix(in srgb, var(--error-color, #db4437) 16%, transparent); }
      .dim { opacity: 0.45; filter: grayscale(0.6); }
      .grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: var(--plb-gap); align-items: start; }
      .col { display: grid; gap: var(--plb-gap); align-content: start; min-width: 0; }
      .pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--plb-gap); align-items: start; }
      .tower { width: 100%; border-collapse: collapse; font-size: 14px; }
      .tower th { text-align: left; font-weight: 500; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--secondary-text-color); padding: 8px 6px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; }
      .tower td { padding: 0 6px; height: 40px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; cursor: pointer; }
      .tower tr.alt td { background: var(--plb-row-alt); }
      .tower tr.sel td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .tower tr.out td { color: var(--plb-muted); }
      .tower tr.zone td { border-bottom: 2px dashed var(--error-color, #db4437); }
      .tower tr:focus-visible td { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .tower tr.details td { height: auto; padding: 8px 12px; white-space: normal; cursor: default; font-size: 13px;
        background: color-mix(in srgb, var(--primary-color) 6%, transparent); }
      .tower tr.details .facts { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 4px; color: var(--secondary-text-color); }
      .tower tr.details .narrow { display: none; }
      @media (max-width: 900px) { .tower tr.details .narrow { display: flex; } }
      .tower .stints { border-collapse: collapse; margin-top: 8px; font-size: 13px; }
      .tower .stints th { font-size: 10px; padding: 2px 16px 2px 0; border: 0; }
      .tower .stints td { height: 30px; padding: 0 16px 0 0; border: 0; background: none; cursor: default; }
      .tower .rejoin { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 13px; }
      .tower .rejoin small { display: block; font-size: 11px; }
      .fav { color: #f2c200; font-size: 12px; }
      .seg { display: flex; gap: 1px; margin-top: 2px; }
      .seg i { flex: 1; height: 3px; min-width: 3px; border-radius: 1px; background: var(--divider-color); }
      .seg i.p { background: var(--plb-purple); }
      .seg i.g { background: var(--plb-green); }
      .seg i.y { background: var(--plb-yellow); }
      .seg i.pit { background: #1e88e5; }
      .seg i.o { background: var(--secondary-text-color); }
      .badge.pen { background: var(--error-color, #db4437); color: #fff; font-variant-numeric: tabular-nums; }
      .pos { width: 34px; text-align: center; font-weight: 600; font-size: 15px; }
      .tower .drv { min-width: 100px; }
      .tower .drv small { color: var(--secondary-text-color); font-size: 11px; }
      .sector { display: inline-block; min-width: 46px; }
      .locked { padding: 20px 16px; color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; display: grid; gap: 10px; justify-items: start; }
      .locked svg { opacity: 0.6; }
      .filters { display: flex; gap: 6px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color); flex-wrap: wrap; }
      .feed { max-height: 340px; overflow: auto; }
      .feed.short { max-height: 260px; }
      .msg { display: grid; grid-template-columns: 56px 1fr; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .msg .lap { color: var(--secondary-text-color); font-size: 12px; }
      .msg.flag { box-shadow: inset 3px 0 var(--plb-yellow); }
      .msg.penalty { box-shadow: inset 3px 0 var(--error-color, #db4437); }
      .msg time { display: block; color: var(--secondary-text-color); font-size: 11px; margin-top: 2px; }
      .radio { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .radio.sel { background: color-mix(in srgb, var(--primary-color) 10%, transparent); }
      .play { width: 32px; height: 32px; border-radius: 50%; border: 0; background: var(--primary-color); color: #fff; cursor: pointer; display: grid; place-items: center; flex: none; }
      .radio time { margin-left: auto; color: var(--secondary-text-color); font-size: 12px; }
      .weather { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 12px 16px; }
      .weather div { display: grid; gap: 2px; }
      .weather small { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      .weather b { font-size: 18px; font-weight: 500; }
      .wind { display: inline-block; }
      .pits div { display: flex; align-items: center; gap: 10px; padding: 7px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .pits .end { margin-left: auto; }
      .empty { padding: 14px 16px; color: var(--secondary-text-color); font-size: 13px; }
      @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
      @media (max-width: 900px) { .col-s { display: none; } }
      @media (max-width: 640px) {
        .col-best, .col-int, .col-pits, .tower .drv small { display: none; }
        .tower td, .tower th { padding: 0 4px; }
        .tower td { height: 44px; }
        .pos { width: 26px; }
        .pair { grid-template-columns: 1fr; }
        .strip { padding: 12px 14px; }
        .next-slot { width: 100%; text-align: left; }
      }
    `
		];
	}
}, Xt = class extends N {
	constructor(...e) {
		super(...e), this.tower = [], this.selected = "", this.cars = [], this.path = "", this.subscribing = !1, this.onScreen = !1, this.visibility = () => this.sync();
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: ut
			},
			tower: { attribute: !1 },
			selected: { type: String },
			outline: { state: !0 },
			cars: { state: !0 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.observer = new IntersectionObserver((e) => {
			this.onScreen = e.some((e) => e.isIntersecting), this.sync();
		}), this.observer.observe(this), document.addEventListener("visibilitychange", this.visibility);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.observer?.disconnect(), document.removeEventListener("visibilitychange", this.visibility), this.stop();
	}
	stop() {
		this.unsubscribe?.(), this.unsubscribe = void 0;
	}
	sync() {
		let e = this.isConnected && this.onScreen && document.visibilityState === "visible";
		e && !this.unsubscribe && !this.subscribing && this.hass ? this.subscribe() : e || this.stop();
	}
	async subscribe() {
		this.subscribing = !0;
		try {
			let e = await F.subscribeMap(this.hass, (e) => this.receive(e));
			this.unsubscribe = e;
		} catch {} finally {
			this.subscribing = !1;
		}
		this.sync();
	}
	receive(e) {
		if (e.full) {
			let t = e.outline ?? null;
			t !== this.outline && (this.path = t ? t.points.map((e, t) => `${t ? "L" : "M"}${e[0]} ${e[1]}`).join(" ") + (t.points.length ? "Z" : "") : ""), this.outline = t;
		}
		this.cars = e.cars;
	}
	select(e) {
		this.dispatchEvent(new CustomEvent("plb-select", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	driver(e) {
		return this.tower.find((t) => t.number === e);
	}
	render() {
		let e = L(this.hass), t = this.outline;
		if (!t) return T`<div class="locked">${e("live.mapDrawing")}</div>`;
		let n = [...this.cars.filter((e) => e.number !== this.selected), ...this.cars.filter((e) => e.number === this.selected)];
		return T`<svg viewBox="0 0 ${t.width} ${t.height}" role="img" aria-label=${e("live.map")}>
      ${this.path ? E`<path class="track" d=${this.path}></path><path class="track-line" d=${this.path}></path>` : O}
      ${Q(n, (e) => e.number, (e) => {
			let t = e.number === this.selected, n = this.driver(e.number), r = () => this.select(e.number);
			return E`<g class="car" style="transform:translate(${e.x}px,${e.y}px)" @click=${r}
            @keydown=${ft(r)} tabindex="0" role="button" aria-label=${n?.tla ?? e.number}>
          <circle r=${t ? 17 : 12} fill=${n?.colour ?? "var(--divider-color)"}
            stroke=${t ? "var(--primary-text-color)" : "var(--card-background-color)"} stroke-width="4"
            opacity=${e.on_track ? 1 : .4}></circle>
          <text x="16" y="-12">${n?.tla ?? e.number}</text></g>`;
		})}
    </svg>`;
	}
	static {
		this.styles = o`
    :host { display: block; }
    svg { display: block; width: 100%; height: auto; }
    .track { fill: none; stroke: var(--secondary-background-color); stroke-width: 18; stroke-linejoin: round; }
    .track-line { fill: none; stroke: var(--secondary-text-color); stroke-width: 3; opacity: 0.5; }
    .car { transition: transform 0.25s linear; cursor: pointer; will-change: transform; }
    .car text { font-size: 20px; font-weight: 700; fill: var(--primary-text-color); paint-order: stroke;
      stroke: var(--card-background-color); stroke-width: 5px; }
    .locked { padding: 20px 16px; color: var(--secondary-text-color); font-size: 13px; }
    @media (prefers-reduced-motion: reduce) { .car { transition: none; } }
  `;
	}
}, Zt = /* @__PURE__ */ new Set([
	"strategy",
	"lap_times",
	"race_control",
	"weather"
]), Qt = class extends N {
	constructor(...e) {
		super(...e), this.seasons = [], this.failed = !1, this.tab = "race", this.tabFailed = !1, this.driver = "", this.filter = "all", this.highlight = "", this.request = 0, this.roundsRequest = 0, this.spoilers = "";
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			seasons: { attribute: !1 },
			season: { state: !0 },
			rounds: { state: !0 },
			failed: { state: !0 },
			selected: { state: !0 },
			tab: { state: !0 },
			result: { state: !0 },
			tabFailed: { state: !0 },
			driver: { state: !0 },
			filter: { state: !0 },
			highlight: { state: !0 },
			target: { attribute: !1 }
		};
	}
	willUpdate(e) {
		e.has("target") && this.target?.page === "results" && this.target.season && (this.selected = void 0, this.rounds = void 0, this.season = this.target.season, this.wanted = this.target.round), this.season === void 0 && this.settings && (this.season = this.settings.season);
		let t = dt(this.settings), n = t !== this.spoilers;
		this.spoilers = t, (e.has("season") || n) && this.loadRounds(), this.selected && (n || e.has("tab") || e.has("selected")) && this.loadTab();
	}
	async loadRounds() {
		if (!this.hass || this.season === void 0) return;
		let e = ++this.roundsRequest;
		this.failed = !1;
		try {
			let t = await F.rounds(this.hass, this.season);
			if (e !== this.roundsRequest) return;
			this.rounds = t.rounds;
			let n = this.wanted === void 0 ? void 0 : t.rounds.find((e) => e.round === this.wanted);
			this.wanted = void 0, n && this.open(n);
		} catch {
			e === this.roundsRequest && (this.failed = !0);
		}
	}
	async loadTab() {
		if (!this.selected || this.season === void 0) return;
		let e = ++this.request;
		this.tabFailed = !1, this.result?.tab !== this.tab && (this.result = void 0);
		try {
			let t = await F.detail(this.hass, this.season, this.selected.round, this.tab);
			e === this.request && (this.result = t);
		} catch {
			e === this.request && (this.tabFailed = !0);
		}
	}
	get gridLabel() {
		return L(this.hass)("results.gridShort");
	}
	tyreName(e) {
		return L(this.hass)(`tyres.${e}`);
	}
	open(e) {
		this.tab = "race", this.result = void 0, this.driver = "", this.selected = e;
	}
	render() {
		let e = L(this.hass);
		if (this.selected) return this.renderDetail(e, this.selected);
		let t = this.seasons.length ? this.seasons : [this.season ?? 0];
		return T`
      <div class="toolbar">
        <h1>${e("results.title")}</h1>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.rounds = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => T`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
      </div>
      ${this.failed ? Y(e, () => this.loadRounds()) : this.rounds ? this.rounds.length ? T`<div class="card"><div class="scroll"><table class="tbl">
                <tr><th>${e("common.round")}</th><th>${e("results.grandPrix")}</th><th>${e("results.date")}</th><th>${e("results.winner")}</th></tr>
                ${[...this.rounds].reverse().map((t) => T`<tr class="click" tabindex="0" @click=${() => this.open(t)} @keydown=${ft(() => this.open(t))}>
                    <td class="num">${t.round}</td>
                    <td>${t.name}${t.sprint ? T` <span class="pill sprint">${e("common.sprint")}</span>` : O}</td>
                    <td class="num">${it(this.hass, t.date)}</td>
                    <td>${t.hidden ? T`<span class="hidden-cell">${e("spoiler.hiddenRound")}</span>` : t.winner ? J(t.winner.name, t.winner.team_id) : "—"}</td>
                  </tr>`)}
              </table></div></div>` : T`<div class="card state">${e("results.empty")}</div>` : _t(e)}
    `;
	}
	renderDetail(e, t) {
		return T`
      <div class="toolbar">
        <button class="link back" @click=${() => this.selected = void 0}>${z(R.back, 18)} ${e("common.back")}</button>
        <h1>${t.name} ${this.season}</h1>
      </div>
      <div class="card">
        <div class="subtabs">
          ${t.tabs.map((t) => T`<button class="tab ${this.tab === t ? "active" : ""}" @click=${() => this.tab = t}>${e(`results.tabs.${t}`)}</button>`)}
        </div>
        ${this.renderTab(e)}
      </div>
    `;
	}
	renderTab(e) {
		if (this.tabFailed) return Y(e, () => this.loadTab());
		let t = this.result;
		if (!t || t.tab !== this.tab) return T`<div class="loading">${e("common.loading")}${Zt.has(this.tab) ? T`<br /><small>${e("results.archive")}</small>` : O}</div>`;
		if (t.hidden) return T`<div class="state">${z(R.eyeOff, 56)}<div>${e("spoiler.revealNote")}</div>
        <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-reveal", {
			detail: t.session,
			bubbles: !0,
			composed: !0
		}))}>${e("spoiler.reveal")}</button></div>`;
		if (!t.available || !t.data) return T`<div class="state">${Zt.has(this.tab) ? e("results.notArchived") : e("common.noData")}</div>`;
		let n = t.data;
		switch (this.tab) {
			case "race":
			case "sprint": return this.classification(e, n.rows, this.tab === "race");
			case "qualifying": return this.qualifying(e, n.rows);
			case "lap_chart": return this.lapChart(n);
			case "strategy": return this.strategy(n);
			case "lap_times": return this.lapTimes(e, n);
			case "pit_stops": return this.pitStops(e, n);
			case "race_control": return this.raceControl(e, n.messages);
			default: return this.weather(e, n.weather);
		}
	}
	classification(e, t, n) {
		return T`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.pos")}</th><th>${e("common.driver")}</th><th></th><th class="wide">${e("common.team")}</th>
        <th class="r phone-hide">${e("results.grid")}</th><th class="r phone-hide">${e("common.laps")}</th><th>${e("results.time")}</th>
        <th class="r">${e("common.points")}</th>${n ? T`<th class="wide">${e("results.fastest")}</th>` : O}</tr>
      ${t.map((e) => T`<tr>
          <td class="num">${e.position_text && !/^\d+$/.test(e.position_text) ? e.position_text : e.position}</td>
          <td>${J(e.name, e.team_id)}</td>
          <td>${mt(e.gained)}</td>
          <td class="wide muted">${e.team ?? ""}</td>
          <td class="r num phone-hide">${e.grid ?? "—"}</td>
          <td class="r num phone-hide">${e.laps ?? ""}</td>
          <td class="num">${e.time ?? e.status ?? ""}</td>
          <td class="r num">${e.points ? q(this.hass, e.points) : ""}</td>
          ${n ? T`<td class="wide t ${e.fastest_lap?.rank === 1 ? "ob" : ""}">${e.fastest_lap?.time ?? ""}</td>` : O}
        </tr>`)}
    </table></div>`;
	}
	qualifying(e, t) {
		let n = (e) => t.map((t) => t[e]).filter(Boolean).sort()[0], r = {
			q1: n("q1"),
			q2: n("q2"),
			q3: n("q3")
		};
		return T`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.pos")}</th><th>${e("common.driver")}</th><th class="wide">${e("common.team")}</th><th>Q1</th><th>Q2</th><th>Q3</th></tr>
      ${t.map((e) => T`<tr>
          <td class="num">${e.position}</td><td>${J(e.name, e.team_id)}</td><td class="wide muted">${e.team ?? ""}</td>
          ${[
			"q1",
			"q2",
			"q3"
		].map((t) => T`<td class="t ${e[t] && e[t] === r[t] ? "ob" : ""}">${e[t] ?? ""}</td>`)}
        </tr>`)}
    </table></div>`;
	}
	lapChart(e) {
		let t = Math.max(...e.drivers.map((e) => Math.max(0, ...e.positions.filter((e) => e !== null))), 1), n = 24 + t * 22, r = Math.max(e.laps, 1), i = (e) => 36 + e / r * 850, a = (e) => 14 + (e - 1) * 22, o = e.drivers.map((e) => {
			let t = "", n = !1;
			e.positions.forEach((e, r) => {
				if (e === null) {
					n = !1;
					return;
				}
				t += `${n ? "L" : "M"}${i(r).toFixed(1)} ${a(e).toFixed(1)}`, n = !0;
			});
			let r = e.positions.map((e) => e !== null).lastIndexOf(!0), o = r >= 0 ? e.positions[r] : null, s = !this.highlight || this.highlight === e.driver_id, c = Ge(e.team_id), l = () => this.highlight = this.highlight === e.driver_id ? "" : e.driver_id ?? "";
			return E`<g class="line" @click=${l} @keydown=${ft(l)} tabindex="0" role="button"
          aria-label=${e.name ?? e.code ?? ""} aria-pressed=${this.highlight === e.driver_id ? "true" : "false"}
          style="opacity:${s ? 1 : .15}">
        <path d=${t} fill="none" stroke=${c} stroke-width=${this.highlight === e.driver_id ? 4 : 2}></path>
        ${o === null ? O : E`<text x=${i(r) + 6} y=${a(o) + 4} style="fill:var(--primary-text-color);font-weight:600">${e.code ?? e.name?.slice(0, 3).toUpperCase()}</text>`}
      </g>`;
		}), s = Array.from({ length: t }, (e, t) => E`<line class="axis" x1="36" x2=${886} y1=${a(t + 1)} y2=${a(t + 1)}></line><text x="8" y=${a(t + 1) + 4}>${t + 1}</text>`), c = Array.from({ length: Math.floor(r / 10) + 1 }, (e, t) => t * 10).map((e) => E`<text x=${i(e)} y=${n} text-anchor="middle">${e || this.gridLabel}</text>`);
		return T`<div class="chart"><svg viewBox="0 0 ${960} ${n + 6}">${s}${o}${c}</svg></div>`;
	}
	strategy(e) {
		let t = Math.max(e.laps, 1), n = (e) => 60 + e / t * 880, r = 10 + e.drivers.length * 26 + 24;
		return T`<div class="chart"><svg viewBox="0 0 ${960} ${r}">${e.drivers.map((e, t) => E`
      <text x="8" y=${10 + t * 26 + 13} style="font-weight:600;fill:var(--primary-text-color)">${e.tla}</text>
      ${e.stints.map((e) => E`<rect x=${n(e.start_lap - 1) + 1} y=${10 + t * 26} width=${Math.max(2, n(e.end_lap) - n(e.start_lap - 1) - 2)}
        height=${18} rx="4" style="fill:var(${`--plb-${e.compound}`}, var(--plb-unknown));stroke:var(--divider-color)"
        opacity=${e.new ? 1 : .75}><title>${this.tyreName(e.compound)} ${e.start_lap}–${e.end_lap}</title></rect>`)}`)}${[
			1,
			...Array.from({ length: Math.floor(t / 10) }, (e, t) => (t + 1) * 10),
			t
		].filter((e, t, n) => n.indexOf(e) === t).map((e) => E`<text x=${n(e)} y=${r - 4} text-anchor="middle">${e}</text>`)}</svg></div>`;
	}
	lapTimes(e, t) {
		if (!t.drivers.length) return T`<div class="state">${e("common.noData")}</div>`;
		let n = t.drivers.find((e) => e.number === this.driver) ?? t.drivers[0], r = (e) => e === "overall" ? "ob" : e === "personal" ? "pb" : "";
		return T`
      <div class="pick">
        <label>${e("results.chooseDriver")}
          <select @change=${(e) => this.driver = e.target.value}>
            ${t.drivers.map((e) => T`<option .selected=${e === n} value=${e.number}>${e.tla} — ${e.name}</option>`)}
          </select>
        </label>
      </div>
      <div class="scroll"><table class="tbl">
        <tr><th>${e("common.lap")}</th><th>${e("live.last")}</th><th>S1</th><th>S2</th><th>S3</th><th>${e("results.tyre")}</th><th>${e("results.pit")}</th></tr>
        ${n.laps.map((t) => T`<tr>
            <td class="num">${t.lap}</td>
            <td class="t ${r(t.best)}">${t.time ?? "—"}</td>
            ${[
			0,
			1,
			2
		].map((e) => T`<td class="t ${r(t.sector_bests?.[e])}">${t.sectors[e] ?? "—"}</td>`)}
            <td>${t.compound ? pt(e, t.compound, null, t.tyre_age) : ""}</td>
            <td>${t.pit_in ? T`<span class="badge pit">${e("results.pitIn")}</span>` : O}${t.pit_out ? T`<span class="badge out">${e("results.pitOut")}</span>` : O}</td>
          </tr>`)}
      </table></div>`;
	}
	pitStops(e, t) {
		return t.stops.length ? T`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.driver")}</th><th class="r">${e("common.lap")}</th><th class="r">${e("results.stop")}</th><th class="r">${e("results.duration")}</th></tr>
      ${t.stops.map((e) => T`<tr><td>${J(e.name, e.team_id)}</td><td class="r num">${e.lap}</td><td class="r num">${e.stop}</td><td class="r num">${e.duration ?? ""}</td></tr>`)}
    </table></div>` : T`<div class="state">${e("common.noData")}</div>`;
	}
	raceControl(e, t) {
		let n = [
			"all",
			"flags",
			"penalties",
			"other"
		], r = {
			all: null,
			flags: "flag",
			penalties: "penalty",
			other: "other"
		}[this.filter] ?? null, i = t.filter((e) => !r || e.kind === r);
		return T`<div class="filters">${n.map((t) => T`<button class="chip small ${this.filter === t ? "on" : ""}" @click=${() => this.filter = t}>${e(`live.${t}`)}</button>`)}</div>
      <div class="feed">${i.map((t) => T`<div class="msg ${t.kind}"><span class="lap num">${t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
          <span>${t.message}<time>${K(this.hass, t.utc)}</time></span></div>`)}</div>`;
	}
	weather(e, t) {
		if (!t) return T`<div class="state">${e("common.noData")}</div>`;
		let n = (e, t) => t ? T`<tr><td>${e}</td>${[
			t.start,
			t.end,
			t.min,
			t.max
		].map((e) => T`<td class="r num">${q(this.hass, e)}°</td>`)}</tr>` : O;
		return T`<div class="scroll"><table class="tbl">
      <tr><th></th><th class="r">${e("results.start")}</th><th class="r">${e("results.end")}</th><th class="r">${e("results.min")}</th><th class="r">${e("results.max")}</th></tr>
      ${n(e("results.air"), t.air)}${n(e("results.track"), t.track)}
      <tr><td>${e("results.rain")}</td><td class="r" colspan="4">${t.rain ? e("results.yes") : e("results.no")}</td></tr>
    </table></div>`;
	}
	static {
		this.styles = [B, o`
      :host { display: block; }
      .back { display: inline-flex; align-items: center; gap: 4px; }
      .subtabs { display: flex; gap: 4px; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); }
      .subtabs .tab { font-size: 13px; padding: 6px 12px; }
      .line { cursor: pointer; }
      .pick { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
      .pick label { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--secondary-text-color); }
      .filters { display: flex; gap: 6px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color); }
      .feed { max-height: 70vh; overflow: auto; }
      .msg { display: grid; grid-template-columns: 56px 1fr; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .msg .lap { color: var(--secondary-text-color); font-size: 12px; }
      .msg.flag { box-shadow: inset 3px 0 var(--plb-yellow); }
      .msg.penalty { box-shadow: inset 3px 0 var(--error-color, #db4437); }
      .msg time { display: block; color: var(--secondary-text-color); font-size: 11px; margin-top: 2px; }
      .badge + .badge { margin-left: 4px; }
      @media (max-width: 900px) { .wide { display: none; } }
      @media (max-width: 640px) { .phone-hide { display: none; } }
    `];
	}
}, $t = /* @__PURE__ */ new Set([
	"token_invalid",
	"token_expired",
	"token_no_subscription",
	"token_missing"
]), en = class extends N {
	constructor(...e) {
		super(...e), this.testResult = "", this.token = "", this.tokenError = "", this.saving = !1, this.confirmRemove = !1, this.busy = !1, this.asked = !1;
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			entities: { state: !0 },
			drivers: { state: !0 },
			testResult: { state: !0 },
			token: { state: !0 },
			tokenError: { state: !0 },
			saving: { state: !0 },
			confirmRemove: { state: !0 },
			busy: { state: !0 }
		};
	}
	willUpdate() {
		this.hass && !this.asked && (this.asked = !0, this.loadEntities(), this.settings?.is_admin && this.loadDrivers());
	}
	async loadDrivers() {
		try {
			let e = await F.standings(this.hass, this.settings.season, null, "drivers");
			e.rows.length || (e = await F.standings(this.hass, this.settings.season - 1, null, "drivers")), this.drivers = e.rows.filter((e) => e.code).map((e) => ({
				code: e.code,
				name: e.name ?? null,
				team_id: e.team_id
			}));
		} catch {
			this.drivers = [];
		}
	}
	async loadEntities() {
		try {
			this.entities = (await F.entities(this.hass)).entities;
		} catch {
			this.entities = [];
		}
	}
	async set(e, t) {
		this.busy = !0;
		try {
			await F.setSettings(this.hass, e);
		} catch {
			t instanceof HTMLInputElement && (t.checked = !t.checked);
		} finally {
			this.busy = !1;
		}
	}
	delay(e) {
		this.dispatchEvent(new CustomEvent("plb-delay", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	async saveToken() {
		let e = this.token.trim();
		if (!e) {
			this.tokenError = "token_missing";
			return;
		}
		this.saving = !0, this.tokenError = "";
		try {
			await F.setToken(this.hass, e), this.token = "";
		} catch (e) {
			let t = e?.message ?? "";
			this.tokenError = $t.has(t) ? t : "token_invalid";
		} finally {
			this.saving = !1;
		}
	}
	async removeToken() {
		this.saving = !0;
		try {
			await F.removeToken(this.hass);
		} catch {
			this.tokenError = "remove_failed";
		} finally {
			this.saving = !1, this.confirmRemove = !1;
		}
	}
	moreInfo(e) {
		this.dispatchEvent(new CustomEvent("hass-more-info", {
			detail: { entityId: e },
			bubbles: !0,
			composed: !0
		}));
	}
	render() {
		let e = L(this.hass), t = this.settings;
		return T`<div class="page">
      ${this.renderLive(e, t)}
      ${this.renderDelay(e, t)}
      ${this.renderClock(e)}
      ${t.is_admin ? this.renderDrivers(e, t) : O}
      ${t.is_admin ? this.renderSummary(e, t) : O}
      ${t.is_admin ? this.renderPanel(e, t) : O}
      ${t.is_admin ? this.renderF1tv(e, t) : O}
      ${this.renderEntities(e)}
    </div>`;
	}
	renderLive(e, t) {
		let n = t.live ? t.running ? e("settings.running") : e("settings.waiting") : e("settings.pausedHelp");
		return T`<section class="card">
      <div class="card-head">${e("settings.live")}</div>
      <div class="live">
        <button class="big-play ${t.live ? "on" : ""}" ?disabled=${this.busy} @click=${() => this.set({ live: !t.live })}
          aria-pressed=${t.live ? "true" : "false"} aria-label=${t.live ? e("settings.pause") : e("settings.start")}>
          ${z(t.live ? R.pause : R.play, 36)}
        </button>
        <div class="what">
          <b>${t.live ? e("settings.on") : e("settings.off")}</b>
          <span>${n}</span>
        </div>
      </div>
      <label class="row">
        <input type="checkbox" .checked=${t.auto_start} ?disabled=${this.busy}
          @change=${(e) => this.set({ auto_start: e.target.checked }, e.target)} />
        <span><b>${e("settings.autoStart")}</b><small>${e("settings.autoStartHelp")}</small></span>
      </label>
    </section>`;
	}
	async setHousehold(e, t) {
		this.busy = !0;
		try {
			await F.setHousehold(this.hass, e), e.favourites && this.loadEntities();
		} catch {
			t instanceof HTMLInputElement && (t.checked = !t.checked);
		} finally {
			this.busy = !1;
		}
	}
	toggle(e, t, n) {
		return n ? [...e.filter((e) => e !== t), t] : e.filter((e) => e !== t);
	}
	renderDrivers(e, t) {
		let n = t.favourites ?? [], r = n.length >= 5, i = this.drivers;
		return T`<section class="card">
      <div class="card-head">${e("drivers.title")}<span class="spacer"></span><small>${e("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${e("drivers.help")}</p>
        ${i ? T`<div class="chips">${i.map((e) => {
			let t = n.includes(e.code);
			return T`<button class="chip ${t ? "on" : ""}" ?disabled=${this.busy || !t && r}
                title=${e.name ?? e.code} aria-pressed=${t ? "true" : "false"}
                @click=${() => this.setHousehold({ favourites: this.toggle(n, e.code, !t) })}>
                ${t ? "★ " : ""}${e.code}</button>`;
		})}</div>` : T`<span class="muted">${e("common.loading")}</span>`}
        <small class="muted">${e("drivers.max")}</small>
      </div>
    </section>`;
	}
	async testSummary() {
		this.testResult = "";
		try {
			let { result: e } = await F.testSummary(this.hass);
			this.testResult = e === "sent" ? "summary.testSent" : e === "hidden" ? "summary.testHidden" : "summary.testNothing";
		} catch {
			this.testResult = "summary.testFailed";
		}
	}
	renderSummary(e, t) {
		let n = Object.keys(this.hass.services?.notify ?? {}).filter((e) => !["send_message"].includes(e)).sort(), r = t.notify_targets ?? [], i = t.summary_kinds ?? [];
		return T`<section class="card">
      <div class="card-head">${e("summary.title")}<span class="spacer"></span><small>${e("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${e("summary.help")}</p>
        <b class="small">${e("summary.where")}</b>
        ${n.length ? n.map((e) => T`<label class="line">
                <input type="checkbox" .checked=${r.includes(e)} ?disabled=${this.busy}
                  @change=${(t) => this.setHousehold({ notify_targets: this.toggle(r, e, t.target.checked) }, t.target)} />
                <span>notify.${e}</span></label>`) : T`<span class="muted">${e("summary.noServices")}</span>`}
        <b class="small">${e("summary.which")}</b>
        <div class="chips">${[
			"race",
			"sprint",
			"qualifying",
			"sprint_qualifying",
			"practice"
		].map((t) => {
			let n = i.includes(t);
			return T`<button class="chip ${n ? "on" : ""}" ?disabled=${this.busy}
            @click=${() => this.setHousehold({ summary_kinds: this.toggle(i, t, !n) })}>${e(`sessions.${t}`)}</button>`;
		})}</div>
        <div class="line">
          <button class="btn flat" ?disabled=${!r.length} @click=${() => this.testSummary()}>${e("summary.test")}</button>
          ${this.testResult ? T`<span class="muted small">${e(this.testResult)}</span>` : O}
        </div>
        <small class="muted">${e("summary.spoiler")}</small>
      </div>
    </section>`;
	}
	async setPanel(e, t) {
		this.busy = !0;
		try {
			await F.setPanel(this.hass, e);
		} catch {
			t instanceof HTMLInputElement && (t.checked = !t.checked);
		} finally {
			this.busy = !1;
		}
	}
	renderPanel(e, t) {
		return T`<section class="card">
      <div class="card-head">${e("settings.panel")}<span class="spacer"></span><small>${e("settings.adminOnly")}</small></div>
      <label class="row">
        <input type="checkbox" .checked=${t.show_in_sidebar} ?disabled=${this.busy}
          @change=${(e) => this.setPanel({ show_in_sidebar: e.target.checked }, e.target)} />
        <span><b>${e("settings.sidebar")}</b><small>${e("settings.sidebarHelp")}</small></span>
      </label>
      <label class="row">
        <input type="checkbox" .checked=${t.admin_only} ?disabled=${this.busy}
          @change=${(e) => this.setPanel({ admin_only: e.target.checked }, e.target)} />
        <span><b>${e("settings.adminPanel")}</b><small>${e("settings.adminPanelHelp")}</small></span>
      </label>
    </section>`;
	}
	async setClock(e) {
		try {
			await Xe(this.hass, e);
		} catch {}
		this.requestUpdate();
	}
	renderClock(e) {
		let t = Je(), n = [
			["home_assistant", e("time.home", { zone: tt(this.hass) })],
			["device", e("time.device", { zone: et() })],
			["circuit", e("time.circuit")]
		];
		return T`<section class="card">
      <div class="card-head">${e("time.title")}<span class="spacer"></span><small>${e("time.justYou")}</small></div>
      <div class="radios" role="radiogroup" aria-label=${e("time.title")}>
        ${n.map(([e, n]) => T`<label class="row">
            <input type="radio" name="clock" .checked=${t.zone === e}
              @change=${() => this.setClock({
			...t,
			zone: e
		})} />
            <span><b>${n}</b></span>
          </label>`)}
      </div>
      <label class="row">
        <input type="checkbox" .checked=${t.both} @change=${(e) => this.setClock({
			...t,
			both: e.target.checked
		})} />
        <span><b>${e("time.both")}</b><small>${e("time.bothHelp")}</small></span>
      </label>
    </section>`;
	}
	renderDelay(e, t) {
		return T`<section class="card">
      <div class="card-head">${e("delay.title")}</div>
      <div class="body">
        <p>${e("delay.help")}</p>
        <div class="stepper">
          <button @click=${() => this.delay(t.tv_delay - 1)} aria-label=${e("delay.less")}>−</button>
          <b class="num">${t.tv_delay ? e("delay.seconds", { n: t.tv_delay }) : e("delay.none")}</b>
          <button @click=${() => this.delay(t.tv_delay + 1)} aria-label=${e("delay.more")}>+</button>
        </div>
        <input type="range" min="0" max="120" step="1" .value=${String(t.tv_delay)} aria-label=${e("delay.title")}
          @input=${(e) => this.delay(Number(e.target.value))} />
      </div>
    </section>`;
	}
	renderF1tv(e, t) {
		let n = t.f1tv, r = n && n.status !== "not_configured";
		return T`<section class="card">
      <div class="card-head">F1TV<span class="spacer"></span><small>${e("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${e("settings.f1tvHelp")}</p>
        <div class="status">
          <span class="dot ${n?.status ?? ""}"></span><b>${e(`f1tv.${n?.status ?? "not_configured"}`)}</b>
          ${n?.expires ? T`<span class="muted">${e("settings.expires", { date: it(this.hass, n.expires) })}</span>` : O}
        </div>
        <form class="token" @submit=${(e) => {
			e.preventDefault(), this.saveToken();
		}}>
          <input type="password" autocomplete="off" spellcheck="false" .value=${this.token}
            placeholder=${e(r ? "settings.tokenReplace" : "settings.tokenPaste")}
            aria-label=${e("settings.tokenPaste")}
            @input=${(e) => {
			this.token = e.target.value, this.tokenError = "";
		}} />
          <button class="btn" type="submit" ?disabled=${this.saving || !this.token.trim()}>${e("settings.save")}</button>
        </form>
        ${this.tokenError ? T`<div class="error-text" role="alert">${e(`settings.errors.${this.tokenError}`)}</div>` : O}
        <p class="muted small">${e("settings.tokenSteps")}</p>
        ${r ? this.confirmRemove ? T`<div class="confirm">${e("settings.removeConfirm")}
                <button class="btn danger" ?disabled=${this.saving} @click=${() => this.removeToken()}>${e("settings.remove")}</button>
                <button class="btn flat" @click=${() => this.confirmRemove = !1}>${e("settings.cancel")}</button></div>` : T`<button class="btn flat" @click=${() => this.confirmRemove = !0}>${e("settings.remove")}</button>` : O}
      </div>
    </section>`;
	}
	renderEntities(e) {
		let t = this.entities;
		return T`<section class="card">
      <div class="card-head">${e("settings.entities")}</div>
      ${t ? T`<ul class="entities">${t.map((t) => {
			let n = this.hass.states?.[t.entity_id];
			return T`<li><button class="entity" @click=${() => this.moreInfo(t.entity_id)}>
              <span class="name">${n?.attributes.friendly_name ?? t.entity_id}<small>${t.entity_id}</small></span>
              <span class="value">${t.disabled ? e("settings.disabled") : n ? this.hass.formatEntityState?.(n) ?? n.state : "—"}</span>
            </button></li>`;
		})}</ul>` : T`<div class="body muted">${e("common.loading")}</div>`}
      <div class="note">${e("settings.entitiesHelp")}</div>
    </section>`;
	}
	static {
		this.styles = [B, o`
      :host { display: block; }
      .page { display: grid; gap: var(--plb-gap); max-width: 760px; margin: 0 auto; }
      .body { padding: 14px 16px; display: grid; gap: 12px; }
      .body p { margin: 0; color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; }
      .small { font-size: 12px; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .line { display: flex; align-items: center; gap: 10px; font-size: 14px; }
      .line input { width: 18px; height: 18px; accent-color: var(--primary-color); }
      .body > .btn { justify-self: start; }
      .live { display: flex; align-items: center; gap: 18px; padding: 18px 16px 8px; }
      .big-play { width: 72px; height: 72px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer; flex: none;
        background: var(--primary-color); color: var(--text-primary-color, #fff); }
      .big-play.on { background: var(--secondary-background-color); color: var(--primary-text-color); box-shadow: inset 0 0 0 2px var(--divider-color); }
      .big-play:disabled { opacity: 0.6; cursor: default; }
      .what { display: grid; gap: 4px; font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; }
      .what b { font-size: 16px; color: var(--primary-text-color); font-weight: 500; }
      .row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px 16px; cursor: pointer; }
      .row input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--primary-color); }
      .radios .row { padding-top: 8px; padding-bottom: 8px; }
      .radios .row:first-child { padding-top: 14px; }
      .row span { display: grid; gap: 2px; font-size: 14px; }
      .row small { color: var(--secondary-text-color); font-size: 12px; line-height: 1.5; }
      .stepper { display: flex; align-items: center; gap: 10px; }
      .stepper button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer; }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      .status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 14px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--divider-color); }
      .dot.active { background: var(--plb-green); }
      .dot.expiring { background: var(--warning-color, #ffa600); }
      .dot.expired, .dot.invalid { background: var(--error-color, #db4437); }
      .token { display: flex; gap: 8px; }
      .token input { flex: 1; min-width: 0; height: 36px; border-radius: 8px; border: 1px solid var(--divider-color);
        background: var(--card-background-color); color: var(--primary-text-color); padding: 0 10px; font: inherit; }
      .error-text { color: var(--error-color, #db4437); font-size: 13px; }
      .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 13px; }
      .btn.danger { background: var(--error-color, #db4437); }
      .btn:disabled { opacity: 0.6; cursor: default; }
      .entities { list-style: none; margin: 0; padding: 0; }
      .entity { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 16px; border: 0; border-bottom: 1px solid var(--divider-color);
        background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
      .entity:hover { background: var(--plb-row-alt); }
      .entity .name { flex: 1; display: grid; gap: 2px; min-width: 0; font-size: 14px; }
      .entity small { color: var(--secondary-text-color); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
      .entity .value { color: var(--secondary-text-color); font-size: 13px; max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @media (max-width: 640px) {
        .token { flex-direction: column; }
      }
    `];
	}
}, tn = class extends N {
	constructor(...e) {
		super(...e), this.seasons = [], this.kind = "drivers", this.round = null, this.failed = !1, this.request = 0, this.spoilers = "";
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			seasons: { attribute: !1 },
			season: { state: !0 },
			kind: { state: !0 },
			round: { state: !0 },
			data: { state: !0 },
			failed: { state: !0 }
		};
	}
	willUpdate(e) {
		this.season === void 0 && this.settings && (this.season = this.settings.season);
		let t = dt(this.settings);
		([
			"season",
			"kind",
			"round"
		].some((t) => e.has(t)) || t !== this.spoilers) && (this.spoilers = t, this.load());
	}
	async load() {
		if (!this.hass || this.season === void 0) return;
		let e = ++this.request;
		this.failed = !1;
		try {
			let t = await F.standings(this.hass, this.season, this.round, this.kind);
			e === this.request && (this.data = t);
		} catch {
			e === this.request && (this.failed = !0);
		}
	}
	render() {
		let e = L(this.hass), t = this.seasons.length ? this.seasons : [this.season ?? 0], n = this.data?.rounds ?? 0, r = this.data?.round ?? n;
		return T`
      <div class="toolbar">
        <h1>${e("standings.title")}</h1>
        ${["drivers", "constructors"].map((t) => T`<button class="chip ${this.kind === t ? "on" : ""}" @click=${() => this.kind = t}>${e(`standings.${t}`)}</button>`)}
        <span class="spacer"></span>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.round = null, this.data = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => T`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
        ${n ? T`<select aria-label=${e("common.round")} @change=${(e) => this.round = Number(e.target.value)}>
              ${Array.from({ length: n }, (e, t) => n - t).map((t) => T`<option .selected=${t === r} value=${t}>${e("standings.after", { n: t })}</option>`)}
            </select>` : O}
      </div>
      ${this.failed ? Y(e, () => this.load()) : this.data ? this.renderTable(this.data) : _t(e)}
    `;
	}
	renderTable(e) {
		let t = L(this.hass);
		if (!e.rows.length) return T`<div class="card state">${e.capped ? t("spoiler.standingsCap") : t("standings.empty")}</div>`;
		let n = this.kind === "drivers", r = e.rows[0].points || 1;
		return T`<div class="card">
      <div class="scroll"><table class="tbl">
        <tr>
          <th>${t("common.pos")}</th><th>${t("standings.change")}</th>
          <th>${t(n ? "common.driver" : "common.team")}</th>
          ${n ? T`<th class="wide">${t("common.team")}</th>` : O}
          <th class="barcol"></th>
          <th class="r">${t("common.points")}</th><th class="r">${t("standings.wins")}</th><th class="r">${t("standings.behind")}</th>
        </tr>
        ${e.rows.map((e) => T`<tr>
            <td class="num">${e.position_text && e.position_text !== String(e.position) ? e.position_text : e.position}</td>
            <td>${mt(e.change, !1)}</td>
            <td>${J(n ? e.name : e.team, e.team_id)}</td>
            ${n ? T`<td class="wide muted">${e.team ?? ""}</td>` : O}
            <td class="barcol"><div class="fill" style="width:${(e.points ?? 0) / r * 100}%;background:${Ge(e.team_id)}"></div></td>
            <td class="r num"><b>${q(this.hass, e.points)}</b></td>
            <td class="r num">${e.wins ?? ""}</td>
            <td class="r num">${e.behind ? `−${q(this.hass, e.behind)}` : ""}</td>
          </tr>`)}
      </table></div>
      ${e.capped ? T`<div class="note">${t("spoiler.standingsCap")}</div>` : O}
    </div>`;
	}
	static {
		this.styles = [B, o`
      :host { display: block; }
      .barcol { width: 30%; min-width: 80px; }
      .fill { height: 6px; border-radius: 3px; min-width: 2px; }
      @media (max-width: 900px) { .wide { display: none; } }
      @media (max-width: 640px) { .barcol { display: none; } }
    `];
	}
}, nn = [
	"live",
	"calendar",
	"results",
	"standings"
], rn = [...nn, "settings"], an = "pit-lane-live-board-page";
function on() {
	try {
		let e = localStorage.getItem(an);
		return e && rn.includes(e) ? e : "live";
	} catch {
		return "live";
	}
}
var sn = class extends N {
	constructor(...e) {
		super(...e), this.narrow = !1, this.page = on(), this.seasons = [], this.delayOpen = !1, this.failed = !1, this.clockVersion = 0, this.clockChanged = () => this.clockVersion++, this.connecting = !1, this.backoff = 5e3, this.pendingDelay = null;
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			page: { state: !0 },
			settings: { state: !0 },
			seasons: { state: !0 },
			delayOpen: { state: !0 },
			failed: { state: !0 },
			target: { state: !0 },
			clockVersion: { state: !0 }
		};
	}
	get t() {
		return L(this.hass);
	}
	connectedCallback() {
		super.connectedCallback(), window.addEventListener(V, this.clockChanged);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.removeEventListener(V, this.clockChanged), this.unsubscribe?.(), this.unsubscribe = void 0, window.clearTimeout(this.retry), this.retry = void 0;
	}
	updated() {
		this.hass && !this.unsubscribe && !this.connecting && this.retry === void 0 && this.connect();
	}
	async connect() {
		if (this.hass) {
			this.connecting = !0, Ye(this.hass);
			try {
				this.unsubscribe = await F.subscribeSettings(this.hass, (e) => this.receive(e)), this.failed = !1, this.backoff = 5e3;
			} catch {
				this.failed = !0, this.retry = window.setTimeout(() => {
					this.retry = void 0, this.requestUpdate();
				}, this.backoff), this.backoff = Math.min(this.backoff * 2, 6e4);
				return;
			} finally {
				this.connecting = !1;
			}
			if (!this.seasons.length) try {
				this.seasons = (await F.seasons(this.hass)).seasons;
			} catch {
				this.seasons = this.settings ? [this.settings.season] : [];
			}
		}
	}
	receive(e) {
		this.settings = this.pendingDelay === null ? e : {
			...e,
			tv_delay: this.pendingDelay
		};
	}
	go(e) {
		this.page = e.page, this.target = e, this.delayOpen = !1;
		try {
			localStorage.setItem(an, e.page);
		} catch {}
	}
	setDelay(e) {
		if (!this.hass || !this.settings) return;
		let t = Math.max(0, Math.min(120, Math.round(e)));
		this.pendingDelay = t, this.settings = {
			...this.settings,
			tv_delay: t
		}, window.clearTimeout(this.delayTimer), this.delayTimer = window.setTimeout(() => void this.sendDelay(), 400);
	}
	async sendDelay() {
		if (!this.hass || this.pendingDelay === null) return;
		let e = this.pendingDelay;
		try {
			let t = await F.setSettings(this.hass, { tv_delay: e });
			this.pendingDelay === e && (this.pendingDelay = null), this.receive(t);
		} catch {
			this.pendingDelay = null;
			try {
				this.receive(await F.settings(this.hass));
			} catch {}
		}
	}
	async setSpoiler(e) {
		if (this.hass) try {
			this.receive(await F.setSettings(this.hass, { no_spoiler: e }));
		} catch {}
	}
	async reveal(e) {
		if (this.hass) try {
			this.receive(await F.reveal(this.hass, e.detail));
		} catch {}
	}
	toggleMenu() {
		this.dispatchEvent(new Event("hass-toggle-menu", {
			bubbles: !0,
			composed: !0
		}));
	}
	renderPage() {
		if (!this.hass || !this.settings) return this.failed ? Y(this.t, () => {
			window.clearTimeout(this.retry), this.retry = void 0, this.connect();
		}) : T`<div class="card loading">${this.t("common.loading")}</div>`;
		let e = {
			hass: this.hass,
			settings: this.settings,
			seasons: this.seasons
		};
		switch (this.page) {
			case "settings": return T`<plb-settings .hass=${e.hass} .settings=${e.settings}
          @plb-delay=${(e) => this.setDelay(e.detail)}></plb-settings>`;
			case "calendar": return T`<plb-calendar .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons}
          @plb-go=${(e) => this.go(e.detail)}></plb-calendar>`;
			case "results": return T`<plb-results .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons}
          .target=${this.target} @plb-reveal=${this.reveal}></plb-results>`;
			case "standings": return T`<plb-standings .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons}></plb-standings>`;
			default: return T`<plb-live .hass=${e.hass} .settings=${e.settings}
          @plb-spoiler-off=${() => this.setSpoiler(!1)}></plb-live>`;
		}
	}
	render() {
		let e = this.t, t = this.settings, n = t?.f1tv && t.f1tv.status !== "not_configured" ? t.f1tv.status : null;
		return T`
      <header class="appbar">
        ${this.narrow ? T`<button class="icon-btn" @click=${this.toggleMenu} aria-label=${e("common.menu")}>${z(R.menu, 24)}</button>` : O}
        <div class="brand"><span class="mark">${z(R.board, 18)}</span><span class="name">${e("common.title")}</span></div>
        <nav class="tabs">
          ${nn.map((t) => T`<button class="tab ${this.page === t ? "active" : ""}" @click=${() => this.go({ page: t })}>
              ${e(`tabs.${t}`)}
            </button>`)}
        </nav>
        <span class="spacer"></span>
        ${t && !t.live ? T`<button class="chip paused" @click=${() => this.go({ page: "settings" })} title=${e("settings.pausedHelp")}>
              ${z(R.pause, 16)}<span class="label">${t.auto_start ? e("live.pausedAuto") : e("live.pausedShort")}</span></button>` : O}
        ${n ? T`<span class="chip small ${n === "active" ? "" : "warn"}" title=${e(`f1tv.${n}`)}>F1TV</span>` : O}
        <button class="chip ${t?.tv_delay ? "on" : ""}" @click=${() => this.delayOpen = !this.delayOpen}
          aria-expanded=${this.delayOpen ? "true" : "false"} aria-label=${e("delay.title")}>
          ${z(R.clock, 18)}<span class="num">${e("delay.seconds", { n: t?.tv_delay ? `+${t.tv_delay}` : 0 })}</span>
          <span class="label">${e("delay.title")}</span>
        </button>
        <button class="chip ${t?.no_spoiler ? "on" : ""}" @click=${() => this.setSpoiler(!t?.no_spoiler)}
          title=${e("spoiler.help")} aria-pressed=${t?.no_spoiler ? "true" : "false"}
          aria-label=${t?.no_spoiler ? e("spoiler.on") : e("spoiler.off")}>
          ${z(t?.no_spoiler ? R.eyeOff : R.eye, 18)}
          <span class="label">${t?.no_spoiler ? e("spoiler.on") : e("spoiler.off")}</span>
        </button>
        <button class="icon-btn gear ${this.page === "settings" ? "active" : ""}" @click=${() => this.go({ page: "settings" })}
          aria-label=${e("settings.title")} title=${e("settings.title")}>${z(R.cog, 22)}</button>
      </header>
      ${this.delayOpen && t ? this.renderPopover(t) : O}
      <main>${Ot(this.clockVersion, this.renderPage())}</main>
      <footer>${e("common.disclaimer")}</footer>
    `;
	}
	renderPopover(e) {
		let t = this.t;
		return T`<div class="card pop" role="dialog" aria-label=${t("delay.title")}>
      <h3>${t("delay.title")}</h3>
      <p>${t("delay.help")}</p>
      <div class="stepper">
        <button @click=${() => this.setDelay(e.tv_delay - 1)} aria-label=${t("delay.less")}>−</button>
        <b class="num">${e.tv_delay ? t("delay.seconds", { n: e.tv_delay }) : t("delay.none")}</b>
        <button @click=${() => this.setDelay(e.tv_delay + 1)} aria-label=${t("delay.more")}>+</button>
      </div>
      <input type="range" min="0" max="120" step="1" .value=${String(e.tv_delay)} aria-label=${t("delay.title")}
        @input=${(e) => this.setDelay(Number(e.target.value))} />
    </div>`;
	}
	static {
		this.styles = [B, o`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color);
      }
      .appbar {
        position: sticky; top: 0; z-index: 5;
        display: flex; align-items: center; gap: 12px;
        min-height: 56px; padding: 0 16px;
        background: var(--app-header-background-color, var(--card-background-color));
        color: var(--app-header-text-color, var(--primary-text-color));
        border-bottom: 1px solid var(--divider-color);
      }
      .icon-btn { border: 0; background: none; color: inherit; cursor: pointer; padding: 4px; display: grid; }
      .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 500; white-space: nowrap; }
      .mark {
        width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; color: #fff;
        background: linear-gradient(135deg, var(--primary-color), #7c4dff);
      }
      .tabs { display: flex; gap: 4px; margin-left: 8px; }
      .appbar .chip { color: inherit; }
      .appbar .chip.on { color: var(--primary-color); }
      .chip.warn { color: var(--warning-color, #ffa600); }
      .chip.paused { border-style: dashed; color: var(--secondary-text-color); }
      .gear.active { color: var(--primary-color); }
      main { padding: var(--plb-gap); max-width: 1480px; margin: 0 auto; }
      footer {
        max-width: 1480px; margin: 8px auto 0; padding: 0 var(--plb-gap) 24px;
        color: var(--secondary-text-color); font-size: 11px; line-height: 1.5;
      }
      .pop { position: fixed; right: 16px; top: 64px; width: 300px; padding: 16px; display: grid; gap: 12px; z-index: 10; }
      .pop h3 { margin: 0; font-size: 15px; font-weight: 500; }
      .pop p { margin: 0; color: var(--secondary-text-color); font-size: 12px; line-height: 1.5; }
      .stepper { display: flex; align-items: center; gap: 10px; }
      .stepper button {
        width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer;
      }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      @media (max-width: 1180px) {
        .appbar .chip .label { display: none; }
        .appbar { gap: 8px; }
      }
      @media (max-width: 640px) {
        .appbar { flex-wrap: wrap; gap: 6px; padding: 8px 8px 0; }
        .tabs { order: 3; width: 100%; margin: 0; overflow-x: auto; }
        .tab { flex: 1; padding: 8px 6px; }
        .chip .label { display: none; }
        main { padding: 10px; }
        .pop { left: 8px; right: 8px; width: auto; top: 112px; }
      }
    `];
	}
};
I("plb-calendar", Mt), I("plb-results", Qt), I("plb-standings", tn), I("plb-live", Yt), I("plb-live-map", Xt), I("plb-settings", en), I("plb-countdown", kt), I("plb-age", At), I("pit-lane-live-board-panel", sn);
//#endregion
export { sn as PitLaneLiveBoardPanel };
