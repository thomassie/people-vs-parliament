/* People vs Parliament (D3 v7), drawn into one element:

     <div id="people-vs-parliament" data-base="https://<data host>/"></div>

   data-base       where data/*.json live (default: next to the page)
   data-header     "false" leaves out the built-in title (when the host page has its own)
   data-layout     "standalone" adds the page's own width and side gutters

   Reads data/*.json, written by pipeline/run.py from the semantic layer. No database access here.
   Styles: pvp.css (scoped under .pvp); colours come from the host's tokens or theme.css. */
(function () {
  'use strict';

  const root = document.getElementById('people-vs-parliament');
  if (!root || typeof d3 === 'undefined') return;
  const BASE = root.dataset.base ? root.dataset.base.replace(/\/?$/, '/') : '';
  root.classList.add('pvp');
  if (root.dataset.layout === 'standalone') root.classList.add('pvp--standalone');
  root.innerHTML = `<div class="masthead wrap">
  <div class="masthead__text">
    <p class="eyebrow">Swiss Democracy Lab</p>
    <h1>People vs Parliament<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg></h1>
    <p class="lede">Before a federal proposal goes to the people, parliament takes a final vote on it. For <span id="pvp-n-votes">all</span> federal votes since <span id="pvp-first-year">1875</span> we know how the National Council voted. How often did the people decide the other way?</p>
  </div>
  <div class="mark" aria-hidden="true"><span class="mark__square"></span><span class="mark__circle"></span><span class="mark__half"></span></div>
</div>

<div class="pvp__main">
  <section class="hero wrap" aria-label="Headline figure">
    <p class="hero__figure" id="pvp-hero-figure">&nbsp;</p>
    <p class="hero__text" id="pvp-hero-text">Loading the votes&hellip;</p>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-voteday" id="pvp-vote-day" hidden>
    <div class="block__rail">
      <h2 id="pvp-h-voteday">Vote day</h2>
      <div class="vd__status" id="pvp-vd-status"></div>
      <p id="pvp-vd-note"></p>
      <p class="vd__updated" id="pvp-vd-updated"></p>
    </div>
    <div class="block__body">
      <div class="vd__pick"><label for="pvp-vd-canton">Follow a canton</label>
        <select id="pvp-vd-canton"><option value="">All cantons</option></select></div>
      <ol class="vd__list" id="pvp-vd-list" aria-live="polite"></ol>
      <div class="vd__legend" id="pvp-vd-legend"></div>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-decades">
    <div class="block__rail">
      <h2 id="pvp-h-decades">Decade by decade</h2>
      <p>Share of votes in which the people&rsquo;s majority went against the National Council&rsquo;s majority.</p>
    </div>
    <div class="block__body">
      <div class="chart" id="pvp-chart-decades"></div>
      <p class="note" id="pvp-note-decades">The current decade is incomplete.</p>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-votes">
    <div class="block__rail">
      <h2 id="pvp-h-votes">Every vote</h2>
      <p>Each dot is one federal vote. Across: how strongly the National Council backed it. Up: how strongly the people did. Dots in the shaded corners are votes where the people went the other way.</p>
    </div>
    <div class="block__body">
      <div class="filters">
        <div class="seg" role="group" aria-label="Type of vote" id="pvp-filter-form"></div>
        <div class="seg" role="group" aria-label="Period" id="pvp-filter-period"></div>
      </div>
      <div class="legend" id="pvp-legend-votes" aria-live="polite"></div>
      <div class="chart" id="pvp-chart-votes"></div>
      <p class="note">Hover or tap a dot for details. With the chart focused, the arrow keys step through the votes by date.</p>
      <details class="tableview" id="pvp-table-votes">
        <summary>Show these votes as a table</summary>
        <div class="tablewrap">
          <table>
            <thead><tr><th>Date</th><th>Proposal</th><th>Type</th><th class="num">National Council yes</th><th class="num">People yes</th><th>Against parliament</th><th>Result</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </details>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-splits">
    <div class="block__rail">
      <h2 id="pvp-h-splits">The widest splits</h2>
      <p>Votes where the people went against the National Council by the largest margin, on a scale from 0 to 100% yes. Square: the National Council. Circle: the people.</p>
    </div>
    <div class="block__body">
      <ol class="splits" id="pvp-splits"></ol>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-next">
    <div class="block__rail">
      <h2 id="pvp-h-next">Next on the ballot</h2>
      <p>Parliament has voted; the people have not yet. Each proposal links to the Federal Council&rsquo;s official explanations, a short explainer video and its Swissvotes page.</p>
    </div>
    <div class="block__body">
      <div class="upcoming" id="pvp-upcoming"></div>
    </div>
  </section>
</div>

<section class="foot wrap" aria-label="How this is counted">
  <h2>How this is counted</h2>
  <div>
    <ul>
      <li>A vote counts as <em>against parliament</em> when the people&rsquo;s majority (more than 50% yes) is on the other side of the National Council&rsquo;s majority.</li>
      <li>The National Council&rsquo;s yes share is taken from its final vote, abstentions excluded. For popular initiatives, yes means a vote to back the initiative.</li>
      <li>Covers mandatory referendums, optional referendums and popular initiatives with a recorded final vote. Direct counter-proposals and tie-break questions are left out.</li>
      <li>The people&rsquo;s yes share is the official national result. A proposal can win the popular vote and still fail for lack of a majority of cantons.</li>
      <li>Proposal summaries are neutral one- or two-sentence descriptions, each written from the official information page linked beside it. Titles, recommendations and links come from Swissvotes.</li>
    </ul>
    <p class="credit">Data: <a href="https://swissvotes.ch/page/dataset">Swissvotes</a>, Année politique suisse, University of Bern (CC BY 4.0). <span id="pvp-freshness"></span></p>
  </div>
</section>`;
  // data-header="false": the host page shows its own title, so drop ours (title, label, mark) but keep the intro question
  if (root.dataset.header === 'false') root.querySelectorAll('.masthead h1, .masthead .eyebrow, .masthead .mark').forEach((n) => n.remove());

  const FORM = { 1: 'Mandatory referendum', 2: 'Optional referendum', 3: 'Popular initiative' };
  const FORM_ANY = Object.assign({ 4: 'Direct counter-proposal', 5: 'Tie-break question' }, FORM);
  const FORM_FILTER = [['all', 'All types'], ['1', 'Mandatory'], ['2', 'Optional'], ['3', 'Initiatives']];
  const PERIOD_FILTER = [['all', 'All years'], ['1990', 'Since 1990'], ['2020', 'Since 2020']];
  const parseDate = d3.utcParse('%Y-%m-%d');
  const fmtDate = d3.utcFormat('%-d %b %Y');
  const f1 = d3.format('.1f');
  const pct = (v) => (v == null ? '–' : f1(v) + '%');
  const pct2 = (v) => (v == null ? '–' : d3.format('.2f')(v) + '%');  // vote-day figures, as officially reported
  const state = { form: 'all', period: 'all', focus: null };
  let VOTES = [];

  // ---------- helpers ----------
  const $ = (sel) => root.querySelector(sel.replace(/#([\w-]+)/g, '#pvp-$1'));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function getJSON(path, optional) {
    try {
      // GitHub Pages lets caches keep files for 10 minutes; a per-minute marker keeps live data fresh
      const r = await fetch(BASE + path + '?m=' + Math.floor(Date.now() / 60000), { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return await r.json();
    } catch (e) {
      if (optional) return null;
      throw new Error('Could not load ' + BASE + path + ' (' + e.message + ').');
    }
  }

  function onWidth(el, draw) {
    let last = -1;
    const run = () => {
      const w = Math.round(el.clientWidth);
      if (w && w !== last) { last = w; draw(); }
    };
    if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(run)).observe(el);
    else window.addEventListener('resize', run);
    run();
    return () => { last = -1; run(); };
  }

  function tooltip(container) {
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.hidden = true;
    tip.setAttribute('role', 'status');
    container.appendChild(tip);
    return {
      show(html, x, y) {
        tip.innerHTML = html;
        tip.hidden = false;
        const cw = container.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
        let left = x + 14;
        if (left + tw > cw) left = Math.max(0, x - tw - 14);
        let top = y - th - 12;
        if (top < 0) top = y + 16;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
      },
      hide() { tip.hidden = true; },
    };
  }

  function outcome(v) {
    if (v.accepted == null) return 'Result pending';
    if (v.accepted) return 'Accepted';
    if (v.people > 50) return 'Rejected (no majority of cantons)';
    return 'Rejected';
  }

  // Proposal details (data/proposal_details.json): upcoming proposals and the latest vote day.
  let DETAILS = new Map();
  const titleEn = (v) => (v.title_en ? String(v.title_en).trim() : null);
  const titleMain = (v) => titleEn(v) || String(v.title).trim();
  const STANCE = { yes: 'Yes', no: 'No', none: 'No recommendation', prefer_counter_proposal: 'Counter-proposal', prefer_initiative: 'Initiative' };
  const ext = (href, label, tip) => href
    ? '<a href="' + esc(href) + '" target="_blank" rel="noopener"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '>' + label + '<span class="ext" aria-hidden="true">↗</span></a>'
    : '';

  // Subtitle: the German title (when an English one leads) and the nickname, if any.
  function subtitle(v, d) {
    const parts = [];
    if (titleEn(v)) parts.push('<span lang="de">' + esc(String(v.title).trim()) + '</span>');
    if (d && d.nickname) parts.push('<span lang="de">' + esc(d.nickname) + '</span>');
    return parts.length ? '<p class="p-sub">' + parts.join(' · ') + '</p>' : '';
  }

  function summaryHtml(d) {
    if (!d || !d.summary) return '';
    return '<p class="p-summary">' + esc(d.summary) +
      (d.summary_source ? ' <a class="p-src" href="' + esc(d.summary_source) + '" target="_blank" rel="noopener" data-tip="This summary was written from this official page.">Source</a>' : '') + '</p>';
  }

  // Recommendations, initiators and links for one proposal.
  function metaLinks(d, lead) {
    if (!d) return '';
    const fc = STANCE[d.federal_council], pa = STANCE[d.parliament];
    const recs = fc && pa && fc === pa
      ? 'Federal Council and Parliament recommend: <b>' + fc + '</b>'
      : [fc ? 'Federal Council: <b>' + fc + '</b>' : '', pa ? 'Parliament: <b>' + pa + '</b>' : ''].filter(Boolean).join(' · ');
    const video = d.url_video_de || d.url_video_fr;
    const links = [
      ext(d.url_official, 'Official information', 'The Federal Council’s explanations' + (d.status === 'upcoming' ? '' : ' (archived copy)') + ', admin.ch'),
      d.url_official ? '' : ext(d.url_federal_chancellery, 'Federal Chancellery', 'The Federal Chancellery’s record of the initiative or referendum. The Federal Council’s explanations follow closer to the vote.'),
      ext(video, 'Explainer video', 'Short neutral video by easyvote, in ' + (d.url_video_de ? 'German' : 'French')),
      ext(d.url_swissvotes, 'Swissvotes', 'Background, documents and results at Swissvotes, University of Bern'),
    ].filter(Boolean);
    return ((recs || d.initiators) ? '<p class="p-meta">' + [recs, d.initiators ? (d.form === 3 ? 'Initiative launched by: ' : d.form === 2 ? 'Referendum launched by: ' : 'Launched by: ') + '<span lang="de">' + esc(d.initiators) + '</span>' : ''].filter(Boolean).join(' · ') + '</p>' : '') +
      (links.length ? '<p class="p-links">' + (lead ? '<span>' + lead + '</span>' : '') + links.join('') + '</p>' : '');
  }

  function voteTip(v) {
    return '<p class="tt__meta">' + fmtDate(v.d) + ' · ' + FORM[v.form] + '</p>' +
      '<p class="tt__title">' + esc(titleMain(v)) + '</p>' + (titleEn(v) ? '<p class="tt__meta">' + esc(String(v.title).trim()) + '</p>' : '') +
      '<dl class="tt__rows">' +
      '<div><dt><span class="key key--square"></span>National Council</dt><dd>' + pct(v.nr) + ' yes</dd></div>' +
      '<div><dt><span class="key key--circle' + (v.against ? ' against' : '') + '"></span>People</dt><dd>' + pct(v.people) + ' yes</dd></div>' +
      '</dl>' +
      '<p class="tt__out">' + outcome(v) + (v.against ? ' · <strong>against parliament</strong>' : ' · same side as parliament') + '</p>';
  }

  // ---------- intro + hero ----------
  function renderIntro(finals, decades) {
    const nv = $('#n-votes'), fy = $('#first-year');
    if (nv) nv.textContent = finals.length.toLocaleString('en');
    if (fy) fy.textContent = d3.min(finals, (v) => v.year);

    const rows = decades.slice().sort((a, b) => a.decade - b.decade);
    const cur = rows[rows.length - 1];
    const curVotes = finals.filter((v) => v.year >= cur.decade);
    const curAgainst = curVotes.filter((v) => v.against).length;
    const higher = rows.slice(0, -1).filter((r) => r.pct_against_nr >= cur.pct_against_nr);
    const lastHigher = higher.length ? higher[higher.length - 1] : null;

    $('#hero-figure').innerHTML = f1(cur.pct_against_nr) + '<small>%</small>';
    $('#hero-text').textContent =
      'of federal votes in the ' + cur.decade + 's so far went against the National Council’s majority (' +
      curAgainst + ' of ' + cur.proposals + '). ' +
      (lastHigher ? 'That is the highest share since the ' + lastHigher.decade + 's (' + f1(lastHigher.pct_against_nr) + '%).'
                  : 'That is the highest share of any decade.');
    const dLast = d3.max(curVotes, (v) => v.d);
    $('#note-decades').textContent = 'The ' + cur.decade + 's are incomplete: votes up to ' + (dLast ? fmtDate(dLast) : 'today') + '.';
  }

  // ---------- decade columns ----------
  function colPath(x0, w, yTop, yBase, r) {
    const h = yBase - yTop;
    if (h <= 0) return '';
    r = Math.min(r, h, w / 2);
    return 'M' + x0 + ',' + yBase + 'V' + (yTop + r) + 'Q' + x0 + ',' + yTop + ' ' + (x0 + r) + ',' + yTop +
      'H' + (x0 + w - r) + 'Q' + (x0 + w) + ',' + yTop + ' ' + (x0 + w) + ',' + (yTop + r) + 'V' + yBase + 'Z';
  }

  function drawDecades(el, decades) {
    const W = el.clientWidth;
    el.querySelectorAll('svg').forEach((n) => n.remove());
    const tip = el._tip || (el._tip = tooltip(el));
    tip.hide();
    const H = 280, m = { t: 30, r: 4, b: 30, l: 34 };
    const rows = decades.slice().sort((a, b) => a.decade - b.decade);
    const x = d3.scaleBand().domain(rows.map((d) => d.decade)).range([m.l, W - m.r]).paddingInner(0.3).paddingOuter(0.1);
    const yMax = Math.max(10, Math.ceil(d3.max(rows, (d) => d.pct_against_nr) / 10) * 10);
    const y = d3.scaleLinear().domain([0, yMax]).range([H - m.b, m.t]);
    const ticks = d3.range(0, yMax + 1, 10);
    const bw = Math.min(24, x.bandwidth());
    const maxRow = rows.reduce((a, b) => (b.pct_against_nr > a.pct_against_nr ? b : a));
    const lastRow = rows[rows.length - 1];
    const labelled = new Set([maxRow.decade, lastRow.decade]);
    const every = Math.max(1, Math.ceil(46 / x.step()));  // a "1880s" label needs about 46px

    const svg = d3.select(el).insert('svg', ':first-child')
      .attr('width', W).attr('height', H).attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('role', 'img')
      .attr('aria-label', 'Column chart: share of votes against the National Council majority per decade, ' +
        rows[0].decade + 's to ' + lastRow.decade + 's. Highest: ' + maxRow.decade + 's, ' + f1(maxRow.pct_against_nr) + '%.');

    svg.append('g').attr('class', 'grid').selectAll('line').data(ticks).join('line')
      .attr('x1', m.l).attr('x2', W - m.r).attr('y1', (d) => Math.round(y(d)) + 0.5).attr('y2', (d) => Math.round(y(d)) + 0.5);
    svg.append('g').selectAll('text').data(ticks).join('text')
      .attr('x', m.l - 8).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end')
      .text((d) => d + (d === yMax ? '%' : ''));

    svg.append('g').selectAll('path').data(rows).join('path')
      .attr('class', 'bar')
      .attr('d', (d) => colPath(x(d.decade) + (x.bandwidth() - bw) / 2, bw, y(d.pct_against_nr), y(0), 4));

    svg.append('g').selectAll('text').data(rows.filter((d) => labelled.has(d.decade))).join('text')
      .attr('class', 'value').attr('text-anchor', 'middle')
      .attr('x', (d) => x(d.decade) + x.bandwidth() / 2).attr('y', (d) => y(d.pct_against_nr) - 8)
      .text((d) => f1(d.pct_against_nr) + '%');

    svg.append('g').selectAll('text').data(rows.filter((d, i) => i % every === (rows.length - 1) % every)).join('text')
      .attr('text-anchor', 'middle').attr('x', (d) => x(d.decade) + x.bandwidth() / 2).attr('y', H - m.b + 18)
      .text((d) => d.decade + 's');

    const html = (d) => '<p class="tt__title">' + d.decade + 's' + (d === lastRow ? ' (so far)' : '') + '</p>' +
      '<dl class="tt__rows">' +
      '<div><dt>Against parliament</dt><dd>' + pct(d.pct_against_nr) + '</dd></div>' +
      '<div><dt>Votes</dt><dd>' + d.proposals + '</dd></div>' +
      '<div><dt>Mean gap</dt><dd>' + f1(d.mean_abs_gap_pts) + ' pts</dd></div>' +
      '<div><dt>Initiatives accepted</dt><dd>' + pct(d.initiatives_accepted_pct) + '</dd></div></dl>';

    svg.append('g').selectAll('rect').data(rows).join('rect')
      .attr('class', 'hit').attr('tabindex', 0)
      .attr('aria-label', (d) => d.decade + 's: ' + f1(d.pct_against_nr) + '% of ' + d.proposals + ' votes against parliament')
      .attr('x', (d) => x(d.decade)).attr('width', x.bandwidth()).attr('y', m.t).attr('height', H - m.t - m.b)
      .on('pointerenter pointermove', function (ev, d) { const [px, py] = d3.pointer(ev, el); tip.show(html(d), px, py); })
      .on('pointerleave blur', () => tip.hide())
      .on('focus', function (ev, d) { tip.show(html(d), x(d.decade) + x.bandwidth() / 2, y(d.pct_against_nr)); });
  }

  // ---------- filters ----------
  function renderFilters(redraw) {
    const build = (el, items, key) => {
      el.innerHTML = '';
      items.forEach(([val, label]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.id = 'pvp-filter-' + key + '-' + val;
        b.textContent = label;
        b.setAttribute('aria-pressed', String(state[key] === val));
        b.addEventListener('click', () => {
          state[key] = val;
          el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          redraw();
        });
        el.appendChild(b);
      });
    };
    build($('#filter-form'), FORM_FILTER, 'form');
    build($('#filter-period'), PERIOD_FILTER, 'period');
  }

  function filtered() {
    return VOTES.filter((v) => v.final &&
      (state.form === 'all' || String(v.form) === state.form) &&
      (state.period === 'all' || v.year >= +state.period));
  }

  // ---------- scatter ----------
  function drawVotes(el, rows) {
    const W = el.clientWidth;
    el.querySelectorAll('svg').forEach((n) => n.remove());
    const tip = el._tip || (el._tip = tooltip(el));
    tip.hide();
    const m = { t: 30, r: 12, b: 46, l: 40 };
    const side = Math.max(220, Math.min(W - m.l - m.r, 560));
    const H = side + m.t + m.b;
    const x = d3.scaleLinear().domain([0, 100]).range([m.l, m.l + side]);
    const y = d3.scaleLinear().domain([0, 100]).range([m.t + side, m.t]);
    const r = side < 360 ? 3.5 : 4.5;
    const ticks = [0, 25, 50, 75, 100];

    const svg = d3.select(el).insert('svg', ':first-child')
      .attr('width', W).attr('height', H).attr('viewBox', '0 0 ' + W + ' ' + H);

    // shaded corners: the people on the other side of parliament
    svg.append('rect').attr('class', 'quad').attr('x', x(0)).attr('y', y(100)).attr('width', x(50) - x(0)).attr('height', y(50) - y(100));
    svg.append('rect').attr('class', 'quad').attr('x', x(50)).attr('y', y(50)).attr('width', x(100) - x(50)).attr('height', y(0) - y(50));

    const g = svg.append('g').attr('class', 'grid');
    g.selectAll('line.v').data(ticks).join('line').attr('class', (d) => 'v' + (d === 50 ? ' mid' : ''))
      .attr('x1', (d) => Math.round(x(d)) + 0.5).attr('x2', (d) => Math.round(x(d)) + 0.5).attr('y1', y(0)).attr('y2', y(100));
    g.selectAll('line.h').data(ticks).join('line').attr('class', (d) => 'h' + (d === 50 ? ' mid' : ''))
      .attr('y1', (d) => Math.round(y(d)) + 0.5).attr('y2', (d) => Math.round(y(d)) + 0.5).attr('x1', x(0)).attr('x2', x(100));
    svg.append('line').attr('class', 'diag').attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(100)).attr('y2', y(100));

    svg.append('g').selectAll('text').data(ticks).join('text')
      .attr('x', (d) => x(d)).attr('y', y(0) + 18).attr('text-anchor', 'middle').text((d) => d + (d === 100 ? '%' : ''));
    svg.append('g').selectAll('text').data(ticks).join('text')
      .attr('x', x(0) - 8).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end').text((d) => d + (d === 100 ? '%' : ''));
    svg.append('text').attr('class', 'axis-title').attr('x', x(100)).attr('y', y(0) + 38).attr('text-anchor', 'end')
      .text('National Council yes share →');
    svg.append('text').attr('class', 'axis-title').attr('x', x(0)).attr('y', m.t - 12)
      .text('↑ People’s yes share');

    const pad = 8;
    const ql = svg.append('g');
    ql.append('text').attr('class', 'quad-label').attr('x', x(0) + pad).attr('y', y(100) + pad).attr('dy', '0.9em').text('Parliament no, people yes');
    ql.append('text').attr('class', 'quad-label').attr('x', x(100) - pad).attr('y', y(0) - pad).attr('text-anchor', 'end').text('Parliament yes, people no');
    ql.append('text').attr('class', 'quad-label').attr('x', x(100) - pad).attr('y', y(100) + pad).attr('dy', '0.9em').attr('text-anchor', 'end').text('Both yes');
    ql.append('text').attr('class', 'quad-label').attr('x', x(0) + pad).attr('y', y(0) - pad).text('Both no');

    const ordered = rows.slice().sort((a, b) => (a.against === b.against ? a.d - b.d : a.against ? 1 : -1));
    svg.append('g').selectAll('circle').data(ordered).join('circle')
      .attr('class', (d) => 'dot ' + (d.against ? 'dot--against' : 'dot--with'))
      .attr('cx', (d) => x(d.nr)).attr('cy', (d) => y(d.people)).attr('r', r);

    const ring = svg.append('circle').attr('class', 'focus-ring').attr('r', r + 4).attr('visibility', 'hidden');
    const byDate = rows.slice().sort((a, b) => a.d - b.d || a.id - b.id);
    const delaunay = d3.Delaunay.from(rows, (d) => x(d.nr), (d) => y(d.people));

    const show = (d) => {
      if (!d) { ring.attr('visibility', 'hidden'); tip.hide(); state.focus = null; return; }
      state.focus = d.id;
      ring.attr('cx', x(d.nr)).attr('cy', y(d.people)).attr('visibility', 'visible');
      tip.show(voteTip(d), x(d.nr), y(d.people));
    };

    svg.append('rect').attr('class', 'overlay')
      .attr('x', x(0) - 12).attr('y', y(100) - 12).attr('width', side + 24).attr('height', side + 24)
      .attr('tabindex', rows.length ? 0 : -1)
      .attr('role', 'img')
      .attr('aria-label', 'Scatter plot of ' + rows.length + ' votes: National Council yes share against the people’s yes share. ' +
        rows.filter((d) => d.against).length + ' are against parliament. Use the left and right arrow keys to step through the votes by date.')
      .on('pointermove pointerdown', (ev) => {
        if (!rows.length) return;
        const [px, py] = d3.pointer(ev);
        const i = delaunay.find(px, py);
        const d = rows[i];
        const dist = Math.hypot(x(d.nr) - px, y(d.people) - py);
        show(dist <= 28 ? d : null);
      })
      .on('pointerleave', () => show(null))
      .on('keydown', (ev) => {
        if (!byDate.length) return;
        let i = byDate.findIndex((d) => d.id === state.focus);
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') i = i < 0 ? 0 : Math.min(byDate.length - 1, i + 1);
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') i = i < 0 ? byDate.length - 1 : Math.max(0, i - 1);
        else if (ev.key === 'Home') i = 0;
        else if (ev.key === 'End') i = byDate.length - 1;
        else if (ev.key === 'Escape') { show(null); return; }
        else return;
        ev.preventDefault();
        show(byDate[i]);
      })
      .on('blur', () => show(null));
  }

  function renderLegend(rows) {
    const against = rows.filter((d) => d.against).length;
    const share = rows.length ? (100 * against) / rows.length : 0;
    $('#legend-votes').innerHTML =
      '<span><i class="key key--circle"></i>Same side as the National Council <span class="count">' + (rows.length - against) + '</span></span>' +
      '<span><i class="key key--circle against"></i>Against the National Council <span class="count">' + against + '</span></span>' +
      '<span class="summary"><strong>' + f1(share) + '%</strong> of ' + rows.length + ' votes against parliament</span>';
  }

  function renderTable(rows) {
    const details = $('#table-votes');
    if (!details.open) return;
    const sorted = rows.slice().sort((a, b) => b.d - a.d || b.id - a.id);
    details.querySelector('tbody').innerHTML = sorted.map((v) =>
      '<tr><td class="date">' + v.date + '</td><td>' + (v.url ? '<a href="' + esc(v.url) + '" target="_blank" rel="noopener">' + esc(titleMain(v)) + '</a>' : esc(titleMain(v))) + '</td><td>' + FORM[v.form] + '</td>' +
      '<td class="num">' + pct(v.nr) + '</td><td class="num">' + pct(v.people) + '</td>' +
      '<td>' + (v.against ? 'Yes' : 'No') + '</td><td>' + outcome(v) + '</td></tr>').join('');
  }

  // ---------- explanatory tooltips ----------
  // Any element with data-tip shows its text on hover, tap or keyboard focus.
  const gtip = (() => {
    const el = document.createElement('div');
    el.className = 'tooltip tooltip--global';
    el.setAttribute('role', 'tooltip');
    el.hidden = true;
    root.appendChild(el);
    let owner = null;
    const find = (t) => (t && t.closest ? t.closest('[data-tip]') : null);
    function show(target) {
      owner = target;
      const rich = typeof target.__tip === 'function' ? target.__tip() : null;
      if (rich) el.innerHTML = rich; else el.textContent = target.getAttribute('data-tip');
      el.hidden = false;
      const r = target.getBoundingClientRect(), rr = root.getBoundingClientRect();
      const tw = el.offsetWidth, th = el.offsetHeight;
      const left = Math.max(0, Math.min(r.left - rr.left + r.width / 2 - tw / 2, root.clientWidth - tw));
      const top = r.top - th - 10 >= 0 ? r.top - rr.top - th - 10 : r.bottom - rr.top + 10;
      el.style.left = left + 'px';
      el.style.top = top + 'px';
    }
    function hide() { owner = null; el.hidden = true; }
    root.addEventListener('pointerover', (e) => { const t = find(e.target); if (t) show(t); });
    root.addEventListener('pointerout', (e) => { const t = find(e.target); if (t && !t.contains(e.relatedTarget)) hide(); });
    root.addEventListener('focusin', (e) => { const t = find(e.target); if (t) show(t); });
    root.addEventListener('focusout', hide);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    window.addEventListener('scroll', () => { if (owner) hide(); }, { passive: true });
    return { hide };
  })();

  const CANTON_NAME = {
    ZH: 'Zurich', BE: 'Bern', LU: 'Lucerne', UR: 'Uri', SZ: 'Schwyz', OW: 'Obwalden', NW: 'Nidwalden', GL: 'Glarus',
    ZG: 'Zug', FR: 'Fribourg', SO: 'Solothurn', BS: 'Basel-Stadt', BL: 'Basel-Landschaft', SH: 'Schaffhausen',
    AR: 'Appenzell Ausserrhoden', AI: 'Appenzell Innerrhoden', SG: 'St. Gallen', GR: 'Graubünden', AG: 'Aargau',
    TG: 'Thurgau', TI: 'Ticino', VD: 'Vaud', VS: 'Valais', NE: 'Neuchâtel', GE: 'Geneva', JU: 'Jura',
  };

  // Colour a canton (or the people's circle) by whether its majority sides with the
  // National Council's majority, as everywhere else on the page.
  function side(yes, nr) {
    if (yes == null || nr == null) return null;
    return (yes > 50) === (nr > 50) ? 'with' : 'against';
  }

  // ---------- canton selection (cross-filter across the vote day's proposals) ----------
  let selectedCanton = null;
  try { const v = localStorage.getItem('pvp-canton'); if (v && CANTON_NAME[v]) selectedCanton = v; } catch (e) { /* storage unavailable */ }
  function setCanton(abbr) {
    selectedCanton = abbr && CANTON_NAME[abbr] ? abbr : null;
    try { localStorage.setItem('pvp-canton', selectedCanton || ''); } catch (e) { /* storage unavailable */ }
    const pick = $('#vd-canton');
    if (pick) pick.value = selectedCanton || '';
    gtip.hide();
    DUMBBELLS.forEach((spec, el) => drawDumbbell(el, spec));
  }

  // tooltip contents: values plus signed differences, in percentage points
  const signed = (v, dec) => d3.format('+.' + dec + 'f')(v) + ' pts';
  const row = (k, v) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>';
  function cantonTip(c, spec) {
    const name = CANTON_NAME[c.abbr] || c.abbr;
    const s = side(c.yes, spec.nr);
    const verdict = (c.yes > 50 ? 'Majority yes' : 'Majority no') +
      (s == null ? '.' : s === 'with' ? ', like the National Council.' : ', against the National Council.');
    return '<p class="tt__meta">' + (c.weight < 1 ? 'Half-canton (half a cantonal vote)' : 'Canton') + (c.counted ? '' : ' · partly counted') + '</p>' +
      '<p class="tt__title">' + esc(name) + '</p><dl class="tt__rows">' +
      row('Yes', pct2(c.yes)) +
      (spec.nr != null ? row('vs National Council', signed(c.yes - spec.nr, 2)) : '') +
      (spec.people != null ? row(spec.live ? 'vs Switzerland so far' : 'vs Switzerland', signed(c.yes - spec.people, 2)) : '') +
      '</dl><p class="tt__out">' + verdict + '</p>' +
      '<p class="tt__hint">' + (selectedCanton === c.abbr ? 'Click again to show all cantons.' : 'Click to follow ' + esc(name) + ' across all proposals.') + '</p>';
  }
  function nrTipHtml(spec) {
    return '<p class="tt__title">National Council</p><dl class="tt__rows">' + row('Yes', d3.format('.' + spec.decimals + 'f')(spec.nr) + '%') +
      '</dl><p class="tt__out">Final vote before the ballot, abstentions excluded.</p>';
  }
  function peopleTipHtml(spec) {
    return '<p class="tt__title">' + (spec.live ? 'The people so far' : 'The people') + '</p><dl class="tt__rows">' +
      row('Yes', d3.format('.' + spec.decimals + 'f')(spec.people) + '%') +
      (spec.nr != null ? row('vs National Council', signed(spec.people - spec.nr, spec.decimals)) : '') +
      (spec.counted ? row('Communes counted', spec.counted) : '') +
      '</dl><p class="tt__out">' + spec.peopleNote + '</p>';
  }

  // ---------- one plot per proposal: National Council, people, cantons on a 0-100% axis ----------
  // spec: { nr, people, peopleLabel, peopleTip, nrTip, decimals, cantons: [{abbr, yes, counted, weight}] | null }
  const DUMBBELLS = new Map();

  function drawDumbbell(el, spec) {
    const W = Math.round(el.clientWidth);
    if (!W) return;
    el.innerHTML = '';
    const fmt = (v) => d3.format('.' + (spec.decimals || 1) + 'f')(v) + '%';
    const pad = 8, rFull = 4.25, rHalf = 3, gapLevel = 2 * rFull + 1.5;
    const x = d3.scaleLinear().domain([0, 100]).range([pad, W - pad]);

    // cantons: a small beeswarm above the axis
    const dots = (spec.cantons || []).filter((c) => c.yes != null)
      .map((c) => ({ c, r: c.weight < 1 ? rHalf : rFull, cx: x(c.yes) }))
      .sort((a, b) => a.cx - b.cx);
    const levels = [];
    dots.forEach((d) => {
      let lv = 0;
      while ((levels[lv] || []).some((o) => Math.abs(o.cx - d.cx) < o.r + d.r + 1)) lv++;
      (levels[lv] = levels[lv] || []).push(d);
      d.level = lv;
    });
    const swarmH = dots.length ? levels.length * gapLevel : 0;
    const labelRow = spec.cantons ? 16 : 0;   // room for the followed canton's label
    const axisY = 6 + labelRow + swarmH + (dots.length ? 10 : 6);
    let H = axisY + 30;

    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const nr = spec.nr, people = spec.people;
    svg.append('line').attr('class', 'db-axis').attr('x1', x(0)).attr('x2', x(100)).attr('y1', axisY).attr('y2', axisY);
    svg.append('line').attr('class', 'db-half').attr('x1', x(50)).attr('x2', x(50)).attr('y1', axisY - 8).attr('y2', axisY + 8);
    svg.append('rect').attr('class', 'db-hit').attr('x', x(50) - 6).attr('y', axisY - 10).attr('width', 12).attr('height', 20)
      .attr('data-tip', '50%: a majority needs more than half of the votes.');

    const sideOf = (yes) => side(yes, nr) || 'neutral';
    const sel = spec.cantons ? selectedCanton : null;
    const cy = (d) => axisY - 10 - rFull - d.level * gapLevel;
    svg.append('g').selectAll('circle').data(dots).join('circle')
      .attr('class', (d) => 'db-c ' + sideOf(d.c.yes) + (d.c.counted ? '' : ' partial') +
        (sel ? (d.c.abbr === sel ? ' sel' : ' faded') : ''))
      .attr('cx', (d) => d.cx).attr('cy', cy).attr('r', (d) => d.r + (d.c.abbr === sel ? 1.5 : 0));
    if (sel) {   // label the followed canton at the top of the swarm, with a leader to its dot
      const d = dots.find((o) => o.c.abbr === sel);
      const ty = 6 + 11;
      const t = svg.append('text').attr('class', 'db-sel-label').attr('y', ty);
      if (d) {
        if (cy(d) - d.r - 3 > ty + 4) {
          svg.append('line').attr('class', 'db-sel-lead').attr('x1', d.cx).attr('x2', d.cx).attr('y1', ty + 4).attr('y2', cy(d) - d.r - 3);
        }
        t.attr('x', d.cx).attr('text-anchor', 'middle').text(sel + ' ' + pct2(d.c.yes));
        const b = t.node().getBBox();
        if (b.x < 0) t.attr('text-anchor', 'start').attr('x', 0);
        else if (b.x + b.width > W) t.attr('text-anchor', 'end').attr('x', W);
      } else {
        t.attr('x', 0).text((CANTON_NAME[sel] || sel) + ': no results yet');
      }
    }
    svg.append('g').selectAll('circle').data(dots).join('circle')
      .attr('class', 'db-hit db-pick')
      .attr('cx', (d) => d.cx).attr('cy', cy).attr('r', (d) => d.r + 3)
      .attr('data-tip', (d) => (CANTON_NAME[d.c.abbr] || d.c.abbr) + ': ' + pct2(d.c.yes) + ' yes')
      .property('__tip', (d) => () => cantonTip(d.c, spec))
      .on('click', (ev, d) => setCanton(d.c.abbr === selectedCanton ? null : d.c.abbr));

    if (nr != null && people != null) {
      svg.append('line').attr('class', 'db-link').attr('x1', x(nr)).attr('x2', x(people)).attr('y1', axisY).attr('y2', axisY);
    }
    if (nr != null) {
      svg.append('rect').attr('class', 'db-sq').attr('x', x(nr) - 6).attr('y', axisY - 6).attr('width', 12).attr('height', 12).attr('rx', 2)
        .attr('data-tip', spec.nrTip).property('__tip', () => () => nrTipHtml(spec));
    }
    if (people != null) {
      svg.append('circle').attr('class', 'db-ci ' + sideOf(people)).attr('cx', x(people)).attr('cy', axisY).attr('r', 7)
        .attr('data-tip', spec.peopleTip).property('__tip', () => () => peopleTipHtml(spec));
    }

    // direct labels below the axis: the lower value's label runs left, the higher one's right
    const labels = [];
    if (nr != null) labels.push({ v: nr, name: 'National Council' });
    if (people != null) labels.push({ v: people, name: spec.peopleLabel });
    labels.sort((a, b) => a.v - b.v);
    const ly = axisY + 24;
    const texts = labels.map((l, i) => {
      const t = svg.append('text').attr('class', 'db-label').attr('y', ly);
      t.append('tspan').text(l.name + ' ');
      t.append('tspan').attr('class', 'v').text(fmt(l.v));
      const lo = labels.length === 2 && i === 0;
      t.attr('text-anchor', lo ? 'end' : 'start').attr('x', lo ? x(l.v) + 7 : x(l.v) - 7);
      return t;
    });
    texts.forEach((t) => {   // keep inside the plot
      const b = t.node().getBBox();
      if (b.x < 0) t.attr('text-anchor', 'start').attr('x', 0);
      else if (b.x + b.width > W) t.attr('text-anchor', 'end').attr('x', W);
    });
    if (texts.length === 2) {   // still touching: drop the higher label to a second line
      const a = texts[0].node().getBBox(), b = texts[1].node().getBBox();
      if (a.x + a.width + 8 > b.x) { texts[1].attr('y', ly + 16); H += 16; svg.attr('height', H); }
    }
  }

  function placeDumbbells(root, specs) {
    for (const k of [...DUMBBELLS.keys()]) if (!document.contains(k)) DUMBBELLS.delete(k);
    root.querySelectorAll('.dumbbell').forEach((el, i) => { DUMBBELLS.set(el, specs[i]); drawDumbbell(el, specs[i]); });
  }

  // ---------- widest splits ----------
  function renderSplits(finals) {
    const top = finals.filter((v) => v.against)
      .sort((a, b) => Math.abs(b.people - b.nr) - Math.abs(a.people - a.nr) || b.d - a.d)
      .slice(0, 6);
    $('#splits').innerHTML = top.map((v) =>
      '<li class="split">' +
      '<p class="split__meta">' + fmtDate(v.d) + ' · ' + FORM[v.form] + ' · ' + outcome(v) +
      ' · <span tabindex="0" data-tip="Difference between the people’s yes share and the National Council’s, in percentage points.">gap ' +
      f1(Math.abs(v.people - v.nr)) + ' pts</span></p>' +
      '<p class="split__title">' + esc(titleMain(v)) + '</p>' + subtitle(v, null) +
      '<div class="dumbbell"></div></li>').join('');
    placeDumbbells($('#splits'), top.map((v) => ({
      nr: v.nr, people: v.people, peopleLabel: 'People', decimals: 1,
      nrTip: 'National Council, final vote: ' + pct(v.nr) + ' yes (abstentions excluded).',
      peopleTip: 'The people: ' + pct(v.people) + ' yes, official result.',
      peopleNote: 'Official result.',
    })));
  }

  // ---------- vote day ----------
  // data/vote_day.json: the latest vote day up to today (mart.vote_day). While counting, the
  // page re-reads it every few minutes; the pipeline refreshes it every 15 minutes.
  const fmtTime = (iso) => {
    try {
      return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        .format(new Date(iso)) + ' Swiss time';
    } catch (e) { return iso; }
  };
  const cv = (v) => f1(v).replace('.0', '');   // cantonal votes: 17, 8.5

  const TIP = {
    counting: 'The Federal Statistical Office publishes results commune by commune from about noon. This page refreshes every few minutes.',
    provisional: 'All communes are counted. The outcome follows from the Federal Statistical Office’s count and becomes official once Swissvotes records it, usually within days.',
    official: 'Official result, as recorded by Swissvotes.',
    noCantons: 'Won the popular vote but not the majority of cantons that constitutional changes and initiatives also need.',
    tieBreak: 'Asked when an initiative and its counter-proposal are both accepted: which of the two should come into force.',
    cantons: 'Constitutional changes and initiatives also need a majority of the 23 cantonal votes. The six half-cantons (OW, NW, BS, BL, AR, AI) count half. A canton counts once all its communes are in; a tie counts as no.',
  };

  function vdOutcome(r) {
    if (r.form === 5) return { text: 'Tie-break question', tip: TIP.tieBreak, live: r.status === 'counting' };
    if (r.status === 'counting') return { text: 'Counting', tip: TIP.counting, live: true };
    if (r.status === 'final') {
      if (r.accepted) return { text: 'Accepted', tip: TIP.official };
      return r.people > 50 ? { text: 'Rejected (no majority of cantons)', tip: TIP.noCantons } : { text: 'Rejected', tip: TIP.official };
    }
    if (r.fso_accepted == null) return { text: 'Counted', tip: TIP.provisional };
    return { text: (r.fso_accepted ? 'Accepted' : 'Rejected') + ', provisional', tip: TIP.provisional };
  }

  function initCantonPicker() {
    const pick = $('#vd-canton');
    if (!pick || pick.options.length > 1) return;
    Object.entries(CANTON_NAME).forEach(([abbr, name]) => pick.add(new Option(name + ' (' + abbr + ')', abbr)));
    pick.value = selectedCanton || '';
    pick.addEventListener('change', () => setCanton(pick.value || null));
  }

  function renderVoteDay(rows, meta) {
    const sec = $('#vote-day');
    if (!rows || !rows.length) { sec.hidden = true; return false; }
    sec.hidden = false;
    const d = parseDate(rows[0].date);
    const counting = rows.some((r) => r.status === 'counting');
    const allFinal = rows.every((r) => r.status === 'final');
    const units = d3.max(rows, (r) => r.units_total);
    const done = d3.min(rows, (r) => r.units_counted);

    $('#h-voteday').textContent = (allFinal ? 'Latest vote day, ' : 'Vote day, ') + fmtDate(d);
    $('#vd-status').innerHTML = counting
      ? '<span class="pill pill--live" tabindex="0" data-tip="' + esc(TIP.counting) + '">Counting</span><span class="vd__meta">' +
        done.toLocaleString('en') + ' of ' + units.toLocaleString('en') + ' communes in</span><div class="progress"><span></span></div>'
      : '<span class="pill" tabindex="0" data-tip="' + esc(allFinal ? TIP.official : TIP.provisional) + '">' +
        (allFinal ? 'Official result' : 'Counted, provisional') + '</span>';
    if (counting) $('#vd-status .progress span').style.width = (100 * done / units) + '%';
    $('#vd-note').textContent = counting
      ? 'Results so far are provisional. Large cities often report last, so the yes share can still move by several points.'
      : allFinal ? 'Every federal proposal of the day, with the National Council’s final vote, the people’s verdict and each canton.'
        : 'All communes are counted. The official result follows in the coming days.';
    $('#vd-updated').textContent = meta && meta.generated_at ? 'Updated ' + fmtTime(meta.generated_at) : '';

    const specs = [];
    $('#vd-list').innerHTML = rows.map((r) => {
      const o = vdOutcome(r);
      const people = r.status === 'final' && r.people != null ? r.people : r.live_yes;
      const open = r.cantons.filter((c) => !c.counted).map((c) => c.abbr);
      const peopleLabel = r.status === 'counting' ? 'People so far' : 'People';
      specs.push({
        nr: r.nr, people, peopleLabel, decimals: 2, cantons: r.cantons, live: r.status === 'counting',
        counted: r.status === 'counting' ? r.units_counted.toLocaleString('en') + ' of ' + r.units_total.toLocaleString('en') : null,
        peopleNote: r.status === 'final' ? 'Official result.' : r.status === 'counting' ? 'Provisional: results so far.' : 'All communes counted. Provisional until the official result.',
        nrTip: r.nr == null ? '' : 'National Council, final vote: ' + pct2(r.nr) + ' yes (abstentions excluded).',
        peopleTip: r.status === 'final' ? 'The people: ' + pct2(people) + ' yes, official result.'
          : r.status === 'counting' ? 'The people so far: ' + pct2(people) + ' yes, with ' + r.units_counted.toLocaleString('en') + ' of ' + r.units_total.toLocaleString('en') + ' communes counted.'
            : 'The people: ' + pct2(people) + ' yes, all communes counted (provisional until the official result).',
      });
      const cantonsTxt = r.double_majority
        ? '<span tabindex="0" data-tip="' + esc(TIP.cantons + (open.length ? ' Still open: ' + open.join(', ') + '.' : '')) + '">Cantons <b>' +
          cv(r.cantons_yes) + ' yes · ' + cv(r.cantons_no) + ' no</b>' + (r.cantons_open > 0 ? ' · ' + cv(r.cantons_open) + ' open' : '') + '</span>'
        : r.form === 2 ? '<span tabindex="0" data-tip="Laws challenged by referendum need a majority of voters only; the cantons are shown for information.">Majority of voters decides</span>' : '';
      return '<li class="vd__item">' +
        '<div class="vd__head"><span class="vd__meta">' + FORM_ANY[r.form] + '</span><span class="pill' + (o.live ? ' pill--live' : '') +
        '" tabindex="0" data-tip="' + esc(o.tip) + '">' + o.text + '</span></div>' +
        '<p class="vd__title">' + esc(titleMain(Object.assign({}, r, DETAILS.get(r.id) || {}))) + '</p>' +
        subtitle(Object.assign({}, r, DETAILS.get(r.id) || {}), DETAILS.get(r.id)) +
        summaryHtml(DETAILS.get(r.id)) +
        '<div class="dumbbell" role="img" aria-label="' + esc(
          (r.nr != null ? 'National Council ' + pct2(r.nr) + ' yes; ' : '') + peopleLabel + ' ' + pct2(people) + ' yes. Cantons: ' +
          r.cantons.map((c) => c.abbr + ' ' + (c.yes == null ? 'no results yet' : pct2(c.yes))).join(', ')) + '"></div>' +
        (cantonsTxt ? '<p class="vd__vals">' + cantonsTxt + '</p>' : '') + metaLinks(DETAILS.get(r.id), '') + '</li>';
    }).join('');
    initCantonPicker();
    placeDumbbells($('#vd-list'), specs);
    $('#vd-legend').innerHTML =
      '<span><i class="sw sw--with"></i>Canton on the National Council’s side</span>' +
      '<span><i class="sw sw--against"></i>Canton against it</span>' +
      (counting ? '<span><i class="sw sw--partial"></i>Partly counted</span>' : '') +
      '<span>Smaller dots: half-cantons</span>';
    return counting;
  }

  let vdTimer = null;
  function scheduleVoteDay(counting) {
    if (vdTimer) { clearTimeout(vdTimer); vdTimer = null; }
    if (!counting) return;
    vdTimer = setTimeout(async () => {
      const [rows, metaRows] = await Promise.all([getJSON('data/vote_day.json', true), getJSON('data/meta.json', true)]);
      const meta = Array.isArray(metaRows) ? metaRows[0] : metaRows;
      if (rows) scheduleVoteDay(renderVoteDay(rows, meta));
      else scheduleVoteDay(true);
    }, 3 * 60 * 1000);
  }

  // ---------- upcoming ----------
  function renderUpcoming(upcoming) {
    const el = $('#upcoming');
    if (!upcoming.length) {
      el.innerHTML = '<p class="note">No federal votes are scheduled with a final parliamentary vote yet.</p>';
      return;
    }
    const days = d3.groups(upcoming, (v) => v.date).sort((a, b) => d3.ascending(a[0], b[0]));
    el.innerHTML = days.map(([date, items]) => {
      const d = parseDate(date);
      return '<div class="day"><div class="day__date" aria-label="' + fmtDate(d) + '"><b>' + d3.utcFormat('%-d')(d) + '</b><span>' +
        d3.utcFormat('%b %Y')(d) + '</span></div><ul class="day__items">' +
        items.sort((a, b) => a.id - b.id).map((v) =>
          '<li><span class="form">' + FORM[v.form] + '</span><span class="up__title">' + esc(titleMain(v)) + '</span>' + subtitle(v, DETAILS.get(v.id)) +
          summaryHtml(DETAILS.get(v.id)) +
          '<span class="nr" tabindex="0" data-tip="Final vote in the National Council, abstentions excluded. The people vote on ' + fmtDate(parseDate(v.date)) + '."><i class="key key--square"></i>National Council <b>' + pct(v.nr) + '</b> yes</span>' + metaLinks(DETAILS.get(v.id), 'Get informed') + '</li>').join('') +
        '</ul></div>';
    }).join('');
  }

  function showError(err) {
    $('#hero-text').innerHTML = '<span class="error" role="alert">' + esc(err.message) +
      ' If you opened this file directly, serve the folder instead, e.g. <code>python3 -m http.server</code> in <code>site/public</code>.</span>';
  }

  // ---------- boot ----------
  Promise.all([getJSON('data/votes.json'), getJSON('data/decades.json'), getJSON('data/meta.json', true),
               getJSON('data/vote_day.json', true), getJSON('data/proposal_details.json', true)])
    .then(([votes, decades, metaRows, voteDay, details]) => {
      DETAILS = new Map((details || []).map((d) => [d.id, d]));
      const meta = Array.isArray(metaRows) ? metaRows[0] : metaRows;
      VOTES = votes.map((v) => Object.assign({}, v, { d: parseDate(v.date), title: String(v.title).trim() }))
        .map((v) => Object.assign(v, { year: v.d.getUTCFullYear(), final: v.people != null }));
      const finals = VOTES.filter((v) => v.final);
      renderIntro(finals, decades);

      const decEl = $('#chart-decades');
      onWidth(decEl, () => drawDecades(decEl, decades));

      const votesEl = $('#chart-votes');
      const redraw = () => { const rows = filtered(); renderLegend(rows); drawVotes(votesEl, rows); renderTable(rows); };
      renderFilters(redraw);
      renderLegend(filtered());
      onWidth(votesEl, () => drawVotes(votesEl, filtered()));
      $('#table-votes').addEventListener('toggle', () => renderTable(filtered()));

      renderSplits(finals);
      onWidth(root, () => DUMBBELLS.forEach((spec, el) => drawDumbbell(el, spec)));
      const voteDayIds = new Set((voteDay || []).map((r) => r.id));
      scheduleVoteDay(renderVoteDay(voteDay, meta));
      renderUpcoming(VOTES.filter((v) => !v.final && !voteDayIds.has(v.id)));

      const latest = d3.max(finals, (v) => v.d);
      $('#freshness').textContent = 'Official results up to ' + fmtDate(latest) +
        (meta && meta.generated_at ? '; data exported ' + fmtDate(new Date(meta.generated_at)) + '.' : '.');
    })
    .catch(showError);
})();
