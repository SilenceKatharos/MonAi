// MonAI — shared site behaviors (vanilla JS).
// Included with defer on all pages.

(function () {
  'use strict';

  // -----------------------------------------------------------
  // 1. Reading progress bar at the top of the page
  // -----------------------------------------------------------
  const bar = document.querySelector('.progress-bar');
  if (bar) {
    const updateBar = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
      bar.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateBar, { passive: true });
    updateBar();
  }

  // -----------------------------------------------------------
  // 2. Scroll reveal: .reveal-on-scroll → .in-view
  // -----------------------------------------------------------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => io.observe(el));
  } else {
    // Fallback: show everything directly
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('in-view'));
  }

  // -----------------------------------------------------------
  // 3. "Back to top" button
  // -----------------------------------------------------------
  const btn = document.querySelector('.back-to-top');
  if (btn) {
    const updateBtn = () => {
      if (window.scrollY > 600) btn.classList.add('visible');
      else btn.classList.remove('visible');
    };
    window.addEventListener('scroll', updateBtn, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    updateBtn();
  }

  // -----------------------------------------------------------
  // 4. Floating TOC: highlight the current section
  // -----------------------------------------------------------
  const tocLinks = document.querySelectorAll('.toc-floating a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const sections = [];
    tocLinks.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) sections.push({ link, target });
    });

    const setActive = (activeLink) => {
      tocLinks.forEach((l) => l.classList.remove('active'));
      if (activeLink) activeLink.classList.add('active');
    };

    const tocObs = new IntersectionObserver((entries) => {
      // The topmost visible one becomes active
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) {
        const id = visible[0].target.id;
        const match = sections.find((s) => s.target.id === id);
        if (match) setActive(match.link);
      }
    }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });

    sections.forEach((s) => tocObs.observe(s.target));
  }
})();
