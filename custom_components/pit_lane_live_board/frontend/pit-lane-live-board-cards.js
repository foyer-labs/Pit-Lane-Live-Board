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
var v = globalThis, oe = (e) => e, y = v.trustedTypes, se = y ? y.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, b = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, ce = "?" + x, le = `<${ce}>`, S = document, C = () => S.createComment(""), w = (e) => e === null || typeof e != "object" && typeof e != "function", ue = Array.isArray, de = (e) => ue(e) || typeof e?.[Symbol.iterator] == "function", fe = "[ 	\n\f\r]", T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, pe = /-->/g, me = />/g, E = RegExp(`>|${fe}(?:([^\\s"'>=/]+)(${fe}*=${fe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), he = /'/g, ge = /"/g, _e = /^(?:script|style|textarea|title)$/i, ve = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), D = ve(1), O = ve(2), k = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), ye = /* @__PURE__ */ new WeakMap(), j = S.createTreeWalker(S, 129);
function be(e, t) {
	if (!ue(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return se === void 0 ? t : se.createHTML(t);
}
var xe = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = T;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === T ? c[1] === "!--" ? o = pe : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = E) : (_e.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = E) : o = me : o === E ? c[0] === ">" ? (o = i ?? T, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? E : c[3] === "\"" ? ge : he) : o === ge || o === he ? o = E : o === pe || o === me ? o = T : (o = E, i = void 0);
		let d = o === E && e[t + 1].startsWith("/>") ? " " : "";
		a += o === T ? n + le : l >= 0 ? (r.push(s), n.slice(0, l) + b + n.slice(l) + x + d) : n + x + (l === -2 ? t : d);
	}
	return [be(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, M = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = xe(t, n);
		if (this.el = e.createElement(l, r), j.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = j.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(b)) {
					let t = u[o++], n = i.getAttribute(e).split(x), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ce : r[1] === "?" ? we : r[1] === "@" ? Te : F
					}), i.removeAttribute(e);
				} else e.startsWith(x) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (_e.test(i.tagName)) {
					let e = i.textContent.split(x), t = e.length - 1;
					if (t > 0) {
						i.textContent = y ? y.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], C()), j.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], C());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ce) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(x, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += x.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = S.createElement("template");
		return n.innerHTML = e, n;
	}
};
function N(e, t, n = e, r) {
	if (t === k) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = w(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = N(e, i._$AS(e, t.values), i, r)), t;
}
var Se = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? S).importNode(t, !0);
		j.currentNode = r;
		let i = j.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new P(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ee(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = j.nextNode(), a++);
		}
		return j.currentNode = S, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, P = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = N(this, e, t), w(e) ? e === A || e == null || e === "" ? (this._$AH !== A && this._$AR(), this._$AH = A) : e !== this._$AH && e !== k && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? de(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== A && w(this._$AH) ? this._$AA.nextSibling.data = e : this.T(S.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = M.createElement(be(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Se(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = ye.get(e.strings);
		return t === void 0 && ye.set(e.strings, t = new M(e)), t;
	}
	k(t) {
		ue(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(C()), this.O(C()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = oe(e).nextSibling;
			oe(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, F = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = A, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = A;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = N(this, e, t, 0), a = !w(e) || e !== this._$AH && e !== k, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = N(this, r[n + o], t, o), s === k && (s = this._$AH[o]), a ||= !w(s) || s !== this._$AH[o], s === A ? e = A : e !== A && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ce = class extends F {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === A ? void 0 : e;
	}
}, we = class extends F {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== A);
	}
}, Te = class extends F {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = N(this, e, t, 0) ?? A) === k) return;
		let n = this._$AH, r = e === A && n !== A || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== A && (n === A || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ee = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		N(this, e);
	}
}, De = {
	M: b,
	P: x,
	A: ce,
	C: 1,
	L: xe,
	R: Se,
	D: de,
	V: N,
	I: P,
	H: F,
	N: we,
	U: Te,
	B: Ce,
	F: Ee
}, Oe = v.litHtmlPolyfillSupport;
Oe?.(M, P), (v.litHtmlVersions ??= []).push("3.3.3");
var ke = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new P(t.insertBefore(C(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Ae = globalThis, I = class extends _ {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ke(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return k;
	}
};
I._$litElement$ = !0, I.finalized = !0, Ae.litElementHydrateSupport?.({ LitElement: I });
var je = Ae.litElementPolyfillSupport;
je?.({ LitElement: I }), (Ae.litElementVersions ??= []).push("4.2.2");
var Me = {
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
			title: "Title (empty for none)",
			rows: "Rows",
			columns: "Columns",
			highlight: "Driver to highlight (e.g. LEC)",
			count: "How many",
			filter: "Show",
			kind: "Championship"
		}
	}
}, Ne = {
	en: Me,
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
				title: "Titolo (vuoto per nessuno)",
				rows: "Righe",
				columns: "Colonne",
				highlight: "Pilota da evidenziare (es. LEC)",
				count: "Quanti",
				filter: "Mostra",
				kind: "Campionato"
			}
		}
	}
};
function Pe(e) {
	return (e?.locale?.language ?? e?.language ?? "en").toLowerCase().startsWith("it") ? "it" : "en";
}
function Fe(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n) return;
		n = n[e];
	}
	return typeof n == "string" ? n : void 0;
}
function L(e) {
	let t = Ne[Pe(e)];
	return (e, n) => {
		let r = Fe(t, e) ?? Fe(Me, e) ?? e;
		for (let [e, t] of Object.entries(n ?? {})) r = r.replaceAll(`{${e}}`, String(t));
		return r;
	};
}
//#endregion
//#region src/format.ts
function R(e) {
	return Pe(e) === "it" ? "it-IT" : "en-GB";
}
var Ie = /* @__PURE__ */ new Map(), Le = /* @__PURE__ */ new Map();
function z(e, t) {
	let n = `${R(e)}|${JSON.stringify(t)}`, r = Ie.get(n);
	return r || (r = new Intl.DateTimeFormat(R(e), t), Ie.set(n, r)), r;
}
function Re(e, t) {
	let n = `${R(e)}|${t}`, r = Le.get(n);
	return r || (r = new Intl.NumberFormat(R(e), { maximumFractionDigits: t }), Le.set(n, r)), r;
}
function ze(e) {
	return e.config.time_zone;
}
function Be(e, t, n) {
	return t ? z(e, {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: ze(e)
	}).format(new Date(t)) : z(e, {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	}).format(/* @__PURE__ */ new Date(`${n}T12:00:00Z`));
}
function Ve(e) {
	return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(e) ? e : `${e}Z`);
}
function He(e, t) {
	return t ? z(e, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZone: ze(e)
	}).format(Ve(t)) : "";
}
function Ue(e, t) {
	return t ? z(e, {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: ze(e)
	}).format(Ve(t)) : "";
}
function We(e) {
	let t = Math.max(0, Math.floor(e / 1e3)), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60), a = t % 60, o = (e) => String(e).padStart(2, "0");
	return n ? `${n} d ${o(r)} h ${o(i)} m` : r ? `${r} h ${o(i)} m` : `${o(i)} m ${o(a)} s`;
}
function Ge(e) {
	if (e === null) return "";
	let t = Math.max(0, Math.round(e)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = t % 60, a = (e) => String(e).padStart(2, "0");
	return n ? `${n}:${a(r)}:${a(i)}` : `${a(r)}:${a(i)}`;
}
function B(e, t, n = 1) {
	return t == null ? "—" : Re(e, n).format(t);
}
function Ke(e, t) {
	return !t || !e || e.language !== t.language || e.locale?.language !== t.locale?.language || e.config?.time_zone !== t.config?.time_zone || e.user?.is_admin !== t.user?.is_admin;
}
//#endregion
//#region src/clock.ts
var qe = class extends I {
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
		return Number.isFinite(e) ? We(e - this.now) : "";
	}
	static {
		this.styles = o`
    :host { font-variant-numeric: tabular-nums; }
  `;
	}
}, Je = class extends I {
	constructor(...e) {
		super(...e), this.age = 0, this.at = Date.now(), this.precise = !0, this.now = Date.now();
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: Ke
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
		return L(this.hass)("live.updated", { n: B(this.hass, e, +!!this.precise) });
	}
	static {
		this.styles = o`
    :host { font-variant-numeric: tabular-nums; }
  `;
	}
}, Ye = document.querySelector("home-assistant") && !customElements.get("home-assistant") ? customElements.whenDefined("home-assistant") : Promise.resolve();
function V(e, t) {
	Ye.then(() => {
		customElements.get(e) || customElements.define(e, t);
	});
}
//#endregion
//#region node_modules/lit-html/directive.js
var Xe = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Ze = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Qe = class {
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
}, { I: $e } = De, et = (e) => e, tt = () => document.createComment(""), H = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new $e(r.insertBefore(tt(), i), r.insertBefore(tt(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = et(e).nextSibling;
				et(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, U = (e, t, n = e) => (e._$AI(t, n), e), nt = {}, rt = (e, t = nt) => e._$AH = t, it = (e) => e._$AH, at = (e) => {
	e._$AR(), e._$AA.remove();
}, ot = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, W = Ze(class extends Qe {
	constructor(e) {
		if (super(e), e.type !== Xe.CHILD) throw Error("repeat() can only be used in text expressions");
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
		let i = it(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = U(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = U(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = U(i[d], a[m]), H(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = U(i[f], a[p]), H(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = ot(o, p, m), u = ot(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = H(e, i[d]);
					U(t, a[p]), c[p] = t;
				} else c[p] = U(n, a[p]), H(e, i[d], n), i[t] = null;
				p++;
			} else at(i[f]), f--;
		} else at(i[d]), d++;
		for (; p <= m;) {
			let t = H(e, c[m + 1]);
			U(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && at(e);
		}
		return this.ut = o, rt(e, c), k;
	}
}), G = "pit_lane_live_board", K = {
	settings: (e) => e.callWS({ type: `${G}/settings/get` }),
	setSettings: (e, t) => e.callWS({
		type: `${G}/settings/set`,
		...t
	}),
	setToken: (e, t) => e.callWS({
		type: `${G}/f1tv/set`,
		token: t
	}),
	removeToken: (e) => e.callWS({ type: `${G}/f1tv/remove` }),
	setPanel: (e, t) => e.callWS({
		type: `${G}/panel/set`,
		...t
	}),
	entities: (e) => e.callWS({ type: `${G}/entities` }),
	reveal: (e, t) => e.callWS({
		type: `${G}/spoiler/reveal`,
		session: t
	}),
	seasons: (e) => e.callWS({ type: `${G}/seasons` }),
	calendar: (e, t) => e.callWS({
		type: `${G}/calendar/get`,
		season: t
	}),
	rounds: (e, t) => e.callWS({
		type: `${G}/results/season`,
		season: t
	}),
	detail: (e, t, n, r) => e.callWS({
		type: `${G}/results/detail`,
		season: t,
		round: n,
		tab: r
	}),
	standings: (e, t, n, r) => e.callWS({
		type: `${G}/standings/get`,
		season: t,
		round: n,
		kind: r
	}),
	subscribeSettings: (e, t) => e.connection.subscribeMessage(t, { type: `${G}/settings/subscribe` }),
	subscribeLive: (e, t) => e.connection.subscribeMessage(t, { type: `${G}/live/subscribe` }),
	subscribeMap: (e, t) => e.connection.subscribeMessage(t, { type: `${G}/map/subscribe` })
}, st = o`
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
`, ct = {
	soft: "--plb-soft",
	medium: "--plb-medium",
	hard: "--plb-hard",
	intermediate: "--plb-intermediate",
	wet: "--plb-wet",
	unknown: "--plb-unknown"
}, lt = {
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
}, ut = [
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
function dt(e, t) {
	if (t) return t;
	if (e && lt[e]) return lt[e];
	let n = 0;
	for (let t of e ?? "") n = n * 31 + t.charCodeAt(0) >>> 0;
	return ut[n % ut.length];
}
//#endregion
//#region src/parts.ts
function ft(e) {
	return (t) => {
		(t.key === "Enter" || t.key === " ") && (t.preventDefault(), e());
	};
}
function pt(e, t, n, r) {
	let i = t === "unknown" ? "?" : t[0].toUpperCase();
	return D`<span class="tyre" title=${e(`tyres.${t}`)}>
    <span class="tyre-dot" style="--c:var(${ct[t] ?? ct.unknown})">${i}</span>
    ${r === null ? A : D`<small class="num">${r}</small>`}
    ${n === !1 ? D`<span class="used">${e("live.used")}</span>` : A}
  </span>`;
}
function mt(e, t = !0) {
	return e == null ? A : e > 0 ? D`<span class="gained up">▲${e}</span>` : e < 0 ? D`<span class="gained down">▼${-e}</span>` : t ? D`<span class="gained muted">–</span>` : A;
}
//#endregion
//#region src/pages/live-map.ts
var ht = class extends I {
	constructor(...e) {
		super(...e), this.tower = [], this.selected = "", this.cars = [], this.path = "", this.subscribing = !1, this.onScreen = !1, this.visibility = () => this.sync();
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: Ke
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
			let e = await K.subscribeMap(this.hass, (e) => this.receive(e));
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
		if (!t) return D`<div class="locked">${e("live.mapDrawing")}</div>`;
		let n = [...this.cars.filter((e) => e.number !== this.selected), ...this.cars.filter((e) => e.number === this.selected)];
		return D`<svg viewBox="0 0 ${t.width} ${t.height}" role="img" aria-label=${e("live.map")}>
      ${this.path ? O`<path class="track" d=${this.path}></path><path class="track-line" d=${this.path}></path>` : A}
      ${W(n, (e) => e.number, (e) => {
			let t = e.number === this.selected, n = this.driver(e.number), r = () => this.select(e.number);
			return O`<g class="car" style="transform:translate(${e.x}px,${e.y}px)" @click=${r}
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
}, q = {
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
}, J = (e, t = 20) => O`<svg viewBox="0 0 24 24" width=${t} height=${t} fill="currentColor" aria-hidden="true"><path d=${e}></path></svg>`, Y = 4, gt = {
	clear: "st-clear",
	yellow: "st-yellow",
	safety_car: "st-sc",
	virtual_safety_car: "st-sc",
	vsc_ending: "st-yellow",
	red_flag: "st-red",
	chequered: "st-chequered"
};
function X(e) {
	return e ? gt[e] ?? "" : "";
}
function _t(e, t) {
	return (!t || t === "clear" || t === "chequered") && !e.yellow && !e.red_flag && !e.safety_car && !e.virtual_safety_car && !e.penalties.length && !e.investigations.length && !e.track_limits.length;
}
function vt(e, t) {
	switch (t.kind) {
		case "time_penalty": return `+${t.seconds ?? "?"}s`;
		case "drive_through": return e("stewards.short.drive_through");
		case "stop_go": return t.seconds ? `${e("stewards.short.stop_go")} ${t.seconds}s` : e("stewards.short.stop_go");
		case "grid_penalty": return e("stewards.short.grid", { n: t.places ?? "?" });
		case "disqualified": return e("stewards.short.disqualified");
		default: return e(`stewards.kind.${t.kind}`);
	}
}
function yt(e) {
	return e.cars.map((e) => e.tla).join(" · ");
}
function bt(e, t, n) {
	return e.length <= Y ? e.map(t) : D`${e.slice(0, Y).map(t)}
    <details><summary>${n("stewards.showAll", { n: e.length - Y })}</summary>${e.slice(Y).map(t)}</details>`;
}
function xt(e, t) {
	return D`<li class=${t.served ? "served" : ""}>
    <span class="pen">${vt(e, t)}</span>
    <span class="what"><b>${yt(t)}</b>${t.reason ? D` <span class="why">${t.reason}</span>` : A}</span>
    <span class="when">${t.served ? D`✓ ${e("stewards.served")}` : t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
  </li>`;
}
function St(e, t) {
	return D`<li>
    <span class="tag">${e(`stewards.kind.${t.status ?? t.kind}`)}</span>
    <span class="what"><b>${yt(t)}</b>${t.reason ? D` <span class="why">${t.reason}</span>` : A}</span>
    <span class="when">${t.turn ? e("stewards.turn", { n: t.turn }) : t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
  </li>`;
}
function Ct(e, t, n) {
	let r = t.safety_car ?? t.virtual_safety_car, i = t.safety_car ? "sc" : "vsc";
	return D`<div class="col">
    <h4>${e("stewards.track")}</h4>
    ${n ? D`<span class="status-pill ${X(n)}">${e(`live.status.${n}`)}</span>` : D`<span class="muted">—</span>`}
    ${r ? D`<div class="phase">${e(`stewards.${i}.${r}`)}</div>` : A}
    ${t.yellow_sectors.length ? D`<div class="sectors">${t.yellow_sectors.map((t) => D`<span class="sector-chip ${t.flag}" title=${e(`stewards.${t.flag}`)}
            >S${t.sector}${t.flag === "double_yellow" ? D`<small>×2</small>` : A}</span>`)}</div>` : A}
  </div>`;
}
function wt(e, t, n, r, i) {
	let a = t.penalties.filter((e) => !e.served).length;
	return D`<button class="compact" @click=${i} aria-expanded=${r ? "true" : "false"}>
    ${n ? D`<span class="status-pill ${X(n)}">${e(`live.status.${n}`)}</span>` : A}
    ${t.yellow_sectors.map((e) => D`<span class="sector-chip ${e.flag}">S${e.sector}</span>`)}
    ${t.penalties.length ? D`<span class="count ${a ? "hot" : ""}">${e("stewards.penalties")} ${t.penalties.length}</span>` : A}
    ${t.investigations.length ? D`<span class="count">${e("stewards.investigations")} ${t.investigations.length}</span>` : A}
    ${t.track_limits.length ? D`<span class="count">${e("stewards.trackLimits")} ${t.track_limits.length}</span>` : A}
    <span class="chevron">${r ? "▴" : "▾"}</span>
  </button>`;
}
function Tt(e, t, n, r = !1, i = () => void 0) {
	return t ? _t(t, n) ? D`<div class="card stewards calm">
      <span class="status-pill ${X(n ?? "clear")}">${e(`live.status.${n ?? "clear"}`)}</span>
      <span class="muted">${e("stewards.calm")}</span>
    </div>` : D`<section class="card stewards ${t.red_flag ? "accent-red" : t.safety_car || t.virtual_safety_car ? "accent-sc" : ""} ${r ? "open" : ""}" aria-label=${e("stewards.title")}>
    <div class="card-head">${e("stewards.title")}</div>
    ${wt(e, t, n, r, i)}
    <div class="cols">
      ${Ct(e, t, n)}
      <div class="col">
        <h4>${e("stewards.penalties")} <small>${t.penalties.length || ""}</small></h4>
        ${t.penalties.length ? D`<ul>${bt(t.penalties, (t) => xt(e, t), e)}</ul>` : D`<span class="muted">${e("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${e("stewards.investigations")} <small>${t.investigations.length || ""}</small></h4>
        ${t.investigations.length ? D`<ul>${bt(t.investigations, (t) => St(e, t), e)}</ul>` : D`<span class="muted">${e("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${e("stewards.trackLimits")}</h4>
        ${t.track_limits.length ? D`<ul>${bt(t.track_limits, (t) => D`<li><b>${t.tla}</b><span class="what">${e("stewards.deleted", { n: t.deleted })}</span>
                ${t.black_and_white ? D`<span class="bw" title=${e("stewards.kind.black_and_white_flag")}>⚑</span>` : A}</li>`, e)}</ul>` : D`<span class="muted">${e("stewards.none")}</span>`}
      </div>
    </div>
  </section>` : A;
}
var Et = o`
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
`, Dt = o`
  .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; }
  .status-pill::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
  .st-clear { background: color-mix(in srgb, var(--plb-green) 16%, transparent); color: var(--plb-green); }
  .st-yellow { background: color-mix(in srgb, var(--plb-yellow) 22%, transparent); color: #a07d00; }
  .st-sc { background: #f2c200; color: #1a1a1a; }
  .st-red { background: var(--error-color, #db4437); color: #fff; }
  .st-chequered { background: var(--secondary-background-color); color: var(--primary-text-color); }
  .st-chequered::before { border-radius: 2px; background: repeating-conic-gradient(#222 0 25%, #fff 0 50%) 0 0 / 5px 5px;
  box-shadow: 0 0 0 1px var(--divider-color); }
`, Ot = 5e3, kt = 1e4, At = new class {
	constructor() {
		this.listeners = /* @__PURE__ */ new Set(), this.opening = !1;
	}
	listen(e, t) {
		return this.listeners.add(t), window.clearTimeout(this.closeTimer), this.view && t(this.view), !this.unsubscribe && !this.opening && this.open(e), () => {
			this.listeners.delete(t), this.listeners.size || (window.clearTimeout(this.closeTimer), this.closeTimer = window.setTimeout(() => this.close(), Ot));
		};
	}
	async open(e) {
		this.opening = !0;
		try {
			let t = await K.subscribeLive(e, (e) => {
				this.view = e.full || !this.view ? e : {
					...this.view,
					...e
				};
				for (let e of this.listeners) e(this.view);
			});
			this.listeners.size ? this.unsubscribe = t : t();
		} catch {
			window.clearTimeout(this.retryTimer), this.retryTimer = window.setTimeout(() => {
				this.listeners.size && !this.unsubscribe && this.open(e);
			}, kt);
		} finally {
			this.opening = !1;
		}
	}
	close() {
		this.listeners.size || (this.unsubscribe?.(), this.unsubscribe = void 0, this.view = void 0);
	}
}();
//#endregion
//#region src/cards/base.ts
function Z() {
	let e = document.documentElement.lang || navigator.language || "en";
	return L({
		language: e,
		locale: { language: e }
	});
}
function Q(e) {
	return {
		schema: e,
		computeLabel: (e) => Z()(`cards.fields.${e.name}`)
	};
}
var $ = class extends I {
	constructor(...e) {
		super(...e), this.starting = !1;
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: Ke
			},
			config: { state: !0 },
			view: { state: !0 },
			starting: { state: !0 }
		};
	}
	defaults() {
		return {};
	}
	setConfig(e) {
		if (!e) throw Error("Invalid configuration");
		this.config = {
			...this.defaults(),
			...e
		};
	}
	getCardSize() {
		return 4;
	}
	connectedCallback() {
		super.connectedCallback(), this.listen();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.unlisten?.(), this.unlisten = void 0;
	}
	willUpdate() {
		this.listen();
	}
	get usesLive() {
		return !0;
	}
	listen() {
		this.usesLive && this.hass && this.isConnected && !this.unlisten && (this.unlisten = At.listen(this.hass, (e) => this.view = e));
	}
	get t() {
		return L(this.hass);
	}
	async start() {
		if (this.hass) {
			this.starting = !0;
			try {
				await K.setSettings(this.hass, { live: !0 });
			} catch {} finally {
				this.starting = !1;
			}
		}
	}
	renderState(e, t) {
		let n = t.next_session, r = n ? D`<div class="next">${e("live.next", {
			meeting: n.meeting,
			session: e(`sessions.${n.kind}`)
		})}
          ${n.start ? D`<b class="num"><plb-countdown .to=${n.start}></plb-countdown></b>
                <small>${Be(this.hass, n.start, n.date)}</small>` : A}</div>` : D`<div class="next">${e("live.noNext")}</div>`;
		switch (t.state) {
			case "hidden": return D`<div class="state">${J(q.eyeOff, 28)}<span>${e("live.hidden")}</span></div>`;
			case "syncing": return D`<div class="state">${J(q.clock, 28)}<span>${e("live.syncing")}</span></div>`;
			case "connecting": return D`<div class="state">${J(q.timer, 28)}<span>${e("live.connecting")}</span></div>`;
			case "paused": return D`<div class="state">${J(q.pause, 28)}<span>${e("live.paused")}</span>
          <button class="btn" ?disabled=${this.starting} @click=${() => this.start()}>${e("settings.start")}</button>
          ${r}</div>`;
			default: return D`<div class="state">${J(q.timer, 28)}<span>${e("live.idle")}</span>${r}</div>`;
		}
	}
	hasBoard(e) {
		return [
			"live",
			"stale",
			"lost",
			"final"
		].includes(e.state);
	}
	render() {
		if (!this.config) return A;
		let e = this.t, t = this.config.title === void 0 ? this.defaultTitle(e) : this.config.title, n = this.view, r;
		r = !this.hass || !n ? D`<div class="state">${e("common.loading")}</div>` : this.hasBoard(n) ? this.renderBody(e, n) : this.renderState(e, n);
		let i = n?.state === "final" ? D`<span class="tag">${e("live.final")}</span>` : n?.state === "stale" || n?.state === "lost" ? D`<span class="tag warn">${e(n.state === "lost" ? "cards.lost" : "cards.stale")}</span>` : A;
		return D`<ha-card>
      ${t || i !== A ? D`<div class="head">${t ? D`<span>${t}</span>` : A}<span class="spacer"></span>${i}</div>` : A}
      <div class="body ${n?.state === "lost" ? "dim" : ""}">${r}</div>
    </ha-card>`;
	}
	static {
		this.styles = [
			st,
			Dt,
			o`
      :host { display: block; }
      ha-card { display: block; height: 100%; overflow: hidden; }
      .head { display: flex; align-items: center; gap: 8px; padding: 12px 16px 4px; font-size: 16px; font-weight: 500; }
      .body { padding: 4px 0 8px; }
      .dim { opacity: 0.5; filter: grayscale(0.6); }
      .tag { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 8px; border-radius: 10px;
        background: var(--secondary-background-color); color: var(--secondary-text-color); }
      .tag.warn { background: color-mix(in srgb, var(--warning-color, #ffa600) 20%, transparent); color: var(--primary-text-color); }
      .state { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 16px; color: var(--secondary-text-color); font-size: 14px; }
      .state svg { opacity: 0.5; }
      .state .next { display: grid; gap: 2px; justify-items: center; }
      .state .next b { font-size: 22px; font-weight: 400; color: var(--primary-text-color); }
      .state .next small { font-size: 12px; }
      .row { display: flex; align-items: center; gap: 10px; padding: 6px 16px; font-size: 14px; min-height: 32px; }
      .row + .row { border-top: 1px solid var(--divider-color); }
      .empty { padding: 8px 16px 12px; color: var(--secondary-text-color); font-size: 13px; }
      .btn:disabled { opacity: 0.6; }
    `
		];
	}
}, jt = [
	"gap",
	"interval",
	"last",
	"best",
	"sectors",
	"tyre",
	"pits"
], Mt = {
	gap: "live.gap",
	interval: "live.int",
	last: "live.last",
	best: "live.best",
	tyre: "live.tyre",
	pits: "live.pits"
};
function Nt(e) {
	return e ? D`<span class="t ${e.overall_best ? "ob" : e.personal_best ? "pb" : e.previous ? "prev" : ""}">${e.time}</span>` : D`<span class="t prev">—</span>`;
}
function Pt(e, t) {
	return e.tower?.find((e) => e.number === t);
}
var Ft = class extends $ {
	static getConfigForm() {
		let e = Z();
		return Q([
			{
				name: "title",
				selector: { text: {} }
			},
			{
				name: "rows",
				selector: { number: {
					min: 1,
					max: 22,
					mode: "box"
				} }
			},
			{
				name: "columns",
				selector: { select: {
					multiple: !0,
					mode: "list",
					options: jt.map((t) => ({
						value: t,
						label: t === "sectors" ? "S1 S2 S3" : e(Mt[t])
					}))
				} }
			},
			{
				name: "highlight",
				selector: { text: {} }
			}
		]);
	}
	static getStubConfig() {
		return {
			rows: 10,
			columns: [
				"gap",
				"last",
				"tyre"
			]
		};
	}
	defaults() {
		return {
			rows: 10,
			columns: [
				"gap",
				"last",
				"tyre"
			],
			highlight: ""
		};
	}
	getCardSize() {
		return 1 + Math.ceil(Number(this.config?.rows ?? 10) / 2);
	}
	defaultTitle(e) {
		return e("cards.tower.title");
	}
	renderBody(e, t) {
		let n = (t.tower ?? []).slice(0, Math.max(1, Number(this.config.rows) || 10)), r = new Set(this.config.columns ?? []), i = String(this.config.highlight ?? "").trim().toUpperCase();
		return n.length ? D`<table class="tower">
      <thead><tr>
        <th class="pos">${e("common.pos")}</th><th>${e("common.driver")}</th>
        ${r.has("gap") ? D`<th>${e("live.gap")}</th>` : A}
        ${r.has("interval") ? D`<th>${e("live.int")}</th>` : A}
        ${r.has("last") ? D`<th>${e("live.last")}</th>` : A}
        ${r.has("best") ? D`<th>${e("live.best")}</th>` : A}
        ${r.has("sectors") ? D`<th>S1</th><th>S2</th><th>S3</th>` : A}
        ${r.has("tyre") ? D`<th>${e("live.tyre")}</th>` : A}
        ${r.has("pits") ? D`<th>${e("live.pits")}</th>` : A}
      </tr></thead>
      <tbody>${W(n, (e) => e.number, (t) => D`<tr class=${[t.tla === i || t.number === i ? "sel" : "", t.status === "retired" || t.status === "knocked_out" ? "out" : ""].join(" ")}>
          <td class="pos num">${t.position ?? "—"}</td>
          <td><span class="drv"><span class="bar" style="background:${t.colour ?? "var(--divider-color)"}"></span>
            <span class="tla" title=${t.name ?? ""}>${t.tla}</span>
            ${t.penalty ? D`<span class="badge pen">+${t.penalty}s</span>` : A}
            ${t.in_pit ? D`<span class="badge pit">${e("live.pit")}</span>` : A}
            ${mt(t.gained, !1)}</span></td>
          ${r.has("gap") ? D`<td class="t">${t.qualifying?.gap ?? t.gap ?? ""}</td>` : A}
          ${r.has("interval") ? D`<td class="t">${t.interval ?? ""}</td>` : A}
          ${r.has("last") ? D`<td>${Nt(t.last_lap)}</td>` : A}
          ${r.has("best") ? D`<td class="t">${t.qualifying?.best ?? t.best_lap?.time ?? ""}</td>` : A}
          ${r.has("sectors") ? t.sectors.map((e) => D`<td>${Nt(e)}</td>`) : A}
          ${r.has("tyre") ? D`<td>${t.tyre ? pt(e, t.tyre.compound, t.tyre.new, t.tyre.age) : ""}</td>` : A}
          ${r.has("pits") ? D`<td class="num">${t.pit_stops}</td>` : A}
        </tr>`)}</tbody>
    </table>` : D`<div class="empty">${e("common.noData")}</div>`;
	}
	static {
		this.styles = [...$.styles, o`
      .tower { width: 100%; border-collapse: collapse; font-size: 13px; }
      .tower th { text-align: left; font-weight: 500; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--secondary-text-color); padding: 4px 6px; white-space: nowrap; }
      .tower td { padding: 0 6px; height: 32px; border-top: 1px solid var(--divider-color); white-space: nowrap; }
      .tower th:first-child, .tower td:first-child { padding-left: 16px; }
      .tower th:last-child, .tower td:last-child { padding-right: 16px; }
      .tower tr.sel td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .tower tr.out td { color: var(--plb-muted); }
      .pos { width: 24px; text-align: center; font-weight: 600; }
      .badge.pen { background: var(--error-color, #db4437); color: #fff; }
      .tyre-dot { width: 20px; height: 20px; font-size: 10px; }
    `];
	}
}, It = class extends $ {
	static getConfigForm() {
		return Q([{
			name: "title",
			selector: { text: {} }
		}]);
	}
	static getStubConfig() {
		return {};
	}
	getCardSize() {
		return 6;
	}
	defaultTitle(e) {
		return e("live.map");
	}
	renderBody(e, t) {
		if (t.state === "final" || !t.map_available) {
			let n = t.state === "final" ? "cards.mapAfter" : t.map_reason === "no_data" ? "live.mapNoData" : "cards.mapNeedsF1tv";
			return D`<div class="empty">${J(q.lock, 18)} ${e(n)}</div>`;
		}
		return D`<plb-live-map .hass=${this.hass} .tower=${t.tower ?? []} .selected=${String(this.config.highlight ?? "")}></plb-live-map>`;
	}
}, Lt = class extends $ {
	constructor(...e) {
		super(...e), this.open = !1;
	}
	static {
		this.properties = {
			...$.properties,
			open: { state: !0 }
		};
	}
	static getConfigForm() {
		return Q([{
			name: "title",
			selector: { text: {} }
		}]);
	}
	static getStubConfig() {
		return {};
	}
	defaultTitle() {
		return "";
	}
	renderBody(e, t) {
		return Tt(e, t.stewards, t.header?.track_status, this.open, () => this.open = !this.open);
	}
	static {
		this.styles = [
			...$.styles,
			Et,
			o`
      .body { padding: 0; }
      .stewards { margin: 0; box-shadow: none; border-radius: 0; background: none; }
    `
		];
	}
}, Rt = class extends $ {
	constructor(...e) {
		super(...e), this.playing = "";
	}
	static {
		this.properties = {
			...$.properties,
			playing: { state: !0 }
		};
	}
	static getConfigForm() {
		return Q([{
			name: "title",
			selector: { text: {} }
		}, {
			name: "count",
			selector: { number: {
				min: 1,
				max: 30,
				mode: "box"
			} }
		}]);
	}
	static getStubConfig() {
		return { count: 5 };
	}
	defaults() {
		return { count: 5 };
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stop();
	}
	defaultTitle(e) {
		return e("live.radio");
	}
	stop() {
		let e = this.audio;
		this.audio = void 0, this.playing = "", e && (e.pause(), e.removeAttribute("src"), e.load());
	}
	play(e) {
		if (this.playing === e) {
			this.stop();
			return;
		}
		this.stop();
		let t = new Audio(e);
		this.audio = t;
		let n = () => {
			this.audio === t && this.stop();
		};
		t.addEventListener("ended", n), t.addEventListener("error", n), t.play().catch(n), this.playing = e;
	}
	renderBody(e, t) {
		let n = (t.radio ?? []).slice(0, Number(this.config.count) || 5);
		return n.length ? D`${W(n, (e) => e.url, (n) => {
			let r = Pt(t, n.number), i = this.playing === n.url;
			return D`<div class="row">
          <button class="play" @click=${() => this.play(n.url)}
            aria-label=${e(i ? "live.pause" : "live.play", {
				driver: r?.tla ?? n.number ?? "",
				time: He(this.hass, n.utc)
			})}>
            ${J(i ? q.pause : q.play, 16)}</button>
          <span class="bar" style="background:${r?.colour ?? "var(--divider-color)"}"></span><b>${r?.tla ?? n.number}</b>
          <span class="spacer"></span><small class="muted">${He(this.hass, n.utc)}</small></div>`;
		})}` : D`<div class="empty">${e("live.noRadio")}</div>`;
	}
	static {
		this.styles = [...$.styles, o`
      .play { width: 30px; height: 30px; border-radius: 50%; border: 0; background: var(--primary-color); color: #fff;
        cursor: pointer; display: grid; place-items: center; flex: none; }
    `];
	}
}, zt = [
	"all",
	"flags",
	"penalties",
	"other"
], Bt = {
	all: null,
	flags: "flag",
	penalties: "penalty",
	other: "other"
}, Vt = class extends $ {
	static getConfigForm() {
		let e = Z();
		return Q([
			{
				name: "title",
				selector: { text: {} }
			},
			{
				name: "count",
				selector: { number: {
					min: 1,
					max: 50,
					mode: "box"
				} }
			},
			{
				name: "filter",
				selector: { select: {
					mode: "dropdown",
					options: zt.map((t) => ({
						value: t,
						label: e(`live.${t}`)
					}))
				} }
			}
		]);
	}
	static getStubConfig() {
		return {
			count: 6,
			filter: "all"
		};
	}
	defaults() {
		return {
			count: 6,
			filter: "all"
		};
	}
	defaultTitle(e) {
		return e("live.raceControl");
	}
	renderBody(e, t) {
		let n = Bt[String(this.config.filter)] ?? null, r = (t.race_control ?? []).filter((e) => !n || e.kind === n).slice(0, Number(this.config.count) || 6);
		return r.length ? D`${W(r, (e) => `${e.utc}|${e.message}`, (t) => D`<div class="row msg ${t.kind}"><small class="lap">${t.lap ? `${e("common.lap")} ${t.lap}` : ""}</small>
        <span class="text">${t.message}<small>${He(this.hass, t.utc)}</small></span></div>`)}` : D`<div class="empty">${e("common.noData")}</div>`;
	}
	static {
		this.styles = [...$.styles, o`
      .msg { align-items: flex-start; font-size: 13px; padding-top: 8px; padding-bottom: 8px; }
      .msg.flag { box-shadow: inset 3px 0 var(--plb-yellow); }
      .msg.penalty { box-shadow: inset 3px 0 var(--error-color, #db4437); }
      .lap { flex: none; width: 48px; color: var(--secondary-text-color); }
      .text small { display: block; color: var(--secondary-text-color); font-size: 11px; }
    `];
	}
}, Ht = class extends $ {
	static getConfigForm() {
		return Q([{
			name: "title",
			selector: { text: {} }
		}]);
	}
	static getStubConfig() {
		return {};
	}
	getCardSize() {
		return 2;
	}
	defaultTitle() {
		return "";
	}
	renderBody(e, t) {
		let n = t.header, r = t.state === "final", i = (n?.kind === "qualifying" || n?.kind === "sprint_qualifying") && n?.part ? D`Q${n.part}${!r && n.remaining !== null ? D` <small>${Ge(n.remaining)}</small>` : A}` : n?.lap ? D`${e("common.lap")} ${n.lap}${n.total_laps ? D`<small> / ${n.total_laps}</small>` : A}` : !r && n?.remaining != null ? D`${Ge(n.remaining)} <small>${e("live.remaining")}</small>` : A, a = t.next_session;
		return D`<div class="session">
      <div class="name"><b>${n?.meeting ?? ""}</b><small>${n?.session ?? ""}${n?.circuit ? ` · ${n.circuit}` : ""}</small></div>
      <div class="progress num">${i}</div>
      ${r ? D`<div class="muted small">${e("live.ended", { time: Ue(this.hass, t.ended) })}</div>` : n?.track_status ? D`<span class="status-pill ${X(n.track_status)}">${e(`live.status.${n.track_status}`)}</span>` : A}
      ${r && a ? D`<div class="next small">${e("live.next", {
			meeting: a.meeting,
			session: e(`sessions.${a.kind}`)
		})}
            ${a.start ? D`· <b class="num"><plb-countdown .to=${a.start}></plb-countdown></b>` : A}
            ${a.start ? D`<span class="muted">(${Be(this.hass, a.start, a.date)})</span>` : A}</div>` : A}
    </div>`;
	}
	static {
		this.styles = [...$.styles, o`
      .session { display: grid; gap: 8px; justify-items: start; padding: 8px 16px 12px; }
      .name { display: grid; }
      .name b { font-size: 18px; font-weight: 500; }
      .name small, .small { color: var(--secondary-text-color); font-size: 13px; }
      .progress { font-size: 26px; font-weight: 600; }
      .progress small { font-size: 14px; color: var(--secondary-text-color); font-weight: 400; }
      .next { color: var(--secondary-text-color); }
      .next b { color: var(--primary-text-color); }
    `];
	}
}, Ut = class extends $ {
	static getConfigForm() {
		return Q([{
			name: "title",
			selector: { text: {} }
		}]);
	}
	static getStubConfig() {
		return {};
	}
	getCardSize() {
		return 2;
	}
	defaultTitle(e) {
		return e("live.weather");
	}
	renderBody(e, t) {
		let n = t.weather;
		if (!n) return D`<div class="empty">${e("common.noData")}</div>`;
		let r = this.hass, i = n.wind_direction === null ? "" : D`<span class="wind" style="transform:rotate(${n.wind_direction + 180}deg)">↑</span>`;
		return D`<div class="weather">
      <div><small>${e("live.air")}</small><b class="num">${B(r, n.air)}°</b></div>
      <div><small>${e("live.track")}</small><b class="num">${B(r, n.track)}°</b></div>
      <div><small>${e("live.rain")}</small><b>${n.rain ? e("live.wet") : e("live.dry")}</b></div>
      <div><small>${e("live.humidity")}</small><b class="num">${B(r, n.humidity, 0)}%</b></div>
      <div><small>${e("live.wind")}</small><b class="num">${e("live.windSpeed", { n: B(r, n.wind_speed) })} ${i}</b></div>
      <div><small>${e("live.pressure")}</small><b class="num">${B(r, n.pressure, 0)}</b></div>
    </div>`;
	}
	static {
		this.styles = [...$.styles, o`
      .weather { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 8px 16px 12px; }
      .weather div { display: grid; gap: 2px; }
      .weather small { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      .weather b { font-size: 17px; font-weight: 500; }
      .wind { display: inline-block; }
    `];
	}
}, Wt = 6e5, Gt = class extends $ {
	constructor(...e) {
		super(...e), this.failed = !1, this.loading = !1;
	}
	static {
		this.properties = {
			...$.properties,
			page: { state: !0 },
			failed: { state: !0 }
		};
	}
	static getConfigForm() {
		let e = Z();
		return Q([
			{
				name: "title",
				selector: { text: {} }
			},
			{
				name: "kind",
				selector: { select: {
					mode: "dropdown",
					options: ["drivers", "constructors"].map((t) => ({
						value: t,
						label: e(`standings.${t}`)
					}))
				} }
			},
			{
				name: "rows",
				selector: { number: {
					min: 1,
					max: 30,
					mode: "box"
				} }
			}
		]);
	}
	static getStubConfig() {
		return {
			kind: "drivers",
			rows: 10
		};
	}
	defaults() {
		return {
			kind: "drivers",
			rows: 10
		};
	}
	get usesLive() {
		return !1;
	}
	setConfig(e) {
		let t = this.config?.kind;
		super.setConfig(e), t !== void 0 && t !== this.config.kind && (this.page = void 0, this.load());
	}
	connectedCallback() {
		super.connectedCallback(), this.timer = window.setInterval(() => void this.load(), Wt);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this.timer);
	}
	updated() {
		this.hass && !this.page && !this.loading && !this.failed && this.load();
	}
	async load() {
		if (this.hass && !this.loading) {
			this.loading = !0;
			try {
				let e = await K.settings(this.hass);
				this.page = await K.standings(this.hass, e.season, null, String(this.config.kind)), this.failed = !1;
			} catch {
				this.failed = !0;
			} finally {
				this.loading = !1;
			}
		}
	}
	getCardSize() {
		return 1 + Math.ceil(Number(this.config?.rows ?? 10) / 2);
	}
	defaultTitle(e) {
		return e(`standings.${this.config.kind === "constructors" ? "constructors" : "drivers"}`);
	}
	renderBody() {
		return A;
	}
	render() {
		if (!this.config) return A;
		let e = this.t, t = this.config.title === void 0 ? this.defaultTitle(e) : this.config.title, n = this.page, r = (n?.rows ?? []).slice(0, Number(this.config.rows) || 10), i = this.config.kind !== "constructors", a = n ? r.length ? D`${n.round ? D`<div class="empty">${e("standings.after", { n: n.round })}${n.capped ? ` · ${e("spoiler.standingsCap")}` : ""}</div>` : A}
            ${r.map((e) => D`<div class="row"><b class="pos num">${e.position_text ?? e.position ?? ""}</b>
                <span class="bar" style="background:${dt(e.team_id, null)}"></span>
                <span class="name">${i ? e.name ?? e.code : e.team}</span>
                ${i && e.team ? D`<small class="muted">${e.team}</small>` : A}
                <span class="spacer"></span><b class="num">${B(this.hass, e.points, 1)}</b></div>`)}` : D`<div class="empty">${e("standings.empty")}</div>` : D`<div class="state">${this.failed ? e("common.unavailable") : e("common.loading")}</div>`;
		return D`<ha-card>
      ${t ? D`<div class="head"><span>${t}</span></div>` : A}
      <div class="body">${a}</div>
    </ha-card>`;
	}
	static {
		this.styles = [...$.styles, o`
      .pos { width: 22px; text-align: right; }
      .name { font-weight: 500; }
    `];
	}
}, Kt = [
	{
		tag: "pit-lane-tower-card",
		element: Ft,
		key: "tower"
	},
	{
		tag: "pit-lane-map-card",
		element: It,
		key: "map"
	},
	{
		tag: "pit-lane-stewards-card",
		element: Lt,
		key: "stewards"
	},
	{
		tag: "pit-lane-radio-card",
		element: Rt,
		key: "radio"
	},
	{
		tag: "pit-lane-race-control-card",
		element: Vt,
		key: "race_control"
	},
	{
		tag: "pit-lane-session-card",
		element: Ht,
		key: "session"
	},
	{
		tag: "pit-lane-weather-card",
		element: Ut,
		key: "weather"
	},
	{
		tag: "pit-lane-standings-card",
		element: Gt,
		key: "standings"
	}
], qt = "https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#dashboard-cards", Jt = Z(), Yt = window.customCards ??= [];
for (let e of Kt) V(e.tag, e.element), Yt.some((t) => t.type === e.tag) || Yt.push({
	type: e.tag,
	name: `Pit Lane · ${Jt(`cards.${e.key}.name`)}`,
	description: Jt(`cards.${e.key}.description`),
	preview: !0,
	documentationURL: qt
});
V("plb-live-map", ht), V("plb-countdown", qe), V("plb-age", Je);
//#endregion
