/**
 * pagination-handler.js — Client-Side Product Pagination Handler
 * Watches of Switzerland Static Site
 *
 * 20 products per page (matching watchswiss.com)
 * Instant client-side page switching with CSS !important
 * URL sync (?page=N)
 * Fully compliant pagination UI (1 2 3 4 5 6 ...)
 */
(function () {
    var PRODUCTS_PER_PAGE = 20;
    var productCols = [];
    var totalPages = 1;
    var currentPage = 1;

    function getPageFromUrl() {
        var p = parseInt(new URLSearchParams(window.location.search).get('page'), 10);
        return (!isNaN(p) && p >= 1) ? p : 1;
    }

    function setPageInUrl(page) {
        var url = new URL(window.location.href);
        if (page <= 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page);
        }
        history.pushState({ page: page }, '', url.toString());
    }

    var styleEl;
    function applyPageCSS(page) {
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = '_pg_style';
            document.head.appendChild(styleEl);
        }
        var start = (page - 1) * PRODUCTS_PER_PAGE;
        var end   = start + PRODUCTS_PER_PAGE;
        var rules = '';
        productCols.forEach(function (col, idx) {
            if (idx >= start && idx < end) {
                rules += '[data-pgidx="' + idx + '"]{display:block!important}\n';
            } else {
                rules += '[data-pgidx="' + idx + '"]{display:none!important}\n';
            }
        });
        styleEl.textContent = rules;
    }

    function arrowL() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path d="M11.722.717l-10.286 10 10.286 10"/><path d="M1.435 10.717h28"/></g></svg>';
    }
    function arrowR() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path d="M17.714.717l10.286 10-10.286 10"/><path d="M28 10.717H0"/></g></svg>';
    }

    function buildPaginationHTML(page) {
        var base = window.location.pathname;
        function href(p) { return p === 1 ? base : base + '?page=' + p; }

        var html = '<ul>';

        // Prev Arrow
        if (page === 1) {
            html += '<li class="prev_page_link disabled"><a class="page-link" href="#"><i class="ico-arrow-left">' + arrowL() + '</i></a></li>';
        } else {
            html += '<li class="prev_page_link"><a class="page-link" href="' + href(page - 1) + '" data-page="' + (page - 1) + '"><i class="ico-arrow-left">' + arrowL() + '</i></a></li>';
        }

        // Page Numbers: if <= 7 pages, show all (1 2 3 4 5 6 7)
        var pages = [];
        if (totalPages <= 7) {
            for (var i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 4) {
                for (var i = 1; i <= 5; i++) pages.push(i);
                pages.push('…');
                pages.push(totalPages);
            } else if (page >= totalPages - 3) {
                pages.push(1);
                pages.push('…');
                for (var i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('…');
                pages.push(page - 1);
                pages.push(page);
                pages.push(page + 1);
                pages.push('…');
                pages.push(totalPages);
            }
        }

        pages.forEach(function (p) {
            if (p === '…') {
                html += '<li><span style="padding:0 8px;line-height:1;font-size:16px;color:#272727;">…</span></li>';
            } else {
                var cls = (p === page) ? ' class="current"' : '';
                html += '<li' + cls + '><a class="page-link" href="' + href(p) + '" data-page="' + p + '">' + p + '</a></li>';
            }
        });

        // Next Arrow
        if (page === totalPages) {
            html += '<li class="next_page_link disabled"><a class="page-link" href="#"><i class="ico-arrow-right">' + arrowR() + '</i></a></li>';
        } else {
            html += '<li class="next_page_link"><a class="page-link" href="' + href(page + 1) + '" data-page="' + (page + 1) + '"><i class="ico-arrow-right">' + arrowR() + '</i></a></li>';
        }

        html += '</ul>';
        return html;
    }

    function renderPagination(page) {
        var shell = document.getElementById('product-grid-pagination-shell');
        if (shell) {
            if (totalPages <= 1) {
                shell.style.display = 'none';
            } else {
                shell.style.display = 'block';
                shell.innerHTML = buildPaginationHTML(page);
            }
        }
        var tpl = document.getElementById('product-grid-pagination');
        if (tpl) tpl.innerHTML = '';
    }

    window._pgShowPage = function (page) {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        setPageInUrl(page);
        applyPageCSS(page);
        renderPagination(page);

        var sec = document.querySelector('.section-items, #product-grid');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    function init() {
        var allCols = document.querySelectorAll(
            '#product-grid .grid > .grid__col, ' +
            '.section-items .grid > .grid__col'
        );

        productCols = [];
        allCols.forEach(function (col) {
            if (col.getAttribute('data-type') === 'news' || col.querySelector('.tile')) {
                col.style.display = 'none';
                return;
            }
            if (col.getAttribute('data-columnize') === 'no' && col.querySelector('.product')) {
                col.setAttribute('data-pgidx', productCols.length);
                productCols.push(col);
            }
        });

        if (productCols.length === 0) return;

        totalPages = Math.ceil(productCols.length / PRODUCTS_PER_PAGE) || 1;

        var countEl = document.getElementById('product-count');
        if (countEl) countEl.textContent = productCols.length + ' products';

        var details = document.getElementById('product-grid-details');
        if (details) {
            details.setAttribute('data-product-count', productCols.length);
            details.setAttribute('data-page-count', totalPages);
        }

        currentPage = getPageFromUrl();
        if (currentPage > totalPages) currentPage = 1;

        applyPageCSS(currentPage);
        renderPagination(currentPage);
    }

    window.addEventListener('popstate', function (e) {
        var page = (e.state && e.state.page) ? e.state.page : getPageFromUrl();
        currentPage = Math.min(Math.max(1, page), totalPages);
        applyPageCSS(currentPage);
        renderPagination(currentPage);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('load', function () {
        if (productCols.length > 0) {
            applyPageCSS(currentPage);
            renderPagination(currentPage);
        }
    });
})();
