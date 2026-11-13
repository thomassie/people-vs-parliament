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
</div>

<div class="pvp__main">
  <section class="hero wrap" aria-label="Headline figure">
    <p class="hero__figure" id="pvp-hero-figure">&nbsp;</p>
    <p class="hero__text" id="pvp-hero-text">Loading the votes&hellip;</p>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-voteday" id="pvp-vote-day" hidden>
    <div class="block__rail">
      <h2 id="pvp-h-voteday">Vote day<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg></h2>
      <div class="vd__status" id="pvp-vd-status"></div>
      <p id="pvp-vd-note"></p>
      <p class="vd__updated" id="pvp-vd-updated"></p>
    </div>
    <div class="block__body">
      <div class="vd__pick pvp-tools"><label class="pvp-pick" for="pvp-vd-canton"><span>Follow a canton</span>
        <select id="pvp-vd-canton"><option value="">All cantons</option></select></label></div>
      <ol class="vd__list" id="pvp-vd-list" aria-live="polite"></ol>
      <div class="vd__legend" id="pvp-vd-legend"></div>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-decades">
    <div class="block__rail">
      <h2 id="pvp-h-decades">Decade by decade<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg></h2>
      <p>Share of votes in which the people&rsquo;s majority went against the National Council&rsquo;s majority.</p>
    </div>
    <div class="block__body">
      <div class="chart" id="pvp-chart-decades"></div>
      <p class="note" id="pvp-note-decades">The current decade is incomplete.</p>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-votes">
    <div class="block__rail">
      <h2 id="pvp-h-votes">Every vote<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg></h2>
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
      <h2 id="pvp-h-splits">The widest splits<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg></h2>
      <p>Votes where the people went against the National Council by the largest margin, on a scale from 0 to 100% yes. Square: the National Council. Circle: the people.</p>
    </div>
    <div class="block__body">
      <ol class="splits" id="pvp-splits"></ol>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-communes" id="pvp-communes">
    <div class="block__rail">
      <h2 id="pvp-h-communes">Commune by commune<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg></h2>
      <p id="pvp-cm-intro">How often each commune&rsquo;s majority went against the National Council&rsquo;s majority in recent federal votes.</p>
      <p id="pvp-cm-why" hidden></p>
    </div>
    <div class="block__body">
      <div class="cm-tools pvp-tools">
        <label class="pvp-find" for="pvp-cm-find"><svg class="pvp-mag" viewBox="0 0 16 16" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.75"/><line x1="10" y1="10" x2="14.5" y2="14.5"/></svg><span>Find a commune</span>
          <input type="search" id="pvp-cm-find" list="pvp-cm-list" placeholder="e.g. Winterthur" autocomplete="off" spellcheck="false"></label>
        <datalist id="pvp-cm-list"></datalist>
      </div>
      <div class="cm-legend" id="pvp-cm-legend"></div>
      <div class="chart cm-map" id="pvp-chart-communes"><p class="note">Loading the commune map&hellip;</p></div>
      <p class="note" id="pvp-cm-status" aria-live="polite">Hover or tap a commune for details.</p>
      <h3 class="cm-sub" id="pvp-h-income">Income and voting against parliament</h3>
      <div class="seg" role="group" aria-label="Income measure" id="pvp-cm-measure" hidden></div>
      <p class="cm-lede" id="pvp-cm-income-lede"></p>
      <div class="chart" id="pvp-chart-income"></div>
      <p class="note" id="pvp-cm-income-note"></p>
    </div>
  </section>

  <section class="block wrap" aria-labelledby="pvp-h-next">
    <div class="block__rail">
      <h2 id="pvp-h-next">Next on the ballot<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg></h2>
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
      <li>Communes: results of communes that have since merged are added together and shown on today&rsquo;s communes (official commune register). A few small communes are counted together with a neighbour and have no result of their own.</li>
      <li>Income is the median taxable income per tax return, estimated from the Federal Tax Administration&rsquo;s income classes (direct federal tax, residents taxed all year). Married couples file one return. Tax statistics leave out international civil servants and most foreign residents taxed at source, which lowers the figures most in Geneva.</li>
      <li>Residents are the permanent resident population at the end of the year (Federal Statistical Office), Swiss and foreign, including people who cannot vote.</li>
      <li>Voters are the ballots cast in a commune per proposal, averaged over the same votes as the map. A group&rsquo;s share of all voters is its voters divided by the voters of all communes. The Swiss abroad, who vote through their canton (about 1% of ballots), are not included.</li>
    </ul>
    <p class="credit">Across Europe: <a href="https://thomassie.me/projects/poverty-and-the-vote/">Poverty and the Vote</a> asks whether poorer regions vote less, and more for the far right, in the 2024 European election.</p>
    <p class="credit">Data: <a href="https://swissvotes.ch/page/dataset">Swissvotes</a>, Année politique suisse, University of Bern (CC BY 4.0). Commune results: Federal Statistical Office (FSO). Commune boundaries: FSO, generalised boundaries. Income: Federal Tax Administration (ESTV), direct federal tax statistics. Residents: FSO, STATPOP. <span id="pvp-freshness"></span></p>
  </div>
</section>`;
  // data-header="false": the host page shows its own label, title and description, so drop the whole masthead
  if (root.dataset.header === 'false') root.querySelector('.masthead').remove();

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
    const H = 280, m = { t: 30, r: 12, b: 30, l: 34 };   // r: room for the last centred labels on phones
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
    const m = { t: 30, r: 18, b: 46, l: 40 };   // r: room for the centred "100%" tick label
    // square plot (both axes 0-100%, so the diagonal stays at 45 degrees) as wide as the column
    const side = Math.max(220, Math.min(W - m.l - m.r, 900));
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
    if (CM.redrawMap) CM.redrawMap();
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

    $('#h-voteday').innerHTML = esc((allFinal ? 'Latest vote day, ' : 'Vote day, ') + fmtDate(d)) + '<svg class="title-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5"/></svg>';
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

  // ---------- commune by commune: a map of voting against parliament, and income ----------
  // data/communes.json: one row per commune polygon (today's communes); data/commune_summary.json:
  // reference figures; data/communes.topo.json: BFS generalised boundaries in LV95 metres, decoded
  // below (no extra library). Loaded only when the section comes near the screen.
  const CM = { rows: [], byId: new Map(), featById: new Map(), sum: null, nat: null, sorted: [], pinned: null, focus: null, band: null };
  const CM_THRESH = [15, 20, 25, 30, 35, 40];   // share of votes against the National Council, %
  const CM_CITIES = [261, 6621, 2701, 5586, 351, 230, 5192, 1061, 3203];   // Zurich, Geneva, Basel, Lausanne, Bern, Winterthur, Lugano, Lucerne, St. Gallen
  const cmShare = (r) => (r && r.n ? (100 * r.against) / r.n : null);
  const cmBin = (v) => d3.bisectRight(CM_THRESH, v);
  const chf = (v) => 'CHF ' + d3.format(',')(Math.round(v / 100) * 100);
  const fmtMonth = d3.utcFormat('%B %Y');
  // Two views of income for the bubble chart, both from the same ESTV source and tax year:
  // the typical return (median), and where top earners live (federal tax per resident).
  const MEASURES = {
    median: { key: 'income_median', button: 'Median income per tax return', log: false, corr: 'income_alignment_rank_corr',
      axis: 'Median taxable income per tax return, CHF →', axisShort: 'Median income per tax return, CHF →',
      tick: (v) => d3.format(',')(v / 1000) + 'k' },
    tax: { key: 'tax_pc', button: 'Federal tax per resident', log: true, corr: 'tax_alignment_rank_corr',
      axis: 'Direct federal tax per resident, CHF, log scale →', axisShort: 'Federal tax per resident, CHF, log →', tick: (v) => (v >= 1000 ? d3.format(',')(v / 1000) + 'k' : String(v)) },
  };
  let cmMeasure = 'median';
  try { const v = localStorage.getItem('pvp-cm-measure'); if (MEASURES[v]) cmMeasure = v; } catch (e) { /* storage unavailable */ }
  const xv = (r) => (r ? r[MEASURES[cmMeasure].key] : null);

  function topoDecode(topo) {
    const t = topo.transform;
    const arcs = topo.arcs.map((arc) => {
      let x = 0, y = 0;
      return arc.map((p) => (t ? [(x += p[0]) * t.scale[0] + t.translate[0], (y += p[1]) * t.scale[1] + t.translate[1]] : p));
    });
    const ring = (ids) => ids.reduce((pts, i, k) => {
      const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
      return pts.concat(k ? a.slice(1) : a);
    }, []);
    const geom = (g) => (g.type === 'Polygon' ? { type: 'Polygon', coordinates: g.arcs.map(ring) }
      : g.type === 'MultiPolygon' ? { type: 'MultiPolygon', coordinates: g.arcs.map((p) => p.map(ring)) } : null);
    return (name) => (topo.objects[name] ? topo.objects[name].geometries : [])
      .map((g) => ({ type: 'Feature', id: g.id, properties: g.properties || {}, geometry: geom(g) }))
      .filter((f) => f.geometry);
  }
  const fc = (features) => ({ type: 'FeatureCollection', features });

  function cmRank(share) {   // percent of communes that went against parliament less often
    return Math.round((100 * d3.bisectLeft(CM.sorted, share)) / CM.sorted.length);
  }

  function cmTip(r) {
    const share = cmShare(r);
    let html = '<p class="tt__meta">' + esc(CANTON_NAME[r.canton] || r.canton) +
      (r.n ? ' · ' + r.n + ' votes since ' + CM.since : '') + '</p><p class="tt__title">' + esc(r.name) + '</p>';
    if (share == null) {
      html += '<p class="tt__out">' + (r.has_results ? 'Too few votes on record for a share.'
        : 'Its votes are counted together with a neighbouring commune, so there is no separate result.') + '</p>';
    } else {
      html += '<dl class="tt__rows">' + row('Against the National Council', r.against + ' of ' + r.n + ' (' + f1(share) + '%)') +
        (CM.nat != null ? row('vs Switzerland', signed(share - CM.nat, 1)) : '') + '</dl>' + cmDecades(r);
    }
    html += '<dl class="tt__rows">' + (r.pop ? row('Residents', d3.format(',')(r.pop)) : '') +
      (r.voters ? row('Voters per vote', d3.format(',')(r.voters)) : '') +
      row('Median taxable income per tax return', r.income_median ? chf(r.income_median) : 'too few returns') +
      (r.tax_pc != null ? row('Federal tax per resident', 'CHF ' + d3.format(',')(r.tax_pc)) : '') + '</dl>';
    if (share != null) html += '<p class="tt__out">More often against parliament than ' + cmRank(share) + '% of communes.</p>';
    return html;
  }

  // Small column chart for the tooltip: the commune's share of votes against the National Council
  // by decade (red columns, as in "Decade by decade"), Switzerland over the same votes as a dark tick.
  // Commune results start in 1981; a decade without the commune's own result stays empty.
  function cmDecades(r) {
    const ref = CM.sum && CM.sum.decades;
    if (!ref || !r.dec || r.dec.length !== ref.length) return '';
    const pct = (n, a) => (n ? (100 * a) / n : null);
    const vals = r.dec.map(([n, a]) => pct(n, a));
    const nat = ref.map((d) => pct(d.proposals, d.proposals_against_nr));
    const W = 284, top = 16, base = 84, H = base + 16;
    const max = Math.max(50, Math.ceil(d3.max([...vals, ...nat]) / 10) * 10);
    const x = d3.scaleBand().domain(d3.range(ref.length)).range([0, W]).paddingInner(0.38).paddingOuter(0.12);
    const y = d3.scaleLinear().domain([0, max]).range([base, top]);
    const bw = x.bandwidth();
    let g = '<line class="tt__dec-base" x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '"></line>';
    ref.forEach((d, i) => {
      const x0 = x(i), v = vals[i], s = nat[i], cx = x0 + bw / 2;
      if (v != null) g += '<path class="tt__dec-bar" d="' + colPath(x0, bw, y(v), base, 3) + '"></path>';
      if (s != null) g += '<line class="tt__dec-nat" x1="' + (x0 - 4) + '" x2="' + (x0 + bw + 4) + '" y1="' + y(s) + '" y2="' + y(s) + '"></line>';
      const ly = Math.min(v != null ? y(v) : base, s != null ? y(s) : base) - 5;
      g += '<text class="tt__dec-val" x="' + cx + '" y="' + ly + '">' + (v != null ? f1(v) : '–') + '</text>' +
        '<text class="tt__dec-lab" x="' + cx + '" y="' + (base + 13) + '">' + d.decade + 's</text>';
    });
    const label = 'Share of votes against the National Council by decade: ' + ref.map((d, i) => d.decade + 's ' +
      (vals[i] != null ? f1(vals[i]) + '%' : 'no own result') + (nat[i] != null ? ' (Switzerland ' + f1(nat[i]) + '%)' : '')).join(', ') + '.';
    return '<div class="tt__dec"><p class="tt__dec-head">By decade, % of votes against</p>' +
      '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + g + '</svg>' +
      '<p class="tt__dec-key"><span><i class="tt__dec-sw"></i>' + esc(r.name) + '</span><span><i class="tt__dec-tick"></i>Switzerland</span>' +
      (CM.sum.decades_from ? '<span>since ' + d3.utcFormat('%b %Y')(parseDate(CM.sum.decades_from)) + '</span>' : '') + '</p></div>';
  }

  function cmStatus(r) {
    const share = cmShare(r);
    return r.name + ' (' + r.canton + '): ' + (share == null ? 'no separate result.'
      : r.against + ' of ' + r.n + ' votes against the National Council (' + f1(share) + '%), more often than ' + cmRank(share) + '% of communes.') +
      (r.pop ? ' ' + d3.format(',')(r.pop) + ' residents.' : '') +
      (r.income_median ? ' Median taxable income per tax return ' + chf(r.income_median) + '.' : '') +
      (r.tax_pc != null ? ' Federal tax per resident CHF ' + d3.format(',')(r.tax_pc) + '.' : '');
  }

  function cmFocus(id, source, xy) {
    CM.focus = id;
    const small = $('#chart-communes').clientWidth < 600;   // on phones the status line carries a search result
    if (CM.map) CM.map.mark(id, source === 'map' || (source === 'find' && !small), xy);
    if (CM.inc) CM.inc.mark(id, source === 'income', xy);
    if (CM.rain) CM.rain.mark(id, source === 'rain', xy);
    const r = id != null ? CM.byId.get(id) : null;
    if (source === 'find') $('#cm-status').textContent = r ? cmStatus(r) : 'No commune of that name.';
  }

  const plainName = (n) => n.replace(/\s*\(.*\)$/, '').replace(/^Genève$/, 'Geneva').replace(/^Zürich$/, 'Zurich').replace(/^Luzern$/, 'Lucerne');
  const bandLabel = (i) => (i === 0 ? 'Under ' + CM_THRESH[0] + '%' : i === CM_THRESH.length ? CM_THRESH[i - 1] + '% or more'
    : CM_THRESH[i - 1] + '–' + CM_THRESH[i] + '%');

  // One band selected (click in the raincloud): its communes keep their colour on the map and are
  // marked in the rain and the bubble chart; everything else steps back.
  function cmApplyBand() {
    const b = CM.band;
    const inBand = (r) => cmShare(r) != null && cmBin(cmShare(r)) === b;
    const mark = (sel, rowOf) => d3.select(root).selectAll(sel)
      .classed('cm-in', (d) => b != null && inBand(rowOf(d)))
      .classed('cm-out', (d) => b != null && !inBand(rowOf(d)));
    mark('#pvp-chart-communes path.cm-c', (f) => CM.byId.get(f.id));
    mark('#pvp-cm-legend .cm-rain-dots circle', (p) => p.r);
    mark('#pvp-chart-income circle.cm-bubble', (r) => r);
    d3.select(root).selectAll('#pvp-cm-legend rect.cm-band')
      .classed('cm-sel', (i) => b != null && i === b).classed('cm-unsel', (i) => b != null && i !== b);
    d3.select(root).selectAll('#pvp-cm-legend .cm-strip rect').attr('aria-pressed', (i) => String(i === b));
  }
  // People, not area: voters per vote in a band (ballots cast per proposal, averaged) and their
  // share of all voters in the communes. Null when the data carry no voters.
  function cmVoters(b) {
    if (!CM.votersTotal) return null;
    let v = 0;
    CM.rows.forEach((r) => { const s = cmShare(r); if (s != null && r.voters && cmBin(s) === b) v += r.voters; });
    return { v, pct: (100 * v) / CM.votersTotal };
  }
  const roughly = (v) => d3.format(',')(v >= 100000 ? Math.round(v / 1000) * 1000 : v >= 10000 ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10);
  function cmSetBand(i) {
    CM.band = i == null || CM.band === i ? null : i;
    cmApplyBand();
    const n = CM.band == null ? 0 : CM.sorted.filter((v) => cmBin(v) === CM.band).length;
    const vo = CM.band == null ? null : cmVoters(CM.band);
    $('#cm-status').textContent = CM.band == null ? 'Hover or tap a commune for details.'
      : d3.format(',')(n) + ' communes went against the National Council in ' + bandLabel(CM.band).replace('Under', 'under') + ' of votes.' +
        (vo ? ' On average about ' + roughly(vo.v) + ' people voted there on each proposal, ' + f1(vo.pct) + '% of all voters.' : '') +
        ' They are highlighted on the map, in the dots above and in the bubble chart. Click the band again or press Escape to show all.';
  }

  // Raincloud: how the communes spread along the share of votes against the National Council.
  // Cloud = density, filled with the map's bands so it doubles as the colour key; box = median and
  // middle half, whiskers = middle 90%; rain = one dot per commune, as an upside-down dot plot.
  // The axis is linear in percent.
  function drawRaincloud(el) {
    const W = Math.round(el.clientWidth);
    if (!W) return;
    el.innerHTML = '<p class="cm-legend-title">Share of votes against the National Council: one dot per commune</p>';
    const tip = tooltip(el);
    const vals = CM.sorted, n = vals.length;
    const pts = CM.rows.map((r) => ({ r, v: cmShare(r) })).filter((p) => p.v != null);
    const small = W < 480;
    const max = Math.max(55, Math.ceil(d3.max(vals) / 5) * 5);
    const x = d3.scaleLinear().domain([0, max]).range([6, W - 6]);
    const top = 24, cloudH = small ? 46 : 60, boxY = top + cloudH + 9, boxH = 9;
    const rainY = boxY + boxH + 10, rainH = small ? 60 : 80, stripY = rainY + rainH + 9, stripH = 8, H = stripY + stripH + 20;
    const q = (p) => d3.quantileSorted(vals, p);
    const [q05, q25, q50, q75, q95] = [q(0.05), q(0.25), q(0.5), q(0.75), q(0.95)];

    // density: Gaussian kernel, Silverman's bandwidth
    const bw = 1.06 * d3.deviation(vals) * Math.pow(n, -0.2);
    const dens = d3.range(0, max + 1e-9, max / 220).map((g) => {
      let sum = 0;
      for (let i = 0; i < n; i += 1) { const u = (g - vals[i]) / bw; sum += Math.exp(-0.5 * u * u); }
      return [g, sum];
    });
    const yd = d3.scaleLinear().domain([0, d3.max(dens, (d) => d[1])]).range([top + cloudH, top]);
    const bands = [0, ...CM_THRESH, max];
    const counts = bands.slice(1).map(() => 0);
    vals.forEach((v) => { counts[cmBin(v)] += 1; });

    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('role', 'group')
      .attr('aria-label', 'Distribution of ' + d3.format(',')(n) + ' communes by share of votes against the National Council: median ' +
        f1(q50) + '%, middle half ' + f1(q25) + ' to ' + f1(q75) + '%' + (CM.nat != null ? '; Switzerland as a whole ' + f1(CM.nat) + '%.' : '.'));
    svg.append('clipPath').attr('id', 'pvp-cm-cloud').append('path')
      .attr('d', d3.area().x((d) => x(d[0])).y0(top + cloudH).y1((d) => yd(d[1])).curve(d3.curveBasis)(dens));
    const band = (y0, h) => (g) => g.selectAll('rect').data(d3.range(bands.length - 1)).join('rect')
      .attr('class', (i) => 'cm-c cm-band cm-b' + i)
      .attr('x', (i) => x(bands[i])).attr('width', (i) => Math.max(0, x(bands[i + 1]) - x(bands[i]))).attr('y', y0).attr('height', h);
    svg.append('g').attr('clip-path', 'url(#pvp-cm-cloud)').call(band(top, cloudH));
    svg.append('path').attr('class', 'cm-cloud-line').attr('d', d3.line().x((d) => x(d[0])).y((d) => yd(d[1])).curve(d3.curveBasis)(dens));

    const gb = svg.append('g').attr('class', 'cm-box');
    const mid = boxY + boxH / 2;
    gb.append('line').attr('x1', x(q05)).attr('x2', x(q25)).attr('y1', mid).attr('y2', mid);
    gb.append('line').attr('x1', x(q75)).attr('x2', x(q95)).attr('y1', mid).attr('y2', mid);
    [q05, q95].forEach((v) => gb.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', boxY + 1).attr('y2', boxY + boxH - 1));
    gb.append('rect').attr('x', x(q25)).attr('width', x(q75) - x(q25)).attr('y', boxY).attr('height', boxH);
    gb.append('line').attr('class', 'cm-box-median').attr('x1', x(q50)).attr('x2', x(q50)).attr('y1', boxY - 2).attr('y2', boxY + boxH + 2);

    // Rain: communes with the same share form one column hanging from the top, the most populous
    // first. The step between dots shrinks until the longest column fits, so dots may overlap and
    // a column's length counts its communes.
    const r0 = small ? 1.3 : 1.8;
    const cols = d3.group(pts, (p) => p.v.toFixed(4));
    const longest = d3.max(cols.values(), (c) => c.length) || 1;
    const step = Math.min(2 * r0 + 1, (rainH - 2 * r0) / Math.max(1, longest - 1));
    const yOf = new Map();
    cols.forEach((c) => c.sort((a, b) => (b.r.pop || 0) - (a.r.pop || 0) || d3.ascending(a.r.name, b.r.name))
      .forEach((p, k) => yOf.set(p.r.id, rainY + r0 + k * step)));
    const ry = (id) => yOf.get(id);
    svg.append('g').attr('class', 'cm-rain-dots').selectAll('circle').data(pts).join('circle')
      .attr('cx', (p) => x(p.v)).attr('cy', (p) => ry(p.r.id)).attr('r', r0);

    svg.append('g').attr('class', 'cm-strip').call(band(stripY, stripH)).selectAll('rect')
      .attr('tabindex', 0).attr('role', 'button').attr('aria-pressed', 'false')
      .attr('aria-label', (i) => bandLabel(i) + ' of votes against: ' + d3.format(',')(counts[i]) + ' communes' +
        (cmVoters(i) ? ' with ' + f1(cmVoters(i).pct) + '% of voters' : '') + '. Highlight them on the map.')
      .on('keydown', (ev, i) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cmSetBand(i); } })
      .on('focus', (ev, i) => tip.show(bandTip(i), x((bands[i] + bands[i + 1]) / 2), stripY))
      .on('blur', () => tip.hide());
    const ticks = [0, ...CM_THRESH, 50].filter((t) => t <= max);
    svg.append('g').selectAll('text').data(ticks).join('text')
      .attr('x', (t) => x(t)).attr('y', stripY + stripH + 14).attr('text-anchor', (t) => (t === 0 ? 'start' : 'middle'))
      .text((t, i) => t + (i === ticks.length - 1 ? '%' : ''));

    if (CM.nat != null) {   // Switzerland as a whole
      const nx = x(CM.nat);
      svg.append('line').attr('class', 'cm-natline').attr('x1', nx).attr('x2', nx).attr('y1', top - 6).attr('y2', stripY + stripH);
      svg.append('text').attr('class', 'cm-natlabel').attr('x', Math.min(Math.max(nx, 62), W - 62)).attr('y', top - 10)
        .attr('text-anchor', 'middle').text('Switzerland ' + f1(CM.nat) + '%');
    }

    const hlDot = svg.append('circle').attr('class', 'cm-hl-dot').attr('r', r0 + 2.4).attr('visibility', 'hidden');
    const hlLab = svg.append('text').attr('class', 'cm-hl-label').attr('dy', '0.32em').attr('visibility', 'hidden');
    CM.rain = {
      mark(id, show) {
        const r = id != null ? CM.byId.get(id) : null, v = cmShare(r);
        if (v == null) { hlDot.attr('visibility', 'hidden'); hlLab.attr('visibility', 'hidden'); tip.hide(); return; }
        const cx = x(v), cy = ry(id), right = cx < W * 0.66;
        hlDot.attr('cx', cx).attr('cy', cy).attr('visibility', 'visible');
        hlLab.attr('x', cx + (right ? 8 : -8)).attr('y', cy).attr('text-anchor', right ? 'start' : 'end')
          .text(plainName(r.name) + ' ' + f1(v) + '%').attr('visibility', 'visible');
        if (show) tip.show(cmTip(r), cx, cy); else tip.hide();
      },
    };

    const bandTip = (i) => '<p class="tt__title">' + bandLabel(i) + ' of votes against</p><dl class="tt__rows">' +
      row('Communes', d3.format(',')(counts[i])) + row('Share of communes', f1((100 * counts[i]) / n) + '%') +
      (cmVoters(i) ? row('Voters per vote', 'about ' + roughly(cmVoters(i).v)) + row('Share of voters', f1(cmVoters(i).pct) + '%') : '') + '</dl>' +
      '<p class="tt__hint">' + (CM.band === i ? 'Click again to show all communes.' : 'Click to highlight these communes on the map.') + '</p>';
    const boxTip = '<p class="tt__title">The typical commune</p><dl class="tt__rows">' +
      row('Median', f1(q50) + '%') + row('Middle half', f1(q25) + '–' + f1(q75) + '%') + row('Middle 90%', f1(q05) + '–' + f1(q95) + '%') +
      (CM.nat != null ? row('Switzerland as a whole', f1(CM.nat) + '%') : '') +
      '</dl><p class="tt__out">Box: the middle half of communes. Whiskers: the middle 90%.</p>';
    const del = d3.Delaunay.from(pts, (p) => x(p.v), (p) => ry(p.r.id));
    const inBandArea = (py) => (py >= top - 6 && py < boxY - 4) || py > rainY + rainH + 5;   // cloud or colour strip
    svg.append('rect').attr('class', 'overlay cm-rain-overlay').attr('x', 0).attr('y', top - 6).attr('width', W).attr('height', stripY + stripH + 16 - top + 6)
      .attr('aria-hidden', 'true')
      .on('click', (ev) => {
        const [px, py] = d3.pointer(ev);
        if (inBandArea(py)) { cmSetBand(cmBin(x.invert(px))); tip.show(bandTip(cmBin(x.invert(px))), px, py); }
      })
      .on('pointermove pointerdown', (ev) => {
        const [px, py] = d3.pointer(ev);
        if (py >= rainY - 5 && py <= rainY + rainH + 5) {
          const p = pts[del.find(px, py)];
          if (p && Math.hypot(x(p.v) - px, ry(p.r.id) - py) <= 10) { CM.pinned = null; cmFocus(p.r.id, 'rain'); return; }
        }
        if (CM.pinned == null) cmFocus(null, 'rain');
        if (py >= boxY - 4 && py <= boxY + boxH + 4 && px >= x(q05) - 6 && px <= x(q95) + 6) tip.show(boxTip, px, boxY);
        else if (inBandArea(py)) tip.show(bandTip(cmBin(x.invert(px))), px, py);
        else tip.hide();
      })
      .on('pointerleave', () => { tip.hide(); if (CM.pinned == null) cmFocus(null, 'rain'); });

    const none = CM.rows.filter((r) => !r.has_results).length;
    const key = document.createElement('p');
    key.className = 'cm-key';
    key.innerHTML = (none ? '<span><i class="cm-swatch cm-swatch--none"></i>No separate result (' + none + ' communes)</span>' : '') +
      '<span>Box: middle half of communes · whiskers: middle 90%</span>' +
      '<span>Dots hang in columns: the longer the column, the more communes</span>';
    el.appendChild(key);
    if (CM.focus != null) CM.rain.mark(CM.focus, false);
    cmApplyBand();
  }

  function drawCommuneMap(el) {
    const W = Math.round(el.clientWidth);
    if (!W) return;
    el.querySelectorAll('svg, p.note').forEach((x) => x.remove());
    const tip = el._tip || (el._tip = tooltip(el));
    tip.hide();
    const proj = d3.geoIdentity().reflectY(true).fitWidth(W, CM.country);
    const path = d3.geoPath(proj);
    const H = Math.ceil(path.bounds(CM.country)[1][1] + 2);
    const svg = d3.select(el).insert('svg', ':first-child')
      .attr('width', W).attr('height', H).attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('class', W < 600 ? 'cm-svg cm-svg--small' : 'cm-svg')
      .attr('role', 'img')
      .attr('aria-label', 'Map of ' + d3.format(',')(CM.feats.length) + ' communes, shaded by how often their majority went against the National Council since ' + CM.since + '. A stronger red means more often. Use the search box above to read one commune.');
    const communes = svg.append('g');
    communes.selectAll('path').data(CM.feats).join('path')
      .attr('d', path)
      .attr('class', (f) => { const v = cmShare(CM.byId.get(f.id)); return v == null ? 'cm-c cm-none' : 'cm-c cm-b' + cmBin(v); });
    svg.append('path').datum(CM.lakes).attr('class', 'cm-lake').attr('d', path);
    svg.append('path').datum(CM.cantons).attr('class', 'cm-canton').attr('d', path);
    svg.append('path').datum(CM.country).attr('class', 'cm-country').attr('d', path);
    if (selectedCanton) {
      const nr = Object.keys(CANTON_NAME).indexOf(selectedCanton) + 1;
      const f = CM.cantons.features.find((c) => c.id === nr);
      if (f) svg.append('path').datum(f).attr('class', 'cm-follow').attr('d', path);
    }
    if (W >= 520) {
      const labels = svg.append('g').attr('class', 'cm-cities');
      CM_CITIES.map((id) => CM.featById.get(id)).filter(Boolean).forEach((f) => {
        const [cx, cy] = path.centroid(f), r = CM.byId.get(f.id);
        const name = (r ? r.name : '').replace(/\s*\(.*\)$/, '').replace(/^Genève$/, 'Geneva').replace(/^Luzern$/, 'Lucerne').replace(/^Zürich$/, 'Zurich');
        labels.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 2);
        labels.append('text').attr('x', cx + 5).attr('y', cy).attr('dy', '0.32em').text(name);
      });
    }
    const hl = svg.append('path').attr('class', 'cm-hl');
    CM.map = {
      mark(id, show, xy) {
        const f = id != null ? CM.featById.get(id) : null;
        hl.attr('d', f ? path(f) : null);
        if (!f || !show) { tip.hide(); return; }
        const r = CM.byId.get(id) || { id, name: 'Commune ' + id, canton: '' };
        const [cx, cy] = xy || path.centroid(f);
        tip.show(cmTip(r), cx, cy);
      },
    };
    communes
      .on('pointermove', (ev) => {
        if (CM.pinned != null) return;
        const f = d3.select(ev.target).datum();
        if (f && f.id != null) cmFocus(f.id, 'map', d3.pointer(ev, el));
      })
      .on('pointerleave', () => { if (CM.pinned == null) cmFocus(null, 'map'); })
      .on('click', (ev) => {
        const f = d3.select(ev.target).datum();
        if (!f) return;
        CM.pinned = CM.pinned === f.id ? null : f.id;
        cmFocus(CM.pinned == null ? null : f.id, 'map', d3.pointer(ev, el));
      });
    if (CM.pinned != null) cmFocus(CM.pinned, 'map');
    cmApplyBand();
  }

  function drawIncome(el) {
    const W = Math.round(el.clientWidth);
    if (!W) return;
    el.querySelectorAll('svg').forEach((x) => x.remove());
    const tip = el._tip || (el._tip = tooltip(el));
    tip.hide();
    const M = MEASURES[cmMeasure];
    const rows = CM.rows.filter((r) => xv(r) != null && xv(r) > 0 && cmShare(r) != null);
    const keyH = rows.some((r) => r.pop) ? (W < 480 ? 24 : 32) : 0;   // row for the bubble-size key
    const m = { t: 30 + keyH, r: 16, b: 46, l: 42 };
    const H = Math.round(Math.max(260, Math.min(440, W * 0.6))) + keyH;
    // log axis: round the ends to 1-2-5 steps (100 ... 20,000) instead of whole powers of ten
    const step125 = (v, up) => { const p = 10 ** Math.floor(Math.log10(v)); const k = [1, 2, 5, 10].map((f) => f * p);
      return up ? k.find((t) => t >= v) : k.slice().reverse().find((t) => t <= v); };
    const [lo, hi] = d3.extent(rows, xv);
    const x = M.log ? d3.scaleLog().domain([step125(lo, false), step125(hi, true)]).range([m.l, W - m.r])
      : d3.scaleLinear().domain([lo, hi]).nice().range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([0, Math.max(50, Math.ceil(d3.max(rows, cmShare) / 10) * 10)]).range([H - m.b, m.t]);
    const svg = d3.select(el).insert('svg', ':first-child').attr('width', W).attr('height', H).attr('viewBox', '0 0 ' + W + ' ' + H);
    const g = svg.append('g').attr('class', 'grid');
    g.selectAll('line.h').data(y.ticks(5)).join('line').attr('class', 'h')
      .attr('x1', m.l).attr('x2', W - m.r).attr('y1', (d) => Math.round(y(d)) + 0.5).attr('y2', (d) => Math.round(y(d)) + 0.5);
    svg.append('g').selectAll('text').data(y.ticks(5)).join('text')
      .attr('x', m.l - 8).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end').text((d) => d + '%');
    const xt = M.log ? [100, 200, 500, 1000, 2000, 5000, 10000, 20000].filter((t) => t >= x.domain()[0] && t <= x.domain()[1] && (W >= 480 || [100, 1000, 10000].includes(t)))
      : x.ticks(W < 480 ? 4 : 7);
    svg.append('g').selectAll('text').data(xt).join('text')
      .attr('x', (d) => x(d)).attr('y', H - m.b + 18).attr('text-anchor', 'middle').text(M.tick);
    g.selectAll('line.v').data(xt).join('line').attr('class', 'v')
      .attr('y1', m.t).attr('y2', H - m.b).attr('x1', (d) => Math.round(x(d)) + 0.5).attr('x2', (d) => Math.round(x(d)) + 0.5);
    svg.append('text').attr('class', 'axis-title').attr('x', W - m.r).attr('y', H - m.b + 38).attr('text-anchor', 'end').text(W < 480 ? M.axisShort : M.axis);
    svg.append('text').attr('class', 'axis-title').attr('x', m.l).attr('y', m.t - 14).text('↑ Votes against the National Council');
    if (CM.nat != null) {
      svg.append('line').attr('class', 'cm-ref').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(CM.nat)).attr('y2', y(CM.nat));
      svg.append('text').attr('class', 'cm-reflabel').attr('x', W - m.r).attr('y', y(CM.nat) - 6).attr('text-anchor', 'end')
        .text('Switzerland as a whole ' + f1(CM.nat) + '%');
    }
    // Bubbles: residents. Area true to population would leave a few city discs and dust, so the
    // radius grows with the fourth root of population (area with its square root).
    const rMax = W < 480 ? 11 : 18;
    const rs = d3.scalePow().exponent(0.25).domain([0, d3.max(rows, (r) => r.pop || 0) || 1]).range([0, rMax]);
    const rad = (r) => (r.pop ? Math.max(1, rs(r.pop)) : 1.5);
    svg.append('g').selectAll('circle').data(rows.slice().sort((a, b) => (b.pop || 0) - (a.pop || 0))).join('circle')
      .attr('class', 'cm-bubble').attr('cx', (r) => x(xv(r))).attr('cy', (r) => y(cmShare(r))).attr('r', rad);
    if (rows.some((r) => r.pop)) {   // size key: a row above the plot, circles side by side
      const keys = [1000, 10000, 100000].filter((k) => k <= rs.domain()[1]);
      const base = keyH - 4;
      const gk = svg.append('g').attr('class', 'cm-sizekey');
      let kx = m.l;
      gk.append('text').attr('x', kx).attr('y', base - 3).text('Residents');
      kx += 66;
      keys.forEach((k) => {
        const rk = rs(k);
        gk.append('circle').attr('cx', kx + rk).attr('cy', base - rk).attr('r', rk);
        gk.append('text').attr('x', kx + 2 * rk + 5).attr('y', base - 3).text(d3.format(',')(k));
        kx += 2 * rk + 5 + d3.format(',')(k).length * 6.4 + 14;
      });
    }
    // trend: communes cut into ten equal groups along the horizontal axis; each point sits at the
    // group's median income (skewed, so the median) and its mean share of votes against (shares are
    // counts out of ~92, so a median would snap to those steps and draw false stairs)
    const byIncome = rows.slice().sort((a, b) => xv(a) - xv(b));
    const trend = d3.range(10).map((k) => {
      const part = byIncome.slice(Math.floor((k * byIncome.length) / 10), Math.floor(((k + 1) * byIncome.length) / 10));
      return [d3.median(part, xv), d3.mean(part, cmShare)];
    });
    svg.append('path').attr('class', 'cm-trend').attr('d', d3.line().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX)(trend));
    // label the largest cities: first free spot right, left, above or below the dot
    const big = rows.slice().sort((a, b) => (b.pop || b.taxpayers || 0) - (a.pop || a.taxpayers || 0)).slice(0, W < 480 ? 3 : 6);
    const lab = svg.append('g').attr('class', 'cm-cities');
    const pts = big.map((r) => ({ r, cx: x(xv(r)), cy: y(cmShare(r)), rr: rad(r) }));
    pts.forEach((p) => lab.append('circle').attr('cx', p.cx).attr('cy', p.cy).attr('r', 2.5));
    const boxes = pts.map((p) => ({ x0: p.cx - 3, x1: p.cx + 3, y0: p.cy - 3, y1: p.cy + 3 }));
    const hits = (b) => boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    pts.forEach((p) => {
      const name = p.r.name.replace(/\s*\(.*\)$/, '').replace(/^Genève$/, 'Geneva').replace(/^Zürich$/, 'Zurich');
      const tw = name.length * 6.6 + 2;
      const o = Math.max(6, p.rr + 4);
      const spots = [[p.cx + o, p.cy, 'start'], [p.cx - o, p.cy, 'end'], [p.cx, p.cy - o - 5, 'middle'], [p.cx, p.cy + o + 7, 'middle']];
      const box = ([lx, ly, a]) => ({ x0: a === 'start' ? lx : a === 'end' ? lx - tw : lx - tw / 2, x1: a === 'start' ? lx + tw : a === 'end' ? lx : lx + tw / 2, y0: ly - 7, y1: ly + 7 });
      const spot = spots.find((sp) => !hits(box(sp)) && box(sp).x0 >= 0 && box(sp).x1 <= W) || spots[0];
      boxes.push(box(spot));
      lab.append('text').attr('x', spot[0]).attr('y', spot[1]).attr('dy', '0.32em').attr('text-anchor', spot[2])
        .attr('data-id', p.r.id).text(name);
    });
    const ring = svg.append('circle').attr('class', 'focus-ring').attr('r', 8).attr('visibility', 'hidden');
    const hlDot = svg.append('circle').attr('class', 'cm-hl-dot').attr('r', 4.5).attr('visibility', 'hidden');
    const hlLab = svg.append('text').attr('class', 'cm-hl-label').attr('dy', '0.32em').attr('visibility', 'hidden');
    const delaunay = d3.Delaunay.from(rows, (r) => x(xv(r)), (r) => y(cmShare(r)));
    CM.inc = {
      mark(id, show) {
        const r = id != null ? CM.byId.get(id) : null;
        lab.selectAll('text').attr('visibility', function () { return r && +this.getAttribute('data-id') === r.id ? 'hidden' : null; });
        if (!r || !(xv(r) > 0) || cmShare(r) == null) {
          [ring, hlDot, hlLab].forEach((e) => e.attr('visibility', 'hidden'));
          tip.hide();
          return;
        }
        const cx = x(xv(r)), cy = y(cmShare(r)), right = cx < W * 0.66, rr = Math.max(4.5, rad(r));
        ring.attr('cx', cx).attr('cy', cy).attr('r', rr + 3.5).attr('visibility', 'visible');
        hlDot.attr('cx', cx).attr('cy', cy).attr('r', rr).attr('visibility', 'visible');
        hlLab.attr('x', cx + (right ? rr + 8 : -rr - 8)).attr('y', cy).attr('text-anchor', right ? 'start' : 'end')
          .text(plainName(r.name)).attr('visibility', show ? 'hidden' : 'visible');
        if (show) lab.selectAll('text').attr('visibility', null);
        if (show) tip.show(cmTip(r), cx, cy); else tip.hide();
      },
    };
    svg.append('rect').attr('class', 'overlay').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b)
      .attr('aria-hidden', 'true')
      .on('pointermove pointerdown', (ev) => {
        const [px, py] = d3.pointer(ev);
        let r = null;
        rows.forEach((c) => {   // the smallest bubble under the pointer is the one drawn on top
          if (Math.hypot(x(xv(c)) - px, y(cmShare(c)) - py) <= rad(c) + 1.5 && (!r || rad(c) < rad(r))) r = c;
        });
        if (!r) {
          const c = rows[delaunay.find(px, py)];
          if (c && Math.hypot(x(xv(c)) - px, y(cmShare(c)) - py) <= 14) r = c;
        }
        cmFocus(r ? r.id : CM.pinned, r ? 'income' : 'pinned');
      })
      .on('pointerleave', () => cmFocus(CM.pinned, 'income'));
    if (CM.focus != null) CM.inc.mark(CM.focus, false);
    cmApplyBand();
  }

  function cmIncomeText() {
    const sum = CM.sum;
    if (!sum) return;
    const rc = sum[MEASURES[cmMeasure].corr];
    const what = cmMeasure === 'tax' ? 'federal tax per resident is higher' : 'incomes are higher';
    $('#cm-income-lede').textContent = 'Each bubble is a commune, sized by its residents. ' + (rc == null ? ''
      : rc >= 0.3 ? 'Where ' + what + ', the majority went against the National Council less often.'
      : rc <= -0.3 ? 'Where ' + what + ', the majority went against the National Council more often.'
      : 'This and voting against parliament are only loosely related.');
    const source = cmMeasure === 'tax'
      ? 'Federal tax per resident: direct federal tax paid by residents taxed all year (individuals only, no company tax) in ' + sum.income_tax_year +
        ', divided by permanent residents at the end of ' + sum.income_tax_year +
        (sum.national_federal_tax_per_resident_chf ? '; Switzerland: CHF ' + d3.format(',')(sum.national_federal_tax_per_resident_chf) : '') +
        '. Like the “Kopfquote” in the press, but without company tax. The tax is steeply progressive, so a few very high incomes weigh heavily: this shows where top earners live rather than the typical household. Residents taxed at source and international civil servants count as residents, but their tax is not included, which lowers Geneva.'
      : 'Income: median taxable income per tax return in ' + sum.income_tax_year +
        ', estimated from the Federal Tax Administration’s income classes (communes with very few returns left out). Tax statistics leave out international civil servants and most foreign residents taxed at source, which matters most in Geneva.';
    $('#cm-income-note').textContent = source +
      (sum.population_year ? ' Bubbles: permanent residents at the end of ' + sum.population_year + '; size is compressed (area grows with the square root of residents) so small communes stay visible.' : '') +
      ' Line: communes cut into ten equal groups along the horizontal axis; each point is a group’s average share of votes against, at its median ' +
      (cmMeasure === 'tax' ? 'tax per resident.' : 'income.') +
      (rc == null ? '' : ' Rank correlation ' + d3.format('+.2f')(-rc) + '. A correlation, not a cause: richer communes differ in many other ways too.');
  }

  function renderCommunes(rows, sum, topo) {
    CM.rows = rows;
    CM.votersTotal = d3.sum(rows, (r) => r.voters || 0);
    CM.byId = new Map(rows.map((r) => [r.id, r]));
    CM.sum = sum;
    CM.nat = sum ? 100 - sum.national_pct_with_nr_majority : null;
    CM.since = sum ? fmtMonth(parseDate(sum.window_start)) : '2016';
    const layer = topoDecode(topo);
    CM.feats = layer('communes');
    CM.featById = new Map(CM.feats.map((f) => [f.id, f]));
    CM.cantons = fc(layer('cantons'));
    CM.lakes = fc(layer('lakes'));
    CM.country = fc(layer('country').length ? layer('country') : CM.feats);
    CM.sorted = rows.map(cmShare).filter((v) => v != null).sort(d3.ascending);

    const withShare = CM.sorted.length;
    if (sum) {
      $('#cm-intro').textContent = 'How often each commune’s majority went against the National Council’s majority in the ' +
        sum.proposals + ' federal votes since ' + CM.since + '.';
      const above = CM.sorted.filter((v) => v > CM.nat).length;
      const why = $('#cm-why');
      why.textContent = 'Switzerland as a whole went against it in ' + f1(CM.nat) + '% of these votes, yet ' +
        d3.format(',')(above) + ' of ' + d3.format(',')(withShare) + ' communes did so more often. Local majorities lean further one way than the national total, and different communes lean different ways.';
      why.hidden = false;
      cmIncomeText();
    }

    const seg = $('#cm-measure');
    if (rows.some((r) => r.tax_pc != null)) {
      Object.entries(MEASURES).forEach(([k, M]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.id = 'pvp-cm-measure-' + k;
        b.textContent = M.button;
        b.setAttribute('aria-pressed', String(cmMeasure === k));
        b.addEventListener('click', () => {
          cmMeasure = k;
          seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          try { localStorage.setItem('pvp-cm-measure', k); } catch (e) { /* storage unavailable */ }
          cmIncomeText();
          if (CM.redrawIncome) CM.redrawIncome();
        });
        seg.appendChild(b);
      });
      seg.hidden = false;
    } else cmMeasure = 'median';

    // Search: ignores accents, case and punctuation; knows English and German/French names of the
    // cities; lists the options when a name is ambiguous (e.g. Kilchberg ZH and BL).
    const fold = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[.'’()/,-]/g, ' ').replace(/\s+/g, ' ').trim();
    const ALIAS = { geneva: 'geneve', genf: 'geneve', lucerne: 'luzern', berne: 'bern', basle: 'basel', bale: 'basel',
      'st gall': 'st gallen', 'saint gall': 'st gallen', sitten: 'sion', neuenburg: 'neuchatel', freiburg: 'fribourg',
      biel: 'biel bienne', bienne: 'biel bienne', zurigo: 'zurich', ginevra: 'geneve' };
    const list = $('#cm-list');
    const folded = rows.map((r) => ({ r, f: fold(r.name) }));
    rows.slice().sort((a, b) => a.name.localeCompare(b.name, 'de')).forEach((r) => {
      list.appendChild(new Option(r.name + (r.name.includes('(') ? '' : ' (' + r.canton + ')'), r.name));
    });
    const find = $('#cm-find');
    const lookup = (v, exactOnly) => {
      let qv = fold(v);
      if (!qv) return { ids: [] };
      qv = ALIAS[qv] || qv;
      let hits = folded.filter((o) => o.f === qv);
      if (!hits.length) hits = folded.filter((o) => o.f.startsWith(qv + ' '));     // "kilchberg" -> Kilchberg (ZH), (BL)
      if (!hits.length && !exactOnly) hits = folded.filter((o) => o.f.startsWith(qv));
      if (exactOnly && hits.length !== 1) return { ids: [] };
      return { ids: hits.map((o) => o.r.id) };
    };
    const pick = (v, exactOnly) => {
      const { ids } = lookup(v, exactOnly);
      if (ids.length === 1) { CM.pinned = ids[0]; cmFocus(ids[0], 'find'); return; }
      if (exactOnly) return;
      CM.pinned = null;
      cmFocus(null, 'find');
      const names = ids.slice(0, 6).map((id) => CM.byId.get(id).name);
      $('#cm-status').textContent = !ids.length ? 'No commune of that name.'
        : ids.length + ' communes match: ' + names.join(', ') + (ids.length > 6 ? ', …' : '') + '. Type more of the name or pick one from the list.';
    };
    find.addEventListener('change', () => pick(find.value, false));
    find.addEventListener('input', () => pick(find.value, true));
    find.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') pick(find.value, false);
      if (ev.key === 'Escape') { find.value = ''; CM.pinned = null; cmFocus(null, 'find'); $('#cm-status').textContent = 'Hover or tap a commune for details.'; }
    });

    $('#communes').addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && CM.band != null) cmSetBand(null); });
    onWidth($('#cm-legend'), () => drawRaincloud($('#cm-legend')));
    CM.redrawMap = onWidth($('#chart-communes'), () => drawCommuneMap($('#chart-communes')));
    CM.redrawIncome = onWidth($('#chart-income'), () => drawIncome($('#chart-income')));
  }

  function loadCommunes() {
    const sec = $('#communes');
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      Promise.all([getJSON('data/communes.json', true), getJSON('data/commune_summary.json', true), getJSON('data/communes.topo.json', true)])
        .then(([rows, sum, topo]) => {
          if (!rows || !rows.length || !topo) { sec.hidden = true; return; }
          renderCommunes(rows, Array.isArray(sum) ? sum[0] : sum, topo);
        })
        .catch((e) => { console.error(e); sec.hidden = true; });
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
      }, { rootMargin: '900px 0px' });
      io.observe(sec);
    } else start();
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
      loadCommunes();

      const latest = d3.max(finals, (v) => v.d);
      $('#freshness').textContent = 'Official results up to ' + fmtDate(latest) +
        (meta && meta.generated_at ? '; data exported ' + fmtDate(new Date(meta.generated_at)) + '.' : '.');
    })
    .catch(showError);
})();
