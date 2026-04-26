/**
 * K-Perception Wiki — Inline Bundle
 * Minimal client-side search + navigation for the static wiki renderer.
 * Load _search.json first, then include this script.
 *
 * Usage:
 *   <script>window.KP_SEARCH_DATA = /* inject _search.json contents here *\/;</script>
 *   <script src="_inline-bundle.js"></script>
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Search                                                               */
  /* ------------------------------------------------------------------ */

  function normalise(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function score(article, terms) {
    var s = 0;
    var title = normalise(article.title);
    var excerpt = normalise(article.excerpt);
    var tags = normalise((article.tags || []).join(' '));
    var category = normalise(article.category);
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (title.indexOf(t) !== -1) s += 10;
      if (tags.indexOf(t) !== -1) s += 6;
      if (category.indexOf(t) !== -1) s += 4;
      if (excerpt.indexOf(t) !== -1) s += 2;
    }
    return s;
  }

  /**
   * Search the wiki.
   * @param {string} query - Free-text search query.
   * @param {Object} [opts] - Options.
   * @param {string} [opts.audience] - Filter by audience ('user'|'admin'|'developer').
   * @param {string} [opts.plan] - Filter by plan ('local'|'guardian'|'vault'|'lifetime'|'team'|'enterprise').
   * @param {number} [opts.limit=20] - Max results.
   * @returns {Array} Ranked search results.
   */
  function search(query, opts) {
    var data = global.KP_SEARCH_DATA;
    if (!data || !Array.isArray(data)) return [];
    opts = opts || {};
    var limit = opts.limit || 20;
    var terms = normalise(query).split(' ').filter(Boolean);
    if (!terms.length) return [];

    var results = [];
    for (var i = 0; i < data.length; i++) {
      var a = data[i];
      if (opts.audience && a.audience !== opts.audience) continue;
      if (opts.plan && Array.isArray(a.plan) && a.plan.indexOf(opts.plan) === -1) continue;
      var s = score(a, terms);
      if (s > 0) results.push({ score: s, article: a });
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, limit).map(function (r) { return r.article; });
  }

  /* ------------------------------------------------------------------ */
  /* Table of Contents builder                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Build a TOC from the headings in an article body element.
   * @param {Element} articleEl - The article DOM element.
   * @returns {Array} TOC entries: [{level, text, id}]
   */
  function buildToc(articleEl) {
    var headings = articleEl.querySelectorAll('h2, h3');
    var toc = [];
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      if (!h.id) {
        h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      toc.push({ level: parseInt(h.tagName[1], 10), text: h.textContent.trim(), id: h.id });
    }
    return toc;
  }

  /* ------------------------------------------------------------------ */
  /* Breadcrumb helper                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Build breadcrumb segments from a wiki article path.
   * @param {string} path - e.g. "enterprise/saml-okta.md"
   * @returns {Array} [{label, path}]
   */
  function breadcrumbs(path) {
    var parts = path.replace(/\.md$/, '').split('/');
    var crumbs = [{ label: 'Docs', path: '/' }];
    var acc = '';
    for (var i = 0; i < parts.length; i++) {
      acc += (i ? '/' : '') + parts[i];
      var label = parts[i].replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      crumbs.push({ label: label, path: '/' + acc });
    }
    return crumbs;
  }

  /* ------------------------------------------------------------------ */
  /* Prev / Next navigation                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Get previous and next articles for linear navigation within a category.
   * @param {string} currentPath - Current article path.
   * @returns {{prev: Object|null, next: Object|null}}
   */
  function prevNext(currentPath) {
    var data = global.KP_SEARCH_DATA;
    if (!data) return { prev: null, next: null };
    var idx = -1;
    for (var i = 0; i < data.length; i++) {
      if (data[i].path === currentPath) { idx = i; break; }
    }
    if (idx === -1) return { prev: null, next: null };
    var current = data[idx];
    var sameCategory = data.filter(function (a) { return a.category === current.category; });
    var catIdx = sameCategory.findIndex(function (a) { return a.path === currentPath; });
    return {
      prev: catIdx > 0 ? sameCategory[catIdx - 1] : null,
      next: catIdx < sameCategory.length - 1 ? sameCategory[catIdx + 1] : null
    };
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                           */
  /* ------------------------------------------------------------------ */

  global.KPWiki = {
    search: search,
    buildToc: buildToc,
    breadcrumbs: breadcrumbs,
    prevNext: prevNext,
    version: '1.0.0'
  };

}(typeof window !== 'undefined' ? window : this));
