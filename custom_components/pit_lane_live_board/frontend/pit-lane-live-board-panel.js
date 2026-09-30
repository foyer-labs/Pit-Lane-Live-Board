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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, ee = h.trustedTypes, te = ee ? ee.emptyScript : "", ne = h.reactiveElementPolyfillSupport, re = (e, t) => e, ie = {
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
}, ae = (e, t) => !l(e, t), oe = {
	attribute: !0,
	type: String,
	converter: ie,
	reflect: !1,
	useDefault: !1,
	hasChanged: ae
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var g = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = oe) {
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
		return this.elementProperties.get(e) ?? oe;
	}
	static _$Ei() {
		if (this.hasOwnProperty(re("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(re("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(re("properties"))) {
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
			let i = (n.converter?.toAttribute === void 0 ? ie : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? ie : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? ae)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
g.elementStyles = [], g.shadowRootOptions = { mode: "open" }, g[re("elementProperties")] = /* @__PURE__ */ new Map(), g[re("finalized")] = /* @__PURE__ */ new Map(), ne?.({ ReactiveElement: g }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var se = globalThis, ce = (e) => e, le = se.trustedTypes, ue = le ? le.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, de = "$lit$", _ = `lit$${Math.random().toFixed(9).slice(2)}$`, fe = "?" + _, pe = `<${fe}>`, v = document, me = () => v.createComment(""), y = (e) => e === null || typeof e != "object" && typeof e != "function", he = Array.isArray, ge = (e) => he(e) || typeof e?.[Symbol.iterator] == "function", _e = "[ 	\n\f\r]", b = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ve = /-->/g, ye = />/g, x = RegExp(`>|${_e}(?:([^\\s"'>=/]+)(${_e}*=${_e}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), be = /'/g, xe = /"/g, Se = /^(?:script|style|textarea|title)$/i, Ce = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), S = Ce(1), C = Ce(2), w = Symbol.for("lit-noChange"), T = Symbol.for("lit-nothing"), we = /* @__PURE__ */ new WeakMap(), E = v.createTreeWalker(v, 129);
function Te(e, t) {
	if (!he(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return ue === void 0 ? t : ue.createHTML(t);
}
var Ee = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = b;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === b ? c[1] === "!--" ? o = ve : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = x) : (Se.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = x) : o = ye : o === x ? c[0] === ">" ? (o = i ?? b, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? x : c[3] === "\"" ? xe : be) : o === xe || o === be ? o = x : o === ve || o === ye ? o = b : (o = x, i = void 0);
		let d = o === x && e[t + 1].startsWith("/>") ? " " : "";
		a += o === b ? n + pe : l >= 0 ? (r.push(s), n.slice(0, l) + de + n.slice(l) + _ + d) : n + _ + (l === -2 ? t : d);
	}
	return [Te(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, De = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Ee(t, n);
		if (this.el = e.createElement(l, r), E.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = E.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(de)) {
					let t = u[o++], n = i.getAttribute(e).split(_), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ae : r[1] === "?" ? je : r[1] === "@" ? Me : O
					}), i.removeAttribute(e);
				} else e.startsWith(_) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (Se.test(i.tagName)) {
					let e = i.textContent.split(_), t = e.length - 1;
					if (t > 0) {
						i.textContent = le ? le.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], me()), E.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], me());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === fe) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(_, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += _.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = v.createElement("template");
		return n.innerHTML = e, n;
	}
};
function D(e, t, n = e, r) {
	if (t === w) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = y(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = D(e, i._$AS(e, t.values), i, r)), t;
}
var Oe = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? v).importNode(t, !0);
		E.currentNode = r;
		let i = E.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new ke(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ne(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = E.nextNode(), a++);
		}
		return E.currentNode = v, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, ke = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = T, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = D(this, e, t), y(e) ? e === T || e == null || e === "" ? (this._$AH !== T && this._$AR(), this._$AH = T) : e !== this._$AH && e !== w && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ge(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== T && y(this._$AH) ? this._$AA.nextSibling.data = e : this.T(v.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = De.createElement(Te(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Oe(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = we.get(e.strings);
		return t === void 0 && we.set(e.strings, t = new De(e)), t;
	}
	k(t) {
		he(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(me()), this.O(me()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ce(e).nextSibling;
			ce(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, O = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = T, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = T;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = D(this, e, t, 0), a = !y(e) || e !== this._$AH && e !== w, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = D(this, r[n + o], t, o), s === w && (s = this._$AH[o]), a ||= !y(s) || s !== this._$AH[o], s === T ? e = T : e !== T && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === T ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ae = class extends O {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === T ? void 0 : e;
	}
}, je = class extends O {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== T);
	}
}, Me = class extends O {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = D(this, e, t, 0) ?? T) === w) return;
		let n = this._$AH, r = e === T && n !== T || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== T && (n === T || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ne = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		D(this, e);
	}
}, Pe = {
	M: de,
	P: _,
	A: fe,
	C: 1,
	L: Ee,
	R: Oe,
	D: ge,
	V: D,
	I: ke,
	H: O,
	N: je,
	U: Me,
	B: Ae,
	F: Ne
}, Fe = se.litHtmlPolyfillSupport;
Fe?.(De, ke), (se.litHtmlVersions ??= []).push("3.3.3");
var Ie = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new ke(t.insertBefore(me(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Le = globalThis, k = class extends g {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ie(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return w;
	}
};
k._$litElement$ = !0, k.finalized = !0, Le.litElementHydrateSupport?.({ LitElement: k });
var Re = Le.litElementPolyfillSupport;
Re?.({ LitElement: k }), (Le.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region node_modules/lit-html/directive.js
var ze = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Be = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Ve = class {
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
}, { I: He } = Pe, Ue = (e) => e, We = (e, t) => t === void 0 ? e?._$litType$ !== void 0 : e?._$litType$ === t, Ge = (e) => e?._$litType$?.h != null, Ke = () => document.createComment(""), A = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new He(r.insertBefore(Ke(), i), r.insertBefore(Ke(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = Ue(e).nextSibling;
				Ue(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, j = (e, t, n = e) => (e._$AI(t, n), e), qe = {}, Je = (e, t = qe) => e._$AH = t, Ye = (e) => e._$AH, Xe = (e) => {
	e._$AR(), e._$AA.remove();
}, Ze = (e) => {
	e._$AR();
}, Qe = (e) => Ge(e) ? e._$litType$.h : e.strings, $e = Be(class extends Ve {
	constructor(e) {
		super(e), this.et = /* @__PURE__ */ new WeakMap();
	}
	render(e) {
		return [e];
	}
	update(e, [t]) {
		let n = We(this.it) ? Qe(this.it) : null, r = We(t) ? Qe(t) : null;
		if (n !== null && (r === null || n !== r)) {
			let t = Ye(e).pop(), r = this.et.get(n);
			r === void 0 && (r = Ie(T, document.createDocumentFragment()), r.setConnected(!1), this.et.set(n, r)), Je(r, [t]), A(r, void 0, t);
		}
		if (r !== null) {
			if (n === null || n !== r) {
				let t = this.et.get(r);
				if (t !== void 0) {
					let n = Ye(t).pop();
					Ze(e), A(e, void 0, n), Je(e, [n]);
				}
			}
			this.it = t;
		} else this.it = void 0;
		return this.render(t);
	}
}), M = "pit_lane_live_board", et = 1e4, tt = 3e3;
async function nt(e, t, n) {
	let r = e.connection, i, a = !1, o, s = 0, c = (e) => {
		if (r.connected !== !1) try {
			Promise.resolve(e?.()).catch(() => void 0);
		} catch {}
	}, l = async () => {
		let e = ++s, o = await r.subscribeMessage((t) => {
			e === s && !a && n(t);
		}, t, { resubscribe: !1 });
		if (a || e !== s) {
			c(o);
			return;
		}
		i = o;
	}, u = () => {
		if (window.clearTimeout(o), o = void 0, a || r.connected === !1) return;
		let e = s + 1;
		l().catch(() => {
			!a && e === s && (o = window.setTimeout(u, et));
		});
	}, d = () => {
		i = void 0, s++, window.clearTimeout(o), a || (o = window.setTimeout(u, tt));
	};
	return await l(), r.addEventListener?.("ready", d), () => {
		a = !0, s++, window.clearTimeout(o), r.removeEventListener?.("ready", d), c(i), i = void 0;
	};
}
var N = {
	settings: (e) => e.callWS({ type: `${M}/settings/get` }),
	setSettings: (e, t) => e.callWS({
		type: `${M}/settings/set`,
		...t
	}),
	setToken: (e, t) => e.callWS({
		type: `${M}/f1tv/set`,
		token: t
	}),
	removeToken: (e) => e.callWS({ type: `${M}/f1tv/remove` }),
	setPanel: (e, t) => e.callWS({
		type: `${M}/panel/set`,
		...t
	}),
	setHousehold: (e, t) => e.callWS({
		type: `${M}/settings/set`,
		...t
	}),
	testSummary: (e) => e.callWS({ type: `${M}/summary/test` }),
	entities: (e) => e.callWS({ type: `${M}/entities` }),
	reveal: (e, t) => e.callWS({
		type: `${M}/spoiler/reveal`,
		session: t
	}),
	seasons: (e) => e.callWS({ type: `${M}/seasons` }),
	calendar: (e, t) => e.callWS({
		type: `${M}/calendar/get`,
		season: t
	}),
	rounds: (e, t) => e.callWS({
		type: `${M}/results/season`,
		season: t
	}),
	detail: (e, t, n, r) => e.callWS({
		type: `${M}/results/detail`,
		season: t,
		round: n,
		tab: r
	}),
	standings: (e, t, n, r) => e.callWS({
		type: `${M}/standings/get`,
		season: t,
		round: n,
		kind: r
	}),
	circuitHistory: (e, t) => e.callWS({
		type: `${M}/circuit/history`,
		circuit_id: t
	}),
	circuitDriver: (e, t, n) => e.callWS({
		type: `${M}/circuit/driver`,
		circuit_id: t,
		driver_id: n
	}),
	subscribeSettings: (e, t) => nt(e, { type: `${M}/settings/subscribe` }, t),
	subscribeLive: (e, t) => nt(e, { type: `${M}/live/subscribe` }, t),
	subscribeMap: (e, t) => nt(e, { type: `${M}/map/subscribe` }, t)
}, rt = document.querySelector("home-assistant") && !customElements.get("home-assistant") ? customElements.whenDefined("home-assistant") : Promise.resolve();
function P(e, t) {
	rt.then(() => {
		customElements.get(e) || customElements.define(e, t);
	});
}
var it = {
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
		gridShort: "G",
		status: {
			finished: "Finished",
			lapped: "Lapped",
			retired: "Retired",
			disqualified: "Disqualified",
			did_not_start: "Did not start",
			did_not_qualify: "Did not qualify",
			did_not_prequalify: "Did not pre-qualify",
			withdrew: "Withdrew",
			not_classified: "Not classified",
			excluded: "Excluded",
			accident: "Accident",
			collision: "Collision",
			engine: "Engine",
			gearbox: "Gearbox",
			transmission: "Transmission",
			hydraulics: "Hydraulics",
			brakes: "Brakes",
			suspension: "Suspension",
			electrical: "Electrical",
			power_unit: "Power Unit",
			spun_off: "Spun off",
			puncture: "Puncture",
			overheating: "Overheating",
			fuel_pressure: "Fuel pressure",
			oil_leak: "Oil leak",
			water_leak: "Water leak",
			wheel: "Wheel",
			tyre: "Tyre",
			damage: "Damage",
			mechanical: "Mechanical",
			illness: "Illness"
		},
		lapsDownOne: "+{n} lap",
		lapsDown: "+{n} laps",
		best: "Best",
		teammateDashed: "Dashed: the second driver of a team.",
		startEnd: "{start} → {end}",
		range: "min {min} · max {max}",
		dry: "Dry",
		wet: "Rain during the session",
		open: "Open the round",
		usedFaded: "A faded bar is a used set."
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
		nextShort: "Next",
		leader: "Leader",
		lappedOne: "+{n} lap",
		lapped: "+{n} laps",
		pausedHelp: "Nothing connects to F1 and nothing live is written to disk."
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
		adminPanelHelp: "Off (the default): every user of the house sees Live Board. On: only administrators do. The cards follow the visibility of the dashboard they are on.",
		pauseShort: "Pause",
		startShort: "Start"
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
			hide_title: "Hide the title"
		},
		startFailed: "Could not start live timing. Try again in a moment.",
		backWith: "Back with {session}, {time}"
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
		testHidden: "Not sent: no-spoiler mode hides the Live page.",
		format: "Content",
		compact: "Compact",
		full: "Full",
		compactHelp: "Podium, fastest lap, retirements, penalties and your drivers.",
		fullHelp: "The same, then the whole classification with every driver's time: gap and best lap in a race, best lap and gap in qualifying and practice.",
		add: "Add",
		remove: "Remove",
		placeholder: "Type a notify service…",
		none: "No service chosen yet.",
		missing: "not found"
	},
	kiosk: {
		enter: "Full screen",
		leave: "Leave full screen",
		title: "Dedicated screen",
		help: "For a TV, a monitor with a Raspberry Pi or a wall tablet: this address opens the panel on the whole screen, over Home Assistant's sidebar, with the pointer hidden when it rests. On a Raspberry Pi: chromium --kiosk followed by the address. The ⛶ button in the header does the same for a moment.",
		copy: "Copy",
		options: "Add &page=calendar to open another page, &scale=1.3 to make everything bigger on a TV.",
		small: "For a small screen (an ESP32 with ESPHome, e-paper): enable the “Small screen” sensor. It carries the state of the Live page and short fields ready to print: lap, track status and its colour, the top ten as rows, your drivers, the next session. The guide has an ESPHome example."
	},
	circuit: {
		link: "Circuit history",
		title: "Circuit history",
		back: "Back",
		seasons: "Seasons {first}–{last}",
		seasonOne: "Season {n}",
		explain: "Affinity index: 50 = as the car that year; higher = the circuit suits the driver, lower = it does not.",
		how: "How it is computed",
		howText: "For every year a driver raced here, the car's level is the team's place in that season's constructors' championship, two cars per team: first place expects P1.5, fifth P9.5. The race counts for 60% and qualifying for 40%: places gained or lost on that level. A retirement counts only when it is the driver's doing (an accident, a collision, a spin, a disqualification); mechanical failures are left out. Recent years weigh more: each year back counts 15% less. The index is 50 plus 5 points for every place better than the car, from 0 to 100; with few races it is pulled towards 50 (one race keeps a third of the distance, eight keep 80%), so one good afternoon does not top the list. Years with no constructors' championship (before 1958) do not count.",
		index: "Index",
		races: "Races",
		racesHelp: "Races counted in the index / races here",
		wins: "Wins",
		podiums: "Podiums",
		poles: "Poles",
		best: "Best",
		avgFinish: "Avg finish",
		avgQuali: "Avg quali",
		never: "Never raced here",
		noIndex: "No race counted",
		empty: "No history for this circuit.",
		noYears: "No race here.",
		open: "Show {driver}'s years here",
		season: "Season",
		quali: "Quali",
		grid: "Grid",
		finish: "Finish",
		fastest: "Fastest lap",
		outcome: "Outcome",
		expected: "vs car",
		penalties: "Penalties",
		dnfDriver: "DNF · driver",
		dnfMechanical: "DNF · mechanical",
		notCounted: "not counted",
		gridPenalty: "Grid worse than qualifying: a penalty or a pit-lane start",
		penaltiesNone: "none",
		penaltiesUnknown: "Not available: before 2018, or no detail in F1's archive",
		onLap: "lap {n}",
		expectedHelp: "The car's level that year and the places gained (▲) or lost (▼) on it in the race; Q is qualifying.",
		weight: "Weight {n}",
		legend: "▼ next to the grid: worse than qualifying (a penalty or a pit-lane start). vs car: the car's expected place and the places gained (▲) or lost (▼) on it; Q is qualifying. Penalties from 2018; — when F1's archive has no detail.",
		fastestRank: "#{n}",
		q: "Q",
		pitLane: "Pit lane"
	}
}, at = {
	en: it,
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
			gridShort: "G",
			status: {
				finished: "Arrivato",
				lapped: "Doppiato",
				retired: "Ritirato",
				disqualified: "Squalificato",
				did_not_start: "Non partito",
				did_not_qualify: "Non qualificato",
				did_not_prequalify: "Non prequalificato",
				withdrew: "Ritirato prima del via",
				not_classified: "Non classificato",
				excluded: "Escluso",
				accident: "Incidente",
				collision: "Collisione",
				engine: "Motore",
				gearbox: "Cambio",
				transmission: "Trasmissione",
				hydraulics: "Idraulica",
				brakes: "Freni",
				suspension: "Sospensioni",
				electrical: "Impianto elettrico",
				power_unit: "Power unit",
				spun_off: "Testacoda",
				puncture: "Foratura",
				overheating: "Surriscaldamento",
				fuel_pressure: "Pressione carburante",
				oil_leak: "Perdita d'olio",
				water_leak: "Perdita d'acqua",
				wheel: "Ruota",
				tyre: "Pneumatico",
				damage: "Danni",
				mechanical: "Guasto meccanico",
				illness: "Malore"
			},
			lapsDownOne: "+{n} giro",
			lapsDown: "+{n} giri",
			best: "Migliore",
			teammateDashed: "Tratteggiato: il secondo pilota di una squadra.",
			startEnd: "{start} → {end}",
			range: "min {min} · max {max}",
			dry: "Asciutto",
			wet: "Pioggia durante la sessione",
			open: "Apri la gara",
			usedFaded: "Una barra sbiadita è un treno usato."
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
			nextShort: "Prossima",
			leader: "Leader",
			lappedOne: "+{n} giro",
			lapped: "+{n} giri",
			pausedHelp: "Niente si collega a F1 e niente di live viene scritto su disco."
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
			adminPanelHelp: "Spento (predefinito): tutti gli utenti di casa vedono Live Board. Acceso: solo gli amministratori. Le card seguono la visibilità della plancia in cui si trovano.",
			pauseShort: "Metti in pausa",
			startShort: "Avvia"
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
				hide_title: "Nascondi il titolo"
			},
			startFailed: "Non è stato possibile avviare i tempi live. Riprova tra poco.",
			backWith: "Torna con {session}, {time}"
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
			testHidden: "Non inviato: la modalità senza spoiler nasconde la pagina Live.",
			format: "Contenuto",
			compact: "Compatto",
			full: "Esteso",
			compactHelp: "Podio, giro veloce, ritirati, penalità e i tuoi piloti.",
			fullHelp: "Lo stesso, poi la classifica completa con il tempo di ogni pilota: distacco e giro migliore in gara, giro migliore e distacco in qualifica e nelle libere.",
			add: "Aggiungi",
			remove: "Rimuovi",
			placeholder: "Scrivi un servizio di notifica…",
			none: "Nessun servizio scelto.",
			missing: "non trovato"
		},
		kiosk: {
			enter: "Schermo intero",
			leave: "Esci dallo schermo intero",
			title: "Schermo dedicato",
			help: "Per una TV, un monitor con un Raspberry Pi o un tablet a parete: questo indirizzo apre il pannello a tutto schermo, sopra la barra laterale di Home Assistant, con il puntatore nascosto quando è fermo. Su un Raspberry Pi: chromium --kiosk seguito dall'indirizzo. Il pulsante ⛶ in alto fa lo stesso al momento.",
			copy: "Copia",
			options: "Aggiungi &page=calendar per aprire un'altra pagina, &scale=1.3 per ingrandire tutto su una TV.",
			small: "Per uno schermo piccolo (un ESP32 con ESPHome, un e-paper): attiva il sensore «Schermo piccolo». Contiene lo stato della pagina Live e campi brevi pronti da stampare: giro, stato della pista e il suo colore, i primi dieci come righe, i tuoi piloti, la prossima sessione. La guida ha un esempio ESPHome."
		},
		circuit: {
			link: "Storico del circuito",
			title: "Storico del circuito",
			back: "Indietro",
			seasons: "Stagioni {first}–{last}",
			seasonOne: "Stagione {n}",
			explain: "Indice di affinità: 50 = come la macchina di quell'anno; più alto = il circuito si addice al pilota, più basso = no.",
			how: "Come si calcola",
			howText: "Per ogni anno in cui il pilota ha corso qui, il livello della macchina è il posto della squadra nel campionato costruttori di quella stagione, con due macchine per squadra: la prima si aspetta P1,5, la quinta P9,5. La gara conta per il 60% e la qualifica per il 40%: le posizioni guadagnate o perse rispetto a quel livello. Un ritiro conta solo quando è colpa del pilota (incidente, collisione, testacoda, squalifica); i guasti meccanici restano fuori. Gli anni recenti pesano di più: ogni anno indietro conta il 15% in meno. L'indice è 50 più 5 punti per ogni posizione meglio della macchina, da 0 a 100; con poche gare viene avvicinato a 50 (una gara ne tiene un terzo, otto l'80%), così un pomeriggio fortunato non finisce in cima. Gli anni senza campionato costruttori (prima del 1958) non contano.",
			index: "Indice",
			races: "Gare",
			racesHelp: "Gare contate nell'indice / gare corse qui",
			wins: "Vittorie",
			podiums: "Podi",
			poles: "Pole",
			best: "Migliore",
			avgFinish: "Arrivo medio",
			avgQuali: "Qualifica media",
			never: "Mai corso qui",
			noIndex: "Nessuna gara contata",
			empty: "Nessuno storico per questo circuito.",
			noYears: "Nessuna gara qui.",
			open: "Mostra gli anni di {driver} qui",
			season: "Stagione",
			quali: "Qualifica",
			grid: "Griglia",
			finish: "Arrivo",
			fastest: "Giro veloce",
			outcome: "Esito",
			expected: "vs macchina",
			penalties: "Penalità",
			dnfDriver: "Ritiro · pilota",
			dnfMechanical: "Ritiro · guasto",
			notCounted: "non contata",
			gridPenalty: "Griglia peggiore della qualifica: una penalità o la partenza dalla pit lane",
			penaltiesNone: "nessuna",
			penaltiesUnknown: "Non disponibili: prima del 2018, o nessun dettaglio nell'archivio della F1",
			onLap: "giro {n}",
			expectedHelp: "Il livello della macchina quell'anno e le posizioni guadagnate (▲) o perse (▼) in gara; Q è la qualifica.",
			weight: "Peso {n}",
			legend: "▼ accanto alla griglia: peggiore della qualifica (una penalità o la partenza dalla pit lane). vs macchina: il posto atteso della macchina e le posizioni guadagnate (▲) o perse (▼) rispetto a quello; Q è la qualifica. Penalità dal 2018; — quando l'archivio della F1 non ha il dettaglio.",
			fastestRank: "#{n}",
			q: "Q",
			pitLane: "Pit lane"
		}
	}
};
function ot(e) {
	return (e?.locale?.language ?? e?.language ?? "en").toLowerCase().startsWith("it") ? "it" : "en";
}
function st(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n) return;
		n = n[e];
	}
	return typeof n == "string" ? n : void 0;
}
var ct = {
	en: /* @__PURE__ */ new Map(),
	it: /* @__PURE__ */ new Map()
};
function F(e) {
	let t = ot(e), n = at[t], r = ct[t];
	return (e, t) => {
		let i = r.get(e);
		i === void 0 && (i = st(n, e) ?? st(it, e) ?? e, r.set(e, i));
		for (let [e, n] of Object.entries(t ?? {})) i = i.replaceAll(`{${e}}`, String(n));
		return i;
	};
}
//#endregion
//#region src/icons.ts
var I = {
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
	history: "M13.5 8H12v5l4.28 2.54.72-1.21-3.5-2.08zM13 3a9 9 0 0 0-9 9H1l3.96 4.03L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.9 8.9 0 0 0 13 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9",
	back: "M20 11v2H8l5.5 5.5-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5 8 11z",
	fullscreen: "M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zm3 9h2v5h-5v-2h3zm-7 3v2H5v-5h2v3z",
	exitFullscreen: "M14 14h5v2h-3v3h-2zm-9 0h5v5H8v-3H5zm3-9h2v5H5V8h3zm6 0h2v3h3v2h-5z",
	cog: "M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.51.51 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64z"
}, L = (e, t = 20) => C`<svg viewBox="0 0 24 24" width=${t} height=${t} fill="currentColor" aria-hidden="true"><path d=${e}></path></svg>`, R = o`
  :host {
    --plb-purple: #a24bdb;
    --plb-green: #1fa855;
    --plb-yellow: #e0b000;
    --plb-soft: #e8333a;
    --plb-medium: #f2c200;
    /* White on a light page, a softer grey on a dark one (pure white glares). */
    --plb-hard: color-mix(in srgb, #ffffff 82%, var(--primary-background-color, #fafafa));
    --plb-intermediate: #3aa845;
    --plb-wet: #2f7de1;
    --plb-unknown: #8a8a8a;
    /* Text in the timing colours: mixed with the theme's text colour, so they
       darken on a light theme and lighten on a dark one, and read at 4.5:1 or
       better on both (the plain colours are 3.1:1 and 3.7:1). */
    --plb-purple-text: color-mix(in srgb, var(--plb-purple) 65%, var(--primary-text-color));
    --plb-green-text: color-mix(in srgb, var(--plb-green) 65%, var(--primary-text-color));
    --plb-yellow-text: color-mix(in srgb, var(--plb-yellow) 50%, var(--primary-text-color));
    /* The theme's accent as text on its own tint (a selected tab or chip). */
    --plb-primary-text: color-mix(in srgb, var(--primary-color) 55%, var(--primary-text-color));
    --plb-row-alt: color-mix(in srgb, var(--primary-text-color) 3%, transparent);
    --plb-muted: color-mix(in srgb, var(--primary-text-color) 65%, transparent);
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
    border-color: transparent; color: var(--plb-primary-text);
  }
  .chip.small { height: 26px; font-size: 12px; padding: 0 10px; }
  .tab {
    border: 0; background: none; color: var(--secondary-text-color);
    font: inherit; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;
    padding: 8px 14px; border-radius: 18px; cursor: pointer; white-space: nowrap;
  }
  .tab.active { color: var(--plb-primary-text); background: color-mix(in srgb, var(--primary-color) 14%, transparent); }
  .btn {
    height: 36px; padding: 0 16px; border-radius: 18px; border: 0;
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    font: inherit; font-weight: 500; cursor: pointer;
  }
  .btn.flat { background: none; color: var(--plb-primary-text); border: 1px solid var(--divider-color); }
  .btn.flat.danger { color: var(--error-color, #db4437); border-color: color-mix(in srgb, var(--error-color, #db4437) 50%, transparent); }
  /* Disabled: a neutral grey, not a faded accent with grey text on it. */
  .btn:disabled { background: var(--secondary-background-color); color: var(--secondary-text-color); cursor: default; opacity: 1; }
  .btn.flat:disabled { background: none; }
  .link { border: 0; background: none; color: var(--plb-primary-text); font: inherit; cursor: pointer; padding: 0; }
  .bar { display: inline-block; width: 4px; height: 20px; border-radius: 2px; flex: none; }
  .drv { display: inline-flex; align-items: center; gap: 8px; }
  .tla { font-weight: 600; letter-spacing: 0.03em; }
  .gained { font-size: 11px; font-weight: 600; }
  .up { color: var(--plb-green-text); }
  .down { color: var(--error-color, #db4437); }
  .t.pb { color: var(--plb-green-text); font-weight: 600; }
  .t.ob { color: var(--plb-purple-text); font-weight: 600; }
  .t.prev { color: var(--plb-muted); }
  .tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
  .tbl td, .tbl th { padding: 8px 12px; border-bottom: 1px solid var(--divider-color); text-align: left; white-space: nowrap; }
  .tbl th { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
  .tbl .r { text-align: right; }
  .tbl tr.click { cursor: pointer; }
  .tbl tr.click:hover td { background: var(--plb-row-alt); }
  .scroll { overflow-x: auto; }
  /* A table wider than its card fades at the edge that has more, so the columns
     behind the scroll are not a secret (where the browser has scroll timelines). */
  @supports (animation-timeline: scroll()) {
    .scroll { animation: plb-more-x linear both; animation-timeline: scroll(self inline); }
  }
  @keyframes plb-more-x {
    0%, 97% { mask-image: linear-gradient(to right, #000 calc(100% - 48px), transparent); }
    100% { mask-image: none; }
  }
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
  @container (max-width: 640px) {
    .tbl td, .tbl th { padding: 8px 8px; }
  }
  /* Fingers: 40 px targets at least. */
  @media (pointer: coarse) {
    .chip { height: 40px; }
    .chip.small { height: 36px; }
    .tab { min-height: 40px; }
    .btn { height: 40px; }
    .link { min-height: 40px; }
    select { height: 40px; }
  }
`, lt = o`
  @supports (animation-timeline: scroll()) {
    .feed { animation: plb-more-y linear both; animation-timeline: scroll(self block); }
  }
  @keyframes plb-more-y {
    0%, 97% { mask-image: linear-gradient(to bottom, #000 calc(100% - 56px), transparent); }
    100% { mask-image: none; }
  }
`, z = {
	soft: "--plb-soft",
	medium: "--plb-medium",
	hard: "--plb-hard",
	intermediate: "--plb-intermediate",
	wet: "--plb-wet",
	unknown: "--plb-unknown"
}, ut = {
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
}, dt = [
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
function B(e, t) {
	if (t) return t;
	if (e && ut[e]) return ut[e];
	let n = 0;
	for (let t of e ?? "") n = n * 31 + t.charCodeAt(0) >>> 0;
	return dt[n % dt.length];
}
//#endregion
//#region src/timeprefs.ts
var ft = "pit_lane_live_board_time", V = "plb-time-prefs", H = {
	zone: "home_assistant",
	both: !1
}, pt;
function mt() {
	return H;
}
function ht(e) {
	return pt ??= e.callWS({
		type: "frontend/get_user_data",
		key: ft
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
	}).catch(() => H), pt;
}
async function gt(e, t) {
	let n = H;
	H = t, window.dispatchEvent(new Event(V));
	try {
		await e.callWS({
			type: "frontend/set_user_data",
			key: ft,
			value: t
		});
	} catch (e) {
		throw H = n, window.dispatchEvent(new Event(V)), e;
	}
}
//#endregion
//#region src/format.ts
function U(e) {
	return ot(e) === "it" ? "it-IT" : "en-GB";
}
var _t = /* @__PURE__ */ new Map(), vt = /* @__PURE__ */ new Map(), yt = {
	day: {
		weekday: "short",
		day: "numeric",
		month: "short"
	},
	weekdayTime: {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit"
	},
	date: {
		day: "numeric",
		month: "short",
		year: "numeric"
	},
	dayMonth: {
		day: "numeric",
		month: "short"
	},
	clock: {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	},
	clockShort: {
		hour: "2-digit",
		minute: "2-digit"
	}
};
function W(e, t, n) {
	let r = `${U(e)}|${t}|${n}`, i = _t.get(r);
	return i || (i = new Intl.DateTimeFormat(U(e), {
		...yt[t],
		timeZone: n
	}), _t.set(r, i)), i;
}
function bt(e, t, n = !1) {
	let r = `${U(e)}|${t}|${n}`, i = vt.get(r);
	return i || (i = new Intl.NumberFormat(U(e), {
		maximumFractionDigits: t,
		...n ? { minimumFractionDigits: t } : {}
	}), vt.set(r, i)), i;
}
function xt() {
	return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
function St(e) {
	return e.locale?.time_zone === "local" ? xt() : e.config.time_zone;
}
function G(e, t) {
	let n = mt().zone;
	return n === "circuit" && t ? t : n === "device" ? xt() : St(e);
}
function Ct(e, t, n, r) {
	return t ? W(e, "weekdayTime", G(e, r)).format(new Date(t)) : W(e, "day", "UTC").format(/* @__PURE__ */ new Date(`${n}T12:00:00Z`));
}
function wt(e, t, n) {
	if (!t || !n || !mt().both) return null;
	let r = G(e, n), i = r === n ? St(e) : n;
	if (i === r) return null;
	let a = (n) => W(e, "weekdayTime", n).format(new Date(t)), o = a(i);
	return o === a(r) ? null : {
		time: o,
		local: i === n
	};
}
function Tt(e, t) {
	if (!t) return "";
	let n = t.length === 10, r = n ? /* @__PURE__ */ new Date(`${t}T12:00:00Z`) : new Date(t);
	return W(e, "date", n ? "UTC" : G(e)).format(r);
}
function Et(e, t, n) {
	let r = W(e, "dayMonth", "UTC"), i = /* @__PURE__ */ new Date(`${t}T12:00:00Z`), a = /* @__PURE__ */ new Date(`${n}T12:00:00Z`);
	return i.getUTCMonth() === a.getUTCMonth() ? `${i.getUTCDate()}–${r.format(a)}` : `${r.format(i)} – ${r.format(a)}`;
}
function Dt(e) {
	return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(e) ? e : `${e}Z`);
}
var Ot = /* @__PURE__ */ new Map(), kt = "";
function K(e, t, n = !1) {
	if (!t) return "";
	let r = G(e), i = `${U(e)}|${r}`;
	(i !== kt || Ot.size > 2e3) && (Ot.clear(), kt = i);
	let a = n ? `s${t}` : t, o = Ot.get(a);
	return o === void 0 && (o = W(e, n ? "clockShort" : "clock", r).format(Dt(t)), Ot.set(a, o)), o;
}
function At(e, t) {
	return t ? W(e, "weekdayTime", G(e)).format(Dt(t)) : "";
}
function jt(e) {
	let t = Math.max(0, Math.floor(e / 1e3)), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60), a = t % 60, o = (e) => String(e).padStart(2, "0");
	return n ? `${n} d ${o(r)} h ${o(i)} m` : r ? `${r} h ${o(i)} m` : `${o(i)} m ${o(a)} s`;
}
function Mt(e) {
	if (e === null) return "";
	let t = Math.max(0, Math.round(e)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = t % 60, a = (e) => String(e).padStart(2, "0");
	return n ? `${n}:${a(r)}:${a(i)}` : `${a(r)}:${a(i)}`;
}
function q(e, t, n = 1) {
	return t == null ? "—" : bt(e, n).format(t);
}
function J(e, t, n = 1) {
	return t == null ? "—" : bt(e, n, !0).format(t);
}
function Nt(e, t) {
	return !t || !e || e.language !== t.language || e.locale?.language !== t.locale?.language || e.config?.time_zone !== t.config?.time_zone || e.user?.is_admin !== t.user?.is_admin;
}
//#endregion
//#region src/parts.ts
function Pt(e) {
	return e ? `${e.no_spoiler}|${e.revealed.join(",")}` : "";
}
function Ft(e, t, n = !1) {
	if (!t) return "";
	if (/^LAP\s*\d+$/i.test(t)) return n ? "" : e("live.leader");
	let r = /^\+?(\d+)\s*L(?:APS?)?$/i.exec(t);
	return r ? e(r[1] === "1" ? "live.lappedOne" : "live.lapped", { n: r[1] }) : t;
}
function It(e, t, n) {
	let r = /(\d)\s*$/.exec(n ?? "")?.[1], i = t === "practice" && r ? `sessions.practice_${r}` : t ? `sessions.${t}` : "", a = i && e(i);
	return a && a !== i ? a : n ?? "";
}
function Lt(e) {
	return (t) => {
		(t.key === "Enter" || t.key === " ") && (t.preventDefault(), e());
	};
}
function Rt(e, t, n, r) {
	let i = t === "unknown" ? "?" : t[0].toUpperCase();
	return S`<span class="tyre" title=${e(`tyres.${t}`)}>
    <span class="tyre-dot" style="--c:var(${z[t] ?? z.unknown})">${i}</span>
    ${r === null ? T : S`<small class="num">${r}</small>`}
    ${n === !1 ? S`<span class="used">${e("live.used")}</span>` : T}
  </span>`;
}
function zt(e, t = !0) {
	return e == null ? T : e > 0 ? S`<span class="gained up">▲${e}</span>` : e < 0 ? S`<span class="gained down">▼${-e}</span>` : t ? S`<span class="gained muted">–</span>` : T;
}
function Y(e, t, n) {
	return S`<span class="drv"
    ><span class="bar" style="background:${B(t, n)}"></span>${e ?? "—"}</span
  >`;
}
function Bt(e, t, n, r) {
	let i = wt(t, n, r);
	return i ? S`<small class="also">${e(i.local ? "time.atTrack" : "time.yours", { time: i.time })}</small>` : T;
}
function Vt(e) {
	return !e?.length || e.every((e) => !e) ? T : S`<span class="seg" aria-hidden="true">${e.map((e) => S`<i class=${e}></i>`)}</span>`;
}
function Ht(e) {
	return S`<div class="card loading">${e("common.loading")}</div>`;
}
function X(e, t) {
	return S`<div class="card error">
    <div>${e("common.unavailable")}</div>
    <button class="btn flat" @click=${t}>${e("common.retry")}</button>
  </div>`;
}
//#endregion
//#region src/clock.ts
var Ut = class extends k {
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
		return Number.isFinite(e) ? jt(e - this.now) : "";
	}
	static {
		this.styles = o`
    :host { font-variant-numeric: tabular-nums; }
  `;
	}
}, Wt = class extends k {
	constructor(...e) {
		super(...e), this.age = 0, this.at = Date.now(), this.precise = !0, this.now = Date.now();
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: Nt
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
		return F(this.hass)("live.updated", { n: q(this.hass, e, +!!this.precise) });
	}
	static {
		this.styles = o`
    :host { font-variant-numeric: tabular-nums; }
  `;
	}
};
function Gt(e, t, n, r) {
	return S`<plb-age .hass=${e} .age=${t} .at=${n} ?precise=${r}></plb-age>`;
}
//#endregion
//#region src/pages/calendar.ts
var Kt = 6e5, qt = class extends k {
	constructor(...e) {
		super(...e), this.seasons = [], this.failed = !1, this.now = Date.now(), this.clock = 0, this.request = 0, this.spoilers = "", this.loadedAt = 0, this.scrolled = !1, this.visibility = () => {
			document.visibilityState === "visible" && this.tick();
		};
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			seasons: { attribute: !1 },
			season: { state: !0 },
			data: { state: !0 },
			failed: { state: !0 },
			now: { state: !0 },
			clock: { attribute: !1 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.timer = window.setInterval(() => this.tick(), 3e4), document.addEventListener("visibilitychange", this.visibility), this.data && this.tick();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this.timer), document.removeEventListener("visibilitychange", this.visibility);
	}
	tick() {
		this.now = Date.now(), this.data && document.visibilityState !== "hidden" && (this.data.meetings.some((e) => e.sessions.some((e) => {
			let t = e.start ? Date.parse(e.start) : NaN;
			return t > this.loadedAt && t <= this.now;
		})) || this.now - this.loadedAt > Kt) && this.load();
	}
	willUpdate(e) {
		this.season === void 0 && this.settings && (this.season = this.settings.season);
		let t = Pt(this.settings);
		(e.has("season") || t !== this.spoilers) && (this.spoilers = t, this.load());
	}
	async load() {
		if (!this.hass || this.season === void 0) return;
		let e = ++this.request, t = !!this.data && this.data.season === this.season;
		t || (this.failed = !1);
		try {
			let t = await N.calendar(this.hass, this.season);
			e === this.request && (this.data = t, this.failed = !1, this.loadedAt = Date.now());
		} catch {
			e === this.request && !t ? this.failed = !0 : e === this.request && (this.loadedAt = Date.now() - Kt + 6e4);
		}
	}
	updated() {
		!this.scrolled && this.data && this.data.season === this.settings?.season && (this.scrolled = !0, !(this.getBoundingClientRect().width > 640) && this.renderRoot.querySelector(".meet.live, .meet.next")?.scrollIntoView({ block: "start" }));
	}
	render() {
		let e = F(this.hass), t = this.seasons.length ? this.seasons : [this.season ?? 0];
		return S`
      <div class="toolbar">
        <h1>${e("calendar.title")}</h1>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.data = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => S`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
      </div>
      ${this.failed ? X(e, () => this.load()) : !this.data || this.data.season !== this.season ? Ht(e) : this.data.meetings.length ? S`<div class="cal">${this.data.meetings.map((e) => this.renderMeeting(e))}</div>` : S`<div class="card state">${e("calendar.empty")}</div>`}
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
		let t = F(this.hass), n = e.sessions[0]?.date, r = e.sessions[e.sessions.length - 1]?.date, i = e.state === "next" ? e.sessions.find((e) => e.start && Date.parse(e.start) > this.now) : void 0;
		return S`<div class="card meet ${e.state}">
      <div class="meet-head"><span class="round">${t("calendar.round", { n: e.round })}</span><h3>${e.name}</h3></div>
      <div class="where">${[e.locality, e.country].filter(Boolean).join(" · ")}${n && r ? ` · ${Et(this.hass, n, r)}` : ""}</div>
      ${e.sprint || e.state === "next" || e.state === "live" ? S`<div class="flagline">
            ${e.sprint ? S`<span class="pill sprint">${t("common.sprint")}</span>` : T}
            ${e.state === "next" ? S`<span class="pill">${t("calendar.next")}</span>` : T}
            ${e.state === "live" ? S`<span class="pill live">${t("calendar.live")}</span>` : T}
          </div>` : T}
      ${e.state === "done" ? S`<div class="podium">
              ${e.podium_hidden ? S`<div class="hidden-cell">${t("spoiler.hiddenRound")}</div>` : (e.podium ?? []).map((e, t) => S`<div><b>${t + 1}</b>${Y(e.name, e.team_id)}</div>`)}
            </div>` : S`<ul>
            ${e.sessions.map((n) => S`<li><span>${t(`sessions.${n.kind}`)}</span><span class="num">${Ct(this.hass, n.start, n.date, e.timezone)}${Bt(t, this.hass, n.start, e.timezone)}</span></li>`)}
          </ul>`}
      ${i?.start ? S`<div class="countdown">${t(`sessions.${i.kind}`)} · ${t("calendar.startsIn")}
            <b class="num">${jt(Date.parse(i.start) - this.now)}</b></div>` : T}
      <div class="actions">
        ${e.state === "done" ? S`<button class="link" @click=${() => this.go({
			page: "results",
			season: e.season,
			round: e.round
		})}>
              ${t("calendar.results")} →</button>` : T}
        ${e.state === "live" ? S`<button class="link" @click=${() => this.go({ page: "live" })}>${t("calendar.watch")} →</button>` : T}
        ${e.circuit_id ? S`<button class="link history" @click=${() => this.go({
			page: "circuit",
			circuit_id: e.circuit_id,
			circuit: e.circuit ?? e.name,
			from: "calendar"
		})}>
              ${L(I.history, 16)}${t("circuit.link")}</button>` : T}
      </div>
    </div>`;
	}
	static {
		this.styles = [R, o`
      :host { display: block; }
      :host { container-type: inline-size; }
      .cal { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--plb-gap); align-items: stretch; }
      .meet { display: flex; flex-direction: column; scroll-margin-top: 120px; }
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
      /* The card's links, at its foot whatever its height. */
      .actions { margin-top: auto; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 20px; padding: 0 16px 14px; font-size: 13px; }
      .actions:empty { display: none; }
      .actions .link { font-size: 13px; }
      .history { display: inline-flex; align-items: center; gap: 6px; }
      @container (max-width: 640px) {
        .cal { grid-template-columns: 1fr; }
        li span:first-child { width: 130px; }
      }
    `];
	}
}, Jt = /* @__PURE__ */ new Set([
	"strategy",
	"lap_times",
	"race_control",
	"weather"
]), Yt = {
	finished: "finished",
	lapped: "lapped",
	retired: "retired",
	disqualified: "disqualified",
	"did not start": "did_not_start",
	"did not qualify": "did_not_qualify",
	"did not prequalify": "did_not_prequalify",
	withdrew: "withdrew",
	"not classified": "not_classified",
	excluded: "excluded",
	accident: "accident",
	collision: "collision",
	engine: "engine",
	gearbox: "gearbox",
	transmission: "transmission",
	hydraulics: "hydraulics",
	brakes: "brakes",
	suspension: "suspension",
	electrical: "electrical",
	"power unit": "power_unit",
	"spun off": "spun_off",
	puncture: "puncture",
	overheating: "overheating",
	"fuel pressure": "fuel_pressure",
	"oil leak": "oil_leak",
	"water leak": "water_leak",
	wheel: "wheel",
	tyre: "tyre",
	damage: "damage",
	mechanical: "mechanical",
	illness: "illness"
};
function Xt(e, t) {
	if (!t) return "";
	let n = /^\+(\d+) Laps?$/i.exec(t);
	if (n) return e(n[1] === "1" ? "results.lapsDownOne" : "results.lapsDown", { n: n[1] });
	let r = Yt[t.toLowerCase()];
	return r ? e(`results.status.${r}`) : t;
}
var Zt = class extends k {
	constructor(...e) {
		super(...e), this.seasons = [], this.clock = 0, this.failed = !1, this.tab = "race", this.tabFailed = !1, this.driver = "", this.filter = "all", this.highlight = "", this.request = 0, this.roundsRequest = 0, this.spoilers = "", this.roundsBySeason = /* @__PURE__ */ new Map(), this.tabs = /* @__PURE__ */ new Map();
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			seasons: { attribute: !1 },
			clock: { attribute: !1 },
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
		let t = Pt(this.settings), n = t !== this.spoilers;
		this.spoilers = t, n && (this.roundsBySeason.clear(), this.tabs.clear()), (e.has("season") || n || e.has("target") && this.wanted !== void 0) && this.loadRounds(), this.selected && (n || e.has("tab") || e.has("selected")) && this.loadTab();
	}
	async loadRounds() {
		if (!this.hass || this.season === void 0) return;
		let e = ++this.roundsRequest;
		this.failed = !1;
		try {
			let t = this.season, n = this.roundsBySeason.get(t) ?? (await N.rounds(this.hass, t)).rounds;
			if (e !== this.roundsRequest) return;
			this.roundsBySeason.set(t, n), this.rounds = n;
			let r = this.wanted === void 0 ? void 0 : n.find((e) => e.round === this.wanted);
			this.wanted = void 0, r && this.open(r);
		} catch {
			e === this.roundsRequest && (this.failed = !0);
		}
	}
	async loadTab() {
		if (!this.selected || this.season === void 0) return;
		let e = ++this.request, t = `${this.season}|${this.selected.round}|${this.tab}`;
		this.tabFailed = !1;
		let n = this.tabs.get(t);
		if (n) {
			this.result = n;
			return;
		}
		this.result?.tab !== this.tab && (this.result = void 0);
		try {
			let n = await N.detail(this.hass, this.season, this.selected.round, this.tab);
			n.hidden || this.tabs.set(t, n), e === this.request && (this.result = n);
		} catch {
			e === this.request && (this.tabFailed = !0);
		}
	}
	get gridLabel() {
		return F(this.hass)("results.gridShort");
	}
	tyreName(e) {
		return F(this.hass)(`tyres.${e}`);
	}
	open(e) {
		this.tab = "race", this.result = void 0, this.driver = "", this.highlight = "", this.selected = e;
	}
	render() {
		let e = F(this.hass);
		if (this.selected) return this.renderDetail(e, this.selected);
		let t = this.seasons.length ? this.seasons : [this.season ?? 0];
		return S`
      <div class="toolbar">
        <h1>${e("results.title")}</h1>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.rounds = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => S`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
      </div>
      ${this.failed ? X(e, () => this.loadRounds()) : this.rounds ? this.rounds.length ? S`<div class="card"><div class="scroll"><table class="tbl">
                <tr><th>${e("common.round")}</th><th>${e("results.grandPrix")}</th><th class="phone-hide">${e("results.date")}</th><th>${e("results.winner")}</th><th></th></tr>
                ${[...this.rounds].reverse().map((t) => S`<tr class="click" tabindex="0" aria-label=${`${e("results.open")}: ${t.name ?? ""}`}
                      @click=${() => this.open(t)} @keydown=${Lt(() => this.open(t))}>
                    <td class="num">${t.round}</td>
                    <td class="gp wrap">${t.name}${t.sprint ? S`<span class="pill sprint">${e("common.sprint")}</span>` : T}
                      <small class="phone-only">${Tt(this.hass, t.date)}</small></td>
                    <td class="num phone-hide">${Tt(this.hass, t.date)}</td>
                    <td class="wrap">${t.hidden ? S`<span class="hidden-cell">${e("spoiler.hiddenRound")}</span>` : t.winner ? Y(t.winner.name, t.winner.team_id) : "—"}</td>
                    <td class="chev" aria-hidden="true">›</td>
                  </tr>`)}
              </table></div></div>` : S`<div class="card state">${e("results.empty")}</div>` : Ht(e)}
    `;
	}
	renderDetail(e, t) {
		return S`
      <div class="toolbar">
        <button class="link back" @click=${() => this.selected = void 0}>${L(I.back, 18)} ${e("common.back")}</button>
        <h1>${t.name} ${this.season}</h1>
        ${t.circuit_id ? S`<button class="link history" @click=${() => this.dispatchEvent(new CustomEvent("plb-go", {
			detail: {
				page: "circuit",
				circuit_id: t.circuit_id,
				circuit: t.circuit ?? t.name ?? "",
				from: "results"
			},
			bubbles: !0,
			composed: !0
		}))}>${L(I.history, 16)} ${e("circuit.link")}</button>` : T}
      </div>
      <div class="card">
        <div class="subtabs">
          ${t.tabs.map((t) => S`<button class="tab ${this.tab === t ? "active" : ""}" aria-pressed=${this.tab === t ? "true" : "false"}
              @click=${() => this.tab = t}>${e(`results.tabs.${t}`)}</button>`)}
        </div>
        ${this.renderTab(e)}
      </div>
    `;
	}
	renderTab(e) {
		if (this.tabFailed) return X(e, () => this.loadTab());
		let t = this.result;
		if (!t || t.tab !== this.tab) return S`<div class="loading">${e("common.loading")}${Jt.has(this.tab) ? S`<br /><small>${e("results.archive")}</small>` : T}</div>`;
		if (t.hidden) return S`<div class="state">${L(I.eyeOff, 56)}<div>${e("spoiler.revealNote")}</div>
        <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-reveal", {
			detail: t.session,
			bubbles: !0,
			composed: !0
		}))}>${e("spoiler.reveal")}</button></div>`;
		if (!t.available || !t.data) return S`<div class="state">${Jt.has(this.tab) ? e("results.notArchived") : e("common.noData")}</div>`;
		let n = t.data;
		switch (this.tab) {
			case "race":
			case "sprint": return this.classification(e, n.rows, this.tab === "race");
			case "qualifying": return this.qualifying(e, n.rows);
			case "lap_chart": return this.lapChart(e, n);
			case "strategy": return this.strategy(e, n);
			case "lap_times": return this.lapTimes(e, n);
			case "pit_stops": return this.pitStops(e, n);
			case "race_control": return this.raceControl(e, n.messages);
			default: return this.weather(e, n.weather);
		}
	}
	finish(e, t, n) {
		if (n && t.laps !== null && t.laps !== void 0 && t.laps < n && (t.time || /^(lapped|\+\d+ laps?)$/i.test(t.status ?? ""))) {
			let r = n - t.laps;
			return e(r === 1 ? "results.lapsDownOne" : "results.lapsDown", { n: r });
		}
		return t.time ?? Xt(e, t.status);
	}
	classification(e, t, n) {
		let r = t.find((e) => e.position === 1)?.laps ?? null;
		return S`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.pos")}</th><th>${e("common.driver")}</th><th class="phone-hide"></th><th class="wide">${e("common.team")}</th>
        <th class="r phone-hide">${e("results.grid")}</th><th class="r phone-hide">${e("common.laps")}</th><th>${e("results.time")}</th>
        <th class="r">${e("common.points")}</th>${n ? S`<th class="wide">${e("results.fastest")}</th>` : T}</tr>
      ${t.map((t) => S`<tr>
          <td class="num">${t.position_text && !/^\d+$/.test(t.position_text) ? t.position_text : t.position}</td>
          <td>${Y(t.name, t.team_id)}</td>
          <td class="phone-hide">${zt(t.gained)}</td>
          <td class="wide muted">${t.team ?? ""}</td>
          <td class="r num phone-hide">${t.grid ?? "—"}</td>
          <td class="r num phone-hide">${t.laps ?? ""}</td>
          <td class="num">${this.finish(e, t, r)}</td>
          <td class="r num">${t.points ? q(this.hass, t.points) : ""}</td>
          ${n ? S`<td class="wide t ${t.fastest_lap?.rank === 1 ? "ob" : ""}">${t.fastest_lap?.time ?? ""}</td>` : T}
        </tr>`)}
    </table></div>`;
	}
	qualifying(e, t) {
		let n = (e) => t.map((t) => t[e]).filter(Boolean).sort()[0], r = {
			q1: n("q1"),
			q2: n("q2"),
			q3: n("q3")
		}, i = (e) => e.q3 ? "q3" : e.q2 ? "q2" : e.q1 ? "q1" : null;
		return S`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.pos")}</th><th>${e("common.driver")}</th><th class="wide">${e("common.team")}</th>
        <th class="phone-hide">Q1</th><th class="phone-hide">Q2</th><th class="phone-hide">Q3</th><th class="phone-only">${e("results.best")}</th></tr>
      ${t.map((e) => {
			let t = i(e);
			return S`<tr>
          <td class="num">${e.position}</td><td>${Y(e.name, e.team_id)}</td><td class="wide muted">${e.team ?? ""}</td>
          ${[
				"q1",
				"q2",
				"q3"
			].map((t) => S`<td class="t phone-hide ${e[t] && e[t] === r[t] ? "ob" : ""}">${e[t] ?? ""}</td>`)}
          <td class="t phone-only">${t ? S`<small class="muted">${t.toUpperCase()}</small> <span class=${e[t] === r[t] ? "t ob" : "t"}>${e[t]}</span>` : ""}</td>
        </tr>`;
		})}
    </table></div>`;
	}
	lapChart(e, t) {
		let n = Math.max(...t.drivers.map((e) => Math.max(0, ...e.positions.filter((e) => e !== null))), 1), r = 24 + n * 22, i = Math.max(t.laps, 1), a = (e) => 36 + e / i * 850, o = (e) => 14 + (e - 1) * 22, s = /* @__PURE__ */ new Set(), c = t.drivers.map((e) => {
			let t = "", n = !1;
			e.positions.forEach((e, r) => {
				if (e === null) {
					n = !1;
					return;
				}
				t += `${n ? "L" : "M"}${a(r).toFixed(1)} ${o(e).toFixed(1)}`, n = !0;
			});
			let r = e.positions.map((e) => e !== null).lastIndexOf(!0), i = r >= 0 ? e.positions[r] : null, c = !this.highlight || this.highlight === e.driver_id, l = B(e.team_id), u = e.team_id ?? e.driver_id ?? "", d = s.has(u);
			s.add(u);
			let f = () => this.highlight = this.highlight === e.driver_id ? "" : e.driver_id ?? "";
			return C`<g class="line" @click=${f} @keydown=${Lt(f)} tabindex="0" role="button"
          aria-label=${e.name ?? e.code ?? ""} aria-pressed=${this.highlight === e.driver_id ? "true" : "false"}
          style="opacity:${c ? 1 : .15}">
        <path d=${t} fill="none" stroke=${l} stroke-width=${this.highlight === e.driver_id ? 4 : 2}
          stroke-dasharray=${d ? "7 4" : "none"}></path>
        ${i === null ? T : C`<text class="end" x=${a(r) + 6} y=${o(i) + 4}>${e.code ?? e.name?.slice(0, 3).toUpperCase()}</text>`}
      </g>`;
		}), l = Array.from({ length: n }, (e, t) => C`<line class="axis" x1="36" x2=${886} y1=${o(t + 1)} y2=${o(t + 1)}></line><text x="8" y=${o(t + 1) + 4}>${t + 1}</text>`), u = Array.from({ length: Math.floor(i / 10) + 1 }, (e, t) => t * 10).map((e) => C`<text x=${a(e)} y=${r} text-anchor="middle">${e || this.gridLabel}</text>`);
		return S`<div class="legend muted">${e("results.teammateDashed")}</div>
      <div class="chart"><svg viewBox="0 0 ${960} ${r + 6}">${l}${c}${u}</svg></div>`;
	}
	strategy(e, t) {
		let n = Math.max(t.laps, 1), r = (e) => 60 + e / n * 880, i = 10 + t.drivers.length * 26 + 24, a = [...new Set(t.drivers.flatMap((e) => e.stints.map((e) => e.compound)))].sort((e, t) => Object.keys(z).indexOf(e) - Object.keys(z).indexOf(t)), o = t.drivers.map((e, t) => C`
      <text x="8" y=${10 + t * 26 + 13} style="font-weight:600;fill:var(--primary-text-color)">${e.tla}</text>
      ${e.stints.map((e) => {
			let n = Math.max(2, r(e.end_lap) - r(e.start_lap - 1) - 2), i = r(e.start_lap - 1) + 1;
			return C`<rect x=${i} y=${10 + t * 26} width=${n}
          height=${18} rx="4" style="fill:var(${z[e.compound] ?? z.unknown});stroke:color-mix(in srgb, var(--primary-text-color) 30%, transparent)"
          opacity=${e.new ? 1 : .7}><title>${this.tyreName(e.compound)} ${e.start_lap}–${e.end_lap}</title></rect>
          ${n > 34 ? C`<text class="laps-in" x=${i + n / 2} y=${10 + t * 26 + 13} text-anchor="middle">${e.end_lap - e.start_lap + 1}</text>` : T}`;
		})}`), s = [
			1,
			...Array.from({ length: Math.floor(n / 10) }, (e, t) => (t + 1) * 10),
			n
		].filter((e, t, n) => n.indexOf(e) === t).map((e) => C`<text x=${r(e)} y=${i - 4} text-anchor="middle">${e}</text>`);
		return S`<div class="legend">${a.map((t) => S`<span class="key">${Rt(e, t, null, null)}${this.tyreName(t)}</span>`)}
        <span class="muted">${e("results.usedFaded")}</span></div>
      <div class="chart"><svg viewBox="0 0 ${960} ${i}">${o}${s}</svg></div>`;
	}
	lapTimes(e, t) {
		if (!t.drivers.length) return S`<div class="state">${e("common.noData")}</div>`;
		let n = t.drivers.find((e) => e.number === this.driver) ?? t.drivers[0], r = (e) => e === "overall" ? "ob" : e === "personal" ? "pb" : "";
		return S`
      <div class="pick">
        <label>${e("results.chooseDriver")}
          <select @change=${(e) => this.driver = e.target.value}>
            ${t.drivers.map((e) => S`<option .selected=${e === n} value=${e.number}>${e.tla} — ${e.name}</option>`)}
          </select>
        </label>
      </div>
      <div class="scroll tall"><table class="tbl sticky">
        <tr><th>${e("common.lap")}</th><th>${e("live.last")}</th><th>S1</th><th>S2</th><th>S3</th><th>${e("results.tyre")}</th><th>${e("results.pit")}</th></tr>
        ${n.laps.map((t) => S`<tr>
            <td class="num">${t.lap}</td>
            <td class="t ${r(t.best)}">${t.time ?? "—"}</td>
            ${[
			0,
			1,
			2
		].map((e) => S`<td class="t ${r(t.sector_bests?.[e])}">${t.sectors[e] ?? "—"}</td>`)}
            <td>${t.compound ? Rt(e, t.compound, null, t.tyre_age) : ""}</td>
            <td>${t.pit_in ? S`<span class="badge pit">${e("results.pitIn")}</span>` : T}${t.pit_out ? S`<span class="badge out">${e("results.pitOut")}</span>` : T}</td>
          </tr>`)}
      </table></div>`;
	}
	pitStops(e, t) {
		if (!t.stops.length) return S`<div class="state">${e("common.noData")}</div>`;
		let n = [...t.stops].sort((e, t) => e.lap - t.lap || e.stop - t.stop);
		return S`<div class="scroll"><table class="tbl fit">
      <tr><th>${e("common.driver")}</th><th class="r">${e("common.lap")}</th><th class="r">${e("results.stop")}</th><th class="r">${e("results.duration")}</th></tr>
      ${n.map((t) => S`<tr><td>${Y(t.name, t.team_id)}</td><td class="r num">${t.lap}</td><td class="r num">${t.stop}</td>
          <td class="r num">${t.duration ? e("delay.seconds", { n: t.duration }) : ""}</td></tr>`)}
    </table></div>`;
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
		return S`<div class="filters">${n.map((t) => S`<button class="chip small ${this.filter === t ? "on" : ""}" aria-pressed=${this.filter === t ? "true" : "false"}
          @click=${() => this.filter = t}>${e(`live.${t}`)}</button>`)}</div>
      <div class="feed">${i.map((t) => S`<div class="msg ${t.kind}"><span class="lap num">${t.lap ? `${e("common.lap")} ${t.lap}` : K(this.hass, t.utc, !0)}</span>
          <span>${t.message}${t.lap ? S`<time>${K(this.hass, t.utc)}</time>` : T}</span></div>`)}</div>`;
	}
	weather(e, t) {
		if (!t) return S`<div class="state">${e("common.noData")}</div>`;
		let n = (e) => `${q(this.hass, e)}°`, r = (t, r) => r ? S`<div class="tile"><small>${t}</small>
            <b class="num">${e("results.startEnd", {
			start: n(r.start),
			end: n(r.end)
		})}</b>
            <span class="muted num">${e("results.range", {
			min: n(r.min),
			max: n(r.max)
		})}</span></div>` : T;
		return S`<div class="tiles">
      ${r(e("results.air"), t.air)}${r(e("results.track"), t.track)}
      <div class="tile"><small>${e("results.rain")}</small><b>${t.rain ? e("results.wet") : e("results.dry")}</b></div>
    </div>`;
	}
	static {
		this.styles = [
			R,
			lt,
			o`
      :host { display: block; container-type: inline-size; }
      .back { display: inline-flex; align-items: center; gap: 4px; }
      .history { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; margin-left: auto; }
      .subtabs { display: flex; gap: 4px; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); }
      .subtabs .tab { font-size: 13px; padding: 6px 12px; }
      .line { cursor: pointer; }
      .chart text.end { fill: var(--primary-text-color); font-weight: 600; paint-order: stroke;
        stroke: var(--card-background-color); stroke-width: 4px; stroke-linejoin: round; }
      .chart text.laps-in { fill: #1a1a1a; font-size: 10px; font-weight: 600; opacity: 0.75; }
      .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 12px 16px 0; font-size: 12px; }
      .legend .key { display: inline-flex; align-items: center; gap: 6px; }
      .pick { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
      .pick label { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--secondary-text-color); }
      .filters { display: flex; gap: 6px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color); flex-wrap: wrap; }
      .feed { max-height: 70vh; overflow: auto; }
      .msg { display: grid; grid-template-columns: 56px 1fr; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .msg .lap { color: var(--secondary-text-color); font-size: 12px; }
      .msg.flag { box-shadow: inset 3px 0 var(--plb-yellow); }
      .msg.penalty { box-shadow: inset 3px 0 var(--error-color, #db4437); }
      .msg time { display: block; color: var(--secondary-text-color); font-size: 11px; margin-top: 2px; }
      .badge + .badge { margin-left: 4px; }
      .gp .pill { margin-left: 8px; }
      .chev { width: 16px; color: var(--secondary-text-color); font-size: 18px; text-align: right; }
      .tbl.fit { width: auto; min-width: min(100%, 480px); }
      .scroll.tall { max-height: 70vh; overflow: auto; }
      .tbl.sticky th { position: sticky; top: 0; z-index: 1; background: var(--card-background-color); }
      .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; padding: 16px; }
      .tile { display: grid; gap: 4px; padding: 12px 14px; border-radius: 10px; background: var(--plb-row-alt);
        border: 1px solid var(--divider-color); }
      .tile small { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      .tile b { font-size: 20px; font-weight: 500; }
      .tile span { font-size: 12px; }
      .phone-only { display: none; }
      .gp small.phone-only { color: var(--secondary-text-color); font-size: 11px; }
      @container (max-width: 900px) { .wide { display: none; } }
      @container (max-width: 640px) {
        .phone-hide { display: none; }
        .phone-only { display: table-cell; }
        .gp small.phone-only { display: block; }
        .tbl td.wrap { white-space: normal; }
        .chev { display: none; }
      }
    `
		];
	}
}, Qt = 4, $t = {
	clear: "st-clear",
	yellow: "st-yellow",
	safety_car: "st-sc",
	virtual_safety_car: "st-sc",
	vsc_ending: "st-yellow",
	red_flag: "st-red",
	chequered: "st-chequered"
};
function en(e) {
	return e ? $t[e] ?? "" : "";
}
function tn(e, t) {
	return (!t || t === "clear" || t === "chequered") && !e.yellow && !e.red_flag && !e.safety_car && !e.virtual_safety_car && !e.penalties.length && !e.investigations.length && !e.track_limits.length;
}
function nn(e) {
	return !e.penalties.length && !e.investigations.length && !e.track_limits.length;
}
function rn(e, t) {
	switch (t.kind) {
		case "time_penalty": return `+${t.seconds ?? "?"}s`;
		case "drive_through": return e("stewards.short.drive_through");
		case "stop_go": return t.seconds ? `${e("stewards.short.stop_go")} ${t.seconds}s` : e("stewards.short.stop_go");
		case "grid_penalty": return e("stewards.short.grid", { n: t.places ?? "?" });
		case "disqualified": return e("stewards.short.disqualified");
		default: return e(`stewards.kind.${t.kind}`);
	}
}
function an(e) {
	return e.cars.map((e) => e.tla).join(" · ");
}
function on(e) {
	return e.reason ? `${an(e)} ${e.reason}` : an(e);
}
function sn(e, t, n) {
	return e.length <= Qt ? e.map(t) : S`${e.slice(0, Qt).map(t)}
    <details><summary>${n("stewards.showAll", { n: e.length - Qt })}</summary>${e.slice(Qt).map(t)}</details>`;
}
function cn(e, t) {
	return S`<li class=${t.served ? "served" : ""}>
    <span class="pen">${rn(e, t)}</span>
    <span class="what" title=${on(t)}><b>${an(t)}</b>${t.reason ? S` <span class="why">${t.reason}</span>` : T}</span>
    <span class="when">${t.served ? S`✓ ${e("stewards.served")}` : t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
  </li>`;
}
function ln(e, t) {
	return S`<li>
    <span class="tag">${e(`stewards.kind.${t.status ?? t.kind}`)}</span>
    <span class="what two" title=${on(t)}><b>${an(t)}</b>${t.reason ? S` <span class="why">${t.reason}</span>` : T}</span>
    <span class="when">${t.turn ? e("stewards.turn", { n: t.turn }) : t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
  </li>`;
}
function un(e, t, n, r) {
	let i = t.safety_car ?? t.virtual_safety_car, a = t.safety_car ? "sc" : "vsc";
	return S`<div class="col">
    <h4>${e("stewards.track")}</h4>
    ${n ? S`<span class="status-pill ${en(n)}">${e(`live.status.${n}`)}</span>` : S`<span class="muted">—</span>`}
    ${i ? S`<div class="phase">${e(`stewards.${a}.${i}`)}</div>` : T}
    ${r.length ? S`<div class="sectors">${r.map((t) => S`<span class="sector-chip ${t.flag}" title=${e(`stewards.${t.flag}`)}
            >S${t.sector}${t.flag === "double_yellow" ? S`<small>×2</small>` : T}</span>`)}</div>` : T}
  </div>`;
}
function dn(e, t, n, r, i, a) {
	let o = t.penalties.filter((e) => !e.served).length;
	return S`<button class="compact" @click=${i} aria-expanded=${r ? "true" : "false"}>
    ${n ? S`<span class="status-pill ${en(n)}">${e(`live.status.${n}`)}</span>` : T}
    ${a.map((e) => S`<span class="sector-chip ${e.flag}">S${e.sector}</span>`)}
    ${t.penalties.length ? S`<span class="count ${o ? "hot" : ""}">${e("stewards.penalties")} ${t.penalties.length}</span>` : T}
    ${t.investigations.length ? S`<span class="count">${e("stewards.investigations")} ${t.investigations.length}</span>` : T}
    ${t.track_limits.length ? S`<span class="count">${e("stewards.trackLimits")} ${t.track_limits.length}</span>` : T}
    <span class="chevron">${r ? "▴" : "▾"}</span>
  </button>`;
}
function fn(e, t, n, r = !1, i = () => void 0, a = !1) {
	if (!t) return T;
	let o = a || n === "chequered", s = o ? [] : t.yellow_sectors;
	return tn(t, n) || o && nn(t) ? S`<div class="card stewards calm">
      <span class="status-pill ${en(n ?? "clear")}">${e(`live.status.${n ?? "clear"}`)}</span>
      <span class="muted">${e("stewards.calm")}</span>
    </div>` : S`<section class="card stewards ${t.red_flag ? "accent-red" : t.safety_car || t.virtual_safety_car ? "accent-sc" : ""} ${r ? "open" : ""}" aria-label=${e("stewards.title")}>
    <div class="card-head">${e("stewards.title")}</div>
    ${dn(e, t, n, r, i, s)}
    <div class="cols">
      ${un(e, t, n, s)}
      <div class="col">
        <h4>${e("stewards.penalties")} <small>${t.penalties.length || ""}</small></h4>
        ${t.penalties.length ? S`<ul>${sn(t.penalties, (t) => cn(e, t), e)}</ul>` : S`<span class="muted">${e("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${e("stewards.investigations")} <small>${t.investigations.length || ""}</small></h4>
        ${t.investigations.length ? S`<ul>${sn(t.investigations, (t) => ln(e, t), e)}</ul>` : S`<span class="muted">${e("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${e("stewards.trackLimits")}</h4>
        ${t.track_limits.length ? S`<ul>${sn(t.track_limits, (t) => S`<li><b>${t.tla}</b><span class="what">${e("stewards.deleted", { n: t.deleted })}</span>
                ${t.black_and_white ? S`<span class="bw" title=${e("stewards.kind.black_and_white_flag")}>⚑</span>` : T}</li>`, e)}</ul>` : S`<span class="muted">${e("stewards.none")}</span>`}
      </div>
    </div>
  </section>`;
}
var pn = o`
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
  .stewards .what.two { white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
  .stewards .why { color: var(--secondary-text-color); font-size: 12px; }
  .stewards .when { color: var(--secondary-text-color); font-size: 11px; white-space: nowrap; }
  .stewards .pen { flex: none; min-width: 36px; text-align: center; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;
    background: var(--error-color, #db4437); color: #fff; font-variant-numeric: tabular-nums; }
  .stewards li.served .pen { background: none; color: var(--secondary-text-color);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-text-color) 30%, transparent); }
  .stewards .tag { flex: none; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.03em;
    color: var(--primary-text-color); background: color-mix(in srgb, var(--warning-color, #ffa600) 22%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--warning-color, #ffa600) 60%, transparent); }
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
  .stewards details summary { cursor: pointer; font-size: 12px; color: var(--plb-primary-text); list-style: none; }
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
`, mn = o`
  .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; }
  .status-pill::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
  .st-clear { background: color-mix(in srgb, var(--plb-green) 16%, transparent); color: var(--plb-green-text); }
  .st-yellow { background: color-mix(in srgb, var(--plb-yellow) 22%, transparent); color: var(--plb-yellow-text); }
  .st-sc { background: #f2c200; color: #1a1a1a; }
  .st-red { background: var(--error-color, #db4437); color: #fff; }
  .st-chequered { background: var(--secondary-background-color); color: var(--primary-text-color); }
  .st-chequered::before { border-radius: 2px; background: repeating-conic-gradient(#222 0 25%, #fff 0 50%) 0 0 / 5px 5px;
  box-shadow: 0 0 0 1px var(--divider-color); }
`, hn = /* @__PURE__ */ new Set([
	"time_penalty",
	"drive_through",
	"stop_go",
	"grid_penalty",
	"disqualified"
]);
function gn(e) {
	return e >= 52.5 ? "up" : e <= 47.5 ? "down" : "even";
}
function _n(e) {
	if (!e) return "";
	let t = e.toLowerCase();
	return t.charAt(0).toUpperCase() + t.slice(1);
}
var vn = class extends k {
	constructor(...e) {
		super(...e), this.circuitId = "", this.circuitName = "", this.failed = !1, this.open = "", this.years = /* @__PURE__ */ new Map(), this.request = 0, this.spoilers = "", this.histories = /* @__PURE__ */ new Map();
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			circuitId: { attribute: !1 },
			circuitName: { attribute: !1 },
			data: { state: !0 },
			failed: { state: !0 },
			open: { state: !0 },
			years: { state: !0 }
		};
	}
	willUpdate(e) {
		let t = Pt(this.settings), n = t !== this.spoilers;
		this.spoilers = t, n && (this.histories.clear(), this.years = /* @__PURE__ */ new Map()), (e.has("circuitId") || n) && (e.has("circuitId") && (this.open = "", this.years = /* @__PURE__ */ new Map()), this.load());
	}
	async load() {
		if (!this.hass || !this.circuitId) return;
		let e = ++this.request, t = this.circuitId;
		this.failed = !1;
		let n = this.histories.get(t);
		if (n) {
			this.data = n;
			return;
		}
		this.data?.circuit_id !== t && (this.data = void 0);
		try {
			let n = await N.circuitHistory(this.hass, t);
			this.histories.set(t, n), e === this.request && (this.data = n);
		} catch {
			e === this.request && (this.failed = !0);
		}
	}
	toggle(e) {
		this.open = this.open === e.driver_id ? "" : e.driver_id;
		let t = this.years.get(e.driver_id);
		this.open && (!t || t === "failed") && this.loadYears(e.driver_id);
	}
	async loadYears(e) {
		let t = this.circuitId;
		this.years = new Map(this.years).set(e, "loading");
		try {
			let n = await N.circuitDriver(this.hass, t, e);
			t === this.circuitId && (this.years = new Map(this.years).set(e, n));
		} catch {
			t === this.circuitId && (this.years = new Map(this.years).set(e, "failed"));
		}
	}
	back() {
		this.dispatchEvent(new CustomEvent("plb-back", {
			bubbles: !0,
			composed: !0
		}));
	}
	render() {
		let e = F(this.hass), t = this.data?.circuit_id === this.circuitId ? this.data : void 0;
		return S`
      <div class="toolbar">
        <button class="link back" @click=${this.back}>${L(I.back, 18)} ${e("circuit.back")}</button>
        <h1>${t?.circuit ?? this.circuitName ?? e("circuit.title")}</h1>
      </div>
      ${this.failed ? X(e, () => this.load()) : t ? S`${this.intro(e, t)}${t.drivers.length ? this.table(e, t.drivers) : S`<div class="card state">${e("circuit.empty")}</div>`}` : Ht(e)}
    `;
	}
	intro(e, t) {
		let n = t.first_season, r = t.last_season, i = n && r ? n === r ? e("circuit.seasonOne", { n }) : e("circuit.seasons", {
			first: n,
			last: r
		}) : "", a = [
			t.locality,
			t.country,
			i
		].filter(Boolean).join(" · ");
		return S`<div class="card intro">
      <div class="kicker">${e("circuit.title")}</div>
      ${a ? S`<div class="where">${a}</div>` : T}
      <p class="explain">${this.scale()}<span>${e("circuit.explain")}</span></p>
      <details>
        <summary>${e("circuit.how")}</summary>
        <p>${e("circuit.howText")}</p>
      </details>
    </div>`;
	}
	scale() {
		return S`<span class="scale" aria-hidden="true"><i class="down"></i><i class="even"></i><i class="up"></i></span>`;
	}
	table(e, t) {
		let n = [...t].sort((e, t) => (t.index ?? -1) - (e.index ?? -1)), r = 0;
		return S`<div class="card"><div class="scroll"><table class="tbl drivers">
      <thead><tr>
        <th class="pos">${e("common.pos")}</th><th>${e("common.driver")}</th><th>${e("circuit.index")}</th>
        <th class="r" title=${e("circuit.racesHelp")}>${e("circuit.races")}</th>
        <th class="r col-stat">${e("circuit.wins")}</th><th class="r col-stat">${e("circuit.podiums")}</th>
        <th class="r col-stat">${e("circuit.poles")}</th><th class="r col-stat">${e("circuit.best")}</th>
        <th class="r col-avg">${e("circuit.avgFinish")}</th><th class="r col-avg">${e("circuit.avgQuali")}</th>
        <th class="chev"></th>
      </tr></thead>
      ${n.map((t, n) => {
			let i = t.index !== null;
			return i && r++, S`<tbody>${this.row(e, t, i ? r : null, n)}</tbody>`;
		})}
    </table></div></div>`;
	}
	row(e, t, n, r) {
		let i = t.races === 0, a = this.open === t.driver_id, o = t.name ?? t.code ?? t.driver_id, s = S`<div class="drv"><span class="bar" style="background:${B(t.team_id)}"></span>
      <span class="tla">${t.code ?? o.slice(0, 3).toUpperCase()}</span><span class="name">${o}</span></div>`;
		if (i) return S`<tr class="never ${r % 2 ? "" : "alt"}">
        <td class="pos num"></td><td>${s}</td>
        <td colspan="9" class="muted"><i>${e("circuit.never")}</i></td>
      </tr>`;
		let c = () => this.toggle(t);
		return S`<tr class="click ${a ? "sel" : ""} ${r % 2 ? "" : "alt"}" tabindex="0" aria-expanded=${a ? "true" : "false"}
        aria-label=${e("circuit.open", { driver: o })} @click=${c} @keydown=${Lt(c)}>
      <td class="pos num">${n ?? "—"}</td>
      <td>${s}</td>
      <td>${this.index(e, t.index)}</td>
      <td class="r num" title=${e("circuit.racesHelp")}>${t.counted === t.races ? t.races : S`${t.counted}<small class="muted">/${t.races}</small>`}</td>
      <td class="r num col-stat">${t.wins || S`<span class="muted">0</span>`}</td>
      <td class="r num col-stat">${t.podiums || S`<span class="muted">0</span>`}</td>
      <td class="r num col-stat">${t.poles || S`<span class="muted">0</span>`}</td>
      <td class="r num col-stat">${t.best_finish === null ? "—" : `P${t.best_finish}`}</td>
      <td class="r num col-avg">${J(this.hass, t.avg_finish, 1)}</td>
      <td class="r num col-avg">${J(this.hass, t.avg_quali, 1)}</td>
      <td class="chev" aria-hidden="true">${a ? "▾" : "▸"}</td>
    </tr>
    ${a ? this.details(e, t) : T}`;
	}
	index(e, t) {
		if (t === null) return S`<span class="muted small">${e("circuit.noIndex")}</span>`;
		let n = Math.max(0, Math.min(100, t)), r = Math.min(n, 50), i = Math.abs(n - 50);
		return S`<div class="index ${gn(n)}">
      <b class="num">${J(this.hass, t, 1)}</b>
      <span class="track" aria-hidden="true"><i style="left:${r}%;width:${i}%"></i><span class="mid"></span></span>
    </div>`;
	}
	details(e, t) {
		let n = this.years.get(t.driver_id), r = (e) => J(this.hass, e, 1);
		return S`<tr class="details"><td colspan="11"><div class="dwrap">
      <div class="dhead"><b>${t.name ?? t.code}</b>${t.team ? S` · <span class="muted">${t.team}</span>` : T}</div>
      <div class="facts narrow">
        <span>${e("circuit.wins")} <b class="num">${t.wins}</b></span>
        <span>${e("circuit.podiums")} <b class="num">${t.podiums}</b></span>
        <span>${e("circuit.poles")} <b class="num">${t.poles}</b></span>
        <span>${e("circuit.best")} <b class="num">${t.best_finish === null ? "—" : `P${t.best_finish}`}</b></span>
        <span>${e("circuit.avgFinish")} <b class="num">${r(t.avg_finish)}</b></span>
        <span>${e("circuit.avgQuali")} <b class="num">${r(t.avg_quali)}</b></span>
      </div>
      ${!n || n === "loading" ? S`<div class="muted pad">${e("common.loading")}</div>` : n === "failed" ? X(e, () => this.loadYears(t.driver_id)) : n.years.length ? this.yearsTable(e, n.years) : S`<div class="muted pad">${e("circuit.noYears")}</div>`}
    </div></td></tr>`;
	}
	yearsTable(e, t) {
		return S`<div class="scroll years-wrap"><table class="years">
        <thead><tr>
          <th>${e("circuit.season")}</th><th class="col-team">${e("common.team")}</th>
          <th class="r">${e("circuit.quali")}</th><th class="r">${e("circuit.grid")}</th><th class="r">${e("circuit.finish")}</th>
          <th class="r">${e("common.points")}</th><th title=${e("circuit.expectedHelp")}>${e("circuit.expected")}</th>
          <th>${e("circuit.outcome")}</th><th>${e("circuit.fastest")}</th><th>${e("circuit.penalties")}</th>
        </tr></thead>
        <tbody>${t.map((t) => this.year(e, t))}</tbody>
      </table></div>
      <div class="cards">${t.map((t) => this.yearCard(e, t))}</div>
      <p class="legend">${e("circuit.legend")}</p>`;
	}
	finishText(e) {
		return e.position_text && !/^\d+$/.test(e.position_text) ? e.position_text : e.finish === null ? "—" : `P${e.finish}`;
	}
	gridCell(e, t) {
		return S`${t.grid !== null && t.grid !== void 0 ? t.grid === 0 ? e("circuit.pitLane") : t.grid : "—"}${t.grid_penalty ? S`<span class="gpen" title=${e("circuit.gridPenalty")} aria-label=${e("circuit.gridPenalty")}>▼</span>` : T}`;
	}
	yearCard(e, t) {
		return S`<div class="ycard ${t.counted ? "" : "uncounted"}">
      <div class="yline"><span class="bar" style="background:${B(t.team_id)}"></span>
        <b class="num">${t.season}</b><span class="muted">${t.team ?? ""}</span>
        <span class="spacer"></span><b class="num fin">${this.finishText(t)}</b>
        <span class="num muted">${t.points ? q(this.hass, t.points, 1) : 0} ${e("common.points")}</span></div>
      <div class="yline facts">
        <span>${e("circuit.quali")} <b class="num">${t.quali === null ? "—" : `P${t.quali}`}</b></span>
        <span>${e("circuit.grid")} <b class="num">${this.gridCell(e, t)}</b></span>
        <span>${e("circuit.expected")} ${this.versus(e, t)}</span>
      </div>
      <div class="yline facts">
        <span>${this.outcome(e, t)}</span>
        ${t.fastest_lap ? S`<span>${e("circuit.fastest")} <span class="t ${t.fastest_lap_rank === 1 ? "ob" : ""}">${t.fastest_lap}</span>${t.fastest_lap_rank ? S` <small class="muted">${e("circuit.fastestRank", { n: t.fastest_lap_rank })}</small>` : T}</span>` : T}
      </div>
      <div class="yline facts pens"><span>${e("circuit.penalties")}</span><div>${this.penalties(e, t.penalties)}</div></div>
    </div>`;
	}
	year(e, t) {
		let n = this.finishText(t), r = t.weight !== null && t.weight !== void 0 ? e("circuit.weight", { n: q(this.hass, t.weight, 2) }) : "";
		return S`<tr class=${t.counted ? "" : "uncounted"}>
      <td title=${r}><div class="drv"><span class="bar" style="background:${B(t.team_id)}"></span><span class="num">${t.season}</span></div></td>
      <td class="col-team muted">${t.team ?? ""}</td>
      <td class="r num">${t.quali === null ? "—" : `P${t.quali}`}</td>
      <td class="r num">${this.gridCell(e, t)}</td>
      <td class="r num"><b>${n}</b></td>
      <td class="r num">${t.points ? q(this.hass, t.points, 1) : S`<span class="muted">0</span>`}</td>
      <td class="vs">${this.versus(e, t)}</td>
      <td class="wrap">${this.outcome(e, t)}</td>
      <td>${t.fastest_lap ? S`<span class="t ${t.fastest_lap_rank === 1 ? "ob" : ""}">${t.fastest_lap}</span>${t.fastest_lap_rank ? S` <small class="muted">${e("circuit.fastestRank", { n: t.fastest_lap_rank })}</small>` : T}` : "—"}</td>
      <td class="wrap pens">${this.penalties(e, t.penalties)}</td>
    </tr>`;
	}
	versus(e, t) {
		if (t.expected === null || t.expected === void 0) return S`<span class="muted">—</span>`;
		let n = (e) => {
			if (e == null) return T;
			let t = J(this.hass, Math.abs(e), 1);
			return e > 0 ? S`<span class="gained up">▲${t}</span>` : e < 0 ? S`<span class="gained down">▼${t}</span>` : S`<span class="gained muted">=</span>`;
		};
		return S`<span class="muted num">P${J(this.hass, t.expected, 1)}</span>
      <span class="${t.counted ? "" : "faded"}">${n(t.delta_race)}</span>${t.delta_quali !== null && t.delta_quali !== void 0 ? S` <small class="q ${t.counted ? "" : "faded"}">${e("circuit.q")} ${n(t.delta_quali)}</small>` : T}`;
	}
	outcome(e, t) {
		let n = Xt(e, t.status);
		return t.dnf ? S`<span class="badge ${t.dnf === "driver" ? "ret" : "mech"}">${e(t.dnf === "driver" ? "circuit.dnfDriver" : "circuit.dnfMechanical")}</span>
        ${n ? S`<small class="muted">${n}</small>` : T}
        ${t.counted ? T : S`<span class="pill nc">${e("circuit.notCounted")}</span>`}` : S`${n || "—"}${t.counted ? T : S` <span class="pill nc">${e("circuit.notCounted")}</span>`}`;
	}
	penalties(e, t) {
		return t == null ? S`<span class="muted" title=${e("circuit.penaltiesUnknown")} aria-label=${e("circuit.penaltiesUnknown")}>—</span>` : t.length ? t.map((t) => S`<div class="pen"><span class="badge ${hn.has(t.kind) ? "pen" : ""}">${rn(e, t)}</span>
        ${t.reason ? S`<span>${_n(t.reason)}</span>` : T}
        ${t.lap ? S`<small class="muted">${e("circuit.onLap", { n: t.lap })}</small>` : T}</div>`) : S`<span class="muted">${e("circuit.penaltiesNone")}</span>`;
	}
	static {
		this.styles = [R, o`
      :host { display: block; container-type: inline-size; }
      .back { display: inline-flex; align-items: center; gap: 4px; min-height: 40px; }
      .intro { padding: 14px 16px 4px; margin-bottom: var(--plb-gap); }
      .kicker { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--secondary-text-color); }
      .where { margin-top: 4px; font-size: 14px; }
      .explain { display: flex; align-items: center; gap: 10px; margin: 10px 0 4px; font-size: 13px; line-height: 1.5; }
      .scale { display: inline-flex; flex: none; width: 42px; height: 8px; border-radius: 4px; overflow: hidden; }
      .scale i { flex: 1; }
      .scale .down, .index.down .track i { background: var(--error-color, #db4437); }
      .scale .even, .index.even .track i { background: var(--plb-unknown); }
      .scale .up, .index.up .track i { background: var(--plb-green); }
      details { font-size: 13px; }
      summary { cursor: pointer; color: var(--plb-primary-text); min-height: 40px; display: flex; align-items: center; width: fit-content; }
      details p { margin: 0 0 12px; line-height: 1.55; color: var(--secondary-text-color); max-width: 900px; }
      /* The drivers' own rows, not the years table nested in an open one. */
      .drivers > tbody > tr > td { height: 44px; padding-top: 0; padding-bottom: 0; }
      .drivers > tbody > tr.alt > td { background: var(--plb-row-alt); }
      .drivers > tbody > tr.sel > td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .drivers > tbody > tr:focus-visible > td { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .drivers > tbody > tr.never > td { color: var(--plb-muted); }
      .drivers tr.never .bar { opacity: 0.4; }
      .pos { width: 34px; text-align: center; font-weight: 600; }
      .drv .name { color: var(--secondary-text-color); font-size: 13px; }
      .tla { min-width: 34px; }
      .index { display: flex; align-items: center; gap: 10px; }
      .index b { width: 36px; text-align: right; font-weight: 600; font-size: 15px; }
      .index.up b { color: var(--plb-green-text); }
      .index.down b { color: var(--error-color, #db4437); }
      .track { position: relative; width: 140px; height: 10px; border-radius: 5px; flex: none;
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
      .track i { position: absolute; top: 0; bottom: 0; border-radius: 5px; min-width: 2px; }
      .track .mid { position: absolute; left: calc(50% - 1px); top: -3px; bottom: -3px; width: 2px;
        background: var(--secondary-text-color); border-radius: 1px; }
      .small { font-size: 12px; }
      .chev { width: 20px; color: var(--secondary-text-color); text-align: center; }
      .drivers > tbody > tr.details > td { height: auto; padding: 10px 12px 14px; white-space: normal; cursor: default;
        background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
      .dwrap { display: grid; gap: 8px; min-width: 0; }
      .dhead { font-size: 14px; }
      .facts { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--secondary-text-color); }
      .facts b { color: var(--primary-text-color); font-weight: 500; }
      .narrow { display: none; }
      .pad { padding: 8px 0; }
      .years-wrap { max-width: 100%; }
      .years { border-collapse: collapse; font-size: 13px; width: 100%; }
      .years th { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color);
        text-align: left; padding: 4px 14px 4px 0; white-space: nowrap; }
      .years td { padding: 6px 14px 6px 0; border: 0; border-top: 1px solid var(--divider-color); white-space: nowrap; vertical-align: middle; }
      .years th { border: 0; }
      .years .r { text-align: right; }
      .years td.wrap { white-space: normal; min-width: 120px; }
      .years td.pens { min-width: 180px; }
      .years tr.uncounted td { color: var(--plb-muted); }
      .years .bar { height: 16px; }
      .gpen { color: var(--error-color, #db4437); font-size: 10px; margin-left: 3px; cursor: help; }
      .vs { white-space: nowrap; }
      .vs .q { color: var(--secondary-text-color); font-size: 11px; }
      .faded { opacity: 0.5; }
      .gained { font-size: 12px; }
      .badge.mech { background: var(--secondary-background-color); color: var(--primary-text-color); }
      .badge.pen { background: var(--error-color, #db4437); color: #fff; margin-right: 4px; }
      .pill.nc { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; margin-left: 4px; white-space: nowrap; }
      .pen { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 6px; }
      .pen + .pen { margin-top: 4px; }
      .legend { margin: 2px 0 0; font-size: 11px; color: var(--secondary-text-color); line-height: 1.5; }
      .error { padding: 8px 0; }
      @container (max-width: 1100px) { .col-avg { display: none; } }
      @container (max-width: 900px) {
        .drv .name { display: none; }
        .col-team { display: none; }
      }
      .cards { display: none; }
      .ycard { display: grid; gap: 4px; padding: 8px 0; border-top: 1px solid var(--divider-color); font-size: 13px; }
      .ycard.uncounted { color: var(--plb-muted); }
      .yline { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; }
      .yline .bar { height: 16px; }
      .yline .fin { font-size: 15px; }
      .ycard .facts { color: var(--secondary-text-color); gap: 4px 14px; }
      .ycard .facts b { color: var(--primary-text-color); font-weight: 500; }
      .ycard .pens { align-items: flex-start; flex-wrap: nowrap; }
      .ycard .pens > div { min-width: 0; color: var(--primary-text-color); }
      @container (max-width: 640px) {
        .years-wrap { display: none; }
        .cards { display: block; }
        .col-stat { display: none; }
        .narrow { display: flex; }
        .track { width: 72px; }
        .index { gap: 8px; }
        .index b { width: 30px; font-size: 14px; }
        .pos { width: 24px; }
        .intro { padding: 12px 14px 2px; }
      }
      @media (pointer: coarse) {
        .drivers > tbody > tr > td { height: 48px; }
      }
    `];
	}
}, yn = {}, Z = Be(class extends Ve {
	constructor() {
		super(...arguments), this.ot = yn;
	}
	render(e, t) {
		return t();
	}
	update(e, [t, n]) {
		if (Array.isArray(t)) {
			if (Array.isArray(this.ot) && this.ot.length === t.length && t.every((e, t) => e === this.ot[t])) return w;
		} else if (this.ot === t) return w;
		return this.ot = Array.isArray(t) ? Array.from(t) : t, this.render(t, n);
	}
}), bn = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, Q = Be(class extends Ve {
	constructor(e) {
		if (super(e), e.type !== ze.CHILD) throw Error("repeat() can only be used in text expressions");
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
		let i = Ye(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = j(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = j(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = j(i[d], a[m]), A(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = j(i[f], a[p]), A(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = bn(o, p, m), u = bn(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = A(e, i[d]);
					j(t, a[p]), c[p] = t;
				} else c[p] = j(n, a[p]), A(e, i[d], n), i[t] = null;
				p++;
			} else Xe(i[f]), f--;
		} else Xe(i[d]), d++;
		for (; p <= m;) {
			let t = A(e, c[m + 1]);
			j(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && Xe(e);
		}
		return this.ut = o, Je(e, c), w;
	}
});
//#endregion
//#region src/merge.ts
function xn(e, t) {
	let n = new Map((e ?? []).map((e) => [e.number, e])), r = [];
	for (let e of t.order) {
		let i = String(e), a = t.rows[i] ?? n.get(i);
		a && r.push(a);
	}
	return r;
}
function Sn(e, t) {
	if (t.full || !e) {
		if (!t.tower_patch) return t;
		let { tower_patch: e, ...n } = t;
		return {
			...n,
			tower: xn(void 0, e)
		};
	}
	let { tower_patch: n, ...r } = t, i = {
		...e,
		...r
	};
	return n && (i.tower = xn(e.tower, n)), i;
}
//#endregion
//#region src/pages/live.ts
var Cn = {
	all: null,
	flags: "flag",
	penalties: "penalty",
	other: "other"
}, wn = /* @__PURE__ */ new Set([
	"live",
	"stale",
	"lost",
	"final"
]), Tn = /* @__PURE__ */ new Set(["race", "sprint"]), En = class extends k {
	constructor(...e) {
		super(...e), this.kiosk = !1, this.clock = 0, this.selected = "", this.filter = "all", this.playing = "", this.failed = !1, this.starting = !1, this.stewardsOpen = !1, this.subscribing = !1, this.receivedAt = Date.now(), this.byNumber = /* @__PURE__ */ new Map(), this.visibility = () => {
			document.visibilityState === "visible" && this.requestUpdate();
		};
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: Nt
			},
			settings: { attribute: !1 },
			kiosk: {
				type: Boolean,
				reflect: !0
			},
			clock: { attribute: !1 },
			view: { state: !0 },
			selected: { state: !0 },
			filter: { state: !0 },
			playing: { state: !0 },
			failed: { state: !0 },
			starting: { state: !0 },
			stewardsOpen: { state: !0 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), document.addEventListener("visibilitychange", this.visibility), this.hasUpdated && this.requestUpdate();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), document.removeEventListener("visibilitychange", this.visibility), window.clearTimeout(this.retry), this.retry = void 0, this.unsubscribe?.(), this.unsubscribe = void 0, this.stopAudio();
	}
	shouldUpdate() {
		return document.visibilityState !== "hidden" || !this.hasUpdated;
	}
	willUpdate() {
		this.hass && !this.unsubscribe && !this.subscribing && this.retry === void 0 && this.subscribe();
	}
	async subscribe() {
		this.subscribing = !0;
		try {
			let e = await N.subscribeLive(this.hass, (e) => this.receive(e));
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
		this.view = Sn(this.view, e), this.receivedAt = Date.now();
	}
	select(e) {
		this.selected = this.selected === e ? "" : e;
	}
	async start() {
		this.starting = !0;
		try {
			await N.setSettings(this.hass, { live: !0 });
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
		let e = F(this.hass), t = this.view;
		if (!t) return this.failed ? X(e, () => {
			window.clearTimeout(this.retry), this.retry = void 0, this.subscribe();
		}) : S`<div class="card loading">${e("common.loading")}</div>`;
		if (wn.has(t.state)) return this.renderBoard(e, t);
		switch (t.state) {
			case "hidden": return S`<div class="card state">${L(I.eyeOff, 56)}<h2>${e("live.hidden")}</h2>
          <div>${e("live.hiddenHelp", {
				meeting: t.header?.meeting ?? "",
				session: It(e, t.header?.kind, t.header?.session)
			})}</div>
          <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-spoiler-off", {
				bubbles: !0,
				composed: !0
			}))}>${e("live.showAll")}</button></div>`;
			case "syncing": return S`<div class="card state">${L(I.clock, 56)}<h2>${e("live.syncing")}</h2>
          <div>${e("live.syncingHelp", { n: t.delay })}</div></div>`;
			case "connecting": return S`<div class="card state"><span class="spin">${L(I.timer, 56)}</span><h2>${e("live.connecting")}</h2></div>`;
			case "paused": return this.renderPaused(e, t);
			default: return this.renderIdle(e, t);
		}
	}
	nextBlock(e, t) {
		return t ? S`<div>${e("live.next", {
			meeting: t.meeting,
			session: e(`sessions.${t.kind}`)
		})}</div>
      ${t.start ? S`<div class="starts">${e("live.startsIn")}</div>
            <div class="big num"><plb-countdown .to=${t.start}></plb-countdown></div>
            <div>${Ct(this.hass, t.start, t.date, t.timezone)}
              ${Bt(e, this.hass, t.start, t.timezone)}</div>` : T}` : S`<div>${e("live.noNext")}</div>`;
	}
	playButton(e) {
		return S`<button class="btn play-live" ?disabled=${this.starting} @click=${() => this.start()}>
      ${L(I.play, 18)}${e("settings.start")}</button>`;
	}
	renderPaused(e, t) {
		return S`<div class="card state">${L(I.pause, 56)}<h2>${e("live.paused")}</h2>
      <div>${e("live.pausedHelp")}</div>
      ${this.playButton(e)}
      ${t.auto_start ? S`<div class="muted">${e("live.autoStart")}</div>` : T}
      <div class="next">${this.nextBlock(e, t.next_session)}</div>
    </div>`;
	}
	renderIdle(e, t) {
		return S`<div class="card state">${L(I.timer, 56)}<h2>${e("live.idle")}</h2>
      ${this.nextBlock(e, t.next_session)}
    </div>`;
	}
	stripEnd(e, t) {
		if (t.state !== "final") return S`<span class="age">${Gt(this.hass, t.data_age ?? 0, this.receivedAt, t.state === "live")}</span>`;
		let n = t.next_session;
		return n ? S`<div class="next-slot">
      <small>${e("live.nextShort")}</small>
      <b>${n.meeting} · ${e(`sessions.${n.kind}`)}</b>
      ${n.start ? S`<span class="num"><plb-countdown .to=${n.start}></plb-countdown></span>` : T}
    </div>` : T;
	}
	stripStart(e, t) {
		let n = t.header, r = t.state === "final", i = n?.kind === "qualifying" || n?.kind === "sprint_qualifying";
		return S`<div><h1>${n?.meeting ?? ""}</h1><div class="sub">${It(e, n?.kind, n?.session)}${n?.circuit ? ` · ${n.circuit}` : ""}</div></div>
      ${i && n?.part ? S`<div class="laps num">Q${n.part}${!r && n.remaining !== null ? S`<small> · ${Mt(n.remaining)} ${e("live.remaining")}</small>` : T}</div>` : n?.lap ? S`<div class="laps num">${e("common.lap")} ${n.lap}${n.total_laps ? S`<small> / ${n.total_laps}</small>` : T}</div>` : !r && n?.remaining !== null && n?.remaining !== void 0 ? S`<div class="laps num">${Mt(n.remaining)} <small>${e("live.remaining")}</small></div>` : T}
      ${r ? S`<span class="final-pill">${e("live.final")}</span>
            <span class="sub">${e("live.ended", { time: At(this.hass, t.ended) })}</span>` : T}
      ${r && t.paused ? S`<span class="paused-pill">${e("live.pausedShort")}</span>${this.playButton(e)}` : T}`;
	}
	renderBoard(e, t) {
		let n = t.header, r = t.state === "final", i = t.state === "stale" ? S`<div class="banner">${L(I.alert)}${e("live.stale", { n: Math.round(t.data_age ?? 0) })}</div>` : t.state === "lost" ? S`<div class="banner lost">${L(I.alert)}${e("live.lost")}</div>` : T, a = n?.kind === "qualifying" || n?.kind === "sprint_qualifying", o = t.state === "live" || t.state === "stale", s = this.hass, c = t.tower ?? [], l = this.settings?.favourites;
		return S`${i}
      <div class="card strip">
        ${Z([
			s,
			this.clock,
			n,
			t.state,
			t.ended,
			t.paused,
			this.starting
		], () => this.stripStart(e, t))}
        <span class="spacer"></span>
        ${this.stripEnd(e, t)}
      </div>
      ${Z([
			s,
			this.clock,
			t.stewards,
			n?.track_status,
			this.stewardsOpen,
			r
		], () => fn(e, t.stewards, n?.track_status, this.stewardsOpen, () => this.stewardsOpen = !this.stewardsOpen, r))}
      <div class="grid ${t.state === "lost" ? "dim" : ""}">
        <div class="col">
          <div class="card scroll">${Z([
			s,
			this.clock,
			c,
			a,
			n?.part,
			this.selected,
			l
		], () => this.renderTower(e, c, a))}</div>
          ${Z([
			s,
			this.clock,
			t.weather,
			t.pits,
			c,
			n?.kind
		], () => S`<div class="pair">${this.renderWeather(e, t)}${this.renderPits(e, t)}</div>`)}
        </div>
        <div class="col">
          ${r ? T : Z([
			s,
			this.clock,
			t.map_available,
			t.map_reason,
			o,
			c,
			this.selected,
			this.settings?.is_admin
		], () => this.renderMap(e, t, o))}
          ${Z([
			s,
			this.clock,
			t.race_control,
			this.filter
		], () => this.renderRaceControl(e, t.race_control ?? []))}
          ${Z([
			s,
			this.clock,
			t.radio,
			this.playing,
			this.selected,
			c
		], () => this.renderRadio(e, t))}
        </div>
      </div>`;
	}
	timed(e, t = "") {
		return e ? S`<span class="t ${e.overall_best ? "ob" : e.personal_best ? "pb" : e.previous ? "prev" : ""} ${t}">${e.time}</span>` : S`<span class="t prev ${t}">—</span>`;
	}
	badge(e, t) {
		return t.status === "retired" ? S`<span class="badge ret">${e("live.ret")}</span>` : t.status === "stopped" ? S`<span class="badge ret">${e("live.stop")}</span>` : t.in_pit ? S`<span class="badge pit">${e("live.pit")}</span>` : t.pit_out ? S`<span class="badge out">${e("live.out")}</span>` : T;
	}
	renderTower(e, t, n) {
		let r = this.view?.header?.part ?? 1, i = n ? t.findIndex((e) => e.qualifying?.cutoff) : -1;
		return S`<table class="tower">
      <thead><tr>
        <th class="pos">${e("common.pos")}</th><th>${e("common.driver")}</th>
        ${n ? S`${[
			1,
			2,
			3
		].map((e) => S`<th class=${e === r ? "" : "col-s"}>Q${e}</th>`)}<th>${e("live.gap")}</th>` : S`<th class="col-gain"></th><th>${e("live.gap")}</th><th class="col-int">${e("live.int")}</th><th class="col-last">${e("live.last")}</th><th class="col-best">${e("live.best")}</th>`}
        <th class="col-s">S1</th><th class="col-s">S2</th><th class="col-s">S3</th>
        <th>${e("live.tyre")}</th>${n ? T : S`<th class="col-pits">${e("live.pits")}</th>`}
      </tr></thead>
      ${Q(t, (e) => e.number, (t, a) => S`<tbody>${this.row(e, t, a, n, r, a === i - 1)}</tbody>`)}
    </table>`;
	}
	row(e, t, n, r, i, a) {
		let o = t.status === "retired" || t.status === "knocked_out", s = t.number === this.selected, c = [
			s ? "sel" : "",
			o ? "out" : "",
			a ? "zone" : "",
			n % 2 ? "" : "alt"
		].join(" "), l = t.qualifying, u = () => this.select(t.number);
		return S`<tr class=${c} tabindex="0" aria-selected=${s ? "true" : "false"}
        @click=${u} @keydown=${Lt(u)}>
      <td class="pos num">${t.position ?? "—"}</td>
      <td><div class="drv"><span class="bar" style="background:${t.colour ?? "var(--divider-color)"}"></span>
        ${this.settings?.favourites?.includes(t.tla) ? S`<span class="fav" title=${e("drivers.followed")}>★</span>` : T}
        <span class="tla" title=${t.name ?? ""}>${t.tla}</span><small>${t.number}</small>
        ${t.penalty ? S`<span class="badge pen" title=${e("stewards.unserved")}>+${t.penalty}s</span>` : T}
        ${this.badge(e, t)}
        ${t.status === "knocked_out" ? S`<span class="badge ko">${e("live.ko")}</span>` : T}</div></td>
      ${r && l ? S`${[
			0,
			1,
			2
		].map((e) => S`<td class="t ${e + 1 === i ? "" : "col-s muted"}">${l.part_bests[e] ?? ""}</td>`)}<td class="t">${l.gap ?? ""}</td>` : S`<td class="col-gain">${zt(t.gained)}</td><td class="t">${Ft(e, t.gap)}</td><td class="t col-int">${Ft(e, t.interval, !0)}</td>
            <td class="col-last">${this.timed(t.last_lap)}</td>
            <td class="col-best">${t.best_lap ? S`<span class="t">${t.best_lap.time}</span>` : ""}</td>`}
      ${t.sectors.map((e, n) => S`<td class="col-s">${this.timed(e, "sector")}${Vt(t.segments?.[n])}</td>`)}
      <td>${t.tyre ? Rt(e, t.tyre.compound, t.tyre.new, t.tyre.age) : ""}</td>
      ${r ? T : S`<td class="num col-pits">${t.pit_stops}</td>`}
    </tr>
    ${s ? this.details(e, t, r ? 10 : 12) : T}`;
	}
	details(e, t, n) {
		let r = t.sectors.map((e, t) => S`<span>S${t + 1} ${this.timed(e)}</span>`), i = t.stints ?? [], a = t.pit_rejoin;
		return S`<tr class="details"><td colspan=${n}><div class="dwrap">
      <div class="dhead"><b>${t.name ?? t.tla}</b>${t.team ? S` · ${t.team}` : T}</div>
      <div class="facts narrow">
        ${t.interval ? S`<span>${e("live.int")} <span class="t">${Ft(e, t.interval, !0) || "—"}</span></span>` : T}
        ${t.best_lap ? S`<span>${e("live.best")} <span class="t">${t.best_lap.time}</span></span>` : T}
        ${r}
        <span>${e("live.pits")} ${t.pit_stops}</span>
      </div>
      ${i.length ? S`<table class="stints">
            <tr><th>${e("drivers.stint")}</th><th>${e("live.tyre")}</th><th>${e("drivers.laps")}</th><th>${e("drivers.bestInStint")}</th></tr>
            ${i.map((t, n) => S`<tr>
                <td class="num">${n + 1}</td>
                <td>${Rt(e, t.compound, t.new, null)}</td>
                <td class="num">${t.to_lap && t.to_lap !== t.from_lap ? e("drivers.lapRange", {
			from: t.from_lap,
			to: t.to_lap
		}) : e("drivers.fromLap", { from: t.from_lap })}
                  <small class="muted">(${t.laps})</small></td>
                <td>${t.best ? S`<span class="t">${t.best.time}</span>${t.best.lap ? S` <small class="muted">${e("drivers.onLap", { lap: t.best.lap })}</small>` : T}` : "—"}</td>
              </tr>`)}
          </table>` : T}
      ${a ? S`<div class="rejoin">${L(I.timer, 16)}
            <span>${e("drivers.rejoin", { position: a.position })}${a.ahead ? S` · ${e("drivers.behindOf", {
			driver: a.ahead,
			gap: q(this.hass, a.ahead_gap, 1)
		})}` : T}${a.behind ? S` · ${e("drivers.aheadOf", {
			driver: a.behind,
			gap: q(this.hass, a.behind_gap, 1)
		})}` : T}
              <small class="muted">${e(a.known ? "drivers.lossCircuit" : "drivers.lossGeneric", { loss: q(this.hass, a.loss, 1) })}${a.pitting ? ` ${e("drivers.pitting", { n: a.pitting })}` : ""}</small></span>
          </div>` : T}
    </div></td></tr>`;
	}
	driver(e) {
		let t = this.view?.tower;
		return t !== this.byNumberOf && (this.byNumberOf = t, this.byNumber = new Map((t ?? []).map((e) => [e.number, e]))), e === null ? void 0 : this.byNumber.get(e);
	}
	renderMap(e, t, n) {
		let r = S`<div class="card-head">${e("live.map")}</div>`;
		if (!t.map_available || !n) {
			let n = this.settings?.is_admin, i = t.map_reason ?? "not_configured", a = e(i === "no_data" ? "live.mapNoData" : n ? i === "token_problem" ? "live.mapToken" : "live.mapLocked" : "live.mapNotEnabled");
			return S`<div class="card">${r}<div class="locked">${L(I.lock, 36)}<div>${a}</div></div></div>`;
		}
		return S`<div class="card">${r}
      <plb-live-map .hass=${this.hass} .tower=${t.tower ?? []} .selected=${this.selected}
        .favourites=${this.settings?.favourites ?? []}
        @plb-select=${(e) => this.select(e.detail)}></plb-live-map></div>`;
	}
	renderRaceControl(e, t) {
		let n = Cn[this.filter], r = t.filter((e) => !n || e.kind === n);
		return S`<div class="card">
      <div class="card-head">${e("live.raceControl")}</div>
      <div class="filters">${Object.keys(Cn).map((t) => S`<button class="chip small ${this.filter === t ? "on" : ""}" aria-pressed=${this.filter === t ? "true" : "false"}
          @click=${() => this.filter = t}>${e(`live.${t}`)}</button>`)}</div>
      <div class="feed">${Q(r, (e) => `${e.utc}|${e.message}`, (t) => S`<div class="msg ${t.kind}"><span class="lap num">${t.lap ? `${e("common.lap")} ${t.lap}` : K(this.hass, t.utc, !0)}</span>
          <span>${t.message}${t.lap ? S`<time>${K(this.hass, t.utc)}</time>` : T}</span></div>`)}</div>
    </div>`;
	}
	renderRadio(e, t) {
		let n = t.radio ?? [];
		return S`<div class="card">
      <div class="card-head">${e("live.radio")}</div>
      ${n.length ? S`<div class="feed short">${Q(n, (e) => e.url, (t) => {
			let n = this.driver(t.number), r = this.playing === t.url, i = K(this.hass, t.utc);
			return S`<div class="radio ${t.number === this.selected ? "sel" : ""}">
                <button class="play" @click=${() => this.play(t.url)}
                  aria-label=${e(r ? "live.pause" : "live.play", {
				driver: n?.tla ?? t.number ?? "",
				time: i
			})}>${L(r ? I.pause : I.play, 18)}</button>
                <span class="bar" style="background:${n?.colour ?? "var(--divider-color)"}"></span><b>${n?.tla ?? t.number}</b>
                <time>${i}</time></div>`;
		})}</div>` : S`<div class="empty">${e("live.noRadio")}</div>`}
    </div>`;
	}
	renderWeather(e, t) {
		let n = t.weather;
		if (!n) return T;
		let r = n.wind_direction === null ? "" : S`<span class="wind" style="transform:rotate(${n.wind_direction + 180}deg)">↑</span>`;
		return S`<div class="card">
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
		if (!Tn.has(t.header?.kind ?? "")) return T;
		let n = t.pits ?? [];
		return S`<div class="card">
      <div class="card-head">${e("live.pitStops")}<span class="spacer"></span><small>${e("live.pitLane")}</small></div>
      ${n.length ? S`<div class="feed short pits">${Q(n, (e) => `${e.number}|${e.lap}`, (t) => {
			let n = this.driver(t.number);
			return S`<div><span class="bar" style="background:${n?.colour ?? "var(--divider-color)"}"></span><b>${n?.tla ?? t.number}</b>
                <span>${e("common.lap")} ${t.lap}</span><span class="num end">${e("delay.seconds", { n: t.duration })}</span></div>`;
		})}</div>` : S`<div class="empty">${e("live.noPits")}</div>`}
    </div>`;
	}
	static {
		this.styles = [
			R,
			mn,
			pn,
			lt,
			o`
      /* Sized by the panel's own width, not the window's: Home Assistant's sidebar
         takes a varying part of the window. */
      :host { display: block; container-type: inline-size; }
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
      .state .starts { margin-bottom: -10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .spin { display: grid; }
      .spin svg { animation: plb-spin 1.6s linear infinite; }
      @keyframes plb-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spin svg { animation: none; } }
      .banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: var(--plb-gap); border-radius: 10px; font-size: 14px;
        background: color-mix(in srgb, var(--warning-color, #ffa600) 16%, transparent); }
      .banner.lost { background: color-mix(in srgb, var(--error-color, #db4437) 16%, transparent); }
      .dim { opacity: 0.45; filter: grayscale(0.6); }
      .grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: var(--plb-gap); align-items: start; }
      .col { display: grid; gap: var(--plb-gap); align-content: start; min-width: 0; }
      .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--plb-gap); align-items: start; }
      .pair:empty { display: none; }
      .tower { width: 100%; border-collapse: collapse; font-size: 14px; }
      .tower th { text-align: left; font-weight: 500; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--secondary-text-color); padding: 8px 6px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; }
      .tower td { padding: 0 6px; height: 40px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; cursor: pointer; }
      .tower tr.alt td { background: var(--plb-row-alt); }
      .tower tr.sel td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .tower tr.out td { color: var(--plb-muted); }
      .tower tr.zone td { border-bottom: 2px dashed var(--error-color, #db4437); }
      .tower tr:focus-visible td { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .tower tr.details td { height: auto; padding: 10px 12px 12px; white-space: normal; cursor: default; font-size: 13px;
        background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
      .tower .dwrap { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 32px; align-items: start; }
      .tower .dhead { grid-column: 1 / -1; }
      .tower .dwrap .stints { grid-column: 1; grid-row: 2 / span 2; }
      .tower .dwrap .rejoin { grid-column: 2; }
      .tower tr.details .facts { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 4px; color: var(--secondary-text-color); }
      .tower tr.details .narrow { display: none; }
      .tower .stints { border-collapse: collapse; margin-top: 4px; font-size: 13px; }
      .tower .stints th { font-size: 10px; padding: 2px 16px 2px 0; border: 0; }
      .tower tr.details .stints td { height: 30px; padding: 0 16px 0 0; border: 0; background: none; cursor: default; }
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
      @media (pointer: coarse) {
        .play { width: 40px; height: 40px; }
      }
      /* A TV: 22 rows fit in 1080 lines, and the stewards card is one strip. */
      :host([kiosk]) .tower td { height: 32px; }
      :host([kiosk]) .tower th { padding: 4px 6px; }
      :host([kiosk]) .strip { padding: 8px 18px; margin-bottom: 10px; }
      :host([kiosk]) .grid, :host([kiosk]) .col { gap: 10px; }
      :host([kiosk]) .stewards { margin-bottom: 10px; }
      :host([kiosk]) .stewards .card-head { display: none; }
      :host([kiosk]) .stewards .compact { display: flex; }
      :host([kiosk]) .stewards .cols { display: none; }
      :host([kiosk]) .stewards.open .cols { display: grid; }
      @container (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
      @container (max-width: 900px) {
        .col-s { display: none; }
        .tower tr.details .narrow { display: flex; }
        .tower .dwrap { grid-template-columns: 1fr; }
        .tower .dwrap .stints, .tower .dwrap .rejoin { grid-column: 1; grid-row: auto; }
      }
      @container (max-width: 640px) {
        .col-best, .col-int, .col-pits, .tower .drv small { display: none; }
        .tower td, .tower th { padding: 0 4px; }
        .tower td { height: 44px; }
        .tower .drv { min-width: 0; gap: 6px; }
        .pos { width: 26px; }
        .strip { padding: 12px 14px; }
        .next-slot { width: 100%; text-align: left; }
      }
      /* A phone: position, driver, gap, last lap and tyre (SPEC §7). */
      @container (max-width: 480px) {
        .col-gain { display: none; }
        .tyre .used { display: none; }
        .tower { font-size: 13px; }
      }
    `
		];
	}
}, Dn = 5e3, On = 6e4, kn = .05, An = 30, jn = 15, Mn = [
	"r",
	"l",
	"t",
	"b"
], $ = {
	r: [9, -15 / 2],
	l: [-39, -15 / 2],
	t: [-15, -23],
	b: [-15, 8]
}, Nn = class extends k {
	constructor(...e) {
		super(...e), this.tower = [], this.selected = "", this.favourites = [], this.cars = [], this.width = 0, this.path = "", this.subscribing = !1, this.backoff = Dn, this.onScreen = !1, this.sides = /* @__PURE__ */ new Map(), this.focusNumber = "", this.visibility = () => this.sync();
	}
	static {
		this.properties = {
			hass: {
				attribute: !1,
				hasChanged: Nt
			},
			tower: { attribute: !1 },
			selected: { type: String },
			favourites: { attribute: !1 },
			outline: { state: !0 },
			cars: { state: !0 },
			width: { state: !0 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.observer = new IntersectionObserver((e) => {
			this.onScreen = e.some((e) => e.isIntersecting), this.sync();
		}), this.observer.observe(this), this.resize = new ResizeObserver((e) => {
			let t = Math.round(e[0]?.contentRect.width ?? 0);
			Math.abs(t - this.width) > 2 && (this.width = t);
		}), this.resize.observe(this), document.addEventListener("visibilitychange", this.visibility);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.observer?.disconnect(), this.resize?.disconnect(), document.removeEventListener("visibilitychange", this.visibility), this.stop();
	}
	stop() {
		window.clearTimeout(this.retry), this.retry = void 0, this.unsubscribe?.(), this.unsubscribe = void 0;
	}
	sync() {
		let e = this.isConnected && this.onScreen && document.visibilityState === "visible";
		e && !this.unsubscribe && !this.subscribing && this.retry === void 0 && this.hass ? this.subscribe() : e || this.stop();
	}
	async subscribe() {
		this.subscribing = !0;
		let e = !1;
		try {
			let e = await N.subscribeMap(this.hass, (e) => this.receive(e));
			this.unsubscribe = e, this.backoff = Dn;
		} catch {
			e = !0;
		} finally {
			this.subscribing = !1;
		}
		if (e) {
			this.isConnected && (this.retry = window.setTimeout(() => {
				this.retry = void 0, this.sync();
			}, this.backoff), this.backoff = Math.min(this.backoff * 2, On));
			return;
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
	key(e, t, n) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault(), this.select(n);
			return;
		}
		let r = {
			ArrowRight: 1,
			ArrowDown: 1,
			ArrowLeft: -1,
			ArrowUp: -1
		}[e.key];
		if (!r) return;
		e.preventDefault();
		let i = t[(t.indexOf(n) + r + t.length) % t.length];
		this.focusNumber = i, this.renderRoot.querySelector(`[data-number="${i}"]`)?.focus(), this.requestUpdate();
	}
	placeLabels(e, t, n) {
		let r = e.map((e) => [
			e.x - 7,
			e.y - 7,
			e.x + 7,
			e.y + 7
		]), i = /* @__PURE__ */ new Map(), a = (e) => r.some((t) => e[0] < t[2] && e[2] > t[0] && e[1] < t[3] && e[3] > t[1]);
		for (let o of e) {
			let e = this.sides.get(o.number), s = e ? [e, ...Mn.filter((t) => t !== e)] : [...Mn], c = null, l = null;
			for (let e of s) {
				let [i, s] = $[e], u = [
					o.x + i,
					o.y + s,
					o.x + i + An,
					o.y + s + jn
				], d = u[0] >= 0 && u[2] <= t && u[1] >= 0 && u[3] <= n;
				if (d && !l && (l = u), d && !a(u)) {
					c = e, r.push(u);
					break;
				}
			}
			!c && o.important && l && (c = s.find((e) => {
				let [r, i] = $[e];
				return o.x + r >= 0 && o.x + r + An <= t && o.y + i >= 0 && o.y + i + jn <= n;
			}) ?? null, r.push(l)), i.set(o.number, c), c && this.sides.set(o.number, c);
		}
		return i;
	}
	render() {
		let e = F(this.hass), t = this.outline;
		if (!t) return S`<div class="locked">${e("live.mapDrawing")}</div>`;
		let n = Math.max(t.width, t.height) * kn, r = t.width + 2 * n, i = t.height + 2 * n, a = new Map(this.tower.map((e) => [e.number, e])), o = new Set(this.favourites), s = this.selected.toUpperCase(), c = this.cars.filter((e) => {
			let t = a.get(e.number);
			return t ? t.status !== "retired" : !this.tower.length;
		}), l = (e) => {
			let t = a.get(e);
			return !!s && (e === s || t?.tla === s);
		}, u = (this.width || 380) / r, d = c.map((e) => {
			let t = a.get(e.number), r = l(e.number) || (t ? o.has(t.tla) : !1);
			return {
				number: e.number,
				x: (e.x + n) * u,
				y: (e.y + n) * u,
				important: r,
				position: t?.position ?? 99
			};
		}).sort((e, t) => Number(t.important) - Number(e.important) || e.position - t.position), f = this.placeLabels(d, r * u, i * u), p = c.map((e) => e.number), m = p.includes(this.focusNumber) ? this.focusNumber : p.find(l) ?? p[0], h = 100 / r;
		return S`<div class="map" role="group" aria-label=${e("live.map")} style="aspect-ratio:${r} / ${i}">
      <svg viewBox="${-n} ${-n} ${r} ${i}" aria-hidden="true">
        ${this.path ? C`<path class="track" d=${this.path}></path><path class="track-line" d=${this.path}></path>` : T}
      </svg>
      ${Q(c, (e) => e.number, (e) => {
			let t = a.get(e.number), r = l(e.number), i = f.get(e.number);
			return S`<div class=${[
				"car",
				r ? "sel" : "",
				t?.position === 1 ? "leader" : "",
				t && o.has(t.tla) ? "fav" : "",
				e.on_track && t?.status !== "stopped" ? "" : "off"
			].join(" ")} data-number=${e.number} role="button" tabindex=${e.number === m ? "0" : "-1"}
            aria-label=${t?.tla ?? e.number} aria-pressed=${r ? "true" : "false"}
            style="transform:translate(${((e.x + n) * h).toFixed(3)}cqw,${((e.y + n) * h).toFixed(3)}cqw);--c:${t?.colour ?? "var(--divider-color)"}"
            @click=${() => this.select(e.number)} @keydown=${(t) => this.key(t, p, e.number)}
            @focus=${() => this.focusNumber = e.number}>
          <span class="dot"></span>${i ? S`<span class="label ${i}">${t?.tla ?? e.number}</span>` : T}</div>`;
		})}
    </div>`;
	}
	static {
		this.styles = o`
    :host { display: block; padding: 4px; }
    .map { position: relative; container-type: inline-size; width: 100%; }
    svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .track { fill: none; stroke: var(--secondary-background-color); stroke-width: 18; stroke-linejoin: round; }
    .track-line { fill: none; stroke: var(--secondary-text-color); stroke-width: 3; opacity: 0.5; }
    .car { position: absolute; left: 0; top: 0; width: 0; height: 0; cursor: pointer; outline: none;
      transition: transform 0.25s linear; will-change: transform; }
    .dot { position: absolute; left: -6px; top: -6px; width: 12px; height: 12px; border-radius: 50%; box-sizing: border-box;
      background: var(--c); border: 2px solid var(--card-background-color); }
    .car.leader .dot { box-shadow: 0 0 0 2px var(--plb-yellow); }
    .car.fav .dot { box-shadow: 0 0 0 2px #f2c200; }
    .car.sel { z-index: 2; }
    .car.sel .dot { left: -9px; top: -9px; width: 18px; height: 18px; border: 3px solid var(--primary-text-color); }
    .car.off { opacity: 0.4; }
    .car:focus-visible .dot { box-shadow: 0 0 0 3px var(--primary-color); }
    /* The dot is small; the target around it is 36 px. */
    .car::before { content: ""; position: absolute; left: -18px; top: -18px; width: 36px; height: 36px; border-radius: 50%; }
    .label { position: absolute; width: ${An}px; height: ${jn}px; line-height: ${jn}px; font-size: 12px; font-weight: 700;
      color: var(--primary-text-color); text-align: center; pointer-events: none; white-space: nowrap;
      text-shadow: 0 0 3px var(--card-background-color), 0 0 3px var(--card-background-color), 0 0 2px var(--card-background-color); }
    .label.r { left: ${$.r[0]}px; top: ${$.r[1]}px; text-align: left; }
    .label.l { left: ${$.l[0]}px; top: ${$.l[1]}px; text-align: right; }
    .label.t { left: ${$.t[0]}px; top: ${$.t[1]}px; }
    .label.b { left: ${$.b[0]}px; top: ${$.b[1]}px; }
    .car.sel .label { z-index: 1; }
    .locked { padding: 20px 16px; color: var(--secondary-text-color); font-size: 13px; }
    @media (prefers-reduced-motion: reduce) { .car { transition: none; } }
  `;
	}
}, Pn = /* @__PURE__ */ new Set([
	"token_invalid",
	"token_expired",
	"token_no_subscription",
	"token_missing"
]), Fn = class extends k {
	constructor(...e) {
		super(...e), this.testResult = "", this.token = "", this.tokenError = "", this.saving = !1, this.confirmRemove = !1, this.busy = !1, this.clock = 0, this.asked = !1;
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
			busy: { state: !0 },
			clock: { attribute: !1 }
		};
	}
	willUpdate() {
		this.hass && !this.asked && (this.asked = !0, this.loadEntities(), this.settings?.is_admin && this.loadDrivers());
	}
	async loadDrivers() {
		try {
			let e = await N.standings(this.hass, this.settings.season, null, "drivers");
			e.rows.length || (e = await N.standings(this.hass, this.settings.season - 1, null, "drivers")), this.drivers = e.rows.filter((e) => e.code).map((e) => ({
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
			this.entities = (await N.entities(this.hass)).entities;
		} catch {
			this.entities = [];
		}
	}
	async set(e, t) {
		this.busy = !0;
		try {
			await N.setSettings(this.hass, e);
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
			await N.setToken(this.hass, e), this.token = "";
		} catch (e) {
			let t = e?.message ?? "";
			this.tokenError = Pn.has(t) ? t : "token_invalid";
		} finally {
			this.saving = !1;
		}
	}
	async removeToken() {
		this.saving = !0;
		try {
			await N.removeToken(this.hass);
		} catch {
			this.tokenError = "remove_failed";
		} finally {
			this.saving = !1, this.confirmRemove = !1;
		}
	}
	stateText(e, t) {
		return this.hass.formatEntityState ? this.hass.formatEntityState(e) : (e.attributes.device_class === "timestamp" || t === "event") && !Number.isNaN(Date.parse(e.state)) ? `${Tt(this.hass, e.state)} ${K(this.hass, e.state, !0)}` : e.state;
	}
	moreInfo(e) {
		this.dispatchEvent(new CustomEvent("hass-more-info", {
			detail: { entityId: e },
			bubbles: !0,
			composed: !0
		}));
	}
	render() {
		let e = F(this.hass), t = this.settings;
		return S`<div class="page">
      ${this.renderLive(e, t)}
      ${this.renderDelay(e, t)}
      ${this.renderClock(e)}
      ${t.is_admin ? this.renderDrivers(e, t) : T}
      ${t.is_admin ? this.renderSummary(e, t) : T}
      ${t.is_admin ? this.renderPanel(e, t) : T}
      ${t.is_admin ? this.renderF1tv(e, t) : T}
      ${this.renderKiosk(e)}
      ${this.renderEntities(e)}
    </div>`;
	}
	renderLive(e, t) {
		let n = t.live ? t.running ? e("settings.running") : e("settings.waiting") : e("settings.pausedHelp");
		return S`<section class="card">
      <div class="card-head">${e("settings.live")}</div>
      <div class="live">
        <div class="play-box">
          <button class="big-play ${t.live ? "on" : ""}" ?disabled=${this.busy} @click=${() => this.set({ live: !t.live })}
            aria-pressed=${t.live ? "true" : "false"} aria-label=${t.live ? e("settings.pause") : e("settings.start")}>
            ${L(t.live ? I.pause : I.play, 36)}
          </button>
          <small aria-hidden="true">${t.live ? e("settings.pauseShort") : e("settings.startShort")}</small>
        </div>
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
			await N.setHousehold(this.hass, e), e.favourites && this.loadEntities();
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
		return S`<section class="card">
      <div class="card-head">${e("drivers.title")}<span class="spacer"></span><small>${e("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${e("drivers.help")}</p>
        ${i ? S`<div class="chips">${i.map((e) => {
			let t = n.includes(e.code);
			return S`<button class="chip ${t ? "on" : ""}" ?disabled=${this.busy || !t && r}
                title=${e.name ?? e.code} aria-pressed=${t ? "true" : "false"}
                @click=${() => this.setHousehold({ favourites: this.toggle(n, e.code, !t) })}>
                ${t ? "★ " : ""}${e.code}</button>`;
		})}</div>` : S`<span class="muted">${e("common.loading")}</span>`}
        <small class="muted">${e("drivers.max")}</small>
      </div>
    </section>`;
	}
	async testSummary() {
		this.testResult = "";
		try {
			let { result: e } = await N.testSummary(this.hass);
			this.testResult = e === "sent" ? "summary.testSent" : e === "hidden" ? "summary.testHidden" : "summary.testNothing";
		} catch {
			this.testResult = "summary.testFailed";
		}
	}
	renderTargets(e, t, n) {
		let r = (e) => {
			if (!e) return;
			let r = e.value.trim().replace(/^notify\./, "");
			t.includes(r) && (e.value = "", n.includes(r) || this.setHousehold({ notify_targets: [...n, r] }));
		}, i = t.filter((e) => !n.includes(e));
		return S`<div class="targets">
      ${n.length ? S`<ul>${n.map((r) => S`<li>
              <span class="who">notify.${r}</span>
              ${t.includes(r) ? T : S`<span class="missing small">${e("summary.missing")}</span>`}
              <button class="btn flat" ?disabled=${this.busy}
                @click=${() => this.setHousehold({ notify_targets: n.filter((e) => e !== r) })}>${e("summary.remove")}</button>
            </li>`)}</ul>` : S`<span class="muted small">${e("summary.none")}</span>`}
      ${t.length ? S`<div class="add-row">
            <input list="plb-notify-services" placeholder=${e("summary.placeholder")}
              aria-label=${e("summary.placeholder")} ?disabled=${this.busy || !i.length}
              @change=${(e) => {
			let n = e.target;
			t.includes(n.value.trim().replace(/^notify\./, "")) && r(n);
		}}
              @keydown=${(e) => {
			e.key === "Enter" && r(e.target);
		}} />
            <button class="btn flat" ?disabled=${this.busy || !i.length}
              @click=${(e) => r(e.target.previousElementSibling)}>${e("summary.add")}</button>
          </div>
          <datalist id="plb-notify-services">${i.map((e) => S`<option value=${`notify.${e}`}></option>`)}</datalist>` : S`<span class="muted">${e("summary.noServices")}</span>`}
    </div>`;
	}
	renderSummary(e, t) {
		let n = Object.keys(this.hass.services?.notify ?? {}).filter((e) => !["send_message"].includes(e)).sort(), r = t.notify_targets ?? [], i = t.summary_kinds ?? [];
		return S`<section class="card">
      <div class="card-head">${e("summary.title")}<span class="spacer"></span><small>${e("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${e("summary.help")}</p>
        <b class="small">${e("summary.where")}</b>
        ${this.renderTargets(e, n, r)}
        <b class="small">${e("summary.which")}</b>
        <div class="chips">${[
			"race",
			"sprint",
			"qualifying",
			"sprint_qualifying",
			"practice"
		].map((t) => {
			let n = i.includes(t);
			return S`<button class="chip ${n ? "on" : ""}" ?disabled=${this.busy}
            @click=${() => this.setHousehold({ summary_kinds: this.toggle(i, t, !n) })}>${e(`sessions.${t}`)}</button>`;
		})}</div>
        <b class="small">${e("summary.format")}</b>
        <div class="chips" role="radiogroup" aria-label=${e("summary.format")}>
          ${["compact", "full"].map((n) => S`<button class="chip ${(t.summary_format ?? "compact") === n ? "on" : ""}" role="radio"
              aria-checked=${(t.summary_format ?? "compact") === n ? "true" : "false"} ?disabled=${this.busy}
              @click=${() => this.setHousehold({ summary_format: n })}>${e(`summary.${n}`)}</button>`)}
        </div>
        <small class="muted">${e(`summary.${t.summary_format === "full" ? "fullHelp" : "compactHelp"}`)}</small>
        <div class="line">
          <button class="btn flat" ?disabled=${!r.length} @click=${() => this.testSummary()}>${e("summary.test")}</button>
          ${this.testResult ? S`<span class="muted small">${e(this.testResult)}</span>` : T}
        </div>
        <small class="muted">${e("summary.spoiler")}</small>
      </div>
    </section>`;
	}
	async setPanel(e, t) {
		this.busy = !0;
		try {
			await N.setPanel(this.hass, e);
		} catch {
			t instanceof HTMLInputElement && (t.checked = !t.checked);
		} finally {
			this.busy = !1;
		}
	}
	renderPanel(e, t) {
		return S`<section class="card">
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
			await gt(this.hass, e);
		} catch {}
		this.requestUpdate();
	}
	renderClock(e) {
		let t = mt(), n = [
			["home_assistant", e("time.home", { zone: St(this.hass) })],
			["device", e("time.device", { zone: xt() })],
			["circuit", e("time.circuit")]
		];
		return S`<section class="card">
      <div class="card-head">${e("time.title")}<span class="spacer"></span><small>${e("time.justYou")}</small></div>
      <div class="radios" role="radiogroup" aria-label=${e("time.title")}>
        ${n.map(([e, n]) => S`<label class="row">
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
		return S`<section class="card">
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
		return S`<section class="card">
      <div class="card-head">F1TV<span class="spacer"></span><small>${e("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${e("settings.f1tvHelp")}</p>
        <div class="status">
          <span class="dot ${n?.status ?? ""}"></span><b>${e(`f1tv.${n?.status ?? "not_configured"}`)}</b>
          ${n?.expires ? S`<span class="muted">${e("settings.expires", { date: Tt(this.hass, n.expires) })}</span>` : T}
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
        ${this.tokenError ? S`<div class="error-text" role="alert">${e(`settings.errors.${this.tokenError}`)}</div>` : T}
        <p class="muted small">${e("settings.tokenSteps")}</p>
        ${r ? this.confirmRemove ? S`<div class="confirm">${e("settings.removeConfirm")}
                <button class="btn danger" ?disabled=${this.saving} @click=${() => this.removeToken()}>${e("settings.remove")}</button>
                <button class="btn flat" @click=${() => this.confirmRemove = !1}>${e("settings.cancel")}</button></div>` : S`<button class="btn flat danger" @click=${() => this.confirmRemove = !0}>${e("settings.remove")}</button>` : T}
      </div>
    </section>`;
	}
	renderKiosk(e) {
		let t = `${location.origin}${location.pathname}?kiosk`;
		return S`<section class="card">
      <div class="card-head">${e("kiosk.title")}</div>
      <div class="body">
        <p>${e("kiosk.help")}</p>
        <div class="token">
          <input readonly .value=${t} aria-label=${e("kiosk.title")} @focus=${(e) => e.target.select()} />
          <button class="btn flat" @click=${() => void navigator.clipboard?.writeText(t)}>${e("kiosk.copy")}</button>
        </div>
        <small class="muted">${e("kiosk.options")}</small>
        <p>${e("kiosk.small")}</p>
      </div>
    </section>`;
	}
	renderEntities(e) {
		let t = this.entities;
		return S`<section class="card">
      <div class="card-head">${e("settings.entities")}</div>
      ${t ? S`<ul class="entities">${t.map((t) => {
			let n = this.hass.states?.[t.entity_id];
			return S`<li><button class="entity" @click=${() => this.moreInfo(t.entity_id)}>
              <span class="name">${n?.attributes.friendly_name ?? t.entity_id}<small title=${t.entity_id}>${t.entity_id}</small></span>
              ${((e) => S`<span class="value" title=${e}>${e}</span>`)(t.disabled ? e("settings.disabled") : n ? this.stateText(n, t.domain) : "—")}
            </button></li>`;
		})}</ul>` : S`<div class="body muted">${e("common.loading")}</div>`}
      <div class="note">${e("settings.entitiesHelp")}</div>
    </section>`;
	}
	static {
		this.styles = [R, o`
      :host { display: block; container-type: inline-size; }
      .page { display: grid; gap: var(--plb-gap); max-width: 760px; margin: 0 auto; }
      .body { padding: 14px 16px; display: grid; gap: 12px; }
      .body p { margin: 0; color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; }
      .small { font-size: 12px; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .line { display: flex; align-items: center; gap: 10px; font-size: 14px; }
      .line input { width: 18px; height: 18px; accent-color: var(--primary-color); }
      .targets { display: grid; gap: 6px; }
      .targets ul { list-style: none; margin: 0; padding: 0; }
      .targets li { display: flex; align-items: center; gap: 10px; padding: 4px 0; font-size: 14px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0); }
      .targets .who { flex: 1; min-width: 0; overflow-wrap: anywhere; }
      .targets .missing { color: var(--error-color, #db4437); }
      .add-row { display: flex; gap: 8px; align-items: center; }
      .add-row input { flex: 1; min-width: 0; font: inherit; padding: 8px 10px; border-radius: 8px;
        border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
        color: var(--primary-text-color); }
      .body > .btn { justify-self: start; }
      .live { display: flex; align-items: center; gap: 18px; padding: 18px 16px 8px; }
      .play-box { display: grid; justify-items: center; gap: 4px; flex: none; }
      .play-box small { font-size: 11px; color: var(--secondary-text-color); }
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
      .stepper button { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer; }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      .status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 14px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--divider-color); }
      .dot.active { background: var(--plb-green); }
      .dot.expiring { background: var(--warning-color, #ffa600); }
      .dot.expired, .dot.invalid { background: var(--error-color, #db4437); }
      .token { display: flex; gap: 8px; }
      .token input { flex: 1; min-width: 0; height: 40px; box-sizing: border-box; border-radius: 8px; border: 1px solid var(--divider-color);
        background: var(--card-background-color); color: var(--primary-text-color); padding: 0 10px; font: inherit; }
      .error-text { color: var(--error-color, #db4437); font-size: 13px; }
      .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 13px; }
      .btn.danger:not(.flat) { background: var(--error-color, #db4437); }
      .entities { list-style: none; margin: 0; padding: 0; }
      .entity { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 16px; border: 0; border-bottom: 1px solid var(--divider-color);
        background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
      .entity:hover { background: var(--plb-row-alt); }
      .entity .name { flex: 1; display: grid; gap: 2px; min-width: 0; font-size: 14px; }
      .entity small { color: var(--secondary-text-color); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
      .entity .value { color: var(--secondary-text-color); font-size: 13px; max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @container (max-width: 640px) {
        .token { flex-direction: column; }
      }
    `];
	}
}, In = 6e5, Ln = class extends k {
	constructor(...e) {
		super(...e), this.seasons = [], this.kind = "drivers", this.round = null, this.failed = !1, this.request = 0, this.spoilers = "", this.pages = /* @__PURE__ */ new Map(), this.visibility = () => {
			document.visibilityState === "visible" && this.refresh();
		};
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
	connectedCallback() {
		super.connectedCallback(), this.timer = window.setInterval(() => this.refresh(), 6e4), document.addEventListener("visibilitychange", this.visibility), this.refresh();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this.timer), document.removeEventListener("visibilitychange", this.visibility);
	}
	get key() {
		return `${this.season}|${this.kind}|${this.round}`;
	}
	refresh() {
		let e = this.pages.get(this.key);
		this.round === null && e && Date.now() - e.at > In && document.visibilityState !== "hidden" && this.load(!0);
	}
	willUpdate(e) {
		this.season === void 0 && this.settings && (this.season = this.settings.season);
		let t = Pt(this.settings);
		t === this.spoilers ? [
			"season",
			"kind",
			"round"
		].some((t) => e.has(t)) && this.load() : (this.spoilers = t, this.pages.clear(), this.load());
	}
	async load(e = !1) {
		if (!this.hass || this.season === void 0) return;
		let t = this.key, n = this.pages.get(t);
		if (n && !e && (this.round !== null || Date.now() - n.at < In)) {
			this.request++, this.data = n.data, this.failed = !1;
			return;
		}
		let r = ++this.request;
		n || (this.failed = !1);
		try {
			let e = await N.standings(this.hass, this.season, this.round, this.kind);
			this.pages.set(t, {
				data: e,
				at: Date.now()
			}), r === this.request && (this.data = e, this.failed = !1);
		} catch {
			r === this.request && !n && (this.failed = !0);
		}
	}
	render() {
		let e = F(this.hass), t = this.seasons.length ? this.seasons : [this.season ?? 0], n = this.data?.rounds ?? 0, r = this.data?.round ?? n;
		return S`
      <div class="toolbar">
        <h1>${e("standings.title")}</h1>
        ${["drivers", "constructors"].map((t) => S`<button class="chip ${this.kind === t ? "on" : ""}" @click=${() => this.kind = t}>${e(`standings.${t}`)}</button>`)}
        <span class="spacer"></span>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.round = null, this.data = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => S`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
        ${n ? S`<select aria-label=${e("common.round")} @change=${(e) => this.round = Number(e.target.value)}>
              ${Array.from({ length: n }, (e, t) => n - t).map((t) => S`<option .selected=${t === r} value=${t}>${e("standings.after", { n: t })}</option>`)}
            </select>` : T}
      </div>
      ${this.failed ? X(e, () => this.load()) : this.data ? this.renderTable(this.data) : Ht(e)}
    `;
	}
	renderTable(e) {
		let t = F(this.hass);
		if (!e.rows.length) return S`<div class="card state">${e.capped ? t("spoiler.standingsCap") : t("standings.empty")}</div>`;
		let n = this.kind === "drivers", r = e.rows[0].points || 1, i = e.rows.some((e) => !!e.change);
		return S`<div class="card">
      <div class="scroll"><table class="tbl">
        <tr>
          <th>${t("common.pos")}</th>${i ? S`<th>${t("standings.change")}</th>` : T}
          <th>${t(n ? "common.driver" : "common.team")}</th>
          ${n ? S`<th class="wide">${t("common.team")}</th>` : T}
          <th class="barcol"></th>
          <th class="r">${t("common.points")}</th><th class="r">${t("standings.wins")}</th><th class="r col-behind">${t("standings.behind")}</th>
        </tr>
        ${e.rows.map((e) => S`<tr>
            <td class="num">${e.position_text && e.position_text !== String(e.position) ? e.position_text : e.position}</td>
            ${i ? S`<td>${zt(e.change, !1)}</td>` : T}
            <td class="wrap">${Y(n ? e.name : e.team, e.team_id)}</td>
            ${n ? S`<td class="wide muted">${e.team ?? ""}</td>` : T}
            <td class="barcol"><div class="fill" style="width:${(e.points ?? 0) / r * 100}%;background:${B(e.team_id)}"></div></td>
            <td class="r num"><b>${q(this.hass, e.points)}</b></td>
            <td class="r num">${e.wins ?? ""}</td>
            <td class="r num col-behind">${e.behind ? `−${q(this.hass, e.behind)}` : ""}</td>
          </tr>`)}
      </table></div>
      ${e.capped ? S`<div class="note">${t("spoiler.standingsCap")}</div>` : T}
    </div>`;
	}
	static {
		this.styles = [R, o`
      :host { display: block; container-type: inline-size; }
      .barcol { width: 30%; min-width: 80px; }
      .fill { height: 6px; border-radius: 3px; min-width: 2px; }
      @container (max-width: 900px) { .wide { display: none; } }
      @container (max-width: 640px) { .barcol { display: none; } }
      @container (max-width: 640px) { .tbl td.wrap { white-space: normal; } }
      @container (max-width: 420px) { .col-behind { display: none; } }
    `];
	}
}, Rn = [
	"live",
	"calendar",
	"results",
	"standings"
], zn = [...Rn, "settings"], Bn = "pit-lane-live-board-page", Vn = 3e4;
function Hn() {
	return new URLSearchParams(location.search);
}
function Un() {
	let e = Hn();
	return e.has("kiosk") && ![
		"0",
		"false",
		"off",
		"no"
	].includes((e.get("kiosk") ?? "").toLowerCase());
}
function Wn() {
	return Math.min(2.5, Math.max(.6, Number(Hn().get("scale")) || 1));
}
function Gn() {
	let e = Hn().get("page");
	if (e && zn.includes(e)) return e;
	try {
		let e = localStorage.getItem(Bn);
		return e && zn.includes(e) ? e : "live";
	} catch {
		return "live";
	}
}
var Kn = class extends k {
	constructor(...e) {
		super(...e), this.narrow = !1, this.page = Gn(), this.seasons = [], this.delayOpen = !1, this.failed = !1, this.clockVersion = 0, this.kiosk = !1, this.fullscreen = !1, this.kioskAsked = !1, this.scale = 1, this.moved = () => {
			this.classList.remove("idle"), window.clearTimeout(this.idleTimer), this.kiosk && (this.idleTimer = window.setTimeout(() => {
				this.kiosk && this.classList.add("idle");
			}, 3e3));
		}, this.fullscreenChanged = () => {
			this.fullscreen = !!document.fullscreenElement, !this.fullscreen && !this.kioskAsked && this.kiosk && this.endKiosk();
		}, this.visibilityChanged = () => {
			document.visibilityState === "visible" && this.kiosk && this.keepAwake();
		}, this.clockChanged = () => this.clockVersion++, this.connecting = !1, this.backoff = 5e3, this.askingSeasons = !1, this.pendingDelay = null;
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
			clockVersion: { state: !0 },
			kiosk: {
				type: Boolean,
				reflect: !0
			},
			fullscreen: { state: !0 }
		};
	}
	get t() {
		return F(this.hass);
	}
	connectedCallback() {
		super.connectedCallback(), window.addEventListener(V, this.clockChanged), window.addEventListener("pointermove", this.moved), document.addEventListener("fullscreenchange", this.fullscreenChanged), document.addEventListener("visibilitychange", this.visibilityChanged), this.kioskAsked = Un(), this.kiosk = this.kioskAsked, this.fullscreen = !!document.fullscreenElement, this.scale = Wn();
		let e = Hn().get("page");
		e && zn.includes(e) && (this.page = e), this.kiosk && this.startKiosk();
	}
	startKiosk() {
		this.moved(), this.keepAwake();
	}
	endKiosk() {
		this.kiosk = !1, window.clearTimeout(this.idleTimer), this.classList.remove("idle"), this.letSleep();
	}
	keepAwake() {
		let e = navigator.wakeLock;
		if (!e) return;
		let t = this.wakeLock;
		this.wakeLock = void 0, t?.release().catch(() => void 0), e.request("screen").then((e) => {
			this.kiosk && this.isConnected ? this.wakeLock = e : e.release().catch(() => void 0);
		}, () => void 0);
	}
	letSleep() {
		this.wakeLock?.release().catch(() => void 0), this.wakeLock = void 0;
	}
	async toggleFullScreen() {
		if (document.fullscreenElement) {
			await document.exitFullscreen().catch(() => void 0);
			return;
		}
		this.kiosk || (this.kiosk = !0, this.startKiosk());
		try {
			await document.documentElement.requestFullscreen();
		} catch {}
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.removeEventListener(V, this.clockChanged), window.removeEventListener("pointermove", this.moved), document.removeEventListener("fullscreenchange", this.fullscreenChanged), document.removeEventListener("visibilitychange", this.visibilityChanged), window.clearTimeout(this.idleTimer), this.letSleep(), this.unsubscribe?.(), this.unsubscribe = void 0, window.clearTimeout(this.retry), this.retry = void 0, window.clearTimeout(this.seasonsTimer), this.seasonsTimer = void 0;
	}
	updated() {
		this.hass && !this.unsubscribe && !this.connecting && this.retry === void 0 && this.connect();
	}
	async connect() {
		if (this.hass) {
			this.connecting = !0, ht(this.hass);
			try {
				this.unsubscribe = await N.subscribeSettings(this.hass, (e) => this.receive(e)), this.failed = !1, this.backoff = 5e3;
			} catch {
				this.failed = !0, this.retry = window.setTimeout(() => {
					this.retry = void 0, this.requestUpdate();
				}, this.backoff), this.backoff = Math.min(this.backoff * 2, 6e4);
				return;
			} finally {
				this.connecting = !1;
			}
			this.loadSeasons();
		}
	}
	async loadSeasons() {
		if (!(!this.hass || this.seasons.length || this.askingSeasons)) {
			this.askingSeasons = !0;
			try {
				this.seasons = (await N.seasons(this.hass)).seasons;
			} catch {
				window.clearTimeout(this.seasonsTimer), this.seasonsTimer = window.setTimeout(() => {
					this.seasonsTimer = void 0, this.loadSeasons();
				}, Vn);
			} finally {
				this.askingSeasons = !1;
			}
		}
	}
	get seasonList() {
		if (this.seasons.length) return this.seasons;
		let e = this.settings;
		if (!e) return [];
		let t = e.first_season || e.season;
		return Array.from({ length: Math.max(1, e.season - t + 1) }, (t, n) => e.season - n);
	}
	receive(e) {
		this.settings = this.pendingDelay === null ? e : {
			...e,
			tv_delay: this.pendingDelay
		};
	}
	go(e) {
		if ((e.page !== "circuit" || e.circuit_id) && (this.page = e.page, this.target = e, this.delayOpen = !1, e.page !== "circuit")) try {
			localStorage.setItem(Bn, e.page);
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
			let t = await N.setSettings(this.hass, { tv_delay: e });
			this.pendingDelay === e && (this.pendingDelay = null), this.receive(t);
		} catch {
			this.pendingDelay = null;
			try {
				this.receive(await N.settings(this.hass));
			} catch {}
		}
	}
	async setSpoiler(e) {
		if (this.hass) try {
			this.receive(await N.setSettings(this.hass, { no_spoiler: e }));
		} catch {}
	}
	async reveal(e) {
		if (this.hass) try {
			this.receive(await N.reveal(this.hass, e.detail));
		} catch {}
	}
	back() {
		let e = this.target?.page === "circuit" ? this.target.from : void 0;
		this.go({ page: e && e !== "circuit" ? e : "calendar" });
	}
	toggleMenu() {
		this.dispatchEvent(new Event("hass-toggle-menu", {
			bubbles: !0,
			composed: !0
		}));
	}
	renderPage() {
		if (!this.hass || !this.settings) return this.failed ? X(this.t, () => {
			window.clearTimeout(this.retry), this.retry = void 0, this.connect();
		}) : S`<div class="card loading">${this.t("common.loading")}</div>`;
		let e = {
			hass: this.hass,
			settings: this.settings,
			seasons: this.seasonList,
			clock: this.clockVersion
		};
		switch (this.page) {
			case "settings": return S`<plb-settings .hass=${e.hass} .settings=${e.settings} .clock=${e.clock}
          @plb-delay=${(e) => this.setDelay(e.detail)}></plb-settings>`;
			case "calendar": return S`<plb-calendar .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons} .clock=${e.clock}
          @plb-go=${(e) => this.go(e.detail)}></plb-calendar>`;
			case "results": return S`<plb-results .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons} .clock=${e.clock}
          .target=${this.target} @plb-reveal=${this.reveal} @plb-go=${(e) => this.go(e.detail)}></plb-results>`;
			case "circuit": return S`<plb-circuit .hass=${e.hass} .settings=${e.settings} .circuitId=${this.target?.circuit_id ?? ""}
          .circuitName=${this.target?.circuit ?? ""} @plb-back=${() => this.back()}></plb-circuit>`;
			case "standings": return S`<plb-standings .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons}></plb-standings>`;
			default: return S`<plb-live .hass=${e.hass} .settings=${e.settings} .clock=${e.clock} ?kiosk=${this.kiosk}
          @plb-spoiler-off=${() => this.setSpoiler(!1)}></plb-live>`;
		}
	}
	render() {
		let e = this.t, t = this.settings, n = t?.f1tv && t.f1tv.status !== "not_configured" ? t.f1tv.status : null, r = this.scale === 1 ? "" : `zoom:${this.scale}`, i = this.fullscreen || this.kiosk && !this.kioskAsked;
		return S`
      <div class="barwrap" style=${r}><header class="appbar">
        ${this.narrow && !this.kiosk ? S`<button class="icon-btn" @click=${this.toggleMenu} aria-label=${e("common.menu")}>${L(I.menu, 24)}</button>` : T}
        <div class="brand"><span class="mark">${L(I.board, 18)}</span><span class="name">${e("common.title")}</span></div>
        <nav class="tabs">
          ${Rn.map((t) => S`<button class="tab ${this.page === t || this.page === "circuit" && this.target?.from === t ? "active" : ""}"
              aria-current=${this.page === t ? "page" : "false"}
              @click=${() => this.go({ page: t })}>${e(`tabs.${t}`)}</button>`)}
        </nav>
        <span class="spacer"></span>
        ${t && !t.live ? S`<button class="chip paused" @click=${() => this.go({ page: "settings" })} title=${e("settings.pausedHelp")}
              aria-label=${t.auto_start ? e("live.pausedAuto") : e("live.pausedShort")}>
              ${L(I.pause, 16)}<span class="label">${t.auto_start ? e("live.pausedAuto") : e("live.pausedShort")}</span></button>` : T}
        ${n ? S`<span class="chip small f1tv ${n === "active" ? "" : "warn"}" title=${e(`f1tv.${n}`)}>F1TV</span>` : T}
        <button class="chip delay ${t?.tv_delay ? "on" : ""}" @click=${() => this.delayOpen = !this.delayOpen}
          aria-expanded=${this.delayOpen ? "true" : "false"} aria-label=${e("delay.title")}>
          ${L(I.clock, 18)}<span class="num">${e("delay.seconds", { n: t?.tv_delay ? `+${t.tv_delay}` : 0 })}</span>
          <span class="label">${e("delay.title")}</span>
        </button>
        <button class="chip spoiler ${t?.no_spoiler ? "on" : ""}" @click=${() => this.setSpoiler(!t?.no_spoiler)}
          title=${e("spoiler.help")} aria-pressed=${t?.no_spoiler ? "true" : "false"}
          aria-label=${t?.no_spoiler ? e("spoiler.on") : e("spoiler.off")}>
          ${L(t?.no_spoiler ? I.eyeOff : I.eye, 18)}
          <span class="label">${t?.no_spoiler ? e("spoiler.on") : e("spoiler.off")}</span>
        </button>
        <button class="icon-btn full" @click=${() => i && !this.fullscreen ? this.endKiosk() : this.toggleFullScreen()}
          aria-label=${e(i ? "kiosk.leave" : "kiosk.enter")} title=${e(i ? "kiosk.leave" : "kiosk.enter")}>
          ${L(i ? I.exitFullscreen : I.fullscreen, 22)}</button>
        <button class="icon-btn gear ${this.page === "settings" ? "active" : ""}" @click=${() => this.go({ page: "settings" })}
          aria-label=${e("settings.title")} title=${e("settings.title")}>${L(I.cog, 22)}</button>
      </header></div>
      ${this.delayOpen && t ? this.renderPopover(t) : T}
      <main style=${r}>${$e(this.renderPage())}</main>
      <footer style=${r}>${e("common.disclaimer")}</footer>
    `;
	}
	renderPopover(e) {
		let t = this.t;
		return S`<div class="card pop" role="dialog" aria-label=${t("delay.title")}>
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
		this.styles = [R, o`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color);
      }
      /* Kiosk: over Home Assistant's sidebar and header, the whole screen. */
      :host([kiosk]) {
        position: fixed; inset: 0; z-index: 100;
        overflow: auto; min-height: 0;
      }
      :host([kiosk]) main { max-width: none; }
      :host([kiosk]) footer { max-width: none; font-size: 10px; padding-bottom: 8px; }
      :host([kiosk]) .gear, :host([kiosk]) .chip.paused { display: none; }
      :host([kiosk]) .appbar { min-height: 48px; }
      :host([kiosk]) main { padding-top: 10px; }
      :host(.idle) { cursor: none; }
      /* The bar is sized by the panel's own width (Home Assistant's sidebar takes
         a varying part of the window), and never wider than it. */
      .barwrap { position: sticky; top: 0; z-index: 5; container-type: inline-size; }
      .appbar {
        display: flex; align-items: center; gap: 12px;
        min-height: 56px; padding: 0 16px; box-sizing: border-box; max-width: 100%;
        background: var(--app-header-background-color, var(--card-background-color));
        color: var(--app-header-text-color, var(--primary-text-color));
        border-bottom: 1px solid var(--divider-color);
      }
      .icon-btn { border: 0; background: none; color: inherit; cursor: pointer; padding: 0; display: grid; place-items: center;
        width: 40px; height: 40px; border-radius: 50%; flex: none; }
      .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 500; white-space: nowrap; flex: none; }
      .mark {
        width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; color: #fff;
        background: linear-gradient(135deg, var(--primary-color), #7c4dff);
      }
      /* Tabs scroll rather than push the actions off the bar. */
      .tabs { display: flex; gap: 4px; margin-left: 8px; min-width: 0; flex: 0 1 auto; overflow-x: auto; scrollbar-width: none; }
      .appbar .chip { color: inherit; flex: none; }
      .appbar .chip.on { color: var(--plb-primary-text); }
      .chip.warn { color: var(--warning-color, #ffa600); }
      .chip.paused { border-style: dashed; color: var(--secondary-text-color); }
      .gear.active { color: var(--plb-primary-text); }
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
        width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer;
      }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      @container (max-width: 1180px) {
        .appbar .chip .label { display: none; }
        .appbar { gap: 8px; }
      }
      @container (max-width: 960px) {
        .brand .name { display: none; }
      }
      /* Two rows: the tabs under the brand and the actions. */
      @container (max-width: 760px) {
        .appbar { flex-wrap: wrap; gap: 6px; padding: 6px 8px 0; }
        .tabs { order: 3; width: 100%; flex-basis: 100%; margin: 0; }
        .tab { flex: 1; padding: 8px 6px; }
      }
      @container (max-width: 480px) {
        .appbar .f1tv, .appbar .full { display: none; }
        .appbar .chip { padding: 0 10px; }
        .tabs { gap: 2px; }
        .tab { padding: 8px 4px; font-size: 13px; letter-spacing: 0; }
      }
      @media (max-width: 640px) {
        main { padding: 10px; }
        .pop { left: 8px; right: 8px; width: auto; top: 112px; }
      }
    `];
	}
};
P("plb-calendar", qt), P("plb-results", Zt), P("plb-circuit", vn), P("plb-standings", Ln), P("plb-live", En), P("plb-live-map", Nn), P("plb-settings", Fn), P("plb-countdown", Ut), P("plb-age", Wt), P("pit-lane-live-board-panel", Kn);
//#endregion
export { Kn as PitLaneLiveBoardPanel };
