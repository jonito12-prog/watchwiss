/**
 * Client-Side Product Pagination Handler for Watches of Switzerland
 * Reads ?page=N from URL, shows correct products, updates URL on navigation
 */
(function() {
    function getPageFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const p = parseInt(params.get('page'), 10);
        return (!isNaN(p) && p >= 1) ? p : 1;
    }

    function setPageInUrl(page) {
        const url = new URL(window.location.href);
        if (page === 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page);
        }
        history.pushState({ page: page }, '', url.toString());
    }

    function initProductPagination() {
        // Find only pure product columns (NOT news/article tiles)
        const allCols = document.querySelectorAll('.section-items .grid > .grid__col, .section-products .grid > .grid__col');
        if (allCols.length === 0) return;

        const productCols = [];
        allCols.forEach(function(col) {
            if (col.getAttribute('data-type') === 'news' || col.querySelector('.tile')) {
                col.style.display = 'none'; // hide editorial blocks
            } else if (col.querySelector('.product') && col.getAttribute('data-columnize') === 'no') {
                productCols.push(col);
            }
        });

        if (productCols.length === 0) return;

        const PRODUCTS_PER_PAGE = 18;
        const totalProducts = productCols.length;
        const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

        const paginationShell = document.getElementById('product-grid-pagination-shell');
        const paginationDetails = document.getElementById('product-grid-details');

        if (paginationDetails) {
            paginationDetails.setAttribute('data-product-count', totalProducts);
            paginationDetails.setAttribute('data-page-count', totalPages);
        }

        if (totalPages <= 1) {
            productCols.forEach(function(col) { col.style.display = ''; });
            if (paginationShell) paginationShell.style.display = 'none';
            return;
        }

        // Read page from URL
        let currentPage = getPageFromUrl();
        if (currentPage > totalPages) currentPage = 1;

        function showPage(page) {
            currentPage = page;
            const start = (page - 1) * PRODUCTS_PER_PAGE;
            const end = start + PRODUCTS_PER_PAGE;

            productCols.forEach(function(col, idx) {
                col.style.display = (idx >= start && idx < end) ? '' : 'none';
            });

            renderPagination();
        }

        function buildPageNumbers() {
            const pages = [];
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                if (currentPage > 3) pages.push('...');
                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    pages.push(i);
                }
                if (currentPage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
            }
            return pages;
        }

        function arrowLeft() {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path d="M11.722.717l-10.286 10 10.286 10"/><path d="M1.435 10.717h28"/></g></svg>';
        }
        function arrowRight() {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path d="M17.714.717l10.286 10-10.286 10"/><path d="M28 10.717H0"/></g></svg>';
        }

        function renderPagination() {
            if (!paginationShell) return;
            paginationShell.style.display = 'block';

            let html = '<ul>';

            // Prev
            if (currentPage === 1) {
                html += `<li class="prev_page_link disabled"><a class="page-link" href="#"><i class="ico-arrow-left">${arrowLeft()}</i></a></li>`;
            } else {
                html += `<li class="prev_page_link"><a class="page-link" href="#" data-page="${currentPage - 1}"><i class="ico-arrow-left">${arrowLeft()}</i></a></li>`;
            }

            // Page numbers
            buildPageNumbers().forEach(function(p) {
                if (p === '...') {
                    html += '<li><span style="padding:0 6px">…</span></li>';
                } else {
                    const isCurrent = p === currentPage;
                    html += `<li class="${isCurrent ? 'current' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
                }
            });

            // Next
            if (currentPage === totalPages) {
                html += `<li class="next_page_link disabled"><a class="page-link" href="#"><i class="ico-arrow-right">${arrowRight()}</i></a></li>`;
            } else {
                html += `<li class="next_page_link"><a class="page-link" href="#" data-page="${currentPage + 1}"><i class="ico-arrow-right">${arrowRight()}</i></a></li>`;
            }

            html += '</ul>';
            paginationShell.innerHTML = html;

            // Attach click events
            paginationShell.querySelectorAll('a.page-link[data-page]').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetPage = parseInt(this.getAttribute('data-page'), 10);
                    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
                        setPageInUrl(targetPage);
                        showPage(targetPage);
                        // Scroll to top of product grid
                        const section = document.querySelector('.section-items, .section-products');
                        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }

        // Handle browser back/forward buttons
        window.addEventListener('popstate', function(e) {
            const page = (e.state && e.state.page) ? e.state.page : getPageFromUrl();
            showPage(Math.min(Math.max(1, page), totalPages));
        });

        // Show the page from URL on load
        showPage(currentPage);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductPagination);
    } else {
        initProductPagination();
    }
})();
