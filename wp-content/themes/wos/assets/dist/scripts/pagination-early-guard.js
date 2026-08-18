/**
 * pagination-early-guard.js
 * Must load in <head> BEFORE theme.min.js
 * 1. Blocks admin-ajax.php XHR/fetch calls and intercepts page-link clicks
 * 2. Automatic fallback for any broken image to live watchswiss.com CDN
 */
(function () {
    /* ── Block XHR to admin-ajax.php (theme's product AJAX) ── */
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        if (typeof url === 'string' && url.indexOf('admin-ajax') !== -1) {
            this._pgBlocked = true;
            return; // don't call origOpen — XHR is dead
        }
        return origOpen.apply(this, arguments);
    };
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (data) {
        if (this._pgBlocked) return;
        return origSend.apply(this, arguments);
    };

    /* ── Block fetch to admin-ajax.php ── */
    if (window.fetch) {
        var origFetch = window.fetch;
        window.fetch = function (url, opts) {
            if (typeof url === 'string' && url.indexOf('admin-ajax') !== -1) {
                return Promise.resolve(new Response('{}', {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            return origFetch.apply(this, arguments);
        };
    }

    /* ── Capture-phase click interceptor ── */
    document.addEventListener('click', function (e) {
        var target = e.target;
        var link = target.closest ? target.closest('a.page-link[data-page]') : null;
        if (!link) return;

        var inPagination = link.closest(
            '#product-grid-pagination, #product-grid-pagination-shell, .pagination'
        );
        if (!inPagination) return;

        /* Stop the theme from ever seeing this click */
        e.preventDefault();
        e.stopImmediatePropagation();

        var page = parseInt(link.getAttribute('data-page'), 10);
        if (!isNaN(page) && typeof window._pgShowPage === 'function') {
            window._pgShowPage(page);
        }
    }, true /* capture */);

    /* ── Automatic Image Fallback: if any image 404s, load from live CDN ── */
    document.addEventListener('error', function (e) {
        var target = e.target;
        if (target && target.tagName === 'IMG') {
            var src = target.getAttribute('src');
            if (src && src.startsWith('/') && !target._triedWosFallback) {
                target._triedWosFallback = true;
                // Remove srcset so browser uses src fallback
                target.removeAttribute('srcset');
                target.src = 'https://www.watchswiss.com' + src;
            }
        }
    }, true /* capture phase */);

})();
