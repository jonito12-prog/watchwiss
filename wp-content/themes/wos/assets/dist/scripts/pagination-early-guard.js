/**
 * pagination-early-guard.js
 * Must load in <head> BEFORE theme.min.js
 * 1. Blocks admin-ajax.php XHR/fetch calls and intercepts page-link clicks
 * 2. Automatic fallback for any broken image to live watchswiss.com CDN
 * 3. Universal PURCHASE & CHECKOUT interceptor: redirects 100% of purchase/cart/buy buttons to /payment.html
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

    /* ── Capture-phase click interceptor for Pagination and Purchase Buttons ── */
    document.addEventListener('click', function (e) {
        var target = e.target;

        // 1. Pagination clicks
        var link = target.closest ? target.closest('a.page-link[data-page]') : null;
        if (link) {
            var inPagination = link.closest(
                '#product-grid-pagination, #product-grid-pagination-shell, .pagination'
            );
            if (inPagination) {
                e.preventDefault();
                e.stopImmediatePropagation();
                var page = parseInt(link.getAttribute('data-page'), 10);
                if (!isNaN(page) && typeof window._pgShowPage === 'function') {
                    window._pgShowPage(page);
                }
                return;
            }
        }

        // 2. Purchase / Checkout / Add-to-cart clicks
        var btn = target.closest ? target.closest('a, button, input[type="submit"], input[type="button"]') : null;
        if (btn) {
            var text = (btn.textContent || btn.value || '').trim().toUpperCase();
            var href = btn.getAttribute('href') || '';
            var isPurchaseAction = (
                text === 'PURCHASE' ||
                text === 'PURCHASE NOW' ||
                text === 'BUY' ||
                text === 'BUY NOW' ||
                text === 'CHECKOUT' ||
                text === 'PROCEED TO CHECKOUT' ||
                text === 'ADD TO CART' ||
                href.indexOf('/checkout') !== -1 ||
                href.indexOf('/cart') !== -1 ||
                btn.classList.contains('add_to_cart_button') ||
                btn.classList.contains('btn--cover') ||
                btn.classList.contains('btn--header') ||
                btn.classList.contains('single_add_to_cart_button')
            );

            if (isPurchaseAction) {
                if (href !== '/payment.html' && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.location.href = '/payment.html';
                }
            }
        }
    }, true /* capture phase */);

    /* ── Automatic Image Fallback: if any image 404s, load from live CDN ── */
    document.addEventListener('error', function (e) {
        var target = e.target;
        if (target && target.tagName === 'IMG') {
            var src = target.getAttribute('src');
            if (src && src.startsWith('/') && !target._triedWosFallback) {
                target._triedWosFallback = true;
                target.removeAttribute('srcset');
                target.src = 'https://www.watchswiss.com' + src;
            }
        }
    }, true /* capture phase */);

})();
