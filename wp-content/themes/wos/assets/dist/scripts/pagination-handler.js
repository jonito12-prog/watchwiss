/**
 * pagination-handler.js — Client-Side Product Pagination Handler
 * Watches of Switzerland Design System Compliant
 *
 * 20 products per page
 * Exact WOS ellipsis rules (.show-ellipsis-before, .show-ellipsis-after, .show-desktop)
 * Native black underline on .current
 * Disabled light-grey arrows on boundaries
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
        return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g data-name="Group 5242" fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path data-name="Path 5371" d="M11.722.717l-10.286 10 10.286 10"></path><path data-name="Line 726" d="M1.435 10.717h28"></path></g></svg>';
    }
    function arrowR() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g data-name="Group 5242" fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path data-name="Path 5371" d="M17.714.717l10.286 10-10.286 10"></path><path data-name="Line 726" d="M28 10.717H0"></path></g></svg>';
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

        // All page list items
        for (var p = 1; p <= totalPages; p++) {
            var cls = (p === page) ? ' class="current"' : '';
            html += '<li' + cls + '><a class="page-link" href="' + href(p) + '" data-page="' + p + '">' + p + '</a></li>';
        }

        // Next Arrow
        if (page === totalPages) {
            html += '<li class="next_page_link disabled"><a class="page-link" href="#"><i class="ico-arrow-right">' + arrowR() + '</i></a></li>';
        } else {
            html += '<li class="next_page_link"><a class="page-link" href="' + href(page + 1) + '" data-page="' + (page + 1) + '"><i class="ico-arrow-right">' + arrowR() + '</i></a></li>';
        }

        html += '</ul>';
        return html;
    }

    function applyWosEllipsisRules(shell) {
        if (!shell) return;
        var items = shell.querySelectorAll('li:not(.prev_page_link):not(.next_page_link)');
        if (items.length === 0) return;

        var isMobile = (window.innerWidth < 768);

        if (isMobile) {
            if (items.length === 1) {
                items[0].classList.add('show-mobile');
            } else {
                var cur = shell.querySelector('li.current');
                var last = items[items.length - 1];
                if (cur) cur.classList.add('show-mobile');
                if (last) {
                    last.classList.add('show-mobile', 'show-mobile-of');
                    if (last.classList.contains('current') && window.innerWidth < 767) {
                        last.classList.remove('show-mobile-of');
                        var a = last.querySelector('a');
                        if (a) a.innerHTML = items.length + ' &nbsp; of &nbsp; ' + items.length;
                    }
                }
            }
        } else if (items.length <= 4) {
            items.forEach(function (li) { li.classList.add('show-desktop'); });
        } else {
            // Find current item
            var cur = shell.querySelector('li.current');
            if (cur) {
                cur.classList.add('show-desktop');
                var prev = cur.previousElementSibling;
                var next = cur.nextElementSibling;

                if (prev && !prev.classList.contains('prev_page_link')) {
                    var prevPrev = prev.previousElementSibling;
                    if (prevPrev && prevPrev.classList.contains('prev_page_link')) {
                        prev.classList.add('show-desktop');
                    } else {
                        prev.classList.add('show-ellipsis-before');
                    }
                }

                if (next && !next.classList.contains('next_page_link')) {
                    var nextNext = next.nextElementSibling;
                    if (nextNext && nextNext.classList.contains('next_page_link')) {
                        next.classList.add('show-desktop');
                    } else {
                        next.classList.add('show-ellipsis-after');
                    }
                }

                var curPage = parseInt(cur.querySelector('a.page-link').getAttribute('data-page'), 10);
                if (curPage === 1) {
                    items[items.length - 1].classList.add('show-desktop');
                }
            }
        }
    }

    function renderPagination(page) {
        var shell = document.getElementById('product-grid-pagination-shell');
        if (shell) {
            if (totalPages <= 1) {
                shell.style.display = 'none';
            } else {
                shell.style.display = 'block';
                shell.innerHTML = buildPaginationHTML(page);
                applyWosEllipsisRules(shell);
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

    window.addEventListener('resize', function () {
        var shell = document.getElementById('product-grid-pagination-shell');
        if (shell && totalPages > 1) {
            renderPagination(currentPage);
        }
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
