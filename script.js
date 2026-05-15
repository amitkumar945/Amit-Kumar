'use strict';

/* ---- Global radar instance ---- */
let radarChartInstance = null;
let pendingTechTags     = [];

/* ================================================================
   INIT
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNav();
  setupMobileMenu();
  initParticles();
  setupTyping();
  setupScrollAnimations();
  setupProgressObserver();
  setupStatsCounters();
  setupProjectFilter();
  loadStoredProjects();
  setupContactForm();
  setupBackToTop();
  setupPhotoUpload();
  buildSkillIconGrid();
  hideLoader();
});

/* ================================================================
   THEME
================================================================ */
function initTheme() {
  const btn = document.getElementById('themeBtn');
  const html = document.documentElement;
  const saved = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    if (radarChartInstance) rebuildRadar();
  });
}
function updateThemeIcon(t) {
  document.getElementById('themeBtn').innerHTML =
    t === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

/* ================================================================
   NAV
================================================================ */
function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) {
        document.querySelector('.hamburger').classList.remove('active');
        document.getElementById('navMenu').classList.remove('active');
        const offset = document.querySelector('.navbar').clientHeight;
        window.scrollTo({ top: sec.getBoundingClientRect().top + pageYOffset - offset, behavior:'smooth' });
        highlightNav(id);
      }
    });
  });
  window.addEventListener('scroll', debounce(navOnScroll, 80));
}
function highlightNav(id) {
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.getAttribute('href').slice(1) === id));
}
function navOnScroll() {
  let cur = '';
  document.querySelectorAll('section[id]').forEach(s => {
    if (pageYOffset >= s.offsetTop - 220) cur = s.id;
  });
  if (cur) highlightNav(cur);
}

/* ================================================================
   MOBILE MENU
================================================================ */
function setupMobileMenu() {
  const ham = document.getElementById('hamburger');
  const menu = document.getElementById('navMenu');
  ham.addEventListener('click', e => { e.stopPropagation(); ham.classList.toggle('active'); menu.classList.toggle('active'); });
  document.body.addEventListener('click', e => {
    if (!e.target.closest('.navbar')) { ham.classList.remove('active'); menu.classList.remove('active'); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { ham.classList.remove('active'); menu.classList.remove('active'); }
  });
}

/* ================================================================
   PROFILE PHOTO UPLOAD
================================================================ */
function setupPhotoUpload() {
  const saved = localStorage.getItem('profilePhoto');
  if (saved) document.getElementById('profilePhoto').src = saved;

  document.getElementById('photoInput').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target.result;
      document.getElementById('profilePhoto').src = data;
      try { localStorage.setItem('profilePhoto', data); } catch(err) {
        showToast('warning', 'Storage Full', 'Photo saved for this session only.');
      }
    };
    reader.readAsDataURL(file);
  });
}

/* ================================================================
   SKILL ICON GRID (inline SVG logos)
================================================================ */
const SKILLS_DATA = [
  { name:'Python',     pct:'85%', color:'#3776AB', svg:`<svg viewBox="0 0 24 24"><path fill="#3776AB" d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.814v.826H3.9S0 5.789 0 11.969c0 6.18 3.403 5.96 3.403 5.96h2.03v-2.866s-.109-3.403 3.345-3.403h5.768s3.236.052 3.236-3.127V3.315S18.28 0 11.914 0zm-3.2 1.818a1.04 1.04 0 1 1 0 2.08 1.04 1.04 0 0 1 0-2.08z"/><path fill="#FFD43B" d="M12.086 24c6.094 0 5.714-2.656 5.714-2.656l-.007-2.752h-5.814v-.826h8.121S24 18.211 24 12.031c0-6.18-3.403-5.96-3.403-5.96h-2.03v2.866s.109 3.403-3.345 3.403H9.454S6.218 12.288 6.218 15.467v5.218S5.72 24 12.086 24zm3.2-1.818a1.04 1.04 0 1 1 0-2.08 1.04 1.04 0 0 1 0 2.08z"/></svg>` },
  { name:'HTML5',      pct:'80%', color:'#E34F26', svg:`<svg viewBox="0 0 24 24"><path fill="#E34F26" d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>` },
  { name:'CSS3',       pct:'80%', color:'#1572B6', svg:`<svg viewBox="0 0 24 24"><path fill="#1572B6" d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z"/></svg>` },
  { name:'JavaScript', pct:'75%', color:'#F7DF1E', svg:`<svg viewBox="0 0 24 24"><path fill="#F7DF1E" d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/></svg>` },
  { name:'MySQL',      pct:'80%', color:'#4479A1', svg:`<svg viewBox="0 0 24 24"><path fill="#4479A1" d="M16.405 5.501c-.115 0-.193.014-.274.033v.013h.014c.054.104.146.19.256.274l.036.036c.026-.015.05-.024.07-.047.07-.08.1-.193.1-.335 0-.054-.024-.107-.058-.156-.035-.048-.097-.078-.144-.078zM21.37 8.95c-.054-.136-.164-.247-.3-.31l-.17-.068c-.164-.066-.3-.138-.42-.224-.12-.083-.21-.168-.267-.27-.057-.1-.085-.207-.085-.321 0-.185.073-.334.22-.444.147-.11.34-.166.576-.166.22 0 .404.04.55.12.148.083.265.197.35.34.088.144.152.314.193.512l.032.136h.01V7h-.01l-.04.177c-.06.258-.155.476-.285.655-.13.18-.285.313-.462.4-.179.085-.38.128-.603.128-.267 0-.48-.06-.64-.18-.16-.12-.27-.28-.328-.48l-.058-.22-.01-.052h-.01l.006.053.024.22c.05.33.173.584.367.762.195.178.466.266.813.266.31 0 .583-.063.814-.19.233-.127.42-.296.56-.508l.095-.154.045-.076.052-.09.06-.103c.067-.12.127-.247.183-.38l.042-.103-.01-.004-.043.1c-.068.162-.153.313-.254.453l-.108.144c-.123.16-.27.3-.44.416-.168.117-.35.2-.543.25l-.152.04c-.17.04-.346.06-.525.06-.4 0-.72-.1-.957-.3-.236-.2-.378-.467-.422-.798l-.022-.175h-.01l.022.178c.047.365.204.65.47.858.266.208.638.313 1.112.313.207 0 .404-.026.59-.078.188-.052.36-.13.513-.232.153-.103.29-.23.41-.38.12-.148.223-.318.307-.508l.08-.19.036-.087.037-.09.077-.19c.1-.26.18-.543.24-.845l.036-.2.013-.077-.01-.003-.015.077-.04.2c-.066.31-.158.6-.277.865l-.085.195zM0 0v24h24V0H0zm8.087 5.46l.144-.005c.127-.006.254-.01.383-.01.33 0 .63.027.896.082.268.055.503.142.706.26.202.12.362.274.478.463.116.19.173.416.173.678 0 .217-.04.412-.12.584-.08.173-.187.32-.322.442-.134.122-.288.22-.462.29-.174.07-.36.105-.558.105-.092 0-.184-.005-.278-.014v2.082H8.087V5.46zm4.3.77c.26 0 .488.035.685.106.197.07.363.168.498.292.135.124.236.268.305.432.07.165.104.342.104.53 0 .197-.037.38-.11.547-.073.168-.174.314-.302.437-.13.124-.282.22-.455.29-.174.07-.362.105-.563.105h-.84V5.46h.678zm7.65.15c.224 0 .416.034.577.102.16.068.29.162.39.28.1.12.172.26.215.42.043.16.065.328.065.506v.128c0 .136-.014.266-.04.39h-1.94c.01.2.06.375.15.524.09.15.21.266.363.35.152.082.327.124.523.124.146 0 .284-.02.412-.06.128-.04.247-.094.357-.162l.11.464c-.12.07-.264.126-.43.17-.165.044-.352.066-.56.066-.27 0-.508-.05-.712-.15-.204-.1-.38-.236-.524-.41-.144-.172-.253-.372-.328-.597-.075-.225-.113-.47-.113-.733 0-.257.038-.495.113-.715.075-.22.18-.412.313-.578.133-.166.29-.296.47-.39.182-.093.38-.14.597-.14zm-5.66-.77c.235 0 .435.04.6.12.167.08.302.2.407.36.104.16.178.355.22.583.042.228.063.493.063.793 0 .308-.02.58-.06.814-.04.234-.11.434-.21.598-.1.163-.232.284-.393.36-.16.077-.356.115-.587.115-.234 0-.43-.04-.592-.12-.16-.08-.294-.2-.4-.36-.104-.16-.18-.356-.228-.588-.047-.232-.07-.497-.07-.794 0-.302.023-.573.07-.812.046-.24.117-.44.214-.603.097-.162.227-.282.39-.36.163-.078.355-.117.577-.117z"/></svg>` },
  { name:'C++',        pct:'70%', color:'#00599C', svg:`<svg viewBox="0 0 24 24"><path fill="#00599C" d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.109c-3.92 0-7.109-3.19-7.109-7.109S8.08 4.891 12 4.891a7.133 7.133 0 0 1 6.156 3.552l-3.076 1.781A3.567 3.567 0 0 0 12 8.445c-1.964 0-3.555 1.595-3.555 3.555 0 1.96 1.59 3.555 3.555 3.555a3.568 3.568 0 0 0 3.08-1.778l3.077 1.78A7.135 7.135 0 0 1 12 19.109zm7.109-6.714h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79v.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79v.79z"/></svg>` },
  { name:'Pandas',     pct:'80%', color:'#150458', svg:`<svg viewBox="0 0 24 24"><path fill="#150458" d="M8.617 0H6.148v7.215L8.617 9.68V0zm8.617 0H14.76v7.215l2.474 2.465V0zM8.617 14.32L6.148 11.85v4.862l2.47 2.466V14.32zm8.617-2.469l-2.474 2.469v4.858l2.474-2.466V11.851zM8.617 20.668L6.148 18.2V24l2.47-2.464v-2.868zM17.234 18.2l-2.474 2.468v.867L17.234 24V18.2zM8.617 11.852L6.148 9.388v2.466l2.47 2.466v-2.468zm8.617 0v2.466l-2.474-2.466V9.388l2.474 2.464zM6.148 16.713v1.49l2.47-2.466v-1.49l-2.47 2.466zm10.026 1.488l-2.474 2.466V22.2l2.474-2.464V18.2zm0-5.838V10.88l-2.474 2.464v1.49l2.474-2.472z"/></svg>` },
  { name:'NumPy',      pct:'80%', color:'#013243', svg:`<svg viewBox="0 0 24 24"><path fill="#013243" d="M10.71 2.804L6.18 5.144v4.706l4.53 2.344 4.53-2.344V5.144zm0 1.16l3.37 1.746-3.37 1.745-3.37-1.745zm-3.87 3.57l3.37 1.745v3.49l-3.37-1.744zm4.62 5.235l4.53 2.345 4.53-2.345v-4.705l-4.53-2.345zm.76 1.16l3.37-1.745v3.49l-3.37 1.744zm4.12-1.745l3.37 1.745-3.37 1.745zm-5.51 5.37l-4.53 2.344v2.348l4.53 2.344 4.53-2.344v-2.348zm0 1.16l3.37 1.745-3.37 1.746-3.37-1.746z"/></svg>` },
  { name:'Excel',      pct:'85%', color:'#217346', svg:`<svg viewBox="0 0 24 24"><path fill="#217346" d="M21.17 1.076H8.83a.754.754 0 0 0-.754.754v2.414L13.36 6.08 18.31 4.24v2.12l-4.95 1.54 4.95 1.54v2.12l-5.485-1.84L7.076 11.3V23.17c0 .416.338.754.754.754H21.17a.754.754 0 0 0 .754-.754V1.83a.754.754 0 0 0-.754-.754zM18.31 18.9h-2.84v-2.12h2.84zm0-3.54h-2.84v-2.12h2.84zm0-3.54h-2.84v-2.12h2.84zM2.076 4.244l5.999-1V20.76l-5.999-1z"/></svg>` },
  { name:'Photoshop',  pct:'70%', color:'#31A8FF', svg:`<svg viewBox="0 0 24 24"><path fill="#31A8FF" d="M0 0h24v24H0V0zm9.62 8.11c-.32-.29-.76-.43-1.32-.43-.17 0-.32.01-.45.04v2.77c.15.03.3.04.46.04.57 0 1.01-.15 1.34-.46.33-.3.49-.73.49-1.28 0-.3-.17-.44-.52-.68zM12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zM9.67 11.5c-.4.36-.95.54-1.65.54-.18 0-.33 0-.46-.01v2.46H6.5V6.95c.46-.08.95-.11 1.47-.11.71 0 1.24.14 1.6.43.35.28.53.7.53 1.25 0 .62-.14 1.63-.43 1.98zm5.57 2.99c-.44.48-1.1.72-1.95.72-.25 0-.49-.01-.71-.04v2.31h-1.06V6.94c.46-.08.96-.12 1.5-.12.87 0 1.53.21 1.98.63.45.42.68 1.04.68 1.87 0 .85-.15 1.69-.44 2.17zm5.26-5.59h-1.9v1.69h1.79v.88h-1.79v3.01h-1.06V8h2.96v.9z"/></svg>` },
  { name:'MS Office',  pct:'90%', color:'#D83B01', svg:`<svg viewBox="0 0 24 24"><path fill="#D83B01" d="M23 1.5H7a1 1 0 0 0-1 1v3.5h2V3.5h14v17h-14v-2.5H6V21a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V2.5a1 1 0 0 0-1-1zM1 6l10 2.5V18L1 20.5V6zm3.5 7.88c-.04.55.38.96.88.96s.88-.41.88-.96v-2.76a.88.88 0 1 0-1.76 0v2.76z"/></svg>` },
];

function buildSkillIconGrid() {
  const grid = document.getElementById('skillIconGrid');
  SKILLS_DATA.forEach(s => {
    const card = document.createElement('div');
    card.className = 'skill-icon-card';
    card.innerHTML = `${s.svg}<span class="sic-name">${s.name}</span><span class="sic-pct">${s.pct}</span>`;
    grid.appendChild(card);
  });
}

/* ================================================================
   SKILL VIEW TOGGLE
================================================================ */
window.showSkillView = function(view) {
  const barsView  = document.getElementById('skillBarsView');
  const radarView = document.getElementById('skillRadarView');
  const btnB = document.getElementById('btnBars');
  const btnR = document.getElementById('btnRadar');

  if (view === 'bars') {
    barsView.style.display  = 'block';
    radarView.style.display = 'none';
    btnB.classList.add('active');    btnR.classList.remove('active');
    animateProgressBars();
  } else {
    barsView.style.display  = 'none';
    radarView.style.display = 'block';
    btnB.classList.remove('active'); btnR.classList.add('active');
    rebuildRadar();
  }
};

function animateProgressBars() {
  document.querySelectorAll('.progress').forEach(b => {
    const w = b.getAttribute('data-width');
    b.style.width = '0%';
    setTimeout(() => { b.style.width = w + '%'; }, 50);
  });
}

function rebuildRadar() {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textC = dark ? '#b0b0d4' : '#5a5a7a';
  const gridC = dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
  if (radarChartInstance) { radarChartInstance.destroy(); radarChartInstance = null; }
  radarChartInstance = new Chart(canvas, {
    type:'radar',
    data:{
      labels:['Python','HTML/CSS','JavaScript','MySQL','C++','Pandas','MS Office','Excel'],
      datasets:[{
        label:'Skill Level (%)',
        data:[85,80,75,80,70,80,90,85],
        backgroundColor:'rgba(0,102,255,.15)',
        borderColor:'rgba(0,102,255,.85)',
        pointBackgroundColor:'#0066ff',
        pointBorderColor:'#fff',
        borderWidth:2,
        pointRadius:5,
      }]
    },
    options:{
      responsive:true,
      scales:{r:{
        min:0, max:100,
        ticks:{ stepSize:25, color:textC, backdropColor:'transparent', font:{size:11} },
        grid:{ color:gridC }, angleLines:{ color:gridC },
        pointLabels:{ color:textC, font:{size:13, weight:'500'} }
      }},
      plugins:{ legend:{ labels:{ color:textC, font:{size:12} } } },
      animation:{ duration:1000 }
    }
  });
}

/* ================================================================
   SCROLL ANIMATIONS & OBSERVERS
================================================================ */
function setupScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'fadeInUp .6s ease-out forwards';
        obs.unobserve(e.target);
      }
    });
  }, { threshold:.1, rootMargin:'0px 0px -60px 0px' });

  document.querySelectorAll(
    '.about-text, .about-info, .skills-category, .project-card, .detail-item, .highlight-item, .timeline-item'
  ).forEach(el => { el.style.opacity = '0'; obs.observe(el); });
}

function setupProgressObserver() {
  const sec = document.querySelector('.skills');
  if (!sec) return;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateProgressBars(); obs.disconnect(); }
  }, { threshold:.2 });
  obs.observe(sec);
}

/* ================================================================
   STATS COUNTER
================================================================ */
function setupStatsCounters() {
  const section = document.querySelector('.stats-section');
  if (!section) return;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      section.querySelectorAll('.stat-card').forEach(card => {
        const target = +card.getAttribute('data-target');
        const suffix = card.getAttribute('data-suffix') || '';
        const el = card.querySelector('.stat-number');
        animateCount(el, target, suffix);
      });
      obs.disconnect();
    }
  }, { threshold:.3 });
  obs.observe(section);
}
function animateCount(el, target, suffix, dur=1600) {
  let v=0, step=target/(dur/16);
  const t = setInterval(() => {
    v += step;
    if (v >= target) { el.textContent = target + suffix; clearInterval(t); }
    else               el.textContent = Math.floor(v) + suffix;
  }, 16);
}

/* ================================================================
   PROJECT FILTER
================================================================ */
function setupProjectFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const f = this.getAttribute('data-filter');
      document.querySelectorAll('.project-card').forEach(c => {
        const match = f === 'all' || c.getAttribute('data-category') === f;
        c.classList.toggle('hidden', !match);
        if (match) { c.style.animation='none'; void c.offsetHeight; c.style.animation='fadeInUp .4s ease-out forwards'; }
      });
    });
  });
}

/* ================================================================
   ADD / DELETE PROJECT  (localStorage)
================================================================ */
window.openProjectModal = function() {
  pendingTechTags = [];
  document.getElementById('pm-title').value        = '';
  document.getElementById('pm-desc').value         = '';
  document.getElementById('pm-live').value         = '';
  document.getElementById('pm-github').value       = '';
  document.getElementById('pm-image').value        = '';
  document.getElementById('pm-tech-tags').innerHTML = '';
  document.getElementById('pm-tech-input').value  = '';
  document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
  document.getElementById('projectModal').classList.add('open');
};

window.closeProjectModal = function() {
  document.getElementById('projectModal').classList.remove('open');
};

/* Tech tag input */
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('pm-tech-input');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/,$/, '');
      if (val) { addTechTag(val); input.value = ''; }
    }
  });
});

function addTechTag(val) {
  if (pendingTechTags.includes(val)) return;
  pendingTechTags.push(val);
  const container = document.getElementById('pm-tech-tags');
  const span = document.createElement('span');
  span.className = 'tech-tag-removable';
  span.dataset.val = val;
  span.innerHTML = `${val} <button onclick="removeTechTag('${val}')">×</button>`;
  container.appendChild(span);
}

window.removeTechTag = function(val) {
  pendingTechTags = pendingTechTags.filter(t => t !== val);
  document.querySelector(`.tech-tag-removable[data-val="${val}"]`)?.remove();
};

window.saveProject = function() {
  const title = document.getElementById('pm-title').value.trim();
  const desc  = document.getElementById('pm-desc').value.trim();
  const cat   = document.getElementById('pm-cat').value;
  const live  = document.getElementById('pm-live').value.trim();
  const gh    = document.getElementById('pm-github').value.trim();
  const imgFile = document.getElementById('pm-image').files[0];

  let valid = true;
  if (!title) { showFieldErr('pm-title-err', true); valid = false; } else showFieldErr('pm-title-err', false);
  if (!desc)  { showFieldErr('pm-desc-err',  true); valid = false; } else showFieldErr('pm-desc-err', false);
  if (!valid) return;

  const finalize = (imgBase64) => {
    const project = { id: Date.now(), title, desc, cat, techs: [...pendingTechTags], live, gh, img: imgBase64 || '' };
    const stored = getStoredProjects();
    stored.push(project);
    try { localStorage.setItem('userProjects', JSON.stringify(stored)); } catch(e) {}
    renderUserProject(project);
    closeProjectModal();
    showToast('success', 'Project Added!', `"${title}" is now live in your portfolio.`);
  };

  if (imgFile) {
    const r = new FileReader();
    r.onload = e => finalize(e.target.result);
    r.readAsDataURL(imgFile);
  } else {
    finalize('');
  }
};

function showFieldErr(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('show', show);
}

function getStoredProjects() {
  try { return JSON.parse(localStorage.getItem('userProjects')) || []; } catch(e) { return []; }
}

function loadStoredProjects() {
  getStoredProjects().forEach(p => renderUserProject(p));
}

function renderUserProject(p) {
  const grid = document.getElementById('projectsGrid');
  const card = document.createElement('div');
  card.className = 'project-card';
  card.id = 'proj-' + p.id;
  card.setAttribute('data-category', p.cat);
  card.setAttribute('data-user', '1');

  const badgeClass = p.cat === 'data' ? 'data' : p.cat === 'database' ? 'db' : '';
  const badgeLabel = p.cat === 'web' ? 'Web Dev' : p.cat === 'data' ? 'Data Science' : 'Database';
  const catIcons   = { web:'fas fa-code', data:'fas fa-chart-line', database:'fas fa-database' };
  const techHtml   = p.techs.map(t => `<span class="tech-tag">${t}</span>`).join('');

  const imgHtml = p.img
    ? `<img src="${p.img}" alt="${p.title}" class="user-img" />`
    : `<div class="project-placeholder"><i class="${catIcons[p.cat] || 'fas fa-folder'}"></i></div>`;

  const liveBtn = p.live   ? `<a href="${p.live}" target="_blank" rel="noopener" class="overlay-btn"><i class="fas fa-eye"></i></a>` : '';
  const ghBtn   = p.gh     ? `<a href="${p.gh}"   target="_blank" rel="noopener" class="overlay-btn"><i class="fab fa-github"></i></a>` : '';

  card.innerHTML = `
    <div class="project-image">
      ${imgHtml}
      <div class="project-overlay"><div class="overlay-links">${liveBtn}${ghBtn}</div></div>
    </div>
    <div class="project-content">
      <span class="project-cat-badge ${badgeClass}">${badgeLabel}</span>
      <h3 class="project-title">${p.title}</h3>
      <p class="project-description">${p.desc}</p>
      <div class="project-tech">${techHtml}</div>
      <button class="project-delete-btn" onclick="deleteProject(${p.id})">
        <i class="fas fa-trash-alt"></i> Remove
      </button>
    </div>`;

  grid.appendChild(card);
  void card.offsetHeight;
  card.style.animation = 'fadeInUp .5s ease-out forwards';
}

window.deleteProject = function(id) {
  if (!confirm('Remove this project from your portfolio?')) return;
  const stored = getStoredProjects().filter(p => p.id !== id);
  try { localStorage.setItem('userProjects', JSON.stringify(stored)); } catch(e){}
  document.getElementById('proj-' + id)?.remove();
  showToast('success', 'Project Removed', 'The project has been deleted.');
};

/* Close modal on backdrop click */
document.getElementById('projectModal').addEventListener('click', function(e) {
  if (e.target === this) closeProjectModal();
});

/* ================================================================
   CONTACT FORM with EmailJS
================================================================ */
function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearContactErrors();

    const name    = document.getElementById('c-name');
    const email   = document.getElementById('c-email');
    const subject = document.getElementById('c-subject');
    const msg     = document.getElementById('c-msg');
    let valid = true;

    if (name.value.trim().length < 2)                      { markErr(name, 'Enter your name (min 2 chars)');   valid=false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))  { markErr(email, 'Enter a valid email address');   valid=false; }
    if (subject.value.trim().length < 3)                   { markErr(subject, 'Subject needs 3+ characters'); valid=false; }
    if (msg.value.trim().length < 10)                      { markErr(msg, 'Message needs 10+ characters');    valid=false; }
    if (!valid) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;

    try {
      /* ✅ EmailJS send — make sure Service ID / Template ID are set at the top */
      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
      form.reset();
      showToast('success', 'Message Sent!', "Thanks! I'll get back to you soon.");
    } catch(err) {
      console.error('EmailJS error:', err);
      showToast('error', 'Send Failed', 'Please try emailing me directly.');
    } finally {
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
      btn.disabled = false;
    }
  });
}

function markErr(input, msg) {
  input.classList.add('error');
  const el = input.parentElement.querySelector('.error-msg');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}
function clearContactErrors() {
  document.querySelectorAll('#contactForm .error-msg').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('#contactForm input, #contactForm textarea').forEach(i => i.classList.remove('error'));
}

/* ================================================================
   TOAST
================================================================ */
let toastTimer = null;
function showToast(type='success', title='Done!', msg='') {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon-el');
  const ttl   = document.getElementById('toast-title');
  const tmsg  = document.getElementById('toast-msg');
  toast.classList.remove('error-toast');
  if (type === 'error') { toast.classList.add('error-toast'); icon.className='fas fa-times-circle'; }
  else if (type === 'warning') { icon.className='fas fa-exclamation-circle'; }
  else { icon.className='fas fa-check-circle'; }
  ttl.textContent  = title;
  tmsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
}
window.closeToast = function() { document.getElementById('toast').classList.remove('show'); };

/* ================================================================
   BACK TO TOP
================================================================ */
function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => btn.classList.toggle('show', pageYOffset > 300));
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
}

/* ================================================================
   TYPING ANIMATION
================================================================ */
function setupTyping() {
  const el = document.querySelector('.typing-text');
  if (!el) return;
  const text = el.textContent;
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  el.parentElement.appendChild(cursor);
  let i = 0;
  const type = () => {
    if (i < text.length) { el.textContent += text[i++]; setTimeout(type, 55); }
    else setTimeout(() => cursor.remove(), 2000);
  };
  setTimeout(type, 400);
}

/* ================================================================
   PARTICLE BACKGROUND
================================================================ */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT = 55;

  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };

  function Particle() {
    this.x = Math.random()*W; this.y = Math.random()*H;
    this.r = Math.random()*2+.5;
    this.vx = (Math.random()-.5)*.4; this.vy = (Math.random()-.5)*.4;
    this.a = Math.random()*.5+.1;
  }
  Particle.prototype.update = function() {
    this.x += this.vx; this.y += this.vy;
    if (this.x<0||this.x>W) this.vx*=-1;
    if (this.y<0||this.y>H) this.vy*=-1;
  };

  const getColor = () => document.documentElement.getAttribute('data-theme')==='dark'
    ? '102,179,255' : '0,102,255';

  const draw = () => {
    ctx.clearRect(0,0,W,H);
    const c = getColor();
    particles.forEach(p => {
      p.update();
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${c},${p.a})`; ctx.fill();
    });
    for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if (d<130) {
        ctx.beginPath();
        ctx.strokeStyle=`rgba(${c},${.12*(1-d/130)})`;
        ctx.lineWidth=.6;
        ctx.moveTo(particles[i].x,particles[i].y);
        ctx.lineTo(particles[j].x,particles[j].y);
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  };

  resize(); window.addEventListener('resize', resize);
  for (let i=0;i<COUNT;i++) particles.push(new Particle());
  draw();
}

/* ================================================================
   LOADER
================================================================ */
function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  window.addEventListener('load', () => setTimeout(() => loader.classList.add('hidden'), 600));
  setTimeout(() => loader.classList.add('hidden'), 2500);
}

/* ================================================================
   UTILITIES
================================================================ */
function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}

console.log('✅ Portfolio v3.0 — All features active');
