const MAX_ANGLE = 32;

export class PendulumView {
  constructor(mountEl) {
    this.mountEl = mountEl;
    this.armGroup = null;
    this.weightEl = null;
    this.tipEl = null;
    this.currentAngle = 0;
    this.rafId = null;
    this.getAudioTime = () => 0;
    this.getBeatInterval = () => 0.75;
    this.getIsPlaying = () => false;
    this.getStartEpoch = () => 0;
    this.pivotX = 110;
    this.pivotY = 58;
    this._build();
  }

  _build() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 220 280');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <defs>
        <linearGradient id="wood-case" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="var(--pend-wood-light)"/>
          <stop offset="50%" stop-color="var(--pend-wood-mid)"/>
          <stop offset="100%" stop-color="var(--pend-wood-dark)"/>
        </linearGradient>
        <linearGradient id="wood-base" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="var(--pend-wood-mid)"/>
          <stop offset="100%" stop-color="var(--pend-wood-dark)"/>
        </linearGradient>
        <linearGradient id="brass" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stop-color="var(--pend-brass-light)"/>
          <stop offset="55%" stop-color="var(--pend-brass)"/>
          <stop offset="100%" stop-color="var(--pend-brass-dark)"/>
        </linearGradient>
        <filter id="soft-shadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.15"/>
        </filter>
      </defs>

      <g filter="url(#soft-shadow)">
        <rect x="28" y="232" width="164" height="22" rx="11" fill="url(#wood-base)"/>
        <path
          d="M 52 232
             Q 52 200 68 140
             Q 82 88 110 48
             Q 138 88 152 140
             Q 168 200 168 232
             Z"
          fill="url(#wood-case)"
          stroke="var(--pend-wood-dark)"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <path
          d="M 72 228 Q 110 100 148 228"
          fill="none"
          stroke="var(--pend-wood-dark)"
          stroke-width="0.8"
          opacity="0.25"
          stroke-linecap="round"
        />
      </g>

      <g class="scale-marks" opacity="0.4">
        <text x="76" y="118" font-size="8" fill="var(--pend-scale)" text-anchor="end">60</text>
        <text x="76" y="152" font-size="8" fill="var(--pend-scale)" text-anchor="end">80</text>
        <text x="76" y="186" font-size="8" fill="var(--pend-scale)" text-anchor="end">100</text>
        <text x="144" y="118" font-size="8" fill="var(--pend-scale)" text-anchor="start">120</text>
        <text x="144" y="152" font-size="8" fill="var(--pend-scale)" text-anchor="start">140</text>
      </g>

      <ellipse cx="110" cy="58" rx="10" ry="8" fill="url(#brass)" stroke="var(--pend-brass-dark)" stroke-width="1"/>

      <g id="pendulum-arm-group" transform="rotate(0 110 58)">
        <line x1="110" y1="58" x2="110" y2="208" stroke="var(--pend-arm)" stroke-width="4" stroke-linecap="round"/>
        <ellipse class="pendulum-weight" cx="110" cy="208" rx="18" ry="22" fill="url(#brass)" stroke="var(--pend-brass-dark)" stroke-width="1"/>
        <circle class="pendulum-tip" cx="110" cy="58" r="5" fill="var(--pend-brass-light)"/>
      </g>
    `;

    this.mountEl.appendChild(svg);
    this.armGroup = svg.querySelector('#pendulum-arm-group');
    this.weightEl = svg.querySelector('.pendulum-weight');
    this.tipEl = svg.querySelector('.pendulum-tip');
  }

  bind({ getAudioTime, getBeatInterval, getIsPlaying, getStartEpoch }) {
    this.getAudioTime = getAudioTime;
    this.getBeatInterval = getBeatInterval;
    this.getIsPlaying = getIsPlaying;
    this.getStartEpoch = getStartEpoch;
  }

  flashAccent() {
    this.weightEl?.classList.add('accent-flash');
    this.tipEl?.classList.add('accent-flash');
    setTimeout(() => {
      this.weightEl?.classList.remove('accent-flash');
      this.tipEl?.classList.remove('accent-flash');
    }, 120);
  }

  startLoop() {
    if (this.rafId) return;
    const tick = () => {
      this._update();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this._animateToZero();
  }

  _animateToZero() {
    const step = () => {
      this.currentAngle *= 0.88;
      if (Math.abs(this.currentAngle) < 0.2) {
        this.currentAngle = 0;
        this._applyAngle(0);
        return;
      }
      this._applyAngle(this.currentAngle);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _update() {
    if (!this.getIsPlaying()) return;
    const t = this.getAudioTime();
    const interval = this.getBeatInterval();
    const phase = ((t - this.getStartEpoch()) % interval) / interval;
    const angle = MAX_ANGLE * Math.cos(phase * 2 * Math.PI);
    this.currentAngle = angle;
    this._applyAngle(angle);
  }

  _applyAngle(angle) {
    this.armGroup?.setAttribute(
      'transform',
      `rotate(${angle} ${this.pivotX} ${this.pivotY})`
    );
  }
}
