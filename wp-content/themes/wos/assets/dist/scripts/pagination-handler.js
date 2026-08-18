/**
 * Product Pagination Handler — Watches of Switzerland Static Site
 *
 * Strategy:
 * 1. Intercept ALL .page-link clicks in capture phase (before theme.min.js handlers)
 * 2. Stub out the theme's AJAX product-loading so it can't clear the grid
 * 3. Fix pagination link hrefs to point to current domain
 * 4. Read ?page=N from URL → show the correct slice of products
 */
(function () {
    /* ─── 1. Stub theme AJAX so it never clears the product grid ─── */
    function stubThemeAjax() {
        // Stub jQuery ajax to block product-grid requests
        if (window.jQuery) {
            var origAjax = jQuery.ajax.bind(jQuery);
            jQuery.ajax = function (url, settings) {
                var opts = (typeof url === 'object') ? url : (settings || {});
                var reqUrl = opts.url || (typeof url === 'string' ? url : '');
                if (reqUrl && (reqUrl.indexOf('admin-ajax') !== -1 || reqUrl.indexOf('filter_products') !== -1)) {
                    // Return a fake deferred that does nothing
                    var fakeDeferred = {
                        done: function () { return fakeDeferred; },
                        fail: function () { return fakeDeferred; },
                        always: function () { return fakeDeferred; },
                        then: function () { return fakeDeferred; }
                    };
                    return fakeDeferred;
                }
                return origAjax(url, settings);
            };
        }

        // Also stub global ajaxurl fetching for product grids
        window._productGridAjaxBlocked = true;
    }

    /* ─── 2. Core pagination logic ─── */
    var PRODUCTS_PER_PAGE = 18;
    var productCols = [];
    var totalProducts = 0;
    var totalPages = 1;
    var currentPage = 1;

    function getPageFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var p = parseInt(params.get('page'), 10);
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

    function showPage(page) {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;

        var start = (page - 1) * PRODUCTS_PER_PAGE;
        var end = start + PRODUCTS_PER_PAGE;

        productCols.forEach(function (col, idx) {
            col.style.display = (idx >= start && idx < end) ? '' : 'none';
        });

        updatePaginationUI();
    }

    function updatePaginationUI() {
        // Update both pagination containers (hidden template + visible shell)
        ['product-grid-pagination', 'product-grid-pagination-shell'].forEach(function (id) {
            var shell = document.getElementById(id);
            if (!shell) return;

            var links = shell.querySelectorAll('a.page-link[data-page]');
            links.forEach(function (link) {
                var p = parseInt(link.getAttribute('data-page'), 10);
                var li = link.parentElement;
                if (!li) return;

                // Remove current class
                li.classList.remove('current');

                // Add current class to active page
                if (p === currentPage) {
                    li.classList.add('current');
                }

                // Fix prev/next disabled states
                if (li.classList.contains('prev_page_link') || li.classList.contains('next_page_link')) {
                    if (p < 1 || p > totalPages) {
                        li.classList.add('disabled');
                    } else {
                        li.classList.remove('disabled');
                    }
                }
            });
        });
    }

    function fixPaginationHrefs() {
        // Fix all page-link hrefs to point to current site (not original watchswiss.com)
        var baseUrl = window.location.pathname; // e.g. /brands/hublot/
        document.querySelectorAll('a.page-link[data-page]').forEach(function (link) {
            var p = parseInt(link.getAttribute('data-page'), 10);
            if (!isNaN(p) && p >= 1) {
                link.href = (p === 1) ? baseUrl : (baseUrl + '?page=' + p);
            }
        });
    }

    function collectProducts() {
        // Collect only real product columns, hide news/article tiles
        var allCols = document.querySelectorAll(
            '.section-items .grid > .grid__col, ' +
            '.section-products .grid > .grid__col, ' +
            '#product-grid .grid > .grid__col'
        );

        productCols = [];
        allCols.forEach(function (col) {
            if (col.getAttribute('data-type') === 'news' || col.querySelector('.tile')) {
                col.style.display = 'none';
            } else if (col.getAttribute('data-columnize') === 'no' && col.querySelector('.product')) {
                productCols.push(col);
            }
        });

        totalProducts = productCols.length;
        totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE) || 1;

        // Update product-grid-details so theme reads correct values
        var details = document.getElementById('product-grid-details');
        if (details) {
            details.setAttribute('data-product-count', totalProducts);
            details.setAttribute('data-page-count', totalPages);
        }

        // Update visible product count text
        var countEl = document.getElementById('product-count');
        if (countEl && totalProducts > 0) {
            countEl.textContent = totalProducts + ' products';
        }
    }

    /* ─── 3. Global click interceptor (capture phase = fires before theme handlers) ─── */
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a.page-link[data-page]');
        if (!link) return;

        // Only intercept pagination links (not product card links)
        var container = link.closest('#product-grid-pagination, #product-grid-pagination-shell, .pagination');
        if (!container) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        var targetPage = parseInt(link.getAttribute('data-page'), 10);
        if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) return;
        if (targetPage === currentPage) return;

        setPageInUrl(targetPage);
        showPage(targetPage);

        // Scroll to top of section
        var section = document.querySelector('.section-items, .section-products, #product-grid');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, true); // ← capture phase

    /* ─── 4. Browser back/forward ─── */
    window.addEventListener('popstate', function (e) {
        var page = (e.state && e.state.page) ? e.state.page : getPageFromUrl();
        showPage(Math.min(Math.max(1, page), totalPages));
    });

    /* ─── 5. Init ─── */
    function init() {
        stubThemeAjax();
        collectProducts();

        if (totalProducts === 0) return; // not a brand/product listing page

        fixPaginationHrefs();

        currentPage = getPageFromUrl();
        if (currentPage > totalPages) currentPage = 1;

        showPage(currentPage);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also run after jQuery/theme finishes loading (they may overwrite things)
    window.addEventListener('load', function () {
        stubThemeAjax();
        fixPaginationHrefs();
        showPage(currentPage);
    });

})();
