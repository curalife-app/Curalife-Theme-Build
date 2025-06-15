const H="modulepreload",j=function(l){return"/"+l},k={},h=function(e,t,i){let r=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),a=o?.nonce||o?.getAttribute("nonce");r=Promise.allSettled(t.map(n=>{if(n=j(n),n in k)return;k[n]=!0;const g=n.endsWith(".css"),R=g?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${n}"]${R}`))return;const p=document.createElement("link");if(p.rel=g?"stylesheet":H,g||(p.as="script"),p.crossOrigin="",p.href=n,a&&p.setAttribute("nonce",a),document.head.appendChild(p),g)return new Promise((O,Q)=>{p.addEventListener("load",O),p.addEventListener("error",()=>Q(new Error(`Unable to preload CSS for ${n}`)))})}))}function s(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return r.then(o=>{for(const a of o||[])a.status==="rejected"&&s(a.reason);return e().catch(s)})};class b{constructor(){this.stylesCache=new Map,this.loadingPromises=new Map}async loadStyles(e){if(this.stylesCache.has(e))return this.stylesCache.get(e);if(this.loadingPromises.has(e))return this.loadingPromises.get(e);const t=this.fetchStyles(e);this.loadingPromises.set(e,t);try{const i=await t;return this.stylesCache.set(e,i),this.loadingPromises.delete(e),i}catch(i){throw this.loadingPromises.delete(e),i}}async fetchStyles(e){try{const t=await fetch(e);if(!t.ok)throw new Error(`Failed to load CSS: ${t.status}`);return await t.text()}catch(t){if(console.warn(`Could not load shared styles from ${e}:`,t),e.includes("/assets/quiz.css")){const i=[e.replace("/assets/","/assets/"),"./assets/quiz.css","../assets/quiz.css"];for(const r of i)if(r!==e)try{const s=await fetch(r);if(s.ok)return console.log(`✓ Loaded styles from alternative path: ${r}`),await s.text()}catch{}}return""}}async getQuizStyles(e=null){const t=e||window.QUIZ_CSS_URL||"/assets/quiz.css";return window.QUIZ_CONFIG?.debug&&console.log(`🎨 Loading quiz styles from: ${t}`),this.loadStyles(t)}createStyleElement(e="",t=null){const i=document.createElement("style");return this.getQuizStyles(t).then(r=>{i.textContent=r+`
`+e}).catch(()=>{i.textContent=e}),i.textContent=e,i}setQuizCssUrl(e){window.QUIZ_CSS_URL=e}}const d=new b;class u extends HTMLElement{constructor(){super(),this.config={useShadowDOM:!0,inheritStyles:!0,autoRender:!0},this.isInitialized=!1,this._isComponentConnected=!1,this.config.useShadowDOM?(this.attachShadow({mode:"open"}),this.root=this.shadowRoot):this.root=this,this.handleAttributeChange=this.handleAttributeChange.bind(this),this.handleSlotChange=this.handleSlotChange.bind(this)}connectedCallback(){this._isComponentConnected=!0,this.isInitialized||(this.initialize(),this.isInitialized=!0),this.config.autoRender&&this.render(),this.setupEventListeners(),this.onConnected()}disconnectedCallback(){this._isComponentConnected=!1,this.cleanup(),this.onDisconnected()}attributeChangedCallback(e,t,i){t!==i&&(this.handleAttributeChange(e,t,i),this._isComponentConnected&&this.config.autoRender&&this.render())}initialize(){}render(){throw new Error("render() must be implemented by subclass")}getTemplate(){throw new Error("getTemplate() must be implemented by subclass")}getStyles(){return`
      :host {
        display: block;
        box-sizing: border-box;
      }

      :host([hidden]) {
        display: none !important;
      }

      /* Inherit quiz CSS custom properties */
      :host {
        --quiz-primary-color: var(--quiz-primary-color, #2c3e50);
        --quiz-secondary-color: var(--quiz-secondary-color, #306E51);
        --quiz-success-color: var(--quiz-success-color, #4CAF50);
        --quiz-error-color: var(--quiz-error-color, #f56565);
        --quiz-warning-color: var(--quiz-warning-color, #ed8936);
        --quiz-border-radius: var(--quiz-border-radius, 8px);
        --quiz-shadow: var(--quiz-shadow, 0 2px 10px rgba(0,0,0,0.1));
        --quiz-transition: var(--quiz-transition, all 0.3s ease);
      }
    `}handleAttributeChange(e,t,i){}handleSlotChange(e){}setupEventListeners(){}cleanup(){}onConnected(){}onDisconnected(){}get isComponentConnected(){return this._isComponentConnected}getBooleanAttribute(e,t=!1){const i=this.getAttribute(e);return i===null?t:i===""||i==="true"||i===e}getNumberAttribute(e,t=0){const i=this.getAttribute(e);if(i===null)return t;const r=parseFloat(i);return isNaN(r)?t:r}setAttributes(e){Object.entries(e).forEach(([t,i])=>{i==null?this.removeAttribute(t):this.setAttribute(t,String(i))})}dispatchCustomEvent(e,t={},i={}){const r=new CustomEvent(e,{detail:t,bubbles:!0,cancelable:!0,...i});return this.dispatchEvent(r),r}querySelector(e){return this.root.querySelector(e)}querySelectorAll(e){return this.root.querySelectorAll(e)}createElement(e,t={},i=""){const r=document.createElement(e);return Object.entries(t).forEach(([s,o])=>{r.setAttribute(s,String(o))}),i&&(r.innerHTML=i),r}sanitizeHTML(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}debounce(e,t){let i;return function(...s){const o=()=>{clearTimeout(i),e(...s)};clearTimeout(i),i=setTimeout(o,t)}}throttle(e,t){let i;return function(...s){i||(e.apply(this,s),i=!0,setTimeout(()=>i=!1,t))}}renderTemplate(){if(!this.config.useShadowDOM){this.innerHTML=this.getTemplate();return}this.root.innerHTML="";const e=window.QUIZ_CSS_URL||window.QUIZ_CONFIG?.cssUrl,t=d.createStyleElement(this.getStyles(),e);this.root.appendChild(t);const i=this.getTemplate();if(i){const s=document.createElement("template");s.innerHTML=i,this.root.appendChild(s.content.cloneNode(!0))}this.root.querySelectorAll("slot").forEach(s=>{s.addEventListener("slotchange",this.handleSlotChange)})}}class B{constructor(){this.components=new Map,this.loadedComponents=new Set}register(e,t,i={}){if(customElements.get(e)){console.warn(`Component ${e} already registered`);return}t.prototype instanceof u||console.warn(`Component ${e} should extend QuizBaseComponent`),customElements.define(e,t),this.components.set(e,{componentClass:t,options:i}),this.loadedComponents.add(e),console.log(`✓ Registered quiz component: ${e}`)}isRegistered(e){return this.loadedComponents.has(e)}getRegistered(){return Array.from(this.loadedComponents)}async loadComponent(e){if(!this.isRegistered(e))try{const i={"quiz-calendar-icon":()=>h(()=>Promise.resolve().then(()=>U),void 0),"quiz-clock-icon":()=>h(()=>Promise.resolve().then(()=>N),void 0),"quiz-checkmark-icon":()=>h(()=>Promise.resolve().then(()=>F),void 0),"quiz-coverage-card":()=>h(()=>Promise.resolve().then(()=>G),void 0),"quiz-benefit-item":()=>h(()=>Promise.resolve().then(()=>Z),void 0),"quiz-action-section":()=>h(()=>Promise.resolve().then(()=>J),void 0),"quiz-error-display":()=>h(()=>Promise.resolve().then(()=>W),void 0),"quiz-loading-display":()=>h(()=>Promise.resolve().then(()=>Y),void 0)}[e];if(!i)throw new Error(`Unknown component: ${e}`);(await i()).default&&!this.isRegistered(e)&&console.log(`✓ Loaded quiz component: ${e}`)}catch(t){console.error(`Failed to load component ${e}:`,t)}}getComponentPath(e){const t=e.split("-");return t[0]==="quiz"?`${this.getCategoryFromName(t[1])}/${e}.js`:`${e}.js`}getCategoryFromName(e){return{calendar:"icons",clock:"icons",checkmark:"icons",error:"icons",results:"layout",step:"layout",form:"forms",coverage:"content",action:"content",benefit:"content",faq:"content"}[e]||"content"}}const c=new B;class f extends u{constructor(){super(),this.config.useShadowDOM=!1}static get observedAttributes(){return["size","color","stroke-width"]}getTemplate(){const e=this.getAttribute("size")||"20",t=this.getAttribute("color")||"currentColor",i=this.getAttribute("stroke-width")||"1.5";return`
      <svg
        width="${e}"
        height="${e}"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Calendar icon"
      >
        <path
          d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z"
          stroke="${t}"
          stroke-width="${i}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `}render(){this.innerHTML=this.getTemplate()}}customElements.get("quiz-calendar-icon")||c.register("quiz-calendar-icon",f);const U=Object.freeze(Object.defineProperty({__proto__:null,default:f},Symbol.toStringTag,{value:"Module"}));class m extends u{constructor(){super(),this.config.useShadowDOM=!1}static get observedAttributes(){return["size","color","stroke-width"]}getTemplate(){const e=this.getAttribute("size")||"24",t=this.getAttribute("color")||"#306E51",i=this.getAttribute("stroke-width")||"2";return`
      <svg
        width="${e}"
        height="${e}"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Clock icon"
      >
        <path
          d="M12 8V12L15 15"
          stroke="${t}"
          stroke-width="${i}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="${t}"
          stroke-width="${i}"
        />
      </svg>
    `}render(){this.innerHTML=this.getTemplate()}}customElements.get("quiz-clock-icon")||c.register("quiz-clock-icon",m);const N=Object.freeze(Object.defineProperty({__proto__:null,default:m},Symbol.toStringTag,{value:"Module"}));class q extends u{constructor(){super(),this.config.useShadowDOM=!1}static get observedAttributes(){return["size","color","stroke-width","type"]}getTemplate(){const e=this.getAttribute("size")||"20",t=this.getAttribute("color")||"#306E51",i=this.getAttribute("stroke-width")||"1.5";return(this.getAttribute("type")||"simple")==="circle"?`
        <svg
          width="${e}"
          height="${e}"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Checkmark in circle icon"
        >
          <path
            d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z"
            stroke="${t}"
            stroke-width="${i}"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329"
            stroke="${t}"
            stroke-width="${i}"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `:`
      <svg
        width="${e}"
        height="${e}"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Checkmark icon"
      >
        <path
          d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329"
          stroke="${t}"
          stroke-width="${i}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `}render(){this.innerHTML=this.getTemplate()}}customElements.get("quiz-checkmark-icon")||c.register("quiz-checkmark-icon",q);const F=Object.freeze(Object.defineProperty({__proto__:null,default:q},Symbol.toStringTag,{value:"Module"}));class v extends u{static get observedAttributes(){return["title","sessions-covered","plan-end"]}connectedCallback(){this.render()}attributeChangedCallback(){this.isConnected&&this.render()}render(){this.getAttribute("title"),this.getAttribute("sessions-covered"),this.getAttribute("plan-end"),this.renderTemplate()}getTemplate(){const e=this.getAttribute("title")||"Here's Your Offer",t=this.getAttribute("sessions-covered")||"5",i=this.getAttribute("plan-end")||"Dec 31, 2025";return`
			<div class="quiz-coverage-card">
				<div class="quiz-coverage-card-title">${e}</div>
				<div class="quiz-coverage-pricing">
					<div class="quiz-coverage-service-item">
						<div class="quiz-coverage-service">${t} sessions with a Registered Dietitian</div>
						<div class="quiz-coverage-cost">
							<div class="quiz-coverage-copay">$0 copay</div>
							<div class="quiz-coverage-original-price">$1,200</div>
						</div>
					</div>
				</div>
				<div class="quiz-coverage-divider"></div>
				<div class="quiz-coverage-benefits">
					<div class="quiz-coverage-benefit">
						<quiz-checkmark-icon class="quiz-coverage-benefit-icon"></quiz-checkmark-icon>
						<div class="quiz-coverage-benefit-text">${t} sessions covered</div>
					</div>
					<div class="quiz-coverage-benefit">
						<quiz-calendar-icon class="quiz-coverage-benefit-icon"></quiz-calendar-icon>
						<div class="quiz-coverage-benefit-text">Coverage expires ${i}</div>
					</div>
				</div>
			</div>
		`}getStyles(){return`
				:host {
					display: block;
				}

				.quiz-coverage-card {
					border: 1px solid #bdddc9;
					border-radius: 20px;
					padding: 32px;
					background-color: white;
					margin-bottom: 36px;
					align-self: stretch;
				}

				.quiz-coverage-card-title {
					font-family: "PP Radio Grotesk", sans-serif;
					font-size: 24px;
					font-weight: 700;
					line-height: 1.3333333333333333em;
					color: #121212;
					margin-bottom: 16px;
				}

				.quiz-coverage-pricing {
					display: flex;
					flex-direction: column;
					gap: 8px;
					margin-bottom: 16px;
					width: fit-content;
				}

				.quiz-coverage-service-item {
					display: flex;
					align-items: center;
					gap: 32px;
					width: fit-content;
				}

				.quiz-coverage-service {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 400;
					line-height: 1.4444444444444444em;
					color: #121212;
					flex: 1;
					width: 312px;
				}

				.quiz-coverage-cost {
					display: flex;
					align-items: center;
					gap: 4px;
				}

				.quiz-coverage-copay {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 800;
					line-height: 1.4444444444444444em;
					color: #121212;
				}

				.quiz-coverage-original-price {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 400;
					line-height: 1.3333333333333333em;
					color: #6d6d6d;
					text-decoration: line-through;
				}

				.quiz-coverage-divider {
					width: 100%;
					height: 0.5px;
					background-color: #bdddc9;
					margin: 16px 0;
				}

				.quiz-coverage-benefits {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.quiz-coverage-benefit {
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.quiz-coverage-benefit-icon {
					width: 20px;
					height: 20px;
					flex-shrink: 0;
				}

				.quiz-coverage-benefit-text {
					font-family: "DM Sans", sans-serif;
					font-size: 16px;
					font-weight: 400;
					line-height: 1.5em;
					color: #4f4f4f;
				}

				@media (max-width: 768px) {
					.quiz-coverage-card {
						padding: 20px;
						margin-bottom: 28px;
						align-self: stretch;
						width: 100%;
					}

					.quiz-coverage-card-title {
						font-size: 24px;
						line-height: 1.3333333333333333em;
						margin-bottom: 12px;
					}

					.quiz-coverage-pricing {
						flex-direction: column;
						gap: 16px;
						align-items: stretch;
						margin-bottom: 16px;
					}

					.quiz-coverage-service-item {
						display: flex;
						flex-direction: column;
						gap: 8px;
						width: 100%;
						align-items: start;
					}

					.quiz-coverage-service {
						font-size: 18px;
						line-height: 1.3333333333333333em;
						width: unset;
					}

					.quiz-coverage-cost {
						display: flex;
						align-items: center;
						gap: 4px;
					}

					.quiz-coverage-copay {
						font-size: 18px;
						font-weight: 700;
						line-height: 1.3333333333333333em;
					}

					.quiz-coverage-original-price {
						font-size: 18px;
						line-height: 1.3333333333333333em;
					}

					.quiz-coverage-benefits {
						gap: 12px;
					}

					.quiz-coverage-benefit-text {
						font-size: 16px;
						line-height: 1.5em;
					}

					.quiz-coverage-divider {
						margin: 16px 0;
					}
				}
		`}}customElements.get("quiz-coverage-card")||c.register("quiz-coverage-card",v);const G=Object.freeze(Object.defineProperty({__proto__:null,default:v},Symbol.toStringTag,{value:"Module"}));class z extends u{static get observedAttributes(){return["icon","text","icon-color","icon-size"]}getTemplate(){const e=this.getAttribute("icon")||"checkmark",t=this.getAttribute("text")||"",i=this.getAttribute("icon-color")||"#306E51",r=this.getAttribute("icon-size")||"20";return`
      <div class="quiz-benefit-item">
        <div class="quiz-benefit-icon">
          ${this.getIconHTML(e,i,r)}
        </div>
        <div class="quiz-benefit-text">
          ${this.sanitizeHTML(t)}
        </div>
      </div>
    `}getIconHTML(e,t,i){const r=`width="${i}" height="${i}" role="img"`;switch(e){case"calendar":return`
          <svg ${r} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Calendar">
            <path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="${t}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;case"clock":return`
          <svg ${r} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Clock">
            <path d="M12 8V12L15 15" stroke="${t}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="9" stroke="${t}" stroke-width="2"/>
          </svg>
        `;case"checkmark":default:return`
          <svg ${r} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Checkmark">
            <path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="${t}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="${t}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}}getStyles(){return`
      ${super.getStyles()}

      :host {
        display: block;
        margin: 8px 0;
      }

      .quiz-benefit-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 8px 0;
      }

      .quiz-benefit-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-top: -2px; /* Optical alignment */
      }

      .quiz-benefit-icon svg {
        display: block;
      }

      .quiz-benefit-text {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: var(--quiz-primary-color);
      }

      /* Strong text formatting */
      .quiz-benefit-text strong {
        font-weight: 600;
        color: var(--quiz-secondary-color);
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .quiz-benefit-item {
          gap: 10px;
          padding: 6px 0;
        }

        .quiz-benefit-icon {
          width: 28px;
          height: 28px;
        }

        .quiz-benefit-text {
          font-size: 13px;
        }
      }
    `}render(){this.renderTemplate()}handleAttributeChange(e,t,i){this.isConnected&&this.render()}setBenefit(e,t,i="#306E51"){this.setAttributes({icon:e,text:t,"icon-color":i})}getBenefit(){return{icon:this.getAttribute("icon"),text:this.getAttribute("text"),iconColor:this.getAttribute("icon-color"),iconSize:this.getAttribute("icon-size")}}}customElements.get("quiz-benefit-item")||c.register("quiz-benefit-item",z);const Z=Object.freeze(Object.defineProperty({__proto__:null,default:z},Symbol.toStringTag,{value:"Module"}));class y extends u{static get observedAttributes(){return["title","type","background-color","result-url"]}getTemplate(){const e=this.getAttribute("title")||"Schedule your initial online consultation now",t=this.getAttribute("type")||"default",i=this.getAttribute("background-color")||"#F1F8F4",r=this.getAttribute("result-url")||"#";return`
      <div class="quiz-action-section" data-type="${t}" style="background-color: ${i};">
        <div class="quiz-action-content">
          <div class="quiz-action-header">
            <h3 class="quiz-action-title">${this.sanitizeHTML(e)}</h3>
          </div>
          <div class="quiz-action-details">
            <div class="quiz-action-info">
              <div class="quiz-action-info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.4214 14.5583C12.4709 14.3109 12.6316 14.1021 12.8477 13.972C14.3893 13.0437 15.4163 11.5305 15.4163 9.58378C15.4163 6.59224 12.9913 4.16711 9.99967 4.16711C7.00813 4.16711 4.58301 6.59224 4.58301 9.58378C4.58301 11.5305 5.60997 13.0437 7.15168 13.972C7.36778 14.1021 7.52844 14.3109 7.57791 14.5583L7.78236 15.5805C7.86027 15.97 8.20227 16.2504 8.59951 16.2504H11.3998C11.7971 16.2504 12.1391 15.97 12.217 15.5805L12.4214 14.5583Z" stroke="#418865" stroke-width="1.25" stroke-linejoin="round"/>
<path d="M17.4997 9.58378H17.9163M2.08301 9.58378H2.49967M15.3024 4.28048L15.597 3.98586M4.16634 15.4171L4.58301 15.0004M15.4163 15.0004L15.833 15.4171M4.40234 3.98644L4.69697 4.28106M9.99967 2.08378V1.66711" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.6663 16.25V17.5C11.6663 17.9602 11.2933 18.3333 10.833 18.3333H9.16634C8.70609 18.3333 8.33301 17.9602 8.33301 17.5V16.25" stroke="#418865" stroke-width="1.25" stroke-linejoin="round"/>
</svg>

              </div>
              <div class="quiz-action-info-text">Our dietitians usually recommend minimum 6 consultations over 6 months, Today, just book your first.</div>
            </div>
            <div class="quiz-action-feature">
              <div class="quiz-action-feature-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.417 2.5031C9.67107 2.49199 8.92091 2.51074 8.19149 2.55923C4.70565 2.79094 1.929 5.60698 1.70052 9.14225C1.65582 9.83408 1.65582 10.5506 1.70052 11.2424C1.78374 12.53 2.35318 13.7222 3.02358 14.7288C3.41283 15.4336 3.15594 16.3132 2.7505 17.0815C2.45817 17.6355 2.312 17.9125 2.42936 18.1126C2.54672 18.3127 2.80887 18.3191 3.33318 18.3318C4.37005 18.3571 5.06922 18.0631 5.62422 17.6538C5.93899 17.4218 6.09638 17.3057 6.20486 17.2923C6.31332 17.279 6.5268 17.3669 6.95367 17.5427C7.33732 17.7007 7.78279 17.7982 8.19149 17.8254C9.37832 17.9043 10.6199 17.9045 11.8092 17.8254C15.295 17.5937 18.0717 14.7777 18.3002 11.2424C18.3354 10.6967 18.3428 10.1356 18.3225 9.58333" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.333 6.66663L13.333 1.66663M18.333 1.66663L13.333 6.66663" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.99658 10.4166H10.004M13.3262 10.4166H13.3337M6.66699 10.4166H6.67447" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              </div>
              <div class="quiz-action-feature-text">Free cancellation up to 24h before</div>
            </div>
          </div>
          <a href="${r}" class="quiz-booking-button">Proceed to booking</a>

          <!-- Slots for additional content -->
          <slot></slot>
        </div>
      </div>
    `}getStyles(){return`
      ${super.getStyles()}

      :host {
        display: block;
      }

      .quiz-action-section {
        background-color: #f1f8f4;
        border-radius: 20px;
        padding: 32px;
        margin-bottom: 72px;
        align-self: stretch;
      }

      .quiz-action-content {
        display: flex;
        flex-direction: column;
        gap: 0;
        align-self: stretch;
      }

      .quiz-action-header {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .quiz-action-title {
        font-family: "PP Radio Grotesk", sans-serif;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.3333333333333333em;
        color: #121212;
				margin: 0;
      }

      .quiz-action-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-self: stretch;
        margin-top: 12px;
        max-width: 550px;
      }

      .quiz-action-info {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        align-self: stretch;
      }

      .quiz-action-info-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .quiz-action-info-text {
        line-height: 1.4444444444444444em;
        color: #121212;
        flex: 1;
      }

      .quiz-action-feature {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .quiz-action-feature-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .quiz-action-feature-text {
        font-family: "DM Sans", sans-serif;
        font-size: 18px;
        font-weight: 400;
        line-height: 1.4444444444444444em;
        color: #121212;
      }

      .quiz-booking-button {
        background-color: #306e51;
        color: white;
        border: none;
        border-radius: 300px;
        padding: 12px 40px;
        font-family: "DM Sans", sans-serif;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3333333333333333em;
        text-align: center;
        cursor: pointer;
        transition: all var(--quiz-transition-fast);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        margin-top: 32px;
      }

      .quiz-booking-button:hover {
        background-color: var(--quiz-primary-hover);
        transform: translateY(-1px);
      }

      .quiz-booking-button:disabled {
        background-color: #ccc !important;
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: none !important;
      }

      .quiz-booking-button:disabled:hover {
        background-color: #ccc !important;
        transform: none !important;
        box-shadow: none !important;
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .quiz-action-section {
          padding: 32px;
        }

        .quiz-action-title {
          font-size: 24px;
        }

        .quiz-action-details {
          gap: 12px;
        }

        .quiz-booking-button {
          padding: 12px 40px;
          font-size: 18px;
          margin-top: 32px;
        }
      }
    `}render(){this.renderTemplate(),this.updateBackgroundColor()}handleAttributeChange(e,t,i){e==="background-color"&&this.updateBackgroundColor()}updateBackgroundColor(){const e=this.getAttribute("background-color");if(e){const t=this.querySelector(".quiz-action-section");t&&(t.style.background=e)}}onConnected(){this.dispatchCustomEvent("quiz-action-section-ready",{title:this.getAttribute("title"),type:this.getAttribute("type")})}setAction(e,t="default",i=null){this.setAttributes({title:e,type:t,"background-color":i})}getAction(){return{title:this.getAttribute("title"),type:this.getAttribute("type"),backgroundColor:this.getAttribute("background-color")}}}customElements.get("quiz-action-section")||c.register("quiz-action-section",y);const J=Object.freeze(Object.defineProperty({__proto__:null,default:y},Symbol.toStringTag,{value:"Module"}));class x extends u{static get observedAttributes(){return["type","title","message","error-code","show-details"]}getTemplate(){const e=this.getAttribute("type")||"general",t=this.getAttribute("title")||"Error",i=this.getAttribute("message")||"An error occurred. Please try again.",r=this.getAttribute("error-code")||"",s=this.getBooleanAttribute("show-details",!1);return`
      <div class="quiz-error-display" data-type="${e}">
        <div class="quiz-error-content">
          <div class="quiz-error-header">
            <div class="quiz-error-icon">
              ${this.getErrorIcon(e)}
            </div>
            <div class="quiz-error-text">
              <h3 class="quiz-error-title">${this.sanitizeHTML(t)}</h3>
              <p class="quiz-error-message">${this.sanitizeHTML(i)}</p>
            </div>
          </div>

          ${r?`
            <div class="quiz-error-code">
              <span class="quiz-error-code-label">Error Code:</span>
              <span class="quiz-error-code-value">${this.sanitizeHTML(r)}</span>
            </div>
          `:""}

          ${s?`
            <div class="quiz-error-details">
              <details class="quiz-error-details-toggle">
                <summary class="quiz-error-details-summary">Technical Details</summary>
                <div class="quiz-error-details-content">
                  <slot name="details"></slot>
                </div>
              </details>
            </div>
          `:""}

          <div class="quiz-error-actions">
            <slot name="actions"></slot>
          </div>

          <!-- Default slot for additional content -->
          <slot></slot>
        </div>
      </div>
    `}getErrorIcon(e){const t=this.getIconColor(e);switch(e){case"warning":return`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Warning">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="${t}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;case"technical":return`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Technical Error">
            <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="${t}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 12L16 12" stroke="${t}" stroke-width="1" stroke-linecap="round"/>
          </svg>
        `;case"network":return`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Network Error">
            <path d="M3 12H21M12 3L12 21" stroke="${t}" stroke-width="2" stroke-linecap="round"/>
            <path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke="${t}" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        `;case"general":default:return`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Error">
            <circle cx="12" cy="12" r="9" stroke="${t}" stroke-width="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="${t}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}}getIconColor(e){switch(e){case"warning":return"#ed8936";case"technical":return"#e53e3e";case"network":return"#3182ce";case"general":default:return"#e53e3e"}}getStyles(){return`
      ${super.getStyles()}

      :host {
        display: block;
        margin: 20px 0;
      }

      .quiz-error-display {
        background: white;
        border-radius: var(--quiz-border-radius);
        padding: 24px;
        box-shadow: var(--quiz-shadow);
        border-left: 4px solid var(--quiz-error-color);
      }

      :host([type="warning"]) .quiz-error-display {
        border-left-color: var(--quiz-warning-color);
        background-color: #fffaf0;
      }

      :host([type="technical"]) .quiz-error-display {
        border-left-color: #e53e3e;
        background-color: #fed7d7;
      }

      :host([type="network"]) .quiz-error-display {
        border-left-color: #3182ce;
        background-color: #ebf8ff;
      }

      .quiz-error-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .quiz-error-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .quiz-error-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
      }

      .quiz-error-text {
        flex: 1;
      }

      .quiz-error-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--quiz-primary-color);
        margin: 0 0 8px 0;
        line-height: 1.3;
      }

      :host([type="warning"]) .quiz-error-title {
        color: #c05621;
      }

      :host([type="technical"]) .quiz-error-title {
        color: #c53030;
      }

      :host([type="network"]) .quiz-error-title {
        color: #2c5282;
      }

      .quiz-error-message {
        font-size: 14px;
        line-height: 1.5;
        color: #4a5568;
        margin: 0;
      }

      .quiz-error-code {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 6px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 13px;
      }

      .quiz-error-code-label {
        font-weight: 600;
        color: #4a5568;
      }

      .quiz-error-code-value {
        color: #2d3748;
        background: rgba(255, 255, 255, 0.8);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .quiz-error-details {
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        padding-top: 16px;
      }

      .quiz-error-details-toggle {
        cursor: pointer;
      }

      .quiz-error-details-summary {
        font-weight: 600;
        color: var(--quiz-primary-color);
        padding: 8px 0;
        list-style: none;
        outline: none;
      }

      .quiz-error-details-summary::-webkit-details-marker {
        display: none;
      }

      .quiz-error-details-summary::before {
        content: "▶";
        display: inline-block;
        margin-right: 8px;
        transition: transform 0.2s ease;
      }

      .quiz-error-details-toggle[open] .quiz-error-details-summary::before {
        transform: rotate(90deg);
      }

      .quiz-error-details-content {
        padding: 12px 0;
        color: #4a5568;
        font-size: 14px;
        line-height: 1.5;
      }

      .quiz-error-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
        padding-top: 8px;
      }

      /* Style slotted action buttons */
      .quiz-error-actions ::slotted(.quiz-retry-button) {
        background: var(--quiz-secondary-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: var(--quiz-border-radius);
        font-weight: 600;
        cursor: pointer;
        transition: var(--quiz-transition);
      }

      .quiz-error-actions ::slotted(.quiz-retry-button:hover) {
        background: #2a5d42;
        transform: translateY(-1px);
      }

      .quiz-error-actions ::slotted(.quiz-retry-button:active) {
        transform: translateY(0);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .quiz-error-display {
          padding: 20px 16px;
        }

        .quiz-error-header {
          gap: 12px;
        }

        .quiz-error-icon {
          width: 36px;
          height: 36px;
        }

        .quiz-error-title {
          font-size: 16px;
        }

        .quiz-error-message {
          font-size: 13px;
        }

        .quiz-error-actions {
          flex-direction: column;
          align-items: center;
        }

        .quiz-error-actions ::slotted(.quiz-retry-button) {
          width: 100%;
          max-width: 200px;
        }
      }
    `}render(){this.renderTemplate()}handleAttributeChange(e,t,i){this.isConnected&&this.render()}onConnected(){this.dispatchCustomEvent("quiz-error-display-ready",{type:this.getAttribute("type"),title:this.getAttribute("title"),errorCode:this.getAttribute("error-code")})}setError(e,t,i,r=null,s=!1){this.setAttributes({type:e,title:t,message:i,"error-code":r,"show-details":s})}getError(){return{type:this.getAttribute("type"),title:this.getAttribute("title"),message:this.getAttribute("message"),errorCode:this.getAttribute("error-code"),showDetails:this.getBooleanAttribute("show-details")}}toggleDetails(e=null){const t=this.getBooleanAttribute("show-details"),i=e!==null?e:!t;this.setAttribute("show-details",i)}}customElements.get("quiz-error-display")||c.register("quiz-error-display",x);const W=Object.freeze(Object.defineProperty({__proto__:null,default:x},Symbol.toStringTag,{value:"Module"}));class w extends u{static get observedAttributes(){return["type","title","message","progress","current-step","total-steps","show-spinner"]}getTemplate(){const e=this.getAttribute("type")||"simple",t=this.getAttribute("title")||"Loading...",i=this.getAttribute("message")||"",r=this.getAttribute("progress")||"0",s=this.getAttribute("current-step")||"1",o=this.getAttribute("total-steps")||"1",a=this.getBooleanAttribute("show-spinner",!0);return e==="comprehensive"?this.getComprehensiveTemplate(t,i,r,s,o,a):this.getSimpleTemplate(t,i,a)}getSimpleTemplate(e,t,i){return`
      <div class="quiz-loading-display simple">
        <div class="quiz-loading-content">
          ${i?`
            <div class="quiz-loading-icon">
              <div class="quiz-loading-spinner"></div>
            </div>
          `:""}

          <div class="quiz-loading-text">
            <h3 class="quiz-loading-title">${this.sanitizeHTML(e)}</h3>
            ${t?`<p class="quiz-loading-message">${this.sanitizeHTML(t)}</p>`:""}
          </div>

          <!-- Default slot for additional content -->
          <slot></slot>
        </div>
      </div>
    `}getComprehensiveTemplate(e,t,i,r,s,o){return`
      <div class="quiz-comprehensive-loading">
        <div class="quiz-loading-content">
          ${o?`
            <div class="quiz-loading-icon">
              <div class="quiz-loading-spinner-large"></div>
            </div>
          `:""}

          <div class="quiz-loading-step">
            <h3 class="quiz-loading-step-title">${this.sanitizeHTML(e)}</h3>
            ${t?`<p class="quiz-loading-step-description">${this.sanitizeHTML(t)}</p>`:""}
          </div>

          <!-- Default slot for additional content -->
          <slot></slot>
        </div>
      </div>
    `}getStyles(){return`
      ${super.getStyles()}

      :host {
        display: block;
      }

      .quiz-loading-display {
        background: white;
        border-radius: 8px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .quiz-loading-display.simple {
        min-height: 120px;
        padding: 24px;
      }

      .quiz-comprehensive-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 2rem;
        text-align: center;
      }

      .quiz-loading-content {
        max-width: 500px;
        width: 100%;
      }

      .quiz-loading-icon {
        margin-bottom: 2rem;
        display: flex;
        justify-content: center;
      }

      .quiz-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f4f6;
        border-top: 3px solid #10b981;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .quiz-loading-spinner-large {
        width: 60px;
        height: 60px;
        border: 4px solid #f3f4f6;
        border-top: 4px solid #10b981;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .quiz-loading-step {
        margin-bottom: 2rem;
      }

      .quiz-loading-step-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
        transition: opacity 0.3s ease-in-out;
        transform: scale(1);
        animation: pulseIcon 2s ease-in-out infinite;
      }

      .quiz-loading-step-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.5rem;
        transition: opacity 0.3s ease-in-out;
      }

      .quiz-loading-step-description {
        font-size: 1rem;
        color: #6b7280;
        margin-bottom: 0;
        transition: opacity 0.3s ease-in-out;
      }

      .quiz-loading-progress {
        margin-top: 2rem;
      }

      .quiz-loading-progress-bar {
        width: 100%;
        height: 8px;
        background-color: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .quiz-loading-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #059669);
        border-radius: 4px;
        transition: width 0.8s ease-in-out;
        position: relative;
      }

      .quiz-loading-progress-fill::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
      }

      .quiz-loading-progress-text {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      @keyframes pulseIcon {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .quiz-comprehensive-loading {
          padding: 2rem;
        }

        .quiz-loading-content {
          .quiz-loading-icon {
            .quiz-loading-spinner-large {
              width: 48px;
              height: 48px;
              border-width: 3px;
            }
          }

          .quiz-loading-step {
            .quiz-loading-step-icon {
              font-size: 2.5rem;
            }

            .quiz-loading-step-title {
              font-size: 1.25rem;
            }

            .quiz-loading-step-description {
              font-size: 0.875rem;
            }
          }
        }
      }

      .quiz-loading-steps ::slotted(.loading-step.active) {
        background: #f0f9ff;
        color: var(--quiz-primary-color);
        border: 1px solid #bfdbfe;
      }

      .quiz-loading-steps ::slotted(.loading-step.active::before) {
        background: var(--quiz-secondary-color);
        color: white;
      }

      .quiz-loading-steps ::slotted(.loading-step.completed) {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .quiz-loading-steps ::slotted(.loading-step.completed::before) {
        background: #16a34a;
        color: white;
        content: "✓";
      }

      .quiz-loading-progress {
        width: 100%;
        margin-top: 8px;
      }

      .quiz-loading-progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .quiz-loading-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--quiz-secondary-color), #4ade80);
        border-radius: 4px;
        transition: width 0.3s ease;
        position: relative;
      }

      .quiz-loading-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .quiz-loading-progress-text {
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .quiz-loading-display {
          padding: 24px 20px;
          min-height: 160px;
        }

        .quiz-loading-display.simple {
          min-height: 100px;
          padding: 20px 16px;
        }

        .quiz-loading-content {
          gap: 16px;
        }

        .quiz-loading-title {
          font-size: 18px;
        }

        .quiz-loading-message {
          font-size: 13px;
        }

        .quiz-loading-spinner-large {
          width: 40px;
          height: 40px;
          border-width: 3px;
        }

        .quiz-loading-steps ::slotted(.loading-step) {
          padding: 10px 14px;
          font-size: 13px;
        }

        .quiz-loading-steps ::slotted(.loading-step::before) {
          width: 20px;
          height: 20px;
          font-size: 11px;
          margin-right: 10px;
        }
      }

      @media (max-width: 480px) {
        .quiz-loading-display {
          padding: 20px 16px;
        }

        .quiz-loading-title {
          font-size: 16px;
        }

        .quiz-loading-steps {
          gap: 8px;
        }

        .quiz-loading-steps ::slotted(.loading-step) {
          padding: 8px 12px;
          font-size: 12px;
        }
      }
    `}render(){this.renderTemplate()}handleAttributeChange(e,t,i){this.isConnected&&(e==="progress"?this.updateProgress(i):this.render())}updateProgress(e){const t=this.querySelector(".quiz-loading-progress-fill"),i=this.querySelector(".quiz-loading-progress-text");if(t&&(t.style.width=`${e}%`),i){const r=this.getAttribute("current-step")||"1",s=this.getAttribute("total-steps")||"1";i.textContent=`${e}% complete (${r}/${s})`}}onConnected(){this.dispatchCustomEvent("quiz-loading-display-ready",{type:this.getAttribute("type"),title:this.getAttribute("title"),progress:this.getAttribute("progress")})}setLoading(e,t,i="",r=0,s=1,o=1){this.setAttributes({type:e,title:t,message:i,progress:r.toString(),"current-step":s.toString(),"total-steps":o.toString()})}setProgress(e,t=null){this.setAttribute("progress",e.toString()),t!==null&&this.setAttribute("current-step",t.toString())}getLoading(){return{type:this.getAttribute("type"),title:this.getAttribute("title"),message:this.getAttribute("message"),progress:parseInt(this.getAttribute("progress")||"0"),currentStep:parseInt(this.getAttribute("current-step")||"1"),totalSteps:parseInt(this.getAttribute("total-steps")||"1")}}toggleSpinner(e=null){const t=this.getBooleanAttribute("show-spinner",!0),i=e!==null?e:!t;this.setAttribute("show-spinner",i)}}customElements.get("quiz-loading-display")||c.register("quiz-loading-display",w);const Y=Object.freeze(Object.defineProperty({__proto__:null,default:w},Symbol.toStringTag,{value:"Module"}));class $ extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.faqData=[]}static get observedAttributes(){return["faq-data"]}attributeChangedCallback(e,t,i){if(e==="faq-data"&&i)try{this.faqData=JSON.parse(i),this.render()}catch(r){console.error("Invalid FAQ data:",r)}}connectedCallback(){this.render()}async render(){const e=await b.getQuizStyles(),t=this.getTemplate(),i=this.getStyles();this.shadowRoot.innerHTML=`
			<style>
				${e}
				${i}
			</style>
			${t}
		`,this.attachEventListeners()}getTemplate(){return!this.faqData||this.faqData.length===0?"<div></div>":`
			<div class="quiz-faq-section">
				<div class="quiz-faq-divider"></div>
				${this.faqData.map(e=>`
					<div class="quiz-faq-item" data-faq="${e.id}" tabindex="0" role="button" aria-expanded="false">
						<div class="quiz-faq-content">
							<div class="quiz-faq-question-collapsed">${e.question}</div>
							<div class="quiz-faq-answer">${e.answer}</div>
						</div>
						<div class="quiz-faq-toggle">
							<svg class="quiz-faq-toggle-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
								<path d="M4 16H28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M16 4V28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
					</div>
					<div class="quiz-faq-divider"></div>
				`).join("")}
			</div>
		`}getStyles(){return`
			:host {
				display: block;
			}
		`}attachEventListeners(){this.shadowRoot.querySelectorAll(".quiz-faq-item").forEach(t=>{t.addEventListener("click",()=>{if(t.classList.contains("expanded")){t.classList.remove("expanded"),t.setAttribute("aria-expanded","false");const r=t.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");r&&(r.className="quiz-faq-question-collapsed")}else{t.classList.add("expanded"),t.setAttribute("aria-expanded","true");const r=t.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");r&&(r.className="quiz-faq-question")}}),t.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),t.click())})})}setFAQData(e){this.faqData=e,this.render()}}customElements.define("quiz-faq-section",$);class A extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.selectedPayer="",this.placeholder="Start typing to search for your insurance plan...",this.commonPayers=[],this.questionId="",this.searchTimeout=null}static get observedAttributes(){return["question-id","placeholder","selected-payer","common-payers"]}attributeChangedCallback(e,t,i){switch(e){case"question-id":this.questionId=i||"";break;case"placeholder":this.placeholder=i||"Start typing to search for your insurance plan...";break;case"selected-payer":this.selectedPayer=i||"";break;case"common-payers":try{this.commonPayers=i?JSON.parse(i):[]}catch(r){console.error("Invalid common payers data:",r),this.commonPayers=[]}break}this.shadowRoot.innerHTML&&this.render()}connectedCallback(){this.render()}async render(){const e=await b.getQuizStyles(),t=this.getTemplate(),i=this.getStyles();this.shadowRoot.innerHTML=`
			<style>
				${e}
				${i}
			</style>
			${t}
		`,this.attachEventListeners()}getTemplate(){const e=this.resolvePayerDisplayName(this.selectedPayer);return`
			<div class="quiz-payer-search-container">
				<div class="quiz-payer-search-input-wrapper">
					<input
						type="text"
						id="question-${this.questionId}"
						class="quiz-payer-search-input"
						placeholder="${this.placeholder}"
						value="${e}"
						autocomplete="off"
						aria-describedby="error-${this.questionId}"
					>
					<svg class="quiz-payer-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
						<path d="M13.1667 13.1667L16.5 16.5M14.8333 8.16667C14.8333 4.48477 11.8486 1.5 8.16667 1.5C4.48477 1.5 1.5 4.48477 1.5 8.16667C1.5 11.8486 4.48477 14.8333 8.16667 14.8333C11.8486 14.8333 14.8333 11.8486 14.8333 8.16667Z" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div class="quiz-payer-search-dropdown" id="search-dropdown-${this.questionId}" style="display: none;">
					<div class="quiz-payer-search-dropdown-header">
						<span class="quiz-payer-search-dropdown-title">Suggestions</span>
						<button class="quiz-payer-search-close-btn" type="button" aria-label="Close dropdown">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 4L4 12M4 4L12 12" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>
					<div class="quiz-payer-search-results"></div>
				</div>
				<p id="error-${this.questionId}" class="quiz-error-text quiz-error-hidden"></p>
			</div>
		`}getStyles(){return`
			:host {
				display: block;
			}
		`}attachEventListeners(){const e=this.shadowRoot.querySelector(".quiz-payer-search-input"),t=this.shadowRoot.querySelector(".quiz-payer-search-dropdown"),i=this.shadowRoot.querySelector(".quiz-payer-search-close-btn"),r=this.shadowRoot.querySelector(".quiz-payer-search-container");e.addEventListener("input",s=>{const o=s.target.value.trim();this.handleSearch(o,t)}),e.addEventListener("focus",()=>{e.value.trim()===""&&this.showInitialPayerList(t),this.openDropdown(t,r,e)}),i.addEventListener("click",()=>{this.closeDropdown(t,r,e)}),document.addEventListener("click",s=>{r.contains(s.target)||this.closeDropdown(t,r,e)})}handleSearch(e,t){if(clearTimeout(this.searchTimeout),e.length===0){this.showInitialPayerList(t);return}this.searchTimeout=setTimeout(async()=>{try{const i=await this.searchPayers(e);this.renderSearchResults(i,e,t)}catch(i){console.error("Search error:",i),this.showSearchError(t)}},300)}async searchPayers(e){const t=this.filterCommonPayers(e);if(t.length>0)return t;try{return await this.searchPayersAPI(e)}catch(i){return console.error("API search failed:",i),t}}filterCommonPayers(e){const t=e.toLowerCase();return this.commonPayers.filter(i=>{const r=i.displayName.toLowerCase().includes(t),s=i.aliases?.some(o=>o.toLowerCase().includes(t));return r||s})}async searchPayersAPI(e){return[]}showInitialPayerList(e){const t=e.querySelector(".quiz-payer-search-results");t.innerHTML=this.commonPayers.map(i=>`
			<div class="quiz-payer-search-item" data-payer-id="${i.stediId}" data-payer-name="${i.displayName}">
				<div class="quiz-payer-search-item-name">${i.displayName}</div>
				<div class="quiz-payer-search-item-details">ID: ${i.primaryPayerId}</div>
			</div>
		`).join(""),this.attachResultListeners(e)}renderSearchResults(e,t,i){const r=i.querySelector(".quiz-payer-search-results");if(e.length===0){r.innerHTML=`
				<div class="quiz-payer-search-no-results">
					No insurance plans found for "${t}"
				</div>
			`;return}r.innerHTML=e.map(s=>`
			<div class="quiz-payer-search-item" data-payer-id="${s.stediId}" data-payer-name="${s.displayName}">
				<div class="quiz-payer-search-item-name">${this.highlightSearchTerm(s.displayName,t)}</div>
				<div class="quiz-payer-search-item-details">ID: ${s.primaryPayerId}</div>
			</div>
		`).join(""),this.attachResultListeners(i)}attachResultListeners(e){e.querySelectorAll(".quiz-payer-search-item").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.payerId,s=i.dataset.payerName;this.selectPayer({stediId:r,displayName:s})})})}selectPayer(e){const t=this.shadowRoot.querySelector(".quiz-payer-search-input"),i=this.shadowRoot.querySelector(".quiz-payer-search-dropdown"),r=this.shadowRoot.querySelector(".quiz-payer-search-container");t.value=e.displayName,this.selectedPayer=e.stediId,this.closeDropdown(i,r,t),this.dispatchEvent(new CustomEvent("payer-selected",{detail:{questionId:this.questionId,payer:e},bubbles:!0}))}openDropdown(e,t,i){e.style.display="block",t.classList.add("dropdown-open"),i.classList.add("dropdown-open")}closeDropdown(e,t,i){e.style.display="none",t.classList.remove("dropdown-open"),i.classList.remove("dropdown-open")}showSearchError(e){const t=e.querySelector(".quiz-payer-search-results");t.innerHTML=`
			<div class="quiz-payer-search-error">
				Unable to search at this time. Please try again.
			</div>
		`}highlightSearchTerm(e,t){if(!t)return e;const i=new RegExp(`(${t})`,"gi");return e.replace(i,'<span class="quiz-payer-search-highlight">$1</span>')}resolvePayerDisplayName(e){if(!e)return"";const t=this.commonPayers.find(i=>i.stediId===e||i.primaryPayerId===e);return t?t.displayName:e}setValue(e){this.selectedPayer=e;const t=this.shadowRoot.querySelector(".quiz-payer-search-input");t&&(t.value=this.resolvePayerDisplayName(e))}getValue(){return this.selectedPayer}}customElements.define("quiz-payer-search",A);class E extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.resultType="generic",this.resultData={},this.resultUrl=""}static get observedAttributes(){return["result-type","result-data","result-url"]}attributeChangedCallback(e,t,i){switch(e){case"result-type":this.resultType=i||"generic";break;case"result-data":try{this.resultData=i?JSON.parse(i):{}}catch(r){console.error("Invalid result data:",r),this.resultData={}}break;case"result-url":this.resultUrl=i||"";break}this.shadowRoot.innerHTML&&this.render()}connectedCallback(){this.render()}async render(){const e=await b.getQuizStyles(),t=this.getTemplate(),i=this.getStyles();this.shadowRoot.innerHTML=`
			<style>
				${e}
				${i}
			</style>
			${t}
		`,this.attachEventListeners()}getTemplate(){switch(this.resultType){case"eligible":return this.getEligibleTemplate();case"not-covered":return this.getNotCoveredTemplate();case"aaa-error":return this.getAAAErrorTemplate();case"test-data-error":return this.getTestDataErrorTemplate();case"technical-problem":return this.getTechnicalProblemTemplate();case"processing":return this.getProcessingTemplate();case"ineligible":return this.getIneligibleTemplate();default:return this.getGenericTemplate()}}getStyles(){return`
			:host {
				display: block;
			}

			.result-card {
				background: white;
				border-radius: 12px;
				padding: 24px;
				margin-bottom: 24px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}

			.result-header {
				margin-bottom: 20px;
			}

			.result-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 24px;
				font-weight: 700;
				line-height: 1.3;
				color: #121212;
				margin: 0 0 8px 0;
			}

			.result-subtitle {
				font-family: "DM Sans", sans-serif;
				font-size: 16px;
				color: #666;
				margin: 0;
			}

			.result-content {
				margin-bottom: 20px;
			}

			.result-actions {
				display: flex;
				gap: 12px;
				flex-wrap: wrap;
			}

			.result-button {
				background-color: #306e51;
				color: white;
				border: none;
				border-radius: 300px;
				padding: 14px 40px;
				font-family: "DM Sans", sans-serif;
				font-size: 18px;
				font-weight: 600;
				text-decoration: none;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				transition: all 0.2s ease;
			}

			.result-button:hover {
				background-color: #245a42;
				transform: translateY(-1px);
			}

			.error-card {
				border-left: 4px solid #f56565;
				background-color: #fed7d7;
			}

			.warning-card {
				border-left: 4px solid #ed8936;
				background-color: #fffaf0;
			}

			.success-card {
				border-left: 4px solid #48bb78;
				background-color: #f0fff4;
			}

			.info-card {
				border-left: 4px solid #4299e1;
				background-color: #ebf8ff;
			}

			.feature-list {
				list-style: none;
				padding: 0;
				margin: 16px 0;
			}

			.feature-item {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 12px;
				font-family: "DM Sans", sans-serif;
				font-size: 16px;
				color: #333;
			}

			.feature-icon {
				width: 20px;
				height: 20px;
				flex-shrink: 0;
			}

			.error-details {
				margin-top: 16px;
				padding: 12px;
				background: rgba(0, 0, 0, 0.05);
				border-radius: 8px;
				font-family: "DM Sans", sans-serif;
				font-size: 14px;
				color: #666;
			}
		`}getEligibleTemplate(){const e=this.resultData.sessionsCovered||5,t=this.resultData.planEnd||"Dec 31, 2025";return`
			<div class="result-card success-card">
				<div class="result-header">
					<h2 class="result-title">Great news! You're covered</h2>
					<p class="result-subtitle">As of today, your insurance fully covers your online dietitian consultations*</p>
				</div>
				<div class="result-content">
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Up to ${e} sessions covered through ${t}
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Licensed registered dietitians
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Personalized nutrition plans
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Schedule Your Consultation</a>
				</div>
			</div>
		`}getNotCoveredTemplate(){return`
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We have options for you.</p>
				</div>
				<div class="result-content">
					<p><strong>💡 Coverage Information:</strong></p>
					<p>${this.resultData.userMessage||"Your insurance plan doesn't cover nutrition counseling, but we have affordable options available."}</p>
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#ed8936" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Affordable self-pay options available
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Flexible payment plans
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Same quality care from registered dietitians
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Explore Options</a>
				</div>
			</div>
		`}getAAAErrorTemplate(){const e=this.resultData.error||{},t=e.code||this.resultData.aaaErrorCode||"Unknown",i=this.resultData.userMessage||e.message||"There was an issue verifying your insurance coverage automatically.";return`
			<div class="result-card error-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're here to help.</p>
				</div>
				<div class="result-content">
					<p><strong>⚠️ ${e.title||this.getErrorTitle(t)}:</strong></p>
					<p>${i}</p>
					${t!=="Unknown"?`<div class="error-details">Error Code: ${t}</div>`:""}
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#f56565" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Manual verification by our team
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Direct support to resolve issues
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Quick resolution to connect you with a dietitian
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue with Support</a>
				</div>
			</div>
		`}getTestDataErrorTemplate(){return`
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Please use real information</h2>
					<p class="result-subtitle">We need accurate details for verification.</p>
				</div>
				<div class="result-content">
					<p><strong>⚠️ Test Data Detected:</strong></p>
					<p>${this.resultData.userMessage||"Test data was detected in your submission. Please use real insurance information for accurate verification."}</p>
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#ed8936" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Retake quiz with real insurance information
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Use information exactly as it appears on your card
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Get accurate coverage details for your plan
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue</a>
				</div>
			</div>
		`}getTechnicalProblemTemplate(){const e=this.resultData.error||{},t=e.code||this.resultData.stediErrorCode||"Unknown";return`
			<div class="result-card error-card">
				<div class="result-header">
					<h2 class="result-title">Technical Issue</h2>
					<p class="result-subtitle">We're working to resolve this quickly.</p>
				</div>
				<div class="result-content">
					<p>${this.resultData.userMessage||e.message||"There was a technical issue processing your insurance verification."}</p>
					${t!=="Unknown"?`<div class="error-details">Error Code: ${t}</div>`:""}
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue with Support</a>
				</div>
			</div>
		`}getProcessingTemplate(){return`
			<div class="result-card info-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to connect you with a registered dietitian.</p>
				</div>
				<div class="result-content">
					<p>Your eligibility check and account setup is still processing in the background. This can take up to 3 minutes for complex insurance verifications and account creation. Please proceed with booking - we'll contact you with your coverage details shortly.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue to Booking</a>
				</div>
			</div>
		`}getIneligibleTemplate(){return`
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to connect you with a registered dietitian.</p>
				</div>
				<div class="result-content">
					<p>Based on your insurance information, you may not be eligible for covered nutrition counseling. However, we have affordable self-pay options available.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Explore Options</a>
				</div>
			</div>
		`}getGenericTemplate(){return`
			<div class="result-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to help you on your health journey.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue</a>
				</div>
			</div>
		`}getErrorTitle(e){return{42:"Insurance Information Issue",43:"Coverage Verification Problem",72:"Plan Details Unavailable",73:"Eligibility Check Failed",75:"Coverage Status Unknown",79:"Verification Timeout"}[e]||"Verification Issue"}attachEventListeners(){this.shadowRoot.querySelectorAll(".result-button").forEach(t=>{t.addEventListener("click",i=>{this.dispatchEvent(new CustomEvent("result-action",{detail:{resultType:this.resultType,action:"button-click",url:t.href},bubbles:!0}))})})}setResultData(e,t,i){this.resultType=e,this.resultData=t,this.resultUrl=i,this.render()}}customElements.define("quiz-result-card",E);class D extends u{static get observedAttributes(){return["step-data","responses","is-last-step","validation-errors"]}getTemplate(){const e=this.getStepData(),t=this.getResponses(),i=this.getAttribute("is-last-step")==="true",r=this.getValidationErrors();if(!e)return'<p class="quiz-error-text">Step configuration error. Please contact support.</p>';const s=i?e.ctaText||"Finish Quiz":e.ctaText||"Continue";return`
			${e.info?.formSubHeading?`<h4 class="quiz-heading quiz-heading-mobile-outside">${e.info.formSubHeading}</h4>`:""}
			<div class="quiz-form-container">
				${e.info?.formSubHeading?`<h4 class="quiz-heading quiz-heading-desktop-inside">${e.info.formSubHeading}</h4>`:""}
				<div class="quiz-space-y-6">
					${this.renderFormQuestions(e.questions,t,r)}
				</div>
				<button class="quiz-nav-button quiz-nav-button--primary quiz-form-button" id="quiz-form-next-button">
					${s}
				</button>
				${e.legal?`<p class="quiz-legal-form">${e.legal}</p>`:""}
			</div>
		`}getStyles(){return`
			${super.getStyles()}

			.quiz-form-container {
				display: flex;
				flex-direction: column;
				gap: 24px;
			}

			.quiz-space-y-6 {
				display: flex;
				flex-direction: column;
				gap: 24px;
			}

			.quiz-heading-mobile-outside {
				display: block;
			}

			.quiz-heading-desktop-inside {
				display: none;
			}

			@media (min-width: 768px) {
				.quiz-heading-mobile-outside {
					display: none;
				}

				.quiz-heading-desktop-inside {
					display: block;
				}
			}

			.quiz-nav-button {
				padding: 12px 24px;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				transition: var(--quiz-transition);
				cursor: pointer;
				border: none;
			}

			.quiz-nav-button--primary {
				background-color: var(--quiz-secondary-color);
				color: white;
			}

			.quiz-nav-button--primary:hover {
				opacity: 0.9;
			}

			.quiz-legal-form {
				font-size: 12px;
				color: #666;
				text-align: center;
				margin-top: 16px;
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				text-align: center;
				padding: 16px;
			}
		`}render(){this.renderTemplate(),this.attachEventListeners()}attachEventListeners(){const e=this.root.querySelector("#quiz-form-next-button");e&&e.addEventListener("click",t=>{t.preventDefault(),this.dispatchEvent(new CustomEvent("form-submit",{detail:{stepData:this.getStepData()},bubbles:!0}))})}renderFormQuestions(e,t,i){if(!e||!Array.isArray(e))return"";let r="",s=0;for(;s<e.length;){const o=this.tryProcessQuestionGroup(e,s,t);o.html?(r+=o.html,s+=o.skip):(r+=this.renderSingleFormQuestion(e[s],t,i),s++)}return r}tryProcessQuestionGroup(e,t,i){const r=e[t],s=a=>i?.find(n=>n.questionId===a.id)||{answer:null},o=[["member-id","group-number"],["first-name","last-name"],["email","phone"]];for(const a of o)if(r.id===a[0]&&e[t+1]?.id===a[1])return{html:this.renderFormFieldPair(r,e[t+1],s(r),s(e[t+1])),skip:2};if(r.type==="date-part"&&r.part==="month"){const[a,n]=[e[t+1],e[t+2]];if(a?.type==="date-part"&&a.part==="day"&&n?.type==="date-part"&&n.part==="year")return{html:this.renderDateGroup(r,a,n,i),skip:3}}return{html:null,skip:0}}renderSingleFormQuestion(e,t,i){const r=t?.find(a=>a.questionId===e.id)||{answer:null},s=i?.some(a=>a.questionId===e.id);return`
			<div class="quiz-question-section ${s?"quiz-field-error":""}">
				<label class="quiz-label" for="question-${e.id}">
					${e.text}${this.renderHelpIcon(e.id)}
				</label>
				${e.helpText?`<p class="quiz-text-sm">${e.helpText}</p>`:""}
				${this.renderQuestionInput(e,r)}
				${s?`<div class="quiz-error-message">${i.find(a=>a.questionId===e.id)?.message||"Invalid input"}</div>`:""}
			</div>
		`}renderFormFieldPair(e,t,i,r){const s=(n,g)=>({input:this.renderQuestionInput(n,g),helpIcon:this.renderHelpIcon(n.id),label:n.text,id:n.id}),[o,a]=[s(e,i),s(t,r)];return`
			<div class="quiz-grid-2-form">
				${[o,a].map(n=>`
					<div>
						<label class="quiz-label" for="question-${n.id}">
							${n.label}${n.helpIcon}
						</label>
						${n.input}
					</div>
				`).join("")}
			</div>
		`}renderDateGroup(e,t,i,r){const s=r?.find(n=>n.questionId===e.id)||{answer:null},o=r?.find(n=>n.questionId===t.id)||{answer:null},a=r?.find(n=>n.questionId===i.id)||{answer:null};return`
			<div class="quiz-question-section">
				<label class="quiz-label">${e.text}</label>
				<div class="quiz-grid-3">
					${this.renderDatePart(e,s)}
					${this.renderDatePart(t,o)}
					${this.renderDatePart(i,a)}
				</div>
			</div>
		`}renderQuestionInput(e,t){const i=t?.answer||"";switch(e.type){case"text":case"email":case"phone":return`<input type="${e.type}" id="question-${e.id}" class="quiz-input" value="${i}" ${e.required?"required":""}>`;case"textarea":return`<textarea id="question-${e.id}" class="quiz-textarea" ${e.required?"required":""}>${i}</textarea>`;case"dropdown":return this.renderDropdownOptions(e,i);default:return`<input type="text" id="question-${e.id}" class="quiz-input" value="${i}">`}}renderDropdownOptions(e,t){return e.options?`
			<select id="question-${e.id}" class="quiz-dropdown">
				<option value="">${e.placeholder||"Select an option"}</option>
				${e.options.map(i=>`
					<option value="${i.value}" ${t===i.value?"selected":""}>
						${i.text}
					</option>
				`).join("")}
			</select>
		`:""}renderDatePart(e,t){const i=t?.answer||"",r=this.getDatePartOptions(e.part);return`
			<select id="question-${e.id}" class="quiz-dropdown">
				<option value="">${e.placeholder||e.part}</option>
				${r.map(s=>`
					<option value="${s.value}" ${i===s.value?"selected":""}>
						${s.text}
					</option>
				`).join("")}
			</select>
		`}getDatePartOptions(e){switch(e){case"month":return Array.from({length:12},(i,r)=>({value:String(r+1).padStart(2,"0"),text:new Date(2e3,r).toLocaleString("default",{month:"long"})}));case"day":return Array.from({length:31},(i,r)=>({value:String(r+1).padStart(2,"0"),text:String(r+1)}));case"year":const t=new Date().getFullYear();return Array.from({length:100},(i,r)=>({value:String(t-r),text:String(t-r)}));default:return[]}}renderHelpIcon(e){return`<span class="quiz-help-icon-container">
			<svg class="quiz-help-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M14.6668 8.00004C14.6668 4.31814 11.682 1.33337 8.00016 1.33337C4.31826 1.33337 1.3335 4.31814 1.3335 8.00004C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667C11.682 14.6667 14.6668 11.6819 14.6668 8.00004Z" stroke="#121212"/>
				<path d="M8.1613 11.3334V8.00004C8.1613 7.68577 8.1613 7.52864 8.06363 7.43097C7.96603 7.33337 7.8089 7.33337 7.49463 7.33337" stroke="#121212" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M7.99463 5.33337H8.00063" stroke="#121212" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</span>`}getStepData(){try{const e=this.getAttribute("step-data");return e?JSON.parse(e):null}catch(e){return console.error("Error parsing step data:",e),null}}getResponses(){try{const e=this.getAttribute("responses");return e?JSON.parse(e):[]}catch(e){return console.error("Error parsing responses:",e),[]}}getValidationErrors(){try{const e=this.getAttribute("validation-errors");return e?JSON.parse(e):[]}catch(e){return console.error("Error parsing validation errors:",e),[]}}handleAttributeChange(e,t,i){["step-data","responses","validation-errors","is-last-step"].includes(e)&&this.render()}}customElements.define("quiz-form-step",D);class L extends u{static get observedAttributes(){return["step-data","responses","current-question-index","is-form-step","validation-errors"]}getTemplate(){const e=this.getStepData(),t=this.getResponses(),i=parseInt(this.getAttribute("current-question-index")||"0"),r=this.getAttribute("is-form-step")==="true",s=this.getValidationErrors();return e?`
			<div class="animate-fade-in">
				${this.renderStepInfo(e)}
				${e.questions?.length>0?r?this.renderFormStep(e,t,s):this.renderWizardStep(e,t,i):e.info?"":'<p class="quiz-error-text">Step configuration error. Please contact support.</p>'}
			</div>
		`:'<p class="quiz-error-text">Step configuration error. Please contact support.</p>'}getStyles(){return`
			${super.getStyles()}

			.animate-fade-in {
				animation: fadeIn 0.3s ease-in-out;
			}

			@keyframes fadeIn {
				from { opacity: 0; transform: translateY(10px); }
				to { opacity: 1; transform: translateY(0); }
			}

			.quiz-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 28px;
				font-weight: 700;
				line-height: 1.2;
				color: #121212;
				margin: 0 0 16px 0;
			}

			.quiz-text {
				font-size: 16px;
				line-height: 1.5;
				color: #333;
				margin: 0 0 12px 0;
			}

			.quiz-subtext {
				font-size: 14px;
				line-height: 1.4;
				color: #666;
				margin: 0 0 24px 0;
			}

			.quiz-heading {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				line-height: 1.3;
				color: #121212;
				margin: 0 0 16px 0;
			}

			.quiz-text-sm {
				font-size: 14px;
				line-height: 1.4;
				color: #666;
				margin: 0 0 8px 0;
			}

			.quiz-divider {
				border-top: 1px solid #e5e5e5;
				padding-top: 24px;
				margin-top: 24px;
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				text-align: center;
				padding: 16px;
				background-color: #fef2f2;
				border-radius: var(--quiz-border-radius);
				border: 1px solid #fecaca;
			}

			@media (max-width: 768px) {
				.quiz-title {
					font-size: 24px;
				}

				.quiz-heading {
					font-size: 18px;
				}
			}
		`}render(){this.renderTemplate(),this.attachEventListeners()}attachEventListeners(){this.addEventListener("form-submit",e=>{this.dispatchEvent(new CustomEvent("step-form-submit",{detail:e.detail,bubbles:!0}))}),this.addEventListener("question-answer",e=>{this.dispatchEvent(new CustomEvent("step-question-answer",{detail:e.detail,bubbles:!0}))})}renderStepInfo(e){return e.info?`
			<div class="quiz-step-info">
				<h3 class="quiz-title">${e.info.heading}</h3>
				<p class="quiz-text">${e.info.text}</p>
				${e.info.subtext?`<p class="quiz-subtext">${e.info.subtext}</p>`:""}
			</div>
		`:""}renderFormStep(e,t,i){const r=document.createElement("quiz-form-step");return r.setAttribute("step-data",JSON.stringify(e)),r.setAttribute("responses",JSON.stringify(t)),r.setAttribute("validation-errors",JSON.stringify(i)),this.getAttribute("is-last-step")==="true"&&r.setAttribute("is-last-step","true"),r.outerHTML}renderWizardStep(e,t,i){const r=e.questions[i],s=t?.find(a=>a.questionId===r?.id)||{answer:null};if(!r)return'<p class="quiz-error-text">Question not found. Please try again.</p>';let o="";return e.info?o+=`
				<div class="quiz-divider">
					<h4 class="quiz-heading">${r.text}</h4>
					${r.helpText?`<p class="quiz-text-sm">${r.helpText}</p>`:""}
				</div>
			`:o+=`
				<div class="quiz-question-header">
					<h3 class="quiz-title">${r.text}</h3>
					${r.helpText?`<p class="quiz-text">${r.helpText}</p>`:""}
				</div>
			`,o+=this.renderQuestionByType(r,s),o}renderQuestionByType(e,t){const i=t?.answer||"";switch(e.type){case"multiple-choice":return this.renderMultipleChoice(e,i);case"checkbox":return this.renderCheckbox(e,i);case"dropdown":return this.renderDropdown(e,i);case"text":case"email":case"phone":return this.renderTextInput(e,i);case"textarea":return this.renderTextarea(e,i);case"rating":return this.renderRating(e,i);case"date":return this.renderDateInput(e,i);case"payer-search":return this.renderPayerSearch(e,i);default:return`<p class="quiz-error-text">Unsupported question type: ${e.type}</p>`}}renderMultipleChoice(e,t){return e.options?`
			<div class="quiz-multiple-choice">
				${e.options.map(i=>`
					<label class="quiz-option-card ${t===i.value?"selected":""}">
						<input type="radio" name="question-${e.id}" value="${i.value}"
							   ${t===i.value?"checked":""} class="quiz-radio-input">
						<div class="quiz-option-content">
							<span class="quiz-option-text">${i.text}</span>
							${i.description?`<span class="quiz-option-description">${i.description}</span>`:""}
						</div>
					</label>
				`).join("")}
			</div>
		`:""}renderCheckbox(e,t){if(!e.options)return"";const i=Array.isArray(t)?t:t?[t]:[];return`
			<div class="quiz-checkbox-group">
				${e.options.map(r=>`
					<label class="quiz-option-card ${i.includes(r.value)?"selected":""}">
						<input type="checkbox" name="question-${e.id}" value="${r.value}"
							   ${i.includes(r.value)?"checked":""} class="quiz-checkbox-input">
						<div class="quiz-option-content">
							<span class="quiz-option-text">${r.text}</span>
							${r.description?`<span class="quiz-option-description">${r.description}</span>`:""}
						</div>
					</label>
				`).join("")}
			</div>
		`}renderDropdown(e,t){return e.options?`
			<select id="question-${e.id}" class="quiz-dropdown">
				<option value="">${e.placeholder||"Select an option"}</option>
				${e.options.map(i=>`
					<option value="${i.value}" ${t===i.value?"selected":""}>
						${i.text}
					</option>
				`).join("")}
			</select>
		`:""}renderTextInput(e,t){return`
			<input type="${e.type||"text"}"
				   id="question-${e.id}"
				   class="quiz-input"
				   value="${t}"
				   placeholder="${e.placeholder||""}"
				   ${e.required?"required":""}>
		`}renderTextarea(e,t){return`
			<textarea id="question-${e.id}"
					  class="quiz-textarea"
					  placeholder="${e.placeholder||""}"
					  ${e.required?"required":""}>${t}</textarea>
		`}renderRating(e,t){const i=e.maxRating||5,r=parseInt(t)||0;return`
			<div class="quiz-rating">
				${Array.from({length:i},(s,o)=>o+1).map(s=>`
					<button type="button" class="quiz-rating-star ${s<=r?"selected":""}"
							data-rating="${s}">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
								  fill="${s<=r?"#fbbf24":"#e5e7eb"}"
								  stroke="#d1d5db" stroke-width="1"/>
						</svg>
					</button>
				`).join("")}
			</div>
		`}renderDateInput(e,t){return`
			<input type="date"
				   id="question-${e.id}"
				   class="quiz-input"
				   value="${t}"
				   ${e.required?"required":""}>
		`}renderPayerSearch(e,t){const i=document.createElement("quiz-payer-search");return i.setAttribute("question-id",e.id),e.commonPayers&&i.setAttribute("common-payers",JSON.stringify(e.commonPayers)),t&&i.setAttribute("selected-payer",t),i.outerHTML}getStepData(){try{const e=this.getAttribute("step-data");return e?JSON.parse(e):null}catch(e){return console.error("Error parsing step data:",e),null}}getResponses(){try{const e=this.getAttribute("responses");return e?JSON.parse(e):[]}catch(e){return console.error("Error parsing responses:",e),[]}}getValidationErrors(){try{const e=this.getAttribute("validation-errors");return e?JSON.parse(e):[]}catch(e){return console.error("Error parsing validation errors:",e),[]}}handleAttributeChange(e,t,i){["step-data","responses","current-question-index","is-form-step","validation-errors"].includes(e)&&this.render()}}customElements.define("quiz-step-container",L);class M extends u{static get observedAttributes(){return["result-type","scheduling-data","error-message"]}getTemplate(){const e=this.getAttribute("result-type")||"success",t=this.getSchedulingData(),i=this.getAttribute("error-message")||"";return e==="success"?this.renderSuccessResult(t):this.renderErrorResult(i,t)}getStyles(){return`
			${super.getStyles()}

			.quiz-scheduling-container {
				display: flex;
				flex-direction: column;
				gap: 24px;
				max-width: 600px;
				margin: 0 auto;
			}

			.quiz-scheduling-header {
				text-align: center;
				padding: 24px;
				background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
				border-radius: var(--quiz-border-radius);
				border: 1px solid #bae6fd;
			}

			.quiz-scheduling-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 28px;
				font-weight: 700;
				color: #0c4a6e;
				margin: 0 0 8px 0;
			}

			.quiz-scheduling-subtitle {
				font-size: 16px;
				color: #0369a1;
				margin: 0;
			}

			.quiz-appointment-card {
				background: white;
				border: 2px solid #22c55e;
				border-radius: var(--quiz-border-radius);
				padding: 24px;
				box-shadow: var(--quiz-shadow);
			}

			.quiz-appointment-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 16px;
			}

			.quiz-appointment-icon {
				width: 32px;
				height: 32px;
				background: #22c55e;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.quiz-appointment-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				color: #166534;
				margin: 0;
			}

			.quiz-appointment-details {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}

			.quiz-appointment-detail {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 0;
				border-bottom: 1px solid #f3f4f6;
			}

			.quiz-appointment-detail:last-child {
				border-bottom: none;
			}

			.quiz-appointment-detail-icon {
				width: 20px;
				height: 20px;
				color: #6b7280;
			}

			.quiz-appointment-detail-text {
				font-size: 14px;
				color: #374151;
			}

			.quiz-appointment-detail-value {
				font-weight: 600;
				color: #111827;
			}

			.quiz-next-steps {
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				padding: 20px;
			}

			.quiz-next-steps-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 18px;
				font-weight: 600;
				color: #1e293b;
				margin: 0 0 12px 0;
			}

			.quiz-next-steps-list {
				list-style: none;
				padding: 0;
				margin: 0;
			}

			.quiz-next-steps-item {
				display: flex;
				align-items: flex-start;
				gap: 8px;
				margin-bottom: 8px;
				font-size: 14px;
				color: #475569;
			}

			.quiz-next-steps-item:last-child {
				margin-bottom: 0;
			}

			.quiz-next-steps-number {
				background: #3b82f6;
				color: white;
				width: 20px;
				height: 20px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 12px;
				font-weight: 600;
				flex-shrink: 0;
			}

			.quiz-error-card {
				background: #fef2f2;
				border: 2px solid #fca5a5;
				border-radius: var(--quiz-border-radius);
				padding: 24px;
			}

			.quiz-error-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 16px;
			}

			.quiz-error-icon {
				width: 32px;
				height: 32px;
				background: #ef4444;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.quiz-error-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				color: #dc2626;
				margin: 0;
			}

			.quiz-error-message {
				font-size: 16px;
				color: #991b1b;
				line-height: 1.5;
				margin-bottom: 16px;
			}

			.quiz-support-info {
				background: white;
				border: 1px solid #fca5a5;
				border-radius: var(--quiz-border-radius);
				padding: 16px;
			}

			.quiz-support-title {
				font-weight: 600;
				color: #dc2626;
				margin: 0 0 8px 0;
			}

			.quiz-support-text {
				font-size: 14px;
				color: #7f1d1d;
				margin: 0;
			}

			.quiz-action-buttons {
				display: flex;
				gap: 12px;
				justify-content: center;
				margin-top: 24px;
			}

			.quiz-button {
				padding: 12px 24px;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				text-decoration: none;
				transition: var(--quiz-transition);
				cursor: pointer;
				border: none;
				font-size: 16px;
			}

			.quiz-button--primary {
				background: #3b82f6;
				color: white;
			}

			.quiz-button--primary:hover {
				background: #2563eb;
			}

			.quiz-button--secondary {
				background: white;
				color: #3b82f6;
				border: 2px solid #3b82f6;
			}

			.quiz-button--secondary:hover {
				background: #eff6ff;
			}

			@media (max-width: 768px) {
				.quiz-scheduling-title {
					font-size: 24px;
				}

				.quiz-appointment-details {
					gap: 8px;
				}

				.quiz-action-buttons {
					flex-direction: column;
				}
			}
		`}render(){this.renderTemplate(),this.attachEventListeners()}attachEventListeners(){this.root.querySelectorAll(".quiz-button").forEach(t=>{t.addEventListener("click",i=>{const r=t.getAttribute("data-action");r&&this.dispatchEvent(new CustomEvent("scheduling-action",{detail:{action:r,target:i.target},bubbles:!0}))})})}renderSuccessResult(e){if(!e)return this.renderGenericSuccess();const t=e.appointment||{},i=e.dietitian||{};return`
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">🎉 Appointment Confirmed!</h2>
					<p class="quiz-scheduling-subtitle">Your consultation has been successfully scheduled</p>
				</div>

				<div class="quiz-appointment-card">
					<div class="quiz-appointment-header">
						<div class="quiz-appointment-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
							</svg>
						</div>
						<h3 class="quiz-appointment-title">Your Appointment Details</h3>
					</div>

					<div class="quiz-appointment-details">
						${t.date?`
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 9h12v8H4V9z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Date: <span class="quiz-appointment-detail-value">${t.date}</span></span>
							</div>
						`:""}

						${t.time?`
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Time: <span class="quiz-appointment-detail-value">${t.time}</span></span>
							</div>
						`:""}

						${i.name?`
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Dietitian: <span class="quiz-appointment-detail-value">${i.name}</span></span>
							</div>
						`:""}

						${t.type?`
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Type: <span class="quiz-appointment-detail-value">${t.type}</span></span>
							</div>
						`:""}
					</div>
				</div>

				<div class="quiz-next-steps">
					<h4 class="quiz-next-steps-title">What happens next?</h4>
					<ul class="quiz-next-steps-list">
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">1</span>
							<span>You'll receive a confirmation email with your appointment details and preparation instructions</span>
						</li>
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">2</span>
							<span>Your dietitian will call you at the scheduled time for your consultation</span>
						</li>
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">3</span>
							<span>After your consultation, you'll receive a personalized nutrition plan</span>
						</li>
					</ul>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="add-to-calendar">
						Add to Calendar
					</button>
					<button class="quiz-button quiz-button--secondary" data-action="view-details">
						View Full Details
					</button>
				</div>
			</div>
		`}renderGenericSuccess(){return`
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">🎉 Success!</h2>
					<p class="quiz-scheduling-subtitle">Your request has been processed successfully</p>
				</div>

				<div class="quiz-appointment-card">
					<div class="quiz-appointment-header">
						<div class="quiz-appointment-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
							</svg>
						</div>
						<h3 class="quiz-appointment-title">Request Completed</h3>
					</div>
					<p class="quiz-appointment-detail-text">We've received your information and will be in touch soon with next steps.</p>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="continue">
						Continue
					</button>
				</div>
			</div>
		`}renderErrorResult(e,t){return`
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">⚠️ Scheduling Issue</h2>
					<p class="quiz-scheduling-subtitle">We encountered a problem with your appointment</p>
				</div>

				<div class="quiz-error-card">
					<div class="quiz-error-header">
						<div class="quiz-error-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
							</svg>
						</div>
						<h3 class="quiz-error-title">Unable to Complete Scheduling</h3>
					</div>

					<p class="quiz-error-message">
						${e||"There was an unexpected error while trying to schedule your appointment. Please try again or contact our support team for assistance."}
					</p>

					<div class="quiz-support-info">
						<h4 class="quiz-support-title">Need Help?</h4>
						<p class="quiz-support-text">
							Our support team is available to help you schedule your appointment manually.
							Contact us at support@curalife.com or call (555) 123-4567.
						</p>
					</div>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="retry">
						Try Again
					</button>
					<button class="quiz-button quiz-button--secondary" data-action="contact-support">
						Contact Support
					</button>
				</div>
			</div>
		`}getSchedulingData(){try{const e=this.getAttribute("scheduling-data");return e?JSON.parse(e):null}catch(e){return console.error("Error parsing scheduling data:",e),null}}handleAttributeChange(e,t,i){["result-type","scheduling-data","error-message"].includes(e)&&this.render()}}customElements.define("quiz-scheduling-result",M);class T extends u{static get observedAttributes(){return["question-data","selected-value","disabled"]}constructor(){super(),this.questionData=null,this.selectedValue=null,this.isDisabled=!1}initialize(){this.parseAttributes()}parseAttributes(){const e=this.getAttribute("question-data");if(e)try{this.questionData=JSON.parse(e)}catch(t){console.error("Quiz Multiple Choice: Invalid question-data JSON:",t),this.questionData=null}this.selectedValue=this.getAttribute("selected-value")||null,this.isDisabled=this.getBooleanAttribute("disabled",!1)}handleAttributeChange(e,t,i){switch(e){case"question-data":this.parseAttributes();break;case"selected-value":this.selectedValue=i,this.updateSelectedState();break;case"disabled":this.isDisabled=this.getBooleanAttribute("disabled",!1),this.updateDisabledState();break}}getTemplate(){if(!this.questionData||!this.questionData.options)return`
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;const e=this.questionData.options,t=this.questionData.id,i=e.map(r=>`
			<label for="${r.id}" class="quiz-option-card" data-option-id="${r.id}">
				<input
					type="radio"
					id="${r.id}"
					name="question-${t}"
					value="${r.id}"
					class="quiz-sr-only"
					${this.selectedValue===r.id?"checked":""}
					${this.isDisabled?"disabled":""}
				>
				<div class="quiz-option-button ${this.selectedValue===r.id?"selected":""}">
					<div class="quiz-option-text">
						<div class="quiz-option-text-content">${r.text}</div>
					</div>
					${this.selectedValue===r.id?this.getCheckmarkSVG():""}
				</div>
			</label>
		`).join("");return`
			<div class="quiz-grid-2" ${this.isDisabled?'aria-disabled="true"':""}>
				${i}
			</div>
		`}getCheckmarkSVG(){return`
			<svg class="quiz-checkmark" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`}async getStyles(){const e=super.getStyles(),t=await d.getQuizStyles();return`
			${e}
			${t}

			/* Component-specific styles */
			.quiz-grid-2 {
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: 1rem;
			}

			@media (max-width: 768px) {
				.quiz-grid-2 {
					grid-template-columns: 1fr;
				}
			}

			.quiz-option-card {
				cursor: pointer;
				display: block;
				transition: var(--quiz-transition);
			}

			.quiz-option-card:hover:not([aria-disabled="true"]) .quiz-option-button {
				transform: translateY(-2px);
				box-shadow: var(--quiz-shadow);
			}

			.quiz-option-button {
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				padding: 1rem;
				background: white;
				transition: var(--quiz-transition);
				position: relative;
				min-height: 60px;
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			.quiz-option-button.selected {
				border-color: var(--quiz-primary-color);
				background-color: #f0f9ff;
			}

			.quiz-option-text {
				flex: 1;
			}

			.quiz-option-text-content {
				font-weight: 500;
				color: #374151;
			}

			.quiz-checkmark {
				color: var(--quiz-primary-color);
				flex-shrink: 0;
				margin-left: 0.5rem;
			}

			.quiz-sr-only {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
			}

			/* Disabled state */
			:host([disabled]) .quiz-option-card {
				cursor: not-allowed;
				opacity: 0.6;
			}

			:host([disabled]) .quiz-option-button {
				background-color: #f9fafb;
				color: #9ca3af;
			}

			/* Error state */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Focus styles for accessibility */
			.quiz-option-card:focus-within .quiz-option-button {
				outline: 2px solid var(--quiz-primary-color);
				outline-offset: 2px;
			}
		`}setupEventListeners(){this.root.addEventListener("change",this.handleOptionChange.bind(this)),this.root.addEventListener("click",this.handleOptionClick.bind(this))}handleOptionChange(e){if(this.isDisabled)return;const t=e.target;if(t.type==="radio"){const i=t.value;this.selectedValue=i,this.updateSelectedState(),this.dispatchAnswerSelected(i)}}handleOptionClick(e){if(this.isDisabled)return;const t=e.target.closest(".quiz-option-card");if(t){const i=t.getAttribute("data-option-id"),r=t.querySelector("input[type='radio']");r&&!r.checked&&(r.checked=!0,this.selectedValue=i,this.updateSelectedState(),this.dispatchAnswerSelected(i))}}updateSelectedState(){this.root.querySelectorAll(".quiz-option-card").forEach(t=>{const i=t.getAttribute("data-option-id"),r=t.querySelector(".quiz-option-button"),s=t.querySelector("input[type='radio']");if(i===this.selectedValue)r.classList.add("selected"),s.checked=!0,r.querySelector(".quiz-checkmark")||r.querySelector(".quiz-option-text").insertAdjacentHTML("afterend",this.getCheckmarkSVG());else{r.classList.remove("selected"),s.checked=!1;const o=r.querySelector(".quiz-checkmark");o&&o.remove()}})}updateDisabledState(){this.root.querySelectorAll("input[type='radio']").forEach(i=>{i.disabled=this.isDisabled});const t=this.root.querySelector(".quiz-grid-2");t&&(this.isDisabled?t.setAttribute("aria-disabled","true"):t.removeAttribute("aria-disabled"))}dispatchAnswerSelected(e){const t=new CustomEvent("answer-selected",{detail:{questionId:this.questionData?.id,value:e,questionType:"multiple-choice"},bubbles:!0});this.dispatchEvent(t)}getSelectedValue(){return this.selectedValue}setSelectedValue(e){this.selectedValue=e,this.setAttribute("selected-value",e)}setDisabled(e){this.isDisabled=e,e?this.setAttribute("disabled",""):this.removeAttribute("disabled")}getQuestionData(){return this.questionData}setQuestionData(e){this.questionData=e,this.setAttribute("question-data",JSON.stringify(e))}}customElements.define("quiz-multiple-choice",T);class V extends u{static get observedAttributes(){return["question-data","selected-values","disabled","layout"]}constructor(){super(),this.questionData=null,this.selectedValues=[],this.isDisabled=!1,this.layout="cards"}initialize(){this.parseAttributes()}parseAttributes(){const e=this.getAttribute("question-data");if(e)try{this.questionData=JSON.parse(e)}catch(i){console.error("Quiz Checkbox Group: Invalid question-data JSON:",i),this.questionData=null}const t=this.getAttribute("selected-values");if(t)try{this.selectedValues=JSON.parse(t)}catch(i){console.error("Quiz Checkbox Group: Invalid selected-values JSON:",i),this.selectedValues=[]}else this.selectedValues=[];this.isDisabled=this.getBooleanAttribute("disabled",!1),this.layout=this.getAttribute("layout")||"cards",this.questionData?.id==="consent"&&(this.layout="simple")}handleAttributeChange(e,t,i){switch(e){case"question-data":this.parseAttributes();break;case"selected-values":this.parseSelectedValues(),this.updateSelectedState();break;case"disabled":this.isDisabled=this.getBooleanAttribute("disabled",!1),this.updateDisabledState();break;case"layout":this.layout=i||"cards";break}}parseSelectedValues(){const e=this.getAttribute("selected-values");if(e)try{this.selectedValues=JSON.parse(e)}catch(t){console.error("Quiz Checkbox Group: Invalid selected-values JSON:",t),this.selectedValues=[]}else this.selectedValues=[]}getTemplate(){return!this.questionData||!this.questionData.options?`
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`:this.layout==="simple"?this.getSimpleTemplate():this.getCardTemplate()}getCardTemplate(){const e=this.questionData.options,t=this.questionData.id,i=e.map(r=>`
			<label for="${r.id}" class="quiz-option-card" data-option-id="${r.id}">
				<input
					type="checkbox"
					id="${r.id}"
					name="question-${t}"
					value="${r.id}"
					class="quiz-sr-only"
					${this.selectedValues.includes(r.id)?"checked":""}
					${this.isDisabled?"disabled":""}
				>
				<div class="quiz-option-button ${this.selectedValues.includes(r.id)?"selected":""}">
					<div class="quiz-option-text">
						<div class="quiz-option-text-content">${r.text}</div>
					</div>
					${this.selectedValues.includes(r.id)?this.getCheckmarkSVG():""}
				</div>
			</label>
		`).join("");return`
			<div class="quiz-grid-2" ${this.isDisabled?'aria-disabled="true"':""}>
				${i}
			</div>
		`}getSimpleTemplate(){const e=this.questionData.options,t=this.questionData.id,i=e.map(r=>`
			<div class="quiz-checkbox-container">
				<input
					type="checkbox"
					id="${r.id}"
					name="question-${t}"
					value="${r.id}"
					class="quiz-checkbox-input"
					${this.selectedValues.includes(r.id)?"checked":""}
					${this.isDisabled?"disabled":""}
				>
				<label class="quiz-checkbox-label" for="${r.id}">${r.text}</label>
			</div>
		`).join("");return`
			<div class="quiz-space-y-3 quiz-spacing-container" ${this.isDisabled?'aria-disabled="true"':""}>
				${i}
			</div>
		`}getCheckmarkSVG(){return`
			<svg class="quiz-checkmark" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`}async getStyles(){const e=super.getStyles(),t=await d.getQuizStyles();return`
			${e}
			${t}

			/* Card layout styles */
			.quiz-grid-2 {
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: 1rem;
			}

			@media (max-width: 768px) {
				.quiz-grid-2 {
					grid-template-columns: 1fr;
				}
			}

			.quiz-option-card {
				cursor: pointer;
				display: block;
				transition: var(--quiz-transition);
			}

			.quiz-option-card:hover:not([aria-disabled="true"]) .quiz-option-button {
				transform: translateY(-2px);
				box-shadow: var(--quiz-shadow);
			}

			.quiz-option-button {
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				padding: 1rem;
				background: white;
				transition: var(--quiz-transition);
				position: relative;
				min-height: 60px;
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			.quiz-option-button.selected {
				border-color: var(--quiz-primary-color);
				background-color: #f0f9ff;
			}

			.quiz-option-text {
				flex: 1;
			}

			.quiz-option-text-content {
				font-weight: 500;
				color: #374151;
			}

			.quiz-checkmark {
				color: var(--quiz-primary-color);
				flex-shrink: 0;
				margin-left: 0.5rem;
			}

			/* Simple layout styles */
			.quiz-space-y-3 {
				display: flex;
				flex-direction: column;
				gap: 0.75rem;
			}

			.quiz-spacing-container {
				padding: 0.5rem 0;
			}

			.quiz-checkbox-container {
				display: flex;
				align-items: flex-start;
				gap: 0.75rem;
			}

			.quiz-checkbox-input {
				width: 1.25rem;
				height: 1.25rem;
				border: 2px solid #d1d5db;
				border-radius: 0.25rem;
				background: white;
				cursor: pointer;
				flex-shrink: 0;
				margin-top: 0.125rem;
			}

			.quiz-checkbox-input:checked {
				background-color: var(--quiz-primary-color);
				border-color: var(--quiz-primary-color);
			}

			.quiz-checkbox-input:focus {
				outline: 2px solid var(--quiz-primary-color);
				outline-offset: 2px;
			}

			.quiz-checkbox-label {
				cursor: pointer;
				color: #374151;
				line-height: 1.5;
				flex: 1;
			}

			/* Screen reader only */
			.quiz-sr-only {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
			}

			/* Disabled state */
			:host([disabled]) .quiz-option-card {
				cursor: not-allowed;
				opacity: 0.6;
			}

			:host([disabled]) .quiz-option-button {
				background-color: #f9fafb;
				color: #9ca3af;
			}

			:host([disabled]) .quiz-checkbox-input {
				cursor: not-allowed;
				opacity: 0.6;
			}

			:host([disabled]) .quiz-checkbox-label {
				cursor: not-allowed;
				color: #9ca3af;
			}

			/* Error state */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Focus styles for accessibility */
			.quiz-option-card:focus-within .quiz-option-button {
				outline: 2px solid var(--quiz-primary-color);
				outline-offset: 2px;
			}
		`}setupEventListeners(){this.root.addEventListener("change",this.handleOptionChange.bind(this)),this.root.addEventListener("click",this.handleOptionClick.bind(this))}handleOptionChange(e){if(this.isDisabled)return;const t=e.target;if(t.type==="checkbox"){const i=t.value;t.checked?this.selectedValues.includes(i)||this.selectedValues.push(i):this.selectedValues=this.selectedValues.filter(r=>r!==i),this.updateSelectedState(),this.dispatchAnswerSelected(this.selectedValues)}}handleOptionClick(e){if(!this.isDisabled&&this.layout==="cards"){const t=e.target.closest(".quiz-option-card");if(t){const i=t.getAttribute("data-option-id"),r=t.querySelector("input[type='checkbox']");r&&(r.checked=!r.checked,r.checked?this.selectedValues.includes(i)||this.selectedValues.push(i):this.selectedValues=this.selectedValues.filter(s=>s!==i),this.updateSelectedState(),this.dispatchAnswerSelected(this.selectedValues))}}}updateSelectedState(){this.layout==="cards"?this.updateCardSelectedState():this.updateSimpleSelectedState()}updateCardSelectedState(){this.root.querySelectorAll(".quiz-option-card").forEach(t=>{const i=t.getAttribute("data-option-id"),r=t.querySelector(".quiz-option-button"),s=t.querySelector("input[type='checkbox']");if(this.selectedValues.includes(i))r.classList.add("selected"),s.checked=!0,r.querySelector(".quiz-checkmark")||r.querySelector(".quiz-option-text").insertAdjacentHTML("afterend",this.getCheckmarkSVG());else{r.classList.remove("selected"),s.checked=!1;const o=r.querySelector(".quiz-checkmark");o&&o.remove()}})}updateSimpleSelectedState(){this.root.querySelectorAll("input[type='checkbox']").forEach(t=>{const i=t.value;t.checked=this.selectedValues.includes(i)})}updateDisabledState(){this.root.querySelectorAll("input[type='checkbox']").forEach(i=>{i.disabled=this.isDisabled});const t=this.root.querySelector(".quiz-grid-2, .quiz-space-y-3");t&&(this.isDisabled?t.setAttribute("aria-disabled","true"):t.removeAttribute("aria-disabled"))}dispatchAnswerSelected(e){const t=new CustomEvent("answer-selected",{detail:{questionId:this.questionData?.id,value:e,questionType:"checkbox"},bubbles:!0});this.dispatchEvent(t)}getSelectedValues(){return[...this.selectedValues]}setSelectedValues(e){this.selectedValues=Array.isArray(e)?[...e]:[],this.setAttribute("selected-values",JSON.stringify(this.selectedValues))}setDisabled(e){this.isDisabled=e,e?this.setAttribute("disabled",""):this.removeAttribute("disabled")}getQuestionData(){return this.questionData}setQuestionData(e){this.questionData=e,this.setAttribute("question-data",JSON.stringify(e))}setLayout(e){this.layout=e,this.setAttribute("layout",e)}}customElements.define("quiz-checkbox-group",V);class I extends u{static get observedAttributes(){return["question-data","selected-value","disabled","show-error","error-message"]}constructor(){super(),this.questionData=null,this.selectedValue=null,this.isDisabled=!1,this.showError=!1,this.errorMessage=""}initialize(){this.parseAttributes()}parseAttributes(){const e=this.getAttribute("question-data");if(e)try{this.questionData=JSON.parse(e)}catch(t){console.error("Quiz Dropdown: Invalid question-data JSON:",t),this.questionData=null}this.selectedValue=this.getAttribute("selected-value")||null,this.isDisabled=this.getBooleanAttribute("disabled",!1),this.showError=this.getBooleanAttribute("show-error",!1),this.errorMessage=this.getAttribute("error-message")||""}handleAttributeChange(e,t,i){switch(e){case"question-data":this.parseAttributes();break;case"selected-value":this.selectedValue=i,this.updateSelectedState();break;case"disabled":this.isDisabled=this.getBooleanAttribute("disabled",!1),this.updateDisabledState();break;case"show-error":this.showError=this.getBooleanAttribute("show-error",!1),this.updateErrorState();break;case"error-message":this.errorMessage=i||"",this.updateErrorMessage();break}}getTemplate(){if(!this.questionData)return`
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;const e=this.questionData.options||[],t=this.questionData.id,i=this.questionData.placeholder||"Select an option",r=e.map(s=>`
			<option value="${s.id}" ${this.selectedValue===s.id?"selected":""}>
				${s.text}
			</option>
		`).join("");return`
			<div class="quiz-dropdown-container">
				<select
					id="question-${t}"
					class="quiz-select ${this.showError?"quiz-select-error":""}"
					${this.isDisabled?"disabled":""}
					aria-describedby="error-${t}"
				>
					<option value="">${i}</option>
					${r}
				</select>
				<div class="quiz-error-element ${this.showError?"quiz-error-visible":"quiz-error-hidden"}"
					 id="error-${t}"
					 role="alert"
					 aria-live="polite">
					${this.errorMessage}
				</div>
			</div>
		`}async getStyles(){const e=super.getStyles(),t=await d.getQuizStyles();return`
			${e}
			${t}

			/* Component-specific styles */
			.quiz-dropdown-container {
				position: relative;
			}

			.quiz-select {
				width: 100%;
				padding: 0.75rem 1rem;
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				background: white;
				font-size: 1rem;
				color: #374151;
				transition: var(--quiz-transition);
				appearance: none;
				background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
				background-position: right 0.5rem center;
				background-repeat: no-repeat;
				background-size: 1.5em 1.5em;
				padding-right: 2.5rem;
			}

			.quiz-select:focus {
				outline: none;
				border-color: var(--quiz-primary-color);
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			.quiz-select:hover:not(:disabled) {
				border-color: #cbd5e1;
			}

			/* Placeholder styling */
			.quiz-select option[value=""] {
				color: #9ca3af;
			}

			/* Error state */
			.quiz-select-error {
				border-color: var(--quiz-error-color);
				background-color: #fef2f2;
			}

			.quiz-select-error:focus {
				border-color: var(--quiz-error-color);
				box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
			}

			/* Error message */
			.quiz-error-element {
				margin-top: 0.5rem;
				font-size: 0.875rem;
				color: var(--quiz-error-color);
				transition: var(--quiz-transition);
			}

			.quiz-error-hidden {
				opacity: 0;
				height: 0;
				overflow: hidden;
			}

			.quiz-error-visible {
				opacity: 1;
				height: auto;
			}

			/* Disabled state */
			.quiz-select:disabled {
				background-color: #f9fafb;
				color: #9ca3af;
				cursor: not-allowed;
				opacity: 0.6;
			}

			/* Error container for invalid configuration */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Mobile responsiveness */
			@media (max-width: 768px) {
				.quiz-select {
					font-size: 16px; /* Prevents zoom on iOS */
				}
			}
		`}setupEventListeners(){this.root.addEventListener("change",this.handleSelectionChange.bind(this))}handleSelectionChange(e){if(this.isDisabled)return;const t=e.target;if(t.classList.contains("quiz-select")){const i=t.value;this.selectedValue=i,this.dispatchAnswerSelected(i),this.showError&&i&&this.clearError()}}updateSelectedState(){const e=this.root.querySelector(".quiz-select");e&&(e.value=this.selectedValue||"")}updateDisabledState(){const e=this.root.querySelector(".quiz-select");e&&(e.disabled=this.isDisabled)}updateErrorState(){const e=this.root.querySelector(".quiz-select"),t=this.root.querySelector(".quiz-error-element");e&&(this.showError?e.classList.add("quiz-select-error"):e.classList.remove("quiz-select-error")),t&&(this.showError?(t.classList.remove("quiz-error-hidden"),t.classList.add("quiz-error-visible")):(t.classList.remove("quiz-error-visible"),t.classList.add("quiz-error-hidden")))}updateErrorMessage(){const e=this.root.querySelector(".quiz-error-element");e&&(e.textContent=this.errorMessage)}dispatchAnswerSelected(e){const t=new CustomEvent("answer-selected",{detail:{questionId:this.questionData?.id,value:e,questionType:"dropdown"},bubbles:!0});this.dispatchEvent(t)}getSelectedValue(){return this.selectedValue}setSelectedValue(e){this.selectedValue=e,this.setAttribute("selected-value",e||"")}setDisabled(e){this.isDisabled=e,e?this.setAttribute("disabled",""):this.removeAttribute("disabled")}showValidationError(e){this.errorMessage=e,this.showError=!0,this.setAttribute("error-message",e),this.setAttribute("show-error","")}clearError(){this.showError=!1,this.errorMessage="",this.removeAttribute("show-error"),this.removeAttribute("error-message")}getQuestionData(){return this.questionData}setQuestionData(e){this.questionData=e,this.setAttribute("question-data",JSON.stringify(e))}isValid(){return this.selectedValue&&this.selectedValue.trim()!==""}focus(){const e=this.root.querySelector(".quiz-select");e&&e.focus()}}customElements.define("quiz-dropdown",I);class P extends u{static get observedAttributes(){return["question-data","value","disabled","show-error","error-message","input-type"]}constructor(){super(),this.questionData=null,this.inputValue="",this.isDisabled=!1,this.showError=!1,this.errorMessage="",this.inputType="text"}initialize(){this.parseAttributes()}parseAttributes(){const e=this.getAttribute("question-data");if(e)try{this.questionData=JSON.parse(e)}catch(t){console.error("Quiz Text Input: Invalid question-data JSON:",t),this.questionData=null}this.inputValue=this.getAttribute("value")||"",this.isDisabled=this.getBooleanAttribute("disabled",!1),this.showError=this.getBooleanAttribute("show-error",!1),this.errorMessage=this.getAttribute("error-message")||"",this.inputType=this.getAttribute("input-type")||"text"}handleAttributeChange(e,t,i){switch(e){case"question-data":this.parseAttributes();break;case"value":this.inputValue=i||"",this.updateInputValue();break;case"disabled":this.isDisabled=this.getBooleanAttribute("disabled",!1),this.updateDisabledState();break;case"show-error":this.showError=this.getBooleanAttribute("show-error",!1),this.updateErrorState();break;case"error-message":this.errorMessage=i||"",this.updateErrorMessage();break;case"input-type":this.inputType=i||"text",this.updateInputType();break}}getTemplate(){if(!this.questionData)return`
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;const e=this.questionData.id,t=this.questionData.placeholder||"Type your answer here...";return`
			<div class="quiz-text-input-container">
				<input
					type="${this.inputType}"
					id="question-${e}"
					class="quiz-input ${this.showError?"quiz-input-error":""}"
					placeholder="${t}"
					value="${this.inputValue}"
					${this.isDisabled?"disabled":""}
					aria-describedby="error-${e}"
				>
				<div class="quiz-error-element ${this.showError?"quiz-error-visible":"quiz-error-hidden"}"
					 id="error-${e}"
					 role="alert"
					 aria-live="polite">
					${this.errorMessage}
				</div>
			</div>
		`}async getStyles(){const e=super.getStyles(),t=await d.getQuizStyles();return`
			${e}
			${t}

			/* Component-specific styles */
			.quiz-text-input-container {
				position: relative;
			}

			.quiz-input {
				width: 100%;
				padding: 0.75rem 1rem;
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				background: white;
				font-size: 1rem;
				color: #374151;
				transition: var(--quiz-transition);
				box-sizing: border-box;
			}

			.quiz-input:focus {
				outline: none;
				border-color: var(--quiz-primary-color);
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			.quiz-input:hover:not(:disabled) {
				border-color: #cbd5e1;
			}

			.quiz-input::placeholder {
				color: #9ca3af;
			}

			/* Error state */
			.quiz-input-error {
				border-color: var(--quiz-error-color);
				background-color: #fef2f2;
			}

			.quiz-input-error:focus {
				border-color: var(--quiz-error-color);
				box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
			}

			/* Error message */
			.quiz-error-element {
				margin-top: 0.5rem;
				font-size: 0.875rem;
				color: var(--quiz-error-color);
				transition: var(--quiz-transition);
			}

			.quiz-error-hidden {
				opacity: 0;
				height: 0;
				overflow: hidden;
			}

			.quiz-error-visible {
				opacity: 1;
				height: auto;
			}

			/* Disabled state */
			.quiz-input:disabled {
				background-color: #f9fafb;
				color: #9ca3af;
				cursor: not-allowed;
				opacity: 0.6;
			}

			/* Error container for invalid configuration */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Valid state (optional) */
			.quiz-input-valid {
				border-color: var(--quiz-success-color);
				background-color: #f0fdf4;
			}

			.quiz-input-valid:focus {
				border-color: var(--quiz-success-color);
				box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
			}

			/* Mobile responsiveness */
			@media (max-width: 768px) {
				.quiz-input {
					font-size: 16px; /* Prevents zoom on iOS */
				}
			}
		`}setupEventListeners(){this.root.addEventListener("input",this.handleInputChange.bind(this)),this.root.addEventListener("blur",this.handleInputBlur.bind(this)),this.root.addEventListener("focus",this.handleInputFocus.bind(this))}handleInputChange(e){if(this.isDisabled)return;const t=e.target;if(t.classList.contains("quiz-input")){const i=t.value;this.inputValue=i,this.dispatchAnswerChanged(i),this.showError&&i.trim()&&this.clearError()}}handleInputBlur(e){if(this.isDisabled)return;e.target.classList.contains("quiz-input")&&this.dispatchAnswerSelected(this.inputValue)}handleInputFocus(e){this.showError&&this.clearError()}updateInputValue(){const e=this.root.querySelector(".quiz-input");e&&(e.value=this.inputValue)}updateDisabledState(){const e=this.root.querySelector(".quiz-input");e&&(e.disabled=this.isDisabled)}updateErrorState(){const e=this.root.querySelector(".quiz-input"),t=this.root.querySelector(".quiz-error-element");e&&(this.showError?(e.classList.add("quiz-input-error"),e.classList.remove("quiz-input-valid")):e.classList.remove("quiz-input-error")),t&&(this.showError?(t.classList.remove("quiz-error-hidden"),t.classList.add("quiz-error-visible")):(t.classList.remove("quiz-error-visible"),t.classList.add("quiz-error-hidden")))}updateErrorMessage(){const e=this.root.querySelector(".quiz-error-element");e&&(e.textContent=this.errorMessage)}updateInputType(){const e=this.root.querySelector(".quiz-input");e&&(e.type=this.inputType)}dispatchAnswerChanged(e){const t=new CustomEvent("answer-changed",{detail:{questionId:this.questionData?.id,value:e,questionType:"text"},bubbles:!0});this.dispatchEvent(t)}dispatchAnswerSelected(e){const t=new CustomEvent("answer-selected",{detail:{questionId:this.questionData?.id,value:e,questionType:"text"},bubbles:!0});this.dispatchEvent(t)}getValue(){return this.inputValue}setValue(e){this.inputValue=e||"",this.setAttribute("value",this.inputValue)}setDisabled(e){this.isDisabled=e,e?this.setAttribute("disabled",""):this.removeAttribute("disabled")}showValidationError(e){this.errorMessage=e,this.showError=!0,this.setAttribute("error-message",e),this.setAttribute("show-error","")}clearError(){this.showError=!1,this.errorMessage="",this.removeAttribute("show-error"),this.removeAttribute("error-message")}showValidState(){const e=this.root.querySelector(".quiz-input");e&&(e.classList.add("quiz-input-valid"),e.classList.remove("quiz-input-error"))}clearValidState(){const e=this.root.querySelector(".quiz-input");e&&e.classList.remove("quiz-input-valid")}getQuestionData(){return this.questionData}setQuestionData(e){this.questionData=e,this.setAttribute("question-data",JSON.stringify(e))}setInputType(e){this.inputType=e,this.setAttribute("input-type",e)}isValid(){return this.inputValue&&this.inputValue.trim()!==""}isEmpty(){return!this.inputValue||this.inputValue.trim()===""}focus(){const e=this.root.querySelector(".quiz-input");e&&e.focus()}select(){const e=this.root.querySelector(".quiz-input");e&&e.select()}}customElements.define("quiz-text-input",P);class _ extends u{static get observedAttributes(){return["question-data","value","disabled","min-value","max-value","step"]}constructor(){super(),this.questionData=null,this.ratingValue=5,this.isDisabled=!1,this.minValue=1,this.maxValue=10,this.step=1}initialize(){this.parseAttributes()}parseAttributes(){const e=this.getAttribute("question-data");if(e)try{this.questionData=JSON.parse(e)}catch(t){console.error("Quiz Rating: Invalid question-data JSON:",t),this.questionData=null}this.ratingValue=this.getNumberAttribute("value",5),this.isDisabled=this.getBooleanAttribute("disabled",!1),this.minValue=this.getNumberAttribute("min-value",1),this.maxValue=this.getNumberAttribute("max-value",10),this.step=this.getNumberAttribute("step",1),this.ratingValue=Math.max(this.minValue,Math.min(this.maxValue,this.ratingValue))}handleAttributeChange(e,t,i){switch(e){case"question-data":this.parseAttributes();break;case"value":this.ratingValue=this.getNumberAttribute("value",5),this.ratingValue=Math.max(this.minValue,Math.min(this.maxValue,this.ratingValue)),this.updateRatingValue();break;case"disabled":this.isDisabled=this.getBooleanAttribute("disabled",!1),this.updateDisabledState();break;case"min-value":case"max-value":case"step":this.parseAttributes();break}}getTemplate(){return this.questionData?`
			<div class="quiz-rating-container">
				<div class="quiz-rating-input-wrapper">
					<input
						type="range"
						id="question-${this.questionData.id}"
						class="quiz-range"
						min="${this.minValue}"
						max="${this.maxValue}"
						step="${this.step}"
						value="${this.ratingValue}"
						${this.isDisabled?"disabled":""}
					>
					<div class="quiz-rating-value" aria-live="polite">
						<span class="quiz-rating-current">${this.ratingValue}</span>
					</div>
				</div>
				<div class="quiz-range-labels">
					<span class="quiz-range-label-min">${this.minValue}</span>
					<span class="quiz-range-label-mid">${Math.floor((this.minValue+this.maxValue)/2)}</span>
					<span class="quiz-range-label-max">${this.maxValue}</span>
				</div>
			</div>
		`:`
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`}async getStyles(){const e=super.getStyles(),t=await d.getQuizStyles();return`
			${e}
			${t}

			/* Component-specific styles */
			.quiz-rating-container {
				padding: 1rem 0;
			}

			.quiz-rating-input-wrapper {
				position: relative;
				margin-bottom: 1rem;
			}

			.quiz-range {
				width: 100%;
				height: 8px;
				border-radius: 4px;
				background: #e2e8f0;
				outline: none;
				appearance: none;
				cursor: pointer;
				transition: var(--quiz-transition);
			}

			.quiz-range:focus {
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			/* Webkit browsers (Chrome, Safari) */
			.quiz-range::-webkit-slider-thumb {
				appearance: none;
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: var(--quiz-primary-color);
				cursor: pointer;
				border: 2px solid white;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				transition: var(--quiz-transition);
			}

			.quiz-range::-webkit-slider-thumb:hover {
				transform: scale(1.1);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			}

			.quiz-range::-webkit-slider-thumb:active {
				transform: scale(1.2);
			}

			/* Firefox */
			.quiz-range::-moz-range-thumb {
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: var(--quiz-primary-color);
				cursor: pointer;
				border: 2px solid white;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				transition: var(--quiz-transition);
			}

			.quiz-range::-moz-range-thumb:hover {
				transform: scale(1.1);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			}

			.quiz-range::-moz-range-track {
				height: 8px;
				border-radius: 4px;
				background: #e2e8f0;
				border: none;
			}

			/* Rating value display */
			.quiz-rating-value {
				position: absolute;
				top: -2.5rem;
				left: 50%;
				transform: translateX(-50%);
				background: var(--quiz-primary-color);
				color: white;
				padding: 0.5rem 0.75rem;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				font-size: 1.125rem;
				box-shadow: var(--quiz-shadow);
				pointer-events: none;
			}

			.quiz-rating-value::after {
				content: '';
				position: absolute;
				top: 100%;
				left: 50%;
				transform: translateX(-50%);
				border: 6px solid transparent;
				border-top-color: var(--quiz-primary-color);
			}

			.quiz-rating-current {
				display: block;
				min-width: 1.5rem;
				text-align: center;
			}

			/* Range labels */
			.quiz-range-labels {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: 0.5rem;
				font-size: 0.875rem;
				color: #6b7280;
			}

			.quiz-range-label-min,
			.quiz-range-label-max {
				font-weight: 500;
			}

			.quiz-range-label-mid {
				color: #9ca3af;
			}

			/* Disabled state */
			.quiz-range:disabled {
				cursor: not-allowed;
				opacity: 0.6;
			}

			.quiz-range:disabled::-webkit-slider-thumb {
				cursor: not-allowed;
				background: #9ca3af;
			}

			.quiz-range:disabled::-moz-range-thumb {
				cursor: not-allowed;
				background: #9ca3af;
			}

			:host([disabled]) .quiz-rating-value {
				background: #9ca3af;
			}

			:host([disabled]) .quiz-rating-value::after {
				border-top-color: #9ca3af;
			}

			/* Error container for invalid configuration */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Mobile responsiveness */
			@media (max-width: 768px) {
				.quiz-rating-value {
					font-size: 1rem;
					padding: 0.375rem 0.625rem;
				}

				.quiz-range::-webkit-slider-thumb {
					width: 20px;
					height: 20px;
				}

				.quiz-range::-moz-range-thumb {
					width: 20px;
					height: 20px;
				}
			}

			/* Animation for value changes */
			.quiz-rating-value {
				transition: all 0.2s ease;
			}

			.quiz-rating-value.updating {
				transform: translateX(-50%) scale(1.1);
			}
		`}setupEventListeners(){this.root.addEventListener("input",this.handleRatingChange.bind(this)),this.root.addEventListener("change",this.handleRatingSet.bind(this))}handleRatingChange(e){if(this.isDisabled)return;const t=e.target;if(t.classList.contains("quiz-range")){const i=parseInt(t.value,10);this.ratingValue=i,this.updateRatingDisplay(),this.dispatchAnswerChanged(i)}}handleRatingSet(e){if(this.isDisabled)return;const t=e.target;if(t.classList.contains("quiz-range")){const i=parseInt(t.value,10);this.ratingValue=i,this.dispatchAnswerSelected(i)}}updateRatingValue(){const e=this.root.querySelector(".quiz-range");e&&(e.value=this.ratingValue),this.updateRatingDisplay()}updateRatingDisplay(){const e=this.root.querySelector(".quiz-rating-current");if(e){e.textContent=this.ratingValue;const t=this.root.querySelector(".quiz-rating-value");t&&(t.classList.add("updating"),setTimeout(()=>{t.classList.remove("updating")},200))}}updateDisabledState(){const e=this.root.querySelector(".quiz-range");e&&(e.disabled=this.isDisabled)}dispatchAnswerChanged(e){const t=new CustomEvent("answer-changed",{detail:{questionId:this.questionData?.id,value:e,questionType:"rating"},bubbles:!0});this.dispatchEvent(t)}dispatchAnswerSelected(e){const t=new CustomEvent("answer-selected",{detail:{questionId:this.questionData?.id,value:e,questionType:"rating"},bubbles:!0});this.dispatchEvent(t)}getValue(){return this.ratingValue}setValue(e){const t=parseInt(e,10);isNaN(t)||(this.ratingValue=Math.max(this.minValue,Math.min(this.maxValue,t)),this.setAttribute("value",this.ratingValue.toString()))}setDisabled(e){this.isDisabled=e,e?this.setAttribute("disabled",""):this.removeAttribute("disabled")}getQuestionData(){return this.questionData}setQuestionData(e){this.questionData=e,this.setAttribute("question-data",JSON.stringify(e))}setRange(e,t,i=1){this.minValue=e,this.maxValue=t,this.step=i,this.setAttribute("min-value",e.toString()),this.setAttribute("max-value",t.toString()),this.setAttribute("step",i.toString()),this.ratingValue=Math.max(this.minValue,Math.min(this.maxValue,this.ratingValue)),this.setAttribute("value",this.ratingValue.toString())}focus(){const e=this.root.querySelector(".quiz-range");e&&e.focus()}}customElements.define("quiz-rating",_);class X{constructor(){this.initialized=!1,this.config=null}async init(e={}){if(this.initialized){console.warn("Quiz components already initialized");return}this.config={cssUrl:e.cssUrl||window.QUIZ_CSS_URL||window.QUIZ_CONFIG?.cssUrl,debug:e.debug||window.QUIZ_CONFIG?.debug||!1,fallbackCssUrl:e.fallbackCssUrl||"/assets/quiz.css",...e},this.config.cssUrl&&d.setQuizCssUrl(this.config.cssUrl),this.config.debug&&(console.log("🎯 Quiz Web Components Initialization:",this.config),await this.validateConfiguration()),this.initialized=!0}async validateConfiguration(){const e=this.config.cssUrl||this.config.fallbackCssUrl;console.log("🔍 Validating quiz components configuration..."),console.log("📍 CSS URL:",e);try{const i=await d.getQuizStyles(e);i&&i.length>0?console.log("✅ Quiz CSS loaded successfully:",`${i.length} characters`):console.warn("⚠️ Quiz CSS loaded but appears empty")}catch(i){console.error("❌ Failed to load quiz CSS:",i),console.log("🔄 Will attempt fallback loading when components render")}[{name:"QUIZ_CSS_URL",value:window.QUIZ_CSS_URL},{name:"QUIZ_CONFIG",value:window.QUIZ_CONFIG}].forEach(i=>{i.value?console.log(`✅ ${i.name}:`,i.value):console.warn(`⚠️ ${i.name} not found`)})}getConfig(){return this.config}isInitialized(){return this.initialized}areComponentsAvailable(){return["quiz-multiple-choice","quiz-checkbox-group","quiz-dropdown","quiz-text-input","quiz-rating"].every(t=>customElements.get(t)!==void 0)}setCssUrl(e){this.config&&(this.config.cssUrl=e),d.setQuizCssUrl(e),this.config?.debug&&console.log("🎨 CSS URL updated to:",e)}}const S=new X;typeof window<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{(window.QUIZ_CONFIG||window.QUIZ_CSS_URL)&&S.init()}):(window.QUIZ_CONFIG||window.QUIZ_CSS_URL)&&S.init());const C={"quiz-calendar-icon":{module:f,category:"icons",description:"Calendar icon for date-related benefits"},"quiz-clock-icon":{module:m,category:"icons",description:"Clock icon for time-related benefits"},"quiz-checkmark-icon":{module:q,category:"icons",description:"Checkmark icon for success states"},"quiz-coverage-card":{module:v,category:"content",description:"Insurance coverage information card"},"quiz-benefit-item":{module:z,category:"content",description:"Individual benefit item with icon and text"},"quiz-action-section":{module:y,category:"content",description:"Call-to-action section with buttons and info"},"quiz-error-display":{module:x,category:"content",description:"Error display with different severity levels"},"quiz-loading-display":{module:w,category:"content",description:"Loading display with progress and step indicators"},"quiz-faq-section":{module:$,category:"content",description:"FAQ section with collapsible questions"},"quiz-payer-search":{module:A,category:"content",description:"Insurance payer search with autocomplete"},"quiz-result-card":{module:E,category:"content",description:"Result card for quiz outcomes"},"quiz-form-step":{module:D,category:"content",description:"Complete form step with questions and validation"},"quiz-step-container":{module:L,category:"content",description:"Container for quiz steps with navigation"},"quiz-scheduling-result":{module:M,category:"content",description:"Scheduling result display with success/error states"},"quiz-multiple-choice":{module:T,category:"questions",description:"Multiple choice question with card-style options"},"quiz-checkbox-group":{module:V,category:"questions",description:"Checkbox group with multiple selection support"},"quiz-dropdown":{module:I,category:"questions",description:"Dropdown selection with validation"},"quiz-text-input":{module:P,category:"questions",description:"Text input with validation and error display"},"quiz-rating":{module:_,category:"questions",description:"Rating input with range slider (1-10 scale)"}};function K(){const l=performance.now();let e=0;console.log("🚀 Loading Quiz Web Components..."),Object.entries(C).forEach(([i,r])=>{if(c.isRegistered(i))console.log(`  ~ ${i} already registered`);else try{e++,console.log(`  ✓ ${i} (${r.category})`)}catch(s){console.error(`  ✗ Failed to load ${i}:`,s)}});const t=performance.now();return console.log(`🎉 Quiz Components loaded: ${e} components in ${(t-l).toFixed(2)}ms`),{loaded:e,total:Object.keys(C).length,loadTime:t-l}}K();
