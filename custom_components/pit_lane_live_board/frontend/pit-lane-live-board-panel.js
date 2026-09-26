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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, re = f.trustedTypes, ie = re ? re.emptyScript : "", ae = f.reactiveElementPolyfillSupport, p = (e, t) => e, m = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ie : null;
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
}, h = (e, t) => !l(e, t), g = {
	attribute: !0,
	type: String,
	converter: m,
	reflect: !1,
	useDefault: !1,
	hasChanged: h
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var _ = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = g) {
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
		return this.elementProperties.get(e) ?? g;
	}
	static _$Ei() {
		if (this.hasOwnProperty(p("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(p("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(p("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
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
			let i = (n.converter?.toAttribute === void 0 ? m : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? m : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? h)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
_.elementStyles = [], _.shadowRootOptions = { mode: "open" }, _[p("elementProperties")] = /* @__PURE__ */ new Map(), _[p("finalized")] = /* @__PURE__ */ new Map(), ae?.({ ReactiveElement: _ }), (f.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var v = globalThis, oe = (e) => e, y = v.trustedTypes, se = y ? y.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ce = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, le = "?" + b, ue = `<${le}>`, x = document, S = () => x.createComment(""), C = (e) => e === null || typeof e != "object" && typeof e != "function", w = Array.isArray, de = (e) => w(e) || typeof e?.[Symbol.iterator] == "function", T = "[ 	\n\f\r]", E = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, fe = /-->/g, pe = />/g, D = RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), me = /'/g, he = /"/g, ge = /^(?:script|style|textarea|title)$/i, _e = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), O = _e(1), k = _e(2), A = Symbol.for("lit-noChange"), j = Symbol.for("lit-nothing"), ve = /* @__PURE__ */ new WeakMap(), M = x.createTreeWalker(x, 129);
function N(e, t) {
	if (!w(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return se === void 0 ? t : se.createHTML(t);
}
var ye = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = E;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === E ? c[1] === "!--" ? o = fe : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = D) : (ge.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = D) : o = pe : o === D ? c[0] === ">" ? (o = i ?? E, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? D : c[3] === "\"" ? he : me) : o === he || o === me ? o = D : o === fe || o === pe ? o = E : (o = D, i = void 0);
		let d = o === D && e[t + 1].startsWith("/>") ? " " : "";
		a += o === E ? n + ue : l >= 0 ? (r.push(s), n.slice(0, l) + ce + n.slice(l) + b + d) : n + b + (l === -2 ? t : d);
	}
	return [N(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, P = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ye(t, n);
		if (this.el = e.createElement(l, r), M.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = M.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ce)) {
					let t = u[o++], n = i.getAttribute(e).split(b), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? xe : r[1] === "?" ? Se : r[1] === "@" ? Ce : L
					}), i.removeAttribute(e);
				} else e.startsWith(b) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ge.test(i.tagName)) {
					let e = i.textContent.split(b), t = e.length - 1;
					if (t > 0) {
						i.textContent = y ? y.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], S()), M.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], S());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === le) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(b, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += b.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = x.createElement("template");
		return n.innerHTML = e, n;
	}
};
function F(e, t, n = e, r) {
	if (t === A) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = C(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = F(e, i._$AS(e, t.values), i, r)), t;
}
var be = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? x).importNode(t, !0);
		M.currentNode = r;
		let i = M.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new I(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new we(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = M.nextNode(), a++);
		}
		return M.currentNode = x, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, I = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = j, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = F(this, e, t), C(e) ? e === j || e == null || e === "" ? (this._$AH !== j && this._$AR(), this._$AH = j) : e !== this._$AH && e !== A && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? de(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== j && C(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = P.createElement(N(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new be(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = ve.get(e.strings);
		return t === void 0 && ve.set(e.strings, t = new P(e)), t;
	}
	k(t) {
		w(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(S()), this.O(S()), this, this.options)) : r = n[i], r._$AI(a), i++;
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
}, L = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = j, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = j;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = F(this, e, t, 0), a = !C(e) || e !== this._$AH && e !== A, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = F(this, r[n + o], t, o), s === A && (s = this._$AH[o]), a ||= !C(s) || s !== this._$AH[o], s === j ? e = j : e !== j && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === j ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, xe = class extends L {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === j ? void 0 : e;
	}
}, Se = class extends L {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== j);
	}
}, Ce = class extends L {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = F(this, e, t, 0) ?? j) === A) return;
		let n = this._$AH, r = e === j && n !== j || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== j && (n === j || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, we = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		F(this, e);
	}
}, Te = v.litHtmlPolyfillSupport;
Te?.(P, I), (v.litHtmlVersions ??= []).push("3.3.3");
var Ee = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new I(t.insertBefore(S(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, R = globalThis, z = class extends _ {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ee(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return A;
	}
};
z._$litElement$ = !0, z.finalized = !0, R.litElementHydrateSupport?.({ LitElement: z });
var De = R.litElementPolyfillSupport;
De?.({ LitElement: z }), (R.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/api.ts
var B = "pit_lane_live_board", V = {
	settings: (e) => e.callWS({ type: `${B}/settings/get` }),
	setSettings: (e, t) => e.callWS({
		type: `${B}/settings/set`,
		...t
	}),
	reveal: (e, t) => e.callWS({
		type: `${B}/spoiler/reveal`,
		session: t
	}),
	seasons: (e) => e.callWS({ type: `${B}/seasons` }),
	calendar: (e, t) => e.callWS({
		type: `${B}/calendar/get`,
		season: t
	}),
	rounds: (e, t) => e.callWS({
		type: `${B}/results/season`,
		season: t
	}),
	detail: (e, t, n, r) => e.callWS({
		type: `${B}/results/detail`,
		season: t,
		round: n,
		tab: r
	}),
	standings: (e, t, n, r) => e.callWS({
		type: `${B}/standings/get`,
		season: t,
		round: n,
		kind: r
	}),
	subscribeLive: (e, t) => e.connection.subscribeMessage(t, { type: `${B}/live/subscribe` }),
	subscribeMap: (e, t) => e.connection.subscribeMessage(t, { type: `${B}/map/subscribe` })
}, Oe = document.querySelector("home-assistant") && !customElements.get("home-assistant") ? customElements.whenDefined("home-assistant") : Promise.resolve();
function H(e, t) {
	Oe.then(() => {
		customElements.get(e) || customElements.define(e, t);
	});
}
var ke = {
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
		seconds: "{n} s"
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
		disclaimer: "Pit Lane Live Board is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V. Results and standings: Jolpica-F1 (CC BY-NC-SA 4.0). Live data: F1's public live timing."
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
		empty: "No calendar for this season yet."
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
		track: "Track temperature"
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
		mapLocked: "The live map needs an F1TV subscription. An administrator can add a token under Settings → Devices & services → Pit Lane Live Board → Configure.",
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
		}
	},
	f1tv: {
		active: "F1TV active",
		expiring: "F1TV renewing",
		expired: "F1TV expired",
		invalid: "F1TV token refused",
		not_configured: "F1TV not set"
	}
}, Ae = {
	en: ke,
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
			seconds: "{n} s"
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
			disclaimer: "Pit Lane Live Board non è ufficiale e non è in alcun modo associato alle società della Formula 1. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX e i marchi correlati sono marchi di Formula One Licensing B.V. Risultati e classifiche: Jolpica-F1 (CC BY-NC-SA 4.0). Dati live: il live timing pubblico della F1."
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
			empty: "Ancora nessun calendario per questa stagione."
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
			track: "Temperatura della pista"
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
			mapLocked: "La mappa live richiede un abbonamento F1TV. Un amministratore può aggiungere il token in Impostazioni → Dispositivi e servizi → Pit Lane Live Board → Configura.",
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
			}
		},
		f1tv: {
			active: "F1TV attivo",
			expiring: "F1TV in rinnovo",
			expired: "F1TV scaduto",
			invalid: "Token F1TV rifiutato",
			not_configured: "F1TV non impostato"
		}
	}
};
function je(e) {
	return (e?.locale?.language ?? e?.language ?? "en").toLowerCase().startsWith("it") ? "it" : "en";
}
function Me(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n) return;
		n = n[e];
	}
	return typeof n == "string" ? n : void 0;
}
function U(e) {
	let t = Ae[je(e)];
	return (e, n) => {
		let r = Me(t, e) ?? Me(ke, e) ?? e;
		for (let [e, t] of Object.entries(n ?? {})) r = r.replaceAll(`{${e}}`, String(t));
		return r;
	};
}
//#endregion
//#region src/icons.ts
var W = {
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
	back: "M20 11v2H8l5.5 5.5-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5 8 11z"
}, G = (e, t = 20) => k`<svg viewBox="0 0 24 24" width=${t} height=${t} fill="currentColor" aria-hidden="true"><path d=${e}></path></svg>`, K = o`
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
`, Ne = {
	soft: "--plb-soft",
	medium: "--plb-medium",
	hard: "--plb-hard",
	intermediate: "--plb-intermediate",
	wet: "--plb-wet",
	unknown: "--plb-unknown"
};
//#endregion
//#region src/format.ts
function q(e) {
	return je(e) === "it" ? "it-IT" : "en-GB";
}
function Pe(e, t, n) {
	return t ? new Date(t).toLocaleString(q(e), {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: e.config.time_zone
	}) : (/* @__PURE__ */ new Date(`${n}T12:00:00Z`)).toLocaleDateString(q(e), {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	});
}
function Fe(e, t) {
	return t ? (t.length === 10 ? /* @__PURE__ */ new Date(`${t}T12:00:00Z`) : new Date(t)).toLocaleDateString(q(e), {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: t.length === 10 ? "UTC" : e.config.time_zone
	}) : "";
}
function Ie(e, t, n) {
	let r = {
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	}, i = /* @__PURE__ */ new Date(`${t}T12:00:00Z`), a = /* @__PURE__ */ new Date(`${n}T12:00:00Z`);
	return i.getUTCMonth() === a.getUTCMonth() ? `${i.getUTCDate()}–${a.toLocaleDateString(q(e), r)}` : `${i.toLocaleDateString(q(e), r)} – ${a.toLocaleDateString(q(e), r)}`;
}
function Le(e, t) {
	return t ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(t) ? t : `${t}Z`).toLocaleTimeString(q(e), {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZone: e.config.time_zone
	}) : "";
}
function Re(e) {
	let t = Math.max(0, Math.floor(e / 1e3)), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60), a = t % 60, o = (e) => String(e).padStart(2, "0");
	return n ? `${n} d ${o(r)} h ${o(i)} m` : r ? `${r} h ${o(i)} m` : `${o(i)} m ${o(a)} s`;
}
function J(e, t, n = 1) {
	return t == null ? "—" : t.toLocaleString(q(e), { maximumFractionDigits: n });
}
//#endregion
//#region src/teams.ts
var ze = {
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
}, Be = [
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
function Y(e, t) {
	if (t) return t;
	if (e && ze[e]) return ze[e];
	let n = 0;
	for (let t of e ?? "") n = n * 31 + t.charCodeAt(0) >>> 0;
	return Be[n % Be.length];
}
//#endregion
//#region src/parts.ts
function Ve(e, t, n, r) {
	let i = t === "unknown" ? "?" : t[0].toUpperCase();
	return O`<span class="tyre" title=${t}>
    <span class="tyre-dot" style="--c:var(${Ne[t] ?? Ne.unknown})">${i}</span>
    ${r === null ? j : O`<small class="num">${r}</small>`}
    ${n === !1 ? O`<span class="used">${e("live.used")}</span>` : j}
  </span>`;
}
function He(e, t = !0) {
	return e == null ? j : e > 0 ? O`<span class="gained up">▲${e}</span>` : e < 0 ? O`<span class="gained down">▼${-e}</span>` : t ? O`<span class="gained muted">–</span>` : j;
}
function X(e, t, n) {
	return O`<span class="drv"
    ><span class="bar" style="background:${Y(t, n)}"></span>${e ?? "—"}</span
  >`;
}
function Z(e) {
	return O`<div class="card loading">${e("common.loading")}</div>`;
}
function Q(e, t) {
	return O`<div class="card error">
    <div>${e("common.unavailable")}</div>
    <button class="btn flat" @click=${t}>${e("common.retry")}</button>
  </div>`;
}
//#endregion
//#region src/pages/calendar.ts
var Ue = class extends z {
	constructor(...e) {
		super(...e), this.seasons = [], this.failed = !1, this.now = Date.now();
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
		this.season === void 0 && this.settings && (this.season = this.settings.season), (e.has("settings") || e.has("season")) && this.load();
	}
	async load() {
		if (!this.hass || this.season === void 0) return;
		let e = this.season;
		this.failed = !1;
		try {
			let t = await V.calendar(this.hass, e);
			e === this.season && (this.data = t);
		} catch {
			this.failed = !0;
		}
	}
	render() {
		let e = U(this.hass), t = this.seasons.length ? this.seasons : [this.season ?? 0];
		return O`
      <div class="toolbar">
        <h1>${e("calendar.title")}</h1>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.data = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => O`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
      </div>
      ${this.failed ? Q(e, () => this.load()) : !this.data || this.data.season !== this.season ? Z(e) : this.data.meetings.length ? O`<div class="cal">${this.data.meetings.map((e) => this.renderMeeting(e))}</div>` : O`<div class="card state">${e("calendar.empty")}</div>`}
    `;
	}
	renderMeeting(e) {
		let t = U(this.hass), n = e.sessions[0]?.date, r = e.sessions[e.sessions.length - 1]?.date, i = e.state === "next" ? e.sessions.find((e) => e.start && Date.parse(e.start) > this.now) : void 0;
		return O`<div class="card meet ${e.state}">
      <div class="meet-head"><span class="round">R${e.round}</span><h3>${e.name}</h3></div>
      <div class="where">${[e.locality, e.country].filter(Boolean).join(" · ")}${n && r ? ` · ${Ie(this.hass, n, r)}` : ""}</div>
      ${e.sprint || e.state === "next" || e.state === "live" ? O`<div class="flagline">
            ${e.sprint ? O`<span class="pill sprint">${t("common.sprint")}</span>` : j}
            ${e.state === "next" ? O`<span class="pill">${t("calendar.next")}</span>` : j}
            ${e.state === "live" ? O`<span class="pill live">${t("calendar.live")}</span>` : j}
          </div>` : j}
      ${e.state === "done" ? O`<div class="podium">
              ${e.podium_hidden ? O`<div class="hidden-cell">${t("spoiler.hiddenRound")}</div>` : (e.podium ?? []).map((e, t) => O`<div><b>${t + 1}</b>${X(e.name, e.team_id)}</div>`)}
            </div>
            <button class="link more" @click=${() => this.dispatchEvent(new CustomEvent("plb-go", {
			detail: "results",
			bubbles: !0,
			composed: !0
		}))}>
              ${t("calendar.results")} →
            </button>` : O`<ul>
            ${e.sessions.map((e) => O`<li><span>${t(`sessions.${e.kind}`)}</span><span class="num">${Pe(this.hass, e.start, e.date)}</span></li>`)}
          </ul>`}
      ${i?.start ? O`<div class="countdown">${t(`sessions.${i.kind}`)} · ${t("calendar.startsIn")}
            <b class="num">${Re(Date.parse(i.start) - this.now)}</b></div>` : j}
    </div>`;
	}
	static {
		this.styles = [K, o`
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
}, We = class extends z {
	constructor(...e) {
		super(...e), this.now = Date.now();
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			view: { state: !0 },
			now: { state: !0 }
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.timer = window.setInterval(() => this.now = Date.now(), 1e3);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this.timer), this.unsubscribe?.then((e) => e()), this.unsubscribe = void 0;
	}
	willUpdate() {
		this.hass && !this.unsubscribe && (this.unsubscribe = V.subscribeLive(this.hass, (e) => this.view = e));
	}
	render() {
		let e = U(this.hass), t = this.view;
		if (!t) return O`<div class="card loading">${e("common.loading")}</div>`;
		if (t.state === "hidden") return O`<div class="card state">${G(W.eyeOff, 56)}<h2>${e("live.hidden")}</h2>
        <div>${e("live.hiddenHelp", {
			meeting: t.header?.meeting ?? "",
			session: t.header?.session ?? ""
		})}</div>
        <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-spoiler-off", {
			bubbles: !0,
			composed: !0
		}))}>${e("live.showAll")}</button></div>`;
		if (t.state === "syncing") return O`<div class="card state">${G(W.clock, 56)}<h2>${e("live.syncing")}</h2>
        <div>${e("live.syncingHelp", { n: t.delay })}</div></div>`;
		if (t.state === "connecting") return O`<div class="card state">${G(W.timer, 56)}<h2>${e("live.connecting")}</h2></div>`;
		let n = t.next_session;
		return O`<div class="card state">${G(W.timer, 56)}<h2>${e("live.idle")}</h2>
      ${n ? O`<div>${e("live.next", {
			meeting: n.meeting,
			session: e(`sessions.${n.kind}`)
		})}</div>
            ${n.start ? O`<div class="big num">${Re(Date.parse(n.start) - this.now)}</div>
                  <div>${e("live.startsIn")} · ${Pe(this.hass, n.start, n.date)}</div>` : j}` : O`<div>${e("live.noNext")}</div>`}
    </div>`;
	}
	static {
		this.styles = [K, o`:host { display: block; }`];
	}
}, $ = /* @__PURE__ */ new Set([
	"strategy",
	"lap_times",
	"race_control",
	"weather"
]), Ge = class extends z {
	constructor(...e) {
		super(...e), this.seasons = [], this.failed = !1, this.tab = "race", this.tabFailed = !1, this.driver = "", this.filter = "all", this.highlight = "", this.request = 0;
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
			highlight: { state: !0 }
		};
	}
	willUpdate(e) {
		this.season === void 0 && this.settings && (this.season = this.settings.season), (e.has("settings") || e.has("season")) && this.loadRounds(), this.selected && (e.has("settings") || e.has("tab") || e.has("selected")) && this.loadTab();
	}
	async loadRounds() {
		if (!this.hass || this.season === void 0) return;
		let e = this.season;
		this.failed = !1;
		try {
			let t = await V.rounds(this.hass, e);
			e === this.season && (this.rounds = t.rounds);
		} catch {
			this.failed = !0;
		}
	}
	async loadTab() {
		if (!this.selected || this.season === void 0) return;
		let e = ++this.request;
		this.tabFailed = !1, this.result?.tab !== this.tab && (this.result = void 0);
		try {
			let t = await V.detail(this.hass, this.season, this.selected.round, this.tab);
			e === this.request && (this.result = t);
		} catch {
			e === this.request && (this.tabFailed = !0);
		}
	}
	open(e) {
		this.tab = "race", this.result = void 0, this.driver = "", this.selected = e;
	}
	render() {
		let e = U(this.hass);
		if (this.selected) return this.renderDetail(e, this.selected);
		let t = this.seasons.length ? this.seasons : [this.season ?? 0];
		return O`
      <div class="toolbar">
        <h1>${e("results.title")}</h1>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.rounds = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => O`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
      </div>
      ${this.failed ? Q(e, () => this.loadRounds()) : this.rounds ? this.rounds.length ? O`<div class="card"><div class="scroll"><table class="tbl">
                <tr><th>${e("common.round")}</th><th>${e("results.grandPrix")}</th><th>${e("results.date")}</th><th>${e("results.winner")}</th></tr>
                ${[...this.rounds].reverse().map((t) => O`<tr class="click" @click=${() => this.open(t)}>
                    <td class="num">${t.round}</td>
                    <td>${t.name}${t.sprint ? O` <span class="pill sprint">${e("common.sprint")}</span>` : j}</td>
                    <td class="num">${Fe(this.hass, t.date)}</td>
                    <td>${t.hidden ? O`<span class="hidden-cell">${e("spoiler.hiddenRound")}</span>` : t.winner ? X(t.winner.name, t.winner.team_id) : "—"}</td>
                  </tr>`)}
              </table></div></div>` : O`<div class="card state">${e("results.empty")}</div>` : Z(e)}
    `;
	}
	renderDetail(e, t) {
		return O`
      <div class="toolbar">
        <button class="link back" @click=${() => this.selected = void 0}>${G(W.back, 18)} ${e("common.back")}</button>
        <h1>${t.name} ${this.season}</h1>
      </div>
      <div class="card">
        <div class="subtabs">
          ${t.tabs.map((t) => O`<button class="tab ${this.tab === t ? "active" : ""}" @click=${() => this.tab = t}>${e(`results.tabs.${t}`)}</button>`)}
        </div>
        ${this.renderTab(e)}
      </div>
    `;
	}
	renderTab(e) {
		if (this.tabFailed) return Q(e, () => this.loadTab());
		let t = this.result;
		if (!t || t.tab !== this.tab) return O`<div class="loading">${e("common.loading")}${$.has(this.tab) ? O`<br /><small>${e("results.archive")}</small>` : j}</div>`;
		if (t.hidden) return O`<div class="state">${G(W.eyeOff, 56)}<div>${e("spoiler.revealNote")}</div>
        <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-reveal", {
			detail: t.session,
			bubbles: !0,
			composed: !0
		}))}>${e("spoiler.reveal")}</button></div>`;
		if (!t.available || !t.data) return O`<div class="state">${$.has(this.tab) ? e("results.notArchived") : e("common.noData")}</div>`;
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
		return O`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.pos")}</th><th>${e("common.driver")}</th><th></th><th class="wide">${e("common.team")}</th>
        <th class="r phone-hide">${e("results.grid")}</th><th class="r phone-hide">${e("common.laps")}</th><th>${e("results.time")}</th>
        <th class="r">${e("common.points")}</th>${n ? O`<th class="wide">${e("results.fastest")}</th>` : j}</tr>
      ${t.map((e) => O`<tr>
          <td class="num">${e.position_text && !/^\d+$/.test(e.position_text) ? e.position_text : e.position}</td>
          <td>${X(e.name, e.team_id)}</td>
          <td>${He(e.gained)}</td>
          <td class="wide muted">${e.team ?? ""}</td>
          <td class="r num phone-hide">${e.grid ?? "—"}</td>
          <td class="r num phone-hide">${e.laps ?? ""}</td>
          <td class="num">${e.time ?? e.status ?? ""}</td>
          <td class="r num">${e.points ? J(this.hass, e.points) : ""}</td>
          ${n ? O`<td class="wide t ${e.fastest_lap?.rank === 1 ? "ob" : ""}">${e.fastest_lap?.time ?? ""}</td>` : j}
        </tr>`)}
    </table></div>`;
	}
	qualifying(e, t) {
		let n = (e) => t.map((t) => t[e]).filter(Boolean).sort()[0], r = {
			q1: n("q1"),
			q2: n("q2"),
			q3: n("q3")
		};
		return O`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.pos")}</th><th>${e("common.driver")}</th><th class="wide">${e("common.team")}</th><th>Q1</th><th>Q2</th><th>Q3</th></tr>
      ${t.map((e) => O`<tr>
          <td class="num">${e.position}</td><td>${X(e.name, e.team_id)}</td><td class="wide muted">${e.team ?? ""}</td>
          ${[
			"q1",
			"q2",
			"q3"
		].map((t) => O`<td class="t ${e[t] && e[t] === r[t] ? "ob" : ""}">${e[t] ?? ""}</td>`)}
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
			let r = e.positions.map((e) => e !== null).lastIndexOf(!0), o = r >= 0 ? e.positions[r] : null, s = !this.highlight || this.highlight === e.driver_id, c = Y(e.team_id);
			return k`<g class="line" @click=${() => this.highlight = this.highlight === e.driver_id ? "" : e.driver_id ?? ""}
          style="opacity:${s ? 1 : .15}">
        <path d=${t} fill="none" stroke=${c} stroke-width=${this.highlight === e.driver_id ? 4 : 2}></path>
        ${o === null ? j : k`<text x=${i(r) + 6} y=${a(o) + 4} style="fill:var(--primary-text-color);font-weight:600">${e.code ?? e.name?.slice(0, 3).toUpperCase()}</text>`}
      </g>`;
		}), s = Array.from({ length: t }, (e, t) => k`<line class="axis" x1="36" x2=${886} y1=${a(t + 1)} y2=${a(t + 1)}></line><text x="8" y=${a(t + 1) + 4}>${t + 1}</text>`), c = Array.from({ length: Math.floor(r / 10) + 1 }, (e, t) => t * 10).map((e) => k`<text x=${i(e)} y=${n} text-anchor="middle">${e || "G"}</text>`);
		return O`<div class="chart"><svg viewBox="0 0 ${960} ${n + 6}">${s}${o}${c}</svg></div>`;
	}
	strategy(e) {
		let t = Math.max(e.laps, 1), n = (e) => 60 + e / t * 880, r = 10 + e.drivers.length * 26 + 24;
		return O`<div class="chart"><svg viewBox="0 0 ${960} ${r}">${e.drivers.map((e, t) => k`
      <text x="8" y=${10 + t * 26 + 13} style="font-weight:600;fill:var(--primary-text-color)">${e.tla}</text>
      ${e.stints.map((e) => k`<rect x=${n(e.start_lap - 1) + 1} y=${10 + t * 26} width=${Math.max(2, n(e.end_lap) - n(e.start_lap - 1) - 2)}
        height=${18} rx="4" style="fill:var(${`--plb-${e.compound}`}, var(--plb-unknown));stroke:var(--divider-color)"
        opacity=${e.new ? 1 : .75}><title>${e.compound} ${e.start_lap}–${e.end_lap}</title></rect>`)}`)}${[
			1,
			...Array.from({ length: Math.floor(t / 10) }, (e, t) => (t + 1) * 10),
			t
		].filter((e, t, n) => n.indexOf(e) === t).map((e) => k`<text x=${n(e)} y=${r - 4} text-anchor="middle">${e}</text>`)}</svg></div>`;
	}
	lapTimes(e, t) {
		if (!t.drivers.length) return O`<div class="state">${e("common.noData")}</div>`;
		let n = t.drivers.find((e) => e.number === this.driver) ?? t.drivers[0], r = (e) => e === "overall" ? "ob" : e === "personal" ? "pb" : "";
		return O`
      <div class="pick">
        <label>${e("results.chooseDriver")}
          <select @change=${(e) => this.driver = e.target.value}>
            ${t.drivers.map((e) => O`<option .selected=${e === n} value=${e.number}>${e.tla} — ${e.name}</option>`)}
          </select>
        </label>
      </div>
      <div class="scroll"><table class="tbl">
        <tr><th>${e("common.lap")}</th><th>${e("live.last")}</th><th>S1</th><th>S2</th><th>S3</th><th>${e("results.tyre")}</th><th>${e("results.pit")}</th></tr>
        ${n.laps.map((t) => O`<tr>
            <td class="num">${t.lap}</td>
            <td class="t ${r(t.best)}">${t.time ?? "—"}</td>
            ${[
			0,
			1,
			2
		].map((e) => O`<td class="t ${r(t.sector_bests?.[e])}">${t.sectors[e] ?? "—"}</td>`)}
            <td>${t.compound ? Ve(e, t.compound, null, t.tyre_age) : ""}</td>
            <td>${t.pit_in ? O`<span class="badge pit">IN</span>` : j}${t.pit_out ? O`<span class="badge out">OUT</span>` : j}</td>
          </tr>`)}
      </table></div>`;
	}
	pitStops(e, t) {
		return t.stops.length ? O`<div class="scroll"><table class="tbl">
      <tr><th>${e("common.driver")}</th><th class="r">${e("common.lap")}</th><th class="r">${e("results.stop")}</th><th class="r">${e("results.duration")}</th></tr>
      ${t.stops.map((e) => O`<tr><td>${X(e.name, e.team_id)}</td><td class="r num">${e.lap}</td><td class="r num">${e.stop}</td><td class="r num">${e.duration ?? ""}</td></tr>`)}
    </table></div>` : O`<div class="state">${e("common.noData")}</div>`;
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
		return O`<div class="filters">${n.map((t) => O`<button class="chip small ${this.filter === t ? "on" : ""}" @click=${() => this.filter = t}>${e(`live.${t}`)}</button>`)}</div>
      <div class="feed">${i.map((t) => O`<div class="msg ${t.kind}"><span class="lap num">${t.lap ? `${e("common.lap")} ${t.lap}` : ""}</span>
          <span>${t.message}<time>${Le(this.hass, t.utc)}</time></span></div>`)}</div>`;
	}
	weather(e, t) {
		if (!t) return O`<div class="state">${e("common.noData")}</div>`;
		let n = (e, t) => t ? O`<tr><td>${e}</td>${[
			t.start,
			t.end,
			t.min,
			t.max
		].map((e) => O`<td class="r num">${J(this.hass, e)}°</td>`)}</tr>` : j;
		return O`<div class="scroll"><table class="tbl">
      <tr><th></th><th class="r">${e("results.start")}</th><th class="r">${e("results.end")}</th><th class="r">${e("results.min")}</th><th class="r">${e("results.max")}</th></tr>
      ${n(e("results.air"), t.air)}${n(e("results.track"), t.track)}
      <tr><td>${e("results.rain")}</td><td class="r" colspan="4">${t.rain ? e("results.yes") : e("results.no")}</td></tr>
    </table></div>`;
	}
	static {
		this.styles = [K, o`
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
}, Ke = class extends z {
	constructor(...e) {
		super(...e), this.seasons = [], this.kind = "drivers", this.round = null, this.failed = !1, this.request = 0;
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
		this.season === void 0 && this.settings && (this.season = this.settings.season), [
			"settings",
			"season",
			"kind",
			"round"
		].some((t) => e.has(t)) && this.load();
	}
	async load() {
		if (!this.hass || this.season === void 0) return;
		let e = ++this.request;
		this.failed = !1;
		try {
			let t = await V.standings(this.hass, this.season, this.round, this.kind);
			e === this.request && (this.data = t);
		} catch {
			e === this.request && (this.failed = !0);
		}
	}
	render() {
		let e = U(this.hass), t = this.seasons.length ? this.seasons : [this.season ?? 0], n = this.data?.rounds ?? 0, r = this.data?.round ?? n;
		return O`
      <div class="toolbar">
        <h1>${e("standings.title")}</h1>
        ${["drivers", "constructors"].map((t) => O`<button class="chip ${this.kind === t ? "on" : ""}" @click=${() => this.kind = t}>${e(`standings.${t}`)}</button>`)}
        <span class="spacer"></span>
        <select aria-label=${e("common.season")} @change=${(e) => {
			this.round = null, this.data = void 0, this.season = Number(e.target.value);
		}}>
          ${t.map((e) => O`<option .selected=${e === this.season} value=${e}>${e}</option>`)}
        </select>
        ${n ? O`<select aria-label=${e("common.round")} @change=${(e) => this.round = Number(e.target.value)}>
              ${Array.from({ length: n }, (e, t) => n - t).map((t) => O`<option .selected=${t === r} value=${t}>${e("standings.after", { n: t })}</option>`)}
            </select>` : j}
      </div>
      ${this.failed ? Q(e, () => this.load()) : this.data ? this.renderTable(this.data) : Z(e)}
    `;
	}
	renderTable(e) {
		let t = U(this.hass);
		if (!e.rows.length) return O`<div class="card state">${e.capped ? t("spoiler.standingsCap") : t("standings.empty")}</div>`;
		let n = this.kind === "drivers", r = e.rows[0].points || 1;
		return O`<div class="card">
      <div class="scroll"><table class="tbl">
        <tr>
          <th>${t("common.pos")}</th><th>${t("standings.change")}</th>
          <th>${t(n ? "common.driver" : "common.team")}</th>
          ${n ? O`<th class="wide">${t("common.team")}</th>` : j}
          <th class="barcol"></th>
          <th class="r">${t("common.points")}</th><th class="r">${t("standings.wins")}</th><th class="r">${t("standings.behind")}</th>
        </tr>
        ${e.rows.map((e) => O`<tr>
            <td class="num">${e.position_text && e.position_text !== String(e.position) ? e.position_text : e.position}</td>
            <td>${He(e.change, !1)}</td>
            <td>${X(n ? e.name : e.team, e.team_id)}</td>
            ${n ? O`<td class="wide muted">${e.team ?? ""}</td>` : j}
            <td class="barcol"><div class="fill" style="width:${(e.points ?? 0) / r * 100}%;background:${Y(e.team_id)}"></div></td>
            <td class="r num"><b>${J(this.hass, e.points)}</b></td>
            <td class="r num">${e.wins ?? ""}</td>
            <td class="r num">${e.behind ? `−${J(this.hass, e.behind)}` : ""}</td>
          </tr>`)}
      </table></div>
      ${e.capped ? O`<div class="note">${t("spoiler.standingsCap")}</div>` : j}
    </div>`;
	}
	static {
		this.styles = [K, o`
      :host { display: block; }
      .barcol { width: 30%; min-width: 80px; }
      .fill { height: 6px; border-radius: 3px; min-width: 2px; }
      @media (max-width: 900px) { .wide { display: none; } }
      @media (max-width: 640px) { .barcol { display: none; } }
    `];
	}
}, qe = [
	"live",
	"calendar",
	"results",
	"standings"
], Je = "pit-lane-live-board-page";
function Ye() {
	try {
		let e = localStorage.getItem(Je);
		return e && qe.includes(e) ? e : "live";
	} catch {
		return "live";
	}
}
var Xe = class extends z {
	constructor(...e) {
		super(...e), this.narrow = !1, this.page = Ye(), this.seasons = [], this.delayOpen = !1, this.loaded = !1;
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			page: { state: !0 },
			settings: { state: !0 },
			seasons: { state: !0 },
			delayOpen: { state: !0 }
		};
	}
	get t() {
		return U(this.hass);
	}
	updated() {
		this.hass && !this.loaded && (this.loaded = !0, this.load());
	}
	async load() {
		if (this.hass) {
			try {
				this.settings = await V.settings(this.hass);
			} catch {
				this.loaded = !1;
				return;
			}
			try {
				this.seasons = (await V.seasons(this.hass)).seasons;
			} catch {
				this.seasons = [this.settings.season];
			}
		}
	}
	go(e) {
		this.page = e, this.delayOpen = !1;
		try {
			localStorage.setItem(Je, e);
		} catch {}
	}
	async setDelay(e) {
		if (!this.hass || !this.settings) return;
		let t = Math.max(0, Math.min(120, Math.round(e)));
		this.settings = {
			...this.settings,
			tv_delay: t
		}, this.settings = await V.setSettings(this.hass, { tv_delay: t });
	}
	async toggleSpoiler() {
		this.hass && this.settings && (this.settings = await V.setSettings(this.hass, { no_spoiler: !this.settings.no_spoiler }));
	}
	async reveal(e) {
		this.hass && (this.settings = await V.reveal(this.hass, e.detail));
	}
	toggleMenu() {
		this.dispatchEvent(new Event("hass-toggle-menu", {
			bubbles: !0,
			composed: !0
		}));
	}
	renderPage() {
		if (!this.hass || !this.settings) return O`<div class="card loading">${this.t("common.loading")}</div>`;
		let e = {
			hass: this.hass,
			settings: this.settings,
			seasons: this.seasons
		};
		switch (this.page) {
			case "calendar": return O`<plb-calendar .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons}
          @plb-go=${(e) => this.go(e.detail)}></plb-calendar>`;
			case "results": return O`<plb-results .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons}
          @plb-reveal=${this.reveal}></plb-results>`;
			case "standings": return O`<plb-standings .hass=${e.hass} .settings=${e.settings} .seasons=${e.seasons}></plb-standings>`;
			default: return O`<plb-live .hass=${e.hass} .settings=${e.settings}
          @plb-spoiler-off=${this.toggleSpoiler}></plb-live>`;
		}
	}
	render() {
		let e = this.t, t = this.settings, n = t?.f1tv && t.f1tv.status !== "not_configured" ? t.f1tv.status : null;
		return O`
      <header class="appbar">
        ${this.narrow ? O`<button class="icon-btn" @click=${this.toggleMenu} aria-label="menu">${G(W.menu, 24)}</button>` : j}
        <div class="brand"><span class="mark">${G(W.board, 18)}</span><span class="name">Live Board</span></div>
        <nav class="tabs">
          ${qe.map((t) => O`<button class="tab ${this.page === t ? "active" : ""}" @click=${() => this.go(t)}>
              ${e(`tabs.${t}`)}
            </button>`)}
        </nav>
        <span class="spacer"></span>
        ${n ? O`<span class="chip small ${n === "active" ? "" : "warn"}" title=${e(`f1tv.${n}`)}>F1TV</span>` : j}
        <button class="chip ${t?.tv_delay ? "on" : ""}" @click=${() => this.delayOpen = !this.delayOpen}
          aria-expanded=${this.delayOpen ? "true" : "false"}>
          ${G(W.clock, 18)}<span class="num">${t?.tv_delay ? `+${t.tv_delay} s` : "0 s"}</span>
          <span class="label">${e("delay.title")}</span>
        </button>
        <button class="chip ${t?.no_spoiler ? "on" : ""}" @click=${this.toggleSpoiler} title=${e("spoiler.help")}>
          ${G(t?.no_spoiler ? W.eyeOff : W.eye, 18)}
          <span class="label">${t?.no_spoiler ? e("spoiler.on") : e("spoiler.off")}</span>
        </button>
      </header>
      ${this.delayOpen && t ? this.renderPopover(t) : j}
      <main>${this.renderPage()}</main>
      <footer>${e("common.disclaimer")}</footer>
    `;
	}
	renderPopover(e) {
		let t = this.t;
		return O`<div class="card pop" role="dialog" aria-label=${t("delay.title")}>
      <h3>${t("delay.title")}</h3>
      <p>${t("delay.help")}</p>
      <div class="stepper">
        <button @click=${() => this.setDelay(e.tv_delay - 1)} aria-label="−1 s">−</button>
        <b class="num">${e.tv_delay ? t("delay.seconds", { n: e.tv_delay }) : t("delay.none")}</b>
        <button @click=${() => this.setDelay(e.tv_delay + 1)} aria-label="+1 s">+</button>
      </div>
      <input type="range" min="0" max="120" step="1" .value=${String(e.tv_delay)}
        @change=${(e) => this.setDelay(Number(e.target.value))} />
    </div>`;
	}
	static {
		this.styles = [K, o`
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
H("plb-calendar", Ue), H("plb-results", Ge), H("plb-standings", Ke), H("plb-live", We), H("pit-lane-live-board-panel", Xe);
//#endregion
export { Xe as PitLaneLiveBoardPanel };
